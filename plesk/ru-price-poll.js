import { syncRuPrices } from './ru-price-sync.js';

const HOUR_MS = 60 * 60 * 1000;
const FRESH_MS = 23 * HOUR_MS;

export function startRuPricePoll(db, { sync = syncRuPrices, now = Date.now, log = console } = {}) {
  let running = false;
  let retryAfter = 0;

  async function check() {
    const current = now();
    if (running || current < retryAfter) return;
    running = true;
    retryAfter = current + HOUR_MS;
    try {
      await db.prepare(`CREATE TABLE IF NOT EXISTS ru_price_snapshot (
        id INTEGER PRIMARY KEY, payload LONGTEXT NOT NULL, fetched_at VARCHAR(40) NOT NULL
      )`).run();
      const snapshot = await db.prepare('SELECT fetched_at FROM ru_price_snapshot WHERE id = 1').first();
      const fetchedAt = snapshot?.fetched_at ? Date.parse(snapshot.fetched_at) : NaN;
      if (Number.isFinite(fetchedAt) && current - fetchedAt < FRESH_MS) return;
      const result = await sync(db);
      log.info('RU price sync complete:', JSON.stringify(result));
    } catch (error) {
      log.error('RU price sync failed; previous snapshot retained:', error);
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
