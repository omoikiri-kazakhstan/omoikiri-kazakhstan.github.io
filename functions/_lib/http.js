export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=UTF-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function badRequest(message) {
  return json({ error: message }, { status: 400 });
}

export function methodNotAllowed() {
  return json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET, POST, PUT, DELETE' } });
}

export async function readJson(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20000) throw new Error('Payload is too large');
  const body = await request.text();
  if (body.length > 20000) throw new Error('Payload is too large');
  return body ? JSON.parse(body) : {};
}
