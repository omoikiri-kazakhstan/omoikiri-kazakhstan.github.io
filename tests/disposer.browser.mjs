import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const site = process.argv[2] || 'https://staging.omoikiri.kz/';
const useLocalHtml = process.argv.includes('--local');
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const failedFrames = [];
    let loadedFrames = 0;
    let requestedFrames = 0;
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (/\/img\/main\/sq\/img_\d+\.png/.test(request.url())) requestedFrames++;
    });
    page.on('response', (response) => {
      if (!/\/img\/main\/sq\/img_\d+\.png/.test(response.url())) return;
      if (response.status() === 200) loadedFrames++;
      else {
        failedFrames.push(`${response.status()} ${response.url()}`);
      }
    });
    if (useLocalHtml) {
      await page.route(site, async (route) => {
        const body = await readFile(new URL('../index.html', import.meta.url));
        await route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body });
      });
    }
    await page.goto(site, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('.anvideo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(10000);
    const first = await page.evaluate(() => {
      const section = document.querySelector('.anvideo');
      const canvas = section.querySelector('canvas');
      const context = canvas.getContext('2d');
      const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let nontransparent = 0;
      let checksum = 0;
      for (let i = 0; i < sample.length; i += 100) {
        if (sample[i + 3]) nontransparent++;
        checksum = (checksum + sample[i] + sample[i + 1] * 3 + sample[i + 2] * 7) >>> 0;
      }
      return {
        canvasDisplay: getComputedStyle(canvas).display,
        canvasRect: canvas.getBoundingClientRect().toJSON(),
        sectionRect: section.getBoundingClientRect().toJSON(),
        nontransparent,
        checksum,
        triggerCount: window.ScrollTrigger?.getAll()?.length ?? 0,
        disposerTriggers: window.ScrollTrigger?.getAll()?.filter((trigger) => trigger.trigger === section)
          .map((trigger) => ({ start: trigger.start, end: trigger.end, progress: trigger.progress, animationProgress: trigger.animation?.progress() })) ?? [],
      };
    });
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(2000);
    const second = await page.evaluate(() => {
      const canvas = document.querySelector('.anvideo canvas');
      const context = canvas.getContext('2d');
      const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let nontransparent = 0;
      let checksum = 0;
      for (let i = 0; i < sample.length; i += 100) {
        if (sample[i + 3]) nontransparent++;
        checksum = (checksum + sample[i] + sample[i + 1] * 3 + sample[i + 2] * 7) >>> 0;
      }
      return {
        nontransparent, checksum, scrollY: window.scrollY,
        disposerTriggers: window.ScrollTrigger?.getAll()?.filter((trigger) => trigger.trigger === document.querySelector('.anvideo'))
          .map((trigger) => ({ start: trigger.start, end: trigger.end, progress: trigger.progress, animationProgress: trigger.animation?.progress() })) ?? [],
      };
    });
    const progressSamples = [];
    if (first.canvasDisplay !== 'none') {
      for (let attempt = 0; attempt < 30 && loadedFrames < 99; attempt++) await page.waitForTimeout(1000);
      for (const progress of [0, 0.5, 1]) {
        await page.evaluate((value) => {
          window.ScrollTrigger.refresh();
          const section = document.querySelector('.anvideo');
          const trigger = window.ScrollTrigger.getAll()
            .filter((item) => item.trigger === section)
            .sort((a, b) => b.start - a.start)[0];
          window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * value);
        }, progress);
        await page.waitForTimeout(1500);
        progressSamples.push(await page.evaluate(() => {
          const canvas = document.querySelector('.anvideo canvas');
          const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          let checksum = 0;
          for (let i = 0; i < pixels.length; i += 100) {
            checksum = (checksum + pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7) >>> 0;
          }
          return { scrollY: window.scrollY, checksum };
        }));
      }
    }
    console.log(JSON.stringify({ width, canvasDisplay: first.canvasDisplay,
      initialPixels: first.nontransparent, progressSamples, requestedFrames, loadedFrames,
      pageErrors: errors.filter((error) => !error.startsWith('GSAP target') && !error.startsWith('Element not found')).slice(0, 10) }));
    assert.deepEqual(failedFrames, [], `Frame requests failed at ${width}px`);
    assert.equal(first.canvasDisplay === 'none', width === 390);
    if (width === 1440) {
      assert.equal(loadedFrames, 99, 'All animation frames should load');
      assert.ok(first.nontransparent > 0, 'Initial frame should be visible');
      assert.ok(new Set(progressSamples.map((sample) => sample.checksum)).size >= 2,
        'Scrolling should render distinct animation frames');
      assert.notEqual(progressSamples[0].checksum, progressSamples.at(-1).checksum,
        'Start and end frames should differ');
    }
    await page.close();
  }
} finally {
  await browser.close();
}
