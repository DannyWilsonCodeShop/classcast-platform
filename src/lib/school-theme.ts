/**
 * School-specific color themes for ClassCast.
 * Colors are derived from the user's schoolName field.
 */

export interface SchoolTheme {
  primary: string;       // Main brand color (buttons, headers, links)
  primaryHover: string;  // Hover state for primary
  accent: string;        // Accent/CTA color (create buttons, highlights)
  accentText: string;    // Text color on accent background
  primaryLight: string;  // Light tint for backgrounds (10% opacity equivalent)
}

const THEMES: Record<string, SchoolTheme> = {
  // Drew Charter School — green/gold
  'Drew Charter School': {
    primary: '#005741',
    primaryHover: '#004433',
    accent: '#837729',
    accentText: '#fffeff',
    primaryLight: '#005741/10',
  },
  // Default ClassCast / Cristo Rey / Demo — blue/gold
  default: {
    primary: '#005587',
    primaryHover: '#004470',
    accent: '#FFC72C',
    accentText: '#005587',
    primaryLight: '#005587/10',
  },
};

/**
 * Get the color theme for a given school name.
 * Falls back to the default ClassCast theme if no match.
 */
export function getSchoolTheme(schoolName?: string): SchoolTheme {
  if (!schoolName) return THEMES.default;
  return THEMES[schoolName] || THEMES.default;
}

/**
 * CSS custom properties for the theme — can be applied to a root element.
 */
export function getThemeCSSVars(theme: SchoolTheme): Record<string, string> {
  return {
    '--theme-primary': theme.primary,
    '--theme-primary-hover': theme.primaryHover,
    '--theme-accent': theme.accent,
    '--theme-accent-text': theme.accentText,
  };
}
