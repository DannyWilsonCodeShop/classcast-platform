'use client';

import { useState, useEffect } from 'react';

interface UseIsWideScreenReturn {
  isWide: boolean;     // >= 768px (tablet+)
  isDesktop: boolean;  // >= 1024px (desktop/landscape iPad)
  isMobile: boolean;   // < 768px
}

/**
 * Reactive viewport width detection hook.
 * SSR-safe: defaults to mobile on the server to avoid hydration mismatch.
 */
export function useIsWideScreen(): UseIsWideScreenReturn {
  const [isWide, setIsWide] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const wideQuery = window.matchMedia('(min-width: 768px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const update = () => {
      setIsWide(wideQuery.matches);
      setIsDesktop(desktopQuery.matches);
    };

    // Set initial values
    update();

    // Listen for changes
    wideQuery.addEventListener('change', update);
    desktopQuery.addEventListener('change', update);

    return () => {
      wideQuery.removeEventListener('change', update);
      desktopQuery.removeEventListener('change', update);
    };
  }, []);

  return {
    isWide,
    isDesktop,
    isMobile: !isWide,
  };
}
