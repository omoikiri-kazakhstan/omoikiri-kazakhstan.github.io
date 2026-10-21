# OMOIKIRI KZ production routing, 21 October 2026

## Current state (12:05 Asia/Qyzylorda)

- `https://omoikiri.kz/` temporarily returns HTTP 302 to `https://staging.omoikiri.kz/`. Main, product (including color query), and admin paths return HTTP 200 after the redirect. The visitor's address bar changes to staging; this is **not** a completed main-domain launch.
- The redirect is the first line of `/httpdocs/.htaccess`: `RedirectMatch 302 ^/(.*)$ https://staging.omoikiri.kz/$1`. The original 808-byte file is copied to `/httpdocs/.htaccess.rollback-20261021`; the full Plesk backup below is a second recovery point.
- Main-domain Node.js is **disabled**, document root is `/httpdocs`, and the old Bitrix database/files were not changed. A separate `/production-proxy` folder exists but is not serving traffic.
- A direct Node.js launch through the main Plesk domain returned HTTP 500 (Apache logged `End of script output before headers`) and then nginx 403/404. After disabling Node and restoring `/httpdocs`, static Bitrix assets loaded but PHP pages timed out. Reapplying the original hosting, Apache/nginx, and PHP settings did not restore dynamic Bitrix responses. The temporary 302 is therefore also a recovery route for visitors.
- Staging remains HTTP 200 with local media and the working Plesk backend. It sends `X-Robots-Tag: noindex, nofollow`, so this redirect is only a short-term availability measure. Do not declare the main-domain cutover complete until the site serves the main hostname, indexing is configured, and a real-domain test order/Telegram notification passes.

### Reverting the temporary redirect

Restore `/httpdocs/.htaccess` from `/httpdocs/.htaccess.rollback-20261021` in Plesk File Manager (or remove only the first `RedirectMatch` line and its blank line). Keep Node.js disabled and document root `/httpdocs`. Confirm Bitrix PHP pages return HTTP 200 before removing the redirect; if they still time out, leave the 302 in place while escalating the PHP issue to Hoster.

## Scope

- Main domain: `omoikiri.kz` on Plesk. DNS and nameservers stay unchanged.
- The existing Bitrix files in `/httpdocs` and its database remain untouched.
- A separate Node.js application in `/production-proxy` was prepared as a same-server bridge but failed its main-domain smoke test and is currently disabled. It is not a Cloudflare Pages dependency.
- Online payment remains disabled. Orders are placed without payment on the site.
- The staging catalog database is shared by both hostnames. Mark test orders clearly and do not reset it during production use.

## Backup and rollback

- Plesk full domain backup: 21/10/2026 11:31, 12.7 GB, comment `Pre-launch Bitrix backup 2026-10-21; full settings, files and databases`. The restore screen lists settings/content, domain files, and both databases, including the Bitrix database `p-345209_omoibd`.
- Original production document root: `/httpdocs`. Original site: Bitrix with PHP 8.3. Node.js was disabled on the main domain.
- To revert traffic: disable Node.js for `omoikiri.kz` in Plesk and restore the document root to `/httpdocs`. Verify the old homepage and a product page. Do not change DNS or delete `/production-proxy` or `/staging.omoikiri.kz` during rollback.
- If Bitrix files or database were modified unexpectedly, restore only the required objects from the full Plesk backup. Do not restore the staging database over active orders.

## Launch checks

1. Check `https://omoikiri.kz/healthz`, homepage, categories, product color photos, `/api/catalog`, `/api/prices`, cart and admin page.
2. Check RU -> KZ -> RU and mobile layout. KZ editorial review, especially `/about/`, remains unfinished.
3. Place one clearly marked live-domain test order and verify it appears in admin and reaches Telegram. Mark the order as test.
4. Check `www.omoikiri.kz` and HTTPS. Watch errors and restore `/httpdocs` immediately if ordering fails.

Do not describe the site as fully launched until the live-domain order and Telegram checks pass.
