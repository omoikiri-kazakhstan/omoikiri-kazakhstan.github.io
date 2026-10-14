import { requireAdmin } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const row = await context.env.CATALOG_DB.prepare(
    'SELECT payload, fetched_at, article_count FROM stock_snapshot WHERE id = 1'
  ).first();
  if (!row) return json({ ready: false });
  try {
    const snapshot = JSON.parse(row.payload);
    return json({ ready: true, fetchedAt: row.fetched_at, articleCount: row.article_count, ...snapshot });
  } catch (error) {
    console.error('Invalid stock snapshot:', error);
    return json({ error: 'Не удалось прочитать остатки.' }, { status: 500 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
