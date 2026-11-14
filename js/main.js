/* Сайт Stintik — интерактив: 3D-объект на фоне, mesh-шейдер, прелоадер, плавный скролл,
   горизонтальная галерея работ, реел, счётчики и курсор.
   Зависимости подключаются в index.html: gsap, ScrollTrigger, lenis, three (importmap). */
import * as THREE from 'three';
import { initMesh } from './mesh.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const okGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const isMob = () => innerWidth < 821;
const loader = $('#loader');

/* общая ссылка на Lenis — нужна и в меню, и в навигации */
let lenisRef = null;

/* =============== общее: часы, меню, копирование почты =============== */
(function common() {
  const clock = $('#clock');
  const tick = () => {
    try { clock.textContent = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Ulyanovsk', hour: '2-digit', minute: '2-digit' }).format(new Date()); }
    catch (e) { clock.textContent = ''; }
  };
  tick(); setInterval(tick, 20000);

  const burger = $('#burger'), menu = $('#menu');

  /* точка раскрытия меню — по центру кнопки, чтобы «круг» расходился из-под неё */
  const setOrigin = () => {
    if (!burger || !menu) return;
    const r = burger.getBoundingClientRect();
    if (!r.width || !r.height) return;   // на десктопе бургер скрыт — оставляем дефолт из CSS
    menu.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
    menu.style.setProperty('--oy', (r.top + r.height / 2) + 'px');
  };
  setOrigin();
  addEventListener('resize', setOrigin, { passive: true });

  const lockScroll = on => {
    document.documentElement.classList.toggle('lock', on);
    if (!lenisRef) return;
    on ? lenisRef.stop() : lenisRef.start();
  };

  window.closeMenu = () => {
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.textContent = 'Меню';
    lockScroll(false);
  };

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
    lockScroll(open);
    if (open) setOrigin();
  });

  const toast = $('#toast'); let tt;
  $('#mail').addEventListener('click', function () {
    const v = this.dataset.mail;
    const done = () => { toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, () => { location.href = 'mailto:' + v; });
    else location.href = 'mailto:' + v;
  });

  const photo = $('#photo img');
  if (photo && photo.complete && photo.naturalWidth) photo.parentNode.classList.add('ok');
})();

