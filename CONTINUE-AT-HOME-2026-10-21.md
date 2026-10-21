# OMOIKIRI KZ: continuation at home, 21 October 2026

## Repository and state

- Fork: `https://github.com/x9230x/omoikiri-kazakhstan.github.io`.
- Working branch: `plesk-staging-2026-10-20`. Start from its latest commit, then inspect `git status` and this file.
- Current reference for the storefront is `https://omoikiri.ru/`, with KZ-specific contacts, prices, stock dashboard, and ordering.
- `https://omoikiri.kz/` still redirects (302) to `https://staging.omoikiri.kz/`. Staging sends `noindex`; this is not a completed production-domain launch.
- Online payment is intentionally disabled. The owner reports 11 successful order/Telegram checks. A new order must be tested after the final hostname cutover.
- The old Bitrix site is not a launch requirement. Preserve its backup, but plan and verify rollback to the last working release of the new site.

## Local changes prepared for staging

- About-page RU/KZ/RU translation and manufacturing-country switching were repaired. `assets/js/about-kz.js` covers all Russian text nodes currently in the About main content and dynamic country paragraphs. This is a machine-assisted draft and still needs a Kazakh editorial review.
- The legacy WordPress `check.php` request was removed from 408 product pages. Other obsolete WordPress/form requests, including `ajax-noop.json`, need a functional review rather than blind removal.
- Earlier working-tree changes cover discontinued variants, correct FP-07/FP-08 articles/prices, Kinaru photos, local fonts, catalog pagination/filters, public stock dashboard, and price/stock polling. Review the diff before another deployment.
- Staging release packages are local generated artifacts, not committed: `test-results/launch-2026-10-21/staging-followup-20261021.zip` and `test-results/launch-2026-10-21/staging-legacy-post-cleanup-20261021.zip`. They were **not** successfully uploaded after the Plesk session expired. Rebuild if source changes before deployment.
- Latest local checks: `node --test tests/*.test.mjs` (42 passed), `node scripts/test-orders.mjs` (6 passed), `node scripts/test-admin-orders.mjs` (3 passed). A browser About RU/KZ/RU test also passed. Local tests are not proof of a live deploy.

## Next steps

1. Log into Plesk personally; do not share the password. Check the current staging files before upload, then deploy the prepared changes to staging only. Do not change the main hostname yet.
2. Verify About RU/KZ/RU and country selector, product images/color variants, the long category scroll, search/favorites, stock dashboard, mobile layouts, and prices against the current RU site. Review the Kazakh About copy with a fluent speaker.
3. Check the product-page form's obsolete WordPress request and mobile-homepage performance. Verify missing asset requests and browser console/network errors after deployment.
4. Solve the main-domain Node/Passenger routing with Hoster support ticket #2709962. A prior `/production-proxy/public` attempt yielded 403/404 and was reverted. Do not repeat the toggle on live traffic without a tested configuration and immediate rollback.
5. Before cutover, preserve the working new-site release and settings; after cutover, verify `omoikiri.kz` serves without staging redirect or `noindex`, then place one marked test order and confirm admin and Telegram.

## Boundaries

- Do not switch production, DNS, or online payments just to finish a checklist.
- Keep stock quantities off the public storefront. The separate `stock.omoikiri.kz` dashboard is public by the owner's explicit choice and displays KZT retail prices using the catalog rule, not Excel price fields.
- Do not present machine-translated Kazakh text as editorially approved.
