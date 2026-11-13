/* Проверка интерактива личной страницы: node scripts/check-site.mjs */
import { launch } from './browser.mjs';
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

const browser = await launch();
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
// прелоадер живёт на таймлайне — дожидаемся, пока он уйдёт
await page.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null,
  { timeout: 90000 }
).catch(() => {});
await page.waitForTimeout(1500);

check((await page.$$('.card')).length === 5, '5 карточек проектов');

const sections = await page.evaluate(() =>
  ['hero', 'work', 'reel', 'about', 'hardware', 'media', 'stack', 'contact'].filter(
    (id) => !document.getElementById(id)
  )
);
check(sections.length === 0, 'все разделы на месте' + (sections.length ? ', нет: ' + sections.join(', ') : ''));

const fonts = await page.evaluate(() =>
  [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
);
check(fonts.includes('Unbounded'), 'Unbounded загружен');
check(fonts.includes('JetBrains Mono'), 'JetBrains Mono загружен');

// CSS и JS вынесены в отдельные файлы
const split = await page.evaluate(() => ({
  css: !!document.querySelector('link[href^="css/"]'),
  js: !!document.querySelector('script[src^="js/"]'),
  inlineStyle: document.querySelectorAll('style').length,
  inlineModule: document.querySelectorAll('script:not([src])[type="module"]').length,
}));
check(split.css && split.js, 'стили и скрипты в отдельных файлах');
check(split.inlineStyle === 0 && split.inlineModule === 0, 'в index.html нет инлайновых стилей и модулей');

// превью проектов (грузятся лениво — сначала прокручиваем страницу)
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
});
await page.waitForTimeout(1200);
const broken = await page.evaluate(() =>
  [...document.querySelectorAll('.card img')].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src)
);
check(broken.length === 0, 'превью проектов загрузились' + (broken.length ? ': ' + broken.join(', ') : ''));

// личная информация
const personal = await page.evaluate(() => {
  const t = document.body.innerText;
  const counts = [...document.querySelectorAll('[data-count]')].map((el) => el.dataset.count);
  return {
    about: t.includes('Стинт') && t.includes('Ульяновск'),
    since2016: t.includes('2016'),
    counts,
    tg: t.includes('@Keb04w'),
    reddit: t.includes('u/Stintik_Official'),
    mail: t.includes('stintikvpn@proton.me'),
    hardware: !!document.querySelector('#hardware .spec-grid > div'),
    media: document.querySelectorAll('#media .plain-list li').length,
  };
});
check(personal.about && personal.since2016, 'личная информация: имя, город, с 2016');
check(personal.counts.includes('12') && personal.counts.includes('1847'), 'личная информация: цифры проектов и ссылок');
check(personal.tg && personal.reddit && personal.mail, 'личная информация: соцсети и почта');
check(personal.hardware, 'раздел «Железо» есть');
check(personal.media >= 6, 'раздел «Игры и кино» есть: ' + personal.media + ' пунктов');

// 3D-канвас
const gl = await page.evaluate(() => {
  const c = document.querySelector('#gl');
  return { w: c ? c.width : 0, h: c ? c.height : 0 };
});
check(gl.w > 0 && gl.h > 0, '3D-канвас инициализирован (' + gl.w + 'x' + gl.h + ')');

// копирование почты
await page.evaluate(() => {
  window.__copied = null;
  navigator.clipboard.writeText = async (t) => { window.__copied = t; };
});
await page.click('#mail');
await page.waitForTimeout(400);
const copied = await page.evaluate(() => window.__copied);
const toastOn = await page.evaluate(() => document.querySelector('#toast')?.classList.contains('on'));
check(copied === 'stintikvpn@proton.me', 'почта копируется');
check(toastOn, 'показывается уведомление');

// переход по якорю
await page.click('a[href="#contact"]');
await page.waitForTimeout(1200);
const contactVisible = await page.evaluate(() => {
  const el = document.querySelector('#contact');
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
});
check(contactVisible, 'переход по якорю работает');

// мобильный: меню и отсутствие горизонтального скролла
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await mobile.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null,
  { timeout: 90000 }
).catch(() => {});
await mobile.waitForTimeout(1200);
await mobile.click('#burger');
await mobile.waitForTimeout(500);
const navOpen = await mobile.evaluate(() => document.querySelector('#menu')?.classList.contains('open'));
check(navOpen, 'мобильное меню открывается');
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check(!overflow, 'нет горизонтального скролла на мобильном');
const mobileSections = await mobile.evaluate(() =>
  ['hardware', 'media', 'contact'].every((id) => !!document.getElementById(id))
);
check(mobileSections, 'новые разделы доступны на мобильном');

// внешние ссылки
const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href));
check(links.length >= 12, 'внешних ссылок: ' + links.length);
check(links.every((l) => l.startsWith('https://')), 'все ссылки по https');

check(errors.length === 0, 'консоль без ошибок' + (errors.length ? ': ' + errors[0] : ''));

console.log(`\nПройдено: ${pass} из ${pass + fail}`);
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
