// @pixel smith
// Blacksmith (2×2), one variant per age (AGE, AK = pixAgeKit(AGE) from gen/ages/wrap.mjs; first built in the Feudal Age):
//   Feudal   a low timber-framed forge on a stone plinth (the kit's close studding and daub), brown oak shingles, a rubble
//            stone chimney, shuttered window with team shutters, carved knob finials on the gables.
//   Castle   the coursed stone smithy below, now under red clay tiles, a taller chimney, a team banner on the shaded wall.
//   Imperial the tallest: pale limestone ashlar with pilasters and a gilt string course, blue slate with gilt cresting and orb
//            finials, a broad chimney with a gilt band, an arched window, a gilt-fringed banner and a gilt hanging sign
//            (an anvil) on an iron bracket at the front corner.
// Every age keeps the forge mouth glowing, the anvil, the awning, coal bin, trough and tools.
// Castle as tuned: coursed stone smithy under a gable roof, a stone chimney through the roof, a wide forge mouth in
// the lit wall with the hearth glowing inside, tools hung on a rail, a team-striped awning over the work bench, an anvil on
// its stump in the yard, a plank quench trough and a coal bin with a shovel against the wall, on cinder-strewn earth.
// pt4: the Feudal and Castle ridges sag a pixel (Feudal's far end lifts), the eaves drop a slipped shingle/tile or two, moss at the foot of stone walls, coal spilt by the bin, the yard's edge frayed.
// idle ×6: smoke puffs rise and drift from the chimney, the forge glow pulses (on the hearth, jambs and the ground), sparks fly off the anvil.
// Drawn by drafts/building.smith.js: pixDraw(PIXELS.smith,'idle',b.built?Math.floor(G.time*5):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
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
const W = 2, H = 2, Z = 14, STACK = 16;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + STACK + 22 + [0, 0, 0, 14][AGE];
const { R: RK, S: SK, Au, Fe, Gl, INK, DEEP } = AK, TW2 = AK.W[2];
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const WZ = [0, 12, 15, 19][AGE], R = [0, 14, 16, 18][AGE];    // wall height, roof rise
const A0 = 0.05, A1 = 1.95, C0 = 0.06, C1 = 1.28;
const RA0 = 0.0, RA1 = 1.99, RC0 = 0.0, RC1 = 1.4, RR = 0.67;

// ---- yard: dark trodden earth with cinders
const GROUND = 'eEfx';
const MOSS = (fn, st, lit) => weather(fn, st, {}, { lit, seed: lit ? 1 : 2 });
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => { const h = hash(x >> 1, y >> 1, 4); return h < 0.18 ? 'f' : h < 0.26 ? 'x' : h < 0.36 ? 'E' : 'e'; });

