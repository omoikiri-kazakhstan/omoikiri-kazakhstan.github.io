import { json, methodNotAllowed } from '../_lib/http.js';
import catalog from '../../assets/data/admin-full-catalog.json' with { type: 'json' };
import { kztPrice, loadLivePrices } from '../_lib/live-prices.js';
import { isDiscontinuedVariant } from '../_lib/order-catalog.js';

function catalogPrices(items, livePrices, overrides) {
  const prices = {};
  for (const product of catalog) {
    const override = overrides.get(product.slug);
    if (override && !override.visible) continue;
    for (const variant of product.variations || []) {
      const sku = String(variant.sku || '');
      if (!Object.hasOwn(items, sku) || isDiscontinuedVariant(product.slug, sku, variant.color) ||
          override?.hiddenColors.includes(variant.color)) continue;
      const rub = livePrices.bySku[sku] || Number(variant.price);
      if (Number.isSafeInteger(rub) && rub > 0) prices[sku] = kztPrice(rub);
    }
    if (product.variations?.length || !product.sku || !Object.hasOwn(items, product.sku)) continue;
    if (isDiscontinuedVariant(product.slug, product.sku)) continue;
    const rub = livePrices.bySku[product.sku] || livePrices.bySlug[product.slug]?.default?.rub;
    const price = rub ? kztPrice(rub) : Number(product.price);
    if (Number.isSafeInteger(price) && price > 0) prices[product.sku] = price;
  }
  return prices;
}

export async function onRequestGet(context) {
  const row = await context.env.CATALOG_DB.prepare(
    'SELECT payload, fetched_at, article_count FROM stock_snapshot WHERE id = 1'
  ).first();
  if (!row) return json({ ready: false }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const snapshot = JSON.parse(row.payload);
    const items = snapshot.items || {};
    const [livePrices, overrideRows] = await Promise.all([
      loadLivePrices(context.env.CATALOG_DB),
      context.env.CATALOG_DB.prepare('SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides').all(),
    ]);
    const overrides = new Map(overrideRows.results.map((row) => {
      let hiddenColors = [];
      try { hiddenColors = JSON.parse(row.hidden_colors || '[]'); } catch { /* ignore malformed override */ }
      return [row.slug, { visible: Boolean(row.visible), hiddenColors: Array.isArray(hiddenColors) ? hiddenColors : [] }];
    }));
    return json({
      ready: true,
      fetchedAt: row.fetched_at,
      articleCount: row.article_count,
      items,
      sources: snapshot.sources || {},
      catalogPrices: catalogPrices(items, livePrices, overrides),
      priceFetchedAt: livePrices.fetchedAt,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Invalid stock snapshot:', error);
    return json({ error: 'Не удалось прочитать остатки.' }, { status: 500 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
