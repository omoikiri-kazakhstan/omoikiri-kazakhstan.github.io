import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = new URL('./launch-2026-10-21/', import.meta.url);
const outPath = fileURLToPath(out);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const targets = [
  ['home', '/'], ['sinks', '/sinks/'], ['taps', '/taps/'], ['dispenser', '/dispenser/'],
  ['disposers', '/disposers/'], ['acs', '/acs/'], ['bathsinks', '/bathsinks/'],
  ['filters', '/filters/'], ['home-line', '/omoikiri-home/'], ['about', '/about/'],
  ['contact', '/contact/'], ['service', '/service/'], ['favorites', '/favorites/'],
  ['cart', '/cart.html'], ['akita', '/product/akita/'], ['akashi-s', '/product/akashi-s/'],
  ['akari-45', '/product/akari-45/'], ['ec-01', '/product/ec-01/'],
];
const results = [];
for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const [name, pathname] of targets) {
    const page = await context.newPage();
    const issues = [];
    page.on('console', msg => { if (msg.type() === 'error') issues.push(`console: ${msg.text().slice(0, 180)}`); });
    page.on('pageerror', error => issues.push(`pageerror: ${error.message.slice(0, 180)}`));
    page.on('requestfailed', request => issues.push(`request: ${request.url()} ${request.failure()?.errorText}`));
    let status = 0;
    try {
      const response = await page.goto(`https://staging.omoikiri.kz${pathname}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      status = response?.status() || 0;
      await page.waitForTimeout(1200);
      const data = await page.evaluate(() => ({
        title: document.title, lang: document.documentElement.lang,
        scrollWidth: document.documentElement.scrollWidth, innerWidth,
        text: document.body.innerText.slice(0, 650),
        brokenImages: [...document.images].filter(x => x.complete && x.naturalWidth === 0).slice(0, 8).map(x => x.src),
        links: [...document.querySelectorAll('a[href]')].map(x => x.getAttribute('href')).filter(Boolean),
      }));
      await page.screenshot({ path: path.join(outPath, `${width}-${name}.png`), fullPage: false });
      results.push({ width, name, pathname, status, ...data, issues });
    } catch (error) { results.push({ width, name, pathname, status, error: String(error), issues }); }
    await page.close();
  }
  await context.close();
}
for (const [name, pathname] of [['home', '/'], ['akita', '/product/akita/'], ['sinks', '/sinks/']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try { await page.goto(`https://omoikiri.ru${pathname}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outPath, `ru-1440-${name}.png`), fullPage: false });
  } catch (error) { results.push({ name: `ru-${name}`, error: String(error) }); }
  await page.close();
}
await fs.writeFile(new URL('results.json', out), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ width, name, status, scrollWidth, innerWidth, brokenImages, issues, error }) =>
  ({ width, name, status, overflow: scrollWidth > innerWidth, brokenImages: brokenImages?.length, issueCount: issues?.length, error })), null, 2));
await browser.close();
