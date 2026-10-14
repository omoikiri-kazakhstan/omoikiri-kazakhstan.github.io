import { unzipSync } from 'fflate';
import { XMLParser } from 'fast-xml-parser';

const SOURCES = {
  moscow: 'https://omoikiri.ru/ostatki/Ostatki_Omoikiri_Msk%20(XLSX).xlsx',
  spb: 'https://omoikiri.ru/ostatki/Ostatki_Omoikiri_SPb%20(XLSX).xlsx',
};
const MAX_FILE_BYTES = 5_000_000;
const MIN_ARTICLES_PER_FILE = 500;
const MAX_SOURCE_GAP_MS = 20 * 60_000;
const MANUAL_COOLDOWN_MS = 2 * 60_000;

export async function parseStock(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false });
  const xml = (path) => {
    if (!files[path] || files[path].byteLength > 20_000_000) throw new Error(`Missing or oversized XLSX part: ${path}`);
    return parser.parse(new TextDecoder().decode(files[path]));
  };
  const asArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value];
  const shared = asArray(xml('xl/sharedStrings.xml').sst.si).map((si) =>
    si.t?.['#text'] ?? si.t ?? asArray(si.r).map((run) => run.t?.['#text'] ?? run.t ?? '').join(''));
  const styles = xml('xl/styles.xml').styleSheet;
  const formats = new Map(asArray(styles.numFmts?.numFmt).map((format) =>
    [Number(format['@_numFmtId']), format['@_formatCode']]));
  const xfs = asArray(styles.cellXfs?.xf);
  const rows = asArray(xml('xl/worksheets/sheet1.xml').worksheet.sheetData?.row);
  const cellValue = (cell) => cell?.['@_t'] === 's' ? shared[Number(cell.v)] : cell?.v;
  const header = rows.find((row) => Number(row['@_r']) === 10);
  if (!header || cellValue(asArray(header.c).find((cell) => cell['@_r'] === 'J10')) !== 'Сейчас') {
    throw new Error('Unexpected stock sheet layout');
  }

  const items = {};
  for (const row of rows) {
    if (Number(row['@_r']) <= 12) continue;
    const cells = Object.fromEntries(asArray(row.c).map((cell) => [cell['@_r'].replace(/\d+$/, ''), cell]));
    const sku = String(cellValue(cells.A) ?? '').trim();
    const name = cellValue(cells.B) || cellValue(cells.D);
    const price = Number(cellValue(cells.I));
    const quantity = Number(cellValue(cells.J));
    if (!sku || !name || !Number.isFinite(price)) continue;
    if (!Number.isSafeInteger(quantity) || quantity < 0) continue;
    if (Object.hasOwn(items, sku)) throw new Error(`Duplicate article: ${sku}`);
    const formatId = Number(xfs[Number(cells.J['@_s'] || 0)]?.['@_numFmtId']);
    items[sku] = { quantity, more: String(formats.get(formatId) || '').includes('"+"'), name: String(name).trim(), price };
  }
  if (Object.keys(items).length < MIN_ARTICLES_PER_FILE) {
    throw new Error(`Only ${Object.keys(items).length} valid stock rows`);
  }
  return items;
}

