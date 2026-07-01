'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface StudentTabBarProps {
  onPostClick?: () => void;
}

export function StudentTabBar({ onPostClick }: StudentTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/student/dashboard') return pathname === '/student/dashboard';
    if (path === '/student/assignments') return pathname?.startsWith('/student/assignments');
    if (path === '/student/courses') return pathname?.startsWith('/student/courses');
    if (path === '/student/profile') return pathname?.startsWith('/student/profile');
    return false;
  };

  const activeColor = 'text-[#005587]';
  const inactiveColor = 'text-gray-400';

  // Get user avatar
  const avatarUrl = user?.avatar || user?.profileImage || null;
  const userInitial = (user?.firstName || user?.email || '?')[0]?.toUpperCase();

  return (
    <nav className="shrink-0 bg-white border-t border-gray-200 px-1 py-2 native-bottom-nav">
      <div className="flex items-center justify-around">
        {/* Home */}
        <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/dashboard')}>
          <svg className={`w-6 h-6 ${isActive('/student/dashboard') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className={`text-[9px] ${isActive('/student/dashboard') ? activeColor + ' font-medium' : inactiveColor}`}>Home</span>
        </button>

        {/* Assignments */}
        <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/assignments')}>
          <svg className={`w-6 h-6 ${isActive('/student/assignments') ? activeColor : inactiveColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span className={`text-[9px] ${isActive('/student/assignments') ? activeColor + ' font-medium' : inactiveColor}`}>Assignments</span>
        </button>

        {/* Post (center) */}
        <button className="flex flex-col items-center min-w-0" onClick={onPostClick || (() => router.push('/student/record'))}>
          <div className="w-12 h-12 bg-gradient-to-br from-[#005587] to-[#0088cc] rounded-full flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-[#FFC72C]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <span className="text-[9px] text-gray-500 mt-0.5">Post</span>
        </button>

        {/* Courses */}
        <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/courses')}>
          <svg className={`w-6 h-6 ${isActive('/student/courses') ? activeColor : inactiveColor}`} fill={isActive('/student/courses') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span className={`text-[9px] ${isActive('/student/courses') ? activeColor + ' font-medium' : inactiveColor}`}>Courses</span>
        </button>

        {/* Profile - shows user avatar */}
        <button className="flex flex-col items-center min-w-0" onClick={() => router.push('/student/profile')}>
          <div className={`w-12 h-12 rounded-full overflow-hidden border-4 border-white ring-2 ${isActive('/student/profile') ? 'ring-[#005587]' : 'ring-[#FFC72C]'} bg-[#005587] flex items-center justify-center shadow-lg`}>
            {avatarUrl && avatarUrl.startsWith('http') ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : avatarUrl && avatarUrl.length <= 4 ? (
              <span className="text-lg">{avatarUrl}</span>
            ) : (
              <span className="text-white text-sm font-bold">{userInitial}</span>
            )}
          </div>
          <span className={`text-[9px] ${isActive('/student/profile') ? activeColor + ' font-medium' : inactiveColor}`}>Profile</span>
        </button>
      </div>
    </nav>
  );
}
