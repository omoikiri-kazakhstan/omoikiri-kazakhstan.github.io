export async function notifyTelegram(env, orderId, order, paid = false, testMode = false) {
  const lines = [
    `${testMode ? 'ТЕСТОВАЯ оплата заказа' : paid ? 'Оплачен заказ' : 'Новый заказ'} №${orderId}`,
    '',
    ...order.items.map((item) => `${item.name}${item.sku ? ` (арт. ${item.sku})` : ''}${item.color ? `, ${item.color}` : ''} × ${item.qty} — ${new Intl.NumberFormat('ru-KZ').format(item.price * item.qty)} ₸`),
    '',
    `${testMode ? 'Тестовая сумма (без списания)' : paid ? 'Оплачено' : 'Предварительная сумма'}: ${new Intl.NumberFormat('ru-KZ').format(order.total)} ₸`,
    `Имя: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Город: ${order.city}`
  ];
  if (order.address) lines.push(`Адрес: ${order.address}`);
  if (order.comment) lines.push(`Комментарий: ${order.comment}`);
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n').slice(0, 3900) })
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error('Telegram rejected the message');
}
