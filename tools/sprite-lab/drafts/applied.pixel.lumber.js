// @pixel lumber
// Lumber camp (2×2), one variant per age (AGE, AK = pixAgeKit(AGE) from gen/ages/wrap.mjs):
//   Dark     a low lean-to of poles under a shaggy golden thatch, crossed poles at its top corners, team hides hung under the
//            eave, a rough heap of uneven logs between leaning stakes, a chopping block with a billet, the axe in a stump,
//            a ragged team strip on a stake.
//   Feudal   an open-fronted timber shed with a shingled gable roof and a team-colour valance, boards stacked inside, a tidy
//            two-course log stack with flush cut ends between stakes, a saw horse with a half-sawn log, the axe in a stump.
//   Castle   a taller shed on stone pads with a red tile roof, iron finials and a stone end wall with a team banner, a
//            three-course log stack, a timber-lined saw-pit with a log across it and a pit saw standing through the cut.
//   Imperial tallest: slate roof with gilt cresting and orb finials, stone piers, an ashlar end wall with a gilt-fringed
//            banner, a gilt-hemmed valance, a timber gantry over the log stack with a log slung from it and a gilt-trimmed
//            team sign, the saw-pit.
// Every age (pt4): ridges sag a pixel (least in Imperial, none there), shingle/tile eaves drop a slipped course here and there,
// moss creeps up the foot of the stone end wall, the yard's edge is frayed with weeds; the Feudal shingles are in roofChars.
// idle ×4: the saw works (bow saw rocks / pit saw strokes) and sawdust falls, or (Dark) chips fly off the chopping block;
// the team pennant on the corner pole flutters.
// Drawn by drafts/building.lumber.js: pixDraw(pixAge(PIXELS.lumber,b),'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p}).
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
const W = 2, H = 2, F = AGE === 1;
const Z = [10, 14, 18, 20][AGE], ROOF = [10, 16, 17, 19][AGE], HEAD = [0, 0, 0, 4][AGE];
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 11 + HEAD;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const rnd = mulberry(41);
const { R, S, Au, Fe } = AK, TW = AK.W;
const GZ = 31, GC = 1.57;   // Imperial gantry beam height, its line across the stack

// ---- ground: packed earth in 2×2 clusters, darker under the shed, sawdust around the work places
const GROUND = 'eEfhH';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => {
  const h = hash(x >> 1, y >> 1, 3), a = s * 2, c = t * 2;
  if (c < 1.1) return h < 0.25 ? 'f' : 'e';
  const dust = Math.hypot(a - 1.45, (c - 1.62) * 1.4) < 0.3;
  if (dust) return h < 0.45 ? 'h' : h < 0.75 ? 'H' : 'E';
  return h < 0.18 ? 'f' : h < 0.32 ? 'E' : 'e';
});

