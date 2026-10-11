// @pixel barracks
// Barracks (3×3): a walled training yard that grows with its owner's age. Thick curtain walls with a walk along their
// top (a parapet on the outer edge) meet full-height corner towers about halfway across; a gate with team-colour doors
// on the front-right wall, a long team banner on the front-left wall; inside, a sleeping hall, a spear-and-shield rack
// and a straw training dummy in a worn sparring ring.
//   Dark     a palisade of sharpened stakes with a plank fighting-walk behind it, no towers; a hide-hung gate between tall
//            gateposts; a low wattle longhouse under steep golden thatch with crossed gable poles and a smoking smoke hole.
//   Feudal   the palisade on a rubble-stone footing; four timber corner towers from the ground with overhanging shingle
//            pyramid roofs and knob finials; a timber gatehouse with a shingle roof; a plank hall under brown shingles.
//   Castle   dressed ashlar walls with a crenellated walk, crenellated stone towers, an arched gate; a red-tiled plank hall.
//   Imperial pale limestone, taller walls and towers with a gilt string course, slate spires with gilt orb finials,
//            gilt-fringed banners, a limestone hall under slate with gilt cresting, a gilt keystone over the gate.
// Generated (code before export) + hand-painted stamps; anchor = footprint bottom corner. idle: 4 frames — banners ripple,
// the dummy wobbles (Dark: smoke curls from the longhouse).
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
const W = 3, H = 3;
const Z = [14, 18, 20, 22][AGE], TZ = [0, 12, 14, 18][AGE];          // curtain height; towers rise TZ above it
const TW = [0.22, 0.3, 0.42, 0.44][AGE], TB = AGE >= 2 ? 0.8 : 0.7;                    // wall thickness, tower size (tiles)
const PZ = AGE <= 1 ? 6 : 5;                                          // parapet / stake tips above the walk
const CAP = [8, 16, 0, 26][AGE];                                      // headroom for roofs and spires over the towers
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + TZ + 30 + CAP;
const bx = W * 32 + 2, by = GH - 4;
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
const STONE = AGE >= 2;
const top = pixIsoBox(g, bx, by, W, H, Z, 1, {});
const { T, L, Rr, Bm } = top;
const gp = (u, v, z = 0) => [bx + 32 * (v - u), by - 16 * (u + v) - z];   // footprint (u along the left edge, v along the right) → screen
const uvAt = (x, y, z) => { const dx = x + 0.5 - bx, dy = y + 0.5 - (by - z); return [(-dx / 32 - dy / 16) / 2, (dx / 32 - dy / 16) / 2]; };
const merlon = (a, per, w) => ((a % per) + per) % per < w;
const { R: AR, Au, Gl, DEEP } = AK;

