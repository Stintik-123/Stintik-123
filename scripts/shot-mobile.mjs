/* Проверка мобильной вёрстки: скриншоты + аудит.
   node scripts/shot-mobile.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots-mobile');
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  { name: 'iphone-se', width: 375, height: 667, dpr: 1.5 },
  { name: 'iphone-12', width: 390, height: 844, dpr: 1.5 },
  { name: 'android', width: 412, height: 915, dpr: 1.5 },
];

const SECTIONS = [
  ['#hero', 'hero'],
  ['#work', 'work'],
  ['#reel', 'reel'],
  ['#about', 'about'],
  ['#hardware', 'hardware'],
  ['#media', 'media'],
  ['#stack', 'stack'],
  ['#contact', 'contact'],
];

const { server, base } = await serve(ROOT);
const browser = await launch();
const report = [];

for (const dev of DEVICES) {
  const ctx = await browser.newContext({
    viewport: { width: dev.width, height: dev.height },
    deviceScaleFactor: dev.dpr,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(base + '/index.html', { waitUntil: 'load' });

  // прелоадер живёт на таймлайне — в софтверном рендере он идёт медленно, ждём реально
  await page.waitForFunction(
    () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
    null,
    { timeout: 90000 }
  ).catch(() => errors.push('прелоадер не скрылся'));
  await page.waitForTimeout(2500);

  for (const [sel, name] of SECTIONS) {
    await page.evaluate(s => {
      const el = document.querySelector(s);
      if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
    }, sel);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, `${dev.name}-${name}.png`) });
  }

  // открытое меню
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.evaluate(() => document.getElementById('burger').click());
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, `${dev.name}-menu.png`) });
  await page.evaluate(() => document.getElementById('burger').click());
  await page.waitForTimeout(900);

  const audit = await page.evaluate(() => {
    const vw = window.innerWidth;
    const de = document.documentElement;

    // элементы, которые вылезают за экран по горизонтали
    const overflow = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 1.5 || r.left < -1.5) {
        const st = getComputedStyle(el);
        if (st.position === 'fixed' || st.visibility === 'hidden' || st.opacity === '0') return;
        overflow.push({
          sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
          left: Math.round(r.left), right: Math.round(r.right),
        });
      }
    });

    // мелкие тач-таргеты
    const small = [];
    document.querySelectorAll('a, button').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height < 40 && !el.closest('.menu, .nav-links, .principles, .links, .plain-list, .rows, footer')) {
        small.push({ sel: el.tagName.toLowerCase() + (el.textContent || '').trim().slice(0, 18), h: Math.round(r.height) });
      }
    });

    const hero = document.querySelector('#heroTitle');
    const heroLine = document.querySelector('#heroTitle .ln > span');
    return {
      vw,
      docScrollW: de.scrollWidth,
      pageOverflowX: de.scrollWidth > vw + 1,
      overflow: overflow.slice(0, 12),
      small: small.slice(0, 12),
      heroTitleW: hero ? Math.round(hero.getBoundingClientRect().width) : 0,
      heroLineW: heroLine ? Math.round(heroLine.scrollWidth) : 0,
      heroOverflow: heroLine ? heroLine.scrollWidth > heroLine.clientWidth + 1 : false,
      navH: Math.round(document.querySelector('#nav').getBoundingClientRect().height),
      meshOpacity: getComputedStyle(document.getElementById('mesh')).opacity,
      meshSize: (() => { const c = document.getElementById('mesh'); return c ? c.width + 'x' + c.height : 'нет'; })(),
      glSize: (() => { const c = document.getElementById('gl'); return c ? c.width + 'x' + c.height : 'нет'; })(),
      fontLoaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i),
    };
  });

  report.push({ device: dev.name, ...audit, errors: errors.slice(0, 5) });
  await ctx.close();
}

console.log(JSON.stringify(report, null, 1));
await browser.close();
server.close();
