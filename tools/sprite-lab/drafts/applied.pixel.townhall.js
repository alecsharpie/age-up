// @pixel townhall
// Town Hall (3×3): stone plinth, open pillared ground floor under a big hipped tile roof, stone side tower at the right corner.
// Generated: iso faces from the kit, details stamped. Anchor = footprint bottom corner. Flag is code-drawn at the tower apex.
const W = 3, H = 3, Z = 22, ROOF = 26, PL = 4, TZ = 44;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + PL + Z + ROOF + 36;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const slopeLines = (e0, e1, ap, ch, n) => { for (let k = 1; k < n; k++) { const t = k / n; const p = lerp(e0, ap, t), q = lerp(e1, ap, t); pixLine(g, p[0], p[1], q[0], q[1], ch); } };

// plinth
const pl = pixIsoBox(g, bx, by, W, H, PL, 1, { left: 's', right: 'S', top: 'v' });
for (let k = 1; k < 12; k++) { const p = lerp(pl.T, pl.L, k / 12), q = lerp(pl.Rr, pl.Bm, k / 12); pixLine(g, p[0], p[1], q[0], q[1], 'V'); }
// open hall: dark interior faces, then timber pillars and beams
const hall = pixIsoBox(g, bx, by - PL, W, H, Z, 1, { left: 'i', right: 'I' });
const base = hall.base;
for (let k = 0; k <= 6; k++) { const p = lerp(base.L, base.Bm, k / 6); pixRect(g, p[0] - 1, p[1] - Z, 2, Z, k % 2 ? 't' : 'u'); }
for (let k = 0; k <= 6; k++) { const p = lerp(base.Bm, base.Rr, k / 6); pixRect(g, p[0] - 1, p[1] - Z, 2, Z, k % 2 ? 'r' : 'q'); }
pixLine(g, hall.L[0], hall.L[1] + 1, hall.Bm[0], hall.Bm[1] + 1, 'u'); pixLine(g, hall.L[0], hall.L[1] + 2, hall.Bm[0], hall.Bm[1] + 2, 't');
pixLine(g, hall.Bm[0], hall.Bm[1] + 1, hall.Rr[0], hall.Rr[1] + 1, 'q'); pixLine(g, hall.Bm[0], hall.Bm[1] + 2, hall.Rr[0], hall.Rr[1] + 2, 'r');
// team banner hanging in the front-left bay, and a notice board in the front-right bay
pixStamp(g, bx - 44, by - PL - Z + 3, `
DDDDDDDDD
TTTTTTTTT
TTTTTTTTT
TTTLLLTTT
TTTLLLTTT
TTTTTTTTT
TTTTTTTTT
DTTTTTTTD
.DTTTTTD.
..DTTTD..
...DTD...
....D....
`);
pixStamp(g, bx + 14, by - PL - Z + 8, `
rrrrrr
rwwwwr
rwwwwr
rrrrrr
`);
// the big roof
const ap = pixIsoRoof(g, hall, ROOF, 1, { back: 'a', left: 'b', front: 'c', right: 'd' });
slopeLines(hall.T, hall.L, ap, 'e', 7); slopeLines(hall.L, hall.Bm, ap, 'e', 7); slopeLines(hall.Bm, hall.Rr, ap, 'f', 7); slopeLines(hall.T, hall.Rr, ap, 'f', 7);
pixLine(g, hall.L[0], hall.L[1], ap[0], ap[1], 'g'); pixLine(g, hall.Bm[0], hall.Bm[1], ap[0], ap[1], 'g'); pixLine(g, hall.Rr[0], hall.Rr[1], ap[0], ap[1], 'f');
pixLine(g, hall.L[0], hall.L[1], hall.Bm[0], hall.Bm[1], 'g'); pixLine(g, hall.Bm[0], hall.Bm[1], hall.Rr[0], hall.Rr[1], 'f');
pixRect(g, ap[0] - 1, ap[1] - 1, 3, 2, 'g');
// side tower on the right corner tile, stone, with a small tile cap
const tw = pixIsoBox(g, bx + 64, by - PL - 32, 1, 1, TZ, 1, { left: 'n', right: 'N' });
const tap = pixIsoRoof(g, tw, 10, 1, { back: 'a', left: 'b', front: 'c', right: 'd' });
pixLine(g, tw.L[0], tw.L[1], tw.Bm[0], tw.Bm[1], 'g'); pixLine(g, tw.Bm[0], tw.Bm[1], tw.Rr[0], tw.Rr[1], 'f');
for (let yy = 6; yy < TZ - 4; yy += 9) { pixRect(g, tw.L[0] + 12, tw.L[1] + 6 + yy, 2, 5, 'k'); pixRect(g, tw.Bm[0] + 14, tw.Bm[1] - 7 + yy, 2, 5, 'k'); }
for (let k = 0; k < 6; k++) { pixSet(g, tw.L[0] + 4 + k * 5, tw.L[1] + 14 + Math.round(k * 2.5) + (k % 2) * 12, 'N'); pixSet(g, tw.Bm[0] + 3 + k * 5, tw.Bm[1] + 12 - Math.round(k * 2.5) + (k % 2) * 14, 'n'); }

pixStamp(g, tw.L[0] + 20, tw.L[1] + 20, `
DDDDDD
TTTTTT
TTLLTT
TTTTTT
.DTTD.
..DD..
`);

export default {
  id: 'townhall', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    s: '#8d8478', S: '#6f6a60', v: '#a39a8c', V: '#8d8478',   // plinth stone, paving
    i: '#3a2c1f', I: '#2a2018',                               // hall interior
    t: '#8a6a3a', u: '#a07a44', r: '#6a4a2a', q: '#5a3a18',   // timber lit / shaded
    a: '#8a3a2a', b: '#b85a3e', c: '#a0482e', d: '#7a3222',   // tiles back / left / front / right
    e: '#8e3f2a', f: '#5e2618', g: '#d07a58',                 // tile rows, ridge highlight
    n: '#9a8b78', N: '#7d7468', k: '#2a2018',                 // tower stone, arrow slits
    T: 'team', D: 'teamdark', L: 'teamlight', w: '#e8dcc0',
  },
  frames: { idle: [pixText(g)] },
};
