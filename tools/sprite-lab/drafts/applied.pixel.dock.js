// @pixel dock
// Dock (2×2): a plank deck on three-tone piles with X-bracing over the water; a boarded boathouse with an open boat bay (prow
// inside), a lamp-lit window and a tiled roof; a team-colour awning over barrels and a crate, a fish basket, a drying net on a
// rack, a coil of rope, and a braced crane with its jib over the water. The flag stays code-drawn (see building.dock.js).
// idle: 4 frames — water laps around every pile (rings swell and shrink), the crane's crate swings on its rope.
// ---- local texture kit (deterministic) ----
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const copy = g => g.map(r => r.slice());
/** Replace every cell holding one of `chs` by fn(x,y,ch) (null keeps it). */
const paint = (g, chs, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (chs.includes(g[y][x])) { const c = fn(x, y, g[y][x]); if (c) g[y][x] = c; } };
/** Courses on a face whose rows run with slope s (+0.5 down-right, -0.5 up-right, 0 flat): rows of height h, blocks of width w
 *  staggered by half a block, 1-px joint under each row, optional lit lip on top of each row, block tones picked per block.
 *  o.flip: the face slopes away from the viewer (a back roof slope), so downhill is up the screen and the joint/lip swap ends. */
const course = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  if (v >= o.h - 1) return o.joint;
  const xs = x + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
  if (o.seam && ((xs % o.w) + o.w) % o.w === 0) return o.seam;
  if (o.lip && v < 1) return o.lip;
  return o.tones[Math.floor(hash(col + 17, row + 91) * o.tones.length)];
};
/** Thatch: layered bands (slope s, height h) of short vertical strands; the bottom of every band is the shaded underside.
 *  o.flip: a back slope (downhill is up the screen), so the shaded underside is at the top of every band. */
const thatch = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  const hx = hash(x + 5, row + 3);
  if (v >= o.h - 1 - (hx < 0.3 ? 1 : 0)) return o.under;
  return o.tones[Math.floor(hash(x >> 1, row * 7 + 1) * o.tones.length)];
};
/** Selective ink outline: every solid cell touching transparency becomes ink, except on upper-left edges where `sel` maps the
 *  material to its shade tone (so the lit side is not stickered). */
const outline = (g, ink, sel = {}) => {
  const H = g.length, W = g[0].length, o = copy(g); const sol = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!sol(x, y)) continue; const l = !sol(x - 1, y), r = !sol(x + 1, y), u = !sol(x, y - 1), d = !sol(x, y + 1);
    if (!(l || r || u || d)) continue;
    o[y][x] = (!r && !d && sel[g[y][x]]) ? sel[g[y][x]] : ink;
  }
  return o;
};
const line = (g, a, b, ch, dy = 0) => pixLine(g, a[0], a[1] + dy, b[0], b[1] + dy, ch);
/** height above the base line of an iso wall from a to b (a.x < b.x) at (x,y) */
const wallH = (a, b, x, y) => (a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])) - y;

const W = 2, H = 2, Z = 6, HOUSE = 14, ROOF = 9;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + 12 + 7 + 26;
const bx = W * 32 + 2, by = GH - 4;
const Tt = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const up = (p, z) => [p[0], p[1] - z];
const g = pixGrid(GW, GH);

// ---- piles: three-tone posts with a wet, weedy foot; X-bracing between the front piles under the deck
const PILES = [L, lerp(L, Bm, 0.25), lerp(L, Bm, 0.5), lerp(L, Bm, 0.75), Bm, lerp(Bm, Rr, 0.25), lerp(Bm, Rr, 0.5), lerp(Bm, Rr, 0.75), Rr].map(p => [Math.round(p[0]), Math.round(p[1])]);
PILES.forEach(([x, y], k) => { const xx = k === 0 ? x + 1 : k === PILES.length - 1 ? x - 2 : x;
  for (let yy = y - Z; yy <= y; yy++) { pixSet(g, xx - 1, yy, 'k'); pixSet(g, xx, yy, yy > y - 2 ? 'K' : 'u'); pixSet(g, xx + 1, yy, yy > y - 2 ? 'K' : 'v'); pixSet(g, xx + 2, yy, 'k'); } });
