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

export function parseSkillItems(skill) {
  const text = skill.itemsText != null ? skill.itemsText : (skill.items || []).join(', ');
  return text.split(',').map((item) => item.trim()).filter(Boolean);
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
