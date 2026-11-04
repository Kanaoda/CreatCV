export const cleanProfilePoint = (text) => text.replace(/^[\s•*\-–—]+/, '').trim();

export function getProfilePoints(summary) {
  if (!summary?.trim()) return [];
  if (summary.includes('\n')) {
    return summary.split(/\n+/).map(cleanProfilePoint).filter(Boolean);
  }
  return summary
    .split(/(?<=[.!?。！？])\s+/)
    .map(cleanProfilePoint)
    .filter(Boolean);
}

export function cleanProjectTitle(title, year) {
  const t = (title || '').trim();
  const y = (year || '').trim();
  if (!t) return '';
  if (y && t.startsWith(y)) return t.slice(y.length).replace(/^[\s—–-]+/, '').trim() || t;
  return t;
}

/** Join skill tags for storage / editor (`itemsText`). */
export function formatSkillItemsText(items = []) {
  return (items || []).map((item) => String(item).trim()).filter(Boolean).join('; ');
}

/** Split skill tags — delimiter is `;` (commas may appear inside a tag). */
export function parseSkillItemsText(text) {
  return String(text ?? '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Normalize `itemsText` using `;` only as the tag separator.
 * Commas stay inside a tag (e.g. "Slack, MS Office, Teams" = one line).
 */
export function normalizeSkillItemsText(itemsText, items) {
  if (itemsText != null && String(itemsText).trim() !== '') {
    return formatSkillItemsText(parseSkillItemsText(itemsText));
  }
  return formatSkillItemsText(items || []);
}

export function parseSkillItems(skill) {
  if (skill?.itemsText != null) return parseSkillItemsText(skill.itemsText);
  return (skill?.items || []).map((item) => String(item).trim()).filter(Boolean);
}

export function getLanguagePercentage(level) {
  const map = {
    Native: '100%',
    Fluent: '95%',
    Advanced: '85%',
    Professional: '80%',
    Conversational: '65%',
    Intermediate: '55%',
    Basic: '48%',
    Elementary: '35%',
  };
  return map[level] || '50%';
}
