// @pixel townhall
// Town Hall (3×3): coursed stone plinth, open pillared ground floor (three-tone timber pillars on stone bases, lintel beam) with
// a warm interior — plank back wall, hearth, grain sacks, crates, barrels, gold — and team banners in the bays; a big hipped
// red-tile roof in courses with hip caps, a finial and a chimney; a coursed stone side tower with lit windows, quoins, a team
// banner and a tile cap (the code flag waves from its apex). Generated with local texture routines; anchor = bottom corner.
// idle: 6 frames — hearth fire flickers and its glow pulses on the back wall, chimney smoke rises. building.townhall.js.
// ---- local texture kit (deterministic) ----
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const copy = g => g.map(r => r.slice());
/** Replace every cell holding one of `chs` by fn(x,y,ch) (null keeps it). */
const paint = (g, chs, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (chs.includes(g[y][x])) { const c = fn(x, y, g[y][x]); if (c) g[y][x] = c; } };
/** Courses on a face whose rows run with slope s (+0.5 down-right, -0.5 up-right, 0 flat): rows of height h, blocks of width w
 *  staggered by half a block, 1-px joint under each row, optional lit lip on top of each row, block tones picked per block. */
const course = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v = u - row * o.h;
  if (v >= o.h - 1) return o.joint;
  const xs = x + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
  if (o.seam && ((xs % o.w) + o.w) % o.w === 0) return o.seam;
  if (o.lip && v < 1) return o.lip;
  return o.tones[Math.floor(hash(col + 17, row + 91) * o.tones.length)];
};
/** Thatch: layered bands (slope s, height h) of short vertical strands; the bottom of every band is the shaded underside. */
const thatch = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v = u - row * o.h;
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

const W = 3, H = 3, Z = 26, ROOF = 30, PL = 4, TZ = 44;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + PL + 22 + 26 + 36;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);

