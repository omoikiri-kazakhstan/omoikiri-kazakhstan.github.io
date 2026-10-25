<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

$products = array_slice(catalog_file(), 0, 4);
$pages = ru_pages_batch($products, null);
$results = [];
foreach ($products as $index => $product) {
    $page = $pages[$index];
    $results[$product['slug']] = $page instanceof Throwable
        ? ['error' => $page->getMessage()]
        : ['matchedPrices' => count(parse_ru_prices($page))];
}
echo json_encode($results, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";
