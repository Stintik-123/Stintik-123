/* Проверка, что ролик в секции Showreel реально играет: node scripts/check-live-reel.mjs */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://stintik-123.github.io/Stintik-123/';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL + '?t=' + Date.now(), { waitUntil: 'load' });
await page.waitForFunction(() => getComputedStyle(document.getElementById('loader')).display === 'none', null, { timeout: 120000 }).catch(() => errors.push('loader'));
await page.waitForTimeout(2000);

// доскроллить до рела
await page.evaluate(() => {
  const el = document.getElementById('reel');
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' });
});
await page.waitForTimeout(9000);

const st = await page.evaluate(() => {
  const v = document.getElementById('reelVideo');
  const media = document.getElementById('reelMedia');
  return {
    hasVideoClass: media.classList.contains('has-video'),
    readyState: v.readyState,
    currentTime: +v.currentTime.toFixed(2),
    duration: Math.round(v.duration || 0),
    paused: v.paused,
    videoOpacity: getComputedStyle(v).opacity,
    videoSize: `${v.videoWidth}x${v.videoHeight}`,
    src: v.currentSrc.split('/').pop(),
  };
});
await page.screenshot({ path: path.join(ROOT, '.shots-mobile/live-reel.png'), timeout: 60000 });
console.log(JSON.stringify({ ...st, errors: errors.slice(0, 5) }, null, 1));
await browser.close();
