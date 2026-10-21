import { createServer } from 'node:http';
import http from 'node:http';
import https from 'node:https';

const staging = new URL('https://staging.omoikiri.kz');
const production = new URL('https://omoikiri.kz');
const hopHeaders = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

export function createProxy(origin = staging) {
  const transport = origin.protocol === 'https:' ? https : http;
  return createServer((req, res) => {
    if (!req.url?.startsWith('/') || req.url.startsWith('//') || req.url.includes('\\')) {
      res.writeHead(400).end();
      return;
    }

    const destination = new URL(req.url, origin);
    const headers = { ...req.headers, host: origin.host, 'x-forwarded-proto': 'https' };
    for (const name of hopHeaders) delete headers[name];
    headers.connection = 'close';

    const upstream = transport.request(destination, { method: req.method, headers }, (response) => {
      const responseHeaders = { ...response.headers };
      for (const name of hopHeaders) delete responseHeaders[name];
      delete responseHeaders['x-robots-tag'];
      if (responseHeaders.location?.startsWith(origin.origin)) {
        responseHeaders.location = production.origin + responseHeaders.location.slice(origin.origin.length);
      }
      res.writeHead(response.statusCode || 502, responseHeaders);
      response.pipe(res);
    });
    upstream.setTimeout(30000, () => upstream.destroy(new Error('Upstream timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Сайт временно недоступен. Попробуйте позже.');
    });
    req.pipe(upstream);
  });
}

