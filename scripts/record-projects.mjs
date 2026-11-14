/* Запись видео для каждого проекта: node scripts/record-projects.mjs
   Кладёт .webm в reel/raw, дальше ffmpeg собирает из них ролик. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'reel', 'raw');
fs.mkdirSync(RAW, { recursive: true });

const TARGETS = [
  { id: 'stintikvpn', url: 'https://stintik-123.github.io/StintikVPN/', title: 'StintikVPN' },
  { id: 'megathread', url: 'https://stintik-123.github.io/MegaThread/', title: 'MegaThread' },
  { id: 'gamevoice', url: 'https://stintik-123.github.io/GameVoice/', title: 'GameVoice' },
  { id: 'steamdeal', url: 'https://stintik-123.github.io/SteamDeal/', title: 'SteamDeal' },
  { id: 'overdrive', url: 'https://github.com/Stintik-123/Overdrive', title: 'Overdrive' },
];

const browser = await launch();

for (const t of TARGETS) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(4000);

    // плавный скролл вниз — сайт живёт за счёт скролл-анимаций
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.55);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo({ top: y, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 1100));
        if (y > window.innerHeight * 2.2) break;
      }
    });
    await page.waitForTimeout(1200);

    // немного назад наверх, чтобы в кадре было начало
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    console.log('записано:', t.id);
  } catch (e) {
    console.log('пропущено:', t.id, '-', e.message.split('\n')[0]);
  }
  await ctx.close();
}

await browser.close();
for (const f of fs.readdirSync(RAW)) {
  const st = fs.statSync(path.join(RAW, f));
  console.log(f, Math.round(st.size / 1024) + ' КБ');
}
