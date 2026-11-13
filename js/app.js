/* stintik — личная страница. Шапка, появление блоков, активная навигация, копирование почты. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // анимация появления — только при работающем JS, иначе контент виден сразу
  document.documentElement.classList.add('js');

  /* --------------------------- модули сайта --------------------------- */
  import('./terminal.js').then((m) => m.initTerminal()).catch(() => {});
  import('./live.js').then((m) => m.initLive()).catch(() => {});
  import('./intro3d.js')
    .then((m) =>
      m.initIntro({
        onDone: () => document.body.classList.add('intro-done'),
      })
    )
    .catch(() => {
      const intro = $('#intro');
      if (intro) intro.classList.add('is-gone');
    });

  /* ------------------------------ год ------------------------------ */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --------------------------- шапка: тень --------------------------- */
  const header = $('#header');
  const onScroll = () => {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --------------------------- мобильное меню --------------------------- */
  const nav = $('#nav');
  const burger = $('#burger');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? '✕' : '☰';
    });
    $$('a', nav).forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.textContent = '☰';
      })
    );
  }

  /* ------------------------- появление блоков ------------------------- */
  const revealables = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealables.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ------------------------ активная навигация ------------------------ */
  const sections = $$('main section[id]');
  const navLinks = $$('#nav a[href^="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.getAttribute('href') === id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* -------------------------- копирование почты -------------------------- */
  const copyBtn = $('#copyMail');
  const note = $('#copyNote');
  let noteTimer = null;

  const showNote = (text) => {
    if (!note) return;
    note.textContent = text;
    note.classList.add('is-on');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => note.classList.remove('is-on'), 2000);
  };

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const mail = copyBtn.dataset.mail || '';
      try {
        await navigator.clipboard.writeText(mail);
        showNote('Скопировано: ' + mail);
      } catch {
        // Clipboard API может быть недоступен без https — показываем адрес
        showNote(mail);
      }
    });
  }
})();