// ---- materials (letters a..Q are stone: Castle ashlar; the palette re-tones them to the kit's stone in other ages)
const ashL = stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 9, s: 1, q: ['q', 'b'], qL: true, qR: true, len: 96, ao: 14 });
const ashR = stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 9, s: 2, q: ['Q', 'e'], qL: true, qR: true, len: 96, ao: 14 });
const plL = stone({ t: ['c', 'p', 'p'], m: 'n', ch: 4, bw: 12, s: 3 }), plR = stone({ t: ['f', 'P', 'P'], m: 'k', ch: 4, bw: 12, s: 4 });
const gilt = (lit) => Au[lit ? 1 : 2];
// outer stone face: a shadow row under the walk, (Imperial: a gilt string course), ashlar, a ledge and the plinth
const stoneFace = (lit, ah) => (a, v) => {
  if (v === 0) return lit ? 'm' : 'n';
  if (v === 1 && AGE === 3) return gilt(lit);
  const sett = hash(Math.floor((a + 2) / 6), 31, lit ? 1 : 2) < 0.22 ? 1 : 0;              // a settled stone: the ledge steps down 1 px
  if (v === ah - 5 + sett) return lit ? 'o' : 'O';
  if (v > ah - 5 + sett) return (lit ? plL : plR)(a, v - (ah - 4));
  return (lit ? ashL : ashR)(a, v - 1);
};
// palisade logs: 3-px stakes with a dark seam, two withy bands; Feudal: a rubble footing under them
const FOOT = AGE === 1 ? 5 : 0;
const logs = (lit, s, ah) => (a, v) => {
  const k = mod(a, 4), n = Math.floor(a / 4), h = hash(n, 3, s);
  const ft = FOOT ? FOOT + (hash(Math.floor((a + 3) / 6), 2, s) < 0.35 ? 1 : 0) - (hash(Math.floor((a + 3) / 6), 4, s) < 0.2 ? 1 : 0) : 0;   // rubble top is not a ruler line
  if (v >= ah - ft) return stone({ t: lit ? ['a', 'b', 'c'] : ['d', 'e', 'f'], m: lit ? 'm' : 'n', ch: 3, bw: 6, s: s + 50 })(a, v - (ah - FOOT));
  if (FOOT === 0 && v === ah - 1 && k !== 3 && hash(n, 8, s) < 0.3) return null;           // a stake sunk a little deeper in the earth
  if (k === 3) return lit ? 't' : 'u';
  const sg = sagAt(mod(a + 6, 22) / 22, 1.4);                                              // withy bands sag between their ties
  if (v === 3 + sg || v === ah - FOOT - 4 + Math.min(1, sg)) return lit ? 'u' : 'z';
  if (FOOT === 0 && v >= ah - 2 - (h < 0.5 ? 1 : 0)) return lit ? 't' : 'u';              // foot darkened with earth, unevenly
  if (v >= 5 && v <= 9 + Math.floor(h * 5) && k === 1 && hash(n, 6, s) < 0.3) return lit ? 't' : 'u';   // a weather split down a log
  return lit ? (k === 0 ? 'W' : k === 2 ? 't' : h < 0.3 ? 'W' : 'w') : (k === 0 ? 'w' : h < 0.35 ? 'w' : 't');
};
// stake tips (palisade parapet): pointed 3-px stakes with gaps between the points
const PT = STONE ? PZ : PZ + 2;                                        // stake tips get 2 rows of headroom to stand proud
const tips = (lit, s = 0) => (a, v) => {
  const k = mod(a, 4), n = Math.floor(a / 4), hv = hash(n, 9, s + 1), hl = hash(n, 4, s + 1);
  const dr = hv < 0.06 ? -2 : hv < 0.2 ? -1 : hv < 0.58 ? 0 : hv < 0.84 ? 1 : 2, ln = hl < 0.22 ? -1 : hl > 0.82 ? 1 : 0;   // tips at varied heights, a few lean
  if (k === 3) return v >= PT - 2 ? (lit ? 't' : 'u') : null;
  const w = v - 2 - dr; if (w < 0) return null;
  if (w === 0) return k === 1 + ln ? (lit ? 'W' : 'w') : null;
  if (w === 1) return (ln < 0 ? k <= 1 : ln > 0 ? k >= 1 && k <= 2 : k <= 1) ? (lit ? 'W' : 'w') : null;
  return lit ? (k === 0 ? 'W' : k === 2 ? 't' : 'w') : (k === 0 ? 'w' : 't');
};
const merlons = (lit, s, cd = 3) => (a, v) => {
  if (!merlon(a, 8, 5) && v < cd) return null;
  const m = Math.floor(a / 8), j = mod(a, 8), hc = hash(m, 12, s);
  if (v === 0 && ((hc < 0.22 && j === 0) || (hc > 0.84 && j === 4))) return null;          // a chipped merlon corner
  return v === 0 || (v === cd && !merlon(a, 8, 5)) ? (lit ? 'q' : 'o') : stone({ t: lit ? ['a', 'b', 'c'] : ['d', 'e', 'f'], m: lit ? 'm' : 'n', ch: 3, bw: 6, s })(a, v);
};
const DARK = { a: 'b', b: 'c', c: 'p', q: 'b', d: 'e', e: 'f', f: 'P', Q: 'e', p: 'P', o: 'c', O: 'f' };
const MOSS = { a: 'м', b: 'м', c: 'л', p: 'л', q: 'м', d: 'л', e: 'л', f: 'ь', Q: 'л', P: 'ь' };
const weatherStone = (fn, H, s, top = 2) => weathered(fn, H, { dark: DARK, moss: MOSS, mh: AGE === 3 ? 4 : 6, st: AGE === 3 ? 0.08 : 0.13, top, s });
const outerFace = (lit, s, ah) => STONE ? weatherStone(stoneFace(lit, ah), ah, s) : logs(lit, s, ah);
const parapet = (lit, s, cd) => STONE ? merlons(lit, s, cd) : tips(lit, s);
// the walk on top of a wall: flagstones with joints across it (stone), boards across it (timber)
const walkCell = (along) => { const k = Math.floor(along * 32); return STONE ? (k % 7 === 0 ? 'e' : k % 7 === 1 ? 'o' : 'O') : (k % 3 === 0 ? 't' : k % 9 === 1 ? 'W' : 'w'); };
// a wall's inner face seen from the yard (back walls): stone courses, or the walk's planking over posts and knee braces
// with the palisade's back in shadow under it
const inStone = (lit, s) => stone({ t: lit ? ['a', 'b', 'c'] : ['d', 'e', 'f'], m: lit ? 'm' : 'n', ch: 4, bw: 9, s, ao: 10 });
const innerFace = (lit, s) => (a, v) => {
  if (v === 0) return lit ? 'o' : 'O';
  if (STONE) { if (v === 1) return lit ? 'm' : 'n'; if (v === Z - 1) return lit ? 'c' : 'f'; return inStone(lit, s)(a, v - 2); }
  if (v === 1) return lit ? 'W' : 'w';
  if (v === 2) return 'u';
  const k = ((a % 12) + 12) % 12;
  if (k <= 1) return k === 0 ? (lit ? 'W' : 'w') : 't';                                  // walk posts
  if (v === Z - 1) return 'J';
  if (v - 3 === k - 2 && v < 10) return 't';                                              // knee braces
  return ((a % 4) + 4) % 4 === 3 ? 'M' : 'N';
};

