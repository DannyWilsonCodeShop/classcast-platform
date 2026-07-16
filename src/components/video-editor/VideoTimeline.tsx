'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VideoTimelineProps {
  duration: number; // seconds
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  cutRegions?: { start: number; end: number }[];
  onSeek: (time: number) => void;
  onTrimStartChange: (time: number) => void;
  onTrimEndChange: (time: number) => void;
}

export function VideoTimeline({
  duration,
  currentTime,
  trimStart,
  trimEnd,
  cutRegions = [],
  onSeek,
  onTrimStartChange,
  onTrimEndChange,
}: VideoTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'playhead' | null>(null);

  const getTimeFromX = useCallback((clientX: number): number => {
    if (!trackRef.current || duration <= 0) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  }, [duration]);

  const getPercentage = (time: number) => duration > 0 ? (time / duration) * 100 : 0;

  const handlePointerDown = (e: React.PointerEvent, type: 'start' | 'end' | 'playhead') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const time = getTimeFromX(e.clientX);
    if (dragging === 'start') {
      onTrimStartChange(Math.min(time, trimEnd - 0.5));
    } else if (dragging === 'end') {
      onTrimEndChange(Math.max(time, trimStart + 0.5));
    } else if (dragging === 'playhead') {
      onSeek(Math.max(trimStart, Math.min(time, trimEnd)));
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragging) return;
    const time = getTimeFromX(e.clientX);
    onSeek(Math.max(trimStart, Math.min(time, trimEnd)));
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-2 py-3">
      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-white/60 font-mono mb-1 px-1">
        <span>{formatTime(trimStart)}</span>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(trimEnd)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative h-12 bg-white/10 rounded-lg overflow-hidden cursor-pointer touch-none"
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Active (trimmed) region */}
        <div
          className="absolute top-0 bottom-0 bg-[#005587]/40"
          style={{ left: `${getPercentage(trimStart)}%`, width: `${getPercentage(trimEnd - trimStart)}%` }}
        />

        {/* Cut regions (grayed out) */}
        {cutRegions.map((cut, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 bg-red-500/30 border-x border-red-400/50"
            style={{ left: `${getPercentage(cut.start)}%`, width: `${getPercentage(cut.end - cut.start)}%` }}
          />
        ))}

        {/* Trim start handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-[#FFC72C] rounded-l-md flex items-center justify-center cursor-col-resize z-10 touch-none"
          style={{ left: `calc(${getPercentage(trimStart)}% - 8px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
        >
          <div className="w-0.5 h-5 bg-white/80 rounded" />
        </div>

        {/* Trim end handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-[#FFC72C] rounded-r-md flex items-center justify-center cursor-col-resize z-10 touch-none"
          style={{ left: `calc(${getPercentage(trimEnd)}% - 8px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
        >
          <div className="w-0.5 h-5 bg-white/80 rounded" />
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-20 cursor-col-resize touch-none"
          style={{ left: `calc(${getPercentage(currentTime)}% - 2px)` }}
          onPointerDown={(e) => handlePointerDown(e, 'playhead')}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow" />
        </div>

        {/* Dimmed regions outside trim */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/50"
          style={{ width: `${getPercentage(trimStart)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/50"
          style={{ width: `${100 - getPercentage(trimEnd)}%` }}
        />
      </div>
    </div>
  );
}
