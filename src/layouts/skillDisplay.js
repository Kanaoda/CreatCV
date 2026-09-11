import { anySkillHasRatings } from '../cvPreview/skillRatings.js';

/**
 * @param {import('./types.js').LayoutDefinition|null} layout
 * @param {boolean} showSkillRatings — user wants ratings visible when data exists
 * @param {object[]} visibleSkills
 * @returns {'tags'|'list'|'dots'}
 */
export function getEffectiveSkillDisplay(layout, showSkillRatings, visibleSkills = []) {
  const mode = layout?.skills ?? 'tags';
  const wantsDots = showSkillRatings && anySkillHasRatings(visibleSkills);

  if (!wantsDots) {
    if (mode === 'dots') return 'tags';
    return mode;
  }
  return 'dots';
}
