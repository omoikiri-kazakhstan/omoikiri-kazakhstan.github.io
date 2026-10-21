import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
let changed = 0;
for (const entry of fs.readdirSync(path.join(root, 'product'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, 'product', entry.name, 'index.html');
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(
    /<script type="text\/javascript">jQuery\(function\(\) \{jQuery\.ajax\(\{url: [^\n]*forminator_get_nonce[^\n]*<\/script>/g,
    ''
  );
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}
console.log(`Removed legacy inquiry nonce requests from ${changed} pages`);
