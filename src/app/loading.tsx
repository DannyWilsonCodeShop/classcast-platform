'use client';

import React from 'react';

/**
 * Root loading state — shown immediately while the app hydrates.
 * Displays the ClassCast branded splash that fades into a dashboard skeleton,
 * replacing the blank white screen users see between splash dismiss and content load.
 */
export default function RootLoading() {
  return (
    <div className="h-screen h-dvh bg-[#005587] flex flex-col animate-loading-fade-in">
      {/* ClassCast branding centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <img
          src="/UpdatedCCLogo.png"
          alt="ClassCast"
          className="w-20 h-20 object-contain animate-pulse"
        />
        <span
          style={{ fontFamily: "'Grand Hotel', cursive" }}
          className="text-white text-4xl opacity-90"
        >
          ClassCast
        </span>
      </div>

      {/* Skeleton preview fading in at bottom */}
      <div className="bg-white rounded-t-3xl px-4 pt-4 pb-8 animate-skeleton-slide-up">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4 bg-gray-100">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
