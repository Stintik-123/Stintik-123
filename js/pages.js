/* ============================================================
   ЛОГИКА ОТДЕЛЬНЫХ СТРАНИЦ
   ============================================================ */
import { initMesh } from './mesh.js?v=2';

const doc = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- фон-шейдер: свой оттенок на каждый проект ---------- */
const hue = Number(doc.dataset.hue) || 0;
const canvas = document.getElementById('mesh');
if (canvas) {
  const m = initMesh('mesh', { hue, opacity: 0.55 });
  if (m && reduce) m.set(0.4);
}

/* ---------- появление блоков при скролле ---------- */
const revealables = document.querySelectorAll('.pcols > *, .pstats, .pcta, .pnext a, .plist-card');
if (revealables.length && 'IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  revealables.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
    io.observe(el);
  });
}

/* ---------- живое превью: грузим iframe только когда он близко ---------- */
const frame = document.querySelector('.pframe iframe');
if (frame && 'IntersectionObserver' in window) {
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const src = frame.dataset.src;
        if (src) { frame.src = src; delete frame.dataset.src; }
        io2.disconnect();
      }
    });
  }, { rootMargin: '300px' });
  io2.observe(frame);
}

/* ---------- наклон рамки превью за курсором (только мышь) ---------- */
const pframe = document.querySelector('.pframe');
if (pframe && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
  pframe.addEventListener('pointermove', (ev) => {
    const r = pframe.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    pframe.style.transform = `perspective(1400px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(0)`;
  });
  pframe.addEventListener('pointerleave', () => { pframe.style.transform = ''; });
}

/* ---------- клавиши: ← → переключают проекты ---------- */
const prev = document.querySelector('[data-nav="prev"]');
const next = document.querySelector('[data-nav="next"]');
document.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const tag = (ev.target && ev.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (ev.key === 'ArrowLeft' && prev) location.href = prev.getAttribute('href');
  if (ev.key === 'ArrowRight' && next) location.href = next.getAttribute('href');
});

/* ---------- мягкий переход для браузер без View Transitions ---------- */
if (!('startViewTransition' in document)) {
  doc.classList.add('no-vt');
}
