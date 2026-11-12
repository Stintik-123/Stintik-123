/* Проверка интерактива личной страницы: node scripts/check-site.mjs */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

let pass = 0;
let fail = 0;
const check = (ok, name) => {
  console.log(ok ? `  [ ok ] ${name}` : `  [FAIL] ${name}`);
  ok ? pass++ : fail++;
};

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

check((await page.$$('.project')).length === 5, '5 карточек проектов');
check((await page.$$('.hero-meta dd')).length === 4, '4 метрики в hero');

const fonts = await page.evaluate(() =>
  [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
);
check(fonts.includes('Inter Tight'), 'Inter Tight загружен');
check(fonts.includes('JetBrains Mono'), 'JetBrains Mono загружен');

const broken = await page.evaluate(() =>
  [...document.querySelectorAll('img')].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src)
);
check(broken.length === 0, 'все превью загрузились' + (broken.length ? ': ' + broken.join(', ') : ''));

// появление блоков при скролле
await page.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 260));
  }
});
await page.waitForTimeout(900);
const total = await page.evaluate(() => document.querySelectorAll('.reveal').length);
const revealed = await page.evaluate(() => document.querySelectorAll('.reveal.is-in').length);
check(revealed === total, `все блоки появились при скролле (${revealed}/${total})`);

// без JS контент должен быть виден
const noJs = await browser.newPage({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
await noJs.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
await noJs.waitForTimeout(400);
const visibleNoJs = await noJs.evaluate(() => {
  const el = document.querySelector('.project-desc');
  return el ? getComputedStyle(el.closest('.reveal') || el).opacity : '0';
});
check(visibleNoJs === '1', 'без JS контент виден (opacity ' + visibleNoJs + ')');
await noJs.close();

// активная навигация: при прокрутке к разделу подсвечивается его пункт
await page.evaluate(() => {
  document.querySelector('#projects')?.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(900);
const active = await page.evaluate(
  () => document.querySelector('#nav a.is-active')?.getAttribute('href') || ''
);
check(active === '#projects', 'активный пункт навигации: ' + active);

// якорь
await page.click('a[href="#contact"]');
await page.waitForTimeout(900);
const contactVisible = await page.evaluate(() => {
  const el = document.querySelector('#contact');
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
});
check(contactVisible, 'переход по якорю работает');

// копирование почты
await page.evaluate(() => {
  window.__copied = null;
  navigator.clipboard.writeText = async (t) => { window.__copied = t; };
});
await page.click('#copyMail');
await page.waitForTimeout(400);
const copied = await page.evaluate(() => window.__copied);
const noteOn = await page.evaluate(() => document.querySelector('#copyNote')?.classList.contains('is-on'));
check(copied === 'stintikvpn@proton.me', 'почта копируется');
check(noteOn, 'показывается уведомление');

// мобильное меню
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(800);
await mobile.click('#burger');
await mobile.waitForTimeout(400);
const navOpen = await mobile.evaluate(
  () => document.querySelector('#nav')?.classList.contains('is-open')
);
check(navOpen, 'мобильное меню открывается');
const overflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth
);
check(!overflow, 'нет горизонтального скролла на мобильном');

// внешние ссылки
const links = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href)
);
check(links.length >= 14, 'внешних ссылок: ' + links.length);
check(links.every((l) => l.startsWith('https://')), 'все ссылки по https');

check(errors.length === 0, 'консоль без ошибок' + (errors.length ? ': ' + errors[0] : ''));

console.log(`\nПройдено: ${pass} из ${pass + fail}`);
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
