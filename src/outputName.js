const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/**
 * One display name for the browser tab, the print-to-PDF document title,
 * and the JSON / Word download filenames.
 * Chrome writes document.title into the PDF Title metadata. An empty title
 * makes it fall back to the page URL (on GitHub Pages, the username).
 */
export function cvOutputBaseName(personalName) {
  const name = String(personalName || '')
    .replace(INVALID_FILENAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name ? `${name} - CV` : 'CV';
}

/** Local export time as YYMMDD_HHMM. */
export function cvOutputStamp(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yy}${mm}${dd}_${hh}${min}`;
}

/** Download name and PDF/Word document title, e.g. "Jane Chen - CV-260927_2151". */
export function cvOutputFileName(personalName, date = new Date()) {
  return `${cvOutputBaseName(personalName)}-${cvOutputStamp(date)}`;
}
