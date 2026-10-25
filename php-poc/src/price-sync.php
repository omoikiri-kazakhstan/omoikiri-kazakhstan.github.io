<?php
declare(strict_types=1);

function parse_ru_prices(string $html): array
{
    if (!preg_match('/data-product_variations="([^"]*)"/', $html, $match) || $match[1] === 'false') return [];
    $variations = json_decode(html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($variations)) throw new RuntimeException('Invalid RU variations');
    $prices = [];
    foreach ($variations as $variant) {
        $sku = trim((string) ($variant['sku'] ?? ''));
        $price = $variant['display_price'] ?? null;
        $regular = $variant['display_regular_price'] ?? $price;
        if (!$sku || !is_numeric($price) || !is_numeric($regular) ||
            (float) $price != (int) $price || (float) $regular != (int) $regular ||
            $price < 100 || $price > 5000000 || $regular < $price || $regular > 5000000) continue;
        if (isset($prices[$sku]) && $prices[$sku]['price'] !== (int) $price) {
            throw new RuntimeException('Conflicting RU price for ' . $sku);
        }
        $prices[$sku] = ['price' => (int) $price, 'regular' => (int) $regular];
    }
    return $prices;
}

function parse_ru_single(string $html): ?array
{
    preg_match('/<p class="sku">\s*арт\.\s*(\d{6,})\s*<\/p>/iu', $html, $skuMatch);
    $sku = $skuMatch[1] ?? '';
    $start = strpos($html, 'class="rrc"');
    if ($start === false) return null;
    $end = strpos($html, 'class="fav_button"', $start);
    $block = strip_tags(substr($html, $start, $end === false ? 600 : $end - $start));
    preg_match_all('/\d[\d\s\x{00a0}]*\d|\d/u', $block, $matches);
    $amounts = [];
    foreach ($matches[0] as $value) {
        $number = (int) preg_replace('/\D/u', '', $value);
        if ($number >= 100 && $number <= 5000000) $amounts[] = $number;
    }
    if (!$amounts) return null;
    $price = end($amounts);
    return ['sku' => $sku, 'price' => $price, 'regular' => max($price, $amounts[0])];
}

function ru_product_html(string $slug): string
{
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) throw new InvalidArgumentException('Invalid slug');
    $curl = curl_init('https://omoikiri.ru/product/' . $slug . '/');
    if ($curl === false) throw new RuntimeException('Could not open RU page');
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Accept: text/html'], CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3]);
    $html = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $effective = curl_getinfo($curl, CURLINFO_EFFECTIVE_URL);
    curl_close($curl);
    if (!is_string($html) || $status !== 200 || !str_starts_with($effective, 'https://omoikiri.ru/')) {
        throw new RuntimeException('RU page returned HTTP ' . $status);
    }
    return $html;
}

function ru_pages_batch(array $products, ?callable $fetch): array
{
    if ($fetch !== null) {
        $pages = [];
        foreach ($products as $product) {
            try { $pages[] = $fetch($product['slug']); }
            catch (Throwable $error) { $pages[] = $error; }
        }
        return $pages;
    }
    $multi = curl_multi_init();
    $handles = [];
    try {
        foreach ($products as $product) {
            $slug = $product['slug'];
            if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
                throw new InvalidArgumentException('Invalid slug');
            }
            $curl = curl_init('https://omoikiri.ru/product/' . $slug . '/');
            if ($curl === false) throw new RuntimeException('Could not open RU page');
            curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
                CURLOPT_HTTPHEADER => ['Accept: text/html'], CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 3]);
            curl_multi_add_handle($multi, $curl);
            $handles[] = $curl;
        }
        do {
            $result = curl_multi_exec($multi, $running);
            if ($result !== CURLM_OK) throw new RuntimeException('RU batch request failed');
            if ($running && curl_multi_select($multi, 1.0) === -1) usleep(10000);
        } while ($running);
        $pages = [];
        foreach ($handles as $curl) {
            $html = curl_multi_getcontent($curl);
            $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            $effective = curl_getinfo($curl, CURLINFO_EFFECTIVE_URL);
            $pages[] = is_string($html) && curl_errno($curl) === 0 && $status === 200 &&
                str_starts_with($effective, 'https://omoikiri.ru/')
                ? $html : new RuntimeException('RU page returned HTTP ' . $status);
        }
        return $pages;
    } finally {
        foreach ($handles as $curl) { curl_multi_remove_handle($multi, $curl); curl_close($curl); }
        curl_multi_close($multi);
    }
}

function ru_product_pages(array $products, ?callable $fetch): Generator
{
    foreach (array_chunk($products, 4) as $batch) {
        foreach (ru_pages_batch($batch, $fetch) as $index => $page) {
            yield [$batch[$index], $page];
        }
    }
}

function sync_ru_prices(PDO $db, ?callable $fetch = null): array
{
    $previousRow = db_one($db, 'SELECT payload FROM ru_price_snapshot WHERE id = 1');
    $previous = $previousRow ? json_decode($previousRow['payload'], true) : [];
    $saved = $previous['prices'] ?? [];
    $savedSingles = $previous['singles'] ?? [];
    $prices = [];
    $singles = [];
    $expected = [];
    $observed = [];
    $errors = 0;
    foreach (ru_product_pages(catalog_file(), $fetch) as [$product, $page]) {
        $slug = $product['slug'];
        $skus = [];
        foreach (($product['variations'] ?: [['sku' => $product['sku'] ?? '']]) as $variant) {
            $sku = (string) ($variant['sku'] ?? '');
            if ($sku) { $skus[$sku] = true; $expected[$sku] = true; }
        }
        try {
            if ($page instanceof Throwable) throw $page;
            $html = $page;
            $live = parse_ru_prices($html);
            if (!$skus) {
                $single = parse_ru_single($html);
                if ($single) {
                    $singles[$slug] = $single;
                    if ($single['sku']) $prices[$single['sku']] = ['price' => $single['price'], 'regular' => $single['regular']];
                }
                continue;
            }
            if (!$live && count($skus) === 1) {
                $single = parse_ru_single($html);
                $firstSku = array_key_first($skus);
                if ($single && $single['sku'] === $firstSku) {
                    $prices[$firstSku] = ['price' => $single['price'], 'regular' => $single['regular']];
                    $observed[$firstSku] = true;
                    continue;
                }
            }
            foreach ($skus as $sku => $_) {
                if (!isset($live[$sku])) continue;
                if (isset($prices[$sku]) && $prices[$sku]['price'] !== $live[$sku]['price']) {
                    throw new RuntimeException('Conflicting RU price for ' . $sku);
                }
                $prices[$sku] = $live[$sku];
                $observed[$sku] = true;
            }
        } catch (Throwable $error) {
            $errors++;
            if (isset($savedSingles[$slug])) $singles[$slug] = $savedSingles[$slug];
            foreach ($skus as $sku => $_) if (isset($saved[$sku])) $prices[$sku] = $saved[$sku];
        }
    }
    $coverage = count(array_intersect_key($observed, $expected)) / max(1, count($expected));
    if (!$expected || $coverage < 0.8) throw new RuntimeException('RU price coverage too low: ' . $coverage);
    $fetchedAt = gmdate('Y-m-d\TH:i:s.000\Z');
    upsert_snapshot($db, 'ru_price_snapshot', ['id' => 1,
        'payload' => json_encode(['prices' => $prices, 'singles' => $singles], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        'fetched_at' => $fetchedAt]);
    return ['fetchedAt' => $fetchedAt, 'priceCount' => count($prices),
        'expectedCount' => count($expected), 'coverage' => $coverage, 'errorCount' => $errors];
}
