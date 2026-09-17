import { requireAdmin } from '../../../_lib/auth.js';
import { normalizeOverride, overrideValidationError } from '../../../_lib/catalog-overrides.js';
import { json, methodNotAllowed, readJson } from '../../../_lib/http.js';

export async function onRequestPut(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    const normalized = normalizeOverride(context.params.slug, await readJson(context.request));
    const invalid = overrideValidationError(normalized);
    if (invalid) return invalid;
    const item = normalized.value;
    await context.env.CATALOG_DB.prepare(
      `INSERT INTO catalog_visibility_overrides (slug, visible, hidden_colors, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(slug) DO UPDATE SET visible = excluded.visible, hidden_colors = excluded.hidden_colors, updated_at = CURRENT_TIMESTAMP`
    ).bind(item.slug, item.visible, JSON.stringify(item.hiddenColors)).run();
    return json({ override: { slug: item.slug, visible: Boolean(item.visible), hiddenColors: item.hiddenColors } });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'admin-catalog-override', error: String(error) }));
    return json({ error: 'Не удалось сохранить изменения каталога.' }, { status: 500 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
