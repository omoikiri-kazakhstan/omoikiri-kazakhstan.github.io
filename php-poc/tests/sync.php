<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/app.php';

function assert_sync(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$zipPath = tempnam(sys_get_temp_dir(), 'omotest');
if ($zipPath === false) throw new RuntimeException('Could not create XLSX fixture');
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) throw new RuntimeException('Could not open XLSX fixture');
$namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
$zip->addFromString('xl/sharedStrings.xml', '<sst xmlns="' . $namespace . '"><si><t>Сейчас</t></si><si><t>Test sink</t></si></sst>');
$zip->addFromString('xl/styles.xml', '<styleSheet xmlns="' . $namespace . '"><numFmts><numFmt numFmtId="200" formatCode="0&quot;+&quot;"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="200"/></cellXfs></styleSheet>');
$rows = ['<row r="10"><c r="J10" t="s"><v>0</v></c></row>'];
for ($i = 13; $i < 513; $i++) {
    $sku = 5000000 + $i;
    $rows[] = '<row r="' . $i . '"><c r="A' . $i . '"><v>' . $sku . '</v></c>' .
        '<c r="B' . $i . '" t="s"><v>1</v></c>' .
        '<c r="I' . $i . '"><v>1000</v></c>' .
        '<c r="J' . $i . '" s="1"><v>5</v></c></row>';
}
$zip->addFromString('xl/worksheets/sheet1.xml', '<worksheet xmlns="' . $namespace . '"><sheetData>' . implode('', $rows) . '</sheetData></worksheet>');
$zip->close();
try {
    $bytes = file_get_contents($zipPath);
    $parsed = parse_stock($bytes);
    assert_sync(count($parsed) === 500, 'XLSX article count');
    assert_sync($parsed['5000013']['quantity'] === 5, 'XLSX quantity');
    assert_sync($parsed['5000013']['name'] === 'Test sink', 'XLSX shared string');
    assert_sync($parsed['5000013']['more'] === true, 'XLSX plus-sign format');
} finally {
    unlink($zipPath);
}

$path = tempnam(sys_get_temp_dir(), 'omodb');
if ($path === false) throw new RuntimeException('Could not create price fixture');
unlink($path);
try {
    $command = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/fixture.php') . ' ' . escapeshellarg($path);
    exec($command, $output, $code);
    assert_sync($code === 0, 'Could not seed price DB');
    $db = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $stockResult = sync_stock($db, ['moscow' => 'first', 'spb' => 'second'],
        static fn () => ['items' => $parsed, 'modifiedAt' => null]);
    assert_sync($stockResult['articleCount'] === 500, 'Stock snapshot count');
    $stockSaved = db_one($db, 'SELECT payload FROM stock_snapshot WHERE id = 1');
    try {
        sync_stock($db, ['moscow' => 'first', 'spb' => 'second'],
            static fn () => throw new RuntimeException('Source offline'));
        throw new RuntimeException('Stock failure must throw');
    } catch (RuntimeException $error) {
        assert_sync(str_contains($error->getMessage(), 'offline'), 'Expected stock source failure');
    }
    assert_sync(db_one($db, 'SELECT payload FROM stock_snapshot WHERE id = 1')['payload'] === $stockSaved['payload'],
        'Old stock snapshot must survive source outage');
    $products = catalog_products();
    $result = sync_ru_prices($db, static function (string $slug) use ($products): string {
        $product = $products[$slug];
        if (empty($product['variations'])) {
            $sku = $product['sku'] ?? '';
            return '<p class="sku">арт. ' . $sku . '</p><div class="rrc">1000 ₽</div><div class="fav_button"></div>';
        }
        $data = [];
        foreach ($product['variations'] as $variant) {
            $data[] = ['sku' => $variant['sku'], 'display_price' => $variant['price'],
                'display_regular_price' => $variant['price']];
        }
        return '<div data-product_variations="' . htmlspecialchars(json_encode($data, JSON_THROW_ON_ERROR), ENT_QUOTES, 'UTF-8') . '"></div>';
    });
    assert_sync($result['coverage'] > 0.99, 'RU price coverage');
    $after = db_one($db, 'SELECT payload FROM ru_price_snapshot WHERE id = 1');
    assert_sync(isset(json_decode($after['payload'], true)['prices']['4997361']), 'RU snapshot saved');
    try {
        sync_ru_prices($db, static fn () => throw new RuntimeException('Source offline'));
        throw new RuntimeException('Low coverage must fail');
    } catch (RuntimeException $error) {
        assert_sync(str_contains($error->getMessage(), 'coverage'), 'Expected coverage failure');
    }
    $retained = db_one($db, 'SELECT payload FROM ru_price_snapshot WHERE id = 1');
    assert_sync($retained['payload'] === $after['payload'], 'Old RU prices must survive source outage');
    echo "PHP sync checks passed\n";
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
