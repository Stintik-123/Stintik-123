/* Сборка ролика из записанных клипов: node scripts/make-reel.mjs
   Кладёт reel/reel.mp4 — его и подхватывает секция Showreel. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REEL = path.join(ROOT, 'reel');
const RAW = path.join(REEL, 'raw');
const SEG = path.join(REEL, 'seg');
fs.mkdirSync(SEG, { recursive: true });

const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const CLIPS = [
  { file: 'page@3096a82395399365d6c65712deba3263.webm', name: 'StintikVPN', sub: '01 / VPN-ПОДПИСКИ И ПРОКСИ' },
  { file: 'page@a2f804c40c12735f50473430d6eb6d0c.webm', name: 'MegaThread', sub: '02 / КАТАЛОГ РЕСУРСОВ И ТРЕКЕРОВ' },
  { file: 'page@5663de962b3cf3934e38af2ae05d8cd3.webm', name: 'GameVoice', sub: '03 / ОЗВУЧКИ И РУСИФИКАТОРЫ ИГР' },
  { file: 'page@4b7951fbf0584dd45d16f2067da5d7e3.webm', name: 'SteamDeal', sub: '04 / ВИТРИНА СКИДОК STEAM' },
  { file: 'page@c07de10ba942a57bb385434ce39277ec.webm', name: 'Overdrive', sub: '05 / HOMEBREW-МАГАЗИН ДЛЯ PS5' },
];

const CLIP_LEN = 6.5;   // секунд из каждого клипа
const CARD_LEN = 1.5;

const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");

const parts = [];

CLIPS.forEach((c, i) => {
  const src = path.join(RAW, c.file);
  if (!fs.existsSync(src)) { console.log('нет клипа:', c.file); return; }

  // титульная карточка в стиле сайта: тёмный фон, белый заголовок, оранжевый подзаголовок
  const card = path.join(SEG, `${i}-card.mp4`);
  run([
    '-f', 'lavfi', '-i', `color=c=0x0b0b0c:s=1280x720:r=24:d=${CARD_LEN}`,
    '-vf',
    `drawbox=x=0:y=0:w=1280:h=720:color=0x141416:t=fill,` +
    `drawbox=x=0:y=0:w=1280:h=3:color=0xff5a1f:t=fill,` +
    `drawtext=fontfile=${FONT_BOLD}:text='${esc(c.name.toUpperCase())}':fontcolor=0xf1efe9:fontsize=88:` +
    `x=(w-text_w)/2:y=(h-text_h)/2-34:enable='between(t,0.15,1.35)',` +
    `drawtext=fontfile=${FONT}:text='${esc(c.sub)}':fontcolor=0xff5a1f:fontsize=26:` +
    `x=(w-text_w)/2:y=(h/2)+56:enable='between(t,0.3,1.35)',` +
    `fade=t=in:st=0:d=0.3,fade=t=out:st=${(CARD_LEN - 0.3).toFixed(2)}:d=0.3`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '24', '-an', card,
  ]);

  // сам клип
  const clip = path.join(SEG, `${i}-clip.mp4`);
  run([
    '-ss', '0.6', '-t', String(CLIP_LEN), '-i', src,
    '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '26', '-an', clip,
  ]);

  parts.push(card, clip);
  console.log('готово:', c.name);
});

// склейка
const listFile = path.join(SEG, 'list.txt');
fs.writeFileSync(listFile, parts.map(p => `file '${p}'`).join('\n'), 'utf-8');
const out = path.join(REEL, 'reel.mp4');
run([
  '-f', 'concat', '-safe', '0', '-i', listFile,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '28',
  '-r', '24', '-g', '48', '-movflags', '+faststart', '-an', out,
]);

const size = fs.statSync(out).size;
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim();
console.log(`\nролик: ${out}`);
console.log(`размер: ${(size / 1024 / 1024).toFixed(2)} МБ | длительность: ${Number(dur).toFixed(1)}с`);
