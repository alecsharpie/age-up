// @pixel archery
// Archery Range (3×3): a packed-earth range on a low plinth. Along the back-left edge an open timber shooting shed
// under a lean-to awning striped in team colour and canvas, with a scalloped valance; bows and quivers hang inside.
// Worn shooting lanes lead to three straw butts on A-frame stands (red/white rings, gold centre) with arrows stuck
// in them; a rail fence with a gap and an arrow barrel at the shooting line. Generated (code before export); anchor = footprint
// bottom corner. idle: 4 frames — the awning valance flutters.
//   Feudal   (as above) the striped team awning over an open timber shed.
//   Castle   the shed becomes a range house: a dressed-stone ground storey opening on the range through round arches (bows
//            racked inside), a timber-framed upper band, a hipped red-tile roof with ridge tiles and an iron finial, team
//            banners on the piers and the end wall; an arched team door.
//   Imperial a limestone gallery: taller arcade with gilt keystones and pilasters, round windows above, a hipped slate roof
//            with gilt cresting and orb finials, a lantern cupola over the middle, gilt-fringed banners; a low limestone
//            balustrade replaces the rail fence.
//   (Castle/Imperial idle: the banners ripple.)
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
const W = 3, H = 3, Z = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44 + [0, 0, 18, 37][AGE];
const bx = W * 32 + 2, by = GH - 4, OY = by - 136;          // OY: extra headroom of the taller ages (fixed coordinates below shift by it)
// ---- local texture kit (needs GW, GH, by) ----
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const P = (p, dx = 0, dy = 0) => [p[0] + dx, p[1] + dy];
const hash = (x, y, s = 0) => { let h = Math.imul((x | 0) + 7919 * s, 374761393) ^ Math.imul((y | 0) - 104729 * s, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// smooth value noise on a lattice of `sc` cells (for clustered ground patches, never per-pixel noise)
const vnoise = (x, y, sc, s) => { const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0; const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s); const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
/** cells whose centre lies inside the polygon (same rule as pixPoly) */
function cells(pts) {
  const out = []; const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(GH - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [qx, qy] = pts[(i + 1) % pts.length]; if ((ay <= cy && qy > cy) || (qy <= cy && ay > cy)) xs.push(ax + (cy - ay) / (qy - ay) * (qx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(GW - 1, Math.floor(xs[k + 1] - 0.5)); x++) out.push([x, y]);
  }
  return out;
}
const put = (g, x, y, ch) => { if (ch && y >= 0 && y < GH && x >= 0 && x < GW) g[y][x] = ch; };
/** vertical wall face whose top edge runs A→B, z cells tall. fn(a, v, u, x, y): a = columns from A, v = rows below the top edge. */
function wall(g, A, B, z, fn) {
  const a0 = Math.floor(A[0]);
  for (const [x, y] of cells([A, B, P(B, 0, z), P(A, 0, z)])) { const u = Math.max(0, Math.min(1, (x + 0.5 - A[0]) / (B[0] - A[0]))); const ty = A[1] + u * (B[1] - A[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(y + 0.5 - ty)), u, x, y)); }
}
/** sloped plane (roof): fn(a, d, u, x, y) with d = rows above the eave line E0→E1, a = columns from E0.
 *  flip: the plane slopes away from the viewer (a back roof slope whose eave sits above its ridge on screen), so downhill is
 *  up the screen and d counts rows *below* the eave instead; course helpers like tiles() then lap the right way. */
function plane(g, pts, E0, E1, fn, flip = false) {
  const a0 = Math.floor(E0[0]);
  for (const [x, y] of cells(pts)) { const u = (x + 0.5 - E0[0]) / (E1[0] - E0[0]); const ey = E0[1] + u * (E1[1] - E0[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(flip ? y + 0.5 - ey : ey - y - 0.5)), u, x, y)); }
}
/** coursed ashlar: o = {t:[lit,mid,dark], m:mortar, ch, bw, s, q:[quoinLit,quoinDark]?, qa:[a-ranges at corners], len, ao} */
const stone = o => (a, v, u) => {
  const c = Math.floor(v / o.ch), r = v % o.ch;
  if (o.q && o.len) { const w = c % 2 ? 4 : 7; if (o.qL && a < w || o.qR && a >= o.len - w) { if (r === o.ch - 1 || a === w && o.qL || a === o.len - w && o.qR) return o.m; return r === 0 ? o.q[0] : o.q[1]; } }
  if (r === o.ch - 1) return o.m;
  const off = c % 2 ? (o.bw >> 1) : 0, j = a + off + c * 3;
  if (((j % o.bw) + o.bw) % o.bw === 0) return o.m;
  const t = hash(Math.floor(j / o.bw), c, o.s) + (o.ao ? v / o.ao * 0.3 : 0);
  const k = t < 0.3 ? 0 : t < 0.85 ? 1 : 2;
  return r === 0 ? o.t[Math.max(0, k - 1)] : o.t[k];
};
/** horizontal planks following the face: o = {t:[lit,mid,seam], ph, s, nail} */
const planks = o => (a, v) => { const r = v % o.ph, c = Math.floor(v / o.ph); if (r === o.ph - 1) return o.t[2]; if (o.nail && r === 1 && ((a + c * 5) % 11) === 0) return o.nail; const gr = hash(Math.floor((a + c * 7) / 9), c, o.s); return r === 0 ? o.t[0] : (gr < 0.25 ? o.t[0] : o.t[1]); };
/** vertical boards (doors, sheds): o = {t:[lit,mid,seam], bw} */
const boards = o => (a, v) => { const k = ((a % o.bw) + o.bw) % o.bw; return k === o.bw - 1 ? o.t[2] : k === 0 ? o.t[0] : o.t[1]; };
/** roof courses (tiles / shingles): o = {t:[lip,mid,shadow], ch, tw, s}; lip on the butt edge, shadow cast by the course above */
const tiles = o => (a, d) => { const c = Math.floor(d / o.ch), r = d % o.ch; if (r === o.ch - 1) return o.t[2]; const j = a + (c % 2) * (o.tw >> 1); if (r > 0 && ((j % o.tw) + o.tw) % o.tw === 0) return o.t[2]; if (r === 0) return o.t[0]; return (o.t[3] && hash(Math.floor(j / o.tw), c, o.s) < 0.18) ? o.t[3] : o.t[1]; };
/** outer 1-px ink outline; lit (upper-left) side softer. Pixels of `self` chars are thin props that carry their own dark edge. */
function outline(g, ink, inkLit, self = '') {
  const add = [];
  for (let y = 0; y < Math.min(GH, by); y++) for (let x = 0; x < GW; x++) {
    if (g[y][x] !== '.') continue;
    const sol = (xx, yy) => yy >= 0 && yy < GH && xx >= 0 && xx < GW && g[yy][xx] !== '.' && !self.includes(g[yy][xx]);
    const r = sol(x + 1, y), d = sol(x, y + 1), l = sol(x - 1, y), u = sol(x, y - 1);
    if (r || d || l || u) add.push([x, y, (r || d) && !(l || u) ? inkLit : ink]);
  }
  for (const [x, y, c] of add) g[y][x] = c;
}
const copy = g => g.map(r => r.slice());
/** draw into a fresh layer, ink its outline, composite it: props and masses get their own dark edge inside the silhouette */
function inked(g, draw, ink = 'k', inkLit = 'K', self = '') { const t = pixGrid(GW, GH); draw(t); outline(t, ink, inkLit, self); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (t[y][x] !== '.') g[y][x] = t[y][x]; }
const stampL = (g, x, y, text) => pixStamp(g, Math.round(x), Math.round(y), text);
// ---- natural edges (HOLISTIC.md "Natural lines"): grass over the wall foot, weathered faces, sagging lines ----
// Cyrillic chars so they never collide with a generator's letters or the age kit's Greek; merge NAT into the palette.
const NAT = { 'ж': '#7cb85a', 'г': '#4f9a42', 'д': '#33702c', 'Д': '#22461c',      // grass tuft light / mid / dark, its ink edge
  'м': '#8c9462', 'л': '#6a7250', 'ь': '#4f5640' };                                    // moss / lichen lit, shade, deep
const mod = (a, n) => ((a % n) + n) % n;
/** lowest opaque cell of column x (the wall foot on the silhouette), or -1 */
function footRow(g, x) { for (let y = GH - 1; y >= 0; y--) if (g[y][x] !== '.') return y; return -1; }
/** grass tufts growing over the foot of the walls along the bottom silhouette: clustered, 1–3 px blades.
 *  o.dens (share of columns, clustered), o.h (max blade), o.s seed, o.skip(x, y, ch) → leave a column bare. */
function tufts(g, o = {}) {
  const dens = o.dens ?? 0.4, s = o.s ?? 1, mh = o.h ?? 3;
  for (let x = 0; x < GW; x++) {
    const y = footRow(g, x); if (y < 0 || (o.skip && o.skip(x, y, g[y][x]))) continue;
    const n = vnoise(x, 0, 5, s); if (n > dens) continue;
    const hh = 1 + Math.floor(hash(x, 7, s) * mh * (1.15 - n / dens * 0.6));
    for (let k = 0; k < hh; k++) put(g, x, y - k, k === hh - 1 && hh > 1 ? 'ж' : k === 0 ? 'д' : 'г');
  }
}
/** after the outline: the ink under a tuft becomes the grass's own dark edge, so the wall foot is not one ruler line */
function tuftInk(g) {
  for (let y = 1; y < GH; y++) for (let x = 0; x < GW; x++) if ((g[y][x] === 'k' || g[y][x] === 'K') && 'дгж'.includes(g[y - 1][x])) g[y][x] = 'Д';
}
/** wrap a wall face fn(a, v, u, x, y) (v rows from the top, H tall): damp and moss creep up from the foot in clusters and
 *  rain streaks run down from the top. o.dark {ch: darker}, o.moss {ch: mossCh} (optional), o.mh max moss rows, o.st
 *  streak share, o.top first streak row, o.s seed. Only chars listed in o.dark are touched (openings and cloth stay clean). */
const weathered = (fn, H, o) => (a, v, u, x, y) => {
  const c = fn(a, v, u, x, y); if (!c || !(c in o.dark)) return c;
  const s = o.s ?? 3, fb = H - 1 - v, X = x ?? a, Y = y ?? v;
  const n = vnoise(X, 0, 5, s), mh = Math.floor(n * n * (o.mh ?? 4) * 1.6 + 0.5);
  if (fb < mh) return o.moss && vnoise(X, Y, 3, s + 7) > 0.56 ? o.moss[c] || o.dark[c] : o.dark[c];   // damp foot, moss in clumps
  const sl = 3 + Math.floor(hash(X, 5, s) * 7), t0 = o.top ?? 1;
  if (hash(X, 1, s) < (o.st ?? 0.07) && v >= t0 && v < t0 + sl) return v < t0 + sl - 2 || hash(X, v, s) < 0.5 ? o.dark[o.dark[c]] || o.dark[c] : o.dark[c];   // rain streak
  return c;
};
/** points along a→b with a sag of `depth` rows in the middle (a sine arc) */
const sagAt = (u, depth) => Math.round(depth * Math.sin(Math.PI * Math.max(0, Math.min(1, u))));
/** sag an interior line (a ridge between two roof planes) by `depth` rows: the plane above flows down over the dip, then
 *  draw(x, y) paints the line at its new place (call with each column's sagged y). */
function sagLine(t, a, b, depth, draw) {
  const x0 = Math.round(Math.min(a[0], b[0])), x1 = Math.round(Math.max(a[0], b[0]));
  for (let x = x0; x <= x1; x++) {
    const u = (x - a[0]) / (b[0] - a[0]), y = Math.round(a[1] + u * (b[1] - a[1])), dy = sagAt(u, depth);
    for (let k = 0; k < dy; k++) put(t, x, y + k, t[y - 1] ? t[y - 1][x] : '.');
    draw(x, y + dy);
  }
}
const g = pixGrid(GW, GH);
const tile = (tx, ty) => [bx + (tx - ty) * 32, by - 96 + (tx + ty) * 16 + 16];
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- ground: packed earth in patches, three worn lanes from the shed to the butts, a chalk shooting line
for (const [x, y] of cells([T, Rr, Bm, L])) { const n = vnoise(x, y, 8, 2); g[y][x] = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : 'y'; }
// (tile() sits ~0.56 tile in from the footprint's back corner, so the front lane and butt use ty 2.25, not 2.5, to stay on the plinth)
const LANE = [0.5, 1.5, 2.25];
for (let ty = 0; ty < 3; ty++) {
  const a = tile(0.75, LANE[ty]), b = tile(2.35, LANE[ty]);
  for (const [x, y] of cells([P(a, -4, -2), P(b, -4, -2), P(b, 4, 2), P(a, 4, 2)])) { const n = vnoise(x, y, 4, 7 + ty); if (g[y][x] !== '.') g[y][x] = n > 0.45 ? 'j' : 'y'; }
}
{ const a = tile(0.62, 0.15), b = tile(0.62, 2.55); for (let k = 0; k <= 40; k++) if (k % 4 < 3) { const p = lerp(a, b, k / 40), x = Math.round(p[0]), y = Math.round(p[1]); if ('yYj'.includes(g[y][x])) g[y][x] = 'B'; } }   // chalk only on the range floor, not past the plinth edge
for (let i = 0; i < 18; i++) { const p = lerp(tile(0.5, 0.2), tile(0.5, 2.5), hash(i, 81)), x = Math.round(p[0] + (hash(i, 82) - 0.5) * 8), y = Math.round(p[1] + (hash(i, 83) - 0.5) * 4);   // boot prints where the archers stand
  if (g[y] && 'yYj'.includes(g[y][x]) && 'yYj'.includes(g[y][x + 1])) { g[y][x] = 'J'; g[y][x + 1] = 'Y'; } }
for (const [x, y0] of [[120, 70], [64, 112], [150, 100], [92, 92], [176, 90]]) { const y = y0 + OY; g[y][x] = 'J'; g[y][x + 1] = 'Y'; }

// ---- straw butts: a disc in the plane that faces the shed (sheared ellipse), bale thickness behind, A-frame stand
// Clean concentric rings (straw rim, white, red, white, red, gold), a splayed A-frame with a crossbar and a back prop, a
// contact shadow on the earth, and one or two arrows drawn after the inking so their fletching stays crisp.
function buttShadow(c) { for (const [x, y] of cells([P(c, -5, 12), P(c, 3, 9), P(c, 12, 12), P(c, 4, 15)])) if ('yYj'.includes(g[y][x])) g[y][x] = 'J'; }
function butt(t, c) {
  const R = 6.6, AX = 0.82;
  const disc = (ox, oy, fn) => { for (let y = Math.floor(c[1] - 10); y <= c[1] + 10; y++) for (let x = Math.floor(c[0] - 9); x <= c[0] + 9; x++) { const U = (c[0] + ox - x - 0.5) / AX, V = c[1] + oy - (y + 0.5); const r = Math.hypot(U, V); if (r < R) put(t, x, y, fn(r, U, V)); } };
  // back prop first (behind the bale), then the bale side, then the painted face, then the front legs
  for (let s = 3; s >= 1; s--) disc(s * 0.9, s * 0.3, () => s === 3 ? 'e' : 'E');
  disc(0, 0, (r, U, V) => r > 5.4 ? (V - U > 2 ? 'h' : V - U < -3 ? 'E' : 'H') : r > 4.3 ? 'A' : r > 3.1 ? 'r' : r > 1.9 ? 'A' : r > 0.9 ? 'r' : 'g');
}
// the stand: thin 1-px timbers drawn after the inking (splayed front legs, a back prop behind the bale)
function stand(c) {
  const bk = (x, y) => { if (g[y][x] === 'J' || 'yYj'.includes(g[y][x])) g[y][x] = 'u'; };
  { const a = P(c, 4, 4), b = P(c, 7, 12); for (let k = 0; k <= 8; k++) { const p = lerp(a, b, k / 8); bk(Math.round(p[0]), Math.round(p[1])); } }
  pixLine(g, c[0] - 2, c[1] + 6, c[0] - 4, c[1] + 12, 'u'); pixLine(g, c[0] + 1, c[1] + 6, c[0] + 3, c[1] + 12, 'u');
}
function arrow(x, y) { pixLine(g, x, y, x - 3, y - 1, 'W'); pixSet(g, x, y, 'u'); pixSet(g, x - 4, y - 2, 'A'); pixSet(g, x - 5, y - 2, 'A'); pixSet(g, x - 5, y - 3, 'a'); pixSet(g, x - 4, y - 1, 'a'); }
const butts = [[tile(2.25, 0.5), [[-2, -2]]], [tile(2.25, 1.5), [[-1, 1], [-2, -3]]], [tile(2.05, 2.15), [[-2, 2]]]];
for (const [p] of butts) buttShadow(P(p, 0, -12));
for (const [p, ar] of butts) { const c = P(p, 0, -12); inked(g, t => butt(t, c)); stand(c); for (const [dx, dy] of ar) arrow(Math.round(c[0] + dx), Math.round(c[1] + dy)); }

// ---- an arrow barrel at the shooting line by the shed's open end (iron-hooped staves, a sheaf of fletched arrows)
inked(g, t => {
  stampL(t, 52, 100 + OY, `
.A..T..A.
.AA.T.AA.
..W.W.W..
..W.W.W..
.uWuWuWu.
uiiiiiiiu
Wuuuuuuut
WGGGGGGGt
Wwwwwwwwt
WwwwwwwWt
WGGGGGGGt
.wwwwwwt.
`);
});

// ---- the shooting shed: lean-to awning on posts, plank end wall, open front onto the range
const SB = [34, 102 + OY];
const sh = pixIsoBox(g, SB[0], SB[1], 1, 3, 14, 1, {});
const LR = P(sh.L, 0, -6), TR = P(sh.T, 0, -6);                   // raised back edge of the awning
const NS = 12;
const stripeAt = (x, y) => {                                      // which stripe (0..NS-1) a cell of the awning lies in
  const ex = sh.Rr[0] - sh.Bm[0], ey = sh.Rr[1] - sh.Bm[1], dx = LR[0] - sh.L[0] + (sh.L[0] - sh.Bm[0]), dy = LR[1] - sh.L[1] + (sh.L[1] - sh.Bm[1]);
  const px = x + 0.5 - sh.Bm[0], py = y + 0.5 - sh.Bm[1], det = ex * dy - ey * dx; const s = (px * dy - py * dx) / det; return Math.max(0, Math.min(NS - 1, Math.floor(s * NS)));
};
if (AGE === 1) inked(g, t => {
  // interior seen through the open front: the back wall's planks in shadow, floor strip
  wall(t, sh.Bm, sh.Rr, 14, (a, v) => v < 3 ? 'I' : v >= 12 ? 'Y' : v % 3 === 2 ? 'I' : 'i');
  // bows and quivers hanging on the back wall
  for (let k = 0; k < 5; k++) { const p = lerp(sh.Bm, sh.Rr, (k + 0.6) / 6); const x = Math.round(p[0]), y = Math.round(p[1]) + 3;
    if (k % 2 === 0) { pixLine(t, x, y, x - 1, y + 2, 'W'); pixLine(t, x - 1, y + 3, x - 1, y + 5, 'W'); pixLine(t, x - 1, y + 6, x, y + 8, 'W'); pixLine(t, x + 1, y, x + 1, y + 8, 'B'); }
    else { pixRect(t, x - 1, y + 2, 3, 6, 'T'); pixSet(t, x + 1, y + 3, 'D'); pixSet(t, x + 1, y + 5, 'D'); pixSet(t, x + 1, y + 7, 'D'); pixSet(t, x - 1, y + 1, 'A'); pixSet(t, x + 1, y + 1, 'r'); pixSet(t, x, y, 'A'); } }
  // a bench along the opening
  { const a = lerp(sh.Bm, sh.Rr, 0.15), b = lerp(sh.Bm, sh.Rr, 0.55); pixLine(t, a[0], a[1] + 9, b[0], b[1] + 9, 'W'); pixLine(t, a[0], a[1] + 10, b[0], b[1] + 10, 'u'); }
  // posts: lit left edge, shaded body, a stone pad
  for (let k = 0; k <= 6; k++) { const p = lerp(sh.base.Bm, sh.base.Rr, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x - 1, y - 15, 1, 15, 'w'); pixRect(t, x, y - 15, 1, 15, 't'); pixSet(t, x - 1, y, 'J'); pixSet(t, x, y, 'J'); }
  // the plank end wall (lit) with a little window, and the end of the lean-to above it
  wall(t, sh.L, sh.Bm, 14, (a, v) => (a >= 13 && a <= 18 && v >= 4 && v <= 7) ? (v === 7 ? 'W' : v === 4 || a === 13 || a === 18 ? 'u' : 'I') : v >= 12 ? 'u' : boards({ t: ['W', 'w', 't'], bw: 4 })(a, v));
  for (const [x, y] of cells([sh.L, sh.Bm, LR])) t[y][x] = (x % 4 === 3) ? 't' : 'W';
  pixLine(t, sh.L[0], sh.L[1], sh.Bm[0], sh.Bm[1], 'u');
  pixLine(t, sh.Bm[0], sh.Bm[1], sh.Bm[0], sh.Bm[1] + 13, 'u');
  // the awning: stripes of team colour and canvas, lighter towards the raised back edge
  plane(t, [LR, TR, sh.Rr, sh.Bm], sh.Bm, sh.Rr, (a, d, u, x, y) => { const s = stripeAt(x, y), team = s % 2 === 0; const lvl = d > 24 ? 0 : d < 4 ? 2 : 1; return team ? ['L', 'T', 'D'][lvl] : ['A', 'B', 'a'][lvl]; });
  pixLine(t, LR[0], LR[1], TR[0], TR[1], 'u');
  pixLine(t, LR[0], LR[1], sh.Bm[0], sh.Bm[1], 'D');
});

// ---- Castle / Imperial: the range house on the same plot as the shed
const RH = { Z: [0, 0, 24, 27][AGE], RISE: [0, 0, 13, 18][AGE] }, BAND = 16;   // taller walls leave room for the awning over the arch heads
const { R: AR, S: AS, Au, Fe, Gl, DEEP } = AK;
const hs = (u, v, z) => [SB[0] + 32 * (v - u), SB[1] - 16 * (u + v) - z];           // house space: u 0..1 deep, v 0..3 long
const BAYS = 6, BW = 16;
const opening = (a, h) => {                                                            // arcade openings on the long face: [su, n, top] or null
  const k = Math.floor(a / BW), su = a - k * BW - 4, n = 9, top = AGE === 3 ? 14 : 11;
  if (k < 0 || k >= BAYS || su < 0 || su > n || h > top) return null;
  const c = n / 2, r = n / 2, dh = h - (top - r); if (dh > 0 && Math.hypot(su - c, dh * 1.15) > r + 0.3) return null;
  return [su, n, top, k];
};
const bannerAt = AGE >= 2 ? [[-1, 'L']] : [];                                          // the end wall's banner (the long face has the awning)
function houseWall(lit, len) {
  return (a, v) => {
    const h = RH.Z - 1 - v;
    if (!lit) {
      const op = opening(a, h);
      if (op) {
        const [su, n, top, k] = op, edge = su === 0 || su === n || h >= top - 1 || !opening(a, h + 1);
        if (edge) return AGE === 3 && su === Math.round(n / 2) && h >= top - 1 ? Au[0] : su === 0 ? AS[3] : AS[1];
        if (h === 0) return AS[2];                                                     // sill / step
        if (su === 1 || h === top - 2) return DEEP;
        if (h === 1) return 'Y';                                                       // the floor inside
        if ((k === 1 || k === 4) && su >= 3 && su <= 6) { const bow = Math.round(3.5 + Math.abs(h - 5) * 0.35); if (su === bow + 1) return 'W'; if (su === 6 && h >= 2 && h <= 8) return 'B'; }
        if (k === 2 && su >= 3 && su <= 5 && h >= 2 && h <= 7) return su === 4 ? 'T' : su === 3 ? 'D' : 'D';   // a quiver
        return h > top - 4 ? DEEP : 'I';
      }
      if (AGE === 3 && h >= 17 && h <= 20 && false) {                                            // round windows above each pier... between bays
        const k = Math.floor(a / BW), c = k * BW + 8.5, d = Math.hypot(a + 0.5 - c, (h - 18.5) * 1.2);
        if (d < 1.4) return h >= 19 ? Gl[1] : Gl[0]; if (d < 2.4) return AS[1];
      }
    }
    if (lit) {                                                                           // the end wall: an arched team door
      const su = a - 11, n = 10, top = AGE === 3 ? 15 : 12;
      if (su >= 0 && su <= n && h <= top) {
        const c = n / 2, dh = h - (top - c);
        if (!(dh > 0 && Math.hypot(su - c, dh * 1.15) > c + 0.3)) {
          if (su === 0 || su === n || (dh > 0 && Math.hypot(su - c, (dh + 1) * 1.15) > c + 0.3)) return AGE === 3 && su === 5 ? Au[0] : AS[0];
          if (h === 3 || h === top - 4) return Fe[1];
          return su === 1 ? 'L' : su === n - 1 ? 'D' : su === 5 ? 'D' : 'T';
        }
      }
    }
    if (AGE === 2 && h >= BAND) {                                                          // timber-framed upper band over the stone storey
      const step = 8; if (h === BAND || h === RH.Z - 1) return AK.W[lit ? 0 : 1]; if (a % step < 2 || a <= 1 || a >= len - 2) return AK.W[(a % step) === 1 || !lit ? 2 : 1];
      if (h === BAND + 3 && (a % step) >= 2) return AK.W[lit ? 1 : 2];
      return AK.P[lit ? 0 : 1];
    }
    return AK.wallTex(a, h, lit ? 0 : 1, { len, H: AGE === 2 ? BAND : RH.Z, step: 16, pl: 2 });
  };
}
let RIDGE = null;
if (AGE >= 2) {
  inked(g, t => {
    const E = { Bm: hs(0, 0, RH.Z), L: hs(1, 0, RH.Z), Rr: hs(0, 3, RH.Z), T: hs(1, 3, RH.Z) };
    wall(t, hs(1, 0, RH.Z), hs(0, 0, RH.Z), RH.Z, houseWall(true, 32));
    wall(t, hs(0, 0, RH.Z), hs(0, 3, RH.Z), RH.Z, houseWall(false, 96));
    pixLine(t, E.Bm[0], E.Bm[1], E.Bm[0], E.Bm[1] + RH.Z - 1, AS[4]);
    if (AGE === 3) { AK.trim(t, E.L, E.Bm, 2); AK.trim(t, E.Bm, E.Rr, 2); }
    // hipped roof overhanging 2 px: back slope and far hip first (they slope away: flip), then the near hip and the front slope
    const o = 2, r1 = hs(0.5, 0.5, RH.Z + RH.RISE), r2 = hs(0.5, 2.5, RH.Z + RH.RISE);
    const OE = { Bm: [E.Bm[0], E.Bm[1] + o], L: [E.L[0] - 2 * o, E.L[1]], Rr: [E.Rr[0] + 2 * o, E.Rr[1]], T: [E.T[0], E.T[1] - o] };
    pixPoly(t, [OE.L, OE.T, r2, r1], '1'); pixPoly(t, [OE.T, OE.Rr, r2], '2'); pixPoly(t, [OE.L, OE.Bm, r1], '3'); pixPoly(t, [OE.Bm, OE.Rr, r2, r1], '4');
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = t[y][x];
      if (c === '1') t[y][x] = AK.roofXY(x, y, -0.5, 2, { flip: true }); else if (c === '2') t[y][x] = AK.roofXY(x, y, 0.5, 3, { flip: true });
      else if (c === '3') t[y][x] = AK.roofXY(x, y, 0.5, 0); else if (c === '4') t[y][x] = AK.roofXY(x, y, -0.5, 1); }
    pixLine(t, OE.L[0], OE.L[1], OE.Bm[0], OE.Bm[1], AR[3]); pixLine(t, OE.L[0], OE.L[1] + 1, OE.Bm[0], OE.Bm[1] + 1, AR[6]);
    pixLine(t, OE.Bm[0], OE.Bm[1], OE.Rr[0], OE.Rr[1], AR[5]); pixLine(t, OE.Bm[0], OE.Bm[1] + 1, OE.Rr[0], OE.Rr[1] + 1, AR[6]);
    pixLine(t, OE.Bm[0], OE.Bm[1], r1[0], r1[1], AR[1]); pixLine(t, OE.Bm[0] + 1, OE.Bm[1], r1[0] + 1, r1[1], AR[5]);
    pixLine(t, OE.L[0], OE.L[1], r1[0], r1[1], AR[2]);
    if (AGE === 3) { AK.trim(t, [OE.L[0] + 1, OE.L[1]], OE.Bm, -1); AK.trim(t, OE.Bm, [OE.Rr[0] - 1, OE.Rr[1]], -1); }
    AK.crest(t, r1, r2); AK.crest(t, lerp(OE.Bm, r1, 0.15), r1);
    RIDGE = [r1, r2];
  });
  // finials at the hip ends; Imperial: a lantern cupola astride the middle of the ridge
  inked(g, t => {
    AK.finial(t, Math.round(RIDGE[0][0]), Math.round(RIDGE[0][1]) - 2);
    AK.finial(t, Math.round(RIDGE[1][0]), Math.round(RIDGE[1][1]) - 2);
    if (AGE === 3) {
      const m = lerp(RIDGE[0], RIDGE[1], 0.5), cb = [Math.round(m[0]) + 0, Math.round(m[1]) + 5];
      const q = pixIsoBox(t, cb[0], cb[1], 0.28, 0.28, 13, 1, {});
      wall(t, q.L, q.Bm, 13, (a, v) => a >= 3 && a <= 5 && v >= 3 && v <= 9 ? (v === 3 ? AS[2] : Gl[v < 6 ? 1 : 0]) : v === 0 ? Au[1] : AS[a < 1 ? 1 : 0]);
      wall(t, q.Bm, q.Rr, 13, (a, v) => a >= 3 && a <= 5 && v >= 3 && v <= 9 ? (v === 3 ? AS[3] : Gl[0]) : v === 0 ? Au[2] : AS[2]);
      const RF = { L: [q.L[0] - 1, q.L[1] + 1], Bm: [q.Bm[0], q.Bm[1] + 2], Rr: [q.Rr[0] + 1, q.Rr[1] + 1], T: q.T };
      const ap = pixIsoRoof(t, RF, 9, 1, { back: '1', left: '2', front: '3', right: '4' });
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = t[y][x]; if ('34'.includes(c)) t[y][x] = c === '3' ? AR[1] : AR[4]; else if ('12'.includes(c)) t[y][x] = AR[2]; }
      pixLine(t, RF.Bm[0], RF.Bm[1], ap[0], ap[1], Au[1]); pixLine(t, RF.L[0], RF.L[1], RF.Bm[0], RF.Bm[1], Au[1]); pixLine(t, RF.Bm[0], RF.Bm[1], RF.Rr[0], RF.Rr[1], Au[2]);
      AK.finial(t, Math.round(ap[0]), Math.round(ap[1]) - 1);
    }
  });
}
// ---- Castle / Imperial: the striped team awning stays, now a pent awning over the arcade on iron brackets, between the
// arch heads and the upper band (Imperial: under the round windows). Courses of team cloth and canvas, lighter at the wall,
// a scalloped valance on the outer edge that flutters (per frame).
const AW = { ha: [0, 0, 21, 24][AGE], drop: 3, dp: 0.16, v0: 0.06, v1: 2.94 };
const awUV = (x, y) => { const X = (x + 0.5 - SB[0]) / 32, Yv = SB[1] - AW.ha - (y + 0.5), u = (Yv - 16 * X) / (32 + AW.drop / AW.dp); return [u, X + u]; };
const awStripe = v => Math.floor((v - AW.v0) / (AW.v1 - AW.v0) * NS);
if (AGE >= 2) {
  inked(g, t => {
    // iron brackets under the awning at every other pier, from the outer edge back to the wall
    for (let k = 0; k <= 6; k += 2) { const v = Math.max(AW.v0 + 0.03, Math.min(AW.v1 - 0.03, k * 0.5)), a = hs(-AW.dp, v, AW.ha - AW.drop), b = hs(0, v, AW.ha - AW.drop - 6); pixLine(t, a[0], a[1], b[0], b[1], Fe[1]); }
    const A = hs(0, AW.v0, AW.ha), B = hs(0, AW.v1, AW.ha), C = hs(-AW.dp, AW.v1, AW.ha - AW.drop), D = hs(-AW.dp, AW.v0, AW.ha - AW.drop);
    for (const [x, y] of cells([A, B, C, D])) { const [u, v] = awUV(x, y), sI = awStripe(v), team = sI % 2 === 0, d = -u / AW.dp;
      const lvl = d < 0.25 ? 0 : d > 0.8 ? 2 : 1; put(t, x, y, team ? ['L', 'T', 'D'][lvl] : ['A', 'B', 'a'][lvl]); }
    { const a = hs(-AW.dp, AW.v0, AW.ha - AW.drop), b = hs(-AW.dp, AW.v1, AW.ha - AW.drop); pixLine(t, a[0], a[1], b[0], b[1], 'D'); }   // team binding along the edge
    pixLine(t, A[0], A[1], B[0], B[1], AGE === 3 ? Au[1] : Fe[1]);                       // the rod it hangs from
  });
}
function awValance(t, f) {
  const a = hs(-AW.dp, AW.v0, AW.ha - AW.drop), b = hs(-AW.dp, AW.v1, AW.ha - AW.drop), n = Math.round(b[0] - a[0]);
  for (let i = 0; i <= n; i++) {
    const p = lerp(a, b, i / n), x = Math.round(p[0]), y = Math.round(p[1]), v = AW.v0 + (AW.v1 - AW.v0) * i / n, sI = Math.min(NS - 1, awStripe(v)), team = sI % 2 === 0;
    const w = i - Math.round(n * sI / NS), sw = n / NS, lift = [0, 1, 1, 0][(sI + f) & 3], e = Math.min(w, sw - 1 - w);
    const len = (e <= 0 ? 3 : e === 1 ? 4 : 5) - lift, sg = sagAt(mod(v, 1), 1.4);          // row 0 is the team binding; it sags between brackets
    for (let k = 0; k < sg; k++) put(t, x, y + k, team ? 'D' : 'a');
    for (let k = 0; k < len; k++) put(t, x, y + sg + k, k === 0 ? 'D' : k === len - 1 ? (team ? 'D' : 'a') : (team ? 'T' : 'A'));
    if (AGE === 3 && len > 1) put(t, x, y + sg + len - 1, i % 2 ? Au[1] : Au[0]);                // gilt fringe
  }
}

