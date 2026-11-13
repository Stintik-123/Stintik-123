/* Интерактивный терминал: команды, Tab-автодополнение, история, промпт.
   Открывается клавишей `~`, `Escape` или кнопкой в шапке. */

const PROJECTS = [
  { id: 'stintikvpn', name: 'StintikVPN', desc: 'Бесплатные VPN-подписки, Telegram-прокси, инструкции по обходу блокировок', url: 'https://stintik-123.github.io/StintikVPN/', stars: 166, lang: 'HTML/CSS/JS' },
  { id: 'megathread', name: 'MegaThread', desc: 'Пиратский сборник: 1386 ссылок в 9 разделах, поиск, избранное, PWA офлайн', url: 'https://stintik-123.github.io/MegaThread/', stars: 1, lang: 'JavaScript' },
  { id: 'gamevoice', name: 'GameVoice', desc: 'Каталог русификаторов и озвучек: 102 игры, 461 проверенная ссылка', url: 'https://stintik-123.github.io/GameVoice/', stars: 1, lang: 'JavaScript' },
  { id: 'steamdeal', name: 'SteamDeal', desc: 'Витрина скидок Steam с ценами в RU, KZ, UA и US', url: 'https://stintik-123.github.io/SteamDeal/', stars: 0, lang: 'JavaScript' },
  { id: 'overdrive', name: 'Overdrive', desc: 'Магазин homebrew-игр для PS5, 1800+ игр, нативное приложение на C++', url: 'https://github.com/Stintik-123/Overdrive', stars: 10, lang: 'C++' },
  { id: 'steampacc', name: 'SteamPACC', desc: 'Оверлей поверх Steam с ценами в разных валютах', url: 'https://github.com/Stintik-123/SteamPACC', stars: 0, lang: 'C#' },
  { id: 'selene', name: 'Selene', desc: 'Спокойная консольная тема для Playnite и плагин Selene Core', url: 'https://github.com/Stintik-123/Selene', stars: 0, lang: 'HTML/CSS' },
  { id: 'streamflix', name: 'streamflix-desktop', desc: 'Десктоп-приложение для стриминга кино, сериалов и аниме', url: 'https://github.com/Stintik-123/streamflix-desktop', stars: 0, lang: 'Electron / Kotlin' },
  { id: 'minimax-code', name: 'minimax-code', desc: 'Открытый кодинг-агент для терминала на MiniMax', url: 'https://github.com/Stintik-123/minimax-code', stars: 0, lang: 'TypeScript' },
  { id: 'openmausbot', name: 'OpenMausBot', desc: 'Открытая альтернатива Grok-боту с виртуальной машиной', url: 'https://github.com/Stintik-123/OpenMausBot', stars: 0, lang: 'Python' },
  { id: 'steamdealbot', name: 'SteamDealBot', desc: 'Телеграм-бот со скидками Steam и ценами по регионам', url: 'https://github.com/Stintik-123/SteamDealBot', stars: 0, lang: 'Python' },
];

const SOCIALS = [
  { key: 'telegram', label: 'Telegram', value: '@Keb04w', url: 'https://t.me/Keb04w' },
  { key: 'reddit', label: 'Reddit', value: 'u/Stintik_Official', url: 'https://www.reddit.com/user/Stintik_Official/' },
  { key: 'github', label: 'GitHub', value: 'Stintik-123', url: 'https://github.com/Stintik-123' },
  { key: 'gitlab', label: 'GitLab', value: 'Зеркала', url: 'https://gitlab.com/Stintik-123' },
  { key: 'mail', label: 'Почта', value: 'stintikvpn@proton.me', url: 'mailto:stintikvpn@proton.me' },
];

