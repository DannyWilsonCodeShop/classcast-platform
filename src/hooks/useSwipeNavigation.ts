'use client';

import { useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { setSwipeDirection } from './useNavigationDirection';

// Constants
const SWIPE_TAB_ORDER = [
  { path: '/student/dashboard', visualIndex: 0 },
  { path: '/student/assignments', visualIndex: 1 },
  { path: '/student/courses', visualIndex: 3 },
  { path: '/student/profile', visualIndex: 4 },
] as const;

const CONFIG = {
  displacementThreshold: 50,
  velocityThreshold: 300,
  directionLockRatio: 1.5,
  dampingThreshold: 0.8,
  dampingFactor: 0.5,
  edgeZone: 20,
  rubberBandMax: 0.15,
  rubberBandResistance: 0.3,
  cancelDuration: 200,
  minMovement: 10,
} as const;

// ---------------------------------------------------------------------------
// Utility functions (exported for testing)
// ---------------------------------------------------------------------------

export function getSwipeIndexFromPath(pathname: string): number | null {
  const idx = SWIPE_TAB_ORDER.findIndex(t => t.path === pathname);
  return idx >= 0 ? idx : null;
}

export function getAdjacentTab(currentIndex: number, direction: 'left' | 'right'): number | null {
  if (direction === 'left') {
    // Swipe left = go to next tab
    return currentIndex < SWIPE_TAB_ORDER.length - 1 ? currentIndex + 1 : null;
  }
  // Swipe right = go to previous tab
  return currentIndex > 0 ? currentIndex - 1 : null;
}

export function isTabPage(pathname: string): boolean {
  return SWIPE_TAB_ORDER.some(t => t.path === pathname);
}

export function computeCommitDecision(displacement: number, velocity: number): 'commit' | 'cancel' {
  if (Math.abs(displacement) >= CONFIG.displacementThreshold) return 'commit';
  if (velocity >= CONFIG.velocityThreshold) return 'commit';
  return 'cancel';
}

export function computeTranslation(deltaX: number, screenWidth: number): number {
  const threshold = screenWidth * CONFIG.dampingThreshold;
  const absDelta = Math.abs(deltaX);
  if (absDelta <= threshold) return deltaX;
  const sign = deltaX > 0 ? 1 : -1;
  const excess = absDelta - threshold;
  return sign * (threshold + excess * CONFIG.dampingFactor);
}

export function checkDirectionLock(dx: number, dy: number): 'horizontal' | 'vertical' | 'undecided' {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < CONFIG.minMovement && absDy < CONFIG.minMovement) return 'undecided';
  if (absDx >= absDy * CONFIG.directionLockRatio) return 'horizontal';
  if (absDy >= absDx * CONFIG.directionLockRatio) return 'vertical';
  return 'undecided';
}

export function computeRubberBand(deltaX: number, screenWidth: number): number {
  const maxStretch = screenWidth * CONFIG.rubberBandMax;
  const dampedDelta = deltaX * CONFIG.rubberBandResistance;
  return Math.sign(dampedDelta) * Math.min(Math.abs(dampedDelta), maxStretch);
}

function isHorizontallyScrollable(element: HTMLElement): boolean {
  let el: HTMLElement | null = element;
  while (el) {
    if (el.scrollWidth > el.clientWidth) {
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === 'auto' || overflow === 'scroll') return true;
    }
    el = el.parentElement;
  }
  return false;
}


// ---------------------------------------------------------------------------
// Gesture State (internal)
// ---------------------------------------------------------------------------

interface GestureState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  directionLocked: boolean;
  isHorizontal: boolean | null; // null = undecided
  isActive: boolean;
  targetIndex: number | null;
  swipeDirection: 'left' | 'right' | null;
}

function createInitialGestureState(): GestureState {
  return {
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    directionLocked: false,
    isHorizontal: null,
    isActive: false,
    targetIndex: null,
    swipeDirection: null,
  };
}

// ---------------------------------------------------------------------------
// Hook Interface
// ---------------------------------------------------------------------------

export interface UseSwipeNavigationReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  currentPaneRef: React.RefObject<HTMLDivElement | null>;
  previewPaneRef: React.RefObject<HTMLDivElement | null>;
  progressRef: React.RefObject<number>;
  isSwipingRef: React.RefObject<boolean>;
  targetTabIndexRef: React.RefObject<number | null>;
  isSwipeEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

