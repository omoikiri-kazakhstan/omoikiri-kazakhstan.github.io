import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';

const root = path.resolve(import.meta.dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const publicRoots = ['index.html', 'about', 'acs', 'bathsinks', 'contact', 'dealers',
  'dispenser', 'disposers', 'filters', 'omoikiri-home', 'product', 'service', 'sinks', 'taps'];
const changed = [];

async function visit(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (relativePath.endsWith('.html')) {
    const source = await readFile(absolutePath, 'utf8');
    const document = parse(source, { sourceCodeLocationInfo: true });
    const removals = [];
    let hasCanonical = false;

    function walk(node) {
      if (node.tagName === 'link') {
        const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
        if (attrs.rel === 'canonical' && attrs.href?.startsWith('https://omoikiri.kz/')) hasCanonical = true;
      }
      if (node.tagName === 'meta') {
        const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
        if (attrs.name === 'robots' && attrs.content === 'noindex' && node.sourceCodeLocation) {
          removals.push(node.sourceCodeLocation);
        }
      }
      for (const child of node.childNodes || []) walk(child);
    }
    walk(document);
    if (removals.length) {
      if (!hasCanonical) throw new Error(`Refusing to release a page without omoikiri.kz canonical: ${relativePath}`);
      let output = source;
      for (const location of removals.sort((a, b) => b.startOffset - a.startOffset)) {
        output = output.slice(0, location.startOffset) + output.slice(location.endOffset);
      }
      if (!dryRun) await writeFile(absolutePath, output, 'utf8');
      changed.push(relativePath);
    }
    return;
  }
  for (const entry of await readdir(absolutePath, { withFileTypes: true })) {
    if (entry.isDirectory() || (entry.isFile() && entry.name.endsWith('.html'))) {
      await visit(path.join(relativePath, entry.name));
    }
  }
}

for (const entry of publicRoots) await visit(entry);
console.log(`${dryRun ? 'Would release' : 'Released'} ${changed.length} public pages from noindex.`);
