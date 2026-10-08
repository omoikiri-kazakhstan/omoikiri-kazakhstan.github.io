import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ignored = new Set(['.git', '.wrangler', 'node_modules', 'assets', 'scripts', 'functions', 'migrations']);
let changed = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!entry.name.endsWith('.html')) continue;

    const original = await readFile(file, 'utf8');
    const next = original
      .replace(/(?:https?:)?\/\/omoikiri\.ru(?=\/(?:wp-includes|wp-content|product\/sinks\/manual)\/)/g, '/assets/remote/omoikiri.ru')
      .replace(/https:\\\/\\\/omoikiri\.ru/g, 'https:\\/\\/omoikiri-kazakhstan.pages.dev')
      .replace(/https?:\/\/omoikiri\.ru/g, 'https://omoikiri-kazakhstan.pages.dev')
      .replace(/<script>\s*jQuery\(document\)\.ready\(function\(\$\)\s*\{[\s\S]*?get_variation_sku[\s\S]*?<\/script>/g, '')
      .replace(/<script id="favorites-js"[^>]*><\/script>/g, '')
      .replace(/product-local\.js\?v=[^"']+/g, 'product-local.js?v=20261008-01')
      .replace(/favorites-local\.js\?v=[^"']+/g, 'favorites-local.js?v=20261008-01')
      .replace(/\/assets\/remote\/omoikiri\.ru\/cart\b/g, '/cart')
      .replace(/(<div class="woocommerce-notices-wrapper"><\/div>)[ \t]+\r?\n/g, '$1\n');

    if (next !== original) {
      await writeFile(file, next, 'utf8');
      changed++;
    }
  }
}

await walk(root);
console.log('Updated ' + changed + ' HTML pages.');
