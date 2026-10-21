import catalog from '../../assets/data/admin-full-catalog.json' with { type: 'json' };
import { kztPrice, loadLivePrices } from './live-prices.js';

const products = new Map(catalog.map((product) => [product.slug, product]));
const discontinuedSkus = new Set([
  '4993469', '4993459', '4993487', '4993744', '4993291',
  '4993935', '4993845', '4993875', '4993917', '4993247',
  '4993508', '4973056', '4994174', '4994139', '4994270',
  '4993342', '4993335', '4993416', '4993886', '4993562',
  '4993567', '4997264', '4973080', '4994365'
]);
const discontinuedColors = {
  'tasogare-86': ['bl', 'gr'], 'tasogare-65': ['gr'], 'yonaka-65': ['be'],
  'yonaka-78-lb': ['be', 'sa'], 'tasogare-78': ['be'], 'maru-86-2': ['ch'],
  'tedori-86-2-lb': ['wh'], 'yasugata-100': ['be'], 'yasugata-86': ['pl'],
  'tedori-100': ['be', 'gr'], 'bosen-38-u': ['ch'], 'miya-50-r': ['ch'],
  'akisame-41': ['in', 'lg'], 'sakaime-100': ['sa'], 'sakaime-100-2': ['gr'],
  'yamakawa-55-integra': ['gr'], 'tateyama-s': ['ca', 'ev', 'gb'], 'umi': ['bl']
};

function unavailable() {
  return { error: 'Один из товаров или цветов больше недоступен. Обновите корзину.' };
}

export async function resolveOrderItems(db, submitted) {
  const items = [];
  const livePrices = await loadLivePrices(db);
  for (const item of submitted) {
    const slug = item.slug.toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return unavailable();
    const [custom, override] = await Promise.all([
      db.prepare('SELECT slug, name, sku, price, visible, variants FROM catalog_items WHERE slug = ?').bind(slug).first(),
      db.prepare('SELECT visible, hidden_colors FROM catalog_visibility_overrides WHERE slug = ?').bind(slug).first()
    ]);
    if (override && !override.visible) return unavailable();

    const product = custom || products.get(slug);
    if (!product || (custom && !custom.visible)) return unavailable();
    let name = product.name;
    let sku = product.sku || '';
    let colorCode = '';
    let price;

    if (custom) {
      const variants = JSON.parse(custom.variants || '[]');
      if (variants.length) {
        const variant = variants.find((entry) => entry.sku && entry.sku === item.sku);
        if (!variant) return unavailable();
        sku = variant.sku;
        colorCode = variant.color || '';
      } else if (sku && sku !== item.sku) {
        return unavailable();
      }
      price = Number(custom.price);
    } else if (product.variations.length) {
      const variant = product.variations.find((entry) => entry.sku === item.sku);
      if (!variant) return unavailable();
      sku = variant.sku;
      colorCode = variant.color;
      price = kztPrice(livePrices.bySku[sku] || variant.price);
    } else {
      const currentRub = livePrices.bySku[sku] || livePrices.bySlug[slug]?.default?.rub;
      price = currentRub ? kztPrice(currentRub) : product.price;
      if (sku && sku !== item.sku) return unavailable();
    }

    if (discontinuedSkus.has(sku) || discontinuedColors[slug]?.includes(colorCode)) return unavailable();
    const hiddenColors = override ? JSON.parse(override.hidden_colors || '[]') : [];
    if (hiddenColors.includes(colorCode)) return unavailable();
    if (!Number.isSafeInteger(price) || price <= 0) return unavailable();
    if (item.price !== price) {
      return { error: 'Цена товара изменилась. Удалите его из корзины и добавьте заново.' };
    }
    items.push({ id: `${slug}-${sku || colorCode || 'default'}`, name, sku, color: colorCode.toUpperCase(), qty: item.qty, price });
  }
  return { items };
}