// ---- plinth: stone courses with a paved top, quoins on the front corner
const pl = pixIsoBox(g, bx, by, W, H, PL, 1, { left: '1', right: '2', top: 'p' });
paint(g, '1', (x, y) => course(x, y, 0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['S', 'q', 'S'] }));
paint(g, '2', (x, y) => course(x, y, -0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q'] }));
paint(g, 'p', (x, y) => course(x, y, 0.5, { h: 4, w: 8, joint: 'P', tones: ['p'] }));

// ---- open hall: interior seen between the pillars (floor, plank back wall, hearth glow, goods)
const hall = pixIsoBox(g, bx, by - PL - 2, W - 0.05, H - 0.05, Z, 1, { left: '3', right: '4' });
const B = hall.base;
const HEARTH = lerp(B.L, B.Bm, 0.42);
const interior = (x, y, h, side) => {
  if (h > Z - 6) return 'i';
  if (h > Z - 8) return 'I';
  if (h < 3) return side ? 'f' : 'F';
  const plank = ((x + (side ? 1 : 0)) % 3 === 0);
  return side ? (plank ? 'i' : 'I') : (plank ? 'I' : 'J');
};
paint(g, '3', (x, y) => interior(x, y, wallH(B.L, B.Bm, x, y), 0));
paint(g, '4', (x, y) => interior(x, y, wallH(B.Bm, B.Rr, x, y), 1));
// goods inside: grain sacks, crates, a barrel, a heap of gold
const onL = (t, dx, h, s) => { const p = lerp(B.L, B.Bm, t); pixStamp(g, Math.round(p[0]) + dx, Math.round(p[1]) - h, s); };
const onR = (t, dx, h, s) => { const p = lerp(B.Bm, B.Rr, t); pixStamp(g, Math.round(p[0]) + dx, Math.round(p[1]) - h, s); };
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
onL(0.12, -3, 9, SACKS); onL(0.7, -4, 9, CRATES); onL(0.86, -2, 8, BARREL);
onR(0.2, -4, 6, GOLD); onR(0.55, -4, 9, CRATES); onR(0.82, -3, 8, BARREL);
// hearth: a stone ring with the fire (flames are per frame), glow on the back planks
onL(0.42, -4, 4, `
.kkkkkkk.
kSqjjjqSk
.kQQQQQk.
`);
// pillars: stone base, three-tone timber shaft, flared capital; lintel beam on top
const pillar = (p, lit) => {
  const x = Math.round(p[0]), y = Math.round(p[1]);
  const [a, b, c] = lit ? ['t', 'u', 'v'] : ['u', 'v', 'V'];
  for (let yy = y - Z + 3; yy < y - 2; yy++) { pixSet(g, x - 1, yy, a); pixSet(g, x, yy, b); pixSet(g, x + 1, yy, c); pixSet(g, x - 2, yy, 'k'); pixSet(g, x + 2, yy, 'k'); }
  pixStamp(g, x - 2, y - 3, lit ? `
kSqQk
kqQjk
` : `
kqQjk
kQjjk
`);
  pixStamp(g, x - 3, y - Z + 1, lit ? `
ktttuvk
.kuuvk.
` : `
kuuvvVk
.kvvVk.
`);
};
for (let k = 0; k <= 6; k++) pillar(lerp(B.L, B.Bm, k / 6), true);
for (let k = 1; k <= 6; k++) pillar(lerp(B.Bm, B.Rr, k / 6), false);
for (const [a, b, c1, c2] of [[hall.L, hall.Bm, 't', 'u'], [hall.Bm, hall.Rr, 'u', 'v']]) { line(g, a, b, 'k', 0); line(g, a, b, c1, 1); line(g, a, b, c2, 2); line(g, a, b, 'k', 3); }
// team banners hanging from the lintel in two front bays
const BANNER = `
kkkkkkk
kDTTTDk
kTTLTTk
kTLLLTk
kTTLTTk
kTTTTTk
kTTTTTk
kDTTTDk
.kDTDk.
..kDk..
...k...
`;
onL(0.25, -3, Z - 6, BANNER); onL(0.583, -3, Z - 6, BANNER); onR(0.417, -3, Z - 6, BANNER);

// ---- the big roof: hipped, red tile in courses with lit lips, rounded hip caps, finial; eave overhang casts shadow
const R = { L: [hall.L[0] - 2, hall.L[1] + 2], Bm: [hall.Bm[0], hall.Bm[1] + 3], Rr: [hall.Rr[0] + 2, hall.Rr[1] + 2], T: [hall.T[0], hall.T[1] - 1] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '5', left: '6', front: '7', right: '8' });
paint(g, '6', (x, y) => course(x, y, -0.5, { h: 4, w: 5, joint: 'c', lip: 'g', seam: 'c', tones: ['b', 'b', 'g'] }));
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 4, w: 5, joint: 'd', lip: 'b', seam: 'd', tones: ['c', 'c', 'b'] }));
paint(g, '5', (x, y) => course(x, y, 0.5, { h: 4, w: 5, joint: 'd', lip: 'c', seam: 'd', tones: ['a', 'c'] }));
paint(g, '8', (x, y) => course(x, y, -0.5, { h: 4, w: 5, joint: 'e', lip: 'a', seam: 'e', tones: ['d', 'd', 'a'] }));
line(g, R.L, R.Bm, 'e', 0); line(g, R.Bm, R.Rr, 'e', 0);
// hip caps: a lit roll with an ink crease
for (const [P, lit] of [[R.L, 1], [R.Bm, 1], [R.Rr, 0], [R.T, 0]]) { line(g, P, ap, 'k'); line(g, [P[0] - 1, P[1]], [ap[0] - 1, ap[1]], lit ? 'h' : 'b'); }
pixStamp(g, ap[0] - 2, ap[1] - 6, `
..k..
.kGk.
.knk.
kgbck
.kek.
`);
// dormers with lit windows on the two front slopes
const DORM = `
....kk....
...kghk...
..kgbbck..
.kgbkkbck.
kgbkiOkbck
kkkkiykkkk
..kkiOkk..
..ktkkuk..
`;
const DORMR = `
....kk....
...kbck...
..kbcdek..
.kbckkdek.
kbckiokdek
kkkkiokkkk
..kkiikk..
..kukkvk..
`;
for (const t of [0.3, 0.7]) { const p = lerp(lerp(R.L, R.Bm, t), ap, 0.3); pixStamp(g, Math.round(p[0]) - 5, Math.round(p[1]) - 5, DORM); }
{ const p = lerp(lerp(R.Bm, R.Rr, 0.35), ap, 0.3); pixStamp(g, Math.round(p[0]) - 5, Math.round(p[1]) - 5, DORMR); }
// chimney on the back-right slope
const chb = lerp(lerp(R.T, R.Rr, 0.5), ap, 0.35);
const chTop = pixIsoBox(g, chb[0], chb[1], 0.22, 0.22, 13, 1, { top: 'j', left: '9', right: '0' });
paint(g, '9', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'Q', tones: ['S', 'q'] }));
paint(g, '0', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'j', tones: ['q', 'Q'] }));
pixRect(g, chTop.T[0] - 1, chTop.T[1] + 1, 4, 2, 'k');

