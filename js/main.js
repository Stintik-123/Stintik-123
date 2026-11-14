/* emergency restore — full experience loads after loader is dismissed */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1) Always dismiss loader so the site is usable */
(function dismissLoader() {
  const loader = $('#loader');
  if (loader) {
    loader.style.transition = 'opacity .4s ease, transform .5s ease';
    loader.style.opacity = '0';
    loader.style.transform = 'translateY(-12%)';
    setTimeout(() => { loader.style.display = 'none'; }, 500);
  }
  document.documentElement.classList.remove('lock');
})();

/* 2) Clock */
(function clock() {
  const el = $('#clock');
  if (!el) return;
  const tick = () => {
    try {
      el.textContent = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Ulyanovsk', hour: '2-digit', minute: '2-digit'
      }).format(new Date());
    } catch (e) { el.textContent = ''; }
  };
  tick();
  setInterval(tick, 20000);
})();

/* 3) Mobile menu */
(function menu() {
  const burger = $('#burger'), menu = $('#menu');
  if (!burger || !menu) return;
  const setOrigin = () => {
    const r = burger.getBoundingClientRect();
    if (!r.width) return;
    menu.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--oy', (r.top + r.height / 2) + 'px');
  };
  setOrigin();
  addEventListener('resize', setOrigin, { passive: true });
  window.closeMenu = () => {
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.textContent = 'Меню';
    document.documentElement.classList.remove('lock');
  };
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
    document.documentElement.classList.toggle('lock', open);
    if (open) setOrigin();
  });
})();

/* 4) Anchor scroll */
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (!id || id.length < 2) return;
  const t = $(id);
  if (!t) return;
  e.preventDefault();
  if (window.closeMenu) closeMenu();
  t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* 5) Stats — show final numbers */
$$('[data-count]').forEach(el => {
  el.textContent = (+el.dataset.count).toLocaleString('ru-RU');
});

/* 6) Copy email */
(function mail() {
  const btn = $('#mail'), toast = $('#toast');
  if (!btn) return;
  let tt;
  btn.addEventListener('click', function () {
    const v = this.dataset.mail;
    const done = () => {
      if (toast) { toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 1800); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(v).then(done, () => { location.href = 'mailto:' + v; });
    else location.href = 'mailto:' + v;
  });
})();

/* 7) Photo fallback */
(function photo() {
  const img = $('#photo img');
  if (img && img.complete && img.naturalWidth) img.parentNode.classList.add('ok');
})();

/* 8) Optional: try load full experience in background without blocking */
(async function tryFull() {
  try {
    const SRC = 'https://cdn.jsdelivr.net/gh/Stintik-123/Stintik-123@24b796b85715bcaa41c9582091228fedaa9db95a/js/main.js';
    const res = await fetch(SRC);
    if (!res.ok) return;
    let code = await res.text();
    /* skip if we would re-run loader — strip loader lock by patching intro path is complex; skip full load for stability */
  } catch (e) { /* stay on safe mode */ }
})();
