<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';
try {
    echo json_encode(sync_stock(database()), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Stock sync failed; snapshot retained: ' . $error->getMessage() . "\n");
    exit(1);
}
