/** Item is shown on CV when visible is not explicitly false */
export function isVisible(item) {
  return item != null && item.visible !== false;
}

export function visibleItems(list) {
  return (list || []).filter(isVisible);
}

export function toggleVisibleFlag(current) {
  return current === false;
}

export const DEFAULT_SECTION_VISIBILITY = {
  profile: true,
  employment: true,
  education: true,
  references: true,
  availability: true,
  languages: true,
  skills: true,
  certifications: true,
  sabbatical: true,
};

export const DEFAULT_AVAILABILITY = {
  lastSalary: '',
  lastSalaryVisible: true,
  expectedSalary: '',
  expectedSalaryVisible: true,
  noticePeriod: '',
  noticePeriodVisible: true,
  availableFrom: '',
  availableFromVisible: true,
};

export function isSectionVisible(sections, key) {
  if (!sections) return true;
  return sections[key] !== false;
}

export function normalizeBullet(bullet, index, idPrefix = 'bullet') {
  if (typeof bullet === 'string') {
    return { id: `${idPrefix}_${index}`, text: bullet, visible: true };
  }
  return {
    id: bullet.id || `${idPrefix}_${index}`,
    text: bullet.text ?? '',
    visible: bullet.visible !== false,
  };
}

export function normalizeBullets(bullets, idPrefix = 'bullet') {
  return (bullets || []).map((b, i) => normalizeBullet(b, i, idPrefix));
}

export function bulletText(bullet) {
  return typeof bullet === 'string' ? bullet : (bullet.text ?? '');
}

export function visibleBullets(bullets) {
  return normalizeBullets(bullets).filter(isVisible);
}

/** Immutably update a bullet's text at `index`, normalising string bullets in place. */
export function patchBulletText(bullets, index, value, idPrefix = 'bullet') {
  const result = [...bullets];
  result[index] = { ...normalizeBullet(result[index], index, idPrefix), text: value };
  return result;
}

/** Immutably update a bullet's visibility at `index`, normalising string bullets in place. */
export function patchBulletVisible(bullets, index, visible, idPrefix = 'bullet') {
  const result = [...bullets];
  result[index] = { ...normalizeBullet(result[index], index, idPrefix), visible };
  return result;
}
