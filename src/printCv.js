const CONTINUOUS_PAGE_STYLE_ID = 'cv-print-continuous-page';

/** Top + bottom @page margin (15mm each). */
const PAGE_MARGIN_MM = 30;
/** Small rounding / sub-pixel buffer only — keeps PDF tight to content. */
const SAFETY_MM = 5;

function isVisibleEl(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function measureContinuousPageHeightMm() {
  const pageEl = document.querySelector('.cv-page');
  if (!pageEl) return 297;

  const pageRect = pageEl.getBoundingClientRect();
  const widthPx = pageRect.width || pageEl.offsetWidth || 1;

  let contentBottomPx = 0;
  const track = (el) => {
    if (!isVisibleEl(el)) return;
    const r = el.getBoundingClientRect();
    if (r.height < 1) return;
    contentBottomPx = Math.max(contentBottomPx, r.bottom - pageRect.top);
  };

  track(pageEl.querySelector('.cv-header'));
  pageEl.querySelectorAll('.cv-main-col, .cv-sidebar-col').forEach(track);
  pageEl.querySelectorAll('.cv-section, .cv-sidebar-section, .sabbatical-box').forEach(track);

  if (contentBottomPx < 1) {
    contentBottomPx = pageEl.scrollHeight;
  }

  const contentHeightMm = (contentBottomPx / widthPx) * 210;
  return Math.ceil(contentHeightMm + PAGE_MARGIN_MM + SAFETY_MM);
}

function injectContinuousPageStyle(heightMm) {
  document.getElementById(CONTINUOUS_PAGE_STYLE_ID)?.remove();

  const pageStyleEl = document.createElement('style');
  pageStyleEl.id = CONTINUOUS_PAGE_STYLE_ID;
  pageStyleEl.textContent = `@media print {
  @page {
    size: 210mm ${heightMm}mm;
    margin: 15mm 0;
  }
}`;
  document.head.appendChild(pageStyleEl);
  return pageStyleEl;
}

function waitForLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * Browser print → PDF. `continuous: true` sets one tall page (no A4 page breaks).
 * Vector text is preserved when cv-print-mode is active (see index.css).
 */
export async function exportCvToPdf({ continuous = false, photo, optimizePhotoDataUrl, filename }) {
  const texture = document.querySelector('.cv-page-texture');
  const indicators = document.querySelectorAll('.page-break-indicator');

  const originalTitle = document.title;
  document.title = '';

  if (texture) texture.style.display = 'none';
  indicators.forEach((el) => { el.style.display = 'none'; });

  const photoEls = [...document.querySelectorAll('.cv-page .cv-profile-photo')];
  const photoRestore = photoEls.map((img) => img.src);

  if (photo && optimizePhotoDataUrl) {
    const printPhoto = await optimizePhotoDataUrl(photo);
    photoEls.forEach((img) => { img.src = printPhoto; });
    await waitForLayout();
  }

  document.body.classList.add('cv-print-mode');
  if (continuous) document.body.classList.add('cv-print-continuous');

  let pageStyleEl = null;
  let beforePrintHandler = null;

  try {
    await waitForLayout();

    if (continuous) {
      pageStyleEl = injectContinuousPageStyle(measureContinuousPageHeightMm());

      beforePrintHandler = () => {
        pageStyleEl = injectContinuousPageStyle(measureContinuousPageHeightMm());
      };
      window.addEventListener('beforeprint', beforePrintHandler);
    }

    await new Promise((resolve) => {
      const cleanup = () => {
        window.removeEventListener('afterprint', cleanup);
        resolve();
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      window.print();
    });
  } finally {
    if (beforePrintHandler) window.removeEventListener('beforeprint', beforePrintHandler);

    document.body.classList.remove('cv-print-mode', 'cv-print-continuous');
    document.getElementById(CONTINUOUS_PAGE_STYLE_ID)?.remove();
    if (pageStyleEl?.parentNode) pageStyleEl.remove();

    if (texture) texture.style.display = '';
    indicators.forEach((el) => { el.style.display = ''; });
    photoEls.forEach((img, i) => { img.src = photoRestore[i]; });

    document.title = originalTitle;
  }
}
