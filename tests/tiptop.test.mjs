import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { matchesOrder, paymentEnabled, paymentIntent, verifyNotification } from '../functions/_lib/tiptop.js';
import { onRequestPost as check } from '../functions/api/payments/tiptop/check.js';
import { onRequestPost as pay } from '../functions/api/payments/tiptop/pay.js';

const secret = 'test-secret';
const row = {
  id: 42, request_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', customer_name: 'Test',
  phone: '+77771234567', city: 'Almaty', address: '', comment: '',
  items_json: '[]', estimated_total: 30880, payment_status: 'pending',
  payment_transaction_id: '', payment_expires_at: new Date(Date.now() + 60000).toISOString(),
  notification_status: 'pending'
};
const payload = {
  InvoiceId: '42', AccountId: row.request_id, Currency: 'KZT', Amount: '30880',
  TransactionId: '123456', OperationType: 'Payment', Status: 'Completed', TestMode: '1'
};

function request(data = payload, signature = true) {
  const body = new URLSearchParams(data).toString();
  const hmac = createHmac('sha256', secret).update(body).digest('base64');
  return new Request('https://example.test/api/payments/tiptop/check', {
    method: 'POST', body, headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Content-HMAC': signature ? hmac : 'invalid'
    }
  });
}

function context(handlerRequest, dbRow = { ...row }, paymentsEnabled = 'true') {
  const calls = [];
  const db = {
    prepare(sql) {
      const statement = {
        bind(...args) { calls.push({ sql, args }); return statement; },
        async first() { return dbRow; },
        async run() { return { meta: { changes: 1 } }; }
      };
      return statement;
    }
  };
  return { request: handlerRequest, env: {
    CATALOG_DB: db, TIPTOP_PAYMENTS_ENABLED: paymentsEnabled,
    TIPTOP_PUBLIC_TERMINAL_ID: 'pk_test', TIPTOP_API_SECRET: secret
  }, calls };
}

test('payment is gated and intent is bound to server order', () => {
  assert.equal(paymentEnabled({ TIPTOP_PAYMENTS_ENABLED: 'false', TIPTOP_PUBLIC_TERMINAL_ID: 'pk_test', TIPTOP_API_SECRET: secret }), false);
  const intent = paymentIntent({ TIPTOP_PUBLIC_TERMINAL_ID: 'pk_test' }, row);
  assert.equal(intent.amount, 30880);
  assert.equal(intent.externalId, '42');
  assert.equal(intent.userInfo.accountId, row.request_id);
});

test('HMAC and canonical order fields are checked', async () => {
  assert.equal(await verifyNotification(request(), secret, new URLSearchParams(payload).toString()), true);
  assert.equal(await verifyNotification(request(payload, false), secret, new URLSearchParams(payload).toString()), false);
  assert.equal(matchesOrder(payload, row), true);
  assert.equal(matchesOrder({ ...payload, Amount: '1' }, row), false);
  assert.equal(matchesOrder({ ...payload, Currency: 'RUB' }, row), false);
  assert.equal(matchesOrder({ ...payload, AccountId: 'other' }, row), false);
});

test('Check rejects tampering and accepts the matching order once', async () => {
  const badSignature = await check(context(request(payload, false)));
  assert.equal(badSignature.status, 401);
  const badAmount = await check(context(request({ ...payload, Amount: '1' })));
  assert.equal((await badAmount.json()).code, 12);
  const valid = context(request());
  assert.equal((await (await check(valid)).json()).code, 0);
  assert.ok(valid.calls.some(({ sql }) => sql.includes("payment_status = 'processing'")));
});

test('Check remains available for in-flight payments after checkout is disabled', async () => {
  const valid = context(request(), { ...row, payment_status: 'processing', payment_transaction_id: '123456' }, 'false');
  assert.equal((await (await check(valid)).json()).code, 0);
});

test('Pay remains available for in-flight payments after checkout is disabled', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ok: true });
  try {
    const valid = context(request(), { ...row, payment_status: 'processing', payment_transaction_id: '123456' }, 'false');
    assert.equal((await (await pay(valid)).json()).code, 0);
    assert.ok(valid.calls.some(({ sql }) => sql.includes("payment_status = 'paid'")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Pay rejects a mismatched amount before changing the order', async () => {
  const testContext = context(request({ ...payload, Amount: '1' }));
  const response = await pay(testContext);
  assert.equal(response.status, 400);
  assert.equal(testContext.calls.some(({ sql }) => sql.startsWith('UPDATE orders')), false);
});

test('Pay records the verified test transaction and labels its notification', async () => {
  const sent = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    sent.push(JSON.parse(options.body).text);
    return Response.json({ ok: true });
  };
  try {
    const testContext = context(request());
    const response = await pay(testContext);
    assert.equal((await response.json()).code, 0);
    const update = testContext.calls.find(({ sql }) => sql.includes("payment_status = 'paid'"));
    assert.equal(update.args[1], 1);
    assert.match(sent[0], /ТЕСТОВАЯ оплата заказа/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
