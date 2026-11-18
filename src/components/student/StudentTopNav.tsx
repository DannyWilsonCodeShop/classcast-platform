'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { useTransitionRouter as useRouter } from '@/hooks/useTransitionRouter';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/common/Avatar';

const TABS = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'Courses', path: '/student/courses' },
  { label: 'Assignments', path: '/student/assignments' },
  { label: 'Grades', path: '/student/grades' },
  { label: 'Profile', path: '/student/profile' },
  { label: 'Settings', path: '/student/settings' },
];

/**
 * Top bar for the student wide layout (replaces the old left sidebar).
 * Same destinations as before; the yellow button opens the same assignment picker
 * that leads to /student/record?assignmentId=...
 */
export function StudentTopNav() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user } = useAuth();

  const isActive = (path: string) =>
    path === '/student/dashboard' ? pathname === path : pathname.startsWith(path);

  const handleRecord = () => {
    if (pathname === '/student/dashboard') {
      window.dispatchEvent(new CustomEvent('classcast-record-click'));
    } else {
      router.push('/student/dashboard?openRecord=true');
    }
  };

  return (
    <header className="shrink-0 bg-white border-b border-[#e3ebf2] px-4 lg:px-10 h-[72px] flex items-center gap-4 lg:gap-8">
      <button
        onClick={() => router.push('/student/dashboard')}
        className="flex items-center gap-2 rounded-lg shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3]"
        aria-label="ClassCast home"
      >
        <img src="/MyClassCast36.png" alt="" width={40} height={40} className="w-10 h-10 object-contain" />
        <span className="hidden lg:inline font-[family-name:var(--font-fredoka)] text-2xl font-bold leading-none text-[#0065a3]">ClassCast</span>
      </button>

      <nav aria-label="Student sections" className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0065a3] ${
                active ? 'bg-[#eaf3fb] text-[#0065a3]' : 'text-[#46596c] hover:bg-[#f4f7fb] hover:text-[#0065a3]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={handleRecord}
        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#FFC72C] hover:bg-[#e6b225] text-[#0b2540] font-extrabold text-[15px] px-5 h-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0065a3]/40"
      >
        <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-[#e11d48]" />
        <span className="hidden md:inline">Record video</span>
        <span className="md:hidden">Record</span>
      </button>

      <Avatar user={user} size="md" className="shrink-0 !w-9 !h-9 ring-[3px] ring-[#FFC72C]" />
    </header>
  );
}
