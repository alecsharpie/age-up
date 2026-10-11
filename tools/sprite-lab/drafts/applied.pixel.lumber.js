// @pixel lumber
// Lumber camp (2×2): an open-fronted timber shed with a shingled gable roof and a team-colour valance, boards stacked inside,
// a log pile with cut ends to the front, a saw horse with a half-sawn log, the axe left in a stump, wood chips over packed earth.
// idle ×4: the bow saw rocks in its kerf and sawdust trickles, the team pennant on the corner pole flutters.
// Drawn by drafts/building.lumber.js: pixDraw(PIXELS.lumber,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ---- local kit: iso faces with surface coordinates, structured textures, selective outline, seeded rng ----
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
const W = 2, H = 2, Z = 14, ROOF = 16;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 11;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const rnd = mulberry(41);

// ---- ground: packed earth in 2×2 clusters, darker under the shed, sawdust around the work places
const GROUND = 'eEfhH';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => {
  const h = hash(x >> 1, y >> 1, 3), a = s * 2, c = t * 2;
  if (c < 1.1) return h < 0.25 ? 'f' : 'e';
  const dust = Math.hypot(a - 1.45, (c - 1.62) * 1.4) < 0.3;
  if (dust) return h < 0.45 ? 'h' : h < 0.75 ? 'H' : 'E';
  return h < 0.18 ? 'f' : h < 0.32 ? 'E' : 'e';
});

// ---- shed: inner back wall (dark planks), boards stacked inside, a plank end wall on the right
const A0 = 0.06, A1 = 1.94, C0 = 0.05, C1 = 1.0;
wallC(g, C0, A0, A1, 0, Z, (U, V) => { const v = Math.floor(V); return v % 3 === 0 ? 'i' : (hash(Math.floor(U / 9), v, 5) < 0.3 ? 'i' : 'I'); });
flat(g, A0, A1, C0, C1, 0, (s, t, x, y) => (hash(x >> 1, y, 9) < 0.3 ? 'i' : 'f'));
// stacked sawn boards against the back wall: courses of 2 px, lit top edge, end grain at the right
wallC(g, 0.32, 0.18, 1.2, 0, 8, (U, V) => { const v = Math.floor(V); if (U >= 31) return v % 2 ? 'o' : 'u'; return v % 2 ? 'w' : (hash(Math.floor(U / 7), v, 2) < 0.2 ? 'v' : 'W'); });
flat(g, 0.18, 1.2, 0.05, 0.32, 8, (s, t) => (t > 0.8 ? 'w' : 'W'));

