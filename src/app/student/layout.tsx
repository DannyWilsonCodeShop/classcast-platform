'use client';

import React from 'react';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { WideScreenSidebar } from '@/components/student/WideScreenSidebar';
import { usePathname } from 'next/navigation';
import { StudentHeader } from '@/components/student/StudentHeader';
import TransitionContainer from '@/components/transitions/TransitionContainer';
import { SwipeNavigationProvider } from '@/components/transitions/SwipeNavigationProvider';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';

// Pages that show the shared ClassCast header (main tab pages only, not sub-routes)
const SHARED_HEADER_PATHS = ['/student/dashboard', '/student/assignments', '/student/courses', '/student/profile'];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWide } = useIsWideScreen();
  const pathname = usePathname();
  const { direction, prevPath, isAnimating } = useNavigationDirection();

  // Show header on main tab pages. During drill-in from a tab page, keep it visible
  // until the animation completes so it doesn't blink away.
  const isOnTabPage = SHARED_HEADER_PATHS.includes(pathname || '');
  const wasDrillingFromTab = direction === 'drill-in' && isAnimating && prevPath && SHARED_HEADER_PATHS.includes(prevPath);
  const showSharedHeader = !isWide && (isOnTabPage || wasDrillingFromTab);

  if (isWide) {
    return (
      <div className="flex h-screen h-dvh overflow-hidden" data-wide-layout="">
        <WideScreenSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {showSharedHeader && (
        <>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
          <StudentHeader />
        </>
      )}
      <SwipeNavigationProvider>
        <TransitionContainer>
          {children}
        </TransitionContainer>
      </SwipeNavigationProvider>
    </div>
  );
}
