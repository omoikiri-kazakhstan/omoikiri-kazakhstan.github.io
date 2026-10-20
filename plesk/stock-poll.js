import { syncStock } from '../workers/stock-sync/src/index.js';

const HOUR_MS = 60 * 60 * 1000;
const FRESH_MS = 23 * HOUR_MS;

export function startStockPoll(db, { sync = syncStock, now = Date.now, log = console } = {}) {
  let running = false;
  let retryAfter = 0;

  async function check() {
    const current = now();
    if (running || current < retryAfter) return;
    running = true;
    retryAfter = current + HOUR_MS;
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
  const hourly = setInterval(check, HOUR_MS);
  initial.unref();
  hourly.unref();
  return { check, stop() { clearTimeout(initial); clearInterval(hourly); } };
}
