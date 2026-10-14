import { methodNotAllowed } from '../../../_lib/http.js';
import { notifyTelegram } from '../../../_lib/order-notifications.js';
import { matchesOrder, providerResponse } from '../../../_lib/tiptop.js';
import { notification } from '../../../_lib/tiptop-webhook.js';

export async function onRequestPost(context) {
  const result = await notification(context);
  if (result.error) return result.error;
  const { payload, order } = result;
  if (!order || !matchesOrder(payload, order) || payload.Status !== 'Completed' || payload.OperationType !== 'Payment') {
    return new Response('Payment mismatch', { status: 400 });
  }
  const transactionId = String(payload.TransactionId);
  const testMode = payload.TestMode === true || String(payload.TestMode).toLowerCase() === 'true' || String(payload.TestMode) === '1';
  if (order.payment_status === 'paid') {
    return order.payment_transaction_id === transactionId ? providerResponse(0) : new Response('Duplicate payment', { status: 409 });
  }
  if (!['pending', 'processing'].includes(order.payment_status) ||
      (order.payment_transaction_id && order.payment_transaction_id !== transactionId)) {
    return new Response('Payment mismatch', { status: 409 });
  }
  const update = await context.env.CATALOG_DB.prepare(
    "UPDATE orders SET payment_status = 'paid', payment_transaction_id = ?, payment_test_mode = ?, payment_paid_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status IN ('pending', 'processing') AND (payment_transaction_id = '' OR payment_transaction_id = ?)"
  ).bind(transactionId, testMode ? 1 : 0, order.id, transactionId).run();
  if (update.meta.changes !== 1) return new Response('Payment update failed', { status: 503 });
  try {
    await notifyTelegram(context.env, order.id, {
      items: JSON.parse(order.items_json), total: order.estimated_total,
      name: order.customer_name, phone: order.phone, city: order.city,
      address: order.address, comment: order.comment
    }, true, testMode);
    await context.env.CATALOG_DB.prepare("UPDATE orders SET notification_status = 'sent' WHERE id = ?").bind(order.id).run();
  } catch (error) {
    console.error(JSON.stringify({ scope: 'paid-order-notification', orderId: order.id, error: String(error) }));
    await context.env.CATALOG_DB.prepare("UPDATE orders SET notification_status = 'failed' WHERE id = ?").bind(order.id).run();
  }
  return providerResponse(0);
}

export function onRequest() {
  return methodNotAllowed();
}
