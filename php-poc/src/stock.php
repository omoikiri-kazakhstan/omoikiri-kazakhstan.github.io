<?php
declare(strict_types=1);

function public_stock(PDO $db): void
{
    $row = db_one($db, 'SELECT payload, fetched_at, article_count FROM stock_snapshot WHERE id = 1');
    if (!$row) { send_json(['ready' => false]); return; }
    $snapshot = json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
    $items = $snapshot['items'] ?? [];
    $live = live_prices($db);
    $liveSku = (array) $live['bySku'];
    $liveSlug = (array) $live['bySlug'];
    $overrides = [];
    foreach (rows($db, 'SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides') as $override) {
        $overrides[$override['slug']] = ['visible' => (bool) $override['visible'],
            'hidden' => json_decode($override['hidden_colors'] ?: '[]', true) ?: []];
    }
    $prices = [];
    foreach (catalog_file() as $product) {
        $slug = $product['slug'];
        $override = $overrides[$slug] ?? null;
        if ($override !== null && !$override['visible']) continue;
        foreach (($product['variations'] ?? []) as $variant) {
            $sku = (string) ($variant['sku'] ?? '');
            $color = $variant['color'] ?? '';
            if (!$sku || !array_key_exists($sku, $items) || discontinued($slug, $sku, $color) ||
                in_array($color, $override['hidden'] ?? [], true)) continue;
            $rub = (int) ($liveSku[$sku] ?? $variant['price']);
            if ($rub > 0) $prices[$sku] = kzt_price($rub);
        }
        if (!empty($product['variations']) || empty($product['sku'])) continue;
        $sku = (string) $product['sku'];
        if (!array_key_exists($sku, $items) || discontinued($slug, $sku, '')) continue;
        $rub = $liveSku[$sku] ?? ($liveSlug[$slug]['default']['rub'] ?? null);
        $price = $rub ? kzt_price((int) $rub) : (int) $product['price'];
        if ($price > 0) $prices[$sku] = $price;
    }
    send_json(['ready' => true, 'fetchedAt' => $row['fetched_at'],
        'articleCount' => (int) $row['article_count'], 'items' => (object) $items,
        'sources' => (object) ($snapshot['sources'] ?? []), 'catalogPrices' => (object) $prices,
        'priceFetchedAt' => $live['fetchedAt']]);
}
