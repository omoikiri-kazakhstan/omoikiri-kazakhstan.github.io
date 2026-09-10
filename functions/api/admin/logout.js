import { expiredSessionCookie } from '../../_lib/auth.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export function onRequestPost() {
  return json({ ok: true }, { headers: { 'Set-Cookie': expiredSessionCookie() } });
}

export function onRequest() {
  return methodNotAllowed();
}
