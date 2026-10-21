import catalog from '../../assets/data/admin-full-catalog.json' with { type: 'json' };

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
      if (!sku || !Number.isSafeInteger(current) ||
          !Number.isSafeInteger(original) || original <= 0 || current === original ||
          current < original * 0.7 || current > original * 1.3) continue;
      bySku[sku] = current;
      (bySlug[product.slug] ||= {})[variant.color || 'default'] = { sku, rub: current };
    }
  }
  return { bySku, bySlug };
}

export async function loadLivePrices(db) {
  const empty = { bySku: {}, regularBySku: {}, bySlug: {}, fetchedAt: null };
  let row;
  try {
    row = await db.prepare('SELECT payload, fetched_at FROM ru_price_snapshot WHERE id = 1').first();
  } catch (error) {
    if (/no such table|doesn't exist/i.test(String(error))) return empty;
    throw error;
  }
  if (!row?.payload) return empty;
  const snapshot = JSON.parse(row.payload);
  const saved = snapshot.prices || {};
  const bySku = {};
  const regularBySku = {};
  const bySlug = {};
  for (const product of catalog) {
    const variants = product.variations?.length ? product.variations : [{ sku: product.sku, color: 'default' }];
    for (const variant of variants) {
      const sku = String(variant.sku || '');
      const current = Number(saved[sku]?.price);
      const regular = Number(saved[sku]?.regular);
      if (!sku || !Number.isSafeInteger(current) ||
          current < 100 || current > 5_000_000 || !Number.isSafeInteger(regular) ||
          regular < current || regular > 5_000_000) continue;
      bySku[sku] = current;
      regularBySku[sku] = regular;
      (bySlug[product.slug] ||= {})[variant.color || 'default'] = { sku, rub: current, regular };
    }
  }
  for (const [slug, single] of Object.entries(snapshot.singles || {})) {
    const price = Number(single.price);
    const regular = Number(single.regular);
    if (!Number.isSafeInteger(price) || price < 100 || price > 5_000_000 ||
        !Number.isSafeInteger(regular) || regular < price || regular > 5_000_000) continue;
    (bySlug[slug] ||= {}).default = { sku: String(single.sku || ''), rub: price, regular };
    if (single.sku) {
      bySku[single.sku] = price;
      regularBySku[single.sku] = regular;
    }
  }
  return { bySku, regularBySku, bySlug, fetchedAt: row.fetched_at };
}
