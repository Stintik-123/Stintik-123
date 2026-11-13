/* Живой слой: contribution-граф GitHub (реальный SVG из workflow) и счётчики.

   Источник графика — https://raw.githubusercontent.com/Stintik-123/Stintik-123/output/
   github-contribution-grid-snake-dark.svg, его генерирует .github/workflows/snake.yml.
   Если сеть недоступна — секция просто скрывается, сайт работает дальше. */

const SNAKE_URL =
  'https://raw.githubusercontent.com/Stintik-123/Stintik-123/output/github-contribution-grid-snake-dark.svg';

const STATS = [
  { k: 'Проектов', v: 12, note: 'в репозиториях' },
  { k: 'Звёзд', v: 177, note: 'за всё время' },
  { k: 'Ссылок в каталогах', v: 1847, note: 'проверено' },
  { k: 'Игр в GameVoice', v: 102, note: 'с трейлерами' },
];

/* GitHub отдаёт график в зелёно-фиолетовой гамме — перекрашиваем в палитру сайта. */
const RECOLOR = [
  ['--cb:#1b1f230a', '--cb:#ffffff14'],
  ['--cs:purple', '--cs:#ff4b2b'],
  ['--ce:#161b22', '--ce:#0f0f13'],
  ['--c0:#161b22', '--c0:#131317'],
  ['--c1:#01311f', '--c1:#3d1b0d'],
  ['--c2:#034525', '--c2:#7a2907'],
  ['--c3:#0f6d31', '--c3:#c1440e'],
  ['--c4:#00c647', '--c4:#ff5a33'],
];

function recolor(svg) {
  let out = svg;
  RECOLOR.forEach(([from, to]) => {
    out = out.split(from).join(to);
  });
  return out;
}

export function initLive() {
  const wrap = document.getElementById('live');
  if (!wrap) return;

  /* ---- счётчики с раскадровкой ---- */
  const counters = wrap.querySelectorAll('[data-count]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function runCounters() {
    counters.forEach((el) => {
      const target = Number(el.dataset.count || 0);
      if (reduceMotion) {
        el.textContent = String(target);
        return;
      }
      const dur = 1100;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          runCounters();
          io.unobserve(e.target);
        });
      },
      { threshold: 0.3 }
    );
    counters.forEach((c) => io.observe(c));
  } else {
    runCounters();
  }

  /* ---- график активности ---- */
  const graph = document.getElementById('liveGraph');
  if (!graph) return;

  fetch(SNAKE_URL, { mode: 'cors' })
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status))))
    .then((svg) => {
      if (!svg || !svg.includes('<svg')) throw new Error('не SVG');
      graph.innerHTML = recolor(svg).replace(/<\?xml[\s\S]*?\?>/, '');
      const svgEl = graph.querySelector('svg');
      if (svgEl) {
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgEl.style.width = '100%';
        svgEl.style.height = 'auto';
      }
      graph.classList.add('is-loaded');
    })
    .catch(() => {
      graph.closest('.live-graph-box')?.classList.add('is-hidden');
    });

  /* ---- живое обновление времени в «Сейчас» ---- */
  const clock = document.getElementById('liveClock');
  if (clock) {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      clock.textContent = `${hh}:${mm}:${ss}`;
    };
    tick();
    setInterval(tick, 1000);
  }
}
