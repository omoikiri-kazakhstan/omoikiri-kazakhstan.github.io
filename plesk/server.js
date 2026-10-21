import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createD1Adapter, createMariaDbPool } from './d1-mariadb.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDirs = new Set(['about', 'acs', 'admin-product', 'assets', 'bathsinks', 'contact',
  'dealers', 'dispenser', 'disposers', 'favorites', 'filters', 'madi-admin',
  'omoikiri-home', 'product', 'service', 'sinks', 'taps']);
const rootFiles = new Set(['index.html', '404.html', 'cart.html', 'favicon.ico', 'robots.txt', 'sitemap.xml']);
const mime = new Map(Object.entries({
  '.html': 'text/html; charset=UTF-8', '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8', '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain; charset=UTF-8',
}));

const routes = new Map(Object.entries({
  '/api/catalog': 'catalog.js',
  '/api/prices': 'prices.js',
  '/api/stock-public': 'stock-public.js',
  '/api/orders': 'orders/index.js',
  '/api/orders/payment': 'orders/payment.js',
  '/api/payments/tiptop/pay': 'payments/tiptop/pay.js',
  '/api/payments/tiptop/check': 'payments/tiptop/check.js',
  '/api/payments/tiptop/fail': 'payments/tiptop/fail.js',
  '/api/admin/access': 'admin/access.js',
  '/api/admin/login': 'admin/login.js',
  '/api/admin/logout': 'admin/logout.js',
  '/api/admin/session': 'admin/session.js',
  '/api/admin/catalog-overrides': 'admin/catalog-overrides/index.js',
  '/api/admin/products': 'admin/products/index.js',
  '/api/admin/orders': 'admin/orders.js',
  '/api/admin/stock': 'admin/stock.js',
  '/api/admin/stock-refresh': 'admin/stock-refresh.js',
}));

const STOCK_SITE_ORIGIN = 'https://stock.omoikiri.kz';
export function stockSiteCors(origin, pathname) {
  if (origin !== STOCK_SITE_ORIGIN || pathname.replace(/\/+$/, '') !== '/api/stock-public') return null;
  return {
    'Access-Control-Allow-Origin': STOCK_SITE_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
}

export function matchRoute(pathname) {
  pathname = pathname.replace(/\/+$/, '');
  const fixed = routes.get(pathname);
  if (fixed) return { file: fixed, params: {} };
  for (const [pattern, file, param] of [
    [/^\/api\/admin\/catalog-overrides\/([a-z0-9-]+)$/, 'admin/catalog-overrides/[slug].js', 'slug'],
    [/^\/api\/admin\/products\/([0-9]+)$/, 'admin/products/[id].js', 'id'],
    [/^\/api\/admin\/orders\/([0-9]+)$/, 'admin/orders/[id].js', 'id'],
  ]) {
    const matched = pathname.match(pattern);
    if (matched) return { file, params: { [param]: matched[1] } };
  }
  return null;
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers) res.setHeader(key, value);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function requestBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 65536) throw Object.assign(new Error('Payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { res.writeHead(400).end(); return; }
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').includes('..')) {
    res.writeHead(404).end(); return;
  }
  const segments = decoded.split('/').filter(Boolean);
  if (segments.length === 0) segments.push('index.html');
  if (!rootFiles.has(segments[0]) && !publicDirs.has(segments[0])) {
    res.writeHead(404).end(); return;
  }
  let file = path.resolve(root, ...segments);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const type = mime.get(path.extname(file).toLowerCase());
    if (!type) { res.writeHead(404).end(); return; }
    const size = (await stat(file)).size;
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (req.headers.range && !range) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return;
    }
    let start = 0;
    let end = size - 1;
    if (range) {
      if (range[1] === '' && range[2] === '') {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return;
      }
      if (range[1] === '') start = Math.max(0, size - Number(range[2]));
      else start = Number(range[1]);
      if (range[1] !== '' && range[2] !== '') end = Number(range[2]);
      if (start >= size || end < start || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end(); return;
      }
      end = Math.min(end, size - 1);
    }
    const headers = { 'Content-Type': type, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' };
    if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  } catch {
    res.writeHead(404).end();
  }
}

export function createApp(env = process.env, pool = createMariaDbPool(env)) {
  const runtimeEnv = { ...env, CATALOG_DB: createD1Adapter(pool) };
  return createServer(async (req, res) => {
    try {
      const hostname = req.headers.host || 'localhost';
      const protocol = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? 'https' : 'http';
      const url = new URL(req.url || '/', `${protocol}://${hostname}`);
      if (url.hostname === 'staging.omoikiri.kz') res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (url.pathname === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"ok":true}');
        return;
      }
      if (/^\/product\/wk-1-5-s(?:\/|\/index\.html)?$/.test(url.pathname)) {
        res.writeHead(410, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }).end('Product no longer available');
        return;
      }
      if (url.pathname === '/refresh') {
        const worker = (await import('../workers/stock-sync/src/index.js')).default;
        const request = new Request(url, { method: req.method, headers: req.headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : await requestBody(req) });
        await sendWebResponse(res, await worker.fetch(request, runtimeEnv));
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        const cors = stockSiteCors(req.headers.origin, url.pathname);
        if (cors) {
          for (const [key, value] of Object.entries(cors)) res.setHeader(key, value);
          if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
        }
        const route = matchRoute(url.pathname);
        if (!route) { res.writeHead(404).end(); return; }
        const handlers = await import(new URL(`../functions/api/${route.file}`, import.meta.url));
        const method = req.method?.toLowerCase() || '';
        const handler = handlers[`onRequest${method.charAt(0).toUpperCase()}${method.slice(1)}`] || handlers.onRequest;
        const request = new Request(url, { method: req.method, headers: req.headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : await requestBody(req) });
        await sendWebResponse(res, await handler({ request, env: runtimeEnv, params: route.params }));
        return;
      }
      await serveStatic(req, res, url.pathname);
    } catch (error) {
      console.error('Plesk request failed:', error);
      if (!res.headersSent) res.writeHead(error.status || 500, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' });
      res.end(error.status === 413 ? 'Payload too large' : 'Internal server error');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp();
  app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1');
}
