'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getSchoolTheme, SchoolTheme } from '@/lib/school-theme';

/**
 * Hook that returns the color theme for the current user's school.
 * Use this to apply school-specific colors to buttons, headers, etc.
 *
 * Usage:
 *   const theme = useSchoolTheme();
 *   <button style={{ backgroundColor: theme.primary }}>...</button>
 */
export function useSchoolTheme(): SchoolTheme {
  const { user } = useAuth();
  return getSchoolTheme(user?.schoolName);
}
