'use client';

import React from 'react';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { WideScreenSidebar } from '@/components/student/WideScreenSidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWide } = useIsWideScreen();

  if (isWide) {
    return (
      <div className="flex h-screen h-dvh overflow-hidden" data-wide-layout="">
        <WideScreenSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return <div>{children}</div>;
}
