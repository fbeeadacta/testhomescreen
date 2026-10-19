// Genera ../casa-3d-v2.html: un unico file (funziona anche da file://) con three.js, N8AO, modelli glTF e texture incorporati.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const r = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020',
  loader: { '.glb': 'binary', '.jpg': 'binary' }, legalComments: 'none',
});
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = readFileSync('template.html', 'utf8').replace('<script>/*APP*/</script>', () => `<script>${js}</script>`);
writeFileSync('../casa-3d-v2.html', html);
// versione per pagina web (Artifact): senza doctype/html/head/body, che la piattaforma aggiunge da sé
const page = html.replace(/<!DOCTYPE html>\s*/i, '').replace(/<\/?html[^>]*>\s*/g, '').replace(/<\/?head>\s*/g, '').replace(/<\/?body>\s*/g, '')
  .replace(/<meta charset="UTF-8">\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
writeFileSync('../casa-3d-web.html', page);
console.log('casa-3d-v2.html', (html.length / 1048576).toFixed(1), 'MB');
