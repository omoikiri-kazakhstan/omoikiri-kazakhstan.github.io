import { json, methodNotAllowed } from '../_lib/http.js';

export async function onRequestGet(context) {
  const [itemsResult, overridesResult] = await context.env.CATALOG_DB.batch([
    context.env.CATALOG_DB.prepare(
    `SELECT id, slug, name, sku, category, image_url, price, old_price, description, material, colors, specifications, visible, is_custom
     FROM catalog_items ORDER BY updated_at DESC, id DESC`
    ),
    context.env.CATALOG_DB.prepare('SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides')
  ]);
  const items = itemsResult.results.map((row) => ({
    id: row.id, slug: row.slug, name: row.name, sku: row.sku, category: row.category,
    imageUrl: row.image_url, price: row.price, oldPrice: row.old_price, description: row.description, material: row.material, colors: row.colors, specifications: row.specifications,
    visible: Boolean(row.visible), isCustom: Boolean(row.is_custom)
  }));
  const overrides = overridesResult.results.map((row) => {
    let hiddenColors = [];
    try { hiddenColors = JSON.parse(row.hidden_colors || '[]'); } catch { hiddenColors = []; }
    return { slug: row.slug, visible: Boolean(row.visible), hiddenColors: Array.isArray(hiddenColors) ? hiddenColors : [] };
  });
  return json({ items, overrides }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}

export function onRequest() {
  return methodNotAllowed();
}
