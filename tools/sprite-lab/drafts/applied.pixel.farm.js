// @pixel farm
// Farm (2×2, flat): ploughed ridges and furrows inside an edge that changes with the age, a gap at the near corner, wheat on
// every ridge (pale ripe straw with greener patches, so yellow and orange farmers stand out on it), a corner already reaped to
// stubble where the stooks of cut sheaves stand by the gate. Team marker every age: a scarecrow in the middle of the field and
// a rag tied to the gate post, both in the owner's colour. Per age (AGE, AK = pixAgeKit(AGE)):
//   Dark     a woven wattle hurdle on rough stakes, wandering hand-dug rows, a digging stick left in the field, a stick
//            scarecrow with a dyed hide thrown over its crossbar.
//   Feudal   a post-and-rail fence (posts of uneven height and lean, rails that sag), a scythe leaning on it, a scarecrow in a
//            team smock and straw hat.
//   Castle   low dry-stone walls with stone gateposts and a plank gate standing open, the scarecrow.
//   Imperial a clipped hedge along the back, neat coped ashlar walls in front, gateposts with gilt ball caps, the scarecrow.
// Weeds creep along the foot of the fences and over the headland; the outer edge is frayed, not a ruled diamond.
// Sets: idle ×4 = ripe wheat swaying in a wave that travels across the rows; young ×1 = green shoots while being built.
// Drawn by drafts/building.farm.js (fades in with alpha while building; flat, so no clip).
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
// ---- natural lines (HOLISTIC.md, 2026-10-12): working buildings are the most organic in the town. Variation is 1 px; the iso
// grid never breaks. Palette chars à á â (grass tufts: dark, mid, light) and ã ä (moss: lit, shade): spread NAT_PAL into it.
const NAT_PAL = { 'à': '#3f7a2e', 'á': '#5f9a3e', 'â': '#8cc25a', 'ã': '#7a8a44', 'ä': '#56632f' };
const TUFTS = [`.â.\nàáà`, `â.á\nàáà`, `.á\nàà`, `á..\nàâ.\n.àà`, `..â\n.áà\nàà.`];
/** Fray the footprint's ground edge so there is no hard diamond: edge cells of ground (isG(ch)) are nibbled 1–2 px in clumps,
 *  and grass tufts creep over the headland (o.edge density) and the foot of walls (o.feet: density, o.feetOf: the wall chars). Call before the outline pass. */
function fray(gr, isG, seed = 0, o = {}) {
  const H = gr.length, W = gr[0].length, at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? gr[y][x] : '.');
  const open = (x, y) => at(x - 1, y) === '.' || at(x + 1, y) === '.' || at(x, y - 1) === '.' || at(x, y + 1) === '.';
  for (let pass = 0; pass < 2; pass++) { const kill = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = gr[y][x]; if (c === '.' || !isG(c) || !open(x, y)) continue;
      if (hash((x + (pass ? 2 : 0)) >> 2, y >> 1, seed + 40 + pass) < (pass ? 0.24 : 0.42)) kill.push([x, y]); }
    for (const [x, y] of kill) gr[y][x] = '.'; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = gr[y][x]; if (c === '.' || !isG(c)) continue;   // no lone crumbs
    const n = (at(x - 1, y) !== '.') + (at(x + 1, y) !== '.') + (at(x, y - 1) !== '.') + (at(x, y + 1) !== '.'); if (n <= 1) gr[y][x] = '.'; }
  // distance (in cells, ≤ 3) from the open edge, for the headland band
  const dist = gr.map((r, y) => r.map((c, x) => (c === '.' ? 0 : 9)));
  for (let k = 1; k <= 3; k++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (dist[y][x] === 9 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (dist[y + dy] || [])[x + dx] === k - 1)) dist[y][x] = k;
  const used = [];
  const place = (x, y, k) => { if (used.some(([ux, uy]) => Math.abs(ux - x) < 4 && Math.abs(uy - y) < 3)) return; used.push([x, y]);
    const rows = TUFTS[k % TUFTS.length].split('\n'), h = rows.length;
    rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.') continue; const X = x - 1 + xx, Y = y - h + 1 + yy, c = at(X, Y);
      if (c === '.' || (yy === h - 1 && !isG(c))) continue; pixSet(gr, X, Y, ch); } }); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = gr[y][x]; if (c === '.' || !isG(c)) continue;
    const h = hash(x, y, seed + 77), k = Math.floor(hash(x, y, seed + 78) * 5);
    if (dist[y][x] >= 1 && dist[y][x] <= 2 && h < (o.edge ?? 0.05)) place(x, y, k);
    else if (o.feet && (o.feetOf || '').includes(at(x, y - 1)) && h < o.feet) place(x, y, k);
  }
}
/** Sag a long ridge (or eave) a→b in screen cells: each column's segment from `up` rows above the line to `dn` below moves down
 *  by round(amp·sin(πt)); with lift > 0 the last `lift` of the run rises 1 px instead (a lifted end). */
