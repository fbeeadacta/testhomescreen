// Genera ../casa-3d-v2.html: un unico file (funziona anche da file://) con three.js, N8AO, modelli glTF e texture incorporati.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const r = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020',
  loader: { '.glb': 'dataurl', '.jpg': 'dataurl' }, legalComments: 'none',
});
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = readFileSync('template.html', 'utf8').replace('<script>/*APP*/</script>', () => `<script>${js}</script>`);
writeFileSync('../casa-3d-v2.html', html);
console.log('casa-3d-v2.html', (html.length / 1048576).toFixed(1), 'MB');
