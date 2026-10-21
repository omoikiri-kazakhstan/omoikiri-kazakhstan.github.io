import { readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';

const root = new URL('../product/', import.meta.url);
const pattern = /\n\s*\$\.ajax\(\{\s*url: '\/wp-content\/themes\/twentynineteen\/check\.php',\s*type: 'POST',\s*data: \{ selectedAttribute: selectedAttribute \},\s*\}\);\s*\n/g;
let updated = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = new URL(`${entry.name}/index.html`, root);
  let html;
  try { html = await readFile(file, 'utf8'); } catch { continue; }
  if (!html.includes("url: '/wp-content/themes/twentynineteen/check.php'")) continue;
  const cleaned = html.replace(pattern, '\n');
  if (cleaned === html || cleaned.includes("url: '/wp-content/themes/twentynineteen/check.php'")) {
    throw new Error(`Unexpected legacy call format: ${entry.name}`);
  }
  updated++;
  if (process.argv.includes('--write')) await writeFile(file, cleaned);
}
console.log(`${process.argv.includes('--write') ? 'Removed' : 'Found'} ${updated} legacy POST calls`);
