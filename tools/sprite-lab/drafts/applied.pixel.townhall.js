// @pixel townhall
// Town Centre (3×3): a paved stone plinth (flags on the iso ground grid). On the back 2×2 tiles an open-sided market pavilion:
// a big hipped red-tile roof with a slatted smoke louvre on timber posts over a raised floor, open on every side (you see
// through its back), with the town hearth, stores and gold inside and team banners under the eaves. A coursed stone tower on
// the right corner tile (arched door, lancet windows and a banner laid out on its faces, tile cap; the code flag waves from
// its apex). Forecourt: a well on the front tile, a market stall under a team awning. Anchor = bottom corner.
// idle: 6 frames — hearth fire flickers and its glow pulses on the floor, smoke rises from the louvre. building.townhall.js.
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


const W = 3, H = 3, PL = 4, DAIS = 2, Z = 32, ROOF = 30, TZ = 64;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + PL + 22 + 26 + 56;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);

// ---- helpers: ground-plane paving and face-space painting
/** iso ground coordinates of a cell from origin O: a along L->T (+2,-1 px per unit), b along L->Bm (+2,+1 px per unit) */
const isoAB = (O, x, y) => { const dx = x + 0.5 - O[0], dy = y + 0.5 - O[1]; return [(dx / 2 - dy) / 2, (dx / 2 + dy) / 2]; };
/** stone flags on the ground plane: joints run along both iso ground axes (a 2:1 diamond grid), rows staggered */
const paveFlags = (O, sz, J, tone) => (x, y) => {
  const [a, b] = isoAB(O, x, y), rb = Math.floor(b / sz), aa = a + (((rb % 2) + 2) % 2) * sz / 2, ra = Math.floor(aa / sz);
  if (aa - ra * sz < 0.5 || b - rb * sz < 0.5) return J;
  return tone(ra, rb, a, b);
};
/** paint on a vertical face from A to Bp (A.x < Bp.x) in face space: su = 0..u1-u0 along the face, sh = 0..h1-h0 up it.
 *  Rows of constant sh follow the face's slope, so anything painted this way slants with the wall. */
const face = (A, Bp, u0, u1, h0, h1, fn) => {
  const sl = (Bp[1] - A[1]) / (Bp[0] - A[0]);
  for (let u = u0; u <= u1; u++) { const x = Math.round(A[0]) + u, base = A[1] + sl * (x + 0.5 - A[0]);
    for (let h = h0; h <= h1; h++) { const c = fn(u - u0, h - h0); if (c) pixSet(g, x, Math.floor(base - h - 0.5), c); } }
};
const up = (p, z) => [p[0], p[1] - z];

