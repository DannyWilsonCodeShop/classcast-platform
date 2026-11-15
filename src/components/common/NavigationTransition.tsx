'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Cross-fades in-app (client-routed) navigations with the View Transitions API.
 * A capture-phase click listener starts the transition (old page is snapshotted); the
 * transition's update callback stays pending until the pathname changes (or NAV_TIMEOUT_MS),
 * then the browser cross-fades to the new page. Next.js routing itself is untouched.
 * Without the API, a short CSS opacity fade is applied instead. Reduced motion: nothing.
 */
const NAV_TIMEOUT_MS = 800;
type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void>; ready: Promise<void> };
};

export function NavigationTransition() {
  const pathname = usePathname();
  const pendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pendingRef.current?.();
    pendingRef.current = null;
  }, [pathname]);

  useEffect(() => {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reducedQuery.matches || pendingRef.current) return;
      if (document.querySelector('.boot-curtain')) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      const vt = document as VTDocument;
      if (typeof vt.startViewTransition === 'function') {
        let timer = 0;
        const t = vt.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              pendingRef.current = () => {
                window.clearTimeout(timer);
                resolve();
              };
              timer = window.setTimeout(() => {
                pendingRef.current = null;
                resolve();
              }, NAV_TIMEOUT_MS);
            }),
        );
        t.ready.catch(() => {});
        t.finished.catch(() => {}).finally(() => {
          pendingRef.current = null;
        });
      } else {
        const root = document.documentElement;
        root.setAttribute('data-nav-fade', '');
        window.setTimeout(() => root.removeAttribute('data-nav-fade'), 260);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
