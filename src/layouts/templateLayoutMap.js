import { usesLegacyPreview } from './legacy.js';

/**
 * Maps each built-in template → structural layout (Canva-level body/header/refs).
 * Theme colors stay on template.theme; this controls DOM shape only.
 */
export const TEMPLATE_LAYOUT_MAP = {
  'corporate-navy': 'sidebar-accent-right',
  'minimalist-zinc': 'hero-centered',
  'editorial-amber': 'timeline-editorial',
  'bold-ruby': 'sidebar-filled-left',
  'left-sidebar-navy': 'sidebar-filled-left',
  'emerald-botanist': 'header-band-duo',
  'clean-slate-ats': 'ats-minimal',
  'deep-forest-banner': 'header-band-duo',
  'indigo-banner': 'header-band-duo',
  'creative-violet': 'sidebar-filled-left',
  'editorial-left-line': 'timeline-editorial',
  /* modern-tech (preset 12) — excluded; see legacy.js */
  'vintage-terracotta': 'profile-hero-split',
  'corporate-teal': 'sidebar-accent-right',
  'clean-charcoal-left': 'sidebar-filled-left',
  'rose-quartz': 'profile-hero-split',
  'academic-serif-ats': 'ats-minimal',
  'designer-mustard': 'contrast-panel',
  'midnight-slate-banner': 'header-band-duo',
  'olive-minimalist': 'hero-centered',
  'sapphire-executive': 'header-band-duo',
  'cyber-neon': 'dark-banner-left',
  'nordic-frost': 'hero-centered',
  'sunset-gradient': 'header-band-duo',
  'newspaper-column': 'magazine-split',
  'swiss-editorial': 'ats-minimal',
  'lavender-dream': 'sidebar-filled-left',
  'retro-typewriter': 'ats-minimal',
  'cherry-blossom': 'sidebar-filled-left',
  'bamboo-zen': 'sidebar-accent-right',
};

export function getLayoutIdForTemplate(templateId) {
  if (usesLegacyPreview(templateId)) return null;
  return TEMPLATE_LAYOUT_MAP[templateId] ?? 'sidebar-accent-right';
}
