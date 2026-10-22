<?php
declare(strict_types=1);

function upsert_snapshot(PDO $db, string $table, array $values): void
{
    if (!in_array($table, ['stock_snapshot', 'ru_price_snapshot'], true)) throw new InvalidArgumentException('Invalid table');
    $columns = array_keys($values);
    $names = implode(', ', $columns);
    $holders = implode(', ', array_fill(0, count($columns), '?'));
    $updates = [];
    foreach ($columns as $column) {
        if ($column === 'id') continue;
        $updates[] = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
            ? $column . '=excluded.' . $column
            : $column . '=VALUES(' . $column . ')';
    }
    $sql = 'INSERT INTO ' . $table . ' (' . $names . ') VALUES (' . $holders . ') ' .
        ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'ON CONFLICT(id) DO UPDATE SET ' : 'ON DUPLICATE KEY UPDATE ') .
        implode(', ', $updates);
    db_run($db, $sql, array_values($values));
}

function download_stock(string $url): array
{
    $body = '';
    $modifiedAt = null;
    $curl = curl_init($url);
    if ($curl === false) throw new RuntimeException('Cannot open stock source');
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => false, CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 5000000) return 0;
            $body .= $chunk;
            return strlen($chunk);
        },
        CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$modifiedAt): int {
            if (stripos($header, 'Last-Modified:') === 0) {
                $timestamp = strtotime(trim(substr($header, 14)));
                $modifiedAt = $timestamp === false ? null : gmdate('Y-m-d\TH:i:s.000\Z', $timestamp);
            }
            return strlen($header);
        },
    ]);
    $success = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if (!$success || $status !== 200 || strlen($body) < 100 || strlen($body) > 5000000 ||
        !str_starts_with($body, 'PK')) throw new RuntimeException('Stock source failed HTTP ' . $status);
    return ['items' => parse_stock($body), 'modifiedAt' => $modifiedAt];
}

function xlsx_xml(ZipArchive $zip, string $name): SimpleXMLElement
{
    $stat = $zip->statName($name);
    if ($stat === false || $stat['size'] > 20000000) throw new RuntimeException('Missing or oversized XLSX part: ' . $name);
    $xml = $zip->getFromName($name);
    if ($xml === false) throw new RuntimeException('Cannot read XLSX part: ' . $name);
    $parsed = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
    if ($parsed === false) throw new RuntimeException('Invalid XLSX XML: ' . $name);
    return $parsed;
}

function parse_stock(string $bytes): array
{
    $path = tempnam(sys_get_temp_dir(), 'omoxlsx');
    if ($path === false) throw new RuntimeException('Cannot allocate XLSX file');
    file_put_contents($path, $bytes);
    $zip = new ZipArchive();
    try {
        if ($zip->open($path) !== true) throw new RuntimeException('Invalid XLSX archive');
        $sharedXml = xlsx_xml($zip, 'xl/sharedStrings.xml');
        $styles = xlsx_xml($zip, 'xl/styles.xml');
        $sheet = xlsx_xml($zip, 'xl/worksheets/sheet1.xml');
        $shared = [];
        foreach ($sharedXml->si as $si) {
            $value = (string) ($si->t ?? '');
            if ($value === '') foreach ($si->r as $run) $value .= (string) $run->t;
            $shared[] = $value;
        }
        $formats = [];
        foreach (($styles->numFmts->numFmt ?? []) as $format) {
            $formats[(int) $format['numFmtId']] = (string) $format['formatCode'];
        }
        $xfs = [];
        foreach (($styles->cellXfs->xf ?? []) as $xf) $xfs[] = (int) $xf['numFmtId'];
        $items = [];
        $headerOk = false;
        foreach (($sheet->sheetData->row ?? []) as $row) {
            $number = (int) $row['r'];
            $cells = [];
            foreach ($row->c as $cell) {
                $reference = (string) $cell['r'];
                $column = preg_replace('/\d+$/', '', $reference);
                $value = (string) $cell->v;
                if ((string) $cell['t'] === 's') $value = $shared[(int) $value] ?? '';
                $cells[$column] = ['value' => $value, 'style' => (int) $cell['s']];
            }
            if ($number === 10) $headerOk = ($cells['J']['value'] ?? null) === 'Сейчас';
            if ($number <= 12) continue;
            $sku = trim($cells['A']['value'] ?? '');
            $name = ($cells['B']['value'] ?? '') ?: ($cells['D']['value'] ?? '');
            $price = $cells['I']['value'] ?? null;
            $quantity = $cells['J']['value'] ?? null;
            if ($sku === '' || $name === '' || !is_numeric($price) || !is_numeric($quantity) ||
                (float) $quantity != (int) $quantity || (int) $quantity < 0) continue;
            if (isset($items[$sku])) throw new RuntimeException('Duplicate stock article ' . $sku);
            $format = $formats[$xfs[$cells['J']['style']] ?? 0] ?? '';
            $items[$sku] = ['quantity' => (int) $quantity, 'more' => str_contains($format, '"+"'),
                'name' => trim($name), 'price' => (float) $price];
        }
        if (!$headerOk || count($items) < 500) throw new RuntimeException('Unexpected stock sheet layout or too few items');
        return $items;
    } finally {
        $zip->close();
        unlink($path);
    }
}