// a log end-on (axis along c, cut face toward the front-left), a log lying along a, both as swept discs
const bark = (i) => (dx, dy, ring) => ring ? 'k' : dy <= -Math.ceil(dx / 2) - 1 ? 'w' : dy >= 1 ? (hash(i, dx, 4) < 0.25 ? 'V' : 'v') : 'W';
const cutFace = (dx, dy, ring) => { const d = Math.hypot(dx, dy); return ring ? 'k' : d > 2.4 ? 'v' : d < 0.8 ? 'u' : (d > 1.6 && d < 2.2) ? 'u' : (dx + dy < 0 ? 'O' : 'o'); };
function logC(gr, a, c0, c1, z, r) {
  const n = Math.round((c1 - c0) * 36);
  const at = i => { const p = iso(a, c0 + (c1 - c0) * i / n, z + r); return [Math.round(p[0]), Math.round(p[1])]; };
  for (let i = 0; i <= n; i++) { const p = at(i); disc(gr, p[0], p[1], r, () => 'k'); }
  for (let i = 0; i <= n; i++) { const p = at(i); disc(gr, p[0], p[1], r, (dx, dy, ring) => ring ? null : bark(i)(dx, dy, false)); }
  const p = at(n); disc(gr, p[0], p[1], r, cutFace);
}
function logA(gr, c, a0, a1, z, r) {
  const n = Math.round((a1 - a0) * 36);
  const at = i => { const p = iso(a0 + (a1 - a0) * i / n, c, z + r); return [Math.round(p[0]), Math.round(p[1])]; };
  for (let i = 0; i <= n; i++) { const p = at(i); disc(gr, p[0], p[1], r, () => 'k'); }
  for (let i = 0; i <= n; i++) { const p = at(i); disc(gr, p[0], p[1], r, (dx, dy, ring) => ring ? null : bark(i)(dx, dy, false)); }
  const p = iso(a1, c, z + r); disc(gr, Math.round(p[0]), Math.round(p[1]), r, (dx, dy, ring) => { const d = Math.hypot(dx, dy); return ring ? 'k' : d > 2.4 ? 'V' : d < 0.8 ? 'v' : (d > 1.6 && d < 2.2) ? 'v' : 'u'; });
}
// cut logs stored inside on the right, ends to the front
for (const [a, z] of [[1.42, 0], [1.62, 0], [1.82, 0], [1.52, 5], [1.72, 5]]) logC(g, a, 0.35, 0.86, z, 3);
// end wall a = A1 (after the stored logs, which lie behind it and show only through the open front): vertical boards with seams, sill at the bottom, shade deepening to the back
wallA(g, A1, C1, C0, 0, Z, (U, V) => { const u = Math.floor(U); if (V < 1) return 'V'; if (u % 4 === 3) return 'p'; return (u > 22 || (V > Z - 3)) ? 'R' : 'r'; });
// posts of the open front, sill beam
for (const a of [A0, 0.68, 1.32, A1]) { const p = iso(a, C1, 0); for (let z = 0; z < Z; z++) { pixSet(g, p[0], p[1] - z, 'w'); pixSet(g, p[0] + 1, p[1] - z, 'v'); } pixSet(g, p[0] - 1, p[1], 'V'); pixSet(g, p[0] + 2, p[1], 'V'); }
line(g, iso(A0, C1, 0), iso(A1, C1, 0), 'V');
// knee braces under the eave beam
for (const a of [0.68, 1.32]) { const p = iso(a, C1, Z - 2); line(g, [p[0] - 4, p[1] - 2], [p[0], p[1] + 2], 'v'); line(g, [p[0] + 1, p[1] + 2], [p[0] + 5, p[1] + 2 - 2 + 2], 'v'); }

