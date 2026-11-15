/* Генератор отдельных страниц проектов: node scripts/make-project-pages.mjs */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://stintik-123.github.io/Stintik-123';
const GH = 'https://github.com/Stintik-123';

const P = [
  {
    slug: 'stintikvpn', num: '01', t1: 'Stintik', t2: 'VPN',
    acc: '#ff5a1f', hue: '0',
    site: 'https://stintik-123.github.io/StintikVPN/', repo: `${GH}/StintikVPN`,
    url: 'stintik-123.github.io/StintikVPN',
    lead: 'Бесплатные VPN-подписки, MTProto-прокси и гайды. Открыл — скопировал — вставил в клиент — работает.',
    tags: ['MTProto', 'WARP', 'Зеркала'],
    stats: [['166', 'звёзд на GitHub'], ['3', 'формата конфигов'], ['0₽', 'навсегда']],
    about: [
      'StintikVPN — витрина бесплатных VPN-конфигов и MTProto-прокси для Telegram. Всё в одном списке, каждая строка копируется в один тап и сразу вставляется в клиент.',
      'Отдельный гайд по WARP, инструкции по обходу блокировок и зеркала на случай, если основной адрес недоступен. Регистрации нет: конфиг либо работает, либо нет — это проверяется за секунду.'
    ],
    list: [
      ['MTProto-прокси для Telegram', 'работают в любом клиенте, без установки'],
      ['Бесплатные конфиги', 'список живой, мёртвые строки убраны'],
      ['Гайд по WARP', 'по шагам, без воды и магии'],
      ['Зеркала', 'на случай, если основной адрес не открывается']
    ]
  },
  {
    slug: 'megathread', num: '02', t1: 'Mega', t2: 'Thread',
    acc: '#19e0c8', hue: '2.4',
    site: 'https://stintik-123.github.io/MegaThread/', repo: `${GH}/MegaThread`,
    url: 'stintik-123.github.io/MegaThread',
    lead: 'Каталог ресурсов и трекеров: кино, аниме, игры, книги. Работает офлайн как PWA — поставил на телефон и пользуешься без интернета.',
    tags: ['9 разделов', '43 метки', 'PWA'],
    stats: [['1386', 'ссылок'], ['9', 'разделов'], ['43', 'метки']],
    about: [
      'MegaThread изначально был просто списком трекеров для себя. Вырос до 1386 ссылок по девяти разделам: кино, сериалы, аниме, игры, книги, музыка, софт и обучение.',
      'Сделал на нём PWA: добавляется на главный экран телефона, работает офлайн и открывается мгновенно. Внутри мгновенный поиск и фильтр по меткам — всё разложено так, чтобы не копаться в списке.'
    ],
    list: [
      ['9 разделов', 'кино, сериалы, аниме, игры, книги, музыка, софт, обучение'],
      ['1386 ссылок', 'всё живое, мёртвое вычищаю регулярно'],
      ['43 метки', 'фильтр по тегам в один тап'],
      ['PWA', 'ставится на телефон, работает офлайн']
    ]
  },
  {
    slug: 'gamevoice', num: '03', t1: 'Game', t2: 'Voice',
    acc: '#ff3c8c', hue: '-1.0',
    site: 'https://stintik-123.github.io/GameVoice/', repo: `${GH}/GameVoice`,
    url: 'stintik-123.github.io/GameVoice',
    lead: 'Русификаторы и озвучки игр: кто делал, что переведено, статус работы и прямые ссылки — всё в одной карточке.',
    tags: ['461 ссылка', 'Трейлеры', '22 жанра'],
    stats: [['102', 'игры'], ['461', 'ссылка'], ['22', 'жанра']],
    about: [
      'GameVoice — каталог озвучек и русификаторов. Собрал то, что раньше искал по форумам и разбросанным постам: кто автор, что уже переведено, где лежит файл.',
      'Каждая игра — отдельная карточка с трейлерами, жанрами, статусом перевода и прямой ссылкой. Если перевода нет — так и написано, без «скоро будет».'
    ],
    list: [
      ['102 игры', 'от инди до ААА'],
      ['461 ссылка', 'на русификаторы, озвучки и трейлеры'],
      ['Статус перевода', 'видно сразу: готово, в процессе или нет'],
      ['22 жанра', 'фильтр в один тап']
    ]
  },
  {
    slug: 'steamdeal', num: '04', t1: 'Steam', t2: 'Deal',
    acc: '#8b7bff', hue: '3.6',
    site: 'https://stintik-123.github.io/SteamDeal/', repo: `${GH}/SteamDeal`,
    url: 'stintik-123.github.io/SteamDeal',
    lead: 'Витрина скидок Steam с ценами в регионах RU, KZ, UA и US. Видно сразу, где выгоднее купить.',
    tags: ['Цены по регионам', 'Фильтры'],
    stats: [['4', 'региона'], ['24/7', 'обновление цен'], ['0', 'аккаунтов']],
    about: [
      'SteamDeal показывает, сколько игра стоит в разных регионах. Одна и та же игра в СНГ и в США — разные деньги, и Steam не всегда даёт свободно поменять регион, поэтому цены приходится сравнивать вручную.',
      'Сделал витрину, где у каждой игры сразу четыре цены: RU, KZ, UA и US. Фильтры — по проценту скидки, цене и наличию в продаже. Аккаунт не нужен, ничего вводить не надо.'
    ],
    list: [
      ['4 региона рядом', 'RU, KZ, UA и US в одной строке'],
      ['Фильтры', 'процент, цена, наличие в продаже'],
      ['Без аккаунтов', 'всё открыто, ничего не вводишь'],
      ['Цены обновляются', 'сами, без ручного пересчёта']
    ]
  },
  {
    slug: 'overdrive', num: '05', t1: 'Over', t2: 'drive',
    acc: '#7cff4f', hue: '1.7',
    site: '', repo: `${GH}/Overdrive`,
    url: '',
    lead: 'Магазин homebrew для PS5. Нативное приложение на C++ с поддержкой сети и обновлений.',
    tags: ['C++', 'PS5', '1800+ игр'],
    stats: [['1800+', 'игр в базе'], ['1', 'нативное приложение'], ['10', 'звёзд на GitHub']],
    about: [
      'Overdrive — магазин homebrew для PS5. Это родное приложение на C++, а не веб-страница: свой интерфейс, своя сетевая часть, обновления приходят автоматически.',
      'Внутри больше 1800 игр и приложений для домашней консоли: можно ставить, обновлять и запускать прямо с приставки. Весь код открыт — как всё, что я делаю.'
    ],
    list: [
      ['C++', 'нативное приложение, а не сайт в браузере'],
      ['1800+ игр', 'каталог homebrew для PS5'],
      ['Сеть', 'обновления и списки подтягиваются сами'],
      ['Открытый код', 'всё, что делает клиент, лежит в репозитории']
    ]
  }
];

