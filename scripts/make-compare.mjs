/* Сравнение «до/после» для мобильной версии: node scripts/make-compare.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, base } = await serve(ROOT);
const browser = await launch();

const shots = [
  { name: '01-hero', sel: '#hero' },
  { name: '02-work', sel: '#work' },
  { name: '03-about', sel: '#about' },
  { name: '04-contact', sel: '#contact' },
];

const W = 390, H = 844;

for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => getComputedStyle(document.getElementById('loader')).display === 'none', null, { timeout: 90000 }).catch(() => {});
  await page.evaluate(sel => {
    const el = document.querySelector(sel);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: 'instant' });
  }, s.sel);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(ROOT, `.shots-mobile/new-${s.name}.png`), timeout: 60000 });
  console.log(s.name);
  await page.close();
}
await browser.close();
server.close();
