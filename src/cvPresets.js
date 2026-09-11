/**
 * @deprecated Import from `./templates` instead.
 */
import {
  listTemplateOptions,
  resolveTemplate,
  getLayoutClassForArchetype,
  isSingleColumnArchetype,
} from './templates/index.js';

export const CANVA_PRESETS = listTemplateOptions().map((o) => ({ id: o.id, name: o.name }));

export function getLayoutClass(templateId) {
  return resolveTemplate(templateId).layoutClass;
}

export function isSingleFlowLayout(templateId) {
  return resolveTemplate(templateId).singleColumn;
}

export function getLayoutFamily(templateId) {
  return resolveTemplate(templateId).layoutFamily;
}

export function getLangStyle(templateId) {
  return resolveTemplate(templateId).langStyle;
}

export { resolveTemplate, listTemplateOptions };