const head = (t, d, u) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t} — Stintik</title>
<meta name="description" content="${d}">
<meta property="og:title" content="${t} — Stintik">
<meta property="og:description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#08080a">
<meta name="color-scheme" content="dark">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='10' fill='%23ff5a1f'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%230b0b0c'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Onest:wght@300;400;500;600&family=Unbounded:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css?v=3">
<link rel="stylesheet" href="../css/pages.css?v=1">
</head>`;

const nav = (back = ['index.html', '← все проекты']) => `  <header class="pnav">
    <a href="../index.html" class="logo">Stintik<sup>®</sup></a>
    <nav class="pnav-links">
      <a href="../index.html#identity">Кто я</a>
      <a href="../index.html#work">Работы</a>
      <a href="../index.html#path">Путь</a>
      <a href="../index.html#faq">Вопросы</a>
      <a href="../index.html#contact">Связь</a>
    </nav>
    <button class="cmdk-btn" id="cmdk-open" aria-label="Поиск по сайту"><span>Поиск</span>⌕</button>
    <a href="${back[0]}" class="pnav-back">${back[1]}</a>
  </header>`;

function projectPage(p, prev, next) {
  const preview = p.site
    ? `      <div class="pframe">
        <div class="pframe-bar"><i></i><i></i><i></i><span>${p.url}</span></div>
        <iframe data-src="${p.site}" title="Живое превью проекта ${p.t1}${p.t2}" loading="lazy" allowfullscreen></iframe>
      </div>
      <div class="pcta">
        <a href="${p.site}" target="_blank" rel="noopener">Открыть сайт ↗</a>
        <a href="${p.repo}" target="_blank" rel="noopener">Код на GitHub ↗</a>
      </div>`
    : `      <div class="pframe pframe-empty">
        <div><span class="mono">Приложение, а не сайт</span>
        Overdrive ставится прямо на приставку — поэтому живого превью здесь нет.<br>Код и сборка — в репозитории.</div>
      </div>
      <div class="pcta">
        <a href="${p.repo}" target="_blank" rel="noopener">Код на GitHub ↗</a>
      </div>`;

  return `${head(`${p.t1}${p.t2}`, p.lead, `${SITE}/projects/${p.slug}.html`)}
<body class="page-project" data-hue="${p.hue}" style="--pacc:${p.acc}">

<canvas id="mesh" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>

