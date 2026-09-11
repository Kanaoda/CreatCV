/** Typography scale (%) — stored as e.g. "100%" in settings export */
export const TYPO_SCALE_MIN = 80;
export const TYPO_SCALE_MAX = 130;
export const TYPO_SCALE_STEP = 1;

/** Line spacing multiplier — stored as decimal string e.g. "1.15" */
export const LINE_SPACING_MIN = 0.6;
export const LINE_SPACING_MAX = 1.5;
export const LINE_SPACING_STEP = 0.01;

export function parseTypoPercent(value) {
  const n = parseInt(String(value ?? '').replace('%', '').trim(), 10);
  if (!Number.isFinite(n)) return 100;
  return Math.min(TYPO_SCALE_MAX, Math.max(TYPO_SCALE_MIN, n));
}

export function formatTypoPercent(percent) {
  return `${parseTypoPercent(percent)}%`;
}

export function parseSpacingFactor(value) {
  const n = parseFloat(String(value ?? '').trim());
  if (!Number.isFinite(n)) return 1;
  const clamped = Math.min(LINE_SPACING_MAX, Math.max(LINE_SPACING_MIN, n));
  return Math.round(clamped * 100) / 100;
}

export function formatSpacingFactor(value) {
  const n = parseSpacingFactor(value);
  return String(Number(n.toFixed(2)));
}

export function typoScaleLabel(percent) {
  const p = parseTypoPercent(percent);
  if (p <= 90) return `${p}% · Compact`;
  if (p >= 110) return `${p}% · Large`;
  if (p === 100) return `${p}% · Normal`;
  return `${p}%`;
}

export function lineSpacingLabel(factor) {
  const n = parseSpacingFactor(factor);
  if (n <= 0.85) return `${n} · Dense`;
  if (n >= 1.2) return `${n} · Roomy`;
  if (n === 1) return '1 · Normal';
  return String(n);
}
