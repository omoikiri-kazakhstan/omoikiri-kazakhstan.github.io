import { parseNotification, verifyNotification } from './tiptop.js';

export async function notification(context) {
  if (!context.env.CATALOG_DB || !context.env.TIPTOP_API_SECRET) {
    return { error: new Response('Unavailable', { status: 503 }) };
  }
  const body = await context.request.text();
  if (!body || body.length > 20000 || !await verifyNotification(context.request, context.env.TIPTOP_API_SECRET, body)) {
    return { error: new Response('Unauthorized', { status: 401 }) };
  }
  try {
    const payload = parseNotification(context.request, body);
    const id = Number(payload.InvoiceId);
    if (!Number.isSafeInteger(id) || id < 1) return { payload, order: null };
    const order = await context.env.CATALOG_DB.prepare(
      'SELECT id, request_id, customer_name, phone, city, address, comment, items_json, estimated_total, payment_status, payment_transaction_id, payment_expires_at, notification_status FROM orders WHERE id = ?'
    ).bind(id).first();
    return { payload, order };
  } catch (error) {
    console.error(JSON.stringify({ scope: 'tiptop-notification', error: String(error) }));
    return { error: new Response('Invalid notification', { status: 400 }) };
  }
}