// ---- a box on the footprint (u0..u1 along the left edge, v0..v1 along the right), base z0, hgt tall; fl/fr/ftop paint
// its lit left face, its shaded right face and its top
function box(t, u0, v0, u1, v1, z0, hgt, fl, fr, ftop) {
  const BmB = gp(u0, v0, z0 + hgt), LB = gp(u1, v0, z0 + hgt), RB = gp(u0, v1, z0 + hgt), TB_ = gp(u1, v1, z0 + hgt);
  if (fl) wall(t, LB, BmB, hgt, fl);
  if (fr) wall(t, BmB, RB, hgt, fr);
  if (ftop) for (const [x, y] of cells([TB_, RB, BmB, LB])) { const [u, v] = uvAt(x, y, z0 + hgt); put(t, x, y, ftop(u, v, x, y)); }
  return { T: TB_, L: LB, Rr: RB, Bm: BmB };
}
const swapTemp = (t, map) => { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const f = map[t[y][x]]; if (f) t[y][x] = f(x, y); } };

// ---- yard floor: packed earth at ground level, a sparring ring round the dummy, darker under the back-left wall and at the wall feet
const DUM = gp(1.1, 1.62).map(Math.round);                                               // training dummy foot (ground)
for (const [x, y] of cells([gp(3, 3), gp(0, 3), gp(0, 0), gp(3, 0)])) {
  const [u, v] = uvAt(x, y, 0);
  const n = vnoise(x, y, 7, 3); let ch = n < 0.33 ? 'Y' : n > 0.72 ? 'j' : 'y';
  const ex = (x - DUM[0]) / 17, ey = (y - DUM[1] + 1) / 8.5, e = ex * ex + ey * ey; if (e < 1) ch = e > 0.82 ? 'Y' : 'j';
  if (u > 3 - TW - 0.3) ch = ch === 'j' ? 'y' : n < 0.4 ? 'J' : 'Y';                      // in the back-left wall's shadow
  if (u > 3 - TW - 0.05 || v > 3 - TW - 0.04) ch = 'J';                                    // wall feet
  g[y][x] = ch;
}
// a worn track of cobbles and ruts from the gate to the hall door (clusters, not noise)
{ const a = gp(TW + 0.1, 1.45), b = gp(1.6, 1.3); for (let i = 0; i < 20; i++) { const p = lerp(a, b, (i + 0.5) / 20); const x = Math.round(p[0]) + (i % 3) - 1, y = Math.round(p[1]) + (i % 2); if ('yYj'.includes(g[y][x]) && 'yYj'.includes(g[y][x + 1])) { g[y][x] = 'Y'; g[y][x + 1] = 'J'; } } }
// trampled yard: boot prints round the sparring ring and along the track, straw shaken off the dummy, a puddle-dark rut
{
  const gr = (x, y) => g[y] && 'yYj'.includes(g[y][x]);
  for (let i = 0; i < 30; i++) {
    const an = hash(i, 61) * 6.283, rr = 0.7 + hash(i, 62) * 0.45, x = Math.round(DUM[0] + Math.cos(an) * 17 * rr), y = Math.round(DUM[1] - 1 + Math.sin(an) * 8.5 * rr);
    if (gr(x, y) && gr(x + 1, y) && gr(x + 2, y + 1)) { g[y][x] = 'J'; g[y][x + 1] = 'Y'; if (hash(i, 63) < 0.6) g[y + 1][x + 2] = 'J'; }   // a left-right pair of prints
  }
  for (let i = 0; i < 12; i++) {
    const p = lerp(gp(TW + 0.15, 1.5), gp(1.5, 1.35), hash(i, 64)), x = Math.round(p[0] + (hash(i, 65) - 0.5) * 10), y = Math.round(p[1] + (hash(i, 66) - 0.5) * 5);
    if (gr(x, y) && gr(x + 1, y)) { g[y][x] = 'Y'; g[y][x + 1] = 'J'; }
  }
  for (let i = 0; i < 16; i++) {
    const an = hash(i, 67) * 6.283, rr = hash(i, 68) * 0.9, x = Math.round(DUM[0] + Math.cos(an) * 12 * rr), y = Math.round(DUM[1] + 1 + Math.sin(an) * 6 * rr), d = hash(i, 69) < 0.5 ? 1 : -1;
    if (gr(x, y) && gr(x + 1, y + d) && gr(x + 2, y + d)) { g[y][x] = 'h'; g[y + d][x + 1] = 'H'; if (hash(i, 70) < 0.5) g[y + d][x + 2] = 'h'; }   // straw wisps
  }
}

