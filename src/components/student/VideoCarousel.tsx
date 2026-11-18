'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VideoCarouselProps {
  /** Pre-rendered cards; each child is one slide. */
  children: React.ReactNode[];
  label?: string;
  /** Width classes for each slide. */
  itemClassName?: string;
}

const arrowBtn =
  'hidden md:flex absolute top-[42%] z-20 h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0b2540] shadow-[0_4px_14px_rgba(11,37,64,0.28)] hover:bg-[#eaf3fb] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/60 cursor-pointer';

/**
 * Single horizontal row of cards. Native scroll with CSS scroll-snap (swipe, trackpad,
 * shift-wheel). Arrow buttons and arrow keys page by whole cards and wrap around at the ends.
 * Never auto-advances. Remount with a new `key` to reset to the start.
 */
export function VideoCarousel({ children, label = 'Class videos', itemClassName = 'w-[min(78vw,330px)] md:w-[330px]' }: VideoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (el) setOverflowing(el.scrollWidth > el.clientWidth + 4);
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children.length]);

  const page = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const cardW = first ? first.getBoundingClientRect().width : el.clientWidth;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const stride = cardW + gap;
    // Whole cards that fit, at least one
    const step = Math.max(1, Math.floor((el.clientWidth + gap) / stride)) * stride;
    const max = el.scrollWidth - el.clientWidth;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    let target: number;
    if (dir === 1) target = el.scrollLeft >= max - 8 ? 0 : Math.min(max, el.scrollLeft + step);
    else target = el.scrollLeft <= 8 ? max : Math.max(0, el.scrollLeft - step);
    el.scrollTo({ left: target, behavior });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!overflowing) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); page(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1); }
  };

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {overflowing && (
        <button type="button" aria-label="Previous videos" onClick={() => page(-1)} className={`${arrowBtn} left-1`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      <div
        ref={trackRef}
        tabIndex={0}
        className="flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide px-1 pt-1 pb-5 -mx-1 scroll-px-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40 rounded-2xl motion-reduce:scroll-auto"
        style={{ scrollbarWidth: 'none', overscrollBehaviorX: 'contain', touchAction: 'pan-x pan-y' }}
      >
        {children.map((child, i) => (
          <div key={i} className={`snap-start shrink-0 ${itemClassName}`}>
            {child}
          </div>
        ))}
      </div>
      {overflowing && (
        <button type="button" aria-label="Next videos" onClick={() => page(1)} className={`${arrowBtn} right-1`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}
