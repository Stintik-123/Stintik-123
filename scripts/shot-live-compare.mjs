/* Скриншот живой версии (для сравнения вариантов): node scripts/shot-live-compare.mjs */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.shots');
fs.mkdirSync(OUT, { recursive: true });

const URL = process.argv[2] || 'https://stintik-123.github.io/Stintik-123/';
const TAG = process.argv[3] || 'live';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(OUT, `live-${TAG}-1.png`) });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, `live-${TAG}-2.png`) });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, `live-${TAG}-3.png`) });
console.log('готово:', URL);
await browser.close();
