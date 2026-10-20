import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = 'https://omoikiri.ru/wp-content/themes/twentynineteen/styles2/';
const names = [
  'index.css', 'menu.css', 'product.css', 'gallery.css', 'default.css',
  'elements.css', 'buttons.css', 'favorites.css', 'faq.css', 'footer.css',
  'about.css', 'service.css', 'dealers.css', 'contact.css',
];
const destination = path.join(root, 'assets', 'remote', 'omoikiri.ru',
  'wp-content', 'themes', 'twentynineteen', 'styles2');

await mkdir(destination, { recursive: true });
for (const name of names) {
  const cssUrl = new URL(name, source);
  const response = await fetch(cssUrl, {
    headers: { 'user-agent': 'Mozilla/5.0 OMOIKIRI-KZ asset mirror' },
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/css')) {
    throw new Error(`Unable to mirror ${name}: HTTP ${response.status}`);
  }
  const css = (await response.text()).replaceAll(
    'url(/wp-content/themes/',
    'url(/assets/remote/omoikiri.ru/wp-content/themes/',
  );
  await writeFile(path.join(destination, name), css, 'utf8');
  console.log(`${name}: ${css.length} chars`);

  for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) {
    const value = match[2].split('#', 1)[0];
    if (!value || value.startsWith('data:') || /^https?:/i.test(value)) continue;
    const assetUrl = new URL(value, cssUrl);
    if (assetUrl.hostname !== 'omoikiri.ru' || !assetUrl.pathname.startsWith('/wp-content/themes/twentynineteen/')) continue;
    const target = path.join(root, 'assets', 'remote', 'omoikiri.ru', assetUrl.pathname.slice(1));
    try {
      await access(target);
      continue;
    } catch {}
    const assetResponse = await fetch(assetUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 OMOIKIRI-KZ asset mirror' },
    });
    if (assetResponse.status === 404) {
      console.warn(`Source asset not found: ${assetUrl}`);
      continue;
    }
    if (!assetResponse.ok) throw new Error(`Unable to mirror ${assetUrl}: HTTP ${assetResponse.status}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await assetResponse.arrayBuffer()));
    console.log(`  ${path.relative(root, target)}`);
  }
}
