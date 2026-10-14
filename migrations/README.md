# D1 migration state

The production `omoikiri-kz-catalog` database has migrations 0001-0007 applied manually with `wrangler d1 execute --remote --file`. Wrangler's `d1_migrations` metadata was not populated for those historical changes. Do not run `wrangler d1 migrations apply --remote` against this database until its migration history has been reconciled; it will try to replay already-applied schema changes.

Before future schema changes, export a production backup, inspect the live schema, and apply only the new SQL. The 0007 columns (`orders.status`, `orders.internal_note`, `orders.updated_at`) were applied on 2026-10-09.

The 0009 payment columns were applied manually on 2026-10-12 after a D1 export. Do not replay this migration on production. TipTop payments remain gated by `TIPTOP_PAYMENTS_ENABLED`; use the separate new-site terminal and keep the old Bitrix terminal unchanged.
