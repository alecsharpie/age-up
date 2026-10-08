// @pixel smith
// Blacksmith (2×2): coursed stone smithy under a slate gable roof, a stone chimney through the roof, a wide forge mouth in
// the lit wall with the hearth glowing inside, tools hung on a rail, a team-striped awning over the work bench, an anvil on
// its block in the yard with a quench tub and a coal heap on cinder-strewn earth.
// idle ×6: smoke puffs rise and drift from the chimney, the forge glow pulses (on the hearth, jambs and the ground), sparks fly off the anvil.
// Drawn by drafts/building.smith.js: pixDraw(PIXELS.smith,'idle',b.built?Math.floor(G.time*5):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
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
const W = 2, H = 2, Z = 14, STACK = 16;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + STACK + 22;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const WZ = 15, R = 16;                                   // wall height, roof rise
const A0 = 0.05, A1 = 1.95, C0 = 0.06, C1 = 1.28;
const RA0 = 0.0, RA1 = 1.99, RC0 = 0.0, RC1 = 1.4, RR = 0.67;

// ---- yard: dark trodden earth with cinders
const GROUND = 'eEfx';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => { const h = hash(x >> 1, y >> 1, 4); return h < 0.18 ? 'f' : h < 0.26 ? 'x' : h < 0.36 ? 'E' : 'e'; });

// ---- walls: stone courses, a plinth, quoins on the near corner, soot darkening under the eaves
const lit = blocks(['P', 'p', 'q', 'p', 'Q'], 'j', 4, 9, 3), sh = blocks(['q', 'Q', 'U', 'Q', 'V'], 'J', 4, 9, 4);
wallC(g, C1, A0, A1, 0, WZ, (U, V) => (V < 2 ? (Math.floor(U) % 7 === 0 ? 'J' : 'U') : V > WZ - 3 ? (hash(Math.floor(U), 0, 2) < 0.5 ? 'Q' : 'U') : lit(U, V - 2)));
wallA(g, A1, C1, C0, 0, WZ, (U, V) => (V < 2 ? 'V' : V > WZ - 3 ? 'V' : sh(U, V - 2)));
{ const p = iso(A1, C1, 0); for (let z = 2; z < WZ - 1; z++) { const row = Math.floor((z - 2) / 4), r = (z - 2) % 4, len = row % 2 ? 2 : 4; for (let i = 0; i < len; i++) pixSet(g, p[0] - 1 - i, p[1] - z + Math.floor((i + 1) / 2), r === 0 ? 'j' : r === 3 ? 'P' : 'p'); } }
// shuttered window on the lit wall
wallC(g, C1, 0.2, 0.42, 5, 11, (U, V) => { const u = Math.floor(U); if (V < 1) return 'P'; if (V >= 5) return 'w'; if (u === 0 || u >= 6) return 'w'; return u === 3 ? 'w' : V > 3 ? 'n' : 'K'; });
// forge mouth: deep recess (hearth drawn per frame), timber lintel, dressed jambs
const FA0 = 0.62, FA1 = 1.22, FZ = 11;
wallC(g, C1, FA0, FA1, 0, FZ + 2, (U, V) => { const u = Math.floor(U); if (V >= FZ) return V >= FZ + 1 ? 'w' : 'v'; if (u < 2) return u ? 'P' : 'q'; if (u > 16) return u > 17 ? 'Q' : 'q'; return 'K'; });
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
{ const o = iso(RA0, RC0, WZ), u = sub2(iso(RA1, RC0, WZ), o), v = sub2(iso(RA0, RR, WZ + R), o); face(g, o, u, v, (s, t) => (Math.floor(t * 5) % 2 ? 'S' : 'Z')); }
{ const pA = iso(RA1, RC1, WZ), pB = iso(RA1, RC0, WZ), pC = iso(RA1, RR, WZ + R); poly(g, [pA, pB, pC], (x, y) => ((x - pA[0]) % 4 === 0 ? 'c' : y > pA[1] - 2 ? 'c' : 'a')); }
const roofZ = c => (c >= RR ? WZ + R * (RC1 - c) / (RC1 - RR) : WZ + R * (c - RC0) / (RR - RC0));
{ const o = iso(RA0, RC1, WZ), u = sub2(iso(RA1, RC1, WZ), o), v = sub2(iso(RA0, RR, WZ + R), o), SL = Math.abs(v[1]);
  face(g, o, u, v, (s, t) => {
    const V = t * SL, row = Math.floor(V / 3), r = V - row * 3, U = s * u[0], off = (row % 2) * 3, col = Math.floor((U + off) / 6), cu = U + off - col * 6, h = hash(col, row, 9);
    if (r < 1 || cu < 1) return 'Z';
    if (r < 2) return 'X';
    return h < 0.2 ? 'S' : (s > 0.7 && h < 0.55) ? 'S' : 's';
  }); }
