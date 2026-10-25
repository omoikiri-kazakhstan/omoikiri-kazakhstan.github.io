import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const php = process.env.PHP_BINARY || 'php';
const temp = mkdtempSync(path.join(tmpdir(), 'omoikiri-php-release-'));
const database = path.join(temp, 'fixture.sqlite');
execFileSync(php, [path.join(root, 'php-poc/tests/fixture.php'), database]);

const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', 'php-poc/public', 'php-poc/public/index.php'], {
  cwd: root,
  env: { ...process.env, APP_ENV: 'test', TEST_DB_DSN: `sqlite:${database}`,
    ADMIN_LOGIN: 'test-admin', ADMIN_PASSWORD: 'test-password',
    ADMIN_SESSION_SECRET: 'test-secret-do-not-deploy' },
  stdio: 'ignore',
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      ready = (await (await fetch(`${origin}/healthz`)).json()).ok === true;
      if (ready) break;
    } catch { /* PHP is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'PHP server did not start');
  for (const test of [
    'tests/staging-release.browser.mjs',
    'php-poc/tests/admin.browser.mjs',
    'php-poc/tests/sitemap.mjs',
  ]) {
    execFileSync(process.execPath, [test, origin], { cwd: root, stdio: 'inherit' });
  }
} finally {
  server.kill();
  await new Promise((resolve) => server.once('exit', resolve));
  rmSync(temp, { recursive: true, force: true });
}
