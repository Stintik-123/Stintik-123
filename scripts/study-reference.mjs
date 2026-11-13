/* Изучает референс: node scripts/study-reference.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots');
fs.mkdirSync(OUT, { recursive: true });

const URL = process.argv[2] || 'https://directoryyy.com/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const requests = [];
page.on('request', (r) => requests.push(r.url()));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);

await page.screenshot({ path: path.join(OUT, 'ref-top.png') });
console.log('ref-top');

// что за библиотеки грузятся
const libs = [...new Set(requests)].filter((u) => /\.(js|mjs)(\?|$)/.test(u));
console.log('\n=== скрипты ===');
for (const l of libs.slice(0, 25)) console.log(' ', l.slice(0, 130));

console.log('\n=== шрифты ===');
for (const l of [...new Set(requests)].filter((u) => /\.(woff2?|ttf|otf)(\?|$)/.test(u)).slice(0, 15)) {
  console.log(' ', l.slice(0, 120));
}

const info = await page.evaluate(() => ({
  title: document.title,
  desc: document.querySelector('meta[name="description"]')?.content || '',
  canvases: document.querySelectorAll('canvas').length,
  videos: document.querySelectorAll('video').length,
  svgs: document.querySelectorAll('svg').length,
  sections: document.querySelectorAll('section').length,
  bodyText: document.body.innerText.slice(0, 900),
}));
console.log('\n=== инфо ===');
console.log(JSON.stringify(info, null, 1));

await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'ref-mid.png') });
console.log('ref-mid');

await page.evaluate(() => window.scrollTo(0, 3000));
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'ref-deep.png') });
console.log('ref-deep');

await browser.close();
