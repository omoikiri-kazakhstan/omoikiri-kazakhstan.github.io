# Parallel PHP site

This is the PHP storefront served by `omoikiri.kz` and `php-test.omoikiri.kz`.
Both hosts share the PHP source and configuration. Keep live payments disabled
until a signed test payment and its Telegram notification pass.

## Implemented locally

- All allowlisted static pages and media, including HTTP byte ranges.
- Catalog, RU price snapshot, public stock API and stock-dashboard CORS.
- Checkout without online payment: server-side SKU/color/price validation,
  Turnstile, MariaDB order persistence, idempotent retry and Telegram notification.
- Product inquiries with Turnstile and Telegram.
- Admin login/session/magic link, orders, products, catalog overrides and stock view.
- Manual stock refresh and PHP CLI jobs for Excel stock and RU-site prices.
- TipTopPay Check/Pay/Fail webhooks verify Content-HMAC and the saved order.
  The storefront creates payment intents only when explicitly enabled.

The app uses the existing `plesk/mariadb-schema.sql` tables. Its document root
must be `php-poc/public`; PHP reads the repository assets from outside the
document root. Apache mod_rewrite must honor `.htaccess`. PHP needs PDO MySQL,
curl, OpenSSL, mbstring, ZipArchive and SimpleXML. Set `MYSQL_HOST`, `MYSQL_PORT`,
`MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `ADMIN_LOGIN`, `ADMIN_PASSWORD`,
`ADMIN_SESSION_SECRET`, `TURNSTILE_SECRET`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, and `STOCK_SYNC_TOKEN` outside Git and the web root.
For Plesk PHP-FPM, place `php-poc/config.local.php` outside `public/` and
return an associative array of those names and values. The file is ignored by
Git; never include it in deployment archives. Existing process environment
values take precedence. Both web requests and CLI sync jobs load it.
Plesk's "Run script" npm action does not inherit the site's configured Node
environment variables. Create `config.local.php` with the Plesk file editor,
keep it outside `public/`, and restrict it to owner read/write (0600). The
`prepare:php-config` script is only for a shell where the variables are already
present; it refuses to overwrite an existing config and forces payment off.

For payment testing, keep `TIPTOP_PAYMENTS_ENABLED=false`, set
`TIPTOP_TEST_PAYMENTS_ENABLED=true` and
`TIPTOP_TEST_PAYMENT_HOST=php-test.omoikiri.kz`, and configure
`TIPTOP_PUBLIC_TERMINAL_ID` plus `TIPTOP_API_SECRET` for the test terminal.
Only that host then receives payment intents. Point the terminal's Check, Pay
and Fail notifications to the matching `/api/payments/tiptop/` URLs on
`https://php-test.omoikiri.kz`. Keep the API secret outside Git and the web
root. Verify a test order, paid status, and Telegram before configuring the
live terminal and enabling `TIPTOP_PAYMENTS_ENABLED`.

Schedule `php php-poc/bin/sync-stock.php` every 30 minutes and
`php php-poc/bin/sync-ru-prices.php` daily on the test host. The public site
does not show stock quantities. The separate stock dashboard can read them.
Do not use the Excel price column for storefront prices: the RU snapshot is
converted using the existing 6.1/880 rule.

## Local tests

From the repository root, set `PHP_BINARY` to the installed PHP executable if
`php` is not on the current shell's PATH, then run:

```sh
php php-poc/tests/logic.php
php php-poc/tests/order.php
php php-poc/tests/payment.php
php php-poc/tests/sync.php
node php-poc/tests/http.mjs
node php-poc/tests/release.mjs
```

The HTTP test starts its own loopback PHP server and isolated SQLite fixture.
The release test does the same, then runs the desktop/mobile storefront,
admin-login and sitemap browser checks against that local server.
For a visual check with that fixture, run `php php-poc/tests/fixture.php` with a
temporary database path, set `APP_ENV=test` and `TEST_DB_DSN=sqlite:<path>`, then:

```sh
php -S 127.0.0.1:8797 -t php-poc/public php-poc/public/index.php
node tests/staging-release.browser.mjs http://127.0.0.1:8797
node php-poc/tests/admin.browser.mjs http://127.0.0.1:8797
node php-poc/tests/sitemap.mjs http://127.0.0.1:8797
```

`APP_ENV=test` enables only the local SQLite fixture connection. Never use it
on a public host. The local fixture does not call live Turnstile or Telegram.

## Before any public switch

1. Deploy to a separate PHP test host without changing the current staging or
   main domain. Confirm Plesk's PHP version/extensions and sufficient disk space.
2. Compare the PHP and Node APIs against the same read-only copy of MariaDB.
   Verify all 419 product pages, live photos, RU/KZ, admin and mobile layouts.
3. Run real stock and RU price refreshes; confirm snapshot counts/timestamps and
   that a source outage leaves the previous good snapshot intact.
4. Place a marked test order with real Turnstile verification and confirm the
   MariaDB row and Telegram notification. Test a product inquiry too.
5. Save a release/database backup and test a rollback before domain cutover.
   Then recheck no staging redirect/noindex, pages, cart, order, admin and prices.

The local tests below passed, but steps 1-5 are not completed. `/healthz`
therefore deliberately reports `apiComplete:false`. This is not a production
readiness signal.
