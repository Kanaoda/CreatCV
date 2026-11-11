/** Matches @page { size: A4; margin: 15mm 0 } in index.css */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_MARGIN_Y_MM = 15;
export const A4_PRINTABLE_HEIGHT_MM = A4_HEIGHT_MM - A4_MARGIN_Y_MM * 2; // 267

function measureCssMm(mm, axis = 'height') {
  if (typeof document === 'undefined') {
    return (mm * 96) / 25.4;
  }
  const el = document.createElement('div');
  el.style.cssText = axis === 'width'
    ? `position:absolute;left:-9999px;top:0;width:${mm}mm;height:1px;visibility:hidden;pointer-events:none`
    : `position:absolute;left:-9999px;top:0;height:${mm}mm;width:1px;visibility:hidden;pointer-events:none`;
  document.body.appendChild(el);
  const px = axis === 'width' ? el.offsetWidth : el.offsetHeight;
  document.body.removeChild(el);
  return px || (mm * 96) / 25.4;
}

function contentBottomPx(pageEl) {
  const pageTop = pageEl.getBoundingClientRect().top;
  let bottom = 0;
  const track = (el) => {
    if (!el) return;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return;
    bottom = Math.max(bottom, r.bottom - pageTop);
  };

  track(pageEl.querySelector('.cv-header'));
  pageEl.querySelectorAll('.cv-main-col, .cv-sidebar-col, .cv-col').forEach(track);
  pageEl.querySelectorAll('.cv-section, .cv-sidebar-section, .sabbatical-box, .cv-project-appendix').forEach(track);

  // getBoundingClientRect is transform-scaled; convert back to layout px via width ratio
  const layoutWidth = pageEl.offsetWidth || 1;
  const visualWidth = pageEl.getBoundingClientRect().width || layoutWidth;
  const scale = visualWidth / layoutWidth;
  if (scale > 0.01 && scale !== 1) {
    bottom /= scale;
  }

  return Math.max(bottom, pageEl.scrollHeight || 0);
}

/**
 * Screen-only A4 break offsets (px, layout coords inside .cv-page).
 * Uses the browser’s real mm→px mapping (same as CSS 267mm), not width*ratio.
 */
export function computeA4BreakOffsetsPx(pageEl) {
  if (!pageEl) return [];
  const printablePx = measureCssMm(A4_PRINTABLE_HEIGHT_MM, 'height');
  if (printablePx < 8) return [];

  const height = contentBottomPx(pageEl);
  const breaks = [];
  // Stop before the last ~4px so a trailing empty “page” isn’t marked
  const limit = height - 4;
  for (let y = printablePx; y < limit; y += printablePx) {
    breaks.push(Math.round(y));
  }
  return breaks;
}