for (let k = 0; k + 1 < PILES.length; k++) { if (k === 3) continue; const [x0, y0] = PILES[k], [x1, y1] = PILES[k + 1]; pixLine(g, x0 + 1, y0 - Z + 2, x1, y1 - 1, 'V'); pixLine(g, x0 + 1, y0 - 1, x1, y1 - Z + 2, 'V'); }
// ---- deck: planks running front-left to back-right, staggered butt joints, nail dots; a thick lit edge with plank ends
const pT = up(Tt, Z), pL = up(L, Z), pR = up(Rr, Z), pB = up(Bm, Z);
pixPoly(g, [pT, pR, pB, pL], '1');
paint(g, '1', (x, y) => { const c = course(x, y, -0.5, { h: 3, w: 22, joint: 'q', seam: 'v', tones: ['p', 'P', 'p', 'o'] }); return c; });
for (const [a, b, top, mid, low] of [[pL, pB, 'w', 'u', 'v'], [pB, pR, 'u', 'v', 'V']]) { line(g, a, b, top, 0); for (let k = 1; k < 4; k++) line(g, a, b, k === 3 ? 'k' : (k === 1 ? mid : low), k); }
for (let k = 1; k < 16; k++) { const p = lerp(pL, pB, k / 16); pixSet(g, p[0], p[1] + 1, 'V'); pixSet(g, p[0], p[1] + 2, 'V'); const q = lerp(pB, pR, k / 16); pixSet(g, q[0], q[1] + 1, 'k'); }
// ---- boathouse on the back tile: vertical boards, open boat bay with a prow, tile roof in courses, team awning
const hb = [bx + 2, by - 32 - Z - 2];
const top = pixIsoBox(g, hb[0], hb[1], 0.9, 0.9, HOUSE, 1, { left: '2', right: '3' });
const HB = top.base;
paint(g, '2', (x, y) => { const h = wallH(HB.L, HB.Bm, x, y); return h > HOUSE - 2 ? 'v' : (x % 3 === 0 ? 'u' : (hash(x, 3) < 0.5 ? 'w' : 'W')); });
paint(g, '3', (x, y) => { const h = wallH(HB.Bm, HB.Rr, x, y); return h > HOUSE - 2 ? 'V' : (x % 3 === 0 ? 'v' : 'u'); });
{ const p = lerp(HB.Bm, HB.Rr, 0.5); pixStamp(g, Math.round(p[0]) - 6, Math.round(p[1]) - 13, `
kkkkkkkkkkkk
kvvvvvvvvvVk
kViiiiiiiiVk
kVii.iiiiiVk
kViiiiiiiiVk
kViiiiwwiiVk
kViiiwWWwiVk
kViiwWuuWwVk
kViwWuuuuWVk
kVwWuuuvvuVk
kVkkkkkkkkVk
`.replace(/\./g, 'i')); }
{ const p = lerp(HB.L, HB.Bm, 0.45); pixStamp(g, Math.round(p[0]) - 3, Math.round(p[1]) - 11, `
.kkkkk.
kiiOiik
kiOyOik
kiiOiik
kwwwwwk
`); }
const R = { L: [top.L[0] - 2, top.L[1] + 2], Bm: [top.Bm[0], top.Bm[1] + 3], Rr: [top.Rr[0] + 2, top.Rr[1] + 2], T: [top.T[0], top.T[1] - 1] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '5', left: '6', front: '7', right: '8' });
paint(g, '6', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'c', lip: 'g', tones: ['b'], flip: true }));   // back slopes: flip
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'd', seam: 'd', lip: 'b', tones: ['c'] }));
paint(g, '5', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'd', tones: ['a'], flip: true }));
paint(g, '8', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'e', seam: 'e', lip: 'a', tones: ['d'] }));
line(g, R.L, R.Bm, 'e'); line(g, R.Bm, R.Rr, 'e'); line(g, R.Bm, ap, 'k'); line(g, [R.Bm[0] - 1, R.Bm[1]], [ap[0] - 1, ap[1]], 'h');
// back posts of the awning, drawn before the goods so the barrels and crate stand in front of them: the cloth's high back
// edge rests on these instead of hanging in the air
const AW = { A0: lerp(pL, pB, 0.22), A1: lerp(pL, pB, 0.58), D: [9, -4.5], HF: 13, HB: 16 };
for (const P of [AW.A0, AW.A1]) { const x = Math.round(P[0] + AW.D[0]), y = Math.round(P[1] + AW.D[1]); for (let yy = y - AW.HB; yy < y; yy++) { pixSet(g, x, yy, 'u'); pixSet(g, x + 1, yy, 'v'); pixSet(g, x - 1, yy, 'k'); pixSet(g, x + 2, yy, 'k'); } }
// goods under the awning: barrels, a crate, a fish basket
const BARRELS = `
.kkkk..kkkk.
kwuuwkkwuuwk
kVVVVkkVVVVk
kwuuwkkwuuwk
kuvvukkuvvuk
kVVVVkkVVVVk
.kkkk..kkkk.
`;
{ const a = lerp(pL, pB, 0.42); pixStamp(g, Math.round(a[0]) - 4, Math.round(a[1]) - 10, BARRELS); }
{ const a = lerp(pL, pB, 0.2); pixStamp(g, Math.round(a[0]) - 1, Math.round(a[1]) - 9, `
kkkkkkkk
kwwwwwuk
kwvwwvuk
kwwvvwuk
kwvwwvuk
kuuuuuvk
kkkkkkkk
`); }
{ const a = lerp(pL, pT, 0.42); pixStamp(g, Math.round(a[0]) + 2, Math.round(a[1]) - 2, `
.kkkkk.
kxsxsxk
ksfsfsk
kxsxsxk
.kkkkk.
`); }
// team awning over the goods: striped cloth on two front posts, scalloped hem
{ const { A0, A1, D, HF, HB } = AW;
  for (const P of [A0, A1]) { const x = Math.round(P[0]), y = Math.round(P[1]); for (let yy = y - HF; yy < y; yy++) { pixSet(g, x, yy, 'u'); pixSet(g, x + 1, yy, 'v'); pixSet(g, x - 1, yy, 'k'); pixSet(g, x + 2, yy, 'k'); } }
  const f0 = up(A0, HF), f1 = up(A1, HF), b0 = [A0[0] + D[0], A0[1] + D[1] - HB], b1 = [A1[0] + D[0], A1[1] + D[1] - HB];
  pixPoly(g, [f0, f1, b1, b0], '9');
  paint(g, '9', (x, y) => (Math.floor((x - y * 2) / 4) % 2 === 0 ? 'T' : 'L'));
  line(g, b0, b1, 'k'); line(g, f0, b0, 'k'); line(g, f1, b1, 'D');
  for (let k = 0; k <= 12; k++) { const p = lerp(f0, f1, k / 12); pixSet(g, p[0], p[1], 'D'); pixSet(g, p[0], p[1] + 1, k % 2 ? 'D' : 'k'); if (k % 2 === 0) pixSet(g, p[0], p[1] + 2, 'k'); } }
