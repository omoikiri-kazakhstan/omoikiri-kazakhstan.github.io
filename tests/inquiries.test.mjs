import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/inquiries.js';

const env = { TURNSTILE_SECRET: 'test-secret', TELEGRAM_BOT_TOKEN: 'test-bot', TELEGRAM_CHAT_ID: 'test-chat' };
const valid = {
  name: 'Тест', phone: '+7 700 000 00 00', email: '', message: 'Тестовый вопрос по товару',
  productPath: '/product/fp-07-pro/', consent: true, turnstileToken: 'test-token'
};
const context = (body) => ({
  env,
  request: new Request('https://staging.omoikiri.kz/api/inquiries', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })
});

test('inquiry rejects invalid contact details before external calls', async () => {
  const response = await onRequestPost(context({ ...valid, phone: '', email: '' }));
  assert.equal(response.status, 400);
});

test('inquiry verifies Turnstile before sending the question to Telegram', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(JSON.stringify({ success: true, ok: true }), { status: 200 });
  };
  try {
    const response = await onRequestPost(context(valid));
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.includes('turnstile/v0/siteverify'));
    assert.ok(calls[1].url.includes('api.telegram.org'));
    const message = JSON.parse(calls[1].options.body).text;
    assert.match(message, /\/product\/fp-07-pro\//);
    assert.match(message, /Тестовый вопрос/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('inquiry does not notify Telegram after failed Turnstile validation', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ success: false }), { status: 200 });
  };
  try {
    const response = await onRequestPost(context(valid));
    assert.equal(response.status, 400);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
