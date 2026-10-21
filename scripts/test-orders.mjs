import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/orders/index.js';

function database() {
  const rows = new Map();
  const overrides = new Map();
  return {
    rows,
    overrides,
    prepare(sql) {
      if (sql.includes('FROM ru_price_snapshot')) return { async first() { return null; } };
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes('FROM catalog_items')) return null;
              if (sql.includes('FROM catalog_visibility_overrides')) return overrides.get(args[0]) || null;
              return rows.get(args[0]) || null;
            },
            async run() {
              if (sql.startsWith('INSERT')) {
                const id = rows.size + 1;
                rows.set(args[0], {
                  id, request_id: args[0], customer_name: args[1], phone: args[2], city: args[3],
                  items_json: args[6], estimated_total: args[7], payment_status: args[8],
                  payment_expires_at: args[9], notification_status: 'pending'
                });
                return { meta: { last_row_id: id } };
              }
              const row = [...rows.values()].find((entry) => entry.id === args[0]);
              if (row) row.notification_status = sql.includes("'sent'") ? 'sent' : 'failed';
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
  items: [{ id: 'akisame-100-2-r-4973104', slug: 'akisame-100-2-r', name: 'AKISAME 100-2-R', sku: '4973104', color: 'Графит', qty: 1, price: 615880 }]
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
    assert.match(message.text, /Akisame 100-2-R/i);
    assert.equal(db.rows.size, 1);
    return Response.json({ ok: true });
  };
  try {
    const first = await onRequestPost(context(db, sample));
    assert.equal(first.status, 201);
    assert.deepEqual(await first.json(), { ok: true, orderId: 1, paymentStatus: 'not_required', paymentTestMode: false });
    const second = await onRequestPost(context(db, sample));
    assert.equal(second.status, 200);
    assert.equal(notifications, 1);
    assert.equal(db.rows.get(sample.requestId).notification_status, 'sent');
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
    assert.equal(db.rows.get(sample.requestId).notification_status, 'failed');
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

test('rejects forged price, unknown SKU, and hidden colors', async () => {
  const db = database();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: true });
  try {
    const invalid = [
      { ...sample.items[0], price: 1 },
      { ...sample.items[0], sku: '4990000' },
      { ...sample.items[0], slug: 'missing-product' }
    ];
    for (const item of invalid) {
      const response = await onRequestPost(context(db, { ...sample, items: [item] }));
      assert.equal(response.status, 400);
    }
    db.overrides.set('akisame-100-2-r', { visible: 1, hidden_colors: '["gm"]' });
    const hidden = await onRequestPost(context(db, sample));
    assert.equal(hidden.status, 400);
    assert.equal(db.rows.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
