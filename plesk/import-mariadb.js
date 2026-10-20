import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { createMariaDbPool } from './d1-mariadb.js';

const tables = ['catalog_items', 'admin_magic_links', 'catalog_visibility_overrides', 'orders', 'stock_snapshot'];
const directory = process.argv[2];
if (!directory) throw new Error('Usage: node plesk/import-mariadb.js <private-jsonl-dir>');
const available = new Set(await readdir(directory));
for (const table of tables) {
  if (!available.has(`${table}.jsonl`)) throw new Error(`Missing ${table}.jsonl`);
}

const pool = createMariaDbPool();
const connection = await pool.getConnection();
try {
  await connection.query("SET time_zone = '+00:00'");
  for (const table of tables) {
    const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
    if (count !== 0) throw new Error(`${table} is not empty; refusing to import`);
  }
  await connection.beginTransaction();
  for (const table of tables) {
    let count = 0;
    let columns = null;
    const stream = readline.createInterface({ input: createReadStream(path.join(directory, `${table}.jsonl`), { encoding: 'utf8' }), crlfDelay: Infinity });
    for await (const line of stream) {
      if (!line) continue;
      const row = JSON.parse(line);
      if (!columns) {
        columns = Object.keys(row);
        const [known] = await connection.query(`SHOW COLUMNS FROM ${table}`);
        const allowed = new Set(known.map(({ Field }) => Field));
        if (columns.some((column) => !allowed.has(column))) throw new Error(`Unexpected column in ${table}`);
      }
      if (Object.keys(row).join('\0') !== columns.join('\0')) throw new Error(`Inconsistent columns in ${table}`);
      await connection.execute(
        `INSERT INTO ${table} (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map((column) => row[column]),
      );
      count++;
    }
    console.log(`${table}: ${count}`);
  }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
