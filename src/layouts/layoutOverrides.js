/**
 * Per-template tweaks on top of structural layout (preset-specific UX).
 */
export const LAYOUT_TEMPLATE_OVERRIDES = {
  /** Preset 16 — languages as text (skill ratings via user toggle) */
  'rose-quartz': {
    langDisplay: 'text',
  },
  /** Preset 18 — languages as text lines (avoid cramped bars in narrow sidebar) */
  'designer-mustard': {
    langDisplay: 'text',
  },
};

export function applyLayoutTemplateOverrides(layout, templateId) {
  const patch = LAYOUT_TEMPLATE_OVERRIDES[templateId];
  if (!patch) return layout;
  return { ...layout, ...patch };
}
