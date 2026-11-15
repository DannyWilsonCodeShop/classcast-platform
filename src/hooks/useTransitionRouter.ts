'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { beginNavigationTransition, shouldAnimateNavigation } from '@/lib/viewTransition';

/**
 * Drop-in replacement for next/navigation's useRouter. push/replace/back/forward start the
 * same cross-fade as link clicks, then navigate immediately (never waits). refresh/prefetch
 * pass through. Identity is stable per underlying router, so it is safe in effect deps.
 */
export function useTransitionRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) => {
        if (shouldAnimateNavigation(args[0])) beginNavigationTransition();
        router.push(...args);
      },
      replace: (...args: Parameters<typeof router.replace>) => {
        if (shouldAnimateNavigation(args[0])) beginNavigationTransition();
        router.replace(...args);
      },
      back: () => {
        if (shouldAnimateNavigation(null)) beginNavigationTransition();
        router.back();
      },
      forward: () => {
        if (shouldAnimateNavigation(null)) beginNavigationTransition();
        router.forward();
      },
    }),
    [router],
  );
}
