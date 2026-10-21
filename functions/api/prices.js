import { json, methodNotAllowed } from '../_lib/http.js';
import { loadLivePrices } from '../_lib/live-prices.js';

export async function onRequestGet(context) {
  return json(await loadLivePrices(context.env.CATALOG_DB));
}

export function onRequest() {
  return methodNotAllowed();
}
