/* Проверяет наличие профилей на площадках: node scripts/fetch-social.mjs */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

/* Steam */
await page.goto('https://steamcommunity.com/id/stintik/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(1500);
const steam = await page.evaluate(() => {
  const g = (s) => document.querySelector(s)?.textContent?.trim() || '';
  return {
    name: g('.profile_header_name'),
    realName: g('.realname'),
    location: g('.profile_header_details .profile_details_nickname'),
    summary: g('.profile_summary'),
    links: [...document.querySelectorAll('.profile_bio a, .web_links a')].map((a) => a.href),
    group: g('.profile_group_content'),
  };
});
console.log('=== Steam ===');
console.log(JSON.stringify(steam, null, 1));

/* GitLab */
try {
  await page.goto('https://gitlab.com/Stintik-123', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const gl = await page.evaluate(() => ({
    name: document.querySelector('.profile-header-name')?.textContent?.trim() || '',
    bio: document.querySelector('.profile-header-bio, .user-profile-bio')?.textContent?.trim() || '',
    title: document.title,
  }));
  console.log('\n=== GitLab ===');
  console.log(JSON.stringify(gl, null, 1));
} catch (e) {
  console.log('GitLab ERR', e.message.slice(0, 60));
}

/* YouTube-каналы по имени */
for (const q of ['Stintik', 'Stintik_Official', 'Keb04w']) {
  try {
    const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
    const html = await r.text();
    const ids = [...new Set(html.match(/"channelId":"([A-Za-z0-9_-]{22})"/g) || [])].slice(0, 5);
    console.log(`\nYouTube "${q}": каналы`, ids.join(' ') || 'не найдено');
  } catch (e) {
    console.log('YouTube ERR');
  }
}

/* Telegram-канал? */
for (const t of ['t.me/Keb04w', 't.me/Stintik_Official', 't.me/stintik']) {
  try {
    const r = await fetch(t, { redirect: 'manual' });
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([^<]+)</) || [])[1] || '';
    const desc = (html.match(/property="og:description" content="([^"]*)"/) || [])[1] || '';
    console.log(`\n${t} -> ${r.status} | ${title.trim().slice(0, 60)}`);
    if (desc) console.log('   ', desc.slice(0, 140));
  } catch (e) {
    console.log(t, 'ERR');
  }
}

await browser.close();
