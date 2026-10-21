import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectRuPrices, parseRuPrices, parseRuSinglePrice, syncRuPrices } from '../plesk/ru-price-sync.js';
import { startRuPricePoll } from '../plesk/ru-price-poll.js';

const products = [
  { slug: 'first', variations: [{ sku: '1001' }, { sku: '1002' }] },
  { slug: 'second', variations: [{ sku: '2001' }] },
];

function page(prices) {
  const variations = Object.entries(prices).map(([sku, price]) => ({
    sku, display_price: price, display_regular_price: price,
  }));
  return `<form data-product_variations="${JSON.stringify(variations).replaceAll('"', '&quot;')}"></form>`;
}

test('parses prices by exact SKU from RU product variations', () => {
  const prices = parseRuPrices(page({ 1001: 45888, 1002: 46788 }));
  assert.deepEqual(prices.get('1001'), { price: 45888, regular: 45888 });
  assert.equal(prices.get('1002').price, 46788);
});

test('parses a single RU product price and SKU', () => {
  const html = '<p class="sku">арт. 4998015</p><span class="rrc"><span>2 888</span></span><div class="fav_button">';
  assert.deepEqual(parseRuSinglePrice(html), { sku: '4998015', price: 2888, regular: 2888 });
});

test('collects RU site prices without using stock Excel', async () => {
  const result = await collectRuPrices(async (url) => new Response(
    url.includes('/first/') ? page({ 1001: 45888, 1002: 46788 }) : page({ 2001: 12388 })
  ), products);
  assert.equal(result.coverage, 1);
  assert.equal(result.prices['1002'].price, 46788);
});

test('collects a simple product only when its RU article matches', async () => {
  const single = [{ slug: 'single', sku: '4998015' }];
  const result = await collectRuPrices(async () => new Response(
    '<p class="sku">арт. 4998015</p><span class="rrc">2 888</span><div class="fav_button">'
  ), single);
  assert.equal(result.coverage, 1);
  assert.equal(result.prices['4998015'].price, 2888);
  await assert.rejects(collectRuPrices(async () => new Response(
    '<p class="sku">арт. 4998016</p><span class="rrc">2 888</span><div class="fav_button">'
  ), single), /coverage too low/);
});

test('low coverage never overwrites the previous snapshot', async () => {
  let writes = 0;
  const db = { prepare: () => ({ first: async () => null, bind: () => ({ run: async () => { writes++; } }) }) };
  await assert.rejects(syncRuPrices(db, async () => new Response(page({ 1001: 45888 })), products), /coverage too low/);
  assert.equal(writes, 0);
});

test('saved prices do not count as newly checked when the RU site is down', async () => {
  const previous = { prices: {
    '1001': { price: 45888, regular: 45888 },
    '1002': { price: 46788, regular: 46788 },
    '2001': { price: 12388, regular: 12388 },
  } };
  await assert.rejects(collectRuPrices(async () => { throw new Error('offline'); }, products, previous),
    /coverage too low/);
});

test('writes a complete RU site price snapshot', async () => {
  let payload;
  const db = { prepare: () => ({ first: async () => null,
    bind: (value) => ({ run: async () => { payload = JSON.parse(value); } }) }) };
  const result = await syncRuPrices(db, async (url) => new Response(
    url.includes('/first/') ? page({ 1001: 45888, 1002: 46788 }) : page({ 2001: 12388 })
  ), products);
  assert.equal(result.priceCount, 3);
  assert.equal(payload.prices['1001'].price, 45888);
});

test('daily price poll skips a fresh snapshot and retries a failed sync later', async () => {
  let now = Date.parse('2026-10-21T10:00:00.000Z');
  let fetchedAt = new Date(now - 60_000).toISOString();
  let calls = 0;
  const db = { prepare: (sql) => ({ run: async () => {},
    first: async () => sql.includes('SELECT fetched_at') ? { fetched_at: fetchedAt } : null }) };
  const poll = startRuPricePoll(db, { now: () => now,
    sync: async () => { calls++; throw new Error('source unavailable'); },
    log: { info() {}, error() {} } });
  try {
    await poll.check();
    assert.equal(calls, 0);
    now += 24 * 60 * 60 * 1000;
    await poll.check();
    assert.equal(calls, 1);
    await poll.check();
    assert.equal(calls, 1);
    now += 60 * 60 * 1000;
    await poll.check();
    assert.equal(calls, 2);
  } finally {
    poll.stop();
  }
});
