'use client';

import { useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Interpolation utilities (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Computes indicator position and morph scale during swipe progress.
 * @param sourceVisualIndex - The visual index (0-4) of the source tab
 * @param targetVisualIndex - The visual index (0-4) of the target tab
 * @param progress - Normalized progress from 0 to 1
 */
export function computeIndicatorPosition(
  sourceVisualIndex: number,
  targetVisualIndex: number,
  progress: number
): { left: number; scaleX: number } {
  const sourceLeft = sourceVisualIndex * 20;
  const targetLeft = targetVisualIndex * 20;

  // Linear interpolation for position
  const currentLeft = sourceLeft + (targetLeft - sourceLeft) * progress;

  // Morph: stretch in first half, compress in second half
  const morphProgress = progress <= 0.5
    ? progress * 2          // 0→1 during first half
    : (1 - progress) * 2;  // 1→0 during second half

  // ScaleX ranges from 1.0 to 1.4 at peak stretch
  const scaleX = 1 + morphProgress * 0.4;

  return { left: currentLeft, scaleX };
}

/**
 * Damped spring approximation for overshoot + settle on landing.
 * @param t - Normalized time from 0 to 1 over settle duration
 */
export function computeSpringSettle(t: number): number {
  const overshoot = 1.03;
  if (t < 0.7) {
    return 1 + (overshoot - 1) * Math.sin((t / 0.7) * Math.PI);
  }
  // Settle back from overshoot to 1.0
  const settleT = (t - 0.7) / 0.3;
  return overshoot - (overshoot - 1) * settleT;
}

// ---------------------------------------------------------------------------
// Hook Interface
// ---------------------------------------------------------------------------

export interface UseLiquidGlassReturn {
  /** Ref to attach to the indicator DOM element */
  indicatorRef: React.RefObject<HTMLDivElement | null>;
  /** Trigger animated transition to a new tab (for tap navigation) */
  animateToTab: (targetVisualIndex: number) => void;
  /** Update indicator position during swipe (called from rAF loop) */
  syncWithSwipeProgress: (progress: number, sourceVisualIndex: number, targetVisualIndex: number) => void;
  /** Snap indicator back to source tab (cancel) */
  snapBack: (sourceVisualIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

export function useLiquidGlass(): UseLiquidGlassReturn {
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  /**
   * Animate indicator to a new tab position via CSS transition (tap navigation).
   * Uses the --animating class for 450ms spring easing.
   */
  const animateToTab = useCallback((targetVisualIndex: number) => {
    const el = indicatorRef.current;
    if (!el) return;

    // Remove any existing transition classes
    el.classList.remove('liquid-glass-indicator--snapping');
    el.classList.remove('liquid-glass-indicator--animating');

    // Force a reflow to ensure the class removal takes effect before re-adding
    void el.offsetWidth;

    // Add animating class for CSS transition
    el.classList.add('liquid-glass-indicator--animating');

    // Set position via left percentage
    el.style.left = `${targetVisualIndex * 20}%`;
    el.style.transform = 'translateZ(0) scaleX(1)';

    // Remove animating class after transition completes (listen for 'left' only)
    const handleEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'left') {
        el.classList.remove('liquid-glass-indicator--animating');
      }
    };
    el.addEventListener('transitionend', handleEnd, { once: true });
  }, []);

  /**
   * Sync indicator with swipe progress. Called from rAF loop during active swipe.
   * Directly manipulates DOM — no React re-renders.
   */
  const syncWithSwipeProgress = useCallback((
    progress: number,
    sourceVisualIndex: number,
    targetVisualIndex: number
  ) => {
    const el = indicatorRef.current;
    if (!el) return;

    // Remove any CSS transition classes during swipe (we're driving position manually)
    el.classList.remove('liquid-glass-indicator--animating');
    el.classList.remove('liquid-glass-indicator--snapping');

    const { left, scaleX } = computeIndicatorPosition(sourceVisualIndex, targetVisualIndex, progress);

    // Apply position and morph directly
    el.style.left = `${left}%`;
    el.style.transform = `translateZ(0) scaleX(${scaleX})`;
  }, []);

  /**
   * Snap indicator back to source position (cancelled swipe).
   * Uses 200ms ease-out CSS transition.
   */
  const snapBack = useCallback((sourceVisualIndex: number) => {
    const el = indicatorRef.current;
    if (!el) return;

    // Remove any existing transition classes
    el.classList.remove('liquid-glass-indicator--animating');
    el.classList.remove('liquid-glass-indicator--snapping');

    // Force reflow
    void el.offsetWidth;

    // Add snapping class for CSS transition
    el.classList.add('liquid-glass-indicator--snapping');

    // Animate back to source
    el.style.left = `${sourceVisualIndex * 20}%`;
    el.style.transform = 'translateZ(0) scaleX(1)';

    // Remove snapping class after transition
    const handleEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'left') {
        el.classList.remove('liquid-glass-indicator--snapping');
      }
    };
    el.addEventListener('transitionend', handleEnd, { once: true });
  }, []);

  return {
    indicatorRef,
    animateToTab,
    syncWithSwipeProgress,
    snapBack,
  };
}
