import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refreshStockDirect, stockRefreshUrl } from '../functions/api/admin/stock-refresh.js';

test('stock refresh accepts a worker origin or an existing endpoint', () => {
  assert.equal(stockRefreshUrl('https://stock.example.com'), 'https://stock.example.com/refresh');
  assert.equal(stockRefreshUrl('https://stock.example.com/'), 'https://stock.example.com/refresh');
  assert.equal(stockRefreshUrl('https://staging.omoikiri.kz/refresh'), 'https://staging.omoikiri.kz/refresh');
  assert.equal(stockRefreshUrl('https://staging.omoikiri.kz/refresh/'), 'https://staging.omoikiri.kz/refresh');
});

test('direct stock refresh skips a recent snapshot', async () => {
  const fetchedAt = '2026-10-21T10:00:00.000Z';
  const db = { prepare: () => ({ first: async () => ({ fetched_at: fetchedAt }) }) };
  const result = await refreshStockDirect(db, {
    now: () => Date.parse(fetchedAt) + 60_000,
    sync: () => { throw new Error('Should not fetch'); },
  });
  assert.deepEqual(result, { skipped: true, fetchedAt });
});

test('direct stock refresh updates an old snapshot', async () => {
  const db = { prepare: () => ({ first: async () => ({ fetched_at: '2026-10-20T10:00:00.000Z' }) }) };
  let syncedDb;
  const result = await refreshStockDirect(db, {
    now: () => Date.parse('2026-10-21T10:00:00.000Z'),
    sync: async (value) => {
      syncedDb = value;
      return { fetchedAt: '2026-10-21T10:00:01.000Z' };
    },
  });
  assert.equal(syncedDb, db);
  assert.deepEqual(result, { updated: true, fetchedAt: '2026-10-21T10:00:01.000Z' });
});
