/**
 * Save exports to a user-chosen local folder (Chrome / Edge File System Access API).
 * Falls back to a normal download when the API is unavailable (e.g. Firefox/Safari).
 */

let cachedDirHandle = null;

function extensionOf(name) {
  const m = String(name || '').match(/(\.[a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}

function acceptFor(mimeType, extension) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return { [mimeType]: [ext] };
}

async function ensureDirPermission(dirHandle) {
  if (!dirHandle) return false;
  const opts = { mode: 'readwrite' };
  if ((await dirHandle.queryPermission(opts)) === 'granted') return true;
  if ((await dirHandle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/**
 * Ask the user to pick (or re-confirm) an export folder.
 * Chrome remembers the last folder via the `id` option.
 * @returns {Promise<FileSystemDirectoryHandle | null>}
 */
export async function pickExportFolder() {
  if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker({
      id: 'creatcv-export-folder',
      mode: 'readwrite',
      startIn: cachedDirHandle || 'documents',
    });
    cachedDirHandle = handle;
    return handle;
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
      return null;
    }
    throw err;
  }
}

/**
 * @returns {Promise<FileSystemDirectoryHandle | null>}
 */
export async function getExportFolder({ promptIfMissing = true } = {}) {
  if (cachedDirHandle && (await ensureDirPermission(cachedDirHandle))) {
    return cachedDirHandle;
  }
  if (!promptIfMissing) return null;
  return pickExportFolder();
}

/**
 * Write a blob into a user-picked export folder (always shows the folder dialog).
 * @returns {Promise<'saved' | 'downloaded' | 'cancelled'>}
 */
export async function saveBlobToExportFolder(blob, filename, {
  mimeType = blob.type || 'application/octet-stream',
  description = 'File',
} = {}) {
  const canPickDir = typeof window !== 'undefined'
    && typeof window.showDirectoryPicker === 'function';

  if (canPickDir) {
    const dir = await pickExportFolder();
    if (!dir) return 'cancelled';
    try {
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (err) {
      if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return 'cancelled';
      }
      console.warn('saveBlobToExportFolder: directory write failed, falling back', err);
    }
  }

  // Fallback: Save As dialog (still lets the user pick a folder), then <a download>
  return saveBlobWithPicker(blob, {
    suggestedName: filename,
    mimeType,
    extension: extensionOf(filename),
    description,
  });
}

/**
 * @param {Blob} blob
 * @param {{
 *   suggestedName: string,
 *   mimeType: string,
 *   extension?: string,
 *   description?: string,
 * }} options
 * @returns {Promise<'saved' | 'downloaded' | 'cancelled'>}
 */
export async function saveBlobWithPicker(blob, {
  suggestedName,
  mimeType,
  extension,
  description = 'File',
}) {
  const ext = extension || extensionOf(suggestedName) || '';
  const name = suggestedName.endsWith(ext) || !ext
    ? suggestedName
    : `${suggestedName}${ext}`;

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [
          {
            description,
            accept: acceptFor(mimeType, ext || '.bin'),
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (err) {
      if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return 'cancelled';
      }
      console.warn('saveBlobWithPicker: picker failed, falling back to download', err);
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return 'downloaded';
}

/**
 * Save UTF-8 text into the export folder (prompts for folder if needed).
 */
export async function saveTextToExportFolder(text, filename, {
  mimeType = 'application/json',
  description = 'CV JSON',
} = {}) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  return saveBlobToExportFolder(blob, filename, { mimeType, description });
}

/**
 * For PDF (print → Save as PDF): ask for the export folder first so the user
 * has a target in mind, then return the suggested bare filename for document.title.
 * @returns {Promise<{ cancelled: boolean, filename: string, folderName: string }>}
 */
export async function preparePdfExport(suggestedBaseName) {
  const filename = String(suggestedBaseName || 'CV').replace(/\.pdf$/i, '');
  const canPickDir = typeof window !== 'undefined'
    && typeof window.showDirectoryPicker === 'function';

  if (canPickDir) {
    const dir = await pickExportFolder();
    if (!dir) return { cancelled: true, filename, folderName: '' };
    return { cancelled: false, filename, folderName: dir.name || '' };
  }

  return { cancelled: false, filename, folderName: '' };
}