// ---- plinth: a coursed stone platform paved with flags; the forecourt is the open, lit part of it
const pl = pixIsoBox(g, bx, by, W, H, PL, 1, { left: '1', right: '2', top: 'p' });
paint(g, '1', (x, y) => course(x, y, 0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['S', 'q', 'S'] }));
paint(g, '2', (x, y) => course(x, y, -0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q'] }));
paint(g, 'p', paveFlags(pl.L, 3, 'P', (ra, rb) => ['p', 'p', 'p', 's', 'P'][Math.floor(hash(ra + 40, rb + 7) * 5)]));

// ---- the market pavilion: an open-sided hall on the back 2×2 tiles, a big hipped roof on timber posts over a raised stone
// floor with the town hearth at its centre. Its back sides are open too, so you look right through it. The side tower stands
// on the right corner tile and closes the back half of the pavilion's right side.
const dz = pixIsoBox(g, bx, by - 32 - PL, 2, 2, DAIS, 1, { left: '3', right: '4', top: '5' });
const D = dz;                                                    // floor corners (top of the dais)
paint(g, '3', () => 'S'); paint(g, '4', () => 'q');
line(g, dz.base.L, dz.base.Bm, 'j', -1); line(g, dz.base.Bm, dz.base.Rr, 'j', -1);
// floor flags: lit near the open front, in the roof's shade further in
paint(g, '5', paveFlags(D.L, 3, 'K', (ra, rb, a, b) => { const deep = Math.min(a, 2 - b); return deep > 0.3 ? (hash(ra, rb) < 0.3 ? 'f' : 'F') : deep > 0.12 ? (hash(ra, rb) < 0.5 ? 'f' : 'F') : 'p'; }));
/** a point on the floor, a tiles toward the back (L->T), b tiles toward the front corner (L->Bm) */
const gp = (a, b) => [D.L[0] + 32 * a + 32 * b, D.L[1] - 16 * a + 16 * b];
// timber post on a stone base with a flared capital; lit = left-facing side catches the light
const post = (p, lit, h = Z) => {
  const x = Math.round(p[0]), y = Math.round(p[1]);
  const [a, b, c] = lit ? ['t', 'u', 'v'] : ['u', 'v', 'V'];
  for (let yy = y - h + 3; yy < y - 2; yy++) { pixSet(g, x - 1, yy, a); pixSet(g, x, yy, b); pixSet(g, x + 1, yy, c); pixSet(g, x - 2, yy, 'k'); pixSet(g, x + 2, yy, 'k'); }
  pixStamp(g, x - 2, y - 3, lit ? `
kSqQk
kqQjk
` : `
kqQjk
kQjjk
`);
  pixStamp(g, x - 3, y - h + 1, lit ? `
ktttuvk
.kuuvk.
` : `
kuuvvVk
.kvvVk.
`);
};
const beam = (a, b, lit) => { line(g, a, b, 'k', 0); line(g, a, b, lit ? 't' : 'u', 1); line(g, a, b, lit ? 'u' : 'v', 2); line(g, a, b, 'k', 3); };
// back row first (painter's order): posts along the open back-left side, its tie beam
for (const a of [0.5, 1, 1.5]) post(gp(a, 0), false);
beam(up(gp(0, 0), Z), up(gp(2, 0), Z), false);

// the town hearth: a raised stone ring with embers in the front-left half of the hall, where it shows between the posts
// under the eave (the roof hides anything deeper than ~0.7 tile); flames are per frame
const HC = gp(0.42, 0.85);
const HEARTH = [Math.round(HC[0]), Math.round(HC[1])];
pixStamp(g, HEARTH[0] - 7, HEARTH[1] - 4, `
...kkkkkkkk...
.kkSsSqSsSqkk.
kSqjiiiiiijqQk
kqQjoooooojQjk
.kkQqQjQqQjkk.
...kkkkkkkk...
`);
// stores kept dry under the roof, against the back of the hall and clear of every post
const SACKS = `
..kk..kk...
.kwwkkwWk..
kwwWWkwWxk.
kwWWxkWWxk.
kwWWxkwWxkk
.kxxk.kxxkwk
..kk...kkWxk
.........kk.
`;
const CRATES = `
kkkkkkkk.
kttttttuk
ktvtttvuk
kttvtvtuk
ktttvttuk
ktvtttvuk
kuuuuuuvk
kkkkkkkk.
`;
const BARREL = `
.kkkk.
kuttuk
kvvvvk
kuttuk
kuttuk
kvvvvk
.kkkk.
`;
const GOLD = `
...kk...
..kGnk..
.kGnnNk.
kGnGnnNk
kkkkkkkk
`;
const at = (p, dx, h, s) => pixStamp(g, Math.round(p[0]) + dx, Math.round(p[1]) - h, s);
// (every store sits at least 0.3 tile behind the front posts, which are drawn after it, so a post always passes in front)
at(gp(0.45, 0.25), -5, 7, CRATES); at(gp(0.55, 1.75), -4, 7, SACKS); at(gp(0.35, 1.35), -4, 4, GOLD); at(gp(0.9, 1.75), -3, 6, BARREL);

// front row: posts along both open front sides (the tower carries the right side's back half), tie beams on top
for (const b of [0, 0.5, 1, 1.5, 2]) post(gp(0, b), true);
post(gp(0.5, 2), false);
const TWL = gp(1, 2);                                            // where the tower's left corner meets the pavilion
beam(up(gp(0, 0), Z), up(gp(0, 2), Z), true); beam(up(gp(0, 2), Z), up(TWL, Z), false);
// team banners hanging from the beams in the two bays flanking the front corner (cloth slants with its beam)
const banner = (A, Bp, u0) => face(A, Bp, u0, u0 + 6, Z - 13, Z - 3, (su, sh) => {
  if (sh === 10) return su === 0 || su === 6 ? 'k' : 'v';                       // rod
  if (sh <= 1 && su >= 2 && su <= 4) return sh === 0 ? (su === 3 ? null : 'k') : (su === 3 ? 'k' : 'D'); // swallowtail
  if (su === 0 || su === 6) return 'k';
  if (su === 1 || su === 5) return 'D';
  if ((su === 3 && sh >= 4 && sh <= 8) || (sh === 6 && su >= 2 && su <= 4)) return 'L';
  return 'T';
});
banner(gp(0, 0), gp(0, 2), 53); banner(gp(0, 2), gp(2, 2), 6);

// ---- the big roof: hipped red tile over the pavilion, overhanging along the iso axes so its eaves stay 2:1 and parallel to
// the courses; every face uses the same tile (4-px courses, 5-px tiles, lit lip, seams), each face starting from its own eave
const e = 2, dr = 2, rb = { L: up(D.L, Z), Bm: up(D.Bm, Z), Rr: up(D.Rr, Z), T: up(D.T, Z) };
const R = { L: [rb.L[0] - 2 * e, rb.L[1] + dr], Bm: [rb.Bm[0], rb.Bm[1] + e + dr], Rr: [rb.Rr[0] + 2 * e, rb.Rr[1] + dr], T: [rb.T[0], rb.T[1] - e + dr] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '6', left: '7', front: '8', right: '9' });
const offP = p => -Math.round(p[1] - 0.5 * p[0]), offM = p => -Math.round(p[1] + 0.5 * p[0]);
const LIT = { h: 4, w: 5, joint: 'd', seam: 'd', lip: 'g', tones: ['c', 'c', 'b'] }, SHD = { h: 4, w: 5, joint: 'e', seam: 'e', lip: 'a', tones: ['d', 'd', 'a'] };
paint(g, '8', (x, y) => course(x, y, 0.5, { off: offP(R.L), ...LIT }));
paint(g, '9', (x, y) => course(x, y, -0.5, { off: offM(R.Bm), ...SHD }));
paint(g, '7', (x, y) => course(x, y, -0.5, { off: offM(R.L), flip: true, ...LIT }));     // back slopes: flip
paint(g, '6', (x, y) => course(x, y, 0.5, { off: offP(R.Rr), flip: true, ...SHD }));
line(g, R.L, R.Bm, 'e', 0); line(g, R.Bm, R.Rr, 'e', 0);
for (const [P, lit] of [[R.L, 1], [R.Bm, 1], [R.Rr, 0], [R.T, 0]]) { line(g, P, ap, 'k'); line(g, [P[0] - 1, P[1]], [ap[0] - 1, ap[1]], lit ? 'h' : 'b'); }
// smoke louvre astride the apex: a small slatted box whose base corners sit on the four hips (so its foot is on the roof),
// with its own tiled cap and a gilt finial
const LS = 0.3, LD = ROOF * (LS / 2) / ((64 + 2 * e) / 64), LZ = LD + 7;
const lv = pixIsoBox(g, ap[0], ap[1] + 16 * LS + LD, LS, LS, LZ, 1, { left: '!', right: '@' });
paint(g, '!', (x, y) => (Math.floor(wallH(lv.base.L, lv.base.Bm, x + 0.5, y + 0.5)) % 2 ? 'i' : 't'));
paint(g, '@', (x, y) => (Math.floor(wallH(lv.base.Bm, lv.base.Rr, x + 0.5, y + 0.5)) % 2 ? 'i' : 'u'));
const lR = { L: [lv.L[0] - 2, lv.L[1] + 1], Bm: [lv.Bm[0], lv.Bm[1] + 2], Rr: [lv.Rr[0] + 2, lv.Rr[1] + 1], T: [lv.T[0], lv.T[1]] };
const lap = pixIsoRoof(g, lR, 6, 1, { back: '6', left: '7', front: '8', right: '9' });
paint(g, '8', () => 'c'); paint(g, '7', () => 'b'); paint(g, '9', () => 'd'); paint(g, '6', () => 'a');
line(g, lR.L, lR.Bm, 'e'); line(g, lR.Bm, lR.Rr, 'e'); line(g, lR.Bm, lap, 'k');
pixStamp(g, lap[0] - 1, lap[1] - 4, `
.G.
kGk
.n.
`);

// ---- side tower on the right corner tile: coursed stone, quoins, an arched door onto the forecourt, lancet windows and a
// team banner laid out on each face (they slant with the wall), tile cap. The code flag waves from its apex.
const tw = pixIsoBox(g, bx + 64, by - PL - 32, 1, 1, TZ, 1, { left: '!', right: '@' });
const TB = tw.base;
paint(g, '!', (x, y) => course(x, y, 0.5, { h: 4, w: 7, joint: 'q', seam: 'q', lip: 's', tones: ['S', 'S', 's', 'q'] }));
paint(g, '@', (x, y) => course(x, y, -0.5, { h: 4, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q', 'S'] }));
// quoins: long and short dressed blocks alternating up the front corner, each course flush with its face's slope
face(TB.L, TB.Bm, 25, 31, 0, TZ - 1, (su, sh) => { const c = Math.floor(sh / 4), long = c % 2 === 0; if (su < (long ? 0 : 3)) return null; return sh % 4 === 3 ? 'q' : 's'; });
face(TB.Bm, TB.Rr, 0, 5, 0, TZ - 1, (su, sh) => { const c = Math.floor(sh / 4), long = c % 2 === 1; if (su > (long ? 5 : 2)) return null; return sh % 4 === 3 ? 'j' : 'S'; });
line(g, TB.Bm, tw.Bm, 'k');
const lancet = (A, Bp, u0, h0, lit) => face(A, Bp, u0, u0 + 4, h0, h0 + 9, (su, sh) => {
  if (sh === 9) return su === 2 ? 'k' : null;
  if (sh === 8) return su === 0 || su === 4 ? null : (su === 2 ? (lit ? 'O' : 'i') : 'k');
  if (sh === 0) return lit ? 'S' : 'q';                                         // sill
  if (su === 0 || su === 4) return 'k';
  return lit ? (su === 2 ? 'y' : (sh > 5 ? 'i' : 'O')) : (su === 2 && sh > 2 && sh < 7 ? 'o' : 'i');
});
lancet(TB.L, TB.Bm, 6, 44, true); lancet(TB.L, TB.Bm, 6, 26, true);
lancet(TB.Bm, TB.Rr, 20, 46, false); lancet(TB.Bm, TB.Rr, 20, 28, false);
// arched door onto the forecourt: plank leaf, iron straps that run with the wall, stone jambs
face(TB.L, TB.Bm, 11, 21, 0, 18, (su, sh) => {
  const n = 10, k = sh - 14;                                                    // the arch springs at h 14
  if (k >= 0 && (su < k || su > n - k)) return null;                            // outside the arch
  if (su === 0 || su === n || (k >= 0 && (su === k || su === n - k)) || sh === 18) return 'q';  // stone jambs and voussoirs
  if (su === 1 || su === n - 1 || (k >= 0 && (su === k + 1 || su === n - k - 1)) || sh === 17) return 'k';
  if (sh === 4 || sh === 11) return 'k';                                        // iron straps, running with the wall
  if (su === n - 3 && sh === 8) return 'G';                                     // ring handle
  return su % 2 ? 'u' : 'v';
});
// team banner on the lit face, hung from an iron rod between the windows and the corner
face(TB.L, TB.Bm, 14, 21, 32, 52, (su, sh) => {
  if (sh === 20) return su === 0 || su === 7 ? 'k' : 'j';
  if (sh <= 1 && (su === 3 || su === 4)) return null;
  if (su === 0 || su === 7) return 'k';
  if (su === 1 || su === 6) return 'D';
  if ((sh >= 7 && sh <= 15 && (su === 3 || su === 4)) || (sh >= 11 && sh <= 12 && su >= 2 && su <= 5)) return 'L';
  return 'T';
});
// tower cap: the same tile as the main roof, courses from each eave
const tR = { L: [tw.L[0] - 2, tw.L[1] + 1], Bm: [tw.Bm[0], tw.Bm[1] + 2], Rr: [tw.Rr[0] + 2, tw.Rr[1] + 1], T: [tw.T[0], tw.T[1] - 1] };
const tap = pixIsoRoof(g, tR, 12, 1, { back: '6', left: '7', front: '8', right: '9' });
paint(g, '8', (x, y) => course(x, y, 0.5, { off: offP(tR.L), ...LIT }));
paint(g, '9', (x, y) => course(x, y, -0.5, { off: offM(tR.Bm), ...SHD }));
paint(g, '7', (x, y) => course(x, y, -0.5, { off: offM(tR.L), flip: true, ...LIT }));
paint(g, '6', (x, y) => course(x, y, 0.5, { off: offP(tR.Rr), flip: true, ...SHD }));
line(g, tR.L, tR.Bm, 'e'); line(g, tR.Bm, tR.Rr, 'e'); line(g, tR.Bm, tap, 'k'); line(g, [tR.Bm[0] - 1, tR.Bm[1]], [tap[0] - 1, tap[1]], 'h');

// ---- forecourt: the well on the front tile, on the hall's axis; a market stall under a team awning on the left corner tile;
// barrels and a sack set against the tower wall by its door
const FC = p => [p[0], p[1] - PL];
{ // well: a coursed stone drum with dark water, two posts, a crossbar and a bucket on its rope
  const [cx, cy] = FC([bx, by - 14]), top = cy - 5;
  const pre = copy(g);
  for (let x = -6; x <= 6; x++) {
    const ey = Math.round(Math.sqrt(Math.max(0, 1 - (x / 6.5) ** 2)) * 3), wy = Math.round(Math.sqrt(Math.max(0, 1 - (x / 4.5) ** 2)) * 2);
    for (let yy = top + ey; yy <= cy + ey - 1; yy++) pixSet(g, cx + x, yy, (yy - top - ey) % 3 === 2 ? 'j' : (x < -1 ? 'S' : x < 3 ? 'q' : 'Q'));
    for (let yy = top - ey; yy < top + ey; yy++) pixSet(g, cx + x, yy, Math.abs(x) <= 4 && yy >= top - wy && yy < top + wy ? (yy === top - wy ? 'i' : 'B') : (x < 0 ? 's' : 'q'));
  }
  pixSet(g, cx - 2, top, 'z');
  // a low windlass across the rim (two short posts and a roller with its rope coiled on it); the bucket stands on the
  // paving by the drum
  for (const sx of [-6, 5]) for (let yy = top - 5; yy < top; yy++) { pixSet(g, cx + sx, yy, sx < 0 ? 't' : 'u'); pixSet(g, cx + sx + 1, yy, 'v'); }
  pixLine(g, cx - 5, top - 5, cx + 4, top - 5, 'x'); pixLine(g, cx - 5, top - 4, cx + 4, top - 4, 'u');
  pixStamp(g, cx + 7, cy - 1, `
kkkk
kutk
kuvk
.kk.
`);
  // ink the well's silhouette where it meets the paving, so it stands on the forecourt instead of melting into it
  const mine = (x, y) => g[y][x] !== pre[y][x];
  const ink = [];
  for (let y = cy - 20; y <= cy + 8; y++) for (let x = cx - 9; x <= cx + 12; x++) if (!mine(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => mine(x + dx, y + dy))) ink.push([x, y]);
  for (const [x, y] of ink) g[y][x] = 'k';
}
{ // market stall: a plank counter with produce, four posts, and a striped team awning sloping toward the customer
  const s0 = FC([bx - 60, by - 42]);                                          // front corner of the counter
  const cw = 0.42, cd = 0.22, ch = 6, ah = 15, ab = 18;
  const cL = [s0[0] - cw * 32, s0[1] - cw * 16], cR = [s0[0] + cd * 32, s0[1] - cd * 16], cT = [cL[0] + cd * 32, cL[1] - cd * 16];
  // back posts first, then the counter, then the front posts and the cloth
  for (const P of [cT, cR]) { const x = Math.round(P[0]), y = Math.round(P[1]); for (let yy = y - ab; yy < y - ch; yy++) { pixSet(g, x, yy, 'u'); pixSet(g, x + 1, yy, 'v'); } }
  const ctr = pixIsoBox(g, s0[0], s0[1], cw, cd, ch, 1, { left: '$', right: '%', top: '^' });
  paint(g, '$', (x, y) => (Math.floor(wallH(ctr.base.L, ctr.base.Bm, x + 0.5, y + 0.5)) % 3 === 2 ? 'v' : 't'));
  paint(g, '%', (x, y) => (Math.floor(wallH(ctr.base.Bm, ctr.base.Rr, x + 0.5, y + 0.5)) % 3 === 2 ? 'V' : 'u'));
  paint(g, '^', () => 'w');
  // produce on the counter: apples, cabbages, a cheese
  for (const [t, c1, c2] of [[0.2, 'O', 'o'], [0.45, 'G', 'n'], [0.72, 'O', 'o']]) { const p = lerp(ctr.L, ctr.Bm, t); const x = Math.round(p[0]) + 2, y = Math.round(p[1]) - 2; pixRect(g, x - 1, y - 1, 3, 2, c1); pixSet(g, x + 1, y, c2); pixSet(g, x - 1, y - 2, 'k'); pixSet(g, x, y - 2, 'k'); pixSet(g, x + 1, y - 2, 'k'); }
  for (const P of [cL, s0]) { const x = Math.round(P[0]), y = Math.round(P[1]); for (let yy = y - ah; yy < y; yy++) { pixSet(g, x, yy, 't'); pixSet(g, x + 1, yy, 'v'); } }
  const f0 = up(cL, ah), f1 = up(s0, ah), b0 = up(cT, ab), b1 = up(cR, ab);
  pixPoly(g, [f0, f1, b1, b0], '&');
  // stripes run from the high back edge down to the hem (along the cloth's slope), alternating team and light
  paint(g, '&', (x, y) => { const s = (x - f0[0]) - 2 * (y - f0[1]); return Math.floor(s / 6) % 2 ? 'L' : 'T'; });
  line(g, b0, b1, 'k'); line(g, f0, b0, 'k');
  for (let k = 0; k <= 8; k++) { const p = lerp(f0, f1, k / 8); pixSet(g, p[0], p[1], 'D'); pixSet(g, p[0], p[1] + 1, k % 2 ? 'D' : 'k'); }
}

{ const p = lerp(TB.L, TB.Bm, 0.12); pixStamp(g, Math.round(p[0]) - 4, Math.round(p[1]) - 7, `
.kkkk.kk..
kuttukwWk.
kvvvvkWxk.
kuttukWxk.
kuttukkkk.
kvvvvk....
.kkkk.....
`); }

const base = outline(g, 'k', { S: 'q', g: 'b', h: 'b', s: 'S', p: 'P' });

// ---- idle: 6 frames — the hearth fire flickers and its glow pulses on the floor flags; smoke rises from the louvre
const H0 = [HEARTH[0], HEARTH[1] - 3];
const FLAMES = [`
...y...
..yOy..
.yOYOy.
`, `
..y....
..Oyy..
.yOYOy.
`, `
....y..
..yyO..
.yOYOy.
`];
const sx = Math.round(lap[0]), sy = Math.round(lap[1]) - 4;
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  const R2 = [7, 8, 6, 9, 7, 8][i];
  paint(f, 'fFp', (x, y) => { const d = Math.hypot((x - H0[0]) * 0.5, (y - H0[1] - 1) * 1.1); return d < R2 * 0.45 ? 'r' : d < R2 ? (f[y][x] === 'f' ? 'F' : null) : null; });
  pixStamp(f, H0[0] - 3, H0[1] - 2, FLAMES[i % 3]);
  for (let k = 0; k < 3; k++) {
    const t = ((i + k * 2) % 6) / 6, r = t < 0.2 ? 0 : t < 0.7 ? 2 : 1;
    const x = sx + Math.round(Math.sin(t * 5) * 1.5 + t * 10), y = sy - Math.round(2 + t * 24);
    if (r === 0) { pixRect(f, x, y, 2, 2, 'Z'); pixSet(f, x, y, 'z'); continue; }
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.6) pixSet(f, x + xx, y + yy, xx + yy < 0 ? 'z' : xx + yy > r ? 'X' : 'Z');
  }
  frames.push(pixText(f));
}

export default {
  id: 'townhall', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f',                                                       // ink
    S: '#a39a8c', q: '#8d8478', Q: '#6f6a60', j: '#4f4a42', s: '#b8ae9c', // stone lit / mid / shade / mortar / light
    p: '#b3aa98', P: '#978e7e', K: '#6b6355', B: '#35505e',                           // paving, joints (forecourt / under the roof)
    F: '#857b6a', f: '#6e6658', r: '#b08a5e',                           // floor flags in the roof's shade, firelit flags
    t: '#a07a4a', u: '#8a6a3a', v: '#5a3a18', V: '#3b2614',             // timber
    i: '#1f1610', o: '#7a4a26', O: '#d8813a', y: '#ffc95a', Y: '#fff0b0', // dark, embers, fire
    g: '#d8805c', h: '#eea582', b: '#b85a3e', c: '#a0482e', a: '#8a3a2a', d: '#73301f', e: '#4e2016', // roof tiles
    w: '#efe6d2', W: '#d9c7a0', x: '#a8946e',                           // sacks, counter top, rope
    G: '#ffe28a', n: '#e1b12c', N: '#a87a12',                           // gold
    z: '#e4e0da', Z: '#c4beb8', X: '#948e88',                           // smoke, water glint
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
