'use client';

import React from 'react';

/**
 * Shared header for the instructor mobile layout.
 * Renders ClassCast logo + school logo.
 * Lives in layout.tsx so it stays fixed during page transitions.
 */
export function InstructorHeader() {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
      <img src="/ClassCastLogo.png" alt="ClassCast" className="w-7 h-7 object-contain" />
      <img src="/CristoReyLogo.png" alt="" className="w-10 h-10 object-contain" />
    </div>
  );
}
