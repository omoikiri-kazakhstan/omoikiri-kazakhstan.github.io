import { badRequest } from './http.js';

const CATEGORIES = new Set(['sinks', 'bathsinks', 'taps', 'filters', 'disposers', 'dispenser', 'acs', 'omoikiri-home']);

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function price(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100000000 ? parsed : NaN;
}

export function normalizeItem(input, options = {}) {
  const slug = text(input.slug, 90).toLowerCase();
  const name = text(input.name, 160);
  const sku = text(input.sku, 40);
  const category = text(input.category, 30);
  const imageUrl = text(input.imageUrl, 1000);
  const description = text(input.description, 5000);
  const itemPrice = price(input.price);
  const oldPrice = price(input.oldPrice);
  const visible = input.visible === false || input.visible === 0 || input.visible === '0' ? 0 : 1;
  const isCustom = options.isCustom === false ? 0 : 1;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: 'Укажите латинский URL: только буквы, цифры и дефисы.' };
  if (!name) return { error: 'Укажите название позиции.' };
  if (!CATEGORIES.has(category)) return { error: 'Выберите раздел каталога.' };
  if (Number.isNaN(itemPrice) || Number.isNaN(oldPrice)) return { error: 'Цена должна быть целым числом в тенге.' };
  if (oldPrice !== null && itemPrice !== null && oldPrice < itemPrice) return { error: 'Старая цена не может быть меньше текущей.' };
  if (imageUrl && !/^https:\/\/|^\//.test(imageUrl)) return { error: 'Ссылка на изображение должна начинаться с https:// или /.' };

  return { value: { slug, name, sku, category, imageUrl, price: itemPrice, oldPrice, description, visible, isCustom } };
}

export function validationError(result) {
  return result.error ? badRequest(result.error) : null;
}

export function rowToItem(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    imageUrl: row.image_url,
    price: row.price,
    oldPrice: row.old_price,
    description: row.description,
    visible: Boolean(row.visible),
    isCustom: Boolean(row.is_custom),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
