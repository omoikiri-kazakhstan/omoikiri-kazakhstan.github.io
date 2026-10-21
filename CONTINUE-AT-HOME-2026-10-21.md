# OMOIKIRI KZ: continuation at home, 21 October 2026

## Repository and state

- Fork: `https://github.com/x9230x/omoikiri-kazakhstan.github.io`.
- Working branch: `plesk-staging-2026-10-20`. Start from its latest commit, then inspect `git status` and this file.
- Current reference for the storefront is `https://omoikiri.ru/`, with KZ-specific contacts, prices, stock dashboard, and ordering.
- `https://omoikiri.kz/` still redirects (302) to `https://staging.omoikiri.kz/`. Staging sends `noindex`; this is not a completed production-domain launch.
- Online payment is intentionally disabled. The owner confirmed another successful staging order and Telegram notification on 21 October. A new order must still be tested after the final hostname cutover.
- The old Bitrix site is not a launch requirement. Preserve its backup, but plan and verify rollback to the last working release of the new site.

## Staging deployment and verification, 21 October

- Built both packages from commit `683c2d5` after `npm ci`: `test-results/launch-2026-10-21/staging-followup-20261021.zip` and `staging-legacy-post-cleanup-20261021.zip`. Uploaded and extracted both into the Plesk root `/staging.omoikiri.kz` with existing files replaced; restarted the Node.js application. Only staging was changed.
- Public byte comparison matched 29 of 32 follow-up package paths; the remaining three are private server modules and correctly return 404 on the public web. It matched 418 of 419 legacy product pages; `/product/wk-1-5-s/` intentionally returns 410 as a discontinued product.
- Live `/healthz`, `/api/catalog`, `/api/prices`, About, and favorites responded 200 after deployment. The prices endpoint contained 1,462 SKUs. The Akashi-S WH cart displayed 173,880 ₸; the owner submitted a staging test order and confirmed that the Telegram message arrived.
- Browser checks passed: About RU/KZ/RU and dynamic country text; Kinaru color photos; Akashi-S black-to-white photo change; long sinks catalog scroll to the bottom (232 product links); RU/KZ/RU across category and product; mobile product, category, and About without horizontal overflow. No browser console error was observed in the checked About view.
- Follow-up check on 21 October confirmed staging order №12 in the cart and the owner's Telegram receipt. Home RU/KZ/RU, About RU/KZ/RU, EC-01 KZ description, Akashi-S color/photo change, mobile catalog scroll to the bottom, and matching RU/KZ fonts passed. Search was found broken: suggestions did not appear and Enter reopened the homepage with a query string. It now loads a same-origin JSON index; searching Akashi displays Akashi-S and opens its product page. A test favorite was added, shown with its 173,880 ₸ price, then removed. Only staging received this search fix.
- The Kazakh About copy is still a draft requiring a fluent editor. These checks cover representative flows, not every product and viewport.

## Changes included in the deployed packages

- About-page RU/KZ/RU translation and manufacturing-country switching were repaired. `assets/js/about-kz.js` covers all Russian text nodes currently in the About main content and dynamic country paragraphs. This is a machine-assisted draft and still needs a Kazakh editorial review.
- The legacy WordPress `check.php` request was removed from 408 product pages. Other obsolete WordPress/form requests, including `ajax-noop.json`, need a functional review rather than blind removal.
- The committed changes cover discontinued variants, correct FP-07/FP-08 articles/prices, Kinaru photos, local fonts, catalog pagination/filters, public stock dashboard, and price/stock polling. Review new diffs before another deployment.
- Staging release packages are generated artifacts, not committed. In a fresh clone, run `npm ci` and `node scripts/build-staging-followup.mjs --legacy` to recreate both from tracked files. Rebuild if source changes before another deployment.
- Current local checks: 40 targeted server tests, 6 order tests, and 3 admin-order tests passed. The full wildcard test command was affected by assets omitted from the local sparse checkout; this did not affect the uploaded packages or live checks.

## Next steps

1. Review the Kazakh About copy with a fluent editor; spot-check remaining product translations, public stock dashboard, and more mobile viewports against the current RU storefront.
2. Check remaining obsolete WordPress requests including `ajax-noop.json` by function; investigate mobile-homepage performance and browser network errors.
3. Solve the main-domain Node/Passenger routing with Hoster support ticket #2709962. A prior `/production-proxy/public` attempt yielded 403/404 and was reverted. Do not repeat the toggle on live traffic without a tested configuration and immediate rollback.
4. Before cutover, preserve the working new-site release and settings; after cutover, verify `omoikiri.kz` serves without staging redirect or `noindex`, then place one marked test order and confirm admin and Telegram.

## Boundaries

- Do not switch production, DNS, or online payments just to finish a checklist.
- Keep stock quantities off the public storefront. The separate `stock.omoikiri.kz` dashboard is public by the owner's explicit choice and displays KZT retail prices using the catalog rule, not Excel price fields.
- Do not present machine-translated Kazakh text as editorially approved.