// ---- gable roof, ridge along a: eave shadow, front slope in shingle courses, plank gable end, bargeboards
const RA0 = -0.06, RA1 = 1.99, RC0 = 0.0, RC1 = 1.14, RR = 0.53;
// eave beam + shadow band on the inner wall
wallC(g, C1, A0, A1, Z - 3, Z, (U, V) => (V >= 2 ? 'V' : 'i'));
// back slope (seen as a strip above the ridge): shingles in shade
{ const o = iso(RA0, RC0, Z), u = sub2(iso(RA1, RC0, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o);
  face(g, o, u, v, (s, t, x, y) => { const U = s * u[0], row = Math.floor(t * 4); return (Math.floor(U + row * 3) % 6 === 0) ? 'V' : row % 2 ? 'C' : 'b'; }); }
line(g, iso(RA0, RC0, Z), iso(RA1, RC0, Z), 'k');
// gable end (a = RA1), triangle of vertical boards
{ const pA = iso(RA1, RC1, Z), pB = iso(RA1, RC0, Z), pC = iso(RA1, RR, Z + ROOF);
  poly(g, [pA, pB, pC], (x, y) => ((x - pA[0]) % 4 === 3 ? 'p' : y > pA[1] - 3 ? 'R' : 'r')); }
// front slope: courses of wooden shingles with a lit butt edge and a dark gap line, staggered splits
{ const o = iso(RA0, RC1, Z), u = sub2(iso(RA1, RC1, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o), SL = Math.abs(v[1]);
  face(g, o, u, v, (s, t, x, y) => {
    const V = t * SL, row = Math.floor(V / 3), r = V - row * 3, U = s * u[0];
    const off = (row % 2) * 3, col = Math.floor((U + off) / 6), cu = U + off - col * 6;
    if (r < 1) return 'C';
    if (cu < 1) return 'C';
    const h = hash(col, row, 11);
    if (r < 2) return h < 0.2 ? 'B' : 'A';
    return h < 0.18 ? 'b' : (s > 0.72 && h < 0.5) ? 'b' : 'B';
  }); }
// bargeboards and ridge in ink, ridge cap lit
line(g, iso(RA0, RR, Z + ROOF), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0 + 0.03, RR + 0.03, Z + ROOF - 1), iso(RA1 - 0.03, RR + 0.03, Z + ROOF - 1), 'A');
line(g, iso(RA1, RC1, Z), iso(RA1, RR, Z + ROOF), 'k'); line(g, iso(RA1, RC0, Z), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'k');
// team-colour valance hung under the front eave: lit hem, body, scalloped dark fringe
wallC(g, RC1, RA0 + 0.04, RA1 - 0.04, Z - 5, Z - 1, (U, V) => { const u = Math.floor(U); if (V >= 3) return 'L'; if (V >= 1) return u % 8 === 0 ? 'D' : 'T'; return (u % 8) < 6 ? 'D' : null; });

// ---- yard props
// log pile, front-left: three layers, cut ends to the front
for (const [a, z] of [[0.16, 0], [0.38, 0], [0.6, 0], [0.82, 0], [0.27, 5], [0.49, 5], [0.71, 5], [0.38, 10], [0.6, 10]]) logC(g, a, 1.28, 1.84, z, 3);
// wedges/stakes holding the pile
for (const a of [0.06, 0.96]) { const p = iso(a, 1.84, 0); line(g, p, [p[0], p[1] - 6], 'v'); pixSet(g, p[0] + 1, p[1] - 5, 'w'); }
// saw horse: two X-trestles with a log across, front-right
const SH = { a0: 1.3, a1: 1.82, c: 1.5, z: 8 };
const trestle = (a) => { const b = iso(a, SH.c - 0.1, 0), f = iso(a, SH.c + 0.1, 0), tp = iso(a, SH.c, SH.z + 2); line(g, b, [tp[0] + 2, tp[1] - 2], 'v'); line(g, f, [tp[0] - 2, tp[1] - 2], 'w'); line(g, [f[0] + 1, f[1]], [tp[0] - 1, tp[1] - 2], 'v'); };
trestle(SH.a0 + 0.08);
logA(g, SH.c, SH.a0, SH.a1, SH.z, 3);
trestle(SH.a1 - 0.1);
// the kerf the saw sits in (a dark notch), sawdust heap under it
const kerf = iso(1.56, SH.c, SH.z + 6);
pixSet(g, kerf[0], kerf[1], 'k'); pixSet(g, kerf[0], kerf[1] + 1, 'k'); pixSet(g, kerf[0] + 1, kerf[1] + 1, 'k');
{ const h0 = iso(1.56, SH.c + 0.12, 0); pixStamp(g, h0[0] - 3, h0[1] - 2, `
..hhh..
.hHhhh.
hhHHhhh
`); }
// stump with the axe struck into it, front corner
{ const p = iso(1.16, 1.84, 0), r = 5;
  for (let z = 0; z <= 5; z++) for (let dx = -r; dx <= r; dx++) { const yy = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx)) / 2); pixSet(g, p[0] + dx, p[1] + yy - z, Math.abs(dx) === r || z === 0 ? 'k' : dx < -1 ? 'w' : dx > 2 ? 'v' : 'W'); }
  for (let dy = -3; dy <= 3; dy++) for (let dx = -r; dx <= r; dx++) { const d = Math.hypot(dx, dy * 2); if (d > r + 0.3) continue; pixSet(g, p[0] + dx, p[1] - 5 + dy, d > r - 0.9 ? 'k' : d > r - 1.9 ? 'v' : (Math.abs(d - 2.5) < 0.6) ? 'u' : (dx + dy < 0 ? 'O' : 'o')); }
  // axe: steel head bitten into the top, haft angled up to the right
  pixStamp(g, p[0] - 3, p[1] - 9, `
.kkk.
kmMMk
kmMnk
.kkk.
`);
  line(g, [p[0] + 1, p[1] - 8], [p[0] + 7, p[1] - 14], 'w'); line(g, [p[0] + 2, p[1] - 8], [p[0] + 8, p[1] - 14], 'v'); pixSet(g, p[0] + 8, p[1] - 15, 'k'); pixSet(g, p[0] + 9, p[1] - 15, 'k');
}
// wood chips: pairs of pale chips scattered round the stump and the trestle
for (let i = 0; i < 16; i++) {
  const a = 0.95 + rnd() * 0.95, c = 1.5 + rnd() * 0.45; if (a + c > 3.8 || Math.abs(a - 1.16) + Math.abs(c - 1.84) < 0.2) continue;
  const p = iso(a, c, 0); if (pixGet(g, p[0], p[1]) === '.' || pixGet(g, p[0] + 1, p[1]) === '.') continue;
  if (!GROUND.includes(pixGet(g, p[0], p[1]))) continue; pixSet(g, p[0], p[1], 'O'); pixSet(g, p[0] + 1, p[1], rnd() < 0.5 ? 'o' : 'u');
}

