# OMOIKIRI KZ production launch, 21 October 2026

## Scope

- Main domain: `omoikiri.kz` on Plesk. DNS and nameservers stay unchanged.
- The existing Bitrix files in `/httpdocs` and its database remain untouched.
- A separate Node.js application in `/production-proxy` forwards the main domain to the working Plesk-hosted `staging.omoikiri.kz` backend. This is a temporary same-server launch bridge, not a Cloudflare Pages dependency.
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
