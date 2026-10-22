<?php
declare(strict_types=1);

function admin_login(): void
{
    try { $body = input_json(); } catch (Throwable) { send_json(['error' => 'Некорректный запрос.'], 400); return; }
    $login = getenv('ADMIN_LOGIN');
    $password = getenv('ADMIN_PASSWORD');
    $secret = getenv('ADMIN_SESSION_SECRET');
    if (!$login || !$password || !$secret) {
        send_json(['error' => 'Админка пока не настроена.'], 503); return;
    }
    $receivedLogin = trim((string) ($body['login'] ?? ''));
    $receivedPassword = (string) ($body['password'] ?? '');
    $validLogin = hash_equals(hash('sha256', $login, true), hash('sha256', $receivedLogin, true));
    $validPassword = hash_equals(hash('sha256', $password, true), hash('sha256', $receivedPassword, true));
    if (!$validLogin || !$validPassword) { send_json(['error' => 'Неверный логин или пароль.'], 401); return; }
    admin_cookie(session_token(), 43200);
    send_json(['ok' => true]);
}

function admin_access(PDO $db): void
{
    $token = (string) ($_GET['token'] ?? '');
    if (!$token || !getenv('ADMIN_SESSION_SECRET')) {
        header('Location: /madi-admin/', true, 302); return;
    }
    $changed = db_run($db, 'DELETE FROM admin_magic_links WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP',
        [hash('sha256', $token)]);
    if ($changed !== 1) { http_response_code(403); echo 'Ссылка недействительна или уже использована.'; return; }
    admin_cookie(session_token(), 43200);
    header('Cache-Control: no-store');
    header('Location: /madi-admin/', true, 302);
}

function admin_orders(PDO $db): void
{
    if (!require_admin()) return;
    $rows = rows($db, "SELECT id, customer_name, phone, city, address, comment, items_json, estimated_total, notification_status, payment_status, payment_test_mode, payment_paid_at, status, internal_note, created_at FROM orders ORDER BY CASE WHEN status IN ('completed', 'cancelled', 'test') THEN 1 ELSE 0 END, id DESC LIMIT 100");
    $orders = [];
    foreach ($rows as $row) {
        $orders[] = ['id' => (int) $row['id'], 'name' => $row['customer_name'],
            'phone' => $row['phone'], 'city' => $row['city'], 'address' => $row['address'],
            'comment' => $row['comment'], 'items' => json_decode($row['items_json'], true),
            'estimatedTotal' => (int) $row['estimated_total'],
            'notificationStatus' => $row['notification_status'], 'paymentStatus' => $row['payment_status'],
            'paymentTestMode' => (bool) $row['payment_test_mode'], 'paymentPaidAt' => $row['payment_paid_at'],
            'status' => $row['status'], 'internalNote' => $row['internal_note'], 'createdAt' => $row['created_at']];
    }
    send_json(['orders' => $orders]);
}

function admin_order_update(PDO $db, int $id): void
{
    if (!require_admin()) return;
    if ($id < 1) { send_json(['error' => 'Некорректный номер заказа.'], 400); return; }
    try { $body = input_json(); } catch (Throwable) { send_json(['error' => 'Некорректные данные заказа.'], 400); return; }
    $status = (string) ($body['status'] ?? '');
    $note = is_string($body['internalNote'] ?? null) ? trim($body['internalNote']) : '';
    if (!in_array($status, ['new','contacted','completed','cancelled','test'], true) || mb_strlen($note) > 1000) {
        send_json(['error' => 'Некорректный статус или заметка.'], 400); return;
    }
    if (!db_one($db, 'SELECT id FROM orders WHERE id = ?', [$id])) {
        send_json(['error' => 'Заказ не найден.'], 404); return;
    }
    db_run($db, 'UPDATE orders SET status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [$status, $note, $id]);
    send_json(['ok' => true, 'status' => $status, 'internalNote' => $note]);
}

function row_product(array $row): array
{
    return ['id' => (int) $row['id'], 'slug' => $row['slug'], 'name' => $row['name'],
        'sku' => $row['sku'], 'category' => $row['category'], 'imageUrl' => $row['image_url'],
        'price' => $row['price'] === null ? null : (int) $row['price'],
        'oldPrice' => $row['old_price'] === null ? null : (int) $row['old_price'],
        'description' => $row['description'], 'material' => $row['material'],
        'colors' => $row['colors'], 'variants' => json_decode($row['variants'] ?: '[]', true),
        'specifications' => $row['specifications'], 'visible' => (bool) $row['visible'],
        'isCustom' => (bool) $row['is_custom'], 'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']];
}

