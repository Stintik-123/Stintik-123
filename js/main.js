/* load full main from parts (API size limit workaround) */
const base = import.meta.url;
const [a, b] = await Promise.all([
  fetch(new URL('./main.part0.js', base)).then(r => r.text()),
  fetch(new URL('./main.part1.js', base)).then(r => r.text()),
]);
const code = a + b;
const blob = new Blob([code], { type: 'text/javascript' });
await import(URL.createObjectURL(blob));
