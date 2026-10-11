// @pixel dock
// Dock (2×2): a plank deck on three-tone piles with X-bracing over the water (planks on the ground plane: butt joints slant 2:1
// with the deck edge); a weatherboarded boathouse with an open boat bay (prow inside) and a lamp-lit window laid out in wall
// space, under a tiled roof with even courses on every face; a team-colour awning over barrels and a crate, a fish basket, a
// drying net on a rack, a coil of rope, and a braced crane with its jib over the water. The flag stays code-drawn.
// idle: 4 frames — water laps around every pile (rings swell and shrink), the crane's crate swings on its rope.
// ---- local texture kit (deterministic) ----
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
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
  // o.fall: seams follow a roof's fall line (screen dx per dy, from the ridge down to the eave) instead of the vertical
  const xt = o.fall ? Math.round((x - o.fall * y) / (1 - o.fall * s)) : x;
  const xs = xt + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
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
/** Ground-plane paving (floors, yards, plinth tops): flagstones on the 2:1 iso grid, so every joint runs along one of the two
 *  ground axes and the floor reads as lying flat. o.a: stone size across the down-right rows, o.b: along them (both in px of
 *  screen height), rows staggered by half a stone; o.joint: joint colour; o.lip: optional lit edge just past each joint;
 *  o.tones: per-stone tones; o.ox/o.oy: grid origin. */
const pave = (x, y, o) => {
  const X = x - (o.ox || 0), Y = y - (o.oy || 0), a = Y - X / 2, b = Y + X / 2;
  const ra = Math.floor(a / o.a), bb = b + (((ra % 2) + 2) % 2) * Math.floor(o.b / 2), rb = Math.floor(bb / o.b);
  const va = a - ra * o.a, vb = bb - rb * o.b;
  if (va < 1 || vb < 1) return o.joint;
  if (o.lip && (va < 2 || vb < 2)) return o.lip;
  return o.tones[Math.floor(hash(ra + 31, rb + 7) * o.tones.length)];
};
/** pixStamp on an iso wall: each column of the template drops by slope × its distance from the centre column, so a door,
 *  window, banner or emblem lies flat on a wall whose eave runs with that slope (+0.5 lit left face, -0.5 shaded right face). */
const stampOn = (g, x, y, tpl, slope) => {
  const rows = tpl.replace(/^\n+|\n+$/g, '').split('\n'), w = Math.max(...rows.map(r => r.length)), c = (w - 1) / 2;
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') pixSet(g, x + xx, y + yy + Math.round(slope * (xx - c) + 1e-9), r[xx]); });
};
/** A round window on an iso wall: fn(dx, dy) in wall units (dx along the wall, dy up it) for each cell of an R-radius disc
 *  that the wall's slope shears and the iso view narrows (0.9). */
const discOn = (g, cx, cy, R, slope, fn) => {
  for (let y = -R - 3; y <= R + 3; y++) for (let x = -R - 1; x <= R + 1; x++) { const u = x / 0.9, v = y - slope * x; if (Math.hypot(u, v) > R + 0.4) continue;
    const c = fn(u, v); if (c) pixSet(g, cx + x, cy + y, c); }
};


// Age variants (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs). The Castle variant (AGE 2) is the tuned art, kept as it was.
//   Dark     a rough log jetty on unbarked piles; a wattle-and-daub fish hut under a steep golden thatch with a smoke hole and
//            crossed gable poles, a dark hole for a window; no crane: a fish-drying frame with the catch hung on it.
//   Feudal   the weatherboarded boathouse under brown oak shingles with a knob finial and a stone chimney (smoke), the crane.
//   Castle   the boathouse under red clay tiles, the braced crane (the original art).
//   Imperial a stone quay: limestone piers instead of piles, a flagged deck with an ashlar kerb; an ashlar boathouse with a
//            gilt string course, a slate roof with gilt cresting, trim and an orb finial, a gilt-fringed banner; the crane
//            raised on a stone footing with a gilt-capped post.
const C = AGE === 2;
const { R: RK, S: SK, W: TW, Au, DEEP } = AK;
const W = 2, H = 2, Z = 6, HOUSE = [14, 17, 17, 19][AGE], ROOF = [16, 10, 9, 12][AGE];
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + 12 + 7 + 26 + [6, 6, 0, 10][AGE];
const bx = W * 32 + 2, by = GH - 4;
const Tt = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const up = (p, z) => [p[0], p[1] - z];
const g = pixGrid(GW, GH);

