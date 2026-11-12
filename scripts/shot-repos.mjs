/* Превью проектов без своего сайта (по странице репозитория): node scripts/shot-repos.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'projects');
fs.mkdirSync(OUT, { recursive: true });

// сначала пробуем Pages-сайты, иначе — страница репозитория
const TARGETS = [
  { id: 'steampacc', site: 'https://stintik-123.github.io/SteamPACC/', repo: 'SteamPACC' },
  { id: 'selene', site: 'https://stintik-123.github.io/Selene/', repo: 'Selene' },
  { id: 'streamflix', site: 'https://stintik-123.github.io/streamflix-desktop/', repo: 'streamflix-desktop' },
  { id: 'minimax-code', site: 'https://stintik-123.github.io/minimax-code/', repo: 'minimax-code' },
  { id: 'openmausbot', site: 'https://stintik-123.github.io/OpenMausBot/', repo: 'OpenMausBot' },
];

const browser = await chromium.launch();

for (const t of TARGETS) {
  let used = t.site;
  let page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let ok = false;
  try {
    const resp = await page.goto(t.site, { waitUntil: 'networkidle', timeout: 25000 });
    ok = !!resp && resp.status() < 400 && !(await page.title()).includes('404');
    if (!ok) {
      used = `https://github.com/Stintik-123/${t.repo}`;
      await page.goto(used, { waitUntil: 'networkidle', timeout: 45000 });
      ok = true;
    }
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT, `${t.id}.jpg`),
      type: 'jpeg',
      quality: 76,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
    const kb = Math.round(fs.statSync(path.join(OUT, `${t.id}.jpg`)).size / 1024);
    console.log('ok', t.id, '<-', used, kb + ' КБ');
  } catch (e) {
    console.log('fail', t.id, e.message.slice(0, 60));
  }
  await page.close();
}

await browser.close();
