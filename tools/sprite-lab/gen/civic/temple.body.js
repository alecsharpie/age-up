// Age variants (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs); the temple stands from the Castle Age.
//   Castle   the chapel as tuned: limestone nave, red tiles, bell tower with a tiled spire and a gold cross (the original art).
//   Imperial pale limestone ashlar and blue-grey slate; gilt cresting along the nave ridge and gilt eave trim; the bell tower
//            raised a stage with gilt string courses, corner pinnacles and a taller slate spire under a gilt orb and cross;
//            a gilt-ringed rose window, gilt-fringed team banners flanking the west door.
const C = AGE === 2, { Au } = AK;
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 96 + (C ? 0 : 24);
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
// bottom corner of a box occupying tiles [x0,x0+w) × [y0,y0+h)
const bmOf = (x0, y0, w, h) => [bx + ((x0 + w) - (y0 + h)) * 32, by - 96 + ((x0 + w) + (y0 + h)) * 16];
const ashL = { h: 4, w: 7, joint: 'q', seam: 'q', lip: 'l', tones: ['l', 'm', 'l', 'm', 'M'] };
const ashR = { h: 4, w: 7, joint: 'Q', seam: 'Q', tones: ['r', 'r', 's'] };

// ---- cloister yard: flagstones in a stone kerb
const yard = pixIsoBox(g, bx, by, W, H, 3, 1, { left: '1', right: '2', top: '3' });
paint(g, '1', (x, y) => course(x, y, 0.5, { h: 3, w: 6, joint: 'j', seam: 'j', tones: ['S', 'q'] }));
paint(g, '2', (x, y) => course(x, y, -0.5, { h: 3, w: 6, joint: 'j', seam: 'j', tones: ['q', 'Q'] }));
paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 8, ox: bx, oy: by, joint: 'z', tones: ['y', 'Y', 'y', 'x'] }));   // flat on the ground

// ---- nave: long along x, ashlar limestone, buttresses, lancet windows with candle glow
const NX = 0.15, NY = 0.95, NW = 2.75, NH = 1.45, Z = 26, RISE = 18;
const nb = bmOf(NX, NY, NW, NH); nb[1] -= 3;
const top = pixIsoBox(g, nb[0], nb[1], NW, NH, Z, 1, { left: '4', right: '5' });
const base = top.base;
paint(g, '4', (x, y) => { const h = wallH(base.L, base.Bm, x, y); return h < 3 ? (h < 1 ? 'Q' : 'q') : h > Z - 3 ? 'M' : course(x, y, 0.5, ashL); });
paint(g, '5', (x, y) => { const h = wallH(base.Bm, base.Rr, x, y); return h < 3 ? (h < 1 ? 'j' : 'Q') : h > Z - 3 ? 's' : course(x, y, -0.5, ashR); });
const LANCET = `
..k..
.kwk.
kwWwk
kwWwk
kwwwk
kwWwk
kwwwk
kmmmk
`;
const lancets = [];
for (let k = 0; k < 6; k++) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); const x = Math.round(p[0]) - 2, y = Math.round(p[1]) - Z + 8; stampOn(g, x, y, LANCET, 0.5); lancets.push([x, y]); }
// buttresses: stepped piers, lit face / shade face / ink edge, a sloped cap halfway up
for (let k = 1; k < 6; k++) { const p = lerp(base.L, base.Bm, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]);
  pixRect(g, x - 2, y - Z + 6, 2, Z - 6, 'l'); pixRect(g, x, y - Z + 6, 2, Z - 6, 'r'); pixRect(g, x + 2, y - Z + 6, 1, Z - 6, 'k');
  pixRect(g, x - 3, y - 11, 2, 11, 'l'); pixSet(g, x - 3, y - 12, 'k'); pixSet(g, x - 2, y - 13, 'k');
  pixRect(g, x - 2, y - Z + 5, 4, 1, 'k'); pixRect(g, x - 2, y - 1, 4, 1, 'Q'); }
