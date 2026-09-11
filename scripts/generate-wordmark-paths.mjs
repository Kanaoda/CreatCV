/**
 * Build vector wordmark paths from Syne ExtraBold (display face).
 * Output: src/brand/wordmarkPaths.js for CreatCvWordmark.jsx
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = path.join(root, 'assets', 'brand');
const fontPath = path.join(fontDir, 'Syne-wght.ttf');
const FONT_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/syne/Syne%5Bwght%5D.ttf';

const isValidFont = (dest) => {
  if (!fs.existsSync(dest)) return false;
  const sig = fs.readFileSync(dest).subarray(0, 4).toString('ascii');
  return sig === '\x00\x01\x00\x00' || sig === 'OTTO' || sig === 'true' || sig === 'wOFF';
};

const download = (url, dest) => new Promise((resolve, reject) => {
  if (isValidFont(dest)) {
    resolve(dest);
    return;
  }
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      file.close();
      download(res.headers.location, dest).then(resolve).catch(reject);
      return;
    }
    res.pipe(file);
    file.on('finish', () => file.close(() => resolve(dest)));
  }).on('error', reject);
});

const pathToD = (p) => p.toPathData(2);

const loadSyneExtraBold = () => {
  const font = opentype.parse(fs.readFileSync(fontPath));
  if (font.variation) font.variation.set(4);
  return font;
};

async function main() {
  await download(FONT_URL, fontPath);

  const size = 32;
  const baseline = 35;
  const gap = 11;
  const renderOpts = { tracking: -38, kerning: true };

  const fontCreat = loadSyneExtraBold();
  const creatPath = fontCreat.getPath('Creat', 0, baseline, size, renderOpts);
  const creatBox = creatPath.getBoundingBox();

  const fontCv = loadSyneExtraBold();
  const cvOffset = creatBox.x2 + gap;
  const cvPath = fontCv.getPath('CV', cvOffset, baseline, size, renderOpts);
  const cvBox = cvPath.getBoundingBox();

  const creatD = pathToD(creatPath);
  const cvD = pathToD(cvPath);
  const totalW = Math.ceil(cvBox.x2 + 3);
  const ruleY = baseline + 6.2;
  const ruleD = `M0.5 ${ruleY} H${totalW - 1}`;
  const accentD = `M0.5 ${ruleY} H${Math.ceil(creatBox.x2 * 0.92)}`;

  const out = `// Auto-generated vector logotype — Syne ExtraBold outlines (do not edit by hand)
export const WORDMARK_VIEWBOX = '0 0 ${totalW} 44';
export const CREAT_PATH = ${JSON.stringify(creatD)};
export const CV_PATH = ${JSON.stringify(cvD)};
export const RULE_PATH = ${JSON.stringify(ruleD)};
export const ACCENT_PATH = ${JSON.stringify(accentD)};
export const WORDMARK_WIDTH = ${totalW};
`;

  const outPath = path.join(root, 'src', 'brand', 'wordmarkPaths.js');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote', outPath, 'creatEnd', creatBox.x2, 'cvStart', cvOffset, 'width', totalW);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