function sag(gr, a, b, up, dn = 0, amp = 1.3, lift = 0) {
  const H = gr.length, x0 = Math.round(Math.min(a[0], b[0])), x1 = Math.round(Math.max(a[0], b[0]));
  for (let x = x0; x <= x1; x++) {
    const t = (x - a[0]) / (b[0] - a[0]); if (t < 0 || t > 1) continue;
    let d = Math.round(amp * Math.sin(Math.PI * t)); if (lift && t > 1 - lift) d = -1; if (!d) continue;
    const yl = Math.round(a[1] + (b[1] - a[1]) * t), top = yl - up, bot = yl + dn, old = gr.map(r => r[x]);
    const get = y => (y >= 0 && y < H ? old[y] : '.');
    if (d > 0) { for (let y = top; y <= bot + d; y++) if (y >= 0 && y < H) gr[y][x] = get(y - d); }
    else for (let y = top + d; y <= bot + d; y++) if (y >= 0 && y < H) gr[y][x] = get(y - d);
  }
}
/** Ragged eave a→b: here and there the eave drops a pixel of `ch` onto the wall below (a slipped shingle, an uneven drip line). */
function ragEave(gr, a, b, ch, p = 0.18, seed = 0) {
  const n = Math.round(Math.abs(b[0] - a[0]));
  for (let i = 1; i < n; i++) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n), y = Math.round(a[1] + (b[1] - a[1]) * i / n);
    if (hash(x >> 1, seed, 61) < p && pixGet(gr, x, y + 1) !== '.') { pixSet(gr, x, y + 1, ch); if (hash(x, seed, 62) < 0.4) pixSet(gr, x + 1, y + 1, ch); } }
}
/** Weather a wall fn(U,V,x,y): moss and lichen low on stone (chars in `stone`), rain streaks running down from the eave (`dark`
 *  maps a stone char to its next-darker one). o.lit picks the moss tone; o.H the wall height; o.seed. */
const weather = (fn, stone, dark, o = {}) => (U, V, x, y) => {
  const c = fn(U, V, x, y); if (!c || !stone.includes(c)) return c;
  const u = Math.floor(U), v = Math.floor(V), s = o.seed || 0;
  if (v < 1 + Math.floor(hash(u >> 1, s, 81) * 3) && hash(u >> 1, v, s + 82) < 0.42) return o.lit === false ? 'ä' : (hash(u, v, s) < 0.5 ? 'ã' : 'ä');
  if (o.H && hash(u, s, 83) < 0.07 && v > o.H * (0.3 + hash(u, s, 84) * 0.4)) return dark[c] || c;
  return c;
};
const W = 2, H = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 14;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const ROWS = 8, RC0 = 0.2, RC1 = 1.8, RA0 = 0.16, RA1 = 1.84;
const rowC = i => RC0 + (RC1 - RC0) * i / (ROWS - 1);
const { S, Au } = AK, TW = AK.W;
// Dark: hand-dug rows wander a little
const wob = (a, i) => (AGE === 0 ? 0.035 * Math.sin(a * 5.3 + i * 1.7) + 0.02 * Math.sin(a * 13 + i) : 0);

