# PHP cutover checklist

Status on 2026-10-25: the isolated PHP site is live at
`https://php-test.omoikiri.kz/`. Test order 13 (`PHP TEST 25.10`) is recorded
in the PHP admin with status Test, and the user confirmed Telegram delivery.
The full RU-price refresh and an off-server DB backup are verified. The main
domain has **not** been switched yet. Online payment remains off.

## Current layout

- `staging.omoikiri.kz` runs the existing Node/Passenger app from
  `/staging.omoikiri.kz` and remains the active order path.
- `php-test.omoikiri.kz` has Plesk document root
  `/staging.omoikiri.kz/php-poc/public`. The PHP app reads the same static
  media from the staging application tree; it does not duplicate the media.
- `omoikiri.kz` has Plesk document root `/httpdocs`. Its `.htaccess` begins
  with `RedirectMatch 302 ^/(.*)$ https://staging.omoikiri.kz/$1`.
- `php-poc/config.local.php` is outside the document root and is 0600. It
  uses the same staging MariaDB and Telegram configuration as Node. Never
  include it in an archive or Git commit.
- Plesk tasks 1937 (stock, `*/30 * * * *`) and 1938 (RU prices, daily 05:00)
  are prepared with PHP 8.3 but **disabled**. PHP 8.4's scheduled-task
  handler lacked `ZipArchive`; a manual stock sync on 8.3 passed with 1594
  articles. Existing tasks still wake Node, which performs the current
  refreshes in-process.
- Task 1939 is a disabled, manually run database backup. Its latest SQL file
  is `/staging.omoikiri.kz/php-poc/backups/staging-db-20261025-080937.sql`
  (6 tables, 18 rows, 409754 bytes, SHA-256
  `2098b7deae1836b4e4b16463354efaf131eb70f4b8475f7e0c3d1468fcf137f1`).
  The directory is 0700 and the file is 0600, outside the document root.
  A byte-for-byte verified off-server copy is at
  `C:\Users\madir\Documents\OMOIKIRI-backups\staging-db-20261025-080937.sql`.
- Task 1940 is a disabled RU connectivity probe. Its four sample pages
  returned 2, 2, 2 and 4 parsed prices on PHP 8.3.
- The PHP RU-price job completed in 325 seconds with 1464 prices, 1485
  expected SKUs, 97.24% observed coverage and one RU page error. Existing
  prices were retained for a failed fetch; PHP and Node APIs agree for all
  1464 returned prices. PHP and Node storefront domains both inherit PHP
  8.2 from the Plesk account; CLI jobs use PHP 8.3.

## Go/no-go before changing the main domain

1. Test order 13 with real Turnstile, MariaDB and Telegram passed. Test a
   product inquiry too when a human can complete its CAPTCHA.
2. PHP and Node prices/catalog/stock were compared; 436 sitemap URLs, admin,
   order management, color changes, mobile layout, stock and RU-price jobs
   passed. Confirm the newest snapshot timestamp immediately before cutover.
3. Confirm the server-side and off-server SQL copies above remain intact.
   The earlier downloaded 540 KB Plesk HTML files are **not** backup archives.
4. Preserve a screenshot or written copy of main-domain hosting settings and
   `/httpdocs/.htaccess`; make sure Plesk remains reachable for rollback.
5. Arrange a quiet order window. Avoid running both Node and PHP stock/price
   refresh jobs concurrently against the same database.

## Switch and verify

In Plesk, change **only** the `omoikiri.kz` document root from `httpdocs` to
`staging.omoikiri.kz/php-poc/public`. Do not change nameservers or delete
Bitrix. The existing redirect in `/httpdocs/.htaccess` then no longer applies.
Immediately check `https://omoikiri.kz/` and `www`, canonical/robots, 419
product pages, assets, RU/KZ, mobile/cart, a marked order, Telegram, admin,
and prices. Only the main host should be indexable; staging and PHP test must
retain `X-Robots-Tag: noindex, nofollow`.
Enable PHP tasks 1937/1938 only after their manual run succeeds, then disable
the two existing Plesk tasks that wake staging and stop Node's in-process
pollers. Keep the Node storefront available for rollback until the PHP site
has operated successfully through a stock and price refresh cycle.

## Rollback

If checkout, Telegram, assets, or admin fail, restore the `omoikiri.kz` Plesk
document root to `httpdocs`. Its existing 302 redirect returns visitors to
the working Node staging immediately, without a DNS change. Confirm the 302
and a test page/order. Restore the pre-cutover database export only if the
failure involved a data mutation that cannot be corrected in place; orders
placed during the switch must be reconciled first.
