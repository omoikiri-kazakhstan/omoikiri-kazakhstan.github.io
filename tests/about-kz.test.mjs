import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';
import { parse } from 'parse5';

const html = await readFile(new URL('../about/index.html', import.meta.url), 'utf8');
const aboutScript = await readFile(new URL('../assets/js/about-ru.js', import.meta.url), 'utf8');
const translations = await readFile(new URL('../assets/js/about-kz.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(translations, context);
const map = context.window.omoikiriAboutKzMap;

test('About KZ covers every Russian text node in the page content', () => {
  const missing = [];
  function visit(node, inMain = false) {
    inMain ||= node.tagName === 'main';
    if (inMain && node.nodeName === '#text') {
      const value = node.value.replace(/\s+/g, ' ').trim();
      if (/[А-Яа-яЁё]/.test(value) && !map[value]) missing.push(value);
    }
    if (['script', 'style', 'noscript'].includes(node.tagName)) return;
    for (const child of node.childNodes || []) visit(child, inMain);
  }
  visit(parse(html));
  assert.deepEqual(missing, []);
});

test('About KZ covers dynamically inserted manufacturing copy', () => {
  const source = aboutScript.split('const countries = {')[1].split('function selectCountry')[0];
  const missing = [...source.matchAll(/'([^'\n]{60,})'/g)]
    .map((match) => match[1].replace(/\s+/g, ' ').trim())
    .filter((value) => /[А-Яа-яЁё]/.test(value) && !map[value]);
  assert.deepEqual(missing, []);
  assert.match(aboutScript, /button\.dataset\.countryRu/);
});
