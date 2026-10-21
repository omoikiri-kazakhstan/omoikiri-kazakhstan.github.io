import { requireAdmin } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';
import { syncStock } from '../../../workers/stock-sync/src/index.js';

const MANUAL_COOLDOWN_MS = 2 * 60_000;

export async function refreshStockDirect(db, { sync = syncStock, now = Date.now } = {}) {
  const previous = await db.prepare('SELECT fetched_at FROM stock_snapshot WHERE id = 1').first();
  const fetchedAt = previous?.fetched_at;
  if (fetchedAt && now() - Date.parse(fetchedAt) < MANUAL_COOLDOWN_MS) {
    return { skipped: true, fetchedAt };
  }
  const result = await sync(db);
  return { updated: true, fetchedAt: result.fetchedAt };
}

export function stockRefreshUrl(base) {
  const url = new URL(base);
  const pathname = url.pathname.replace(/\/+$/, '');
  url.pathname = pathname.endsWith('/refresh') ? pathname : `${pathname}/refresh`;
  return url.toString();
}

export async function onRequestPost(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const { STOCK_SYNC_URL: url, STOCK_SYNC_TOKEN: token } = context.env;
  if (!url || !token) {
    if (!context.env.CATALOG_DB) return json({ error: 'Ручное обновление пока не настроено.' }, { status: 503 });
    try {
      return json(await refreshStockDirect(context.env.CATALOG_DB));
    } catch (error) {
      console.error('Manual stock sync failed; last snapshot retained:', error);
      return json({ error: 'Не удалось обновить остатки. Предыдущая выгрузка сохранена.' }, { status: 502 });
    }
  }
  try {
    const response = await fetch(stockRefreshUrl(url), {
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
