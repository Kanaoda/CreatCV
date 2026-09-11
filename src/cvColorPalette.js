/**
 * CV color override registry — each entry maps to one CSS variable (no shared lumped controls).
 */

export const CV_COLOR_GROUPS = [
  {
    id: 'header',
    label: 'CV header (name, title, contact)',
    fields: [
      { key: 'headText', label: 'Head Text Color', default: '#ffffff', legacy: ['bannerText'] },
      { key: 'bannerBg', label: 'Header Banner Background', default: '#0f172a' },
    ],
  },
  {
    id: 'employment',
    label: 'Employment',
    fields: [
      { key: 'jobTitle', label: 'Job Title Color (default)', default: '#0f172a' },
      { key: 'roleColor', label: 'Role & Location Row', default: '#64748b' },
      { key: 'jobSubtext', label: 'Job Sub-description', default: '#64748b' },
      { key: 'dateColor', label: 'Date / Period', default: '#2563eb' },
    ],
  },
  {
    id: 'sections',
    label: 'Main column sections',
    fields: [
      { key: 'sectionTitle', label: 'Section Heading (Profile, Work, Education)', default: '#0f172a', legacy: ['headerA'] },
      { key: 'sectionDivider', label: 'Section Underline', default: '#2563eb' },
      { key: 'profileText', label: 'Profile Summary Text', default: '#0f172a' },
      { key: 'profileBullet', label: 'Profile Bullet Marker', default: '#2563eb' },
      { key: 'bodyText', label: 'Body / Bullet Text', default: '#334155', legacy: ['text'] },
      { key: 'mutedText', label: 'Muted Text', default: '#64748b', legacy: ['textLight'] },
      { key: 'paperBg', label: 'Paper Background', default: '#ffffff', legacy: ['bg'] },
      { key: 'borderColor', label: 'Borders & Dividers', default: '#e2e8f0' },
    ],
  },
  {
    id: 'projects',
    label: 'Project deliveries',
    fields: [
      { key: 'projectLabel', label: '"Key Project Deliveries" Label', default: '#334155', legacy: ['headerB'] },
      { key: 'projectTitle', label: 'Project Year & Title', default: '#0f172a' },
      { key: 'projectDesc', label: 'Project Description', default: '#334155' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    fields: [
      { key: 'educationDegree', label: 'Degree Line', default: '#0f172a' },
      { key: 'educationSchool', label: 'School Line', default: '#64748b' },
    ],
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    fields: [
      { key: 'sidebarBg', label: 'Sidebar Background', default: '#f8fafc' },
      { key: 'sidebarHeading', label: 'Sidebar Section Heading', default: '#0f172a' },
      { key: 'skillCategory', label: 'Skill Category Name', default: '#334155' },
      { key: 'languageName', label: 'Language Name', default: '#0f172a' },
      { key: 'languageLevel', label: 'Language Level Label', default: '#64748b' },
      { key: 'langBar', label: 'Language Bar Fill', default: '#ea580c' },
      { key: 'skillTagBg', label: 'Skill Tag Background', default: '#f1f5f9', legacy: ['skillBg'] },
      { key: 'skillTagText', label: 'Skill Tag Text', default: '#334155', legacy: ['skillText'] },
      { key: 'certName', label: 'Certification Name', default: '#0f172a' },
      { key: 'certMeta', label: 'Certification Issuer / Date', default: '#64748b' },
      { key: 'certLink', label: 'Certification Link Icon', default: '#2563eb' },
    ],
  },
  {
    id: 'accent',
    label: 'Accent (timeline, links, highlights)',
    fields: [
      { key: 'accent', label: 'General Accent', default: '#2563eb' },
    ],
  },
];

export const ALL_COLOR_KEYS = CV_COLOR_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

const LEGACY_EXPORT_ALIASES = {
  headerA: 'sectionTitle',
  headerB: 'projectLabel',
  text: 'bodyText',
  textLight: 'mutedText',
  bg: 'paperBg',
  skillBg: 'skillTagBg',
  skillText: 'skillTagText',
  bannerText: 'headText',
};

export function resolveColorFromSettings(colors, key) {
  if (!colors) return '';
  if (colors[key]) return colors[key];
  const field = CV_COLOR_GROUPS.flatMap((g) => g.fields).find((f) => f.key === key);
  if (field?.legacy) {
    for (const leg of field.legacy) {
      if (colors[leg]) return colors[leg];
    }
  }
  return '';
}

export function readColorOverridesFromSettings(settings) {
  const colors = settings?.colors || {};
  const out = {};
  for (const key of ALL_COLOR_KEYS) {
    out[key] = resolveColorFromSettings(colors, key);
  }
  return out;
}

export function buildColorsExportPayload(overrides) {
  const colors = { ...overrides };
  for (const [legacy, key] of Object.entries(LEGACY_EXPORT_ALIASES)) {
    if (colors[key]) colors[legacy] = colors[key];
  }
  if (colors.headText) colors.bannerText = colors.headText;
  return colors;
}

/** Maps palette keys → CSS custom properties on .cv-page */
export function buildCvColorCssVars(overrides) {
  const v = (key) => overrides[key] || undefined;
  return {
    '--cv-head-text': v('headText'),
    '--cv-header-bg': v('bannerBg'),
    '--cv-job-title': v('jobTitle'),
    '--cv-role-color': v('roleColor'),
    '--cv-job-subtext': v('jobSubtext'),
    '--cv-date-color': v('dateColor'),
    '--cv-section-title': v('sectionTitle'),
    '--cv-section-divider': v('sectionDivider'),
    '--cv-profile-text': v('profileText'),
    '--cv-profile-bullet': v('profileBullet'),
    '--cv-text': v('bodyText'),
    '--cv-text-light': v('mutedText'),
    '--cv-bg': v('paperBg'),
    '--cv-border': v('borderColor'),
    '--cv-project-label': v('projectLabel'),
    '--cv-project-title': v('projectTitle'),
    '--cv-project-desc': v('projectDesc'),
    '--cv-education-degree': v('educationDegree'),
    '--cv-education-school': v('educationSchool'),
    '--cv-sidebar-bg': v('sidebarBg'),
    '--cv-sidebar-heading': v('sidebarHeading'),
    '--cv-skill-category': v('skillCategory'),
    '--cv-lang-name': v('languageName'),
    '--cv-lang-level': v('languageLevel'),
    '--cv-lang-bar-color': v('langBar'),
    '--cv-skill-bg': v('skillTagBg'),
    '--cv-skill-text': v('skillTagText'),
    '--cv-cert-name': v('certName'),
    '--cv-cert-meta': v('certMeta'),
    '--cv-cert-link': v('certLink'),
    '--cv-accent': v('accent'),
    '--cv-primary': v('sectionTitle'),
    '--cv-secondary': v('projectLabel'),
  };
}

export function hasAnyColorOverride(overrides) {
  return ALL_COLOR_KEYS.some((key) => Boolean(overrides[key]));
}
