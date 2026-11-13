/* Заглушка вместо фото: node scripts/make-photo.mjs
   Кладёт в assets/photo.jpg абстрактную тёмно-оранжевую картинку 800x1000.
   Замени файл своим снимком — он подхватится автоматически. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'photo.jpg');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });

await page.setContent(`<!doctype html><html><body style="margin:0">
<canvas id="c" width="800" height="1000"></canvas>
<script>
  const c = document.getElementById('c'), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 800, 1000);
  g.addColorStop(0, '#161013'); g.addColorStop(0.55, '#241210'); g.addColorStop(1, '#0b0b0c');
  x.fillStyle = g; x.fillRect(0, 0, 800, 1000);
  const r = x.createRadialGradient(240, 260, 10, 240, 260, 520);
  r.addColorStop(0, 'rgba(255,90,31,.55)'); r.addColorStop(1, 'rgba(255,90,31,0)');
  x.fillStyle = r; x.fillRect(0, 0, 800, 1000);
  x.globalAlpha = 0.14;
  x.strokeStyle = '#ffffff'; x.lineWidth = 1;
  for (let i = 0; i < 40; i++) { x.beginPath(); x.moveTo(0, i * 25); x.lineTo(800, i * 25 - 120); x.stroke(); }
  x.globalAlpha = 1;
  x.fillStyle = 'rgba(11,11,12,.75)';
  x.font = '600 260px Unbounded, Arial, sans-serif';
  x.textAlign = 'center';
  x.fillText('S', 400, 590);
</script></body></html>`);

await page.waitForTimeout(600);
await page.locator('#c').screenshot({ path: OUT, type: 'jpeg', quality: 82 });
await browser.close();
console.log('готово:', OUT, fs.statSync(OUT).size, 'байт');
