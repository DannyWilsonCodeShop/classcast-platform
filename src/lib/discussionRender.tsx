'use client';

import React from 'react';

export const BRAND_BLUE = '#0065a3';

// Matches http(s) URLs only (deliberately not bare domains / other schemes).
const URL_REGEX = /(https?:\/\/[^\s<>"')]+)/gi;

/**
 * Split plain text into an array of React nodes, turning http(s) URLs into
 * safe anchor elements. Never uses dangerouslySetInnerHTML, so user text is
 * rendered as text (React escapes it) and links are built as real elements.
 */
export function linkifyText(text: string): React.ReactNode[] {
  if (!text) return [];
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // Reset lastIndex since the regex is global and reused across calls.
  URL_REGEX.lastIndex = 0;
  let key = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    nodes.push(
      <a
        key={`lnk-${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-[#0065a3] underline break-all"
      >
        {url}
      </a>
    );
    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/** Extract http(s) URLs from a block of text (used to build link cards). */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  URL_REGEX.lastIndex = 0;
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = URL_REGEX.exec(text)) !== null) {
    out.push(match[0]);
  }
  return out;
}

/** Uppercased hostname for a link-card header, e.g. "KHANACADEMY.ORG". */
export function hostnameOf(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    return host.toUpperCase();
  } catch {
    return url.toUpperCase();
  }
}

export interface PersonColor {
  bar: string;       // left accent bar / strong color
  tint: string;      // light bubble/background tint
  avatarBg: string;  // avatar background
  text: string;      // readable text color on the tint
}

// A fixed, brand-friendly palette. Each student maps deterministically to one entry.
const PALETTE: PersonColor[] = [
  { bar: '#e4572e', tint: '#fdeeea', avatarBg: '#e4572e', text: '#a3341a' },
  { bar: '#17bebb', tint: '#e5f8f8', avatarBg: '#17bebb', text: '#0c7673' },
  { bar: '#7b61ff', tint: '#efecff', avatarBg: '#7b61ff', text: '#4a37b3' },
  { bar: '#38a169', tint: '#e8f6ee', avatarBg: '#38a169', text: '#236c45' },
  { bar: '#d7263d', tint: '#fdeaed', avatarBg: '#d7263d', text: '#981a2b' },
  { bar: '#f3a712', tint: '#fef4e0', avatarBg: '#f3a712', text: '#9c6a06' },
  { bar: '#2d9cdb', tint: '#e7f3fb', avatarBg: '#2d9cdb', text: '#1b6391' },
  { bar: '#c42d6c', tint: '#fbe8f0', avatarBg: '#c42d6c', text: '#8a1f4b' },
];

export const BRAND_PERSON_COLOR: PersonColor = {
  bar: BRAND_BLUE,
  tint: '#e6f1f8',
  avatarBg: BRAND_BLUE,
  text: '#004b78',
};

/** Deterministic hash of a seed (authorId or name) into the fixed palette. */
export function personColor(seed: string): PersonColor {
  const s = seed || 'anon';
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

// ---------------------------------------------------------------------------
// Rich link preview card
// ---------------------------------------------------------------------------

const FREDOKA_FONT = 'var(--font-fredoka), Fredoka, sans-serif';

export interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  siteName: string;
  image: string | null;
  favicon: string | null;
  failed?: boolean;
}

// Client-side preview cache keyed by URL, so re-renders / multiple posts linking
// the same URL don't refetch. Complements the server's in-memory TTL cache.
const previewCache = new Map<string, LinkPreviewData>();
const inflight = new Map<string, Promise<LinkPreviewData | null>>();

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

async function loadPreview(url: string): Promise<LinkPreviewData | null> {
  if (previewCache.has(url)) return previewCache.get(url)!;
  if (inflight.has(url)) return inflight.get(url)!;

  const p = (async () => {
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json?.success && json.data) {
        previewCache.set(url, json.data as LinkPreviewData);
        return json.data as LinkPreviewData;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, p);
  return p;
}

/**
 * Collect the link-card URLs for a post: explicit `links` plus any http(s) URL
 * found inline in the content, de-duped and capped so a link-heavy post stays
 * compact. Shared by both the student and instructor render paths.
 */
export function postCardUrls(links: string[] | undefined, content: string | undefined, cap = 2): string[] {
  const inline = extractUrls(content || '');
  return Array.from(new Set([...(links || []), ...inline])).slice(0, cap);
}

/**
 * Link card that lazily fetches rich preview metadata and renders a thumbnail +
 * title + description + favicon/site-name header. While loading (or on failure)
 * it degrades to the original domain-only header card, so a post never blanks or
 * jumps waiting on a preview. All preview strings are rendered as React text
 * children (never dangerouslySetInnerHTML); the image URL is validated to
 * http(s) before use.
 */
export function LinkCard({ url }: { url: string }): React.ReactElement {
  const [preview, setPreview] = React.useState<LinkPreviewData | null>(
    () => previewCache.get(url) || null
  );

  React.useEffect(() => {
    let active = true;
    // Already cached synchronously above; nothing to fetch.
    if (previewCache.has(url)) {
      setPreview(previewCache.get(url)!);
      return;
    }
    loadPreview(url).then((data) => {
      if (active && data) setPreview(data);
    });
    return () => {
      active = false;
    };
  }, [url]);

  const rich = preview && !preview.failed && (preview.title || preview.description || preview.image);
  const image = rich && isHttpUrl(preview!.image) ? preview!.image : null;
  const favicon = preview && isHttpUrl(preview.favicon) ? preview.favicon : null;
  const siteName = (preview?.siteName || hostnameOf(url)).toString();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="block rounded-xl overflow-hidden border border-gray-200 hover:border-[#0065a3] transition-colors"
    >
      {/* Header strip: favicon + site name (rich) or uppercased domain (fallback) */}
      <div
        className="bg-[#0065a3] text-white text-[10px] font-bold tracking-wide px-3 py-1 flex items-center gap-1.5"
        style={{ fontFamily: FREDOKA_FONT }}
      >
        {favicon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={favicon} alt="" width={14} height={14} loading="lazy" className="w-3.5 h-3.5 rounded-sm object-contain bg-white/20" />
        )}
        <span className="truncate">{rich ? siteName : hostnameOf(url)}</span>
      </div>

      {rich ? (
        <div className="bg-white">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              loading="lazy"
              className="w-full max-h-[160px] object-cover bg-gray-50"
            />
          )}
          <div className="px-3 py-2">
            {preview!.title && (
              <p className="text-sm font-bold text-gray-900 line-clamp-2" style={{ fontFamily: FREDOKA_FONT }}>
                {preview!.title}
              </p>
            )}
            {preview!.description && (
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{preview!.description}</p>
            )}
            <p className="text-[11px] text-[#0065a3] break-all mt-1">{url}</p>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 bg-white">
          <p className="text-xs text-[#0065a3] break-all">{url}</p>
        </div>
      )}
    </a>
  );
}
