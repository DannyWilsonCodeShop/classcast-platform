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

  // Start animating when direction changes to something other than 'none'
  const shouldAnimate = direction !== 'none';
  if (shouldAnimate && !isAnimating) {
    setIsAnimating(true);
  }

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const animationClass = ANIMATION_CLASS_MAP[direction] || '';

  return (
    <div
      key={pathname}
      className={`flex-1 min-h-0 overflow-hidden ${animationClass}`}
      style={{ willChange: isAnimating ? 'transform, opacity' : 'auto' }}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}
