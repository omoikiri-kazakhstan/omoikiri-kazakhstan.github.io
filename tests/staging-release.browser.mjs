import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.argv[2] || 'https://staging.omoikiri.kz';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];

async function visit(page, path) {
  const response = await page.goto(new URL(path, origin).href, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, `${path} should respond 200`);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 3, `${path} overflows horizontally by ${overflow}px`);
  results.push({ path, width: page.viewportSize().width, status: 200, overflow });
}

try {
  for (const path of ['/healthz', '/api/catalog', '/api/prices', '/assets/js/search-index.json']) {
    const response = await fetch(new URL(path, origin));
    assert.equal(response.status, 200, `${path} should respond 200`);
    results.push({ path, status: response.status });
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await visit(page, '/');
    await page.getByRole('button', { name: 'KZ', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'kk');
    await page.getByRole('button', { name: 'RU', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
    await page.locator('#search').click();
    await page.locator('.dgwt-wcas-search-input').first().fill('Akashi-S');
    await page.locator('.dealer-search-suggestion').first().waitFor({ timeout: 10000 });
    assert.match(await page.locator('.dealer-search-suggestion').first().innerText(), /Akashi-S/i);

    await visit(page, '/about/');
    await page.getByRole('button', { name: 'KZ', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'kk');
    await page.getByRole('button', { name: 'RU', exact: true }).click();

    await visit(page, '/sinks/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
    const productLinks = await page.locator('a[href*="/product/"]').count();
    assert.ok(productLinks > 100, `Sinks catalog is short: ${productLinks} product links`);

    await visit(page, '/product/akari-57/?attribute_pa_color=bl');
    const mainImage = page.locator('.prod_image img').first();
    await mainImage.waitFor();
    const blackImage = await mainImage.getAttribute('src');
    await page.locator('[data-attribute_name="attribute_pa_color"][data-value="wh"]').first().click();
    await page.waitForFunction((before) => {
      const image = document.querySelector('.prod_image img');
      return image && image.getAttribute('src') !== before;
    }, blackImage, { timeout: 10000 });
    const whiteImage = await mainImage.getAttribute('src');
    assert.notEqual(whiteImage, blackImage);
    assert.match(page.url(), /attribute_pa_color=wh/);
    await page.locator('.card_actions .fav_button').click();
    await visit(page, '/favorites/');
    assert.match(await page.locator('body').innerText(), /Akari 57/i);
    await visit(page, '/product/akari-57/?attribute_pa_color=wh');
    await page.locator('.dealer-simple-cart-button').click();
    await visit(page, '/cart.html');
    assert.match(await page.locator('body').innerText(), /Akari 57/i);
    results.push({ width, colorChange: [blackImage, whiteImage], productLinks });
    await context.close();
  }
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
