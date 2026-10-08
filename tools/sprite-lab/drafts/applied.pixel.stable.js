// @pixel stable
// Stable (3×3): a long stall block along the back-right edge under a hipped plank roof, open stalls on its long face with
// horse heads looking out, hay bales, a fenced paddock with a water trough and a horse in the front-left. Generated + stamps.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 46;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };

// ground: packed earth with straw scattered, worn to mud in the paddock
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x', top: 'y' });
speckle('y', 'Y', 0.12); speckle('y', 'h', 0.04);
// paddock fence: posts + two rails along the front-left edge, the front-right edge and an inner line
const fence = (a, b, n) => { for (let k = 0; k <= n; k++) { const p = lerp(a, b, k / n); pixRect(g, p[0], p[1] - 8, 1, 8, 't'); } pixLine(g, a[0], a[1] - 6, b[0], b[1] - 6, 'w'); pixLine(g, a[0], a[1] - 3, b[0], b[1] - 3, 'w'); };
fence(top.L, top.Bm, 6); fence(top.Bm, lerp(top.Bm, top.Rr, 0.62), 4);
{ const a = lerp(top.T, top.L, 0.42), b = lerp(top.Rr, top.Bm, 0.42); fence(a, lerp(a, b, 0.5), 3); }
// water trough and a horse in the paddock
pixStamp(g, bx - 30, by - 50, `
tttttttt
tbbbbbbt
tbbBbbbt
tttttttt
.t....t.
`);
pixStamp(g, bx - 60, by - 42, `
.........kk....
........kkkk...
.......kkk.k...
..ccccccckk....
.ccccccccc.....
.cccccccc......
.cc...ccc......
.cc...cc.......
.kk...kk.......
`);
// stall block along the back-right edge
const st = pixIsoBox(g, bx + 58, by - 2 - 29, 3, 1.2, 18, 1, { left: 'i', right: 'r' });
// stall posts and partitions on the open long face, horse heads looking out, hay
const base = st.base;
for (let k = 0; k <= 6; k++) { const p = lerp(base.L, base.Bm, k / 6); pixRect(g, p[0] - 1, p[1] - 18, 2, 18, 't'); }
pixLine(g, st.L[0], st.L[1] + 1, st.Bm[0], st.Bm[1] + 1, 'w'); pixLine(g, st.L[0], st.L[1] + 2, st.Bm[0], st.Bm[1] + 2, 't');
pixLine(g, base.L[0], base.L[1] - 7, base.Bm[0], base.Bm[1] - 7, 'w');   // half-door rail
const head = (x, y, c) => pixStamp(g, x, y, `
...CC..
..CCCk.
.CCCCC.
CCCCCC.
CCCCC..
.CCCC..
..CC...
`.replace(/C/g, c));
for (let k = 0; k < 6; k += 2) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); head(p[0] - 3, p[1] - 17, ['c', 'C', 'n'][k / 2]); }
for (let k = 1; k < 6; k += 2) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); pixStamp(g, p[0] - 2, p[1] - 6, `\n.hhh.\nhhhhh\nhHhhh\n`); }
// plank roof with a ridge along the long axis (hipped ends), plank lines; team-colour trim boards along the eaves
const RISE = 7;
const mL = lerp(st.T, st.L, 0.5), mR = lerp(st.Rr, st.Bm, 0.5);
const r1 = [lerp(mL, mR, 0.14)[0], lerp(mL, mR, 0.14)[1] - RISE], r2 = [lerp(mL, mR, 0.86)[0], lerp(mL, mR, 0.86)[1] - RISE];
pixPoly(g, [st.T, st.Rr, r2, r1], 'P'); pixPoly(g, [st.L, st.Bm, r2, r1], 'Q'); pixPoly(g, [st.T, st.L, r1], 'Q'); pixPoly(g, [st.Bm, st.Rr, r2], 'R');
for (let k = 1; k < 20; k++) { const a = lerp(st.L, st.Bm, k / 20), b = lerp(r1, r2, k / 20); pixLine(g, a[0], a[1], b[0], b[1], 'q'); }
for (let k = 1; k < 6; k++) { const a = lerp(st.Bm, st.Rr, k / 6); pixLine(g, a[0], a[1], r2[0], r2[1], 'p'); }
pixLine(g, r1[0], r1[1], r2[0], r2[1], 'Q'); pixLine(g, r1[0], r1[1] - 1, r2[0], r2[1] - 1, 'H');
pixLine(g, st.L[0], st.L[1], st.Bm[0], st.Bm[1], 'T'); pixLine(g, st.Bm[0], st.Bm[1], st.Rr[0], st.Rr[1], 'D'); pixLine(g, st.L[0], st.L[1] + 1, st.Bm[0], st.Bm[1] + 1, 'T'); pixLine(g, st.Bm[0], st.Bm[1] + 1, st.Rr[0], st.Rr[1] + 1, 'D');
pixLine(g, st.L[0], st.L[1], r1[0], r1[1], 'q'); pixLine(g, st.Bm[0], st.Bm[1], r2[0], r2[1], 'q'); pixLine(g, st.Rr[0], st.Rr[1], r2[0], r2[1], 'p');
// hay bales stacked at the left end of the stall block
pixStamp(g, st.base.L[0] - 10, st.base.L[1] - 14, `
...hhhhh...
..hhhhhhh..
.hhHhhhHhh.
.hhhhhhhhh.
..hhhhhhh..
hhhhh.hhhhh
hHhhh.hhHhh
hhhhh.hhhhh
`);

export default {
  id: 'stable', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    y: '#a0824f', Y: '#917246', z: '#8a6d3e', x: '#6f5730',        // earth
    t: '#5a3a18', w: '#8a6a3a', i: '#4a3828', r: '#6a4a2a',        // posts, rails, stall interior, back wall
    Q: '#a07a44', P: '#8a6a3a', R: '#6f5229', q: '#6a4a2a', p: '#4a3520',  // roof planks lit / back / shade, plank lines
    h: '#d8ab4f', H: '#e6c272',                                     // hay
    c: '#7a4b2a', C: '#b58a5a', n: '#4a3a2a', k: '#2a2018',         // horses: bay, palomino, dark; eyes/hooves
    b: '#2f6fb0', B: '#8ab0d0',                                     // trough water
    T: 'team', D: 'teamdark',
  },
  frames: { idle: [pixText(g)] },
};
