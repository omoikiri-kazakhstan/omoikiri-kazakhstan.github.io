import { json, methodNotAllowed } from '../_lib/http.js';

export function onRequestGet() {
  return json({ bySku: {}, bySlug: {}, fetchedAt: null });
}

export function onRequest() {
  return methodNotAllowed();
}
