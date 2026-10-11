// @pixel mine
// Mining camp (2×2), one variant per age (AGE, AK = pixAgeKit(AGE) from gen/ages/wrap.mjs):
//   Dark     a crude pit ringed with fieldstones under a log windlass (forked posts, a drum, a crank that turns), a log ladder
//            out of the pit, a low wattle store under a thatched lean-to with a team hide in its doorway, a basket of ore,
//            a team strip tied to the windlass post.
//   Feudal   a coursed-stone ore store with a board roof and a team-colour door, a timber-cribbed shaft with a headframe,
//            pulley and bucket, rails with an ore cart, pit props leaning on the end wall, a loft hatch in the boarded gable.
//   Castle   a stone-footed, iron-strapped headframe, a stone collar on the shaft, a taller dressed-stone winding house under
//            red tiles with iron finials, a team door in a stone surround and a team banner on its wall.
//   Imperial a tall headframe with a big spoked wheel and gilt orbs on its posts, an ore chute into the cart, a limestone
//            winding house under slate with gilt cresting, a gilt-keyed team door, an arched window, gilt-fringed banners.
// Every age: a low heap of rock crowned with gold ore at the rail end (round 2: the old big gold heap was too much),
// quarried stone by the front edge.
// idle ×4: the pulley / wheel / windlass crank turns, the bucket rides on its rope, glints twinkle across the gold.
// Drawn by drafts/building.mine.js: pixDraw(pixAge(PIXELS.mine,b),'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ---- local kit: iso faces with surface coordinates, structured textures, selective outline, seeded rng ----
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const clone = gr => gr.map(r => r.slice());
const hash = (x, y, k = 0) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mulberry = s => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** footprint coords (a along the T→Rr edge, c along T→L, in tiles; z up in px) → cell */
const iso = (a, c, z = 0) => [OX + (a - c) * 32, OY + (a + c) * 16 - z];
const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
/** Fill the parallelogram o + s·u + t·v (s,t ∈ [0,1)); fn(s,t,x,y) → char or null. tri: only s+t ≤ 1. */
function face(gr, o, u, v, fn, tri) {
  const det = u[0] * v[1] - u[1] * v[0]; if (!det) return;
  const xs = [o[0], o[0] + u[0], o[0] + v[0], o[0] + u[0] + v[0]], ys = [o[1], o[1] + u[1], o[1] + v[1], o[1] + u[1] + v[1]];
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
    const px = x + 0.5 - o[0], py = y + 0.5 - o[1];
    const s = (px * v[1] - py * v[0]) / det, t = (u[0] * py - u[1] * px) / det;
    if (s < 0 || s >= 1 || t < 0 || t >= 1 || (tri && s + t > 1)) continue;
    const ch = fn(s, t, x, y); if (ch) pixSet(gr, x, y, ch);
  }
}
/** A vertical wall on the plane c = const (front-left, lit) from a0→a1, z0→z1. fn(U,V,x,y): U = px along the wall, V = px up. */
const wallC = (gr, c, a0, a1, z0, z1, fn) => { const o = iso(a0, c, z0); face(gr, o, sub2(iso(a1, c, z0), o), sub2(iso(a0, c, z1), o), (s, t, x, y) => fn(s * (a1 - a0) * 32, t * (z1 - z0), x, y)); };
/** A vertical wall on the plane a = const (front-right, shade) from c0→c1 (c1 < c0 runs Bm→Rr), z0→z1. */
const wallA = (gr, a, c0, c1, z0, z1, fn) => { const o = iso(a, c0, z0); face(gr, o, sub2(iso(a, c1, z0), o), sub2(iso(a, c0, z1), o), (s, t, x, y) => fn(s * Math.abs(c1 - c0) * 32, t * (z1 - z0), x, y)); };
/** A flat patch at height z over the footprint rectangle a0..a1 × c0..c1. fn(s,t,x,y) */
const flat = (gr, a0, a1, c0, c1, z, fn) => { const o = iso(a0, c0, z); face(gr, o, sub2(iso(a1, c0, z), o), sub2(iso(a0, c1, z), o), fn); };
/** Staggered block courses: course height ch, block length bl; tones = [lit-lip, body…, shadow] chars; mortar char. */
const blocks = (tones, mortar, ch, bl, k = 0) => (U, V) => {
  const vi = Math.floor(V), ui = Math.floor(U), row = Math.floor(vi / ch), r = vi - row * ch;
  const off = (row % 2) * Math.floor(bl / 2) + Math.floor(hash(row, k, 7) * 2), col = Math.floor((ui + off) / bl), cu = ui + off - col * bl;
  if (r === 0 || cu === 0) return mortar;
  const h = hash(col, row, k); const body = tones[1 + Math.floor(h * (tones.length - 2))];
  if (r === ch - 1 && cu > 0) return tones[0];                       // lit top lip
  if (r === 1 && cu === bl - 1) return tones[tones.length - 1];        // shaded under-corner
  return body;
};
/** Edge pass: every solid cell 4-adjacent to transparency becomes ink (inkOf(ch) may pick a material-dark or return null to keep). */
function outline(gr, inkOf) {
  const H = gr.length, W = gr[0].length, solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && gr[y][x] !== '.';
  const hits = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid(x, y) && (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1))) hits.push([x, y]);
  for (const [x, y] of hits) { const n = inkOf(gr[y][x], x, y); if (n) gr[y][x] = n; }
}
/** Remove lone single cells of `ch` (no 8-neighbour of the same char) by giving them the most common neighbour. */
function declump(gr, chars) {
  const H = gr.length, W = gr[0].length;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = gr[y][x]; if (!chars.includes(c)) continue;
    let same = 0; const cnt = {};
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const n = gr[y + dy][x + dx]; if (n === c) same++; cnt[n] = (cnt[n] || 0) + 1; }
    if (!same) { const best = Object.entries(cnt).filter(([n]) => n !== '.').sort((p, q) => q[1] - p[1])[0]; if (best) gr[y][x] = best[0]; }
  }
}
/** Line of cells drawn with a per-step char: fn(i, n) */
function line(gr, p, q, fn) { const n = Math.max(1, Math.round(Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])))); for (let i = 0; i <= n; i++) { const ch = typeof fn === 'function' ? fn(i, n) : fn; if (ch) pixSet(gr, p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n, ch); } }
/** Fill polygon pts with fn(x,y) per cell (or a char). */
function poly(gr, pts, fn) { const m = pixGrid(gr[0].length, gr.length); pixPoly(m, pts, '#'); for (let y = 0; y < gr.length; y++) for (let x = 0; x < gr[0].length; x++) if (m[y][x] === '#') { const ch = typeof fn === 'function' ? fn(x, y) : fn; if (ch) gr[y][x] = ch; } }
/** Disc of radius r centred at (cx,cy); fn(dx,dy,ring) → char or null. */
function disc(gr, cx, cy, r, fn) { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = dx * dx + dy * dy; if (d > r * r + r * 0.6) continue; const ring = d > (r - 1) * (r - 1) + (r - 1) * 0.6; const ch = fn(dx, dy, ring); if (ch) pixSet(gr, cx + dx, cy + dy, ch); } }
/** A heap (dome over an oval base) lit from the upper-left: tones = [light, mid, shade, deep]; lumps = cluster size for the lumpy texture. */
function heap(gr, cx, cy, rx, ry, tones, k = 0, lumps = 2) {
  const rb = Math.max(2, rx / 2.6), cells = [];
  for (let dy = -ry; dy <= rb; dy++) for (let dx = -rx; dx <= rx; dx++) {
    const q = dy <= 0 ? (dx / rx) ** 2 + (dy / ry) ** 2 : (dx / rx) ** 2 + (dy / rb) ** 2; if (q > 1) continue;
    const lx = Math.floor((dx + 40) / lumps), ly = Math.floor((dy + 40) / lumps), h = hash(lx, ly, k);
    const sub = ((dx + 40) % lumps === 0 || (dy + 40) % lumps === lumps - 1) ? 0.18 : 0;   // a shaded seam between lumps
    const l = -(dx / rx) * 0.55 - (Math.min(dy, 0) / ry) * 0.55 + (dy > 0 ? -0.5 : 0) + (h - 0.5) * 0.5 - sub;
    cells.push([cx + dx, cy + dy, l]);
  }
  for (const [x, y, l] of cells) pixSet(gr, x, y, l > 0.45 ? tones[0] : l > 0.05 ? tones[1] : l > -0.4 ? tones[2] : tones[3]);
}
const W = 2, H = 2, F = AGE === 1;
const Z = [8, 12, 15, 17][AGE], ROOF = [9, 14, 15, 16][AGE], HZ = [11, 30, 34, 42][AGE];
const { R, S, Au, Fe } = AK, TW = AK.W;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 14;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const rnd = mulberry(17);

