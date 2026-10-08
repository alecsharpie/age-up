// @pixel mill
// Windmill (2×2): a round tapering tower of coursed stone on a plinth, an arched team-colour door and lit slit windows,
// a thatched conical cap with a finial, four lattice sails in team cloth on the front of the cap; grain sacks, a spare
// millstone and a cobbled ring on the packed-earth apron. idle ×4: the sails turn in 22.5° steps (4 arms → seamless loop).
// Drawn by drafts/building.mill.js: pixDraw(PIXELS.mill,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
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
const W = 2, H = 2, Z = 18, ROOF = 14, ARM = 25;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + ARM + 4;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const CX = OX, CY = OY + 32;                 // footprint centre on the ground
const RB = 19, RT = 15, TH = 44;             // tower radius at base / top, height

// ---- apron: packed earth, a ring of cobbles round the tower, a worn path to the door
const GROUND = 'eEfcC';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => {
  const dx = x - CX, dy = (y - CY) * 2, d = Math.hypot(dx, dy), h = hash(x >> 1, y >> 1, 2);
  if (d < RB + 6) { const cb = hash(Math.floor((x + (y % 2) * 1.5) / 3), y >> 1, 8); return ((x + (y >> 1)) % 3 === 0 || y % 2 === 0) ? 'f' : cb < 0.5 ? 'c' : 'C'; }
  const path = Math.abs(dx + dy * 0.9 + 4) < 6 && dx < 0 && dy > 0;
  if (path) return h < 0.5 ? 'E' : 'e';
  return h < 0.2 ? 'f' : h < 0.32 ? 'E' : 'e';
});

// ---- tower: per height row v, paint the front half-ellipse arc; stone courses curve round the drum
const SH = ['P', 'p', 'q', 'Q', 'U', 'V'];                 // stone ramp light → deep
const tone = (nx, bump) => SH[Math.max(0, Math.min(5, Math.floor((nx + 1) / 2 * 5.2 + 0.2) - bump))];
function drum(gr, v0, v1, rad, fn) {
  for (let v = v0; v <= v1; v++) {
    const r = rad(v), yc = CY - v;
    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
      const nx = dx / r, front = Math.round(yc + (r / 2) * Math.sqrt(Math.max(0, 1 - nx * nx)));
      for (let y = front; y <= front + 1; y++) { const ch = fn(dx, v, nx, Math.asin(Math.max(-1, Math.min(1, nx)))); if (ch) pixSet(gr, CX + dx, y, ch); }
    }
  }
}
const rTower = v => RB - (RB - RT) * v / TH;
// plinth: a wider, darker course
drum(g, 0, 3, () => RB + 2, (dx, v, nx) => (v === 3 ? tone(nx, 1) : (dx + 40) % 5 === 0 ? 'V' : tone(nx, -1)));
drum(g, 4, TH, rTower, (dx, v, nx, ph) => {
  const course = Math.floor((v - 4) / 4), r = (v - 4) % 4, arc = ph * rTower(v) * 1.15 + (course % 2) * 3.5 + hash(course, 1, 3) * 3;
  const blk = hash(Math.floor(arc / 7), course, 5);
  if (r === 0) return nx > 0.35 ? 'J' : 'j';
  if (Math.floor(arc / 7) !== Math.floor((arc - 1.15) / 7)) return nx > 0.35 ? 'J' : 'j';
  return tone(nx, (r === 3 ? 1 : 0) + (blk < 0.25 ? -1 : blk > 0.8 ? 1 : 0) * (nx > 0.6 ? 0 : 1));
});
// an eave shadow under the cap
drum(g, TH - 2, TH, rTower, (dx, v, nx) => (nx > 0.2 ? 'V' : 'U'));

// openings on the drum: arched team door (left of centre, lit side), slit windows with lit sills
function onDrum(gr, dx0, dx1, v0, v1, fn) { drum(gr, v0, v1, rTower, (dx, v, nx) => (dx >= dx0 && dx <= dx1 ? fn(dx - dx0, v - v0, dx1 - dx0, v1 - v0) : null)); }
onDrum(g, -12, -4, 2, 16, (u, v, uw, vh) => {
  const arch = v > vh - 3 && (u === 0 || u === uw || (v === vh && (u < 2 || u > uw - 2)));
  if (v > vh - 1 && (u <= 1 || u >= uw - 1)) return null;
  if (arch || u === 0 || u === uw || v === vh) return 'w';                       // stone-dressed jambs read as a timber frame
  if (v < 2) return 'v';                                                           // threshold
  if (u === 1) return 'L'; if (u === uw - 1) return 'D';
  if (v === 7 || v === 12) return 'D';                                             // ledges
  return u === 4 ? 'D' : 'T';
});
for (const [x0, v0] of [[2, 22], [-9, 32], [6, 36]]) onDrum(g, x0, x0 + 2, v0, v0 + 5, (u, v) => (v === 0 ? 'P' : u === 2 ? 'Q' : v === 5 ? 'j' : 'K'));

