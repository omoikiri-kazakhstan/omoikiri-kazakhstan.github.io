import { json, methodNotAllowed } from '../_lib/http.js';
import { loadLivePrices } from '../_lib/live-prices.js';

export async function onRequestGet({ env }) {
  try {
    const prices = await loadLivePrices(env.CATALOG_DB);
    return json(prices);
  } catch (error) {
    console.error('Live prices unavailable:', error);
    return json({ bySku: {}, bySlug: {}, fetchedAt: null });
  }
}

export function onRequest() {
  return methodNotAllowed();
}