const COMMANDS = {
  help: {
    desc: 'список команд',
    run: () => [
      'Доступные команды:',
      '',
      '  help            этот список',
      '  about           коротко обо мне',
      '  projects        список проектов',
      '  cat <проект>    подробнее о проекте',
      '  stack           технологии',
      '  social          все мои площадки',
      '  now             чем занят сейчас',
      '  neofetch        сводка по системе',
      '  open <проект>   открыть проект в новой вкладке',
      '  ls              алиас для projects',
      '  clear           очистить экран',
      '  sudo <команда>  ты не root',
      '',
      'Подсказка: Tab дополняет команды, стрелки вверх/вниз — история.',
    ],
  },
  about: {
    desc: 'коротко обо мне',
    run: () => [
      'Стинт, Ульяновск. Соло-разработчик.',
      '',
      'Делаю бесплатные инструменты для доступа к информации: VPN-подписки,',
      'каталоги, озвучки игр, десктопные утилиты. Без рекламы, аккаунтов и подписок.',
      '',
      'Начинал с модов и каналов по Minecraft. Код в основном печатает ИИ —',
      'я решаю, что делать, зачем и как это должно работать.',
      '',
      'Вне работы — сюжетные игры, интерактивное кино и железо.',
    ],
  },
  projects: {
    desc: 'список проектов',
    run: () => [
      'Проекты:',
      ...PROJECTS.map(
        (p, i) => `  ${String(i + 1).padStart(2, '0')}  ${p.name.padEnd(20)} ${p.lang.padEnd(16)} ★${p.stars}`
      ),
      '',
      'Подробнее: cat <имя>',
    ],
  },
  ls: { desc: 'алиас для projects', run: () => COMMANDS.projects.run() },
  cat: { desc: 'подробнее о проекте', run: () => ['укажи проект: cat <имя>', 'список: projects'] },
  open: { desc: 'открыть проект в новой вкладке', run: () => ['укажи проект: open <имя>', 'список: projects'] },
  stack: {
    desc: 'технологии',
    run: () => [
      'Основное:',
      '  JavaScript · TypeScript — статические сайты, боты, агенты',
      '  Python · PySide — сбор данных, проверка ссылок, автоматизация',
      '  C++ · C# · Kotlin — нативные приложения и темы',
      '  HTML · CSS — всё, что видно',
      '',
      'Инфраструктура:',
      '  GitHub Actions · GitHub Pages · cron-задачи',
      '  Playnite SDK · Steam Web API · Playwright',
    ],
  },
  social: {
    desc: 'все мои площадки',
    run: () => SOCIALS.map((s) => `  ${s.label.padEnd(10)} ${s.value}`),
  },
  now: {
    desc: 'чем занят сейчас',
    run: () => [
      '· Обновляю MegaThread: перепроверяю ссылки, мёртвые вычищаю.',
      '· GameVoice пополнился трейлерами и чистым поиском по транслиту.',
      '· Переделываю SteamDeal на новую вёрстку.',
      '· r/Ru_Piracy: AutoModerator, вики, регулярные треды.',
      '· Overdrive для PS5: сеть, обновления, перевод интерфейса.',
    ],
  },
  neofetch: {
    desc: 'сводка по системе',
    run: () => [
      '        .---.       stintik@ulyanovsk',
      '       /     \\      ------------------',
      '      |  o o  |     OS: Windows + Linux',
      '      |  ___  |     Shell: bash, powershell',
      '       \\_____/      Editor: VS Code, Rider',
      '                    Langs: 11',
      '                    Repos: 12',
      '                    Stars: 177',
      '                    Since: 2016',
      '                    Theme: чёрное поле, один акцент',
      '                    Uptime: не спит',
    ],
  },
  clear: { desc: 'очистить экран', run: () => null, clear: true },
  sudo: {
    desc: 'ты не root',
    run: (args) => [`stintik не входит в sudoers. Если что-то сломалось — пиши: @Keb04w`],
  },
};

function pad(s, n) {
  return String(s) + ' '.repeat(Math.max(0, n - String(s).length));
}

