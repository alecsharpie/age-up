import { grid, put, get, line, rect, stamp, outline, over, clone, replace, emit, rotate, shift, W, H } from './lib.mjs';
import { despeckle, bbox, fallen } from './rig.mjs';
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
function shafts(g, dy, odY = 0) { line(g, 17, 13 + dy, 22, 13 + odY, 'w'); line(g, 17, 14 + dy, 22, 14 + odY, 'W'); }
// ox: reddish-brown, horns forward, head low. legs: [[x offset, lift] ×4] for rear-far, front-far, rear-near, front-near
const OXB = `
...bb...
.bbbbbbb
bbbbbbbB
bBBBBBBB
BBBBBBBk
kBBBBBkk
.kkkkkk.
`;
const HEAD = `
..c..
.cC..
bbbB.
bobbb
Bbbbb
.Bbcc
..BCC
`;
function ox(g, o) {
  const dy = o.oy || 0, hd = o.hd || 0, X0 = 18, Y0 = 11 + dy;
  const L = o.legs || [[0, 0], [0, 0], [0, 0], [0, 0]];
  const legAt = (hx, [off, lift], cols) => { const fx = hx + off, top = Y0 + 6, by = 22 - lift;
    if (by < top) return;
    line(g, hx, top, fx, by, cols[0]); line(g, hx + 1, top, fx + 1, by, cols[1]); put(g, fx, by + 1, 'K'); put(g, fx + 1, by + 1, 'K'); };
  legAt(X0 + 0, L[0], ['k', 'K']); legAt(X0 + 4, L[1], ['k', 'K']);
  stamp(g, X0, Y0, OXB);
  legAt(X0 + 1, L[2], ['B', 'k']); legAt(X0 + 5, L[3], ['B', 'k']);
  stamp(g, X0 + 6, Y0 - 1 + hd, HEAD);
  // yoke over the neck
  put(g, X0 + 5, Y0, 'W'); put(g, X0 + 5, Y0 + 1, 'w'); put(g, X0 + 5, Y0 - 1, 'W');
  // tail
  const t = o.tail || 0; line(g, X0 - 1, Y0 + 1, X0 - 1, Y0 + 4, 'k'); put(g, X0 - 1 + t, Y0 + 5, 'K'); put(g, X0 - 1 + t, Y0 + 6, 'K');
}
function whole(o) { const g = grid(GW, GH); shafts(g, o.dy || 0, o.oy || 0); ox(g, o); cart(g, o); return outline(g); }
// 4-beat walk: rear-far, front-far, rear-near, front-near phases
function legPose(p) { p = ((p % 1) + 1) % 1; if (p < 0.75) return [Math.round(2 - p / 0.75 * 4), 0]; const s = (p - 0.75) / 0.25; return [Math.round(-2 + s * 4), s > 0.2 && s < 0.9 ? 2 : 1]; }
const PH = [0.5, 0.75, 0, 0.25];
const walkO = k => ({ legs: PH.map(ph => legPose(k / 8 + ph)), ang: k * 22.5, oy: (k % 4 === 1 || k % 4 === 2) ? 0 : 0, dy: k % 2 ? 0 : 0, hd: (k % 4 < 2) ? 0 : 1, tail: [0, 1, 1, 0, 0, -1, -1, 0][k], flap: k % 2, glint: k % 3 });
const idle = [
  whole({ tail: 0 }), whole({ tail: 1, hd: 1 }), whole({ tail: 1, hd: 1, legs: [[0, 0], [0, 0], [0, 0], [1, 1]] }), whole({ tail: 0, legs: [[0, 0], [0, 0], [0, 0], [1, 0]] }),
];
const walk = Array.from({ length: 8 }, (_, k) => whole(walkO(k)));
const gold = Array.from({ length: 8 }, (_, k) => whole({ ...walkO(k), loaded: true }));
// death: the cart rolls over toward the viewer (vertical squash → flip) and ends upside down, wheel in the air; the ox goes down
function vscale(src, sy, top = 3, gy = 23) {
  const o = grid(W(src), H(src)), hgt = gy - top;
  for (let y = 0; y < H(src); y++) {
    let sr;
    if (sy > 0) sr = gy - (gy - y) / sy; else sr = top + (gy - y) / -sy;
    sr = Math.round(sr); if (sr < top || sr > gy) continue;
    for (let x = 0; x < W(src); x++) o[y][x] = src[sr][x];
  }
  return o;
}
function deathFrame(sy, oxo, lift = 0, extra) {
  const c = grid(GW, GH); shafts(c, 0, 0); cart(c, { ang: 30, broken: sy < 0 });
  let cr = vscale(c, sy); if (lift) cr = shift(cr, 0, -lift);
  const g = grid(GW, GH); if (oxo) ox(g, oxo); over(g, cr);
  if (extra) extra(g);
  return outline(despeckle(g));
}
const down = { oy: 5, legs: [[-1, -9], [1, -9], [-2, -9], [2, -9]], hd: 2, tail: -1 };
const death = [
  deathFrame(0.85, { legs: [[0, 0], [0, 0], [1, 2], [2, 3]], hd: -1, tail: 1 }),
  deathFrame(0.4, { oy: 1, legs: [[-1, -1], [0, -1], [0, 0], [1, -1]], hd: 1, tail: 1 }),
  deathFrame(-0.35, { oy: 3, legs: [[-1, -3], [1, -3], [-1, -3], [2, -3]], hd: 2, tail: 0 }),
  deathFrame(-0.75, down),
  deathFrame(-0.7, down, 1),
  deathFrame(-0.72, down, 0, g => { stamp(g, 2, 21, `
.y.
ygG
`); }),
];
emit(OUT, [
  '@pixel tradecart',
  'Trade cart (AAA repaint): a red-brown ox under a yoke pulling a two-wheel cart with an arched team-colour cloth tilt.',
  '30×24, anchor [15,24] (bottom centre), faces right; light upper-left; ink outline (#24180f, selective #4a3020).',
  'idle 4 (tail swish, head dips to graze, a hoof shifts), walk 8 (4-beat ox walk, 4 spokes advancing 22.5°/frame, cloth flutter),',
  'gold 8 (as walk, tilt rolled back over a heap of gold and a coin sack, glint travels), death 6 (the cart rolls over toward',
  'the viewer and lands upside down, wheel in the air with a snapped spoke, a few coins spilled; the ox goes down). Generated with scratchpad/painter-skirm/cart.mjs, kept as literal grids.',
], {
  id: 'tradecart', anchor: [15, 24], 
  palette: { o: '#24180f', O: '#4a3020', T: 'team', D: 'teamdark', L: 'teamlight', u: '#a07a4a', w: '#8a6a3a', W: '#5a3a18', X: '#3b2614', b: '#b5764a', B: '#8f5530', k: '#64361c', K: '#2e1a0e', c: '#efe6d2', C: '#d9c7a0', q: '#a8946e', y: '#ffe28a', g: '#e1b12c', G: '#a87a12' },
  frames: { idle, walk, gold, death },
});
