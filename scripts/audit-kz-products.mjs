import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as parse5 from 'parse5';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/lang-switch.js'), 'utf8');
const marker = /\}\)\(\);\s*$/;
if (!marker.test(source)) throw new Error('Language map wrapper changed; update this audit.');

const context = {
  window: {},
  document: { readyState: 'loading', addEventListener() {} },
  console
};
vm.runInNewContext(source.replace(marker, 'globalThis.maps = [exactMap, catalogMap, catalogOverrides];})();'), context);
const translated = new Set(context.maps.flatMap((map) => Object.keys(map)));
const missing = new Map();
let pages = 0;

function isExpectedUnchanged(text) {
  return /^тел\.: 8 \(\d{3}\)/.test(text) ||
    ['АСТАНА', 'АЛМАТЫ'].includes(text) ||
    /^Монтажная тумба [\d, ]+ см$/.test(text) ||
    /^вырез \d+x\d+\s*мм$/.test(text);
}

function inspect(node, slug, skipped = false) {
  skipped ||= ['script', 'style', 'noscript', 'svg'].includes(node.tagName || '');
  if (node.nodeName === '#text' && !skipped) {
    const text = node.value.replace(/\s+/g, ' ').trim();
    if (/[А-Яа-яЁё]{3}/.test(text) && !translated.has(text) && !isExpectedUnchanged(text)) {
      const entry = missing.get(text) || { count: 0, example: slug };
      entry.count++;
      missing.set(text, entry);
    }
  }
  for (const child of node.childNodes || []) inspect(child, slug, skipped);
}

for (const entry of fs.readdirSync(path.join(root, 'product'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, 'product', entry.name, 'index.html');
  if (!fs.existsSync(file)) continue;
  pages++;
  inspect(parse5.parse(fs.readFileSync(file, 'utf8')), entry.name);
}

console.log(`Product pages: ${pages}; untranslated unique fragments: ${missing.size}`);
for (const [text, { count, example }] of [...missing].sort((a, b) => b[1].count - a[1].count).slice(0, 20)) {
  console.log(`${count}x ${example}: ${text}`);
}
if (missing.size) process.exitCode = 1;
