# Plesk staging deployment

Deploy this branch only to the separate `staging.omoikiri.kz` site. Keep the
existing Bitrix `/httpdocs` and its database untouched until staging is tested
and a fresh production backup exists.

1. Deploy the repository to `/staging.omoikiri.kz`. Set Node.js application
   root to that directory, document root to `/staging.omoikiri.kz/public`, and
   startup file to `app.js`.
2. Run `npm ci --omit=dev` in the application root through Plesk Node.js.
3. Create a separate MariaDB database and apply `mariadb-schema.sql` once.
   Import a data-only D1 export into that database. Never put the export in Git
   or under the document root.
4. Set `MYSQL_HOST=localhost`, `MYSQL_PORT=3306`, `MYSQL_USER`,
   `MYSQL_PASSWORD`, and `MYSQL_DATABASE` in the Plesk Node.js environment.
5. Set the existing application secrets: `ADMIN_LOGIN`, `ADMIN_PASSWORD`,
   `ADMIN_SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and
   `TURNSTILE_SECRET`. Set `STOCK_SYNC_TOKEN` and
   `STOCK_SYNC_URL=https://staging.omoikiri.kz/refresh` for manual refresh.
   Keep `TIPTOP_PAYMENTS_ENABLED=false` until live payments are approved and
   verified; payment credentials remain separate.
6. Enable Node.js. Check `/healthz`, `/api/catalog`, `/api/prices`, admin login,
   a test order with Turnstile and Telegram, and static product assets.
7. Schedule `node plesk/sync-stock.js` daily in Plesk, using the same database
   environment. Confirm that the snapshot timestamp advances without losing
   the previous snapshot on a source error.

The Node server exposes only the existing public pages and assets plus the
application API. Files in `plesk/`, `functions/`, and `migrations/` are not
served over HTTP.
