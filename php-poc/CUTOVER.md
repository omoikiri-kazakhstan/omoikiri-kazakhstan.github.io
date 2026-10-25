# PHP cutover checklist

Status on 2026-10-25: **do not switch `omoikiri.kz` yet**. The isolated PHP
site is live at `https://php-test.omoikiri.kz/`, but a real PHP checkout and
Telegram delivery have not been verified. Online payment remains off.

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
  are prepared with PHP 8.4 but **disabled**. Existing tasks still wake Node;
  Node performs the current refreshes in-process.

## Go/no-go before changing the main domain

1. Record a marked test order at the PHP test host with real Turnstile and
   confirm its MariaDB row and Telegram message. Test a product inquiry too.
2. Compare PHP and Node prices/catalog/stock once more and check the admin
   login, order management, color changes, mobile layout, and media responses.
   Run PHP stock and RU-price jobs once on the test host and confirm that a
   source failure leaves the last good snapshot intact.
3. Verify Plesk backup and a database export made immediately before cutover.
   The downloaded 540 KB Plesk HTML files are **not** valid backup archives.
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