${nav()}

  <main class="pmain">
    <section class="phero">
      <span class="mono">Проект ${p.num} / 05</span>
      <h1 class="ptitle">${p.t1}<span>${p.t2}</span></h1>
      <p class="plead">${p.lead}</p>
      <div class="ptags">${p.tags.map((t) => `<i>${t}</i>`).join('\n        ')}</div>
      <div class="pstats">
        ${p.stats.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('\n        ')}
      </div>
    </section>

    <section class="ppreview">
${preview}
    </section>

    <section class="pcols">
      <div>
        <h2>Что это <em>и зачем</em></h2>
        ${p.about.map((x) => `<p>${x}</p>`).join('\n        ')}
      </div>
      <div>
        <h2>Что <em>внутри</em></h2>
        <ul>
          ${p.list.map(([a, b]) => `<li><span><b>${a}</b> — ${b}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <nav class="pnext">
      ${prev ? `<a href="${prev.slug}.html" data-nav="prev"><small>← предыдущий</small><b>${prev.t1} ${prev.t2}</b></a>` : '<span></span>'}
      ${next ? `<a href="${next.slug}.html" data-nav="next"><small>следующий →</small><b>${next.t1} ${next.t2}</b></a>` : '<span></span>'}
    </nav>
  </main>

  <footer class="pfoot">
    <span class="mono">© Stintik — 2026</span>
    <span class="mono">Ульяновск · <a href="../index.html#contact">написать</a></span>
  </footer>

<script type="module" src="../js/pages.js?v=1"></script>
<script type="module" src="../js/palette.js?v=1"></script>

<div class="cmdk" id="cmdk" role="dialog" aria-modal="true" aria-label="Поиск по сайту">
  <div class="cmdk-backdrop"></div>
  <div class="cmdk-panel">
    <input class="cmdk-input" id="cmdk-input" type="text" placeholder="Раздел, ник или проект" autocomplete="off" spellcheck="false" aria-label="Поиск">
    <div class="cmdk-list" id="cmdk-list"></div>
    <div class="cmdk-foot"><span>↑ ↓ выбрать</span><span>↵ открыть</span><span>esc закрыть</span></div>
  </div>
</div>
</body>
</html>
`;
}

mkdirSync(resolve(root, 'projects'), { recursive: true });
P.forEach((p, i) => {
  const prev = P[(i - 1 + P.length) % P.length];
  const next = P[(i + 1) % P.length];
  writeFileSync(resolve(root, 'projects', `${p.slug}.html`), projectPage(p, prev, next), 'utf8');
});

/* ---------- обзорная страница ---------- */
const listPage = `${head('Проекты — Stintik', 'Пять проектов: VPN-подписки, каталоги, русификаторы, скидки Steam и homebrew для PS5.', `${SITE}/projects/`)}
<body class="page-project">

<canvas id="mesh" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>

${nav(['../index.html', '← на главную'])}

  <main class="pmain">
    <section class="plist">
      <span class="mono">05 проектов</span>
      <h1 class="plist-title">Проекты<br><em>Стинта</em></h1>
      <p class="plead">Пять инструментов, которые работают прямо сейчас. Без регистрации, без условий, с открытым кодом.</p>
      <div class="plist-grid">
        ${P.map((p) => `        <a class="plist-card" href="${p.slug}.html" style="--pacc:${p.acc}">
          <span class="mono">${p.num}</span>
          <b>${p.t1} ${p.t2}</b>
          <p>${p.lead}</p>
          <div class="plist-tags">${p.tags.map((t) => `<i>${t}</i>`).join('')}</div>
        </a>`).join('\n')}
      </div>
    </section>
  </main>

  <footer class="pfoot">
    <span class="mono">© Stintik — 2026</span>
    <span class="mono"><a href="../index.html">на главную</a></span>
  </footer>

<script type="module" src="../js/pages.js?v=1"></script>
<script type="module" src="../js/palette.js?v=1"></script>

<div class="cmdk" id="cmdk" role="dialog" aria-modal="true" aria-label="Поиск по сайту">
  <div class="cmdk-backdrop"></div>
  <div class="cmdk-panel">
    <input class="cmdk-input" id="cmdk-input" type="text" placeholder="Раздел, ник или проект" autocomplete="off" spellcheck="false" aria-label="Поиск">
    <div class="cmdk-list" id="cmdk-list"></div>
    <div class="cmdk-foot"><span>↑ ↓ выбрать</span><span>↵ открыть</span><span>esc закрыть</span></div>
  </div>
</div>
</body>
</html>
`;
writeFileSync(resolve(root, 'projects', 'index.html'), listPage, 'utf8');
console.log('готово: 5 страниц проектов + projects/index.html');
