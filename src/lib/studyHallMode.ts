// Helpers for the "study hall only" shared school account.
// A study-hall-only user (user.studyHallOnly === true) lands on /instructor/study-hall
// and sees a collapsed nav (Study Hall + Profile). They can tap "Full site" to
// temporarily unlock the full instructor portal for the session.

const FULL_SITE_KEY = 'classcast_full_site';

export function isFullSiteEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(FULL_SITE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFullSite(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) sessionStorage.setItem(FULL_SITE_KEY, '1');
    else sessionStorage.removeItem(FULL_SITE_KEY);
  } catch {}
  // Let listeners (sidebar/tabbar) react within the same tab
  try {
    window.dispatchEvent(new CustomEvent('classcast-full-site-change', { detail: { enabled } }));
  } catch {}
}

// True when nav should be collapsed to Study Hall + Profile:
// the account is study-hall-only AND full-site mode is not active.
export function isStudyHallLocked(user: { studyHallOnly?: boolean } | null | undefined): boolean {
  if (!user?.studyHallOnly) return false;
  return !isFullSiteEnabled();
}
