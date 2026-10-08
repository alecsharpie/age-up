// @pixel temple
// Temple (3×3), Western chapel: a long limestone nave with a pitched red-tile roof, a rose window and arched door on the
// front gable, buttresses along the lit wall, and a square bell tower with a spire and gold cross at the front-left corner.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 96;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
// bottom corner of a box occupying tiles [x0,x0+w) × [y0,y0+h)
const bmOf = (x0, y0, w, h) => [bx + ((x0 + w) - (y0 + h)) * 32, by - 96 + ((x0 + w) + (y0 + h)) * 16];

// paved yard
pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x', top: 'y' });
speckle('y', 'Y', 0.18);

// ---- nave: long along x, 2.75 × 1.45 tiles, 26 px walls
const NX = 0.15, NY = 0.95, NW = 2.75, NH = 1.45, Z = 26, RISE = 18;
const nb = bmOf(NX, NY, NW, NH); nb[1] -= 2;
const top = pixIsoBox(g, nb[0], nb[1], NW, NH, Z, 1, { left: 'l', right: 'r' });
const base = top.base;
// buttresses on the lit (left) wall
for (let k = 1; k < 6; k++) { const p = lerp(base.L, base.Bm, k / 6); pixRect(g, p[0] - 1, p[1] - Z + 6, 3, Z - 6, 'q'); pixRect(g, p[0] + 2, p[1] - Z + 6, 1, Z - 6, 'Q'); }
// tall arched windows between buttresses
for (let k = 0; k < 6; k++) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); pixStamp(g, p[0] - 1, p[1] - Z + 7, `
.n.
nnn
nnn
nnn
nnn
nnn
nNn
`); }
// pitched roof: ridge along x (midpoints of the two y-edges), lit slope front-left, shaded slope back-right, gable at the front-right end
const r1 = [lerp(top.T, top.L, 0.5)[0], lerp(top.T, top.L, 0.5)[1] - RISE], r2 = [lerp(top.Rr, top.Bm, 0.5)[0], lerp(top.Rr, top.Bm, 0.5)[1] - RISE];
pixPoly(g, [top.T, top.Rr, r2, r1], 'c');          // back slope (shade)
pixPoly(g, [top.L, top.Bm, r2, r1], 'A');          // front slope (lit)
pixPoly(g, [top.Rr, top.Bm, r2], 'r');             // front gable wall
pixPoly(g, [top.T, top.L, r1], 'l');               // back gable (mostly hidden)
// tile courses on the lit slope, ridge line, eaves
for (let k = 1; k < 7; k++) { const a = lerp(top.L, r1, k / 7), b = lerp(top.Bm, r2, k / 7); pixLine(g, a[0], a[1], b[0], b[1], 'b'); }
for (let k = 1; k < 7; k++) { const a = lerp(top.T, r1, k / 7), b = lerp(top.Rr, r2, k / 7); pixLine(g, a[0], a[1], b[0], b[1], 'e'); }
speckle('A', 'B', 0.08);
pixLine(g, r1[0], r1[1], r2[0], r2[1], 'e'); pixLine(g, top.L[0], top.L[1], top.Bm[0], top.Bm[1], 'e'); pixLine(g, top.Bm[0], top.Bm[1], top.Rr[0], top.Rr[1], 'e');
pixLine(g, top.Bm[0], top.Bm[1], r2[0], r2[1], 'e'); pixLine(g, top.Rr[0], top.Rr[1], r2[0], r2[1], 'e');
// gable: rose window up high, arched team-colour door at the bottom, stone cross at the peak
{ const gm = lerp(top.Rr, top.Bm, 0.5); pixStamp(g, gm[0] - 4, gm[1] - 9, `
..qqqqq..
.qNnnnNq.
qNnnnnnNq
qnnNNNnnq
qnnNGNnnq
qnnNNNnnq
qNnnnnnNq
.qNnnnNq.
..qqqqq..
`); pixStamp(g, r2[0] - 1, r2[1] - 5, `
.G.
GGG
.G.
.G.
`); }
{ const dm = lerp(base.Rr, base.Bm, 0.5); pixStamp(g, dm[0] - 3, dm[1] - 13, `
..qqq..
.qTTTq.
qTTTTTq
qTDTDTq
qTDTDTq
qTDkDTq
qTDTDTq
qTDTDTq
qTDTDTq
qqTTTqq
`); }
// stone footing + corner quoins
pixLine(g, base.L[0], base.L[1], base.Bm[0], base.Bm[1], 'k'); pixLine(g, base.Bm[0], base.Bm[1], base.Rr[0], base.Rr[1], 'k');
pixLine(g, base.Bm[0], base.Bm[1] - Z, base.Bm[0], base.Bm[1], 'q');

