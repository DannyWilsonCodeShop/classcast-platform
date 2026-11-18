'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { useStudentAssignments } from '@/hooks/useStudentData';
import { SilhouetteAvatar } from '@/components/student/FramedVideoCard';

const icon = (d: string) => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const NAV = [
  { label: 'Dashboard', path: '/student/dashboard', icon: icon('M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10') },
  { label: 'Courses', path: '/student/courses', icon: icon('M12 6.25v13M12 6.25C10.8 5.5 9.2 5 7.5 5S4.2 5.5 3 6.25v13C4.2 18.5 5.8 18 7.5 18s3.3.5 4.5 1.25m0-13C13.2 5.5 14.8 5 16.5 5s3.3.5 4.5 1.25v13C19.8 18.5 18.2 18 16.5 18s-3.3.5-4.5 1.25') },
  { label: 'Assignments', path: '/student/assignments', icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'), badge: true },
  { label: 'Grades', path: '/student/grades', icon: icon('M5 21V11M12 21V4M19 21v-7') },
  { label: 'Peer Reviews', path: '/student/peer-reviews', icon: icon('M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5.13a3 3 0 11-6 0 3 3 0 016 0z') },
  { label: 'Settings', path: '/student/settings', icon: icon('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z') },
];

/**
 * Left sidebar for the student wide layout (>= 768px). Icon-only below 1024px.
 * The Assignments badge is the number of unsubmitted assignments due in the next 7 days
 * (same rule as the dashboard's "due this week" count), from the cached assignments query.
 */
export function StudentSidebar() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const { isDesktop } = useIsWideScreen();
  const { data: assignments = [] } = useStudentAssignments();

  const now = Date.now();
  const dueCount = assignments.filter((a) => {
    const d = new Date(a.dueDate).getTime();
    return !a.isSubmitted && d >= now && d <= now + 7 * 86400000;
  }).length;

  const isActive = (path: string) => (path === '/student/dashboard' ? pathname === path : pathname.startsWith(path));
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';

  return (
    <aside
      className={`shrink-0 h-full bg-white border-r border-[#e3ebf2] flex flex-col ${isDesktop ? 'w-[230px]' : 'w-[76px]'}`}
      aria-label="Student navigation"
    >
      <button
        onClick={() => router.push('/student/dashboard')}
        aria-label="ClassCast home"
        className={`flex items-center gap-2.5 mt-5 mb-6 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] ${isDesktop ? 'px-6' : 'justify-center'}`}
      >
        <img src="/MyClassCast36.png" alt="" width={38} height={38} className="w-[38px] h-[38px] object-contain" />
        {isDesktop && <span className="font-[family-name:var(--font-fredoka)] text-[23px] font-bold leading-none text-[#0065a3]">ClassCast</span>}
      </button>

      <div className="px-3.5 mb-4">
        <button
          onClick={() => {
            // Same flow as the dashboard's Record video button: the dashboard opens its assignment picker.
            if (pathname === '/student/dashboard') {
              window.dispatchEvent(new CustomEvent('classcast-record-click'));
            } else {
              router.push('/student/dashboard?openRecord=true');
            }
          }}
          aria-label="Record video"
          title={!isDesktop ? 'Record video' : undefined}
          className={`bg-[#FFC72C] hover:bg-[#e6b225] text-[#0b2540] font-[family-name:var(--font-nunito)] font-bold text-[15px] transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] focus-visible:ring-offset-2 ${
            isDesktop ? 'w-full min-h-[44px] rounded-full gap-2.5 px-4' : 'w-11 h-11 mx-auto rounded-full'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5231B] shrink-0" aria-hidden="true" />
          {isDesktop && <span className="whitespace-nowrap">Record video</span>}
        </button>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3.5 space-y-1.5">
        {NAV.map((item) => {
          const active = isActive(item.path);
          const showBadge = item.badge && dueCount > 0;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={showBadge ? `${item.label}, ${dueCount} due this week` : item.label}
              title={!isDesktop ? item.label : undefined}
              className={`relative w-full min-h-[42px] flex items-center gap-2.5 rounded-xl text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] ${isDesktop ? 'px-4' : 'justify-center'} ${
                active ? 'bg-[#eaf3fb] text-[#0065a3] font-extrabold' : 'text-[#46596c] font-bold hover:bg-[#f4f7fb]'
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#0065a3]" aria-hidden="true" />}
              {item.icon}
              {isDesktop && <span className="whitespace-nowrap">{item.label}</span>}
              {showBadge && (
                <span
                  className={`rounded-full bg-[#FFC72C] text-[11px] font-extrabold text-[#0b2540] min-w-[22px] h-[18px] px-1.5 inline-flex items-center justify-center ${isDesktop ? 'ml-auto' : 'absolute top-1 right-2'}`}
                  aria-hidden="true"
                >
                  {dueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => router.push('/student/profile')}
        aria-label={`${fullName}, view profile`}
        className={`mx-3.5 mb-4 mt-2 pt-4 border-t border-[#e3ebf2] flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] rounded-lg ${isDesktop ? 'px-2' : 'justify-center'}`}
      >
        <SilhouetteAvatar size={34} />
        {isDesktop && (
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-[#0b2540] truncate">{fullName}</span>
            <span className="block text-xs text-[#5b6b7b]">Student</span>
          </span>
        )}
      </button>
    </aside>
  );
}
