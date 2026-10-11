// @pixel market
// Market (3×3): a cobbled courtyard on a low stone kerb, four different stalls: each faces its own way (counter toward +c or
// +a) under its own roof (a team-striped lean-to awning, an ochre ridged tent, a flat undyed canopy with a team valance), counters of goods (terracotta pots, bolts of cloth, fruit baskets, grain sacks), a
// well in the middle, crates and barrels, a pennant pole at the left corner. The code flag flies from the right corner (clear of the awnings).
// idle ×4: the awning hems flutter and the pennant waves.
// Drawn by drafts/building.market.js: pixDraw(PIXELS.market,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
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
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 96;
const g = pixGrid(GW, GH);
const KZ = 3;                                             // kerb height

// ---- courtyard: stone kerb faces, cobbled setts on top in staggered rows with mortar
wallC(g, 3, 0, 3, 0, KZ, (U, V) => (Math.floor(U) % 9 === 0 ? 'j' : V >= 2 ? 'P' : 'p'));
wallA(g, 3, 3, 0, 0, KZ, (U, V) => (Math.floor(U) % 9 === 0 ? 'J' : V >= 2 ? 'Q' : 'U'));
flat(g, 0, 3, 0, 3, KZ, (s, t, x, y) => {
  const a = s * 3 / 0.16, c = t * 3 / 0.13, row = Math.floor(c), col = Math.floor(a + (row % 2) * 0.5), fa = a + (row % 2) * 0.5 - col, fc = c - row;
  if (fc < 0.2 || fa < 0.14) return 'j';
  const h = hash(col, row, 3); return h < 0.3 ? 'q' : h < 0.75 ? 'p' : 'P';
});

// ---- props
const pot = (gr, x, y) => pixStamp(gr, x, y, `
.kkk.
kOook
kOoik
kooik
.kkk.
`);
const goods = {
  pots: (gr, x, y) => { pixStamp(gr, x, y - 3, `
..kkk....kkk..
.kOook..kOook.
.kOooik.kOooik
.kooiik.kooiik
..kkkk...kkkk.
`); pot(gr, x + 5, y + 1); },
  cloth: (gr, x, y) => pixStamp(gr, x, y - 3, `
kkkkkkk.......
kRRRRrk.kkkkk.
krrrrrkkbBBbbk
.kkkkkkkbbbbak
..kkkkkk.kkkk.
..kxXxxNk.....
..kNNNNNk.....
..kkkkkkk.....
`),
  fruit: (gr, x, y) => pixStamp(gr, x, y - 3, `
..k.k.k...kk..
.kFfkFfk.kAek.
.kffkffk.keeek
kwwwwwwvkkeek.
kWWWWWWvkwwwvk
.kkkkkkk.kkkk.
`),
  sacks: (gr, x, y) => pixStamp(gr, x, y - 4, `
...k......k...
..kvk....kvk..
.kSssk..kSssk.
kSSsssk.kSsssk
kSsssmk.ksssmk
ksssmmk.kssmmk
.kkkkk...kkkk.
`),
};
function crate(gr, a, c) { const p = iso(a, c, KZ); pixStamp(gr, Math.round(p[0]) - 4, Math.round(p[1]) - 8, `
..kkkkk..
.kwwwwwk.
kwwwwwwWk
kWkWWWvvk
kWWkWvvvk
kWWWkvvvk
kWWkWvvvk
.kkWvvvk.
...kkkk..
`); }
function barrel(gr, a, c) { const p = iso(a, c, KZ); pixStamp(gr, Math.round(p[0]) - 3, Math.round(p[1]) - 9, `
.kkkkk.
kWvvvWk
kwWWWvk
knnnnnk
kwWWWvk
kwWWWvk
knnnnnk
kwWWWvk
.kkkkk.
`); }

