# PHP cutover checklist

Status on 2026-10-25: `omoikiri.kz` and `www.omoikiri.kz` serve the PHP site
directly from `/staging.omoikiri.kz/php-poc/public`. The isolated PHP test order
13 (`PHP TEST 25.10`) is recorded in the admin with status Test, and the user
confirmed Telegram delivery. A post-cutover main-domain order and Telegram
notification are pending human CAPTCHA verification. The full RU-price refresh
and an off-server DB backup are verified. Online payment remains off.

## Current layout

- `staging.omoikiri.kz` still runs the Node/Passenger app from
  `/staging.omoikiri.kz` as the rollback path, with noindex headers.
- `php-test.omoikiri.kz` has Plesk document root
  `/staging.omoikiri.kz/php-poc/public`. The PHP app reads the same static
  media from the staging application tree; it does not duplicate the media.
- `omoikiri.kz` now has Plesk document root
  `/staging.omoikiri.kz/php-poc/public`. `/httpdocs/.htaccess` remains intact
  with `RedirectMatch 302 ^/(.*)$ https://staging.omoikiri.kz/$1` for rollback.
- `php-poc/config.local.php` is outside the document root and is 0600. It
  uses the same staging MariaDB and Telegram configuration as Node. Never
  include it in an archive or Git commit.
- Plesk tasks 1937 (stock, `*/30 * * * *`) and 1938 (RU prices, daily 05:00)
  are **enabled** with PHP 8.3. Old Node wake tasks 1936 and 1935 are
  **disabled**. PHP 8.4's scheduled-task
  handler lacked `ZipArchive`; a manual stock sync on 8.3 passed with 1594
  articles. The disabled old tasks no longer wake Node for refreshes.
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

## Cutover verification

1. Test order 13 with real Turnstile, MariaDB and Telegram passed. Test a
   product inquiry too when a human can complete its CAPTCHA.
2. PHP and Node prices/catalog/stock were compared; 436 sitemap URLs, admin,
   order management, color changes, mobile layout, stock and RU-price jobs
   passed. Confirm the newest snapshot timestamp immediately before cutover.
3. Confirm the server-side and off-server SQL copies above remain intact.
   The earlier downloaded 540 KB Plesk HTML files are **not** backup archives.
4. The main Plesk document root was changed from `httpdocs` to the PHP public
   folder with no DNS, nameserver, or payment changes. The old `.htaccess`
   remains in `/httpdocs`; Plesk remains available for rollback.
5. Both main hosts respond 200 without staging redirects and without noindex;
   staging and PHP test retain noindex. All 436 sitemap URLs passed on the
   main host. Desktop (1440 px) and mobile (390 px) browser regressions passed
   RU/KZ switching, search, About, long sinks listing, color image changes,
   favorites, and cart without horizontal overflow. Admin and media routes
   respond 200. A marked main-domain order remains to be confirmed.

## Remaining verification

Keep the Node storefront available for rollback until the PHP site has
operated successfully through a stock and price refresh cycle. Verify the
first scheduled PHP stock and price runs in Plesk and the public/admin prices.
Test a marked main-domain order with a human-completed CAPTCHA and confirm
Telegram before declaring checkout fully verified after cutover.

## Rollback

If checkout, Telegram, assets, or admin fail, restore the `omoikiri.kz` Plesk
document root to `httpdocs`. Its existing 302 redirect returns visitors to
the working Node staging immediately, without a DNS change. Confirm the 302
and a test page/order. Restore the pre-cutover database export only if the
failure involved a data mutation that cannot be corrected in place; orders
placed during the switch must be reconciled first.