function soil(gr) {
  flat(gr, 0, 2, 0, 2, 0, (s, t, x, y) => {
    const a = s * 2, c = t * 2, h = hash(x >> 1, y, 6);
    if (a < 0.08 || a > 1.92 || c < 0.08 || c > 1.92) return h < 0.4 ? 'f' : 'e';      // headland under the fence
    const sp = (RC1 - RC0) / (ROWS - 1), k0 = (c - RC0 + sp / 2) / sp, k = AGE === 0 ? k0 - wob(a, Math.floor(k0)) / sp : k0, fr = k - Math.floor(k);
    if (fr < 0.2) return 'F';                               // furrow bottom (shade)
    if (fr < 0.36) return 'f';
    if (fr > 0.78) return h < 0.5 ? 'E' : 'e';              // lit ridge shoulder (faces the upper-left light)
    return h < 0.15 ? 'f' : 'e';
  });
}
// fence: rails at z 2 and 5 between posts, posts 2 px wide with a lit cap
// rails sag a pixel between posts (each bay its own amount); posts vary in height and a few lean
function fence(gr, a0, c0, a1, c1, gapAt) {
  const n = 4, seed = Math.round((a0 + c1) * 10);
  const rail = (z, ch) => { for (let k = 0; k < n; k++) { const sg = 0.6 + hash(k, seed, 3) * 0.9, p0 = iso(a0 + (a1 - a0) * k / n, c0 + (c1 - c0) * k / n, z), p1 = iso(a0 + (a1 - a0) * (k + 1) / n, c0 + (c1 - c0) * (k + 1) / n, z);
    line(gr, p0, p1, (i, m) => { const t = (k + i / m) / n; if (gapAt !== undefined && Math.abs(t - gapAt) < 0.12) return null; return ch; });
    // sag: shift the middle of the bay down by one (re-draw the rail pixel a row lower, the row above it cleared to what was there)
    const m = Math.round(Math.abs(p1[0] - p0[0])); for (let i = 1; i < m; i++) { const t = i / m, d = Math.round(sg * Math.sin(Math.PI * t)); if (!d) continue; const tt = (k + t) / n; if (gapAt !== undefined && Math.abs(tt - gapAt) < 0.12) continue;
      const x = Math.round(p0[0] + (p1[0] - p0[0]) * t), y = Math.round(p0[1] + (p1[1] - p0[1]) * t); pixSet(gr, x, y + d, ch); } } };
  rail(6, 'O'); rail(5, 'v'); rail(3, 'w'); rail(2, 'v');
  for (let k = 0; k <= n; k++) { const p = iso(a0 + (a1 - a0) * k / n, c0 + (c1 - c0) * k / n, 0), hk = hash(k, seed, 5), ht = 7 + (hk < 0.3 ? 1 : hk > 0.8 ? -1 : 0), lean = hash(k, seed, 6) < 0.35 ? (hk < 0.5 ? -1 : 1) : 0;
    for (let z = 0; z < ht; z++) { const dx = z >= ht - 3 ? lean : 0; pixSet(gr, p[0] + dx, p[1] - z, 'w'); pixSet(gr, p[0] + 1 + dx, p[1] - z, 'v'); }
    pixSet(gr, p[0] + lean, p[1] - ht, 'O'); pixSet(gr, p[0] + 1 + lean, p[1] - ht, 'w'); }
}
// one plant: young = 2-cell shoot, ripe = stalk + a 2×2 ear that leans with the wind
// green: 0 ripe straw, 1 a greener late patch; ochre: a darker, riper ear
function plant(gr, x, y, ripe, lean, h, green = 0, ochre = false) {
  if (!ripe) { pixSet(gr, x, y, 'c'); pixSet(gr, x, y - 1, h < 0.5 ? 'C' : 'c'); if (h > 0.6) pixSet(gr, x + 1, y - 1, 'C'); return; }
  if (ripe === 'stubble') { pixSet(gr, x, y, 'S'); pixSet(gr, x, y - 1, h < 0.5 ? 's' : 'S'); if (h > 0.55) { pixSet(gr, x + 1, y, 'S'); pixSet(gr, x + 1, y - 1, 's'); } return; }
  const tall = 3 + (h > 0.6 ? 1 : 0), st = green ? 'q' : 'g', Ym = green ? 'U' : 'Y', ym = green ? 'u' : ochre ? 'z' : 'y';
  for (let z = 0; z < tall; z++) pixSet(gr, x, y - z, z === 0 ? (green ? 'q' : 'z') : st);
  const ex = x + lean, ey = y - tall - 2;
  pixSet(gr, ex, ey, Ym); pixSet(gr, ex, ey + 1, ym); pixSet(gr, ex, ey + 2, ym);
  // a second, shorter stalk beside it makes a clump
  pixSet(gr, x + 1, y, st); pixSet(gr, x + 1, y - 1, st); pixSet(gr, x + 1 + lean, y - 2, ym); pixSet(gr, x + 1 + lean, y - 3, h < 0.5 ? Ym : ym); pixSet(gr, x + 1, y + 0, green ? 'q' : 'z');
}
// greener patches drift across the field (smooth, so they read as patches, not speckle); the near corner is reaped
const greenAt = (a, c, h) => (Math.sin(a * 3.7 + c * 2.1 + 0.6) + Math.sin(c * 4.9 - a * 1.7 + 2.2) + (h - 0.5) * 0.3 > 1.0 ? 1 : 0);
const reaped = (a, c) => a + c > 3.18 + 0.08 * Math.sin(a * 9);
function crops(gr, ripe, f, mid) {
  for (let i = 0; i < ROWS; i++) {
    const c = rowC(i);
    if (mid && c > mid.c && (i === 0 || rowC(i - 1) <= mid.c)) mid.draw();
    for (let a = RA0; a <= RA1; a += ripe ? 0.085 : 0.1) {
      const p = iso(a, c + wob(a, i), 0), h = hash(Math.round(a * 50), i, 2);
      const phase = (a * 3 - i * 0.6) - f * Math.PI / 2;               // the wave travels across the field
      const lean = ripe ? (Math.sin(phase) > 0.35 ? 1 : 0) : 0;
      if (ripe && reaped(a, c)) { plant(gr, Math.round(p[0]), Math.round(p[1]) - 1, 'stubble', 0, h); continue; }
      plant(gr, Math.round(p[0]), Math.round(p[1]) - 1, ripe, lean, h, ripe ? greenAt(a, c, h) : 0, hash(Math.round(a * 50), i, 9) < 0.18);
    }
  }
}
// a stook: sheaves leaned together, tied at the waist
const stook = (gr, a, c) => { const p = iso(a, c, 0); pixStamp(gr, Math.round(p[0]) - 3, Math.round(p[1]) - 8, `
..kYk..
.kYyyk.
kYyyzzk
kYyzzzk
.kvvvk.
kYyyzzk
kyyzzZk
.kkkkk.
`); };

