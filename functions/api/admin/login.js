import { createSession, passwordMatches, sessionCookie } from '../../_lib/auth.js';
import { badRequest, json, methodNotAllowed, readJson } from '../../_lib/http.js';

export async function onRequestPost(context) {
  try {
    const { login, password } = await readJson(context.request);
    if (!context.env.ADMIN_LOGIN || !context.env.ADMIN_PASSWORD || !context.env.ADMIN_SESSION_SECRET) {
      console.error(JSON.stringify({ scope: 'admin-login', error: 'Missing secret configuration' }));
      return json({ error: 'Админка пока не настроена.' }, { status: 503 });
    }
    const [validLogin, validPassword] = await Promise.all([
      passwordMatches(login, context.env.ADMIN_LOGIN),
      passwordMatches(password, context.env.ADMIN_PASSWORD)
    ]);
    if (!validLogin || !validPassword) {
      return json({ error: 'Неверный логин или пароль.' }, { status: 401 });
    }
    const token = await createSession(context.env.ADMIN_SESSION_SECRET);
    return json({ ok: true }, { headers: { 'Set-Cookie': sessionCookie(token) } });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Некорректный запрос.');
  }
}

export function onRequest() {
  return methodNotAllowed();
}
