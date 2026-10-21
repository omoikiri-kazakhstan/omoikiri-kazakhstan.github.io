# OMOIKIRI KZ production routing, 21 October 2026

## Owner decision after the audit

The current `omoikiri.ru` site is the reference for the storefront, with KZ-specific functions retained. Restoring the old Bitrix site is no longer a launch requirement. Payment stays disabled by design. The owner reports 11 successful order-to-Telegram checks; after changing the main hostname, run one new end-to-end order check on that hostname. A verified rollback must return traffic to the last working release of the new site; the staging redirect is only a temporary emergency fallback because staging has `noindex` and changes the visitor's hostname. The historical Bitrix recovery notes below are retained for reference, not as launch gates.

## Update, 21 October 2026

- Hoster ticket #2709962 suggested keeping the domain document root inside the Node application root. Tested `/production-proxy/public` as the domain root with `/production-proxy` as the Node application root and `app.js` as startup file. Plesk's path warning disappeared and it reported Node.js enabled, but `/healthz` returned 404 and `/` returned 403. Apache logged `AH01276: Cannot serve directory /var/www/vhosts/omoikiri.kz/production-proxy/public/: No matching DirectoryIndex`, indicating requests were handled as static files rather than reaching Passenger. Immediately restored `/httpdocs` and disabled main-domain Node.js; the 302 to staging and staging `/healthz` (200) were verified. This remains a server-routing blocker. The Hoster cabinet reply form returned 403, so the technical follow-up was sent to `support@hoster.kz` from the connected Gmail account with ticket number #2709962 in the subject (verified in Sent). The Russian report is `HOSTER-SUPPORT-2026-10-21.md`.
- Staging audit fixes were installed and verified: favorites 200, missing local fonts/media 200, FP-07/FP-08 SKUs corrected, discontinued stock prices hidden. After owner confirmation, six variants absent from the RU storefront were removed from KZ ordering/search; WK-1.5-S now returns 410. The main-domain 302 and staging `noindex` remain unchanged. KZ About translation and stable main-domain routing are still launch work.
- Hoster shows the hosting account paid and active until 21 October 2027. Plesk reports 22,454 MB used of 25 GB (about 3 GB free). Payment is no longer the launch blocker.
- The main hostname still returns HTTP 302 to staging; it has not been switched to the new app. Hoster ticket #2709962 about the main-domain Node.js setting remains open without a technical answer. A follow-up was sent after payment. Do not retry the known-unstable toggle during traffic without a tested configuration and immediate rollback.
- The separate `stock.omoikiri.kz` dashboard is online with its own Let's Encrypt certificate. At the owner's request it is public without login and reads `/api/stock-public` on staging, including KZT catalog retail prices but never the stock Excel price column. Plesk task #1936 wakes staging every 30 minutes. It does not change the production routing.

## Current state (21 October 2026, 12:23 Asia/Qyzylorda)