// ---- ground: gravel and spoil in 2×2 clusters, a trodden darker band where the cart runs
const GROUND = 'efEFh';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => { const h = hash(x >> 1, y >> 1, 5), c = t * 2; if (Math.abs(c - 1.55) < 0.16 && s > 0.45) return h < 0.5 ? 'f' : 'e'; return h < 0.16 ? 'f' : h < 0.3 ? 'E' : h < 0.36 ? 'h' : 'e'; });

// ---- ore store on the back strip
const A0 = 0.05, A1 = 1.95, C0 = 0.05, C1 = 0.86;
if (F) {
// ---- ore store on the back strip: stone courses, plinth, quoins, a timber-framed doorway with a team door
const litStone = blocks(['P', 'p', 'q', 'p', 'Q'], 'j', 4, 8, 1), shStone = blocks(['q', 'Q', 'U', 'Q', 'V'], 'J', 4, 8, 2);
wallC(g, C1, A0, A1, 0, Z, (U, V) => (V < 2 ? (Math.floor(U) % 6 === 0 ? 'j' : 'Q') : litStone(U, V - 2)));
wallA(g, A1, C1, C0, 0, Z, (U, V) => (V < 2 ? (Math.floor(U) % 6 === 0 ? 'J' : 'V') : shStone(U, V - 2)));
{ const p = iso(A1, C1, 0); for (let z = 2; z < Z; z++) { const row = Math.floor((z - 2) / 4), r = (z - 2) % 4; const len = row % 2 ? 2 : 4; for (let i = 0; i < len; i++) pixSet(g, p[0] - 1 - i, p[1] - z + Math.floor((i + 1) / 2), r === 0 ? 'j' : r === 3 ? 'P' : 'p'); pixSet(g, p[0], p[1] - z, r === 0 ? 'J' : 'q'); } }
// doorway: dark recess, timber jambs and lintel, a team-colour plank door standing open against the wall
{ const da = 1.04, dw = 0.36, dh = 10;
  wallC(g, C1, da, da + dw, 0, dh, (U, V) => { const u = Math.floor(U); if (V >= dh - 2) return V >= dh - 1 ? 'w' : 'v'; if (u < 1) return 'w'; if (u >= 10) return 'v'; return V < 1 ? 'i' : (u < 3 ? 'K' : 'i'); });
  wallC(g, C1 + 0.02, da - 0.24, da, 0, dh - 2, (U, V) => { const u = Math.floor(U); if (u === 0) return 'D'; if (Math.floor(V) === 2 || Math.floor(V) === 6) return 'k'; return u % 3 === 0 ? 'D' : u > 5 ? 'T' : 'L'; });
  // a lantern hook glinting by the door
  const l = iso(da + dw + 0.06, C1, 8); pixSet(g, l[0], l[1], 'Y'); pixSet(g, l[0], l[1] + 1, 'y'); }
// a pick leaning on the store wall, painted before the roof: it stands under the eave, so it is short enough for its head to
// show below the eave line (anything above ~8 px on the wall plane is behind the roof)
{ const p = iso(1.66, C1, 0); line(g, [p[0] - 2, p[1]], [p[0], p[1] - 4], 'w'); line(g, [p[0] - 1, p[1]], [p[0] + 1, p[1] - 4], 'v');
  pixStamp(g, p[0] - 3, p[1] - 6, `
kkkkkkk
kmMMMnk
.kk.kk.
`); }
// gable roof of weathered boards, ridge along a; eave shadow under the front
const RA0 = -0.02, RA1 = 2.0, RC0 = 0.0, RC1 = 0.98, RR = 0.48;
wallC(g, C1, A0, A1, Z - 2, Z, () => 'k');
{ const o = iso(RA0, RC0, Z), u = sub2(iso(RA1, RC0, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o); face(g, o, u, v, (s) => (Math.floor(s * u[0]) % 4 === 0 ? 'c' : 'a')); }
// gable end: upright boards on a tie beam, a loft hatch for hoisting gear in, the hoist beam above it
{ const span = (RC1 - RC0) * 32;
  wallA(g, RA1, RC1, RC0, Z, Z + ROOF, (U, V) => {
    const c = RC1 - U / 32, top = ROOF * (1 - Math.abs(c - RR) / (c > RR ? RC1 - RR : RR - RC0));
    if (V > top) return null; if (V < 2) return V < 1 ? 'c' : 'B';                     // tie beam
    const hu = U - span / 2; if (Math.abs(hu) < 3.5 && V >= 3 && V < 9) return Math.abs(hu) > 2.5 || V < 4 || V >= 8 ? 'B' : 'i';   // hatch
    return Math.floor(U) % 4 === 0 ? 'c' : Math.floor(U) % 4 === 1 ? 'b' : 'a';
  }); }

{ const o = iso(RA0, RC1, Z), u = sub2(iso(RA1, RC1, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o);
  face(g, o, u, v, (s, t, x, y) => {
    const U = s * u[0], b = Math.floor(U / 4), cu = U - b * 4, h = hash(b, 0, 3);
    if (cu < 1) return 'c';                                     // gap between boards
    if (t > 0.3 && t < 0.38) return 'c';                        // batten shadow
    if (t >= 0.38 && t < 0.46) return 'A';                      // batten lit
    if (cu < 2) return t > 0.85 ? 'A' : 'B';                     // lit board edge
    return h < 0.25 ? 'b' : (s > 0.7 ? 'b' : 'B');
  }); }
line(g, iso(RA0, RR, Z + ROOF), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'k');
line(g, iso(RA1, RC1, Z), iso(RA1, RR, Z + ROOF), 'k'); line(g, iso(RA1, RC0, Z), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0, RC0, Z), iso(RA1, RC0, Z), 'k');

} else if (AGE === 0) storeDark(); else storeAge();

// a pick leaning on the store wall at a
function pick(a) { const p = iso(a, C1, 0); line(g, [p[0] - 2, p[1]], [p[0], p[1] - 4], 'w'); line(g, [p[0] - 1, p[1]], [p[0] + 1, p[1] - 4], 'v');
  pixStamp(g, p[0] - 3, p[1] - 6, `
kkkkkkk
kmMMMnk
.kk.kk.
`); }
// Dark: a low wattle store under a thatched lean-to; a low doorway hung with a team hide drawn half aside
function thatch(x, d) {
  const band = Math.floor(d / 4), v = d - band * 4, hx = hash(x, band, 13);
  if (v === 0 || (v === 1 && hx < 0.35)) return R[5];
  const st = hash(x, band, 7), base = v >= 3 ? 1 : 2;
  return R[st < 0.22 ? base + 1 : st > 0.9 ? base - 1 : base];
}
function storeDark() {
  const ZB = 15, LC = 0.92, zAt = c => ZB - (ZB - Z) * c / LC, hw = Math.floor(zAt(C1)), len = (A1 - A0) * 32;
  const d0 = 30, d1 = 41, dh = 6;
  wallC(g, C1, A0, A1, 0, hw, (U, V) => { const u = Math.floor(U), v = Math.floor(V);
    if (u >= d0 && u <= d1 && v <= dh) { const su = u - d0, n = d1 - d0;
      if (v >= dh - 1) return v === dh ? TW[0] : TW[2]; if (su === 0 || su === n) return TW[1];
      if (su >= n - 3 || v < 1) return AK.DEEP;                                          // the gap where the hide is drawn aside
      return su === 1 ? 'L' : (su + (v >> 2)) % 4 === 0 ? 'D' : 'T'; }
    return AK.wallTex(U, V, 0, { len, H: hw, pl: 1 }); });
  wallA(g, A1, C1, C0, 0, ZB, (U, V) => { const top = zAt(C1 - U / 32) - 1; return V > top ? null : AK.wallTex(U, V, 1, { len: 26, H: Math.floor(top) + 1, pl: 1 }); });
  pick(1.66);
  const LA0 = -0.02, LA1 = 2.0;
  { const o = iso(LA0, LC, Z), u = sub2(iso(LA1, LC, Z), o), v = sub2(iso(LA0, 0, ZB), o), off = -(o[1] - 0.5 * o[0]);
    face(g, o, u, v, (s, t, x, y) => thatch(x, Math.floor(0.5 * x - y - off))); }
  { const e = iso(LA1, LC, Z), t = iso(LA1, 0, ZB); line(g, e, t, R[4]); line(g, [e[0], e[1] + 1], [t[0], t[1] + 1], R[5]); }
  line(g, iso(LA0, 0, ZB), iso(LA1, 0, ZB), 'k'); AK.crest(g, iso(LA0 + 0.04, 0.03, ZB - 1), iso(LA1 - 0.04, 0.03, ZB - 1));
  line(g, iso(LA0, LC, Z), iso(LA1, LC, Z), 'k');
  { const e0 = iso(LA0, LC, Z), e1 = iso(LA1, LC, Z);
    for (let x = Math.ceil(e0[0]) + 1; x < e1[0]; x++) { const y = Math.round(e0[1] + (x - e0[0]) * 0.5), h = hash(x, 31); if (h < 0.55) pixSet(g, x, y + 1, R[h < 0.2 ? 3 : 5]); if (h < 0.18) pixSet(g, x, y + 2, R[6]); } }
  for (const a of [LA0 + 0.06, LA1 - 0.08]) { const p = iso(a, 0.02, ZB); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 1); }
}
// Castle / Imperial: a winding house in the age's stone under the age's roof, a team door in a stone surround, a banner
function storeAge() {
  const len = (A1 - A0) * 32, elen = (C1 - C0) * 32, d0 = 31, d1 = 43, dh = Z - 3, n = d1 - d0;
  const arch = (su, h) => { const r = n / 2, dh2 = h - (dh - r); return dh2 > 0 && Math.hypot(su - r, dh2 * 1.4) > r + 0.3; };
  wallC(g, C1, A0, A1, 0, Z, (U, V) => { const u = Math.floor(U), v = Math.floor(V), su = u - d0;
    if (su >= 0 && su <= n && v <= dh && !arch(su, v)) {
      if (su <= 1 || su >= n - 1 || arch(su, v + 2)) return AGE === 3 && su === n / 2 && v >= dh - 2 ? Au[0] : su === 0 || su === n ? S[1] : S[0];
      if (v < 1) return S[2];
      if (v === 3 || v === dh - 5) return Fe[1];
      return su === 2 ? 'L' : su === n - 2 || su === n / 2 ? 'D' : 'T'; }
    return AK.wallTex(U, V, 0, { len, H: Z }); });
  wallA(g, A1, C1, C0, 0, Z, (U, V) => AK.wallTex(U, V, 1, { len: elen, H: Z }));
  { const o = iso(A0, C1, 0), u = 50; AK.windowAt(g, o[0] + u, Math.round(o[1] + u * 0.5 - Z * 0.42), 0.5, 0); }
  { const o = iso(A0, C1, 0), u = 22; AK.banner(g, o[0] + u, Math.round(o[1] + u * 0.5 - Z + 3), 0.5, 5, AGE === 3 ? 10 : 9); }
  { const l = iso(1.46, C1, Z - 5); pixSet(g, l[0], l[1], Fe[1]); pixSet(g, l[0], l[1] + 1, 'Y'); pixSet(g, l[0], l[1] + 2, 'y'); }   // lantern by the door
  pick(1.86);
  const RA0 = -0.02, RA1 = 2.0, RC0 = 0.0, RC1 = 0.98, RR = 0.48;
  wallC(g, C1, A0, A1, Z - 2, Z, () => 'k');
  { const o = iso(RA0, RC0, Z), u = sub2(iso(RA1, RC0, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o); face(g, o, u, v, (s, t, x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true })); }
  { const span = (RC1 - RC0) * 32;
    wallA(g, RA1, RC1, RC0, Z, Z + ROOF, (U, V) => {
      const c = RC1 - U / 32, top = ROOF * (1 - Math.abs(c - RR) / (c > RR ? RC1 - RR : RR - RC0));
      if (V > top) return null;
      const hu = U - span / 2; if (Math.abs(hu) < 3.5 && V >= 3 && V < 9) return Math.abs(hu) > 2.5 || V < 4 || V >= 8 ? (AGE === 3 ? Au[1] : S[0]) : 'i';   // loft hatch
      return AK.wallTex(U, Z + V, 1, { len: span, H: 999, pl: 0 }); }); }
  { const o = iso(RA0, RC1, Z), u = sub2(iso(RA1, RC1, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o), off = -(o[1] - 0.5 * o[0]);
    face(g, o, u, v, (s, t, x, y) => AK.roofXY(x, y, 0.5, 0, { off })); }
  line(g, iso(RA0, RR, Z + ROOF), iso(RA1, RR, Z + ROOF), 'k');
  line(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'k');
  line(g, iso(RA1, RC1, Z), iso(RA1, RR, Z + ROOF), 'k'); line(g, iso(RA1, RC0, Z), iso(RA1, RR, Z + ROOF), 'k');
  line(g, iso(RA0, RC0, Z), iso(RA1, RC0, Z), 'k');
  line(g, sub2(iso(RA1, RC1, Z), [1, 0]), sub2(iso(RA1, RR, Z + ROOF), [1, -1]), AGE === 3 ? Au[1] : S[0]);
  line(g, iso(RA0 + 0.04, RC1 - 0.02, Z), iso(RA0 + 0.04, RR, Z + ROOF), R[0]);
  AK.crest(g, iso(RA0 + 0.03, RR, Z + ROOF - 1), iso(RA1 - 0.03, RR, Z + ROOF - 1));
  if (AGE === 3) AK.trim(g, iso(RA0 + 0.03, RC1, Z), iso(RA1 - 0.03, RC1, Z), -1);
  for (const a of [RA0 + 0.03, RA1 - 0.03]) { const p = iso(a, RR, Z + ROOF); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 2); }
}

