// @pixel market
// Market (3×3): a low plank platform with four stalls around an open square — posts and striped awnings in team colour,
// tables of goods (pots, bolts of cloth, fruit, sacks), a well in the middle and crates by the front stall.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const bmOf = (x0, y0, w, h) => [bx + ((x0 + w) - (y0 + h)) * 32, by - 96 + ((x0 + w) + (y0 + h)) * 16];

// plank platform, 4 px high, with plank seams running along x
const plat = pixIsoBox(g, bx, by, W, H, 4, 1, { left: 'z', right: 'x', top: 'y' });
for (let k = 1; k < 12; k++) { const a = lerp(plat.T, plat.L, k / 12), b = lerp(plat.Rr, plat.Bm, k / 12); pixLine(g, a[0], a[1], b[0], b[1], 'Y'); }
speckle('y', 'Y', 0.04);

// a stall: posts at the corners of its footprint, a striped awning 14 px up with a scalloped fringe, a table of goods under it
function stall(x0, y0, w, h, stripeAlongX, goods) {
  const bm = bmOf(x0, y0, w, h); bm[1] -= 4;
  const PZ = 18;
  const aw = pixIsoBox(g, bm[0], bm[1], w, h, PZ, 1, {});        // no faces: just the geometry
  const B = aw.base;
  // posts
  for (const p of [B.L, B.Bm, B.Rr, B.T]) pixRect(g, p[0], p[1] - PZ, 1, PZ, 't');
  // table under the awning (a small box) and its goods
  const tb = bmOf(x0 + 0.42, y0 + 0.42, w - 0.4, h - 0.4); tb[1] -= 4;
  const tt = pixIsoBox(g, tb[0], tb[1], w - 0.4, h - 0.4, 6, 1, { left: 'w', right: 'v', top: 'u' });
  goods(tt);
  // awning: cream with team-colour stripes, slightly raised in the middle
  pixPoly(g, [aw.T, aw.Rr, aw.Bm, aw.L], 'c');
  const n = 10;
  for (let k = 0; k < n; k++) { if (k % 2) continue; const f0 = k / n, f1 = (k + 1) / n;
    const a0 = stripeAlongX ? lerp(aw.T, aw.Rr, f0) : lerp(aw.T, aw.L, f0), a1 = stripeAlongX ? lerp(aw.T, aw.Rr, f1) : lerp(aw.T, aw.L, f1);
    const b0 = stripeAlongX ? lerp(aw.L, aw.Bm, f0) : lerp(aw.Rr, aw.Bm, f0), b1 = stripeAlongX ? lerp(aw.L, aw.Bm, f1) : lerp(aw.Rr, aw.Bm, f1);
    pixPoly(g, [a0, a1, b1, b0], 'T'); }
  // fringe below the two front edges, alternating
  for (let k = 0; k < 16; k++) { const p = lerp(aw.L, aw.Bm, (k + 0.5) / 16); pixSet(g, p[0], p[1] + 1, k % 2 ? 'D' : 'c'); const q = lerp(aw.Bm, aw.Rr, (k + 0.5) / 16); pixSet(g, q[0], q[1] + 1, k % 2 ? 'D' : 'c'); }
  pixLine(g, aw.L[0], aw.L[1], aw.Bm[0], aw.Bm[1], 'D'); pixLine(g, aw.Bm[0], aw.Bm[1], aw.Rr[0], aw.Rr[1], 'D');
}
const pots = tt => { const c = lerp(lerp(tt.L, tt.Rr, 0.5), tt.Bm, 0.55); pixStamp(g, c[0] - 7, c[1] - 7, `
..oo....oo..
.oooo..oooo.
.oOoo..oOoo.
..oo....oo..
.....oo.....
....oooo....
....oOoo....
.....oo.....
`); };
const cloth = tt => { const c = lerp(lerp(tt.L, tt.Rr, 0.5), tt.Bm, 0.55); pixStamp(g, c[0] - 8, c[1] - 6, `
RRRRR.......
RRRRRbbbbb..
.....bbbbb..
..ggggg.....
..ggggg.ppp.
........ppp.
`); };
const fruit = tt => { const c = lerp(lerp(tt.L, tt.Rr, 0.5), tt.Bm, 0.55); pixStamp(g, c[0] - 7, c[1] - 6, `
..ff..aaa...
.ffff.aaaa..
.fFff.aAaa..
..ff...aa...
.....ssss...
....ssssss..
....sSssss..
`); };
const sacks = tt => { const c = lerp(lerp(tt.L, tt.Rr, 0.5), tt.Bm, 0.55); pixStamp(g, c[0] - 8, c[1] - 7, `
..ss....mmm.
.ssss..mmmmm
.sSss..mMmmm
.ssss..mmmmm
..ss....mmm.
....ssss....
...ssssss...
`); };
stall(0.15, 0.15, 1.1, 1.1, true, pots);     // back stall
stall(1.75, 0.15, 1.1, 1.0, false, cloth);   // back-right
stall(0.15, 1.8, 1.0, 1.05, false, fruit);   // front-left
stall(1.85, 1.85, 1.0, 1.0, true, sacks);    // front-right

// the well in the middle of the square: stone ring, two posts and a little roof
{ const c = bmOf(1.3, 1.3, 0.45, 0.45); c[1] -= 4; const ring = pixIsoBox(g, c[0], c[1], 0.45, 0.45, 6, 1, { left: 'q', right: 'Q', top: 'n' });
  pixRect(g, ring.L[0] + 2, ring.L[1] - 14, 1, 14, 't'); pixRect(g, ring.Rr[0] - 2, ring.Rr[1] - 14, 1, 14, 't');
  pixLine(g, ring.L[0] + 2, ring.L[1] - 14, ring.Rr[0] - 2, ring.Rr[1] - 14, 'w'); pixRect(g, ring.L[0] + 4, ring.L[1] - 19, ring.Rr[0] - ring.L[0] - 6, 2, 'c'); pixRect(g, ring.L[0] + 5, ring.L[1] - 17, ring.Rr[0] - ring.L[0] - 8, 1, 'T'); }
// crates and a barrel by the front corner of the platform
pixStamp(g, bx - 30, by - 20, `
.wwww.
wvvvvw
wvwwvw
wvvvvw
.wwww.
`);
pixStamp(g, bx - 22, by - 24, `
.ooo.
ookoo
ooooo
ookoo
.ooo.
`);
// a merchant standing by the well
pixStamp(g, bx - 10, by - 44, `
.hh.
.ee.
TTTT
TTTT
.pp.
.kk.
`);

export default {
  id: 'market', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    y: '#b9a070', Y: '#a8905f', z: '#9a7a4a', x: '#7a5a30',          // platform planks
    t: '#5a3a18', w: '#8a6a3a', v: '#6a4a2a', u: '#a07a44',          // posts, table wood
    c: '#efe4cc', T: 'team', D: 'teamdark', L: 'teamlight',          // awning cream + stripes
    o: '#b5703a', O: '#d9955a', R: '#c0392b', b: '#2f6fb0', g: '#3ba34a', p: '#8a4a8a',   // pots, cloth bolts
    f: '#c9303a', F: '#ff7a7a', a: '#e1b12c', A: '#ffe39a', s: '#c9b58e', S: '#e5dcc5',  // fruit, sacks
    m: '#9a7040', M: '#b58a5a', q: '#8d8478', Q: '#6f6a60', k: '#2a2018', n: '#2f6fb0',
    h: '#5a3a1a', e: '#e8c39e',
  },
  frames: { idle: [pixText(g)] },
};
