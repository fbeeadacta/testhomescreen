/* Casa Tovo – render navigabile (Sol. A, Tavv. 02-03-05, Arch. D. Baretta)
   Coordinate: X verso destra in pianta, Z verso il basso in pianta, Y in alto. Unità: metri. */
(function () {
'use strict';
THREE.ColorManagement.legacyMode = false;

/* ───────────────────────── Geometria base ───────────────────────── */
const T = 0.30, TI = 0.10;                 // spessore muri esterni / interni
const XR = 3.2, YR = 3.57;                 // colmo: ascissa e quota intradosso
const slopeL = 0.125, slopeR = 0.15;       // pendenze falde (m/m)
const under = x => x <= XR ? YR - (XR - x) * slopeL : YR - (x - XR) * slopeR;   // quota intradosso copertura
const HOUSE = { x0: 0, x1: 7.98, z0: 0, z1: 14.7 };
const CARPORT_Z = -3.5, PORCH_X = 10.38;

/* ───────────────────────── Renderer / scena ───────────────────────── */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
camera.rotation.order = 'YXZ';
scene.add(camera);

/* ───────────────────────── Texture procedurali ───────────────────────── */
function ctex(w, h, draw, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
  t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
function noise(g, w, h, n, a) { for (let i = 0; i < n; i++) { const v = rnd() * 255 | 0; g.fillStyle = `rgba(${v},${v},${v},${a})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); } }

const texPlaster = ctex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); noise(g, w, h, 2500, 0.07); }, 1, 1);
const texGrass = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#5f8f3e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `hsl(${85 + rnd() * 30},${35 + rnd() * 20}%,${28 + rnd() * 18}%)`; g.fillRect(rnd() * w, rnd() * h, 2, 3); }
}, 60, 60);
const texWood = ctex(256, 256, (g, w, h) => {
  const pl = 8; for (let i = 0; i < pl; i++) {
    g.fillStyle = `hsl(${28 + rnd() * 6},${42 + rnd() * 10}%,${52 + rnd() * 8}%)`; g.fillRect(0, i * h / pl, w, h / pl);
    g.fillStyle = 'rgba(80,45,20,.35)'; g.fillRect(0, i * h / pl, w, 1.5);
    for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(90,55,25,.12)'; g.fillRect(rnd() * w, i * h / pl + rnd() * (h / pl), 20 + rnd() * 50, 1); }
    g.fillStyle = 'rgba(80,45,20,.35)'; g.fillRect((i % 2) * w / 2 + rnd() * 4, i * h / pl, 1.5, h / pl);
  }
}, 2.4, 2.4);
const texTile = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#c9c7c2'; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, 0.06);
  g.strokeStyle = 'rgba(70,70,70,.55)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}, 5, 5);
const texBath = ctex(128, 128, (g, w, h) => {
  g.fillStyle = '#dfe6e8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,100,105,.6)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
}, 12, 12);
const texRoof = ctex(256, 256, (g, w, h) => {
  const rows = 8, cols = 6;
  for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
    const x = c * w / cols + (r % 2) * w / cols / 2, y = r * h / rows;
    g.fillStyle = `hsl(${12 + rnd() * 6},${48 + rnd() * 10}%,${30 + rnd() * 8}%)`; g.fillRect(x, y, w / cols - 1.5, h / rows);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + h / rows - 4, w / cols, 4);
  }
}, 0.5, 0.5);
const texPave = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#9b9a95'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const x = c * 64 + (r % 2) * 32; g.fillStyle = `hsl(40,4%,${52 + rnd() * 14}%)`; g.fillRect(x + 1, r * 32 + 1, 62, 30); }
}, 4, 4);
const texGravel = ctex(256, 256, (g, w, h) => { g.fillStyle = '#b8ae9a'; g.fillRect(0, 0, w, h); noise(g, w, h, 6000, 0.25); }, 8, 8);
const texAsphalt = ctex(128, 128, (g, w, h) => { g.fillStyle = '#4b4d50'; g.fillRect(0, 0, w, h); noise(g, w, h, 2500, 0.18); }, 6, 6);
const texBrick = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#b4684c'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) { const x = c * 64 + (r % 2) * 32; g.fillStyle = `hsl(${12 + rnd() * 8},${45 + rnd() * 10}%,${38 + rnd() * 10}%)`; g.fillRect(x + 1, r * 21.3 + 1, 62, 19); }
}, 6, 2);

/* ───────────────────────── Materiali ───────────────────────── */
const std = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9, metalness: 0 }, o));
const M = {
  facade: std(0xc98f6a, { map: texPlaster }),
  inner: std(0xf3f0ea, { map: texPlaster }),
  ceil: std(0xfbfaf7, { map: texPlaster }),
  roof: std(0xffffff, { map: texRoof, roughness: 0.8 }),
  slab: std(0x6f6c68),
  wood: std(0xffffff, { map: texWood, roughness: 0.6 }),
  tile: std(0xffffff, { map: texTile, roughness: 0.45 }),
  bath: std(0xffffff, { map: texBath, roughness: 0.35 }),
  porch: std(0xffffff, { map: texTile, roughness: 0.7, color: 0xb5b2ac }),
  pave: std(0xffffff, { map: texPave }),
  gravel: std(0xffffff, { map: texGravel }),
  asphalt: std(0xffffff, { map: texAsphalt }),
  grass: std(0xffffff, { map: texGrass }),
  brick: std(0xffffff, { map: texBrick }),
  frame: std(0xa8601f, { roughness: 0.6 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xa8d0e6, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  door: std(0xf1ede4, { roughness: 0.55 }),
  doorExt: std(0x7b4a22, { roughness: 0.55 }),
  white: std(0xf0f0ee, { roughness: 0.4 }),
  chrome: std(0xb9bec3, { roughness: 0.3, metalness: 0.7 }),
  dark: std(0x2a2b2e, { roughness: 0.6 }),
  steel: std(0x9aa0a6, { roughness: 0.35, metalness: 0.6 }),
  counter: std(0x2f3033, { roughness: 0.3 }),
  cabinet: std(0xe4e1da, { roughness: 0.5 }),
  fabric: std(0x6d7f8c), fabric2: std(0xc9b08a), bed: std(0xe8e4dc), bed2: std(0x8ea4b4),
  leaf: std(0x3f7a3a), trunk: std(0x6a4a2c),
  carBody: std(0xb02a2a, { roughness: 0.25, metalness: 0.5 }), carGlass: std(0x1b2430, { roughness: 0.1, metalness: 0.4 }),
};

/* ───────────────────────── Raccolta oggetti ───────────────────────── */
const world = new THREE.Group(); scene.add(world);
const roofGroup = new THREE.Group(); world.add(roofGroup);
const furnGroup = new THREE.Group(); world.add(furnGroup);
const labelGroup = new THREE.Group(); world.add(labelGroup);
const colliders = [];            // {x0,x1,z0,z1}
const planRects = [];            // per minimappa
const roomLights = [];

function add(mesh, parent, cast, recv) {
  mesh.castShadow = cast !== false; mesh.receiveShadow = recv !== false; (parent || world).add(mesh); return mesh;
}
function box(x0, y0, z0, x1, y1, z1, mat, parent, cast) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return add(m, parent, cast);
}
function plane(x0, z0, x1, z1, y, mat, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  // ripeti la texture in base alla superficie
  m.material = mat.clone(); if (mat.map) { m.material.map = mat.map.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(mat.map.repeat.x * (x1 - x0) / 4, mat.map.repeat.y * (z1 - z0) / 4); }
  return add(m, parent, false, true);
}
function cyl(x, y0, z, r, h, mat, parent, seg) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 16), mat); m.position.set(x, y0 + h / 2, z); return add(m, parent);
}
function solid(x0, z0, x1, z1) { colliders.push({ x0, x1, z0, z1 }); }

/* ───────────────────────── Muri con aperture ───────────────────────── */
function prismX(a, b, y0, topFn, lo, hi, mat) {
  const pts = [[a, y0], [b, y0], [b, topFn(b)]];
  if (a < XR && b > XR) pts.push([XR, topFn(XR)]);
  pts.push([a, topFn(a)]);
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))), { depth: hi - lo, bevelEnabled: false });
  g.translate(0, 0, lo);
  add(new THREE.Mesh(g, mat));
}

/* opts: in: 'lo'|'hi'|null (lato interno per muri esterni), openings:[{c,w,sill,h,kind,swing}] */
function wall(x0, z0, x1, z1, opts) {
  opts = opts || {};
  const alongX = (x1 - x0) >= (z1 - z0);
  const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, lo = alongX ? z0 : x0, hi = alongX ? z1 : x1;
  const prof = x => under(x) + 0.01;
  const topConst = Math.max(under(alongX ? 0 : lo), under(alongX ? 0 : hi)) + 0.02;
  const ops = (opts.openings || []).slice().sort((p, q) => p.c - q.c);

  // pezzi {a,b,y0,y1|null(profilo)}
  const pieces = []; let cur = a0;
  ops.forEach(o => {
    const oa = o.c - o.w / 2, ob = o.c + o.w / 2;
    if (oa > cur) pieces.push({ a: cur, b: oa, y0: 0, y1: null });
    if (o.sill > 0) pieces.push({ a: oa, b: ob, y0: 0, y1: o.sill });
    pieces.push({ a: oa, b: ob, y0: o.sill + o.h, y1: null });
    cur = ob;
  });
  if (cur < a1) pieces.push({ a: cur, b: a1, y0: 0, y1: null });

  // strati: esterno (spesso) + pelle interna (sottile) oppure un solo strato
  const skin = 0.03;
  const layers = [];
  if (opts.in === 'lo') { layers.push([lo + skin, hi, opts.outMat || M.facade]); layers.push([lo, lo + skin, M.inner]); }
  else if (opts.in === 'hi') { layers.push([lo, hi - skin, opts.outMat || M.facade]); layers.push([hi - skin, hi, M.inner]); }
  else layers.push([lo, hi, opts.mat || M.inner]);

  pieces.forEach(p => {
    layers.forEach(([l0, l1, mat]) => {
      const inset = mat === M.inner && opts.in ? (opts.inset || 0) : 0;      // la pelle interna non arriva allo spigolo esterno
      const pa = Math.max(p.a, a0 + inset), pb = Math.min(p.b, a1 - inset);
      if (pb - pa < 1e-4) return;
      if (alongX) {
        if (p.y1 === null) prismX(pa, pb, p.y0, prof, l0, l1, mat);
        else box(pa, p.y0, l0, pb, p.y1, l1, mat);
      } else {
        const top = p.y1 === null ? topConst : p.y1;
        box(l0, p.y0, pa, l1, top, pb, mat);
      }
    });
    const topY = p.y1 === null ? 3 : p.y1;
    if (p.y0 < 1.7 && topY > 0.3) {
      const r = alongX ? { x0: p.a, x1: p.b, z0: lo, z1: hi } : { x0: lo, x1: hi, z0: p.a, z1: p.b };
      colliders.push(r); planRects.push(r);
    }
  });

  ops.forEach(o => fixture(o, alongX, (lo + hi) / 2, hi - lo));
}

/* serramenti e porte */
function fixture(o, alongX, mid, thick) {
  const g = new THREE.Group();
  const fw = 0.06, fd = Math.min(thick, 0.14);
  const fr = (x, y, w, h) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, fd), M.frame); m.position.set(x, y, 0); add(m, g); };
  if (o.kind === 'door') {                       // porta interna aperta
    const leafW = o.w - 0.03;
    const pivot = new THREE.Group();
    const lf = new THREE.Mesh(new THREE.BoxGeometry(leafW, o.h - 0.02, 0.04), M.door); lf.position.set(leafW / 2, (o.h - 0.02) / 2, 0); add(lf, pivot);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.06), M.chrome); hd.position.set(leafW - 0.08, 1.0, 0); add(hd, pivot, false);
    pivot.position.set(-o.w / 2, 0, 0); pivot.rotation.y = (o.swing || 1) * 1.25;
    g.add(pivot);
    fr(-o.w / 2, o.h / 2, fw, o.h); fr(o.w / 2, o.h / 2, fw, o.h); fr(0, o.h, o.w + fw, fw);
  } else if (o.kind === 'front') {               // porta d'ingresso
    const pivot = new THREE.Group();
    const lf = new THREE.Mesh(new THREE.BoxGeometry(o.w - 0.04, o.h - 0.03, 0.06), M.doorExt); lf.position.set((o.w - 0.04) / 2, (o.h - 0.03) / 2, 0); add(lf, pivot);
    pivot.position.set(-o.w / 2, 0, 0); pivot.rotation.y = (o.swing || 1) * 1.1; g.add(pivot);
    fr(-o.w / 2, o.h / 2, fw, o.h); fr(o.w / 2, o.h / 2, fw, o.h); fr(0, o.h, o.w + fw, fw);
  } else {                                       // finestra / portafinestra
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), M.glass); gl.position.set(0, o.h / 2, 0); g.add(gl);
    fr(-o.w / 2, o.h / 2, fw, o.h); fr(o.w / 2, o.h / 2, fw, o.h); fr(0, 0, o.w + fw, fw); fr(0, o.h, o.w + fw, fw);
    const cols = o.w > 2 ? 3 : o.w > 1.0 ? 2 : 1;
    for (let i = 1; i < cols; i++) fr(-o.w / 2 + i * o.w / cols, o.h / 2, 0.04, o.h);
    if (o.h > 1.2 && o.sill > 0) fr(0, o.h * 0.72, o.w, 0.04);
    if (o.h > 2.0) fr(0, o.h * 0.78, o.w, 0.04);
  }
  g.position.set(alongX ? o.c : mid, o.sill, alongX ? mid : o.c);
  g.rotation.y = alongX ? 0 : Math.PI / 2;
  if (!alongX && (o.kind === 'door' || o.kind === 'front')) g.rotation.y = -Math.PI / 2;
  world.add(g);
}

/* ───────────────────────── Struttura ───────────────────────── */
// platea
box(-0.05, -0.18, -0.05, 8.03, 0, 14.75, M.slab);
// muri esterni
wall(0, 0, 7.98, T, { in: 'hi', inset: T });                                                        // lato posto auto
wall(0, 14.4, 7.98, 14.7, { in: 'lo', inset: T, openings: [{ c: 3.9, w: 1.1, sill: 0, h: 2.4, kind: 'front', swing: -1 }] });
wall(0, T, T, 14.4, { in: 'hi', openings: [
  { c: 1.9, w: 0.8, sill: 0.9, h: 1.4 }, { c: 3.75, w: 0.8, sill: 0.9, h: 1.4 },
  { c: 5.2, w: 0.9, sill: 1.2, h: 1.0 }, { c: 7.9, w: 0.9, sill: 0.9, h: 1.4 },
  { c: 11.2, w: 0.9, sill: 0.9, h: 1.4 }, { c: 13.2, w: 0.9, sill: 0.9, h: 1.4 }] });
wall(7.68, T, 7.98, 14.4, { in: 'lo', openings: [
  { c: 2.2, w: 0.8, sill: 0, h: 2.4 }, { c: 5.2, w: 0.8, sill: 1.1, h: 1.4 },
  { c: 7.9, w: 0.8, sill: 0, h: 2.4 }, { c: 11.4, w: 2.4, sill: 0, h: 2.4 }] });
// muro di fondo del posto auto con lesene
wall(0, CARPORT_Z, PORCH_X, CARPORT_Z + T, { mat: M.brick });
[0.15, 3.0, 8.1].forEach(x => box(x - 0.2, 0, CARPORT_Z - 0.12, x + 0.2, under(x) + 0.01, CARPORT_Z, M.brick));
solid(0, CARPORT_Z - 0.15, PORCH_X, CARPORT_Z + T);

// tramezzi
wall(3.62, 0.3, 3.72, 3.2);                                   // fra le due camere
wall(3.1, 3.2, 4.3, 3.3);                                     // chiusura disimpegno
wall(0.3, 4.1, 3.1, 4.2);                                     // camera / bagno 1
wall(0.3, 6.2, 3.1, 6.3);                                     // bagno 1 / studio
wall(0.3, 9.5, 3.1, 9.6);                                     // studio / zona giorno
wall(4.3, 4.2, 7.68, 4.3);                                    // matrimoniale / bagno 2
wall(4.3, 6.2, 7.68, 6.3);                                    // bagno 2 / CT
wall(4.3, 9.5, 7.68, 9.6);                                    // CT / zona giorno
wall(3.1, 3.3, 3.2, 9.6, { openings: [                        // disimpegno lato sinistro
  { c: 3.72, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: 1 },
  { c: 5.2, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: 1 },
  { c: 8.3, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: 1 }] });
wall(4.2, 3.3, 4.3, 9.6, { openings: [                        // disimpegno lato destro
  { c: 3.75, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: -1 },
  { c: 5.2, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: -1 },
  { c: 7.9, w: 0.8, sill: 0, h: 2.1, kind: 'door', swing: -1 }] });

/* ───────────────────────── Pavimenti ───────────────────────── */
const FL = 0.004;
const rooms = [
  { id: 'living', name: 'Zona giorno', area: '35,7 m²', mat: M.tile, rects: [[0.3, 9.6, 7.68, 14.4], [3.2, 9.5, 4.2, 9.6]], spawn: [3.7, 10.3, Math.PI], light: [4.0, 12.0] },
  { id: 'disimp', name: 'Disimpegno', area: '5,8 m²', mat: M.wood, rects: [[3.2, 3.3, 4.2, 9.5]], spawn: [3.7, 8.6, 0], light: [3.7, 6.4] },
  { id: 'matr', name: 'Camera matrimoniale', area: '15,0 m²', mat: M.wood, rects: [[3.72, 0.3, 7.68, 3.2], [4.3, 3.2, 7.68, 4.2]], spawn: [5.8, 3.5, 0], light: [5.7, 1.8] },
  { id: 'camera', name: 'Camera', area: '12,7 m²', mat: M.wood, rects: [[0.3, 0.3, 3.62, 3.2], [0.3, 3.2, 3.1, 4.1]], spawn: [1.9, 3.4, 0], light: [1.9, 2.0] },
  { id: 'bagno1', name: 'Bagno 1', area: '5,7 m²', mat: M.bath, rects: [[0.3, 4.2, 3.1, 6.2]], spawn: [2.2, 5.5, 0], light: [1.7, 5.2] },
  { id: 'studio', name: 'Camera / studio', area: '9,1 m²', mat: M.wood, rects: [[0.3, 6.3, 3.1, 9.5]], spawn: [1.9, 8.7, 0], light: [1.7, 7.9] },
  { id: 'bagno2', name: 'Bagno 2', area: '4,1 m²', mat: M.bath, rects: [[4.3, 4.3, 7.68, 6.2]], spawn: [5.0, 5.6, 0], light: [6.0, 5.2] },
  { id: 'ct', name: 'CT / Lavanderia', area: '7,3 m²', mat: M.bath, rects: [[4.3, 6.3, 7.68, 9.5]], spawn: [5.2, 8.6, 0], light: [6.0, 7.9] },
];
rooms.forEach(r => {
  r.rects.forEach(([a, b, c, d]) => plane(a, b, c, d, FL, r.mat));
  const L = new THREE.PointLight(0xffefd5, 0.0, 9, 1.3); L.position.set(r.light[0], 2.4, r.light[1]); world.add(L); roomLights.push(L);
});
// portico, posto auto, percorsi
plane(7.98, 5.2, PORCH_X, 14.66, FL + 0.002, M.porch);
box(7.98, -0.15, 5.2, PORCH_X + 0.05, FL, 14.7, M.slab, world, false);
plane(-0.6, CARPORT_Z + T, PORCH_X + 0.05, 0, -0.01, M.pave);
plane(-14, -3, -0.6, 0, -0.012, M.gravel);       // accesso carraio da sinistra
plane(PORCH_X + 0.05, 5.2, 12.2, 14.7, -0.14, M.gravel);
plane(2.9, 14.7, 4.9, 19.5, -0.14, M.pave);        // vialetto ingresso
// pilastri portico + trave
[5.35, 9.9, 14.5].forEach(z => { box(10.18, 0, z - 0.1, 10.38, under(10.28) + 0.01, z + 0.1, M.white); solid(10.18, z - 0.1, 10.38, z + 0.1); });
box(10.16, 2.35, 5.25, 10.4, 2.5, 14.65, M.white);

/* ───────────────────────── Tetto ───────────────────────── */
(function buildRoof() {
  const xL = -0.55, xR = 10.8, th = 0.22, zA = CARPORT_Z - 0.4, zB = HOUSE.z1 + 0.55;
  const uL = under(xL), uR = under(xR);
  const A = [xL, uL], R = [XR, YR], B = [xR, uR];
  const nrm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l, dx / l, dy / l]; };
  const n1 = nrm(A, R), n2 = nrm(R, B);
  const A2 = [A[0] + n1[0] * th, A[1] + n1[1] * th], B2 = [B[0] + n2[0] * th, B[1] + n2[1] * th];
  // intersezione offset
  const P1 = [R[0] + n1[0] * th, R[1] + n1[1] * th], P2 = [R[0] + n2[0] * th, R[1] + n2[1] * th];
  const d1 = [n1[2], n1[3]], d2 = [n2[2], n2[3]];
  const det = d1[0] * -d2[1] - d1[1] * -d2[0];
  const tt = ((P2[0] - P1[0]) * -d2[1] - (P2[1] - P1[1]) * -d2[0]) / det;
  const Rt = [P1[0] + d1[0] * tt, P1[1] + d1[1] * tt];
  const shape = new THREE.Shape([A, R, B, B2, Rt, A2].map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(shape, { depth: zB - zA, bevelEnabled: false });
  g.translate(0, 0, zA);
  const rm = new THREE.Mesh(g, M.roof); add(rm, roofGroup);
  // intradosso bianco (due falde)
  const quad = (p0, p1, p2, p3) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...p0, ...p1, ...p2, ...p0, ...p2, ...p3], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    geo.computeVertexNormals(); return geo;
  };
  const dz = 0.005;
  [[xL, uL, XR, YR], [XR, YR, xR, uR]].forEach(([xa, ya, xb, yb]) => {
    const m = new THREE.Mesh(quad([xa, ya - dz, zA], [xb, yb - dz, zA], [xb, yb - dz, zB], [xa, ya - dz, zB]), M.ceil);
    m.receiveShadow = true; roofGroup.add(m);
  });
  // colmo
  const cap = box(XR - 0.25, YR + th - 0.02, zA - 0.02, XR + 0.25, YR + th + 0.1, zB + 0.02, M.dark, roofGroup);
})();

/* ───────────────────────── Arredi ───────────────────────── */
function furn(x0, z0, x1, z1, h, mat, y0) { const m = box(x0, y0 || 0, z0, x1, (y0 || 0) + h, z1, mat, furnGroup); if (h > 0.35 && !y0) solid(x0, z0, x1, z1); return m; }
function chair(x, z, rot, mat) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  box(-0.2, 0.42, -0.2, 0.2, 0.46, 0.2, mat || M.wood, g);
  box(-0.2, 0.46, 0.17, 0.2, 0.92, 0.2, mat || M.wood, g);
  [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => box(a - 0.015, 0, b - 0.015, a + 0.015, 0.42, b + 0.015, M.dark, g));
  furnGroup.add(g);
}
function stool(x, z) { cyl(x, 0, z, 0.02, 0.62, M.chrome, furnGroup, 8); cyl(x, 0.62, z, 0.18, 0.06, M.fabric, furnGroup, 16); }
function bed(x0, z0, w, l, headSide, mat) {   // headSide: 'z-' | 'z+'
  const x1 = x0 + w, z1 = z0 + l;
  furn(x0, z0, x1, z1, 0.32, M.dark);
  box(x0 + 0.02, 0.32, z0 + 0.02, x1 - 0.02, 0.52, z1 - 0.02, M.bed, furnGroup);
  box(x0 + 0.02, 0.52, headSide === 'z-' ? z0 + 0.45 : z0 + 0.02, x1 - 0.02, 0.56, headSide === 'z-' ? z1 - 0.02 : z1 - 0.45, mat || M.bed2, furnGroup);
  const hz = headSide === 'z-' ? z0 : z1 - 0.05;
  box(x0, 0.2, hz, x1, 1.1, hz + 0.05, M.wood, furnGroup);
  const pw = w > 1.2 ? 2 : 1;
  for (let i = 0; i < pw; i++) {
    const px = x0 + (i + 0.5) * w / pw;
    box(px - 0.25, 0.56, headSide === 'z-' ? z0 + 0.08 : z1 - 0.4, px + 0.25, 0.68, headSide === 'z-' ? z0 + 0.42 : z1 - 0.08, M.white, furnGroup);
  }
}
function wardrobe(x0, z0, x1, z1) { furn(x0, z0, x1, z1, 2.3, M.cabinet); }
function wc(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  box(-0.19, 0, 0.0, 0.19, 0.38, 0.28, M.white, g); box(-0.19, 0.38, -0.02, 0.19, 0.85, 0.14, M.white, g);   // cassetta + vaso
  box(-0.17, 0.38, 0.14, 0.17, 0.42, 0.55, M.white, g);
  furnGroup.add(g); g.userData.solid = true;
}
function basin(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  box(-0.3, 0, 0, 0.3, 0.8, 0.45, M.cabinet, g); box(-0.28, 0.8, 0.02, 0.28, 0.86, 0.43, M.white, g);
  box(-0.01, 0.86, 0.04, 0.01, 1.0, 0.08, M.chrome, g); box(-0.5, 1.05, 0.38, 0.5, 1.9, 0.4, M.glass, g, false);   // specchio
  furnGroup.add(g);
}
function shower(x0, z0, x1, z1) {
  furn(x0, z0, x1, z1, 0.06, M.white);
  box(x0, 0.06, z1 - 0.03, x1, 2.0, z1, M.glass, furnGroup, false);
  solid(x0, z0, x1, z1);
}

/* Zona giorno */
// cucina lungo il muro di fondo (a sinistra della porta d'ingresso) e colonne a destra
furn(0.4, 13.75, 3.2, 14.4, 0.9, M.cabinet); box(0.38, 0.9, 13.73, 3.22, 0.94, 14.4, M.counter, furnGroup);
furn(0.4, 14.1, 3.2, 14.4, 0.5, M.cabinet, 1.55);
box(1.0, 0.94, 14.0, 1.6, 0.955, 14.35, M.dark, furnGroup);                     // piano cottura
box(2.2, 0.94, 14.0, 2.7, 0.96, 14.3, M.steel, furnGroup);                       // lavello
furn(4.6, 13.75, 5.2, 14.4, 2.0, M.steel);                                       // frigorifero
furn(5.2, 13.75, 6.4, 14.4, 2.1, M.cabinet);                                     // dispensa
// isola e sgabelli
furn(1.5, 12.0, 3.7, 12.9, 0.92, M.cabinet); box(1.45, 0.92, 11.95, 3.75, 0.96, 12.95, M.counter, furnGroup);
stool(2.2, 11.65); stool(3.0, 11.65);
// divano e tavolino
furn(0.45, 9.9, 1.35, 11.8, 0.45, M.fabric); box(0.45, 0.45, 9.9, 0.7, 0.9, 11.8, M.fabric, furnGroup);
furn(0.45, 9.85, 1.35, 10.2, 0.6, M.fabric);
furn(1.75, 10.2, 2.65, 11.0, 0.4, M.wood);
// tavolo da pranzo
furn(4.9, 10.5, 6.9, 11.4, 0.76, M.wood);
for (let i = 0; i < 4; i++) { const cx = 5.2 + i * 0.5; chair(cx, 10.2, 0, M.fabric2); chair(cx, 11.7, Math.PI, M.fabric2); }
chair(4.6, 10.95, Math.PI / 2, M.fabric2); chair(7.2, 10.95, -Math.PI / 2, M.fabric2);
// mobile TV
furn(5.2, 9.7, 7.2, 10.0, 0.5, M.cabinet);

/* Camera matrimoniale */
bed(5.0, 0.3, 1.8, 2.1, 'z-');
furn(4.55, 0.3, 4.95, 0.7, 0.45, M.wood); furn(6.85, 0.3, 7.25, 0.7, 0.45, M.wood);
wardrobe(7.0, 1.6, 7.68, 3.1);
/* Camera */
bed(0.4, 0.3, 0.95, 2.0, 'z-', M.fabric2);
wardrobe(2.3, 0.3, 3.0, 1.7);
furn(1.5, 0.3, 2.2, 0.8, 0.75, M.wood);                  // scrivania
chair(1.85, 1.1, Math.PI, M.fabric);
/* Studio */
bed(0.4, 7.1, 0.95, 2.0, 'z-', M.fabric2);
furn(1.6, 8.7, 3.0, 9.4, 0.75, M.wood); chair(2.3, 8.35, 0, M.fabric);
wardrobe(2.5, 6.3, 3.1, 7.4);
/* Bagno 1 */
wc(2.6, 4.2, 0); basin(0.95, 4.2, 0);
shower(0.3, 5.3, 1.3, 6.2);
/* Bagno 2 */
wc(7.35, 4.3, 0); basin(6.2, 4.3, 0);
shower(4.3, 5.3, 5.4, 6.2);
/* CT / Lavanderia */
furn(4.4, 6.35, 5.0, 6.95, 0.85, M.white);                // lavatrice
furn(5.1, 6.35, 5.7, 6.95, 0.85, M.white);                // asciugatrice
furn(6.8, 6.35, 7.68, 7.2, 1.9, M.steel);                 // caldaia / accumulo
furn(4.4, 8.6, 7.6, 9.0, 0.5, M.cabinet);

/* Portico: tavolo e sedie */
furn(8.8, 11.9, 9.7, 13.5, 0.75, M.wood);
for (let i = 0; i < 3; i++) { const cz = 12.2 + i * 0.55; chair(8.45, cz, Math.PI / 2, M.fabric2); chair(10.05, cz, -Math.PI / 2, M.fabric2); }

/* Auto sotto il posto auto */
(function car() {
  const g = new THREE.Group(); g.position.set(5.0, 0, -1.75);
  box(-2.2, 0.28, -0.9, 2.2, 0.85, 0.9, M.carBody, g);
  box(-1.0, 0.85, -0.8, 1.3, 1.4, 0.8, M.carBody, g);
  box(-0.95, 0.88, -0.82, 1.25, 1.36, 0.82, M.carGlass, g);
  [[-1.35, -0.9], [1.35, -0.9], [-1.35, 0.9], [1.35, 0.9]].forEach(([a, b]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), M.dark); w.rotation.x = Math.PI / 2; w.position.set(a, 0.34, b * 0.93); add(w, g); });
  world.add(g); solid(2.8, -2.7, 7.2, -0.85);
})();

/* ───────────────────────── Contesto esterno ───────────────────────── */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), M.grass);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.15; ground.receiveShadow = true; world.add(ground);
plane(-60, -34, 60, -24, -0.14, M.asphalt);   // strada
box(-60, -0.15, -24.2, 60, 0.0, -24.0, M.slab, world, false);
// linea di mezzeria
for (let x = -58; x < 58; x += 6) plane(x, -29.1, x + 3, -28.9, -0.135, std(0xe9e6dc));
plane(-14.6, -24.1, -13.4, -3, -0.139, M.gravel);
function tree(x, z, s) {
  cyl(x, -0.15, z, 0.14 * s, 2.0 * s, M.trunk, world, 8);
  [[0, 3.0, 0, 1.3], [0.5, 2.5, 0.3, 0.9], [-0.5, 2.6, -0.3, 0.95]].forEach(([a, b, c, r]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), M.leaf); m.position.set(x + a * s, b * s, z + c * s); add(m);
  });
}
[[-9, 10, 1.3], [-12, 0, 1.0], [15, 2, 1.5], [16, 14, 1.2], [14, 24, 1.3], [-8, 24, 1.1], [-16, 18, 1.4], [20, -8, 1.3], [-6, -14, 1.0], [8, 30, 1.2]].forEach(a => tree(...a));
// siepe perimetrale
[[ -20, 36, 24, 24.6 ], [ 24, 24.6, -20, 36 ]].forEach(() => {});
function hedge(x0, z0, x1, z1) { box(x0, -0.15, z0, x1, 1.0, z1, M.leaf, world); }
hedge(-20, 35.5, 26, 36.4); hedge(25.5, -20, 26.4, 36.4); hedge(-20.4, -8, -19.5, 36.4);
hedge(-20, -9, -14, -8.2); hedge(-12.8, -9, 26, -8.2);

/* ───────────────────────── Etichette stanze ───────────────────────── */
function label(text, sub, x, y, z) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,24,30,.78)'; const r = 28; g.beginPath(); g.roundRect ? g.roundRect(6, 6, 500, 148, r) : g.rect(6, 6, 500, 148); g.fill();
  g.fillStyle = '#fff'; g.font = '600 56px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(text, 256, 74);
  g.fillStyle = '#ffd9a8'; g.font = '40px system-ui, sans-serif'; g.fillText(sub, 256, 125);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(1.7, 0.53, 1); s.position.set(x, y, z); s.renderOrder = 10; labelGroup.add(s);
}
rooms.forEach(r => label(r.name, r.area, r.light[0], 1.9, r.light[1]));
label('Posto auto coperto', '27,6 m²', 3, 1.9, -1.6); label('Portico', '22,7 m²', 9.2, 1.9, 9.5);
labelGroup.visible = false;

/* ───────────────────────── Luci ───────────────────────── */
const hemi = new THREE.HemisphereLight(0xdfeaff, 0x7a6d58, 0.6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dc, 1.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target); sun.target.position.set(5, 0, 5);
const head = new THREE.PointLight(0xfff3e0, 0.35, 7, 1.5); camera.add(head);

const skyDay = new THREE.Color(0x9fcdf0), skyNight = new THREE.Color(0x0b1226), skyDusk = new THREE.Color(0xf0a16a);
scene.fog = new THREE.Fog(0x9fcdf0, 70, 220);
let hour = 15;
function applyTime(h) {
  hour = h;
  const phase = Math.PI * (h - 6) / 12, el = Math.sin(phase);
  sun.position.set(5 + Math.cos(phase) * 60, Math.max(el, 0.02) * 60 + 2, 5 + 28);
  const day = Math.max(0, Math.min(1, el * 3));
  sun.intensity = 1.35 * day; sun.color.set(0xffffff).lerp(new THREE.Color(0xffc690), 1 - Math.min(1, el * 2.5));
  hemi.intensity = 0.12 + 0.55 * day;
  const sky = skyNight.clone().lerp(skyDusk, Math.max(0, 1 - Math.abs(el) * 4) * 0.8).lerp(skyDay, day);
  scene.background = sky; scene.fog.color.copy(sky);
  const lamp = 0.45 + 0.8 * (1 - day);
  roomLights.forEach(L => L.intensity = lightsOn ? lamp : 0);
  head.intensity = (mode === 'walk' ? 0.3 : 0) + (1 - day) * 0.15;
  renderer.toneMappingExposure = 1;
}
let lightsOn = true, mode = 'walk';

/* ───────────────────────── Navigazione ───────────────────────── */
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2 - 0.02; controls.enabled = false;
const player = { x: 3.9, z: 16.5, yaw: 0, pitch: 0, eye: 1.65, r: 0.28 };
const keys = {}; let touchMove = { x: 0, y: 0 }, locked = false;

function collide(nx, nz) {
  const r = player.r;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    const cx = Math.max(c.x0, Math.min(nx, c.x1)), cz = Math.max(c.z0, Math.min(nz, c.z1));
    const dx = nx - cx, dz = nz - cz, d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-9) { const d = Math.sqrt(d2), k = (r - d) / d; nx += dx * k; nz += dz * k; }
      else { // centro dentro il rettangolo: espelli dal lato più vicino
        const l = nx - c.x0, rr = c.x1 - nx, t = nz - c.z0, b = c.z1 - nz, m = Math.min(l, rr, t, b);
        if (m === l) nx = c.x0 - r; else if (m === rr) nx = c.x1 + r; else if (m === t) nz = c.z0 - r; else nz = c.z1 + r;
      }
    }
  }
  return [nx, nz];
}
function setView() {
  camera.position.set(player.x, player.eye, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
}
function teleport(x, z, yaw) { player.x = x; player.z = z; player.yaw = yaw || 0; player.pitch = 0; [player.x, player.z] = collide(player.x, player.z); if (mode !== 'walk') setMode('walk'); setView(); }

const hud = document.getElementById('hud'), hint = document.getElementById('hint');
function setMode(m) {
  mode = m;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  controls.enabled = m !== 'walk';
  if (document.pointerLockElement && m !== 'walk') document.exitPointerLock();
  if (m === 'walk') { setRoof(true); camera.fov = 70; camera.updateProjectionMatrix(); setView(); hint.style.display = ''; }
  if (m === 'orbit') { camera.fov = 45; camera.updateProjectionMatrix(); camera.position.set(-15, 11, 24); controls.target.set(4.5, 1.2, 5.5); controls.update(); setRoof(true); hint.style.display = 'none'; }
  if (m === 'top') { camera.fov = 40; camera.updateProjectionMatrix(); camera.position.set(5.2, 40, 4.6); controls.target.set(5.2, 0, 4.6); controls.update(); setRoof(false); hint.style.display = 'none'; }
  applyTime(hour);
}
function setRoof(v) { roofGroup.visible = v; const b = document.getElementById('tRoof'); if (b) b.classList.toggle('on', v); }

/* input tastiera */
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyR') setRoof(!roofGroup.visible);
  if (e.code === 'KeyE') setMode(mode === 'walk' ? 'orbit' : mode === 'orbit' ? 'top' : 'walk');
  if (e.code === 'KeyL') toggleLabels();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && mode === 'walk') e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* mouse look: pointer lock (se disponibile) o trascinamento */
let dragging = false, lx = 0, ly = 0;
function look(dx, dy) { player.yaw -= dx * 0.0022; player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - dy * 0.0022)); }
canvas.addEventListener('pointerdown', e => {
  if (mode !== 'walk' || e.pointerType === 'touch') return;
  dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId);
  if (canvas.requestPointerLock && !isTouch) { try { canvas.requestPointerLock(); } catch (_) {} }
});
canvas.addEventListener('pointerup', e => { dragging = false; });
canvas.addEventListener('pointermove', e => {
  if (mode !== 'walk' || e.pointerType === 'touch') return;
  if (document.pointerLockElement === canvas) look(e.movementX, e.movementY);
  else if (dragging) { look(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; }
});
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; hint.classList.toggle('dim', locked); });

/* touch: metà sinistra = joystick, metà destra = sguardo */
const isTouch = matchMedia('(pointer:coarse)').matches;
const touches = {};
canvas.addEventListener('touchstart', e => {
  if (mode !== 'walk') return; e.preventDefault();
  for (const t of e.changedTouches) touches[t.identifier] = { side: t.clientX < innerWidth / 2 ? 'L' : 'R', sx: t.clientX, sy: t.clientY, lx: t.clientX, ly: t.clientY };
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (mode !== 'walk') return; e.preventDefault();
  for (const t of e.changedTouches) {
    const s = touches[t.identifier]; if (!s) continue;
    if (s.side === 'L') { touchMove.x = Math.max(-1, Math.min(1, (t.clientX - s.sx) / 60)); touchMove.y = Math.max(-1, Math.min(1, (t.clientY - s.sy) / 60)); }
    else { look((t.clientX - s.lx) * 1.4, (t.clientY - s.ly) * 1.4); s.lx = t.clientX; s.ly = t.clientY; }
  }
}, { passive: false });
const endT = e => { for (const t of e.changedTouches) { const s = touches[t.identifier]; if (s && s.side === 'L') touchMove = { x: 0, y: 0 }; delete touches[t.identifier]; } };
canvas.addEventListener('touchend', endT); canvas.addEventListener('touchcancel', endT);

/* ───────────────────────── Minimappa ───────────────────────── */
const mm = document.getElementById('mm'), mg = mm.getContext('2d');
const MM = { x0: -1.2, z0: -4.2, x1: 11.4, z1: 15.2 };
const mScale = () => mm.width / (MM.x1 - MM.x0);
function drawMini() {
  const s = mScale(), X = x => (x - MM.x0) * s, Z = z => (z - MM.z0) * s;
  mg.clearRect(0, 0, mm.width, mm.height);
  mg.fillStyle = 'rgba(15,18,24,.55)'; mg.fillRect(0, 0, mm.width, mm.height);
  mg.fillStyle = 'rgba(255,255,255,.14)'; rooms.forEach(r => r.rects.forEach(([a, b, c, d]) => mg.fillRect(X(a), Z(b), (c - a) * s, (d - b) * s)));
  mg.fillRect(X(7.98), Z(5.2), (PORCH_X - 7.98) * s, (14.66 - 5.2) * s);
  mg.fillRect(X(0), Z(CARPORT_Z), (PORCH_X) * s, (-CARPORT_Z) * s);
  mg.fillStyle = '#e8e2d6'; planRects.forEach(r => mg.fillRect(X(r.x0), Z(r.z0), Math.max(1, (r.x1 - r.x0) * s), Math.max(1, (r.z1 - r.z0) * s)));
  if (mode === 'walk') {
    mg.save(); mg.translate(X(player.x), Z(player.z)); mg.rotate(-player.yaw);
    mg.fillStyle = 'rgba(255,170,60,.28)'; mg.beginPath(); mg.moveTo(0, 0); mg.arc(0, 0, 38, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); mg.fill();
    mg.fillStyle = '#ffa53c'; mg.beginPath(); mg.arc(0, 0, 4.5, 0, 7); mg.fill(); mg.restore();
  }
}
mm.addEventListener('click', e => {
  const r = mm.getBoundingClientRect(), s = mScale();
  const x = (e.clientX - r.left) / r.width * mm.width / s + MM.x0, z = (e.clientY - r.top) / r.height * mm.height / s + MM.z0;
  teleport(x, z, player.yaw);
});

/* ───────────────────────── UI ───────────────────────── */
function toggleLabels() { labelGroup.visible = !labelGroup.visible; document.getElementById('tLab').classList.toggle('on', labelGroup.visible); }
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
document.getElementById('tRoof').addEventListener('click', () => setRoof(!roofGroup.visible));
document.getElementById('tLab').addEventListener('click', toggleLabels);
document.getElementById('tFurn').addEventListener('click', e => { furnGroup.visible = !furnGroup.visible; e.currentTarget.classList.toggle('on', furnGroup.visible); });
document.getElementById('tLight').addEventListener('click', e => { lightsOn = !lightsOn; e.currentTarget.classList.toggle('on', lightsOn); applyTime(hour); });
const tm = document.getElementById('time'), tl = document.getElementById('timeLbl');
tm.addEventListener('input', () => { applyTime(+tm.value); const h = Math.floor(+tm.value), m = Math.round((+tm.value - h) * 60); tl.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); });
const sel = document.getElementById('rooms');
[['Ingresso', 3.9, 16.2, 0], ['Posto auto coperto', 9.0, -1.8, Math.PI / 2], ['Portico', 9.1, 14.0, 0]].concat(rooms.map(r => [r.name, r.spawn[0], r.spawn[1], r.spawn[2]]))
  .forEach(([n, x, z, y], i) => { const o = document.createElement('option'); o.value = i; o.textContent = n; o.dataset.v = JSON.stringify([x, z, y]); sel.appendChild(o); });
sel.addEventListener('change', () => { const v = JSON.parse(sel.selectedOptions[0].dataset.v); teleport(v[0], v[1], v[2]); sel.selectedIndex = -1; canvas.focus(); });
document.querySelectorAll('[data-facade]').forEach(b => b.addEventListener('click', () => {
  M.facade.color.set(b.dataset.facade); document.querySelectorAll('[data-facade]').forEach(x => x.classList.toggle('on', x === b));
}));
document.getElementById('help').addEventListener('click', () => document.getElementById('helpBox').classList.toggle('show'));
document.getElementById('start').addEventListener('click', () => document.getElementById('intro').remove());

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ───────────────────────── Loop ───────────────────────── */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'walk') {
    let f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
    if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
    f += -touchMove.y; s += touchMove.x;
    const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
    const v = (keys.ShiftLeft || keys.ShiftRight ? 4.6 : 2.2) * dt;
    if (f || s) {
      const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
      const dx = (-sy * f + cy * s) * v, dz = (-cy * f - sy * s) * v;
      let [nx, nz] = collide(player.x + dx, player.z); player.x = nx;
      [nx, nz] = collide(player.x, player.z + dz); player.z = nz;
    }
    player.x = Math.max(-18, Math.min(24, player.x)); player.z = Math.max(-22, Math.min(34, player.z));
    setView();
  } else controls.update();
  drawMini();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
applyTime(15); setMode('walk'); setView();
window.__casa = { teleport, setMode, setRoof, applyTime, player, camera, renderer, toggleLabels, colliders };
requestAnimationFrame(frame);
})();
