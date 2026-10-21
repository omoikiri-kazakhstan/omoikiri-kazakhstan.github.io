import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import * as parse5 from 'parse5';

const root = path.resolve(import.meta.dirname, '..');

function elements(node, predicate, result = []) {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes || []) elements(child, predicate, result);
  return result;
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value || '';
}

for (const [slug, sku, price, imageName] of [
  ['fp-07-pro', '4999153', '107 880 ₸', 'fp-07-pro-gb-600x600.png'],
  ['fp-08-pro', '4999154', '78 880 ₸', 'fp-08-pro-gb-600x600.png']
]) {
  test(`${slug} has its own photo, SKU and KZT price before scripts run`, () => {
    const html = fs.readFileSync(path.join(root, 'product', slug, 'index.html'), 'utf8');
    const doc = parse5.parse(html);
    const photoBox = elements(doc, (node) => node.tagName === 'div' && attribute(node, 'class').split(' ').includes('prod_image'))[0];
    const image = elements(photoBox, (node) => node.tagName === 'img')[0];
    assert.ok(image);
    assert.ok(attribute(image, 'src').endsWith(imageName));
    assert.match(html, new RegExp(`арт\\. ${sku}`));
    assert.ok(html.replaceAll('\u00a0', ' ').includes(price));
    const form = elements(doc, (node) => node.tagName === 'form' && attribute(node, 'class').includes('variations_form'))[0];
    const variations = JSON.parse(attribute(form, 'data-product_variations'));
    assert.equal(variations.length, 1);
    assert.equal(variations[0].sku, sku);
    assert.ok(variations[0].image.src.endsWith(imageName));
    const productSchema = elements(doc, (node) => node.tagName === 'script' && attribute(node, 'type') === 'application/ld+json')
      .map((node) => {
        try { return JSON.parse(node.childNodes?.[0]?.value || ''); } catch { return null; }
      }).find((value) => value?.['@type'] === 'Product');
    assert.equal(productSchema?.sku, sku);
    assert.equal(Number(productSchema?.offers?.[0]?.price), Number(price.replace(/\D/g, '')));
    assert.ok(productSchema?.image.endsWith(imageName.replace('-600x600', '')));
  });
}
