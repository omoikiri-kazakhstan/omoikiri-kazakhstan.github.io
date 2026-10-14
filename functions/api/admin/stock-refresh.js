import { requireAdmin } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const { STOCK_SYNC_URL: url, STOCK_SYNC_TOKEN: token } = context.env;
  if (!url || !token) return json({ error: 'Ручное обновление пока не настроено.' }, { status: 503 });
  try {
    const response = await fetch(`${url}/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    if (!response.ok) return json({ error: result.error || 'Не удалось обновить остатки.' }, { status: 502 });
    return json({ updated: Boolean(result.updated), skipped: Boolean(result.skipped), fetchedAt: result.fetchedAt });
  } catch (error) {
    console.error('Could not request manual stock sync:', error);
    return json({ error: 'Не удалось связаться с сервером остатков. Попробуйте позже.' }, { status: 502 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
