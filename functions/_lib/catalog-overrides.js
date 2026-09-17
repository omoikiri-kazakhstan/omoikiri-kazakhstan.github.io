import { badRequest } from './http.js';

const COLOR_CODE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function rowToOverride(row) {
  let hiddenColors = [];
  try { hiddenColors = JSON.parse(row.hidden_colors || '[]'); } catch { hiddenColors = []; }
  return { slug: row.slug, visible: Boolean(row.visible), hiddenColors: Array.isArray(hiddenColors) ? hiddenColors : [] };
}

export function normalizeOverride(slug, input) {
  const cleanSlug = String(slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) return { error: 'Некорректный URL позиции.' };
  const colors = Array.isArray(input.hiddenColors) ? input.hiddenColors : [];
  const hiddenColors = [...new Set(colors.map((color) => String(color || '').trim().toLowerCase()).filter((color) => COLOR_CODE.test(color)))].slice(0, 80);
  if (colors.length !== hiddenColors.length) return { error: 'Некорректный код цвета.' };
  return { value: { slug: cleanSlug, visible: input.visible === false ? 0 : 1, hiddenColors } };
}

export function overrideValidationError(result) {
  return result.error ? badRequest(result.error) : null;
}
