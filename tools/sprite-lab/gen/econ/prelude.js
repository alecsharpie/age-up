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
/** Ragged eave a→b (the eave's ink line): here and there a slipped shingle or tile hangs a pixel low, so the drip line is uneven;
 *  the eave cell becomes roof `ch` and the ink drops onto the row below. */
function ragEave(gr, a, b, ch, ink = 'k', p = 0.16, seed = 0) {
  const n = Math.round(Math.abs(b[0] - a[0]));
  for (let i = 2; i < n - 1; i++) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n), y = Math.round(a[1] + (b[1] - a[1]) * i / n);
    if (hash(x >> 1, seed, 61) < p && pixGet(gr, x, y + 1) !== '.') { pixSet(gr, x, y, ch); pixSet(gr, x, y + 1, ink); } }
}
/** Spill: little stones / ore / chips on the ground round (cx,cy) within rx×ry: each a 2-px pebble in tones[h] with a dark under-
 *  side `dk`, only on ground chars isG. */
function spill(gr, cx, cy, rx, ry, n, tones, dk, isG, seed = 0) {
  for (let i = 0; i < n; i++) { const x = Math.round(cx + (hash(i, seed, 71) * 2 - 1) * rx), y = Math.round(cy + (hash(i, seed, 72) * 2 - 1) * ry);
    if (!isG(pixGet(gr, x, y)) || !isG(pixGet(gr, x + 1, y)) || !isG(pixGet(gr, x, y + 1))) continue;
    const t = tones[Math.floor(hash(i, seed, 73) * tones.length)]; pixSet(gr, x, y, t); if (hash(i, seed, 74) < 0.6) pixSet(gr, x + 1, y, t); pixSet(gr, x, y + 1, dk); }
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
