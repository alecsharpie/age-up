// @pixel archery
// Archery Range (3×3): a packed-earth range with a timber shooting shed under a striped team-colour canvas along the
// back-left edge, three straw targets with red/white rings on stands at the back-right, arrows in them, a rail fence in front.
const W = 3, H = 3, Z = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 3; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const tile = (tx, ty) => [bx + (tx - ty) * 32, by - 96 + (tx + ty) * 16 + 16];

// the range: a low earth platform with a worn shooting lane
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'z', right: 'x', top: 'y' });
speckle('y', 'Y', 0.14); speckle('y', 'Z', 0.03);
{ const a = lerp(top.L, top.T, 0.45), b = lerp(top.Bm, top.Rr, 0.45); for (let k = -3; k <= 3; k++) pixLine(g, a[0] + k, a[1], b[0] + k, b[1], 'Y'); }
// shooting shed along the back-left edge: open front, striped canvas on top
const shed = pixIsoBox(g, bx - 64, by - 32 - Z, 1, 3, 14, 1, { left: 'w', right: 'i', top: 'A' });
for (let k = 0; k <= 6; k++) { const p = lerp(shed.base.Bm, shed.base.Rr, k / 6); pixRect(g, p[0] - 1, p[1] - 14, 2, 14, 't'); }
for (let k = 0; k <= 2; k++) { const p = lerp(shed.base.L, shed.base.Bm, k / 2); pixRect(g, p[0] - 1, p[1] - 14, 2, 14, 't'); }
for (let k = 1; k < 12; k++) { const p = lerp(shed.T, shed.Rr, k / 12), q = lerp(shed.L, shed.Bm, k / 12); pixLine(g, p[0], p[1], q[0], q[1], k % 2 ? 'T' : 'A'); }
pixLine(g, shed.L[0], shed.L[1], shed.Bm[0], shed.Bm[1], 'D'); pixLine(g, shed.Bm[0], shed.Bm[1], shed.Rr[0], shed.Rr[1], 'D'); pixLine(g, shed.T[0], shed.T[1], shed.Rr[0], shed.Rr[1], 'D'); pixLine(g, shed.T[0], shed.T[1], shed.L[0], shed.L[1], 'D');
for (let k = 0; k < 12; k++) { const p = lerp(shed.Bm, shed.Rr, (k + 0.5) / 12); pixSet(g, p[0], p[1] + 1 + (k % 2), 'D'); }
// quiver of arrows and a bow rack inside the shed
pixStamp(g, shed.base.Bm[0] + 6, shed.base.Bm[1] - 14, `
.f.f.f.
.a.a.a.
.a.a.a.
wwwwwww
`);
pixStamp(g, shed.base.Bm[0] + 30, shed.base.Bm[1] - 20, `
..w....w..
.w.w..w.w.
.w.w..w.w.
.w.w..w.w.
..w....w..
`);
// straw targets on stands at the back-right, arrows stuck in
const target = (x, y) => pixStamp(g, x - 5, y - 16, `
....hhh....
..hhhhhhh..
.hhrrrrrhh.
.hrrwwwrrh.
hhrwwrwwrhh
hhrwrkrwrhh
hhrwwrwwrhh
.hrrwwwrrh.
.hhrrrrrhh.
..hhhhhhh..
....hhh....
...t...t...
...t...t...
..t.....t..
..t.....t..
`);
for (const [tx, ty] of [[2, 0], [2, 1], [2, 2]]) { const c = tile(tx, ty); target(c[0] + 2, c[1] + 2); }
pixStamp(g, tile(2, 0)[0] - 3, tile(2, 0)[1] - 10, `
.a.
..a
`);
pixStamp(g, tile(2, 1)[0] - 1, tile(2, 1)[1] - 11, `
a..
.a.
`);
// hay bales by the shed and a rail fence along the two front edges
pixStamp(g, bx - 30, by - 44, `
.hhhhh.
hhhhhhh
hHhhhHh
hhhhhhh
.hhhhh.
`);
for (const [a, b] of [[top.L, top.Bm], [top.Bm, top.Rr]]) {
  for (let k = 0; k <= 6; k++) { const p = lerp(a, b, k / 6); pixRect(g, p[0], p[1] - 7, 1, 7, 't'); }
  pixLine(g, a[0], a[1] - 5, b[0], b[1] - 5, 'w'); pixLine(g, a[0], a[1] - 2, b[0], b[1] - 2, 'w');
}

export default {
  id: 'archery', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    y: '#a0824f', Y: '#917246', Z: '#b8955a', z: '#8a6d3e', x: '#6f5730',   // earth top / lane / edges
    w: '#8a6a3a', t: '#5a3a18', i: '#3a2c1f',                               // timber, posts, shed interior
    A: '#e8dcc0', T: 'team', D: 'teamdark', L: 'teamlight',                   // canvas stripes
    h: '#d8ab4f', H: '#b58a3c', r: '#c9303a', k: '#2a2018', f: '#e8dcc0', a: '#8a6a3a', // straw, rings, bullseye, fletching, shafts
  },
  frames: { idle: [pixText(g)] },
};
