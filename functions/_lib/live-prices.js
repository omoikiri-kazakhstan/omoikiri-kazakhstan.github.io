import catalog from '../../assets/data/admin-full-catalog.json' with { type: 'json' };

const quarantinedSkus = new Set(['4999153', '4999154']);

export function kztPrice(rub) {
  return Math.ceil((rub * 6.1 - 880) / 1000) * 1000 + 880;
}

export function acceptedPrices(prices) {
  const bySku = {};
  const bySlug = {};
  if (!prices || typeof prices !== 'object') return { bySku, bySlug };
  for (const product of catalog) {
    for (const variant of product.variations || []) {
      const sku = String(variant.sku || '');
      const original = Number(variant.price);
      const current = Number(prices[sku]);
      if (!sku || quarantinedSkus.has(sku) || !Number.isSafeInteger(current) ||
          !Number.isSafeInteger(original) || original <= 0 || current === original ||
          current < original * 0.7 || current > original * 1.3) continue;
      bySku[sku] = current;
      (bySlug[product.slug] ||= {})[variant.color || 'default'] = { sku, rub: current };
    }
  }
  return { bySku, bySlug };
}

export async function loadLivePrices(db) {
  const row = await db.prepare('SELECT payload FROM stock_snapshot WHERE id = 1').first();
  if (!row?.payload) return { bySku: {}, bySlug: {}, fetchedAt: null };
  const snapshot = JSON.parse(row.payload);
  return { ...acceptedPrices(snapshot.prices), fetchedAt: snapshot.priceFetchedAt || null };
}
