# Stock dashboard

`https://stock.omoikiri.kz/` is a static, separate stock dashboard. Its document root in Plesk is `/stock.omoikiri.kz`; deploy `index.html`, `robots.txt`, and `assets/` there. Do not deploy this README or secrets to the public document root.

At the owner's explicit request, this dashboard is public without login. Anyone with its URL can see article quantities and catalog retail prices. The endpoint `https://staging.omoikiri.kz/api/stock-public` returns stock names, quantities, source timestamps, and KZT retail prices for matching catalog SKUs; it never publishes the stock Excel price column or other admin data. Browser CORS allows the exact stock origin, but CORS is not an access control against direct HTTP requests. If the staging API hostname changes, update both `assets/stock.js` and the allowlist in `plesk/server.js` together.

Stock quantities remain absent from the public storefront and refer to the Moscow and St Petersburg source files, not confirmed availability in Kazakhstan. The Node process checks the snapshot every five minutes and fetches Excel when the saved snapshot is at least 30 minutes old. Plesk task 1936 fetches `/healthz` at `*/30 * * * *` to wake an idle app. The page rereads the public snapshot every minute while open. A failed source fetch preserves the last good snapshot and the dashboard marks data older than 45 minutes.

After deployment, verify HTTPS, public table/search/filters/infinite scroll, and the Plesk task's next successful run. Do not turn on payments or public stock indicators in the product catalog as part of this deployment.