// ---- walls: stone courses, a plinth, quoins on the near corner, soot darkening under the eaves
// Castle: the stone as tuned. Feudal / Imperial: the age kit's wall (timber frame on a plinth; limestone ashlar), eave shadow.
const lit = AGE === 3 ? blocks([SK[0], SK[1], SK[2], SK[1], SK[3]], SK[5], 4, 9, 3) : AGE === 1 ? blocks([SK[1], SK[2], SK[3], SK[2], SK[4]], SK[5], 4, 7, 3) : blocks(['P', 'p', 'q', 'p', 'Q'], 'j', 4, 9, 3);
const sh = AGE === 3 ? blocks([SK[2], SK[3], SK[4], SK[3], SK[5]], SK[5], 4, 9, 4) : AGE === 1 ? blocks([SK[2], SK[3], SK[4], SK[3], SK[5]], SK[5], 4, 7, 4) : blocks(['q', 'Q', 'U', 'Q', 'V'], 'J', 4, 9, 4);
const LENL = (A1 - A0) * 32, LENR = (C1 - C0) * 32;
if (AGE === 2) {
  wallC(g, C1, A0, A1, 0, WZ, MOSS((U, V) => (V < 2 ? (Math.floor(U) % 7 === 0 ? 'J' : 'U') : V > WZ - 3 ? (hash(Math.floor(U), 0, 2) < 0.5 ? 'Q' : 'U') : lit(U, V - 2)), 'UJpqP', true));
  wallA(g, A1, C1, C0, 0, WZ, MOSS((U, V) => (V < 2 ? 'V' : V > WZ - 3 ? 'V' : sh(U, V - 2)), 'VQU', false));
  { const p = iso(A1, C1, 0); for (let z = 2; z < WZ - 1; z++) { const row = Math.floor((z - 2) / 4), r = (z - 2) % 4, len = row % 2 ? 2 : 4; for (let i = 0; i < len; i++) pixSet(g, p[0] - 1 - i, p[1] - z + Math.floor((i + 1) / 2), r === 0 ? 'j' : r === 3 ? 'P' : 'p'); } }
  // shuttered window on the lit wall
  wallC(g, C1, 0.2, 0.42, 5, 11, (U, V) => { const u = Math.floor(U); if (V < 1) return 'P'; if (V >= 5) return 'w'; if (u === 0 || u >= 6) return 'w'; return u === 3 ? 'w' : V > 3 ? 'n' : 'K'; });
} else {
  const opt = { H: WZ + 1, step: AGE === 3 ? 20 : 10 };
  wallC(g, C1, A0, A1, 0, WZ, MOSS((U, V) => (V >= WZ - 1 ? AK.P[2] : AK.wallTex(U, V, 0, { ...opt, len: LENL })), AGE === 3 ? '' : SK.join(''), true));
  wallA(g, A1, C1, C0, 0, WZ, MOSS((U, V) => (V >= WZ - 1 ? (AGE === 3 ? SK[4] : TW2) : AK.wallTex(U, V, 1, { ...opt, len: LENR })), AGE === 3 ? '' : SK.join(''), false));
  // the window: Feudal shuttered casement with team shutters; Imperial a tall arched window with a gilt keystone and sill
  { const p = iso(0.31, C1, AGE === 3 ? 11 : 7); AK.windowAt(g, Math.round(p[0]), Math.round(p[1]), 0.5, 0); }
}
// forge mouth: deep recess (hearth drawn per frame), timber lintel, dressed jambs
const FA0 = 0.62, FA1 = 1.22, FZ = AGE === 1 ? 10 : AGE === 3 ? 13 : 11;
if (AGE === 3) wallC(g, C1, FA0 - 0.04, FA1 + 0.04, 0, FZ + 5, (U, V) => { const u = Math.floor(U), n = (FA1 - FA0 + 0.08) * 32, c = n / 2, dh = V - FZ;   // round-arched stone surround, gilt keystone
  if (dh > 0 && Math.hypot(U - c, dh * 2.2) > c + 0.5) return null; if (dh >= 3 && Math.abs(U - c) < 1.5) return Au[0]; return (u + Math.floor(V / 3)) % 5 === 0 ? SK[3] : SK[1]; });
wallC(g, C1, FA0, FA1, 0, FZ + 2, (U, V) => { const u = Math.floor(U); if (V >= FZ) return AGE === 3 ? (V >= FZ + 1 ? SK[0] : SK[2]) : V >= FZ + 1 ? 'w' : 'v'; if (u < 2) return u ? 'P' : 'q'; if (u > 16) return u > 17 ? 'Q' : 'q'; return 'K'; });
// tool rail right of the forge: a batten with tongs, hammers and horseshoes hung from it
wallC(g, C1, 1.32, 1.86, 8, 9, () => 'w');
{ const p = iso(1.32, C1, 8); const tools = `
.n....n.n.....n......
.n...nMnM....mMm..mm.
.M...n...n...nMn..mM.
nMn..n...n....w...n.n
.M...M...M....w...n.n
.n............w....n.
..............v......
`; pixStamp(g, p[0] + 1, p[1] - 1, tools); }

// ---- roof: back slope sliver, slate courses on the front slope, plank gable end, ink ridge and eaves
line(g, iso(A0, C1, WZ - 1), iso(A1, C1, WZ - 1), 'V');
// roofs in the age's material (Feudal shingles, Castle tiles, Imperial slate); the back slope runs away from us: flip
{ const o = iso(RA0, RC0, WZ), u = sub2(iso(RA1, RC0, WZ), o), v = sub2(iso(RA0, RR, WZ + R), o); face(g, o, u, v, (s, t, x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true })); }
// gable end: boarded (Feudal, Castle); a limestone pediment with gilt-edged rakes (Imperial)
{ const pA = iso(RA1, RC1, WZ), pB = iso(RA1, RC0, WZ), pC = iso(RA1, RR, WZ + R);
  poly(g, [pA, pB, pC], (x, y) => (AGE === 3 ? (y > pA[1] - 2 ? SK[4] : (Math.floor((y - (pA[1] - (x - pA[0]) * 0.5)) / 3) + (x >> 3)) % 4 === 0 ? SK[5] : SK[2]) : (x - pA[0]) % 4 === 0 ? 'c' : y > pA[1] - 2 ? 'c' : 'a')); }