// ---- the edge for every other age: a solid low band along a footprint edge, fn(i, n, z) per cell; gapAt as fence()
function band(gr, a0, c0, a1, c1, h, gapAt, fn) {
  const p0 = iso(a0, c0, 0), p1 = iso(a1, c1, 0), n = Math.round(Math.max(Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1])));
  for (let i = 0; i <= n; i++) { if (gapAt !== undefined && Math.abs(i / n - gapAt) < 0.12) continue;
    const x = Math.round(p0[0] + (p1[0] - p0[0]) * i / n), y = Math.round(p0[1] + (p1[1] - p0[1]) * i / n);
    for (let z = 0; z < h + 2; z++) { const ch = fn(i, n, z); if (ch) pixSet(gr, x, y - z, ch); } }
}
// Dark: woven hurdle panels between rough stakes; the withies over-and-under in 2-px courses, a ragged top
const hurdle = (gr, a0, c0, a1, c1, gapAt, lit) => band(gr, a0, c0, a1, c1, 5, gapAt, (i, n, z) => {
  const stake = i % 11 === 0 || i === n, tall = stake && hash(i, 4) < 0.4 ? 8 : 6;
  if (stake) return z <= tall ? (z === tall ? TW[0] : lit ? TW[1] : TW[2]) : null;
  if (z > 4 + (hash(i, 9) < 0.3 ? 1 : 0)) return null; if (z === 0) return TW[2];
  return ((Math.floor(i / 3) + (z >> 1)) % 2) ? (lit ? TW[1] : TW[2]) : z % 2 ? (lit ? 'w' : TW[0]) : TW[0]; });
