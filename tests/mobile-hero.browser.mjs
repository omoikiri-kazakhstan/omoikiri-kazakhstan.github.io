import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.argv[2] || 'http://127.0.0.1:8798';
const browser = await chromium.launch({ channel: 'msedge', headless: true });

try {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.locator('.main_block > img').evaluate((image) => image.decode());
    await page.locator('body > .preloader').waitFor({ state: 'hidden' });

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.main_block').getBoundingClientRect();
      const image = document.querySelector('.main_block > img').getBoundingClientRect();
      const pins = [...document.querySelectorAll('.main_block .hero-hotspot')].map((pin) => {
        const rect = pin.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const top = document.elementFromPoint(x, y);
        return { href: pin.getAttribute('href'), x, y,
          clickable: pin.contains(top), coveringElement: top?.className || top?.tagName };
      });
      return { hero: { top: hero.top, bottom: hero.bottom, width: hero.width, height: hero.height },
        image: { width: image.width, height: image.height }, pins,
        overflow: document.documentElement.scrollWidth - innerWidth };
    });

    assert.ok(layout.hero.bottom <= height, `${width}px: hero extends below the first screen`);
    assert.ok(Math.abs(layout.hero.width / layout.hero.height - 1) < 0.01);
    assert.equal(layout.overflow, 0, `${width}px: horizontal overflow`);
    assert.equal(layout.pins.length, 4);
    for (const pin of layout.pins) {
      assert.ok(pin.x >= 0 && pin.x <= width && pin.y >= layout.hero.top && pin.y <= height,
        `${width}px: ${pin.href} is outside the visible hero`);
      assert.ok(pin.clickable, `${width}px: ${pin.href} is covered by ${pin.coveringElement}`);
    }
    if (width === 390) await page.screenshot({ path: 'test-results/mobile-hero-390-20261025.png' });
    await page.getByRole('link', { name: 'Перейти к измельчителям' }).click();
    assert.equal(new URL(page.url()).pathname, '/disposers/index.html');
    console.log(`${width}x${height}: all four pins visible; disposer link works`);
    await page.close();
  }
} finally {
  await browser.close();
}
