import { requireAdmin } from '../../../_lib/auth.js';
import { badRequest, json, methodNotAllowed, readJson } from '../../../_lib/http.js';

const statuses = new Set(['new', 'contacted', 'completed', 'cancelled', 'test']);

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const id = Number(context.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return badRequest('Некорректный номер заказа.');
  let body;
  try { body = await readJson(context.request); } catch { return badRequest('Некорректные данные заказа.'); }
  const status = String(body.status || '');
  const internalNote = typeof body.internalNote === 'string' ? body.internalNote.trim() : '';
  if (!statuses.has(status) || internalNote.length > 1000) return badRequest('Некорректный статус или заметка.');
  const existing = await context.env.CATALOG_DB.prepare('SELECT id FROM orders WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: 'Заказ не найден.' }, { status: 404 });
  await context.env.CATALOG_DB.prepare('UPDATE orders SET status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(status, internalNote, id).run();
  return json({ ok: true, status, internalNote });
}

export function onRequest() {
  return methodNotAllowed();
}
