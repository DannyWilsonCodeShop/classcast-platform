'use client';

import React from 'react';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { InstructorSidebar } from '@/components/instructor/InstructorSidebar';
import { usePathname } from 'next/navigation';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';
import { SwipeNavigationProvider } from '@/components/transitions/SwipeNavigationProvider';
import TransitionContainer from '@/components/transitions/TransitionContainer';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { InstructorTabBar } from '@/components/instructor/InstructorTabBar';
import { SwipeTabConfig } from '@/hooks/useSwipeNavigation';
import { useSchoolTheme } from '@/hooks/useSchoolTheme';
import { getThemeCSSVars } from '@/lib/school-theme';

// Pages that show the shared ClassCast header (main tab pages only, not sub-routes)
const INSTRUCTOR_TAB_PATHS = ['/instructor/dashboard', '/instructor/grading', '/instructor/grading/bulk', '/instructor/courses', '/instructor/profile'];

// Instructor swipeable tab order (excludes Create since it's a modal action)
const INSTRUCTOR_SWIPE_TAB_ORDER: SwipeTabConfig[] = [
  { path: '/instructor/dashboard', visualIndex: 0 },
  { path: '/instructor/grading', visualIndex: 1 },
  { path: '/instructor/courses', visualIndex: 3 },
  { path: '/instructor/profile', visualIndex: 4 },
];

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWide } = useIsWideScreen();
  const pathname = usePathname();
  const { direction, prevPath, isAnimating } = useNavigationDirection();

  // Show header on main tab pages. During drill-in from a tab page, keep it visible
  // until the animation completes so it doesn't blink away.
  const isOnTabPage = INSTRUCTOR_TAB_PATHS.includes(pathname || '');
  const wasDrillingFromTab = direction === 'drill-in' && isAnimating && prevPath && INSTRUCTOR_TAB_PATHS.includes(prevPath);
  const showSharedHeader = isOnTabPage || wasDrillingFromTab;

  const theme = useSchoolTheme();
  const themeVars = getThemeCSSVars(theme) as React.CSSProperties;

  if (isWide) {
    return (
      <div className="flex h-screen h-dvh overflow-hidden" data-wide-layout="" style={themeVars}>
        <InstructorSidebar />
        <main className="flex-1 overflow-y-auto bg-[#faf9f7]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', ...themeVars }}>
      {showSharedHeader && (
        <>
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
          <InstructorHeader />
        </>
      )}
      <SwipeNavigationProvider tabOrder={INSTRUCTOR_SWIPE_TAB_ORDER}>
        <TransitionContainer>
          {children}
        </TransitionContainer>
      </SwipeNavigationProvider>
      <InstructorTabBar />
    </div>
  );
}
