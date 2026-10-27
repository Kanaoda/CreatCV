/**
 * Save a Blob via the system Save As dialog, so the user picks the folder and
 * can edit the prefilled filename. Uses the File System Access API (Chrome / Edge);
 * other browsers fall back to a normal download into the default folder.
 *
 * @param {Blob} blob
 * @param {{ suggestedName: string, mimeType: string, extension: string, description?: string }} options
 * @returns {Promise<'saved' | 'downloaded' | 'cancelled'>}
 */
export async function saveBlobWithPicker(blob, {
  suggestedName,
  mimeType,
  extension,
  description = 'File',
}) {
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        id: 'creatcv-export',
        suggestedName,
        types: [{ description, accept: { [mimeType]: [extension] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      console.warn('Save dialog failed, falling back to download', err);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
