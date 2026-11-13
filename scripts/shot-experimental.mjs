/* Скриншоты интро и терминала: node scripts/shot-experimental.mjs */
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
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '10-intro.png') });
console.log('10-intro');

// пропустить интро
await page.click('#intro').catch(() => {});
await page.waitForTimeout(3500);
await page.screenshot({ path: path.join(OUT, '11-after-intro.png') });
console.log('11-after-intro');

// терминал
await page.keyboard.press('~');
await page.waitForTimeout(700);
await page.fill('#termInput', 'neofetch');
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
await page.fill('#termInput', 'cat gamevoice');
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, '12-terminal.png') });
console.log('12-terminal');

// секция активности
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('#live')?.scrollIntoView());
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, '13-live.png') });
console.log('13-live');

const state = await page.evaluate(() => ({
  introGone: document.querySelector('#intro')?.classList.contains('is-gone'),
  canvasSize: (() => {
    const c = document.querySelector('#introCanvas');
    return c ? c.width + 'x' + c.height : 'нет';
  })(),
  graphLoaded: document.querySelector('#liveGraph')?.classList.contains('is-loaded'),
  counters: [...document.querySelectorAll('[data-count]')].map((n) => n.textContent),
  clock: document.querySelector('#liveClock')?.textContent,
}));
console.log(JSON.stringify(state, null, 1));
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 5).join(' | ') : 'консоль чистая');

await browser.close();
server.close();
