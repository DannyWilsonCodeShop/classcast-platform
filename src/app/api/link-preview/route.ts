import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';

/**
 * Link preview endpoint: GET /api/link-preview?url=<encoded>
 *
 * Fetches a third-party page server-side and extracts OpenGraph / Twitter /
 * standard <meta> into a small JSON object the discussion link card renders.
 *
 * SSRF SAFETY: only http/https is allowed, the host is resolved and every
 * resolved address is checked against private / loopback / link-local ranges
 * (incl. the 169.254.169.254 cloud-metadata address) before we fetch. Redirects
 * are NOT followed (redirect: 'manual') so an allowed host can't bounce us to an
 * internal target. Non-standard ports are rejected. Response is capped to ~200KB
 * and only text/html is parsed, with a 5s timeout.
 *
 * All extracted strings are returned as PLAIN text (HTML entities decoded); the
 * client renders them as React text children, never as HTML.
 */

export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 200 * 1024; // ~200KB, enough for <head>
const USER_AGENT =
  'Mozilla/5.0 (compatible; ClassCastLinkPreview/1.0; +https://classcast.app)';

// Preview cache: in-memory Map with a 1h TTL, keyed by the normalized URL.
// Tradeoff: cache is per-serverless-instance and ephemeral — acceptable because
// previews are non-critical decoration, so we deliberately avoid a new DynamoDB
// table or external cache for this.
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
interface LinkPreview {
  url: string;
  title: string;
  description: string;
  siteName: string;
  image: string | null;
  favicon: string | null;
  failed?: boolean;
}
const cache = new Map<string, { value: LinkPreview; expires: number }>();

function getCached(key: string): LinkPreview | null {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (hit) cache.delete(key);
  return null;
}

function setCached(key: string, value: LinkPreview): void {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  // Light cap to avoid unbounded growth on a long-lived instance.
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

// --- SSRF host checks ---------------------------------------------------------

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed -> treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

function ipv6IsPrivate(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local

  // IPv4-mapped addresses. The WHATWG URL parser normalizes these to the
  // hex-compressed form, so new URL('http://[::ffff:127.0.0.1]/').hostname is
  // '::ffff:7f00:1' and '169.254.169.254' becomes '::ffff:a9fe:a9fe'. Detect
  // the ::ffff: prefix regardless of decimal-vs-hex spelling, reconstruct the
  // embedded IPv4, and run it through ipv4IsPrivate.

  // Decimal dotted-quad form (e.g. ::ffff:127.0.0.1) — may appear if unparsed.
  const decimal = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (decimal) return ipv4IsPrivate(decimal[1]);

  // Hex-compressed mapped form: ::ffff:<hextet>:<hextet> (e.g. ::ffff:7f00:1)
  // and the non-compressed ::ffff:0:<hextet>:<hextet> variants.
  const hexMapped = lower.match(/::ffff:(?:0:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
      const dotted = [
        (hi >> 8) & 0xff,
        hi & 0xff,
        (lo >> 8) & 0xff,
        lo & 0xff,
      ].join('.');
      return ipv4IsPrivate(dotted);
    }
  }

  return false;
}

function isPrivateAddress(ip: string): boolean {
  return ip.includes(':') ? ipv6IsPrivate(ip) : ipv4IsPrivate(ip);
}

const IPV4_LITERAL = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Validate scheme/port and ensure the host does not point at a private/internal
 * target. Resolves DNS and checks every returned address. Returns an error
 * string when unsafe, otherwise null.
 */
async function assertSafeTarget(parsed: URL): Promise<string | null> {
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http/https URLs are allowed';
  }
  // Reject non-standard ports (allow default 80/443 / unspecified only).
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return 'Non-standard ports are not allowed';
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost')) {
    return 'Blocked host';
  }

  // IP literals: check directly, no DNS.
  if (IPV4_LITERAL.test(host) || host.includes(':')) {
    if (isPrivateAddress(host)) return 'Blocked private/internal address';
    return null;
  }

  // Hostname: resolve and verify every address is public.
  try {
    const records = await lookup(host, { all: true });
    if (!records.length) return 'Host could not be resolved';
    for (const r of records) {
      if (isPrivateAddress(r.address)) return 'Host resolves to a private/internal address';
    }
  } catch {
    return 'Host could not be resolved';
  }
  return null;
}

// --- HTML meta parsing --------------------------------------------------------

function decodeEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .trim();
}

/** Find a <meta> content value by property/name (case-insensitive). */
function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // property/name before content
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${esc}["'][^>]*?\\scontent=["']([^"']*)["']`,
      'i'
    );
    // content before property/name
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${esc}["']`,
      'i'
    );
    const m = html.match(re1) || html.match(re2);
    if (m && m[1]) return decodeEntities(m[1]);
  }
  return null;
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1]) : null;
}

/** Resolve a possibly-relative URL against the page base; return http(s) only. */
function absoluteHttpUrl(value: string | null, base: string): string | null {
  if (!value) return null;
  try {
    const resolved = new URL(value, base);
    if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
      return resolved.toString();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function faviconFrom(html: string, base: string): string | null {
  // link[rel*=icon]
  const m = html.match(
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*?href=["']([^"']+)["']/i
  ) || html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]*?rel=["'][^"']*icon[^"']*["']/i
  );
  const fromTag = absoluteHttpUrl(m ? m[1] : null, base);
  if (fromTag) return fromTag;
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return null;
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

/** Read up to MAX_BYTES of the body, honoring the abort signal. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    out += decoder.decode(value, { stream: true });
    if (received >= MAX_BYTES) {
      await reader.cancel().catch(() => {});
      break;
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('url');

  if (!raw) {
    return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
  }

  const cacheKey = parsed.toString();
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const unsafe = await assertSafeTarget(parsed);
  if (unsafe) {
    return NextResponse.json({ success: false, error: unsafe }, { status: 400 });
  }

  // Minimal object used whenever the fetch/parse degrades.
  const fallback: LinkPreview = {
    url: cacheKey,
    title: hostname(cacheKey),
    description: '',
    siteName: hostname(cacheKey),
    image: null,
    favicon: faviconFrom('', cacheKey),
    failed: true,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(cacheKey, {
      method: 'GET',
      redirect: 'manual', // do not follow redirects (SSRF hardening)
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('text/html')) {
      setCached(cacheKey, fallback);
      return NextResponse.json({ success: true, data: fallback }, {
        headers: { 'Cache-Control': 'public, max-age=3600' },
      });
    }

    const html = await readCapped(res);

    const title =
      metaContent(html, ['og:title', 'twitter:title']) || titleTag(html) || hostname(cacheKey);
    const description =
      metaContent(html, ['og:description', 'twitter:description', 'description']) || '';
    const siteName = metaContent(html, ['og:site_name']) || hostname(cacheKey);
    const image = absoluteHttpUrl(
      metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']),
      cacheKey
    );
    const favicon = faviconFrom(html, cacheKey);

    const preview: LinkPreview = {
      url: cacheKey,
      title,
      description,
      siteName,
      image,
      favicon,
    };

    setCached(cacheKey, preview);
    return NextResponse.json({ success: true, data: preview }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    // Timeout / network error / aborted body: degrade to hostname-only.
    setCached(cacheKey, fallback);
    return NextResponse.json({ success: true, data: fallback }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } finally {
    clearTimeout(timer);
  }
}