// banners on the piers of the long face and on the end wall, rippling (Castle: iron rod; Imperial: gilt rod, edges and fringe)
function rangeBanner(t, f) {
  for (const [k] of bannerAt) {
    const lit = k < 0, A = lit ? hs(1, 0, RH.Z) : hs(0, 0, RH.Z), B = lit ? hs(0, 0, RH.Z) : hs(0, 3, RH.Z), a0 = lit ? 25 : (k + 1) * BW - 2, wdt = lit ? 5 : 4;
    const v0 = AGE === 3 ? 4 : 2, len = AGE === 3 ? 10 : 9;
    wall(t, A, B, RH.Z + 30, (a, v) => {
      const i = a - a0; if (i < -1 || i > wdt) return null;
      if (v === v0) return AGE === 3 ? Au[i === -1 || i === wdt ? 2 : 1] : Fe[1];
      if (i < 0 || i >= wdt || v <= v0) return null;
      const wave = ((i + f + k) % 4 < 2) ? 0 : 1, end = v0 + len - (Math.abs(i - (wdt - 1) / 2) < 1 ? 1 : 0) + wave;
      if (v > end) return null;
      if (v === end) return AGE === 3 ? Au[i % 2] : 'D';
      if (AGE === 3 && (i === 0 || i === wdt - 1)) return Au[i === 0 ? 0 : 2];
      if (v === v0 + 4 && i === Math.floor(wdt / 2)) return AGE === 3 ? Au[0] : 'L';
      const fold = (i + f) % 4; return i === 0 ? 'L' : i === wdt - 1 ? 'D' : fold === 0 ? 'L' : fold === 2 ? 'D' : 'T';
    });
  }
}

