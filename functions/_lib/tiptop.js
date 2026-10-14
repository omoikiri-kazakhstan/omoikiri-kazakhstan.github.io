export function paymentEnabled(env) {
  return env.TIPTOP_PAYMENTS_ENABLED === 'true' && Boolean(env.TIPTOP_PUBLIC_TERMINAL_ID && env.TIPTOP_API_SECRET);
}

export function paymentIntent(env, order) {
  return {
    publicTerminalId: env.TIPTOP_PUBLIC_TERMINAL_ID,
    description: `Заказ OMOIKIRI KZ №${order.id}`,
    paymentSchema: 'Single',
    currency: 'KZT',
    amount: order.estimated_total,
    externalId: String(order.id),
    userInfo: {
      accountId: order.request_id,
      fullName: order.customer_name,
      phone: order.phone,
      city: order.city
    },
    retryPayment: false
  };
}

export async function verifyNotification(request, secret, body) {
  const signature = request.headers.get('Content-HMAC');
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  let supplied;
  try {
    const binary = atob(signature.trim());
    supplied = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return false;
  }
  if (supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected[index] ^ supplied[index];
  return difference === 0;
}

export function parseNotification(request, body) {
  if (request.headers.get('content-type')?.includes('application/json')) return JSON.parse(body);
  return Object.fromEntries(new URLSearchParams(body));
}

export function matchesOrder(payload, order) {
  return String(payload.InvoiceId || '') === String(order.id) &&
    String(payload.AccountId || '') === order.request_id &&
    payload.Currency === 'KZT' &&
    Number(payload.Amount) === order.estimated_total &&
    /^\d+$/.test(String(payload.TransactionId || ''));
}

export function providerResponse(code) {
  return new Response(JSON.stringify({ code }), {
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store' }
  });
}
