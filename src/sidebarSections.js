import { visibleItems } from './visibility.js';

/** Stable default skill-section ids (also used in layout sidebarOrder) */
export const SKILL_SECTION_CORE = 'coreCompetencies';
export const SKILL_SECTION_TOOLS = 'toolsDelivery';

export const DEFAULT_SKILL_SECTION_DEFS = [
  { id: SKILL_SECTION_CORE, title: 'Core Competencies' },
  { id: SKILL_SECTION_TOOLS, title: 'Tools & Delivery' },
];

const LEGACY_KIND_TO_SECTION = {
  coreCompliance: SKILL_SECTION_CORE,
  coreCompetencies: SKILL_SECTION_CORE,
  toolsDelivery: SKILL_SECTION_TOOLS,
};

const FIXED_SIDEBAR_KEYS = ['languages', 'certifications'];

/** @deprecated kept for older imports — prefer DEFAULT_SKILL_SECTION_DEFS */
export const SKILL_KIND_CORE = SKILL_SECTION_CORE;
export const SKILL_KIND_TOOLS = SKILL_SECTION_TOOLS;
export const SKILL_KIND_META = {
  [SKILL_SECTION_CORE]: { category: 'Core Competencies', label: 'Core Competencies' },
  [SKILL_SECTION_TOOLS]: { category: 'Tools & Delivery', label: 'Tools & Delivery' },
};

export function createEmptySkillCategory(idSuffix = Date.now()) {
  return {
    id: `skillcat_${idSuffix}`,
    category: 'Category',
    items: [],
    itemsText: '',
    itemRatings: [],
    visible: true,
  };
}

export function createEmptySkillSection(title = 'New Section', idSuffix = Date.now()) {
  return {
    id: `skillsec_${idSuffix}`,
    title,
    visible: true,
    categories: [createEmptySkillCategory(idSuffix)],
  };
}

function normalizeCategoryShape(cat, i, idPrefix) {
  const itemsText = cat.itemsText ?? (cat.items || []).join(', ');
  const items = String(itemsText)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    ...cat,
    id: cat.id || `${idPrefix}_${i}`,
    category: cat.category ?? 'Category',
    items,
    itemsText,
    itemRatings: Array.isArray(cat.itemRatings) ? cat.itemRatings : [],
    visible: cat.visible !== false,
  };
}

function inferSectionIdFromLegacySkill(skill, fallbackIndex) {
  if (skill?.sectionId && typeof skill.sectionId === 'string') return skill.sectionId;
  if (skill?.kind && LEGACY_KIND_TO_SECTION[skill.kind]) {
    return LEGACY_KIND_TO_SECTION[skill.kind];
  }
  const cat = String(skill?.category || '').toLowerCase();
  if (cat.includes('core') || cat.includes('compliance') || cat.includes('competenc')) {
    return SKILL_SECTION_CORE;
  }
  if (cat.includes('tool') || cat.includes('delivery') || cat.includes('tech')) {
    return SKILL_SECTION_TOOLS;
  }
  return DEFAULT_SKILL_SECTION_DEFS[Math.min(fallbackIndex, DEFAULT_SKILL_SECTION_DEFS.length - 1)].id;
}

function titleForSectionId(id) {
  const def = DEFAULT_SKILL_SECTION_DEFS.find((d) => d.id === id);
  return def?.title || 'Skills';
}

function isSectionTitlePlaceholder(title) {
  const t = String(title || '').trim();
  return !t
    || /^\[.*\]$/.test(t)
    || /core skills category|core compliance|tools\s*&\s*technologies|tools\s*&\s*delivery method/i.test(t);
}

