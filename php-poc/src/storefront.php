<?php
declare(strict_types=1);

function kzt_price(int $rub): int
{
    return (int) (ceil(($rub * 6.1 - 880) / 1000) * 1000 + 880);
}

function discontinued(string $slug, string $sku, string $color): bool
{
    static $skus = [
        '4993469','4993459','4993487','4993744','4993291','4993935','4993845',
        '4993875','4993917','4993247','4993508','4973056','4994174','4994139',
        '4994270','4993342','4993335','4993416','4993886','4993562','4993567',
        '4997264','4973080','4994365','4993968','4993918','4993885','4993874',
        '4993750','4993746','4993026','4993049','4911263','4911264','4911265',
        '4993134','4911262','4911261','4993169','4993041','4911258','4911259',
        '4911257','4994221','4995010','4995013','4997011','4997151','4993913',
        '4993198','4994526','4998039',
    ];
    static $colors = [
        'tasogare-86'=>['bl','gr'], 'tasogare-65'=>['gr'], 'yonaka-65'=>['be'],
        'yonaka-78-lb'=>['be','sa'], 'tasogare-78'=>['be','bl','pa'], 'maru-86-2'=>['ch'],
        'tedori-86-2-lb'=>['wh'], 'yasugata-100'=>['be'], 'yasugata-86'=>['pl'],
        'tedori-100'=>['be','gr','sa'], 'bosen-38-u'=>['ch'], 'miya-50-r'=>['ch'],
        'akisame-41'=>['in','lg'], 'sakaime-100'=>['sa','be'], 'sakaime-100-2'=>['gr'],
        'yamakawa-55-integra'=>['gr'], 'tateyama-s'=>['ca','ev','gb'], 'umi'=>['bl'],
        'tedori-68'=>['dc'], 'kitagawa-86-lb'=>['az'],
        'okinoshima-61-u-i'=>['ib','rg-glossy','sl','to-glossy','ib-glossy'],
        'okinoshima-76-u-i'=>['g-matt','g-glossy'],
        'mikura-61'=>['to','to-glossy'], 'tonami'=>['ca'], 'om-01'=>['be','sa'],
    ];
    return in_array($sku, $skus, true) || in_array($color, $colors[$slug] ?? [], true);
}

function catalog_products(): array
{
    static $products = null;
    if ($products === null) {
        $products = [];
        foreach (catalog_file() as $product) $products[$product['slug']] = $product;
    }
    return $products;
}

function resolve_order_items(PDO $db, array $submitted): array
{
    $live = live_prices($db);
    $liveSku = (array) $live['bySku'];
    $liveSlug = (array) $live['bySlug'];
    $products = catalog_products();
    $resolved = [];
    foreach ($submitted as $item) {
        $slug = strtolower($item['slug']);
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
        }
        $custom = db_one($db, 'SELECT slug, name, sku, price, visible, variants FROM catalog_items WHERE slug = ?', [$slug]);
        $override = db_one($db, 'SELECT visible, hidden_colors FROM catalog_visibility_overrides WHERE slug = ?', [$slug]);
        $product = $custom ?: ($products[$slug] ?? null);
        if (!$product || ($custom && !(bool) $custom['visible']) || ($override && !(bool) $override['visible'])) {
            return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
        }
        $sku = (string) ($product['sku'] ?? '');
        $color = '';
        $price = null;
        if ($custom) {
            $variants = json_decode($custom['variants'] ?: '[]', true, 512, JSON_THROW_ON_ERROR);
            if ($variants) {
                $variant = null;
                foreach ($variants as $entry) {
                    if (!empty($entry['sku']) && $entry['sku'] === $item['sku']) { $variant = $entry; break; }
                }
                if (!$variant) return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
                $sku = $variant['sku'];
                $color = $variant['color'] ?? '';
            } elseif ($sku !== '' && $sku !== $item['sku']) {
                return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
            }
            $price = (int) $custom['price'];
        } elseif (!empty($product['variations'])) {
            $variant = null;
            foreach ($product['variations'] as $entry) {
                if ($entry['sku'] === $item['sku']) { $variant = $entry; break; }
            }
            if (!$variant) return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
            $sku = $variant['sku'];
            $color = $variant['color'];
            $price = kzt_price((int) ($liveSku[$sku] ?? $variant['price']));
        } else {
            $current = $liveSku[$sku] ?? ($liveSlug[$slug]['default']['rub'] ?? null);
            $price = $current ? kzt_price((int) $current) : (int) $product['price'];
            if ($sku !== '' && $sku !== $item['sku']) {
                return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
            }
        }
        $hidden = $override ? json_decode($override['hidden_colors'] ?: '[]', true) : [];
        if (discontinued($slug, $sku, $color) || in_array($color, is_array($hidden) ? $hidden : [], true) || $price <= 0) {
            return ['error' => 'Один из товаров или цветов больше недоступен. Обновите корзину.'];
        }
        if ($item['price'] !== $price) {
            return ['error' => 'Цена товара изменилась. Удалите его из корзины и добавьте заново.'];
        }
        $resolved[] = ['id' => $slug . '-' . ($sku ?: ($color ?: 'default')),
            'name' => $product['name'], 'sku' => $sku, 'color' => strtoupper($color),
            'qty' => $item['qty'], 'price' => $price];
    }
    return ['items' => $resolved];
}

