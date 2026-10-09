import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession } from '../functions/_lib/auth.js';
import { onRequestPut } from '../functions/api/admin/orders/[id].js';

const secret = 'test-session-secret';

async function context({ body, id = '7', authenticated = true, exists = true } = {}) {
  const cookie = authenticated ? `madi_admin_session=${await createSession(secret)}` : '';
  const updates = [];
  return {
    updates,
    params: { id },
    request: new Request('https://example.test/api/admin/orders/7', {
      method: 'PUT', headers: { cookie }, body: JSON.stringify(body || {})
    }),
    env: {
      ADMIN_SESSION_SECRET: secret,
      CATALOG_DB: { prepare(sql) { return { bind(...args) { return {
        async first() { return exists ? { id: args[0] } : null; },
        async run() { updates.push({ sql, args }); return {}; }
      }; } }; } }
    }
  };
}

test('requires admin session to change an order', async () => {
  const ctx = await context({ body: { status: 'completed' }, authenticated: false });
  assert.equal((await onRequestPut(ctx)).status, 401);
  assert.equal(ctx.updates.length, 0);
});

test('saves status and internal note for an existing order', async () => {
  const ctx = await context({ body: { status: 'contacted', internalNote: 'Позвонить завтра' } });
  const response = await onRequestPut(ctx);
  assert.equal(response.status, 200);
  assert.deepEqual(ctx.updates[0].args, ['contacted', 'Позвонить завтра', 7]);
});

test('rejects invalid status and missing order', async () => {
  const invalid = await context({ body: { status: 'sent' } });
  assert.equal((await onRequestPut(invalid)).status, 400);
  const missing = await context({ body: { status: 'completed' }, exists: false });
  assert.equal((await onRequestPut(missing)).status, 404);
});
