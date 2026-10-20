import { createD1Adapter, createMariaDbPool } from './d1-mariadb.js';
import { syncStock } from '../workers/stock-sync/src/index.js';

const pool = createMariaDbPool();
try {
  const result = await syncStock(createD1Adapter(pool));
  console.log(JSON.stringify({ scope: 'stock-sync', ...result }));
} catch (error) {
  console.error('Stock sync failed; previous snapshot retained:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