const roofZ = c => (c >= RR ? WZ + R * (RC1 - c) / (RC1 - RR) : WZ + R * (c - RC0) / (RR - RC0));
{ const o = iso(RA0, RC1, WZ), u = sub2(iso(RA1, RC1, WZ), o), v = sub2(iso(RA0, RR, WZ + R), o), SL = Math.abs(v[1]);
  face(g, o, u, v, (s, t, x, y) => (t * SL < 1.5 ? RK[3] : AK.roofXY(x, y, 0.5, 0))); }
line(g, iso(RA0, RR, WZ + R), iso(RA1, RR, WZ + R), 'k'); line(g, iso(RA0 + 0.04, RR + 0.04, WZ + R - 1), iso(RA1 - 0.04, RR + 0.04, WZ + R - 1), RK[0]);
line(g, iso(RA0, RC1, WZ), iso(RA1, RC1, WZ), 'k'); line(g, iso(RA0, RC0, WZ), iso(RA1, RC0, WZ), 'k');
line(g, iso(RA1, RC1, WZ), iso(RA1, RR, WZ + R), 'k'); line(g, iso(RA1, RC0, WZ), iso(RA1, RR, WZ + R), 'k');
if (AGE === 3) { line(g, iso(RA1, RC1 - 0.03, WZ + 1), iso(RA1, RR, WZ + R - 1), Au[1]); line(g, iso(RA1, RC0 + 0.03, WZ + 1), iso(RA1, RR, WZ + R - 1), Au[2]); }
AK.trim(g, iso(RA0 + 0.03, RC1, WZ), iso(RA1, RC1, WZ), 1);                                // Castle stone cornice / Imperial gilt
if (AGE === 3) AK.crest(g, iso(RA0 + 0.06, RR, WZ + R - 1), iso(RA1 - 0.06, RR, WZ + R - 1));
// Castle: a crow-stepped stone gable end standing proud of the tiles (its steps break the skyline); iron finial on the far end
if (AGE === 2) {
  const top = c => { const zr = WZ + R * (c >= RR ? (RC1 - c) / (RC1 - RR) : (c - RC0) / (RR - RC0)); return WZ + 2 + Math.ceil((zr - WZ) / 4) * 4; };
  wallA(g, RA1 + 0.01, RC1, RC0, WZ - 1, WZ + R + 6, (U, V) => { const c = RC1 - U / 32, z = WZ - 1 + V, t = top(c);
    if (z > t) return null; if (z > t - 1.5) return 'P'; const row = Math.floor(z / 4), u = Math.floor(U + (row % 2) * 3);
    return (Math.floor(z) % 4 === 0 || u % 7 === 0) ? 'J' : hash(u >> 3, row, 6) < 0.3 ? 'U' : 'Q'; });
  // ink round the stepped top so it reads against the sky and the tiles
  for (let U = 0; U <= (RC1 - RC0) * 32; U++) { const c = RC1 - U / 32, p = iso(RA1 + 0.01, c, top(c) + 1); pixSet(g, p[0], p[1], 'k'); }
}
for (const ra of AGE === 2 ? [RA0 + 0.03] : [RA0 + 0.03, RA1]) { const p = iso(ra, RR, WZ + R); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 1); }
if (AGE < 3) { ragEave(g, iso(RA0, RC1, WZ), iso(RA1, RC1, WZ), AGE === 1 ? RK[3] : RK[4], 'k', 0.15, 8); sag(g, iso(RA0 + 0.1, RR, WZ + R), iso(RA1 - 0.14, RR, WZ + R), Math.ceil(RR * 32 - R) + 5, 1, AGE === 1 ? 1.4 : 1.2, AGE === 1 ? 0.1 : 0); }
// soot staining on the slates around the chimney
// ---- chimney through the roof: only the part above the roof plane is painted
const BIG = AGE === 3 ? 0.04 : 0, KA0 = 1.5 - BIG, KA1 = 1.76 + BIG, KC0 = 0.5 - BIG, KC1 = 0.78 + BIG, KZ = [0, 41, 48, 62][AGE];
const CAP = AGE === 2 ? ['P', 'q', 'Q', 'p'] : [SK[0], SK[1], SK[2], SK[1]];
wallC(g, KC1, KA0, KA1, 0, KZ, (U, V) => (V < roofZ(KC1) ? null : V > KZ - 3 ? (V > KZ - 1 ? CAP[0] : CAP[1]) : AGE === 3 && V >= KZ - 8 && V < KZ - 6 ? Au[V === KZ - 7 ? 0 : 1] : lit(U, V)));
wallA(g, KA1, KC1, KC0, 0, KZ, (U, V) => (V < roofZ(KC1 - U / 32) ? null : V > KZ - 3 ? CAP[2] : AGE === 3 && V >= KZ - 8 && V < KZ - 6 ? Au[2] : sh(U, V)));
flat(g, KA0, KA1, KC0, KC1, KZ, (s, t) => (s > 0.15 && s < 0.85 && t > 0.15 && t < 0.85 ? 'K' : CAP[3]));
// soot where it meets the roof
{ const p = iso(KA0, KC1, roofZ(KC1)); for (let i = 0; i < 9; i++) pixSet(g, p[0] + i, p[1] + Math.floor(i / 2) + 1, 'Z'); }

