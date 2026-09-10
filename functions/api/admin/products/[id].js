import { requireAdmin } from '../../../_lib/auth.js';
import { normalizeItem, rowToItem, validationError } from '../../../_lib/catalog.js';
import { badRequest, json, methodNotAllowed, readJson } from '../../../_lib/http.js';

function idFrom(context) {
  const id = Number(context.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const id = idFrom(context);
  if (!id) return badRequest('Некорректный идентификатор позиции.');
  try {
    const body = await readJson(context.request);
    const normalized = normalizeItem(body, { isCustom: body.isCustom });
    const invalid = validationError(normalized);
    if (invalid) return invalid;
    const item = normalized.value;
    const result = await context.env.CATALOG_DB.prepare(
      `UPDATE catalog_items
       SET slug = ?, name = ?, sku = ?, category = ?, image_url = ?, price = ?, old_price = ?, description = ?, material = ?, colors = ?, specifications = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(item.slug, item.name, item.sku, item.category, item.imageUrl, item.price, item.oldPrice, item.description, item.material, item.colors, item.specifications, item.visible, id).run();
    if (!result.meta.changes) return json({ error: 'Позиция не найдена.' }, { status: 404 });
    const updated = await context.env.CATALOG_DB.prepare('SELECT * FROM catalog_items WHERE id = ?').bind(id).first();
    return json({ item: rowToItem(updated) });
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed')) return badRequest('Позиция с таким URL уже есть.');
    console.error(JSON.stringify({ scope: 'admin-update-product', error: String(error) }));
    return json({ error: 'Не удалось обновить позицию.' }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const id = idFrom(context);
  if (!id) return badRequest('Некорректный идентификатор позиции.');
  const result = await context.env.CATALOG_DB.prepare('DELETE FROM catalog_items WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return json({ error: 'Позиция не найдена.' }, { status: 404 });
  return json({ ok: true });
}

export function onRequest() {
  return methodNotAllowed();
}