function order_response(array $row, int $status = 200): void
{
    $result = ['ok' => true, 'orderId' => (int) $row['id'],
        'paymentStatus' => $row['payment_status'], 'paymentTestMode' => (bool) $row['payment_test_mode']];
    if (payment_enabled() && $row['payment_status'] === 'pending') {
        if (strtotime((string) $row['payment_expires_at']) <= time()) {
            send_json(['error' => 'Время на оплату этого заказа истекло. Обновите страницу и оформите заказ снова.'], 409);
            return;
        }
        $result['payment'] = payment_intent($row);
    }
    send_json($result, $status);
}

function notify_telegram(int $orderId, array $order, bool $paid = false, bool $testMode = false): void
{
    $token = getenv('TELEGRAM_BOT_TOKEN');
    $chatId = getenv('TELEGRAM_CHAT_ID');
    if (!$token || !$chatId) throw new RuntimeException('Missing Telegram configuration');
    $lines = [($testMode ? 'ТЕСТОВАЯ оплата заказа' : ($paid ? 'Оплачен заказ' : 'Новый заказ')) . ' №' . $orderId, ''];
    foreach ($order['items'] as $item) {
        $lines[] = $item['name'] . ($item['sku'] ? ' (арт. ' . $item['sku'] . ')' : '') .
            ($item['color'] ? ', ' . $item['color'] : '') . ' × ' . $item['qty'] .
            ' — ' . number_format($item['price'] * $item['qty'], 0, '', ' ') . ' ₸';
    }
    $lines[] = '';
    $lines[] = ($testMode ? 'Тестовая сумма (без списания)' : ($paid ? 'Оплачено' : 'Предварительная сумма')) .
        ': ' . number_format($order['total'], 0, '', ' ') . ' ₸';
    $lines[] = 'Имя: ' . $order['name'];
    $lines[] = 'Телефон: ' . $order['phone'];
    $lines[] = 'Город: ' . $order['city'];
    if ($order['address']) $lines[] = 'Адрес: ' . $order['address'];
    if ($order['comment']) $lines[] = 'Комментарий: ' . $order['comment'];
    $result = http_post('https://api.telegram.org/bot' . $token . '/sendMessage',
        ['chat_id' => $chatId, 'text' => mb_substr(implode("\n", $lines), 0, 3900)]);
    if (($result['ok'] ?? false) !== true) throw new RuntimeException('Telegram rejected message');
}