function normalize_product(array $body): array
{
    $slug = strtolower(text_value($body['slug'] ?? null, 90));
    $name = text_value($body['name'] ?? null, 160);
    $category = text_value($body['category'] ?? null, 30);
    $price = $body['price'] ?? null;
    $oldPrice = $body['oldPrice'] ?? null;
    foreach (['price' => $price, 'oldPrice' => $oldPrice] as $value) {
        if ($value !== null && $value !== '' && (!is_numeric($value) || (float) $value != (int) $value ||
            (int) $value < 0 || (int) $value > 100000000)) return ['error' => 'Цена должна быть целым числом в тенге.'];
    }
    $price = ($price === null || $price === '') ? null : (int) $price;
    $oldPrice = ($oldPrice === null || $oldPrice === '') ? null : (int) $oldPrice;
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) return ['error' => 'Укажите латинский URL: только буквы, цифры и дефисы.'];
    if (!$name) return ['error' => 'Укажите название позиции.'];
    if (!in_array($category, ['sinks','bathsinks','taps','filters','disposers','dispenser','acs','omoikiri-home'], true)) {
        return ['error' => 'Выберите раздел каталога.'];
    }
    if ($oldPrice !== null && $price !== null && $oldPrice < $price) return ['error' => 'Старая цена не может быть меньше текущей.'];
    $imageUrl = text_value($body['imageUrl'] ?? null, 1000);
    if ($imageUrl && !str_starts_with($imageUrl, 'https://') && !str_starts_with($imageUrl, '/')) {
        return ['error' => 'Ссылка на изображение должна начинаться с https:// или /.'];
    }
    $variants = [];
    foreach (array_slice(is_array($body['variants'] ?? null) ? $body['variants'] : [], 0, 50) as $source) {
        if (!is_array($source)) continue;
        $variant = ['color' => strtolower(text_value($source['color'] ?? null, 30)),
            'name' => text_value($source['name'] ?? null, 80), 'sku' => text_value($source['sku'] ?? null, 40)];
        if ($variant['color'] || $variant['name'] || $variant['sku']) $variants[] = $variant;
    }
    return ['value' => ['slug' => $slug, 'name' => $name, 'sku' => text_value($body['sku'] ?? null, 40),
        'category' => $category, 'image_url' => $imageUrl, 'price' => $price, 'old_price' => $oldPrice,
        'description' => text_value($body['description'] ?? null, 5000),
        'material' => text_value($body['material'] ?? null, 160),
        'colors' => text_value($body['colors'] ?? null, 500),
        'variants' => json_encode($variants, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        'specifications' => text_value($body['specifications'] ?? null, 5000),
        'visible' => in_array($body['visible'] ?? true, [false, 0, '0'], true) ? 0 : 1,
        'is_custom' => ($body['isCustom'] ?? true) === false ? 0 : 1]];
}