// ---- stalls: each has its own facing (counter toward +c 'L' or toward +a 'R'), roof type and cloth
const PZ = 19;
// cloth schemes: two alternating stripe ramps [light, mid, shade]; plain canvas uses the same ramp twice with seams
const CLOTH = {
  team: { A: ['L', 'T', 'D'], B: ['c', 'E', 'H'], n: 1 },
  ochre: { A: ['G', 'g', 'h'], B: ['c', 'E', 'H'], n: 1 },
  plain: { A: ['c', 'E', 'H'], B: ['E', 'E', 'H'], n: 0, hem: ['L', 'T', 'D'] },
};
const quad = (gr, p0, p1, p2, fn) => face(gr, p0, sub2(p1, p0), sub2(p2, p0), fn);
function stall(gr, s0, f) {
  const { a0, a1, c0, c1, kind, facing, roof } = s0, cl = CLOTH[s0.cloth];
  const R = facing === 'R';
  // local frame: u runs along the counter (u = 1 is the end nearest the viewer), w runs back (0) to front (1)
  const P = (u, w, z) => (R ? iso(a0 + w * (a1 - a0), c0 + u * (c1 - c0), z) : iso(a0 + u * (a1 - a0), c0 + w * (c1 - c0), z));
  const lenU = R ? c1 - c0 : a1 - a0, lenW = R ? a1 - a0 : c1 - c0;
  const e = 0.04 / lenU, ew = 0.04 / lenW, wm = 0.56;
  // which vertical faces are lit: c = const planes are lit, a = const are shade
  const frontLit = !R, endLit = R;
  const wood = lit => (lit ? ['w', 'W', 'v'] : ['W', 'v', 'v']);
  const post = (u, w, z1) => { const p = P(u, w, KZ); for (let z = 0; z < z1 - KZ; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } };
  const sway = [0, 1, 2, 1][f];
  // stripe tone: k = stripe index, sh = 0 lit, 1 mid, 2 shade
  const tone = (k, sh) => (k % 2 === 0 ? cl.A : cl.B)[Math.min(2, sh)];
  const hemC = (k, sh) => (cl.hem ? cl.hem[Math.min(2, sh)] : tone(k, sh));

  // ---- posts
  const ztop = roof === 'lean' ? PZ + 5 : roof === 'flat' ? PZ + 2 : PZ - 2;
  const zfront = roof === 'lean' ? PZ : ztop;
  post(0, 0, ztop); post(1, 0, ztop);
  if (roof === 'gable') { post(0.5, 0, PZ + 11); }
  post(0, wm, zfront); post(1, wm, zfront);

  // ---- roof
  const nU = Math.max(6, Math.round(lenU * 8)) | 1;
  if (roof === 'lean') {
    // back edge high, front edge low; stripes run front-to-back
    const shade = R ? 1 : 0;
    quad(gr, P(-e, -ew, PZ + 5), P(1 + e, -ew, PZ + 5), P(-e, wm + ew, PZ), (s, t) => {
      const k = Math.floor(s * nU), fr = s * nU % 1; if (cl.n === 0 && fr < 0.12 && k % 2) return 'H';
      return t < 0.12 ? tone(k, shade + 1) : fr < 0.2 ? tone(k, shade) : tone(k, shade + (s > 0.75 ? 1 : 0));
    });
    // scalloped front hem (fluttering) and the triangular end hem
    quad(gr, P(-e, wm + ew, PZ - 4), P(1 + e, wm + ew, PZ - 4), P(-e, wm + ew, PZ), (s, t) => {
      const U = s * (lenU + 0.08) * 32, V = t * 4, k = Math.floor(s * nU), sc = (Math.floor(U) + sway) % 5, lt = frontLit ? 0 : 1;
      if (V >= 2) return hemC(k, lt); if (V >= 1) return sc < 4 ? hemC(k, lt + 1) : null; return sc > 0 && sc < 3 ? hemC(k, lt + 1) : null;
    });
    quad(gr, P(1 + e, wm + ew, PZ - 3), P(1 + e, -ew, PZ - 3), P(1 + e, wm + ew, PZ + 5), (s, t) => {
      const z = PZ - 3 + t * 8, roofZ = PZ + 5 * s, lt = endLit ? 0 : 1, U = s * (wm + 2 * ew) * lenW * 32;
      if (z > roofZ) return null; if (z > roofZ - 2) return hemC(0, lt); if (z > roofZ - 3) return (Math.floor(U) + sway) % 5 < 3 ? hemC(0, lt + 1) : null; return null;
    });
  } else if (roof === 'gable') {
    // a ridged tent: ridge front-to-back over the middle of the counter, two slopes, an open gable triangle at the front
    const RZ = PZ + 12, EZ = PZ - 2, nW = 7;
    for (const side of [0, 1]) {
      const ue = side ? 1 + e : -e, lit = (side === 0) !== R ? 0 : 1;
      quad(gr, P(0.5, -ew, RZ), P(0.5, wm + ew, RZ), P(ue, -ew, EZ), (s, t) => {
        const k = Math.floor(s * nW), fr = s * nW % 1;
        return t > 0.85 ? tone(k, lit + 1) : fr < 0.18 ? tone(k, lit === 0 ? 0 : 1) : tone(k, lit + (t > 0.6 ? 1 : 0));
      });
    }
    // dark inside of the tent under the front gable, then the gable's scalloped hem
    quad(gr, P(-e, wm + ew, EZ), P(1 + e, wm + ew, EZ), P(-e, wm + ew, RZ), (s, t) => {
      const z = EZ + t * (RZ - EZ), top = RZ - Math.abs(s - 0.5) * 2 * (RZ - EZ);
      if (z > top) return null; if (z > top - 2) return hemC(Math.floor(s * 4), frontLit ? 0 : 1); return 'v';
    });
    line(gr, P(0.5, -ew, RZ), P(0.5, wm + ew, RZ), 'k');
    quad(gr, P(-e, wm + ew, EZ - 3), P(1 + e, wm + ew, EZ - 3), P(-e, wm + ew, EZ), (s, t) => {
      const U = s * (lenU + 0.08) * 32, V = t * 3, sc = (Math.floor(U) + sway) % 4, lt = frontLit ? 0 : 1;
      if (V >= 2) return tone(0, lt + 1); return sc < 2 ? tone(1, lt + 1) : V >= 1 ? tone(0, lt + 1) : null;
    });
  } else {
    // flat canopy stretched on four posts, sagging a little in the middle; a team valance all round
    const FZ = PZ + 2;
    quad(gr, P(-e, -ew, FZ), P(1 + e, -ew, FZ), P(-e, wm + ew, FZ), (s, t) => {
      const sag = Math.abs(s - 0.5) < 0.3 && Math.abs(t - 0.5) < 0.3, seam = Math.floor(s * 5) !== Math.floor((s + 0.03) * 5);
      if (seam) return 'H'; return sag ? 'E' : t < 0.18 || s < 0.1 ? 'c' : 'E';
    });
    const val = (p0, p1, lit, len) => quad(gr, P(...p0, FZ - 3), P(...p1, FZ - 3), P(...p0, FZ), (s, t) => {
      const U = s * len * 32, V = t * 3, sc = (Math.floor(U) + sway) % 4;
      if (V >= 1) return hemC(0, lit + (V < 2 ? 1 : 0)); return sc < 2 ? hemC(0, lit + 1) : null;
    });
    val([-e, wm + ew], [1 + e, wm + ew], frontLit ? 0 : 1, lenU);
    val([1 + e, wm + ew], [1 + e, -ew], endLit ? 0 : 1, wm * lenW);
  }

  // ---- counter along the front edge (in front of the roof's front edge), goods on it
  const u0 = 0.08 / lenU, u1 = 1 - 0.08 / lenU, w0 = 1 - 0.32 / lenW, w1 = 1 - 0.06 / lenW, TZ = KZ + 7;
  const fw = wood(frontLit), ew2 = wood(endLit);
  quad(gr, P(u0, w1, KZ), P(u1, w1, KZ), P(u0, w1, TZ), (s, t) => { const U = s * (u1 - u0) * lenU * 32, V = t * 7; if (V >= 6) return fw[0]; return Math.floor(U) % 8 === 0 || V < 1 ? fw[2] : fw[1]; });
  quad(gr, P(u1, w1, KZ), P(u1, w0, KZ), P(u1, w1, TZ), (s, t) => (t * 7 >= 6 ? ew2[1] : ew2[2]));
  quad(gr, P(u0, w0, TZ), P(u1, w0, TZ), P(u0, w1, TZ), (s, t) => (t > 0.85 ? 'w' : Math.floor(s * 20) % 5 === 0 ? 'W' : 'u'));
  for (const fa of [0.27, 0.72]) { const m = P(u0 + (u1 - u0) * fa, (w0 + w1) / 2, TZ); goods[kind](gr, Math.round(m[0]) - 7, Math.round(m[1]) - 2, fa > 0.5); }
}
const STALLS = [
  { a0: 0.2, a1: 1.2, c0: 0.2, c1: 1.15, kind: 'pots', facing: 'L', roof: 'gable', cloth: 'ochre' },
  { a0: 1.85, a1: 2.8, c0: 0.2, c1: 1.1, kind: 'cloth', facing: 'R', roof: 'lean', cloth: 'team' },
  { a0: 0.2, a1: 1.12, c0: 1.88, c1: 2.8, kind: 'fruit', facing: 'R', roof: 'flat', cloth: 'plain' },
  { a0: 2.02, a1: 2.86, c0: 2.02, c1: 2.86, kind: 'sacks', facing: 'L', roof: 'lean', cloth: 'team' },
];

