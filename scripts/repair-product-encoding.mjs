import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'parse5';
const productRoot = path.resolve(import.meta.dirname, '../product');
const dryRun = process.argv.includes('--dry-run');
const onlySlug = process.argv.find((arg) => arg.startsWith('--slug='))?.slice(7);
const windows1251 = new TextDecoder('windows-1251');
const utf8 = new TextDecoder('utf-8');
const byteByChar = new Map();
for (let byte = 0; byte < 256; byte++) {
  byteByChar.set(windows1251.decode(Uint8Array.of(byte)), byte);
}
const mojibake = /(?:[\u0420\u0421][\u0080-\u00BF\u039C\u0400-\u040F\u0450-\u045F\u2018-\u203A\u20AC\u2122]|\u0432\u0402|\u0412[\u00A9\u00AB\u00BB\u00B0])/g;
const textAttributes = new Set(['alt', 'title', 'placeholder', 'aria-label', 'value', 'content']);

function score(value) {
  return (value.match(mojibake) || []).length;
}

function decode(value) {
  value = value.replace(/В©(?=\s*\d{4}\s+OMOIKIRI)/g, '©');
  if (!score(value)) return value;
  const normalized = value
    .replace(/\u0420\u040F/g, '\u0420\u045F')
    .replace(/\u0420\u040B/g, '\u0420\u045B')
    .replace(/\u0420\u039C/g, '\u0420\u00B5')
    .replace(/\u0420\u0401/g, '\u0420\u0451');
  const bytes = [];
  for (const char of normalized) {
    const byte = byteByChar.get(char);
    if (byte === undefined) return value;
    bytes.push(byte);
  }
  const decoded = utf8.decode(Uint8Array.from(bytes));
  if (!/[\u0410-\u042F\u0430-\u044F\u0401\u0451]/.test(decoded)) return value;
  const cleaned = decoded.replace(/\uFFFD/g, '');
  return score(cleaned) < score(value) ? cleaned : value;
}

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function escapeAttribute(value, quote) {
  let escaped = escapeText(value);
  escaped = escaped.replace(quote === '"' ? /"/g : /'/g, quote === '"' ? '&quot;' : '&#39;');
  return escaped;
}

function repairJson(value) {
  if (typeof value === 'string') return decode(value);
  if (Array.isArray(value)) return value.map(repairJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairJson(item)]));
  }
  return value;
}

let changedFiles = 0;
let textEdits = 0;
let attributeEdits = 0;
let jsonEdits = 0;
const samples = [];
const unresolved = [];
for (const entry of await readdir(productRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || (onlySlug && entry.name !== onlySlug)) continue;
  const file = path.join(productRoot, entry.name, 'index.html');
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const document = parse(html, { sourceCodeLocationInfo: true });
  const edits = [];

  function addEdit(location, replacement, original, kind) {
    if (!location || replacement === original) return;
    edits.push({ start: location.startOffset, end: location.endOffset, replacement });
    if (samples.length < 8) samples.push({ slug: entry.name, kind, before: original.slice(0, 55), after: replacement.slice(0, 55) });
    if (kind === 'text') textEdits++;
    else if (kind === 'attribute') attributeEdits++;
    else jsonEdits++;
  }

  function visit(node, parentName = '') {
    if (node.nodeName === '#text' && node.sourceCodeLocation) {
      const location = node.sourceCodeLocation;
      const original = html.slice(location.startOffset, location.endOffset);
      if (parentName === 'script') {
        const parent = node.parentNode;
        if (parent?.attrs?.some((attr) => attr.name === 'type' && attr.value === 'application/ld+json')) {
          try {
            const parsed = JSON.parse(original);
            const repaired = repairJson(parsed);
            if (JSON.stringify(repaired) !== JSON.stringify(parsed)) {
              addEdit(location, JSON.stringify(repaired), original, 'json');
            }
          } catch {
            // Leave non-JSON scripts untouched.
          }
        }
      } else if (!['style', 'textarea', 'title', 'noscript'].includes(parentName)) {
        const repaired = decode(node.value);
        if (score(repaired) && unresolved.length < 20) unresolved.push({ slug: entry.name, text: repaired.slice(0, 100) });
        if (repaired !== node.value) addEdit(location, escapeText(repaired), original, 'text');
      }
    }
    if (node.attrs && node.sourceCodeLocation?.attrs) {
      for (const attr of node.attrs) {
        if (!textAttributes.has(attr.name)) continue;
        const repaired = decode(attr.value);
        if (score(repaired) && unresolved.length < 20) unresolved.push({ slug: entry.name, attribute: attr.name, text: repaired.slice(0, 100) });
        if (repaired === attr.value) continue;
        const location = node.sourceCodeLocation.attrs[attr.name];
        if (!location) continue;
        const original = html.slice(location.startOffset, location.endOffset);
        const quote = original.match(/=\s*(['"])/)?.[1] || '"';
        addEdit(location, `${attr.name}=${quote}${escapeAttribute(repaired, quote)}${quote}`, original, 'attribute');
      }
    }
    for (const child of node.childNodes || []) visit(child, node.nodeName);
    if (node.content) visit(node.content, node.nodeName);
  }

  visit(document);
  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  for (let i = 1; i < edits.length; i++) {
    if (edits[i - 1].start < edits[i].end) throw new Error(`Overlapping edits in ${file}`);
  }
  if (!dryRun) {
    for (const edit of edits) {
      html = html.slice(0, edit.start) + edit.replacement + html.slice(edit.end);
    }
    await writeFile(file, html);
  }
  changedFiles++;
}

console.log(JSON.stringify({ dryRun, changedFiles, textEdits, attributeEdits, jsonEdits, samples, unresolved }, null, 2));
