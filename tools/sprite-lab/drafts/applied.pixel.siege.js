// @pixel siege
// Siege Workshop (3×3): a timber workshop with a big open bay along the back-left edge, plank roof; in the yard an A-frame
// crane with a hanging beam, a half-built mangonel on its frame, stacked wheels, a timber pile and a sawhorse. Team banner on the shed.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 56;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
let seed = 9; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (from, to, prob) => { for (const r of g) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };
const tile = (tx, ty) => [bx + (tx - ty) * 32, by - 96 + (tx + ty) * 16 + 16];

// yard: packed earth with sawdust
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x', top: 'y' });
speckle('y', 'Y', 0.12); speckle('y', 'd', 0.05);
// workshop shed along the back-left edge (w=1.3 along T→Rr, h=3 along T→L), open towards the yard (its right face)
const sh = pixIsoBox(g, bx - 54, by - 2 - 27, 1.3, 3, 22, 1, { left: 'w', right: 'i' });
const base = sh.base;
for (let k = 0; k <= 6; k++) { const p = lerp(base.Bm, base.Rr, k / 6); pixRect(g, p[0] - 1, p[1] - 22, 2, 22, 't'); }
for (let k = 0; k <= 2; k++) { const p = lerp(base.L, base.Bm, k / 2); pixRect(g, p[0] - 1, p[1] - 22, 2, 22, 't'); }
for (let yy = 5; yy < 22; yy += 5) pixLine(g, base.L[0], base.L[1] - yy, base.Bm[0], base.Bm[1] - yy, 'v');   // plank wall lines (lit side)
// roof: ridge along the long (T→L) axis, planks
const RISE = 9; const mT = lerp(sh.T, sh.Rr, 0.5), mB = lerp(sh.L, sh.Bm, 0.5);
const r1 = [lerp(mT, mB, 0.12)[0], lerp(mT, mB, 0.12)[1] - RISE], r2 = [lerp(mT, mB, 0.88)[0], lerp(mT, mB, 0.88)[1] - RISE];
pixPoly(g, [sh.T, sh.L, r2, r1], 'Q'); pixPoly(g, [sh.Rr, sh.Bm, r2, r1], 'R'); pixPoly(g, [sh.T, sh.Rr, r1], 'P'); pixPoly(g, [sh.L, sh.Bm, r2], 'Q');
for (let k = 1; k < 14; k++) { const a = lerp(sh.Rr, sh.Bm, k / 14), b = lerp(r1, r2, k / 14); pixLine(g, a[0], a[1], b[0], b[1], 'p'); }
for (let k = 1; k < 14; k++) { const a = lerp(sh.T, sh.L, k / 14), b = lerp(r1, r2, k / 14); pixLine(g, a[0], a[1], b[0], b[1], 'q'); }
pixLine(g, r1[0], r1[1], r2[0], r2[1], 'H'); pixLine(g, sh.L[0], sh.L[1], sh.Bm[0], sh.Bm[1], 'q'); pixLine(g, sh.Bm[0], sh.Bm[1], sh.Rr[0], sh.Rr[1], 'p');
// inside the bay: a workbench with tools and a glowing brazier; banner on the front post
pixStamp(g, base.Bm[0] + 10, base.Bm[1] - 16, `
m.m..m
tttttt
t....t
t....t
`);
pixStamp(g, base.Bm[0] + 34, base.Bm[1] - 26, `
..kk..
.kook.
.kOok.
..kk..
..tt..
`);
pixStamp(g, base.Bm[0] - 6, base.Bm[1] - 22, `
DDDDDDD
TTTTTTT
TTTTTTT
TTLLLTT
TTTTTTT
DTTTTTD
.DTTTD.
..DTD..
...D...
`);
// A-frame crane at the back-right with a hoisted beam: 2-px legs (dark edge 'u' + timber 't'), dark-edged beam
{ const c = tile(2, 0); pixStamp(g, c[0] - 12, c[1] - 42, `
...........ut...........
..........uttt..........
.........ut.r.tu........
........ut..r..tu.......
.......ut...r...tu......
......ut....r....tu.....
.....ut.....r.....tu....
....ut......r......tu...
...ut.......r.......tu..
..ut........r........tu.
.ut.........r.........tu
ut..........r..........t
............r...........
......uttttttttttttu....
.....uwwwwwwwwwwwwwwu...
.....uuuuuuuuuuuuuuuu...
`); }
// half-built mangonel out in the open yard: thick dark frame, 2-px throwing arm with a bucket, iron-bound wheels
{ const c = tile(1.75, 1.35); pixStamp(g, c[0] - 16, c[1] - 26, `
.............ukk............
............ukkk............
...........utkk.............
..........utt...............
.........ut.t...............
........ut..t...............
.......ut...t...............
......ut....t...............
.....ut.....t...............
....ut......t...............
...uttttttttttttttttttu.....
..ut..................tu....
.utwwwwwwwwwwwwwwwwwwwwtu...
.utwwwwwwwwwwwwwwwwwwwwtu...
.uuuuuuuuuuuuuuuuuuuuuuuu...
..kkk..............kkk......
.kkukk............kkukk.....
.kuuuk............kuuuk.....
.kkukk............kkukk.....
..kkk..............kkk......
`); }
// stacked wheels against the shed, timber pile and sawhorse at the front-right
pixStamp(g, bx - 20, by - 36, `
...kkkk.......kkkk...
..k....k.....k....k..
.k..t...k...k..t...k.
.k.ttt..k...k.ttt..k.
.k..t...k...k..t...k.
..k....k.....k....k..
...kkkk.......kkkk...
`);
{ const c = tile(2, 2); pixStamp(g, c[0] - 16, c[1] - 12, `
.....ooooooooooooooooo
....oooooooooooooooooo
...ooooooooooooooooooo
..oOooooooooooooooooooo
.oooooooooooooooooooooo
oooooooooooooooooooooo.
`.replace(/o/g, 'l').replace(/O/g, 'L2').replace(/L2/g, 'e')); }
pixStamp(g, bx + 10, by - 50, `
t........t
tttttttttt
.t......t.
t.t....t.t
`);

export default {
  id: 'siege', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    y: '#a0824f', Y: '#917246', d: '#c9a24a', z: '#8a6d3e', x: '#6f5730',    // earth + sawdust
    w: '#8a6a3a', v: '#7a5a30', t: '#5a3a18', i: '#2f241a',                  // planks, plank lines, posts, bay interior
    Q: '#a07a44', P: '#8a6a3a', R: '#6f5229', q: '#6a4a2a', p: '#4a3520', H: '#c9a24a',  // roof
    r: '#c9b58e', m: '#cfd4d8', k: '#2a2018', u: '#3a2a18',                   // rope, tools, iron, dark timber edge
    o: '#ff8c2a', O: '#ffd27a', l: '#9a7040', e: '#c9a24a',                  // brazier glow, log ends
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: [pixText(g)] },
};
