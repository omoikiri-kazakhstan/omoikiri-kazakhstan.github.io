import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const productRoot = path.resolve(import.meta.dirname, '../product');

test('all product pages load the inquiry replacement without the WordPress nonce request', () => {
  let pages = 0;
  for (const entry of fs.readdirSync(productRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(productRoot, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /product-local\.js\?v=20261021-inquiry/, file);
    assert.doesNotMatch(html, /forminator_get_nonce/, file);
    pages++;
  }
  assert.equal(pages, 419);
});
