import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const php = process.env.PHP_BINARY || 'php';
const temp = mkdtempSync(path.join(tmpdir(), 'omoikiri-php-'));
const database = path.join(temp, 'fixture.sqlite');
execFileSync(php, [path.join(root, 'php-poc/tests/fixture.php'), database]);

const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', 'php-poc/public', 'php-poc/public/index.php'], {
  cwd: root,
  env: { ...process.env, APP_ENV: 'test', TEST_DB_DSN: `sqlite:${database}`,
    ADMIN_LOGIN: 'test-admin', ADMIN_PASSWORD: 'test-password', ADMIN_SESSION_SECRET: 'test-secret-do-not-deploy' },
  stdio: 'ignore',
});

async function request(url, options) {
  const response = await fetch(base + url, options);
  const body = await response.json();
  return { response, body };
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const result = await request('/healthz');
      ready = result.body.ok === true;
      if (ready) {
        assert.equal(result.response.headers.get('x-robots-tag'), 'noindex, nofollow');
        break;
      }
    } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'PHP server did not start');

  let result = await request('/api/prices');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.bySku['4997361'], 36000);
  result = await request('/api/stock-public');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.catalogPrices['4997361'], 219880);
  result = await request('/api/catalog');
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.items, []);

  result = await request('/api/admin/orders');
  assert.equal(result.response.status, 401);
  result = await request('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'test-admin', password: 'bad' }) });
  assert.equal(result.response.status, 401);
  result = await request('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'test-admin', password: 'test-password' }) });
  assert.equal(result.response.status, 200);
  const cookie = result.response.headers.get('set-cookie').split(';')[0];
  const auth = { Cookie: cookie, 'Content-Type': 'application/json' };
  result = await request('/api/admin/session', { headers: auth });
  assert.equal(result.body.authenticated, true);
  result = await request('/api/admin/orders', { headers: auth });
  assert.equal(result.body.orders[0].name, 'Fixture Customer');
  const orderId = result.body.orders[0].id;
  result = await request(`/api/admin/orders/${orderId}`, { method: 'PUT', headers: auth,
    body: JSON.stringify({ status: 'contacted', internalNote: 'Called' }) });
  assert.equal(result.body.status, 'contacted');
  result = await request('/api/orders/payment?requestId=c71ab029-9158-4dc2-bff9-c25a5091337a');
  assert.equal(result.body.paymentStatus, 'not_required');

  result = await request('/api/admin/catalog-overrides/akari-45', { method: 'PUT', headers: auth,
    body: JSON.stringify({ visible: true, hiddenColors: ['bl'] }) });
  assert.equal(result.response.status, 200);
  result = await request('/api/admin/catalog-overrides', { headers: auth });
  assert.deepEqual(result.body.overrides[0].hiddenColors, ['bl']);
  result = await request('/api/stock-public');
  assert.equal(result.body.catalogPrices['4997361'], undefined);

  result = await request('/api/admin/products', { method: 'POST', headers: auth,
    body: JSON.stringify({ slug: 'test-sink', name: 'Test Sink', category: 'sinks', sku: 'TEST-1',
      price: 10000, variants: [], visible: true, isCustom: true }) });
  assert.equal(result.response.status, 201);
  const id = result.body.item.id;
  result = await request(`/api/admin/products/${id}`, { method: 'PUT', headers: auth,
    body: JSON.stringify({ slug: 'test-sink', name: 'Updated Sink', category: 'sinks', sku: 'TEST-1',
      price: 11000, variants: [], visible: true, isCustom: true }) });
  assert.equal(result.body.item.name, 'Updated Sink');
  result = await request('/api/admin/products', { headers: auth });
  assert.equal(result.body.items[0].slug, 'test-sink');
  result = await request(`/api/admin/products/${id}`, { method: 'DELETE', headers: auth });
  assert.equal(result.body.ok, true);

  result = await request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(result.response.status, 503, 'Checkout must fail closed without Turnstile/Telegram');
  result = await request('/api/admin/stock-refresh', { method: 'POST' });
  assert.equal(result.response.status, 401);
  result = await request('/api/admin/logout', { method: 'POST', headers: auth });
  assert.equal(result.body.ok, true);
  result = await request('/package.json');
  assert.equal(result.response.status, 404);
  console.log('PHP HTTP checks passed');
} finally {
  server.kill();
  await new Promise((resolve) => server.once('exit', resolve));
  rmSync(temp, { recursive: true, force: true });
}
