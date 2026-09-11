/**
 * Templates that must keep the original preview DOM + CSS path (no layout engine).
 * Preset 12 — Modern Tech — user production template; do not change structure.
 */
export const LEGACY_PREVIEW_TEMPLATE_IDS = new Set(['modern-tech']);

export function usesLegacyPreview(templateId) {
  return LEGACY_PREVIEW_TEMPLATE_IDS.has(templateId);
}
