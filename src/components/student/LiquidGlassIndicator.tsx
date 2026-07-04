'use client';

import React from 'react';

interface LiquidGlassIndicatorProps {
  /** Current active tab visual index (0-4, including Post at 2) */
  activeIndex: number;
  /** Ref forwarded from useLiquidGlass for direct DOM manipulation */
  indicatorRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Animated glass pill indicator for the StudentTabBar.
 * Position and morph are controlled externally via the indicatorRef
 * from useLiquidGlass hook during swipe gestures and tab transitions.
 */
export function LiquidGlassIndicator({ activeIndex, indicatorRef }: LiquidGlassIndicatorProps) {
  return (
    <div
      ref={indicatorRef}
      className="liquid-glass-indicator"
      style={{
        left: `${activeIndex * 20}%`,
        transform: 'translateZ(0) scaleX(1)',
      }}
    />
  );
}
