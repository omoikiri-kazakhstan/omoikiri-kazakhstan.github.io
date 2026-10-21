import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stockRefreshUrl } from '../functions/api/admin/stock-refresh.js';

test('stock refresh accepts a worker origin or an existing endpoint', () => {
  assert.equal(stockRefreshUrl('https://stock.example.com'), 'https://stock.example.com/refresh');
  assert.equal(stockRefreshUrl('https://stock.example.com/'), 'https://stock.example.com/refresh');
  assert.equal(stockRefreshUrl('https://staging.omoikiri.kz/refresh'), 'https://staging.omoikiri.kz/refresh');
  assert.equal(stockRefreshUrl('https://staging.omoikiri.kz/refresh/'), 'https://staging.omoikiri.kz/refresh');
});