// Castle: dry-stone walls, rough stones of mixed size in 2-px courses, an uneven top
const dryStone = (gr, a0, c0, a1, c1, gapAt, lit) => band(gr, a0, c0, a1, c1, 4, gapAt, (i, n, z) => {
  const top = 3 + (hash(i >> 2, 5) < 0.35 ? 1 : 0); if (z > top) return null;
  const row = z >> 1, k = Math.floor((i + row * 2 + Math.floor(hash(row, 4) * 3)) / (3 + (row % 2))), hk = hash(k, row, lit ? 2 : 3);
  if (z === top) return lit ? (hk < 0.5 ? S[0] : S[1]) : S[2];
  if ((i + row * 2 + Math.floor(hash(row, 4) * 3)) % (3 + (row % 2)) === 0 && z % 2 === 0) return S[4];
  return lit ? (hk < 0.4 ? S[1] : S[2]) : (hk < 0.4 ? S[2] : S[3]); });
// Imperial: neat coped ashlar, long blocks, a lit coping course on top
const ashlar = (gr, a0, c0, a1, c1, gapAt, lit) => band(gr, a0, c0, a1, c1, 4, gapAt, (i, n, z) => {
  if (z > 4) return null; if (z === 4) return lit ? S[0] : S[1]; if (z === 3) return S[4];
  if (z === 0) return S[3]; return (i + (z === 2 ? 4 : 0)) % 8 === 0 ? S[4] : lit ? S[1] : S[2]; });
// Imperial: a clipped hedge, lumpy lit top, darker toward its foot
const hedge = (gr, a0, c0, a1, c1) => band(gr, a0, c0, a1, c1, 6, undefined, (i, n, z) => {
  const top = 5 + (hash(i >> 1, 8) < 0.4 ? 1 : 0); if (z > top) return null;
  const h = hash(i, z, 6); if (z >= top - 1) return h < 0.6 ? 'J' : 'H'; if (z <= 1) return h < 0.5 ? 'N' : 'G';
  return h < 0.25 ? 'J' : h < 0.7 ? 'H' : 'G'; });
