import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptedPrices, kztPrice } from '../functions/_lib/live-prices.js';
import { isDiscontinuedVariant, resolveOrderItems } from '../functions/_lib/order-catalog.js';
import { onRequestGet as getPrices } from '../functions/api/prices.js';

test('uses the fixed 6.1 rate and 880 rounding', () => {
  assert.equal(kztPrice(40788), 248880);
  assert.equal(kztPrice(46788), 285880);
});

test('site prices are shared by the public API and checkout', async () => {
  const snapshot = { prices: { '4999128': { price: 46788, regular: 49788 } } };
  const db = { prepare(sql) {
    if (sql.includes('stock_snapshot')) throw new Error('snapshot must not be queried');
    if (sql.includes('ru_price_snapshot')) return { first: async () => ({ payload: JSON.stringify(snapshot), fetched_at: '2026-10-21T09:00:00.000Z' }) };
    return { bind: () => ({ first: async () => null }) };
  } };
  const response = await getPrices({ env: { CATALOG_DB: db } });
  const prices = await response.json();
  assert.equal(prices.bySku['4999128'], 46788);
  assert.equal(prices.regularBySku['4999128'], 49788);
  assert.equal(prices.bySlug['dry-04'].gb.rub, 46788);
  const item = { slug: 'dry-04', sku: '4999128', price: kztPrice(46788), qty: 1 };
  assert.equal((await resolveOrderItems(db, [item])).items[0].price, item.price);
  assert.match((await resolveOrderItems(db, [{ ...item, price: kztPrice(45888) }])).error, /Цена/);
});

test('FP-07 and FP-08 orders use their matching RU article and price', async () => {
  const snapshot = { prices: {
    '4999153': { price: 17588, regular: 17588 },
    '4999154': { price: 12788, regular: 12788 },
  } };
  const db = { prepare(sql) {
    if (sql.includes('ru_price_snapshot')) return { first: async () => ({ payload: JSON.stringify(snapshot) }) };
    return { bind: () => ({ first: async () => null }) };
  } };
  const submitted = [
    { slug: 'fp-07-pro', sku: '4999153', price: kztPrice(17588), qty: 1 },
    { slug: 'fp-08-pro', sku: '4999154', price: kztPrice(12788), qty: 1 },
  ];
  const result = await resolveOrderItems(db, submitted);
  assert.deepEqual(result.items?.map(({ sku, price }) => ({ sku, price })),
    submitted.map(({ sku, price }) => ({ sku, price })));
});

test('variants absent from the RU storefront cannot be ordered', async () => {
  const variants = [
    ['akisame-41', '4997011', 'gb'],
    ['okinoshima-76-u-i', '4997151', 'wh-glossy'],
    ['sakaime-60-2', '4993913', 'ch'],
    ['sakaime-78-2', '4993198', 'dc'],
    ['shinagawa-slim', '4994526', 'gb'],
    ['wk-1-5-s', '4998039', 'in'],
  ];
  const db = { prepare(sql) {
    if (sql.includes('ru_price_snapshot')) return { first: async () => null };
    return { bind: () => ({ first: async () => null }) };
  } };
  for (const [slug, sku, color] of variants) {
    assert.equal(isDiscontinuedVariant(slug, sku, color), true);
    assert.match((await resolveOrderItems(db, [{ slug, sku, price: 1, qty: 1 }])).error, /недоступен/);
  }
});

test('accepts checked SKU prices and rejects extreme changes', () => {
  const result = acceptedPrices({
    '4999128': 46788,
    '4993866': 71188,
    '4999153': 17988,
    '4999154': 12988,
    '4994354': 999999,
  });
  assert.equal(result.bySku['4999128'], 46788);
  assert.equal(result.bySlug['dry-04'].gb.rub, 46788);
  assert.equal(result.bySku['4993866'], 71188);
  assert.equal(result.bySku['4999153'], 17988);
  assert.equal(result.bySku['4999154'], 12988);
  assert.equal(result.bySku['4994354'], undefined);
});
