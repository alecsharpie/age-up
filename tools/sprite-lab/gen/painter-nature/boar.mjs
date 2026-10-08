import { grid, ell, line, stamp, outline, text, set, get, emit } from './lib.mjs';
import fs from 'fs';
const W = 23, H = 16, GY = 15;
const HIDE = ['l', 'b', 'B', 'k'];
const HEAD = {
  low: `
.E.....
EBbb...
.bbbe..
.bbbbbS
..Bbbss
..BBuUs
...B.u.`,
  ear: `
E......
.Bbb...
.bbbe..
.bbbbbS
..Bbbss
..BBuUs
...B.u.`,
  root: `
.E....
EBb...
.bbb..
.bbbe.
..bbbb
..BBbS
..BuUs
...Bss`,
  gore: `
....u..
.E..Us.
EBbbbss
.bbbbS.
.bbe...
..BB...`,
  dead: `
.EE......
.bbbbbbS.
.bebbbsss
..BBuUs..`,
};
const LIT = { l: 'B', b: 'B', B: 'k', k: 'k', E: 'k', e: 'B', s: 'S', S: 'B', u: 'U', U: 'B' };
function boar(p) {
  const g = grid(p.W || W, H); const ox = (p.ox || 0) + (p.bx || 0);
  const bx = 9 + ox, by = 8 + (p.by || 0) + (p.bob || 0);
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]];
  const hipY = Math.round(by + 3), hips = [bx - 4, bx + 3, bx - 2, bx + 5];
  if (!p.lying) for (const k of [2, 3]) { const [dx, lf] = legs[k]; line(g, hips[k], hipY, hips[k] + dx, GY - lf, 'k'); line(g, hips[k] + 1, hipY, hips[k] + 1 + dx, GY - lf, 'k'); }
  const th = p.th || 0, rot = (dx, dy) => [bx + dx * Math.cos(th) - dy * Math.sin(th), by + dx * Math.sin(th) + dy * Math.cos(th)];
  const ry = p.ry || 1;
  ell(g, ...rot(0, 0.3), 6.8, 3.6 * ry, HIDE, { th });
  ell(g, ...rot(3.5, -0.6), 4, 4 * ry, HIDE, { th });          // heavy shoulders
  ell(g, ...rot(-4.6, 0.3), 2.8, 3.3 * ry, HIDE, { th });       // rump
  const hk = p.head || 'low';
  const hp = { low: [bx + 7, by - 3], ear: [bx + 7, by - 3], root: [bx + 7, by - 1], gore: [bx + 7, by - 5], dead: [bx + 6, by - 1] }[hk];
  const hx = Math.round(hp[0] + (p.hx || 0)), hy = Math.round(hp[1] + (p.hy || 0));
  stamp(g, hx, hy, HEAD[hk]);
  outline(g, 'o', (x, y, nb) => (nb[0] !== '.' && nb[0] !== 'o' && x < bx + 1 && y < by - 2) ? LIT[nb[0]] || null : null);
  // bristle ridge along the spine: dark tufts above the outline, lit tips toward the front
  if (!p.lying || true) for (let x = 0; x < g[0].length; x++) {
    let top = -1; for (let y = 0; y < H; y++) if (get(g, x, y) !== '.') { top = y; break; }
    if (top < 1 || x < bx - 5 || x > bx + 5) continue;
    if ((x + (p.bob || 0)) % 3 !== 2) { set(g, x, top - 1, 'o'); if (x > bx - 1 && (x + (p.bob || 0)) % 3 === 0) set(g, x, top - 1, 'h'); }
  }
  // tail: thin curl at the rump
  const tx = Math.round(bx - 7.5), ty = Math.round(by - 1);
  if (!p.lying) { if (p.tail) { set(g, tx, ty - 1, 'B'); set(g, tx - 1, ty - 2, 'B'); } else { set(g, tx, ty, 'B'); set(g, tx - 1, ty + 1, 'B'); } }
  if (!p.lying) for (const k of [0, 1]) { const [dx, lf] = legs[k]; line(g, hips[k], hipY, hips[k] + dx, GY - lf, 'b'); line(g, hips[k] + 1, hipY, hips[k] + 1 + dx, GY - lf, 'B'); set(g, hips[k] + dx, GY - lf, 'n'); set(g, hips[k] + dx + 1, GY - lf, 'n'); }
  else for (const [x0, y0, x1, y1] of p.lying) { line(g, x0 + ox, y0, x1 + ox, y1, 'B'); line(g, x0 + ox + 1, y0, x1 + ox + 1, y1, 'k'); set(g, x1 + ox, y1, 'n'); set(g, x1 + ox + 1, y1, 'n'); }
  if (p.after) p.after(g, ox);
  return text(g);
}
const DX = [1, 0, -1, -1, 0, 1], LF = [0, 0, 0, 1, 1, 0], BOB = [0, -1, 0, 0, -1, 0];
const walk = [0, 1, 2, 3, 4, 5].map(i => { const a = i, b = (i + 3) % 6; return boar({ bob: BOB[i], legs: [[DX[b], LF[b]], [DX[a], LF[a]], [DX[a], LF[a]], [DX[b], LF[b]]], hy: i % 3 === 2 ? 1 : 0 }); });
const st = { legs: [[0, 0], [0, 0], [1, 0], [-1, 0]] };
const idle = [boar(st), boar({ ...st, by: 0.4 }), boar({ ...st, head: 'ear' }), boar({ ...st, tail: 1 }), boar({ ...st, head: 'root' }), boar({ ...st, head: 'root', hy: 1, tail: 1 }), boar({ ...st, head: 'root' }), boar({ ...st, head: 'ear', tail: 1 })];
const attack = [
  boar({ head: 'gore', bx: 2, by: -0.6, legs: [[-2, 0], [1, 0], [-1, 0], [1, 0]] }),
  boar({ head: 'gore', bx: 2, by: -1, hy: -1, legs: [[-2, 0], [1, 0], [-1, 0], [1, 1]] }),
  boar({ head: 'low', bx: 1, legs: [[-1, 0], [0, 0], [0, 0], [0, 0]] }),
  boar({ head: 'root', bx: 0, legs: [[0, 0], [0, 0], [1, 0], [-1, 0]] }),
];
const DW = 26, D = { W: DW, ox: 2 };
const lie = [[4, 12, 7, 15], [6, 12, 9, 14], [12, 12, 15, 15], [14, 12, 17, 14]];
const blood = (g, ox) => { for (const [x, y, c] of [[14, 15, 'R'], [15, 15, 'r'], [16, 15, 'r'], [17, 15, 'R'], [19, 15, 'r'], [20, 15, 'R'], [21, 15, 'R']]) if ('.o'.includes(get(g, x + ox - 2, y))) set(g, x + ox - 2, y, c); for (const [x, y, c] of [[13, 9, 'q'], [14, 9, 'r'], [13, 10, 'r'], [14, 10, 'R']]) set(g, x + ox - 2, y, c); };
const death = [
  boar({ ...D, head: 'gore', bx: -1, legs: [[-1, 0], [2, 1], [-1, 0], [1, 0]], after: (g, ox) => set(g, 14 + ox, 7, 'r') }),
  boar({ ...D, head: 'root', th: 0.18, by: 1, legs: [[0, 0], [-2, 1], [-1, 0], [-2, 0]], after: (g, ox) => set(g, 14 + ox, 8, 'r') }),
  boar({ ...D, head: 'dead', th: -0.1, by: 1.5, ry: 0.85, lying: [[5, 12, 6, 15], [13, 12, 15, 15]] }),
  boar({ ...D, head: 'dead', by: 2.2, ry: 0.72, lying: lie }),
  boar({ ...D, head: 'dead', by: 1.4, ry: 0.72, lying: lie.map(([a, b, c, d]) => [a, b - 1, c, d - 1]) }),
  boar({ ...D, head: 'dead', by: 2.2, ry: 0.72, lying: lie, after: blood }),
];
const spec = {
  id: 'boar', anchor: [11, 16], fps: { idle: 3, death: 10 }, anchors: { death: [13, 16] },
  palette: {
    o: ['#1e140c', 'ink outline / bristles'], l: ['#7c6858', 'hide light'], b: ['#56463a', 'hide'], B: ['#3a2c22', 'hide shade'], k: ['#261a12', 'hide deep, far legs'],
    h: ['#9a8674', 'bristle tips'], E: ['#3a2c22', 'ear'], e: ['#e8c070', 'eye'], s: ['#b58a74', 'snout'], S: ['#8a5e4c', 'snout shade'],
    u: ['#f2ead4', 'tusk'], U: ['#c8bca0', 'tusk shade'], n: ['#140c08', 'hooves'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle, walk, attack, death },
};
fs.writeFileSync('pixel.boar.json', JSON.stringify(spec));
fs.writeFileSync(process.argv[2], emit('boar', ['Wild boar, facing right: dark bristly hide with heavy shoulders, a spiky spine ridge, low wedge head with a pale snout and white tusk. Wild: no team keys.',
  'Composed by a script (body ellipses + head stamps + legs per frame), emitted as literal grids. 23×16, hooves on the bottom row.',
  'idle: breathe, ear flick, tail flick, root (snout to the ground). walk: 6-frame trot. attack: tusk gore (lunge + head toss) → hold → follow → recover.',
  'death: recoil, buckle, fall, impact, bounce, settle; last frame = carcass (26×16).'], spec));
