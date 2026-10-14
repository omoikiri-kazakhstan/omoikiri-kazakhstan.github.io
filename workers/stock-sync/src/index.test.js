import assert from 'node:assert/strict';
import { test } from 'node:test';
import { zipSync, strToU8 } from 'fflate';
import worker, { mergePrices, mergeStock, parseStock, syncStock } from './index.js';

function workbook(firstQuantity = 10, more = true, firstPrice = 100) {
  const rows = ['<row r="10"><c r="J10" t="s"><v>0</v></c></row>'];
  for (let index = 0; index < 501; index++) {
    const row = index + 13;
    rows.push(`<row r="${row}"><c r="A${row}"><v>${index + 1000}</v></c><c r="B${row}" t="s"><v>1</v></c><c r="I${row}"><v>${index === 0 ? firstPrice : 100}</v></c><c r="J${row}" s="${more ? 1 : 0}"><v>${index === 0 ? firstQuantity : 0}</v></c></row>`);
  }
  const parts = {
    'xl/sharedStrings.xml': '<sst><si><t>Сейчас</t></si><si><t>Product</t></si></sst>',
    'xl/styles.xml': '<styleSheet><numFmts><numFmt numFmtId="164" formatCode="0&quot;+&quot;"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="164"/></cellXfs></styleSheet>',
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${rows.join('')}</sheetData></worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(parts).map(([key, value]) => [key, strToU8(value)])));
}

test('reads custom plus format and merges lower-bound quantities', async () => {
  const first = await parseStock(workbook(10, true));
  const second = await parseStock(workbook(10, true));
  const result = mergeStock(first, second);
  assert.deepEqual(result['1000'], {
    name: 'Product',
    moscow: 10, moscowMore: true, spb: 10, spbMore: true, total: 20, totalMore: true,
  });
});

test('does not replace snapshot when either source is invalid', async () => {
  let writes = 0;
  const db = { prepare: () => ({ first: async () => null, bind: () => ({ run: async () => { writes++; } }) }) };
  const good = workbook();
  const fetcher = async (url) => new Response(url.includes('Msk') ? good : 'not an xlsx', {
    headers: { 'last-modified': 'Mon, 12 Oct 2026 07:30:14 GMT' },
  });
  await assert.rejects(syncStock(db, fetcher));
  assert.equal(writes, 0);
});

test('writes one complete snapshot after both sources pass', async () => {
  let payload;
  const db = { prepare: () => ({ first: async () => null, bind: (...values) => ({ run: async () => { payload = JSON.parse(values[0]); } }) }) };
  const fetcher = async () => new Response(workbook(), {
    headers: { 'last-modified': 'Mon, 12 Oct 2026 07:30:14 GMT' },
  });
  const result = await syncStock(db, fetcher);
  assert.equal(result.articleCount, 501);
  assert.equal(payload.items['1000'].total, 20);
  assert.equal(payload.items['1000'].totalMore, true);
  assert.equal(payload.prices['1000'], 100);
  assert.ok(payload.priceFetchedAt);
});

test('rejects conflicting city prices and retains the previous daily snapshot', async () => {
  assert.throws(() => mergePrices({ '1000': { price: 100 } }, { '1000': { price: 200 } }), /mismatch/);
  let payload;
  const db = { prepare: () => ({
    first: async () => ({ payload: JSON.stringify({ prices: { '1000': 120 }, priceFetchedAt: '2026-10-11T07:00:00.000Z' }) }),
    bind: (...values) => ({ run: async () => { payload = JSON.parse(values[0]); } }),
  }) };
  const fetcher = async (url) => new Response(workbook(10, true, url.includes('Msk') ? 100 : 200), {
    headers: { 'last-modified': 'Mon, 12 Oct 2026 07:30:14 GMT' },
  });
  await syncStock(db, fetcher);
  assert.equal(payload.items['1000'].total, 20);
  assert.equal(payload.prices['1000'], 120);
  assert.equal(payload.priceFetchedAt, '2026-10-11T07:00:00.000Z');
});

test('keeps the daily prices while refreshing stock again on the same day', async () => {
  let payload;
  const today = new Date().toISOString();
  const db = { prepare: () => ({
    first: async () => ({ payload: JSON.stringify({ prices: { '1000': 120 }, priceFetchedAt: today }) }),
    bind: (...values) => ({ run: async () => { payload = JSON.parse(values[0]); } }),
  }) };
  await syncStock(db, async () => new Response(workbook(), {
    headers: { 'last-modified': 'Mon, 12 Oct 2026 07:30:14 GMT' },
  }));
  assert.equal(payload.prices['1000'], 120);
  assert.equal(payload.priceFetchedAt, today);
});

test('rejects older source files without replacing the snapshot', async () => {
  let writes = 0;
  const db = { prepare: () => ({
    first: async () => ({ moscow_modified_at: '2026-10-12T08:00:00.000Z', spb_modified_at: '2026-10-12T08:00:00.000Z' }),
    bind: () => ({ run: async () => { writes++; } }),
  }) };
  const fetcher = async () => new Response(workbook(), {
    headers: { 'last-modified': 'Mon, 12 Oct 2026 07:30:14 GMT' },
  });
  await assert.rejects(syncStock(db, fetcher), /older/);
  assert.equal(writes, 0);
});

test('manual refresh requires its server-side token', async () => {
  const env = { STOCK_SYNC_TOKEN: 'test-secret', CATALOG_DB: { prepare: () => { throw new Error('Database should not be read'); } } };
  const request = new Request('https://stock.example/refresh', { method: 'POST' });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 401);
});

test('manual refresh skips a recently completed sync', async () => {
  const fetchedAt = new Date().toISOString();
  const env = {
    STOCK_SYNC_TOKEN: 'test-secret',
    CATALOG_DB: { prepare: () => ({ first: async () => ({ fetched_at: fetchedAt }) }) },
  };
  const request = new Request('https://stock.example/refresh', {
    method: 'POST', headers: { Authorization: 'Bearer test-secret' },
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { skipped: true, fetchedAt });
});
