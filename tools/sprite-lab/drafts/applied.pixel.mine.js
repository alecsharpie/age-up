// @pixel mine
// Mining camp: stone storehouse along the back, an open pit with a timber headframe and rope, an ore cart, gold and stone piles.
const W = 2, H = 2, Z = 10, ROOF = 6;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 24;
const bx = W * 32 + 2, by = GH - 4;
const Tt = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const sub = (a, c, bw, bh) => [Tt[0] + ((a + bw) - (c + bh)) * 32, Tt[1] + ((a + bw) + (c + bh)) * 16];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 17; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const g = pixGrid(GW, GH);

// rocky ground
pixPoly(g, [Tt, Rr, Bm, L], 'd'); speckle(g, 'd', 'D', 0.22); speckle(g, 'd', 's', 0.05);
// storehouse on the back strip (tiles ty=0): stone walls with courses, low plank roof
const sb = sub(0, 0, 2, 1);
const top = pixIsoBox(g, sb[0], sb[1], 2, 1, Z, 1, { left: 'l', right: 'r' });
for (let k = 3; k < Z; k += 3) { pixLine(g, top.L[0], top.L[1] + k, top.Bm[0], top.Bm[1] + k, 'q'); pixLine(g, top.Bm[0], top.Bm[1] + k, top.Rr[0], top.Rr[1] + k, 'Q'); }
for (let k = 0; k < 24; k++) { const p = lerp(top.L, top.Bm, rnd()); pixSet(g, p[0], p[1] + 1 + Math.floor(rnd() * (Z - 2)), 'q'); const q2 = lerp(top.Bm, top.Rr, rnd()); pixSet(g, q2[0], q2[1] + 1 + Math.floor(rnd() * (Z - 2)), 'Q'); }
pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Bm[0], top.Bm[1] + Z, 'Q');
{ const p = lerp(top.L, top.Bm, 0.5); pixStamp(g, p[0] - 3, p[1] + Z - 8, `
kkkkkk
kiiiik
kiiiik
kiiiik
kiiiik
kiiiik
kiiiik
kiiiik
`); }
pixIsoRoof(g, top, ROOF, 1, { left: 'A', front: 'b', right: 'c', back: 'a' });
for (let k = 0; k <= 32; k++) { const p = lerp(top.Bm, top.Rr, k / 32); pixSet(g, p[0], p[1] + 1, k % 2 ? 'T' : 'E'); }
// the pit on the front-left tile: dark hole with a lighter rim, timber edging
{ const t0 = [bx - 32, by - 48], r0 = [bx, by - 32], b0 = [bx - 32, by - 16], l0 = [bx - 64, by - 32];
  const inset = (p, q) => lerp(p, q, 0.18);
  const c = [bx - 32, by - 32];
  pixPoly(g, [inset(t0, c), inset(r0, c), inset(b0, c), inset(l0, c)], 'e');
  pixPoly(g, [lerp(t0, c, 0.3), lerp(r0, c, 0.3), lerp(b0, c, 0.3), lerp(l0, c, 0.3)], 'k');
  for (const [a, b2] of [[inset(t0, c), inset(r0, c)], [inset(t0, c), inset(l0, c)]]) pixLine(g, a[0], a[1], b2[0], b2[1], 'w');
  for (const [a, b2] of [[inset(l0, c), inset(b0, c)], [inset(b0, c), inset(r0, c)]]) pixLine(g, a[0], a[1], b2[0], b2[1], 't');
  // headframe: two posts, a crossbeam, a pulley wheel and the rope into the pit
  const pl = inset(l0, c), pr = inset(r0, c);
  pixLine(g, pl[0] + 3, pl[1], pl[0] + 3, pl[1] - 20, 't'); pixLine(g, pl[0] + 4, pl[1], pl[0] + 4, pl[1] - 20, 'w');
  pixLine(g, pr[0] - 3, pr[1], pr[0] - 3, pr[1] - 20, 't'); pixLine(g, pr[0] - 4, pr[1], pr[0] - 4, pr[1] - 20, 'w');
  pixLine(g, pl[0] + 3, pl[1] - 20, pr[0] - 3, pr[1] - 20, 'w'); pixLine(g, pl[0] + 3, pl[1] - 21, pr[0] - 3, pr[1] - 21, 't');
  pixStamp(g, c[0] - 2, c[1] - 24, `
.mmm.
mMkMm
.mmm.
`);
  pixLine(g, c[0], c[1] - 21, c[0], c[1] - 6, 'R');
  // team banner hanging from the left end of the crossbeam
  pixStamp(g, pl[0] + 5, pl[1] - 19, `
TTTTT
LTTTT
LTTTT
LTTET
LTTTT
.TET.
..T..
`);
  pixStamp(g, c[0] - 2, c[1] - 7, `
wwwww
wyywy
.www.
`);
}
// ore cart on the front-right tile, full of gold
pixStamp(g, bx + 12, by - 20, `
....yYy.yy....
...yyYyyyyY...
..wwwwwwwwww..
..wWWWWWWWWw..
..wWWWWWWWWw..
..wwwwwwwwww..
...kk....kk...
..kKk....kKk..
...kk....kk...
`);
// piles: gold nuggets and stone slabs along the right edge
pixStamp(g, bx + 34, by - 30, `
.....yY....
...yYyyy...
..yyYyyYy..
.yYyyyyyyY.
`);
pixStamp(g, bx + 44, by - 22, `
....sS.....
..sSSss....
.sSssSSs...
sSSsssSsS..
`);
// a pickaxe leaning on the storehouse corner
pixLine(g, top.Bm[0] + 6, top.Bm[1] + Z, top.Bm[0] + 10, top.Bm[1] + Z - 12, 'w'); pixStamp(g, top.Bm[0] + 8, top.Bm[1] + Z - 15, `
mmmm
.m..
`);

export default {
  id: 'mine', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    d: '#8f7a5c', D: '#82705a', e: '#4a4038', k: '#2a2420', K: '#3a3430', i: '#1e1a16', // ground, pit rim, dark, cart wheel hub, doorway
    l: '#8d8478', r: '#6f6a60', q: '#7d7468', Q: '#5f5a50', s: '#95a5a6', S: '#aab3b5',  // stone walls lit/shade, courses, loose stone
    A: '#a0784a', b: '#8f6a3c', a: '#7a5a30', c: '#5a3a18',                              // plank roof
    w: '#8a6a3a', W: '#6a4a2a', t: '#4a3520', R: '#c9b58e', m: '#9aa0a6', M: '#cfd4d8', // timber, rope, iron
    y: '#e1b12c', Y: '#f0cd5a',
    T: 'team', E: 'teamdark', L: 'teamlight',
  },
  frames: { idle: [pixText(g)] },
};
