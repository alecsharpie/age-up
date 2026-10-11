// Wild boar (feedback round 1 repaint): massive forequarters with a high shoulder hump and a bristly crest, a back that
// slopes down to small hindquarters, short thin legs, a long wedge-shaped head held low ending in a flat snout disc, a small
// upright ear and a curved tusk. Coarse hair streaks in the hide, light from the upper-left; outline from the body mask only.
// Usage: node tools/sprite-lab/gen/painter-nature/boar.mjs tools/sprite-lab/drafts/pixel.boar.js
import { paint, despeckle, text, put, get, hash, emit } from './quad.mjs';
import fs from 'fs';
const W = 23, H = 16, GY = 15;
const mats = {
  hide: { t: ['l', 'b', 'B', 'k'], thr: [0.6, 0.18, -0.25], ink: 'o', rim: 'k' },
  leg: { t: ['b', 'B', 'k', 'n'], ink: 'o' },
  head: { t: ['l', 'b', 'B', 'k'], ink: 'o', rim: 'k' },
};
// head stamps: origin top-left (local), snout at the right. l/b/B/k hide ramp, E ear, e eye, s/S snout, u/U tusk
const HD = {
  up: [`
.E......
lbE.....
bbbl....
bebbbl..
BbbbbbbS
.BBBBuss
..kkkUsS`, 15, 5],
  ear: [`
E.......
lEE.....
bbbl....
bebbbl..
BbbbbbbS
.BBBBuss
..kkkUsS`, 15, 5],
  root: [`
.E....
lbE...
bbbl..
bebbl.
BbbbbB
.BBbbb
..BbuS
...Uss`, 15, 7],
  gore: [`
..E.....
.lbE..us
bbbbl.uS
bebbbbss
BbbbbbS.
.BBBk...`, 15, 4],
  dead: [`
.E......
lbbbbbbs
BBBkkuSs`, 15, 10],
};
function boar(p) {
  const ox = (p.ox || 0) + (p.bx || 0), by = (p.by || 0) + (p.bob || 0), X = x => x + ox, hd = p.head || 'up';
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]], ry = p.ry || 1;
  const forms = [
    { cx: X(12.4), cy: 7.8 + by, rx: 4.2, ry: 3.9 * ry, mat: 'hide' },     // forequarters: deep, high hump
    { cx: X(8.4), cy: 8.5 + by, rx: 5.0, ry: 3.0 * ry, mat: 'hide' },      // barrel
    { cx: X(4.3), cy: 8.4 + by, rx: 2.8, ry: 2.6 * ry, mat: 'hide' },      // small hindquarters
  ];
  const H0 = HD[hd], hdy = hd === 'root' ? by * 0.4 : hd === 'dead' ? by : by;
  const hx = X(H0[1] + (p.hx || 0)), hy = H0[2] + hdy + (p.hy || 0);
  const hips = [[X(4.6), 10.2 + by], [X(12.0), 10.6 + by], [X(6.0), 10.0 + by], [X(13.6), 10.4 + by]];
  const base = [X(4.2), X(12.0), X(6.4), X(14.0)];
  const L = p.lying ? p.lying.map(([a, b, c, d, e, f], i) => ({ pts: [[X(a), b], [X(c), d], [X(e), f]], far: i > 1, mat: 'leg', w: [1.8, 1.2, 1.0], hoof: 'n' }))
    : legs.map(([dx, lift], i) => ({ hip: hips[i], foot: [base[i] + dx + 0.5, GY + 0.5 - lift - (i > 1 ? 0.6 : 0)], L1: 2.8, L2: 2.6, bend: i % 2 === 0 ? 'hind' : 'fore', far: i > 1, mat: 'leg', w: [2.2, 1.2, 1.0], hoof: 'n', lit: 0 }));
  const r = paint(p.W || W, H, {
    T: p.T, mats, forms, legs: L, stamps: [{ x: hx, y: hy, txt: H0[0], mat: 'head' }],
    // coarse hair: short dark streaks slanting back along the flank, a few lit hair tips on the upper body
    tex: (x, y, inf) => {
      if (inf.mat !== 'hide' || inf.stamp) return null;
      const k = (x + y * 2) % 5, hsh = hash(x, y, 7);
      if (inf.t === 1 && k === 0 && hsh < 0.7) return 'B';
      if (inf.t === 0 && hsh < 0.25) return 'b';
      if (inf.t === 2 && k === 2 && hsh < 0.5) return 'k';
      return null;
    },
    late: ctx => {
      const { g, fill } = ctx;
      // bristle crest along the spine: from mid-back to the top of the hump, spikes standing up and back
      if (!p.lying) for (let x = Math.round(X(6)); x <= Math.round(X(15)); x++) {
        let top = -1; for (let y = 0; y < H; y++) if (fill[y][x] === 1) { top = y; break; }
        if (top < 1) continue;
        const kx = x - X(6), hs = hash(x - ox, 1, 11), hs2 = hash(x - ox, 2, 13);
        if (hs < 0.8) put(g, x, top - 1, hs < 0.25 && kx > 2 && kx < 7 ? 'h' : 'o');                 // ragged hair line, a few grizzled tips
        if (kx > 2.5 && kx < 9 && hs2 < 0.7) { if (get(g, x, top - 1) !== '.') put(g, x, top - 2, 'o'); };      // longer bristles stand on the hump
      }
      // thin tail with a dark tuft
      if (!p.lying) { const t = p.tail ? -1 : 0; put(g, X(1.3), 7.5 + by + t * 0.5, 'k'); put(g, X(1.0 + (p.tail ? -0.6 : 0)), 8.6 + by + t, 'k'); put(g, X(0.8 + (p.tail ? -1 : 0)), 9.6 + by + t, 'o'); }
    },
    keep: 'kn',
  });
  let g = despeckle(r.g, 'eEsSuUhrRq');
  if (p.after) p.after(g, p.ox || 0);
  return text(g);
}
const gait = ph => { ph = ((ph % 1) + 1) % 1; if (ph < 0.6) return [Math.round(1.5 - ph / 0.6 * 3), 0]; const s = (ph - 0.6) / 0.4; return [Math.round(-1.5 + s * 3), s > 0.15 && s < 0.85 ? 1 : 0]; };
const OFF = [0, 0.5, 0.5, 0];   // trot: diagonal pairs
const walk = [0, 1, 2, 3, 4, 5].map(k => boar({ legs: OFF.map(o => gait(k / 6 + o)), bob: [0, -0.5, 0, 0, -0.5, 0][k], hy: k % 3 === 2 ? 0.5 : 0 }));
const st = { legs: [[0, 0], [0, 0], [0, 0], [0, 0]] };
const idle = [boar(st), boar({ ...st, by: 0.4 }), boar({ ...st, head: 'ear' }), boar({ ...st, tail: 1 }), boar({ ...st, head: 'root' }), boar({ ...st, head: 'root', hy: 0.6, tail: 1 }), boar({ ...st, head: 'root' }), boar({ ...st, head: 'ear', tail: 1 })];
// attack: tusk gore = lunge with a head toss (frame 0 is the strike) → hold → follow-through → recover
const attack = [
  boar({ head: 'gore', bx: 1, by: -0.6, legs: [[-2, 0], [1, 0], [-2, 0], [1, 1]] }),
  boar({ head: 'gore', bx: 1, by: -1, hy: -0.5, legs: [[-2, 0], [1, 1], [-2, 0], [1, 1]] }),
  boar({ head: 'root', bx: 1, legs: [[-1, 0], [1, 0], [-1, 0], [0, 0]] }),
  boar({ head: 'up', legs: [[0, 0], [0, 0], [0, 0], [0, 0]] }),
];
// death (26 wide, anchor 13): recoil, buckle, fall, impact, bounce, settle; last frame = carcass
const D = { W: 26, ox: 2 };
const lie = [[4.5, 12.6, 6.5, 14, 9, 15.2], [12, 12.6, 14, 14, 16.5, 15.2]];
const blood = (g, ox) => {
  for (const [x, y, c] of [[10, 15, 'R'], [11, 15, 'r'], [12, 15, 'r'], [13, 15, 'R'], [18, 15, 'r'], [19, 15, 'R']]) if ('.o'.includes(get(g, x + ox, y))) put(g, x + ox, y, c);
  for (const [x, y, c] of [[11, 10, 'q'], [12, 10, 'r'], [11, 11, 'r'], [12, 11, 'R']]) put(g, x + ox, y, c);
};
const death = [
  boar({ ...D, head: 'gore', hx: -0.6, legs: [[-1, 0], [1, 1], [-1, 0], [1, 0]], after: (g, ox) => put(g, 12 + ox, 7, 'r') }),
  boar({ ...D, head: 'root', by: 1.2, legs: [[0, 0], [-2, 2], [0, 0], [-2, 2]], T: { ang: 0.12, px: 5, py: 15 }, after: (g, ox) => put(g, 12 + ox, 9, 'r') }),
  boar({ ...D, head: 'dead', by: 1.6, ry: 0.86, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 0.8 : v)) }),
  boar({ ...D, head: 'dead', by: 2.4, ry: 0.78, lying: lie }),
  boar({ ...D, head: 'dead', by: 1.8, ry: 0.78, lying: lie.map(r => r.map((v, i) => i % 2 ? v - 0.6 : v)) }),
  boar({ ...D, head: 'dead', by: 2.4, ry: 0.78, lying: lie, after: blood }),
];
const spec = {
  id: 'boar', anchor: [11, 16], fps: { idle: 3, death: 10 }, anchors: { death: [13, 16] },
  palette: {
    o: ['#1e140c', 'ink outline / bristles'], l: ['#7e6a58', 'hide light'], b: ['#58483a', 'hide'], B: ['#3c2e24', 'hide shade'], k: ['#271b13', 'hide deep'],
    n: ['#140c08', 'hooves'], h: ['#9a8674', 'bristle tips'], E: ['#3a2c22', 'ear'], e: ['#7a5a32', 'eye'], s: ['#a88070', 'snout'], S: ['#7a5446', 'snout shade'],
    u: ['#f2ead4', 'tusk'], U: ['#c8bca0', 'tusk shade'],
    r: ['#a8242c', 'blood'], R: ['#5e1418', 'blood dark'], q: ['#d8606a', 'wound'],
  },
  frames: { idle, walk, attack, death },
};
fs.writeFileSync(process.argv[2], emit('boar', [
  'Wild boar, facing right (feedback round 1 repaint): massive forequarters with a high shoulder hump and a bristle crest, back sloping',
  'to small hindquarters, short thin legs, long wedge head held low with a flat snout disc, small upright ear and a curved tusk.',
  'Coarse hair streaks, light from the upper-left; outline from the body mask only. Wild: no team keys.',
  'Generated by tools/sprite-lab/gen/painter-nature/boar.mjs (shared painter quad.mjs). 23×16, hooves on the bottom row.',
  'idle: breathe, ear flick, tail flick, root (snout to the ground). walk: 6-frame trot. attack: tusk gore (lunge + head toss) → hold → follow → recover.',
  'death: recoil, buckle, fall, impact, bounce, settle; last frame = carcass (26×16).'], spec));
