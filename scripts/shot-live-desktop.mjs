/* Скриншоты живой версии на десктопе: node scripts/shot-live-desktop.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://stintik-123.github.io/Stintik-123/';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'load' });
await page.waitForFunction(() => getComputedStyle(document.getElementById('loader')).display === 'none', null, { timeout: 120000 }).catch(() => errors.push('loader'));
await page.waitForTimeout(3500);
await page.screenshot({ path: path.join(ROOT, '.shots-mobile/live-desktop.png'), timeout: 60000 });

for (const [sel, name] of [['.principles.bento', 'bento'], ['#contact', 'contact']]) {
  await page.evaluate(s => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); }, sel);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(ROOT, `.shots-mobile/live-${name}.png`), timeout: 60000 });
}
console.log('errors:', errors.length ? errors.slice(0, 5) : 'нет');
await browser.close();