// a gatepost at (a,c): Castle a rough stone pier, Imperial an ashlar pier with a gilt ball cap
function gatepost(gr, a, c) {
  const p = iso(a, c, 0), h = AGE === 3 ? 8 : 6;
  for (let z = 0; z < h; z++) for (let i = -1; i <= 1; i++) pixSet(gr, p[0] + i, p[1] - z, z === h - 1 ? (i < 1 ? S[0] : S[1]) : i < 0 ? S[1] : i === 0 ? S[2] : S[3]);
  if (AGE === 3) pixStamp(gr, p[0] - 1, p[1] - h - 2, `.${Au[0]}.\n${Au[0]}${Au[1]}${Au[2]}`);
}
// the scarecrow: a pole with a crossbar, a team-colour coat, a sack head under a straw hat; its sleeves flap
// the scarecrow: a pole with a crossbar in the middle of the field, dressed in the owner's colour (edged with team dark and ink
// so a yellow coat still separates from the straw). Dark: a dyed hide thrown over a forked stick, a straw-bundle head; Feudal
// on: a smock with sleeves on the crossbar, a sack head under a wide straw hat. The hem and cuffs flap.
function scarecrow(gr, f) {
  const p = iso(0.66, 0.98, 0), x = Math.round(p[0]), y = Math.round(p[1]);
  for (let z = 0; z < 14; z++) { pixSet(gr, x, y - z, 'w'); pixSet(gr, x + 1, y - z, 'v'); }
  const fl = [0, 1, 0, -1][f], hem = ['', 'k', '', '.'][f];
  if (AGE === 0) {
    pixStamp(gr, x - 6, y - 21, `
.....kOOk.....
....kOwwOk....
.....kOwk.....
.....kwvk.....
kkkkkkkkkkkkk.
kLLTTTTTTTTDk.
kLTTTTTTTTTDk.
.kLTTTDTTTDk..
.kLTTTDTTTDk..
..kLTkkTTDk...
..kTk..kDk....
...k....k.....
`);
    pixSet(gr, x - 6 + 1, y - 10 + fl, 'k'); pixSet(gr, x + 5, y - 10 - fl, 'k');   // ragged corners lift in the wind
    return;
  }
  pixStamp(gr, x - 6, y - 22, `
.....kOOk.....
....kOwwOk....
.kkkkkkkkkkk..
.....kOwk.....
..k..kwwk..k..
.kLTkkTTkkTDk.
kLLTTTTTTTTTDk
.kLLTTTTTTTDk.
..kLTTTTTTDk..
..kLTTTTTDDk..
..kLTTTTTDDk..
..kLTTTTTDDk..
...kkTkkDkk...
`);
  pixSet(gr, x - 6, y - 16 + fl, 'O'); pixSet(gr, x + 7, y - 16 - fl, 'O');   // straw tufts at the cuffs
  if (hem) pixSet(gr, x - 1, y - 9, hem === '.' ? 'D' : 'k');
}
// a stake at the gate (Dark/Feudal) or the gatepost (Castle on) with a team rag tied round it, the loose end fluttering
function gateRag(gr, f) {
  const p = iso(1.58, 1.99, 0), x = Math.round(p[0]), y = Math.round(p[1]), top = AGE >= 2 ? (AGE === 3 ? 8 : 6) : 10;
  if (AGE < 2) { for (let z = 0; z < top; z++) { pixSet(gr, x + (z > 7 && AGE === 0 ? -1 : 0), y - z, z === top - 1 ? 'O' : 'w'); pixSet(gr, x + 1 + (z > 7 && AGE === 0 ? -1 : 0), y - z, 'v'); } }
  const ty = y - top + (AGE >= 2 ? 1 : 3), w = [0, 1, 1, 0][f];
  // the knot round the post, then the tail streaming right (down-wind) with a 1 px wave
  pixStamp(gr, x - 1, ty, `kLTk\nkTDk`);
  for (let i = 0; i < 5; i++) { const yy = ty + Math.round(i * 0.35) + (i > 1 ? w : 0), x2 = x + 3 + i; pixSet(gr, x2, yy - 1, 'k'); pixSet(gr, x2, yy, i < 2 ? 'T' : 'L'); pixSet(gr, x2, yy + 1, i < 3 ? 'D' : 'k'); if (i < 3) pixSet(gr, x2, yy + 2, 'k'); }
}
function build(ripe, f) {
  const gr = pixGrid(GW, GH);
  soil(gr);
  if (AGE === 1) { fence(gr, 0.02, 0.02, 1.98, 0.02); fence(gr, 0.02, 0.02, 0.02, 1.98); }          // back edges first
  else if (AGE === 0) { hurdle(gr, 0.02, 0.02, 1.98, 0.02, undefined, false); hurdle(gr, 0.02, 0.02, 0.02, 1.98, undefined, true); }
  else if (AGE === 2) { dryStone(gr, 0.02, 0.02, 1.98, 0.02, undefined, false); dryStone(gr, 0.02, 0.02, 0.02, 1.98, undefined, true); }
  else { hedge(gr, 0.02, 0.02, 1.98, 0.02); hedge(gr, 0.02, 0.02, 0.02, 1.98); }
  crops(gr, ripe, f, ripe ? { c: 0.98, draw: () => scarecrow(gr, f) } : undefined);
  if (ripe) { stook(gr, 1.55, 1.9); stook(gr, 1.86, 1.62); }
  // worn path through the gate at the near corner
  for (let k = 0; k < 6; k++) { const p = iso(1.94 - k * 0.04, 1.94 - k * 0.04, 0); pixSet(gr, p[0], p[1] - 1, 'E'); pixSet(gr, p[0] - 1, p[1] - 1, 'e'); }
  if (AGE === 1) {
  // a scythe leaning on the right fence from the field side: its foot in the headland, the snath resting on the top rail,
  // painted before the front fences so the rails cross in front of it
  { const p = iso(1.98, 1.3, 0); line(gr, [p[0] - 3, p[1] - 2], [p[0] + 1, p[1] - 13], 'O'); line(gr, [p[0] - 2, p[1] - 2], [p[0] + 2, p[1] - 13], 'v');
    pixStamp(gr, p[0] - 4, p[1] - 15, `
kkkkkkk..
kmMMMMnk.
.kkkkkknk
.......kk
`); }
  fence(gr, 0.02, 1.98, 1.98, 1.98, 0.92); fence(gr, 1.98, 1.98, 1.98, 0.02, 0.08);  // front edges, gap at the near corner
  } else if (AGE === 0) {
    // a digging stick stuck in the headland, leaning on the hurdle
    { const p = iso(1.94, 1.2, 0); line(gr, [p[0] - 2, p[1] - 1], [p[0] + 1, p[1] - 12], 'w'); line(gr, [p[0] - 1, p[1] - 1], [p[0] + 2, p[1] - 12], 'v'); pixSet(gr, p[0] + 1, p[1] - 13, 'O'); }
    hurdle(gr, 0.02, 1.98, 1.98, 1.98, 0.92, true); hurdle(gr, 1.98, 1.98, 1.98, 0.02, 0.08, false);
  } else {
    // a plank gate standing open inside the gap, then the walls and their gateposts
    if (AGE === 2) { const p0 = iso(1.62, 1.95, 0), p1 = iso(1.62, 1.72, 0);
      for (const z of [2, 5]) line(gr, [p0[0], p0[1] - z], [p1[0], p1[1] - z], z === 5 ? 'O' : 'w');
      line(gr, [p0[0], p0[1] - 2], [p1[0], p1[1] - 5], 'v'); for (const p of [p0, p1]) for (let z = 1; z < 7; z++) pixSet(gr, p[0], p[1] - z, z === 6 ? 'O' : 'w'); }
    const wall = AGE === 2 ? dryStone : ashlar;
    wall(gr, 0.02, 1.98, 1.98, 1.98, 0.92, true); wall(gr, 1.98, 1.98, 1.98, 0.02, 0.08, false);
    gatepost(gr, 1.62, 1.98); gatepost(gr, 1.98, 1.62);
  }
  if (ripe) gateRag(gr, f);
  // a water bucket by the gate
  { const p = iso(1.8, 1.98, 0); pixStamp(gr, Math.round(p[0]) - 2, Math.round(p[1]) - 4, `
.kkkk.
kMnnMk
kwwwvk
kwwvvk
.kkkk.
`); }
  fray(gr, ch => 'efEF'.includes(ch), 3, { edge: 0.05, feet: 0.2, feetOf: AGE === 1 ? 'wvO' : AGE === 0 ? TW.join('') + 'w' : AGE === 2 ? S.join('') : '' });
  outline(gr, ch => ('efEF'.includes(ch) ? 'X' : 'wvO'.includes(ch) ? 'K' : 'k'));   // fence wood gets a wood-brown line, not ink, so thin rails stay light
  return pixText(gr);
}

