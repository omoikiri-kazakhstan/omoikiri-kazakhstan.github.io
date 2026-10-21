import { badRequest, json, methodNotAllowed, readJson } from '../_lib/http.js';

function clean(value, limit) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, limit)
    : '';
}

function normalize(body) {
  const name = clean(body.name, 100);
  const phone = clean(body.phone, 32);
  const email = clean(body.email, 150);
  const message = clean(body.message, 1200);
  const productPath = clean(body.productPath, 140);
  const turnstileToken = clean(body.turnstileToken, 2048);
  if (name.length < 2 || message.length < 8) return { error: 'Укажите имя и вопрос (не менее 8 символов).' };
  if (!/^\+?[\d\s()\-]{10,32}$/.test(phone) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Укажите действительный телефон или e-mail.' };
  }
  if (body.consent !== true) return { error: 'Нужно согласие на обработку контактных данных.' };
  if (!/^\/product\/[a-z0-9-]+\/?$/i.test(productPath)) return { error: 'Не удалось определить товар. Обновите страницу.' };
  if (!turnstileToken) return { error: 'Подтвердите, что вы человек.' };
  return { value: { name, phone, email, message, productPath, turnstileToken } };
}

async function verifyTurnstile(secret, token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token })
  });
  if (!response.ok) return false;
  return (await response.json()).success === true;
}

async function notifyTelegram(env, inquiry) {
  const text = [
    'Новый вопрос по товару',
    `Товар: ${inquiry.productPath}`,
    `Имя: ${inquiry.name}`,
    inquiry.phone ? `Телефон: ${inquiry.phone}` : '',
    inquiry.email ? `E-mail: ${inquiry.email}` : '',
    '',
    inquiry.message
  ].filter(Boolean).join('\n');
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
  });
  if (!response.ok || !(await response.json()).ok) throw new Error(`Telegram HTTP ${response.status}`);
}

export async function onRequestPost(context) {
  const env = context.env;
  if (!env.TURNSTILE_SECRET || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ error: 'Форма временно недоступна. Позвоните нам по номеру в шапке сайта.' }, { status: 503 });
  }
  let inquiry;
  try {
    const result = normalize(await readJson(context.request));
    if (result.error) return badRequest(result.error);
    inquiry = result.value;
  } catch {
    return badRequest('Не удалось прочитать вопрос. Обновите страницу и попробуйте снова.');
  }
  try {
    if (!await verifyTurnstile(env.TURNSTILE_SECRET, inquiry.turnstileToken)) {
      return badRequest('Не удалось проверить отправку. Повторите попытку.');
    }
  } catch {
    return json({ error: 'Проверка отправки временно недоступна. Попробуйте позже.' }, { status: 503 });
  }
  try {
    await notifyTelegram(env, inquiry);
    return json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'inquiry-notification', error: String(error).replace(env.TELEGRAM_BOT_TOKEN, '[redacted]') }));
    return json({ error: 'Не удалось отправить вопрос. Позвоните нам по номеру в шапке сайта.' }, { status: 503 });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
