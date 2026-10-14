import { badRequest, json, methodNotAllowed } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const requestId = new URL(context.request.url).searchParams.get('requestId') || '';
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return badRequest('Некорректный номер заказа.');
  const order = await context.env.CATALOG_DB.prepare(
    'SELECT id, payment_status, payment_test_mode, payment_expires_at FROM orders WHERE request_id = ?'
  ).bind(requestId).first();
  if (!order) return json({ error: 'Заказ не найден.' }, { status: 404 });
  const expired = order.payment_status === 'pending' && Date.parse(order.payment_expires_at) <= Date.now();
  return json({ orderId: order.id, paymentStatus: expired ? 'expired' : order.payment_status, paymentTestMode: order.payment_test_mode === 1 });
}

export function onRequest() {
  return methodNotAllowed();
}