// ---- bell tower at the front-left corner (near L), square 0.9 tile, 50 px, pyramid spire + cross
const TX = 0.1, TY = 2.0, TS = 0.9, TZ = 50, SP = 20;
const tb = bmOf(TX, TY, TS, TS); tb[1] -= 2;
const tt = pixIsoBox(g, tb[0], tb[1], TS, TS, TZ, 1, { left: 'l', right: 'r' });
const tbase = tt.base;
// string courses, belfry arches on both visible faces, clock-like round window on the lit face
for (const yy of [16, 32]) { pixLine(g, tbase.L[0], tbase.L[1] - yy, tbase.Bm[0], tbase.Bm[1] - yy, 'q'); pixLine(g, tbase.Bm[0], tbase.Bm[1] - yy, tbase.Rr[0], tbase.Rr[1] - yy, 'Q'); }
{ const p = lerp(tbase.L, tbase.Bm, 0.5); pixStamp(g, p[0] - 2, p[1] - TZ + 4, `
.kkk.
kkkkk
kkkkk
kkgkk
kkgkk
kkkkk
`); pixStamp(g, p[0] - 2, p[1] - 28, `
.qqq.
qnnnq
qnNnq
qnnnq
.qqq.
`); }
{ const p = lerp(tbase.Bm, tbase.Rr, 0.5); pixStamp(g, p[0] - 2, p[1] - TZ + 4, `
.kkk.
kkkkk
kkkkk
kkgkk
kkgkk
kkkkk
`); }
// team banner hanging from the tower's shaded face
{ const p = lerp(tbase.Bm, tbase.Rr, 0.5); pixStamp(g, p[0] - 2, p[1] - 24, `
DDDDD
TTTTT
TTLTT
TTTTT
TTTTT
.TTT.
..T..
`); }
pixLine(g, tbase.Bm[0], tbase.Bm[1] - TZ, tbase.Bm[0], tbase.Bm[1], 'q');
// spire: four tile faces, cross on top
const ap = pixIsoRoof(g, tt, SP, 1, { left: 'A', front: 'B', right: 'c', back: 'b' });
pixLine(g, tt.L[0], tt.L[1], ap[0], ap[1], 'e'); pixLine(g, tt.Bm[0], tt.Bm[1], ap[0], ap[1], 'e'); pixLine(g, tt.Rr[0], tt.Rr[1], ap[0], ap[1], 'e');
pixStamp(g, ap[0] - 1, ap[1] - 7, `
.G.
GGG
.G.
.G.
.G.
.g.
`);
// 1-px darker outline so the tower separates from the nave and the sky at 1×: both vertical edges, the eaves, the spire's back edges
pixLine(g, tbase.L[0], tbase.L[1] - TZ, tbase.L[0], tbase.L[1], 'o'); pixLine(g, tbase.Rr[0], tbase.Rr[1] - TZ, tbase.Rr[0], tbase.Rr[1], 'o');
pixLine(g, tt.L[0], tt.L[1], tt.T[0], tt.T[1], 'o'); pixLine(g, tt.T[0], tt.T[1], tt.Rr[0], tt.Rr[1], 'o');
pixLine(g, tt.L[0], tt.L[1], tt.Bm[0], tt.Bm[1], 'o'); pixLine(g, tt.Bm[0], tt.Bm[1], tt.Rr[0], tt.Rr[1], 'o');
pixLine(g, tt.T[0], tt.T[1], ap[0], ap[1], 'o'); pixLine(g, tt.L[0], tt.L[1], ap[0], ap[1], 'o'); pixLine(g, tt.Rr[0], tt.Rr[1], ap[0], ap[1], 'o');

export default {
  id: 'temple', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    y: '#c9bea3', Y: '#bfb398', z: '#a89d84', x: '#8f8570',        // paving
    l: '#e5dcc5', r: '#c9bea3', q: '#9a9285', Q: '#b5ad9c',        // limestone lit / shade, trim lit / light
    A: '#b85a3a', B: '#c76a48', b: '#a0482e', c: '#7a3522', e: '#5e2a1a',   // roof tiles lit, highlight, mid, shade, lines
    n: '#4a6a8a', N: '#8ab0d0', G: '#e8c55a', g: '#c0953a', k: '#2a2018',   // glass, glass light, gold, bell, dark
    o: '#6f6a60',                                                  // tower outline
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: [pixText(g)] },
};
