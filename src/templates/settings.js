import { getDefaultTemplateId, hasTemplate } from './registry.js';

/** Normalize persisted settings — keeps `preset` as legacy alias for `templateId` */
export function normalizeAppSettings(settings = {}) {
  const rawId = settings.templateId ?? settings.preset ?? getDefaultTemplateId();
  const templateId = hasTemplate(rawId) ? rawId : getDefaultTemplateId();

  return {
    ...settings,
    templateId,
    preset: templateId,
    viewMode: settings.viewMode ?? 'detailed',
  };
}

export function readTemplateIdFromSettings(settings) {
  return normalizeAppSettings(settings).templateId;
}

export function buildAppSettingsExport({
  templateId,
  paperTexture,
  fontSizeRatio,
  spacingFactor,
  photoFrameStyle,
  photoScale,
  showSkillRatings,
  colors,
  viewMode,
}) {
  const id = templateId ?? getDefaultTemplateId();
  return {
    templateId: id,
    preset: id,
    paperTexture,
    fontSizeRatio,
    spacingFactor,
    photoFrameStyle,
    photoScale,
    showSkillRatings: Boolean(showSkillRatings),
    colors,
    viewMode: viewMode ?? 'detailed',
  };
}

/** @returns {boolean} */
export function readShowSkillRatingsFromSettings(settings = {}) {
  return settings.showSkillRatings === true;
}
