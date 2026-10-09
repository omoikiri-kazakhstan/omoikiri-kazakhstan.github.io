import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/orders/index.js';

function database() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              const row = rows.get(args[0]);
              return row ? { id: row.id } : null;
            },
            async run() {
              if (sql.startsWith('INSERT')) {
                const id = rows.size + 1;
                rows.set(args[0], { id, status: 'pending', items: args[6], total: args[7] });
                return { meta: { last_row_id: id } };
              }
              const row = [...rows.values()].find((entry) => entry.id === args[0]);
              if (row) row.status = sql.includes("'sent'") ? 'sent' : 'failed';
              return {};
            }
          };
        }
      };
    }
  };
}

const sample = {
  requestId: '78e3732b-cfaf-43e6-b6ac-c88804a83700',
  name: 'Мади', phone: '+7 777 123 45 67', city: 'Алматы', address: '', comment: '', consent: true,
  turnstileToken: 'test-turnstile-token',
  items: [{ id: 'akisame-100-2-r-gm', name: 'AKISAME 100-2-R', sku: '4990000', color: 'Графит', qty: 1, price: 615880 }]
};

function context(db, body) {
  return {
    request: new Request('https://example.test/api/orders/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    env: { CATALOG_DB: db, TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '123456789', TURNSTILE_SECRET: 'test-secret' }
  };
}

test('saves order before notification and does not send twice', async () => {
  const db = database();
  const originalFetch = globalThis.fetch;
  let notifications = 0;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('siteverify')) return Response.json({ success: true });
    notifications += 1;
    const message = JSON.parse(options.body);
    assert.match(message.text, /AKISAME 100-2-R/);
    assert.equal(db.rows.size, 1);
    return Response.json({ ok: true });
  };
  try {
    const first = await onRequestPost(context(db, sample));
    assert.equal(first.status, 201);
    assert.deepEqual(await first.json(), { ok: true, orderId: 1 });
    const second = await onRequestPost(context(db, sample));
    assert.equal(second.status, 200);
    assert.equal(notifications, 1);
    assert.equal(db.rows.get(sample.requestId).status, 'sent');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('keeps the order if Telegram fails', async () => {
  const db = database();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).includes('siteverify') ? Response.json({ success: true }) : Promise.reject(new Error('offline'));
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await onRequestPost(context(db, sample));
    assert.equal(response.status, 201);
    assert.equal(db.rows.get(sample.requestId).status, 'failed');
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

test('rejects invalid contact data and empty cart', async () => {
  const db = database();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true });
  try {
  for (const body of [{ ...sample, phone: '123' }, { ...sample, items: [] }, { ...sample, consent: false }]) {
    const response = await onRequestPost(context(db, body));
    assert.equal(response.status, 400);
  }
  assert.equal(db.rows.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects failed Turnstile verification', async () => {
  const db = database();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: false });
  try {
    const response = await onRequestPost(context(db, sample));
    assert.equal(response.status, 400);
    assert.equal(db.rows.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
