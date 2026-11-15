'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  beginNavigationTransition,
  cancelNavigationTransition,
  settleNavigationTransition,
  shouldAnimateNavigation,
} from '@/lib/viewTransition';

/**
 * Cross-fades in-app navigations. A capture-phase click listener covers <a> clicks;
 * useTransitionRouter covers router.push/replace/back. Both use src/lib/viewTransition.ts.
 * Next.js routing itself is never intercepted or delayed.
 */
export function NavigationTransition() {
  const pathname = usePathname();

  useEffect(() => {
    settleNavigationTransition();
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      if (!shouldAnimateNavigation(a.href)) return;
      beginNavigationTransition();
    };
    // bfcache restore or tab hidden: never leave a snapshot overlay stuck.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) cancelNavigationTransition();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cancelNavigationTransition();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