// ---- piles: three-tone posts with a wet, weedy foot; X-bracing between the front piles under the deck
const PILES = [L, lerp(L, Bm, 0.25), lerp(L, Bm, 0.5), lerp(L, Bm, 0.75), Bm, lerp(Bm, Rr, 0.25), lerp(Bm, Rr, 0.5), lerp(Bm, Rr, 0.75), Rr].map(p => [Math.round(p[0]), Math.round(p[1])]);
// (Imperial: square limestone piers, every other pile, no bracing)
PILES.forEach(([x, y], k) => { const xx = k === 0 ? x + 1 : k === PILES.length - 1 ? x - 2 : x;
  if (AGE === 3) { if (k % 2) return; const x0 = k === 0 ? x : k === PILES.length - 1 ? x - 3 : x - 1;
    for (let yy = y - Z; yy <= y; yy++) { pixSet(g, x0 - 1, yy, 'k'); pixSet(g, x0, yy, yy > y - 2 ? 'K' : 'ς'); pixSet(g, x0 + 1, yy, yy > y - 2 ? 'K' : 'τ'); pixSet(g, x0 + 2, yy, yy > y - 2 ? 'K' : 'υ'); pixSet(g, x0 + 3, yy, 'k'); } return; }
  for (let yy = y - Z; yy <= y; yy++) { pixSet(g, xx - 1, yy, 'k'); pixSet(g, xx, yy, yy > y - 2 ? 'K' : 'u'); pixSet(g, xx + 1, yy, yy > y - 2 ? 'K' : 'v'); pixSet(g, xx + 2, yy, 'k'); } });