// ---- shed: inner back wall, boards stacked inside, an end wall on the right
const A0 = 0.06, A1 = 1.94, C0 = 0.05, C1 = 1.0;
// Dark lean-to: the roof runs from ZB at the back (c = 0) down to the eave ZF at the front (c = LC)
const ZB = 17, ZF = Z, LC = 1.22, zAt = c => ZB - (ZB - ZF) * c / LC;
if (AGE === 0) wallC(g, C0, A0, A1, 0, ZB, (U, V) => { const u = Math.floor(U), v = Math.floor(V); if (u % 7 === 0) return 'p'; return v % 2 ? 'i' : ((u + (v >> 1) * 3) % 6 < 3 ? 'x' : 'I'); });   // wattle hurdle
else if (F) wallC(g, C0, A0, A1, 0, Z, (U, V) => { const v = Math.floor(V); return v % 3 === 0 ? 'i' : (hash(Math.floor(U / 9), v, 5) < 0.3 ? 'i' : 'I'); });
else wallC(g, C0, A0, A1, 0, Z, blocks(['I', 'x', 'I', 'i'], 'i', 4, 8, 3));   // stone, deep in shadow
flat(g, A0, A1, C0, C1, 0, (s, t, x, y) => (hash(x >> 1, y, 9) < 0.3 ? 'i' : 'f'));
// stacked sawn boards against the back wall: courses of 2 px, lit top edge, end grain at the right
if (AGE >= 1) {
  wallC(g, 0.32, 0.18, 1.2, 0, 8, (U, V) => { const v = Math.floor(V); if (U >= 31) return v % 2 ? 'o' : 'u'; return v % 2 ? 'w' : (hash(Math.floor(U / 7), v, 2) < 0.2 ? 'v' : 'W'); });
  flat(g, 0.18, 1.2, 0.05, 0.32, 8, (s, t) => (t > 0.8 ? 'w' : 'W'));
}

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
// end wall a = A1 (after the stored logs, which lie behind it and show only through the open front)
if (F) wallA(g, A1, C1, C0, 0, Z, (U, V) => { const u = Math.floor(U); if (V < 1) return 'V'; if (u % 4 === 3) return 'p'; return (u > 22 || (V > Z - 3)) ? 'R' : 'r'; });
else if (AGE === 0) wallA(g, A1, C1, C0, 0, ZB, (U, V) => { const top = zAt(C1 - U / 32) - 1; return V > top ? null : AK.wallTex(U, V, 1, { len: 30, H: Math.floor(top) + 1, pl: 2 }); });
else wallA(g, A1, C1, C0, 0, Z, weather((U, V) => AK.wallTex(U, V, 1, { len: 30, H: Z }), S, { [S[0]]: S[1], [S[1]]: S[2], [S[2]]: S[3], [S[3]]: S[4], [S[4]]: S[5] }, { lit: false, H: Z, seed: 3 }));
// posts of the open front, sill beam
const POSTS = [A0, 0.68, 1.32, A1];
if (AGE === 0) { // rough poles under the eave, a fieldstone at the foot
  for (const a of [A0, 0.7, 1.36, A1]) { const p = iso(a, C1, 0), top = Math.round(zAt(C1)) + 1, lean = a > 1 ? 1 : 0;
    for (let z = 0; z < top; z++) { const dx = z > top / 2 ? lean : 0; pixSet(g, p[0] + dx, p[1] - z, TW[0]); pixSet(g, p[0] + 1 + dx, p[1] - z, TW[1]); }
    pixSet(g, p[0] - 1, p[1], S[2]); pixSet(g, p[0] + 2, p[1], S[3]); }
} else if (AGE === 3) { // stone piers: lit face, shade face, a moulded base and a capital with a gilt line
  for (const a of POSTS) { const p = iso(a, C1, 0);
    for (let z = 0; z < Z; z++) for (let i = -1; i <= 2; i++) pixSet(g, p[0] + i, p[1] - z, z < 2 ? (i < 1 ? S[1] : S[3]) : z >= Z - 2 ? (i < 1 ? S[0] : S[2]) : z === Z - 3 ? Au[i < 1 ? 1 : 2] : [S[1], S[0], S[2], S[3]][i + 1]);
    pixSet(g, p[0] - 2, p[1], S[1]); pixSet(g, p[0] + 3, p[1], S[3]); pixSet(g, p[0] - 2, p[1] - Z + 1, S[0]); pixSet(g, p[0] + 3, p[1] - Z + 1, S[2]); }
  line(g, iso(A0, C1, 0), iso(A1, C1, 0), 'V');
} else {
  for (const a of POSTS) { const p = iso(a, C1, 0); for (let z = 0; z < Z; z++) { pixSet(g, p[0], p[1] - z, 'w'); pixSet(g, p[0] + 1, p[1] - z, 'v'); } pixSet(g, p[0] - 1, p[1], 'V'); pixSet(g, p[0] + 2, p[1], 'V'); }
  line(g, iso(A0, C1, 0), iso(A1, C1, 0), 'V');
  if (AGE === 2) for (const a of POSTS) { const p = iso(a, C1, 0); for (let z = 0; z < 3; z++) for (let i = -1; i <= 2; i++) pixSet(g, p[0] + i, p[1] - z, z === 2 ? (i < 1 ? S[0] : S[1]) : (i < 1 ? S[1] : S[3])); }   // stone pads
  // knee braces under the eave beam
  for (const a of [0.68, 1.32]) { const p = iso(a, C1, Z - 2); line(g, [p[0] - 4, p[1] - 2], [p[0], p[1] + 2], 'v'); line(g, [p[0] + 1, p[1] + 2], [p[0] + 5, p[1] + 2 - 2 + 2], 'v'); }
}

