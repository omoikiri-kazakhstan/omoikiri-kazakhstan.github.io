import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = 'https://omoikiri.ru';
const products = [
  { slug: 'akari-45', title: 'Akari 45', sku: '4997361', price: 219880, bowl: '45' },
  { slug: 'akari-57', title: 'Akari 57', sku: '4997366', price: 219880, bowl: '60' },
  { slug: 'akari-79', title: 'Akari 79', sku: '4997371', price: 249880, bowl: '80' }
];

function decodeEntities(value) { return value.replace(/&quot;/g, '"').replace(/&#0*39;/g, "'").replace(/&amp;/g, '&'); }
function localize(html) {
  return html
    .replace(/https:\/\/omoikiri\.ru\/cart/g, '/cart')
    .replace(/https:\/\/omoikiri\.ru\/favorites/g, '/favorites')
    .replace(/href=["']https:\/\/omoikiri\.ru\/product\/([^"'?/#]+)(\?[^"']*)?["']/g, 'href="/product/$1/index.html$2"')
    .replace(/href=["']https:\/\/omoikiri\.ru\/(sinks|bathsinks|taps|filters|disposers|dispenser|acs|omoikiri-home)\/?(\?[^"']*)?["']/g, 'href="/$1/index.html$2"')
    .replace(/https:\/\/omoikiri\.ru\/wp-content\//g, '/assets/remote/omoikiri.ru/wp-content/')
    .replace(/https:\\\/\\\/omoikiri\.ru\\\/wp-content\\\//g, '/assets/remote/omoikiri.ru/wp-content/')
    .replace(/"priceCurrency":"RUB"/g, '"priceCurrency":"KZT"')
    .replace(/&#8381;|&amp;#8381;|₽/g, '₸');
}
async function mirror(url) {
  const local = path.join(root, 'assets', 'remote', 'omoikiri.ru', new URL(url).pathname);
  try { await readFile(local); return; } catch {}
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed media ${response.status}: ${url}`);
  await mkdir(path.dirname(local), { recursive: true });
  await writeFile(local, Buffer.from(await response.arrayBuffer()));
}
for (const product of products) {
  const response = await fetch(`${source}/product/${product.slug}`);
  if (!response.ok) throw new Error(`Failed page ${response.status}: ${product.slug}`);
  const original = await response.text();
  const variationSource = original.match(/data-product_variations="([\s\S]*?)"/)?.[1];
  const variations = variationSource ? JSON.parse(decodeEntities(variationSource)) : [];
  const media = new Set();
  for (const variation of variations) {
    for (const image of [variation.image, ...(variation.variation_gallery_images || [])]) {
      for (const key of ['url', 'src', 'full_src', 'archive_src', 'gallery_thumbnail_src', 'thumb_src']) if (image?.[key]?.startsWith(source)) media.add(image[key]);
    }
  }
  for (const match of original.matchAll(/https:\\\/\\\/omoikiri\.ru\\\/wp-content\\\/[^"']+?\.(?:png|jpe?g|webp)/g)) {
    media.add(match[0].replace(/\\\//g, '/'));
  }
  await Promise.all([...media].map(mirror));
  const scripts = '<script id="dealer-local-product-script" src="../../assets/js/product-local.js?v=20261002-01"></script>\n<script src="../../assets/js/lang-switch.js" data-root="../../"></script>\n<script src="../../assets/js/local-router.js" data-root="../../"></script>\n<script src="../../assets/js/catalog-admin-overrides.js?v=20260917-04"></script>';
  const initialImage = variations[0]?.variation_gallery_images?.[1]?.src || variations[0]?.image?.src || '';
  const initialImagePath = localize(initialImage);
  const page = localize(original)
    .replace('</head>', '<link rel="stylesheet" href="../../assets/css/akari-dimensions.css?v=20261002-02">\n</head>')
    .replace('<div class="second_image"></div>', `<div class="second_image"><img class="active" src="${initialImagePath}" alt="${product.title}"></div>`)
    .replace(/<\/body>/i, `${scripts}\n</body>`);
  const pagePath = path.join(root, 'product', product.slug, 'index.html');
  await mkdir(path.dirname(pagePath), { recursive: true });
  await writeFile(pagePath, page, 'utf8');
}

let category = await readFile(path.join(root, 'sinks', 'index.html'), 'utf8');
const cards = products.map((product) => `<li class="entry rtwpvg-product product type-product status-publish instock product_cat-sinks product_cat-tetogranit has-post-thumbnail purchasable product-type-variable has-default-attributes woo-variation-gallery-product"><a href="/product/${product.slug}/index.html?attribute_pa_color=bl" class="woocommerce-LoopProduct-link woocommerce-loop-product__link"><img width="300" height="300" src="/assets/remote/omoikiri.ru/wp-content/uploads/2026/09/${product.slug.replace('-', '_')}-bl-300x300.png" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="${product.title}" decoding="async"><h2 class="woocommerce-loop-product__title">${product.title}</h2><span class="price"><span class="woocommerce-Price-amount amount" data-original-rub="${product.price === 249880 ? 40888 : 35888}"><bdi>${product.price.toLocaleString('ru-RU').replace(/,/g, ' ')}&nbsp;<span class="woocommerce-Price-currencySymbol">₸</span></bdi></span></span></a><button class="add-to-favorites-loop" data-product-id="${product.sku}" data-pa_color="bl" data-sku="${product.sku}"></button></li>`).join('\n');
if (!category.includes('product/akari-45/')) category = category.replace('<ul class="products columns-4">', `<ul class="products columns-4">\n${cards}`);
for (const product of products) {
  const marker = '</script>';
  const meta = `,"${product.slug}":{"title":"${product.title}","materials":["tetogranit"],"colors":["bl","wh"],"bowlSizes":["${product.bowl}"],"asmbl":["f"],"shapes":["rect"]}`;
  const pos = category.indexOf(marker, category.indexOf('id="dealer-sinks-meta-json"'));
  if (pos > 0 && !category.includes(`"${product.slug}":`)) category = `${category.slice(0, pos)}${meta}${category.slice(pos)}`;
}
await writeFile(path.join(root, 'sinks', 'index.html'), category, 'utf8');

const searchPath = path.join(root, 'assets', 'js', 'search-index.js');
const searchSource = await readFile(searchPath, 'utf8');
const start = searchSource.indexOf('['); const end = searchSource.lastIndexOf(']');
const index = JSON.parse(searchSource.slice(start, end + 1));
for (const product of products) if (!index.some((item) => item.slug === product.slug)) index.unshift({ title: product.title, slug: product.slug, url: `/product/${product.slug}/index.html?attribute_pa_color=bl`, sku: product.sku, image: `/assets/remote/omoikiri.ru/wp-content/uploads/2026/09/${product.slug.replace('-', '_')}-bl-300x300.png`, category: 'Мойки', price: `${product.price.toLocaleString('ru-RU').replace(/,/g, ' ')} ₸` });
await writeFile(searchPath, `window.OMOIKIRI_SEARCH_INDEX = ${JSON.stringify(index, null, 2)};\n`, 'utf8');
console.log(`Imported ${products.length} Akari sinks.`);