// ---- side tower on the right corner tile: coursed stone, quoins, recessed lit windows, team banner, tile cap
const tw = pixIsoBox(g, bx + 64, by - PL - 32, 1, 1, TZ, 1, { left: '!', right: '@' });
const TB = tw.base;
paint(g, '!', (x, y) => course(x, y, 0.5, { h: 4, w: 7, joint: 'q', seam: 'q', lip: 's', tones: ['S', 'S', 's', 'q'] }));
paint(g, '@', (x, y) => course(x, y, -0.5, { h: 4, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q', 'S'] }));
for (let k = 0; k < TZ - 2; k += 4) { const o = (k / 4) % 2 ? 2 : 0; pixRect(g, TB.Bm[0] - 3 - o, TB.Bm[1] - k - 4, 3 + o, 3, 's'); pixRect(g, TB.Bm[0], TB.Bm[1] - k - 4, 3 + (2 - o), 3, 'q'); }
line(g, TB.Bm, tw.Bm, 'k');
const TWIN = `
..k..
.kik.
kiOik
kOyik
kOyik
kiOik
kSSSk
`;
const TWINR = `
..k..
.kik.
kiiik
kioik
kioik
kiiik
kqqqk
`;
{ const p = lerp(TB.L, TB.Bm, 0.3); pixStamp(g, p[0] - 2, p[1] - 36, TWIN); pixStamp(g, p[0] - 2, p[1] - 22, TWIN); }
{ const p = lerp(TB.Bm, TB.Rr, 0.7); pixStamp(g, p[0] - 2, p[1] - 36, TWINR); }
{ const p = lerp(TB.L, TB.Bm, 0.72); pixStamp(g, p[0] - 3, p[1] - 38, `
kkkkkkk
kDTTTDk
kTTLTTk
kTLLLTk
kTTLTTk
kTTTTTk
kTTTTTk
kTTTTTk
kDTTTDk
kTDTDTk
.k.k.k.
`); }
const tR = { L: [tw.L[0] - 2, tw.L[1] + 1], Bm: [tw.Bm[0], tw.Bm[1] + 2], Rr: [tw.Rr[0] + 2, tw.Rr[1] + 1], T: [tw.T[0], tw.T[1] - 1] };
const tap = pixIsoRoof(g, tR, 12, 1, { back: '5', left: '6', front: '7', right: '8' });
paint(g, '6', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'c', lip: 'g', tones: ['b'] }));
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'd', lip: 'b', tones: ['c'] }));
paint(g, '5', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'd', tones: ['a'] }));
paint(g, '8', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'e', lip: 'a', tones: ['d'] }));
line(g, tR.L, tR.Bm, 'e'); line(g, tR.Bm, tR.Rr, 'e'); line(g, tR.Bm, tap, 'k'); line(g, [tR.Bm[0] - 1, tR.Bm[1]], [tap[0] - 1, tap[1]], 'h');
// barrels and a sack on the plinth by the front-left
pixStamp(g, pl.L[0] + 14, pl.L[1] + 1, `
.kkkk.kk..
kuttukwWk.
kvvvvkWxk.
kuttukkkk.
.kkkk.....
`);

const base = outline(g, 'k', { S: 'q', g: 'b', h: 'b', s: 'S', p: 'P' });

// ---- idle: 6 frames — hearth fire flickers and throws a pulsing glow; chimney smoke rises
const H0 = [Math.round(HEARTH[0]), Math.round(HEARTH[1]) - 4];
const FLAMES = [`
..y..
.yOy.
yOYOy
`, `
.y...
.Oyy.
yOYOy
`, `
...y.
.yyO.
yOYOy
`];
const sx = Math.round(chTop.T[0]), sy = Math.round(chTop.T[1]);
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  const R2 = [6, 7, 5, 8, 6, 7][i];
  paint(f, 'IJ', (x, y) => { const d = Math.hypot((x - H0[0]) * 0.8, (y - H0[1]) * 1.4); return d < R2 * 0.55 ? 'O' : d < R2 ? 'o' : null; });
  pixStamp(f, H0[0] - 2, H0[1] - 2, FLAMES[i % 3]);
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
    p: '#b3aa98', P: '#978e7e',                                         // paving
    t: '#a07a4a', u: '#8a6a3a', v: '#5a3a18', V: '#3b2614',             // timber
    i: '#1f1610', I: '#4a3422', J: '#6a4e32', f: '#6e5a42', F: '#8f785a', // interior: dark, planks, floor
    o: '#7a4a26', O: '#d8813a', y: '#ffc95a', Y: '#fff0b0',             // glow, fire
    g: '#d8805c', h: '#eea582', b: '#b85a3e', c: '#a0482e', a: '#8a3a2a', d: '#73301f', e: '#4e2016', // roof tiles
    w: '#efe6d2', W: '#d9c7a0', x: '#a8946e',                           // sacks
    G: '#ffe28a', n: '#e1b12c', N: '#a87a12',                           // gold
    z: '#e4e0da', Z: '#c4beb8', X: '#948e88',                           // smoke
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
