const canvas = document.getElementById('blueprint');
const ctx = canvas.getContext('2d');
let w, h, t = 0, start = performance.now();
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

function introProgress(now) {
  const elapsed = (now - start) / 1000;
  if (elapsed < 0.3) return 0;
  if (elapsed > 3.2) return 1;
  return Math.min(1, (elapsed - 0.3) / 2.9);
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}
function easeInOut(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function drawGrid(p) {
  const spacing = 40;
  const offsetX = (mouse.x - w / 2) * 0.012 * p;
  const offsetY = (mouse.y - h / 2) * 0.012 * p;
  const alpha = 0.04 + 0.04 * p;

  ctx.strokeStyle = `rgba(74, 158, 255, ${alpha})`;
  ctx.lineWidth = 1;

  const cx = w / 2, cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const reveal = easeOutCubic(p) * maxDist * 1.2;

  for (let x = -spacing; x < w + spacing; x += spacing) {
    const dx = Math.abs(x - cx);
    if (dx > reveal + 80) continue;
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, dx - reveal) / 80) * (0.5 + 0.5 * p);
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x - offsetX * 0.4, h);
    ctx.stroke();
  }
  for (let y = -spacing; y < h + spacing; y += spacing) {
    const dy = Math.abs(y - cy);
    if (dy > reveal + 80) continue;
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, dy - reveal) / 80) * (0.5 + 0.5 * p);
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(w, y - offsetY * 0.4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(74, 158, 255, ${0.08 + 0.06 * p})`;
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

function isoPoint(x, y, z, cx, cy, scale, ox, oy) {
  return {
    x: cx + (x - z) * scale * 0.866 + ox,
    y: cy + (x + z) * scale * 0.5 - y * scale + oy
  };
}

function drawBuilding(p, now) {
  const buildP = easeOutCubic(Math.min(1, p * 1.15));
  const floatY = Math.sin(now * 0.0008) * 6 * p;
  const rot = Math.sin(now * 0.0003) * 0.08 * p;

  const cx = w * 0.72;
  const cy = h * 0.42 + floatY;
  const scale = Math.min(w, h) * 0.075;
  const ox = (mouse.x - w / 2) * 0.012 * p;
  const oy = (mouse.y - h / 2) * 0.01 * p;

  function pt(x, y, z) {
    const xr = x * Math.cos(rot) - z * Math.sin(rot);
    const zr = x * Math.sin(rot) + z * Math.cos(rot);
    return isoPoint(xr, y, zr, cx, cy, scale, ox, oy);
  }

  const floors = [
    { y: 0,    w: 2.4, d: 2.0 },
    { y: 1.15, w: 2.15, d: 1.8 },
    { y: 2.2,  w: 1.85, d: 1.55 },
    { y: 3.15, w: 1.5,  d: 1.3 },
    { y: 4.0,  w: 1.1,  d: 1.0 }
  ];

  const floorCount = floors.length;
  const visible = buildP * floorCount;

  ctx.lineWidth = 1.5;

  for (let i = 0; i < floorCount; i++) {
    const local = Math.max(0, Math.min(1, visible - i));
    if (local <= 0) continue;

    const f = floors[i];
    const hw = f.w / 2 * local;
    const hd = f.d / 2 * local;
    const y = f.y * local;

    const corners = [
      pt(-hw, y, -hd),
      pt( hw, y, -hd),
      pt( hw, y,  hd),
      pt(-hw, y,  hd)
    ];

    const alpha = 0.15 + 0.35 * local * p;
    ctx.strokeStyle = `rgba(74, 158, 255, ${alpha})`;
    ctx.fillStyle = `rgba(26, 58, 92, ${0.15 * local * p})`;

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (i < floorCount - 1 && local > 0.5) {
      const next = floors[i + 1];
      const nextLocal = Math.max(0, Math.min(1, visible - (i + 1)));
      const nhw = next.w / 2 * Math.max(0.3, nextLocal);
      const nhd = next.d / 2 * Math.max(0.3, nextLocal);
      const ny = next.y * Math.max(0.3, nextLocal);

      ctx.strokeStyle = `rgba(74, 158, 255, ${0.25 * local * p})`;
      [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].forEach(([x, z], idx) => {
        const signs = [[-1,-1],[1,-1],[1,1],[-1,1]][idx];
        const a = pt(x, y, z);
        const b = pt(signs[0] * nhw, ny, signs[1] * nhd);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }

    if (i === 0 || i === Math.floor(visible) - 1) {
      ctx.strokeStyle = `rgba(126, 200, 255, ${0.4 * local * p})`;
      ctx.lineWidth = 1;
      const left = pt(-hw - 0.3, y, 0);
      const right = pt(hw + 0.3, y, 0);
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(left.x, left.y, 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(right.x, right.y, 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
    }
  }

  if (p > 0.2) {
    ctx.strokeStyle = `rgba(74, 158, 255, ${0.12 * p})`;
    ctx.lineWidth = 1;
    const g = pt(0, -0.15, 0);
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, scale * 1.6, scale * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

const marks = Array.from({ length: 14 }, () => ({
  x: Math.random(),
  y: Math.random(),
  len: 18 + Math.random() * 36,
  angle: Math.random() * Math.PI,
  speed: 0.00025 + Math.random() * 0.0004,
  phase: Math.random() * Math.PI * 2
}));

function drawMarks(p, now) {
  if (p < 0.4) return;
  const ap = (p - 0.4) / 0.6;
  ctx.strokeStyle = `rgba(74, 158, 255, ${0.18 * ap})`;
  ctx.lineWidth = 1;
  marks.forEach(m => {
    const x = m.x * w + Math.sin(now * m.speed + m.phase) * 25;
    const y = m.y * h + Math.cos(now * m.speed * 0.7 + m.phase) * 18;
    const a = m.angle + Math.sin(now * 0.0008 + m.phase) * 0.15;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * m.len / 2, y - Math.sin(a) * m.len / 2);
    ctx.lineTo(x + Math.cos(a) * m.len / 2, y + Math.sin(a) * m.len / 2);
    ctx.stroke();
  });
}

function drawCrosshair(p) {
  if (p < 0.8 || (mouse.x === 0 && mouse.y === 0)) return;
  ctx.strokeStyle = `rgba(74, 158, 255, ${0.4 * p})`;
  ctx.lineWidth = 1;
  const s = 16;
  ctx.beginPath();
  ctx.moveTo(mouse.x - s, mouse.y);
  ctx.lineTo(mouse.x + s, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - s);
  ctx.lineTo(mouse.x, mouse.y + s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawScan(p, now) {
  if (p >= 1) return;
  const y = easeInOut(p) * h;
  ctx.strokeStyle = `rgba(126, 200, 255, ${0.35 * (1 - p)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();
  const grad = ctx.createLinearGradient(0, y - 40, 0, y);
  grad.addColorStop(0, 'rgba(74,158,255,0)');
  grad.addColorStop(1, `rgba(74,158,255,${0.08 * (1 - p)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 40, w, 40);
}

function loop(now) {
  t++;
  const p = introProgress(now);
  ctx.clearRect(0, 0, w, h);
  drawGrid(p);
  drawBuilding(p, now);
  drawMarks(p, now);
  drawScan(p, now);
  drawCrosshair(p);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

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
