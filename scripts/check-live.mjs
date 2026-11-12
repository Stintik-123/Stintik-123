/* Проверка живой личной страницы: node scripts/check-live.mjs */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://stintik-123.github.io/Stintik-123/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const fonts = await page.evaluate(() =>
  [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
);
const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }))
);
const gate = await page.evaluate(() => !!document.querySelector('#gate, #view-stranger, #view-friend'));

console.log('шрифты:', [...new Set(fonts)].join(', '));
console.log('карточек проектов:', await page.$$eval('.project', (n) => n.length));
console.log('картинки:', imgs.every((i) => i.ok) ? 'все загрузились' : JSON.stringify(imgs.filter((i) => !i.ok)));
console.log('старый экран-вход остался:', gate);
console.log('title:', await page.title());
console.log(errors.length ? 'ОШИБКИ: ' + errors.slice(0, 4).join(' | ') : 'консоль чистая');

await page.screenshot({ path: '.shots/live-hero.png' });
await browser.close();