function admin_products(PDO $db, string $method, ?int $id): void
{
    if (!require_admin()) return;
    if ($method === 'GET' && $id === null) {
        send_json(['items' => array_map('row_product', rows($db, 'SELECT * FROM catalog_items ORDER BY updated_at DESC, id DESC'))]); return;
    }
    if ($id !== null && $id < 1) { send_json(['error' => 'Некорректный идентификатор позиции.'], 400); return; }
    if ($method === 'DELETE' && $id !== null) {
        $changed = db_run($db, 'DELETE FROM catalog_items WHERE id = ?', [$id]);
        if (!$changed) { send_json(['error' => 'Позиция не найдена.'], 404); return; }
        send_json(['ok' => true]); return;
    }
    if (!(($method === 'POST' && $id === null) || ($method === 'PUT' && $id !== null))) {
        header('Allow: GET, POST, PUT, DELETE'); send_json(['error' => 'Method not allowed'], 405); return;
    }
    try { $body = input_json(); } catch (Throwable) { send_json(['error' => 'Некорректный запрос.'], 400); return; }
    $normalized = normalize_product($body);
    if (isset($normalized['error'])) { send_json(['error' => $normalized['error']], 400); return; }
    $item = $normalized['value'];
    try {
        if ($id === null) {
            db_run($db, 'INSERT INTO catalog_items (slug, name, sku, category, image_url, price, old_price, description, material, colors, variants, specifications, visible, is_custom, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)', array_values($item));
            $id = (int) $db->lastInsertId();
        } else {
            $changed = db_run($db, 'UPDATE catalog_items SET slug=?, name=?, sku=?, category=?, image_url=?, price=?, old_price=?, description=?, material=?, colors=?, variants=?, specifications=?, visible=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
                [...array_slice(array_values($item), 0, 13), $id]);
            if (!$changed && !db_one($db, 'SELECT id FROM catalog_items WHERE id = ?', [$id])) {
                send_json(['error' => 'Позиция не найдена.'], 404); return;
            }
        }
        $row = db_one($db, 'SELECT * FROM catalog_items WHERE id = ?', [$id]);
        send_json(['item' => row_product($row)], $method === 'POST' ? 201 : 200);
    } catch (PDOException $error) {
        if (str_contains($error->getMessage(), 'UNIQUE')) { send_json(['error' => 'Позиция с таким URL уже есть.'], 400); return; }
        error_log('PHP product save failed: ' . $error->getMessage());
        send_json(['error' => 'Не удалось сохранить позицию.'], 500);
    }
}

function admin_overrides(PDO $db, string $method, ?string $slug): void
{
    if (!require_admin()) return;
    if ($method === 'GET' && $slug === null) {
        $items = [];
        foreach (rows($db, 'SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides ORDER BY slug') as $row) {
            $items[] = ['slug' => $row['slug'], 'visible' => (bool) $row['visible'],
                'hiddenColors' => json_decode($row['hidden_colors'] ?: '[]', true) ?: []];
        }
        send_json(['overrides' => $items]); return;
    }
    if ($method !== 'PUT' || $slug === null) {
        header('Allow: GET, PUT'); send_json(['error' => 'Method not allowed'], 405); return;
    }
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
        send_json(['error' => 'Некорректный URL позиции.'], 400); return;
    }
    try { $body = input_json(); } catch (Throwable) { send_json(['error' => 'Некорректный запрос.'], 400); return; }
    $colors = $body['hiddenColors'] ?? [];
    if (!is_array($colors)) $colors = [];
    $hidden = [];
    foreach ($colors as $color) {
        $value = strtolower(trim((string) $color));
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value) || in_array($value, $hidden, true)) {
            send_json(['error' => 'Некорректный код цвета.'], 400); return;
        }
        $hidden[] = $value;
    }
    if (count($hidden) > 80) { send_json(['error' => 'Некорректный код цвета.'], 400); return; }
    $visible = ($body['visible'] ?? true) === false ? 0 : 1;
    $sql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
        ? 'INSERT INTO catalog_visibility_overrides (slug, visible, hidden_colors, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET visible=excluded.visible, hidden_colors=excluded.hidden_colors, updated_at=CURRENT_TIMESTAMP'
        : 'INSERT INTO catalog_visibility_overrides (slug, visible, hidden_colors, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE visible=VALUES(visible), hidden_colors=VALUES(hidden_colors), updated_at=CURRENT_TIMESTAMP';
    db_run($db, $sql, [$slug, $visible, json_encode($hidden, JSON_THROW_ON_ERROR)]);
    send_json(['override' => ['slug' => $slug, 'visible' => (bool) $visible, 'hiddenColors' => $hidden]]);
}

function admin_stock(PDO $db): void
{
    if (!require_admin()) return;
    $row = db_one($db, 'SELECT payload, fetched_at, article_count FROM stock_snapshot WHERE id = 1');
    if (!$row) { send_json(['ready' => false]); return; }
    $payload = json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
    send_json(['ready' => true, 'fetchedAt' => $row['fetched_at'],
        'articleCount' => (int) $row['article_count'], ...$payload]);
}