// ---- the well: stone ring, dark water, two posts, crossbar and bucket
function well(gr) {
  const c = iso(1.4, 1.4, KZ), cx = Math.round(c[0]), cy = Math.round(c[1]);
  for (let z = 0; z <= 6; z++) for (let dx = -8; dx <= 8; dx++) { const yy = Math.round(Math.sqrt(Math.max(0, 64 - dx * dx)) / 2); pixSet(gr, cx + dx, cy + yy - z, Math.abs(dx) >= 8 || z === 0 ? 'k' : z % 3 === 0 ? (dx > 3 ? 'J' : 'j') : dx < -3 ? 'q' : dx > 3 ? 'U' : 'Q'); }
  for (let dy = -4; dy <= 4; dy++) for (let dx = -8; dx <= 8; dx++) { const d = Math.hypot(dx, dy * 2); if (d > 8.3) continue; pixSet(gr, cx + dx, cy - 6 + dy, d > 7.2 ? 'k' : d > 5.5 ? (dx + dy < 0 ? 'P' : 'q') : d > 4.6 ? 'k' : 'z'); }
  pixSet(gr, cx - 2, cy - 7, 'Z'); pixSet(gr, cx - 1, cy - 7, 'Z');
  for (const dx of [-7, 6]) for (let z = 6; z < 20; z++) { pixSet(gr, cx + dx, cy - z, 'w'); pixSet(gr, cx + dx + 1, cy - z, 'v'); }
  line(gr, [cx - 7, cy - 19], [cx + 7, cy - 19], 'w'); line(gr, [cx - 7, cy - 20], [cx + 7, cy - 20], 'k');
  for (let y = cy - 18; y < cy - 12; y++) pixSet(gr, cx, y, 'R');
  pixStamp(gr, cx - 2, cy - 12, `
kkkkk
kwWvk
.kkk.
`);
}
// ---- pennant pole at the left corner
const pole = iso(0.12, 2.88, KZ);
function pennant(gr, f) {
  for (let z = 0; z < 40; z++) { pixSet(gr, pole[0], pole[1] - z, 'w'); pixSet(gr, pole[0] + 1, pole[1] - z, 'v'); }
  pixSet(gr, pole[0], pole[1] - 40, 'O'); pixSet(gr, pole[0] + 1, pole[1] - 40, 'o');
  const x0 = pole[0] + 2, y0 = pole[1] - 39, len = 14;
  for (let i = 0; i < len; i++) {
    const wave = Math.round(Math.sin((i / len) * Math.PI * 1.6 - f * Math.PI / 2) * 1.4 * (i / len)), hgt = Math.max(1, Math.round(6 * (1 - i / len)));
    const top = y0 + Math.round((6 - hgt) / 2) + wave;
    for (let k = 0; k < hgt; k++) pixSet(gr, x0 + i, top + k, k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T');
  }
}

const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = clone(g);
  // back to front: back stall, back-right stall, well, front-left, front-right, loose crates/barrels in depth order
  stall(fr, STALLS[0], f); stall(fr, STALLS[1], (f + 1) % 4);
  barrel(fr, 2.7, 1.4); crate(fr, 1.0, 1.55);
  well(fr);
  stall(fr, STALLS[2], (f + 2) % 4);
  crate(fr, 1.66, 2.78); barrel(fr, 1.82, 2.62);
  stall(fr, STALLS[3], (f + 3) % 4);
  pennant(fr, f);
  outline(fr, () => 'k');
  frames.push(pixText(fr));
}

export default {
  id: 'market', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    P: '#c4bba9', p: '#a89f8e', q: '#948b7b', Q: '#7c7466', U: '#655e53', j: '#6f675a', J: '#4f4940',    // kerb + setts, mortar
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', u: '#b58a54',                                           // timber, counter top
    c: '#efe6d2', C: '#bfae88', E: '#d9c7a0', H: '#a8946e', G: '#e2b45a', g: '#c08a32', h: '#8a5a1e', T: 'team', D: 'teamdark', L: 'teamlight',                             // awning cream / team
    O: '#d9955a', o: '#b5703a', i: '#7f4a24',                                                         // terracotta
    R: '#d0473a', r: '#8e2a1f', b: '#4a7fb0', B: '#7aa8d8', a: '#2a4f78', x: '#9a5a9a', X: '#c08ac0', N: '#5e3060', // cloth bolts
    F: '#e0503a', f: '#a8281e', A: '#ffc061', e: '#e08a2a',                                           // apples, oranges
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', n: '#5f656c', z: '#2a4a66', Z: '#8ab8e0',               // sacks, hoops, well water
    k: '#24180f',
  },
  frames: { idle: frames },
};