/* =============== 3D-сцена: жидкий хром + частицы =============== */
function initScene() {
  const canvas = $('#gl');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.remove(); return null; }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 7;
  const rig = new THREE.Group();
  scene.add(rig);

  const noise = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;
      vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
      vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;
      vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
      m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.3 }, uFreq: { value: 1.05 } },
    vertexShader: `
      uniform float uTime, uAmp, uFreq;
      varying vec3 vN; varying vec3 vV; varying float vD;
      ${noise}
      vec3 disp(vec3 p){ float n = snoise(p*uFreq + vec3(0.0, uTime*0.22, uTime*0.1)); return p*(1.0 + n*uAmp); }
      void main(){
        vec3 p = position;
        vec3 n0 = normalize(p);
        vec3 t = normalize(cross(n0, abs(n0.y) > 0.99 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0)));
        vec3 b = cross(n0, t);
        float e = 0.03;
        vec3 d0 = disp(p);
        vec3 d1 = disp(normalize(p + t*e) * length(p));
        vec3 d2 = disp(normalize(p + b*e) * length(p));
        vec3 nn = normalize(cross(d1 - d0, d2 - d0));
        if (dot(nn, n0) < 0.0) nn = -nn;
        vN = normalize(normalMatrix * nn);
        vec4 mv = modelViewMatrix * vec4(d0, 1.0);
        vV = -mv.xyz;
        vD = length(d0)/length(p) - 1.0;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vD;
      vec3 pal(float t){ return 0.5 + 0.5*cos(6.28318*(t + vec3(0.0, 0.33, 0.67))); }
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(vV);
        float ndv = max(dot(n, v), 0.0);
        float fres = pow(1.0 - ndv, 2.4);
        vec3 r = reflect(-v, n);
        float sky = pow(clamp(r.y*0.5 + 0.5, 0.0, 1.0), 2.6);
        vec3 env = mix(vec3(0.015,0.015,0.02), vec3(0.92,0.9,0.86), sky);
        env += vec3(1.0,0.36,0.1) * pow(max(dot(r, normalize(vec3(-0.7,0.25,0.65))), 0.0), 9.0) * 1.7;
        env += vec3(0.25,0.5,1.0) * pow(max(dot(r, normalize(vec3(0.85,-0.2,0.45))), 0.0), 8.0) * 1.2;
        env += vec3(1.0) * pow(max(dot(r, normalize(vec3(0.1,0.9,0.4))), 0.0), 40.0) * 1.4;
        vec3 irid = pal(fres*0.75 + vD*1.4 + uTime*0.04);
        vec3 col = env*0.88 + irid*fres*0.85;
        col = pow(col, vec3(0.92));
        gl_FragColor = vec4(col, 1.0);
      }`
  });

  /* на телефоне геометрия и частицы дешевле — там каждый кадр считается на батарейке */
  const mob = isMob();
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, mob ? 18 : 48), mat);
  rig.add(blob);

  const N = mob ? 520 : 1500, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.3 + Math.random() * 3.4, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.02, color: 0xf1efe9, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  rig.add(points);

  const state = { x: 0, y: 0, s: 0.0001, amp: 0.32, o: 1 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let worldW = 1, worldH = 1, vel = 0, boost = 0, cleared = false;

  let maxDpr = mob ? 1.25 : 1.75;
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    worldH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    worldW = worldH * camera.aspect;
  }
  resize();
  addEventListener('resize', resize);
  if (finePointer) {
    addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });
  }

  /* софтверный рендер (SwiftShader/llvmpipe) — это тесты, а не телефон: деградацию не включаем */
  let softwareGL = false;
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    softwareGL = /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch (e) { /* не критично */ }

  const clock = new THREE.Clock();
  let frames = 0, fpsAt = performance.now(), degraded = 0;

  renderer.setAnimationLoop(() => {
    if (document.hidden) return;                     // не жжём батарею в фоновой вкладке
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    boost += (Math.min(Math.abs(vel) / 3500, 0.45) - boost) * 0.08;
    const sc = Math.max(state.s, 0.0001);
    if (sc <= 0.001) { if (!cleared) { renderer.clear(); cleared = true; } return; }
    cleared = false;
    canvas.style.opacity = state.o;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uAmp.value = state.amp + boost;
    rig.position.set(state.x * worldW / 2, state.y * worldH / 2, 0);
    rig.scale.setScalar(sc);
    rig.rotation.y = t * 0.1 + mouse.x * 0.7;
    rig.rotation.x = mouse.y * 0.45 + scrollY * 0.0005;
    points.rotation.y = -t * 0.025;
    renderer.render(scene, camera);

    /* если телефон не тянет — потихоньку снижаем разрешение рендера */
    frames++;
    const now = performance.now();
    if (now - fpsAt > 2500) {
      const fps = frames / ((now - fpsAt) / 1000);
      frames = 0; fpsAt = now;
      if (!softwareGL && fps < 32 && degraded < 2) {
        degraded++;
        maxDpr = Math.max(0.75, maxDpr * 0.7);
        renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
        renderer.setSize(innerWidth, innerHeight, false);
      }
    }
  });

  return { state, setVelocity: v => { vel = v; }, degraded: () => degraded };
}

