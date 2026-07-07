'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Shared header for the instructor mobile layout.
 * Shows ClassCast logo + page title + school logo.
 */
export function InstructorHeader() {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/instructor/dashboard') return 'Dashboard';
    if (pathname?.startsWith('/instructor/grading')) return 'Grading';
    if (pathname === '/instructor/courses') return 'Courses';
    if (pathname?.startsWith('/instructor/problem-banks')) return 'Problem Banks';
    if (pathname?.startsWith('/instructor/profile')) return 'Profile';
    return '';
  };

  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
      <div className="flex items-center gap-2">
        <img src="/ClassCastLogo.png" alt="ClassCast" className="w-7 h-7 object-contain" />
        <span className="text-base font-bold text-[#005587]">{getPageTitle()}</span>
      </div>
      <img src="/CristoReyLogo.png" alt="" className="w-10 h-10 object-contain" />
    </div>
  );
}
