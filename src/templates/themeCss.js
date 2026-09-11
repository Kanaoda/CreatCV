/**
 * Maps template.theme tokens → CSS custom properties on .cv-page.
 * User color overrides (buildCvColorCssVars) merge on top with higher priority in preview.
 */

const THEME_TO_CSS = {
  fontTitle: '--cv-font-title',
  fontBody: '--cv-font-body',
  bg: '--cv-bg',
  sidebarBg: '--cv-sidebar-bg',
  primary: '--cv-primary',
  secondary: '--cv-secondary',
  accent: '--cv-accent',
  text: '--cv-text',
  textLight: '--cv-text-light',
  border: '--cv-border',
  sidebarWidth: '--cv-sidebar-width',
  headerBg: '--cv-header-bg',
  headerColor: '--cv-header-color',
  sidebarPrimary: '--cv-sidebar-primary',
};

/** Strip empty entries so user overrides can show through */
export function buildTemplateThemeCssVars(theme) {
  if (!theme) return {};
  const out = {};
  for (const [key, cssVar] of Object.entries(THEME_TO_CSS)) {
    const value = theme[key];
    if (value != null && String(value).trim() !== '') {
      out[cssVar] = value;
    }
  }
  return out;
}
