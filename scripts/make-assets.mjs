/* Превью Overdrive (GitHub) + OG-картинка: node scripts/make-assets.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJ = path.join(ROOT, 'assets', 'projects');
fs.mkdirSync(PROJ, { recursive: true });

const browser = await chromium.launch();

/* ---------- превью Overdrive: страница GitHub ---------- */
const og = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await og.goto('https://github.com/Stintik-123/Overdrive', { waitUntil: 'networkidle', timeout: 60000 });
await og.waitForTimeout(2500);
await og.screenshot({ path: path.join(PROJ, 'overdrive.png') });
console.log('overdrive.png');
await og.close();

/* ---------- OG-картинка ---------- */
const OG_HTML = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #08080a; color: #f4f4f1;
    font-family: 'Inter Tight', 'Inter', system-ui, sans-serif;
  }
  .grid { position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(244,244,241,.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244,244,241,.07) 1px, transparent 1px);
    background-size: 60px 60px; }
  .glow { position: absolute; top: -220px; left: 50%; transform: translateX(-50%);
    width: 900px; height: 600px;
    background: radial-gradient(50% 50% at 50% 50%, rgba(255,75,43,.20), transparent 70%);
    filter: blur(10px); }
  .frame { position: absolute; inset: 34px; border: 1px solid rgba(244,244,241,.16); }
  .content { position: relative; height: 100%; padding: 78px 84px;
    display: flex; flex-direction: column; justify-content: center; gap: 26px; }
  .kicker { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 15px;
    letter-spacing: .26em; text-transform: uppercase; color: #7d7d76;
    display: flex; align-items: center; gap: 12px; }
  .kicker::before { content: ''; width: 30px; height: 1px; background: #ff4b2b; }
  h1 { font-size: 82px; line-height: .98; letter-spacing: -.035em; font-weight: 600; max-width: 15ch; }
  h1 em { font-style: normal; color: #ff4b2b; }
  .lead { font-family: 'Inter', system-ui, sans-serif; font-size: 22px; line-height: 1.5;
    color: #b9b9b2; max-width: 30ch; }
  .mark { position: absolute; top: 78px; right: 84px; width: 40px; height: 40px;
    border: 1px solid rgba(244,244,241,.34); display: grid; place-items: center;
    font-size: 20px; font-weight: 600; }
  .foot { position: absolute; left: 84px; right: 84px; bottom: 78px;
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 14px;
    letter-spacing: .12em; text-transform: uppercase; color: #7d7d76;
    border-top: 1px solid rgba(244,244,241,.12); padding-top: 20px; }
  .foot b { color: #ff4b2b; font-weight: 500; }
</style></head>
<body>
  <div class="grid"></div>
  <div class="glow"></div>
  <div class="frame"></div>
  <div class="mark">s</div>
  <div class="content">
    <div class="kicker">Stintik · Ульяновск</div>
    <h1>Интернет <em>ближе</em>, чем кажется</h1>
    <div class="lead">Бесплатные инструменты для доступа к информации. Без рекламы, аккаунтов и подписок.</div>
  </div>
  <div class="foot">
    <span>VPN · Каталоги · Озвучки игр</span>
    <span><b>stintik-123</b>.github.io</span>
  </div>
</body></html>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(OG_HTML, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(ROOT, 'assets', 'og.png') });
console.log('assets/og.png');
await page.close();

await browser.close();
