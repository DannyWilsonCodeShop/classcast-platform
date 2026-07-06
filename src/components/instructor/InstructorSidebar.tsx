'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { CreateModal } from './CreateModal';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/instructor/dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Courses',
    path: '/instructor/courses',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    label: 'Grading',
    path: '/instructor/grading',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    label: 'Submissions',
    path: '/instructor/submissions',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  },
  {
    label: 'Modules',
    path: '/instructor/lesson-modules',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    label: 'Moderation',
    path: '/instructor/moderation',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    label: 'AI',
    path: '/instructor/ai',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    label: 'Profile',
    path: '/instructor/profile',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
];

export function InstructorSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDesktop } = useIsWideScreen();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isActive = (path: string) => {
    if (path === '/instructor/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside className={`h-full bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-200 ${isDesktop ? 'w-[220px]' : 'w-16'}`}>
      {/* Logo */}
      <div className={`px-3 pt-4 pb-3 border-b border-gray-50 ${isDesktop ? '' : 'flex justify-center'}`}>
        {isDesktop ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
            <span style={{ fontFamily: "'Grand Hotel', cursive", color: '#005587' }} className="text-xl">ClassCast</span>
            <img src="/UpdatedCCLogo.png" alt="" className="w-7 h-7 object-contain" />
          </div>
        ) : (
          <img src="/UpdatedCCLogo.png" alt="" className="w-8 h-8 object-contain" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors min-h-[44px] ${
                isDesktop ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'
              } ${
                active
                  ? 'bg-[#005587]/10 text-[#005587] border-l-3 border-[#005587]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={!isDesktop ? item.label : undefined}
            >
              <span className={active ? 'text-[#005587]' : 'text-gray-400'}>{item.icon}</span>
              {isDesktop && (
                <span className={`text-sm font-medium ${active ? 'text-[#005587]' : 'text-gray-700'}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Create Assignment Button */}
        <div className="pt-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`w-full flex items-center gap-2 bg-[#FFC72C] hover:bg-[#e6b225] text-[#005587] font-bold rounded-xl transition-colors min-h-[44px] ${
              isDesktop ? 'px-3 py-3 justify-start' : 'justify-center py-3'
            }`}
            title={!isDesktop ? 'Create' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {isDesktop && <span className="text-sm">Create</span>}
          </button>
        </div>
      </nav>

      {/* User section */}
      <div className={`border-t border-gray-50 p-3 ${isDesktop ? '' : 'flex justify-center'}`}>
        {isDesktop ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-200 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#005587] flex items-center justify-center text-white text-xs font-bold">
                  {(user?.firstName || '?')[0]}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">{user?.firstName}</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-[#FFC72C] overflow-hidden bg-gray-200">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#005587] flex items-center justify-center text-white text-xs font-bold">
                {(user?.firstName || '?')[0]}
              </div>
            )}
          </div>
        )}
      </div>
      <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </aside>
  );
}