// drying net on a rack along the front-right rail
{ const a = lerp(pB, pR, 0.12), b = lerp(pB, pR, 0.45);
  for (const P of [a, b]) { pixLine(g, P[0], P[1] - 12, P[0], P[1] - 1, 'v'); pixLine(g, P[0] + 1, P[1] - 12, P[0] + 1, P[1] - 1, 'k'); }
  line(g, [a[0], a[1] - 12], [b[0], b[1] - 12], 'u');
  for (let k = 0; k <= 20; k++) { const p = lerp(a, b, k / 20); const sag = Math.round(Math.sin(k / 20 * Math.PI) * 2); for (let yy = Math.round(p[1]) - 11; yy <= Math.round(p[1]) - 3 + sag; yy++) { const x = Math.round(p[0]); if (((x + yy) % 3 + 3) % 3 === 0 || ((x - yy) % 3 + 3) % 3 === 0) pixSet(g, x, yy, (yy - p[1] > -6) ? 'N' : 'n'); } } }
// coil of rope
{ const a = lerp(pB, pR, 0.6); pixStamp(g, Math.round(a[0]) - 3, Math.round(a[1]) - 5, `
.kkkkk.
kRrrrRk
krRkRrk
kRrrrRk
.kkkkk.
`); }
// crane: a braced timber post with a jib over the water at the right corner, rope down to a crate (sways per frame)
const CR = (() => { const b = lerp(pB, pR, 0.82); return [Math.round(b[0]), Math.round(b[1]) - 2]; })();
{ const [x, y] = CR;
  for (let yy = y - 30; yy <= y; yy++) { pixSet(g, x - 1, yy, 'k'); pixSet(g, x, yy, 'w'); pixSet(g, x + 1, yy, 'v'); pixSet(g, x + 2, yy, 'k'); }
  pixLine(g, x - 2, y - 30, x - 20, y - 36, 'k'); pixLine(g, x - 2, y - 29, x - 20, y - 35, 'w'); pixLine(g, x - 2, y - 28, x - 20, y - 34, 'v'); pixLine(g, x - 1, y - 27, x - 20, y - 33, 'k');
  pixLine(g, x - 1, y - 18, x - 12, y - 31, 'v'); pixLine(g, x - 2, y - 18, x - 13, y - 31, 'k');
  pixLine(g, x - 2, y, x - 6, y - 8, 'v'); pixLine(g, x - 3, y, x - 7, y - 8, 'k');
  pixRect(g, x - 1, y - 32, 4, 2, 'k'); }

