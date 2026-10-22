import catalog from '../assets/data/admin-full-catalog.json' with { type: 'json' };
import { collectRuPrices } from '../plesk/ru-price-sync.js';
import { kztPrice } from '../functions/_lib/live-prices.js';
import fs from 'node:fs/promises';

const live = await (await fetch('https://staging.omoikiri.kz/api/prices')).json();
const ru = await collectRuPrices(fetch, catalog);
const differences = [];
for (const [sku, source] of Object.entries(ru.prices)) {
  const staging = live.bySku?.[sku];
  if (staging !== source.price || (live.regularBySku?.[sku] ?? null) !== source.regular) {
    differences.push({ sku, source, staging, stagingRegular: live.regularBySku?.[sku], expectedKzt: kztPrice(source.price) });
  }
}
const missingInRu = Object.keys(live.bySku || {}).filter(sku => !ru.prices[sku]);
const report = { checkedAt: new Date().toISOString(), stagingFetchedAt: live.fetchedAt,
  sourceCoverage: ru.coverage, expectedCount: ru.expectedCount, sourcePriceCount: Object.keys(ru.prices).length,
  stagingPriceCount: Object.keys(live.bySku || {}).length, differences, missingInRu,
  sourceErrors: ru.errors };
await fs.writeFile(new URL('./launch-2026-10-21/price-compare.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, differences: differences.slice(0, 30), missingInRu: missingInRu.slice(0, 30), sourceErrors: ru.errors.slice(0, 20) }, null, 2));
