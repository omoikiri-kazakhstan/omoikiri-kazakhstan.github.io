import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = new URL('./launch-2026-10-21/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = {};
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const failed = [];
  page.on('response', r => { if (r.status() >= 400) failed.push([r.status(), r.url()]); });
  await page.goto('https://staging.omoikiri.kz/about/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => ({ buttons: [...document.querySelectorAll('button,a')].filter(x => /^(RU|KZ|ҚАЗ|РУС)$/i.test(x.textContent.trim())).map(x => ({ tag: x.tagName, text: x.textContent.trim(), class: x.className, html: x.outerHTML.slice(0, 250) })), text: document.body.innerText.slice(0, 1600) }));
  const kz = page.getByText('KZ', { exact: true }).first();
  if (await kz.count()) await kz.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({ text: document.body.innerText.slice(0, 5000), lang: document.documentElement.lang }));
  await page.screenshot({ path: fileURLToPath(new URL(`${width}-about-kz.png`, out)) });
  results[`about-${width}`] = { before, after, failed };
  await page.close();
}
const stock = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const stockErrors = [];
stock.on('response', r => { if (r.status() >= 400) stockErrors.push([r.status(), r.url()]); });
await stock.goto('https://stock.omoikiri.kz/', { waitUntil: 'domcontentloaded' });
await stock.waitForTimeout(1500);
results.stock = await stock.evaluate(() => ({ text: document.body.innerText.slice(0, 1500), inputs: [...document.querySelectorAll('input')].map(x => ({ placeholder: x.placeholder, type: x.type })), rows: document.querySelectorAll('tr').length, scrollHeight: document.documentElement.scrollHeight }));
await stock.screenshot({ path: fileURLToPath(new URL('1440-stock.png', out)) });
await stock.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await stock.waitForTimeout(700);
results.stock.afterScroll = await stock.evaluate(() => ({ rows: document.querySelectorAll('tr').length, scrollHeight: document.documentElement.scrollHeight }));
results.stock.failed = stockErrors;
await stock.close();
await fs.writeFile(new URL('interactions.json', out), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ about: Object.fromEntries(Object.entries(results).filter(([k]) => k.startsWith('about')).map(([k,v]) => [k,{ buttons: v.before.buttons, kzText: v.after.text.slice(0, 700), failed: v.failed.slice(0, 3) }])), stock: results.stock }, null, 2));
await browser.close();
