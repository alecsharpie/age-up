// @pixel lumber
// Lumber camp: an open-fronted plank shed along the back of the yard, a log pile, a long felled trunk, a stump with the axe left in it.
const W = 2, H = 2, Z = 12, ROOF = 7;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 16;
const bx = W * 32 + 2, by = GH - 4;
const Tt = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const sub = (a, c, bw, bh) => [Tt[0] + ((a + bw) - (c + bh)) * 32, Tt[1] + ((a + bw) + (c + bh)) * 16];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const g = pixGrid(GW, GH);

// worked yard: packed earth with wood chips
pixPoly(g, [Tt, Rr, Bm, L], 'd'); speckle(g, 'd', 'D', 0.2); speckle(g, 'd', 'O', 0.04);
// shed on the back strip (tiles ty=0): open on the front-left side, plank wall on the right
const sb = sub(0, 0, 2, 1);
const top = pixIsoBox(g, sb[0], sb[1], 2, 1, Z, 1, { left: 'i', right: 'r' });
for (let k = 3; k < Z; k += 3) { const a = top.Bm, b = top.Rr; pixLine(g, a[0], a[1] + k, b[0], b[1] + k, 'p'); }
for (let k = 0; k <= 4; k++) { const p = lerp(top.L, top.Bm, k / 4); pixLine(g, p[0], p[1], p[0], p[1] + Z, 't'); }   // posts of the open front
pixLine(g, top.L[0], top.L[1] + 1, top.Bm[0], top.Bm[1] + 1, 't');
// things inside the shed: stacked planks on the back wall
{ const p = lerp(top.L, top.Bm, 0.55); pixStamp(g, p[0] - 7, p[1] + Z - 6, `
wwwwwwwwwwww
.WWWWWWWWWW.
wwwwwwwwwwww
.WWWWWWWWWW.
`); }
pixIsoRoof(g, top, ROOF, 1, { left: 'A', front: 'b', right: 'c', back: 'a' });
// team-colour cloth hung along the eave of the open front (lit edge L, body T, shade D) — visible from the front
for (let k = 0; k <= 32; k++) { const p = lerp(top.L, top.Bm, k / 32); pixSet(g, p[0], p[1] + 2, k % 2 ? 'T' : 'L'); pixSet(g, p[0], p[1] + 3, 'T'); pixSet(g, p[0], p[1] + 4, (k % 8 < 4) ? 'T' : 'E'); if (k % 8 === 2) pixSet(g, p[0], p[1] + 5, 'E'); }
// banner on the corner post of the shed
{ const p = top.Bm; pixStamp(g, p[0] + 1, p[1] + 3, `
TTTT
TLTT
TTTT
ETTT
.EE.
`); }
for (let k = 1; k < 6; k++) { const a = lerp(top.L, top.Bm, k / 6), b = lerp(top.T, top.Rr, k / 6); pixLine(g, a[0], a[1], b[0], b[1], 'c'); }   // plank seams on the roof
// log pile in the front-left yard
{ const p = sub(0, 1, 1, 1); const x0 = p[0] - 26, y0 = p[1] - 14;
  const log = `
.www.
wOOOw
wOuOw
wOOOw
.www.
`;
  for (const [dx, dy] of [[0, 0], [5, 0], [10, 0], [15, 0], [3, -4], [8, -4], [13, -4], [6, -8]]) pixStamp(g, x0 + dx, y0 + dy, log);
}
// a long felled trunk lying along the left edge of the yard
{ const a = lerp(L, Bm, 0.15), b = lerp(L, Bm, 0.55); pixLine(g, a[0], a[1] - 6, b[0], b[1] - 6, 'w'); pixLine(g, a[0], a[1] - 5, b[0], b[1] - 5, 'W'); pixLine(g, a[0], a[1] - 7, b[0], b[1] - 7, 'O'); pixLine(g, a[0], a[1] - 4, b[0], b[1] - 4, 'k'); }
// stump with the axe stuck in it, near the front corner
pixStamp(g, bx + 10, by - 16, `
..........m.
..OOOO...mm.
.wOuuOw..w..
.wwwwww.w...
.wwwwwww....
..wwww......
`);
// a few cut logs by the right wall
for (const [dx, dy] of [[0, 0], [5, 0], [2, -4]]) pixStamp(g, bx + 30, by - 18 + dy, `
.ww.
wOOw
wOOw
.ww.
`.replace(/^\n/, '').split('\n').map((r, i) => r).join('\n'));

export default {
  id: 'lumber', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    d: '#9a7b4a', D: '#8f7146', O: '#c9a86a', u: '#a8864a',           // yard earth, dark earth, cut face, heartwood
    i: '#3a2a18', r: '#8a6a3a', p: '#6a4a2a', t: '#4a3520',           // shed interior, plank wall, seams, posts
    A: '#a0784a', b: '#8f6a3c', a: '#7a5a30', c: '#5a3a18',           // roof planks lit/mid/back/shade
    w: '#8a6a3a', W: '#6a4a2a', k: '#4a3520', m: '#cfd4d8',           // log bark, bark shade, dark, axe head
    T: 'team', E: 'teamdark', L: 'teamlight',
  },
  frames: { idle: [pixText(g)] },
};
