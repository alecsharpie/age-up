import { grid, ell, line, stamp, outline, text, set, get, emit } from './lib.mjs';
import fs from 'fs';
const W = 24, H = 20, GY = 19;
const HIDE = ['l', 't', 'd', 'D'];
const HEAD = {
  up: `
E......
EEt....
.lttt..
.ltxttt
..ttttn
...tt..`,
  ear: `
.E.....
EEt....
.lttt..
.ltxttt
..ttttn
...tt..`,
  down: `
EE...
.ltt.
.lttt
..xtt
..ttt
...tn`,
  dead: `
.EE......
.lttttt..
.lxttttn.
..ttcc...`,
};
const LIT = { l: 'd', t: 'd', d: 'D', D: 'D', c: 'C', C: 'd', E: 'd', x: 'D', n: 'D', w: 'C' };
/** leg as hip→knee→foot; near = 2px upper (lit|shade), 1px cannon; far = 1px deep */
function leg(g, hip, knee, foot, near) {
  if (near) {
    line(g, hip[0], hip[1], knee[0], knee[1], 't'); line(g, hip[0] + 1, hip[1], knee[0] + 1, knee[1] - 1, 'D');
    line(g, knee[0], knee[1], foot[0], foot[1], 'd'); set(g, foot[0], foot[1], 'a');
  } else { line(g, hip[0], hip[1], knee[0], knee[1], 'D'); line(g, knee[0], knee[1], foot[0], foot[1], 'D'); set(g, foot[0], foot[1], 'a'); }
}
const lerp = (a, b, t) => a + (b - a) * t;
function legPts(hx, hy, dx, lift, hind) {
  const foot = [hx + dx, GY - lift];
  const kt = hind ? 0.45 : 0.5;
  const knee = [Math.round(lerp(hx, foot[0], kt) + (hind ? -1 : 0) + (lift ? (hind ? -1 : 1) : 0)), Math.round(lerp(hy, foot[1], kt) - (lift ? 1 : 0))];
  return [[hx, hy], knee, foot];
}
function deer(p) {
  const g = grid(p.W || W, H); const ox = (p.ox || 0) + (p.bx || 0);
  const by = 11 + (p.by || 0) + (p.bob || 0), bx = 10 + ox;
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]]; // nearHind, nearFore, farHind, farFore
  const hipY = Math.round(by + 2), hips = [bx - 4, bx + 4, bx - 3, bx + 5];
  if (!p.lying) for (const k of [2, 3]) { const [dx, lf] = legs[k]; leg(g, ...legPts(hips[k], hipY, dx, lf, k === 2), false); }
  const th = p.th || 0, rot = (dx, dy) => [bx + dx * Math.cos(th) - dy * Math.sin(th), by + dx * Math.sin(th) + dy * Math.cos(th)];
  const ry = p.ry || 1;
  ell(g, ...rot(0, 0), 6.5, 2.8 * ry, HIDE, { th });
  ell(g, ...rot(-4.5, 0.4), 3, 3.1 * ry, HIDE, { th });
  ell(g, ...rot(4.5, 0.4), 2.6, 2.9 * ry, HIDE, { th });
  // pale belly + rump patch
  ell(g, ...rot(0.5, 2.6 * ry), 4.5, 0.9, ['c', 'c', 'C', 'C'], { th, only: (x, y) => get(g, x, y) !== '.' });
  ell(g, ...rot(-7, -0.6), 1.2, 1.8, ['w', 'w', 'C'], { th, only: (x, y) => get(g, x, y) !== '.' });
  // neck + head
  const hk = p.head || 'up';
  if (hk === 'up' || hk === 'ear') ell(g, bx + 6.3 + (p.nx || 0), by - 3.6 + (p.hy || 0), 1.6, 3.2, HIDE, { th: 0.5 });
  else if (hk === 'down') ell(g, bx + 7.2, by + 1.2, 1.6, 3.4, HIDE, { th: -0.65 });
  else ell(g, bx + 6.5, by + 0.5, 3, 1.5, HIDE, { th: 0.15 });
  const hp = { up: [bx + 6, by - 8], ear: [bx + 6, by - 8], down: [bx + 8, by + 3], dead: [bx + 6, by - 1] }[hk];
  const hx = Math.round(hp[0] + (p.hx || 0)), hy = Math.round(hp[1] + (p.hy || 0));
  stamp(g, hx, hy, HEAD[hk]);
  if (p.tail) { set(g, bx - 7, by - 3, 'w'); set(g, bx - 7, by - 2, 'w'); }
  outline(g, 'o', (x, y, nb) => (nb[0] !== '.' && nb[0] !== 'o' && x < bx + 2 && y < by - 1) ? LIT[nb[0]] || null : null);
  // antlers (thin, painted over the outline): beam back-up with two tines
  if (p.antler !== false) {
    const ax = hk === 'down' ? hx + 1 : hk === 'dead' ? hx + 3 : hx + 2, ay = hk === 'down' ? hy : hk === 'dead' ? hy : hy + 1;
    const A = hk === 'down' ? [[0, -1, -2, -2], [-2, -2, -5, -1], [-1, -1, -2, -4], [-3, -2, -4, -4], [-4, -1, -5, -3]] : hk === 'dead' ? [[0, 0, -2, -1], [-2, -1, -6, -1], [-3, -1, -3, -3], [-5, -1, -5, -2]] : [[0, 0, -1, -2], [-1, -2, -4, -3], [-1, -2, 1, -3], [-3, -3, -3, -4], [-4, -3, -5, -2], [1, -3, 2, -4], [0, 0, 2, -1]];
    for (const [x0, y0, x1, y1] of A) line(g, ax + x0, ay + y0, ax + x1, ay + y1, 'a');
    for (const [x0, y0, x1, y1] of A) { set(g, ax + x1, ay + y1, 'A'); }
  }
  if (!p.lying) for (const k of [0, 1]) { const [dx, lf] = legs[k]; leg(g, ...legPts(hips[k], hipY, dx, lf, k === 0), true); }
  else for (const [x0, y0, x1, y1, x2, y2] of p.lying) { line(g, x0 + ox, y0, x1 + ox, y1, 'd'); line(g, x1 + ox, y1, x2 + ox, y2, 'D'); set(g, x2 + ox, y2, 'a'); }
  if (p.after) p.after(g, ox);
  return text(g);
}
const DX = [2, 1, -1, -2, 0, 2], LF = [0, 0, 0, 1, 2, 1], BOB = [0, -1, 0, 0, -1, 0];
const walk = [0, 1, 2, 3, 4, 5].map(i => { const a = i, b = (i + 3) % 6; return deer({ bob: BOB[i], legs: [[DX[b], LF[b]], [DX[a], LF[a]], [DX[a], LF[a]], [DX[b], LF[b]]], hy: i % 3 === 2 ? 1 : 0 }); });
const st = { legs: [[0, 0], [0, 0], [1, 0], [-1, 0]] };
const idle = [deer({ ...st }), deer({ ...st, by: 0.4 }), deer({ ...st, head: 'ear' }), deer({ ...st, tail: 1 }), deer({ ...st, head: 'down' }), deer({ ...st, head: 'down', by: 0.4 }), deer({ ...st, head: 'down', tail: 1 }), deer({ ...st, head: 'ear' })];
const DW = 28, D = { W: DW, ox: 2 };
const lie = [[5, 16, 7, 18, 10, 19], [7, 16, 9, 17, 12, 18], [13, 16, 15, 18, 18, 19], [15, 16, 17, 17, 20, 18]];
const blood = (g, ox) => { for (const [x, y, c] of [[15, 19, 'R'], [16, 19, 'r'], [17, 19, 'r'], [18, 19, 'R'], [21, 19, 'r'], [22, 19, 'R'], [23, 19, 'R']]) if ('.o'.includes(get(g, x + ox - 2, y))) set(g, x + ox - 2, y, c); for (const [x, y, c] of [[15, 13, 'q'], [16, 13, 'r'], [15, 14, 'r'], [16, 14, 'R']]) set(g, x + ox - 2, y, c); };
const death = [
  deer({ ...D, bx: -1, hy: -1, nx: -0.5, legs: [[-1, 0], [2, 1], [-1, 0], [2, 0]], after: (g, ox) => set(g, 15 + ox, 9, 'r') }),
  deer({ ...D, head: 'down', th: 0.22, by: 1, legs: [[0, 0], [-2, 3], [-1, 0], [-3, 2]], after: (g, ox) => set(g, 15 + ox, 11, 'r') }),
  deer({ ...D, head: 'dead', th: -0.1, by: 2, ry: 0.9, hy: -1, lying: [[6, 14, 8, 17, 9, 19], [14, 14, 16, 17, 18, 19]] }),
  deer({ ...D, head: 'dead', by: 3, ry: 0.8, lying: lie }),
  deer({ ...D, head: 'dead', by: 2, ry: 0.8, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 1 : v)) }),
  deer({ ...D, head: 'dead', by: 3, ry: 0.8, lying: lie, after: blood }),
];
const spec = {
  id: 'deer', anchor: [12, 20], fps: { idle: 3, walk: 14, death: 10 }, anchors: { death: [14, 20] },
  palette: {
    o: ['#24180f', 'ink outline'], l: ['#d8ab6e', 'hide light'], t: ['#b08650', 'hide'], d: ['#86603a', 'hide shade'], D: ['#563a22', 'hide deep'],
    c: ['#efe2c4', 'belly'], C: ['#c4b08a', 'belly shade'], w: ['#f8f4ea', 'white tail / rump'], E: ['#7a5636', 'ear'], x: ['#1a1008', 'eye'], n: ['#2a1c12', 'nose'],
    a: ['#5a3e26', 'antler, hooves'], A: ['#d8c8a8', 'antler tips'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle, walk, death },
};
fs.writeFileSync('pixel.deer.json', JSON.stringify(spec));
fs.writeFileSync(process.argv[2], emit('deer', ['Stag, facing right: tan hide (light upper-left, cool brown shade), pale belly and white rump, antlers with pale tips. Wild: no team keys.',
  'Composed by a script (body ellipses + head stamps + legs per frame), emitted as literal grids. 24×20, hooves on the bottom row.',
  'idle: alert, breathe, ear flick, tail flick, graze. walk: 6-frame canter, diagonal pairs, 1px bob. death: rear, knees buckle, fall, impact, bounce, settle; last frame = carcass (28×20).'], spec));
