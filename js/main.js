/* bootstrap: load full main.js from known-good commit, apply mobile no-WebGL patch */
const SRC = 'https://cdn.jsdelivr.net/gh/Stintik-123/Stintik-123@24b796b85715bcaa41c9582091228fedaa9db95a/js/main.js';
const res = await fetch(SRC);
if (!res.ok) throw new Error('failed to fetch main.js: ' + res.status);
let code = await res.text();

const old = `const scene = initScene();
initFx();
const mesh = initMesh();

if (!okGsap || reduce) {`;

const neu = `const wantGL = !reduce && !isMob() && typeof WebGLRenderingContext !== 'undefined';
const scene = wantGL ? initScene() : null;
initFx();
const mesh = wantGL ? initMesh() : null;
if (!wantGL) {
  const gl = $('#gl'), meshEl = $('#mesh');
  if (gl) gl.remove();
  if (meshEl) meshEl.remove();
  document.body.classList.add('no-gl');
}

if (!okGsap || reduce) {`;

if (code.includes(old)) code = code.replace(old, neu);
else console.warn('wantGL patch pattern not found');

/* mesh.js relative import must resolve against this page */
code = code.replace(
  "from './mesh.js'",
  "from '" + new URL('./mesh.js', import.meta.url).href + "'"
);

const blob = new Blob([code], { type: 'text/javascript' });
await import(URL.createObjectURL(blob));