// ---- roof
// Dark lean-to thatch: bands of 1-px strands lapping downhill, each band lit at its top, a ragged shaded foot, darker toward the eave
function thatch(x, d) {
  const band = Math.floor(d / 4), v = d - band * 4, hx = hash(x, band, 13);
  if (v === 0 || (v === 1 && hx < 0.35)) return R[5];
  const st = hash(x, band, 7), base = v >= 3 ? 1 : 2;
  return R[st < 0.22 ? base + 1 : st > 0.9 ? base - 1 : base];
}
const RA0 = 0.0, RA1 = 1.99, RC0 = 0.0, RC1 = 1.14, RR = 0.53;
if (F) {
  // gable roof, ridge along a: eave shadow, front slope in shingle courses, plank gable end, bargeboards
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
  // bargeboard on the left rake: the roof's end reads as a finished timber edge sitting on the corner post
  line(g, iso(RA0 + 0.04, RC1 - 0.02, Z), iso(RA0 + 0.04, RR, Z + ROOF), 'A'); line(g, iso(RA0 + 0.07, RC1 - 0.02, Z), iso(RA0 + 0.07, RR, Z + ROOF), 'b');
  // team-colour valance hung under the front eave: lit hem, body, scalloped dark fringe
  wallC(g, RC1, RA0 + 0.04, RA1 - 0.04, Z - 5, Z - 1, (U, V) => { const u = Math.floor(U); if (V >= 3) return 'L'; if (V >= 1) return u % 8 === 0 ? 'D' : 'T'; return (u % 8) < 6 ? 'D' : null; });
  ragEave(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'B', 'k', 0.18, 6);
  sag(g, iso(RA0 + 0.1, RR, Z + ROOF), iso(RA1 - 0.1, RR, Z + ROOF), 6, 1, 1.4, 0.1);
} else if (AGE === 0) {
  // lean-to: one thatched plane from the back top edge down to a low, ragged front eave
  const LA0 = -0.02, LA1 = 2.0;
  { const o = iso(LA0, LC, ZF), u = sub2(iso(LA1, LC, ZF), o), v = sub2(iso(LA0, 0, ZB), o), off = -(o[1] - 0.5 * o[0]);
    face(g, o, u, v, (s, t, x, y) => thatch(x, Math.floor(0.5 * x - y - off))); }
  // the roof's thick end over the end wall, then the bound top edge with crossed poles at its corners
  { const e = iso(LA1, LC, ZF), t = iso(LA1, 0, ZB); line(g, e, t, R[4]); line(g, [e[0], e[1] + 1], [t[0], t[1] + 1], R[5]); }
  line(g, iso(LA0, 0, ZB), iso(LA1, 0, ZB), 'k'); AK.crest(g, iso(LA0 + 0.04, 0.03, ZB - 1), iso(LA1 - 0.04, 0.03, ZB - 1));
  line(g, iso(LA0, LC, ZF), iso(LA1, LC, ZF), 'k');
  // ragged straw fringe hanging below the eave
  { const e0 = iso(LA0, LC, ZF), e1 = iso(LA1, LC, ZF);
    for (let x = Math.ceil(e0[0]) + 1; x < e1[0]; x++) { const y = Math.round(e0[1] + (x - e0[0]) * 0.5), h = hash(x, 31); if (h < 0.55) pixSet(g, x, y + 1, R[h < 0.2 ? 3 : 5]); if (h < 0.18) pixSet(g, x, y + 2, R[6]); } }
  for (const a of [LA0 + 0.06, LA1 - 0.08]) { const p = iso(a, 0.02, ZB); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 1); }
  // team hides hung from the eave beam: lit top, dark edge, ragged foot
  const hide = (a0, a1, z0) => wallC(g, LC - 0.05, a0, a1, z0, ZF, (U, V) => { const u = Math.floor(U), n = (a1 - a0) * 32;
    if (V >= ZF - z0 - 1) return TW[2];                                         // the pole it hangs from
    if (V < hash(u, 5) * 1.6) return null;                                     // ragged foot
    if (u === 0) return 'L'; if (u >= n - 1) return 'D';
    return V >= ZF - z0 - 2 ? 'L' : (u + Math.floor(V)) % 5 === 0 ? 'D' : 'T'; });
  hide(0.1, 0.66, 0); hide(1.42, 1.8, 1);
  sag(g, iso(LA0 + 0.14, 0, ZB), iso(LA1 - 0.14, 0, ZB), 5, 1, 1.5);
} else {
  // gable roof in the age's material: red tile (Castle), slate with gilt (Imperial); stone gable end, crested ridge, finials
  wallC(g, C1, A0, A1, Z - 3, Z, (U, V) => (V >= 2 ? 'V' : 'i'));
  { const o = iso(RA0, RC0, Z), u = sub2(iso(RA1, RC0, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o); face(g, o, u, v, (s, t, x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true })); }
  line(g, iso(RA0, RC0, Z), iso(RA1, RC0, Z), 'k');
  { const pA = iso(RA1, RC1, Z), pB = iso(RA1, RC0, Z), pC = iso(RA1, RR, Z + ROOF);
    poly(g, [pA, pB, pC], (x, y) => { const u = x - pA[0], h = pA[1] - 0.5 * u - y; return AK.wallTex(u, Z + h, 1, { len: 36, H: 999, pl: 0 }); });
    const ox = iso(RA1, RR, Z + ROOF * 0.42);                                                           // a round vent / gilt oculus
    disc(g, Math.round(ox[0]), Math.round(ox[1]), 2, (dx, dy, ring) => (ring ? (AGE === 3 ? Au[dx + dy < 0 ? 0 : 2] : S[4]) : 'i')); }
  { const o = iso(RA0, RC1, Z), u = sub2(iso(RA1, RC1, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o), off = -(o[1] - 0.5 * o[0]);
    face(g, o, u, v, (s, t, x, y) => AK.roofXY(x, y, 0.5, 0, { off })); }
  line(g, iso(RA0, RR, Z + ROOF), iso(RA1, RR, Z + ROOF), 'k');
  line(g, iso(RA1, RC1, Z), iso(RA1, RR, Z + ROOF), 'k'); line(g, iso(RA1, RC0, Z), iso(RA1, RR, Z + ROOF), 'k');
  line(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'k');
  // coping on the gable's rakes (gilt on the Imperial shed), the left verge as a lit edge
  line(g, sub2(iso(RA1, RC1, Z), [1, 0]), sub2(iso(RA1, RR, Z + ROOF), [1, -1]), AGE === 3 ? Au[1] : S[0]);
  line(g, iso(RA0 + 0.04, RC1 - 0.02, Z), iso(RA0 + 0.04, RR, Z + ROOF), R[0]);
  AK.crest(g, iso(RA0 + 0.03, RR, Z + ROOF - 1), iso(RA1 - 0.03, RR, Z + ROOF - 1));
  if (AGE === 3) AK.trim(g, iso(RA0 + 0.03, RC1, Z), iso(RA1 - 0.03, RC1, Z), -1);
  for (const a of [RA0 + 0.02, RA1 - 0.02]) { const p = iso(a, RR, Z + ROOF); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 2); }
  if (AGE === 2) { ragEave(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), R[3], 'k', 0.12, 7); sag(g, iso(RA0 + 0.12, RR, Z + ROOF), iso(RA1 - 0.12, RR, Z + ROOF), 8, 1, 1.2); }
  // valance under the eave; Imperial: a gilt hem and gilt tassels
  if (AGE === 2) wallC(g, RC1, RA0 + 0.04, RA1 - 0.04, Z - 5, Z - 1, (U, V) => { const u = Math.floor(U); if (V >= 3) return 'L'; if (V >= 1) return u % 8 === 0 ? 'D' : 'T'; return (u % 8) < 6 ? 'D' : null; });
  else wallC(g, RC1, RA0 + 0.04, RA1 - 0.04, Z - 6, Z - 1, (U, V) => { const u = Math.floor(U); if (V >= 4) return Au[1]; if (V >= 3) return 'L'; if (V >= 1) return u % 8 === 0 ? 'D' : 'T'; return (u % 8) < 5 ? 'D' : (u % 8) === 6 ? Au[0] : null; });
  // a team banner on the end wall
  { const u = 12, p = iso(A1, C1, 0); AK.banner(g, p[0] + u, Math.round(p[1] - u * 0.5 - Z + 2), -0.5, 6, AGE === 3 ? 11 : 10); }
}