function create_order(PDO $db, ?array $testBody = null, ?callable $verify = null, ?callable $notify = null): void
{
    if (($verify === null && !getenv('TURNSTILE_SECRET')) ||
        ($notify === null && (!getenv('TELEGRAM_BOT_TOKEN') || !getenv('TELEGRAM_CHAT_ID')))) {
        send_json(['error' => 'Оформление заказа временно недоступно. Позвоните нам по номеру в шапке сайта.'], 503);
        return;
    }
    $verify ??= 'verify_turnstile';
    $notify ??= 'notify_telegram';
    try { $body = $testBody ?? input_json(); } catch (Throwable) {
        send_json(['error' => 'Не удалось прочитать заказ. Обновите страницу и попробуйте снова.'], 400); return;
    }
    $order = ['requestId' => text_value($body['requestId'] ?? null, 36),
        'name' => text_value($body['name'] ?? null, 100),
        'phone' => text_value($body['phone'] ?? null, 32),
        'city' => text_value($body['city'] ?? null, 100),
        'address' => text_value($body['address'] ?? null, 200),
        'comment' => text_value($body['comment'] ?? null, 500)];
    if (!preg_match('/^[0-9a-f-]{36}$/i', $order['requestId'])) {
        send_json(['error' => 'Обновите страницу и попробуйте ещё раз.'], 400); return;
    }
    if (mb_strlen($order['name']) < 2 || !preg_match('/^\+?[\d\s()\-]{10,32}$/', $order['phone']) || !$order['city']) {
        send_json(['error' => 'Укажите имя, город и действующий номер телефона.'], 400); return;
    }
    if (($body['consent'] ?? false) !== true) {
        send_json(['error' => 'Нужно согласие на обработку данных заказа.'], 400); return;
    }
    $sourceItems = $body['items'] ?? null;
    if (!is_array($sourceItems) || count($sourceItems) < 1 || count($sourceItems) > 30) {
        send_json(['error' => 'Корзина пуста или содержит слишком много товаров.'], 400); return;
    }
    $items = [];
    foreach ($sourceItems as $source) {
        if (!is_array($source)) { send_json(['error' => 'В корзине есть некорректная позиция. Обновите страницу.'], 400); return; }
        $item = ['id' => text_value($source['id'] ?? null, 120),
            'slug' => text_value($source['slug'] ?? null, 90),
            'name' => text_value($source['name'] ?? null, 160),
            'sku' => text_value($source['sku'] ?? null, 40),
            'color' => text_value($source['color'] ?? null, 100),
            'qty' => $source['qty'] ?? null, 'price' => $source['price'] ?? null];
        if (!$item['id'] || !$item['slug'] || !is_int($item['qty']) || $item['qty'] < 1 || $item['qty'] > 99 ||
            !is_int($item['price']) || $item['price'] < 0 || $item['price'] > 100000000) {
            send_json(['error' => 'В корзине есть некорректная позиция. Обновите страницу.'], 400); return;
        }
        $items[] = $item;
    }
    $token = $body['turnstileToken'] ?? '';
    try {
        if (!is_string($token) || !$verify($token)) {
            send_json(['error' => 'Не удалось проверить отправку. Повторите попытку.'], 400); return;
        }
    } catch (Throwable) {
        send_json(['error' => 'Проверка отправки временно недоступна. Попробуйте позже.'], 503); return;
    }
    try {
        $resolved = resolve_order_items($db, $items);
        if (isset($resolved['error'])) { send_json(['error' => $resolved['error']], 400); return; }
        $order['items'] = $resolved['items'];
        $order['total'] = array_sum(array_map(static fn ($item) => $item['price'] * $item['qty'], $order['items']));
        if ($order['total'] > 1000000000) { send_json(['error' => 'Сумма заказа слишком велика.'], 400); return; }
        $existing = db_one($db, 'SELECT * FROM orders WHERE request_id = ?', [$order['requestId']]);
        $itemsJson = json_encode($order['items'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if ($existing) {
            if ($existing['items_json'] !== $itemsJson || $existing['phone'] !== $order['phone'] ||
                (int) $existing['estimated_total'] !== $order['total']) {
                send_json(['error' => 'Корзина изменилась. Обновите страницу и оформите новый заказ.'], 400); return;
            }
            order_response($existing); return;
        }
        $onlinePayment = payment_enabled();
        $expiresAt = $onlinePayment ? gmdate('Y-m-d\TH:i:s\Z', time() + 1800) : '';
        db_run($db, 'INSERT INTO orders (request_id, customer_name, phone, city, address, comment, items_json, estimated_total, payment_status, payment_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$order['requestId'], $order['name'], $order['phone'], $order['city'],
                $order['address'], $order['comment'], $itemsJson, $order['total'], $onlinePayment ? 'pending' : 'not_required', $expiresAt]);
        $id = (int) $db->lastInsertId();
        if (!$onlinePayment) {
            try {
                $notify($id, $order);
                db_run($db, "UPDATE orders SET notification_status = 'sent' WHERE id = ?", [$id]);
            } catch (Throwable $error) {
                error_log('Order notification failed for order ' . $id . ': ' . $error->getMessage());
                db_run($db, "UPDATE orders SET notification_status = 'failed' WHERE id = ?", [$id]);
            }
        }
        order_response(['id' => $id, 'request_id' => $order['requestId'], 'customer_name' => $order['name'],
            'phone' => $order['phone'], 'city' => $order['city'], 'estimated_total' => $order['total'],
            'payment_status' => $onlinePayment ? 'pending' : 'not_required', 'payment_test_mode' => 0,
            'payment_expires_at' => $expiresAt], 201);
    } catch (Throwable $error) {
        error_log('PHP order failed: ' . $error->getMessage());
        send_json(['error' => 'Не удалось сохранить заказ. Попробуйте ещё раз или позвоните нам.'], 500);
    }
}

function order_payment(PDO $db): void
{
    $requestId = (string) ($_GET['requestId'] ?? '');
    if (!preg_match('/^[0-9a-f-]{36}$/i', $requestId)) {
        send_json(['error' => 'Некорректный номер заказа.'], 400); return;
    }
    $row = db_one($db, 'SELECT id, payment_status, payment_test_mode, payment_expires_at FROM orders WHERE request_id = ?', [$requestId]);
    if (!$row) { send_json(['error' => 'Заказ не найден.'], 404); return; }
    $expired = $row['payment_status'] === 'pending' && strtotime($row['payment_expires_at']) <= time();
    send_json(['orderId' => (int) $row['id'], 'paymentStatus' => $expired ? 'expired' : $row['payment_status'],
        'paymentTestMode' => (bool) $row['payment_test_mode']]);
}

function inquiry(): void
{
    if (!getenv('TURNSTILE_SECRET') || !getenv('TELEGRAM_BOT_TOKEN') || !getenv('TELEGRAM_CHAT_ID')) {
        send_json(['error' => 'Форма временно недоступна. Позвоните нам по номеру в шапке сайта.'], 503); return;
    }
    try { $body = input_json(); } catch (Throwable) {
        send_json(['error' => 'Не удалось прочитать вопрос. Обновите страницу и попробуйте снова.'], 400); return;
    }
    $name = text_value($body['name'] ?? null, 100);
    $phone = text_value($body['phone'] ?? null, 32);
    $email = text_value($body['email'] ?? null, 150);
    $message = text_value($body['message'] ?? null, 1200);
    $productPath = text_value($body['productPath'] ?? null, 140);
    $token = text_value($body['turnstileToken'] ?? null, 2048);
    if (mb_strlen($name) < 2 || mb_strlen($message) < 8) {
        send_json(['error' => 'Укажите имя и вопрос (не менее 8 символов).'], 400); return;
    }
    if (!preg_match('/^\+?[\d\s()\-]{10,32}$/', $phone) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json(['error' => 'Укажите действительный телефон или e-mail.'], 400); return;
    }
    if (($body['consent'] ?? false) !== true || !preg_match('#^/product/[a-z0-9-]+/?$#i', $productPath) || !$token) {
        send_json(['error' => 'Некорректные данные вопроса.'], 400); return;
    }
    try {
        if (!verify_turnstile($token)) { send_json(['error' => 'Не удалось проверить отправку. Повторите попытку.'], 400); return; }
    } catch (Throwable) {
        send_json(['error' => 'Проверка отправки временно недоступна. Попробуйте позже.'], 503); return;
    }
    $lines = ['Новый вопрос по товару', 'Товар: ' . $productPath, 'Имя: ' . $name];
    if ($phone) $lines[] = 'Телефон: ' . $phone;
    if ($email) $lines[] = 'E-mail: ' . $email;
    $lines[] = '';
    $lines[] = $message;
    try {
        $result = http_post('https://api.telegram.org/bot' . getenv('TELEGRAM_BOT_TOKEN') . '/sendMessage',
            ['chat_id' => getenv('TELEGRAM_CHAT_ID'), 'text' => implode("\n", $lines)]);
        if (($result['ok'] ?? false) !== true) throw new RuntimeException('Telegram rejected message');
        send_json(['ok' => true], 201);
    } catch (Throwable $error) {
        error_log('PHP inquiry failed: ' . $error->getMessage());
        send_json(['error' => 'Не удалось отправить вопрос. Позвоните нам по номеру в шапке сайта.'], 503);
    }
}
