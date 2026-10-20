import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ignored = new Set(['.git', '.wrangler', 'node_modules', 'scripts', 'migrations', 'functions', 'workers']);
const publicFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:html|css|js|json)$/i.test(entry.name)) publicFiles.push(file);
  }
}

walk(root);

const externalPages = [];
const missingAssets = new Map();
const inertSourceReferences = new Set(['assets/js/sinks-local.js', 'product/sinks-products.json']);
let checkedAssets = 0;

for (const file of publicFiles) {
  const content = readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll('\\', '/');

  if (/https?:\/\/(?:www\.)?omoikiri\.ru|\/\/(?:www\.)?omoikiri\.ru|https?:\\\/\\\/(?:www\.)?omoikiri\.ru/i.test(content)) {
    externalPages.push(relative);
  }

  if (!/\.(?:html|css)$/.test(relative)) continue;
  const references = relative.endsWith('.html') ? [
    ...[...content.matchAll(/\/assets\/remote\/omoikiri\.ru\/[^\s"'<>`),;]+/g)].map((match) => match[0]),
    ...[...content.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)].map((match) => match[1])
      .filter((value) => value.includes('assets/remote/omoikiri.ru/')),
  ] : [...content.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)]
    .map((match) => match[1]).filter((value) => !/^(?:data:|https?:)/i.test(value));
  for (const reference of references) {
    const value = reference.replace(/\\\//g, '/').replace(/&amp;/g, '&');
    if (value.includes('${') || value.includes('{{')) continue;
    const raw = new URL(value.split(/[?&#]/, 1)[0], `https://local.invalid/${relative}`).pathname;
    if (!raw.startsWith('/assets/remote/omoikiri.ru/')) continue;
    if (/\.php$/i.test(raw)) continue;
    checkedAssets++;
    const target = path.join(root, raw.slice(1));
    if (!existsSync(target)) {
      const refs = missingAssets.get(raw) || [];
      if (refs.length < 3) refs.push(relative);
      missingAssets.set(raw, refs);
    }
  }
}

console.log(`Public text files: ${publicFiles.length}`);
console.log(`Files containing omoikiri.ru URL literals: ${externalPages.length}`);
console.log(externalPages.slice(0, 30).join('\n'));
const unexpectedExternalPages = externalPages.filter((file) => !inertSourceReferences.has(file));
console.log(`Unexpected external URL files: ${unexpectedExternalPages.length}`);
console.log(`Local mirror references checked: ${checkedAssets}`);
console.log(`Missing local assets: ${missingAssets.size}`);
for (const [asset, refs] of [...missingAssets].slice(0, 40)) {
  console.log(`${asset} <- ${refs.join(', ')}`);
}

if (missingAssets.size || unexpectedExternalPages.length) process.exitCode = 1;
