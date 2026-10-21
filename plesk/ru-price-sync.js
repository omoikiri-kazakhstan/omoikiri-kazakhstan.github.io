import catalog from '../assets/data/admin-full-catalog.json' with { type: 'json' };

const MIN_PRICE = 100;
const MAX_PRICE = 5_000_000;
const MIN_COVERAGE = 0.8;

function decodeAttribute(value) {
  return value.replaceAll('&quot;', '"').replaceAll('&#34;', '"')
    .replaceAll('&#039;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

export function parseRuPrices(html) {
  const encoded = html.match(/data-product_variations="([^"]*)"/)?.[1];
  if (!encoded || encoded === 'false') return new Map();
  const variations = JSON.parse(decodeAttribute(encoded));
  if (!Array.isArray(variations)) throw new Error('Invalid RU product variations');
  const prices = new Map();
  for (const variation of variations) {
    const sku = String(variation.sku || '').trim();
    const price = Number(variation.display_price);
    const regular = Number(variation.display_regular_price || price);
    if (!sku || !Number.isSafeInteger(price) || price < MIN_PRICE || price > MAX_PRICE ||
        !Number.isSafeInteger(regular) || regular < price || regular > MAX_PRICE) continue;
    if (prices.has(sku) && prices.get(sku).price !== price) throw new Error(`Conflicting price for ${sku}`);
    prices.set(sku, { price, regular });
  }
  return prices;
}

export function parseRuSinglePrice(html) {
  const sku = html.match(/<p class="sku">\s*арт\.\s*(\d{6,})\s*<\/p>/i)?.[1] || '';
  const start = html.indexOf('class="rrc"');
  if (start < 0) return null;
  const end = html.indexOf('class="fav_button"', start);
  const block = html.slice(start, end < 0 ? start + 600 : end).replace(/<[^>]*>/g, ' ');
  const amounts = [...block.matchAll(/\d[\d\s\u00a0]*\d|\d/g)]
    .map(([value]) => Number(value.replace(/\D/g, '')))
    .filter((value) => Number.isSafeInteger(value) && value >= MIN_PRICE && value <= MAX_PRICE);
  if (!amounts.length) return null;
  const price = amounts.at(-1);
  const regular = Math.max(price, amounts[0]);
  return { sku, price, regular };
}

export async function collectRuPrices(fetcher = fetch, products = catalog, previous = {}) {
  const previousPrices = previous.prices || previous;
  const previousSingles = previous.singles || {};
  const selected = products.map((product) => ({
    slug: product.slug,
    skus: [...new Set((product.variations?.length ? product.variations.map((item) => item.sku) : [product.sku])
      .filter(Boolean).map(String))],
  }));
  const expected = new Set(selected.flatMap((product) => product.skus));
  const prices = {};
  const singles = {};
  const errors = [];
  const observed = new Set();
  let cursor = 0;

  async function worker() {
    while (cursor < selected.length) {
      const product = selected[cursor++];
      try {
        const response = await fetcher(`https://omoikiri.ru/product/${product.slug}/`, {
          headers: { Accept: 'text/html' }, signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const live = parseRuPrices(html);
        if (!product.skus.length) {
          const single = parseRuSinglePrice(html);
          if (single) {
            singles[product.slug] = single;
            if (single.sku) prices[single.sku] = { price: single.price, regular: single.regular };
          }
          continue;
        }
        if (!live.size && product.skus.length === 1) {
          const single = parseRuSinglePrice(html);
          if (single?.sku === product.skus[0]) {
            prices[single.sku] = { price: single.price, regular: single.regular };
            observed.add(single.sku);
            continue;
          }
        }
        for (const sku of product.skus) {
          const value = live.get(sku);
          if (!value) continue;
          if (prices[sku] && prices[sku].price !== value.price) throw new Error(`Conflicting price for ${sku}`);
          prices[sku] = value;
          observed.add(sku);
        }
      } catch (error) {
        errors.push({ slug: product.slug, error: String(error.message || error) });
        if (previousSingles[product.slug]) singles[product.slug] = previousSingles[product.slug];
        for (const sku of product.skus) {
          if (previousPrices[sku]) prices[sku] = previousPrices[sku];
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, selected.length) }, worker));
  const coverage = [...observed].filter((sku) => expected.has(sku)).length / expected.size;
  if (!expected.size || coverage < MIN_COVERAGE) {
    throw new Error(`RU price coverage too low: ${(coverage * 100).toFixed(1)}%`);
  }
  return { prices, singles, expectedCount: expected.size, coverage, errors };
}

export async function syncRuPrices(db, fetcher = fetch, products = catalog) {
  const previous = await db.prepare('SELECT payload FROM ru_price_snapshot WHERE id = 1').first();
  const saved = previous?.payload ? JSON.parse(previous.payload) : {};
  const result = await collectRuPrices(fetcher, products, saved);
  const fetchedAt = new Date().toISOString();
  await db.prepare(`INSERT INTO ru_price_snapshot (id, payload, fetched_at)
    VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`)
    .bind(JSON.stringify({ prices: result.prices, singles: result.singles }), fetchedAt).run();
  return { fetchedAt, priceCount: Object.keys(result.prices).length,
    expectedCount: result.expectedCount, coverage: result.coverage, errorCount: result.errors.length };
}
