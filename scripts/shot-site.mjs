/* Локальный сервер + скриншоты личной страницы: node scripts/shot-site.mjs */
import { chromium } from 'playwright';
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '01-hero.png') });
console.log('01-hero');

// прокрутить всю страницу, чтобы отработал IntersectionObserver
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 220));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 700));
});

await page.screenshot({ path: path.join(OUT, '02-full.png'), fullPage: true });
console.log('02-full');

// скролл к проектам
await page.evaluate(() => document.querySelector('#projects')?.scrollIntoView());
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, '03-projects.png') });
console.log('03-projects');

// мобильный
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: path.join(OUT, '04-mobile.png') });
console.log('04-mobile');

// проверки
const check = await page.evaluate(() => {
  const fonts = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
  const h1 = document.querySelector('.hero-title');
  return {
    fontsLoaded: [...new Set(fonts)],
    h1Font: getComputedStyle(h1).fontFamily,
    h1Size: getComputedStyle(h1).fontSize,
    projects: document.querySelectorAll('.project').length,
    shots: [...document.querySelectorAll('.project-shot img')].map((i) => ({
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
