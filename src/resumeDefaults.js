/** Built-in starter template — Reset loads this file from public/ */
export const DEFAULT_TEMPLATE_FILENAME = 'default_template.json';
export const DEFAULT_TEMPLATE_URL = `${import.meta.env.BASE_URL}${DEFAULT_TEMPLATE_FILENAME}`;

export async function loadDefaultTemplate() {
  const response = await fetch(`${DEFAULT_TEMPLATE_URL}?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(
      `Could not load ${DEFAULT_TEMPLATE_FILENAME} (HTTP ${response.status}). Run npm run sync:defaults to publish the template.`,
    );
  }
  const parsed = await response.json();
  if (!parsed?.data) {
    throw new Error(`${DEFAULT_TEMPLATE_FILENAME} must be version 2 format (with data and settings)`);
  }
  return parsed;
}
