import { writeFileSync } from 'node:fs';
import { syncStock } from '../src/index.js';

const output = process.argv[2];
if (!output) throw new Error('Pass an output .sql path');

const quote = (value) => value === null ? 'NULL' :
  typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;

const db = {
  prepare() {
    return {
      first: async () => null,
      bind(...values) {
        return {
          run: async () => {
            const [payload, fetchedAt, moscowAt, spbAt, count] = values;
            const characters = Array.from(payload);
            const chunks = [];
            for (let index = 0; index < characters.length; index += 10000) {
              chunks.push(characters.slice(index, index + 10000).join(''));
            }
            const statements = [
              `INSERT OR REPLACE INTO stock_snapshot (id, payload, fetched_at, moscow_modified_at, spb_modified_at, article_count) VALUES (1, ${quote(chunks[0])}, ${quote(fetchedAt)}, ${quote(moscowAt)}, ${quote(spbAt)}, ${quote(count)});`,
              ...chunks.slice(1).map((chunk) => `UPDATE stock_snapshot SET payload = payload || ${quote(chunk)} WHERE id = 1;`),
            ];
            writeFileSync(output, `${statements.join('\n')}\n`, { flag: 'wx' });
          },
        };
      },
    };
  },
};

console.log(await syncStock(db));
