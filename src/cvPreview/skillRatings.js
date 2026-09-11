import { parseSkillItems } from './helpers.js';

/** 0 = not set (do not show dots on CV) */
export const SKILL_RATING_UNSET = 0;
export const SKILL_RATING_MAX = 5;

export function normalizeSkillItemRatings(itemNames, existingRatings) {
  const ratings = [...(existingRatings || [])].map((r) => {
    const n = Number(r);
    if (!Number.isFinite(n) || n < 1 || n > SKILL_RATING_MAX) return SKILL_RATING_UNSET;
    return Math.round(n);
  });
  while (ratings.length < itemNames.length) ratings.push(SKILL_RATING_UNSET);
  return ratings.slice(0, itemNames.length);
}

/** @returns {{ name: string, rating: number }[]} */
export function getSkillEntries(skill) {
  const names = parseSkillItems(skill);
  const ratings = normalizeSkillItemRatings(names, skill.itemRatings);
  return names.map((name, i) => ({ name, rating: ratings[i] ?? SKILL_RATING_UNSET }));
}

export function skillCategoryHasRatings(skill) {
  return getSkillEntries(skill).some((e) => e.rating >= 1 && e.rating <= SKILL_RATING_MAX);
}

export function anySkillHasRatings(skills) {
  return (skills || []).some(skillCategoryHasRatings);
}

/** @returns {string|null} five-dot string or null if unset */
export function formatSkillDots(rating) {
  const r = Math.round(Number(rating) || 0);
  if (r < 1 || r > SKILL_RATING_MAX) return null;
  return '●'.repeat(r) + '○'.repeat(SKILL_RATING_MAX - r);
}