// ---- pennant pole at the shed's front-right corner
const pole = iso(2.02, 1.18, 0);
for (let z = 0; z < 42; z++) { pixSet(g, pole[0], pole[1] - z, 'W'); pixSet(g, pole[0] + 1, pole[1] - z, 'v'); }
pixSet(g, pole[0], pole[1] - 42, 'O'); pixSet(g, pole[0] + 1, pole[1] - 42, 'u');

// ---- animated parts: bow saw rocking in the kerf, sawdust falling, pennant waving
function pennant(fr, f) {
  const x0 = pole[0] + 2, y0 = pole[1] - 41, len = 11;
  for (let i = 0; i < len; i++) {
    const wave = Math.round(Math.sin((i / len) * Math.PI * 1.5 - f * Math.PI / 2) * 1.2 * (i / len));
    const hgt = Math.max(1, Math.round(6 * (1 - i / len)));
    const top = y0 + Math.round((6 - hgt) / 2) + wave;
    for (let k = 0; k < hgt; k++) pixSet(fr, x0 + i, top + k, k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T');
  }
}
function saw(fr, f) {
  const dx = [0, 1, 2, 1][f];
  const k = [kerf[0] + dx, kerf[1]];
  // blade along the log axis, frame arching above it, handles at the ends
  line(fr, [k[0] - 6, k[1] - 3 + 0], [k[0] + 6, k[1] + 3], 'n');
  line(fr, [k[0] - 6, k[1] - 4], [k[0] + 6, k[1] + 2], 'm');
  line(fr, [k[0] - 6, k[1] - 4], [k[0] - 5, k[1] - 10], 'W'); line(fr, [k[0] + 6, k[1] + 2], [k[0] + 7, k[1] - 4], 'W');
  line(fr, [k[0] - 5, k[1] - 10], [k[0] + 7, k[1] - 4], 'w');
  line(fr, [k[0] - 5, k[1] - 11], [k[0] + 7, k[1] - 5], 'k');
  // sawdust falling from the cut: a 2-cell fleck at a different height each frame
  const fall = [[0, 3], [1, 6], [0, 9], [1, 12]][f];
  pixSet(fr, kerf[0] + fall[0], kerf[1] + fall[1] + 2, 'h'); pixSet(fr, kerf[0] + fall[0], kerf[1] + fall[1] + 3, 'H');
}
const inkOf = ch => (GROUND.includes(ch) ? 'Q' : ch === 'h' || ch === 'H' ? 'Q' : 'k');
const frames = [];
for (let f = 0; f < 4; f++) { const fr = clone(g); saw(fr, f); pennant(fr, f); outline(fr, inkOf); frames.push(pixText(fr)); }

export default {
  id: 'lumber', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8f7148', E: '#a3844f', f: '#755a36', h: '#d9c08a', H: '#c4a46a', Q: '#4a3520',   // packed earth, sawdust, earth rim
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', V: '#3b2614',                             // timber / bark ramp
    O: '#ead0a0', o: '#cfae74', u: '#a8864a',                                           // cut faces, growth rings
    i: '#2e2116', I: '#3d2c1c', p: '#3b2614', r: '#6e5030', R: '#57401f',               // shed interior, end-wall boards
    A: '#c49a5c', B: '#a07a46', b: '#8a663a', C: '#5e4022',                             // shingles: lit butt, body, alt, gap
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', k: '#24180f',                             // steel, ink
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