// ---- rail fence along the two front edges (a gap in the left run for the archers); Imperial: a low limestone balustrade
if (AGE === 3) inked(g, t => {
  for (const [a, b, k0, gap, lit] of [[L, Bm, 3, true, true], [Bm, Rr, 0, false, false]]) {
    const A = lerp(a, b, k0 / 9);
    wall(t, P(A, 0, -5), P(b, 0, -5), 5, (aa, v) => { const k = (aa + (A[0] - a[0])) / 96 * 9; if (gap && k > 5 && k < 6.1) return null;
      if (v === 0) return lit ? AS[0] : AS[1]; if (v === 4) return AS[3];
      const bal = ((aa % 4) + 4) % 4; return (aa % 12 === 0) ? (lit ? AS[1] : AS[2]) : v === 1 ? AS[4] : bal === 1 || bal === 2 ? (lit ? AS[1] : AS[2]) : AS[4]; });
  }
});
else {
  const t = g;
  for (const [a, b, k0, gap] of [[L, Bm, 3, true], [Bm, Rr, 0, false]]) {
    for (let k = k0; k <= 9; k++) { if (gap && (k === 5 || k === 6)) continue; const p = lerp(a, b, k / 9); const x = Math.round(p[0]), y = Math.round(p[1]);
      const hk = hash(k, 51, k0), ht = 7 + (hk < 0.3 ? 1 : 0) - (hk > 0.82 ? 1 : 0), ln = hash(k, 52, k0) < 0.3 ? (hash(k, 53) < 0.5 ? -1 : 1) : 0;
      pixRect(t, x, y - 4, 1, 4, 'u'); pixRect(t, x + ln, y - ht + 1, 1, ht - 4, 'u'); pixSet(t, x + ln, y - ht, 'w'); }
    for (const [h, c, sg] of [[6, 'W', 1.3], [5, 't', 1.3], [2, 't', 0.8]]) for (let i = k0 * 96 / 9; i <= 96; i++) { const k = i / 96 * 9; if (gap && k > 5 && k < 6) continue; const p = lerp(a, b, i / 96);
      put(t, Math.floor(p[0]), Math.floor(p[1]) - h + sagAt(k % 1, sg * (0.7 + hash(Math.floor(k), 54, k0) * 0.6)), c); }
  }
}

