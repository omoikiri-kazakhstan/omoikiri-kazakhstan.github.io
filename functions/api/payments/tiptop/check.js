import { methodNotAllowed } from '../../../_lib/http.js';
import { matchesOrder, providerResponse } from '../../../_lib/tiptop.js';
import { notification } from '../../../_lib/tiptop-webhook.js';

export async function onRequestPost(context) {
  const result = await notification(context);
  if (result.error) return result.error;
  const { payload, order } = result;
  if (!order) return providerResponse(10);
  if (String(payload.AccountId || '') !== order.request_id) return providerResponse(11);
  if (!matchesOrder(payload, order)) return providerResponse(12);
  if (payload.OperationType !== 'Payment') return providerResponse(13);
  if (order.payment_status === 'processing' && order.payment_transaction_id === String(payload.TransactionId)) return providerResponse(0);
  if (order.payment_status !== 'pending' || Date.parse(order.payment_expires_at) <= Date.now()) return providerResponse(13);
  const update = await context.env.CATALOG_DB.prepare(
    "UPDATE orders SET payment_status = 'processing', payment_transaction_id = ?, payment_checked_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'pending'"
  ).bind(String(payload.TransactionId), order.id).run();
  return providerResponse(update.meta.changes === 1 ? 0 : 13);
}

export function onRequest() {
  return methodNotAllowed();
}
