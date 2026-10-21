import { createD1Adapter, createMariaDbPool } from './d1-mariadb.js';
import { syncRuPrices } from './ru-price-sync.js';

const pool = createMariaDbPool();
try {
  const db = createD1Adapter(pool);
  await db.prepare(`CREATE TABLE IF NOT EXISTS ru_price_snapshot (
    id INTEGER PRIMARY KEY, payload LONGTEXT NOT NULL, fetched_at VARCHAR(40) NOT NULL
  )`).run();
  console.log(JSON.stringify(await syncRuPrices(db)));
} finally {
  await pool.end();
}