// ---- team awning over the bench at the left of the yard (striped T / L, scalloped hem), on two posts
const AA0 = 0.08, AA1 = 0.58, AC = 1.74, AZ0 = 8, AZ1 = 12;
// bench + quench tub under/near it first
wallC(g, 1.56, 0.14, 0.5, 0, 5, (U, V) => (V >= 4 ? 'w' : Math.floor(U) % 10 < 2 ? 'v' : null));
{ const o = iso(AA0, C1, AZ1), u = sub2(iso(AA1, C1, AZ1), o), v = sub2(iso(AA0, AC, AZ0), o);
  face(g, o, u, v, (s, t) => { const stripe = Math.floor(s * 8) % 2; if (t > 0.9) return 'D'; return stripe ? (t < 0.15 ? 'D' : 'T') : (t < 0.15 ? 'T' : 'L'); }); }
wallC(g, AC, AA0, AA1, AZ0 - 2, AZ0, (U, V) => (Math.floor(U) % 4 < 2 ? 'D' : V >= 1 ? 'T' : null));
for (const a of [AA0 + 0.02, AA1 - 0.02]) { const p = iso(a, AC, 0); for (let z = 0; z < AZ0 - 1; z++) { pixSet(g, p[0], p[1] - z, 'w'); pixSet(g, p[0] + 1, p[1] - z, 'v'); } }

// Castle / Imperial: a team banner on the shaded wall; Imperial: a gilt hanging sign (an anvil) on an iron bracket that
// reaches out from the front corner over the yard, the board hung by two links
if (AGE >= 2) { const p = iso(A1, 0.78, WZ - 3); AK.banner(g, Math.round(p[0]), Math.round(p[1]), -0.5, 6, AGE === 3 ? 13 : 11); }
if (AGE === 3) {
  const p0 = iso(A1, C1 - 0.14, WZ - 4), p1 = iso(A1, C1 + 0.36, WZ - 4);
  line(g, [p0[0], p0[1] - 1], [p1[0], p1[1] - 1], INK); line(g, p0, p1, Fe[0]); line(g, [p0[0] - 1, p0[1] + 5], [p0[0] - 6, p0[1] + 2], Fe[1]); pixSet(g, p1[0], p1[1] - 1, INK);
  const sx = Math.round((p0[0] + p1[0]) / 2) - 5, sy = Math.round((p0[1] + p1[1]) / 2) + 2;
  pixSet(g, sx + 2, sy - 1, Fe[0]); pixSet(g, sx + 8, sy + 2, Fe[0]);
  pixStamp(g, sx, sy, `
kkkk.......
kbbbkkkk...
kbTTTbbbkk.
kbTkkkkTbbk
kbTTkkTTTbk
.kbTkkkTTbk
..kbTTkkkbk
...kkbbbbbk
.......kkkk
`.replace(/b/g, Au[1]).replace(/k/g, INK));
}