// ---- towers: full height from the ground (TB tiles square); the curtain walls run into them about halfway across
const TH = Z + TZ;
function hipRoof(t, RF, rise, mat) {   // pyramid roof over RF in the age's roof material; returns the apex
  const ap = pixIsoRoof(t, RF, rise, 1, { back: '1', left: '2', front: '3', right: '4' });
  swapTemp(t, { 1: (x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true }), 2: (x, y) => AK.roofXY(x, y, -0.5, 2, { flip: true }), 3: (x, y) => AK.roofXY(x, y, 0.5, 0), 4: (x, y) => AK.roofXY(x, y, -0.5, 1) });
  pixLine(t, RF.L[0], RF.L[1], RF.Bm[0], RF.Bm[1], AR[3]); pixLine(t, RF.Bm[0], RF.Bm[1], RF.Rr[0], RF.Rr[1], AR[5]);
  pixLine(t, RF.L[0], RF.L[1] + 1, RF.Bm[0], RF.Bm[1] + 1, AR[6]); pixLine(t, RF.Bm[0], RF.Bm[1] + 1, RF.Rr[0], RF.Rr[1] + 1, AR[6]);
  pixLine(t, RF.Bm[0], RF.Bm[1], ap[0], ap[1], AR[1]); pixLine(t, RF.Bm[0] + 1, RF.Bm[1], ap[0] + 1, ap[1], AR[5]);
  return ap;
}
function towerTop(t, q, front) {
  if (AGE === 2) {                                                                         // flat stone top behind crenellations
    for (const [x, y] of cells([q.T, q.Rr, q.Bm, q.L])) t[y][x] = y < q.T[1] + 5 ? 'f' : ((x + 2 * y) % 14 === 0 ? 'f' : 'e');
    inked(t, m => {                                                                        // merlons inked on their own so they read
      wall(m, P(q.T, 0, -4), P(q.L, 0, -4), 4, (a, v) => merlon(a, 9, 4) || a <= -24 ? (v === 0 ? 'O' : 'e') : null);
      wall(m, P(q.T, 0, -4), P(q.Rr, 0, -4), 4, (a, v) => merlon(a, 9, 4) || a >= 23 ? (v === 0 ? 'o' : 'b') : null);
    });
    inked(t, m => {
      wall(m, P(q.L, 0, -4), P(q.Bm, 0, -4), 4, (a, v) => merlon(a, 9, 4) || a >= 23 ? (v === 0 ? 'q' : 'b') : null);
      wall(m, P(q.Bm, 0, -4), P(q.Rr, 0, -4), 4, (a, v) => merlon(a, 9, 4) || a >= 23 ? (v === 0 ? 'o' : 'e') : null);
    });
    return [q.Bm[0], q.Bm[1] - 13];
  }
  // Feudal: an overhanging shingle pyramid; Imperial: a steep slate spire with gilt eaves and hips
  const o = AGE === 3 ? 1 : 3, rise = AGE === 3 ? 23 : 13;
  const RF = { L: [q.L[0] - o, q.L[1] + o * 0.5 + 1], Bm: [q.Bm[0], q.Bm[1] + o * 0.5 + 2], Rr: [q.Rr[0] + o, q.Rr[1] + o * 0.5 + 1], T: [q.T[0], q.T[1] - o * 0.5] };
  const ap = hipRoof(t, RF, rise);
  if (AGE === 3) { AK.trim(t, [RF.L[0] + 1, RF.L[1]], RF.Bm, 0); AK.trim(t, RF.Bm, [RF.Rr[0] - 1, RF.Rr[1]], 0); AK.crest(t, lerp(RF.Bm, ap, 0.25), lerp(RF.Bm, ap, 0.9)); }
  if (!front) AK.finial(t, Math.round(ap[0]), Math.round(ap[1]) - 1);
  return ap;
}
function tower(t, u0, v0, slitL, slitR, front) {
  let q;
  if (STONE) q = box(t, u0, v0, u0 + TB, v0 + TB, 0, TH,
    weatherStone((a, v) => v === 0 ? 'o' : v === 1 ? 'm' : v === 2 && AGE === 3 ? gilt(true) : v === TZ + 1 ? 'o' : v >= TH - 4 ? plL(a, v - (TH - 4)) : stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 7, s: 7, q: ['q', 'b'], qR: true, len: 22 })(a, v - 2), TH, 40 + u0 * 7 + v0, 3),
    weatherStone((a, v) => v === 0 ? 'O' : v === 1 ? 'n' : v === 2 && AGE === 3 ? gilt(false) : v === TZ + 1 ? 'O' : v >= TH - 4 ? plR(a, v - (TH - 4)) : stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 7, s: 8, q: ['Q', 'e'], qL: true, len: 22 })(a, v - 2), TH, 50 + u0 * 7 + v0, 3));
  else q = box(t, u0, v0, u0 + TB, v0 + TB, 0, TH,                                         // Feudal: half-timbered tower on a stone footing
    (a, v) => AK.wallTex(a, TH - 1 - v, 0, { len: 22, H: TH, step: 11, pl: 5 }),
    (a, v) => AK.wallTex(a, TH - 1 - v, 1, { len: 22, H: TH, step: 11, pl: 5 }));
  pixLine(t, q.Bm[0], q.Bm[1], q.Bm[0], q.Bm[1] + TH - 1, STONE ? 'n' : 'u');
  const slit = (A, B, sill, s0) => wall(t, A, B, TH, (a, v) => a >= 10 && a <= 11 && v >= s0 && v <= s0 + 4 ? 'z' : a >= 9 && a <= 12 && v === s0 + 5 ? sill : null);
  for (const s0 of [AGE === 3 ? 5 : 4, TZ + 5]) { if (slitL) slit(q.L, q.Bm, STONE ? 'q' : 'W', s0); if (slitR) slit(q.Bm, q.Rr, STONE ? 'o' : 'w', s0); }
  q.ap = towerTop(t, q, front);
  return q;
}

