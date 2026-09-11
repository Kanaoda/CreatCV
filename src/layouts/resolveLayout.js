import { LANG_STYLES } from '../templates/constants.js';
import { getLayoutDefinition } from './definitions.js';
import { usesLegacyPreview } from './legacy.js';
import { applyLayoutTemplateOverrides } from './layoutOverrides.js';
import { getLayoutIdForTemplate } from './templateLayoutMap.js';

const LANG_TO_DISPLAY = {
  [LANG_STYLES.SIDEBAR_BAR]: 'bars',
  [LANG_STYLES.TEXT_ONLY]: 'text',
  [LANG_STYLES.THIN_BAR]: 'bars',
  [LANG_STYLES.COMPACT_GRID]: 'text',
  [LANG_STYLES.INLINE_PILL]: 'bars',
  [LANG_STYLES.DOT_SCALE]: 'dots',
};

/**
 * @param {import('../templates/types.js').ResolvedTemplate} resolved
 */
export function resolveLayoutForTemplate(resolved) {
  if (usesLegacyPreview(resolved.templateId) || resolved.template.legacyPreview) {
    return null;
  }
  const layoutId = resolved.template.layoutId ?? getLayoutIdForTemplate(resolved.templateId);
  if (!layoutId) return null;
  const base = getLayoutDefinition(layoutId);
  const langDisplay = base.langDisplay ?? LANG_TO_DISPLAY[resolved.langStyle] ?? 'bars';

  const layout = {
    ...base,
    id: layoutId,
    langDisplay,
    layoutClass: resolved.layoutClass,
    singleColumn: resolved.singleColumn,
    photoPlacement: resolved.photoPlacement,
    photoShape: resolved.photoShape,
  };

  return applyLayoutTemplateOverrides(layout, resolved.templateId);
}
