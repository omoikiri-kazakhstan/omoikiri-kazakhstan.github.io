import mysql from 'mysql2/promise';

export function translateSql(sql) {
  if (/INSERT INTO ru_price_snapshot\b/i.test(sql) && /ON CONFLICT\(id\) DO UPDATE SET/i.test(sql)) {
    return sql.replace(/ON CONFLICT\(id\) DO UPDATE SET[\s\S]*$/i,
      'ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = VALUES(fetched_at)');
  }
  if (/ON CONFLICT\(slug\) DO UPDATE SET/i.test(sql)) {
    return sql.replace(/ON CONFLICT\(slug\) DO UPDATE SET[\s\S]*$/i,
      'ON DUPLICATE KEY UPDATE visible = VALUES(visible), hidden_colors = VALUES(hidden_colors), updated_at = CURRENT_TIMESTAMP');
  }
  if (/ON CONFLICT\(id\) DO UPDATE SET/i.test(sql)) {
    return sql.replace(/ON CONFLICT\(id\) DO UPDATE SET[\s\S]*$/i,
      `ON DUPLICATE KEY UPDATE
       payload = VALUES(payload), fetched_at = VALUES(fetched_at),
       moscow_modified_at = VALUES(moscow_modified_at),
       spb_modified_at = VALUES(spb_modified_at), article_count = VALUES(article_count)`);
  }
  return sql;
}

function normalizeError(error) {
  if (error?.code === 'ER_DUP_ENTRY') {
    const duplicate = new Error(`UNIQUE constraint failed: ${error.message}`);
    duplicate.cause = error;
    return duplicate;
  }
  return error;
}

function statement(pool, sql, values = []) {
  const execute = async () => {
    try {
      const [rows] = await pool.execute(translateSql(sql), values);
      return rows;
    } catch (error) {
      throw normalizeError(error);
    }
  };
  return {
    bind(...parameters) { return statement(pool, sql, parameters); },
    async first() { return (await execute())[0] ?? null; },
    async all() { return { results: await execute() }; },
    async run() {
      const result = await execute();
      return { meta: { changes: result.affectedRows ?? 0, last_row_id: result.insertId ?? 0 } };
    },
  };
}

export function createD1Adapter(pool) {
  return {
    prepare(sql) { return statement(pool, sql); },
    async batch(statements) {
      return Promise.all(statements.map((item) => item.all()));
    },
  };
}

export function createMariaDbPool(env = process.env) {
  const required = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
  for (const key of required) {
    if (!env[key]) throw new Error(`${key} is required`);
  }
  return mysql.createPool({
    host: env.MYSQL_HOST,
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectionLimit: 5,
    waitForConnections: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
  });
}
