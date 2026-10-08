import { grid, ell, line, stamp, outline, text, shift, set, get, emit } from './lib.mjs';
import fs from 'fs';
const W = 21, H = 14, GY = 13;
const FL = ['g', 'f', 'F', 'G'];
const HEAD = {
  up: `
.KKk...
pKkkk..
.Kkekkk
..kkkkk
...kkkn
....kn.`,
  upEar: `
pKKk...
.Kkkk..
.Kkekkk
..kkkkk
...kkkn
....kn.`,
  recoil: `
..KKk..
.pKkkk.
..Kkekk
..kkkkk
...kkkn
....kn.`,
  down: `
.KK...
pKkk..
.Kkkk.
..kekk
..kkkk
..kkkk
...kkn`,
  down2: `
......
.KK...
pKkk..
.Kkkk.
..kekk
..kkkk
...kkn`,
  dead: `
....pp...
.KKkkkkk.
.Kkkkkkkn
..kkkkkn.`,
};
const LIT = { g: 'F', f: 'F', F: 'G', G: 'G', K: 'k', k: 'k', p: 'k', e: 'k', n: 'n' };
function sheep(p) {
  const g = grid(p.W || W, H); const ox = p.ox || 0;
  const bx = 8 + ox + (p.bx || 0), by = 6.5 + (p.by || 0) + (p.bob || 0);
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]]; // [nearBack, nearFront, farBack, farFront] each [dx, lift]
  const hipY = Math.round(by + 3.4);
  const hips = [bx - 4, bx + 3, bx - 2, bx + 5];
  // far legs behind the body
  for (const k of [2, 3]) if (!p.lying) { const [dx, lf] = legs[k]; line(g, hips[k], hipY, hips[k] + dx, GY - lf, 'n'); }
  // fleece body: main + wool bumps (each its own little sphere so the coat reads curly)
  const th = p.th || 0, ry = p.ry || 3.6;
  ell(g, bx, by, 6, ry, FL, { th });
  const bumps = p.lying ? [[-3.5, -2.2, 2.6, 1.6], [0.5, -2.6, 3, 1.6], [4, -1.8, 2.2, 1.4], [-5.4, 0, 1.6, 2]] : [[-3.5, -2.5, 2.7, 2], [0.5, -2.9, 3.3, 1.7], [4, -2.3, 2.3, 1.8], [-5.4, 0.2, 1.8, 2.3]];
  for (const [dx, dy, rx, r2] of bumps) ell(g, bx + dx * Math.cos(th) - dy * Math.sin(th), by + dx * Math.sin(th) + dy * Math.cos(th), rx, r2, FL.slice(0, 3), { thr: [0.62, 0.25, -0.5] });
  // wool curls: short shade scallops on the mid tone, staggered so they read as fleece, not noise
  for (let y = 0; y < H; y++) for (let x = 0; x < g[0].length; x++) if ((y % 2 === 0) && ((x + (y % 4 === 0 ? 0 : 2)) % 4 === 0) && get(g, x, y) === 'f' && get(g, x + 1, y) === 'f' && get(g, x, y + 1) === 'f') { set(g, x, y, 'F'); }
  // tail
  if (!p.lying) ell(g, bx - 6.6, by - 1 - (p.tail ? 1.2 : 0), 1.2, 1.4, FL.slice(0, 3), { thr: [0.6, 0.2, -0.5] });
  // head
  const hk = p.head || 'up', hp = { up: [13, 1], upEar: [13, 1], recoil: [12, 0], down: [14, 6], down2: [14, 6], dead: [12, 7] }[hk];
  if (hk === 'up' || hk === 'upEar' || hk === 'recoil') ell(g, 13.6 + ox + (p.bx || 0) + (p.hx || 0), 1.6 + (p.bob || 0) + (p.hy || 0), 1.4, 1.0, ['g', 'f', 'F'], { thr: [0.5, 0, -1] }); // wool top-knot
  stamp(g, hp[0] + ox + (p.bx || 0) + (p.hx || 0), hp[1] + (p.bob || 0) + (p.hy || 0), HEAD[hk]);
  // selective outline: top edges of the left part lighten to the material's shade
  const cx = bx;
  outline(g, 'o', (x, y, nb) => (nb[0] !== '.' && nb[0] !== 'o' && x < cx + 1 && y < by - 1) ? LIT[nb[0]] : null);
  // near legs over the outline (dark already)
  if (!p.lying) for (const k of [0, 1]) { const [dx, lf] = legs[k]; line(g, hips[k], hipY, hips[k] + dx, GY - lf, 'k'); set(g, hips[k] + dx, GY - lf, 'n'); }
  else for (const [hx, hy, ex, ey] of p.lying) { line(g, hx + ox, hy, ex + ox, ey, 'k'); set(g, ex + ox, ey, 'n'); }
  if (p.after) p.after(g);
  return text(g);
}
// walk: diagonal pairs (nearFront+farBack) and (nearBack+farFront), 6 frames
const DX = [1, 0, -1, -1, 0, 1], LF = [0, 0, 0, 1, 1, 0], BOB = [0, -1, 0, 0, -1, 0];
const walk = [0, 1, 2, 3, 4, 5].map(i => { const a = i, b = (i + 3) % 6; return sheep({ bob: BOB[i], legs: [[DX[b], LF[b]], [DX[a], LF[a]], [DX[a], LF[a]], [DX[b], LF[b]]], head: 'up', hy: i % 3 === 1 ? 1 : 0 }); });
const stand = { legs: [[0, 0], [0, 0], [-1, 0], [1, 0]] };
const idleA = sheep({ ...stand, head: 'up' });
const idleEar = sheep({ ...stand, head: 'upEar' });
const idleTail = sheep({ ...stand, head: 'up', tail: 1, by: 0 });
const idleBreath = sheep({ ...stand, head: 'up', ry: 3.3, by: 0.3 });
const graze1 = sheep({ ...stand, head: 'down' });
const graze2 = sheep({ ...stand, head: 'down2', tail: 1 });
// death: recoil, buckle, fall, impact, bounce, settle (wider grid for the corpse)
const DW = 23, D = { W: DW, ox: 1 };
const lieLegs = [[5, 10, 9, 13], [7, 10, 11, 13], [12, 10, 16, 13], [14, 10, 18, 12]];
const blood = g => { for (const [x, y, c] of [[12, 13, 'R'], [13, 13, 'r'], [14, 13, 'r'], [15, 13, 'R'], [17, 13, 'r'], [18, 13, 'R'], [19, 13, 'R']]) if (get(g, x, y) === '.' || get(g, x, y) === 'o') set(g, x, y, c); for (const [x, y, c] of [[12, 8, 'q'], [13, 8, 'r'], [12, 9, 'r'], [13, 9, 'R']]) set(g, x, y, c); };
const death = [
  sheep({ ...D, head: 'recoil', bx: -1, legs: [[-1, 0], [1, 0], [-1, 0], [1, 0]], after: g => { set(g, 13, 6, 'r'); } }),
  sheep({ ...D, head: 'down', th: 0.2, by: 1, hy: 1, legs: [[0, 0], [-2, 0], [-1, 0], [-1, 0]], after: g => { set(g, 13, 7, 'r'); } }),
  sheep({ ...D, head: 'dead', hx: 1, hy: -1, th: -0.1, by: 1.4, ry: 3.1, lying: [[5, 9, 6, 13], [7, 9, 9, 13], [12, 9, 14, 13], [13, 9, 15, 12]] }),
  sheep({ ...D, head: 'dead', hx: 1, by: 2, ry: 2.8, lying: lieLegs }),
  sheep({ ...D, head: 'dead', hx: 1, hy: -1, by: 1, ry: 2.8, lying: lieLegs.map(([a, b, c, d]) => [a, b - 1, c, d - 1]) }),
  sheep({ ...D, head: 'dead', hx: 1, by: 2, ry: 2.8, lying: lieLegs, after: blood }),
];
const spec = {
  id: 'sheep', anchor: [10, 14], fps: { idle: 3, death: 10 }, anchors: { death: [11, 14] },
  palette: {
    o: ['#24180f', 'ink outline'], g: ['#fbf6ea', 'fleece light'], f: ['#e6dfcf', 'fleece'], F: ['#bcb6a8', 'fleece shade (cooler)'], G: ['#8e8a80', 'fleece deep'],
    K: ['#5e554c', 'face light'], k: ['#3a342e', 'face, legs'], n: ['#1e1a16', 'hooves, deep'], p: ['#b8786c', 'inner ear'], e: ['#e0d8c8', 'eye glint'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle: [idleA, idleBreath, idleEar, idleA, graze1, graze2, graze1, idleTail], walk, death },
};
fs.writeFileSync(process.argv[2].replace(".js",".json").replace(/.*\//,""), JSON.stringify(spec));
fs.writeFileSync(process.argv[2], emit('sheep', ['Sheep, facing right: curly white fleece (each wool bump its own little sphere, lit from the upper-left), black face and legs. Wild: no team keys.',
  'Composed by a script (paint body once, move legs/head stamps per frame), then emitted as literal grids. 20×14, hooves on the bottom row.',
  'idle: breathe, ear twitch, graze (head down, chew), tail flick. walk: 6-frame diagonal-pair trot with 1px bob. death: recoil, buckle, fall, impact, bounce, settle; last frame = carcass (22×14).'], spec));
