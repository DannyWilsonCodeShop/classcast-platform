'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shared header for the student mobile layout.
 * Renders ClassCast branding + search icon + school logo.
 * Lives in layout.tsx so it stays fixed during page transitions.
 */
export function StudentHeader() {
  const router = useRouter();
  const { user } = useAuth();

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
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/student/courses')}
          className="p-1"
          aria-label="Search courses"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <img
          src="/Demo1Logo.png"
          alt=""
          className="w-10 h-10 object-contain"
        />
      </div>
    </div>
  );
}