// a prop painted on its own layer, inked round its silhouette, then laid over the scene (so it reads against the yard)
function inked(gr, draw) { const t = pixGrid(gr[0].length, gr.length); draw(t); outline(t, () => 'k'); for (let y = 0; y < t.length; y++) for (let x = 0; x < t[0].length; x++) if (t[y][x] !== '.') gr[y][x] = t[y][x]; }
// ---- yard props, each built on the iso axes: a coal bin against the wall under the tool rail, a plank quench trough
// by the anvil, and the anvil on its stump (painted per frame, in front of the forge glow)
inked(g, g => { const BA0 = 1.42, BA1 = 1.74, BC0 = 1.3, BC1 = 1.48, BZ = 5;
  wallC(g, BC0, BA0, BA1, 0, BZ + 1, (U, V) => (V >= BZ ? 'W' : 'v'));                                   // back board
  heap(g, ...iso((BA0 + BA1) / 2, (BC0 + BC1) / 2, BZ - 1), 7, 3, ['M', 'n', 'x', 'K'], 6, 2);
  wallC(g, BC1, BA0, BA1, 0, BZ - 1, (U, V) => (V >= BZ - 2 ? 'w' : Math.floor(U) % 5 === 0 ? 'v' : 'W'));
  wallA(g, BA1, BC1, BC0, 0, BZ, (U, V) => (V >= BZ - 1 ? 'W' : 'v'));
  // a shovel stuck in the coal
  const sp = iso(BA0 + 0.1, BC0 + 0.08, BZ); line(g, [sp[0], sp[1]], [sp[0] - 2, sp[1] - 8], 'w'); pixSet(g, sp[0] - 2, sp[1] - 9, 'v');
});
inked(g, g => { const TA0 = 1.36, TA1 = 1.8, TC0 = 1.62, TC1 = 1.8, TZ = 6;
  flat(g, TA0, TA1, TC0, TC1, TZ, (s, t) => (s < 0.06 || s > 0.94 || t < 0.16 || t > 0.84 ? (t < 0.16 || s < 0.06 ? 'W' : 'w') : (t < 0.4 && s > 0.2 && s < 0.6 ? 'B' : 'b')));
  wallC(g, TC1, TA0, TA1, 0, TZ, (U, V) => { const u = Math.floor(U); if (u === 2 || u === 11) return 'n'; if (V >= TZ - 1) return 'w'; return Math.floor(V) === 2 ? 'v' : 'W'; });
  wallA(g, TA1, TC1, TC0, 0, TZ, (U, V) => (V >= TZ - 1 ? 'W' : 'v'));
});
// coal spilt round the bin, cinders by the forge; the yard's edge frayed, weeds at the walls' feet
spill(g, ...iso(1.5, 1.6, 0), 10, 4, 9, ['x', 'N', 'n'], 'F', ch => GROUND.includes(ch), 6);
fray(g, ch => GROUND.includes(ch), 11, { edge: 0.05, feet: 0.16, feetOf: 'UVJQpqP' + SK.join('') + AK.P.join('') + AK.W.join('') });
const NA = 1.0, NC = 1.66, NT = 13;
const AN = iso(NA, NC, -2);
function anvil(fr) { inked(fr, fr => {
  // stump
  wallC(fr, NC + 0.08, NA - 0.08, NA + 0.08, 0, 7, (U, V) => (V >= 6 ? 'w' : Math.floor(U) % 3 === 0 ? 'v' : 'W'));
  wallA(fr, NA + 0.08, NC + 0.08, NC - 0.08, 0, 7, (U, V) => (V >= 6 ? 'W' : 'v'));
  flat(fr, NA - 0.08, NA + 0.08, NC - 0.08, NC + 0.08, 7, () => 'u');
});
  // the anvil: a classic side profile (horn left, square heel right, waist, spread foot) seated on the stump top
  const t = iso(NA, NC, 7);
  pixStamp(fr, Math.round(t[0]) - 8, Math.round(t[1]) - 9, `
kkkkkk..........
kmmmmmkkkkkkkkkk
.kkMmmmmmmmmmmmk
...kkMMMMMMMMMnk
.....kkMMMMMnnk.
.......kMMMnk...
......kMMMnnk...
.....kNMMnnnNk..
.....kkkkkkkkk..
`);
}
// ---- per-frame life
const GLOW = [0, 1, 2, 2, 1, 0];
const HEARTH = [['r', 'o', 'o'], ['o', 'O', 'O'], ['O', 'Y', 'Y']];
function forge(fr, lv) {
  const [c1, c2, c3] = HEARTH[lv];
  // hearth bed at the back of the mouth: embers below, flame tongues, light on the jambs and the ground in front
  const span = (FA1 - FA0 - 0.12) * 32;
  wallC(fr, C1, FA0 + 0.06, FA1 - 0.06, 0, FZ - 1, (U, V) => {
    const u = Math.floor(U), mid = Math.abs(U - span / 2);
    if (V < 4) return V >= 3 ? 'P' : u % 6 === 0 || V < 1 ? 'j' : 'p';                       // stone hearth bed
    if (V < 5) return hash(u, 0, lv) < 0.4 ? c1 : c2;                                         // glowing coals on it
    if (V < 6 + lv && mid < 4.5 - (V - 5) * 1.2) return V < 6 ? c2 : c3;                       // flame
    return null;
  });
  if (lv) { wallC(fr, C1, FA0, FA0 + 0.06, 4, FZ - 1, (U, V) => (Math.floor(V) % 3 ? 'O' : null)); }
  flat(fr, FA0 + 0.1, FA1 - 0.1, C1, C1 + 0.04 + 0.03 * lv, 0, (s, t, x, y) => (hash(x, y, 1) < 0.15 + lv * 0.15 ? (t < 0.5 ? 'o' : 'r') : null));
}
function smoke(fr, f) {
  const top = iso((KA0 + KA1) / 2, (KC0 + KC1) / 2, KZ);
  for (let k = 0; k < 4; k++) {
    const age = (f + k * 1.5) / 6;               // each puff rises over the loop and fades/grows
    const ph = age - Math.floor(age);
    const x = Math.round(top[0] + ph * 7 + Math.sin(ph * 5 + k) * 1.2), y = Math.round(top[1] - 3 - ph * 26), r = ph < 0.3 ? 1 : 2;
    if (y < 1) continue;
    disc(fr, x, y, r, (dx, dy, ring) => (dx + dy < 0 ? (ph > 0.7 ? 'H' : 'G') : ph > 0.6 ? 'H' : 'g'));
  }
}
function sparks(fr, f) {
  const sets = [[[-3, -15], [2, -16], [5, -14]], [[-6, -18], [4, -20], [8, -16], [-1, -19]], [[-8, -15], [7, -21]], [], [], [[0, -15], [3, -16]]];
  for (const [dx, dy] of sets[f]) { pixSet(fr, AN[0] + dx, AN[1] + dy, 'Y'); pixSet(fr, AN[0] + dx + (dx > 0 ? 1 : -1), AN[1] + dy + 1, 'O'); }
}
const frames = [];
for (let f = 0; f < 6; f++) { const fr = clone(g); forge(fr, GLOW[f]); anvil(fr); sparks(fr, f); smoke(fr, f); outline(fr, ch => (GROUND.includes(ch) ? 'F' : 'gGH'.includes(ch) ? 'g' : 'k')); frames.push(pixText(fr)); }

return {
  id: 'smith', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    e: '#6e5c45', E: '#806c52', f: '#57483a', x: '#3a332e', F: '#33291f',                       // yard earth, cinders, rim
    P: '#aca496', p: '#8f877a', q: '#7f776b', Q: '#66605a', U: '#58524c', V: '#45403b', j: '#5b554d', J: '#36322e', // stone
    X: '#8a95a4', s: '#5e6876', S: '#525b68', Z: '#363c47',                                     // slate: lip, body, alt, gap/soot
    a: '#5a4430', c: '#3b2614', w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', K: '#1a1512',         // boards, timber, dark
    r: '#a8401c', o: '#ff8c2a', O: '#ffb347', Y: '#ffe08a',                                     // ember → white heat
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', N: '#3e444b', u: '#c49a5c', b: '#4a6a8a', B: '#7aa0c0',                       // steel, water
    g: '#7d7873', G: '#a29d97', H: '#c4beb8', k: '#24180f',                                     // smoke ramp, ink
    T: 'team', D: 'teamdark', L: 'teamlight', ...NAT_PAL,
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 1);
