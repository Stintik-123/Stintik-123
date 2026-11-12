/* Скриншоты проектов для витрины: node scripts/shot-projects.mjs
   Кладёт превью в assets/projects/ в JPEG (вес в ~5 раз меньше PNG). */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'projects');
fs.mkdirSync(OUT, { recursive: true });

const PROJECTS = [
  { id: 'stintikvpn', url: 'https://stintik-123.github.io/StintikVPN/', name: 'StintikVPN' },
  { id: 'megathread', url: 'https://stintik-123.github.io/MegaThread/', name: 'MegaThread' },
  { id: 'gamevoice', url: 'https://stintik-123.github.io/GameVoice/', name: 'GameVoice' },
  { id: 'steamdeal', url: 'https://stintik-123.github.io/SteamDeal/', name: 'SteamDeal' },
  { id: 'overdrive', url: 'https://github.com/Stintik-123/Overdrive', name: 'Overdrive' },
];

const browser = await chromium.launch();

for (const p of PROJECTS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(OUT, `${p.id}.jpg`),
      type: 'jpeg',
      quality: 76,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
    const kb = Math.round(fs.statSync(path.join(OUT, `${p.id}.jpg`)).size / 1024);
    console.log('ok', p.id, kb + ' КБ');
  } catch (e) {
    console.log('fail', p.id, e.message.slice(0, 80));
  }
  await page.close();
}

await browser.close();
