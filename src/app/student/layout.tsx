'use client';

import React from 'react';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { WideScreenSidebar } from '@/components/student/WideScreenSidebar';
import { usePathname } from 'next/navigation';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWide } = useIsWideScreen();
  const pathname = usePathname();

  if (isWide) {
    return (
      <div className="flex h-screen h-dvh overflow-hidden" data-wide-layout="">
        <WideScreenSidebar />
        <main className="flex-1 overflow-hidden">
          <div key={pathname} className="h-full animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div key={pathname} className="h-full animate-fadeIn">
      {children}
    </div>
  );
}
