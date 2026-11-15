/**
 * Shared in-app navigation transition. Used by NavigationTransition (link clicks) and
 * useTransitionRouter (router.push/replace/back). Never blocks navigation: the caller
 * navigates immediately; this only holds the browser's snapshot cross-fade open until the
 * new route has rendered (see settleNavigationTransition) or NAV_TRANSITION_CAP_MS passes.
 */
export const NAV_TRANSITION_CAP_MS = 450;

type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => {
    finished: Promise<void>;
    ready: Promise<void>;
    skipTransition: () => void;
  };
};

let pending: (() => void) | null = null;
let active: { skipTransition: () => void } | null = null;

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

/** The student/instructor layouts already animate every in-portal route change (TransitionContainer). */
const inPortal = (path: string) => /^\/(student|instructor)(\/|$)/.test(path);

/** Call from the route-change effect: lets the cross-fade proceed to the new page. */
export function settleNavigationTransition(): void {
  const p = pending;
  pending = null;
  p?.();
}

/** Abort any in-flight transition (bfcache restore, tab hidden). Safe to call anytime. */
export function cancelNavigationTransition(): void {
  settleNavigationTransition();
  try {
    active?.skipTransition();
  } catch {
    /* ignore */
  }
  active = null;
  document.documentElement.removeAttribute('data-nav-fade');
}

/** True when a navigation to `href` (null = unknown target, e.g. back) should animate. */
export function shouldAnimateNavigation(href: string | null): boolean {
  if (typeof window === 'undefined' || reducedMotion()) return false;
  if (document.querySelector('.boot-curtain') || document.visibilityState === 'hidden') return false;
  const here = window.location.pathname;
  if (href === null) return !inPortal(here);
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === here) return false;
    return !(inPortal(here) && inPortal(url.pathname));
  } catch {
    return false;
  }
}

/** Start the transition. Returns immediately; never throws. Call right before navigating. */
export function beginNavigationTransition(): void {
  try {
    if (pending) return; // fast repeated navigation: reuse the one in flight
    const vt = document as VTDocument;
    if (typeof vt.startViewTransition === 'function') {
      let timer = 0;
      const t = vt.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const done = () => {
              window.clearTimeout(timer);
              resolve();
            };
            pending = done;
            timer = window.setTimeout(() => {
              if (pending === done) pending = null;
              resolve();
            }, NAV_TRANSITION_CAP_MS);
          }),
      );
      active = t;
      t.ready.catch(() => {});
      t.finished
        .catch(() => {})
        .finally(() => {
          if (active === t) active = null;
          pending = null;
        });
    } else {
      const root = document.documentElement;
      root.setAttribute('data-nav-fade', '');
      window.setTimeout(() => root.removeAttribute('data-nav-fade'), 260);
    }
  } catch {
    pending = null; // transition could not start: navigate normally
  }
}
