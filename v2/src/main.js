/* Casa Tovo – render navigabile v2
   Quote dalla Tav. 02 "Piante – Sol. A" (Arch. D. Baretta), altezze dalla sezione A-A.
   Coordinate: origine nell'angolo interno alto-sinistra della pianta; X → destra, Z → basso, Y → alto (m). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { N8AOPass } from 'n8ao';

import sofaURL from '../assets/GlamVelvetSofa.glb';
import chairURL from '../assets/SheenChair.glb';
import plantURL from '../assets/DiffuseTransmissionPlant.glb';
import vaseURL from '../assets/GlassVaseFlowers.glb';
import poufURL from '../assets/SpecularSilkPouf.glb';
import carURL from '../assets/CarConcept.glb';
import woodDiffURL from '../assets/hardwood2_diffuse.jpg';
import woodRoughURL from '../assets/hardwood2_roughness.jpg';
import woodBumpURL from '../assets/hardwood2_bump.jpg';
import grassURL from '../assets/grasslight-big.jpg';
import brickURL from '../assets/brick_diffuse.jpg';
import brickBumpURL from '../assets/brick_bump.jpg';

/* ═════════════════════════ Dati di progetto ═════════════════════════ */
const T = 0.45;                         // muro esterno 30 cm + cappotto 15 cm
const TI = 0.13;                        // tramezzi
const IN = { x0: 0, x1: 7.40, z0: 0, z1: 13.52 };           // filo interno
const OUT = { x0: -T, x1: 7.40 + T, z0: -T, z1: 13.52 + T }; // filo esterno
const XR = 3.15, YR = 3.57;             // colmo (sez. A-A: 3,17 / 3,57 / 2,85)
const SL = (YR - 3.17) / XR, SR = (YR - 2.85) / (IN.x1 - XR);
const under = x => (x <= XR ? YR - (XR - x) * SL : YR - (x - XR) * SR);
const CARPORT = { z0: -3.85, zi: -3.55, x1: 8.46 };
const PORCH = { x0: OUT.x1, x1: 11.45, z0: 7.6, z1: OUT.z1 };
const ROOF = { xL: -1.36, xR: 8.75, xP: 12.43, zA: -4.15, zP: 6.52, zB: 14.87, th: 0.24 };

const ROOMS = [
  { id: 'living', name: 'Zona giorno', area: '35,71 m²', floor: 'porc', rects: [[0, 9.58, 7.40, 13.52], [2.98, 8.09, 7.40, 9.58]], lamp: [[1.7, 11.6], [5.9, 9.2], [5.9, 12.4]], label: [3.2, 11.2], spawn: [3.48, 9.0, Math.PI] },
  { id: 'dis', name: 'Disimpegno', area: '5,87 m²', floor: 'wood', rects: [[2.98, 2.89, 3.98, 7.96], [3.98, 4.11, 4.57, 5.63]], lamp: [[3.48, 3.9], [3.48, 6.4]], label: [3.48, 5.4], spawn: [3.48, 7.4, 0] },
  { id: 'matr', name: 'Camera matrimoniale', area: '15,02 m²', floor: 'wood', rects: [[3.45, 0, 7.40, 2.76], [4.11, 2.76, 7.40, 3.98]], lamp: [[5.4, 1.9]], label: [5.6, 2.3], spawn: [5.6, 3.1, 0] },
  { id: 'cam', name: 'Camera', area: '12,68 m²', floor: 'wood', rects: [[0, 0, 3.32, 2.76], [0, 2.76, 2.85, 3.98]], lamp: [[1.7, 1.9]], label: [1.9, 2.0], spawn: [2.2, 3.4, 0.3] },
  { id: 'b1', name: 'Bagno 1', area: '5,72 m²', floor: 'bath', rects: [[0, 4.11, 2.85, 6.12]], lamp: [[1.4, 5.1]], label: [1.6, 5.1], spawn: [1.7, 5.5, Math.PI / 2] },
  { id: 'studio', name: 'Camera / studio', area: '9,12 m²', floor: 'wood', rects: [[0, 6.25, 2.85, 9.45]], lamp: [[1.4, 7.8]], label: [1.5, 7.6], spawn: [2.4, 7.3, 1.4] },
  { id: 'b2', name: 'Bagno 2', area: '4,10 m²', floor: 'bath', rects: [[4.70, 4.11, 7.40, 5.63]], lamp: [[6.1, 4.9]], label: [6.2, 4.8], spawn: [6.85, 3.5, Math.PI] },
  { id: 'ct', name: 'CT / Lavanderia', area: '7,26 m²', floor: 'bath', rects: [[4.11, 5.76, 7.40, 7.96]], lamp: [[5.8, 6.9]], label: [5.8, 6.9], spawn: [4.6, 6.8, -1.6] },
];

/* ═════════════════════════ Renderer & scena ═════════════════════════ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 900);
camera.rotation.order = 'YXZ';
scene.add(camera);
const isTouch = matchMedia('(pointer:coarse)').matches;

/* ═════════════════════════ Texture procedurali ═════════════════════════ */
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function canvasTex(size, draw, { srgb = true, rep = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function speckle(g, s, n, a, sz = 2) { for (let i = 0; i < n; i++) { const v = rnd() * 255 | 0; g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(rnd() * s, rnd() * s, sz * rnd() + 0.5, sz * rnd() + 0.5); } }
function blotch(g, s, n, a) { for (let i = 0; i < n; i++) { const v = rnd() * 255 | 0, r = 10 + rnd() * 50; const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${v},${v},${v},${a})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.save(); g.translate(rnd() * s, rnd() * s); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); } }

