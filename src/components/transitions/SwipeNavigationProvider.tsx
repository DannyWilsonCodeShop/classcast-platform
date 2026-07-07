'use client';

import React, { createContext, useContext } from 'react';
import { useSwipeNavigation, getSwipeIndexFromPath, type SwipeTabConfig } from '@/hooks/useSwipeNavigation';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface SwipeNavigationContextValue {
  progressRef: React.RefObject<number>;
  isSwipingRef: React.RefObject<boolean>;
  targetTabIndexRef: React.RefObject<number | null>;
  currentTabIndex: number;
}

const SwipeNavigationContext = createContext<SwipeNavigationContextValue | null>(null);

export function useSwipeNavigationContext(): SwipeNavigationContextValue | null {
  return useContext(SwipeNavigationContext);
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface SwipeNavigationProviderProps {
  children: React.ReactNode;
  tabOrder?: SwipeTabConfig[];
}

export function SwipeNavigationProvider({ children, tabOrder }: SwipeNavigationProviderProps) {
  const pathname = usePathname();
  const {
    containerRef,
    currentPaneRef,
    previewPaneRef,
    progressRef,
    isSwipingRef,
    targetTabIndexRef,
    isSwipeEnabled,
  } = useSwipeNavigation(tabOrder ? { tabOrder } : undefined);

  const swipeIndex = getSwipeIndexFromPath(pathname || '', tabOrder);
  const currentTabIndex = swipeIndex ?? 0;

  const contextValue: SwipeNavigationContextValue = {
    progressRef,
    isSwipingRef,
    targetTabIndexRef,
    currentTabIndex,
  };

  return (
    <SwipeNavigationContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 overflow-hidden swipe-content-area"
      >
        <div
          ref={currentPaneRef}
          className="h-full overflow-y-auto"
        >
          {children}
        </div>
        <div
          ref={previewPaneRef}
          className="swipe-pane swipe-pane--preview"
          style={{ transform: 'translateX(100%)' }}
        />
      </div>
    </SwipeNavigationContext.Provider>
  );
}
