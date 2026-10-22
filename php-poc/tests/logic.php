<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

check(kzt_price(36000) === 219880, 'KZT rounding');
check(discontinued('tonami', '4994221', 'ca'), 'Discontinued SKU');
check(!discontinued('akari-45', '4997361', 'bl'), 'Active SKU');

$path = tempnam(sys_get_temp_dir(), 'omoiphp');
if ($path === false) throw new RuntimeException('Could not create fixture');
try {
    unlink($path);
    $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/fixture.php') . ' ' . escapeshellarg($path);
    exec($command, $output, $code);
    check($code === 0, 'Could not seed SQLite');
    $db = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $live = live_prices($db);
    check($live['bySku']->{'4997361'} === 36000, 'Live price snapshot');
    $item = ['slug' => 'akari-45', 'sku' => '4997361', 'price' => 219880, 'qty' => 1];
    $resolved = resolve_order_items($db, [$item]);
    check(($resolved['items'][0]['price'] ?? null) === 219880, 'Server-side order price');
    $item['price'] = 1;
    check(isset(resolve_order_items($db, [$item])['error']), 'Tampered price must fail');
    db_run($db, 'INSERT INTO catalog_visibility_overrides (slug, visible, hidden_colors) VALUES (?, ?, ?)',
        ['akari-45', 1, '["bl"]']);
    $item['price'] = 219880;
    check(isset(resolve_order_items($db, [$item])['error']), 'Hidden color must fail');
    echo "PHP logic checks passed\n";
} finally {
    $db = null;
    if (is_file($path)) unlink($path);
}
