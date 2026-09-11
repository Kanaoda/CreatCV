import {
  archetypeFromLayoutFamily,
  getLayoutClassForArchetype,
  isSingleColumnArchetype,
  LANG_STYLES,
  PHOTO_PLACEMENT,
} from './constants.js';
import { usesLegacyPreview } from '../layouts/legacy.js';
import { resolveLayoutForTemplate } from '../layouts/resolveLayout.js';
import { getTemplateOrDefault } from './registry.js';
import { buildTemplateThemeCssVars } from './themeCss.js';

/**
 * Resolved runtime view-model for preview + export metadata.
 * @param {string} templateId
 */
export function resolveTemplate(templateId) {
  const template = getTemplateOrDefault(templateId);
  const archetype = template.archetype ?? archetypeFromLayoutFamily(template.layoutFamily);

  const resolved = {
    template,
    templateId: template.id,
    name: template.name,
    group: template.group ?? 'builtin',
    archetype,
    layoutFamily: template.layoutFamily ?? 'classic-sidebar',
    langStyle: template.langStyle ?? LANG_STYLES.SIDEBAR_BAR,
    layoutClass: getLayoutClassForArchetype(archetype),
    singleColumn: isSingleColumnArchetype(archetype),
    photoPlacement: template.photoPlacement ?? PHOTO_PLACEMENT.HEADER,
    photoShape: template.photoShape ?? 'default',
    themeCssVars: buildTemplateThemeCssVars(template.theme),
    usesLegacyPreview: template.legacyPreview === true || usesLegacyPreview(template.id),
  };

  return {
    ...resolved,
    layout: resolveLayoutForTemplate(resolved),
  };
}
