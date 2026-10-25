<?php
declare(strict_types=1);

function payment_enabled(): bool
{
    $host = strtolower(explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''), 2)[0]);
    $liveHost = strtolower((string) (getenv('TIPTOP_LIVE_PAYMENT_HOST') ?: 'omoikiri.kz'));
    $testHost = strtolower((string) getenv('TIPTOP_TEST_PAYMENT_HOST'));
    $liveEnabled = getenv('TIPTOP_PAYMENTS_ENABLED') === 'true' && hash_equals($liveHost, $host);
    $testEnabled = getenv('TIPTOP_TEST_PAYMENTS_ENABLED') === 'true' &&
        $testHost !== '' && hash_equals($testHost, $host);
    return ($liveEnabled || $testEnabled) &&
        (bool) getenv('TIPTOP_PUBLIC_TERMINAL_ID') && (bool) getenv('TIPTOP_API_SECRET');
}

function payment_intent(array $order): array
{
    return [
        'publicTerminalId' => getenv('TIPTOP_PUBLIC_TERMINAL_ID'),
        'description' => 'Заказ OMOIKIRI KZ №' . $order['id'],
        'paymentSchema' => 'Single',
        'currency' => 'KZT',
        'amount' => (int) $order['estimated_total'],
        'externalId' => (string) $order['id'],
        'userInfo' => [
            'accountId' => $order['request_id'],
            'fullName' => $order['customer_name'],
            'phone' => $order['phone'],
            'city' => $order['city'],
        ],
        'retryPayment' => false,
    ];
}

function tiptop_signature_valid(string $body, ?string $signature): bool
{
    $secret = getenv('TIPTOP_API_SECRET');
    if (!$secret || !$signature) return false;
    $supplied = base64_decode(trim($signature), true);
    return $supplied !== false && hash_equals(hash_hmac('sha256', $body, $secret, true), $supplied);
}

function tiptop_payload(string $body, string $contentType): array
{
    if (str_contains(strtolower($contentType), 'application/json')) {
        $payload = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    } else {
        parse_str($body, $payload);
    }
    if (!is_array($payload) || array_is_list($payload)) throw new InvalidArgumentException('Invalid notification');
    return $payload;
}

function tiptop_matches_order(array $payload, array $order): bool
{
    foreach (['InvoiceId', 'AccountId', 'Currency', 'Amount', 'TransactionId'] as $field) {
        if (!isset($payload[$field]) || !is_scalar($payload[$field])) return false;
    }
    $amount = $payload['Amount'] ?? null;
    return (string) ($payload['InvoiceId'] ?? '') === (string) $order['id'] &&
        (string) ($payload['AccountId'] ?? '') === $order['request_id'] &&
        ($payload['Currency'] ?? null) === 'KZT' &&
        (is_string($amount) || is_int($amount) || is_float($amount)) && is_numeric($amount) &&
        (float) $amount === (float) $order['estimated_total'] &&
        preg_match('/^[0-9]+$/D', (string) ($payload['TransactionId'] ?? '')) === 1;
}

function tiptop_response(int $code): void
{
    send_json(['code' => $code]);
}

