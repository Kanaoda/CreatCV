/** Recompress when base64 data URL exceeds this (≈150KB — enough for ~130px print at 2×) */
export const PHOTO_RECOMPRESS_THRESHOLD = 150000;

const DEFAULT_MAX_EDGE = 400;
const DEFAULT_JPEG_QUALITY = 0.82;

export function formatPhotoSizeLabel(dataUrl) {
  if (!dataUrl) return '';
  const bytes = Math.round((dataUrl.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function shouldOptimizePhoto(dataUrl) {
  return Boolean(dataUrl?.startsWith('data:image') && dataUrl.length > PHOTO_RECOMPRESS_THRESHOLD);
}

/**
 * Resize & JPEG-compress profile photos so PDF export stays under ~5MB.
 * Display size is ~100–132px; 400px long edge is sufficient for print.
 */
export function optimizePhotoDataUrl(dataUrl, { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_JPEG_QUALITY } = {}) {
  if (!dataUrl?.startsWith('data:image')) return Promise.resolve(dataUrl || '');
  if (!shouldOptimizePhoto(dataUrl)) return Promise.resolve(dataUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const longEdge = Math.max(width, height);
      const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const jpeg = canvas.toDataURL('image/jpeg', quality);
        resolve(jpeg.length < dataUrl.length ? jpeg : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
