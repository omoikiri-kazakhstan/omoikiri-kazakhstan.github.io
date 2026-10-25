<?php
declare(strict_types=1);

$localConfig = dirname(__DIR__) . '/config.local.php';
if (is_file($localConfig)) {
    $config = require $localConfig;
    if (!is_array($config)) {
        throw new RuntimeException('Invalid local PHP configuration');
    }
    foreach ($config as $key => $value) {
        if (!is_string($key) || !preg_match('/^[A-Z][A-Z0-9_]*$/', $key) || !is_scalar($value)) {
            throw new RuntimeException('Invalid local PHP configuration entry');
        }
        if (getenv($key) === false) {
            putenv($key . '=' . (string) $value);
        }
    }
}

function send_json(array $body, int $status = 200, string $cache = 'no-store'): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: ' . $cache);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
}

function database(): PDO
{
    if (getenv('APP_ENV') === 'test' && ($testDsn = getenv('TEST_DB_DSN'))) {
        return new PDO($testDsn, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    }
    $host = getenv('MYSQL_HOST') ?: 'localhost';
    $port = getenv('MYSQL_PORT') ?: '3306';
    $name = getenv('MYSQL_DATABASE');
    $user = getenv('MYSQL_USER');
    $password = getenv('MYSQL_PASSWORD');
    if ($name === false || $user === false || $password === false || !ctype_digit($port)) {
        throw new RuntimeException('Missing database configuration');
    }
    $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $name . ';charset=utf8mb4';
    return new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function db_one(PDO $db, string $sql, array $args = []): array|false
{
    $statement = $db->prepare($sql);
    $statement->execute($args);
    return $statement->fetch();
}

function db_all(PDO $db, string $sql, array $args = []): array
{
    $statement = $db->prepare($sql);
    $statement->execute($args);
    return $statement->fetchAll();
}

function db_run(PDO $db, string $sql, array $args = []): int
{
    $statement = $db->prepare($sql);
    $statement->execute($args);
    return $statement->rowCount();
}

function input_json(): array
{
    $body = file_get_contents('php://input', false, null, 0, 65537);
    if ($body === false || strlen($body) > 65536) {
        throw new InvalidArgumentException('Invalid request body');
    }
    $value = json_decode($body, false, 512, JSON_THROW_ON_ERROR);
    if (!$value instanceof stdClass) {
        throw new InvalidArgumentException('Expected JSON object');
    }
    return json_decode($body, true, 512, JSON_THROW_ON_ERROR);
}

function text_value(mixed $value, int $max): string
{
    if (!is_string($value)) return '';
    return mb_substr(trim(preg_replace('/[\x00-\x1f\x7f]+/u', ' ', $value) ?? ''), 0, $max);
}

function http_post(string $url, array $body, bool $form = false): array
{
    $curl = curl_init($url);
    if ($curl === false) throw new RuntimeException('Could not open HTTP client');
    $payload = $form ? http_build_query($body) : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    curl_setopt_array($curl, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Content-Type: ' . ($form ? 'application/x-www-form-urlencoded' : 'application/json')]]);
    $result = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if ($result === false || $status < 200 || $status >= 300) {
        throw new RuntimeException('Upstream HTTP ' . $status);
    }
    return json_decode($result, true, 512, JSON_THROW_ON_ERROR);
}

function verify_turnstile(string $token): bool
{
    $secret = getenv('TURNSTILE_SECRET');
    if (!$secret || $token === '' || strlen($token) > 2048) return false;
    $response = http_post('https://challenges.cloudflare.com/turnstile/v0/siteverify',
        ['secret' => $secret, 'response' => $token], true);
    return ($response['success'] ?? false) === true;
}

function b64url(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function session_token(): string
{
    $secret = getenv('ADMIN_SESSION_SECRET');
    if (!$secret) throw new RuntimeException('Missing admin session secret');
    $payload = b64url(json_encode(['exp' => (int) (microtime(true) * 1000) + 43200000,
        'nonce' => bin2hex(random_bytes(16))], JSON_THROW_ON_ERROR));
    return $payload . '.' . b64url(hash_hmac('sha256', $payload, $secret, true));
}

function authenticated(): bool
{
    $secret = getenv('ADMIN_SESSION_SECRET');
    $token = $_COOKIE['madi_admin_session'] ?? '';
    if (!$secret || !is_string($token) || substr_count($token, '.') !== 1) return false;
    [$payload, $signature] = explode('.', $token, 2);
    if (!hash_equals(b64url(hash_hmac('sha256', $payload, $secret, true)), $signature)) return false;
    $decoded = base64_decode(strtr($payload, '-_', '+/'), true);
    if ($decoded === false) return false;
    $data = json_decode($decoded, true);
    return is_array($data) && is_numeric($data['exp'] ?? null) && $data['exp'] > microtime(true) * 1000;
}

function require_admin(): bool
{
    if (authenticated()) return true;
    send_json(['error' => 'Unauthorized'], 401);
    return false;
}

function admin_cookie(string $token, int $maxAge): void
{
    setcookie('madi_admin_session', $token, ['expires' => time() + $maxAge,
        'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
}

function rows(PDO $db, string $sql): array
{
    return $db->query($sql)->fetchAll();
}

function catalog_file(): array
{
    $path = dirname(__DIR__, 2) . '/assets/data/admin-full-catalog.json';
    return json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}

function live_prices(PDO $db): array
{
    $empty = ['bySku' => new stdClass(), 'regularBySku' => new stdClass(),
        'bySlug' => new stdClass(), 'fetchedAt' => null];
    $row = $db->query('SELECT payload, fetched_at FROM ru_price_snapshot WHERE id = 1')->fetch();
    if (!$row || !$row['payload']) {
        return $empty;
    }
    $snapshot = json_decode($row['payload'], true, 512, JSON_THROW_ON_ERROR);
    $saved = $snapshot['prices'] ?? [];
    $bySku = [];
    $regularBySku = [];
    $bySlug = [];
    foreach (catalog_file() as $product) {
        $variants = $product['variations'] ?: [[
            'sku' => $product['sku'] ?? '',
            'color' => 'default',
        ]];
        foreach ($variants as $variant) {
            $sku = (string) ($variant['sku'] ?? '');
            $current = $saved[$sku]['price'] ?? null;
            $regular = $saved[$sku]['regular'] ?? null;
            if ($sku === '' || !is_numeric($current) || !is_numeric($regular)) {
                continue;
            }
            $current = (float) $current;
            $regular = (float) $regular;
            if (floor($current) !== $current || floor($regular) !== $regular ||
                $current < 100 || $current > 5000000 || $regular < $current || $regular > 5000000) {
                continue;
            }
            $bySku[$sku] = (int) $current;
            $regularBySku[$sku] = (int) $regular;
            $bySlug[$product['slug']][$variant['color'] ?? 'default'] = [
                'sku' => $sku, 'rub' => (int) $current, 'regular' => (int) $regular,
            ];
        }
    }
    foreach (($snapshot['singles'] ?? []) as $slug => $single) {
        $price = $single['price'] ?? null;
        $regular = $single['regular'] ?? null;
        if (!is_numeric($price) || !is_numeric($regular)) {
            continue;
        }
        $price = (float) $price;
        $regular = (float) $regular;
        if (floor($price) !== $price || floor($regular) !== $regular ||
            $price < 100 || $price > 5000000 || $regular < $price || $regular > 5000000) {
            continue;
        }
        $sku = (string) ($single['sku'] ?? '');
        $bySlug[$slug]['default'] = ['sku' => $sku, 'rub' => (int) $price, 'regular' => (int) $regular];
        if ($sku !== '') {
            $bySku[$sku] = (int) $price;
            $regularBySku[$sku] = (int) $regular;
        }
    }
    return ['bySku' => (object) $bySku, 'regularBySku' => (object) $regularBySku,
        'bySlug' => (object) $bySlug, 'fetchedAt' => $row['fetched_at']];
}

function serve_static(string $path): void
{
    $root = realpath(dirname(__DIR__, 2));
    if ($root === false) {
        send_json(['error' => 'Static root unavailable'], 503);
        return;
    }
    $decoded = rawurldecode($path);
    if (str_contains($decoded, "\0") || str_contains($decoded, '\\')) {
        send_json(['error' => 'Not found'], 404);
        return;
    }
    $segments = array_values(array_filter(explode('/', $decoded), static fn ($value) => $value !== ''));
    if (in_array('..', $segments, true) || in_array('.', $segments, true)) {
        send_json(['error' => 'Not found'], 404);
        return;
    }
    if (!$segments) {
        $segments = ['index.html'];
    }
    $publicDirs = ['about', 'acs', 'admin-product', 'assets', 'bathsinks', 'contact',
        'dealers', 'dispenser', 'disposers', 'favorites', 'filters', 'madi-admin',
        'omoikiri-home', 'product', 'service', 'sinks', 'taps'];
    $rootFiles = ['index.html', '404.html', 'cart.html', 'favicon.ico', 'robots.txt', 'sitemap.xml'];
    if (!in_array($segments[0], $publicDirs, true) &&
        !(count($segments) === 1 && in_array($segments[0], $rootFiles, true))) {
        send_json(['error' => 'Not found'], 404);
        return;
    }
    $file = realpath($root . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $segments));
    if ($file !== false && is_dir($file)) {
        $file = realpath($file . DIRECTORY_SEPARATOR . 'index.html');
    }
    if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
        send_json(['error' => 'Not found'], 404);
        return;
    }
    $types = [
        'html' => 'text/html; charset=UTF-8', 'css' => 'text/css; charset=UTF-8',
        'js' => 'text/javascript; charset=UTF-8', 'json' => 'application/json; charset=UTF-8',
        'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'avif' => 'image/avif',
        'gif' => 'image/gif', 'ico' => 'image/x-icon', 'mp4' => 'video/mp4',
        'webm' => 'video/webm', 'woff' => 'font/woff', 'woff2' => 'font/woff2',
        'ttf' => 'font/ttf', 'eot' => 'application/vnd.ms-fontobject',
        'pdf' => 'application/pdf', 'xml' => 'application/xml', 'txt' => 'text/plain; charset=UTF-8',
    ];
    $type = $types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? null;
    if ($type === null) {
        send_json(['error' => 'Not found'], 404);
        return;
    }
    $size = filesize($file);
    if ($size === false) {
        send_json(['error' => 'Static file unavailable'], 503);
        return;
    }
    $start = 0;
    $end = $size - 1;
    $status = 200;
    $range = $_SERVER['HTTP_RANGE'] ?? null;
    if ($range !== null) {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $matches) ||
            ($matches[1] === '' && $matches[2] === '')) {
            header('Content-Range: bytes */' . $size);
            http_response_code(416);
            return;
        }
        if ($matches[1] === '') {
            $start = max(0, $size - (int) $matches[2]);
        } else {
            $start = (int) $matches[1];
        }
        if ($matches[1] !== '' && $matches[2] !== '') {
            $end = (int) $matches[2];
        }
        if ($start >= $size || $end < $start || $size === 0) {
            header('Content-Range: bytes */' . $size);
            http_response_code(416);
            return;
        }
        $end = min($end, $size - 1);
        $status = 206;
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    }
    http_response_code($status);
    header('Content-Type: ' . $type);
    header('Content-Length: ' . ($end - $start + 1));
    header('Accept-Ranges: bytes');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
        return;
    }
    $stream = fopen($file, 'rb');
    if ($stream === false) {
        return;
    }
    fseek($stream, $start);
    $remaining = $end - $start + 1;
    while ($remaining > 0 && !feof($stream)) {
        $chunk = fread($stream, min(65536, $remaining));
        if ($chunk === false || $chunk === '') {
            break;
        }
        echo $chunk;
        $remaining -= strlen($chunk);
    }
    fclose($stream);
}

function run_app(): void
{
    $path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');
    $path = $path === '' ? '/' : $path;
    $host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '', 2)[0]);
    if (!in_array($host, ['omoikiri.kz', 'www.omoikiri.kz'], true)) {
        header('X-Robots-Tag: noindex, nofollow');
    }
    if ($path === '/healthz') {
        send_json(['ok' => true, 'apiComplete' => false]);
        return;
    }
    if ($path === '/refresh') {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            header('Allow: POST'); send_json(['error' => 'Method not allowed'], 405); return;
        }
        refresh_stock(database(), false); return;
    }
    if (preg_match('#^/product/wk-1-5-s(?:/index\.html|/)?$#', $path)) {
        http_response_code(410); header('Content-Type: text/plain; charset=UTF-8');
        echo 'Product no longer available'; return;
    }
    if (!str_starts_with($path, '/api/')) {
        if (!in_array(($_SERVER['REQUEST_METHOD'] ?? 'GET'), ['GET', 'HEAD'], true)) {
            header('Allow: GET, HEAD');
            send_json(['error' => 'Method not allowed'], 405);
            return;
        }
        serve_static($path);
        return;
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $routes = [
        '/api/catalog' => ['GET'], '/api/prices' => ['GET'], '/api/stock-public' => ['GET', 'OPTIONS'],
        '/api/orders' => ['POST'], '/api/inquiries' => ['POST'], '/api/orders/payment' => ['GET'],
        '/api/admin/login' => ['POST'], '/api/admin/logout' => ['POST'],
        '/api/admin/session' => ['GET'], '/api/admin/access' => ['GET'],
        '/api/admin/orders' => ['GET'], '/api/admin/stock' => ['GET'],
        '/api/admin/products' => ['GET', 'POST'], '/api/admin/catalog-overrides' => ['GET'],
        '/api/admin/stock-refresh' => ['POST'],
    ];
    $param = null;
    if (preg_match('#^/api/admin/orders/([0-9]+)$#', $path, $match)) {
        $routes[$path] = ['PUT']; $param = (int) $match[1];
    } elseif (preg_match('#^/api/admin/products/([0-9]+)$#', $path, $match)) {
        $routes[$path] = ['PUT', 'DELETE']; $param = (int) $match[1];
    } elseif (preg_match('#^/api/admin/catalog-overrides/([a-z0-9-]+)$#', $path, $match)) {
        $routes[$path] = ['PUT']; $param = $match[1];
    }
    if (!isset($routes[$path])) {
        if (str_starts_with($path, '/api/payments/tiptop/')) {
            send_json(['error' => 'Онлайн-оплата временно недоступна.'], 503); return;
        }
        send_json(['error' => 'Not found'], 404); return;
    }
    if (!in_array($method, $routes[$path], true)) {
        header('Allow: ' . implode(', ', $routes[$path]));
        send_json(['error' => 'Method not allowed'], 405); return;
    }
    if ($path === '/api/stock-public') {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin === 'https://stock.omoikiri.kz') {
            header('Access-Control-Allow-Origin: https://stock.omoikiri.kz');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Vary: Origin');
            if ($method === 'OPTIONS') { http_response_code(204); return; }
        } elseif ($method === 'OPTIONS') { http_response_code(403); return; }
    }
    if ($path === '/api/admin/login') { admin_login(); return; }
    if ($path === '/api/admin/logout') { admin_cookie('', -3600); send_json(['ok' => true]); return; }
    if ($path === '/api/admin/session') { send_json(['authenticated' => authenticated()]); return; }
    if ($path === '/api/inquiries') { inquiry(); return; }
    $db = database();
    if ($path === '/api/orders') { create_order($db); return; }
    if ($path === '/api/orders/payment') { order_payment($db); return; }
    if ($path === '/api/admin/access') { admin_access($db); return; }
    if ($path === '/api/admin/orders') { admin_orders($db); return; }
    if (str_starts_with($path, '/api/admin/orders/')) { admin_order_update($db, (int) $param); return; }
    if ($path === '/api/admin/products' || str_starts_with($path, '/api/admin/products/')) {
        admin_products($db, $method, is_int($param) ? $param : null); return;
    }
    if ($path === '/api/admin/catalog-overrides' || str_starts_with($path, '/api/admin/catalog-overrides/')) {
        admin_overrides($db, $method, is_string($param) ? $param : null); return;
    }
    if ($path === '/api/admin/stock') { admin_stock($db); return; }
    if ($path === '/api/admin/stock-refresh') { refresh_stock($db, true); return; }
    if ($path === '/api/stock-public') { public_stock($db); return; }
    if ($path === '/api/prices') {
        send_json(live_prices($db));
        return;
    }
    $items = [];
    foreach (rows($db, 'SELECT id, slug, name, sku, category, image_url, price, old_price, description, material, colors, specifications, visible, is_custom FROM catalog_items ORDER BY updated_at DESC, id DESC') as $row) {
        $items[] = [
            'id' => (int) $row['id'], 'slug' => $row['slug'], 'name' => $row['name'],
            'sku' => $row['sku'], 'category' => $row['category'], 'imageUrl' => $row['image_url'],
            'price' => $row['price'] === null ? null : (int) $row['price'],
            'oldPrice' => $row['old_price'] === null ? null : (int) $row['old_price'],
            'description' => $row['description'], 'material' => $row['material'],
            'colors' => $row['colors'], 'specifications' => $row['specifications'],
            'visible' => (bool) $row['visible'], 'isCustom' => (bool) $row['is_custom'],
        ];
    }
    $overrides = [];
    foreach (rows($db, 'SELECT slug, visible, hidden_colors FROM catalog_visibility_overrides') as $row) {
        $hidden = json_decode($row['hidden_colors'] ?: '[]', true);
        $overrides[] = ['slug' => $row['slug'], 'visible' => (bool) $row['visible'],
            'hiddenColors' => is_array($hidden) && array_is_list($hidden) ? $hidden : []];
    }
    send_json(['items' => $items, 'overrides' => $overrides], 200, 'public, max-age=60');
}

require_once __DIR__ . '/storefront.php';
require_once __DIR__ . '/admin.php';
require_once __DIR__ . '/stock.php';
require_once __DIR__ . '/sync.php';
require_once __DIR__ . '/price-sync.php';
