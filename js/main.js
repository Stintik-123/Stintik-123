/* emergency minimal main.js — full version applying via patch */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = $('#loader');
if (loader) loader.style.display = 'none';
document.documentElement.classList.remove('lock');
$$('[data-count]').forEach(el => {
  el.textContent = (+el.dataset.count).toLocaleString('ru-RU');
});
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const t = $(a.getAttribute('href'));
  if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
}));
const mail = $('#mail');
if (mail) mail.addEventListener('click', function () {
  const v = this.dataset.mail;
  if (navigator.clipboard) navigator.clipboard.writeText(v);
});
const clock = $('#clock');
if (clock) {
  const tick = () => {
    try { clock.textContent = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Ulyanovsk', hour: '2-digit', minute: '2-digit' }).format(new Date()); }
    catch (e) {}
  };
  tick(); setInterval(tick, 20000);
}
const burger = $('#burger'), menu = $('#menu');
if (burger && menu) {
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
  });
}
console.info('Stintik: minimal main.js — apply full patch');