/* =============== фоллбэк для видео: генеративный градиент =============== */
function initFx() {
  const fx = $('#fx'), media = $('#reelMedia'), video = $('#reelVideo'), src = $('#reelSrc');
  const c = fx.getContext('2d');
  let w = 0, h = 0, running = false, hasVideo = false, visible = false;
  const cols = ['rgba(255,90,31,.85)', 'rgba(107,60,255,.8)', 'rgba(0,194,255,.7)', 'rgba(255,60,140,.6)', 'rgba(255,170,40,.55)'];
  function size() { w = fx.width = Math.max(2, innerWidth >> 1); h = fx.height = Math.max(2, innerHeight >> 1); }
  size(); addEventListener('resize', size);
  function draw(t) {
    if (!running) return;
    if (visible && !hasVideo) {
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#08080a'; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < cols.length; i++) {
        const k = i + 1, x = w * (0.5 + 0.38 * Math.sin(t * 0.00027 * k + i * 2.1)), y = h * (0.5 + 0.34 * Math.cos(t * 0.00021 * k + i * 1.3));
        const r = Math.max(w, h) * (0.34 + 0.1 * Math.sin(t * 0.0004 * k + i));
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, cols[i]); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }
    }
    if (visible || hasVideo) requestAnimationFrame(draw);   // не крутим цикл впустую
    else running = false;
  }
  running = true; requestAnimationFrame(draw);

  const vOK = () => { hasVideo = true; media.classList.add('has-video'); if (visible) video.play().catch(() => {}); };
  if (src) src.addEventListener('error', () => { hasVideo = false; media.classList.remove('has-video'); });
  video.addEventListener('loadeddata', vOK);
  video.addEventListener('error', () => { hasVideo = false; });
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible) {
      /* ролик весит ~1.5 МБ — качаем его только когда секция реально дошла до экрана */
      if (!hasVideo && video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
      else if (hasVideo) video.play().catch(() => {});
    } else if (hasVideo) {
      video.pause();
    }
    if (visible && !running) { running = true; requestAnimationFrame(draw); }
  }, { threshold: 0.05 }).observe($('#reel'));
}

/* =============== запуск =============== */
const scene = initScene();
initFx();
const mesh = initMesh();

if (!okGsap || reduce) {
  loader.style.display = 'none';
  document.documentElement.classList.remove('lock');
  $$('.statement .w').forEach(w => w.style.opacity = 1);
  if (scene) { scene.state.s = isMob() ? 0.42 : 1; scene.state.y = isMob() ? 0.46 : 0.02; }
  if (mesh) mesh.set(isMob() ? 0.45 : 0.55);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); closeMenu(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  }));
} else {
  main();
}