// ---- pit props for the shaft leaning on the store's end wall, then the gold heap where the rails end
for (const [c, k] of [[0.22, 0], [0.34, 1], [0.46, 0], [0.58, 1], [0.7, 0]]) {
  const f0 = iso(A1 + 0.045, c + 0.03, 0), t0 = iso(A1, c, Z - 1 - k);
  line(g, f0, t0, 'w'); line(g, [f0[0] + 1, f0[1]], [t0[0] + 1, t0[1]], 'v'); pixSet(g, t0[0], t0[1] - 1, 'W');
}
// (round 2: the old knee-high gold heap was too much) a low heap of rock with gold-bearing ore crowning it
heap(g, ...iso(1.76, 1.18, 0), 8, 5, ['P', 'q', 'U', 'J'], 3, 2);
heap(g, ...iso(1.74, 1.2, 3), 5, 3, ['Y', 'y', 'z', 'Z'], 3, 2);
// ---- the shaft: timber cribbing, inner walls going down into the dark
const S0 = 0.16, S1 = 0.86, T0 = 1.14, T1 = 1.84;
flat(g, S0, S1, T0, T1, 0, () => 'K');
wallC(g, T0, S0, S1, -9, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? (Math.floor(U) % 5 === 0 ? 'v' : 'w') : V > -6 ? (hash(x >> 1, y, 1) < 0.4 ? 'U' : 'Q') : 'V') : null));
wallA(g, S0, T1, T0, -9, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? 'v' : V > -6 ? 'V' : 'J') : null));
// cribbing: a plank collar on the back rims, raised log faces on the front rims
line(g, iso(S0, T0, 0), iso(S1, T0, 0), 'w'); line(g, iso(S0, T0, 1), iso(S1, T0, 1), 'W');
line(g, iso(S0, T0, 0), iso(S0, T1, 0), 'W'); line(g, iso(S0, T0, 1), iso(S0, T1, 1), 'w');
if (F) {
wallC(g, T1, S0, S1 + 0.04, 0, 3, (U, V) => (Math.floor(U) % 11 === 0 ? 'V' : V >= 2 ? 'w' : V >= 1 ? 'W' : 'v'));
wallA(g, S1 + 0.04, T1, T0, 0, 3, (U, V) => (Math.floor(U) % 11 === 0 ? 'V' : V >= 2 ? 'W' : 'v'));
} else { // Dark: a ring of rough fieldstones; Castle/Imperial: a coursed stone collar with a lit coping
  const rim = AGE === 0 ? 2 : 4, cop = (lit) => (U, V) => { const u = Math.floor(U), v = Math.floor(V);
    if (AGE === 0) return (u % 5 === 0 || v === 0) ? S[5] : hash(u >> 2, 3, lit) < 0.5 ? S[lit ? 1 : 3] : S[lit ? 2 : 4];
    if (v === rim - 1) return S[lit ? 0 : 2]; return (u + (v >> 1) * 3) % 7 === 0 || v === 1 ? S[5] : S[lit ? 1 : 3]; };
  wallC(g, T1, S0, S1 + 0.04, 0, rim, cop(true)); wallA(g, S1 + 0.04, T1, T0, 0, rim, cop(false));
  if (AGE === 0) { // the log ladder standing up out of the pit
    const p = iso(0.34, 1.24, 0); for (let z = -5; z < 13; z++) { pixSet(g, p[0] + Math.round(z / 6), p[1] - z, 'w'); pixSet(g, p[0] + 5 + Math.round(z / 6), p[1] - z, 'v'); }
    for (let z = -3; z < 12; z += 3) line(g, [p[0] + 1 + Math.round(z / 6), p[1] - z + 1], [p[0] + 4 + Math.round(z / 6), p[1] - z + 1], 'W');
  }
}

