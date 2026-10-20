import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const productRoot = path.resolve(import.meta.dirname, '../product');
const version = process.argv[2];
if (!version || !/^[a-zA-Z0-9.-]+$/.test(version)) {
  throw new Error('Pass a CSS version containing only letters, numbers, dots or hyphens.');
}

let changed = 0;
for (const entry of await readdir(productRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(productRoot, entry.name, 'index.html');
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const updated = html.replace(/styles2\/product\.css(?:\?v=[^"']*)?(?=["'])/g,
    `styles2/product.css?v=${version}`);
  if (updated === html) continue;
  await writeFile(file, updated);
  changed++;
}
console.log(`Updated product stylesheet URL in ${changed} pages.`);
