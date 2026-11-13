/* Локальный сервер + скриншоты личной страницы: node scripts/shot-site.mjs */
import { launch } from './browser.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots');
fs.mkdirSync(OUT, { recursive: true });

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const BASE = `http://127.0.0.1:${port}`;

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
// ждём, пока прелоадер реально уйдёт — на слабой машине таймлайн идёт медленно
await page.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null,
  { timeout: 90000 }
).catch(() => console.log('прелоадер не скрылся'));
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(OUT, '01-hero.png') });
console.log('01-hero');

const shots = [
  ['#work', '02-work.png'],
  ['#about', '03-about.png'],
  ['#hardware', '04-hardware.png'],
  ['#media', '05-media.png'],
  ['#contact', '06-contact.png'],
];
for (const [sel, file] of shots) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), sel);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT, file) });
  console.log(file);
}

// мобильный
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null,
  { timeout: 90000 }
).catch(() => console.log('прелоадер не скрылся'));
await mobile.waitForTimeout(3000);
await mobile.screenshot({ path: path.join(OUT, '07-mobile.png'), timeout: 60000 });
console.log('07-mobile');
await mobile.evaluate(() => document.querySelector('#hardware')?.scrollIntoView());
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: path.join(OUT, '08-mobile-hardware.png') });
console.log('08-mobile-hardware');

const check = await page.evaluate(() => {
  const fonts = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
  const h1 = document.querySelector('.hero-title');
  return {
    fontsLoaded: [...new Set(fonts)],
    h1Font: getComputedStyle(h1).fontFamily,
    cards: document.querySelectorAll('.card').length,
    shots: [...document.querySelectorAll('.card img')].map((i) => ({
      src: i.getAttribute('src'),
      loaded: i.complete && i.naturalWidth > 0,
    })),
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    links: [...document.querySelectorAll('a[href^="http"]')].length,
  };
});
console.log(JSON.stringify(check, null, 1));
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 6).join(' | ') : 'консоль чистая');

await browser.close();
server.close();
