// @pixel farm
// Farm (2×2, flat, no team colour by design): ploughed ridges and furrows inside a post-and-rail fence with a gap at the
// near corner, wheat on every ridge, stooks of cut sheaves by the gate.
// Sets: idle ×4 = ripe wheat swaying in a wave that travels across the rows; young ×1 = green shoots while being built.
// Drawn by drafts/building.farm.js (fades in with alpha while building; flat, so no clip).
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
const W = 2, H = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 14;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const ROWS = 8, RC0 = 0.2, RC1 = 1.8, RA0 = 0.16, RA1 = 1.84;
const rowC = i => RC0 + (RC1 - RC0) * i / (ROWS - 1);

function soil(gr) {
  flat(gr, 0, 2, 0, 2, 0, (s, t, x, y) => {
    const a = s * 2, c = t * 2, h = hash(x >> 1, y, 6);
    if (a < 0.08 || a > 1.92 || c < 0.08 || c > 1.92) return h < 0.4 ? 'f' : 'e';      // headland under the fence
    const sp = (RC1 - RC0) / (ROWS - 1), k = (c - RC0 + sp / 2) / sp, fr = k - Math.floor(k);
    if (fr < 0.2) return 'F';                               // furrow bottom (shade)
    if (fr < 0.36) return 'f';
    if (fr > 0.78) return h < 0.5 ? 'E' : 'e';              // lit ridge shoulder (faces the upper-left light)
    return h < 0.15 ? 'f' : 'e';
  });
}
// fence: rails at z 2 and 5 between posts, posts 2 px wide with a lit cap
function fence(gr, a0, c0, a1, c1, gapAt) {
  const n = 4;
  const rail = (z, ch) => line(gr, iso(a0, c0, z), iso(a1, c1, z), (i, m) => (gapAt !== undefined && Math.abs(i / m - gapAt) < 0.12 ? null : ch));
  rail(6, 'O'); rail(5, 'v'); rail(3, 'w'); rail(2, 'v');
  for (let k = 0; k <= n; k++) { const p = iso(a0 + (a1 - a0) * k / n, c0 + (c1 - c0) * k / n, 0); for (let z = 0; z < 7; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } pixSet(gr, p[0], p[1] - 7, 'O'); pixSet(gr, p[0] + 1, p[1] - 7, 'w'); }
}
// one plant: young = 2-cell shoot, ripe = stalk + a 2×2 ear that leans with the wind
function plant(gr, x, y, ripe, lean, h) {
  if (!ripe) { pixSet(gr, x, y, 'c'); pixSet(gr, x, y - 1, h < 0.5 ? 'C' : 'c'); if (h > 0.6) pixSet(gr, x + 1, y - 1, 'C'); return; }
  const tall = 3 + (h > 0.6 ? 1 : 0);
  for (let z = 0; z < tall; z++) pixSet(gr, x, y - z, z === 0 ? 'z' : 'g');
  const ex = x + lean, ey = y - tall - 2;
  pixSet(gr, ex, ey, 'Y'); pixSet(gr, ex, ey + 1, 'y'); pixSet(gr, ex, ey + 2, 'y');
  // a second, shorter stalk beside it makes a clump
  pixSet(gr, x + 1, y, 'g'); pixSet(gr, x + 1, y - 1, 'g'); pixSet(gr, x + 1 + lean, y - 2, 'y'); pixSet(gr, x + 1 + lean, y - 3, h < 0.5 ? 'Y' : 'y'); pixSet(gr, x + 1, y + 0, 'z');
}
function crops(gr, ripe, f) {
  for (let i = 0; i < ROWS; i++) {
    const c = rowC(i);
    for (let a = RA0; a <= RA1; a += ripe ? 0.085 : 0.1) {
      const p = iso(a, c, 0), h = hash(Math.round(a * 50), i, 2);
      const phase = (a * 3 - i * 0.6) - f * Math.PI / 2;               // the wave travels across the field
      const lean = ripe ? (Math.sin(phase) > 0.35 ? 1 : 0) : 0;
      plant(gr, Math.round(p[0]), Math.round(p[1]) - 1, ripe, lean, h);
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

function build(ripe, f) {
  const gr = pixGrid(GW, GH);
  soil(gr);
  fence(gr, 0.02, 0.02, 1.98, 0.02); fence(gr, 0.02, 0.02, 0.02, 1.98);           // back edges first
  crops(gr, ripe, f);
  if (ripe) { stook(gr, 1.55, 1.9); stook(gr, 1.86, 1.62); }
  // worn path through the gate at the near corner
  for (let k = 0; k < 6; k++) { const p = iso(1.94 - k * 0.04, 1.94 - k * 0.04, 0); pixSet(gr, p[0], p[1] - 1, 'E'); pixSet(gr, p[0] - 1, p[1] - 1, 'e'); }
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
  // a water bucket by the gate
  { const p = iso(1.8, 1.98, 0); pixStamp(gr, Math.round(p[0]) - 2, Math.round(p[1]) - 4, `
.kkkk.
kMnnMk
kwwwvk
kwwvvk
.kkkk.
`); }
  outline(gr, ch => ('efEF'.includes(ch) ? 'X' : 'k'));
  return pixText(gr);
}

export default {
  id: 'farm', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8b6a3a', E: '#a3803f', f: '#755830', F: '#5e4526', X: '#4a3520',          // soil: mid, lit ridge, shade, furrow, rim
    c: '#5f9a34', C: '#8fc24a',                                                  // young shoots
    g: '#a89a3a', z: '#a87a12', y: '#e1b12c', Y: '#ffe28a', Z: '#6e4d0a',        // stalk, ear ramp (shared gold)
    w: '#a07a4a', v: '#5a3a18', O: '#c9a86a', k: '#24180f', m: '#e6eaee', M: '#9aa0a6', n: '#5f656c',                      // rails/posts, cap, ink
  },
  frames: { idle: [0, 1, 2, 3].map(f => build(true, f)), young: [build(false, 0)] },
};
