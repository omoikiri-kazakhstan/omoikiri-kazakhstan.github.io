import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const directories = [
  'sinks', 'bathsinks', 'taps', 'filters', 'disposers', 'dispenser',
  'acs', 'omoikiri-home', 'about', 'service', 'dealers', 'contact', 'product',
];
const oldThemePath = '/wp-content/themes/twentynineteen/styles/';
const newThemePath = '/wp-content/themes/twentynineteen/styles2/';
let updated = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
    } else if (entry.name === 'index.html') {
      const source = await readFile(file, 'utf8');
      const result = source.replaceAll(oldThemePath, newThemePath)
        .replaceAll(`${newThemePath}favorites.css`, `${oldThemePath}favorites.css`)
        .replaceAll('lang-switch.js?v=20261020-pixel', 'lang-switch.js?v=20261020-styles2c')
        .replaceAll(/lang-switch\.js\?v=20261020-styles2(?:b)?(?=["'])/g, 'lang-switch.js?v=20261020-styles2c');
      if (result !== source) {
        await writeFile(file, result, 'utf8');
        updated++;
      }
    }
  }
}

for (const name of directories) await walk(path.join(root, name));
console.log(`Updated ${updated} internal pages`);
