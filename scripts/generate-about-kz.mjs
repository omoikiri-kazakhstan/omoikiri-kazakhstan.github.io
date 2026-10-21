import { readFile } from 'node:fs/promises';
import { parse } from 'parse5';

const html = await readFile(new URL('../about/index.html', import.meta.url), 'utf8');
const aboutScript = await readFile(new URL('../assets/js/about-ru.js', import.meta.url), 'utf8');
const texts = new Set();
const root = parse(html);

function visit(node, inMain = false) {
  inMain ||= node.tagName === 'main';
  if (inMain && node.nodeName === '#text') {
    const value = node.value.replace(/\s+/g, ' ').trim();
    if (/[А-Яа-яЁё]/.test(value)) texts.add(value);
  }
  if (['script', 'style', 'noscript'].includes(node.tagName)) return;
  for (const child of node.childNodes || []) visit(child, inMain);
}
visit(root);

const dynamicSource = aboutScript.split('const countries = {')[1]?.split('function selectCountry')[0] || '';
for (const match of dynamicSource.matchAll(/'([^'\n]{60,})'/g)) {
  if (/[А-Яа-яЁё]/.test(match[1])) texts.add(match[1].replace(/\s+/g, ' ').trim());
}

const entries = [...texts];
const translated = {};
let cursor = 0;
async function worker() {
  while (cursor < entries.length) {
    const source = entries[cursor++];
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.search = new URLSearchParams({ client: 'gtx', sl: 'ru', tl: 'kk', dt: 't', q: source }).toString();
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const target = data[0].map((segment) => segment[0]).join('').replace(/\s+/g, ' ').trim();
        if (!target) throw new Error('Empty translation');
        translated[source] = target;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    if (lastError) throw new Error(`Translation failed: ${source.slice(0, 60)}: ${lastError.message}`);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
process.stdout.write(`window.omoikiriAboutKzMap = ${JSON.stringify(translated, null, 2)};\n`);