// ---- animated: valance hem flutter
function valance(t, f) {
  const n = 48; // per two pixels along the eave
  for (let i = 0; i < 96; i++) {
    const p = lerp(sh.Bm, sh.Rr, (i + 0.5) / 96); const x = Math.floor(p[0]), y = Math.floor(p[1]) + 1;
    const s = Math.min(NS - 1, Math.floor(i / 8)), team = s % 2 === 0, w = i % 8;
    const lift = [0, 1, 1, 0][(s + f) & 3];                                     // the hem lifts as a wave passes
    const len = (w === 0 || w === 7 ? 3 : w === 1 || w === 6 ? 4 : 5) - lift + sagAt((i % 16) / 16, 1.2);   // the cloth sags between posts
    for (let k = 0; k < len; k++) put(t, x, y + k, k === len - 1 ? (team ? 'D' : 'a') : (team ? 'T' : 'A'));
  }
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  if (AGE === 1) inked(q, t => valance(t, f)); else { inked(q, t => rangeBanner(t, f)); inked(q, t => awValance(t, f)); }
  tufts(q, { s: 11 + AGE, dens: 0.42 });
  outline(q, 'k', 'K'); tuftInk(q);
  frames.push(pixText(q));
}

return {
  id: 'archery', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal, ...NAT,
    k: '#24180f', K: '#4a3520',                                          // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730', z: '#7d6236', x: '#5e4a28', // earth, plinth faces
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#2a2018', // timber, shed interior
    A: '#efe6d2', B: '#d9c7a0', a: '#a8946e',                            // canvas, fletching, chalk
    h: '#e6c272', H: '#d8ab4f', E: '#b58a3c', e: '#8f6a2c',              // straw
    r: '#c9303a', R: '#8e1f28', g: '#ffe28a', G: '#5f656c',              // target rings, gold centre, iron hoop
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 1);
