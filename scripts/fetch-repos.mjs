/* Описания всех репозиториев через og-теги: node scripts/fetch-repos.mjs */
import { chromium } from 'playwright';

const REPOS = [
  'Stintik-123', 'StintikVPN', 'MegaThread', 'GameVoice', 'SteamDeal',
  'Overdrive', 'SteamPACC', 'Selene', 'OpenMausBot', 'streamflix-desktop',
  'SteamDealBot', 'minimax-code',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

for (const repo of REPOS) {
  try {
    await page.goto(`https://github.com/Stintik-123/${repo}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => {
      const meta = (n) => document.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content || '';
      const lang = document.querySelector('.BorderGrid-cell .color-fg-default.text-bold.mr-1')?.textContent?.trim() || '';
      const topics = [...document.querySelectorAll('.topic-tag')].map((n) => n.textContent.trim());
      const stars = document.querySelector('#repo-stars-counter-star')?.getAttribute('title') || '';
      return { desc: meta('og:description'), lang, topics, stars };
    });
    console.log(`\n### ${repo}  ★${d.stars}  [${d.lang}]  ${d.topics.join(', ')}`);
    console.log('  ', d.desc.replace(/\n/g, ' ').slice(0, 300));
  } catch (e) {
    console.log(`\n### ${repo} — ERR ${e.message.slice(0, 60)}`);
  }
}

await browser.close();