async function downloadStock(url, fetcher) {
  const response = await fetcher(url, {
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Stock source returned HTTP ${response.status}`);
  const statedLength = Number(response.headers.get('content-length'));
  if (statedLength > MAX_FILE_BYTES) throw new Error('Stock file is too large');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 100 || buffer.byteLength > MAX_FILE_BYTES || new Uint8Array(buffer)[0] !== 0x50) {
    throw new Error('Stock response is not a valid-sized XLSX file');
  }
  const modifiedAt = response.headers.get('last-modified');
  return { items: await parseStock(buffer), modifiedAt: modifiedAt ? new Date(modifiedAt).toISOString() : null };
}

export function mergeStock(moscow, spb) {
  const items = {};
  for (const sku of new Set([...Object.keys(moscow), ...Object.keys(spb)])) {
    const first = moscow[sku];
    const second = spb[sku];
    items[sku] = {
      name: first?.name || second?.name || '',
      moscow: first?.quantity ?? null,
      moscowMore: first?.more ?? false,
      spb: second?.quantity ?? null,
      spbMore: second?.more ?? false,
      total: (first?.quantity ?? 0) + (second?.quantity ?? 0),
      totalMore: Boolean(first?.more || second?.more),
    };
  }
  return items;
}

export function mergePrices(moscow, spb) {
  const prices = {};
  for (const sku of new Set([...Object.keys(moscow), ...Object.keys(spb)])) {
    const first = moscow[sku]?.price;
    const second = spb[sku]?.price;
    if (first != null && second != null && first !== second) {
      throw new Error(`Price mismatch between warehouses for ${sku}`);
    }
    const price = first ?? second;
    if (!Number.isSafeInteger(price) || price < 100 || price > 5_000_000) continue;
    prices[sku] = price;
  }
  if (Object.keys(prices).length < MIN_ARTICLES_PER_FILE) throw new Error('Too few valid prices');
  return prices;
}

export async function syncStock(db, fetcher = fetch) {
  // Parse and validate both sources before touching the last good snapshot.
  const [moscow, spb] = await Promise.all([
    downloadStock(SOURCES.moscow, fetcher),
    downloadStock(SOURCES.spb, fetcher),
  ]);
  if (moscow.modifiedAt && spb.modifiedAt &&
      Math.abs(Date.parse(moscow.modifiedAt) - Date.parse(spb.modifiedAt)) > MAX_SOURCE_GAP_MS) {
    throw new Error('Stock sources are out of sync');
  }
  const previous = await db.prepare(
    'SELECT moscow_modified_at, spb_modified_at, payload FROM stock_snapshot WHERE id = 1'
  ).first();
  if (previous && (moscow.modifiedAt && previous.moscow_modified_at && moscow.modifiedAt < previous.moscow_modified_at ||
                   spb.modifiedAt && previous.spb_modified_at && spb.modifiedAt < previous.spb_modified_at)) {
    throw new Error('Stock source is older than the saved snapshot');
  }
  const items = mergeStock(moscow.items, spb.items);
  const fetchedAt = new Date().toISOString();
  const previousPayload = previous?.payload ? JSON.parse(previous.payload) : {};
  const priceFetchedAt = previousPayload.priceFetchedAt;
  const refreshPrices = !priceFetchedAt || priceFetchedAt.slice(0, 10) !== fetchedAt.slice(0, 10);
  let prices = previousPayload.prices || {};
  let nextPriceFetchedAt = priceFetchedAt || null;
  if (refreshPrices) {
    try {
      prices = mergePrices(moscow.items, spb.items);
      nextPriceFetchedAt = fetchedAt;
    } catch (error) {
      console.error('Price update skipped; previous prices retained:', error);
    }
  }
  const payload = JSON.stringify({ items, sources: {
    moscow: { modifiedAt: moscow.modifiedAt },
    spb: { modifiedAt: spb.modifiedAt },
  }, prices, priceFetchedAt: nextPriceFetchedAt });
  await db.prepare(
    `INSERT INTO stock_snapshot (id, payload, fetched_at, moscow_modified_at, spb_modified_at, article_count)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload = excluded.payload,
       fetched_at = excluded.fetched_at,
       moscow_modified_at = excluded.moscow_modified_at,
       spb_modified_at = excluded.spb_modified_at,
       article_count = excluded.article_count`
  ).bind(payload, fetchedAt, moscow.modifiedAt, spb.modifiedAt, Object.keys(items).length).run();
  return { fetchedAt, articleCount: Object.keys(items).length, priceFetchedAt: nextPriceFetchedAt, sources: { moscow: moscow.modifiedAt, spb: spb.modifiedAt } };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncStock(env.CATALOG_DB).then((result) => {
      console.log('Stock sync complete', JSON.stringify(result));
    }).catch((error) => {
      console.error('Stock sync failed; last snapshot retained:', error);
      throw error;
    }));
  },
  async fetch(request, env) {
    const respond = (body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store' },
    });
    if (new URL(request.url).pathname !== '/refresh') return respond({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
    if (!env.STOCK_SYNC_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.STOCK_SYNC_TOKEN}`) {
      return respond({ error: 'Unauthorized' }, 401);
    }
    const previous = await env.CATALOG_DB.prepare('SELECT fetched_at FROM stock_snapshot WHERE id = 1').first();
    if (previous?.fetched_at && Date.now() - Date.parse(previous.fetched_at) < MANUAL_COOLDOWN_MS) {
      return respond({ skipped: true, fetchedAt: previous.fetched_at });
    }
    try {
      return respond({ updated: true, ...await syncStock(env.CATALOG_DB) });
    } catch (error) {
      console.error('Manual stock sync failed; last snapshot retained:', error);
      return respond({ error: 'Не удалось обновить остатки. Предыдущая выгрузка сохранена.' }, 502);
    }
  },
};