// ---- rails from the shaft to the gold heap, sleepers under them, the ore cart just out of the shaft
if (AGE >= 1) {
for (let a = 0.92; a < 1.62; a += 0.11) line(g, iso(a, 1.43, 0), iso(a, 1.69, 0), 'v');
line(g, iso(0.9, 1.47, 0), iso(1.6, 1.47, 0), 'n'); line(g, iso(0.9, 1.47, 1), iso(1.6, 1.47, 1), 'M');
line(g, iso(0.9, 1.65, 0), iso(1.6, 1.65, 0), 'n'); line(g, iso(0.9, 1.65, 1), iso(1.6, 1.65, 1), 'M');
// buffer stop at the rail end
wallC(g, 1.7, 1.6, 1.66, 0, 4, (U, V) => (V >= 3 ? 'w' : 'v'));
}
// (the cart stands in front of the headframe's right post, so it is painted per frame after that post: see cart())
function cart(g) { const ca0 = 1.06, ca1 = 1.4, cc0 = 1.43, cc1 = 1.69, cz0 = 3, cz1 = 9;
  // the box's open top: dark inside, back rims, a mound of ore that sits inside and only crowns above the rim
  flat(g, ca0, ca1, cc0, cc1, cz1, (s, t) => (s < 0.08 || t < 0.1 ? 'W' : 'i'));
  heap(g, ...iso((ca0 + ca1) / 2, (cc0 + cc1) / 2, cz1 - 2), 8, 4, ['Y', 'y', 'z', 'Z'], 9);
  wallC(g, cc1, ca0, ca1, cz0, cz1, (U, V) => { const u = Math.floor(U); if (u === 0 || u === 10) return 'n'; if (V >= cz1 - cz0 - 1) return 'w'; return Math.floor(V) === 2 ? 'n' : 'W'; });
  wallA(g, ca1, cc1, cc0, cz0, cz1, (U, V) => (V >= cz1 - cz0 - 1 ? 'W' : Math.floor(V) === 2 ? 'J' : 'v'));
  for (const a of [ca0 + 0.07, ca1 - 0.07]) { const p = iso(a, cc1 + 0.01, 2); disc(g, Math.round(p[0]), Math.round(p[1]), 2, (dx, dy, ring) => (ring ? 'k' : dx + dy < 0 ? 'M' : 'n')); }
}
// quarried stone by the front edge, clear of the rails
heap(g, ...iso(1.62, 1.9, 0), 7, 5, ['P', 'p', 'Q', 'V'], 4, 3);
// Dark: a wicker basket of ore set down by the pit instead of the cart
if (AGE === 0) { const p = iso(1.3, 1.58, 0); pixStamp(g, p[0] - 4, p[1] - 7, `
..kkkkk..
.kyYyzyk.
kzyYyzyzk
kWwWwWwWk
kwWwWwWwk
kWwWwWwWk
.kkkkkkk.
`); }

