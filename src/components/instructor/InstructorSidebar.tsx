'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { CreateModal } from './CreateModal';
import { useSchoolTheme } from '@/hooks/useSchoolTheme';
import { GlobalStudentSearch } from './GlobalStudentSearch';
import { isFullSiteEnabled, setFullSite } from '@/lib/studyHallMode';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresTeam?: boolean;
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
    label: 'Question Banks',
    path: '/instructor/problem-banks',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    label: 'Study Hall',
    path: '/instructor/study-hall',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    requiresTeam: true,
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
  const [hasTeam, setHasTeam] = useState(false);
  const [hasCourses, setHasCourses] = useState(true); // default true to avoid flash
  const [fullSite, setFullSiteState] = useState(false);
  const theme = useSchoolTheme();

  const studyHallOnly = (user as any)?.studyHallOnly === true;
  const studyHallLocked = studyHallOnly && !fullSite;

  // Track full-site session toggle
  useEffect(() => {
    setFullSiteState(isFullSiteEnabled());
    const onChange = () => setFullSiteState(isFullSiteEnabled());
    window.addEventListener('classcast-full-site-change', onChange);
    return () => window.removeEventListener('classcast-full-site-change', onChange);
  }, []);

  // Prefetch all instructor routes on mount for instant navigation
  useEffect(() => {
    router.prefetch('/instructor/dashboard');
    router.prefetch('/instructor/grading');
    router.prefetch('/instructor/courses');
    router.prefetch('/instructor/profile');
    router.prefetch('/instructor/study-hall');
  }, [router]);

  // Check if user is on a team and has courses
  useEffect(() => {
    if (user?.id) {
      // Check team membership
      fetch(`/api/teams?memberId=${user.id}`)
        .then(r => r.json())
        .then(data => { if (data.success && data.teams?.length > 0) setHasTeam(true); })
        .catch(() => {});
      // Check if they have courses
      fetch(`/api/instructor/courses?instructorId=${user.id}`)
        .then(r => r.json())
        .then(data => { setHasCourses(data.success && data.data?.courses?.length > 0); })
        .catch(() => {});
    }
  }, [user?.id]);

  // Nav visibility:
  // - study-hall-only (locked): just Study Hall + Profile
  // - team-only (team, no courses): just Study Hall + Profile
  // - otherwise: full nav (Study Hall still gated behind team membership)
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (studyHallLocked) {
      return item.path === '/instructor/study-hall' || item.path === '/instructor/profile';
    }
    // Study-hall-only accounts in full-site mode can still reach Study Hall
    if (item.requiresTeam && !hasTeam && !studyHallOnly) return false;
    if (hasTeam && !hasCourses) {
      return item.path === '/instructor/study-hall' || item.path === '/instructor/profile';
    }
    return true;
  });

  const isActive = (path: string) => {
    if (path === '/instructor/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <aside className={`h-full bg-[#f7f3ef] border-r border-[#e8e0d8] flex flex-col shrink-0 transition-all duration-200 ${isDesktop ? 'w-[220px]' : 'w-16'}`}>
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

      {/* Global student search (desktop sidebar) */}
      {isDesktop && (
        <div className="px-2 pt-2">
          <GlobalStudentSearch />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
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

        {/* Create Assignment Button (hidden for study-hall-locked accounts) */}
        {!studyHallLocked && (
          <div className="pt-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`w-full flex items-center gap-2 font-bold rounded-xl transition-colors min-h-[44px] ${
                isDesktop ? 'px-3 py-3 justify-start' : 'justify-center py-3'
              }`}
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
              title={!isDesktop ? 'Create' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {isDesktop && <span className="text-sm">Create</span>}
            </button>
          </div>
        )}

        {/* Full site / Study Hall toggle (only for study-hall-only accounts) */}
        {studyHallOnly && (
          <div className="pt-3">
            {studyHallLocked ? (
              <button
                onClick={() => setFullSite(true)}
                className={`w-full flex items-center gap-2 rounded-xl border border-[#005587]/30 text-[#005587] min-h-[44px] hover:bg-[#005587]/5 ${
                  isDesktop ? 'px-3 py-2.5 justify-start' : 'justify-center py-2.5'
                }`}
                title={!isDesktop ? 'Full site' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                {isDesktop && <span className="text-sm font-medium">Full site</span>}
              </button>
            ) : (
              <button
                onClick={() => { setFullSite(false); router.push('/instructor/study-hall'); }}
                className={`w-full flex items-center gap-2 rounded-xl border border-gray-200 text-gray-500 min-h-[44px] hover:bg-gray-50 ${
                  isDesktop ? 'px-3 py-2.5 justify-start' : 'justify-center py-2.5'
                }`}
                title={!isDesktop ? 'Study Hall only' : undefined}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {isDesktop && <span className="text-sm font-medium">Study Hall only</span>}
              </button>
            )}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className={`border-t border-gray-50 p-3 ${isDesktop ? '' : 'flex justify-center'}`}>
        {isDesktop ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 overflow-hidden bg-gray-200 shrink-0" style={{ borderColor: theme.accent }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: theme.primary }}>
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
