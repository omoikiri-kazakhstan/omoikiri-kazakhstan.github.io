<?php
declare(strict_types=1);

if ($argc !== 2) {
    fwrite(STDERR, "Usage: php fixture.php database.sqlite\n");
    exit(2);
}

$db = new PDO('sqlite:' . $argv[1], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$db->exec('CREATE TABLE catalog_items (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, sku TEXT NOT NULL DEFAULT "", category TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT "", price INTEGER, old_price INTEGER, description TEXT NOT NULL DEFAULT "", material TEXT NOT NULL DEFAULT "", colors TEXT NOT NULL DEFAULT "", variants TEXT NOT NULL DEFAULT "[]", specifications TEXT NOT NULL DEFAULT "", visible INTEGER NOT NULL DEFAULT 1, is_custom INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT "")');
$db->exec('CREATE TABLE catalog_visibility_overrides (slug TEXT PRIMARY KEY, visible INTEGER NOT NULL DEFAULT 1, hidden_colors TEXT NOT NULL DEFAULT "[]", updated_at TEXT NOT NULL DEFAULT "")');
$db->exec('CREATE TABLE admin_magic_links (token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL)');
$db->exec('CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, city TEXT NOT NULL, address TEXT NOT NULL DEFAULT "", comment TEXT NOT NULL DEFAULT "", items_json TEXT NOT NULL, estimated_total INTEGER NOT NULL, notification_status TEXT NOT NULL DEFAULT "pending", created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, status TEXT NOT NULL DEFAULT "new", internal_note TEXT NOT NULL DEFAULT "", updated_at TEXT NOT NULL DEFAULT "", payment_status TEXT NOT NULL DEFAULT "not_required", payment_transaction_id TEXT NOT NULL DEFAULT "", payment_test_mode INTEGER NOT NULL DEFAULT 0, payment_paid_at TEXT NOT NULL DEFAULT "", payment_checked_at TEXT NOT NULL DEFAULT "", payment_expires_at TEXT NOT NULL DEFAULT "")');
$db->exec('CREATE TABLE stock_snapshot (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, fetched_at TEXT NOT NULL, moscow_modified_at TEXT, spb_modified_at TEXT, article_count INTEGER NOT NULL)');
$db->exec('CREATE TABLE ru_price_snapshot (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, fetched_at TEXT NOT NULL)');

$db->prepare('INSERT INTO ru_price_snapshot (id, payload, fetched_at) VALUES (1, ?, ?)')->execute([
    json_encode(['prices' => ['4997361' => ['price' => 36000, 'regular' => 36000]], 'singles' => []], JSON_THROW_ON_ERROR),
    '2026-10-22T00:00:00.000Z',
]);
$db->prepare('INSERT INTO stock_snapshot (id, payload, fetched_at, article_count) VALUES (1, ?, ?, 1)')->execute([
    json_encode(['items' => ['4997361' => ['name' => 'Akari 45', 'moscow' => 3, 'spb' => 2,
        'total' => 5, 'totalMore' => false]], 'sources' => []], JSON_THROW_ON_ERROR),
    '2026-10-22T00:00:00.000Z',
]);
$db->prepare('INSERT INTO orders (request_id, customer_name, phone, city, items_json, estimated_total) VALUES (?, ?, ?, ?, ?, ?)')->execute([
    'c71ab029-9158-4dc2-bff9-c25a5091337a', 'Fixture Customer', '+77000000000', 'Astana',
    json_encode([['id' => 'akari-45-4997361', 'name' => 'Akari 45', 'sku' => '4997361',
        'color' => 'BL', 'qty' => 1, 'price' => 219880]], JSON_THROW_ON_ERROR), 219880,
]);
echo "Fixture ready\n";
