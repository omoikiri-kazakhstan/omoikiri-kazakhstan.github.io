import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequestGet } from '../functions/api/stock-public.js';

test('public stock response includes catalog retail prices, not Excel prices', async () => {
  const row = {
    payload: JSON.stringify({
      items: {
        4997361: { name: 'Test sink', moscow: 2, spb: 3, total: 5 },
        4990001: { name: 'Other item', moscow: 1, spb: 0, total: 1 },
        4995013: { name: 'Archived dispenser', moscow: 1, spb: 0, total: 1 },
        4997360: { name: 'Hidden color', moscow: 1, spb: 0, total: 1 },
        4997011: { name: 'Removed color', moscow: 1, spb: 0, total: 1 },
        4998039: { name: 'Removed product', moscow: 1, spb: 0, total: 1 },
      },
      sources: { moscow: { modifiedAt: '2026-10-21T10:00:00Z' } },
      prices: { 4997361: 123456, 4990001: 100000 },
      priceFetchedAt: '2026-10-21T10:00:00Z',
    }),
    fetched_at: '2026-10-21T10:30:00Z',
    article_count: 2,
  };
  const response = await onRequestGet({ env: { CATALOG_DB: {
    prepare: (sql) => ({ all: async () => ({ results: [{ slug: 'akari-45', visible: 1, hidden_colors: '["wh"]' }] }), first: async () => sql.includes('ru_price_snapshot') ? {
      payload: JSON.stringify({ prices: { 4997361: { price: 40000, regular: 40000 } } }),
      fetched_at: '2026-10-21T09:00:00Z',
    } : row }),
  } } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.items['4997361'].total, 5);
  assert.equal(body.articleCount, 2);
  assert.equal(body.prices, undefined);
  assert.equal(body.catalogPrices['4997361'], 244880);
  assert.equal(body.catalogPrices['4990001'], undefined);
  assert.equal(body.catalogPrices['4995013'], undefined);
  assert.equal(body.catalogPrices['4997360'], undefined);
  assert.equal(body.catalogPrices['4997011'], undefined);
  assert.equal(body.catalogPrices['4998039'], undefined);
  assert.equal(body.priceFetchedAt, '2026-10-21T09:00:00Z');
});
