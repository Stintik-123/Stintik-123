const canvas = document.getElementById('blueprint');
const ctx = canvas.getContext('2d');
let w, h, t = 0;
const mouse = { x: 0, y: 0 };

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function drawGrid() {
  const spacing = 40;
  const offsetX = (mouse.x - w / 2) * 0.015;
  const offsetY = (mouse.y - h / 2) * 0.015;

  ctx.strokeStyle = 'rgba(74, 158, 255, 0.06)';
  ctx.lineWidth = 1;

  for (let x = -spacing; x < w + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x - offsetX * 0.5, h);
    ctx.stroke();
  }
  for (let y = -spacing; y < h + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(w, y - offsetY * 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(74, 158, 255, 0.12)';
  for (let x = 0; x < w; x += spacing * 5) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x - offsetX * 0.3, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += spacing * 5) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(w, y - offsetY * 0.3);
    ctx.stroke();
  }
}

const marks = [];
for (let i = 0; i < 18; i++) {
  marks.push({
    x: Math.random() * 1,
    y: Math.random() * 1,
    len: 20 + Math.random() * 40,
    angle: Math.random() * Math.PI,
    speed: 0.0003 + Math.random() * 0.0005,
    phase: Math.random() * Math.PI * 2
  });
}

function drawMarks() {
  ctx.strokeStyle = 'rgba(74, 158, 255, 0.2)';
  ctx.lineWidth = 1;
  marks.forEach(m => {
    const x = m.x * w + Math.sin(t * m.speed + m.phase) * 30;
    const y = m.y * h + Math.cos(t * m.speed * 0.7 + m.phase) * 20;
    const a = m.angle + Math.sin(t * 0.001 + m.phase) * 0.2;

    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * m.len / 2, y - Math.sin(a) * m.len / 2);
    ctx.lineTo(x + Math.cos(a) * m.len / 2, y + Math.sin(a) * m.len / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - Math.cos(a) * m.len / 2, y - Math.sin(a) * m.len / 2, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * m.len / 2, y + Math.sin(a) * m.len / 2, 2, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawCrosshair() {
  if (mouse.x === 0 && mouse.y === 0) return;
  ctx.strokeStyle = 'rgba(74, 158, 255, 0.35)';
  ctx.lineWidth = 1;
  const s = 18;
  ctx.beginPath();
  ctx.moveTo(mouse.x - s, mouse.y);
  ctx.lineTo(mouse.x + s, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - s);
  ctx.lineTo(mouse.x, mouse.y + s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGhostStructure() {
  const cx = w * 0.72;
  const cy = h * 0.45;
  const scale = Math.min(w, h) * 0.08;
  const ox = (mouse.x - w / 2) * 0.01;
  const oy = (mouse.y - h / 2) * 0.01;

  ctx.strokeStyle = 'rgba(74, 158, 255, 0.1)';
  ctx.lineWidth = 1.5;

  function iso(x, y, z) {
    return {
      x: cx + (x - z) * scale * 0.866 + ox,
      y: cy + (x + z) * scale * 0.5 - y * scale + oy
    };
  }

  const floors = [
    { y: 0, w: 2.2, d: 1.8 },
    { y: 1.1, w: 2.0, d: 1.6 },
    { y: 2.1, w: 1.7, d: 1.4 },
    { y: 3.0, w: 1.4, d: 1.2 },
    { y: 3.8, w: 1.0, d: 1.0 }
  ];

  floors.forEach((f, i) => {
    const hw = f.w / 2, hd = f.d / 2;
    const pts = [
      iso(-hw, f.y, -hd),
      iso(hw, f.y, -hd),
      iso(hw, f.y, hd),
      iso(-hw, f.y, hd)
    ];
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    if (i < floors.length - 1) {
      const next = floors[i + 1];
      const nhw = next.w / 2, nhd = next.d / 2;
      [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].forEach(([x, z]) => {
        const a = iso(x, f.y, z);
        const b = iso(x * (nhw / hw), next.y, z * (nhd / hd));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }
  });
}

function loop() {
  t++;
  ctx.clearRect(0, 0, w, h);
  drawGrid();
  drawMarks();
  drawGhostStructure();
  drawCrosshair();
  requestAnimationFrame(loop);
}
loop();

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.floor, .cut-main, .note, .log-entry, .contact-frame').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  obs.observe(el);
});

const style = document.createElement('style');
style.textContent = `.visible { opacity: 1 !important; transform: none !important; }`;
document.head.appendChild(style);