line(g, iso(RA0, RR, WZ + R), iso(RA1, RR, WZ + R), 'k'); line(g, iso(RA0 + 0.04, RR + 0.04, WZ + R - 1), iso(RA1 - 0.04, RR + 0.04, WZ + R - 1), 'X');
line(g, iso(RA0, RC1, WZ), iso(RA1, RC1, WZ), 'k'); line(g, iso(RA0, RC0, WZ), iso(RA1, RC0, WZ), 'k');
line(g, iso(RA1, RC1, WZ), iso(RA1, RR, WZ + R), 'k'); line(g, iso(RA1, RC0, WZ), iso(RA1, RR, WZ + R), 'k');
// soot staining on the slates around the chimney
// ---- chimney through the roof: only the part above the roof plane is painted
const KA0 = 1.5, KA1 = 1.76, KC0 = 0.5, KC1 = 0.78, KZ = 48;
wallC(g, KC1, KA0, KA1, 0, KZ, (U, V) => (V < roofZ(KC1) ? null : V > KZ - 3 ? (V > KZ - 1 ? 'P' : 'q') : lit(U, V)));
wallA(g, KA1, KC1, KC0, 0, KZ, (U, V) => (V < roofZ(KC1 - U / 32) ? null : V > KZ - 3 ? 'Q' : sh(U, V)));
flat(g, KA0, KA1, KC0, KC1, KZ, (s, t) => (s > 0.15 && s < 0.85 && t > 0.15 && t < 0.85 ? 'K' : 'p'));
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

// ---- yard props: coal heap, quench tub, anvil on its block
heap(g, ...iso(1.62, 1.5, 0), 6, 4, ['n', 'K', 'K', 'K'], 2, 2);
{ const p = iso(1.82, 1.82, 0); pixStamp(g, Math.round(p[0]) - 4, Math.round(p[1]) - 7, `
.kkkkkkk.
kbBBBBbbk
kwbbbbbvk
kwwwwWWvk
kQQQQQQVk
kwwwwWWvk
.kkkkkkk.
`); }
const AN = iso(1.04, 1.7, 0);
function anvil(fr) {
pixStamp(fr, Math.round(AN[0]) - 6, Math.round(AN[1]) - 12, `
..kkkkkkkkk..
kkmmmmmmmMMk.
kMMMMMMMMMnnk
.kkknMMMnkkk.
....knMnk....
...kwwwwvk...
...kwWWWvk...
...kwWWWvk...
...kwWWvvk...
....kkkkk....
`);
// hammer resting on the anvil face
pixStamp(fr, Math.round(AN[0]) - 2, Math.round(AN[1]) - 14, `
kkk.....
kMnkkkk.
kkkwwwvk
....kkk.
`);

}
// ---- per-frame life
const GLOW = [0, 1, 2, 2, 1, 0];
const HEARTH = [['r', 'o', 'o'], ['o', 'O', 'O'], ['O', 'Y', 'Y']];
function forge(fr, lv) {
  const [c1, c2, c3] = HEARTH[lv];
  // hearth bed at the back of the mouth: embers below, flame tongues, light on the jambs and the ground in front
  wallC(fr, C1, FA0 + 0.08, FA1 - 0.08, 0, FZ - 1, (U, V, x) => { const u = Math.floor(U), mid = Math.abs(U - 9.5); if (V < 3) return mid < 7 ? (hash(u, 0, lv) < 0.4 ? c1 : 'r') : null; if (V < 4 + lv && mid < 4 - (V - 3) * 0.8) return V < 4 ? c2 : c3; if (V < 6 && mid < 1.5) return lv > 1 ? c2 : null; return null; });
  if (lv) { wallC(fr, C1, FA0, FA0 + 0.06, 1, FZ - 1, (U, V) => (Math.floor(V) % 3 ? 'O' : null)); }
  flat(fr, FA0 + 0.1, FA1 - 0.1, C1, C1 + 0.03 + 0.03 * lv, 0, (s, t, x, y) => (hash(x, y, 1) < 0.35 + lv * 0.2 ? 'o' : 'r'));
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

export default {
  id: 'smith', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#6e5c45', E: '#806c52', f: '#57483a', x: '#3a332e', F: '#33291f',                       // yard earth, cinders, rim
    P: '#aca496', p: '#8f877a', q: '#7f776b', Q: '#66605a', U: '#58524c', V: '#45403b', j: '#5b554d', J: '#36322e', // stone
    X: '#8a95a4', s: '#5e6876', S: '#525b68', Z: '#363c47',                                     // slate: lip, body, alt, gap/soot
    a: '#5a4430', c: '#3b2614', w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', K: '#1a1512',         // boards, timber, dark
    r: '#a8401c', o: '#ff8c2a', O: '#ffb347', Y: '#ffe08a',                                     // ember → white heat
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', b: '#4a6a8a', B: '#7aa0c0',                       // steel, water
    g: '#7d7873', G: '#a29d97', H: '#c4beb8', k: '#24180f',                                     // smoke ramp, ink
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
