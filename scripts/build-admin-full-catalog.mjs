import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const indexSource = await readFile(join(root, 'assets/js/search-index.js'), 'utf8');
const start = indexSource.indexOf('[');
const end = indexSource.lastIndexOf(']');
const searchItems = JSON.parse(indexSource.slice(start, end + 1));
const categoryMap = {
  'Мойки': 'sinks',
  'Раковины для ванной': 'bathsinks',
  'Смесители': 'taps',
  'Фильтры': 'filters',
  'Измельчители': 'disposers',
  'Дозаторы': 'dispenser',
  'Аксессуары': 'acs',
  'OMOIKIRI Home': 'omoikiri-home'
};

const decodeEntities = (value) => value.replace(/&quot;/g, '"').replace(/&#0*39;/g, "'").replace(/&amp;/g, '&');
const productDirectories = new Set((await readdir(join(root, 'product'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name));

async function variationColors(slug) {
  if (!productDirectories.has(slug)) return [];
  const file = join(root, 'product', slug, 'index.html');
  try {
    if (!(await stat(file)).isFile()) return [];
    const html = await readFile(file, 'utf8');
    const source = html.match(/data-product_variations="([\s\S]*?)"/)?.[1];
    if (!source) return [];
    const variations = JSON.parse(decodeEntities(source));
    return [...new Set(variations.map((item) => item.attributes?.attribute_pa_color).filter(Boolean))].sort();
  } catch {
    return [];
  }
}

const unique = new Map();
for (const item of searchItems) {
  const slug = String(item.slug || '').trim().toLowerCase();
  if (!slug || unique.has(slug)) continue;
  unique.set(slug, {
    slug,
    name: String(item.title || slug).trim(),
    sku: String(item.sku || '').trim(),
    category: categoryMap[item.category] || 'acs',
    colors: await variationColors(slug)
  });
}

const catalog = [...unique.values()].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
await writeFile(join(root, 'assets/data/admin-full-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.length} catalog items.`);