function main() {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('hpin');
  document.documentElement.classList.add('lock');

  /* --- плавный скролл --- */
  if (window.Lenis) {
    lenisRef = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      /* на тач-устройствах оставляем нативный скролл — он быстрее и привычнее */
      syncTouch: false,
      touchMultiplier: 1.4,
    });
    lenisRef.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenisRef.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenisRef.stop();
  }

  const navOffset = () => (isMob() ? 64 : 92);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault(); closeMenu();
    if (lenisRef) lenisRef.scrollTo(t, { duration: isMob() ? 1.1 : 1.8, offset: -navOffset(), easing: x => 1 - Math.pow(1 - x, 4) });
    else t.scrollIntoView({ behavior: 'smooth' });
  }));

  /* --- курсор --- */
  if (finePointer) {
    const dot = $('.cur-dot'), ring = $('.cur-ring'), label = $('.cur-label');
    const xd = gsap.quickTo(dot, 'x', { duration: 0.08 }), yd = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const xr = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), yr = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', e => { xd(e.clientX); yd(e.clientY); xr(e.clientX); yr(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const cur = e.target.closest('[data-cursor]');
      const inner = e.target.closest('.card-meta a');
      if (cur && cur.dataset.cursor && !inner) { label.textContent = cur.dataset.cursor; ring.classList.add('big'); ring.classList.remove('link'); }
      else { ring.classList.remove('big'); ring.classList.toggle('link', !!e.target.closest('a, button')); }
    });
  }

  /* --- пресеты 3D-объекта и фона по секциям (bg — прозрачность mesh-фона) --- */
  const base = {
    hero: { x: 0, y: 0.02, s: 1, amp: 0.32, o: 1, bg: 0.55 },
    work: { x: 0.84, y: 0.56, s: 0.28, amp: 0.22, o: 1, bg: 0.20 },
    reel: { x: 0, y: 0, s: 0.0001, amp: 0.2, o: 1, bg: 0.08 },
    about: { x: 0.74, y: 0.02, s: 0.6, amp: 0.5, o: 0.38, bg: 0.18 },
    hardware: { x: 0.74, y: 0.12, s: 0.42, amp: 0.42, o: 0.4, bg: 0.14 },
    media: { x: 1.12, y: 0.05, s: 0.3, amp: 0.46, o: 0.3, bg: 0.14 },
    stack: { x: 0.74, y: -0.1, s: 0.5, amp: 0.38, o: 0.45, bg: 0.16 },
    contact: { x: 0, y: 0.12, s: 1.2, amp: 0.55, o: 1, bg: 0.45 }
  };
  /* на телефоне текст занимает всю ширину — блоб уводим в свободные углы и приглушаем */
  const mobBase = {
    hero:     { x: 0,    y: 0.46, s: 0.42, o: 1,    bg: 0.50 },
    work:     { x: 0.72, y: -0.72, s: 0.18, o: 0.9,  bg: 0.16 },
    reel:     { x: 0,    y: 0,    s: 0.0001, o: 1,  bg: 0.07 },
    about:    { x: 0.22, y: -0.66, s: 0.30, o: 0.26, bg: 0.16 },
    hardware: { x: 0.34, y: -0.70, s: 0.28, o: 0.22, bg: 0.12 },
    media:    { x: 0.62, y: -0.70, s: 0.26, o: 0.22, bg: 0.12 },
    stack:    { x: 0.34, y: -0.70, s: 0.30, o: 0.26, bg: 0.14 },
    contact:  { x: 0.10, y: 0.92, s: 0.27, o: 0.5,  bg: 0.34 }
  };
  const P = id => {
    const p = { ...base[id] };
    if (isMob()) {
      const m = mobBase[id] || {};
      p.x = m.x; p.y = m.y; p.s = m.s; p.o = m.o; p.bg = m.bg;
    }
    return p;
  };

  const meshState = { o: 0 };
  const applyMesh = () => { if (mesh) mesh.set(meshState.o); };

  let current = 'hero', locked = true;
  const goto = id => {
    current = id;
    if (locked || !scene) return;
    const p = P(id);
    gsap.to(scene.state, { x: p.x, y: p.y, s: p.s, amp: p.amp, o: p.o, duration: 1.5, ease: 'power3.inOut', overwrite: true });
    gsap.to(meshState, { o: p.bg, duration: 1.4, ease: 'power2.out', overwrite: true, onUpdate: applyMesh });
  };

  /* --- начальные состояния --- */
  const heroLines = $$('#heroTitle .ln > span');
  gsap.set(heroLines, { yPercent: 115, rotate: 5 });
  gsap.set('.hero-fade', { opacity: 0, y: 24 });
  gsap.set('#nav', { opacity: 0, y: -24 });
  const letters = $$('#loaderWord span');
  gsap.set(letters, { yPercent: 115 });

  /* --- прелоадер (на телефоне короче) --- */
  const small = isMob();
  const counter = $('#count'), bar = $('#bar'), prog = { v: 0 };
  const loadTl = gsap.timeline();
  loadTl.to(letters, { yPercent: 0, duration: small ? 0.8 : 1.1, stagger: small ? 0.05 : 0.07, ease: 'expo.out' }, 0.1)
    .to(prog, {
      v: 100, duration: small ? 1.5 : 2.5, ease: 'power2.inOut',
      onUpdate: () => { counter.textContent = String(Math.round(prog.v)).padStart(3, '0'); bar.style.transform = 'scaleX(' + prog.v / 100 + ')'; }
    }, 0);

  const ready = Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }))
    ]),
    new Promise(r => setTimeout(r, small ? 3000 : 6000))
  ]);

  Promise.all([new Promise(r => loadTl.eventCallback('onComplete', r)), ready]).then(() => {
    gsap.timeline()
      .to(letters, { yPercent: -115, duration: 0.8, stagger: 0.045, ease: 'power3.in' })
      .to('.loader-meta', { opacity: 0, duration: 0.4 }, '<')
      .to(loader, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=0.25')
      .add(() => { loader.style.display = 'none'; }, '>')
      .add(intro, '-=0.8');
  });

  function intro() {
    document.documentElement.classList.remove('lock');
    if (lenisRef) lenisRef.start();
    ScrollTrigger.refresh();
    gsap.to(heroLines, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.11, ease: 'expo.out' });
    gsap.to('.hero-fade', { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, delay: 0.5, ease: 'power3.out' });
    gsap.to('#nav', { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' });
    if (mesh) mesh.set(P('hero').bg);
    if (scene) {
      const p = P('hero');
      scene.state.x = p.x; scene.state.y = p.y; scene.state.amp = p.amp;
      gsap.to(scene.state, { s: p.s, duration: 2.4, ease: 'elastic.out(1, 0.6)', onComplete: () => { locked = false; goto(current); } });
    } else locked = false;
  }

  /* --- скролл-анимации (создаём в порядке DOM) --- */
  gsap.to('#heroTitle', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-top, .hero-foot', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '20% top', end: '70% top', scrub: true } });

  /* марки: скос от скорости скролла */
  const skew = gsap.quickTo('.mq', 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => { const v = self.getVelocity(); skew(gsap.utils.clamp(-12, 12, v / -220)); if (scene) scene.setVelocity(v); }
  });

  /* горизонтальная галерея работ */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    const track = $('#track'), pin = $('.work-pin');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true }
    });
    gsap.to('.work-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), scrub: true } });
    $$('.card .ph img').forEach(img => {
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.card'), containerAnimation: tween, start: 'left 100%', end: 'right 0%', scrub: true } });
    });
    $$('.card').forEach(card => {
      gsap.from(card.querySelector('.card-info'), { y: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 92%', end: 'left 55%', scrub: true } });
    });
  });
  mm.add('(max-width: 820px)', () => {
    $$('.panel, .card').forEach(el => gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  });

  /* реел: рамка раскрывается на весь экран */
  const cp0 = isMob() ? 'inset(30vh 7vw 30vh 7vw round 24px)' : 'inset(24vh 28vw 24vh 28vw round 32px)';
  gsap.set('#reelUi', { opacity: 0, y: 40 });
  /* fromTo с обеими строками: иначе браузер сворачивает clip-path в короткую запись и значения интерполируются со сдвигом */
  gsap.timeline({ scrollTrigger: { trigger: '#reelPin', start: 'top top', end: isMob() ? '+=105%' : '+=150%', scrub: true, pin: true, anticipatePin: 1 } })
    .fromTo('#reelFrame', { clipPath: cp0 }, { clipPath: 'inset(0vh 0vw 0vh 0vw round 0px)', ease: 'none', duration: 1 }, 0)
    .fromTo('#reelMedia', { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
    .to('.reel-title', { scale: 1.12, opacity: 0.4, ease: 'none', duration: 1 }, 0)
    .to('#reelUi', { opacity: 1, y: 0, ease: 'power2.out', duration: 0.4 }, 0.62);

  /* о себе: слова проявляются при скролле */
  const sp = $('#statement p');
  sp.innerHTML = sp.textContent.trim().split(/\s+/).map(w => '<span class="w' + (/^(сделать|выложить)/i.test(w) ? ' hl' : '') + '">' + w + '</span>').join(' ');
  gsap.to('#statement .w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 78%', end: 'bottom 42%', scrub: true } });

  gsap.fromTo('#photo', { clipPath: 'inset(100% 0 0 0 round 22px)' }, { clipPath: 'inset(0% 0 0 0 round 22px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#photo', start: 'top 85%' } });
  gsap.fromTo('#photo img, #photo .fb', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '#photo', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.about-text > p', { y: 36, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.about-text', start: 'top 80%' } });
  gsap.from('.principles.bento li', { y: 36, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.principles.bento', start: 'top 88%' } });

  /* железо и игры с кино */
  gsap.from('.spec-grid > div', { y: 36, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.spec-grid', start: 'top 82%' } });
  gsap.from('.media-cols > div', { y: 40, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.media-cols', start: 'top 82%' } });
  gsap.from('.plain-list li', { x: -20, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: '.plain-list', start: 'top 85%' } });

  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('ru-RU'); } })
    });
  });

  gsap.from('.rows li', { y: 40, opacity: 0, duration: 1, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: '.rows', start: 'top 82%' } });
  gsap.from('.contact h2, .mail, .links a', { y: 60, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 65%' } });

  /* смена состояния 3D-объекта по секциям (создаём последними) */
  ['hero', 'work', 'reel', 'about', 'hardware', 'media', 'stack', 'contact'].forEach(id => {
    ScrollTrigger.create({ trigger: '#' + id, start: 'top 60%', end: 'bottom 60%', onToggle: self => { if (self.isActive) goto(id); } });
  });

  addEventListener('load', () => ScrollTrigger.refresh());
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (scene && !locked) { const p = P(current); Object.assign(scene.state, { x: p.x, y: p.y, s: p.s, amp: p.amp, o: p.o }); } ScrollTrigger.refresh(); }, 200); });
}