if (AGE !== 3) for (let k = 0; k + 1 < PILES.length; k++) { if (k === 3 || (AGE === 0 && k % 2)) continue; const [x0, y0] = PILES[k], [x1, y1] = PILES[k + 1]; pixLine(g, x0 + 1, y0 - Z + 2, x1, y1 - 1, 'V'); pixLine(g, x0 + 1, y0 - 1, x1, y1 - Z + 2, 'V'); }
// ---- deck: planks running front-left to back-right, staggered butt joints, nail dots; a thick lit edge with plank ends
const pT = up(Tt, Z), pL = up(L, Z), pR = up(Rr, Z), pB = up(Bm, Z);
pixPoly(g, [pT, pR, pB, pL], '1');
// Planks lie on the ground plane: in iso ground coordinates from pL (a along L->T / Bm->Rr, b along L->Bm; 1 unit = 2 px across)
// they run along a, 2 b wide (4 px), with staggered butt joints that are lines of constant a, i.e. they slant 2:1 down-right
// like the L->Bm edge instead of standing vertical.
const PLK = 20;
const isoAB = (x, y) => { const dx = x + 0.5 - pL[0], dy = y + 0.5 - pL[1]; return [(dx / 2 - dy) / 2, (dx / 2 + dy) / 2]; };
if (AGE === 3) paint(g, '1', (x, y) => pave(x, y, { a: 5, b: 7, ox: pL[0], oy: pL[1], joint: 'υ', lip: 'σ', tones: ['ς', 'ς', 'τ', 'σ'] }));   // limestone flags
paint(g, '1', (x, y) => {
  const [a, b] = isoAB(x, y), row = Math.floor(b / 2), v = b - row * 2;
  if (AGE === 0) { const lg = Math.floor(b / 3), w = b - lg * 3; return w >= 2.4 ? 'q' : w < 0.8 ? 'Y' : hash(Math.floor(a / 9) + lg * 5, lg) < 0.3 ? 'P' : 'p'; }   // split logs
  if (v >= 1.5) return 'q';                                                     // gap between planks
  const aa = a + ((row * 7) % PLK), seg = Math.floor(aa / PLK), fa = aa - seg * PLK;
  if (fa < 0.5) return 'q';                                                   // butt joint
  if (fa < 1 && v >= 0.5 && v < 1) return 'o';                            // nail at the plank end
  return ['p', 'P', 'p', 'Y', 'P'][Math.floor(hash(seg + 3, row + 11) * 5)];
});
for (const [a, b, top, mid, low] of AGE === 3 ? [[pL, pB, 'σ', 'ς', 'τ'], [pB, pR, 'ς', 'τ', 'υ']] : [[pL, pB, 'w', 'u', 'v'], [pB, pR, 'u', 'v', 'V']]) { line(g, a, b, top, 0); for (let k = 1; k < 4; k++) line(g, a, b, k === 3 ? 'k' : (k === 1 ? mid : low), k); }
// plank end grain on the L->Bm fascia, one split per plank; nail heads along the long Bm->Rr side board
if (AGE === 3) { // ashlar kerb: block joints along both faces of the quay edge
  for (let n = 1; n * 3 < 32; n++) { const p = [pL[0] + 6 * n, pL[1] + 3 * n]; pixSet(g, p[0], p[1] + 1, 'υ'); pixSet(g, p[0], p[1] + 2, 'υ'); }
  for (let n = 1; n * 3 < 32; n++) { const q = [pB[0] + 6 * n, pB[1] - 3 * n]; pixSet(g, q[0], q[1] + 1, 'φ'); pixSet(g, q[0], q[1] + 2, 'φ'); }
} else {
for (let n = 1; n * 2 < 32; n++) { const p = [pL[0] + 4 * n, pL[1] + 2 * n]; pixSet(g, p[0], p[1] + 1, 'V'); pixSet(g, p[0], p[1] + 2, 'V'); }
for (let k = 1; k < 16; k++) { const q = lerp(pB, pR, k / 16); pixSet(g, q[0], q[1] + 1, AGE === 0 ? 'V' : 'k'); }
}
// ---- boathouse on the back tile: vertical boards, open boat bay with a prow, tile roof in courses, team awning
const hb = [bx + 2, by - 32 - Z - 2];
const top = pixIsoBox(g, hb[0], hb[1], 0.9, 0.9, HOUSE, 1, { left: '2', right: '3' });
const HB = top.base;
// weatherboarded walls: horizontal boards running with each wall (overlap shadow under every board, a lit lower lip, staggered
// butt joints), corner posts, eave shadow. Openings are laid out in wall space (u along the wall, h up) so they slant with it.
const LEN = 0.9 * 32;
const board = (h, u, lit) => {
  const bd = Math.floor(h / 3), vb = h - bd * 3;
  if (((u + bd * 7) % 19 + 19) % 19 === 0) return lit ? 'u' : 'v';
  return vb === 2 ? (lit ? 'u' : 'V') : vb === 1 ? (lit ? 'W' : 'u') : (lit ? 'w' : 'u');
};
const wallPaint = (A, Bp, lit, open) => (x, y) => {
  const u = Math.floor(x + 0.5 - A[0]), h = Math.floor(wallH(A, Bp, x + 0.5, y + 0.5));
  const o = open && open(u, h); if (o) return o;
  if (AGE === 0 || AGE === 3) return AK.wallTex(u, h, lit ? 0 : 1, { len: Math.round(LEN), H: HOUSE, pl: AGE === 3 ? 2 : 1, step: 15 });
  if (h >= HOUSE - 2) return lit ? 'v' : 'V';
  if (u < 2 || u >= LEN - 2) return (u < 1 || u >= LEN - 1) === lit ? 'u' : (lit ? 'w' : 'v');   // corner posts
  if (h < 1) return lit ? 'v' : 'V';                                                         // sole plate on the deck
  return board(h - 1, u, lit);
};
// lit wall: a small lamp-lit window
const winAt = (u, h) => { const u0 = 9, u1 = 17, h0 = 4, h1 = 9; if (u < u0 || u > u1 || h < h0 || h > h1) return null;
  if (AGE === 0) { if (u < 11 || u > 15 || h < 5 || h > 8) return null; return h === 8 ? TW[2] : u === 11 ? TW[1] : DEEP; }   // a dark smoke-hole window
  if (AGE === 3 && h >= h1 - 1 && (u === u0 || u === u1 || (h === h1 && u !== 13))) return h === h1 && u === 13 ? Au[0] : (u === u0 || u === u1 ? (h === h1 ? null : 'ς') : 'σ');
  if (AGE === 3 && h === h0) return Au[1];
  if (h === h0) return 'w';                                                                  // sill
  if (u === u0 || u === u1 || h === h1) return 'v';                                          // frame
  return (u === 13 && (h === 6 || h === 7)) ? (h === 6 ? 'O' : 'y') : ((u === 12 || u === 14) && h === 6 ? 'O' : (u === 13 ? 'v' : 'i')); };
