import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { zipSync } from 'fflate';

const paths = [
  'functions/api/stock-public.js',
  'functions/_lib/order-catalog.js',
  'functions/_lib/live-prices.js',
  'assets/data/admin-full-catalog.json',
  'assets/js/search-index.js',
  'product/fp-07-pro/index.html',
  'product/fp-08-pro/index.html',
  'favorites/index.html',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/default/heart.svg',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/img/about/mnf.jpg',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProRegular/GothamProRegular.woff',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProBold/GothamProBold.woff',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProLight/GothamProLight.woff',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProMedium/GothamProMedium.woff',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProRegular/GothamProRegular.ttf',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProBold/GothamProBold.ttf',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProLight/GothamProLight.ttf',
  'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamProMedium/GothamProMedium.ttf',
  'assets/remote/omoikiri.ru/wp-content/plugins/prdctfltr/includes/css/fonts/prdctfltr.woff',
  'assets/remote/omoikiri.ru/wp-content/plugins/prdctfltr/includes/css/fonts/prdctfltr.ttf',
  'assets/remote/omoikiri.ru/wp-content/plugins/forminator/assets/img/flags.png',
];
const files = {};
const manifest = [];
for (const file of paths) {
  const data = await fs.readFile(file);
  files[file] = new Uint8Array(data);
  manifest.push({ path: file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
}
files['AUDIT-BUNDLE-MANIFEST.json'] = new TextEncoder().encode(JSON.stringify(manifest, null, 2));
const output = new URL('./launch-2026-10-21/staging-audit-fixes.zip', import.meta.url);
await fs.writeFile(output, zipSync(files, { level: 6 }));
console.log(`Prepared ${manifest.length} files, ${manifest.reduce((n, x) => n + x.bytes, 0)} bytes`);
