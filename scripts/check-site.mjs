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

await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
// прелоадер живёт на таймлайне — дожидаемся, пока он уйдёт
await page.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null,
  { timeout: 90000 }
).catch(() => {});
await page.waitForTimeout(1500);

check((await page.$$('.card')).length === 5, '5 карточек проектов');

const sections = await page.evaluate(() =>
  ['hero', 'identity', 'work', 'reel', 'about', 'hardware', 'media', 'stack', 'path', 'faq', 'contact'].filter(
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
    since2020: t.includes('2020'),
    counts,
    tg: t.includes('@Keb04w'),
    reddit: t.includes('u/Stintik_Official'),
    mail: t.includes('stintikvpn@proton.me'),
    hardware: !!document.querySelector('#hardware .spec-grid > div'),
    media: document.querySelectorAll('#media .plain-list li').length,
  };
});
check(personal.about && personal.since2020, 'личная информация: имя, город, с 2020');
check(personal.counts.includes('12') && personal.counts.includes('1847'), 'личная информация: цифры проектов и ссылок');
check(personal.tg && personal.reddit && personal.mail, 'личная информация: соцсети и почта');
check(personal.hardware, 'раздел «Железо» есть');
check(personal.media >= 6, 'раздел «Игры и кино» есть: ' + personal.media + ' пунктов');

// карта ников, путь и вопросы
const hub = await page.evaluate(() => ({
  cards: document.querySelectorAll('.id-card').length,
  covers: document.querySelectorAll('.id-cover').length,
  path: document.querySelectorAll('.path-list li').length,
  faq: document.querySelectorAll('.faq-list > div').length,
  navLinks: document.querySelectorAll('.nav-links a').length,
  nested: document.querySelectorAll('.id-card a .id-card').length,
}));
check(hub.cards >= 7, 'карточка ников: ' + hub.cards);
check(hub.covers === hub.cards, 'ссылок в карточках: ' + hub.covers + ' из ' + hub.cards);
check(hub.path >= 4, 'хронология: ' + hub.path + ' пунктов');
check(hub.faq >= 6, 'вопросов-ответов: ' + hub.faq);
check(hub.navLinks === 9, 'пунктов в навигации: ' + hub.navLinks);
check(hub.nested === 0, 'нет вложенных ссылок');

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
await mobile.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
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

// ---------- отдельные страницы проектов ----------
const SLUGS = ['stintikvpn', 'megathread', 'gamevoice', 'steamdeal', 'overdrive'];
const listPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await listPage.goto(BASE + '/projects/index.html', { waitUntil: 'domcontentloaded' });
await listPage.waitForTimeout(900);
const listInfo = await listPage.evaluate(() => ({
  cards: document.querySelectorAll('.plist-card').length,
  hrefs: [...document.querySelectorAll('.plist-card')].map((a) => a.getAttribute('href')),
}));
check(listInfo.cards === 5, 'обзор проектов: ' + listInfo.cards + ' карточек');
check(
  listInfo.hrefs.every((h) => fs.existsSync(path.join(ROOT, 'projects', h))),
  'все карточки обзора ведут на существующие страницы'
);

for (const slug of SLUGS) {
  const pp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const perr = [];
  pp.on('pageerror', (e) => perr.push(String(e)));
  await pp.goto(`${BASE}/projects/${slug}.html`, { waitUntil: 'domcontentloaded' });
  await pp.waitForTimeout(800);
  const info = await pp.evaluate(() => ({
    title: document.querySelector('.ptitle')?.textContent.trim() || '',
    lead: !!document.querySelector('.plead'),
    tags: document.querySelectorAll('.ptags i').length,
    stats: document.querySelectorAll('.pstats div').length,
    cols: document.querySelectorAll('.pcols h2').length,
    items: document.querySelectorAll('.pcols li').length,
    frame: !!document.querySelector('.pframe'),
    iframe: document.querySelector('.pframe iframe')?.getAttribute('src') || document.querySelector('.pframe iframe')?.dataset.src || '',
    next: !!document.querySelector('[data-nav="next"]'),
    prev: !!document.querySelector('[data-nav="prev"]'),
    hue: document.body.dataset.hue,
    nav: document.querySelectorAll('.pnav-links a').length,
  }));
  const ok =
    info.title.length > 3 && info.lead && info.tags >= 2 && info.stats === 3 &&
    info.cols === 2 && info.items >= 4 && info.frame && info.next && info.prev &&
    info.nav === 5 && info.hue !== undefined && perr.length === 0;
  check(ok, `страница проекта ${slug}: ${info.title.replace(/\s+/g, ' ')} · ${info.tags} тега · ${info.stats} цифры${perr.length ? ' · JS: ' + perr[0] : ''}`);
  if (slug !== 'overdrive') {
    const pv = await pp.evaluate(() => {
      const f = document.querySelector('.pframe iframe');
      f?.scrollIntoView();
      return f?.getAttribute('src') || '';
    });
    check(pv.startsWith('https://stintik-123.github.io/'), `живое превью ${slug}: ${pv.replace('https://', '') || 'нет src'}`);
  }
  await pp.close();
}

// мобильная страница проекта без горизонтального скролла
const pmob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await pmob.goto(BASE + '/projects/stintikvpn.html', { waitUntil: 'domcontentloaded' });
await pmob.waitForTimeout(900);
const pOver = await pmob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check(!pOver, 'страница проекта без горизонтального скролла на мобильном');
await pmob.close();
await listPage.close();

// ---------- палитра команд (⌘K) ----------
await page.keyboard.press('Control+k');
await page.waitForTimeout(500);
const palOpen = await page.evaluate(() => document.getElementById('cmdk')?.classList.contains('open'));
check(palOpen, 'палитра открывается по Ctrl+K');
await page.fill('#cmdk-input', 'reddit');
await page.waitForTimeout(400);
const palRes = await page.evaluate(() => ({
  n: document.querySelectorAll('.cmdk-item').length,
  first: document.querySelector('.cmdk-item b')?.textContent || '',
}));
check(palRes.n > 0 && /reddit/i.test(palRes.first), 'поиск в палитре находит reddit: ' + palRes.first);
await page.fill('#cmdk-input', 'vpn');
await page.waitForTimeout(300);
const palProj = await page.evaluate(() => [...document.querySelectorAll('.cmdk-item b')].map((b) => b.textContent));
check(palProj.some((t) => /StintikVPN/i.test(t)), 'палитра находит проект StintikVPN');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const palClosed = await page.evaluate(() => !document.getElementById('cmdk')?.classList.contains('open'));
check(palClosed, 'палитра закрывается по Escape');

// внешние ссылки
const links = await page.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href));
check(links.length >= 12, 'внешних ссылок: ' + links.length);
check(links.every((l) => l.startsWith('https://')), 'все ссылки по https');

check(errors.length === 0, 'консоль без ошибок' + (errors.length ? ': ' + errors[0] : ''));

console.log(`\nПройдено: ${pass} из ${pass + fail}`);
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
