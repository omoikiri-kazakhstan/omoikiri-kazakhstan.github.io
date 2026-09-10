import { json } from './http.js';

const encoder = new TextEncoder();
const SESSION_NAME = 'madi_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function base64url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function equal(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a[index] ^ b[index];
  return result === 0;
}

function cookieValue(request, name) {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : '';
}

export async function passwordMatches(password, secret) {
  if (typeof password !== 'string' || !secret) return false;
  const [received, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(secret))
  ]);
  return equal(new Uint8Array(received), new Uint8Array(expected));
}

export async function createSession(secret) {
  const payload = base64url(encoder.encode(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, nonce: crypto.randomUUID() })));
  const signature = base64url(await hmac(payload, secret));
  return `${payload}.${signature}`;
}

export function sessionCookie(token) {
  return `${SESSION_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}`;
}

export function expiredSessionCookie() {
  return `${SESSION_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthenticated(request, secret) {
  const token = cookieValue(request, SESSION_NAME);
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !secret) return false;
  try {
    const expected = await hmac(payload, secret);
    if (!equal(expected, decodeBase64url(signature))) return false;
    const parsed = JSON.parse(new TextDecoder().decode(decodeBase64url(payload)));
    return Number.isFinite(parsed.exp) && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin(context) {
  if (await isAuthenticated(context.request, context.env.ADMIN_SESSION_SECRET)) return null;
  return json({ error: 'Unauthorized' }, { status: 401 });
}
