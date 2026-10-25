import { chmodSync, existsSync, openSync, writeFileSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const required = [
  'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD',
  'ADMIN_LOGIN', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET',
  'TURNSTILE_SECRET', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`PHP configuration not written; missing: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  const config = Object.fromEntries(required.map((name) => [name, process.env[name]]));
  config.TIPTOP_PAYMENTS_ENABLED = 'false';
  if (process.env.STOCK_SYNC_TOKEN) config.STOCK_SYNC_TOKEN = process.env.STOCK_SYNC_TOKEN;
  const target = path.join(appRoot, 'php-poc', 'config.local.php');
  if (existsSync(target)) {
    console.error('PHP configuration already exists; refusing to overwrite it.');
    process.exitCode = 1;
  } else {
    const encoded = Buffer.from(JSON.stringify(config)).toString('base64');
    const body = `<?php\ndeclare(strict_types=1);\nreturn json_decode(base64_decode('${encoded}'), true, 512, JSON_THROW_ON_ERROR);\n`;
    const fd = openSync(target, 'wx', 0o600);
    try {
      writeFileSync(fd, body);
    } finally {
      closeSync(fd);
    }
    chmodSync(target, 0o600);
    console.log('Private PHP configuration created.');
  }
}
