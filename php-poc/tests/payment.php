<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

function payment_check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

function captured(callable $action): array
{
    http_response_code(200);
    ob_start();
    $action();
    $body = json_decode((string) ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
    return ['status' => http_response_code(), 'body' => $body];
}

$path = tempnam(sys_get_temp_dir(), 'omopay');
if ($path === false) throw new RuntimeException('Could not create payment fixture');
unlink($path);
try {
    $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/fixture.php') . ' ' . escapeshellarg($path);
    exec($command, $output, $code);
    payment_check($code === 0, 'Could not seed DB');
    $db = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    putenv('TIPTOP_PAYMENTS_ENABLED=true');
    putenv('TIPTOP_PUBLIC_TERMINAL_ID=test-terminal');
    putenv('TIPTOP_API_SECRET=test-secret-do-not-deploy');
    payment_check(payment_enabled(), 'Payment flag should require all settings');
    $body = ['requestId' => 'd71ab029-9158-4dc2-bff9-c25a5091337a',
        'name' => 'Payment Test', 'phone' => '+77077832888', 'city' => 'Astana',
        'address' => '', 'comment' => '', 'consent' => true, 'turnstileToken' => 'test-only',
        'items' => [['id' => 'akari-45-4997361', 'slug' => 'akari-45', 'name' => 'Akari 45',
            'sku' => '4997361', 'color' => 'bl', 'qty' => 1, 'price' => 219880]]];
    $notifications = [];
    $verify = static fn (string $token): bool => $token === 'test-only';
    $notify = static function (int $id, array $order, bool $paid = false, bool $test = false) use (&$notifications): void {
        $notifications[] = compact('id', 'paid', 'test');
    };
    $created = captured(static fn () => create_order($db, $body, $verify, $notify));
    payment_check($created['status'] === 201 && $created['body']['paymentStatus'] === 'pending', 'Pending order');
    $id = $created['body']['orderId'];
    payment_check($created['body']['payment']['externalId'] === (string) $id &&
        $created['body']['payment']['amount'] === 219880 && count($notifications) === 0, 'Verified payment intent');
    $retry = captured(static fn () => create_order($db, $body, $verify, $notify));
    payment_check($retry['body']['orderId'] === $id && count($notifications) === 0, 'Idempotent pending order');

    $_SERVER['CONTENT_TYPE'] = 'application/json';
    $payload = ['InvoiceId' => (string) $id, 'AccountId' => $body['requestId'],
        'Amount' => 219880, 'Currency' => 'KZT', 'TransactionId' => '123456',
        'OperationType' => 'Payment', 'Status' => 'Completed', 'TestMode' => true];
    $raw = json_encode($payload, JSON_THROW_ON_ERROR);
    $sign = static fn (string $value): string => base64_encode(hash_hmac('sha256', $value, 'test-secret-do-not-deploy', true));
    $invalid = captured(static fn () => tiptop_notification($db, 'check', $raw, $sign('tampered'), $notify));
    payment_check($invalid['status'] === 401, 'Invalid signature rejected');
    $wrong = $payload; $wrong['Amount'] = 1;
    $wrongRaw = json_encode($wrong, JSON_THROW_ON_ERROR);
    $mismatch = captured(static fn () => tiptop_notification($db, 'check', $wrongRaw, $sign($wrongRaw), $notify));
    payment_check($mismatch['body']['code'] === 12, 'Wrong amount rejected');
    $invalidId = $payload; $invalidId['InvoiceId'] = ['invalid'];
    $invalidIdRaw = json_encode($invalidId, JSON_THROW_ON_ERROR);
    payment_check(captured(static fn () => tiptop_notification($db, 'check', $invalidIdRaw,
        $sign($invalidIdRaw), $notify))['body']['code'] === 10, 'Invalid order ID rejected');
    $invalidAccount = $payload; $invalidAccount['AccountId'] = ['invalid'];
    $invalidAccountRaw = json_encode($invalidAccount, JSON_THROW_ON_ERROR);
    payment_check(captured(static fn () => tiptop_notification($db, 'check', $invalidAccountRaw,
        $sign($invalidAccountRaw), $notify))['body']['code'] === 11, 'Invalid account rejected');
    $checked = captured(static fn () => tiptop_notification($db, 'check', $raw, $sign($raw), $notify));
    payment_check($checked['body']['code'] === 0, 'Check accepted');
    payment_check(captured(static fn () => tiptop_notification($db, 'check', $raw, $sign($raw), $notify))['body']['code'] === 0,
        'Duplicate Check accepted');
    $failed = captured(static fn () => tiptop_notification($db, 'fail', $raw, $sign($raw), $notify));
    payment_check($failed['body']['code'] === 0 &&
        db_one($db, 'SELECT payment_status FROM orders WHERE id = ?', [$id])['payment_status'] === 'pending', 'Fail resets processing');
    captured(static fn () => tiptop_notification($db, 'check', $raw, $sign($raw), $notify));
    $paid = captured(static fn () => tiptop_notification($db, 'pay', $raw, $sign($raw), $notify));
    payment_check($paid['body']['code'] === 0 && count($notifications) === 1 &&
        $notifications[0]['paid'] && $notifications[0]['test'], 'Pay notifies once');
    $row = db_one($db, 'SELECT payment_status, payment_test_mode, notification_status FROM orders WHERE id = ?', [$id]);
    payment_check($row['payment_status'] === 'paid' && (int) $row['payment_test_mode'] === 1 &&
        $row['notification_status'] === 'sent', 'Paid status persisted');
    captured(static fn () => tiptop_notification($db, 'pay', $raw, $sign($raw), $notify));
    payment_check(count($notifications) === 1, 'Duplicate Pay does not notify twice');
    $spoofed = $payload; $spoofed['TransactionId'] = '999999';
    $spoofedRaw = json_encode($spoofed, JSON_THROW_ON_ERROR);
    $duplicate = captured(static fn () => tiptop_notification($db, 'pay', $spoofedRaw, $sign($spoofedRaw), $notify));
    payment_check($duplicate['status'] === 409, 'Different transaction cannot mark paid twice');
    $after = captured(static fn () => create_order($db, $body, $verify, $notify));
    payment_check($after['body']['paymentStatus'] === 'paid' && !isset($after['body']['payment']), 'Paid retry has no intent');
    putenv('TIPTOP_PAYMENTS_ENABLED=false');
    payment_check(!payment_enabled(), 'Payment disabled by default');
    putenv('TIPTOP_TEST_PAYMENTS_ENABLED=true');
    putenv('TIPTOP_TEST_PAYMENT_HOST=php-test.omoikiri.kz');
    $_SERVER['HTTP_HOST'] = 'omoikiri.kz';
    payment_check(!payment_enabled(), 'Test terminal is disabled on production host');
    $_SERVER['HTTP_HOST'] = 'php-test.omoikiri.kz';
    payment_check(payment_enabled(), 'Test terminal is enabled only on test host');
    echo "PHP TipTopPay checks passed\n";
} finally {
    $db = null;
    gc_collect_cycles();
    if (is_file($path)) @unlink($path);
}
