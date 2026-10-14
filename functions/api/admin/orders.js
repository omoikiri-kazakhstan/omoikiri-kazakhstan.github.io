import { requireAdmin } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const unauthorized = await requireAdmin(context);
  if (unauthorized) return unauthorized;
  const { results } = await context.env.CATALOG_DB.prepare(
    "SELECT id, customer_name, phone, city, address, comment, items_json, estimated_total, notification_status, payment_status, payment_test_mode, payment_paid_at, status, internal_note, created_at FROM orders ORDER BY CASE WHEN status IN ('completed', 'cancelled', 'test') THEN 1 ELSE 0 END, id DESC LIMIT 100"
  ).all();
  return json({ orders: results.map((row) => ({
    id: row.id,
    name: row.customer_name,
    phone: row.phone,
    city: row.city,
    address: row.address,
    comment: row.comment,
    items: JSON.parse(row.items_json),
    estimatedTotal: row.estimated_total,
    notificationStatus: row.notification_status,
    paymentStatus: row.payment_status,
    paymentTestMode: row.payment_test_mode === 1,
    paymentPaidAt: row.payment_paid_at,
    status: row.status,
    internalNote: row.internal_note,
    createdAt: row.created_at
  })) });
}

export function onRequest() {
  return methodNotAllowed();
}
