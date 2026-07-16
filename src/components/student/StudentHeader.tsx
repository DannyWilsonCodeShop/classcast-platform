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
      <div className="flex items-center gap-1">
        <span
          style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }}
          className="text-3xl"
        >
          ClassCast
        </span>
        <img src="/UpdatedCCLogo.png" alt="" className="w-6 h-6 object-contain" />
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
