/* Мобильная проверка интро и терминала: node scripts/shot-mobile-experimental.mjs */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots');
fs.mkdirSync(OUT, { recursive: true });

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '14-mobile-intro.png') });
console.log('14-mobile-intro');

await page.click('#intro').catch(() => {});
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(OUT, '15-mobile-hero.png') });
console.log('15-mobile-hero');

// терминал на мобильном — через плавающую кнопку
await page.click('#termFab').catch(() => {});
await page.waitForTimeout(700);
await page.fill('#termInput', 'projects');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, '16-mobile-terminal.png') });
console.log('16-mobile-terminal');

const state = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  termOpen: document.querySelector('#terminal')?.classList.contains('is-open'),
  introGone: document.querySelector('#intro')?.classList.contains('is-gone'),
}));
console.log(JSON.stringify(state));
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 5).join(' | ') : 'консоль чистая');

await browser.close();
server.close();
