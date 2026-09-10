import { createSession, sessionCookie } from '../../_lib/auth.js';

function toHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function tokenHash(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

export async function onRequestGet(context) {
  const token = new URL(context.request.url).searchParams.get('token') || '';
  if (!token || !context.env.ADMIN_SESSION_SECRET) return Response.redirect(new URL('/madi-admin/', context.request.url), 302);
  try {
    const used = await context.env.CATALOG_DB.prepare(
      "DELETE FROM admin_magic_links WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP RETURNING token_hash"
    ).bind(await tokenHash(token)).first();
    if (!used) return new Response('Ссылка недействительна или уже использована.', { status: 403 });
    const session = await createSession(context.env.ADMIN_SESSION_SECRET);
    return new Response(null, {
      status: 302,
      headers: { Location: '/madi-admin/', 'Set-Cookie': sessionCookie(session), 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error(JSON.stringify({ scope: 'admin-magic-link', error: String(error) }));
    return new Response('Не удалось открыть кабинет.', { status: 500 });
  }
}
