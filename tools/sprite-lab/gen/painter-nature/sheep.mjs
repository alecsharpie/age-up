// Sheep (feedback round 1 repaint): a deep woolly barrel on short thin dark legs, a small dark wedge head carried low on a
// short wool-covered neck, ears out sideways, a stubby wool tail. Fleece is lumpy (wool locks as small volumes + crimp marks),
// lit from the upper-left. Usage: node tools/sprite-lab/gen/painter-nature/sheep.mjs tools/sprite-lab/drafts/pixel.sheep.js
import { paint, despeckle, text, put, get, hash, emit } from './quad.mjs';
import fs from 'fs';
const W = 21, H = 14, GY = 13;
const mats = {
  wool: { t: ['g', 'f', 'F', 'G'], thr: [0.55, 0.12, -0.32], ink: 'o', rim: 'G' },
  face: { t: ['K', 'k', 'j', 'n'], thr: [0.55, 0.1, -0.3], ink: 'n', rim: 'n' },
};
// p: {ox, bob, by, legs:[[dx,lift]x4 nearHind,nearFore,farHind,farFore], head:'up'|'ear'|'down'|'down2'|'recoil'|'dead', tail, T, lying}
function sheep(p) {
  const ox = p.ox || 0, by = (p.by || 0) + (p.bob || 0), X = x => x + ox;
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]], hd = p.head || 'up';
  const forms = [
    { cx: X(9.2), cy: 6.4 + by, rx: 6.2, ry: 3.4 * (p.ry || 1), mat: 'wool' },            // barrel
    { cx: X(4.6), cy: 6.3 + by, rx: 3.3, ry: 3.3 * (p.ry || 1), mat: 'wool' },            // quarters
    { cx: X(13.2), cy: 6.2 + by, rx: 3.0, ry: 3.2 * (p.ry || 1), mat: 'wool' },           // shoulder / chest
    ...(p.lying ? [] : [{ cx: X(6.2), cy: 3.6 + by, rx: 2.4, ry: 1.4, mat: 'wool', z: 0 },   // wool locks along the back
    { cx: X(10.4), cy: 3.4 + by, rx: 2.6, ry: 1.4, mat: 'wool', z: 0 }]),
    { cx: X(2.4), cy: 5.4 + by - (p.tail ? 0.8 : 0), rx: 1.1, ry: 1.5, mat: 'wool' },      // tail
  ];
  // head: a small dark wedge (long Roman nose, ear out behind the poll), hand-drawn per pose; the neck is a wool volume
  const HD = {
    up: [`
.Kk...
nKkk..
.kekj.
..kkjj
...jn.`, 15.2, 1.6],
    ear: [`
n.....
.Kk...
pKkk..
.kekj.
..kkjj
...jn.`, 15.2, 0.6],
    recoil: [`
..Kk..
nKkkk.
.kekkj
..kjjn`, 14.6, 0.6],
    down: [`
nKk.
.Kkk
.kek
.kkj
..kj
..jn`, 16.4, 7.5],
    down2: [`
.Kk.
nKkk
.kek
.kkj
..kj
..jn`, 16.5, 7.8],
    dead: [`
.nKkk..
..kkekj
...jjjn`, 16, 10.2],
  }[hd];
  const hx = X(HD[1] + (p.hx || 0)), hy = HD[2] + (hd.startsWith('down') || hd === 'dead' ? 0 : by) + (p.hy || 0);
  const neck = hd.startsWith('down') ? { cx: X(15.0), cy: 7.4 + by, rx: 2.3, ry: 2.0, ang: 1.0 } : hd === 'dead' ? { cx: X(15.0), cy: 10.4 + by * 0.2, rx: 2.4, ry: 1.6, ang: 0.2 } : { cx: X(14.4), cy: 5.0 + by, rx: 2.4, ry: 2.2, ang: -0.6 };
  forms.push({ ...neck, mat: 'wool', z: 1 });
  const hips = [[X(4.4), 8.4 + by], [X(12.4), 8.6 + by], [X(6.6), 8.0 + by], [X(14.4), 8.2 + by]];
  const base = [X(4.0), X(12.6), X(6.8), X(14.6)];
  const L = p.lying ? p.lying.map(([a, b, c, d, e, f], i) => ({ pts: [[X(a), b], [X(c), d], [X(e), f]], far: i > 1, mat: 'face', w: [1.6, 1.2, 1.0], hoof: 'n' }))
    : legs.map(([dx, lift], i) => ({ hip: hips[i], foot: [base[i] + dx + 0.5, GY + 0.5 - lift - (i > 1 ? 0.6 : 0)], L1: 3.0, L2: 2.7, bend: i % 2 === 0 ? 'hind' : 'fore', far: i > 1, mat: 'face', w: [2.0, 1.0, 0.9], hoof: 'n' }));
  const r = paint(p.W || W, H, {
    T: p.T, mats, forms, legs: L, stamps: [{ x: hx, y: hy, txt: HD[0], mat: 'face' }],
    // crimp: small staggered shadow ticks with a lit pixel above them, so the coat reads as locks of wool, not a cloud
    tex: (x, y, inf) => {
      if (inf.mat !== 'wool') return null;
      const row = Math.floor((y - by) / 2.5), k = (x + row * 2 + (row % 2) * 1) % 4;
      if (inf.t <= 1 && k === 0 && hash(x, row, 3) < 0.75) return inf.t === 0 ? 'f' : 'F';
      return null;
    },
    keep: 'nkKj',
  });
  let g = despeckle(r.g, 'eprRq');
  if (p.after) p.after(g, ox);
  return text(g);
}
// walk: diagonal pairs (near hind with far fore), 6 frames; feet sweep back on the ground and swing forward lifted
const gait = ph => { ph = ((ph % 1) + 1) % 1; if (ph < 0.62) return [Math.round(1.6 - ph / 0.62 * 3.2), 0]; const s = (ph - 0.62) / 0.38; return [Math.round(-1.6 + s * 3.2), s > 0.15 && s < 0.85 ? 1 : 0]; };
const OFF = [0, 0.5, 0.5, 0];   // nearHind, nearFore, farHind, farFore
const walk = [0, 1, 2, 3, 4, 5].map(k => sheep({ legs: OFF.map(o => gait(k / 6 + o)), bob: [0, -0.4, 0, 0, -0.4, 0][k], hy: k % 3 === 1 ? -0.4 : 0 }));
const stand = { legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
const idleA = sheep({ ...stand });
const idleBreath = sheep({ ...stand, by: 0.35, ry: 0.96 });
const idleEar = sheep({ ...stand, head: 'ear' });
const idleTail = sheep({ ...stand, tail: 1 });
const graze1 = sheep({ ...stand, legs: [[0, 0], [1, 0], [0, 0], [1, 0]], head: 'down' });
const graze2 = sheep({ ...stand, legs: [[0, 0], [1, 0], [0, 0], [1, 0]], head: 'down2', tail: 1 });
// death (23 wide, anchor 11): recoil, knees buckle, falling, impact, bounce, settle; last frame = carcass
const D = { W: 23, ox: 1 };
const wound = (x, y) => (g, ox) => { put(g, x + ox, y, 'r'); };
const lie = [[4.5, 10.8, 6.5, 12.2, 9, 13.2], [11.5, 10.8, 13.5, 12.2, 16, 13.2]];   // the near legs stick out stiff; far legs hidden under the body
const blood = (g, ox) => {
  for (const [x, y, c] of [[11, 13, 'R'], [12, 13, 'r'], [13, 13, 'r'], [14, 13, 'R'], [16, 13, 'r'], [17, 13, 'R']]) if (get(g, x + ox, y) === '.' || get(g, x + ox, y) === 'o') put(g, x + ox, y, c);
  for (const [x, y, c] of [[11, 9, 'q'], [12, 9, 'r'], [11, 10, 'r'], [12, 10, 'R']]) put(g, x + ox, y, c);
};
const death = [
  sheep({ ...D, head: 'recoil', hx: -0.6, legs: [[-1, 0], [1, 0], [-1, 0], [1, 0]], after: wound(12, 6) }),
  sheep({ ...D, head: 'down', by: 1.2, legs: [[0, 0], [-2, 2], [0, 0], [-2, 2]], T: { ang: 0.12, px: 5, py: 13 }, after: wound(12, 8) }),
  sheep({ ...D, head: 'dead', by: 2.2, ry: 0.88, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 0.6 : v)) }),
  sheep({ ...D, head: 'dead', by: 2.3, ry: 0.78, lying: lie }),
  sheep({ ...D, head: 'dead', by: 1.7, ry: 0.78, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 0.6 : v)) }),
  sheep({ ...D, head: 'dead', by: 2.3, ry: 0.78, lying: lie, after: blood }),
];
const spec = {
  id: 'sheep', anchor: [10, 14], fps: { idle: 3, death: 10 }, anchors: { death: [11, 14] },
  palette: {
    o: ['#3b3128', 'ink (warm dark grey-brown, softer than black against the fleece)'],
    g: ['#f4eedd', 'fleece light'], f: ['#ddd4bf', 'fleece'], F: ['#b3a993', 'fleece shade (cooler)'], G: ['#857c6c', 'fleece deep / lit rim'],
    K: ['#6a5d52', 'face light'], k: ['#463c34', 'face, legs'], j: ['#2e2722', 'face shade'], n: ['#1c1714', 'hooves, deep'],
    p: ['#a87064', 'inner ear'], e: ['#7a6440', 'eye (dull amber)'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle: [idleA, idleBreath, idleEar, idleA, graze1, graze2, graze1, idleTail], walk, death },
};
fs.writeFileSync(process.argv[2], emit('sheep', [
  'Sheep, facing right (feedback round 1 repaint): a deep woolly barrel on short thin dark legs with a hock behind and a knee in front,',
  'a small dark wedge head carried low on a short wool-covered neck, ears out sideways, stubby tail. Fleece = overlapping lit volumes',
  '+ crimp ticks (light upper-left); outline is a warm dark grey on the shaded side and the fleece deep tone on the lit rim. Wild: no team keys.',
  'Generated by tools/sprite-lab/gen/painter-nature/sheep.mjs (shared painter quad.mjs). 21×14, hooves on the bottom row.',
  'idle: stand, breathe, ear flick, graze (head down to the grass, chew), tail flick. walk: 6-frame walk, diagonal pairs, 1px bob.',
  'death: recoil, front knees buckle, fall, impact, bounce, settle; last frame = carcass (23×14).'], spec));
