import { requireAdmin } from '../../../_lib/auth.js';
import { rowToOverride } from '../../../_lib/catalog-overrides.js';
import { json, methodNotAllowed } from '../../../_lib/http.js';

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const { results } = await context.env.CATALOG_DB.prepare(
    'SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides ORDER BY slug'
  ).all();
  return json({ overrides: results.map(rowToOverride) });
}

export function onRequest() {
  return methodNotAllowed();
}
