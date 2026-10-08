// @pixel barracks
// Barracks (3×3): fortified stone yard — crenellated walls, four corner turrets, a gate, a hanging team banner,
// and inside the yard a straw training dummy and a spear rack. Generated faces + stamps. Anchor = footprint bottom corner.
const W = 3, H = 3, Z = 20, TZ = 14;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + TZ + 30;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };

// outer walls with the yard (packed earth) on top
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 's', right: 'S', top: 'y' });
speckle('s', 'z', 0.08); speckle('S', 'x', 0.08); speckle('y', 'Y', 0.12);
// stone courses
for (let yy = 4; yy < Z; yy += 5) { pixLine(g, top.L[0], top.L[1] + yy, top.Bm[0], top.Bm[1] + yy, 'z'); pixLine(g, top.Bm[0], top.Bm[1] + yy, top.Rr[0], top.Rr[1] + yy, 'x'); }
pixLine(g, top.Bm[0], top.Bm[1], top.Bm[0], top.Bm[1] + Z, 'x');
// inner parapet line on the yard: a lighter rim along the top edges
pixLine(g, top.T[0], top.T[1], top.L[0], top.L[1], 'v'); pixLine(g, top.T[0], top.T[1], top.Rr[0], top.Rr[1], 'v');
pixLine(g, top.L[0], top.L[1], top.Bm[0], top.Bm[1], 'V'); pixLine(g, top.Bm[0], top.Bm[1], top.Rr[0], top.Rr[1], 'V');
// a long sleeping hall inside the yard, along the back-left wall (timber walls, plank roof, team-colour door)
{ const hb = lerp(top.T, top.L, 0.6); const hall = pixIsoBox(g, hb[0] + 26, hb[1] + 26, 0.8, 2.0, 11, 1, { left: 'w', right: 't', top: 'Q' });
  for (let k = 1; k < 8; k++) { const d = lerp(hall.T, hall.L, k / 8), e = lerp(hall.Rr, hall.Bm, k / 8); pixLine(g, d[0], d[1], e[0], e[1], 'q'); }
  pixLine(g, hall.L[0], hall.L[1], hall.Bm[0], hall.Bm[1], 'q'); pixLine(g, hall.Bm[0], hall.Bm[1], hall.Rr[0], hall.Rr[1], 'q');
  for (let k = 1; k < 4; k++) { const d = lerp(hall.L, hall.Bm, k / 4); pixRect(g, d[0], d[1] + 3, 2, 4, 'k'); }
  const dr = lerp(hall.Bm, hall.Rr, 0.5); pixStamp(g, dr[0] - 2, dr[1] + 3, `
TTTT
TTTT
TTTT
TTTT
TTTT
TTTT
`); }
// yard furniture: spear rack at the back, training dummy in the middle, a weapon chest
pixStamp(g, top.T[0] - 20, top.T[1] + 14, `
..m....m....m....m..
..w....w....w....w..
..w....w....w....w..
ttttttttttttttttttttt
..w....w....w....w..
..w....w....w....w..
ttttttttttttttttttttt
`);
pixStamp(g, top.T[0] + 2, top.T[1] + 42, `
....hhhh....
...hhhhhh...
...hhkhhh...
....hhhh....
.wwwwwwwwww.
w..wwwwww..w
....wwww....
....wwww....
....wwww....
.....tt.....
.....tt.....
....tttt....
`);
pixStamp(g, top.T[0] + 26, top.T[1] + 30, `
tttttt
tDDDDt
tDDDDt
tttttt
`);
// crenellations along the two visible top edges
for (let k = 0; k < 12; k++) { const p = lerp(top.L, top.Bm, (k + 0.5) / 12), q = lerp(top.Bm, top.Rr, (k + 0.5) / 12); pixIsoBox(g, p[0], p[1] + 2, 0.12, 0.12, 4, 1, { left: 'v', right: 'S', top: 'n' }); pixIsoBox(g, q[0], q[1] + 2, 0.12, 0.12, 4, 1, { left: 's', right: 'x', top: 'n' }); }
// corner turrets (back, left, right, front) with crenellated tops
const turret = (cx, cy) => { const t = pixIsoBox(g, cx, cy, 0.7, 0.7, TZ, 1, { left: 'n', right: 'N', top: 'v' }); for (const pt of [t.T, t.L, t.Rr, t.Bm]) pixIsoBox(g, pt[0], pt[1] + 2, 0.1, 0.1, 3, 1, { left: 'v', right: 'N', top: 'n' }); pixRect(g, t.L[0] + 7, t.L[1] + 6, 1, 4, 'k'); pixRect(g, t.Bm[0] + 8, t.Bm[1] + 1, 1, 4, 'k'); return t; };
turret(top.T[0], top.T[1] + 22); turret(top.L[0] + 22, top.L[1] + 11); turret(top.Rr[0] - 22, top.Rr[1] + 11); turret(top.Bm[0], top.Bm[1]);
// gate on the right-hand wall, banner on the left-hand wall
pixStamp(g, lerp(top.Bm, top.Rr, 0.45)[0] - 7, lerp(top.Bm, top.Rr, 0.45)[1] + Z - 17, `
..xxxxxxxxx..
.xkkkkkkkkkx.
xkkkkkkkkkkkx
xkkkkkkkkkkkx
xkkkkkkkkkkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
xkktkktkktkkx
`);
pixStamp(g, lerp(top.L, top.Bm, 0.5)[0] - 5, lerp(top.L, top.Bm, 0.5)[1] + 1, `
ttttttttttt
.DDDDDDDDD.
.TTTTTTTTT.
.TTTTTTTTT.
.TTTLLLTTT.
.TTTLLLTTT.
.TTTTTTTTT.
.TTTTTTTTT.
.DTTTTTTTD.
..DTTTTTD..
...DTTTD...
....DTD....
.....D.....
`);

export default {
  id: 'barracks', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    s: '#9a8b78', S: '#7d7468', z: '#8a7b68', x: '#6a6258', n: '#a89a86', N: '#8a7b68', v: '#b3a692', V: '#8a7b68', // stone lit / shade / courses / turrets / rims
    y: '#a0824f', Y: '#917246',                                                                                       // packed earth yard
    t: '#5a3a18', w: '#8a6a3a', q: '#4a3520', Q: '#a07a44', R: '#7a5a30', m: '#cfd4d8', h: '#d8ab4f', k: '#2a2018',                                             // timber, spear shafts, spear heads, straw, dark
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: [pixText(g)] },
};
