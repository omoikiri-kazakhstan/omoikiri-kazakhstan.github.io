import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.argv[2] || 'http://127.0.0.1:8797';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(new URL('/madi-admin/', origin).href);
  await page.locator('#login').fill('test-admin');
  await page.locator('#password').fill('test-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.locator('#loginView').waitFor({ state: 'hidden', timeout: 10000 });
  const session = await page.evaluate(async () => (await fetch('/api/admin/session')).json());
  assert.equal(session.authenticated, true);
  const stock = await page.evaluate(async () => (await fetch('/api/admin/stock')).json());
  assert.equal(stock.ready, true);
  assert.equal(stock.articleCount, 1);
  await page.evaluate(async () => fetch('/api/admin/logout', { method: 'POST' }));
  const afterLogout = await page.evaluate(async () => (await fetch('/api/admin/session')).json());
  assert.equal(afterLogout.authenticated, false);
  console.log('PHP admin browser login passed');
} finally {
  await browser.close();
}
