/* Проверка живой версии на GitHub Pages: node scripts/check-live-mobile.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://stintik-123.github.io/Stintik-123/';

const browser = await launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(
  () => { const l = document.getElementById('loader'); return !l || getComputedStyle(l).display === 'none'; },
  null, { timeout: 120000 }
).catch(() => errors.push('прелоадер не скрылся'));
await page.waitForTimeout(3500);
await page.screenshot({ path: path.join(ROOT, '.shots-mobile/live-hero.png'), timeout: 60000 });

const res = await page.evaluate(() => {
  const mesh = document.getElementById('mesh');
  const gl = document.getElementById('gl');
  const burger = document.getElementById('burger');
  const title = document.querySelector('#heroTitle');
  return {
    url: location.href,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    heroLines: [...document.querySelectorAll('#heroTitle .ln > span')].map(l => Math.round(l.scrollWidth)),
    heroAvail: Math.round(title.getBoundingClientRect().width),
    mesh: mesh ? `${mesh.width}x${mesh.height} opacity=${getComputedStyle(mesh).opacity}` : 'нет',
    gl: gl ? `${gl.width}x${gl.height}` : 'нет',
    burgerVisible: getComputedStyle(burger).display !== 'none',
    bento: document.querySelectorAll('.principles.bento li').length,
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
  };
});

// открыть меню
await page.evaluate(() => document.getElementById('burger').click());
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(ROOT, '.shots-mobile/live-menu.png'), timeout: 60000 });
const menuOpen = await page.evaluate(() => document.getElementById('menu').classList.contains('open'));

console.log(JSON.stringify({ ...res, menuOpen, errors: errors.slice(0, 6) }, null, 1));
await browser.close();
