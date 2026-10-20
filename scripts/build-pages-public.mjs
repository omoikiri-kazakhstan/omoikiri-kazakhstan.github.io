import { copyFile, link, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve(import.meta.dirname, '..');
const destination = process.argv[2] && path.resolve(process.argv[2]);
if (!destination || destination === source || destination.startsWith(`${source}${path.sep}`)) {
  throw new Error('Pass a new output directory outside the repository.');
}

const directories = [
  'about', 'acs', 'admin-product', 'assets', 'bathsinks', 'contact',
  'dealers', 'dispenser', 'disposers', 'favorites', 'filters',
  'madi-admin', 'omoikiri-home', 'product', 'service', 'sinks', 'taps',
];
const files = [
  '_headers', '_redirects', '_routes.json', '.nojekyll', '404.html', 'cart.html',
  'favicon.ico', 'index.html', 'robots.txt', 'sitemap.xml',
];
await mkdir(destination);
let count = 0;

async function copyTree(from, to) {
  await mkdir(to);
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const input = path.join(from, entry.name);
    const output = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyTree(input, output);
    } else if (entry.isFile()) {
      try {
        await link(input, output);
      } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        await copyFile(input, output);
      }
      count++;
    }
  }
}

for (const directory of directories) await copyTree(path.join(source, directory), path.join(destination, directory));
for (const file of files) {
  if (!(await stat(path.join(source, file))).isFile()) throw new Error(`Missing ${file}`);
  await link(path.join(source, file), path.join(destination, file));
  count++;
}
console.log(`Prepared ${count} public files in ${destination}`);
