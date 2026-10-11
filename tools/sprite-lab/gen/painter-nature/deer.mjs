// Red deer stag (feedback round 1 repaint): a compact deep-chested barrel high on long slender legs (hock well behind on the
// hind leg, knee on the fore), a slender neck carried up and forward, a small tapering head with big ears, branched antlers,
// pale belly and white rump patch. Shading in 3D from the upper-left; outline from the body mask only (legs stay thin).
// Usage: node tools/sprite-lab/gen/painter-nature/deer.mjs tools/sprite-lab/drafts/pixel.deer.js
import { paint, despeckle, text, put, get, line, emit } from './quad.mjs';
import fs from 'fs';
const W = 24, H = 20, GY = 19;
const mats = {
  hide: { t: ['l', 't', 'd', 'D'], thr: [0.58, 0.16, -0.28], ink: 'o', rim: 'D' },
  leg: { t: ['t', 'd', 'D', 'a'], ink: 'o' },
  head: { t: ['l', 't', 'd', 'D'], ink: 'o', rim: 'D' },
};
// neck + head, hand-drawn per pose (origin = top-left in local coords): a slender neck rising from the shoulder, a small
// tapering head (4 px skull-to-nose), big ears back from the poll, dark nose. `poll` = where the antlers grow from.
const HD = {
  up: [`
...E.....
..EElt...
..lttxt..
.ltdddDn.
ltd......
td.......`, 13, 3.6, [17, 3.6]],
  ear: [`
..E......
..EElt...
..lttxt..
.ltdddDn.
ltd......
td.......`, 13, 3.6, [17, 3.6]],
  down: [`
lt.....
ttd....
.ttd...
..tdd..
.EEltd.
..Eltt.
...txd.
...ttd.
....dn.`, 14, 8, [17.5, 12]],
  dead: [`
.....E...
ltt.EElt.
tddtltxtt
.ddddddDn`, 14, 10, [18, 11]],
};
HD.alert = [HD.up[0], 13.6, 2.6, [17.6, 3.6]];
HD.rear = HD.alert;
// antler (offsets from the poll): beam up and back, brow and bez tines forward, a small crown on top
const ANT = {
  up: [[0, 0, -1, -2], [-1, -2, -2, -4], [0, -1, 1, -2], [-1, -2, 0, -3], [-2, -4, -1, -4]],
  down: [[0, 0, -1, -3], [-1, -2, -3, -3], [0, -1, 1, -3]],
  dead: [[0, 0, -2, -1], [-2, -1, -4, -1], [-1, -1, -1, -3], [-3, -1, -3, -3]],
};
function deer(p) {
  const ox = p.ox || 0, by = (p.by || 0) + (p.bob || 0), X = x => x + ox, hd = p.head || 'up';
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]], ry = p.ry || 1;
  const forms = [
    { cx: X(10.4), cy: 10.6 + by, rx: 5.0, ry: 2.5 * ry, mat: 'hide' },              // barrel (deep chest, tucked belly)
    { cx: X(6.0), cy: 10.0 + by, rx: 2.9, ry: 2.8 * ry, mat: 'hide' },               // quarters, high rump
    { cx: X(14.2), cy: 10.2 + by, rx: 2.5, ry: 2.9 * ry, mat: 'hide' },              // shoulder
    { cx: X(3.6), cy: 8.6 + by - (p.tail ? 0.8 : 0), rx: 0.9, ry: 1.3, mat: 'hide' }, // tail
  ];
  const H0 = HD[hd];
  const hdy = hd === 'down' ? by * 0.3 : hd === 'dead' ? by : by;
  const hx = X(H0[1] + (p.hx || 0)), hy = H0[2] + hdy + (p.hy || 0), poll = [X(H0[3][0] + (p.hx || 0)), H0[3][1] + hdy + (p.hy || 0)];
  const hips = [[X(6.0), 11.6 + by], [X(14.0), 11.8 + by], [X(7.4), 11.2 + by], [X(15.4), 11.4 + by]];
  const base = [X(5.6), X(14.0), X(7.6), X(15.6)];
  const L = p.lying ? p.lying.map(([a, b, c, d, e, f], i) => ({ pts: [[X(a), b], [X(c), d], [X(e), f]], far: i > 1, mat: 'leg', w: [1.8, 1.1, 1.0], hoof: 'a' }))
    : legs.map(([dx, lift], i) => ({ hip: hips[i], foot: [base[i] + dx + 0.5, GY + 0.5 - lift - (i > 1 ? 0.6 : 0)], L1: i % 2 ? 3.9 : 4.4, L2: i % 2 ? 4.1 : 3.9, bend: i % 2 === 0 ? 'hind' : 'fore', far: i > 1, mat: 'leg', w: [1.9, 1.0, 1.0], hoof: 'a', lit: 0 }));
  const r = paint(p.W || W, H, {
    T: p.T, mats, forms, legs: L, stamps: [{ x: hx, y: hy, txt: H0[0], mat: 'head' }],
    tex: (x, y, inf) => {
      if (inf.mat !== 'hide' || inf.stamp) return null;
      const f = inf.f; if (!f || f.rx < 2) return null;
      if (f === forms[0] || f === forms[2]) { if (inf.ly > f.cy + f.ry * 0.55) return inf.t >= 2 ? 'C' : 'c'; }                // pale belly
      if (f === forms[1] && inf.lx < f.cx - 1.4 && inf.ly < f.cy + 1.2) return inf.t >= 2 ? 'C' : 'w';                     // white rump patch
      return null;
    },
    pre: ctx => { // the far antler sits behind the head, a pixel further forward
      if (hd !== 'dead') for (const [a, b, c, d] of (hd === 'down' ? ANT.down : ANT.up).slice(0, 2)) ctx.line(poll[0] + 2.5 + a, poll[1] + 0.5 + b, poll[0] + 2.5 + c, poll[1] + 0.5 + d, 'V');
    },
    post: ctx => { if (!p.lying) ctx.put(3.4 + ox, 9.6 + by - (p.tail ? 0.8 : 0), 'D'); },   // dark tail tip
    late: ctx => {   // near antler over the outline, so the tines stay 1 px
      const A = hd === 'down' ? ANT.down : hd === 'dead' ? ANT.dead : ANT.up;
      for (const [a, b, c, d] of A) ctx.line(poll[0] + 0.5 + a, poll[1] + 0.5 + b, poll[0] + 0.5 + c, poll[1] + 0.5 + d, 'v');
      for (const [a, b, c, d] of A.slice(1)) ctx.put(poll[0] + 0.5 + c, poll[1] + 0.5 + d, 'A');
    },
    keep: 'aAvV',
  });
  let g = despeckle(r.g, 'xnaArRqE');
  if (p.after) p.after(g, ox);
  return text(g);
}
const gait = (ph, s = 2) => { ph = ((ph % 1) + 1) % 1; if (ph < 0.6) return [Math.round(s - ph / 0.6 * 2 * s), 0]; const k = (ph - 0.6) / 0.4; return [Math.round(-s + k * 2 * s), k > 0.1 && k < 0.9 ? (k > 0.3 && k < 0.7 ? 2 : 1) : 0]; };
const OFF = [0, 0.5, 0.5, 0];   // diagonal pairs: near hind + far fore, near fore + far hind
const walk = [0, 1, 2, 3, 4, 5].map(k => deer({ legs: OFF.map(o => gait(k / 6 + o)), bob: [0, -0.5, -0.5, 0, -0.5, -0.5][k], hy: k % 3 === 2 ? 0.5 : 0 }));
const st = { legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
const idle = [deer(st), deer({ ...st, by: 0.4 }), deer({ ...st, head: 'ear' }), deer({ ...st, tail: 1 }), deer({ ...st, head: 'down', legs: [[0, 0], [1, 0], [0, 0], [1, 0]] }), deer({ ...st, head: 'down', by: 0.4, legs: [[0, 0], [1, 0], [0, 0], [1, 0]] }), deer({ ...st, head: 'down', tail: 1, legs: [[0, 0], [1, 0], [0, 0], [1, 0]] }), deer({ ...st, head: 'alert' })];
// death (28 wide, anchor 14): rear, knees buckle, fall, impact, bounce, settle; last frame = carcass
const D = { W: 28, ox: 2 };
const lie = [[6, 16, 8.5, 18, 11, 19.2], [13, 16, 15.5, 18, 18, 19.2]];
const blood = (g, ox) => {
  for (const [x, y, c] of [[12, 19, 'R'], [13, 19, 'r'], [14, 19, 'r'], [15, 19, 'R'], [20, 19, 'r'], [21, 19, 'R']]) if ('.o'.includes(get(g, x + ox, y))) put(g, x + ox, y, c);
  for (const [x, y, c] of [[12, 13, 'q'], [13, 13, 'r'], [12, 14, 'r'], [13, 14, 'R']]) put(g, x + ox, y, c);
};
const death = [
  deer({ ...D, head: 'rear', hx: -0.4, hy: -0.6, legs: [[-1, 0], [2, 2], [-1, 0], [1, 1]], T: { ang: -0.1, px: 6, py: 19 }, after: (g, ox) => put(g, 13 + ox, 10, 'r') }),
  deer({ ...D, head: 'down', by: 1.4, legs: [[0, 0], [-3, 3], [0, 0], [-3, 3]], T: { ang: 0.14, px: 6, py: 19 }, after: (g, ox) => put(g, 13 + ox, 11, 'r') }),
  deer({ ...D, head: 'dead', by: 3.6, ry: 0.86, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 1.2 : v)) }),
  deer({ ...D, head: 'dead', by: 4.8, ry: 0.8, lying: lie }),
  deer({ ...D, head: 'dead', by: 4.2, ry: 0.8, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 0.7 : v)) }),
  deer({ ...D, head: 'dead', by: 4.8, ry: 0.8, lying: lie, after: blood }),
];
const spec = {
  id: 'deer', anchor: [12, 20], fps: { idle: 3, walk: 14, death: 10 }, anchors: { death: [14, 20] },
  palette: {
    o: ['#24180f', 'ink outline'], l: ['#cf9c62', 'hide light'], t: ['#a87545', 'hide'], d: ['#7c5232', 'hide shade'], D: ['#4e321e', 'hide deep / lit rim'],
    c: ['#e8d8b6', 'belly'], C: ['#bca88a', 'belly shade'], w: ['#f2ecdc', 'white rump patch'], E: ['#5e3e26', 'ear'], x: ['#140c06', 'eye'], n: ['#1e140c', 'nose'],
    a: ['#3a2616', 'hooves, leg deep'], v: ['#8a6a48', 'antler'], V: ['#5a4430', 'far antler'], A: ['#d8c8a8', 'antler tips'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle, walk, death },
};
fs.writeFileSync(process.argv[2], emit('deer', [
  'Red deer stag, facing right (feedback round 1 repaint): deep-chested barrel high on long slender legs (hock behind, knee in front),',
  'slender neck carried up and forward, small tapering head with big ears, branched antlers (far beam behind the head), pale belly,',
  'white rump patch. 3D shading from the upper-left; outline from the body mask only. Wild: no team keys.',
  'Generated by tools/sprite-lab/gen/painter-nature/deer.mjs (shared painter quad.mjs). 24×20, hooves on the bottom row.',
  'idle: alert, breathe, ear flick, tail flick, graze. walk: 6-frame canter, diagonal pairs, 1px bob.',
  'death: rear, knees buckle, fall, impact, bounce, settle; last frame = carcass (28×20).'], spec));