function tiptop_notification(PDO $db, string $type, ?string $body = null,
    ?string $signature = null, ?callable $notify = null): void
{
    $body ??= (string) file_get_contents('php://input', false, null, 0, 20001);
    $signature ??= $_SERVER['HTTP_CONTENT_HMAC'] ?? null;
    if ($body === '' || strlen($body) > 20000 || !tiptop_signature_valid($body, $signature)) {
        send_json(['error' => 'Unauthorized'], 401);
        return;
    }
    try {
        $payload = tiptop_payload($body, $_SERVER['CONTENT_TYPE'] ?? 'application/x-www-form-urlencoded');
    } catch (Throwable) {
        send_json(['error' => 'Invalid notification'], 400);
        return;
    }
    $id = filter_var($payload['InvoiceId'] ?? null, FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]);
    $order = !is_int($id) ? false : db_one($db,
        'SELECT id, request_id, customer_name, phone, city, address, comment, items_json, estimated_total, payment_status, payment_transaction_id, payment_expires_at FROM orders WHERE id = ?', [$id]);
    if ($type === 'check') {
        if (!$order) { tiptop_response(10); return; }
        if (!isset($payload['AccountId']) || !is_scalar($payload['AccountId']) ||
            (string) $payload['AccountId'] !== $order['request_id']) { tiptop_response(11); return; }
        if (!tiptop_matches_order($payload, $order)) { tiptop_response(12); return; }
        if (($payload['OperationType'] ?? null) !== 'Payment') { tiptop_response(13); return; }
        $transactionId = (string) $payload['TransactionId'];
        if ($order['payment_status'] === 'processing' &&
            $order['payment_transaction_id'] === $transactionId) { tiptop_response(0); return; }
        if ($order['payment_status'] !== 'pending' || strtotime((string) $order['payment_expires_at']) <= time()) {
            tiptop_response(13); return;
        }
        $changed = db_run($db, "UPDATE orders SET payment_status = 'processing', payment_transaction_id = ?, payment_checked_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'pending'",
            [$transactionId, $id]);
        tiptop_response($changed === 1 ? 0 : 13);
        return;
    }
    if ($type === 'pay') {
        if (!$order || !tiptop_matches_order($payload, $order) ||
            ($payload['Status'] ?? null) !== 'Completed' || ($payload['OperationType'] ?? null) !== 'Payment') {
            send_json(['error' => 'Payment mismatch'], 400); return;
        }
        $transactionId = (string) $payload['TransactionId'];
        if ($order['payment_status'] === 'paid') {
            if ($order['payment_transaction_id'] === $transactionId) tiptop_response(0);
            else send_json(['error' => 'Duplicate payment'], 409);
            return;
        }
        if (!in_array($order['payment_status'], ['pending', 'processing'], true) ||
            ($order['payment_transaction_id'] !== '' && $order['payment_transaction_id'] !== $transactionId)) {
            send_json(['error' => 'Payment mismatch'], 409); return;
        }
        $testMode = in_array(strtolower((string) ($payload['TestMode'] ?? '')), ['true', '1'], true);
        $changed = db_run($db, "UPDATE orders SET payment_status = 'paid', payment_transaction_id = ?, payment_test_mode = ?, payment_paid_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status IN ('pending', 'processing') AND (payment_transaction_id = '' OR payment_transaction_id = ?)",
            [$transactionId, $testMode ? 1 : 0, $id, $transactionId]);
        if ($changed !== 1) { send_json(['error' => 'Payment update failed'], 503); return; }
        $notify ??= 'notify_telegram';
        try {
            $notify($id, ['items' => json_decode($order['items_json'], true, 512, JSON_THROW_ON_ERROR),
                'total' => (int) $order['estimated_total'], 'name' => $order['customer_name'],
                'phone' => $order['phone'], 'city' => $order['city'], 'address' => $order['address'],
                'comment' => $order['comment']], true, $testMode);
            db_run($db, "UPDATE orders SET notification_status = 'sent' WHERE id = ?", [$id]);
        } catch (Throwable $error) {
            error_log('Paid order notification failed for order ' . $id . ': ' . $error->getMessage());
            db_run($db, "UPDATE orders SET notification_status = 'failed' WHERE id = ?", [$id]);
        }
        tiptop_response(0);
        return;
    }
    if ($type === 'fail') {
        if ($order && tiptop_matches_order($payload, $order) && $order['payment_status'] === 'processing' &&
            $order['payment_transaction_id'] === (string) $payload['TransactionId']) {
            db_run($db, "UPDATE orders SET payment_status = 'pending', payment_transaction_id = '' WHERE id = ? AND payment_status = 'processing' AND payment_transaction_id = ?",
                [$id, (string) $payload['TransactionId']]);
        }
        tiptop_response(0);
    }
}
