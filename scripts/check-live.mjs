/* Проверка живой личной страницы: node scripts/check-live.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'https://stintik-123.github.io/Stintik-123/';
fs.mkdirSync('.shots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

const fonts = await page.evaluate(() =>
  [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
);
const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('.card img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }))
);
const sections = await page.evaluate(() =>
  ['hero', 'work', 'reel', 'about', 'hardware', 'media', 'stack', 'contact'].filter((id) => !document.getElementById(id))
);
const split = await page.evaluate(() => ({
  css: !!document.querySelector('link[href^="css/"]'),
  js: !!document.querySelector('script[src^="js/"]'),
}));
const gl = await page.evaluate(() => { const c = document.querySelector('#gl'); return c ? c.width + 'x' + c.height : 'нет'; });
const text = await page.evaluate(() => document.body.innerText);

console.log('шрифты:', [...new Set(fonts)].join(', '));
console.log('карточек проектов:', await page.$$eval('.card', (n) => n.length));
console.log('картинки:', imgs.every((i) => i.ok) ? 'все загрузились' : JSON.stringify(imgs.filter((i) => !i.ok)));
console.log('разделы отсутствуют:', sections.length ? sections.join(', ') : 'нет');
console.log('css/js отдельными файлами:', split.css && split.js);
console.log('3D-канвас:', gl);
console.log('личная информация:', /Стинт/.test(text) && /Ульяновск/.test(text) && /@Keb04w/.test(text) ? 'есть' : 'нет');
console.log('title:', await page.title());
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 4).join(' | ') : 'консоль чистая');

await page.screenshot({ path: '.shots/live-hero.png' });
await page.evaluate(() => document.querySelector('#hardware')?.scrollIntoView());
await page.waitForTimeout(1500);
await page.screenshot({ path: '.shots/live-hardware.png' });
await browser.close();
