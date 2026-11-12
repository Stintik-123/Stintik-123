/* Stintik-123 — мелкие скрипты: тема, появление блоков, год. */
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    if (toggle) toggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  };

  if (stored === 'light' || stored === 'dark') {
    apply(stored);
  } else {
    apply(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
    localStorage.setItem('theme', next);
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const items = document.querySelectorAll('.reveal');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
    io.observe(el);
  });
})();
