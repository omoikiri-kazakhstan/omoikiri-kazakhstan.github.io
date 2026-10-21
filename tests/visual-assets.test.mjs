import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

test('Kinaru product uses the current RU photographs for every color', async () => {
  const html = await readFile(path.join(root, 'product/kinaru-pro-86-u-i/index.html'), 'utf8');
  const imageRoot = path.join(root, 'assets/remote/omoikiri.ru/wp-content/uploads/2024/09');
  for (const color of ['cn', 'wg', 'wh', 'gb', 'mo']) {
    for (const suffix of ['', '-1', '-2']) {
      const name = `kinaru-pro-${color}${suffix}.png`;
      assert.ok(html.includes(name), `${name} absent from product page`);
      assert.ok((await stat(path.join(imageRoot, name))).size > 0, `${name} missing locally`);
    }
  }
  assert.doesNotMatch(html, /(?:Kinaru_Pro-86-(?:CN|WG|WH)-\d|kinaru-pro-(?:gb|mo)-new)[A-Za-z0-9-]*\.png/i);
});

test('information pages define the Gotham fonts they use', async () => {
  const css = await readFile(path.join(root, 'assets/css/info-pages.css'), 'utf8');
  for (const weight of ['Regular', 'Light', 'Medium', 'Bold']) {
    const relative = `../remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts/GothamPro${weight}/GothamPro${weight}.woff`;
    assert.ok(css.includes(relative), `missing GothamPro${weight} font face`);
    assert.ok((await stat(path.join(root, 'assets/remote/omoikiri.ru/wp-content/themes/twentynineteen/fonts', `GothamPro${weight}`, `GothamPro${weight}.woff`))).size > 0);
  }
});
