import { methodNotAllowed } from '../../../_lib/http.js';
import { matchesOrder, providerResponse } from '../../../_lib/tiptop.js';
import { notification } from '../../../_lib/tiptop-webhook.js';

export async function onRequestPost(context) {
  const result = await notification(context);
  if (result.error) return result.error;
  const { payload, order } = result;
  if (order && matchesOrder(payload, order) && order.payment_status === 'processing' && order.payment_transaction_id === String(payload.TransactionId)) {
    await context.env.CATALOG_DB.prepare(
      "UPDATE orders SET payment_status = 'pending', payment_transaction_id = '' WHERE id = ? AND payment_status = 'processing' AND payment_transaction_id = ?"
    ).bind(order.id, String(payload.TransactionId)).run();
  }
  return providerResponse(0);
}

export function onRequest() {
  return methodNotAllowed();
}
