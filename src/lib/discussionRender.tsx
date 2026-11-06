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
