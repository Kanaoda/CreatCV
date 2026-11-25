import { getDefaultTemplateId, hasTemplate } from './registry.js';

/** Normalize persisted settings — keeps `preset` as legacy alias for `templateId` */
export function normalizeAppSettings(settings = {}) {
  const rawId = settings.templateId ?? settings.preset ?? getDefaultTemplateId();
  const templateId = hasTemplate(rawId) ? rawId : getDefaultTemplateId();

  return {
    ...settings,
    templateId,
    preset: templateId,
    viewMode: settings.viewMode ?? 'full-projects',
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
  sidebarSpacingFactor,
  photoFrameStyle,
  photoScale,
  showPhoto,
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
    sidebarSpacingFactor,
    photoFrameStyle,
    photoScale,
    showPhoto: showPhoto !== false,
    showSkillRatings: Boolean(showSkillRatings),
    colors,
    viewMode: viewMode ?? 'full-projects',
  };
}

/** @returns {boolean} — default on (photo shown when present) */
export function readShowPhotoFromSettings(settings = {}) {
  return settings.showPhoto !== false;
}

/** @returns {boolean} */
export function readShowSkillRatingsFromSettings(settings = {}) {
  return settings.showSkillRatings === true;
}