// ---- back tower, back walls (inner faces toward us) and their parapets on the outer edge
const DK = AGE === 0;
if (!DK) inked(g, t => tower(t, 3 - TB, 3 - TB, true, true, false));
inked(g, t => {
  const b0 = DK ? 0 : TB / 2, b1 = DK ? 3 : 3 - TB, c1 = DK ? 3 - TW : 3 - TB;
  box(t, 3 - TW, b0, 3, b1, 0, Z, null, innerFace(false, 21), (u, v) => walkCell(v));      // back-left wall
  box(t, b0, 3 - TW, c1, 3, 0, Z, innerFace(true, 22), null, (u, v) => walkCell(u));       // back-right wall
});
inked(g, t => {
  const b0 = DK ? 0 : TB / 2, b1 = DK ? 3 : 3 - TB, c1 = DK ? 3 - TW : 3 - TB;
  wall(t, gp(3, b0, Z + PT), gp(3, b1, Z + PT), PT, parapet(false, 5));
  wall(t, gp(DK ? 3 : c1, 3, Z + PT), gp(b0, 3, Z + PT), PT, parapet(true, 6));
});

// ---- weapon rack on the yard floor against the back-right wall: spears with steel heads, team shields hung on the rail.
// The spear shafts and heads carry their own edge (no ink halo), so the wall stays visible between them behind the rack.
inked(g, t => {
  const vv = 3 - TW - 0.12, p0 = gp(2.2, vv), p1 = gp(1.25, vv);
  for (let i = 0; i < 7; i++) { const p = lerp(p0, p1, (i + 0.5) / 7); const x = Math.round(p[0]), y = Math.round(p[1]); pixLine(t, x, y, x + 1, y - 13, 'w'); pixSet(t, x + 1, y - 14, 'S'); pixSet(t, x + 1, y - 15, 's'); pixSet(t, x + 2, y - 14, 'G'); }
  for (const k of [0, 1]) { const p = k ? p1 : p0; pixLine(t, Math.round(p[0]), Math.round(p[1]), Math.round(p[0]), Math.round(p[1]) - 9, 't'); }
  pixLine(t, p0[0], p0[1] - 8, p1[0], p1[1] - 8, 't'); pixLine(t, p0[0], p0[1] - 3, p1[0], p1[1] - 3, 'u');
  for (const k of [0.3, 0.72]) { const p = lerp(p0, p1, k); stampL(t, p[0] - 3, p[1] - 9, `
.DDD.
DTTLD
DTLTD
DTTTD
.DDD.
`); }
}, 'k', 'K', 'wsSG');