// ---- headframe over the shaft: two posts with braces, a crossbeam, the team banner
const HL = AGE === 0 ? 0.2 : 0.08, HR = AGE === 0 ? 0.82 : 0.94, HC = 1.5, PR = [0, 4, 4, 6][AGE];
const post = (gr, a) => { const p = iso(a, HC, 0); for (let z = 0; z <= HZ; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); }
  if (AGE >= 2) { for (const z of [10, 20, 30]) if (z < HZ - 2) { pixSet(gr, p[0], p[1] - z, Fe[0]); pixSet(gr, p[0] + 1, p[1] - z, Fe[1]); }   // iron straps
    for (let z = 0; z < 4; z++) for (let i = -1; i <= 2; i++) pixSet(gr, p[0] + i, p[1] - z, z === 3 ? (i < 1 ? S[0] : S[1]) : z === 0 ? S[5] : (i < 1 ? S[1] : S[3])); }   // stone footing
  if (AGE >= 2) AK.finial(gr, p[0], p[1] - HZ - 2); };
// Dark windlass: a forked post at each end of a log drum, rope from the drum into the pit
const fork = (gr, a) => { const p = iso(a, HC, 0); for (let z = 0; z <= HZ; z++) { pixSet(gr, p[0], p[1] - z, TW[0]); pixSet(gr, p[0] + 1, p[1] - z, TW[1]); }
  pixSet(gr, p[0] - 1, p[1] - HZ - 1, TW[0]); pixSet(gr, p[0] - 1, p[1] - HZ - 2, TW[1]); pixSet(gr, p[0] + 2, p[1] - HZ - 1, TW[1]); pixSet(gr, p[0] + 2, p[1] - HZ - 2, TW[2]);
  pixSet(gr, p[0] - 1, p[1], S[2]); pixSet(gr, p[0] + 2, p[1], S[3]); };