// ---- yard props
// log pile, front-left. Dark: a rough heap of uneven logs between leaning stakes; Feudal: a tidy stack of two even courses,
// cut ends flush to the front, a stake at each end; Castle/Imperial: three courses (Imperial under a gantry)
const PILE = [0.14, 0.34, 0.54, 0.74, 0.94];
if (AGE === 0) {
  for (const [a, c0, c1] of [[0.16, 1.36, 1.82], [0.38, 1.3, 1.74], [0.6, 1.34, 1.86], [0.82, 1.4, 1.8]]) logC(g, a, c0, c1, 0, 3);
  for (const [a, c0, c1] of [[0.28, 1.38, 1.76], [0.5, 1.33, 1.84], [0.72, 1.44, 1.78]]) logC(g, a, c0, c1, 6, 3);
  for (const [a, d] of [[0.04, -2], [0.98, 2]]) { const p = iso(a, 1.78, 0); line(g, p, [p[0] + d, p[1] - 13], TW[0]); line(g, [p[0] + 1, p[1]], [p[0] + 1 + d, p[1] - 13], TW[1]); pixSet(g, p[0] + d, p[1] - 14, 'k'); pixSet(g, p[0] + d + 1, p[1] - 14, 'k'); }
} else {
  if (AGE === 3) aframe(0.02);
  if (F) { for (const z of [0, 6]) for (const a of PILE) logC(g, a, 1.3, 1.84, z, 3); }
  else for (const [z, as] of [[0, PILE], [6, PILE], [12, [0.24, 0.44, 0.64, 0.84]]]) for (const a of as) logC(g, a, 1.3, 1.84, z, 3);
  if (AGE <= 2) { const sh = AGE === 2 ? 21 : 15;
    for (const a of [0.03, 1.05]) { const p = iso(a, 1.8, 0); line(g, p, [p[0], p[1] - sh], 'w'); line(g, [p[0] + 1, p[1]], [p[0] + 1, p[1] - sh], 'v'); pixSet(g, p[0], p[1] - sh - 1, AGE === 2 ? Fe[1] : 'k'); pixSet(g, p[0] + 1, p[1] - sh - 1, 'k'); } }
  if (AGE === 3) gantryFront();
}
// Imperial gantry over the stack: a post at each end with braces, a beam, a gilt-trimmed team sign hung from its middle,
// a chain and hook at the right
function gPost(a, dir) {
  const p = iso(a, GC, 0); for (let z = 0; z < GZ; z++) { pixSet(g, p[0], p[1] - z, 'w'); pixSet(g, p[0] + 1, p[1] - z, 'v'); }
  pixSet(g, p[0] - 1, p[1], S[1]); pixSet(g, p[0] + 2, p[1], S[3]); pixSet(g, p[0] - 1, p[1] - 1, S[0]); pixSet(g, p[0] + 2, p[1] - 1, S[2]);
  const b0 = iso(a, GC, GZ - 9), b1 = iso(a + dir * 0.22, GC, GZ - 1); line(g, [b0[0] + (dir > 0 ? 1 : 0), b0[1]], b1, 'v');
}
function aframe(a) { gPost(a, 1); }
function gantryFront() {
  gPost(1.06, -1);
  const b0 = iso(-0.03, GC, GZ + 1), b1 = iso(1.11, GC, GZ + 1);
  line(g, b0, b1, 'w'); line(g, [b0[0], b0[1] + 1], [b1[0], b1[1] + 1], 'W'); line(g, [b0[0], b0[1] + 2], [b1[0], b1[1] + 2], 'v');
  for (const a of [0.03, 1.06]) { const p = iso(a, GC, GZ + 2); pixStamp(g, p[0] - 1, p[1] - 3, `.k.\nk${Au[0]}k\n${Au[1]}${Au[1]}${Au[2]}`); }
  // the sign on two chains, below the beam's middle
  for (const a of [0.16, 0.44]) { const p = iso(a, GC, GZ); pixSet(g, p[0], p[1], Fe[1]); pixSet(g, p[0], p[1] + 1, Fe[0]); }
  wallC(g, GC, 0.12, 0.49, 20, 30, (U, V) => { const u = Math.floor(U), v = Math.floor(V), n = 11;
    if (u === 0 || u >= n || v === 0 || v >= 9) return Au[u === 0 || v >= 9 ? 0 : 2];
    if ((u === 5 && v >= 2 && v <= 7) || (v === 7 && (u === 4 || u === 6)) || (v === 6 && (u === 3 || u === 7))) return Au[1];   // a gilt axe-head
    return v >= 8 ? 'L' : v <= 1 ? 'D' : 'T'; });
  // chain and hook at the right end
  const hk = iso(0.9, GC, GZ); for (let y = hk[1]; y < hk[1] + 7; y++) pixSet(g, hk[0], y, (y - hk[1]) % 2 ? Fe[1] : Fe[0]);
  pixSet(g, hk[0] + 1, hk[1] + 7, Fe[0]); pixSet(g, hk[0] + 1, hk[1] + 6, Fe[1]); pixSet(g, hk[0] - 1, hk[1] + 6, Fe[1]);
}