export function useSwipeNavigation(): UseSwipeNavigationReturn {
  const pathname = usePathname();
  const router = useRouter();

  // DOM refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentPaneRef = useRef<HTMLDivElement | null>(null);
  const previewPaneRef = useRef<HTMLDivElement | null>(null);

  // State refs (no re-renders during gesture)
  const progressRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);
  const targetTabIndexRef = useRef<number | null>(null);

  // Internal gesture state ref
  const gestureRef = useRef<GestureState>(createInitialGestureState());

  // Determine if current page is swipeable
  const currentSwipeIndex = getSwipeIndexFromPath(pathname || '');
  const isSwipeEnabled = currentSwipeIndex !== null;

  // ---------------------------------------------------------------------------
  // Touch Handlers
  // ---------------------------------------------------------------------------

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isSwipeEnabled || currentSwipeIndex === null) return;

    const touch = e.touches[0];
    const startX = touch.clientX;
    const screenWidth = window.innerWidth;

    // Edge zone exclusion
    if (startX < CONFIG.edgeZone || startX > screenWidth - CONFIG.edgeZone) return;

    // Check if event is already handled
    if (e.defaultPrevented) return;

    // Check if target or ancestor is horizontally scrollable
    const target = e.target as HTMLElement;
    if (target && isHorizontallyScrollable(target)) return;

    // Initialize gesture state
    gestureRef.current = {
      startX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: startX,
      directionLocked: false,
      isHorizontal: null,
      isActive: true,
      targetIndex: null,
      swipeDirection: null,
    };
  }, [isSwipeEnabled, currentSwipeIndex]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.isActive || currentSwipeIndex === null) return;

    const touch = e.touches[0];
    const dx = touch.clientX - gesture.startX;
    const dy = touch.clientY - gesture.startY;

    // Direction lock check
    if (!gesture.directionLocked) {
      const lockResult = checkDirectionLock(dx, dy);
      if (lockResult === 'undecided') return; // Not enough movement yet

      gesture.directionLocked = true;
      gesture.isHorizontal = lockResult === 'horizontal';

      if (!gesture.isHorizontal) {
        // Vertical scroll — abort gesture
        gesture.isActive = false;
        return;
      }
    }

    // If direction is locked to vertical, ignore
    if (!gesture.isHorizontal) return;

    // Prevent vertical scrolling while swiping horizontally
    e.preventDefault();

    // Determine swipe direction: negative deltaX = swipe left (next), positive = swipe right (prev)
    const direction: 'left' | 'right' = dx < 0 ? 'left' : 'right';
    const adjacentIndex = getAdjacentTab(currentSwipeIndex, direction);

    gesture.currentX = touch.clientX;
    gesture.swipeDirection = direction;

    const screenWidth = window.innerWidth;
    let translation: number;

    if (adjacentIndex === null) {
      // At boundary — apply rubber-band effect
      translation = computeRubberBand(dx, screenWidth);
      gesture.targetIndex = null;
      targetTabIndexRef.current = null;
    } else {
      // Normal swipe — apply translation with damping
      translation = computeTranslation(dx, screenWidth);
      gesture.targetIndex = adjacentIndex;
      targetTabIndexRef.current = adjacentIndex;
    }

    // Compute progress (0 to 1)
    const progress = Math.min(Math.abs(translation) / screenWidth, 1);
    progressRef.current = progress;
    isSwipingRef.current = true;

    // Direct DOM manipulation — no React re-renders
    if (currentPaneRef.current) {
      currentPaneRef.current.style.transform = `translateX(${translation}px)`;
    }

    if (previewPaneRef.current && adjacentIndex !== null) {
      // Preview pane slides in from the direction of travel
      const previewOffset = direction === 'left'
        ? screenWidth + translation  // Coming from right
        : -screenWidth + translation; // Coming from left
      previewPaneRef.current.style.transform = `translateX(${previewOffset}px)`;
    }
  }, [currentSwipeIndex]);

  const handleTouchEnd = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture.isActive || !gesture.isHorizontal || currentSwipeIndex === null) {
      // Reset gesture state
      gestureRef.current = createInitialGestureState();
      return;
    }

    const displacement = gesture.currentX - gesture.startX;
    const elapsed = Date.now() - gesture.startTime;
    const velocity = elapsed > 0 ? Math.abs(displacement) / (elapsed / 1000) : 0;
    const decision = computeCommitDecision(displacement, velocity);

    if (decision === 'commit' && gesture.targetIndex !== null) {
      // Commit navigation
      const targetPath = SWIPE_TAB_ORDER[gesture.targetIndex].path;
      const swipeDir = gesture.swipeDirection === 'left' ? 'swipe-left' : 'swipe-right';

      // Set direction before navigation
      setSwipeDirection(swipeDir as 'swipe-left' | 'swipe-right');

      // Reset DOM state (TransitionContainer will handle the actual page transition)
      if (currentPaneRef.current) {
        currentPaneRef.current.style.transform = '';
      }
      if (previewPaneRef.current) {
        previewPaneRef.current.style.transform = 'translateX(100%)';
      }

      // Reset refs
      progressRef.current = 0;
      isSwipingRef.current = false;
      targetTabIndexRef.current = null;

      // Navigate
      router.push(targetPath);
    } else {
      // Cancel — animate snap-back
      if (currentPaneRef.current) {
        currentPaneRef.current.style.transition = `transform ${CONFIG.cancelDuration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
        currentPaneRef.current.style.transform = 'translateX(0)';
      }
      if (previewPaneRef.current) {
        const snapDirection = gesture.swipeDirection === 'left' ? '100%' : '-100%';
        previewPaneRef.current.style.transition = `transform ${CONFIG.cancelDuration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
        previewPaneRef.current.style.transform = `translateX(${snapDirection})`;
      }

      // Remove transition property after animation completes
      setTimeout(() => {
        if (currentPaneRef.current) {
          currentPaneRef.current.style.transition = '';
        }
        if (previewPaneRef.current) {
          previewPaneRef.current.style.transition = '';
        }
        progressRef.current = 0;
        isSwipingRef.current = false;
        targetTabIndexRef.current = null;
      }, CONFIG.cancelDuration);
    }

    // Reset gesture state
    gestureRef.current = createInitialGestureState();
  }, [currentSwipeIndex, router]);

  // ---------------------------------------------------------------------------
  // Event Listener Setup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isSwipeEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSwipeEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    currentPaneRef,
    previewPaneRef,
    progressRef,
    isSwipingRef,
    targetTabIndexRef,
    isSwipeEnabled,
  };
}