if (AGE === 0) fork(g, HL);
else { post(g, HL);
  { const p = iso(HL, HC, 0); line(g, [p[0] - 5, p[1] + 2], [p[0], p[1] - 12], 'v'); if (AGE === 3) line(g, [p[0] - 7, p[1] + 3], [p[0], p[1] - 24], 'v'); } }
const beamL = iso(HL, HC, HZ), beamR = iso(HR, HC, HZ);
// rope from the pulley into the shaft; drawn per frame with the bucket
const pul = iso((HL + HR) / 2, HC, HZ + 2);
// glints: on the gold of the heap and (Feudal on) the cart, (Dark) the ore basket
const GLINT = AGE === 0 ? [[iso(1.72, 1.18, 5), iso(1.3, 1.6, 6), iso(1.78, 1.22, 3), iso(1.26, 1.56, 5)], [iso(1.7, 1.16, 4), iso(1.76, 1.22, 2), iso(1.32, 1.6, 6), iso(1.8, 1.2, 4)]]
  : [[iso(1.72, 1.18, 5), iso(1.2, 1.5, 11), iso(1.78, 1.22, 3), iso(1.28, 1.58, 9)], [iso(1.7, 1.16, 4), iso(1.76, 1.22, 2), iso(1.16, 1.54, 10), iso(1.8, 1.2, 4)]];