// the work place, front-right. Feudal: saw horse with a half-sawn log; Dark: a chopping block with a billet on it;
// Castle/Imperial: a timber-lined saw-pit with a log across it (the pit saw is animated)
const SH = { a0: 1.3, a1: 1.82, c: 1.5, z: 8 };
const trestle = (a) => { const b = iso(a, SH.c - 0.1, 0), f = iso(a, SH.c + 0.1, 0), tp = iso(a, SH.c, SH.z + 2); line(g, b, [tp[0] + 2, tp[1] - 2], 'v'); line(g, f, [tp[0] - 2, tp[1] - 2], 'w'); line(g, [f[0] + 1, f[1]], [tp[0] - 1, tp[1] - 2], 'v'); };
let kerf = iso(1.56, SH.c, SH.z + 6);
const PT = { a0: 1.32, a1: 1.86, c0: 1.36, c1: 1.76, d: 10 };
if (F) {
  trestle(SH.a0 + 0.08);
  logA(g, SH.c, SH.a0, SH.a1, SH.z, 3);
  trestle(SH.a1 - 0.1);
  // the kerf the saw sits in (a dark notch), sawdust heap under it
  pixSet(g, kerf[0], kerf[1], 'k'); pixSet(g, kerf[0], kerf[1] + 1, 'k'); pixSet(g, kerf[0] + 1, kerf[1] + 1, 'k');
  { const h0 = iso(1.56, SH.c + 0.12, 0); pixStamp(g, h0[0] - 3, h0[1] - 2, `
..hhh..
.hHhhh.
hhHHhhh
`); }
} else if (AGE === 0) {
  // chopping block: a short round with a billet standing on it, split billets around its foot
  const p = iso(1.56, 1.5, 0), r = 4;
  for (let z = 0; z <= 4; z++) for (let dx = -r; dx <= r; dx++) { const yy = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx)) / 2); pixSet(g, p[0] + dx, p[1] + yy - z, Math.abs(dx) === r || z === 0 ? 'k' : dx < -1 ? 'w' : dx > 1 ? 'v' : 'W'); }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -r; dx <= r; dx++) { const d = Math.hypot(dx, dy * 2); if (d > r + 0.3) continue; pixSet(g, p[0] + dx, p[1] - 4 + dy, d > r - 0.9 ? 'k' : (Math.abs(d - 2) < 0.6) ? 'u' : (dx + dy < 0 ? 'O' : 'o')); }
  pixStamp(g, p[0] - 1, p[1] - 11, `
kkkk
kOok
kWvk
kWvk
kWvk
.kk.
`);
  kerf = [p[0], p[1] - 9];
  for (const [a, c] of [[1.72, 1.36], [1.4, 1.66], [1.8, 1.6]]) { const q = iso(a, c, 0); pixStamp(g, q[0] - 2, q[1] - 3, `
.kkk.
kOoWk
kkvvk
.kkk.
`); }
} else {
  // saw-pit: dark hole, plank-lined inner walls, a collar (stone on the Imperial pit), cross sleepers and the log across it
  flat(g, PT.a0, PT.a1, PT.c0, PT.c1, 0, () => 'K');
  wallC(g, PT.c0, PT.a0, PT.a1, -PT.d, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? (Math.floor(U) % 6 === 0 ? 'V' : 'v') : V > -6 ? 'p' : 'i') : null));
  wallA(g, PT.a0, PT.c1, PT.c0, -PT.d, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? 'V' : 'i') : null));
  line(g, iso(PT.a0, PT.c0, 0), iso(PT.a1, PT.c0, 0), 'W'); line(g, iso(PT.a0, PT.c0, 0), iso(PT.a0, PT.c1, 0), 'w');
  wallC(g, PT.c1, PT.a0, PT.a1 + 0.04, 0, 2, (U, V) => (Math.floor(U) % 9 === 0 ? 'V' : V >= 1 ? (AGE === 3 ? S[1] : 'w') : (AGE === 3 ? S[3] : 'v')));
  wallA(g, PT.a1 + 0.04, PT.c1, PT.c0, 0, 2, (U, V) => (Math.floor(U) % 9 === 0 ? 'V' : V >= 1 ? (AGE === 3 ? S[2] : 'W') : (AGE === 3 ? S[4] : 'v')));
  for (const a of [1.38, 1.8]) logC(g, a, 1.3, 1.62, 0, 2);
  logA(g, 1.46, 1.26, 1.9, 2, 3);
  kerf = iso(1.56, 1.46, 8);
  pixSet(g, kerf[0], kerf[1], 'k'); pixSet(g, kerf[0] + 1, kerf[1], 'k');
  { const h0 = iso(1.6, 1.68, -PT.d); pixStamp(g, h0[0] - 3, h0[1] - 1, `
.hhHh.
hHhhhh
`); }
}
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

