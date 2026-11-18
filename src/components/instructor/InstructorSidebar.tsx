'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { CreateModal } from './CreateModal';
import { useSchoolTheme } from '@/hooks/useSchoolTheme';
import { GlobalStudentSearch } from './GlobalStudentSearch';
import Avatar from '@/components/common/Avatar';

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
  const { user, logout } = useAuth();
  const { isDesktop } = useIsWideScreen();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [hasCourses, setHasCourses] = useState(true); // default true to avoid flash
  const [ungradedCount, setUngradedCount] = useState(0);
  const theme = useSchoolTheme();

  const studyHallOnly = (user as any)?.studyHallOnly === true;
  // Study-hall-only accounts always show the collapsed nav; "Full site" logs out
  // so a full instructor account can sign in instead.
  const studyHallLocked = studyHallOnly;

  const handleFullSite = async () => {
    try { await logout(); } catch {}
    router.push('/auth/login');
  };

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
      // Ungraded count for the Grading badge (cached server-side, 30s)
      fetch(`/api/instructor/dashboard/stats?instructorId=${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data && typeof data.ungradedAssignments === 'number') setUngradedCount(data.ungradedAssignments); })
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
    <aside className={`h-full bg-white border-r border-[#e3ebf2] flex flex-col shrink-0 transition-all duration-200 ${isDesktop ? 'w-[220px]' : 'w-16'}`}>
      {/* Logo */}
      <div className={`px-4 pt-5 pb-3 ${isDesktop ? '' : 'flex justify-center'}`}>
        {isDesktop ? (
          <div className="flex items-center gap-2.5">
            <img src="/MyClassCast36.png" alt="" width={38} height={38} className="w-[38px] h-[38px] object-contain" />
            <span className="font-[family-name:var(--font-fredoka)] text-[23px] font-bold leading-none text-[#0065a3]">ClassCast</span>
          </div>
        ) : (
          <img src="/MyClassCast36.png" alt="" className="w-8 h-8 object-contain" />
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
              aria-current={active ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 rounded-xl transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] ${
                isDesktop ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'
              } ${
                active
                  ? 'bg-[#eaf3fb] text-[#0065a3]'
                  : 'text-[#46596c] hover:bg-[#f4f7fb]'
              }`}
              title={!isDesktop ? item.label : undefined}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#0065a3]" aria-hidden="true" />}
              <span className={active ? 'text-[#0065a3]' : 'text-[#8496a8]'}>{item.icon}</span>
              {isDesktop && (
                <span className={`text-[15px] ${active ? 'font-extrabold text-[#0065a3]' : 'font-bold text-[#46596c]'}`}>
                  {item.label}
                </span>
              )}
              {item.path === '/instructor/grading' && ungradedCount > 0 && (
                isDesktop ? (
                  <span className="ml-auto rounded-full bg-[#FFC72C] px-2 min-w-[24px] h-[18px] inline-flex items-center justify-center text-[11px] font-extrabold text-[#0b2540]" aria-label={`${ungradedCount} to grade`}>
                    {ungradedCount > 99 ? '99+' : ungradedCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-[#FFC72C]" aria-label={`${ungradedCount} to grade`} />
                )
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

        {/* Full site button (study-hall-only accounts): logs out to the login page
            so an instructor can sign in with their own full account. */}
        {studyHallOnly && (
          <div className="pt-3">
            <button
              onClick={handleFullSite}
              className={`w-full flex items-center gap-2 rounded-xl border border-[#0065a3]/30 text-[#0065a3] min-h-[44px] hover:bg-[#0065a3]/5 ${
                isDesktop ? 'px-3 py-2.5 justify-start' : 'justify-center py-2.5'
              }`}
              title={!isDesktop ? 'Full site' : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
              {isDesktop && <span className="text-sm font-medium">Full site (log in)</span>}
            </button>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className={`border-t border-[#e3ebf2] py-3 ${isDesktop ? 'mx-4' : 'flex justify-center'}`}>
        {isDesktop ? (
          <div className="flex items-center gap-2">
            <Avatar user={user} size="md" className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#0b2540] truncate">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</p>
              <p className="text-xs text-[#6b7c8c]">Instructor</p>
            </div>
          </div>
        ) : (
          <Avatar user={user} size="md" />
        )}
      </div>
      <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </aside>
  );
}
