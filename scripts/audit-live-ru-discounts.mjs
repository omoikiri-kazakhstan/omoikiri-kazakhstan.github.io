import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = process.argv.find((arg) => arg.startsWith('--out='))?.slice(6);
const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.slice(8)) || Infinity;
const selected = process.argv.find((arg) => arg.startsWith('--slugs='))?.slice(8).split(',');

function variations(html) {
  const encoded = html.match(/data-product_variations="([^"]*)"/)?.[1];
  if (!encoded || encoded === 'false') return null;
  const data = JSON.parse(encoded.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  return data.map((item) => ({
    key: JSON.stringify(Object.entries(item.attributes || {}).sort()),
    attributes: item.attributes || {},
    sku: String(item.sku || ''),
    price: Number(item.display_price),
    regular: Number(item.display_regular_price || item.display_price),
  }));
}

function singlePrice(html) {
  const start = html.indexOf('class="rrc"');
  if (start < 0) return null;
  const end = html.indexOf('class="fav_button"', start);
  const priceHtml = html.slice(start, end < 0 ? start + 800 : end)
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ');
  const amounts = [...priceHtml.matchAll(/\d[\d\s]*\d|\d/g)]
    .map(([value]) => Number(value.replace(/\s/g, '')))
    .filter((value) => value > 0);
  if (!amounts.length) return null;
  return [{ key: 'single', attributes: {}, sku: '',
    regular: amounts.length > 1 ? amounts[0] : amounts[0],
    price: amounts.at(-1) }];
}

function prices(html) {
  return variations(html) || singlePrice(html);
}

async function fetchPage(slug) {
  const url = `https://omoikiri.ru/product/${slug}/`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

const products = (await readdir(path.join(root, 'product'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => !selected || selected.includes(slug))
  .slice(0, limit);
const results = [];
let cursor = 0;

async function worker() {
  while (cursor < products.length) {
    const slug = products[cursor++];
    const file = path.join(root, 'product', slug, 'index.html');
    try {
      const local = prices(await readFile(file, 'utf8'));
      const live = prices(await fetchPage(slug));
      if (!local || !live) {
        results.push({ slug, error: 'price data missing', local: !!local, live: !!live });
        continue;
      }
      const liveByKey = new Map(live.map((item) => [item.key, item]));
      for (const before of local) {
        const after = liveByKey.get(before.key);
        if (!after) {
          results.push({ slug, key: before.key, error: 'variation missing on RU site' });
          continue;
        }
        const oldDiscount = before.regular > 0 ? 1 - before.price / before.regular : 0;
        const newDiscount = after.regular > 0 ? 1 - after.price / after.regular : 0;
        if (before.price !== after.price || before.regular !== after.regular) {
          results.push({ slug, key: before.key, sku: before.sku || after.sku,
            before: { price: before.price, regular: before.regular, discount: oldDiscount },
            after: { price: after.price, regular: after.regular, discount: newDiscount },
            discountReduced: oldDiscount > 0.001 && newDiscount < oldDiscount - 0.001 });
        }
      }
      for (const after of live) {
        if (!local.some((item) => item.key === after.key)) {
          results.push({ slug, key: after.key, error: 'new variation on RU site' });
        }
      }
    } catch (error) {
      results.push({ slug, error: String(error.message || error) });
    }
    if (cursor % 50 === 0) console.error(`Checked ${cursor}/${products.length}`);
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
results.sort((a, b) => a.slug.localeCompare(b.slug) || (a.key || '').localeCompare(b.key || ''));
const summary = {
  checkedProducts: products.length,
  changedVariants: results.filter((item) => item.before && item.after).length,
  reducedDiscounts: results.filter((item) => item.discountReduced).length,
  errors: results.filter((item) => item.error).length,
};
console.log(JSON.stringify(summary));
if (output) await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), summary, results }, null, 2));
else console.log(JSON.stringify(results, null, 2));
