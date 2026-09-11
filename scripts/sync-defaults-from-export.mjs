/**
 * Publish reference/default_resume.json + reference/default_app_settings.json
 * as public/default_template.json for browser Reset.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(root, 'reference', 'default_resume.json');
const settingsPath = path.join(root, 'reference', 'default_app_settings.json');
const publicDir = path.join(root, 'public');
const templateOut = path.join(publicDir, 'default_template.json');

if (!fs.existsSync(dataPath)) {
  console.error('Missing reference/default_resume.json');
  process.exit(1);
}
if (!fs.existsSync(settingsPath)) {
  console.error('Missing reference/default_app_settings.json');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

const payload = {
  version: 2,
  data,
  settings,
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(templateOut, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log('Published', templateOut);
