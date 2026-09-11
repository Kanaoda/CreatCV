/**
 * Built-in template catalog (metadata).
 * Theme tokens live in themes.generated.js (from CSS via scripts/extract-preset-themes.mjs).
 */
import { LANG_STYLES, PHOTO_PLACEMENT, PHOTO_SHAPES } from '../../constants.js';

const S = LANG_STYLES;
const P = PHOTO_PLACEMENT;
const F = PHOTO_SHAPES;

/** @type {import('../../types.js').TemplateDefinitionInput[]} */
export const BUILTIN_CATALOG = [
  { id: 'corporate-navy', name: '1. Corporate Navy (Classic 2-Col)', sortOrder: 1, layoutFamily: 'classic-sidebar', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER, photoShape: F.CIRCLE },
  { id: 'minimalist-zinc', name: '2. Minimalist Zinc (Ultra Clean)', sortOrder: 2, layoutFamily: 'centered-minimal', langStyle: S.TEXT_ONLY, photoPlacement: P.HEADER, photoShape: F.ROUNDED },
  { id: 'editorial-amber', name: '3. Editorial Amber (Warm Bookshop)', sortOrder: 3, layoutFamily: 'editorial-warm', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER, photoShape: F.ARCH },
  { id: 'bold-ruby', name: '4. Bold Ruby (Creative Montserrat)', sortOrder: 4, layoutFamily: 'bold-sidebar', langStyle: S.SIDEBAR_BAR, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE },
  { id: 'left-sidebar-navy', name: '5. Navy Flip Side (Sidebar Left)', sortOrder: 5, layoutFamily: 'sidebar-left', langStyle: S.SIDEBAR_BAR, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE },
  { id: 'emerald-botanist', name: '6. Emerald Botanist (Ivory Paper)', sortOrder: 6, layoutFamily: 'accent-stripe', langStyle: S.THIN_BAR, photoPlacement: P.HEADER },
  { id: 'clean-slate-ats', name: '7. Clean Slate (ATS Single Column)', sortOrder: 7, layoutFamily: 'single-flow', langStyle: S.COMPACT_GRID, photoPlacement: P.HEADER, photoShape: F.ROUNDED },
  { id: 'indigo-banner', name: '8. Royal Indigo (Modern Header Block)', sortOrder: 8, layoutFamily: 'banner-photo', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER },
  { id: 'creative-violet', name: '9. Creative Violet (Lavender Sidebar)', sortOrder: 9, layoutFamily: 'pill-labels', langStyle: S.INLINE_PILL, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE },
  { id: 'editorial-left-line', name: '10. Editorial Border Line (Design List)', sortOrder: 10, layoutFamily: 'timeline-editorial', langStyle: S.THIN_BAR, photoPlacement: P.HEADER },
  { id: 'modern-tech', name: '11. Modern Tech (Teal Work Sans)', sortOrder: 11, layoutFamily: 'tech-grid', langStyle: S.DOT_SCALE, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE, legacyPreview: true },
  { id: 'vintage-terracotta', name: '12. Terracotta Lora (Warm Clay)', sortOrder: 12, layoutFamily: 'editorial-warm', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER, photoShape: F.ARCH },
  { id: 'corporate-teal', name: '13. Corporate Teal (Clean Sidebar)', sortOrder: 13, layoutFamily: 'soft-sidebar', langStyle: S.SIDEBAR_BAR, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE },
  { id: 'clean-charcoal-left', name: '14. Slate Charcoal (Reverse Clean)', sortOrder: 14, layoutFamily: 'sidebar-left', langStyle: S.SIDEBAR_BAR, photoPlacement: P.SIDEBAR, photoShape: F.CIRCLE },
  { id: 'rose-quartz', name: '15. Rose Quartz (Design Publisher)', sortOrder: 15, layoutFamily: 'publisher-mix', langStyle: S.TEXT_ONLY, photoPlacement: P.HEADER },
  { id: 'academic-serif-ats', name: '16. Academic Serif (Monologue Single)', sortOrder: 16, layoutFamily: 'single-flow', langStyle: S.COMPACT_GRID, photoPlacement: P.HEADER, photoShape: F.ROUNDED },
  { id: 'designer-mustard', name: '17. Designer Mustard (Contrast Yellow)', sortOrder: 17, layoutFamily: 'contrast-panel', langStyle: S.INLINE_PILL, photoPlacement: P.HEADER, photoShape: F.ROUNDED },
  { id: 'midnight-slate-banner', name: '18. Midnight Slate (Dark Banner)', sortOrder: 18, layoutFamily: 'banner-photo', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER },
  { id: 'olive-minimalist', name: '19. Olive Garden (Fresh Clean)', sortOrder: 19, layoutFamily: 'airy-clean', langStyle: S.TEXT_ONLY, photoPlacement: P.HEADER },
  { id: 'sapphire-executive', name: '20. Sapphire Executive (Gold Strip Boardroom)', sortOrder: 20, layoutFamily: 'executive-strip', langStyle: S.THIN_BAR, photoPlacement: P.HEADER },
  { id: 'cyber-neon', name: '21. Cyber Neon (Dark Sidebar Circuit)', sortOrder: 21, layoutFamily: 'neon-dark-sidebar', langStyle: S.DOT_SCALE, photoPlacement: P.SIDEBAR },
  { id: 'nordic-frost', name: '22. Nordic Frost (Ice Frame Minimal)', sortOrder: 22, layoutFamily: 'nordic-frame', langStyle: S.TEXT_ONLY, photoPlacement: P.SIDEBAR },
  { id: 'sunset-gradient', name: '23. Sunset Gradient (Warm Wave Header)', sortOrder: 23, layoutFamily: 'gradient-wave', langStyle: S.SIDEBAR_BAR, photoPlacement: P.HEADER },
  { id: 'newspaper-column', name: '24. Newspaper Column (Editorial Flow)', sortOrder: 24, layoutFamily: 'magazine-columns', langStyle: S.COMPACT_GRID, photoPlacement: P.HEADER },
  { id: 'swiss-editorial', name: '25. Swiss Editorial (Strict Grid)', sortOrder: 25, layoutFamily: 'swiss-grid', langStyle: S.TEXT_ONLY, photoPlacement: P.HEADER },
  { id: 'lavender-dream', name: '26. Lavender Dream (Soft Curve Sidebar)', sortOrder: 26, layoutFamily: 'wave-sidebar', langStyle: S.INLINE_PILL, photoPlacement: P.SIDEBAR },
  { id: 'retro-typewriter', name: '27. Retro Typewriter (Mono Classic)', sortOrder: 27, layoutFamily: 'mono-typewriter', langStyle: S.COMPACT_GRID, photoPlacement: P.HEADER },
  { id: 'cherry-blossom', name: '28. Cherry Blossom (Circle Accent Left)', sortOrder: 28, layoutFamily: 'circle-accent', langStyle: S.THIN_BAR, photoPlacement: P.SIDEBAR },
  { id: 'bamboo-zen', name: '29. Bamboo Zen (Serene Horizontal)', sortOrder: 29, layoutFamily: 'zen-minimal', langStyle: S.TEXT_ONLY, photoPlacement: P.SIDEBAR },
];
