import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const origin = process.argv[2] || 'http://127.0.0.1:8797';
const xml = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const parsed = new XMLParser().parse(xml);
const urls = parsed.urlset.url.map((entry) => new URL(entry.loc).pathname);
let next = 0;
const failures = [];
async function worker() {
  while (next < urls.length) {
    const pathname = urls[next++];
    try {
      const response = await fetch(new URL(pathname, origin), { method: 'HEAD' });
      if (response.status !== 200 && response.status !== 410) failures.push([pathname, response.status]);
    } catch (error) { failures.push([pathname, String(error)]); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
assert.deepEqual(failures, []);
console.log(`PHP sitemap URLs passed: ${urls.length}`);
