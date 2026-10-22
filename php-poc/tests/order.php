<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

function check_order(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$path = tempnam(sys_get_temp_dir(), 'omoorder');
if ($path === false) throw new RuntimeException('Could not create order fixture');
unlink($path);
try {
    $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/fixture.php') . ' ' . escapeshellarg($path);
    exec($command, $output, $code);
    check_order($code === 0, 'Could not seed DB');
    $db = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $body = ['requestId' => 'a71ab029-9158-4dc2-bff9-c25a5091337a',
        'name' => 'Test Customer', 'phone' => '+77077832888', 'city' => 'Astana',
        'address' => '', 'comment' => '', 'consent' => true, 'turnstileToken' => 'test-only',
        'items' => [['id' => 'akari-45-4997361', 'slug' => 'akari-45', 'name' => 'Akari 45',
            'sku' => '4997361', 'color' => 'bl', 'qty' => 1, 'price' => 219880]]];
    $notifications = [];
    $verify = static fn (string $token): bool => $token === 'test-only';
    $notify = static function (int $id, array $order) use (&$notifications): void {
        $notifications[] = ['id' => $id, 'total' => $order['total']];
    };
    ob_start();
    create_order($db, $body, $verify, $notify);
    $result = json_decode(ob_get_clean(), true);
    check_order($result['ok'] === true && $result['paymentStatus'] === 'not_required', 'Order response');
    check_order(count($notifications) === 1 && $notifications[0]['total'] === 219880, 'Notification');
    $saved = db_one($db, 'SELECT estimated_total, notification_status, items_json FROM orders WHERE request_id = ?', [$body['requestId']]);
    check_order((int) $saved['estimated_total'] === 219880 && $saved['notification_status'] === 'sent', 'Order persistence');
    ob_start();
    create_order($db, $body, $verify, $notify);
    $retry = json_decode(ob_get_clean(), true);
    check_order($retry['orderId'] === $result['orderId'] && count($notifications) === 1, 'Idempotent retry');
    $body['requestId'] = 'b71ab029-9158-4dc2-bff9-c25a5091337a';
    $body['items'][0]['price'] = 1;
    ob_start();
    create_order($db, $body, $verify, $notify);
    $tampered = json_decode(ob_get_clean(), true);
    check_order(isset($tampered['error']) && count($notifications) === 1, 'Price tampering');
    echo "PHP order checks passed\n";
} finally {
    $db = null;
    gc_collect_cycles();
    if (is_file($path)) {
        for ($attempt = 0; $attempt < 5 && is_file($path); $attempt++) {
            if (@unlink($path)) break;
            usleep(100000);
        }
    }
}
