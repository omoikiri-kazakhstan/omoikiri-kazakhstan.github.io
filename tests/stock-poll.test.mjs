import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startStockPoll } from '../plesk/stock-poll.js';

test('stock poll skips a fresh snapshot and refreshes a stale one once', async () => {
  let current = Date.parse('2026-10-20T12:00:00Z');
  let fetchedAt = new Date(current - 20 * 60 * 1000).toISOString();
  let calls = 0;
  const db = { prepare: () => ({ first: async () => ({ fetched_at: fetchedAt }) }) };
  const poll = startStockPoll(db, {
    now: () => current,
    sync: async () => { calls++; return { articleCount: 1200 }; },
    log: { info() {}, error() {} },
  });
  try {
    await poll.check();
    assert.equal(calls, 0);
    current += 10 * 60 * 1000;
    await poll.check();
    await poll.check();
    assert.equal(calls, 1);
  } finally {
    poll.stop();
  }
});

test('stock poll logs a source failure and allows a later retry', async () => {
  let current = Date.parse('2026-10-20T12:00:00Z');
  let attempts = 0;
  const errors = [];
  const db = { prepare: () => ({ first: async () => null }) };
  const poll = startStockPoll(db, {
    now: () => current,
    sync: async () => { attempts++; throw new Error('source unavailable'); },
    log: { info() {}, error(...args) { errors.push(args); } },
  });
  try {
    await poll.check();
    await poll.check();
    assert.equal(attempts, 1);
    current += 5 * 60 * 1000;
    await poll.check();
    assert.equal(attempts, 2);
    assert.equal(errors.length, 2);
  } finally {
    poll.stop();
  }
});
