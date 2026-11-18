'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shared header for the student mobile layout.
 * Renders ClassCast branding + school logo from user profile.
 * Lives in layout.tsx so it stays fixed during page transitions.
 */
export function StudentHeader() {
  const { user } = useAuth();
  const schoolLogo = user?.schoolLogo;

  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
      <div className="flex items-center gap-2">
        <img src="/MyClassCast36.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
        <span className="font-[family-name:var(--font-fredoka)] text-2xl font-bold leading-none text-[#0065a3]">
          ClassCast
        </span>
      </div>
      {schoolLogo && (
        <img
          src={schoolLogo}
          alt=""
          className="w-14 h-14 object-contain"
        />
      )}
    </div>
  );
}
