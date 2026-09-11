/**
 * CV Template system — public API
 *
 * Add templates: registerTemplate() or drop a file under definitions/ and import at startup.
 * Hundreds of templates: split definitions by group, lazy import(), or load JSON from /public/templates/.
 */

import './definitions/builtin/index.js';

export {
  TEMPLATE_ARCHETYPES,
  LANG_STYLES,
  PHOTO_PLACEMENT,
  PHOTO_SHAPES,
  archetypeFromLayoutFamily,
  getLayoutClassForArchetype,
  isSingleColumnArchetype,
} from './constants.js';

export {
  registerTemplate,
  registerTemplates,
  setDefaultTemplateId,
  getTemplate,
  getTemplateOrDefault,
  getDefaultTemplateId,
  listTemplates,
  listTemplateOptions,
  hasTemplate,
  getTemplateCount,
} from './registry.js';

export { resolveTemplate } from './resolveTemplate.js';
export { buildTemplateThemeCssVars } from './themeCss.js';
export {
  normalizeAppSettings,
  readTemplateIdFromSettings,
  readShowSkillRatingsFromSettings,
  buildAppSettingsExport,
} from './settings.js';
