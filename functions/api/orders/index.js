import { badRequest, json, methodNotAllowed, readJson } from '../../_lib/http.js';
import { resolveOrderItems } from '../../_lib/order-catalog.js';

const MAX_ITEMS = 30;

function clean(value, max) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '';
}

function normalizeOrder(body) {
  const requestId = clean(body.requestId, 36);
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 32);
  const city = clean(body.city, 100);
  const address = clean(body.address, 200);
  const comment = clean(body.comment, 500);
  const sourceItems = Array.isArray(body.items) ? body.items : [];
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { error: 'Обновите страницу и попробуйте ещё раз.' };
  if (name.length < 2 || !/^\+?[\d\s()\-]{10,32}$/.test(phone) || !city) {
    return { error: 'Укажите имя, город и действующий номер телефона.' };
  }
  if (body.consent !== true) return { error: 'Нужно согласие на обработку данных заказа.' };
  if (!sourceItems.length || sourceItems.length > MAX_ITEMS) return { error: 'Корзина пуста или содержит слишком много товаров.' };

  const items = sourceItems.map((item) => ({
    id: clean(item?.id, 120),
    slug: clean(item?.slug, 90),
    name: clean(item?.name, 160),
    sku: clean(item?.sku, 40),
    color: clean(item?.color, 100),
    qty: Number(item?.qty),
    price: Number(item?.price)
  }));
  if (items.some((item) => !item.id || !item.slug || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99 || !Number.isInteger(item.price) || item.price < 0 || item.price > 100000000)) {
    return { error: 'В корзине есть некорректная позиция. Обновите страницу.' };
  }
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (!Number.isSafeInteger(total) || total > 1000000000) return { error: 'Сумма заказа слишком велика.' };
  return { value: { requestId, name, phone, city, address, comment, items, total } };
}

function telegramText(orderId, order) {
  const lines = [
    `Новый заказ №${orderId}`,
    '',
    ...order.items.map((item) => `${item.name}${item.sku ? ` (арт. ${item.sku})` : ''}${item.color ? `, ${item.color}` : ''} × ${item.qty} — ${new Intl.NumberFormat('ru-KZ').format(item.price * item.qty)} ₸`),
    '',
    `Предварительная сумма: ${new Intl.NumberFormat('ru-KZ').format(order.total)} ₸`,
    `Имя: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Город: ${order.city}`
  ];
  if (order.address) lines.push(`Адрес: ${order.address}`);
  if (order.comment) lines.push(`Комментарий: ${order.comment}`);
  return lines.join('\n').slice(0, 3900);
}

async function notifyTelegram(env, orderId, order) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramText(orderId, order) })
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error('Telegram rejected the message');
}

async function verifyTurnstile(secret, token) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token })
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
}

export async function onRequestPost(context) {
  if (!context.env.CATALOG_DB || !context.env.TELEGRAM_BOT_TOKEN || !context.env.TELEGRAM_CHAT_ID || !context.env.TURNSTILE_SECRET) {
    return json({ error: 'Оформление заказа временно недоступно. Позвоните нам по номеру в шапке сайта.' }, { status: 503 });
  }
  let order;
  let turnstileToken;
  try {
    const body = await readJson(context.request);
    turnstileToken = body.turnstileToken;
    const normalized = normalizeOrder(body);
    if (normalized.error) return badRequest(normalized.error);
    order = normalized.value;
  } catch {
    return badRequest('Не удалось прочитать заказ. Обновите страницу и попробуйте снова.');
  }

  try {
    if (!await verifyTurnstile(context.env.TURNSTILE_SECRET, turnstileToken)) {
      return badRequest('Не удалось проверить отправку. Повторите попытку.');
    }
  } catch {
    return json({ error: 'Проверка отправки временно недоступна. Попробуйте позже.' }, { status: 503 });
  }

  try {
    const existing = await context.env.CATALOG_DB.prepare('SELECT id FROM orders WHERE request_id = ?').bind(order.requestId).first();
    if (existing) return json({ ok: true, orderId: existing.id });
    const resolved = await resolveOrderItems(context.env.CATALOG_DB, order.items);
    if (resolved.error) return badRequest(resolved.error);
    order.items = resolved.items;
    order.total = resolved.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const result = await context.env.CATALOG_DB.prepare(
      'INSERT INTO orders (request_id, customer_name, phone, city, address, comment, items_json, estimated_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(order.requestId, order.name, order.phone, order.city, order.address, order.comment, JSON.stringify(order.items), order.total).run();
    const orderId = result.meta.last_row_id;
    try {
      await notifyTelegram(context.env, orderId, order);
      await context.env.CATALOG_DB.prepare("UPDATE orders SET notification_status = 'sent' WHERE id = ?").bind(orderId).run();
    } catch (error) {
      console.error(JSON.stringify({ scope: 'order-notification', orderId, error: String(error) }));
      await context.env.CATALOG_DB.prepare("UPDATE orders SET notification_status = 'failed' WHERE id = ?").bind(orderId).run();
    }
    return json({ ok: true, orderId }, { status: 201 });
  } catch (error) {
    if (String(error).includes('UNIQUE constraint failed')) {
      const existing = await context.env.CATALOG_DB.prepare('SELECT id FROM orders WHERE request_id = ?').bind(order.requestId).first();
      if (existing) return json({ ok: true, orderId: existing.id });
    }
    console.error(JSON.stringify({ scope: 'order-create', error: String(error) }));
    return json({ error: 'Не удалось сохранить заказ. Попробуйте ещё раз или позвоните нам.' }, { status: 500 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
