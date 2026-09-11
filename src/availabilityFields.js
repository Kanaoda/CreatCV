import { DEFAULT_AVAILABILITY } from './visibility.js';

/** @typedef {{ key: string, label: string, previewLabel: string, placeholder: string }} AvailabilityFieldDef */

/** @type {AvailabilityFieldDef[]} */
export const AVAILABILITY_FIELD_DEFS = [
  {
    key: 'lastSalary',
    label: 'Last Salary',
    previewLabel: 'Last Salary',
    placeholder: 'e.g. HKD 42,000 / month (confidential if needed)',
  },
  {
    key: 'expectedSalary',
    label: 'Expected Salary',
    previewLabel: 'Expected Salary',
    placeholder: 'e.g. HKD 45,000 / month (negotiable)',
  },
  {
    key: 'noticePeriod',
    label: 'Notice Period',
    previewLabel: 'Notice Period',
    placeholder: 'e.g. 1 month',
  },
  {
    key: 'availableFrom',
    label: 'Available From / Start Date',
    previewLabel: 'Available From',
    placeholder: 'e.g. Immediate / Apr 2026',
  },
];

export function availabilityFieldVisibleKey(fieldKey) {
  return `${fieldKey}Visible`;
}

/** Field included on CV when toggle is on and value is non-empty */
export function isAvailabilityFieldShown(avail, fieldKey) {
  if (!avail) return false;
  const visKey = availabilityFieldVisibleKey(fieldKey);
  if (avail[visKey] === false) return false;
  const text = String(avail[fieldKey] ?? '').trim();
  return text.length > 0;
}

export function hasAnyShownAvailabilityField(avail) {
  return AVAILABILITY_FIELD_DEFS.some((f) => isAvailabilityFieldShown(avail, f.key));
}

/** @param {Record<string, unknown>} [raw] */
export function normalizeAvailability(raw = {}) {
  const legacySectionOff = raw.visible === false;
  const out = { ...DEFAULT_AVAILABILITY };

  for (const { key } of AVAILABILITY_FIELD_DEFS) {
    const visKey = availabilityFieldVisibleKey(key);
    out[key] = raw[key] != null ? String(raw[key]) : '';
    if (raw[visKey] !== undefined) {
      out[visKey] = raw[visKey] !== false;
    } else {
      out[visKey] = !legacySectionOff;
    }
  }

  return out;
}
