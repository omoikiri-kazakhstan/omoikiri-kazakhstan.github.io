const privatePaths = /^\/(?:workers|scripts|tests|migrations|test-results)(?:\/|$)/;
const privateFiles = new Set(['/README.md', '/wrangler.toml', '/vercel.json']);

export function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if (privatePaths.test(pathname) || privateFiles.has(pathname)) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'no-store' }
    });
  }
  return context.next();
}