/** Migrate flat skills[] (with optional kind) → skillSections[] */
export function migrateSkillsToSections(skills = []) {
  if (!skills.length) {
    return DEFAULT_SKILL_SECTION_DEFS.map((def, i) => ({
      id: def.id,
      title: def.title,
      visible: true,
      categories: [createEmptySkillCategory(i)],
    }));
  }

  const byId = new Map();
  let fallbackIndex = 0;

  for (const skill of skills) {
    const sectionId = inferSectionIdFromLegacySkill(skill, fallbackIndex);
    fallbackIndex += 1;
    if (!byId.has(sectionId)) {
      const rawTitle = skill.sectionTitle || skill.kindTitle;
      byId.set(sectionId, {
        id: sectionId,
        title: isSectionTitlePlaceholder(rawTitle)
          ? titleForSectionId(sectionId)
          : rawTitle,
        visible: true,
        categories: [],
      });
    }
    const section = byId.get(sectionId);
    const catTitle = skill.category || 'Category';
    const looksLikeSectionTitle = isSectionTitlePlaceholder(catTitle)
      || catTitle === section.title
      || /^(core compliance|core competencies|tools\s*&\s*delivery( method)?)$/i.test(catTitle.trim());

    section.categories.push(
      normalizeCategoryShape(
        {
          ...skill,
          category: looksLikeSectionTitle ? 'Category' : catTitle,
          kind: undefined,
          sectionId: undefined,
        },
        section.categories.length,
        `skill_${sectionId}`,
      ),
    );
  }

  // Ensure default sections exist (even if empty)
  for (const def of DEFAULT_SKILL_SECTION_DEFS) {
    if (!byId.has(def.id)) {
      byId.set(def.id, {
        id: def.id,
        title: def.title,
        visible: true,
        categories: [createEmptySkillCategory(def.id)],
      });
    } else {
      const sec = byId.get(def.id);
      if (isSectionTitlePlaceholder(sec.title)) sec.title = def.title;
    }
  }

  const ordered = [];
  for (const def of DEFAULT_SKILL_SECTION_DEFS) {
    ordered.push(byId.get(def.id));
    byId.delete(def.id);
  }
  for (const sec of byId.values()) ordered.push(sec);
  return ordered;
}

export function normalizeSkillSections(raw) {
  if (Array.isArray(raw?.skillSections) && raw.skillSections.length > 0) {
    return raw.skillSections.map((sec, i) => {
      const id = sec.id || `skillsec_${i}`;
      let title = sec.title || 'Skills';
      if (id === SKILL_SECTION_TOOLS && /tools\s*&\s*delivery\s*methods?/i.test(String(title).trim())) {
        title = 'Tools & Delivery';
      }
      if (id === SKILL_SECTION_CORE && /^core compliance$/i.test(String(title).trim())) {
        title = 'Core Competencies';
      }
      return {
        id,
        title,
        visible: sec.visible !== false,
        categories: (sec.categories || []).map((cat, j) =>
          normalizeCategoryShape(cat, j, `skill_${id}`),
        ),
      };
    }).map((sec) => ({
      ...sec,
      categories: sec.categories.length > 0
        ? sec.categories
        : [createEmptySkillCategory(sec.id)],
    }));
  }
  return migrateSkillsToSections(raw?.skills || []);
}

/** Flat list of categories (for ratings / display helpers) */
export function flattenSkillCategories(skillSections = []) {
  return skillSections.flatMap((sec) => sec.categories || []);
}

export function findSkillSection(skillSections, sectionId) {
  return (skillSections || []).find((s) => s.id === sectionId) || null;
}

export function findSkillSectionIndex(skillSections, sectionId) {
  return (skillSections || []).findIndex((s) => s.id === sectionId);
}

export function mapLegacyOrderKey(key) {
  if (key === 'coreCompliance') return SKILL_SECTION_CORE;
  if (key === 'skills') return null;
  return key;
}

export function defaultSidebarSectionOrder(skillSections = []) {
  const skillIds = skillSections.map((s) => s.id);
  return ['languages', ...skillIds, 'certifications'];
}

