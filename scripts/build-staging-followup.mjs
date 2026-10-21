import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { zipSync } from 'fflate';

const paths = [
  'functions/api/stock-public.js',
  'functions/_lib/order-catalog.js',
  'functions/_lib/live-prices.js',
  'assets/data/admin-full-catalog.json',
  'assets/js/search-index.js',
  'assets/js/search-index.json',
  'assets/js/about-ru.js',
  'assets/js/about-kz.js',
  'assets/js/lang-switch.js',
  'assets/css/info-pages.css',
  'product/fp-07-pro/index.html',
  'product/fp-08-pro/index.html',
  'product/kinaru-pro-86-u-i/index.html',
  'favorites/index.html',
  'about/index.html',
  'contact/index.html',
  'dealers/index.html',
  'service/index.html',
  'assets/img/default/search.svg',
  'assets/remote/omoikiri.ru/wp-content/plugins/woo-variation-gallery/images/slick/ajax-loader.gif',
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
const searchScript = await fs.readFile(new URL('../assets/js/search-index.js', import.meta.url), 'utf8');
const searchJson = await fs.readFile(new URL('../assets/js/search-index.json', import.meta.url), 'utf8');
const searchItems = JSON.parse(searchScript.replace(/^window\.OMOIKIRI_SEARCH_INDEX\s*=\s*/, '').replace(/;\s*$/, ''));
if (JSON.stringify(searchItems) !== searchJson.trim()) {
  throw new Error('search-index.json is out of sync with search-index.js');
}
for (const file of paths) {
  const data = await fs.readFile(new URL(`../${file}`, import.meta.url));
  files[file] = new Uint8Array(data);
  manifest.push({ path: file, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
}
files['STAGING-FOLLOWUP-MANIFEST.json'] = new TextEncoder().encode(JSON.stringify(manifest, null, 2));
const output = new URL('../test-results/launch-2026-10-21/staging-followup-20261021.zip', import.meta.url);
await fs.mkdir(new URL('../test-results/launch-2026-10-21/', import.meta.url), { recursive: true });
await fs.writeFile(output, zipSync(files, { level: 6 }));
console.log(`Prepared ${manifest.length} files`);

if (process.argv.includes('--legacy')) {
  const productFiles = {};
  const productDirs = await fs.readdir(new URL('../product/', import.meta.url), { withFileTypes: true });
  for (const dir of productDirs) {
    if (!dir.isDirectory()) continue;
    const file = `product/${dir.name}/index.html`;
    try {
      await fs.access(new URL(`../${file}`, import.meta.url));
    } catch {
      continue;
    }
    const data = await fs.readFile(new URL(`../${file}`, import.meta.url));
    if (data.includes(Buffer.from("url: '/wp-content/themes/twentynineteen/check.php'"))) {
      throw new Error(`Legacy check.php request remains in ${file}`);
    }
    productFiles[file] = new Uint8Array(data);
  }
  const legacyOutput = new URL('../test-results/launch-2026-10-21/staging-legacy-post-cleanup-20261021.zip', import.meta.url);
  await fs.writeFile(legacyOutput, zipSync(productFiles, { level: 6 }));
  console.log(`Prepared ${Object.keys(productFiles).length} product pages without legacy POST`);
}
