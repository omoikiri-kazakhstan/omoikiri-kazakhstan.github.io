# Stock synchronization

This separate Cloudflare Worker downloads the Moscow and St Petersburg XLSX files
at :05 and :35 UTC each hour. It validates both spreadsheets, merges quantities
by exact article number, and replaces one D1 snapshot only after both files pass.
The XLSX custom number format `0"+"` is preserved as a lower-bound flag; two
`10+` values become `20+`, not an exact 20.

The Worker does not change the storefront by itself. The stock table in the admin
reads the snapshot from the existing catalog D1
database, in a separate `stock_snapshot` table. If either source fails, the last
good snapshot stays intact. The sync error is logged in Worker logs.

Before deploying, back up the D1 database and apply only
`migrations/0008_stock_snapshot.sql` remotely (see `migrations/README.md`).
Then run `npm ci`, `npm test`, `npx wrangler deploy --dry-run`, and `npm run deploy`
from this directory. Check the first scheduled run and `stock_snapshot.fetched_at`
in D1 before exposing stock on the site. Do not replay migrations 0001-0007.

For an initial snapshot before the first cron run, generate a SQL file from both
live sources with `node scripts/create-seed-sql.mjs <output.sql>`, inspect it,
then apply it with `wrangler d1 execute omoikiri-kz-catalog --remote --file <output.sql>`.
Keep the generated SQL outside the repository; it is a one-time data import.

The import depends on the two Russian URLs. If they disappear, the site stays up,
but stock data stops updating. A future storefront integration must treat an
unknown SKU differently from zero and hide stale data after an agreed threshold.

The admin's manual refresh uses `POST /api/admin/stock-refresh`. Configure the
same random `STOCK_SYNC_TOKEN` secret on both the Worker and Pages production,
and set `STOCK_SYNC_URL` on Pages to this Worker's workers.dev origin (no trailing
slash). These values must stay out of Git and browser code. The Worker accepts
only an authenticated POST to `/refresh`; requests within two minutes of the
previous successful sync return a skipped response. A failed refresh leaves the
last good snapshot intact.
