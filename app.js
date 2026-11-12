/* stintik — вход по вопросу. Ответ хранится локально. */
(() => {
  const gate = document.getElementById('gate');
  const gateList = document.getElementById('gateList');
  const foot = document.getElementById('foot');
  const footAnswer = document.getElementById('footAnswer');
  const resetBtn = document.getElementById('resetGate');
  const yearEl = document.getElementById('year');

  const views = {
    friend: document.getElementById('view-friend'),
    stranger: document.getElementById('view-stranger'),
  };

  const LABELS = {
    friend: 'от знакомого',
    stranger: 'просто зашёл',
  };

  const setYear = () => {
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const show = (answer, label) => {
    gate.hidden = true;
    Object.entries(views).forEach(([key, el]) => {
      if (el) el.hidden = key !== answer;
    });
    if (foot) {
      foot.hidden = false;
      footAnswer.textContent = `ответ: ${label}`;
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    const heading = views[answer]?.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  };

  const restore = () => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('gate') || 'null');
    } catch {
      saved = null;
    }
    if (saved && views[saved.answer]) {
      show(saved.answer, saved.label || LABELS[saved.answer]);
      return true;
    }
    return false;
  };

  gateList?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-answer]');
    if (!button) return;
    const answer = button.dataset.answer;
    const label = button.dataset.label || LABELS[answer];
    localStorage.setItem('gate', JSON.stringify({ answer, label }));
    show(answer, label);
  });

  resetBtn?.addEventListener('click', () => {
    localStorage.removeItem('gate');
    Object.values(views).forEach((el) => {
      if (el) el.hidden = true;
    });
    if (foot) foot.hidden = true;
    gate.hidden = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
    gate.querySelector('h1')?.focus?.({ preventScroll: true });
  });

  setYear();
  if (!restore()) {
    gate.hidden = false;
    if (foot) foot.hidden = true;
  }
})();
