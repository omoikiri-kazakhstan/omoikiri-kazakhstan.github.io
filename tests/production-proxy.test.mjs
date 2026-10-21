import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { createProxy } from '../production-proxy/server.js';

let upstream;
let proxy;
let url;

before(async () => {
  upstream = createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: `http://127.0.0.1:${upstream.address().port}/next` }).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex, nofollow' });
    req.pipe(res);
    if (req.method === 'GET') res.end(`${req.method} ${req.url} ${req.headers.host}`);
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  proxy = createProxy(new URL(`http://127.0.0.1:${upstream.address().port}`));
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${proxy.address().port}`;
});

after(async () => {
  await Promise.all([new Promise((resolve) => proxy.close(resolve)), new Promise((resolve) => upstream.close(resolve))]);
});

test('forwards path and removes staging noindex', async () => {
  const response = await fetch(`${url}/product/akita/?attribute_pa_color=bn`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-robots-tag'), null);
  assert.match(await response.text(), /^GET \/product\/akita\/\?attribute_pa_color=bn 127\.0\.0\.1:/);
});

test('forwards request body', async () => {
  const response = await fetch(`${url}/api/orders/`, { method: 'POST', body: 'order-test' });
  assert.equal(await response.text(), 'order-test');
});

test('rewrites upstream redirects to the public domain', async () => {
  const response = await fetch(`${url}/redirect`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://omoikiri.kz/next');
});

test('rejects absolute-form request target', async () => {
  const response = await fetch(`${url}//example.com/`);
  assert.equal(response.status, 400);
});
