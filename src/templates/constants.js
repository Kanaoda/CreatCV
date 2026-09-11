/**
 * Physical layout archetypes — control column order and document flow.
 * Decorative styling uses layoutFamily (data-layout-family) separately.
 */
export const TEMPLATE_ARCHETYPES = {
  SIDEBAR_RIGHT: 'sidebar-right',
  SIDEBAR_LEFT: 'sidebar-left',
  SINGLE_COLUMN: 'single-column',
};

export const LANG_STYLES = {
  SIDEBAR_BAR: 'sidebar-bar',
  TEXT_ONLY: 'text-only',
  THIN_BAR: 'thin-bar',
  COMPACT_GRID: 'compact-grid',
  INLINE_PILL: 'inline-pill',
  DOT_SCALE: 'dot-scale',
};

export const PHOTO_PLACEMENT = {
  HEADER: 'header',
  SIDEBAR: 'sidebar',
};

export const PHOTO_SHAPES = {
  DEFAULT: 'default',
  CIRCLE: 'circle',
  ARCH: 'arch',
  ROUNDED: 'rounded',
  SQUARE: 'square',
};

/** Maps legacy layoutFamily → physical archetype */
export const LAYOUT_FAMILY_TO_ARCHETYPE = {
  'classic-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'centered-minimal': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'editorial-warm': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'bold-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'accent-stripe': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'banner-hero': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'banner-photo': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'pill-labels': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'timeline-editorial': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'tech-grid': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'soft-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'publisher-mix': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'contrast-panel': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'airy-clean': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'executive-strip': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'floating-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'art-deco-frame': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'nordic-frame': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'gradient-wave': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'card-stack': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'split-hero': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'ribbon-header': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'industrial-card': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'mosaic-header': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
  'sidebar-left': TEMPLATE_ARCHETYPES.SIDEBAR_LEFT,
  'neon-dark-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_LEFT,
  'wave-sidebar': TEMPLATE_ARCHETYPES.SIDEBAR_LEFT,
  'circle-accent': TEMPLATE_ARCHETYPES.SIDEBAR_LEFT,
  'single-flow': TEMPLATE_ARCHETYPES.SINGLE_COLUMN,
  'magazine-columns': TEMPLATE_ARCHETYPES.SINGLE_COLUMN,
  'swiss-grid': TEMPLATE_ARCHETYPES.SINGLE_COLUMN,
  'mono-typewriter': TEMPLATE_ARCHETYPES.SINGLE_COLUMN,
  'zen-minimal': TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT,
};

export function archetypeFromLayoutFamily(layoutFamily) {
  return LAYOUT_FAMILY_TO_ARCHETYPE[layoutFamily] ?? TEMPLATE_ARCHETYPES.SIDEBAR_RIGHT;
}

export function getLayoutClassForArchetype(archetype) {
  if (archetype === TEMPLATE_ARCHETYPES.SINGLE_COLUMN) return 'layout-direction-block';
  if (archetype === TEMPLATE_ARCHETYPES.SIDEBAR_LEFT) return 'layout-direction-reverse';
  return '';
}

export function isSingleColumnArchetype(archetype) {
  return archetype === TEMPLATE_ARCHETYPES.SINGLE_COLUMN;
}