// the yard's edge frayed, weeds at the foot of walls and stacks
fray(g, ch => GROUND.includes(ch), 9, { edge: 0.06, feet: 0.18, feetOf: S.join('') + AK.P.join('') + TW.join('') + 'wWvV' });
// ---- pennant pole at the shed's front-right corner (Dark: a rough stake; Castle: iron-capped; Imperial: a gilt orb)
const pole = iso(2.02, 1.18, 0), PH = [28, 42, 47, 50][AGE];
for (let z = 0; z < PH; z++) { pixSet(g, pole[0], pole[1] - z, AGE === 0 ? TW[0] : 'W'); pixSet(g, pole[0] + 1, pole[1] - z, AGE === 0 ? TW[1] : 'v'); }
if (AGE === 0) { pixSet(g, pole[0] - 1, pole[1] - 12, TW[1]); pixSet(g, pole[0], pole[1] - PH, 'k'); }
else if (F) { pixSet(g, pole[0], pole[1] - 42, 'O'); pixSet(g, pole[0] + 1, pole[1] - 42, 'u'); }
else if (AGE === 2) { pixSet(g, pole[0], pole[1] - PH, Fe[0]); pixSet(g, pole[0] + 1, pole[1] - PH, Fe[1]); pixSet(g, pole[0], pole[1] - PH - 1, Fe[1]); }
else pixStamp(g, pole[0] - 1, pole[1] - PH - 3, `.${Au[0]}${Au[1]}.\n${Au[0]}${Au[1]}${Au[1]}${Au[2]}\n.${Au[2]}${Au[2]}.`);

