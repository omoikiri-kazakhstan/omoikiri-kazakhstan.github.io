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

async function productData(slug) {
  if (!productDirectories.has(slug)) return { variations: [], price: null };
  const file = join(root, 'product', slug, 'index.html');
  try {
    if (!(await stat(file)).isFile()) return { variations: [], price: null };
    const html = await readFile(file, 'utf8');
    const source = html.match(/data-product_variations="([\s\S]*?)"/)?.[1];
    const variations = source ? JSON.parse(decodeEntities(source)) : [];
    const parsedVariations = variations.map((item) => ({
      color: String(item.attributes?.attribute_pa_color || '').trim(),
      sku: String(item.sku || '').trim(),
      price: Number(item.display_price) || null
    })).filter((item) => item.color);
    if (parsedVariations.length) return { variations: parsedVariations, price: null };
    const priceHtml = html.match(/<span class="rrc">([\s\S]*?)<\/span>\s*<div class="fav_button">/)?.[1] || '';
    const amounts = [...priceHtml.matchAll(/(?:^|>)\s*(\d[\d \u00a0]*)\s*</g)];
    const rub = Number((amounts.at(-1)?.[1] || '').replace(/\D/g, ''));
    const price = rub ? Math.ceil((rub * 6.1 - 880) / 1000) * 1000 + 880 : null;
    return { variations: [], price };
  } catch {
    return { variations: [], price: null };
  }
}

const unique = new Map();
for (const item of searchItems) {
  const slug = String(item.slug || '').trim().toLowerCase();
  if (!slug || unique.has(slug)) continue;
  const { variations, price } = await productData(slug);
  unique.set(slug, {
    slug,
    name: String(item.title || slug).trim(),
    sku: String(item.sku || '').trim(),
    category: categoryMap[item.category] || 'acs',
    colors: variations.map((variation) => variation.color),
    variations,
    ...(price === null ? {} : { price })
  });
}

const catalog = [...unique.values()].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
await writeFile(join(root, 'assets/data/admin-full-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.length} catalog items.`);
