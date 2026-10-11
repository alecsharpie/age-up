import { grid, put, get, line, rect, stamp, outline, over, clone, replace, emit, rotate, shift, W, H } from './lib.mjs';
import { despeckle, bbox, fallen } from './rig.mjs';
import { paint } from '../painter-nature/quad.mjs';
const OUT = process.argv[2];
const GW = 30, GH = 24;
function poly(g, pts, ch) {
  for (let y = 0; y < H(g); y++) { const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) put(g, x, y, typeof ch === 'function' ? ch(x, y) : ch); }
}
// wheel: centre (cx,cy), radius r, spokes rotated by ang (deg)
function wheel(g, cx, cy, r, ang, broken = false) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d <= r && d > r - 1.25) put(g, x, y, (x + 0.5 - cx) + (y + 0.5 - cy) < -1 ? 'w' : 'X');
  }
  for (let k = 0; k < 4; k++) { if (broken && k === 1) continue; const a = (ang + k * 45) * Math.PI / 180 * 2 / 2; const dx = Math.cos(a + k * Math.PI / 4 * 0), dy = Math.sin(a);
    const aa = (ang + k * 90) * Math.PI / 180;
    for (let t = 1; t < r - 1; t += 0.5) put(g, cx - 0.5 + Math.cos(aa) * t, cy - 0.5 + Math.sin(aa) * t, 'W');
  }
  put(g, cx - 0.5, cy - 0.5, 'u'); put(g, cx - 1.5, cy - 0.5, 'w'); put(g, cx - 0.5, cy - 1.5, 'w'); put(g, cx - 1.5, cy - 1.5, 'u');
}
// the cart (no ox): cover in team cloth, plank bed, one big wheel. flap = cloth flutter at the rear, loaded = gold at the back.
function cart(g, o) {
  const dy = o.dy || 0, loaded = o.loaded;
  const rear = loaded ? 5 : 2;
  // cover: arched hood
  poly(g, [[rear, 12 + dy], [rear, 7 + dy], [rear + 2, 4 + dy], [6, 3 + dy], [12, 3 + dy], [15, 5 + dy], [16.5, 8 + dy], [16.5, 12 + dy]], (x, y) => {
    const t = y - dy;
    if (x >= 15 || t >= 11) return 'D';
    if ((x <= rear + 1 && t <= 7) || t <= 3 || (x <= rear + 2 && t <= 5) || (x <= 7 && t === 4)) return 'L';
    return 'T';
  });
  for (const rx of [7, 11]) { line(g, rx, 4 + dy, rx, 11 + dy, 'D'); put(g, rx - 1, 4 + dy, 'L'); }
  put(g, 16, 9 + dy, 'X'); put(g, 16, 10 + dy, 'X'); put(g, 15, 10 + dy, 'D');   // dark front opening
  // rear drawstring pucker / flutter
  if (!loaded) { line(g, 2, 7 + dy, 2, 11 + dy, 'D'); put(g, 1, 8 + dy + (o.flap || 0), 'D'); put(g, 1, 9 + dy + (o.flap || 0), 'T'); }
  if (loaded) {
    // gold heap and a coin sack at the open back, glint moving with the frame
    stamp(g, 1, 7 + dy, `
..yy..
.yggG.
yggGgG
ygGgGG
gGGGGG
`);
    stamp(g, 4, 7 + dy, `
.c
cC
Cq
`);
    if (o.glint !== undefined) put(g, [3, 2, 4][o.glint], [8, 10, 9][o.glint] + dy, 'c');
  }
  // bed: planks
  rect(g, 1, 12 + dy, 17, 1, 'u'); rect(g, 1, 13 + dy, 17, 1, 'w'); rect(g, 1, 14 + dy, 17, 1, 'W');
  for (const px of [5, 10, 15]) put(g, px, 13 + dy, 'W');
  put(g, 1, 13 + dy, 'W');
  // wheel in front of the bed
  wheel(g, 9, 18.5, 5, o.ang || 0, o.broken);
}
// the draught horse (feedback round 1: "horse needs work"): a bay cob between the shafts, painted with the naturalistic quadruped
// painter (painter-nature/quad.mjs): quarters, barrel, deep shoulder, an arched neck with a dark mane, a long head carried
// nose-in, legs with hocks and knees, dark lower legs and two-pixel hooves. Harness: collar at the base of the neck, a back pad,
// the far shaft behind it and the near shaft across its flank.
const hmats = {
  coat: { t: ['h', 'b', 'B', 'k'], thr: [0.58, 0.15, -0.3], ink: 'o', rim: 'k' },
  leg: { t: ['b', 'B', 'k', 'K'], ink: 'o' },
  head: { t: ['h', 'b', 'B', 'k'], ink: 'o', rim: 'k' },
};
// head stamps (origin top-left): ears + forelock, long face to a dark muzzle; nose tucked in like a horse leaning into the collar
const HHEAD = {
  up: [`
K....
hKK..
hbbb.
bKbbb
.bbbBk
..BBkK`, 24.6, 3.6],
  low: [`
K.....
hKK...
hbbbb.
bKbbbB
..bBBk
...BkK`, 24.8, 5.4],
  graze: [`
K...
hKK.
bbb.
bKbb
.bbb
.bBB
..Bk
..kK`, 25.8, 14.6],
  down: [`
.K.....
hhbbb..
bKbbBBk
.bBBkkK`, 23.4, 16.4],
};
function horse(o) {
  const by = (o.oy || 0) + (o.bob || 0), hk = o.head || 'up', HH = HHEAD[hk];
  const legs = o.legs || [[0, 0], [0, 0], [0, 0], [0, 0]];   // nearHind, nearFore, farHind, farFore: [dx, lift]
  const forms = [
    { cx: 18.0, cy: 12.4 + by, rx: 3.0, ry: 3.3, mat: 'coat' },              // quarters
    { cx: 20.6, cy: 13.0 + by, rx: 4.0, ry: 3.2, mat: 'coat' },              // barrel
    { cx: 23.3, cy: 12.6 + by, rx: 2.3, ry: 3.5, mat: 'coat' },              // shoulder / chest
  ];
  if (hk !== 'down') forms.push({ cx: hk === 'graze' ? 25.4 : 25.0, cy: (hk === 'graze' ? 11.4 : hk === 'low' ? 9.4 : 8.6) + by, rx: 3.0, ry: 1.5, ang: hk === 'graze' ? 0.9 : hk === 'low' ? -0.7 : -1.05, mat: 'coat', z: 1 });   // neck
  else forms.push({ cx: 24.4, cy: 15.4 + by, rx: 2.6, ry: 1.4, ang: 0.2, mat: 'coat', z: 1 });
  const hx = HH[1], hy = HH[2] + (hk === 'down' ? 0 : by) + (o.hd || 0) * 0.6;
  const hips = [[17.4, 15.0 + by], [23.0, 15.4 + by], [18.6, 14.6 + by], [24.2, 15.0 + by]];
  const base = [16.8, 23.0, 18.4, 24.4];
  const L = o.lying ? o.lying.map(([a, b, c, d, e, f], i) => ({ pts: [[a, b], [c, d], [e, f]], far: i > 1, mat: 'leg', w: [2.0, 1.2, 1.0], hoof: 'K', hoofW: true }))
    : legs.map(([dx, lift], i) => ({ hip: hips[i], foot: [base[i] + dx + 0.5, 23.5 - lift - (i > 1 ? 0.6 : 0)], L1: i % 2 ? 3.6 : 4.2, L2: i % 2 ? 4.8 : 4.4, bend: i % 2 ? 'fore' : 'hind', far: i > 1, mat: 'leg', w: [2.6, 1.3, 1.1], hoof: 'K', hoofW: true, lit: 0 }));
  const r = paint(GW, GH, {
    T: o.T, mats: hmats, forms, legs: L, stamps: [{ x: hx, y: hy, txt: HH[0], mat: 'head' }],
    late: ctx => {
      const { g, fill } = ctx;
      // mane along the crest of the neck: dark hair on the top edge, one lighter strand under it
      if (hk !== 'down' && hk !== 'graze') for (let x = 23; x <= 26; x++) { let top = -1; for (let y = 0; y < GH; y++) if (fill[y][x] === 1) { top = y; break; } if (top < 1) continue; put(g, x, top, 'K'); if (x < 26) put(g, x, top - 1, 'K'); }
      // tail: hangs from the croup in a 2-px lock, swishing
      if (o.lying) { const [a, b] = ctx.P(15.6, 14 + by), [c, d] = ctx.P(13.6, 18 + by); line(g, a, b, c, d, 'K'); }
      else { const t = o.tail || 0; line(g, 15, 10 + by, 14 + t * 0.5, 13 + by, 'K'); line(g, 14 + t * 0.5, 13 + by, 14 + t, 17 + by, 'K'); put(g, 15 + t * 0.5, 13 + by, 'k'); put(g, 15 + t, 16 + by, 'k'); }
    },
    keep: 'K',
  });
  return r.g;
}
/** harness over the horse: collar at the base of the neck, back pad, the near shaft across the flank to the collar */
function harness(g, o) {
  const by = (o.oy || 0) + (o.bob || 0), dy = o.dy || 0;
  line(g, 24, 8 + by, 25, 12 + by, 'X'); put(g, 23, 8 + by, 'W'); put(g, 24, 9 + by, 'u');                                    // collar + hame
  put(g, 20, 9 + by, 'X'); put(g, 21, 9 + by, 'X'); line(g, 20, 10 + by, 20, 12 + by, 'W');                                    // back pad + belly band
  line(g, 15, 13 + dy, 24, 12 + by, 'u');                                                                                        // near shaft along the flank to the collar
}
function shafts(g, dy, odY = 0) { line(g, 15, 12 + dy, 26, 11 + odY, 'w'); }   // far shaft, behind the horse
function whole(o) {
  const c = grid(GW, GH); cart(c, o); const cs = outline(shift(c, -1, 0));
  const g = grid(GW, GH); shafts(g, o.dy || 0, o.oy || 0); over(g, horse(o)); over(g, cs); harness(g, o); return g;
}
// 4-beat walk (near hind, near fore, far hind, far fore a quarter apart): each hoof sweeps back on the ground, then lifts forward
function legPose(p) { p = ((p % 1) + 1) % 1; if (p < 0.72) return [Math.round(1.5 - p / 0.72 * 3), 0]; const s = (p - 0.72) / 0.28; return [Math.round(-1.5 + s * 3), s > 0.15 && s < 0.85 ? 2 : 1]; }
const PH = [0, 0.25, 0.5, 0.75];
const walkO = k => ({ legs: PH.map(ph => legPose(k / 8 + ph)), ang: k * 22.5, bob: [0, 0, -0.5, -0.5, 0, 0, -0.5, -0.5][k], hd: [0, 1, 1, 0, 0, 1, 1, 0][k] * 0.8, tail: [0, 1, 1, 0, 0, -1, -1, 0][k], flap: k % 2, glint: k % 3 });
const idle = [
  whole({ tail: 0 }), whole({ tail: 1, head: 'low' }), whole({ tail: 1, head: 'graze', legs: [[0, 0], [1, 0], [0, 0], [0, 0]] }), whole({ tail: 0, head: 'low', legs: [[0, 1], [0, 0], [0, 0], [0, 0]] }),
];
const walk = Array.from({ length: 8 }, (_, k) => whole(walkO(k)));
const gold = Array.from({ length: 8 }, (_, k) => whole({ ...walkO(k), loaded: true }));
// death: the cart rolls over toward the viewer (vertical squash → flip) and ends upside down, wheel in the air; the horse goes down
function vscale(src, sy, top = 3, gy = 23) {
  const o = grid(W(src), H(src));
  for (let y = 0; y < H(src); y++) {
    let sr;
    if (sy > 0) sr = gy - (gy - y) / sy; else sr = top + (gy - y) / -sy;
    sr = Math.round(sr); if (sr < top || sr > gy) continue;
    for (let x = 0; x < W(src); x++) o[y][x] = src[sr][x];
  }
  return o;
}
function deathFrame(sy, ho, lift = 0, extra) {
  const c = grid(GW, GH); cart(c, { ang: 30, broken: sy < 0 });
  const sh = grid(GW, GH); if (!ho.lying) shafts(sh, 0, ho.oy || 0);   // the shafts snap free once the horse is down
  let cr = vscale(shift(c, -1, 0), sy), sr = vscale(sh, sy); if (lift) { cr = shift(cr, 0, -lift); sr = shift(sr, 0, -lift); }
  const g = grid(GW, GH); over(g, sr); over(g, horse(ho)); over(g, outline(despeckle(cr)));
  if (extra) extra(g);
  return g;
}
// the horse goes down: knees buckle, then it lies on its side with the legs out in front of it
const lieLegs = [[17, 18.6, 19.5, 21, 22.5, 23.2], [22.5, 18.6, 25, 21, 28, 23.2]];
const down = { oy: 3, head: 'down', lying: lieLegs, T: { sy: 0.72, px: 20, py: 23 } };
const death = [
  deathFrame(0.85, { head: 'up', hd: -1.5, legs: [[-1, 0], [1, 2], [-1, 0], [2, 3]], tail: 1 }),
  deathFrame(0.4, { oy: 1.5, head: 'low', legs: [[0, 0], [-2, 3], [0, 0], [-2, 3]], tail: 1 }),
  deathFrame(-0.35, { oy: 2.4, head: 'down', lying: lieLegs.map(r => r.map((v, i) => i % 2 ? v - 0.8 : v)), T: { sy: 0.82, px: 20, py: 23 } }),
  deathFrame(-0.75, down),
  deathFrame(-0.7, { ...down, oy: 2.4 }, 1),
  deathFrame(-0.72, down, 0, g => { stamp(g, 2, 21, `
.y.
ygG
`); }),
];
emit(OUT, [
  '@pixel tradecart',
  'Trade cart: a bay draught horse (feedback round 1 repaint: arched neck and dark mane, long head carried nose-in, quarters,',
  'barrel and deep shoulder, legs with hocks and knees, dark lower legs, 2-px hooves; collar, back pad, near shaft across the flank,',
  'far shaft behind) pulling a two-wheel cart with an arched team-colour cloth tilt. 30×24, anchor [15,24] (bottom centre), faces right;',
  'light upper-left. idle 4 (tail swish, head lowers, grazes, rests a hind hoof), walk 8 (4-beat walk, head nods with the stride,',
  'spokes advance 22.5°/frame, cloth flutter), gold 8 (as walk, tilt rolled back over a heap of gold and a coin sack, glint travels),',
  'death 6 (the cart rolls over and lands upside down, wheel in the air with a snapped spoke, coins spilled; the horse buckles and lies',
  'down). Generated by tools/sprite-lab/gen/painter-skirm/cart.mjs (horse via painter-nature/quad.mjs), kept as literal grids.',
], {
  id: 'tradecart', anchor: [15, 24],
  palette: { o: '#24180f', O: '#4a3020', T: 'team', D: 'teamdark', L: 'teamlight', u: '#a07a4a', w: '#8a6a3a', W: '#5a3a18', X: '#3b2614', h: '#b27c4a', b: '#8e5a32', B: '#68401f', k: '#42260f', K: '#1e120a', c: '#efe6d2', C: '#d9c7a0', q: '#a8946e', y: '#ffe28a', g: '#e1b12c', G: '#a87a12' },
  frames: { idle, walk, gold, death },
});
