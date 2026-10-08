// @pixel smith
// Blacksmith: dark stone workshop with a flat sooty roof, a tall chimney, a wide forge opening glowing orange,
// an anvil and tool rack outside. 3 frames: the glow pulses and the chimney smoke rises.
const W = 2, H = 2, Z = 14, STACK = 16;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + STACK + 22;
const bx = W * 32 + 2, by = GH - 4;
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 29; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const g = pixGrid(GW, GH);

const top = pixIsoBox(g, bx, by, W, H, Z, 1, { top: 'f', left: 'l', right: 'r' });
// timber frame on both walls: posts every half tile + a beam under the roof
for (let k = 0; k <= W * 2; k++) { const p = lerp(top.L, top.Bm, k / (W * 2)); pixLine(g, p[0], p[1] + 1, p[0], p[1] + Z - 1, 't'); }
for (let k = 1; k <= H * 2; k++) { const p = lerp(top.Bm, top.Rr, k / (H * 2)); pixLine(g, p[0], p[1] + 1, p[0], p[1] + Z - 1, 'u'); }
pixLine(g, top.L[0], top.L[1] + 1, top.Bm[0], top.Bm[1] + 1, 't'); pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Rr[0], top.Rr[1] + 1, 'u');
speckle(g, 'f', 'F', 0.25); speckle(g, 'f', 'k', 0.04);
for (let k = 3; k < Z; k += 3) { pixLine(g, top.L[0], top.L[1] + k, top.Bm[0], top.Bm[1] + k, 'q'); pixLine(g, top.Bm[0], top.Bm[1] + k, top.Rr[0], top.Rr[1] + k, 'Q'); }
for (let k = 0; k < 36; k++) { const p = lerp(top.L, top.Bm, rnd()); pixSet(g, p[0], p[1] + 1 + Math.floor(rnd() * (Z - 2)), 'q'); const q2 = lerp(top.Bm, top.Rr, rnd()); pixSet(g, q2[0], q2[1] + 1 + Math.floor(rnd() * (Z - 2)), 'Q'); }
pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Bm[0], top.Bm[1] + Z, 'Q');
// roof edge beam
pixLine(g, top.L[0], top.L[1], top.Bm[0], top.Bm[1], 't'); pixLine(g, top.Bm[0], top.Bm[1], top.Rr[0], top.Rr[1], 'u');
// soot stain around the chimney and a lighter stone footing
pixLine(g, top.L[0], top.L[1] + Z - 1, top.Bm[0], top.Bm[1] + Z - 1, 's'); pixLine(g, top.Bm[0], top.Bm[1] + Z - 1, top.Rr[0], top.Rr[1] + Z - 1, 'Q');
// chimney stack on the back-right of the roof
const chBase = lerp(lerp(top.Bm, top.Rr, 0.72), top.T, 0.35);
const stack = pixIsoBox(g, chBase[0], chBase[1], 0.4, 0.4, STACK, 1, { top: 'k', left: 'q', right: 'Q' });
pixLine(g, stack.L[0], stack.L[1] - 1, stack.Bm[0], stack.Bm[1] - 1, 's'); pixLine(g, stack.Bm[0], stack.Bm[1] - 1, stack.Rr[0], stack.Rr[1] - 1, 'q');
// wide forge opening on the shaded wall (frames change its glow), a shuttered window on the lit wall
const door = lerp(top.Bm, top.Rr, 0.42);
// team-colour awning over the forge opening (a cloth on two poles) + a banner beside it
{ const a = lerp(top.Bm, top.Rr, 0.22), b2 = lerp(top.Bm, top.Rr, 0.62);
  for (let k = 0; k <= 24; k++) { const p = lerp(a, b2, k / 24); pixSet(g, p[0], p[1] + Z - 13, k % 2 ? 'T' : 'L'); pixSet(g, p[0], p[1] + Z - 12, 'T'); pixSet(g, p[0], p[1] + Z - 11, (k % 6 < 3) ? 'T' : 'D'); }
  pixLine(g, a[0], a[1] + Z - 12, a[0], a[1] + Z + 1, 'w'); pixLine(g, b2[0], b2[1] + Z - 12, b2[0], b2[1] + Z + 1, 'w');
  pixStamp(g, b2[0] + 3, b2[1] + Z - 10, `
TTT
LTT
LTD
TTT
.T.
`); }
{ const p = lerp(top.L, top.Bm, 0.3); pixStamp(g, p[0] - 2, p[1] + 5, `
ttttt
tnnnt
tnnnt
ttttt
`); }
// anvil on a block, outside the lit wall near the corner
pixStamp(g, bx - 22, by - 16, `
..mMMMMMm..
...MMMMM...
....MMM....
....MMM....
...wwwww...
...wWWWw...
...wwwww...
`);
// tool rack: hammer and tongs leaning on the wall, a bucket
pixStamp(g, bx + 8, by - 13, `
.mm..m.
.mm..m.
..w..m.
..w.mm.
..w..w.
..w..w.
`);
pixStamp(g, bx + 20, by - 11, `
.ss.
sMMs
sMMs
.ss.
`);

const frames = [];
const glows = [['o', 'O'], ['O', 'Y'], ['o', 'o']];
const smokes = [[[0, -2], [1, -5], [0, -8]], [[1, -3], [2, -7], [1, -11], [2, -14]], [[0, -4], [1, -9], [3, -13], [2, -17]]];
for (let f = 0; f < 3; f++) {
  const fr = g.map(r => r.slice());
  const [c1, c2] = glows[f];
  pixStamp(fr, door[0] - 5, door[1] + Z - 11, `
kkkkkkkkkk
kiiiiiiiik
kiiiiiiiik
kii${c1}${c1}${c1}${c1}iik
kii${c1}${c2}${c2}${c1}iik
ki${c1}${c1}${c2}${c2}${c1}${c1}ik
ki${c1}${c1}${c1}${c1}${c1}${c1}ik
kiiiiiiiik
kiiiiiiiik
kkkkkkkkkk
`);
  // glow spill on the ground in front
  if (f === 1) { pixSet(fr, door[0] - 1, door[1] + Z + 1, 'o'); pixSet(fr, door[0], door[1] + Z + 1, 'o'); pixSet(fr, door[0] + 1, door[1] + Z + 2, 'o'); }
  const sx = stack.T[0], sy = stack.T[1];
  for (const [dx, dy] of smokes[f]) { pixSet(fr, sx + dx, sy + dy, 'G'); pixSet(fr, sx + dx + 1, sy + dy, 'g'); pixSet(fr, sx + dx, sy + dy - 1, 'g'); pixSet(fr, sx + dx - 1, sy + dy - 1, 'G'); }
  frames.push(pixText(fr));
}

export default {
  id: 'smith', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    l: '#8d8478', r: '#6f6a60', q: '#7d7468', Q: '#5f5a50', f: '#6e6660', F: '#625c56', k: '#2a2420', // stone lit/shade, courses, sooty roof, dark
    t: '#5a3a18', u: '#4a3520', T: 'team', D: 'teamdark', L: 'teamlight',
    i: '#1e1a16', o: '#ff8c2a', O: '#ffb347', Y: '#ffe08a',                                            // forge dark + glow
    n: '#3a4a5a', s: '#9a9285',                                                                       // window, footing
    m: '#9aa0a6', M: '#cfd4d8', w: '#6a4a2a', W: '#8a6a3a', g: '#6f6a66', G: '#9a9490',               // iron, block, smoke
  },
  frames: { idle: frames },
};