// shaded wall: the open boat bay, its lintel running with the wall, a prow inside
const bayAt = (u, h) => { const u0 = 6, u1 = 23, h1 = 8, n = u1 - u0, su = u - u0; if (u < u0 || u > u1 || h > h1 + 1) return null;
  if (h === h1 + 1) return AGE === 3 ? Au[1] : AGE === 0 ? TW[2] : 'v';                    // lintel
  if (su <= 1 || su >= n - 1) return su === 0 || su === n ? 'V' : 'v';                      // jambs
  if (h === h1) return 'V';
  const c = n / 2, d = Math.abs(su - c), w = (7 - h) * 1.2;                                // prow: stem at the centre, hull widening down
  if (h <= 6 && d <= w) return d < 0.6 ? 'w' : (d > w - 1 ? (su < c ? 'w' : 'v') : (su < c ? 'W' : 'u'));
  return 'i'; };
paint(g, '2', wallPaint(HB.L, HB.Bm, true, winAt));
paint(g, '3', wallPaint(HB.Bm, HB.Rr, false, bayAt));
// the roof overhangs by e and drops by d along the iso axes, so its eaves stay exactly 2:1 and parallel to the courses; every
// face uses the same tile (3-px courses, 4-px tiles, lit lip, seams), lit on the left faces and shaded on the right ones, and
// each face's courses start from its own eave so the eave row is whole
const e = AGE === 0 ? 2.5 : 1.5, dr = AGE === 0 ? 3 : 1.5;
const R = { L: [top.L[0] - 2 * e, top.L[1] + dr], Bm: [top.Bm[0], top.Bm[1] + e + dr], Rr: [top.Rr[0] + 2 * e, top.Rr[1] + dr], T: [top.T[0], top.T[1] - e + dr] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '5', left: '6', front: '7', right: '8' });
const LIT = { joint: 'd', seam: 'd', lip: 'g', tones: ['b', 'b', 'c'] }, SHD = { joint: 'e', seam: 'e', lip: 'a', tones: ['d', 'd', 'a'] };
const offP = p => -Math.round(p[1] - 0.5 * p[0]), offM = p => -Math.round(p[1] + 0.5 * p[0]);
if (C) {
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 3, w: 4, off: offP(R.L), ...LIT }));
paint(g, '8', (x, y) => course(x, y, -0.5, { h: 3, w: 4, off: offM(R.Bm), ...SHD }));
paint(g, '6', (x, y) => course(x, y, -0.5, { h: 3, w: 4, off: offM(R.L), flip: true, ...LIT }));   // back slopes: flip
paint(g, '5', (x, y) => course(x, y, 0.5, { h: 3, w: 4, off: offP(R.Rr), flip: true, ...SHD }));
line(g, R.L, R.Bm, 'e'); line(g, R.Bm, R.Rr, 'e'); line(g, R.L, ap, 'h'); line(g, R.Bm, ap, 'k'); line(g, [R.Bm[0] - 1, R.Bm[1]], [ap[0] - 1, ap[1]], 'h');
} else { // the age kit's roof material, its eave and hips; Dark: a ragged thatch fringe; Imperial: gilt trim and cresting
  paint(g, '7', (x, y) => AK.roofXY(x, y, 0.5, 0, { off: offP(R.L) }));
  paint(g, '8', (x, y) => AK.roofXY(x, y, -0.5, 1, { off: offM(R.Bm) }));
  paint(g, '6', (x, y) => AK.roofXY(x, y, -0.5, 2, { off: offM(R.L), flip: true }));
  paint(g, '5', (x, y) => AK.roofXY(x, y, 0.5, 3, { off: offP(R.Rr), flip: true }));
  line(g, R.L, R.Bm, RK[6]); line(g, R.Bm, R.Rr, RK[6]); line(g, R.L, ap, RK[AGE === 0 ? 3 : 1]); line(g, R.Bm, ap, 'k'); line(g, [R.Bm[0] - 1, R.Bm[1]], [ap[0] - 1, ap[1]], RK[AGE === 0 ? 3 : 1]);
  if (AGE === 0) for (let x = Math.ceil(R.L[0]); x <= R.Rr[0]; x++) if (hash(x, 77) < 0.45) {
    const ey = x <= R.Bm[0] ? R.L[1] + (x - R.L[0]) * 0.5 : R.Bm[1] - (x - R.Bm[0]) * 0.5; pixSet(g, x, Math.round(ey) + 1, RK[hash(x, 78) < 0.5 ? 4 : 5]); }
  if (AGE === 3) { AK.trim(g, [R.L[0] + 1, R.L[1]], R.Bm, -1); AK.trim(g, R.Bm, [R.Rr[0] - 1, R.Rr[1]], -1); AK.crest(g, lerp(R.Bm, ap, 0.2), lerp(R.Bm, ap, 0.85)); }
}
// Feudal: a stone chimney stack on the shaded slope, its foot cut along the roof (smoke from it in idle)
let STACK = null;
if (AGE === 1) { const c = lerp(lerp(R.Bm, R.Rr, 0.62), ap, 0.45), x = Math.round(c[0]), y = Math.round(c[1]);
  pixStamp(g, x - 2, y - 9, `
kkkkkk
kςςτυk
kσςτυk
kςφτυk
kσςτυk
kςςφυk
kσςτυk
.kςτυk
..kkkk
`); STACK = [x, y - 10]; }
if (AGE === 0) { pixStamp(g, ap[0] - 3, ap[1] - 1, `
.kkkkk.
kbbcbbk
.kkkkk.
`.replace(/b/g, RK[4]).replace(/c/g, DEEP)); STACK = [Math.round(ap[0]), Math.round(ap[1]) - 1]; }
if (!C) AK.finial(g, Math.round(ap[0]), Math.round(ap[1]) - (AGE === 0 ? 2 : 2));
// Imperial: a gilt-fringed team banner on the boathouse's lit wall, by the window
if (AGE === 3) AK.banner(g, Math.round(HB.L[0]) + 2, Math.round(HB.L[1] + 4 * 0.5) - HOUSE + 5, 0.5, 5, 10);
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
if (AGE === 0) { // no crane yet: a fish-drying frame, two forked poles on the deck and a crossbar hung with the catch
  const [x, y] = CR, x0 = x - 16, y0 = y + 8;
  for (const [px, py] of [[x0, y0], [x, y]]) { for (let yy = py - 20; yy <= py; yy++) { pixSet(g, px - 1, yy, 'k'); pixSet(g, px, yy, 'w'); pixSet(g, px + 1, yy, 'v'); pixSet(g, px + 2, yy, 'k'); }
    pixSet(g, px - 1, py - 21, 'k'); pixSet(g, px + 2, py - 21, 'k'); }
  pixLine(g, x0, y0 - 20, x + 1, y - 20, 'u'); pixLine(g, x0, y0 - 21, x + 1, y - 21, 'k');
  for (let k = 1; k < 6; k++) { const fx = Math.round(x0 + (x - x0) * k / 6), fy = Math.round(y0 - 19 + (y - y0) * k / 6);
    pixSet(g, fx, fy, 'r'); for (let d = 1; d <= 5; d++) pixSet(g, fx, fy + d, d === 5 ? 'k' : d % 2 ? 'x' : 's'); pixSet(g, fx + 1, fy + 2, 'k'); pixSet(g, fx - 1, fy + 2, 'k'); pixSet(g, fx + 1, fy + 4, 'k'); pixSet(g, fx - 1, fy + 4, 'k'); }
} else { const [x, y] = CR;
  for (let yy = y - 30; yy <= y; yy++) { pixSet(g, x - 1, yy, 'k'); pixSet(g, x, yy, 'w'); pixSet(g, x + 1, yy, 'v'); pixSet(g, x + 2, yy, 'k'); }
  pixLine(g, x - 2, y - 30, x - 20, y - 36, 'k'); pixLine(g, x - 2, y - 29, x - 20, y - 35, 'w'); pixLine(g, x - 2, y - 28, x - 20, y - 34, 'v'); pixLine(g, x - 1, y - 27, x - 20, y - 33, 'k');
  pixLine(g, x - 1, y - 18, x - 12, y - 31, 'v'); pixLine(g, x - 2, y - 18, x - 13, y - 31, 'k');
  pixLine(g, x - 2, y, x - 6, y - 8, 'v'); pixLine(g, x - 3, y, x - 7, y - 8, 'k');
  pixRect(g, x - 1, y - 32, 4, 2, 'k');
  if (AGE === 3) { pixStamp(g, x - 2, y - 35, `.kk.\nkλμk\nkμνk`); pixStamp(g, x - 3, y - 3, `kkkkkk\nkσςτυk\nkkkkkk`); } }

