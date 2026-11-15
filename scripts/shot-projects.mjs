/* Скриншоты страниц проектов: node scripts/shot-projects.mjs */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots-projects');
fs.mkdirSync(OUT, { recursive: true });
const { server, base } = await serve(ROOT);
const browser = await launch();

const views = [
  { name: 'desktop', width: 1440, height: 950, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const pages = [
  ['/projects/index.html', 'list'],
  ['/projects/stintikvpn.html', 'vpn'],
  ['/projects/megathread.html', 'mega'],
  ['/projects/overdrive.html', 'over'],
];

for (const v of views) {
  for (const [url, name] of pages) {
    const page = await browser.newPage({
      viewport: { width: v.width, height: v.height },
      isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: 1.5,
    });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(base + url, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT, `${v.name}-${name}-top.png`), timeout: 60000 });
    // прокрутка к превью
    await page.evaluate(() => {
      const f = document.querySelector('.pframe');
      if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant' });
    });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, `${v.name}-${name}-preview.png`), timeout: 60000 });
    const audit = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      mesh: getComputedStyle(document.getElementById('mesh')).opacity,
      hue: document.body.dataset.hue || '-',
      iframe: document.querySelector('.pframe iframe')?.getAttribute('src') || 'нет',
    }));
    console.log(v.name, name, JSON.stringify(audit), errs.length ? 'ОШИБКИ: ' + errs.slice(0, 2).join(' | ') : 'ошибок нет');
    await page.close();
  }
}
await browser.close();
server.close();
console.log('скриншоты: ' + OUT);
