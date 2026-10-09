import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reportPath = process.argv.find((arg) => arg.startsWith('--report='))?.slice(9);
if (!reportPath) throw new Error('Pass --report=path-to-audit.json');
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const changes = report.results.filter((item) => item.before && item.after);
const slugs = [...new Set(changes.map((item) => item.slug))];

function decodeAttribute(value) {
  return value.replaceAll('&quot;', '"').replaceAll('&#039;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
}

function encodeAttribute(value) {
  return JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function readVariations(html) {
  const match = html.match(/data-product_variations="([^"]*)"/);
  if (!match) throw new Error('Missing variation data');
  return { match, data: JSON.parse(decodeAttribute(match[1])) };
}

function key(item) {
  return JSON.stringify(Object.entries(item.attributes || {}).sort());
}

function roundKzt(value, rate = 6.1) {
  return Math.ceil((value * rate - 880) / 1000) * 1000 + 880;
}

function amount(rub, rate = 6.1) {
  const kzt = roundKzt(rub, rate);
  const label = new Intl.NumberFormat('ru-KZ').format(kzt);
  return { label, html: `<span class="woocommerce-Price-amount amount" data-original-rub="${rub}"><bdi>${label}&nbsp;<span class="woocommerce-Price-currencySymbol">₸</span></bdi></span>` };
}

function priceHtml(variation) {
  const current = amount(Number(variation.display_price));
  const regular = amount(Number(variation.display_regular_price), 6.8);
  if (variation.display_regular_price > variation.display_price) {
    return `<span class="price"><del aria-hidden="true">${regular.html}</del> <span class="screen-reader-text">Original price was: ${regular.label}&nbsp;₸.</span><ins aria-hidden="true">${current.html}</ins><span class="screen-reader-text">Current price is: ${current.label}&nbsp;₸.</span></span>`;
  }
  return `<span class="price">${current.html}</span>`;
}

async function updateProduct(slug) {
  const file = path.join(root, 'product', slug, 'index.html');
  const original = await readFile(file, 'utf8');
  const { match, data } = readVariations(original);
  const response = await fetch(`https://omoikiri.ru/product/${slug}/`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${slug}: RU page returned ${response.status}`);
  const live = readVariations(await response.text()).data;
  const liveByKey = new Map(live.map((item) => [key(item), item]));

  for (const change of changes.filter((item) => item.slug === slug)) {
    const local = data.find((item) => key(item) === change.key);
    const current = liveByKey.get(change.key);
    if (!local || !current || Number(current.display_price) !== change.after.price ||
        Number(current.display_regular_price) !== change.after.regular ||
        Number(local.display_price) !== change.before.price ||
        Number(local.display_regular_price) !== change.before.regular) {
      throw new Error(`${slug} ${change.key}: source changed since audit`);
    }
    local.display_price = current.display_price;
    local.display_regular_price = current.display_regular_price;
    local.price_html = priceHtml(local);
  }

  const currentPrices = data.map((item) => Number(item.display_price)).filter((value) => value > 0);
  const low = String(roundKzt(Math.min(...currentPrices)));
  const high = String(roundKzt(Math.max(...currentPrices)));
  let next = original.replace(match[0], `data-product_variations="${encodeAttribute(data)}"`);
  next = next.replace(/("@type":"AggregateOffer","lowPrice":")\d+(","highPrice":")\d+/, `$1${low}$2${high}`);
  await writeFile(file, next);
  return data;
}

const updated = new Map();
for (const slug of slugs) updated.set(slug, await updateProduct(slug));

function catalogPriceHtml(data) {
  const values = data.map((item) => Number(item.display_price)).filter((value) => value > 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min !== max) return `<span class="price">${amount(min).html} &ndash; ${amount(max).html}</span>`;
  const variation = data.find((item) => Number(item.display_price) === min);
  return priceHtml(variation);
}

async function updateCatalogs(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await updateCatalogs(file);
      continue;
    }
    if (entry.name !== 'index.html') continue;
    let html = await readFile(file, 'utf8');
    let changed = false;
    for (const [slug, data] of updated) {
      const link = `href="/product/${slug}/index.html`;
      const at = html.indexOf(link);
      if (at < 0) continue;
      const start = html.lastIndexOf('<li class="entry ', at);
      const end = html.indexOf('</li>', at) + 5;
      if (start < 0 || end < 5) throw new Error(`${file}: product card missing for ${slug}`);
      const card = html.slice(start, end);
      const newPrice = catalogPriceHtml(data);
      const anySale = data.some((item) => Number(item.display_price) < Number(item.display_regular_price));
      let nextCard = card.replace(/<span class="price">[\s\S]*?<\/span>(?=\s*<\/a>)/, newPrice);
      if (nextCard === card && !card.includes(newPrice)) throw new Error(`${file}: price missing for ${slug}`);
      nextCard = nextCard.replace(/(<li class="entry [^">]*?)\s+sale\b/, '$1');
      nextCard = nextCard.replace(/\s*<span class="onsale">Sale!<\/span>/, '');
      if (anySale) {
        nextCard = nextCard.replace(/(<li class="entry [^">]*?)(?=\s+(?:purchasable|product-type))/, '$1 sale');
        nextCard = nextCard.replace(/(<a href="[^"]*" class="woocommerce-LoopProduct-link woocommerce-loop-product__link">)/, '$1\n\t<span class="onsale">Sale!</span>');
      }
      html = html.slice(0, start) + nextCard + html.slice(end);
      changed ||= nextCard !== card;
    }
    if (changed) await writeFile(file, html);
  }
}

for (const category of ['acs', 'disposers', 'taps']) await updateCatalogs(path.join(root, category));
console.log(`Updated ${changes.length} variations across ${slugs.length} products and their catalog cards.`);