const base = outline(g, 'k', C ? { w: 'u', p: 'P', g: 'b', L: 'T' } : { w: 'u', p: 'P', L: 'T', ...AK.sel });

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
  if (AGE !== 0) { pixLine(f, cx - 20, cy - 33, rx, cy - 20, 'R'); pixStamp(f, rx - 3, cy - 20, CRATE); }
  if (STACK) for (let k = 0; k < 2; k++) { // smoke from the chimney / smoke hole, a puff rising and drifting right
    const t = ((i + k * 2) % 4) / 4, px = STACK[0] + Math.round(t * 6), py = STACK[1] - 2 - Math.round(t * 14);
    if (t < 0.3) { pixRect(f, px, py, 2, 2, 'Z'); pixSet(f, px, py, 'z'); } else { pixRect(f, px - 1, py - 1, 3, 3, 'Z'); pixSet(f, px - 1, py - 1, 'z'); pixSet(f, px + 1, py + 1, 'X'); } }
  frames.push(pixText(f));
}

return {
  id: 'dock', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    k: '#24180f',                                                          // ink
    Y: '#b8975e', p: '#a8864f', P: '#937344', o: '#7d5f36', q: '#5a3f22',                 // deck planks / joints
    w: '#a07a4a', W: '#93703f', u: '#8a6a3a', v: '#5a3a18', V: '#3b2614', K: '#2c3a40', // timber, wet pile foot
    i: '#1f1610', O: '#d8813a', y: '#ffc95a',                               // openings, lamp
    g: '#d8805c', h: '#eea582', b: '#b85a3e', c: '#a0482e', a: '#8a3a2a', d: '#73301f', e: '#4e2016', // roof tiles
    x: '#b8c4cc', s: '#8a98a4', f: '#dfe8ee',                               // fish in the basket
    n: '#cfc3a2', N: '#a39579', R: '#c9b58e', r: '#9e8a64',                 // net, rope
    F: '#d8ecf4', S: '#8ec0dc',                                             // water foam / ripple
    z: '#e4e0da', Z: '#c4beb8', X: '#948e88',                               // smoke
    ...(AGE === 0 ? { Y: '#a08a62', p: '#8e7650', P: '#7a6444', q: '#4a3620' } : {}),   // weathered split logs
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 0);