export function initTerminal(opts = {}) {
  const root = document.getElementById('terminal');
  const screen = document.getElementById('termScreen');
  const input = document.getElementById('termInput');
  const openBtn = document.getElementById('termBtn');
  const hint = document.getElementById('termHint');
  if (!root || !screen || !input) return;

  const history = [];
  let histIndex = -1;

  function print(lines) {
    if (!lines) return;
    const frag = document.createDocumentFragment();
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'term-line';
      div.textContent = line === '' ? ' ' : line;
      frag.appendChild(div);
    }
    screen.appendChild(frag);
    screen.scrollTop = screen.scrollHeight;
  }

  function echo(cmd) {
    const div = document.createElement('div');
    div.className = 'term-line term-echo';
    div.innerHTML = `<span class="term-prompt">stintik@site</span><span class="term-prompt-sep">:</span><span class="term-path">~</span><span class="term-prompt-sep">$</span> <span class="term-cmd"></span>`;
    div.querySelector('.term-cmd').textContent = cmd;
    screen.appendChild(div);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    echo(cmd);
    history.push(cmd);
    histIndex = history.length;

    const [name, ...args] = cmd.split(/\s+/);
    const key = name.toLowerCase();
    const cmdDef = COMMANDS[key];

    if (!cmdDef) {
      const near = Object.keys(COMMANDS).filter((c) => c.startsWith(key));
      if (near.length) {
        print([`команда не найдена: ${name}`, `возможно: ${near.join(', ')}`]);
      } else {
        print([`команда не найдена: ${name}`, 'наберите help — список команд']);
      }
      return;
    }

    if (key === 'cat') {
      const target = args[0]?.toLowerCase();
      const p = PROJECTS.find((x) => x.id === target || x.name.toLowerCase() === target);
      if (!p) {
        print([`нет такого проекта: ${args[0] || ''}`, 'список: projects']);
        return;
      }
      print([
        `${p.name}  ${p.lang}  ★${p.stars}`,
        '',
        p.desc,
        '',
        p.url,
      ]);
      return;
    }

    if (key === 'open') {
      const target = args[0]?.toLowerCase();
      const p = PROJECTS.find((x) => x.id === target || x.name.toLowerCase() === target);
      if (!p) {
        print([`нет такого проекта: ${args[0] || ''}`, 'список: projects']);
        return;
      }
      window.open(p.url, '_blank', 'noopener');
      print([`открываю ${p.name}…`]);
      return;
    }

    if (cmdDef.clear) {
      screen.innerHTML = '';
      return;
    }

    print(cmdDef.run(args));
  }

  /* ------------------------------ ввод ------------------------------ */

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      run(v);
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.value.split(/\s+/);
      const last = parts[parts.length - 1] || '';
      const pool = parts.length > 1 ? PROJECTS.map((p) => p.id) : Object.keys(COMMANDS);
      const matches = pool.filter((c) => c.startsWith(last.toLowerCase()));
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0];
        input.value = parts.join(' ');
      } else if (matches.length > 1) {
        print(matches.map((m) => '  ' + m));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      histIndex = Math.max(0, histIndex - 1);
      input.value = history[histIndex];
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIndex = Math.min(history.length, histIndex + 1);
      input.value = histIndex === history.length ? '' : history[histIndex];
    }
  });

  /* ------------------------------ панель ------------------------------ */

  let isOpen = false;
  const fab = document.getElementById('termFab');
  function open() {
    isOpen = true;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (fab) fab.classList.add('is-hidden');
    if (!screen.childElementCount) {
      print([
        'stintik@site — интерактивная оболочка',
        '',
        'Это тот же сайт, только в терминале. Наберите help — список команд,',
        'projects — все проекты, cat gamevoice — подробности, social — соцсети.',
        '',
        'Выход: Esc или "~".',
        '',
      ]);
    }
    setTimeout(() => input.focus(), 60);
    opts.onOpen && opts.onOpen();
  }

  function close() {
    isOpen = false;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (fab) fab.classList.remove('is-hidden');
    opts.onClose && opts.onClose();
  }

  function toggle() {
    isOpen ? close() : open();
  }

  openBtn && openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggle();
  });

  fab && fab.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });

  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
      e.preventDefault();
      return;
    }
    if (isOpen) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === '~' || (e.key === '`' && e.shiftKey)) {
      e.preventDefault();
      toggle();
      return;
    }
    if (e.key === '/' && e.shiftKey) {
      e.preventDefault();
      toggle();
    }
  });

  if (hint) {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    hint.textContent = touch ? 'открыть терминал' : 'нажми ~ — открыть терминал';
  }
}
