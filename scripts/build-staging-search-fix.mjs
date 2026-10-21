import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { zipSync } from 'fflate';

const files = {};
const trackedHtml = execFileSync('git', ['ls-files', '-z', '*.html']).toString('utf8').split('\0').filter(Boolean);
for (const file of trackedHtml) {
  const data = await fs.readFile(file).catch((error) => {
    if (error.code === 'ENOENT') return null; // Sparse checkout only.
    throw error;
  });
  if (data?.includes('lang-switch.js?v=20261021-search-json')) {
    files[file.replaceAll('\\', '/')] = new Uint8Array(data);
  }
}
for (const file of ['assets/js/lang-switch.js', 'assets/js/search-index.json']) {
  files[file] = new Uint8Array(await fs.readFile(file));
}
if (Object.keys(files).length < 442) throw new Error('Expected 440 HTML pages and 2 search assets');

const output = 'test-results/launch-2026-10-21/staging-search-pages-20261021.zip';
await fs.mkdir('test-results/launch-2026-10-21', { recursive: true });
await fs.writeFile(output, zipSync(files, { level: 6 }));
console.log(`Prepared ${Object.keys(files).length} search-fix files at ${output}`);
