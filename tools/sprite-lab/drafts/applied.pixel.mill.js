// @pixel mill
// Windmill: stone tower with courses, shingled conical roof, team-colour door, and four sail frames (22.5° steps → smooth rotation).
// drafts/building.mill.js picks the frame from G.time so the sails turn.
const W = 2, H = 2, Z = 18, ROOF = 14, ARM = 25;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + ARM + 4;
const bx = W * 32 + 2, by = GH - 4;
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 23; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const g = pixGrid(GW, GH);

// tower (full footprint) with stone courses and a few darker stones
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'l', right: 'r' });
for (let k = 3; k < Z; k += 3) { pixLine(g, top.L[0], top.L[1] + k, top.Bm[0], top.Bm[1] + k, 'q'); pixLine(g, top.Bm[0], top.Bm[1] + k, top.Rr[0], top.Rr[1] + k, 'Q'); }
for (let k = 0; k < 40; k++) { const p = lerp(top.L, top.Bm, rnd()); pixSet(g, p[0], p[1] + 1 + Math.floor(rnd() * (Z - 2)), 'q'); const q2 = lerp(top.Bm, top.Rr, rnd()); pixSet(g, q2[0], q2[1] + 1 + Math.floor(rnd() * (Z - 2)), 'Q'); }
pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Bm[0], top.Bm[1] + Z, 'Q');
pixLine(g, top.L[0], top.L[1] + Z, top.Bm[0], top.Bm[1] + Z, 'Q'); pixLine(g, top.Bm[0], top.Bm[1] + Z, top.Rr[0], top.Rr[1] + Z, 'k');
// grain sacks by the door, door in team colour on the shaded wall, small window on the lit wall
{ const p = lerp(top.Bm, top.Rr, 0.3); pixStamp(g, p[0] - 3, p[1] + Z - 11, `
kkkkkk
.TTTT.
.LTTT.
.LTTT.
.LTkT.
.LTTT.
.LTTT.
.TTTT.
.DDDD.
`); pixStamp(g, p[0] + 5, p[1] + Z - 7, `
.oo.
oOOo
oOOo
.oo.
.oo.
oOOo
.oo.
`); }
{ const p = lerp(top.L, top.Bm, 0.35); pixStamp(g, p[0] - 2, p[1] + 5, `
kkkk
knnk
knnk
kkkk
`); }
// conical shingle roof
const ap = pixIsoRoof(g, top, ROOF, 1, { left: 'A', front: 'b', right: 'c', back: 'a' });
speckle(g, 'A', 'b', 0.15); speckle(g, 'b', 'c', 0.12); speckle(g, 'c', 'a', 0.1);
for (let k = 1; k < 4; k++) { const t = k / 4; pixLine(g, lerp(top.L, ap, t)[0], lerp(top.L, ap, t)[1], lerp(top.Bm, ap, t)[0], lerp(top.Bm, ap, t)[1], 'e'); pixLine(g, lerp(top.Bm, ap, t)[0], lerp(top.Bm, ap, t)[1], lerp(top.Rr, ap, t)[0], lerp(top.Rr, ap, t)[1], 'e'); }
pixLine(g, top.L[0], top.L[1] + 1, top.Bm[0], top.Bm[1] + 1, 'e'); pixLine(g, top.Bm[0], top.Bm[1] + 1, top.Rr[0], top.Rr[1] + 1, 'e');

// sails: hub on the front of the cap, four arms with cloth on the outer part; 4 frames rotate by 22.5°
const hub = [ap[0] + 5, ap[1] + 6];
const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = g.map(r => r.slice());
  for (let j = 0; j < 4; j++) {
    const a = f * Math.PI / 8 + j * Math.PI / 2; const ca = Math.cos(a), sa = Math.sin(a) * 0.92;
    pixLine(fr, hub[0], hub[1], hub[0] + ca * ARM, hub[1] + sa * ARM, 'w');
    // cloth: a strip beside the arm from 35% to 95% of its length, team colour with a light edge
    const nx = -sa, ny = ca;
    pixLine(fr, hub[0] + ca * ARM * 0.35 + nx * 1.5, hub[1] + sa * ARM * 0.35 + ny * 1.5, hub[0] + ca * ARM * 0.95 + nx * 1.5, hub[1] + sa * ARM * 0.95 + ny * 1.5, 'T');
    pixLine(fr, hub[0] + ca * ARM * 0.35 + nx * 2.5, hub[1] + sa * ARM * 0.35 + ny * 2.5, hub[0] + ca * ARM * 0.95 + nx * 2.5, hub[1] + sa * ARM * 0.95 + ny * 2.5, 'T');
    pixLine(fr, hub[0] + ca * ARM * 0.35 + nx * 3.5, hub[1] + sa * ARM * 0.35 + ny * 3.5, hub[0] + ca * ARM * 0.95 + nx * 3.5, hub[1] + sa * ARM * 0.95 + ny * 3.5, 'L');
  }
  pixStamp(fr, hub[0] - 1, hub[1] - 1, `
kkk
kwk
kkk
`);
  frames.push(pixText(fr));
}

export default {
  id: 'mill', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    l: '#c9b58e', r: '#a89676', q: '#b8a582', Q: '#8f7f66', k: '#2a2018',          // stone tower lit/shade, courses
    A: '#8f6a3c', b: '#7d5a3a', a: '#6a4a2a', c: '#5a3a18', e: '#4a3520',           // shingles
    T: 'team', D: 'teamdark', L: 'teamlight', n: '#4a6a8a',
    o: '#c9a86a', O: '#e0c38a', w: '#5a3a18',                                        // sacks, arms
  },
  frames: { idle: frames },
};