// ---- the sleeping hall on the yard floor along the back-left wall. Dark: a low wattle longhouse under steep thatch;
// Feudal: planks under shingles; Castle: planks under red tiles; Imperial: limestone under slate with gilt cresting.
const HZ = [9, 14, 14, 16][AGE], HRISE = [16, 10, 10, 12][AGE];
const HALL = { u0: 1.72, v0: 0.82, du: 3 - TW - 0.08 - 1.72, dv: 1.42 };
let smokeAt = null;
{
  const hb = gp(HALL.u0, HALL.v0);
  inked(g, t => {
    const q = pixIsoBox(t, hb[0], hb[1], HALL.du, HALL.dv, HZ, 1, {});
    const m1 = lerp(q.L, q.Bm, 0.5), m2 = lerp(q.T, q.Rr, 0.5), r1 = P(m1, 0, -HRISE), r2 = P(m2, 0, -HRISE);
    const lenL = Math.round(q.Bm[0] - q.L[0]), lenR = Math.round(q.Rr[0] - q.Bm[0]);
    if (AGE === 2) {
      wall(t, q.L, q.Bm, HZ, (a, v) => v < 2 ? 't' : v === HZ - 1 ? 'u' : planks({ t: ['W', 'w', 't'], ph: 3, s: 9, nail: 'u' })(a, v));
      wall(t, q.Bm, q.Rr, HZ, (a, v) => v < 2 ? 'u' : v === HZ - 1 ? 'z' : planks({ t: ['w', 't', 'u'], ph: 3, s: 10 })(a, v));
      for (const k of [0, 1 / 3, 2 / 3]) { const p = lerp(q.Bm, q.Rr, k); pixLine(t, Math.round(p[0]), Math.round(p[1]) + 2, Math.round(p[0]), Math.round(p[1]) + HZ - 1, 'u'); }
    } else {
      wall(t, q.L, q.Bm, HZ, (a, v) => AK.wallTex(a, HZ - 1 - v, 0, { len: lenL, H: HZ, step: 12 }));
      wall(t, q.Bm, q.Rr, HZ, (a, v) => AK.wallTex(a, HZ - 1 - v, 1, { len: lenR, H: HZ, step: 12 }));
    }
    // door (team planks; Dark: a team hide in a low doorway) and two shuttered windows on the long face
    const dTop = AGE === 0 ? 1 : AGE === 3 ? 5 : 4;
    wall(t, q.Bm, q.Rr, HZ, (a, v) => {
      if (a >= 20 && a <= 26 && v >= dTop && v <= HZ - 1) {
        if (AGE === 0) return v === dTop ? 'u' : a === 20 || a === 26 ? 't' : a === 25 ? 'z' : (a + Math.floor(v / 3)) % 4 === 0 ? 'D' : a === 21 ? 'L' : 'T';
        if (AGE === 3 && v === dTop) return a === 23 ? Au[0] : 'o';
        if (v === dTop) return 'u';
        return a === 20 ? 'z' : a === 26 ? 'D' : (a - 21) % 2 ? 'T' : (v === 7 || v === 11 ? 'G' : 'L');
      }
      if (AGE === 0) return a >= 35 && a <= 39 && v >= 2 && v <= 4 ? (v === 2 ? 'u' : a === 35 ? 'T' : 'z') : null;
      const w1 = AGE === 3 ? 9 : 8;
      for (const w0 of [5, 34]) if (a >= w0 && a <= w0 + 7 && v >= 4 && v <= w1) return v === w1 ? (AGE === 3 ? Au[1] : 'W') : (a === w0 || a === w0 + 7) ? 'T' : (a === w0 + 1 || a === w0 + 6) ? 'D' : v === 4 ? 'u' : AGE === 3 ? (v === 6 && a === w0 + 3 ? Gl[1] : Gl[0]) : 'z';
      return null;
    });
    // gable end over the lit wall, then the two roof planes
    for (const [x, y] of cells([q.L, q.Bm, r1])) t[y][x] = AGE === 3 ? AK.wallTex(x - Math.floor(q.L[0]), HZ + 6, 0, { len: lenL, H: HZ + 40 }) : (x % 3 === 0) ? (AGE === 0 ? 't' : 'w') : AGE === 0 ? 'w' : 'W';
    {
      const ov = AGE === 0 ? 3 : 1;                                                       // thatch hangs deeper over the walls
      plane(t, [q.L, q.T, r2, r1], q.L, q.T, (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 2));
      plane(t, [r1, r2, P(q.Rr, ov, ov), P(q.Bm, 0, ov)], P(q.Bm, 0, ov), P(q.Rr, ov, ov), (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 1));
      // the eave: thatch hangs ragged; shingles and tiles drip unevenly (a lifted or dropped course end here and there)
      { const n = Math.round(q.Rr[0] - q.Bm[0]) + ov; for (let i = 0; i <= n; i++) { const p = lerp(P(q.Bm, 0, ov), P(q.Rr, ov, ov), i / n), x = Math.round(p[0]), y = Math.round(p[1]);
        put(t, x, y, AR[6]); if (AGE >= 1 && hash(x >> 1, 23) < 0.18) put(t, x, y + 1, AR[5]); } }
      if (AGE <= 1) sagLine(t, r1, r2, AGE === 0 ? 2 : 1, (x, y) => { put(t, x, y, 'k'); AK.crest(t, [x, y], [x, y]); });
      else { pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); AK.crest(t, r1, r2); }
      if (AGE === 0) {                                                                     // a ragged thatch fringe and the smoke hole
        for (let i = 0; i <= 48; i++) { const p = lerp(P(q.Bm, 0, ov), P(q.Rr, ov, ov), i / 48); if (hash(i, 41) < 0.4) put(t, Math.round(p[0]), Math.round(p[1]) + 1, AR[6]); }
        const sm = P(lerp(r1, r2, 0.55), 0, sagAt(0.55, 2)); pixRect(t, Math.round(sm[0]) - 1, Math.round(sm[1]) + 1, 3, 2, DEEP); smokeAt = [Math.round(sm[0]), Math.round(sm[1])];
      }
    }
    pixLine(t, q.L[0], q.L[1], r1[0], r1[1], 'k'); pixLine(t, q.Bm[0], q.Bm[1] + 1, r1[0], r1[1], 'k');
    if (AGE !== 2) AK.finial(t, Math.round(r1[0]), Math.round(r1[1]) - 1);
  });
}

// ---- the side towers, then the front walls (thick, a walk on top behind a parapet on the outer edge), then the front tower
const gBack = copy(g);                                                                     // everything behind the front works (the dummy goes in here per frame)
let qL = null, qR = null, qF = null;
if (!DK) { inked(g, t => { qL = tower(t, 3 - TB, 0, false, true, false); }); inked(g, t => { qR = tower(t, 0, 3 - TB, true, false, false); }); }
inked(g, t => {
  const e0 = DK ? 0 : TB / 2, e1 = DK ? 3 : 3 - TB;
  box(t, e0, 0, e1, TW, 0, Z, outerFace(true, 31, Z), null, (u, v) => walkCell(u));          // front-left wall
  box(t, 0, e0, TW, e1, 0, Z, null, outerFace(false, 32, Z), (u, v) => walkCell(v));         // front-right wall
  if (DK) pixLine(t, Bm[0], Bm[1], Bm[0], Bm[1] + Z - 1, 'u');                              // the front arris, in shade
});
inked(g, t => {                                                                            // the front parapets, inked on their own so each merlon reads
  const e0 = DK ? 0 : TB / 2, e1 = DK ? 3 : 3 - TB;
  wall(t, gp(e1, 0, Z + PT), gp(e0, 0, Z + PT), PT, parapet(true, 13, 4));                // deep crenels: the walk shows through
  wall(t, gp(0, e0, Z + PT), gp(0, e1, Z + PT), PT, parapet(false, 14, 4));
}, 'k', 'K', STONE ? '' : 'wWtu');

