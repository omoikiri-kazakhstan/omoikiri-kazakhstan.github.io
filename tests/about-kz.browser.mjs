import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const files = new Map([
  ['/about/', ['../about/index.html', 'text/html; charset=utf-8']],
  ['/assets/js/about-ru.js', ['../assets/js/about-ru.js', 'text/javascript; charset=utf-8']],
  ['/assets/js/about-kz.js', ['../assets/js/about-kz.js', 'text/javascript; charset=utf-8']],
  ['/assets/js/lang-switch.js', ['../assets/js/lang-switch.js', 'text/javascript; charset=utf-8']],
  ['/assets/css/info-pages.css', ['../assets/css/info-pages.css', 'text/css; charset=utf-8']],
]);

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('https://staging.omoikiri.kz/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const file = files.get(pathname);
    if (!file) return route.continue();
    const body = await readFile(new URL(file[0], import.meta.url));
    await route.fulfill({ status: 200, contentType: file[1], body });
  });
  await page.goto('https://staging.omoikiri.kz/about/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'KZ', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'kk');
  assert.match(await page.locator('.about_top_text').innerText(), /асүй мойкаларын/i);
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/launch-2026-10-21/about-kz-local-390.png', import.meta.url)) });
  await page.locator('.mnf_countries > span').nth(1).click();
  await page.waitForFunction(() => document.querySelector('.mnf_description')?.textContent.includes('Қытай'));
  assert.match(await page.locator('.mnf_description').innerText(), /Қытай/);
  assert.equal(await page.locator('.about_top_video p').first().innerText(), 'Қытайдағы зауыт');
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
  assert.match(await page.locator('.about_top_text').innerText(), /мировой производитель/i);
  await page.locator('.mnf_countries > span').first().click();
  assert.match(await page.locator('.mnf_description').innerText(), /Италии/);
  console.log('About RU→KZ→RU and country switching passed');
} finally {
  await browser.close();
}
