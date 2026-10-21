import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createApp, matchRoute, stockSiteCors } from '../plesk/server.js';
import { createD1Adapter, translateSql } from '../plesk/d1-mariadb.js';

test('all API paths map to their existing handlers', () => {
  assert.equal(matchRoute('/api/admin/products/123').params.id, '123');
  assert.equal(matchRoute('/api/admin/orders/123').file, 'admin/orders/[id].js');
  assert.equal(matchRoute('/api/admin/catalog-overrides/akita').params.slug, 'akita');
  assert.equal(matchRoute('/api/orders/').file, 'orders/index.js');
  assert.equal(matchRoute('/api/admin/products/x'), null);
});

test('stock subdomain can reach only the public stock API', () => {
  assert.equal(stockSiteCors('https://stock.omoikiri.kz', '/api/stock-public')['Access-Control-Allow-Origin'], 'https://stock.omoikiri.kz');
  assert.equal(stockSiteCors('https://stock.omoikiri.kz', '/api/admin/stock'), null);
  assert.equal(stockSiteCors('https://stock.omoikiri.kz', '/api/admin/orders'), null);
  assert.equal(stockSiteCors('https://other.example', '/api/stock-public'), null);
});

test('SQLite upserts become MariaDB upserts', () => {
  assert.match(translateSql('INSERT INTO stock_snapshot (id) VALUES (1) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload'), /ON DUPLICATE KEY UPDATE/);
  assert.match(translateSql('INSERT INTO ru_price_snapshot (id) VALUES (1) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload'), /ON DUPLICATE KEY UPDATE payload/);
  assert.match(translateSql('INSERT INTO catalog_visibility_overrides (slug) VALUES (?) ON CONFLICT(slug) DO UPDATE SET visible = excluded.visible'), /VALUES\(visible\)/);
});

test('D1 adapter preserves result shapes and duplicate semantics', async () => {
  const pool = { async execute(sql) {
    if (sql.startsWith('SELECT')) return [[{ id: 7 }]];
    if (sql.startsWith('INSERT')) return [{ affectedRows: 1, insertId: 7 }];
    throw new Error('unexpected SQL');
  } };
  const db = createD1Adapter(pool);
  assert.deepEqual(await db.prepare('SELECT id FROM orders WHERE id = ?').bind(7).first(), { id: 7 });
  assert.deepEqual((await db.prepare('INSERT INTO orders (id) VALUES (?)').bind(7).run()).meta,
    { changes: 1, last_row_id: 7 });
});

const pool = { async execute(sql) {
  if (sql.includes('stock_snapshot')) return [[{ payload: '' }]];
  return [[]];
} };
const app = createApp({}, pool);
await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
after(() => app.close());
const base = `http://127.0.0.1:${app.address().port}`;

test('Node server serves public files and blocks repository internals', async () => {
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.equal((await fetch(`${base}/`)).status, 200);
  const partial = await fetch(`${base}/index.html`, { headers: { Range: 'bytes=0-15' } });
  assert.equal(partial.status, 206);
  assert.equal((await partial.arrayBuffer()).byteLength, 16);
  assert.equal((await fetch(`${base}/functions/api/orders/index.js`)).status, 404);
  assert.equal((await fetch(`${base}/plesk/mariadb-schema.sql`)).status, 404);
  assert.equal((await fetch(`${base}/product/wk-1-5-s/`)).status, 410);
  assert.equal((await fetch(`${base}/product/wk-1-5-s/index.html?attribute_pa_color=in`)).status, 410);
});

test('Node server runs existing API handler', async () => {
  const response = await fetch(`${base}/api/prices`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { bySku: {}, regularBySku: {}, bySlug: {}, fetchedAt: null });
  const orderResponse = await fetch(`${base}/api/orders/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  assert.equal(orderResponse.status, 503);
  assert.match(orderResponse.headers.get('content-type'), /application\/json/);
});

test('stock subdomain preflight is restricted to the stock API', async () => {
  const allowed = await fetch(`${base}/api/stock-public`, {
    method: 'OPTIONS', headers: { Origin: 'https://stock.omoikiri.kz', 'Access-Control-Request-Method': 'GET' }
  });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://stock.omoikiri.kz');
  const blocked = await fetch(`${base}/api/admin/stock`, {
    method: 'OPTIONS', headers: { Origin: 'https://stock.omoikiri.kz' }
  });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});
