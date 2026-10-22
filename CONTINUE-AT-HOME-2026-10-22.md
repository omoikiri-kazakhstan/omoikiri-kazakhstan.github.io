# OMOIKIRI KZ: continue at home, 22 October 2026

## Start here

Clone or update `https://github.com/x9230x/omoikiri-kazakhstan.github.io`, switch to `plesk-staging-2026-10-20`, and read this file plus `CONTINUE-AT-HOME-2026-10-21.md`. Run `git status` before changing anything. The local PHP proof of concept is in `php-poc/README.md`; it is not deployed and must not replace the working Node staging site without its own live acceptance tests.

## Current state

- `staging.omoikiri.kz` is the working storefront. The main `omoikiri.kz` still redirects to staging; the production hostname has not been switched. Online payment remains disabled.
- The homepage ELLECI video now links directly to `https://www.youtube.com/watch?v=2bGCmZlv4RQ`; the VK modal was removed. The Kazakh OMOIKIRI Home heading layout and the Kazakh About heading font were adjusted. The Kinaru Pro 86-U/I schematic uses the newer local `kinaru-pro.jpg` asset.
- The FP-07-Pro and FP-08-Pro technical scheme links were exchanged because the existing image filenames represent the opposite physical accessories. Both HTML pages were deployed to staging on 22 October. Live pages and both JPEGs returned HTTP 200, with the expected swapped links. `node --test tests/fp-pro-pages.test.mjs` passes.
- `php-poc/` is an isolated PHP 8.4 port for local testing. Its logic, order, sync and HTTP tests passed locally on 22 October. It has not been tested against live MariaDB, Turnstile or Telegram. Its `/healthz` deliberately reports `apiComplete:false`.
- The full Plesk Bitrix backup has **not** been saved on this PC. Three files named `backup_omoikiri.kz_2610211131*.tar` in Downloads are each 540,932-byte HTML Plesk pages, not TAR archives. An earlier download appeared to transfer gigabytes but was ultimately replaced by this HTML response. Do not delete the backup on Plesk. Use a verified SFTP/direct-transfer method, then validate archive integrity and contents before freeing server disk.
- No production DNS, Bitrix files, payment settings or main-domain routing were changed in this work.

## Next actions

1. Verify the current staging homepage and the two FP scheme buttons in a fresh desktop/mobile browser. Recheck RU/KZ/RU and visual alignment; editorial review of Kazakh copy is still needed.
2. Obtain and verify a real off-server Bitrix backup. The Plesk browser download button currently saves an HTML page as `.tar`. Preserve the current working new-site release and its configuration as the more relevant rollback target.
3. Test the PHP port on a separate host only if choosing PHP as the production route. Follow all live checks in `php-poc/README.md`; local tests alone do not prove order delivery.
4. Resolve main-domain routing with Hoster ticket #2709962. Before switching, document a tested rollback to the working new site. After switching, confirm no staging redirect or `noindex`, then check pages, cart, a marked test order, Telegram, admin, prices and stock dashboard.
5. Keep TipTopPay disabled until a separate payment setup and test is explicitly approved.

## Local-only artifacts

Generated deployment ZIPs, screenshots and browser audit outputs in `test-results/` and the root `sinks-color-filter-20261021.zip` are local artifacts, not required to build from Git. Rebuild any staging package from tracked source before deploying it. The invalid 540 KB `.tar` downloads are also local-only and are not backups.