// ---- animated parts: the saw working and sawdust falling (Dark: chips flying off the block), the pennant waving
function pennant(fr, f) {
  if (F) { // Feudal pennant exactly as tuned
    const x0 = pole[0] + 2, y0 = pole[1] - 41, len = 11;
    for (let i = 0; i < len; i++) {
      const wave = Math.round(Math.sin((i / len) * Math.PI * 1.5 - f * Math.PI / 2) * 1.2 * (i / len));
      const hgt = Math.max(1, Math.round(6 * (1 - i / len)));
      const top = y0 + Math.round((6 - hgt) / 2) + wave;
      for (let k = 0; k < hgt; k++) pixSet(fr, x0 + i, top + k, k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T');
    }
    return;
  }
  const x0 = pole[0] + 2, y0 = pole[1] - PH + 1, len = [8, 11, 12, 13][AGE], hh = [5, 6, 7, 7][AGE];
  for (let i = 0; i < len; i++) {
    const wave = Math.round(Math.sin((i / len) * Math.PI * 1.5 - f * Math.PI / 2) * 1.2 * (i / len));
    const hgt = AGE === 2 ? hh : Math.max(1, Math.round(hh * (1 - i / len)));
    const top = y0 + Math.round((hh - hgt) / 2) + wave;
    for (let k = 0; k < hgt; k++) {
      if (AGE === 2 && i > len - 4 && Math.abs(k - (hgt - 1) / 2) < (i - len + 4) * 0.9) continue;              // swallowtail
      if (AGE === 0 && i === len - 1 && (k + f) % 2) continue;                                                    // frayed end
      pixSet(fr, x0 + i, top + k, k === 0 ? (AGE === 3 ? Au[1] : 'L') : k === hgt - 1 ? (AGE === 3 && i % 2 ? Au[2] : 'D') : 'T');
    }
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
function pitSaw(fr, f) {
  // the long two-man saw stands upright through the cut: tiller bar on top, blade above the log and on into the pit
  const dy = [0, -2, -4, -2][f], x = kerf[0], top = kerf[1] - 13 + dy;
  for (let y = top + 2; y < kerf[1]; y++) { pixSet(fr, x, y, 'm'); pixSet(fr, x + 1, y, 'n'); }
  for (let y = kerf[1] + 8; y < kerf[1] + 12 + dy; y++) { pixSet(fr, x, y, 'M'); pixSet(fr, x + 1, y, 'n'); }
  line(fr, [x - 3, top + 1], [x + 4, top + 1], 'w'); line(fr, [x - 3, top + 2], [x + 4, top + 2], 'v'); line(fr, [x - 3, top], [x + 4, top], 'k');
  pixSet(fr, x - 4, top + 1, 'k'); pixSet(fr, x + 5, top + 1, 'k'); pixSet(fr, x - 4, top + 2, 'k'); pixSet(fr, x + 5, top + 2, 'k');
  const fall = [[-1, 9], [2, 10], [-1, 11], [2, 12]][f];
  pixSet(fr, kerf[0] + fall[0], kerf[1] + fall[1], 'h');
}
function chips(fr, f) {
  // chips leaping off the block in a little arc
  const arcs = [[[-2, -2], [3, -1]], [[-4, -4], [5, -4]], [[-6, -3], [7, -5]], [[-7, 0], [8, -2]]][f];
  for (const [ax, ay] of arcs) { pixSet(fr, kerf[0] + ax, kerf[1] + ay, 'O'); pixSet(fr, kerf[0] + ax + 1, kerf[1] + ay, 'u'); }
}
const inkOf = ch => (GROUND.includes(ch) ? 'Q' : ch === 'h' || ch === 'H' ? 'Q' : 'k');
const frames = [];
for (let f = 0; f < 4; f++) { const fr = clone(g); (AGE === 0 ? chips : F ? saw : pitSaw)(fr, f); pennant(fr, f); outline(fr, inkOf); frames.push(pixText(fr)); }

return {
  id: 'lumber', kind: 'building', footprint: [W, H], anchor: [bx, by], roofChars: F ? 'ABbC' : undefined,
  palette: {
    ...AK.pal,
    e: '#8f7148', E: '#a3844f', f: '#755a36', h: '#d9c08a', H: '#c4a46a', Q: '#4a3520',   // packed earth, sawdust, earth rim
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', V: '#3b2614',                             // timber / bark ramp
    O: '#ead0a0', o: '#cfae74', u: '#a8864a',                                           // cut faces, growth rings
    i: '#2e2116', I: '#3d2c1c', p: '#3b2614', r: '#6e5030', R: '#57401f',               // shed interior, end-wall boards
    x: '#4e3b28', K: '#1c1612',                                                         // wattle / stone in shadow, pit dark
    A: '#c49a5c', B: '#a07a46', b: '#8a663a', C: '#5e4022',                             // shingles: lit butt, body, alt, gap
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', k: '#24180f',                             // steel, ink
    T: 'team', D: 'teamdark', L: 'teamlight', ...NAT_PAL,
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 0);