return {
  id: 'farm', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    G: '#3f7a2e', H: '#5e9a3c', J: '#8cc25a', N: '#2c5520',                    // clipped hedge (Imperial)
    T: 'team', D: 'teamdark', L: 'teamlight',                                    // the scarecrow's coat (Castle on)
    e: '#8b6a3a', E: '#a3803f', f: '#755830', F: '#5e4526', X: '#4a3520',          // soil: mid, lit ridge, shade, furrow, rim
    c: '#5f9a34', C: '#8fc24a',                                                  // young shoots
    g: '#a8995a', z: '#b0883e', y: '#d8b466', Y: '#f2dc9e', Z: '#6e5024',        // stalk, ear ramp: ripe straw-gold, ochre
    q: '#8c9248', u: '#bcb466', U: '#d9d496', s: '#c9b98a', S: '#97865c',        // greener patch (stalk, ear), stubble
    ...NAT_PAL,
    w: '#b58f5c', v: '#80603a', O: '#d8bc84', k: '#24180f', K: '#4e3519', m: '#e6eaee', M: '#9aa0a6', n: '#5f656c',                      // rails/posts, cap, ink
  },
  frames: { idle: [0, 1, 2, 3].map(f => build(true, f)), young: [build(false, 0)] },
};
};
export default pixAged(make, 0);