// ---- the gate on the front-right wall (a = px along its outer face from the front corner)
const GA = AGE === 1 ? 50 : 43;
if (STONE) inked(g, t => wall(t, Bm, Rr, Z, (a, v) => {                                       // voussoir arch, iron-banded team doors open on a dark passage
  const dx = a - GA, hw = 7.5; if (Math.abs(dx) > hw + 2) return null;
  const arch = 6 + Math.round(hw - Math.sqrt(Math.max(0, hw * hw - dx * dx))) * 0.6;
  if (v < arch - 2) return null;
  if (Math.abs(dx) > hw) return v < arch ? null : (v === Z - 1 ? 'P' : Math.abs(dx) > hw + 1 ? 'Q' : 'f');
  if (v < arch) return AGE === 3 && Math.abs(dx) < 1 ? Au[0] : (a % 3 === 0) ? 'n' : 'Q';
  if (v === Z - 1) return 'O';
  if (v === Math.ceil(arch) || Math.abs(dx) > hw - 1) return 'z';
  if (dx >= -1 && dx <= 1) return 'z';
  const leaf = dx < 0 ? dx + 7 : 7 - dx;
  if (v === 10 || v === 15) return 'G';
  return leaf === 1 ? 'D' : leaf % 2 ? 'T' : (dx < 0 ? 'L' : 'T');
}), 'k', 'K', 'zQnfPOGDTL' + Au[0]);
if (DK) inked(g, t => wall(t, P(Bm, 0, -12), P(Rr, 0, -12), Z + 12, (a, v) => {             // tall gateposts, a log lintel, a team hide across the gap
  const dx = a - GA; if (Math.abs(dx) > 9) return null;
  if (Math.abs(dx) >= 8) return Math.abs(dx) === 8 ? 'w' : 'u';
  if (v >= 4 && v <= 6) return v === 4 ? 'W' : v === 5 ? 'w' : 't';
  if (v < 7) return null;
  if (v <= 18 - (Math.abs(dx) > 4 ? 0 : 2) + (hash(a, 5) < 0.4 ? 1 : 0)) return dx === -7 ? 'L' : dx === 7 ? 'D' : (a + Math.floor(v / 4)) % 5 === 0 ? 'D' : 'T';
  return 'z';
}), 'k', 'K', 'z');
if (AGE === 1) inked(g, t => {                                                               // timber gatehouse astride the wall
  const u0 = -0.04, u1 = TW + 0.14, v0 = GA / 32 - 0.3, v1 = GA / 32 + 0.3, gh = Z + 8;
  const q = box(t, u0, v0, u1, v1, 0, gh,
    (a, v) => AK.wallTex(a, gh - 1 - v, 0, { len: 16, H: gh, step: 8, pl: 5 }),
    (a, v) => {
      if (v >= 10 && a >= 3 && a <= 16) { if (a === 3 || a === 16 || v === 10) return 'u'; if (a >= 9 && a <= 10) return 'z'; return v === 14 || v === gh - 3 ? 'G' : (a % 2 ? 'T' : a < 9 ? 'L' : 'D'); }
      if (v >= 3 && v <= 6 && a >= 6 && a <= 13) return v === 6 ? 'w' : v === 3 ? 'u' : a === 6 || a === 13 ? 'T' : 'z';
      return AK.wallTex(a, gh - 1 - v, 1, { len: 16, H: gh, step: 8, pl: 5 });
    }, () => 'w');
  pixLine(t, q.Bm[0], q.Bm[1], q.Bm[0], q.Bm[1] + gh - 1, 'u');
  const ap = hipRoof(t, { L: [q.L[0] - 2, q.L[1] + 2], Bm: [q.Bm[0], q.Bm[1] + 3], Rr: [q.Rr[0] + 2, q.Rr[1] + 2], T: [q.T[0], q.T[1]] }, 12);
  AK.finial(t, Math.round(ap[0]), Math.round(ap[1]) - 1);
});
if (!DK) inked(g, t => { qF = tower(t, 0, 0, true, true, true); });

