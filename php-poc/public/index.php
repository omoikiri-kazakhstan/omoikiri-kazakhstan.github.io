<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

try {
    run_app();
} catch (Throwable $error) {
    error_log('PHP prototype: ' . $error->getMessage());
    send_json(['error' => 'Сервис временно недоступен.'], 503);
}