- `https://omoikiri.kz/` temporarily returns HTTP 302 to `https://staging.omoikiri.kz/`. Main, product (including color query), and admin paths return HTTP 200 after the redirect. The visitor's address bar changes to staging; this is **not** a completed main-domain launch.
- The redirect is the first line of `/httpdocs/.htaccess`: `RedirectMatch 302 ^/(.*)$ https://staging.omoikiri.kz/$1`. The original 808-byte file is copied to `/httpdocs/.htaccess.rollback-20261021`; the full Plesk backup below is a second recovery point.
- Main-domain Node.js is **disabled**, document root is `/httpdocs`, and the old Bitrix database/files were not changed. A separate `/production-proxy` folder exists but is not serving traffic.
- The first direct Node.js launch through the main Plesk domain returned HTTP 500 (Apache logged `End of script output before headers`): Passenger did not enter the conditional startup code. This was fixed by splitting `app.js` (unconditional entrypoint) and `server.js`. A later trial briefly served `/healthz`, pages, and assets with HTTP 200, but browser loading exposed intermittent upstream failures. A bounded keep-alive agent fixed those errors in a local browser test (two complete Akita loads with no console errors).
- After deploying that fix, Plesk's main-domain Node setting did not remain enabled: the domain fell back to nginx 403/404 while the UI reported Node disabled. Node was left disabled and `/httpdocs` restored. Do not retry a main-domain toggle during traffic until Hoster confirms why its Node configuration reverts or an alternate reverse-proxy configuration is prepared and tested separately.
- With the original Bitrix configuration restored, static Bitrix assets loaded but PHP pages timed out. Reapplying the original hosting, Apache/nginx, and PHP settings did not restore dynamic Bitrix responses. The temporary 302 is therefore also a recovery route for visitors.
- Staging remains HTTP 200 with local media and the working Plesk backend. It sends `X-Robots-Tag: noindex, nofollow`, so this redirect is only a short-term availability measure. Do not declare the main-domain cutover complete until the site serves the main hostname, indexing is configured, and a real-domain test order/Telegram notification passes.

### Historical Bitrix recovery procedure (not a launch gate)

Restore `/httpdocs/.htaccess` from `/httpdocs/.htaccess.rollback-20261021` in Plesk File Manager (or remove only the first `RedirectMatch` line and its blank line). Keep Node.js disabled and document root `/httpdocs`. Confirm Bitrix PHP pages return HTTP 200 before removing the redirect; if they still time out, leave the 302 in place while escalating the PHP issue to Hoster.

## Scope

- Main domain: `omoikiri.kz` on Plesk. DNS and nameservers stay unchanged.
- The existing Bitrix database and application files remain untouched. Only `/httpdocs/.htaccess` has the temporary first-line redirect, with a separate original copy and the full backup above.
- A separate Node.js application in `/production-proxy` was prepared as a same-server bridge but failed its main-domain smoke test and is currently disabled. It is not a Cloudflare Pages dependency.
- Online payment remains disabled. Orders are placed without payment on the site.
- The staging catalog database is shared by both hostnames. Mark test orders clearly and do not reset it during production use.

## Backup and rollback

- Plesk full domain backup: 21/10/2026 11:31, 12.7 GB, comment `Pre-launch Bitrix backup 2026-10-21; full settings, files and databases`. The restore screen lists settings/content, domain files, and both databases, including the Bitrix database `p-345209_omoibd`.
- Original production document root: `/httpdocs`. Original site: Bitrix with PHP 8.3. Node.js was disabled on the main domain.
- Before cutover, preserve the current working new-site release, its configuration, and the exact Plesk routing settings. Test a way to route the main hostname back to that release without changing DNS or overwriting the staging database. If main-domain routing fails, a 302 to staging can keep orders reachable temporarily, but it is not a completed rollback for SEO or branding.
- The previous Bitrix route (disable Node.js and restore `/httpdocs`) is historical only; its PHP pages timed out during the last attempt and it must not be presented as a tested working fallback. Do not change DNS or delete `/production-proxy` or `/staging.omoikiri.kz` during rollback.
- If Bitrix files or database were modified unexpectedly, restore only the required objects from the full Plesk backup. Do not restore the staging database over active orders.

## Launch checks

1. Check `https://omoikiri.kz/healthz`, homepage, categories, product color photos, `/api/catalog`, `/api/prices`, cart and admin page.
2. Check RU -> KZ -> RU and mobile layout. KZ editorial review, especially `/about/`, remains unfinished.
3. Place one clearly marked live-domain test order and verify it appears in admin and reaches Telegram. Mark the order as test.
4. Check `www.omoikiri.kz`, HTTPS, and indexing headers. Watch errors and use the verified new-site rollback if ordering fails; a temporary staging redirect is the emergency fallback.

Do not describe the site as fully launched until the live-domain order and Telegram checks pass.
