/* Интро на Three.js: стопка карточек проектов → разлёт → сайт.

   Сцена живёт и после интро: карточки медленно дрейфуют фоном.
   Превью берутся из assets/projects/*.jpg. */
import * as THREE from '../assets/vendor/three.module.min.js';

const CARDS = [
  { src: 'assets/projects/stintikvpn.jpg', title: 'StintikVPN', accent: true },
  { src: 'assets/projects/megathread.jpg', title: 'MegaThread' },
  { src: 'assets/projects/gamevoice.jpg', title: 'GameVoice' },
  { src: 'assets/projects/steamdeal.jpg', title: 'SteamDeal' },
  { src: 'assets/projects/overdrive.jpg', title: 'Overdrive' },
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Мягкий шейдер свечения по краям карточки. */
function cardMaterial(texture, accent) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      uGlow: { value: accent ? 0.55 : 0.22 },
      uTint: { value: new THREE.Color(accent ? '#ff4b2b' : '#ffffff') },
      uOpacity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float uGlow;
      uniform float uOpacity;
      uniform vec3 uTint;
      varying vec2 vUv;
      void main() {
        vec4 tex = texture2D(map, vUv);
        float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x)
                   * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
        vec3 rgb = mix(tex.rgb, uTint, uGlow * edge * 0.5);
        gl_FragColor = vec4(rgb, tex.a * uOpacity);
      }
    `,
    transparent: true,
  });
  return mat;
}

/**
 * Запускает интро-сцену.
 * @param {object} opts { onDone, onProgress }
 */
export function initIntro(opts = {}) {
  const overlay = document.getElementById('intro');
  const canvas = document.getElementById('introCanvas');
  const bar = document.getElementById('introBar');
  const pct = document.getElementById('introPct');
  if (!overlay || !canvas) {
    opts.onDone && opts.onDone();
    return null;
  }

  // без WebGL или с reduced-motion — просто показываем заставку и уходим
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    overlay.classList.add('is-gone');
    setTimeout(() => overlay.remove(), 600);
    opts.onDone && opts.onDone();
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 5.3);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  scene.add(group);

  const loader = new THREE.TextureLoader();
  const meshes = [];
  let loaded = 0;

  const CARD_W = 2.05;
  const CARD_H = 1.16;

  CARDS.forEach((card, i) => {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 16);
    const mat = cardMaterial(null, card.accent);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = {
      index: i,
      base: new THREE.Vector3((i - (CARDS.length - 1) / 2) * 0.34, (i % 2 ? 1 : -1) * 0.16, -i * 0.14),
      target: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3),
      tiltY: (i - (CARDS.length - 1) / 2) * 0.13,
      tiltX: (i % 2 ? 1 : -1) * 0.05,
      explode: false,
    };
    group.add(mesh);
    meshes.push(mesh);

    loader.load(
      card.src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        mat.uniforms.map.value = tex;
        mat.needsUpdate = true;
        loaded++;
        const p = Math.round((loaded / CARDS.length) * 100);
        if (bar) bar.style.width = p + '%';
        if (pct) pct.textContent = String(p).padStart(2, '0');
        opts.onProgress && opts.onProgress(p);
      },
      undefined,
      () => {
        loaded++;
        const p = Math.round((loaded / CARDS.length) * 100);
        if (bar) bar.style.width = p + '%';
        if (pct) pct.textContent = String(p).padStart(2, '0');
        opts.onProgress && opts.onProgress(p);
      }
    );
  });

  let w = 0;
  let h = 0;
  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // на узких экранах отодвигаем камеру, чтобы стопка карточек помещалась по ширине
    const needed = 4.4 / camera.aspect;
    camera.position.z = Math.max(5.3, needed);
  }
  resize();
  window.addEventListener('resize', resize);

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / w) * 2 - 1;
    pointer.y = -((e.clientY / h) * 2 - 1);
  });

  let started = false;
  let exploded = false;
  let fade = 1;
  const clock = new THREE.Clock();

  function explodeScene() {
    if (exploded) return;
    exploded = true;
    meshes.forEach((m, i) => {
      m.userData.explode = true;
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2 + 0.4,
        Math.random() * 1.5 + 0.6
      ).normalize();
      m.userData.vel.copy(dir.multiplyScalar(2.6 + Math.random() * 2.4));
    });
    if (overlay) overlay.classList.add('is-exploded');
  }

  function skip() {
    if (started) return;
    started = true;
    explodeScene();
  }

  overlay.addEventListener('click', skip);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') skip();
  });

  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    group.rotation.y += (pointer.x * 0.32 - group.rotation.y) * 0.045;
    group.rotation.x += (-pointer.y * 0.16 - group.rotation.x) * 0.045;
    group.position.y = 0.42 + Math.sin(t * 0.55) * 0.07;

    meshes.forEach((m, i) => {
      const u = m.userData;
      if (!u.explode) {
        const base = u.base;
        m.position.lerp(
          new THREE.Vector3(
            base.x + Math.sin(t * 0.7 + i) * 0.07,
            base.y + Math.cos(t * 0.6 + i * 1.3) * 0.06,
            base.z
          ),
          0.06
        );
        m.rotation.z = Math.sin(t * 0.45 + i * 0.8) * 0.05;
        m.rotation.y = u.tiltY + Math.sin(t * 0.5 + i) * 0.09;
        m.rotation.x = u.tiltX + Math.cos(t * 0.4 + i * 0.6) * 0.05;
        const s = 1 + Math.sin(t * 1.6 + i * 1.7) * 0.012;
        m.scale.setScalar(s);
      } else {
        u.vel.y -= 0.55 * dt;
        m.position.addScaledVector(u.vel, dt);
        m.rotation.x += u.spin.x * dt;
        m.rotation.y += u.spin.y * dt;
        m.rotation.z += u.spin.z * dt;
      }
    });

    renderer.render(scene, camera);

    if (!started && loaded >= CARDS.length) {
      setTimeout(() => {
        started = true;
        explodeScene();
      }, reduceMotion ? 200 : 2600);
    }

    if (exploded && started) {
      fade = Math.max(0, fade - 0.012);
      if (fade <= 0) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.classList.add('is-gone');
        // сцена остаётся фоном
        overlay.style.opacity = '';
        overlay.style.background = 'transparent';
        overlay.style.pointerEvents = 'none';
        overlay.classList.add('is-ambient');
        if (opts.onDone) opts.onDone();
        // дальше мягко растворяем карточки в фоне
        meshes.forEach((m, i) => {
          setTimeout(() => {
            m.userData.fadeOut = true;
          }, 900 + i * 140);
        });
      }
    }
  }

  // плавное растворение карточек после интро
  let ambient = true;
  const fadeLoop = () => {
    requestAnimationFrame(fadeLoop);
    meshes.forEach((m) => {
      if (m.userData.fadeOut) {
        const u = m.material.uniforms.uOpacity;
        u.value = Math.max(0, u.value - 0.012);
        if (u.value <= 0.01) m.visible = false;
      }
    });
    if (ambient) renderer.render(scene, camera);
  };
  fadeLoop();
  tick();

  return { explode: explodeScene, renderer, scene };
}
