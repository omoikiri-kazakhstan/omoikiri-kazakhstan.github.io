import { syncStock } from '../workers/stock-sync/src/index.js';

const CHECK_MS = 5 * 60 * 1000;
const FRESH_MS = 30 * 60 * 1000;

export function startStockPoll(db, { sync = syncStock, now = Date.now, log = console } = {}) {
  let running = false;
  let retryAfter = 0;

  async function check() {
    const current = now();
    if (running || current < retryAfter) return;
    running = true;
    retryAfter = current + CHECK_MS;
    try {
      const snapshot = await db.prepare('SELECT fetched_at FROM stock_snapshot WHERE id = 1').first();
      const fetchedAt = snapshot?.fetched_at ? Date.parse(snapshot.fetched_at) : NaN;
      if (Number.isFinite(fetchedAt) && current - fetchedAt < FRESH_MS) return;
      const result = await sync(db);
      log.info('Plesk stock sync complete:', JSON.stringify(result));
    } catch (error) {
      log.error('Plesk stock sync failed; previous snapshot retained:', error);
    } finally {
      running = false;
    }
  }

  const initial = setTimeout(check, 1000);
  const interval = setInterval(check, CHECK_MS);
  initial.unref();
  interval.unref();
  return { check, stop() { clearTimeout(initial); clearInterval(interval); } };
}
