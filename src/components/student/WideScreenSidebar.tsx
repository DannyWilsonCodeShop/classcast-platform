'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/student/dashboard',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    label: 'Courses',
    path: '/student/courses',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    label: 'Assignments',
    path: '/student/assignments',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    label: 'Grades',
    path: '/student/grades',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    label: 'Profile',
    path: '/student/profile',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    label: 'Settings',
    path: '/student/settings',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

interface WideScreenSidebarProps {
  onRecordClick?: () => void;
}

export function WideScreenSidebar({ onRecordClick }: WideScreenSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDesktop } = useIsWideScreen();

  const isActive = (path: string) => {
    if (path === '/student/dashboard') return pathname === path;
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
            <img src="/greenlogo.png" alt="" className="w-7 h-7 object-contain" />
          </div>
        ) : (
          <img src="/greenlogo.png" alt="" className="w-8 h-8 object-contain" />
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

        {/* Record Button */}
        <div className="pt-3">
          <button
            onClick={() => {
              // If on dashboard, open the assignment picker modal via event
              // If on another page, navigate to dashboard first
              if (pathname === '/student/dashboard') {
                window.dispatchEvent(new CustomEvent('classcast-record-click'));
              } else {
                router.push('/student/dashboard?openRecord=true');
              }
              if (onRecordClick) onRecordClick();
            }}
            className={`w-full flex items-center gap-2 bg-[#FFC72C] hover:bg-[#e6b225] text-[#005587] font-bold rounded-xl transition-colors min-h-[44px] ${
              isDesktop ? 'px-3 py-3 justify-start' : 'justify-center py-3'
            }`}
            title={!isDesktop ? 'Record' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {isDesktop && <span className="text-sm">Post</span>}
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
    </aside>
  );
}
