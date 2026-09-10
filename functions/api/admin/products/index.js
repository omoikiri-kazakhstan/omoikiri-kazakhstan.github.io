import { requireAdmin } from '../../../_lib/auth.js';
import { normalizeItem, rowToItem, validationError } from '../../../_lib/catalog.js';
import { badRequest, json, methodNotAllowed, readJson } from '../../../_lib/http.js';

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const { results } = await context.env.CATALOG_DB.prepare('SELECT * FROM catalog_items ORDER BY updated_at DESC, id DESC').all();
  return json({ items: results.map(rowToItem) });
}

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    const body = await readJson(context.request);
    const normalized = normalizeItem(body, { isCustom: body.isCustom });
    const invalid = validationError(normalized);
    if (invalid) return invalid;
    const item = normalized.value;
    const result = await context.env.CATALOG_DB.prepare(
      `INSERT INTO catalog_items (slug, name, sku, category, image_url, price, old_price, description, material, colors, specifications, visible, is_custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(item.slug, item.name, item.sku, item.category, item.imageUrl, item.price, item.oldPrice, item.description, item.material, item.colors, item.specifications, item.visible, item.isCustom).run();
    const created = await context.env.CATALOG_DB.prepare('SELECT * FROM catalog_items WHERE id = ?').bind(result.meta.last_row_id).first();
    return json({ item: rowToItem(created) }, { status: 201 });
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed')) return badRequest('Позиция с таким URL уже есть.');
    console.error(JSON.stringify({ scope: 'admin-create-product', error: String(error) }));
    return json({ error: 'Не удалось сохранить позицию.' }, { status: 500 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
