/* ============================================================
   ПАЛИТРА КОМАНД (⌘K / Ctrl+K) — поиск по разделам, никам и проектам
   ============================================================ */

const PROJECTS = [
  { t: 'StintikVPN', k: 'vpn прокси mtproto warp зеркала подписки', h: 'projects/stintikvpn.html' },
  { t: 'MegaThread', k: 'каталог трекеры pwa аниме кино игры', h: 'projects/megathread.html' },
  { t: 'GameVoice', k: 'русификаторы озвучки игры перевод', h: 'projects/gamevoice.html' },
  { t: 'SteamDeal', k: 'скидки steam цены регионы', h: 'projects/steamdeal.html' },
  { t: 'Overdrive', k: 'ps5 homebrew c++ магазин', h: 'projects/overdrive.html' },
];

function buildIndex() {
  const items = [];
  const push = (title, href, kind, keywords = '') =>
    items.push({ title, href, kind, keywords: (title + ' ' + keywords).toLowerCase() });

  // разделы страницы
  document.querySelectorAll('section[id]').forEach((s) => {
    const label = s.querySelector('.label, h2')?.textContent.replace(/\s+/g, ' ').trim() || s.id;
    push(label, '#' + s.id, 'Раздел', s.id);
  });

  // карточки ников и контакты
  document.querySelectorAll('.id-card').forEach((c) => {
    const net = c.querySelector('.id-net')?.textContent.trim() || '';
    const handle = c.querySelector('.id-handle')?.textContent.replace(/\s+/g, ' ').trim() || '';
    const a = c.querySelector('a[href]');
    if (!a) return;
    push(net + ' · ' + handle, a.getAttribute('href'), 'Ник', handle + ' ' + c.textContent);
  });
  document.querySelectorAll('#contact a[href^="http"]').forEach((a) => {
    const t = a.querySelector('span')?.textContent.trim() || '';
    const s = a.querySelector('small')?.textContent.trim() || '';
    push(t + ' · ' + s, a.getAttribute('href'), 'Связь', s);
  });

  // вопросы
  document.querySelectorAll('.faq-list > div').forEach((d) => {
    const q = d.querySelector('dt')?.textContent.trim() || '';
    if (q) push(q, '#faq', 'Вопрос', d.querySelector('dd')?.textContent || '');
  });

  // проекты
  const base = location.pathname.includes('/projects/') ? '../' : '';
  PROJECTS.forEach((p) => push('Проект · ' + p.t, base + p.h, 'Проект', p.k));
  push('Все проекты', base + 'projects/', 'Проект', 'список список проектов');

  // уникальное
  const seen = new Set();
  return items.filter((i) => {
    const k = i.title + i.href;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function mountPalette() {
  const root = document.getElementById('cmdk');
  if (!root) return;
  const input = root.querySelector('.cmdk-input');
  const list = root.querySelector('.cmdk-list');
  const index = buildIndex();
  let filtered = index;
  let sel = 0;

  const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');

  const render = (q = '') => {
    const qq = norm(q.trim());
    filtered = qq
      ? index.filter((i) => i.keywords.includes(qq) || norm(i.title).includes(qq))
      : index;
    sel = 0;
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<div class="cmdk-empty">Ничего не нашлось. Попробуй «vpn», «reddit», «telegram» или «проект».</div>';
      return;
    }
    filtered.slice(0, 9).forEach((it, i) => {
      const el = document.createElement('a');
      el.className = 'cmdk-item' + (i === 0 ? ' sel' : '');
      el.href = it.href;
      el.dataset.i = String(i);
      el.innerHTML = `<b></b><small>${it.kind}</small>`;
      el.querySelector('b').textContent = it.title;
      el.addEventListener('mouseenter', () => {
        sel = i;
        list.querySelectorAll('.cmdk-item').forEach((x, j) => x.classList.toggle('sel', j === i));
      });
      list.appendChild(el);
    });
  };

  const open = () => {
    root.classList.add('open');
    document.documentElement.classList.add('cmdk-lock');
    input.value = '';
    render('');
    setTimeout(() => input.focus(), 30);
  };
  const close = () => {
    root.classList.remove('open');
    document.documentElement.classList.remove('cmdk-lock');
  };

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.classList.contains('open') ? close() : open();
      return;
    }
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(filtered.length, 9);
      if (!n) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      list.querySelectorAll('.cmdk-item').forEach((x, j) => x.classList.toggle('sel', j === sel));
      list.querySelector('.cmdk-item.sel')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const el = list.querySelectorAll('.cmdk-item')[sel];
      if (el) { close(); location.href = el.getAttribute('href'); }
    }
  });

  input.addEventListener('input', () => render(input.value));
  root.querySelector('.cmdk-backdrop').addEventListener('click', close);
  document.getElementById('cmdk-open')?.addEventListener('click', open);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPalette);
else mountPalette();