// ---- animated: banners (ripple), the dummy (wobble), Dark: smoke from the longhouse
function banner(t, A, B, a0, wdt, v0, len, f, emblem) {
  wall(t, A, B, Z + 40, (a, v) => {
    const i = a - a0; if (i < -1 || i > wdt) return null;
    if (v === v0) return i === -1 || i === wdt ? (AGE >= 2 ? 'h' : 'u') : 't';             // rod (gilt ends from the Castle Age)
    if (i < 0 || i >= wdt) return null;
    const notch = Math.abs(i - (wdt - 1) / 2), wave = ((i + f) % 4 < 2) ? 0 : 1;
    const end = v0 + len - Math.round(notch < 1.5 ? 2 : 0) + wave;
    if (v <= v0 || v > end) return null;
    if (v === end) return AGE === 3 ? (i % 2 ? Au[1] : Au[0]) : 'D';
    if (AGE === 3 && (i === 0 || i === wdt - 1)) return Au[i === 0 ? 0 : 2];
    const fold = (i + f) % 4;
    if (emblem && v >= v0 + 3 && v <= v0 + 8) { const ex = i - Math.floor(wdt / 2), ey = v - v0 - 3; if ((ex === ey - 2 || ex === 2 - ey) || (ey === 3 && Math.abs(ex) <= 2)) return AGE === 3 ? Au[0] : 'L'; }
    if (i === 0) return 'L'; if (i === wdt - 1) return 'D';
    return fold === 0 ? 'L' : fold === 2 ? 'D' : 'T';
  });
}
function dummy(t, f) {
  const [x, y] = DUM, s = [0, 1, 0, -1][f];
  stampL(t, x - 3, y - 6, `
..ut..
..tu..
..tu..
.ut.u.
ut...t
`);
  stampL(t, x - 5 + s, y - 20, `
...GSSG...
..GSssSG..
..GGGGGG..
...hHhi...
...hhHi...
uwwTTLDwwu
h..TLTD..h
...TLTD...
...TTTD...
...hTDi...
....hi....
`);
  pixSet(t, x + s, y - 9, 't');
}
function smoke(t, f) {
  if (!smokeAt) return;
  for (let k = 0; k < 3; k++) { const ph = (f + k * 4) / 12, x = smokeAt[0] + Math.round(Math.sin(ph * 6.28 + k) * 1.5 + ph * 4), y = smokeAt[1] - 2 - Math.round(ph * 16);
    const r = k === 0 ? 1 : 2; for (let yy = -r + 1; yy < r; yy++) for (let xx = -r + 1; xx < r; xx++) put(t, x + xx, y + yy, yy < 0 || xx < 0 ? 'V' : 'v'); }
}
const BLEN = [11, 13, 17, 19][AGE];
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(gBack);
  inked(q, t => dummy(t, f));
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== gBack[y][x]) q[y][x] = g[y][x];
  inked(q, t => banner(t, L, Bm, 39, 15, 2, BLEN, f, AGE >= 1));
  const SB = AGE >= 2 ? [6, 10, AGE === 3 ? 15 : 13] : [8, 7, 10];
  if (qL) inked(q, t => banner(t, qL.L, qL.Bm, SB[0], SB[1], 1 + (AGE === 3 ? 2 : 0), SB[2], f + 1, false));
  if (qR) inked(q, t => banner(t, qR.Bm, qR.Rr, SB[0] - 1, SB[1], 1 + (AGE === 3 ? 2 : 0), SB[2], f + 2, false));
  tufts(q, { s: 5 + AGE, dens: STONE ? 0.36 : 0.44, skip: (x, y, c) => 'zDTL'.includes(c) });
  outline(q, 'k', 'K'); tuftInk(q);
  smoke(q, f);
  frames.push(pixText(q));
}

// palette: Castle's ashlar; other ages re-tone the stone letters to the age kit's stone (Imperial limestone, footings earlier)
const SC = AK.S.map(c => AK.pal[c]);
const stonePal = AGE === 2
  ? { a: '#c8bca6', b: '#b3a692', c: '#9a8b78', m: '#7a6d60', d: '#8d8478', e: '#7d7468', f: '#6a6258', n: '#4f4840', q: '#ddd2bc', Q: '#a39b8e', p: '#857868', P: '#5a524a', o: '#d6cbb5', O: '#a89e90' }
  : { a: SC[0], b: SC[1], c: SC[2], m: SC[3], d: SC[2], e: SC[3], f: SC[4], n: SC[5], q: SC[0], Q: SC[3], p: SC[3], P: SC[4], o: SC[0], O: SC[2] };
// code-drawn flag: on the front tower (crenellated top / roof apex), or on the front corner stake in the Dark Age
const FLAGS = DK ? [[0, -(Z + PZ - 1), 18]] : [[Math.round(qF.ap[0]) - bx, Math.round(qF.ap[1]) - by + (AGE === 2 ? 0 : 1), AGE === 3 ? 14 : 16]];
return {
  id: 'barracks', kind: 'building', footprint: [W, H], anchor: [bx, by], flags: FLAGS,
  palette: {
    ...AK.pal, ...NAT,
    k: '#24180f', K: '#4a3520',                                                  // ink (lit side softer)
    ...stonePal,                                                                 // stone faces, mortar, quoins, plinth, coping
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730',                      // packed earth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', z: '#1e1610',        // timber, recess
    N: '#3a2c1f', M: '#2a2018',                                                  // under the walk (timber ages)
    r: '#d0603a', R: '#a0482e', x: '#7e3424', X: '#5a2418',                      // roof tiles (Castle hall)
    h: '#e6c272', H: '#d8ab4f', i: '#a87a32', v: '#b8b0a4', V: '#dcd6cc',        // straw / gilt; smoke
    s: '#e6eaee', S: '#9aa0a6', G: '#5f656c',                                    // steel / iron
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 0);
