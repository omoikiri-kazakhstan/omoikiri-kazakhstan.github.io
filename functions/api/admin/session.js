import { isAuthenticated } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export async function onRequestGet(context) {
  return json({ authenticated: await isAuthenticated(context.request, context.env.ADMIN_SESSION_SECRET) });
}

export function onRequest() {
  return methodNotAllowed();
}