function animated(fr, f) {
  if (AGE === 0) { // the windlass: a log drum between the forks, the crank handle turning a quarter per frame
    const d0 = iso(HL, HC, HZ), d1 = iso(HR, HC, HZ);
    for (let r = -2; r <= 2; r++) line(fr, [d0[0], d0[1] + r], [d1[0], d1[1] + r], Math.abs(r) === 2 ? 'k' : r === -1 ? 'w' : r === 1 ? 'v' : 'W');
    for (let i = 0; i < 5; i++) { const q = lerp(d0, d1, 0.3 + i * 0.05); pixSet(fr, q[0], q[1] - 1, 'R'); pixSet(fr, q[0], q[1], 'R'); }   // rope wound on it
    const an = f * Math.PI / 2, cx = d1[0] + 3, cy = d1[1] + 1, hx = Math.round(cx + Math.cos(an) * 3), hy = Math.round(cy + Math.sin(an) * 3);
    line(fr, [d1[0] + 1, d1[1]], [cx, cy], 'M'); line(fr, [cx, cy], [hx, hy], 'w'); pixSet(fr, hx, hy, 'W'); pixSet(fr, hx + 1, hy, 'v');
    const bob = [0, 1, 2, 1][f], rx = Math.round(lerp(d0, d1, 0.45)[0]), top = Math.round(lerp(d0, d1, 0.45)[1]) + 2, bot = top + 10 + bob;
    for (let y = top; y < bot; y++) pixSet(fr, rx, y, 'R');
    pixStamp(fr, rx - 3, bot, `
.kkkkk.
kwwwWvk
kWyYyvk
.kvvvk.
`);
  } else {
  // pulley wheel (radius PR) with spokes advancing 45° per frame; the Imperial wheel is bigger, 8 spokes and a gilt hub
  disc(fr, Math.round(pul[0]), Math.round(pul[1]), PR, (dx, dy, ring) => (ring ? 'k' : 'v'));
  disc(fr, Math.round(pul[0]), Math.round(pul[1]), PR - 1, (dx, dy, ring) => (ring ? 'w' : null));
  for (let j = 0; j < (AGE === 3 ? 4 : 2); j++) { const an = f * Math.PI / 4 + j * Math.PI / (AGE === 3 ? 4 : 2), rr = PR - 1.4; line(fr, [pul[0] - Math.cos(an) * rr, pul[1] - Math.sin(an) * rr], [pul[0] + Math.cos(an) * rr, pul[1] + Math.sin(an) * rr], 'W'); }
  pixSet(fr, pul[0], pul[1], AGE === 3 ? Au[1] : 'M');
  // crossbeam drawn over the axle
  line(fr, beamL, beamR, 'w'); line(fr, [beamL[0], beamL[1] + 1], [beamR[0], beamR[1] + 1], 'v'); line(fr, [beamL[0], beamL[1] - 1], [beamR[0], beamR[1] - 1], 'k');
  if (AGE >= 2) for (const t of [0.12, 0.88]) { const q = lerp(beamL, beamR, t); pixSet(fr, q[0], q[1], Fe[0]); pixSet(fr, q[0], q[1] + 1, Fe[1]); }
  // rope + bucket bobbing
  const bob = [0, 1, 2, 1][f], rx = Math.round(pul[0]) - (PR - 1), top = Math.round(pul[1]), bot = top + HZ - 8 + bob;
  for (let y = top; y < bot; y++) pixSet(fr, rx, y, 'R');
  pixStamp(fr, rx - 3, bot, `
.kkkkk.
kwwwWvk
kWyYyvk
.kvvvk.
`);
  }
  // glints: one twinkle star per frame on the gold
  const gl = GLINT[0][f];
  const [gx, gy] = [Math.round(gl[0]), Math.round(gl[1])];
  pixSet(fr, gx, gy, 'G'); pixSet(fr, gx - 1, gy, 'Y'); pixSet(fr, gx + 1, gy, 'Y'); pixSet(fr, gx, gy - 1, 'Y'); pixSet(fr, gx, gy + 1, 'Y');
  const g2 = GLINT[1][(f + 2) % 4]; pixSet(fr, g2[0], g2[1], 'G');
}
function front(fr, f) {
  if (AGE === 0) { // right fork, and a team strip tied below its head, fluttering
    fork(fr, HR); const p = iso(HR, HC, HZ - 2);
    for (let i = 0; i < 8; i++) { const w = Math.round(Math.sin(i / 8 * Math.PI * 1.5 - f * Math.PI / 2) * (i / 8) * 1.4), hgt = Math.max(2, 5 - (i >> 1));
      for (let k = 0; k < hgt; k++) if (!(i === 7 && (k + f) % 2)) pixSet(fr, p[0] + 2 + i, p[1] + k + w + (5 - hgt >> 1), k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T'); }
    return;
  }
  post(fr, HR);
  const p = iso(HR, HC, 0); line(fr, [p[0] + 6, p[1] - 2], [p[0] + 1, p[1] - 13], 'v');
  if (AGE === 3) { line(fr, [p[0] + 8, p[1] - 1], [p[0] + 1, p[1] - 24], 'v');
    // ore chute: a sloping plank trough from the headframe down into the cart
    const c0 = iso(HR + 0.02, HC, 21), c1 = iso(1.2, 1.56, 11);
    line(fr, c0, c1, 'k'); line(fr, [c0[0], c0[1] + 1], [c1[0], c1[1] + 1], 'w'); line(fr, [c0[0], c0[1] + 2], [c1[0], c1[1] + 2], 'W'); line(fr, [c0[0], c0[1] + 3], [c1[0], c1[1] + 3], 'v');
    line(fr, [c0[0], c0[1] - 1], [c1[0], c1[1] - 1], Au[1]); for (const t of [0.35, 0.75]) { const q = lerp(c0, c1, t); pixSet(fr, q[0], q[1] + 1, 'Y'); pixSet(fr, q[0] + 1, q[1] + 1, 'y'); }
    const leg = lerp(c0, c1, 0.6); line(fr, [leg[0], leg[1] + 4], [leg[0], leg[1] + 13], 'v'); }
  // team banner hanging off the right post, below the beam (Castle: on an iron rod; Imperial: gilt rod, charge and fringe)
  const b = iso(HR, HC, HZ - 2);
  if (AGE === 1) pixStamp(fr, b[0] + 2, b[1], `
kkkkkkk
kLLTTTk
kLTTTTk
kLTTTDk
kLTTTDk
kLTTTDk
kTTTTDk
.kTDDk.
..kDk..
`);
  else pixStamp(fr, b[0] + 1, b[1], (AGE === 2 ? `
kjjjjjjjk
.kLLTTTk.
.kLTTTTk.
.kLTLTDk.
.kLTTTDk.
.kLTTTDk.
.kLTTTDk.
.kTTTTDk.
..kTDDk..
...kDk...
` : `
kbaaaaabk
.kLLTTTk.
.kLTaTDk.
.kLaaaDk.
.kLTaTDk.
.kLTTTDk.
.kLTTTDk.
.kbbbbbk.
..bkbkb..
`).replace(/j/g, Fe[1]).replace(/a/g, Au[0]).replace(/b/g, Au[1]));
}
const inkOf = ch => (GROUND.includes(ch) ? 'X' : 'k');
const frames = [];
for (let f = 0; f < 4; f++) { const fr = clone(g); animated(fr, f); front(fr, f); if (AGE >= 1) cart(fr); outline(fr, inkOf); frames.push(pixText(fr)); }

return {
  id: 'mine', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    e: '#8a7a62', E: '#9c8c72', f: '#76684f', F: '#6a5d48', h: '#a8a090', X: '#3e352a',          // gravel, spoil, rim
    P: '#b8b0a2', p: '#9a9285', q: '#8d8478', Q: '#6f6a60', U: '#625d55', V: '#4f4a44', j: '#575249', J: '#3c3833', // stone
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', K: '#1c1612', i: '#2a221b',                         // timber, shaft dark, doorway
    A: '#9e8a6c', B: '#857258', b: '#715f48', a: '#5e4e3b', c: '#3e3226',                         // weathered boards
    Y: '#ffe28a', y: '#e1b12c', z: '#a87a12', Z: '#6e4d0a', G: '#fffbe8',                         // gold + glint
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', R: '#c9b58e', k: '#24180f',                         // iron, rope, ink
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 0);