// ---- cap: a thatched cone over the drum top, strands following the slope, dark eave fringe, finial
const CAPR = RT + 4, CAPH = 19, capY = CY - TH;
for (let k = 0; k <= CAPH * 2; k++) {
  const t = k / (CAPH * 2), r = CAPR * (1 - t), yc = capY - t * CAPH;
  for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
    const nx = r > 0.5 ? dx / r : 0; if (Math.abs(nx) > 1) continue;
    const front = Math.round(yc + (r / 2) * Math.sqrt(1 - nx * nx));
    const ph = Math.asin(nx), strand = Math.floor((ph + 2) * 9), band = Math.floor(t * 7), h = hash(strand, band, 4);
    let lv = (nx + 1) / 2 * 4.2 + (h < 0.3 ? 1 : h > 0.85 ? -1 : 0) - (t > 0.8 ? 0 : 0);
    if (t < 0.06) lv += 1.5;
    const TH_ = ['A', 'B', 'b', 'F', 'G', 'G'];
    pixSet(g, CX + dx, front, TH_[Math.max(0, Math.min(5, Math.floor(lv)))]);
    pixSet(g, CX + dx, front - 1, TH_[Math.max(0, Math.min(5, Math.floor(lv)))]);
  }
}
// a binding band two-thirds up the cap
for (let dx = -8; dx <= 8; dx++) { const r = CAPR * 0.42, nx = dx / r; if (Math.abs(nx) > 1) continue; pixSet(g, CX + dx, Math.round(capY - CAPH * 0.58 + (r / 2) * Math.sqrt(1 - nx * nx)), nx > 0.3 ? 'v' : 'W'); }
pixStamp(g, CX - 1, capY - CAPH - 4, `
.k.
kOk
kwk
`);

// ---- props on the apron: grain sacks by the door, a spare millstone against the shaded side
const sack = (x, y) => pixStamp(g, x, y, `
...k...
..kvk..
.kSssk.
kSSsssk
kSsssmk
ksssmmk
.kkkkk.
`);
for (const [x, y] of [[CX - 34, CY + 2], [CX - 29, CY + 4], [CX - 31, CY - 3], [CX - 24, CY + 7], [CX - 39, CY + 6]]) sack(x, y);
{ const mx = CX + 26, my = CY + 4; disc(g, mx, my, 6, (dx, dy, ring) => (ring ? 'k' : Math.hypot(dx, dy) < 1.5 ? 'K' : (Math.abs(Math.hypot(dx, dy) - 3.5) < 0.5 ? 'U' : dx + dy < -1 ? 'p' : dx + dy > 2 ? 'U' : 'q'))); }
// a handcart with a sack, front-right
pixStamp(g, CX + 8, CY + 14, `
....kkkk......
...kSssk......
.kkkkkkkkkkk..
kwwwwwwwwwwWk.
kWWWWWWWWWWvk.
.kkkkkkkkkkkkkk
..kk.....kk....
.kMnk...kMnk...
..kk.....kk....
`);

// ---- sails: hub on the front of the cap; the sail plane faces the lit (front-left) side
const hub = [CX - 12, capY - 3];
const e = th => [Math.cos(th) * 0.89, Math.cos(th) * 0.45 - Math.sin(th)];
const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = clone(g);
  // windshaft stub
  line(fr, [hub[0] + 4, hub[1] - 1], hub, 'v');
  for (let j = 0; j < 4; j++) {
    const th = f * Math.PI / 8 + j * Math.PI / 2, d = e(th), n = e(th + Math.PI / 2);
    // lattice sail on the trailing side of the stock
    const o = [hub[0] + d[0] * 6 + n[0] * 1, hub[1] + d[1] * 6 + n[1] * 1], u = [d[0] * (ARM - 6), d[1] * (ARM - 6)], v = [n[0] * 7, n[1] * 7];
    face(fr, o, u, v, (s, t) => {
      const along = s * (ARM - 6);
      if (t > 0.84) return 'v';                                        // outer frame bar
      if (along % 4 < 1) return 'W';                                  // cross laths
      if (s > 0.96) return 'v';
      return t < 0.22 ? 'L' : t > 0.66 ? 'D' : 'T';
    });
    // the stock (whip) itself, 2 px, lit edge up-left
    line(fr, hub, [hub[0] + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'w');
    line(fr, [hub[0] + 1, hub[1]], [hub[0] + 1 + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'v');
  }
  disc(fr, hub[0], hub[1], 2, (dx, dy, ring) => (ring ? 'k' : 'O'));
  outline(fr, ch => (GROUND.includes(ch) ? 'X' : 'k'));
  frames.push(pixText(fr));
}

export default {
  id: 'mill', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8f7148', E: '#a3844f', f: '#6f5636', c: '#a39a8a', C: '#8d8478', X: '#4a3520',          // apron earth, cobbles, rim
    P: '#d6ccb4', p: '#c4b796', q: '#ab9d7e', Q: '#8f8268', U: '#746a55', V: '#584f40',          // tower stone ramp (warm)
    j: '#7d725e', J: '#4e4636', K: '#1e1814',                                                    // mortar lit / shade, dark
    A: '#e6c272', B: '#d0a650', b: '#b58a3c', F: '#8f6a2c', G: '#6a4c22',                        // thatch ramp
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', O: '#c9a86a', k: '#24180f',                       // timber, hub, ink
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', M: '#9aa0a6', n: '#5f656c',                        // sacks, iron
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