// roof: pitched, red tile courses with lit lips; ridge along x, gable at the front-right end
const r1 = [lerp(top.T, top.L, 0.5)[0], lerp(top.T, top.L, 0.5)[1] - RISE], r2 = [lerp(top.Rr, top.Bm, 0.5)[0], lerp(top.Rr, top.Bm, 0.5)[1] - RISE];
const eL = [top.L[0] - 1, top.L[1] + 2], eB = [top.Bm[0] - 1, top.Bm[1] + 2];
pixPoly(g, [top.T, top.Rr, r2, r1], '6');
pixPoly(g, [top.Rr, top.Bm, r2], '8');
// (the far gable end at i = NX faces away from the viewer: the two roof slopes hide it, so it is not painted)
pixPoly(g, [eL, eB, r2, r1], '7');
// tile seams follow each slope's fall line (ridge to eave), courses run with the eave
const fallF = (eL[0] - r1[0]) / (eL[1] - r1[1]), fallB = (top.T[0] - r1[0]) / (top.T[1] - r1[1]);
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 4, w: 6, joint: 'c', seam: 'b', lip: 'B', tones: ['A', 'A', 'B'], fall: fallF }));
paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 6, joint: 'e', seam: 'e', tones: ['c', 'b'], flip: true, fall: fallB }));   // back slope
paint(g, '8', (x, y) => course(x, y, -0.5, ashR));   // gable: same courses as the wall under it
line(g, r1, r2, 'k'); line(g, r1, r2, 'B', 1); line(g, eL, eB, 'k'); line(g, eL, eB, 'e', -1);
line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1]], [r2[0] + 1, r2[1]], 'B'); line(g, top.Rr, r2, 'k');
// gable: rose window (stained glass), arched team door, cross at the peak
const gm = lerp(top.Rr, top.Bm, 0.5);
const ROSE = [Math.round(gm[0]), Math.round(gm[1] - 5)];
discOn(g, ROSE[0], ROSE[1], 5, -0.5, (x, y) => { const d = Math.hypot(x, y), a = (Math.atan2(y, x) * 4 / Math.PI + 8) % 1;
  return d > 4.4 ? 'k' : d > 3.6 ? (C ? 'q' : Au[1]) : d < 1.2 ? 'G' : (a < 0.18 || a > 0.82) ? 'k' : ((Math.atan2(y, x) * 4 / Math.PI + 8) % 2 < 1 ? 'n' : 'R'); });