function sync_stock(PDO $db, ?array $sources = null, ?callable $download = null): array
{
    $sources ??= [
        'moscow' => 'https://omoikiri.ru/ostatki/Ostatki_Omoikiri_Msk%20(XLSX).xlsx',
        'spb' => 'https://omoikiri.ru/ostatki/Ostatki_Omoikiri_SPb%20(XLSX).xlsx',
    ];
    $download ??= 'download_stock';
    $moscow = $download($sources['moscow']);
    $spb = $download($sources['spb']);
    $firstTime = $moscow['modifiedAt'] ? strtotime($moscow['modifiedAt']) : null;
    $secondTime = $spb['modifiedAt'] ? strtotime($spb['modifiedAt']) : null;
    if ($firstTime !== null && $secondTime !== null && abs($firstTime - $secondTime) > 1200) {
        throw new RuntimeException('Stock sources are out of sync');
    }
    $previous = db_one($db, 'SELECT moscow_modified_at, spb_modified_at, payload FROM stock_snapshot WHERE id = 1');
    if ($previous && (($moscow['modifiedAt'] && $previous['moscow_modified_at'] &&
            $moscow['modifiedAt'] < $previous['moscow_modified_at']) ||
        ($spb['modifiedAt'] && $previous['spb_modified_at'] &&
            $spb['modifiedAt'] < $previous['spb_modified_at']))) {
        throw new RuntimeException('Stock source is older than the saved snapshot');
    }
    $items = [];
    $prices = [];
    $priceConflict = false;
    foreach (array_unique([...array_keys($moscow['items']), ...array_keys($spb['items'])]) as $sku) {
        $first = $moscow['items'][$sku] ?? null;
        $second = $spb['items'][$sku] ?? null;
        $items[$sku] = ['name' => $first['name'] ?? ($second['name'] ?? ''),
            'moscow' => $first['quantity'] ?? null, 'moscowMore' => $first['more'] ?? false,
            'spb' => $second['quantity'] ?? null, 'spbMore' => $second['more'] ?? false,
            'total' => ($first['quantity'] ?? 0) + ($second['quantity'] ?? 0),
            'totalMore' => ($first['more'] ?? false) || ($second['more'] ?? false)];
        $a = $first['price'] ?? null;
        $b = $second['price'] ?? null;
        if ($a !== null && $b !== null && $a !== $b) $priceConflict = true;
        $price = $a ?? $b;
        if ($price !== null && (float) $price == (int) $price && $price >= 100 && $price <= 5000000) {
            $prices[$sku] = (int) $price;
        }
    }
    $fetchedAt = gmdate('Y-m-d\TH:i:s.000\Z');
    $oldPayload = $previous && $previous['payload'] ? json_decode($previous['payload'], true) : [];
    $priceFetchedAt = $oldPayload['priceFetchedAt'] ?? null;
    if ($priceFetchedAt && substr($priceFetchedAt, 0, 10) === substr($fetchedAt, 0, 10)) {
        $prices = $oldPayload['prices'] ?? [];
    } elseif ($priceConflict || count($prices) < 500) {
        $prices = $oldPayload['prices'] ?? [];
    } else {
        $priceFetchedAt = $fetchedAt;
    }
    $payload = ['items' => $items, 'sources' => ['moscow' => ['modifiedAt' => $moscow['modifiedAt']],
        'spb' => ['modifiedAt' => $spb['modifiedAt']]], 'prices' => $prices,
        'priceFetchedAt' => $priceFetchedAt];
    upsert_snapshot($db, 'stock_snapshot', ['id' => 1,
        'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        'fetched_at' => $fetchedAt, 'moscow_modified_at' => $moscow['modifiedAt'],
        'spb_modified_at' => $spb['modifiedAt'], 'article_count' => count($items)]);
    return ['fetchedAt' => $fetchedAt, 'articleCount' => count($items),
        'priceFetchedAt' => $priceFetchedAt];
}

function refresh_stock(PDO $db, bool $admin): void
{
    if ($admin && !require_admin()) return;
    if (!$admin) {
        $expected = getenv('STOCK_SYNC_TOKEN');
        $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!$expected || !hash_equals('Bearer ' . $expected, $authorization)) {
            send_json(['error' => 'Unauthorized'], 401); return;
        }
    }
    $previous = db_one($db, 'SELECT fetched_at FROM stock_snapshot WHERE id = 1');
    if ($previous && time() - (strtotime($previous['fetched_at']) ?: 0) < 120) {
        send_json(['skipped' => true, 'fetchedAt' => $previous['fetched_at']]); return;
    }
    try {
        send_json(['updated' => true, ...sync_stock($db)]);
    } catch (Throwable $error) {
        error_log('PHP stock refresh failed: ' . $error->getMessage());
        send_json(['error' => 'Не удалось обновить остатки. Предыдущая выгрузка сохранена.'], 502);
    }
}
