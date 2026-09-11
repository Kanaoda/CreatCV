/** In-memory template registry — supports hundreds of entries; future: lazy-load by group */

const _templates = new Map();
let _defaultTemplateId = 'corporate-navy';

export function registerTemplate(definition) {
  if (!definition?.id) {
    throw new Error('Template must have an id');
  }
  _templates.set(definition.id, Object.freeze({ ...definition }));
}

export function registerTemplates(definitions) {
  for (const def of definitions) {
    registerTemplate(def);
  }
}

export function setDefaultTemplateId(id) {
  if (!_templates.has(id)) {
    throw new Error(`Unknown default template: ${id}`);
  }
  _defaultTemplateId = id;
}

export function getTemplate(id) {
  return _templates.get(id) ?? null;
}

export function getTemplateOrDefault(id) {
  return getTemplate(id) ?? getTemplate(_defaultTemplateId);
}

export function getDefaultTemplateId() {
  return _defaultTemplateId;
}

export function listTemplates({ group } = {}) {
  const all = [..._templates.values()];
  if (!group) return all.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return all.filter((t) => t.group === group).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function listTemplateOptions() {
  return listTemplates().map((t) => ({ id: t.id, name: t.name, group: t.group }));
}

export function hasTemplate(id) {
  return _templates.has(id);
}

export function getTemplateCount() {
  return _templates.size;
}