const TX = {};
TX.plaster = canvasTex(512, (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); blotch(g, s, 120, 0.012); speckle(g, s, 9000, 0.03, 1.5); });
TX.plasterBump = canvasTex(512, (g, s) => { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); speckle(g, s, 26000, 0.35, 1.6); }, { srgb: false });
TX.porc = canvasTex(1024, (g, s) => {                       // gres porcellanato 60×120
  g.fillStyle = '#d9d5ce'; g.fillRect(0, 0, s, s); blotch(g, s, 260, 0.05);
  g.strokeStyle = 'rgba(150,140,128,.18)'; g.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { g.beginPath(); let x = rnd() * s, y = rnd() * s; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rnd() - .4) * 60; y += (rnd() - .5) * 40; g.lineTo(x, y); } g.stroke(); }
  g.fillStyle = 'rgba(90,85,80,.55)'; for (let i = 0; i <= 2; i++) g.fillRect(0, i * s / 2 - 1.5, s, 3);
  for (let r = 0; r < 2; r++) g.fillRect((r % 2) * s / 2 - 1.5 + s / 4 * 0, r * s / 2, 3, s / 2);
}, { rep: 1 });
TX.bath = canvasTex(512, (g, s) => {
  g.fillStyle = '#e9ebe9'; g.fillRect(0, 0, s, s); blotch(g, s, 80, 0.03);
  g.fillStyle = 'rgba(150,155,158,.9)'; for (let i = 0; i <= 4; i++) { g.fillRect(0, i * s / 4 - 1, s, 2); } for (let i = 0; i <= 2; i++) g.fillRect(i * s / 2 - 1, 0, 2, s);
});
TX.roof = canvasTex(512, (g, s) => {                        // coppi
  const cols = 8, rows = 6, w = s / cols, h = s / rows;
  g.fillStyle = '#3a1b10'; g.fillRect(0, 0, s, s);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const hue = 10 + rnd() * 10, l = 34 + rnd() * 12, x = c * w + (r % 2) * w / 2, y = r * h;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, `hsl(${hue},45%,${l - 14}%)`); gr.addColorStop(0.45, `hsl(${hue},50%,${l + 6}%)`); gr.addColorStop(1, `hsl(${hue},45%,${l - 16}%)`);
    g.fillStyle = gr; g.fillRect(x + 1, y, w - 2, h - 2); g.fillRect(x + 1 - s, y, w - 2, h - 2);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + h - 6, w, 6); g.fillRect(x - s, y + h - 6, w, 6);
    g.fillStyle = `rgba(40,60,30,${rnd() * 0.12})`; g.fillRect(x + rnd() * w, y + rnd() * h, 8, 4);
  }
});
TX.roofBump = canvasTex(512, (g, s) => {
  const cols = 8, rows = 6, w = s / cols, h = s / rows; g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
  for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
    const x = c * w + (r % 2) * w / 2, y = r * h, gr = g.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, '#222'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#222'); g.fillStyle = gr; g.fillRect(x, y, w, h - 5);
  }
}, { srgb: false });
TX.pave = canvasTex(512, (g, s) => {
  g.fillStyle = '#6d6b67'; g.fillRect(0, 0, s, s);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) { const x = c * 128 + (r % 2) * 64; g.fillStyle = `hsl(35,${6 + rnd() * 6}%,${55 + rnd() * 14}%)`; g.fillRect(x + 2, r * 64 + 2, 124, 60); }
  speckle(g, s, 6000, 0.12);
});
TX.stone = canvasTex(512, (g, s) => {
  g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, s, s); blotch(g, s, 120, 0.06); speckle(g, s, 9000, 0.1);
  g.fillStyle = 'rgba(70,65,60,.5)'; for (let i = 0; i <= 4; i++) { g.fillRect(0, i * s / 4 - 1, s, 2); g.fillRect(i * s / 4 - 1, 0, 2, s); }
});
TX.gravel = canvasTex(512, (g, s) => { g.fillStyle = '#b3a993'; g.fillRect(0, 0, s, s); speckle(g, s, 30000, 0.35, 3.5); });
TX.asphalt = canvasTex(256, (g, s) => { g.fillStyle = '#3f4144'; g.fillRect(0, 0, s, s); speckle(g, s, 9000, 0.2, 1.5); });
TX.rug = canvasTex(512, (g, s) => {
  g.fillStyle = '#cfc4b2'; g.fillRect(0, 0, s, s); speckle(g, s, 20000, 0.08, 1);
  g.strokeStyle = '#8c7a62'; g.lineWidth = 10; g.strokeRect(24, 24, s - 48, s - 48); g.lineWidth = 3; g.strokeRect(48, 48, s - 96, s - 96);
}, { rep: 1 });
TX.fabric = canvasTex(256, (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); for (let i = 0; i < s; i += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.04})`; g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); } }, { rep: 1 });

function img(bytes, { srgb = true, rep = 1 } = {}) {
  const t = new THREE.Texture(); t.flipY = false;
  createImageBitmap(new Blob([bytes], { type: 'image/jpeg' })).then(b => { t.image = b; t.needsUpdate = true; }).catch(e => console.warn('texture', e)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
TX.wood = img(woodDiffURL); TX.woodR = img(woodRoughURL, { srgb: false }); TX.woodB = img(woodBumpURL, { srgb: false });
TX.grass = img(grassURL); TX.brick = img(brickURL); TX.brickB = img(brickBumpURL, { srgb: false });

/* ═════════════════════════ Materiali ═════════════════════════ */
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
const phy = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: 0.5, metalness: 0 }, o));
const M = {
  facade: std({ color: 0xc58f6c, map: TX.plaster, bumpMap: TX.plasterBump, bumpScale: 1.2, roughness: 0.95 }),
  plinth: std({ color: 0x6d625a, map: TX.plaster, roughness: 0.95 }),
  plaster: std({ color: 0xece7df, map: TX.plaster, bumpMap: TX.plasterBump, bumpScale: 0.4, roughness: 0.92 }),
  ceil: std({ color: 0xfbfaf7, map: TX.plaster, roughness: 0.95 }),
  soffit: std({ color: 0xc7a07a, map: TX.wood, roughness: 0.7 }),
  roof: std({ color: 0xffffff, map: TX.roof, bumpMap: TX.roofBump, bumpScale: 4, roughness: 0.75 }),
  roofEdge: std({ color: 0x5a2c1c, roughness: 0.8 }),
  slab: std({ color: 0x77736d, roughness: 0.95 }),
  wood: std({ color: 0xffffff, map: TX.wood, roughnessMap: TX.woodR, bumpMap: TX.woodB, bumpScale: 0.6, roughness: 1 }),
  porc: std({ color: 0xffffff, map: TX.porc, roughness: 0.32 }),
  bath: std({ color: 0xffffff, map: TX.bath, roughness: 0.25 }),
  bathWall: std({ color: 0xf2f2ef, map: TX.bath, roughness: 0.2 }),
  stone: std({ color: 0xffffff, map: TX.stone, roughness: 0.7 }),
  sill: std({ color: 0xe1ddd3, map: TX.plaster, roughness: 0.45 }),
  pave: std({ color: 0xffffff, map: TX.pave, roughness: 0.9 }),
  gravel: std({ color: 0xffffff, map: TX.gravel, roughness: 1 }),
  asphalt: std({ color: 0xffffff, map: TX.asphalt, roughness: 0.9 }),
  grass: std({ color: 0xc8d8b0, map: TX.grass, roughness: 1 }),
  brick: std({ color: 0xcdb9ab, map: TX.brick, bumpMap: TX.brickB, bumpScale: 2, roughness: 0.9 }),
  frame: std({ color: 0x9a5a28, map: TX.wood, roughness: 0.55 }),
  glass: phy({ color: 0xdfeff7, roughness: 0.02, transparent: true, opacity: 0.16, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }),
  door: std({ color: 0xf6f3ee, roughness: 0.35 }),
  doorExt: std({ color: 0x6b3f1e, map: TX.wood, roughness: 0.5 }),
  chrome: std({ color: 0xdfe3e6, roughness: 0.12, metalness: 1 }),
  steel: std({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 }),
  blackMetal: std({ color: 0x232426, roughness: 0.45, metalness: 0.6 }),
  ceramic: phy({ color: 0xf7f7f5, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }),
  lacquer: std({ color: 0xece8e1, roughness: 0.3 }),
  lacquerDark: std({ color: 0x3b4044, roughness: 0.35 }),
  oak: std({ color: 0xd9b48a, map: TX.wood, roughnessMap: TX.woodR, roughness: 0.8 }),
  walnut: std({ color: 0x8a5a3a, map: TX.wood, roughness: 0.6 }),
  top: std({ color: 0x2e2f31, map: TX.plaster, roughness: 0.25 }),
  marble: phy({ color: 0xf0eee9, map: TX.porc, roughness: 0.15, clearcoat: 0.6 }),
  blackGlass: phy({ color: 0x0b0c0e, roughness: 0.05, clearcoat: 1 }),
  screen: std({ color: 0x0a0b0d, roughness: 0.1, emissive: 0x05070a }),
  mirror: std({ color: 0xffffff, roughness: 0.02, metalness: 1 }),
  fabricBlue: std({ color: 0x5f7486, map: TX.fabric, roughness: 1 }),
  fabricSand: std({ color: 0xc9b493, map: TX.fabric, roughness: 1 }),
  fabricGrey: std({ color: 0x8e9196, map: TX.fabric, roughness: 1 }),
  fabricGreen: std({ color: 0x6f8466, map: TX.fabric, roughness: 1 }),
  linen: std({ color: 0xf2efe8, map: TX.fabric, roughness: 1 }),
  rug: std({ color: 0xffffff, map: TX.rug, roughness: 1 }),
  lampShade: std({ color: 0xfff6e8, emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.6, side: THREE.DoubleSide }),
  bulb: std({ color: 0xffffff, emissive: 0xfff0d0, emissiveIntensity: 0 }),
  leaf: std({ color: 0x4e7a3c, roughness: 0.9, flatShading: false, vertexColors: true }),
  cypress: std({ color: 0x2f4f2b, roughness: 0.95, vertexColors: true }),
  trunk: std({ color: 0x5c4330, roughness: 1 }),
  hedge: std({ color: 0x3f6a35, roughness: 1, vertexColors: true }),
  hill: std({ color: 0x5f7a4c, roughness: 1, vertexColors: true, flatShading: true }),
  white: std({ color: 0xf2f2f0, roughness: 0.5 }),
  copper: std({ color: 0x8a6a4a, roughness: 0.45, metalness: 0.6 }),
  shower: phy({ color: 0xe8f4f7, roughness: 0.02, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
  water: std({ color: 0x9fb4c0, roughness: 0.1 }),
};

/* ═════════════════════════ Accumulatori geometria ═════════════════════════ */
// UV in metri in base alla normale (pareti, pavimenti e arredi condividono materiali con texture “a scala reale”)
function worldUV(geo, scale = 1) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u * scale; uv[i * 2 + 1] = v * scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
}
class Bucket {
  constructor() { this.map = new Map(); }
  add(geo, mat, opt = {}) {
    if (geo.index) geo = geo.toNonIndexed();
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (opt.uv !== false) worldUV(geo, opt.uvScale ?? 1);
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    const key = mat.uuid + (opt.noShadow ? 'n' : '');
    if (!this.map.has(key)) this.map.set(key, { mat, geos: [], noShadow: opt.noShadow });
    this.map.get(key).geos.push(geo);
  }
  build(parent) {
    for (const { mat, geos, noShadow } of this.map.values()) {
      const m = new THREE.Mesh(mergeGeometries(geos), mat);
      m.castShadow = !noShadow && !mat.transparent; m.receiveShadow = true; parent.add(m);
    }
  }
}
const world = new THREE.Group(); scene.add(world);
const roofGroup = new THREE.Group(); world.add(roofGroup);
const furnGroup = new THREE.Group(); world.add(furnGroup);
const labelGroup = new THREE.Group(); labelGroup.visible = false; world.add(labelGroup);
const ARCH = new Bucket(), ROOFB = new Bucket(), FURN = new Bucket();
const colliders = [], planRects = [];
const solid = (x0, z0, x1, z1) => colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });

// trasformazione corrente per gli arredi (posizione + rotazione Y)
let XF = new THREE.Matrix4();
function at(x, z, rot, fn, y = 0) { const prev = XF; XF = prev.clone().multiply(new THREE.Matrix4().makeRotationY(rot || 0).premultiply(new THREE.Matrix4().makeTranslation(x, y, z))); fn(); XF = prev; }
const lp = (x, z) => new THREE.Vector3(x, 0, z).applyMatrix4(XF);
function solidLocal(x0, z0, x1, z1) { const a = lp(x0, z0), b = lp(x1, z1); solid(a.x, a.z, b.x, b.z); }

const gBox = (x0, y0, z0, x1, y1, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const gRBox = (x0, y0, z0, x1, y1, z1, r = 0.02, seg = 2) => {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0; r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  return new RoundedBoxGeometry(w, h, d, seg, Math.max(r, 0.001)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
};
const gCyl = (x, y0, z, rt, rb, h, seg = 24) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y0 + h / 2, z);
// pezzo d'arredo (coordinate locali → mondo tramite XF)
function P(geo, mat, opt) { geo.applyMatrix4(XF); FURN.add(geo, mat, opt); return geo; }
function A(geo, mat, opt) { ARCH.add(geo, mat, opt); }

/* ═════════════════════════ Muri ═════════════════════════ */
function prismX(a, b, y0, top, lo, hi) {
  const pts = [[a, y0], [b, y0], [b, top(b)]]; if (a < XR && b > XR) pts.push([XR, top(XR)]); pts.push([a, top(a)]);
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))), { depth: hi - lo, bevelEnabled: false, curveSegments: 1 });
  return g.translate(0, 0, lo);
}
/* wall(x0,z0,x1,z1,{inner:'lo'|'hi', inset, mat, outMat, openings:[{c,w,s,h,k}], low}) */
function wall(x0, z0, x1, z1, o = {}) {
  const alongX = (x1 - x0) >= (z1 - z0);
  const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, lo = alongX ? z0 : x0, hi = alongX ? z1 : x1;
  const prof = x => under(x) + 0.01, topZ = o.top ?? Math.max(under(lo), under(hi)) + 0.02;
  const ops = (o.openings || []).slice().sort((p, q) => p.c - q.c);
  const pieces = []; let cur = a0;
  for (const op of ops) {
    const oa = op.c - op.w / 2, ob = op.c + op.w / 2;
    if (oa > cur) pieces.push({ a: cur, b: oa, y0: 0, y1: null });
    if (op.s > 0) pieces.push({ a: oa, b: ob, y0: 0, y1: op.s });
    pieces.push({ a: oa, b: ob, y0: op.s + op.h, y1: null });
    cur = ob;
  }
  if (cur < a1) pieces.push({ a: cur, b: a1, y0: 0, y1: null });
  // strati: facciata 12 cm + intonaco interno (le mazzette risultano intonacate)
  const layers = o.inner === 'lo' ? [[hi - 0.12, hi, o.outMat || M.facade, false], [lo, hi - 0.12, o.inMat || M.plaster, true]]
    : o.inner === 'hi' ? [[lo, lo + 0.12, o.outMat || M.facade, false], [lo + 0.12, hi, o.inMat || M.plaster, true]]
      : [[lo, hi, o.mat || M.plaster, true]];
  for (const p of pieces) {
    for (const [l0, l1, mat, inner] of layers) {
      const inset = inner && o.inner ? (o.inset || 0) : 0;
      const segs = [[Math.max(p.a, a0 + inset), Math.min(p.b, a1 - inset), mat]];
      if (inset) { segs.push([p.a, Math.min(p.b, a0 + inset), o.outMat || M.facade]); segs.push([Math.max(p.a, a1 - inset), p.b, o.outMat || M.facade]); }
      for (const [pa, pb, mm] of segs) {
        if (pb - pa < 1e-4) continue;
        if (alongX) A(p.y1 === null && !o.flatTop ? prismX(pa, pb, p.y0, prof, l0, l1) : gBox(pa, p.y0, l0, pb, p.y1 ?? topZ, l1), mm);
        else A(gBox(l0, p.y0, pa, l1, p.y1 ?? topZ, pb), mm);
      }
    }
    // battiscopa sulle facce interne
    if (p.y0 === 0 && p.y1 === null && !o.noBase) {
      const faces = o.inner === 'lo' ? [lo] : o.inner === 'hi' ? [hi] : [lo, hi];
      for (const f of faces) {
        const d = f === lo ? -0.012 : 0.012, pa = p.a, pb = p.b;
        if (alongX) A(gBox(pa, 0, Math.min(f, f + d), pb, 0.08, Math.max(f, f + d)), M.white);
        else A(gBox(Math.min(f, f + d), 0, pa, Math.max(f, f + d), 0.08, pb), M.white);
      }
    }
    const ty = p.y1 ?? 3;
    if (p.y0 < 1.7 && ty > 0.3) { const r = alongX ? { x0: p.a, x1: p.b, z0: lo, z1: hi } : { x0: lo, x1: hi, z0: p.a, z1: p.b }; colliders.push(r); planRects.push(r); }
  }
  for (const op of ops) opening(op, alongX, lo, hi, o.inner);
}

/* ═════════════════════════ Serramenti ═════════════════════════ */
// costruisce in coordinate locali dell'apertura: X lungo il muro (centro = 0), Y dal pavimento, Z attraverso il muro (0 = mezzeria)
function opening(op, alongX, lo, hi, inner) {
  const th = hi - lo, mid = (lo + hi) / 2, w = op.w, h = op.h, s = op.s;
  const outSign = inner === 'lo' ? 1 : inner === 'hi' ? -1 : 0;           // lato esterno rispetto alla mezzeria (+Z locale)
  const rot = alongX ? 0 : -Math.PI / 2;                                  // per i muri lungo Z la X locale va verso +Z
  const fx = alongX ? op.c : mid, fz = alongX ? mid : op.c;
  // Z locale: per muri lungo X coincide con Z mondo; per muri lungo Z (rot -90°) la Z locale va verso −X mondo
  const zOut = alongX ? outSign : -outSign;
  at(fx, fz, rot, () => {
    const fd = 0.07, fw = 0.065;
    const zf = op.k === 'door' ? 0 : zOut * (th / 2 - 0.2);                 // piano del serramento
    const fr = (x0, y0, x1, y1, mat = M.frame, d = fd) => P(gRBox(x0, y0, zf - d / 2, x1, y1, zf + d / 2, 0.006), mat);
    if (op.k === 'door' || op.k === 'front') {
      const isF = op.k === 'front', leafT = isF ? 0.07 : 0.045, fm = isF ? M.frame : M.door;
      // telaio / coprifili
      const cw = isF ? 0.08 : 0.07, d = isF ? 0.12 : th + 0.03;
      P(gRBox(-w / 2 - cw, 0, zf - d / 2, -w / 2, h + cw, zf + d / 2, 0.005), fm);
      P(gRBox(w / 2, 0, zf - d / 2, w / 2 + cw, h + cw, zf + d / 2, 0.005), fm);
      P(gRBox(-w / 2, h, zf - d / 2, w / 2, h + cw, zf + d / 2, 0.005), fm);
      // soglia
      P(gBox(-w / 2, 0, -th / 2, w / 2, 0.012, th / 2), isF ? M.stone : M.marble);
      // anta socchiusa, incernierata a −X
      const ang = (op.swing ?? 1) * (isF ? 1.15 : 1.35), lw = w - 0.02;
      const sub = new THREE.Matrix4().makeTranslation(-w / 2 + 0.01, 0, zf).multiply(new THREE.Matrix4().makeRotationY(ang));
      const prev = XF; XF = prev.clone().multiply(sub);
      P(gRBox(0, 0.01, -leafT / 2, lw, h - 0.01, leafT / 2, 0.008), isF ? M.doorExt : M.door);
      if (isF) for (let i = 1; i < 5; i++) P(gBox(i * lw / 5 - 0.006, 0.15, leafT / 2 - 0.004, i * lw / 5 + 0.006, h - 0.15, leafT / 2 + 0.002), M.walnut);
      for (const sd of [1, -1]) {                                           // maniglie
        if (isF) P(gCyl(lw - 0.1, 0.6, sd * (leafT / 2 + 0.04), 0.012, 0.012, 1.0, 10), M.steel);
        else { P(gCyl(lw - 0.07, 0.96, sd * (leafT / 2 + 0.012), 0.025, 0.025, 0.012, 16).rotateX(0), M.chrome); P(gRBox(lw - 0.2, 0.99, sd * (leafT / 2 + 0.03) - 0.009, lw - 0.06, 1.01, sd * (leafT / 2 + 0.03) + 0.009, 0.008), M.chrome); }
      }
      XF = prev;
      return;
    }
    // finestre, portefinestre, scorrevole (coordinate Y relative al davanzale)
    at(0, 0, 0, () => windowBody(), s);
  });
  function windowBody() {
    const fd = 0.07, fw = 0.065, zf = zOut * (th / 2 - 0.2);
    const fr = (x0, y0, x1, y1, mat = M.frame, d = fd) => P(gRBox(x0, y0, zf - d / 2, x1, y1, zf + d / 2, 0.006), mat);
    const ext = zOut * (th / 2);
    if (s > 0) {                                                           // davanzale esterno e interno
      P(gRBox(-w / 2 - 0.04, -0.04, Math.min(zf, ext + zOut * 0.05), w / 2 + 0.04, 0, Math.max(zf, ext + zOut * 0.05), 0.006), M.sill);
      P(gRBox(-w / 2 - 0.02, -0.03, Math.min(zf, -ext - zOut * 0.03), w / 2 + 0.02, 0.005, Math.max(zf, -ext - zOut * 0.03), 0.006), M.marble);
    } else P(gBox(-w / 2, 0, -th / 2, w / 2, 0.012, th / 2), M.stone);
    // telaio fisso
    fr(-w / 2, 0, -w / 2 + fw, h); fr(w / 2 - fw, 0, w / 2, h); fr(-w / 2, h - fw, w / 2, h); fr(-w / 2, 0, w / 2, s > 0 ? fw : 0.03);
    const sashes = op.k === 'slider' ? 2 : (w >= 1.2 ? 2 : 1);
    const sw = (w - 2 * fw) / sashes;
    for (let i = 0; i < sashes; i++) {
      const x0 = -w / 2 + fw + i * sw, x1 = x0 + sw, dz = op.k === 'slider' ? (i ? 0.035 : -0.035) : 0;
      const sx = op.k === 'slider' && i === 1 ? -0.55 : 0;                // anta scorrevole un po' aperta
      const y0 = s > 0 ? fw : 0.03, y1 = h - fw, sf = 0.06;
      const sbox = (a, b, c, d) => P(gRBox(a + sx, b, zf + dz - 0.03, c + sx, d, zf + dz + 0.03, 0.005), M.frame);
      sbox(x0, y0, x0 + sf, y1); sbox(x1 - sf, y0, x1, y1); sbox(x0, y1 - sf, x1, y1); sbox(x0, y0, x1, y0 + (s > 0 ? sf : 0.11));
      P(gBox(x0 + sf + sx, y0 + (s > 0 ? sf : 0.11), zf + dz - 0.003, x1 - sf + sx, y1 - sf, zf + dz + 0.003), M.glass, { noShadow: true });
      // maniglia
      const hx = (sashes === 1 || i === 0) ? x1 - 0.03 : x0 + 0.03;
      P(gRBox(hx - 0.012 + sx, (s > 0 ? h * 0.5 : 1.05) - 0.07, zf + dz - zOut * 0.06 - 0.01, hx + 0.012 + sx, (s > 0 ? h * 0.5 : 1.05) + 0.07, zf + dz - zOut * 0.06 + 0.01, 0.006), M.chrome);
    }
  }
}

/* ═════════════════════════ Struttura ═════════════════════════ */
A(gBox(OUT.x0 - 0.05, -0.32, OUT.z0 - 0.05, OUT.x1 + 0.05, -0.002, OUT.z1 + 0.05), M.slab);
// zoccolatura esterna
A(gBox(OUT.x0 - 0.02, -0.15, OUT.z0 - 0.02, OUT.x1 + 0.02, 0.3, OUT.z0 + 0.02), M.plinth);
A(gBox(OUT.x0 - 0.02, -0.15, OUT.z1 - 0.02, OUT.x1 + 0.02, 0.3, OUT.z1 + 0.02), M.plinth);
A(gBox(OUT.x0 - 0.02, -0.15, OUT.z0, OUT.x0 + 0.02, 0.3, OUT.z1), M.plinth);
A(gBox(OUT.x1 - 0.02, -0.15, OUT.z0, OUT.x1 + 0.02, 0.3, OUT.z1), M.plinth);

// muri esterni
wall(OUT.x0, OUT.z0, OUT.x1, 0, { inner: 'hi', inset: T });
wall(OUT.x0, IN.z1, OUT.x1, OUT.z1, { inner: 'lo', inset: T, openings: [{ c: 3.6, w: 1.10, s: 0, h: 2.40, k: 'front', swing: 1 }] });
wall(OUT.x0, 0, 0, IN.z1, { inner: 'hi', openings: [
  { c: 1.31, w: 0.80, s: 0.90, h: 1.40 }, { c: 2.70, w: 0.80, s: 0.90, h: 1.40 }, { c: 5.56, w: 0.90, s: 1.00, h: 1.30 },
  { c: 7.90, w: 0.90, s: 0.90, h: 1.40 }, { c: 10.60, w: 0.90, s: 0.90, h: 1.40 }, { c: 12.25, w: 0.90, s: 1.05, h: 1.25 }] });
wall(IN.x1, 0, OUT.x1, IN.z1, { inner: 'lo', openings: [
  { c: 2.00, w: 0.80, s: 0, h: 2.40 }, { c: 4.55, w: 0.80, s: 1.00, h: 1.30 }, { c: 6.85, w: 0.80, s: 0, h: 2.40 }, { c: 10.67, w: 2.40, s: 0, h: 2.40, k: 'slider' }] });

// tramezzi (quote Tav. 02)
const D = (c, swing = 1) => ({ c, w: 0.80, s: 0, h: 2.10, k: 'door', swing });
wall(3.32, 0, 3.45, 2.76);                                         // camera | matrimoniale
wall(2.85, 2.76, 4.11, 2.89);                                      // testata disimpegno
wall(2.85, 2.89, 2.98, 9.58, { openings: [D(3.45, -1), D(5.60, -1), D(7.30, -1)] });   // disimpegno lato camere
wall(3.98, 2.89, 4.11, 3.98, { openings: [D(3.45, 1)] });          // ingresso matrimoniale
wall(3.98, 3.98, IN.x1, 4.11, { openings: [D(6.85, 1)] });         // matrimoniale | bagno 2
wall(4.57, 4.11, 4.70, 5.63);                                      // nicchia disimpegno | bagno 2
wall(3.98, 5.63, IN.x1, 5.76);                                     // bagno 2 | CT
wall(3.98, 5.76, 4.11, 7.96, { openings: [D(6.80, 1)] });          // disimpegno | CT
wall(2.98, 7.96, IN.x1, 8.09, { openings: [D(3.48, 1)] });         // fondo disimpegno | zona giorno
wall(0, 3.98, 2.85, 4.11);                                         // camera | bagno 1
wall(0, 6.12, 2.85, 6.25);                                         // bagno 1 | studio
wall(0, 9.45, 2.98, 9.58);                                         // studio | zona giorno
wall(4.32, 12.30, 4.42, IN.z1);                                    // setto all'ingresso

// rivestimento bagni (h 1.20) – sottile pelle ceramica
function tiles(x0, z0, x1, z1, h = 1.2) {
  const e = 0.006; A(gBox(x0, 0.08, z0, x1, h, z0 + e), M.bathWall); A(gBox(x0, 0.08, z1 - e, x1, h, z1), M.bathWall);
  A(gBox(x0, 0.08, z0, x0 + e, h, z1), M.bathWall); A(gBox(x1 - e, 0.08, z0, x1, h, z1), M.bathWall);
}
tiles(0, 4.11, 2.85, 6.12); tiles(4.70, 4.11, 7.40, 5.63);

/* ═════════════════════════ Pavimenti ═════════════════════════ */
function floorRect(x0, z0, x1, z1, mat, y = 0.002, uvScale = 1) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  A(g, mat, { uvScale });
}
const FLOORMAT = { wood: [M.wood, 0.5], porc: [M.porc, 0.42], bath: [M.bath, 1.0] };
for (const r of ROOMS) for (const q of r.rects) floorRect(...q, FLOORMAT[r.floor][0], 0.002, FLOORMAT[r.floor][1]);

/* ═════════════════════════ Esterni costruiti ═════════════════════════ */
// portico
floorRect(PORCH.x0, PORCH.z0, PORCH.x1, PORCH.z1, M.stone, -0.03, 0.8);
A(gBox(PORCH.x0, -0.32, PORCH.z0, PORCH.x1, -0.032, PORCH.z1), M.slab);
for (const [z0, z1] of [[7.6, 7.9], [13.67, 13.97]]) { A(gRBox(11.15, -0.03, z0, 11.45, under(11.15) - 0.2, z1, 0.01), M.plaster); solid(11.15, z0, 11.45, z1); }
A(gBox(11.12, under(11.45) - 0.25, 6.6, 11.48, under(11.12), 14.8), M.walnut);                // trave di gronda
// marciapiede perimetrale
floorRect(OUT.x0 - 0.9, OUT.z1, OUT.x1 + 0.9, OUT.z1 + 0.9, M.stone, -0.04, 0.8);
floorRect(OUT.x0 - 0.9, OUT.z0, OUT.x0, OUT.z1, M.stone, -0.04, 0.8);
floorRect(OUT.x1, OUT.z0, OUT.x1 + 0.9, PORCH.z0, M.stone, -0.04, 0.8);
// posto auto coperto
floorRect(OUT.x0, CARPORT.zi, CARPORT.x1, OUT.z0, M.pave, -0.02, 0.5);
A(gBox(OUT.x0, -0.32, CARPORT.zi, CARPORT.x1, -0.022, OUT.z0), M.slab);
wall(OUT.x0, CARPORT.z0, 10.04, CARPORT.zi, { mat: M.brick, noBase: true });
for (const [x0, x1] of [[-0.45, -0.15], [1.97, 2.57], [6.95, 7.25]]) { A(gBox(x0, 0, CARPORT.zi, x1, under(x1) + 0.02, CARPORT.zi + 0.3), M.brick); solid(x0, CARPORT.zi, x1, CARPORT.zi + 0.3); }
wall(9.74, CARPORT.zi, 10.04, -3.25, { mat: M.brick, noBase: true, top: 2.45 });
A(gBox(8.75, 2.4, CARPORT.z0 - 0.03, 10.07, 2.48, CARPORT.zi + 0.03), M.sill);
// vialetti, accesso carraio, strada
floorRect(3.0, OUT.z1 + 0.9, 4.2, 24, M.pave, -0.05, 0.5);
floorRect(-15, CARPORT.zi, OUT.x0, OUT.z0, M.gravel, -0.06, 0.4);
floorRect(PORCH.x1, 9.6, 16, 11.0, M.pave, -0.05, 0.5);
floorRect(-23, -60, -15.5, 90, M.asphalt, -0.1, 0.25);
for (let z = -58; z < 88; z += 6) floorRect(-19.3, z, -19.15, z + 3, std({ color: 0xe8e5dc }), -0.095);
A(gBox(-15.5, -0.15, -60, -15.2, 0.0, 90), M.stone);

/* ═════════════════════════ Tetto ═════════════════════════ */
function roofPart(xa, xb, za, zb) {
  const th = ROOF.th, p = [];
  const xs = [xa]; if (xa < XR && xb > XR) xs.push(XR); xs.push(xb);
  const bottom = xs.map(x => [x, under(x)]);
  // estradosso: offset normale di th, con intersezione al colmo
  const off = (x0, x1) => { const dy = under(x1) - under(x0), dx = x1 - x0, l = Math.hypot(dx, dy); return [-dy / l * th, dx / l * th]; };
  const top = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (i === 0) { const o = off(xs[0], xs[1]); top.push([x + o[0], under(x) + o[1]]); }
    else if (i === xs.length - 1) { const o = off(xs[i - 1], xs[i]); top.push([x + o[0], under(x) + o[1]]); }
    else { // vertice di colmo: intersezione dei due offset
      const o1 = off(xs[i - 1], x), o2 = off(x, xs[i + 1]);
      const d1 = [x - xs[i - 1], under(x) - under(xs[i - 1])], d2 = [xs[i + 1] - x, under(xs[i + 1]) - under(x)];
      const P1 = [x + o1[0], under(x) + o1[1]], P2 = [x + o2[0], under(x) + o2[1]];
      const det = d1[0] * -d2[1] - d1[1] * -d2[0];
      const t = ((P2[0] - P1[0]) * -d2[1] - (P2[1] - P1[1]) * -d2[0]) / det;
      top.push([P1[0] + d1[0] * t, P1[1] + d1[1] * t]);
    }
  }
  const shape = new THREE.Shape([...bottom, ...top.reverse()].map(q => new THREE.Vector2(q[0], q[1])));
  const g = new THREE.ExtrudeGeometry(shape, { depth: zb - za, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, za);
  ROOFB.add(g, M.roof, { uvScale: 0.55 });
  // intradosso: legno a vista (perlinato) all'esterno
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], q = new THREE.BufferGeometry(), e = 0.004;
    const v = [[a, under(a) - e, za], [b, under(b) - e, za], [b, under(b) - e, zb], [a, under(a) - e, zb]];
    q.setAttribute('position', new THREE.Float32BufferAttribute([...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[3]], 3)); q.computeVertexNormals();
    ROOFB.add(q, M.soffit, { uvScale: 0.6 });
  }
  // scossaline/frontalini
  ROOFB.add(gBox(xa - 0.03, under(xa) - 0.05, za, xa + 0.01, under(xa) + th + 0.03, zb), M.roofEdge);
  ROOFB.add(gBox(xb - 0.01, under(xb) - 0.05, za, xb + 0.03, under(xb) + th + 0.03, zb), M.roofEdge);
}
roofPart(ROOF.xL, ROOF.xR, ROOF.zA, ROOF.zB);
roofPart(ROOF.xR, ROOF.xP, ROOF.zP, ROOF.zB);
// controsoffitto interno (intonaco), un filo sotto il perlinato
for (const [a, b] of [[IN.x0, XR], [XR, IN.x1]]) {
  const e = 0.009, q = new THREE.BufferGeometry(), v = [[a, under(a) - e, IN.z0], [b, under(b) - e, IN.z0], [b, under(b) - e, IN.z1], [a, under(a) - e, IN.z1]];
  q.setAttribute('position', new THREE.Float32BufferAttribute([...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[3]], 3)); q.computeVertexNormals();
  ROOFB.add(q, M.ceil, { uvScale: 0.5 });
}
// testate di falda (frontalini sulle linee di gronda trasversali)
for (const z of [ROOF.zA, ROOF.zB]) {
  for (const [a, b] of [[ROOF.xL, XR], [XR, z === ROOF.zB ? ROOF.xP : ROOF.xR]]) {
    const len = Math.hypot(b - a, under(b) - under(a)), ang = Math.atan2(under(b) - under(a), b - a);
    const g = new THREE.BoxGeometry(len, 0.3, 0.04).rotateZ(ang).translate((a + b) / 2, (under(a) + under(b)) / 2 + 0.1, z);
    ROOFB.add(g, M.roofEdge);
  }
}
{ const a = ROOF.xR, b = ROOF.xP, len = Math.hypot(b - a, under(b) - under(a)), ang = Math.atan2(under(b) - under(a), b - a);
  ROOFB.add(new THREE.BoxGeometry(len, 0.3, 0.04).rotateZ(ang).translate((a + b) / 2, (under(a) + under(b)) / 2 + 0.1, ROOF.zP), M.roofEdge); }
// colmo in coppi
{ const g = new THREE.CylinderGeometry(0.13, 0.13, ROOF.zB - ROOF.zA + 0.04, 16, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(XR, YR + ROOF.th + 0.04, (ROOF.zA + ROOF.zB) / 2); ROOFB.add(g, M.roof, { uvScale: 2 }); }
// camino
ROOFB.add(gRBox(XR + 0.25, YR, 11.0, XR + 0.75, YR + 1.05, 11.5, 0.01), M.facade);
ROOFB.add(gRBox(XR + 0.18, YR + 1.05, 10.93, XR + 0.82, YR + 1.12, 11.57, 0.01), M.roofEdge);
ROOFB.add(gRBox(XR + 0.3, YR + 1.12, 11.05, XR + 0.7, YR + 1.3, 11.45, 0.01), M.roofEdge);
// grondaie e pluviali
function gutter(x, z0, z1) {
  const y = under(x) - 0.02, side = x < XR ? -1 : 1;
  ROOFB.add(new THREE.CylinderGeometry(0.075, 0.075, z1 - z0, 14, 1, true, Math.PI / 2 * side + Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(x + side * 0.08, y, (z0 + z1) / 2), M.copper, { uv: false });
}
gutter(ROOF.xL, ROOF.zA, ROOF.zB); gutter(ROOF.xR, ROOF.zA, ROOF.zP); gutter(ROOF.xP, ROOF.zP, ROOF.zB);
for (const [x, z] of [[ROOF.xL - 0.08, ROOF.zA + 0.2], [ROOF.xL - 0.08, ROOF.zB - 0.2], [ROOF.xR + 0.08, ROOF.zA + 0.2], [ROOF.xP + 0.08, ROOF.zB - 0.2]]) {
  ROOFB.add(gCyl(x, -0.15, z, 0.045, 0.045, under(x) - 0.02 + 0.15, 12), M.copper, { uv: false });
}

/* ═════════════════════════ Arredi procedurali ═════════════════════════ */
function bed(w, l, duvet) {                       // testiera su z=0, si estende verso +z
  P(gRBox(-w / 2 - 0.03, 0.08, 0, w / 2 + 0.03, 0.32, l + 0.03, 0.03), M.oak);
  P(gRBox(-w / 2, 0.32, 0.03, w / 2, 0.55, l, 0.06, 3), M.linen);
  P(gRBox(-w / 2 - 0.035, 0.42, 0.62, w / 2 + 0.035, 0.6, l + 0.04, 0.06, 3), duvet);
  P(gRBox(-w / 2 - 0.02, 0.58, l - 0.55, w / 2 + 0.02, 0.62, l + 0.05, 0.03, 2), M.linen);
  const n = w > 1.2 ? 2 : 1;
  for (let i = 0; i < n; i++) { const cx = -w / 2 + (i + 0.5) * w / n; P(gRBox(cx - 0.32, 0.55, 0.08, cx + 0.32, 0.72, 0.5, 0.08, 3), M.linen); }
  P(gRBox(-w / 2 - 0.06, 0.08, -0.02, w / 2 + 0.06, 1.15, 0.08, 0.04, 3), duvet === M.fabricBlue ? M.fabricGrey : M.fabricSand);
  for (const sx of [-1, 1]) for (const sz of [0.06, l - 0.06]) P(gCyl(sx * (w / 2 - 0.05), 0, sz, 0.03, 0.025, 0.09, 10), M.blackMetal);
  solidLocal(-w / 2 - 0.05, -0.02, w / 2 + 0.05, l + 0.05);
}
function lamp(x, y, z, shade = M.lampShade) { at(x, z, 0, () => { P(gCyl(0, 0, 0, 0.07, 0.09, 0.03, 16), M.blackMetal); P(gCyl(0, 0.03, 0, 0.012, 0.012, 0.3, 8), M.blackMetal); P(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 24, 1, true).translate(0, 0.42, 0), shade, { noShadow: true }); }, y); }
function nightstand(withLamp = true) {
  P(gRBox(-0.24, 0.0, -0.2, 0.24, 0.48, 0.2, 0.02), M.oak);
  P(gBox(-0.22, 0.24, 0.2, 0.22, 0.25, 0.205), M.walnut);
  P(gRBox(-0.06, 0.34, 0.2, 0.06, 0.36, 0.22, 0.008), M.blackMetal);
  if (withLamp) lamp(0, 0.48, 0);
}
function wardrobe(w, h = 2.4, d = 0.6) {          // fronte verso +z, appoggiato su z=0
  P(gRBox(-w / 2, 0, 0, w / 2, h, d, 0.01), M.lacquer);
  const n = Math.max(2, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) { const x = -w / 2 + i * w / n; P(gBox(x - 0.002, 0.05, d, x + 0.002, h - 0.03, d + 0.003), M.lacquerDark); }
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n + (i % 2 ? -1 : 1) * (w / n / 2 - 0.05); P(gRBox(x - 0.008, 0.9, d, x + 0.008, 1.5, d + 0.03, 0.006), M.blackMetal); }
  solidLocal(-w / 2, 0, w / 2, d);
}
function desk(w, d = 0.6) {                       // fronte verso +z
  P(gRBox(-w / 2, 0.72, 0, w / 2, 0.75, d, 0.008), M.oak);
  for (const sx of [-1, 1]) { P(gBox(sx * (w / 2 - 0.04) - 0.015, 0, 0.05, sx * (w / 2 - 0.04) + 0.015, 0.72, d - 0.05), M.blackMetal); }
  P(gRBox(-w / 2 + 0.05, 0.6, 0.02, -w / 2 + 0.5, 0.72, d - 0.05, 0.01), M.oak);
  P(gRBox(-0.25, 0.75, 0.05, 0.25, 0.77, 0.4, 0.01), M.blackMetal);       // portatile chiuso
  solidLocal(-w / 2, 0, w / 2, d);
}
function officeChair() {
  P(gRBox(-0.24, 0.44, -0.22, 0.24, 0.52, 0.24, 0.04, 3), M.fabricGrey);
  P(gRBox(-0.23, 0.56, 0.2, 0.23, 1.0, 0.26, 0.05, 3).rotateX(-0.1), M.fabricGrey);
  P(gCyl(0, 0.08, 0, 0.025, 0.025, 0.36, 10), M.chrome);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; P(gBox(0, 0.06, -0.015, 0.3, 0.09, 0.015).rotateY(a), M.blackMetal); P(gCyl(Math.cos(a) * 0.29, 0, -Math.sin(a) * 0.29, 0.025, 0.025, 0.05, 8), M.blackMetal); }
}
function diningChair(mat = M.fabricSand) {        // seduta verso −z, schienale su +z
  P(gRBox(-0.22, 0.43, -0.22, 0.22, 0.5, 0.22, 0.03, 3), mat);
  P(gRBox(-0.21, 0.55, 0.17, 0.21, 0.88, 0.22, 0.02, 3).rotateX(-0.08), mat);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P(gCyl(sx * 0.19, 0, sz * 0.19, 0.016, 0.012, 0.43, 8), M.walnut);
  for (const sx of [-1, 1]) P(gCyl(sx * 0.19, 0.43, 0.2, 0.012, 0.012, 0.42, 8), M.walnut);
}
function table(w, d, h = 0.75, mat = M.oak) {
  P(gRBox(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, 0.012, 3), mat);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P(gRBox(sx * (w / 2 - 0.08) - 0.03, 0, sz * (d / 2 - 0.08) - 0.03, sx * (w / 2 - 0.08) + 0.03, h - 0.04, sz * (d / 2 - 0.08) + 0.03, 0.01), mat);
  solidLocal(-w / 2, -d / 2, w / 2, d / 2);
}
function barStool() {
  P(gCyl(0, 0.62, 0, 0.19, 0.17, 0.06, 24), M.walnut); P(gCyl(0, 0, 0, 0.02, 0.02, 0.62, 10), M.blackMetal);
  P(gCyl(0, 0, 0, 0.2, 0.22, 0.02, 24), M.blackMetal); P(new THREE.TorusGeometry(0.16, 0.008, 6, 24).rotateX(Math.PI / 2).translate(0, 0.25, 0), M.blackMetal);
}
// cucina: corsa di basi lungo +x da x=0, schiena a z=0, fronte verso +z
function kitchenRun(len, { hob, sink, wall = true, tall = 0 } = {}) {
  const d = 0.6, h = 0.88, n = Math.round((len - tall) / 0.6);
  const uw = (len - tall) / n;
  P(gBox(0, 0, 0.0, len - tall, 0.1, d - 0.06), M.blackMetal);              // zoccolo
  for (let i = 0; i < n; i++) {
    const x0 = i * uw + 0.002, x1 = (i + 1) * uw - 0.002;
    P(gRBox(x0, 0.1, 0, x1, h, d - 0.02, 0.004), M.lacquer);
    P(gBox(x0 + 0.1, h - 0.06, d - 0.02, x1 - 0.1, h - 0.045, d), M.blackMetal);   // gola maniglia
  }
  P(gRBox(-0.01, h, -0.0, len - tall + 0.01, h + 0.04, d + 0.02, 0.004), M.top);
  if (hob !== undefined) { P(gRBox(hob - 0.38, h + 0.04, 0.08, hob + 0.38, h + 0.047, 0.58, 0.004), M.blackGlass); for (const [a, b] of [[-0.2, 0.2], [0.2, 0.2], [-0.2, 0.45], [0.2, 0.45]]) P(new THREE.TorusGeometry(0.08, 0.004, 4, 32).rotateX(Math.PI / 2).translate(hob + a, h + 0.049, b), M.steel, { uv: false });
    if (wall) { P(gRBox(hob - 0.45, 1.6, 0.0, hob + 0.45, 1.68, 0.5, 0.01), M.steel); P(gBox(hob - 0.12, 1.68, 0.05, hob + 0.12, 2.6, 0.3), M.steel); } }
  if (sink !== undefined) {
    P(gRBox(sink - 0.4, h + 0.035, 0.08, sink + 0.4, h + 0.042, 0.55, 0.01), M.steel);
    P(gBox(sink - 0.34, h - 0.15, 0.13, sink + 0.34, h + 0.036, 0.5), M.blackMetal);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sink, h + 0.04, 0.07), new THREE.Vector3(sink, h + 0.38, 0.08), new THREE.Vector3(sink, h + 0.42, 0.2), new THREE.Vector3(sink, h + 0.3, 0.3)]);
    P(new THREE.TubeGeometry(curve, 20, 0.012, 8), M.chrome, { uv: false });
  }
  if (wall) {
    const wl = hob !== undefined ? [[0, hob - 0.45], [hob + 0.45, len - tall]] : [[0, len - tall]];
    for (const [a, b] of wl) if (b - a > 0.3) {
      P(gRBox(a, 1.45, 0, b, 2.15, 0.35, 0.006), M.oak);
      const m = Math.max(1, Math.round((b - a) / 0.6)); for (let i = 1; i < m; i++) P(gBox(a + i * (b - a) / m - 0.002, 1.47, 0.35, a + i * (b - a) / m + 0.002, 2.13, 0.353), M.walnut);
      P(gBox(a + 0.02, 1.44, 0.05, b - 0.02, 1.45, 0.3), M.bulb, { noShadow: true });
    }
  }
  if (tall) {                                                                  // colonna frigo + forno
    const x0 = len - tall;
    P(gRBox(x0 + 0.002, 0, 0, len, 2.25, d, 0.006), M.lacquer);
    P(gBox(x0 + 0.04, 0.85, d, len - 0.04, 1.45, d + 0.005), M.blackGlass);
    P(gBox(x0 + 0.08, 1.38, d + 0.005, len - 0.08, 1.4, d + 0.025), M.steel);
    P(gBox(x0 + 0.002, 1.5, d, len, 1.503, d + 0.003), M.lacquerDark);
    P(gBox(x0 + 0.002, 0.8, d, len, 0.803, d + 0.003), M.lacquerDark);
  }
  solidLocal(0, 0, len, d);
}
function vanity(w) {                                // lavabo sospeso, schiena a z=0, fronte +z
  P(gRBox(-w / 2, 0.45, 0, w / 2, 0.82, 0.48, 0.01), M.oak);
  P(gRBox(-w / 2, 0.82, 0, w / 2, 0.87, 0.5, 0.012), M.ceramic);
  P(gRBox(-0.22, 0.83, 0.08, 0.22, 0.875, 0.42, 0.06, 3), M.water);
  P(gCyl(0, 0.87, 0.05, 0.016, 0.016, 0.16, 12), M.chrome); P(gRBox(-0.012, 1.01, 0.05, 0.012, 1.03, 0.2, 0.008), M.chrome);
  P(gRBox(-w / 2 + 0.05, 1.1, 0, w / 2 - 0.05, 1.9, 0.02, 0.01), M.mirror);
  P(gBox(-w / 2 + 0.05, 1.93, 0.0, w / 2 - 0.05, 1.96, 0.07), M.bulb, { noShadow: true });
  solidLocal(-w / 2, 0, w / 2, 0.5);
}
function wc(bidet = false) {                         // sospeso, schiena a z=0
  P(gRBox(-0.18, 0.24, 0, 0.18, 0.42, 0.2, 0.05, 3), M.ceramic);
  P(gRBox(-0.18, 0.22, 0.12, 0.18, 0.42, 0.54, 0.16, 4), M.ceramic);
  if (!bidet) { P(gRBox(-0.18, 0.42, 0.1, 0.18, 0.44, 0.55, 0.15, 3), M.white); P(gRBox(-0.12, 0.9, 0, 0.12, 1.06, 0.015, 0.01), M.white); }
  else P(gCyl(0, 0.42, 0.18, 0.014, 0.014, 0.08, 10), M.chrome);
  solidLocal(-0.18, 0, 0.18, 0.55);
}
function shower(w, d, glassSides = ['x+']) {      // piatto a z∈[0,d], x∈[0,w]
  P(gRBox(0, 0, 0, w, 0.03, d, 0.01), M.ceramic);
  P(gBox(w / 2 - 0.08, 0.031, d / 2 - 0.08, w / 2 + 0.08, 0.033, d / 2 + 0.08), M.steel);
  for (const s of glassSides) {
    const g = s === 'x+' ? gBox(w - 0.01, 0.03, 0.02, w, 2.0, d * 0.75) : gBox(0.02, 0.03, d - 0.01, w * 0.75, 2.0, d);
    P(g, M.shower, { noShadow: true });
    const f = s === 'x+' ? gBox(w - 0.015, 1.98, 0, w + 0.005, 2.0, d * 0.75) : gBox(0, 1.98, d - 0.015, w * 0.75, 2.0, d + 0.005);
    P(f, M.chrome);
  }
  P(gCyl(0.05, 0.9, 0.05, 0.012, 0.012, 1.25, 10), M.chrome); P(gCyl(0.25, 2.12, 0.25, 0.13, 0.13, 0.012, 32), M.chrome);
  P(gBox(0.04, 2.12, 0.04, 0.26, 2.13, 0.06).rotateY(0), M.chrome);
  solidLocal(0, 0, w, d);
}
function washer(dryer = false) {                    // schiena a z=0
  P(gRBox(-0.3, 0, 0, 0.3, 0.85, 0.58, 0.02), M.white);
  P(new THREE.TorusGeometry(0.18, 0.025, 10, 40).translate(0, 0.42, 0.585), M.steel, { uv: false });
  P(gCyl(0, 0.42, 0, 0.16, 0.16, 0.01, 32).rotateX(Math.PI / 2).translate(0, 0.42, 0.585), dryer ? M.lacquerDark : M.blackGlass);
  P(gBox(-0.27, 0.75, 0.58, 0.27, 0.82, 0.585), M.lacquerDark);
  solidLocal(-0.3, 0, 0.3, 0.6);
}
function shelf(w, h = 1.9, d = 0.4) {
  for (const sx of [-1, 1]) for (const sz of [0.02, d - 0.02]) P(gBox(sx * w / 2 - 0.02, 0, sz - 0.02, sx * w / 2, h, sz), M.steel);
  for (let i = 0; i < 5; i++) { const y = 0.1 + i * (h - 0.15) / 4; P(gBox(-w / 2, y, 0, w / 2, y + 0.02, d), M.oak);
    for (let k = 0; k < 3; k++) if (rnd() > 0.35 && i < 4) { const x = -w / 2 + 0.1 + k * (w - 0.2) / 3; P(gRBox(x, y + 0.02, 0.05, x + 0.25 + rnd() * 0.1, y + 0.2 + rnd() * 0.12, d - 0.06, 0.01), [M.fabricSand, M.white, M.fabricBlue][k]); } }
  solidLocal(-w / 2, 0, w / 2, d);
}
function tvUnit(w) {                                // schiena a z=0
  P(gRBox(-w / 2, 0.18, 0, w / 2, 0.55, 0.42, 0.01), M.walnut);
  for (let i = 1; i < 4; i++) P(gBox(-w / 2 + i * w / 4 - 0.002, 0.2, 0.42, -w / 2 + i * w / 4 + 0.002, 0.53, 0.423), M.blackMetal);
  for (const sx of [-1, 1]) P(gBox(sx * (w / 2 - 0.1) - 0.02, 0, 0.1, sx * (w / 2 - 0.1) + 0.02, 0.18, 0.32), M.blackMetal);
  P(gRBox(-0.72, 1.0, 0.0, 0.72, 1.83, 0.04, 0.008), M.blackMetal); P(gBox(-0.7, 1.02, 0.04, 0.7, 1.81, 0.041), M.screen);
  solidLocal(-w / 2, 0, w / 2, 0.42);
}
function rug(x0, z0, x1, z1) { FURN.add(gBox(x0, 0.002, z0, x1, 0.012, z1), M.rug, { uvScale: 1 / Math.max(x1 - x0, z1 - z0) }); }
function coffeeTable(r) {
  P(gCyl(0, 0.38, 0, r, r, 0.03, 48), M.marble); P(gCyl(0, 0.0, 0, 0.18, 0.18, 0.02, 32), M.blackMetal); P(gCyl(0, 0.02, 0, 0.04, 0.04, 0.36, 12), M.blackMetal);
  P(gRBox(-0.12, 0.41, -0.08, 0.12, 0.46, 0.08, 0.01), M.fabricGreen);
  solidLocal(-r, -r, r, r);
}
function pendant(x, z, y, n = 1, spacing = 0.6) {
  for (let i = 0; i < n; i++) at(x + (i - (n - 1) / 2) * spacing, z, 0, () => {
    const top = under(x + (i - (n - 1) / 2) * spacing);
    P(gCyl(0, y + 0.25, 0, 0.003, 0.003, top - y - 0.25, 6), M.blackMetal, { noShadow: true });
    P(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, y, 0), M.blackMetal);
    P(new THREE.CircleGeometry(0.16, 24).rotateX(Math.PI / 2).translate(0, y - 0.001, 0), M.bulb, { noShadow: true });
  });
}
function ceilingLight(x, z) { const y = under(x) - 0.03; P(gCyl(x, y - 0.04, z, 0.22, 0.24, 0.05, 32), M.white); P(new THREE.CircleGeometry(0.2, 32).rotateX(Math.PI / 2).translate(x, y - 0.041, z), M.bulb, { noShadow: true }); }
function wallLamp(x, z, nx, nz) { at(x, z, Math.atan2(nx, nz), () => { P(gRBox(-0.08, 2.1, 0, 0.08, 2.32, 0.1, 0.02), M.blackMetal); P(gBox(-0.06, 2.12, 0.1, 0.06, 2.14, 0.101), M.bulb, { noShadow: true }); }); }

/* posizionamento (coordinate in metri, Tav. 02 "arredato") */
// Camera
at(0.5, 0, 0, () => bed(0.9, 2.0, M.fabricGreen));
at(1.2, 0.02, 0, () => nightstand());
at(3.32 - 0.02, 1.2, -Math.PI / 2, () => wardrobe(2.2));
at(0.02, 3.0, Math.PI / 2, () => desk(1.2)); at(0.85, 3.0, -Math.PI / 2, officeChair);
rug(0.9, 0.9, 2.5, 2.5);
// Matrimoniale
at(5.4, 0, 0, () => bed(1.8, 2.1, M.fabricBlue));
at(4.2, 0.02, 0, () => nightstand()); at(6.6, 0.02, 0, () => nightstand());
at(5.2, 3.98, Math.PI, () => wardrobe(2.0));
rug(4.1, 1.2, 6.7, 2.9);
// Bagno 1
at(0, 4.11, 0, () => shower(0.9, 1.2, ['x+', 'z+']));
at(1.75, 4.11, 0, () => vanity(0.8));
at(1.15, 6.12, Math.PI, () => wc()); at(1.75, 6.12, Math.PI, () => wc(true));
// Camera / studio
at(0, 8.95, Math.PI / 2, () => bed(0.9, 2.0, M.fabricSand));
at(1.1, 6.25, 0, () => wardrobe(1.6));
at(0.02, 7.65, Math.PI / 2, () => desk(1.1)); at(0.85, 7.65, -Math.PI / 2, officeChair);
// Bagno 2
at(4.70, 4.11, 0, () => shower(0.8, 1.52, ['x+']));
at(6.05, 5.63, Math.PI, () => wc());
at(6.95, 5.63, Math.PI, () => vanity(0.7));
// CT / lavanderia
at(4.55, 5.76, 0, () => washer()); at(5.2, 5.76, 0, () => washer(true));
at(6.0, 5.76, 0, () => { P(gRBox(-0.22, 1.25, 0, 0.22, 1.95, 0.32, 0.02), M.white); P(gBox(-0.15, 1.3, 0.32, 0.15, 1.36, 0.325), M.lacquerDark);
  for (const dx of [-0.1, -0.03, 0.04, 0.11]) P(gCyl(dx, 0.4, 0.15, 0.012, 0.012, 0.85, 8), M.copper, { uv: false }); });
at(6.95, 5.76, 0, () => { P(gRBox(-0.3, 0.0, 0, 0.3, 0.86, 0.5, 0.02), M.white); P(gBox(-0.24, 0.6, 0.06, 0.24, 0.87, 0.44), M.blackMetal); P(gCyl(0, 0.86, 0.04, 0.015, 0.015, 0.2, 8), M.chrome); solidLocal(-0.3, 0, 0.3, 0.5); });
at(5.5, 7.96, Math.PI, () => shelf(1.6));
// Zona giorno – lato destro (verso portico): cucina a L, isola, pranzo; lato sinistro: soggiorno
at(IN.x1, IN.z1, Math.PI, () => kitchenRun(2.98, { hob: 1.3, tall: 0.6 }));      // parete di fondo, da x=7.40 verso il setto d'ingresso
at(IN.x1, 11.95, -Math.PI / 2, () => kitchenRun(0.97, { wall: false }));          // ritorno lungo la parete destra
at(5.9, 11.65, 0, () => {                                                          // isola con lavello, sgabelli sul lato pranzo
  P(gRBox(-0.9, 0.0, -0.4, 0.9, 0.88, 0.4, 0.01), M.lacquer); P(gRBox(-1.0, 0.88, -0.58, 1.0, 0.92, 0.45, 0.006), M.top);
  P(gRBox(-0.35, 0.915, -0.15, 0.35, 0.925, 0.3, 0.01), M.steel); P(gBox(-0.3, 0.75, -0.1, 0.3, 0.92, 0.25), M.blackMetal);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.92, 0.36), new THREE.Vector3(0, 1.26, 0.36), new THREE.Vector3(0, 1.3, 0.24), new THREE.Vector3(0, 1.18, 0.14)]);
  P(new THREE.TubeGeometry(curve, 20, 0.012, 8), M.chrome, { uv: false });
  solidLocal(-0.9, -0.4, 0.9, 0.4);
});
at(5.55, 10.85, 0, barStool); at(6.25, 10.85, 0, barStool);
pendant(5.9, 11.65, 1.75, 3, 0.55);
at(5.9, 9.15, 0, () => table(1.9, 0.95));
for (const x of [5.3, 5.9, 6.5]) { at(x, 8.38, Math.PI, () => diningChair()); at(x, 9.92, 0, () => diningChair()); }
pendant(5.9, 9.15, 1.65, 1);
at(1.5, IN.z1, Math.PI, () => tvUnit(2.0));
at(1.7, 12.2, 0, () => coffeeTable(0.42));
rug(0.35, 10.55, 3.0, 13.0);
// Disimpegno
ceilingLight(3.48, 3.9); ceilingLight(3.48, 6.4);
for (const r of ROOMS) if (!['living', 'dis'].includes(r.id)) for (const [x, z] of r.lamp) ceilingLight(x, z);
ceilingLight(1.7, 11.6);
// esterni: lampade a parete, tavolo del portico
wallLamp(2.75, OUT.z1, 0, 1); wallLamp(4.45, OUT.z1, 0, 1); wallLamp(OUT.x1, 6.85 - 0.75, 1, 0); wallLamp(OUT.x1, 9.1, 1, 0); wallLamp(OUT.x1, 12.2, 1, 0);
at(9.7, 11.4, 0, () => table(0.95, 1.8, 0.75, M.walnut));
for (const z of [10.85, 11.4, 11.95]) { at(9.0, z, -Math.PI / 2, () => diningChair(M.fabricGreen)); at(10.4, z, Math.PI / 2, () => diningChair(M.fabricGreen)); }

/* ═════════════════════════ Vegetazione e paesaggio ═════════════════════════ */
const VEG = new Bucket();
function blob(r, detail, col, jitter = 0.25) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, c = new Float32Array(p.count * 3), base = new THREE.Color(col);
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i), n = 1 + (Math.sin(v.x * 5.1 + v.y * 3.7) * Math.cos(v.z * 4.3 - v.y * 2.1)) * jitter;
    v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z);
    const k = 0.75 + 0.35 * (v.y / r + 1) / 2 + rnd() * 0.08; c[i * 3] = base.r * k; c[i * 3 + 1] = base.g * k; c[i * 3 + 2] = base.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); return g;
}
const vegAdd = (geo, mat) => { geo.deleteAttribute('uv'); if (geo.index) geo = geo.toNonIndexed(); VEG.map.has(mat.uuid) || VEG.map.set(mat.uuid, { mat, geos: [] }); VEG.map.get(mat.uuid).geos.push(geo); };
function tree(x, z, s = 1) {
  vegAdd(new THREE.CylinderGeometry(0.1 * s, 0.17 * s, 2.6 * s, 8).translate(x, -0.15 + 1.3 * s, z), M.trunk);
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + rnd(), r = (i ? 0.9 : 0) * s; vegAdd(blob((1.1 + rnd() * 0.5) * s, 3, 0x5f9150).translate(x + Math.cos(a) * r, (3.2 + rnd() * 1.1) * s, z + Math.sin(a) * r), M.leaf); }
  solid(x - 0.2, z - 0.2, x + 0.2, z + 0.2);
}
function cypress(x, z, h = 8) {
  const g = blob(1, 3, 0x3d6a35, 0.1).scale(0.8, h / 2, 0.8).translate(x, h / 2 + 0.2, z); vegAdd(g, M.cypress); solid(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
}
function hedge(x0, z0, x1, z1, h = 1.3) {
  const len = Math.max(x1 - x0, z1 - z0), n = Math.ceil(len / 1.2);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; vegAdd(blob(0.75, 1, 0x416b36, 0.2).scale((x1 - x0 > z1 - z0) ? 1.1 : 0.7, h / 1.5, (x1 - x0 > z1 - z0) ? 0.7 : 1.1).translate(x, h / 2 - 0.15, z), M.hedge); }
  solid(Math.min(x0, x1) - 0.4, Math.min(z0, z1) - 0.4, Math.max(x0, x1) + 0.4, Math.max(z0, z1) + 0.4);
}
for (let z = -10; z <= 28; z += 3.4) if (z < -5 || z > -1) cypress(-13.6, z, 7 + rnd() * 2.5);
[[16, -2, 1.2], [19, 9, 1.4], [16, 21, 1.1], [7, 24, 1.3], [-7, 21, 1.2], [-8, 7, 1.0], [24, 18, 1.3], [-6, -10, 1.1]].forEach(a => tree(...a));
hedge(-12.8, 29, 26, 29); hedge(26, -11, 26, 29); hedge(-12.8, -11, 26, -11);
// colline sullo sfondo (Colli Berici / Prealpi vicentine)
{
  const g = new THREE.CylinderGeometry(330, 330, 1, 200, 6, true), p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), t = p.getY(i) + 0.5;
    const hgt = (28 + 22 * Math.sin(a * 3 + 1) + 14 * Math.sin(a * 7.3) + 7 * Math.sin(a * 17.1) + 40 * Math.max(0, Math.sin(a - 2.2))) * t;
    const r = 330 - t * 60; p.setXYZ(i, Math.cos(a) * r, hgt - 2, Math.sin(a) * r);
    const k = 0.55 + t * 0.35; c[i * 3] = 0.37 * k; c[i * 3 + 1] = 0.48 * k; c[i * 3 + 2] = 0.3 * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, M.hill); m.material.side = THREE.DoubleSide; world.add(m);
}
{ const g = new THREE.PlaneGeometry(800, 800).rotateX(-Math.PI / 2).translate(0, -0.15, 0); worldUV(g, 1 / 5); const m = new THREE.Mesh(g, M.grass); m.receiveShadow = true; world.add(m); }

ARCH.build(world); ROOFB.build(roofGroup); FURN.build(furnGroup);
for (const { mat, geos } of VEG.map.values()) { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = m.receiveShadow = true; world.add(m); }

/* ═════════════════════════ Modelli glTF (open) ═════════════════════════ */
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const models = {};
function place(name, x, z, rot, { scale = 1, y = 0, parent = furnGroup, solidR, fn } = {}) {
  const src = models[name]; if (!src) return;
  const o = src.clone(true); o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(scale);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  parent.add(o); if (solidR) solid(x - solidR[0], z - solidR[1], x + solidR[0], z + solidR[1]); if (fn) fn(o);
}
const loads = [['sofa', sofaURL], ['chair', chairURL], ['plant', plantURL], ['vase', vaseURL], ['pouf', poufURL], ['car', carURL]]
  .map(([k, u]) => new Promise(res => loader.parse(u.slice().buffer, '', g => { models[k] = g.scene; res(); }, e => { console.warn(k, e); res(); })));
Promise.all(loads).then(() => {
  place('sofa', 1.7, 11.15, Math.PI, { solidR: [1.1, 0.5] });                  // divano rivolto verso la TV
  place('chair', 0.65, 12.35, Math.PI / 2, { solidR: [0.4, 0.4] });  // poltrona lettura vicino alla finestra
  place('chair', 8.55, 8.4, Math.PI / 2 + 0.4, { solidR: [0.4, 0.4] }); place('chair', 8.55, 9.4, Math.PI / 2 - 0.4, { solidR: [0.4, 0.4] });
  place('pouf', 2.85, 12.35, 0, { scale: 1.4 });
  place('plant', 0.4, 13.1, 0.4, { scale: 1.35, solidR: [0.3, 0.3] }); place('plant', 0.45, 9.95, 1.2, { scale: 1.1 });
  place('plant', 11.0, 7.4, 2.0, { scale: 1.2 }); place('plant', 10.9, 13.5, 0.7, { scale: 1.2 }); place('plant', 2.7, 9.9, 0, { scale: 0.9 });
  place('plant', 2.6, 0.5, 2.1, { scale: 0.8 });
  place('vase', 5.9, 9.15, 0, { y: 0.75, scale: 1.6 });
  place('vase', 9.7, 11.4, 1.2, { y: 0.75, scale: 1.4 });
  place('car', 3.3, -2.0, -Math.PI / 2, { scale: 1.0, parent: world, solidR: [2.2, 1.1] });
  document.body.classList.add('loaded');
});

/* ═════════════════════════ Etichette ═════════════════════════ */
function label(text, sub, x, y, z) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 180; const g = c.getContext('2d');
  g.fillStyle = 'rgba(18,22,28,.82)'; g.beginPath(); if (g.roundRect) g.roundRect(8, 8, 624, 164, 36); else g.rect(8, 8, 624, 164); g.fill();
  g.fillStyle = '#fff'; g.font = '600 62px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(text, 320, 84);
  g.fillStyle = '#ffc98a'; g.font = '46px system-ui, sans-serif'; g.fillText(sub, 320, 144);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false }));
  s.scale.set(1.8, 0.5, 1); s.position.set(x, y, z); s.renderOrder = 10; labelGroup.add(s);
}
for (const r of ROOMS) label(r.name, r.area, r.label[0], 2.0, r.label[1]);
label('Posto auto coperto', '27,62 m²', 3.3, 2.2, -1.9); label('Portico', '22,70 m²', 9.6, 1.9, 10.4);

/* ═════════════════════════ Luci, cielo, ambiente ═════════════════════════ */
const sky = new Sky(); sky.scale.setScalar(4500); scene.add(sky);
const skyU = sky.material.uniforms; skyU.turbidity.value = 5; skyU.rayleigh.value = 1.4; skyU.mieCoefficient.value = 0.004; skyU.mieDirectionalG.value = 0.82;
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); const envSky = new Sky(); envSky.scale.setScalar(4500); envScene.add(envSky);
let envRT = null;
const hemi = new THREE.HemisphereLight(0xdfe9ff, 0x6d5f4a, 0.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dd, 3);
sun.castShadow = true; sun.shadow.mapSize.set(isTouch ? 2048 : 4096, isTouch ? 2048 : 4096);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 220 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
scene.add(sun, sun.target); sun.target.position.set(4, 0, 6);
const roomLights = [];
for (const r of ROOMS) for (const [x, z] of r.lamp) { const L = new THREE.PointLight(0xffe8c8, 0, 6.5, 2); L.position.set(x, under(x) - 0.35, z); world.add(L); roomLights.push(L); }
const extLights = [[3.6, OUT.z1 + 0.6], [OUT.x1 + 0.6, 9.1], [OUT.x1 + 0.6, 12.2], [3.3, -1.9]].map(([x, z]) => { const L = new THREE.PointLight(0xffd7a0, 0, 10, 2); L.position.set(x, 2.15, z); world.add(L); return L; });

let hour = 15.5, lightsOn = true, mode = 'walk';
const sunDir = new THREE.Vector3();
let envTimer = 0;
function applyTime(h) {
  hour = h;
  const ph = Math.PI * (h - 6) / 12, el = Math.sin(ph);                    // elevazione solare (giornata equinoziale)
  const elev = Math.asin(Math.max(-0.3, el * 0.78)), az = Math.PI * (h - 12) / 12 * 1.1;
  sunDir.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), Math.cos(az) * Math.cos(elev) * 0.85 + 0.25).normalize();
  skyU.sunPosition.value.copy(sunDir); envSky.material.uniforms.sunPosition.value.copy(sunDir);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) envSky.material.uniforms[k].value = skyU[k].value;
  sun.position.copy(sunDir).multiplyScalar(80).add(sun.target.position);
  const day = THREE.MathUtils.smoothstep(sunDir.y, -0.04, 0.22);
  sun.intensity = 3.2 * day; sun.color.setHSL(0.09, 0.9, 0.62 + 0.3 * THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.45));
  hemi.intensity = 0.05 + 0.35 * day;
  renderer.toneMappingExposure = 0.75 + 0.35 * day;
  const lamp = lightsOn ? 1 : 0, night = 1 - day;
  roomLights.forEach(L => { L.intensity = lamp * (6 + 10 * night); L.visible = L.intensity > 0.01; });
  extLights.forEach(L => { L.intensity = lightsOn ? 9 * night : 0; L.visible = L.intensity > 0.01; });
  M.bulb.emissiveIntensity = lamp * (1.2 + 2 * night); M.lampShade.emissiveIntensity = lamp * (0.4 + 0.8 * night);
  scene.fog.color.setHSL(0.58, 0.3, 0.12 + 0.55 * day);
  clearTimeout(envTimer); envTimer = setTimeout(updateEnv, 60);
}
function updateEnv() {
  const old = envRT; envRT = pmrem.fromScene(envScene, 0, 0.1, 5000); scene.environment = envRT.texture; if (old) old.dispose();
}
scene.fog = new THREE.Fog(0xa7c0d8, 120, 600);

/* ═════════════════════════ Post-processing ═════════════════════════ */
let composer = null, aoPass = null, hq = !isTouch;
function buildComposer() {
  composer = new EffectComposer(renderer);
  aoPass = new N8AOPass(scene, camera, innerWidth, innerHeight);
  Object.assign(aoPass.configuration, { aoRadius: 0.9, distanceFalloff: 0.6, intensity: 2.2, halfRes: true, denoiseSamples: 8, denoiseRadius: 10, gammaCorrection: false, aoSamples: 16, transparencyAware: true });
  composer.addPass(aoPass); composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio()));
}

/* ═════════════════════════ Navigazione ═════════════════════════ */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2 - 0.03; controls.minDistance = 3; controls.maxDistance = 120; controls.enabled = false;
const player = { x: 3.6, z: 18.5, yaw: 0, pitch: -0.03, eye: 1.62, r: 0.26 };
const keys = {}; let touchMove = { x: 0, y: 0 };
function collide(nx, nz) {
  const r = player.r;
  for (const c of colliders) {
    const cx = Math.max(c.x0, Math.min(nx, c.x1)), cz = Math.max(c.z0, Math.min(nz, c.z1)), dx = nx - cx, dz = nz - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (r - d) / d; nx += dx * k; nz += dz * k; }
      else { const l = nx - c.x0, rr = c.x1 - nx, t = nz - c.z0, b = c.z1 - nz, m = Math.min(l, rr, t, b);
        if (m === l) nx = c.x0 - r; else if (m === rr) nx = c.x1 + r; else if (m === t) nz = c.z0 - r; else nz = c.z1 + r; }
    }
  }
  return [nx, nz];
}
const inside = () => player.x > IN.x0 && player.x < IN.x1 && player.z > IN.z0 && player.z < IN.z1;
function setView() { camera.position.set(player.x, player.eye, player.z); camera.rotation.set(player.pitch, player.yaw, 0); }
function teleport(x, z, yaw = 0) { [player.x, player.z] = collide(x, z); player.yaw = yaw; player.pitch = -0.03; if (mode !== 'walk') setMode('walk'); setView(); }
const hint = document.getElementById('hint');
function setRoof(v) { roofGroup.visible = v; document.getElementById('tRoof').classList.toggle('on', v); }
function setMode(m) {
  mode = m;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  controls.enabled = m !== 'walk';
  if (document.pointerLockElement && m !== 'walk') document.exitPointerLock();
  if (m === 'walk') { setRoof(true); camera.fov = 70; camera.updateProjectionMatrix(); setView(); hint.style.display = ''; }
  if (m === 'orbit') { setRoof(true); camera.fov = 42; camera.updateProjectionMatrix(); camera.position.set(18, 11, 31); controls.target.set(4.5, 1.2, 6); controls.update(); hint.style.display = 'none'; }
  if (m === 'top') { setRoof(false); camera.fov = 38; camera.updateProjectionMatrix(); camera.position.set(4.6, 34, 7.2); controls.target.set(4.6, 0, 5.4); controls.update(); hint.style.display = 'none'; }
}
addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.code === 'KeyR') setRoof(!roofGroup.visible);
  if (e.code === 'KeyE') setMode(mode === 'walk' ? 'orbit' : mode === 'orbit' ? 'top' : 'walk');
  if (e.code === 'KeyL') toggleLabels();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && mode === 'walk') e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
let dragging = false, lx = 0, ly = 0;
const look = (dx, dy) => { player.yaw -= dx * 0.0022; player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.0022)); };
canvas.addEventListener('pointerdown', e => {
  if (mode !== 'walk' || e.pointerType === 'touch') return;
  dragging = true; lx = e.clientX; ly = e.clientY;
  if (!isTouch && canvas.requestPointerLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
});
addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointermove', e => {
  if (mode !== 'walk' || e.pointerType === 'touch') return;
  if (document.pointerLockElement === canvas) look(e.movementX, e.movementY);
  else if (dragging) { look(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; }
});
document.addEventListener('pointerlockchange', () => hint.classList.toggle('dim', document.pointerLockElement === canvas));
const touches = {};
canvas.addEventListener('touchstart', e => { if (mode !== 'walk') return; e.preventDefault(); for (const t of e.changedTouches) touches[t.identifier] = { side: t.clientX < innerWidth / 2 ? 'L' : 'R', sx: t.clientX, sy: t.clientY, lx: t.clientX, ly: t.clientY }; }, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (mode !== 'walk') return; e.preventDefault();
  for (const t of e.changedTouches) { const s = touches[t.identifier]; if (!s) continue;
    if (s.side === 'L') { touchMove.x = Math.max(-1, Math.min(1, (t.clientX - s.sx) / 60)); touchMove.y = Math.max(-1, Math.min(1, (t.clientY - s.sy) / 60)); }
    else { look((t.clientX - s.lx) * 1.4, (t.clientY - s.ly) * 1.4); s.lx = t.clientX; s.ly = t.clientY; } }
}, { passive: false });
const endT = e => { for (const t of e.changedTouches) { const s = touches[t.identifier]; if (s && s.side === 'L') touchMove = { x: 0, y: 0 }; delete touches[t.identifier]; } };
canvas.addEventListener('touchend', endT); canvas.addEventListener('touchcancel', endT);

/* ═════════════════════════ Minimappa ═════════════════════════ */
const mm = document.getElementById('mm'), mg = mm.getContext('2d');
const MM = { x0: -1.6, z0: -4.4, x1: 12.6, z1: 15.2 };
const mS = () => mm.width / (MM.x1 - MM.x0);
function drawMini() {
  const s = mS(), X = x => (x - MM.x0) * s, Z = z => (z - MM.z0) * s;
  mg.clearRect(0, 0, mm.width, mm.height); mg.fillStyle = 'rgba(14,17,22,.62)'; mg.fillRect(0, 0, mm.width, mm.height);
  mg.fillStyle = 'rgba(255,255,255,.10)'; mg.fillRect(X(PORCH.x0), Z(PORCH.z0), (PORCH.x1 - PORCH.x0) * s, (PORCH.z1 - PORCH.z0) * s); mg.fillRect(X(OUT.x0), Z(CARPORT.zi), (CARPORT.x1 - OUT.x0) * s, (OUT.z0 - CARPORT.zi) * s);
  for (const r of ROOMS) { mg.fillStyle = r.floor === 'wood' ? 'rgba(214,170,120,.35)' : r.floor === 'bath' ? 'rgba(170,200,215,.35)' : 'rgba(230,226,218,.3)'; for (const [a, b, c, d] of r.rects) mg.fillRect(X(a), Z(b), (c - a) * s, (d - b) * s); }
  mg.fillStyle = '#efe9de'; for (const r of planRects) mg.fillRect(X(r.x0), Z(r.z0), Math.max(1, (r.x1 - r.x0) * s), Math.max(1, (r.z1 - r.z0) * s));
  if (mode === 'walk') {
    mg.save(); mg.translate(X(player.x), Z(player.z)); mg.rotate(-player.yaw);
    mg.fillStyle = 'rgba(255,170,60,.3)'; mg.beginPath(); mg.moveTo(0, 0); mg.arc(0, 0, 40, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); mg.fill();
    mg.fillStyle = '#ffa53c'; mg.beginPath(); mg.arc(0, 0, 5, 0, 7); mg.fill(); mg.restore();
  }
}
mm.addEventListener('click', e => { const r = mm.getBoundingClientRect(), s = mS(); teleport((e.clientX - r.left) / r.width * mm.width / s + MM.x0, (e.clientY - r.top) / r.height * mm.height / s + MM.z0, player.yaw); });

/* ═════════════════════════ UI ═════════════════════════ */
function toggleLabels() { labelGroup.visible = !labelGroup.visible; document.getElementById('tLab').classList.toggle('on', labelGroup.visible); }
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
document.getElementById('tRoof').onclick = () => setRoof(!roofGroup.visible);
document.getElementById('tLab').onclick = toggleLabels;
document.getElementById('tFurn').onclick = e => { furnGroup.visible = !furnGroup.visible; e.currentTarget.classList.toggle('on', furnGroup.visible); };
document.getElementById('tLight').onclick = e => { lightsOn = !lightsOn; e.currentTarget.classList.toggle('on', lightsOn); applyTime(hour); };
const tHQ = document.getElementById('tHQ'); tHQ.classList.toggle('on', hq);
tHQ.onclick = () => { hq = !hq; tHQ.classList.toggle('on', hq); if (hq && !composer) buildComposer(); resize(); };
const tm = document.getElementById('time'), tlb = document.getElementById('timeLbl');
const fmt = v => String(Math.floor(v)).padStart(2, '0') + ':' + String(Math.round((v % 1) * 60)).padStart(2, '0');
tm.value = hour; tlb.textContent = fmt(hour);
tm.oninput = () => { applyTime(+tm.value); tlb.textContent = fmt(+tm.value); };
const sel = document.getElementById('rooms');
[['Davanti all\'ingresso', 3.6, 18.5, 0], ['Posto auto coperto', 9.4, -1.9, Math.PI / 2 + 0.15], ['Portico', 10.6, 13.2, 0.75]].concat(ROOMS.map(r => [r.name, ...r.spawn]))
  .forEach(([n, x, z, y]) => { const o = document.createElement('option'); o.textContent = n; o.dataset.v = JSON.stringify([x, z, y]); sel.appendChild(o); });
sel.onchange = () => { const v = JSON.parse(sel.selectedOptions[0].dataset.v); teleport(v[0], v[1], v[2]); sel.selectedIndex = 0; canvas.focus(); };
document.querySelectorAll('[data-facade]').forEach(b => b.onclick = () => { M.facade.color.set(b.dataset.facade); document.querySelectorAll('[data-facade]').forEach(x => x.classList.toggle('on', x === b)); });
document.getElementById('help').onclick = () => document.getElementById('helpBox').classList.toggle('show');
// il pulsante "Entra in casa" è collegato da uno script nel template, indipendente da questo

function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (composer) { composer.setSize(innerWidth, innerHeight); }
}
addEventListener('resize', resize);

/* ═════════════════════════ Loop ═════════════════════════ */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'walk') {
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1; if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
    if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
    f += -touchMove.y; s += touchMove.x;
    const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
    const v = (keys.ShiftLeft || keys.ShiftRight ? 4.5 : 2.0) * dt;
    if (f || s) {
      const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
      let [nx] = collide(player.x + (-sy * f + cy * s) * v, player.z); player.x = nx;
      let [, nz] = collide(player.x, player.z + (-cy * f - sy * s) * v); player.z = nz;
    }
    player.x = Math.max(-15, Math.min(26, player.x)); player.z = Math.max(-11, Math.min(29, player.z));
    setView();
  } else controls.update();
  scene.environmentIntensity = (mode === 'walk' && inside()) ? 0.35 : 0.85;
  drawMini();
  if (hq && composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
if (hq) buildComposer();
resize(); applyTime(hour); updateEnv(); setMode('walk');
window.__casa = { teleport, setMode, setRoof, applyTime, player, colliders, toggleLabels, setHQ: v => { hq = v; tHQ.classList.toggle('on', hq); if (hq && !composer) buildComposer(); resize(); }, ready: () => document.body.classList.contains('loaded') };
// il rendering parte solo quando si chiude l'introduzione: così il pulsante risponde subito anche su dispositivi lenti
let started = false;
function startRender() { if (started) return; started = true; last = performance.now(); requestAnimationFrame(frame); }
window.__casaStart = startRender;
if (!document.getElementById('intro')) startRender();
