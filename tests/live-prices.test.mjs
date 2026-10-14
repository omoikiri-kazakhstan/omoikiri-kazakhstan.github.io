import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptedPrices, kztPrice } from '../functions/_lib/live-prices.js';
import { resolveOrderItems } from '../functions/_lib/order-catalog.js';

test('uses the fixed 6.1 rate and 880 rounding', () => {
  assert.equal(kztPrice(40788), 248880);
  assert.equal(kztPrice(46788), 285880);
});

test('checkout validates the same updated price shown to the customer', async () => {
  const db = { prepare(sql) {
    if (sql.includes('stock_snapshot')) return { first: async () => ({
      payload: JSON.stringify({ prices: { '4999128': 46788 }, priceFetchedAt: '2026-10-12T08:00:00Z' }),
    }) };
    return { bind: () => ({ first: async () => null }) };
  } };
  const item = { slug: 'dry-04', sku: '4999128', price: kztPrice(46788), qty: 1 };
  assert.equal((await resolveOrderItems(db, [item])).items[0].price, item.price);
  assert.match((await resolveOrderItems(db, [{ ...item, price: kztPrice(45888) }])).error, /Цена/);
});

test('accepts checked SKU prices and quarantines mismapped or extreme changes', () => {
  const result = acceptedPrices({
    '4999128': 46788,
    '4993866': 71188,
    '4999153': 17588,
    '4999154': 12788,
    '4994354': 999999,
  });
  assert.equal(result.bySku['4999128'], 46788);
  assert.equal(result.bySlug['dry-04'].gb.rub, 46788);
  assert.equal(result.bySku['4993866'], 71188);
  assert.equal(result.bySku['4999153'], undefined);
  assert.equal(result.bySku['4999154'], undefined);
  assert.equal(result.bySku['4994354'], undefined);
});
