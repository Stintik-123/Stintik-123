/* Проверка живого сайта после пуша: node scripts/check-live.mjs */
import { launch } from './browser.mjs';
const S = 'https://stintik-123.github.io/Stintik-123';
const browser = await launch();
let bad = 0;
const urls = ['/', '/projects/', '/projects/stintikvpn.html', '/projects/megathread.html',
  '/projects/gamevoice.html', '/projects/steamdeal.html', '/projects/overdrive.html'];
for (const v of [{ n: 'desktop', w: 1440, h: 900, m: false }, { n: 'mobile', w: 390, h: 844, m: true }]) {
  for (const u of urls) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, isMobile: v.m, hasTouch: v.m });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(S + u, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const ok = errs.length === 0 && !over;
    if (!ok) bad++;
    console.log(`${ok ? ' ok ' : 'FAIL'} ${v.n} ${u}${errs.length ? ' · ' + errs[0].slice(0, 90) : ''}${over ? ' · горизонтальный скролл' : ''}`);
    await page.close();
  }
}
await browser.close();
console.log(bad ? `\nПроблем: ${bad}` : '\nВсё чисто');
process.exit(bad ? 1 : 0);
