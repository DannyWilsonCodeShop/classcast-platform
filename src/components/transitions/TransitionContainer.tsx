'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';

const ANIMATION_CLASS_MAP: Record<string, string> = {
  'tab-switch': 'animate-tab-enter',
  'drill-in': 'animate-drill-in-enter',
  'drill-out': 'animate-drill-out-enter',
  'swipe-left': 'animate-swipe-left-enter',
  'swipe-right': 'animate-swipe-right-enter',
  'none': '',
};

export default function TransitionContainer({ children }: { children: React.ReactNode }) {
  const { direction } = useNavigationDirection();
  const pathname = usePathname();
  const [isAnimating, setIsAnimating] = useState(false);

  const shouldAnimate = direction !== 'none';
  if (shouldAnimate && !isAnimating) {
    setIsAnimating(true);
  }

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const animationClass = ANIMATION_CLASS_MAP[direction] || '';

  // Only use key for drill navigations (forces remount for new page content)
  // Tab switches and swipes don't remount — page persists and data updates in-place
  const needsRemount = direction === 'drill-in' || direction === 'drill-out';
  const containerKey = needsRemount ? pathname : undefined;

  return (
    <div
      key={containerKey}
      className={`flex-1 min-h-0 overflow-hidden ${animationClass}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}
