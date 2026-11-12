/* Факты о профиле со страницы GitHub: node scripts/fetch-profile.mjs */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
await page.goto('https://github.com/Stintik-123', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const txt = (sel) => document.querySelector(sel)?.textContent?.trim() || '';
  const items = [...document.querySelectorAll('.vcard-detail, .p-note')].map((n) => n.textContent.trim());
  const pinned = [...document.querySelectorAll('.pinned-item-list-item')].map((n) => {
    const a = n.querySelector('a');
    return {
      repo: a?.textContent?.trim() || '',
      desc: n.querySelector('.pinned-item-desc')?.textContent?.trim() || '',
      lang: n.querySelector('.pinned-item-meta')?.textContent?.trim() || '',
    };
  });
  const repos = [...document.querySelectorAll('li.col-12.d-flex.flex-items-center')].map((n) => ({
    name: n.querySelector('a[itemprop="name"]')?.textContent?.trim() || '',
    desc: n.querySelector('p[itemprop="description"]')?.textContent?.trim() || '',
    lang: n.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || '',
    stars: n.querySelector('a[href$="/stargazers"]')?.textContent?.trim() || '',
  }));
  return {
    name: txt('.vcard-names .p-name'),
    handle: txt('.vcard-names .p-nickname'),
    bio: txt('.user-profile-bio .p-note'),
    items,
    pinned,
    repos,
    stats: [...document.querySelectorAll('.Counter')].map((n) => n.textContent.trim()),
  };
});

console.log(JSON.stringify(info, null, 1).slice(0, 6000));
await browser.close();
