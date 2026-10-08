// @pixel house
// Generated building sprite: iso faces from the kit (exact 2:1), details stamped by hand.
// kind 'building', footprint [2,2], anchor = cell under the footprint's BOTTOM corner. Frames: 3 (chimney smoke drifts).
// Drawn by drafts/building.house.js with pixDraw(PIXELS.house,'idle',frame,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
const W = 2, H = 2, Z = 16, ROOF = 13;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 14;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 11; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };

// walls (left lit, right shaded) and a hipped thatch roof
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'l', right: 'r' });
const ap = pixIsoRoof(g, top, ROOF, 1, { left: 'A', front: 'b', right: 'c', back: 'a' });
// thatch texture: straw strands along the slopes + eaves fringe
speckle(g, 'A', 'f', 0.10); speckle(g, 'b', 'A', 0.12); speckle(g, 'b', 'e', 0.05); speckle(g, 'c', 'a', 0.14); speckle(g, 'a', 'c', 0.12);
pixLine(g, top.L[0], top.L[1], ap[0], ap[1], 'e'); pixLine(g, top.Bm[0], top.Bm[1], ap[0], ap[1], 'e'); pixLine(g, top.Rr[0], top.Rr[1], ap[0], ap[1], 'e');
pixLine(g, top.L[0], top.L[1] + 1, top.Bm[0], top.Bm[1] + 1, 'e'); pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Rr[0], top.Rr[1] + 1, 'e');
for (let i = 0; i < 20; i++) { const p = lerp(top.L, top.Bm, (i + 0.5) / 20); pixSet(g, p[0], p[1] + 2 + (i % 2), 'f'); const q = lerp(top.Bm, top.Rr, (i + 0.5) / 20); pixSet(g, q[0], q[1] + 2 + (i % 2), 'a'); }
// timber frame: posts every half tile, beam under the eaves, stone footing
for (let k = 0; k <= W * 2; k++) { const p = lerp(top.L, top.Bm, k / (W * 2)); pixLine(g, p[0], p[1] + 2, p[0], p[1] + Z - 1, 't'); }
for (let k = 1; k <= H * 2; k++) { const p = lerp(top.Bm, top.Rr, k / (H * 2)); pixLine(g, p[0], p[1] + 2, p[0], p[1] + Z - 1, 't'); }
for (const [a, b2] of [[top.L, top.Bm], [top.Bm, top.Rr]]) { pixLine(g, a[0], a[1] + 2, b2[0], b2[1] + 2, 't'); pixLine(g, a[0], a[1] + Z - 1, b2[0], b2[1] + Z - 1, 's'); pixLine(g, a[0], a[1] + Z, b2[0], b2[1] + Z, 'S'); }
// a diagonal brace on the lit wall
{ const p = lerp(top.L, top.Bm, 0.5), q = lerp(top.L, top.Bm, 0.75); pixLine(g, p[0], p[1] + Z - 2, q[0], q[1] + 4, 't'); }
// window on the lit wall, shuttered
{ const p = lerp(top.L, top.Bm, 0.3); pixStamp(g, p[0] - 2, p[1] + 5, `
ttttt
tnnnt
tnNnt
tnnnt
ttttt
`); }
// door in team colour on the shaded wall, with a dark lintel
{ const p = lerp(top.Bm, top.Rr, 0.33); pixStamp(g, p[0] - 3, p[1] + Z - 10, `
kkkkkk
.TTTT.
.TTTT.
.LTTT.
.LTTT.
.LTkT.
.LTTT.
.LTTT.
.TTTT.
.DDDD.
`); }
// chimney: a small stone stack on the shaded roof slope
const ch = lerp(lerp(top.Bm, top.Rr, 0.68), ap, 0.42);
const chTop = pixIsoBox(g, ch[0], ch[1], 0.28, 0.28, 11, 1, { top: 'S', left: 's', right: 'q' });
pixRect(g, chTop.T[0] - 1, chTop.T[1] + 2, 3, 2, 'k');
// corner line where the two walls meet
pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Bm[0], top.Bm[1] + Z, 'q');

// smoke frames
const frames = [];
const puffs = [[[0, -3], [1, -6], [0, -9]], [[1, -4], [2, -8], [1, -12], [3, -14]], [[0, -5], [2, -10], [3, -15]]];
for (const set of puffs) { const f = g.map(r => r.slice()); const sx = chTop.T[0], sy = chTop.T[1] + 1; for (const [dx, dy] of set) { pixSet(f, sx + dx, sy + dy, 'g'); pixSet(f, sx + dx + 1, sy + dy, 'G'); pixSet(f, sx + dx, sy + dy - 1, 'G'); } frames.push(pixText(f)); }

export default {
  id: 'house', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    l: '#d9c7a0', r: '#b8a582',                       // plaster: lit / shaded wall
    A: '#d8ab4f', b: '#c99a44', a: '#b58a3c', c: '#8f6a2c', // thatch: lit, mid, back, shade
    e: '#6f5229', f: '#e6c272',                       // ridge lines / straw highlight
    t: '#5a3a18', s: '#8d8478', S: '#9a9285', q: '#6f6a60', // timber, stone footing lit/mid, stone shade
    T: 'team', D: 'teamdark', L: 'teamlight', k: '#2a2018',
    n: '#4a6a8a', N: '#8ab0d0', g: '#9a9490', G: '#c4beb8',   // window glass, smoke
  },
  frames: { idle: frames },
};
