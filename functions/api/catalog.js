import { json, methodNotAllowed } from '../_lib/http.js';

export async function onRequestGet(context) {
  const { results } = await context.env.CATALOG_DB.prepare(
    `SELECT id, slug, name, sku, category, image_url, price, old_price, description, visible, is_custom
     FROM catalog_items ORDER BY updated_at DESC, id DESC`
  ).all();
  const items = results.map((row) => ({
    id: row.id, slug: row.slug, name: row.name, sku: row.sku, category: row.category,
    imageUrl: row.image_url, price: row.price, oldPrice: row.old_price, description: row.description,
    visible: Boolean(row.visible), isCustom: Boolean(row.is_custom)
  }));
  return json({ items }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}

export function onRequest() {
  return methodNotAllowed();
}
