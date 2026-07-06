'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavigationDirection = 'tab-switch' | 'drill-in' | 'drill-out' | 'swipe-left' | 'swipe-right' | 'none';

export interface TransitionState {
  direction: NavigationDirection;
  prevPath: string | null;
  currPath: string;
  isAnimating: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Top-level tab paths — navigation between any two of these is a tab switch */
const TAB_PATHS = [
  // Student
  '/student/dashboard',
  '/student/assignments',
  '/student/courses',
  '/student/profile',
  // Instructor
  '/instructor/dashboard',
  '/instructor/grading',
  '/instructor/courses',
  '/instructor/profile',
];

/** Duration of the longest transition (drill) in ms — used to clear isAnimating */
const MAX_ANIMATION_DURATION = 350;

// ---------------------------------------------------------------------------
// Swipe direction override
// ---------------------------------------------------------------------------

/** Module-level override for swipe-initiated navigation direction */
let swipeDirectionOverride: 'swipe-left' | 'swipe-right' | null = null;

/**
 * Set by the swipe engine before router.push to override direction classification.
 * Cleared after one use by classifyNavigation.
 */
export function setSwipeDirection(direction: 'swipe-left' | 'swipe-right') {
  swipeDirectionOverride = direction;
}

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

/**
 * Classifies a navigation event as tab-switch, drill-in, or drill-out.
 * Runs synchronously in < 1 frame.
 */
function classifyNavigation(
  prevPath: string | null,
  currPath: string,
  isPopState: boolean
): NavigationDirection {
  // Check for swipe override (set by useSwipeNavigation before router.push)
  if (swipeDirectionOverride) {
    const direction = swipeDirectionOverride;
    swipeDirectionOverride = null; // Clear after use
    return direction;
  }

  // First navigation (no previous path) — no animation
  if (!prevPath) return 'none';

  // Same path — no animation (e.g., query param change)
  if (prevPath === currPath) return 'none';

  // Back button / swipe gesture always = drill-out
  if (isPopState) return 'drill-out';

  // Both paths are top-level tabs → tab switch (cross-fade)
  const prevIsTab = TAB_PATHS.includes(prevPath);
  const currIsTab = TAB_PATHS.includes(currPath);
  if (prevIsTab && currIsTab) return 'tab-switch';

  // Compare route depth to determine push/pop
  const prevDepth = prevPath.split('/').filter(Boolean).length;
  const currDepth = currPath.split('/').filter(Boolean).length;

  if (currDepth > prevDepth) return 'drill-in';
  if (currDepth < prevDepth) return 'drill-out';

  // Same depth, different path — treat as tab-switch (lateral navigation)
  return 'tab-switch';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Detects navigation direction for page transitions.
 * Returns the current transition state including direction and animation status.
 *
 * Usage:
 *   const { direction, isAnimating } = useNavigationDirection();
 */
export function useNavigationDirection(): TransitionState {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const isPopStateRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<TransitionState>({
    direction: 'none',
    prevPath: null,
    currPath: pathname || '',
    isAnimating: false,
  });

  // Listen for popstate (browser back button / iOS swipe-back gesture)
  useEffect(() => {
    const handler = () => {
      isPopStateRef.current = true;
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Detect direction on pathname change
  useEffect(() => {
    const curr = pathname || '';
    const prev = prevPathRef.current;

    // Skip if path hasn't actually changed
    if (curr === prev) return;

    const direction = classifyNavigation(prev, curr, isPopStateRef.current);

    // Update state
    setState({
      direction,
      prevPath: prev,
      currPath: curr,
      isAnimating: direction !== 'none',
    });

    // Store current path as previous for next navigation
    prevPathRef.current = curr;

    // Reset popstate flag
    isPopStateRef.current = false;

    // Clear isAnimating after the animation duration
    if (direction !== 'none') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setState(s => ({ ...s, isAnimating: false }));
      }, MAX_ANIMATION_DURATION);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  return state;
}
