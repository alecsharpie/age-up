// @pixel dock
// Dock: a planked platform on stilts (water shows between them), a boathouse at the back, a crane with a hanging crate,
// barrels, coiled rope and a drying net. The flag stays code-drawn (see building.dock.js).
const W = 2, H = 2, Z = 6, HOUSE = 12, ROOF = 7;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + HOUSE + ROOF + 26;
const bx = W * 32 + 2, by = GH - 4;
const Tt = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const up = (p, z) => [p[0], p[1] - z];
let seed = 31; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const g = pixGrid(GW, GH);

// stilts first (they sit under the platform edge), then the platform
for (const p of [L, Bm, Rr, lerp(L, Bm, 0.5), lerp(Bm, Rr, 0.5), lerp(L, Bm, 0.25), lerp(Bm, Rr, 0.75)]) { pixLine(g, p[0], p[1] - Z, p[0], p[1] + 2, 'k'); pixLine(g, p[0] + 1, p[1] - Z, p[0] + 1, p[1] + 2, 't'); pixSet(g, p[0], p[1] + 2, 'K'); pixSet(g, p[0] + 1, p[1] + 2, 'K'); }
const pT = up(Tt, Z), pL = up(L, Z), pR = up(Rr, Z), pB = up(Bm, Z);
pixPoly(g, [pT, pR, pB, pL], 'p');
for (let i = 1; i < 12; i++) { const a = lerp(pT, pL, i / 12), b = lerp(pR, pB, i / 12); pixLine(g, a[0], a[1], b[0], b[1], i % 2 ? 'P' : 'q'); }
for (const [a, b] of [[pL, pB], [pB, pR]]) { pixLine(g, a[0], a[1], b[0], b[1], 'w'); pixLine(g, a[0], a[1] + 1, b[0], b[1] + 1, 'W'); pixLine(g, a[0], a[1] + 2, b[0], b[1] + 2, 'k'); }
// front edge: the platform's thickness (plank ends)
for (let k = 3; k < Z; k++) { pixLine(g, pL[0], pL[1] + k, pB[0], pB[1] + k, k % 2 ? 'W' : 'w'); pixLine(g, pB[0], pB[1] + k, pR[0], pR[1] + k, 'W'); }
// boathouse on the back tile (near T), standing on the platform
const hb = [bx, by - 32 - Z];
const top = pixIsoBox(g, hb[0] + 2, hb[1] - 2, 0.85, 0.85, HOUSE, 1, { left: 'l', right: 'r' });
for (let k = 3; k < HOUSE; k += 3) { pixLine(g, top.L[0], top.L[1] + k, top.Bm[0], top.Bm[1] + k, 'P'); pixLine(g, top.Bm[0], top.Bm[1] + k, top.Rr[0], top.Rr[1] + k, 'q'); }
{ const p = lerp(top.Bm, top.Rr, 0.45); pixStamp(g, p[0] - 3, p[1] + HOUSE - 9, `
kkkkkk
.iiii.
.iiii.
.iiii.
.iiii.
.iiii.
.iiii.
.iiii.
`); }
pixIsoRoof(g, top, ROOF, 1, { left: 'A', front: 'b', right: 'c', back: 'a' });
{ const p = lerp(top.L, top.Bm, 0.5); pixStamp(g, p[0] - 2, p[1] + 4, `
TTTTT
TLLLT
TTTTT
`); }
// crane on the right side of the platform: post, jib, rope and a hanging crate
{ const base = lerp(pB, pR, 0.62); const x = base[0], y = base[1] - 2;
  pixLine(g, x, y, x, y - 24, 't'); pixLine(g, x + 1, y, x + 1, y - 24, 'w');
  pixLine(g, x, y - 24, x - 16, y - 30, 'w'); pixLine(g, x, y - 23, x - 16, y - 29, 't');
  pixLine(g, x, y - 18, x - 10, y - 27, 'W');
  pixLine(g, x - 16, y - 30, x - 16, y - 14, 'R');
  pixStamp(g, x - 19, y - 14, `
wwwwwww
wWWwWWw
wwwwwww
wWWwWWw
wwwwwww
`); }
// barrels and a coil of rope on the left, a net drying on the front rail
pixStamp(g, pL[0] + 16, pL[1] - 4, `
.ww..ww.
wWWwwWWw
wwwwwwww
wWWwwWWw
.ww..ww.
`);
pixStamp(g, pL[0] + 30, pL[1] + 1, `
.RRR.
RrrrR
R.R.R
RrrrR
.RRR.
`);
{ const a = lerp(pB, pR, 0.15), b = lerp(pB, pR, 0.42); for (let k = 0; k < 3; k++) pixLine(g, a[0], a[1] - 9 + k * 3, b[0], b[1] - 9 + k * 3, 'n'); for (let k = 0; k <= 6; k++) { const p = lerp(a, b, k / 6); pixLine(g, p[0], p[1] - 9, p[0], p[1] - 2, 'n'); } pixLine(g, a[0], a[1] - 10, b[0], b[1] - 10, 'w'); }

export default {
  id: 'dock', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    p: '#9a7a4a', P: '#8a6a3a', q: '#7a5a30', w: '#8a6a3a', W: '#6a4a2a', k: '#4a3520', K: '#2f3f55', t: '#5a3a18', // planks, posts, wet post foot
    l: '#a98a5e', r: '#8a6a3a', i: '#2a2018',                                                                   // boathouse walls, doorway
    A: '#a0482e', b: '#8a3a2a', a: '#7a3222', c: '#5e2619',                                                      // tiled roof
    T: 'team', L: 'teamlight', R: '#c9b58e', n: '#d9d0b8',                                                     // sign, rope, net
  },
  frames: { idle: [pixText(g)] },
};