pixStamp(g, r2[0] - 2, r2[1] - 8, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
`);
{ const dm = lerp(base.Rr, base.Bm, 0.5); stampOn(g, Math.round(dm[0]) - 4, Math.round(dm[1]) - 15, `
...kkk...
..kqqqk..
.kqTTTqk.
kqTLTTDqk
kqLTTTDqk
kqLTDTDqk
kqLTDTDqk
kqLTGTDqk
kqLTDTDqk
kqLTDTDqk
kqLTDTDqk
kqDDDDDqk
kSSSSSSSk
`, -0.5); }

if (!C) { // Imperial: gilt cresting along the nave ridge, gilt eave trim, gilt-fringed banners flanking the west door
  AK.crest(g, [r1[0] + 2, r1[1]], [r2[0] - 2, r2[1]]);
  AK.trim(g, [eL[0] + 1, eL[1] - 1], [eB[0] - 1, eB[1] - 1], 0);
}
// team banners flanking the west door on iron (Imperial: gilt) rods
{ const dm = lerp(base.Rr, base.Bm, 0.5);
  for (const du of [-15, 9]) teamBanner(g, Math.round(dm[0]) + du, Math.round(dm[1] - (du + 2.5) * 0.5) - 21, -0.5, 6, C ? 14 : 15); }
// weathering low on the nave: moss at the foot, damp splash, rain streaks (formal: no change to the lines themselves)
weather(g, base.L, base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: C ? 6 : 4, seed: 2, H: Z - 3, streaks: C ? 0.06 : 0.04 });
weather(g, base.Rr[0] > base.Bm[0] ? base.Bm : base.Rr, base.Rr, 'rsQ', { r: 's', s: 'Q' }, { rows: C ? 6 : 4, seed: 7, H: Z - 3, streaks: C ? 0.06 : 0.04 });
// ---- bell tower at the front-left corner, ashlar with string courses, open belfry with a swinging bell, spire, gold cross
const TX = 0.1, TY = 2.0, TS = 0.9, TZ = C ? 50 : 64, SP = C ? 40 : 50;
const tb = bmOf(TX, TY, TS, TS); tb[1] -= 3;
// The tower overlaps the nave's front-left end: the back part of its right face (j < 2.4, behind the nave's front wall) is
// hidden by the nave wall and roof, so it rises out of the roof. `underTower` keeps the nave to restore those cells.
const underTower = copy(g);
const tt = pixIsoBox(g, tb[0], tb[1], TS, TS, TZ, 1, { left: '4', right: '5' });
const tbase = tt.base;
paint(g, '4', (x, y) => { const h = wallH(tbase.L, tbase.Bm, x, y); return h < 3 ? 'q' : course(x, y, 0.5, ashL); });
paint(g, '5', (x, y) => { const h = wallH(tbase.Bm, tbase.Rr, x, y); return h < 3 ? 'Q' : course(x, y, -0.5, ashR); });
for (const yy of C ? [17, 33] : [17, 33, 49]) { line(g, [tbase.L[0], tbase.L[1] - yy], [tbase.Bm[0], tbase.Bm[1] - yy], 'k'); line(g, [tbase.L[0], tbase.L[1] - yy + 1], [tbase.Bm[0], tbase.Bm[1] - yy + 1], C ? 'l' : Au[0]);
  line(g, [tbase.Bm[0], tbase.Bm[1] - yy], [tbase.Rr[0], tbase.Rr[1] - yy], 'k'); line(g, [tbase.Bm[0], tbase.Bm[1] - yy + 1], [tbase.Rr[0], tbase.Rr[1] - yy + 1], C ? 's' : Au[1]); }
// quoins on the tower's front corner
for (let k = 3; k < TZ - 2; k += 4) { const o = (k >> 2) % 2; pixRect(g, tbase.Bm[0] - 2 - o, tbase.Bm[1] - k - 3, 2 + o, 3, 'l'); pixRect(g, tbase.Bm[0], tbase.Bm[1] - k - 3, 2 + (1 - o), 3, 's'); }
const BELFRY = `
..kkk..
.kiiik.
kiiiiik
kiiiiik
kiiiiik
kiiiiik
kiiiiik
kmmmmmk
`;
const pL = lerp(tbase.L, tbase.Bm, 0.5), pR = lerp(tbase.Bm, tbase.Rr, 0.5);
const BELL_L = [Math.round(pL[0]) - 3, Math.round(pL[1]) - TZ + 3], BELL_R = [Math.round(pR[0]) - 3, Math.round(pR[1]) - TZ + 3];
stampOn(g, BELL_L[0], BELL_L[1], BELFRY, 0.5); stampOn(g, BELL_R[0], BELL_R[1], BELFRY.replace(/m/g, 's'), -0.5);
if (!C) { stampOn(g, Math.round(pL[0]) - 2, Math.round(pL[1]) - 45, LANCET, 0.5); lancets.push([Math.round(pL[0]) - 2, Math.round(pL[1]) - 45]); }
stampOn(g, Math.round(pL[0]) - 3, Math.round(pL[1]) - 30, `
.kkkkk.
kqnnnqk
knnGnnk
kqnnnqk
.kkkkk.
`, 0.5);
{ const pB = lerp(tbase.Bm, tbase.Rr, 0.42), w = 9; teamBanner(g, Math.round(pB[0]) - 4, Math.round(pB[1]) - 32, -0.5, C ? w : w + 1, C ? 22 : 30, { charge: 'cross' }); }
// and a long one down the lit face, hung under the second string course beside the gilt plaque
{ const pA = lerp(tbase.L, tbase.Bm, 0.76); teamBanner(g, Math.round(pA[0]) - 4, Math.round(pA[1]) - 32, 0.5, 8, 27, { charge: C ? 'cross' : 'disc' }); }
{ const roofZ = j => 3 + 24 + 20 * (NY + NH - j) / (NH / 2);   // nave front slope / wall in front of the tower's right face
  const hid = (x, y) => { if (x + 0.5 <= tbase.Bm[0]) return false; const i = TX + TS, j = i - (x + 0.5 - bx) / 32; return j < NY + NH && by - 96 + (i + j) * 16 - (y + 0.5) < roofZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTower[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTower[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'Q'; }
// spire: slate-dark tile faces in courses, cross on top
const sR = { L: [tt.L[0] - 1, tt.L[1] + 1], Bm: [tt.Bm[0], tt.Bm[1] + 2], Rr: [tt.Rr[0] + 1, tt.Rr[1] + 1], T: tt.T };
const ap = pixIsoRoof(g, sR, SP, 1, { back: '6', left: '7', front: '9', right: '0' });
paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'b', lip: 'B', tones: ['A'] }));
paint(g, '9', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'c', lip: 'A', tones: ['b'] }));
paint(g, '0', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'e', lip: 'b', tones: ['c'] }));
paint(g, '6', () => 'c');
line(g, sR.L, sR.Bm, 'k'); line(g, sR.Bm, sR.Rr, 'k'); line(g, sR.Bm, ap, 'k'); line(g, [sR.Bm[0] - 1, sR.Bm[1]], [ap[0] - 1, ap[1]], 'B');
if (C) pixStamp(g, ap[0] - 2, ap[1] - 9, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
..k..
`);
else { // gilt eave trim, crested front hip, pinnacles on the tower's corners, and a gilt cross over an orb
  AK.trim(g, [sR.L[0] + 1, sR.L[1]], sR.Bm, -1); AK.trim(g, sR.Bm, [sR.Rr[0] - 1, sR.Rr[1]], -1);
  AK.crest(g, lerp(sR.Bm, ap, 0.15), lerp(sR.Bm, ap, 0.75));
  for (const P of [sR.L, sR.Bm, sR.Rr]) pixStamp(g, Math.round(P[0]) - 1, Math.round(P[1]) - 8, `
.k.
kλk
kμk
klk
klk
kmk
kMk
kkk
`);
  pixStamp(g, ap[0] - 2, ap[1] - 12, `
..k..
.kλk.
kλλμk
.kμk.
.kμk.
.kλk.
kλμνk
kμμνk
.kνk.
..k..
`);
}

