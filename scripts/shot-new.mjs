/* Скриншоты новых секций: node scripts/shot-new.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { server, base } = await serve(ROOT);
const browser = await launch();

const views = [
  { name: 'desktop', width: 1440, height: 950, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const sections = [['#identity', 'identity'], ['#path', 'path'], ['#faq', 'faq'], ['#contact', 'contact']];

for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, isMobile: v.mobile, hasTouch: v.mobile, deviceScaleFactor: 1.5 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => getComputedStyle(document.getElementById('loader')).display === 'none', null, { timeout: 90000 }).catch(() => {});
  for (const [sel, name] of sections) {
    await page.evaluate(s => {
      const el = document.querySelector(s);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'instant' });
    }, sel);
    await page.waitForTimeout(2400);
    await page.screenshot({ path: path.join(ROOT, `.shots-mobile/new-${v.name}-${name}.png`), timeout: 60000 });
  }
  const audit = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    navLinks: document.querySelectorAll('.nav-links a').length,
    idCards: document.querySelectorAll('.id-card').length,
    faq: document.querySelectorAll('.faq-list > div').length,
    path: document.querySelectorAll('.path-list li').length,
    labels: [...document.querySelectorAll('.label')].map(l => l.textContent.trim().replace(/\s+/g, ' ')),
  }));
  console.log(v.name, JSON.stringify(audit), 'errors:', errs.length ? errs.slice(0, 3) : 'нет');
  await page.close();
}
await browser.close();
server.close();
