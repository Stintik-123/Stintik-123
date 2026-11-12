// ========== CANVAS BACKGROUND ==========
const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
let w, h, particles = [], mouse = { x: 0, y: 0 };

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// grid + particles
const GRID = 48;
function initParticles() {
  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    });
  }
}
initParticles();

function draw() {
  ctx.clearRect(0, 0, w, h);

  // perspective grid
  ctx.strokeStyle = 'rgba(255,92,26,0.04)';
  ctx.lineWidth = 1;
  const offsetX = (mouse.x - w / 2) * 0.02;
  const offsetY = (mouse.y - h / 2) * 0.02;

  for (let x = 0; x < w + GRID; x += GRID) {
    ctx.beginPath();
    ctx.moveTo(x + offsetX, 0);
    ctx.lineTo(x - offsetX, h);
    ctx.stroke();
  }
  for (let y = 0; y < h + GRID; y += GRID) {
    ctx.beginPath();
    ctx.moveTo(0, y + offsetY);
    ctx.lineTo(w, y - offsetY);
    ctx.stroke();
  }

  // particles
  ctx.fillStyle = 'rgba(255,92,26,0.35)';
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    // mouse attract
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 180) {
      p.x -= dx * 0.008;
      p.y -= dy * 0.008;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // connecting lines near mouse
  ctx.strokeStyle = 'rgba(255,92,26,0.08)';
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        ctx.globalAlpha = 1 - d / 120;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(draw);
}
draw();

// ========== CUSTOM CURSOR ==========
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let cx = 0, cy = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  cx = e.clientX;
  cy = e.clientY;
});

function updateCursor() {
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';
  fx += (cx - fx) * 0.12;
  fy += (cy - fy) * 0.12;
  follower.style.left = fx + 'px';
  follower.style.top = fy + 'px';
  requestAnimationFrame(updateCursor);
}
updateCursor();

// cursor grow on interactive
document.querySelectorAll('a, [data-magnetic]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '14px';
    cursor.style.height = '14px';
    follower.style.width = '52px';
    follower.style.height = '52px';
    follower.style.borderColor = 'rgba(255,92,26,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '8px';
    cursor.style.height = '8px';
    follower.style.width = '36px';
    follower.style.height = '36px';
    follower.style.borderColor = 'rgba(255,92,26,0.5)';
  });
});

// ========== MAGNETIC BUTTONS ==========
document.querySelectorAll('[data-magnetic]').forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});

// ========== WORK ITEM TILT ==========
document.querySelectorAll('.work-item').forEach(item => {
  item.addEventListener('mousemove', e => {
    const rect = item.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    item.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 3}deg)`;
  });
  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });
});

// ========== SCROLL REVEAL ==========
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.work-item, .about-main, .side-block, .now-content, .contact-inner').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  observer.observe(el);
});

const style = document.createElement('style');
style.textContent = `.in-view { opacity: 1 !important; transform: none !important; }`;
document.head.appendChild(style);
