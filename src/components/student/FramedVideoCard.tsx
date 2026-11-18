'use client';

import React, { useState } from 'react';
import { cardGradient, getCardColor } from '@/lib/cardColors';
import type { FeedItem } from '@/hooks/useStudentData';

/** Grey silhouette avatar with the yellow ring (brand). */
export function SilhouetteAvatar({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-14 -14 28 28" className="shrink-0" aria-hidden="true">
      <circle r="12.5" fill="#d5dbe1" stroke="#FFC72C" strokeWidth="2.5" />
      <circle cy="-3.5" r="4.5" fill="#9aa6b2" />
      <path d="M-8 8 a8 6 0 0 1 16 0 z" fill="#9aa6b2" />
    </svg>
  );
}

export function relativeTime(ts?: string, now: number = Date.now()): string {
  if (!ts) return '';
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (d < 60) return `${w}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const isNewVideo = (ts?: string, now: number = Date.now()) => {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return !Number.isNaN(t) && now >= t && now - t < 86400000;
};

interface FramedVideoCardProps {
  item: FeedItem;
  thumbnail: string | null;
  isOwn: boolean;
  /** e.g. "Graded 18/20", only when the data includes it */
  gradeLabel?: string | null;
  large?: boolean;
  onOpen: (item: FeedItem) => void;
}

/**
 * Treatment A "Framed": colored mat, inset 16:9 thumbnail with white border and shadow,
 * play button, assignment name on the colored band, author row on white.
 * Thumbnails only; no <video> element is ever mounted here.
 */
export function FramedVideoCard({ item, thumbnail, isOwn, gradeLabel, large, onOpen }: FramedVideoCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const color = getCardColor(item.assignmentId);
  const title = item.title || 'Video';
  const authorName = isOwn ? 'You' : item.author?.name || 'Student';
  const showThumb = !!thumbnail && !imgFailed;
  const isNew = isNewVideo(item.timestamp);
  const when = relativeTime(item.timestamp);

  return (
    <article
      className={`group relative bg-white shadow-[0_6px_20px_rgba(11,37,64,0.10)] transition-shadow hover:shadow-[0_10px_28px_rgba(11,37,64,0.16)] motion-reduce:transition-none ${large ? 'rounded-[20px]' : 'rounded-[18px]'}`}
    >
      {/* Whole card is one keyboard-focusable button */}
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={`Watch ${isOwn ? 'your' : `${authorName}'s`} video for ${title}`}
        className={`absolute inset-0 z-10 w-full cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/60 focus-visible:ring-offset-2 ${large ? 'rounded-[20px]' : 'rounded-[18px]'}`}
      />

      {/* Colored mat */}
      <div
        className={`relative overflow-hidden ${large ? 'rounded-t-[20px] px-[18px] pt-[18px] pb-3' : 'rounded-t-[18px] px-3 pt-3 pb-2.5'}`}
        style={{ background: cardGradient(color) }}
      >
        {isNew && (
          <span className={`absolute z-[5] rounded-full bg-[#FFC72C] font-extrabold text-[#0b2540] shadow ${large ? 'left-2 top-2 px-3 py-0.5 text-[11px]' : 'left-1 top-1 px-2 py-0.5 text-[10px]'}`}>
            NEW
          </span>
        )}
        {/* Inset 16:9 frame */}
        <div
          className={`relative aspect-video w-full overflow-hidden border-white shadow-[0_4px_10px_rgba(0,0,0,0.35)] ${large ? 'rounded-xl border-4' : 'rounded-[10px] border-[3px]'}`}
          style={showThumb ? { backgroundColor: '#0b2540' } : { backgroundColor: `color-mix(in srgb, ${color.to} 62%, white)` }}
        >
          {showThumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail as string}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() => setImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span
              className="flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              style={{ width: large ? 40 : 32, height: large ? 40 : 32 }}
            >
              <svg className="text-[#0065a3]" style={{ width: large ? 18 : 14, height: large ? 18 : 14, marginLeft: 2 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </div>
        {/* Assignment name on the colored band (darkened for white-text contrast) */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: large ? 36 : 30, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)' }}
          aria-hidden="true"
        />
        <p className={`relative mt-2.5 truncate font-extrabold uppercase tracking-[0.12em] text-white ${large ? 'text-[11px]' : 'text-[10px]'}`}>{title}</p>
      </div>

      {/* White info area */}
      <div className={large ? 'px-4 pb-4 pt-3' : 'px-3 pb-3 pt-2.5'}>
        <div className="flex items-center gap-2 min-w-0">
          <SilhouetteAvatar size={large ? 28 : 24} />
          <div className="min-w-0">
            <p className={`truncate font-extrabold text-[#0b2540] ${large ? 'text-sm' : 'text-[13px]'}`}>{authorName}</p>
            <p className="truncate text-xs text-[#5b6b7b]">
              {[when, isOwn ? gradeLabel : null].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {large && (
          <span
            className="mt-3 flex h-9 w-full items-center justify-center rounded-full bg-[#0065a3] text-sm font-extrabold text-white group-hover:bg-[#00517f]"
            aria-hidden="true"
          >
            Watch
          </span>
        )}
      </div>
    </article>
  );
}
