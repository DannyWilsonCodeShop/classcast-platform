'use client';

import React from 'react';
import { useIsWideScreen } from '@/hooks/useIsWideScreen';
import { InstructorSidebar } from '@/components/instructor/InstructorSidebar';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWide } = useIsWideScreen();

  if (isWide) {
    return (
      <div className="flex h-screen h-dvh overflow-hidden" data-wide-layout="">
        <InstructorSidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f9fc]">
          {children}
        </main>
      </div>
    );
  }

  return <div>{children}</div>;
}