export function normalizeSidebarSectionOrder(order, skillSections = []) {
  const skillIds = skillSections.map((s) => s.id);
  const defaults = defaultSidebarSectionOrder(skillSections);
  const allowed = new Set([...FIXED_SIDEBAR_KEYS, ...skillIds]);

  const seen = new Set();
  const result = [];

  const source = Array.isArray(order) && order.length > 0 ? order : defaults;
  for (const rawKey of source) {
    if (rawKey === 'skills') {
      for (const id of skillIds) {
        if (!seen.has(id)) {
          result.push(id);
          seen.add(id);
        }
      }
      continue;
    }
    const key = mapLegacyOrderKey(rawKey);
    if (!key || !allowed.has(key) || seen.has(key)) continue;
    result.push(key);
    seen.add(key);
  }

  for (const key of defaults) {
    if (!seen.has(key)) result.push(key);
  }
  return result;
}

export function expandSkillsInOrder(order = [], skillSections = []) {
  const skillIds = skillSections.map((s) => s.id);
  const result = [];
  for (const rawKey of order) {
    if (rawKey === 'skills') {
      result.push(...skillIds);
      continue;
    }
    const key = mapLegacyOrderKey(rawKey);
    if (key) result.push(key);
  }
  return result;
}

export function isSidebarSortableKey(key, skillSections = []) {
  if (FIXED_SIDEBAR_KEYS.includes(key)) return true;
  return (skillSections || []).some((s) => s.id === key);
}

/**
 * Merge layout order (photo, contact, …) with user-controlled section order.
 */
export function resolveSidebarOrder(layoutOrder, userOrder, skillSections = []) {
  const layout = expandSkillsInOrder(layoutOrder || [], skillSections);
  const user = normalizeSidebarSectionOrder(userOrder, skillSections);
  const result = [];
  let injected = false;

  for (const key of layout) {
    if (isSidebarSortableKey(key, skillSections)) {
      if (!injected) {
        result.push(...user);
        injected = true;
      }
    } else {
      result.push(key);
    }
  }

  if (!injected) result.push(...user);
  return result;
}

export function resolveMainOrder(mainOrder = [], skillSections = []) {
  return expandSkillsInOrder(mainOrder, skillSections);
}

export function isSkillSectionVisible(sections, section) {
  if (!section) return false;
  if (section.visible === false) return false;
  if (!sections) return true;
  if (sections[section.id] === false) return false;
  if (sections[section.id] === true) return true;
  // Legacy toggles
  if (section.id === SKILL_SECTION_CORE && sections.coreCompliance === false) return false;
  if (sections.skills === false) return false;
  return true;
}

export function getVisibleSkillCategories(section) {
  return visibleItems(section?.categories || []);
}

export function sectionHasVisibleContent(section) {
  return getVisibleSkillCategories(section).some((cat) => {
    const text = cat.itemsText ?? (cat.items || []).join(', ');
    return String(text).split(',').some((t) => t.trim());
  });
}

export function sidebarSectionLabel(key, skillSections = []) {
  if (key === 'languages') return 'Languages';
  if (key === 'certifications') return 'Certificates';
  const sec = findSkillSection(skillSections, key);
  if (sec) return sec.title || 'Skills';
  if (key === 'coreCompliance') return 'Core Competencies';
  return key;
}

/** @deprecated */
export function ensureSkillKinds(skills = []) {
  return flattenSkillCategories(migrateSkillsToSections(skills));
}

/** @deprecated */
export function findSkillByKind(skills, kind) {
  const id = mapLegacyOrderKey(kind) || kind;
  const sections = migrateSkillsToSections(skills);
  const sec = findSkillSection(sections, id);
  return sec?.categories?.[0] || null;
}

/** @deprecated */
export function findSkillIndexByKind(skills, kind) {
  const id = mapLegacyOrderKey(kind) || kind;
  return (skills || []).findIndex((s) => {
    const sid = inferSectionIdFromLegacySkill(s, 0);
    return sid === id;
  });
}

/** @deprecated */
export function isSkillKindSectionVisible(sections, kind) {
  const id = mapLegacyOrderKey(kind) || kind;
  return isSkillSectionVisible(sections, { id, visible: true });
}
