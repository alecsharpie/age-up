// ==head
// @pixel lumber
// Lumber camp (2×2): an open-fronted timber shed with a shingled gable roof and a team-colour valance, boards stacked inside,
// a tidy two-course log stack with flush cut ends between stakes, a saw horse with a half-sawn log, the axe left in a stump, wood chips over packed earth.
// idle ×4: the bow saw rocks in its kerf and sawdust trickles, the team pennant on the corner pole flutters.
// Drawn by drafts/building.lumber.js: pixDraw(PIXELS.lumber,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ==end
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
const RA0 = 0.0, RA1 = 1.99, RC0 = 0.0, RC1 = 1.14, RR = 0.53;
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

// ---- yard props
// log pile, front-left: a tidy stack of two even courses, logs of one length with their cut ends flush to the front,
// held by a stake at each end
const PILE = [0.14, 0.34, 0.54, 0.74, 0.94];
for (const z of [0, 6]) for (const a of PILE) logC(g, a, 1.3, 1.84, z, 3);
for (const a of [0.03, 1.05]) { const p = iso(a, 1.8, 0); line(g, p, [p[0], p[1] - 15], 'w'); line(g, [p[0] + 1, p[1]], [p[0] + 1, p[1] - 15], 'v'); pixSet(g, p[0], p[1] - 16, 'k'); pixSet(g, p[0] + 1, p[1] - 16, 'k'); }
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