const baseG = outline(g, 'k', { l: 'm', y: 'Y', S: 'q', B: 'A' });
tufts(baseG, yard.base.L, yard.base.Bm, { n: C ? 3 : 2, seed: 3 }); tufts(baseG, yard.base.Bm, yard.base.Rr, { n: C ? 3 : 2, seed: 4 });

// ---- idle: 4 frames — the bells swing (left, centre, right, centre), candlelight flickers in the lancets
const BELLS = [`
.gg..
gGGg.
gGGgg
.g.k.
`, `
.gg.
gGGg
gGGg
gggg
.k..
`, `
..gg.
.gGGg
ggGGg
.k.g.
`];
const frames = [];
for (let i = 0; i < 4; i++) {
  const f = copy(baseG);
  const bell = BELLS[[0, 1, 2, 1][i]];
  for (const [x, y] of [BELL_L, BELL_R]) { pixSet(f, x + 3, y + 1, 'k'); pixStamp(f, x + 1, y + 2, bell); }
  lancets.forEach(([x, y], k) => { const on = (k + i) % 3; for (const [dy, n] of [[2, 0], [3, 1], [5, 2]]) if ('wW'.includes(pixGet(baseG, x + 2, y + dy))) pixSet(f, x + 2, y + dy, on === n ? 'O' : 'W'); });
  frames.push(pixText(f));
}

export default {
  id: 'temple', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    k: '#24180f',                                                        // ink
    l: '#efe7d2', m: '#e0d5bb', M: '#cbbf9f',                            // limestone lit wall: light / mid / shadow
    r: '#c4b89c', s: '#ad9f80', Q: '#8f8268',                            // limestone shaded wall
    S: '#a39a8c', q: '#9a8f78', j: '#6f6a60',                            // plinth / trim
    y: '#cdc2a6', Y: '#bdb194', x: '#b0a487', z: '#9a8e72',              // flagstones
    A: '#b85a3a', B: '#d07a58', b: '#a0482e', c: '#7a3522', e: '#5e2a1a', // roof tiles
    w: '#6a3a1a', W: '#e89a3a', O: '#ffd36a',                            // lancet recess, candlelight
    n: '#3f6fb8', R: '#b8342a', G: '#ffe28a', g: '#c0953a',              // stained glass, gold, bell
    i: '#1f1610',                                                        // belfry dark
    ...NPAL,
    T: 'team', D: 'teamdark', L: 'teamlight',
    // Imperial: the same courses in the age kit's pale limestone and blue-grey slate
    ...(C ? {} : { l: AK.pal['σ'], m: AK.pal['ς'], M: AK.pal['τ'], r: AK.pal['ς'], s: AK.pal['τ'], Q: AK.pal['υ'],
      B: AK.pal['α'], A: AK.pal['γ'], b: AK.pal['δ'], c: AK.pal['ε'], e: AK.pal['η'], y: '#e6dcc4', Y: '#d6caae', x: '#c8bb9c', z: '#a89878' }),
  },
  roofChars: 'ABbce',
  frames: { idle: frames },
};