const base = outline(g, 'k', { w: 'u', p: 'P', g: 'b', L: 'T' });

// ---- idle: 4 frames — water laps around every pile (rings swell and shrink), the crane's crate swings on its rope
const CRATE = `
kkkkkkk
kwwwwuk
kwvwvuk
kwwvwuk
kuuuuvk
kkkkkkk
`;
const frames = [];
for (let i = 0; i < 4; i++) {
  const f = copy(base);
  PILES.forEach(([x, y], k) => { const ph = (i + k) % 4, r = [3, 4, 5, 4][ph];
    for (let dx = -r; dx <= r + 1; dx++) { const yy = y - (Math.abs(dx - 0.5) > r - 1 ? 1 : 0); if (pixGet(f, x + dx, yy) !== '.') continue; pixSet(f, x + dx, yy, Math.abs(dx - 0.5) > r - 1.5 ? 'F' : 'S'); }
    if (ph === 1 || ph === 2) for (const dx of [-r - 2, r + 3]) if (pixGet(f, x + dx, y - 1) === '.') pixSet(f, x + dx, y - 1, 'S'); });
  const sw = [0, 1, 0, -1][i], [cx, cy] = CR, rx = cx - 20 + sw;
  pixLine(f, cx - 20, cy - 33, rx, cy - 20, 'R');
  pixStamp(f, rx - 3, cy - 20, CRATE);
  frames.push(pixText(f));
}

export default {
  id: 'dock', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f',                                                          // ink
    p: '#a8864f', P: '#937344', o: '#7d5f36', q: '#5a3f22',                 // deck planks / joints
    w: '#a07a4a', W: '#93703f', u: '#8a6a3a', v: '#5a3a18', V: '#3b2614', K: '#2c3a40', // timber, wet pile foot
    i: '#1f1610', O: '#d8813a', y: '#ffc95a',                               // openings, lamp
    g: '#d8805c', h: '#eea582', b: '#b85a3e', c: '#a0482e', a: '#8a3a2a', d: '#73301f', e: '#4e2016', // roof tiles
    x: '#b8c4cc', s: '#8a98a4', f: '#dfe8ee',                               // fish in the basket
    n: '#cfc3a2', N: '#a39579', R: '#c9b58e', r: '#9e8a64',                 // net, rope
    F: '#d8ecf4', S: '#8ec0dc',                                             // water foam / ripple
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
