/* ============================================================
   Mesh-фон в духе Scrolltide: живой градиент на WebGL-шейдере.
   Плавные цветовые пятна перетекают во времени, как их «Mesh»-шейдеры.
   Нативный WebGL без зависимостей, рендер в низком разрешении:
   фон мягкий по природе, поэтому дешёвый и на телефоне.
   ============================================================ */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.02 + 11.3;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 1.7;
  float t = uTime * 0.055;

  // доменное искажение — пятна «текут», а не просто ездят
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.4));
  float f = fbm(p + 2.1 * r);

  vec3 base   = vec3(0.043, 0.043, 0.047);
  vec3 orange = vec3(1.00, 0.35, 0.12);
  vec3 violet = vec3(0.42, 0.24, 1.00);
  vec3 cyan   = vec3(0.00, 0.76, 1.00);

  vec3 col = mix(base, violet * 0.34, clamp(f * f * 1.7, 0.0, 1.0));
  col += orange * smoothstep(0.66, 0.22, length(p - vec2(0.38 * sin(t * 1.3), 0.10 + 0.18 * cos(t * 0.9)))) * 0.30;
  col += cyan   * smoothstep(0.62, 0.24, length(p - vec2(-0.42 * cos(t * 0.8), -0.34 + 0.20 * sin(t * 1.1)))) * 0.20;

  // мягкая виньетка, чтобы края не спорили с текстом
  float vig = smoothstep(1.30, 0.30, length((uv - 0.5) * vec2(1.05, 1.0)));
  col *= mix(0.30, 0.85, vig);

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[mesh] shader error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * @param {string} id  id канваса
 * @returns {{set:Function, scale:Function, destroy:Function}|null}
 */
export function initMesh(id = 'mesh') {
  const canvas = document.getElementById(id);
  if (!canvas) return null;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;

  let gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
  if (!gl) { canvas.remove(); return null; }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return null; }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[mesh] link error:', gl.getProgramInfoLog(prog));
    canvas.remove();
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');

  // телефон — считаем вчетверо меньше пикселей, фон это прощает
  let q = coarse || cores <= 4 ? 0.42 : 0.7;
  let w = 1, h = 1;
  let visible = true;
  let every = 1;   // рендерим не каждый кадр (экономим батарею)

  function resize() {
    const cw = Math.max(1, innerWidth), ch = Math.max(1, innerHeight);
    w = Math.max(2, Math.round(cw * q));
    h = Math.max(2, Math.round(ch * q));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const t0 = performance.now();
  let frame = 0;

  function draw(now) {
    frame++;
    if (visible && frame % every === 0) {
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  return {
    /** прозрачность фона 0..1 */
    set(v) { canvas.style.opacity = String(Math.max(0, Math.min(1, v))); },
    /** качество (разрешение рендера) */
    scale(s) {
      q = Math.max(0.2, Math.min(1, s));
      every = q <= 0.5 ? 2 : 1;
      resize();
    },
    destroy() { canvas.remove(); },
  };
}
