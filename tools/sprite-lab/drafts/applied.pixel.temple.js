// @pixel temple
// Temple / Monastery (3×3), Western chapel: flagstone cloister yard, long ashlar-limestone nave with stepped buttresses and
// candle-lit lancets, pitched red-tile roof in courses, front gable with a stained-glass rose window, an arched team door and a
// gold cross; square bell tower at the front-left with string courses, quoins, an open belfry, team banner and tiled spire.
// Generated with local texture routines; anchor = bottom corner. idle: 4 frames — the bells swing, candlelight flickers.
// ---- local texture kit (deterministic) ----
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const copy = g => g.map(r => r.slice());
/** Replace every cell holding one of `chs` by fn(x,y,ch) (null keeps it). */
const paint = (g, chs, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (chs.includes(g[y][x])) { const c = fn(x, y, g[y][x]); if (c) g[y][x] = c; } };
/** Courses on a face whose rows run with slope s (+0.5 down-right, -0.5 up-right, 0 flat): rows of height h, blocks of width w
 *  staggered by half a block, 1-px joint under each row, optional lit lip on top of each row, block tones picked per block. */
const course = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v = u - row * o.h;
  if (v >= o.h - 1) return o.joint;
  const xs = x + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
  if (o.seam && ((xs % o.w) + o.w) % o.w === 0) return o.seam;
  if (o.lip && v < 1) return o.lip;
  return o.tones[Math.floor(hash(col + 17, row + 91) * o.tones.length)];
};
/** Thatch: layered bands (slope s, height h) of short vertical strands; the bottom of every band is the shaded underside. */
const thatch = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v = u - row * o.h;
  const hx = hash(x + 5, row + 3);
  if (v >= o.h - 1 - (hx < 0.3 ? 1 : 0)) return o.under;
  return o.tones[Math.floor(hash(x >> 1, row * 7 + 1) * o.tones.length)];
};
/** Selective ink outline: every solid cell touching transparency becomes ink, except on upper-left edges where `sel` maps the
 *  material to its shade tone (so the lit side is not stickered). */
const outline = (g, ink, sel = {}) => {
  const H = g.length, W = g[0].length, o = copy(g); const sol = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!sol(x, y)) continue; const l = !sol(x - 1, y), r = !sol(x + 1, y), u = !sol(x, y - 1), d = !sol(x, y + 1);
    if (!(l || r || u || d)) continue;
    o[y][x] = (!r && !d && sel[g[y][x]]) ? sel[g[y][x]] : ink;
  }
  return o;
};
const line = (g, a, b, ch, dy = 0) => pixLine(g, a[0], a[1] + dy, b[0], b[1] + dy, ch);
/** height above the base line of an iso wall from a to b (a.x < b.x) at (x,y) */
const wallH = (a, b, x, y) => (a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])) - y;

const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 96;
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
paint(g, '3', (x, y) => course(x, y, 0.5, { h: 5, w: 9, joint: 'z', seam: 'z', tones: ['y', 'Y', 'y', 'x'] }));

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
for (let k = 0; k < 6; k++) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); const x = Math.round(p[0]) - 2, y = Math.round(p[1]) - Z + 8; pixStamp(g, x, y, LANCET); lancets.push([x, y]); }
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
pixPoly(g, [top.T, top.L, r1], '8');
pixPoly(g, [eL, eB, r2, r1], '7');
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 4, w: 6, joint: 'c', seam: 'b', lip: 'B', tones: ['A', 'A', 'B'] }));
paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 6, joint: 'e', seam: 'e', tones: ['c', 'b'] }));
paint(g, '8', (x, y) => course(x, y, 0, { h: 4, w: 7, joint: 'Q', seam: 'Q', tones: ['r', 'r', 's'] }));
line(g, r1, r2, 'k'); line(g, r1, r2, 'B', 1); line(g, eL, eB, 'k'); line(g, eL, eB, 'e', -1);
line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1]], [r2[0] + 1, r2[1]], 'B'); line(g, top.Rr, r2, 'k');
// gable: rose window (stained glass), arched team door, cross at the peak
const gm = lerp(top.Rr, top.Bm, 0.5);
const ROSE = [Math.round(gm[0]), Math.round(gm[1] - 5)];
{ const [cx, cy] = ROSE; for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) { const d = Math.hypot(x, y); if (d > 5.4) continue;
  pixSet(g, cx + x, cy + y, d > 4.4 ? 'k' : d > 3.6 ? 'q' : d < 1.2 ? 'G' : (x === 0 || y === 0 || Math.abs(x) === Math.abs(y)) ? 'k' : ((Math.atan2(y, x) * 4 / Math.PI + 8) % 2 < 1 ? 'n' : 'R')); } }
pixStamp(g, r2[0] - 2, r2[1] - 8, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
`);
{ const dm = lerp(base.Rr, base.Bm, 0.5); pixStamp(g, dm[0] - 4, dm[1] - 15, `
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
`); }

// ---- bell tower at the front-left corner, ashlar with string courses, open belfry with a swinging bell, spire, gold cross
const TX = 0.1, TY = 2.0, TS = 0.9, TZ = 50, SP = 40;
const tb = bmOf(TX, TY, TS, TS); tb[1] -= 3;
const tt = pixIsoBox(g, tb[0], tb[1], TS, TS, TZ, 1, { left: '4', right: '5' });
const tbase = tt.base;
paint(g, '4', (x, y) => { const h = wallH(tbase.L, tbase.Bm, x, y); return h < 3 ? 'q' : course(x, y, 0.5, ashL); });
paint(g, '5', (x, y) => { const h = wallH(tbase.Bm, tbase.Rr, x, y); return h < 3 ? 'Q' : course(x, y, -0.5, ashR); });
for (const yy of [17, 33]) { line(g, [tbase.L[0], tbase.L[1] - yy], [tbase.Bm[0], tbase.Bm[1] - yy], 'k'); line(g, [tbase.L[0], tbase.L[1] - yy + 1], [tbase.Bm[0], tbase.Bm[1] - yy + 1], 'l');
  line(g, [tbase.Bm[0], tbase.Bm[1] - yy], [tbase.Rr[0], tbase.Rr[1] - yy], 'k'); line(g, [tbase.Bm[0], tbase.Bm[1] - yy + 1], [tbase.Rr[0], tbase.Rr[1] - yy + 1], 's'); }
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
pixStamp(g, BELL_L[0], BELL_L[1], BELFRY); pixStamp(g, BELL_R[0], BELL_R[1], BELFRY.replace(/m/g, 's'));
pixStamp(g, Math.round(pL[0]) - 3, Math.round(pL[1]) - 30, `
.kkkkk.
kqnnnqk
knnGnnk
kqnnnqk
.kkkkk.
`);
pixStamp(g, Math.round(pR[0]) - 3, Math.round(pR[1]) - 31, `
kkkkkkk
kDTTTDk
kTTLTTk
kTLLLTk
kTTLTTk
kTTTTTk
kTTTTTk
kDTTTDk
kTDTDTk
.k.k.k.
`);
// spire: slate-dark tile faces in courses, cross on top
const sR = { L: [tt.L[0] - 1, tt.L[1] + 1], Bm: [tt.Bm[0], tt.Bm[1] + 2], Rr: [tt.Rr[0] + 1, tt.Rr[1] + 1], T: tt.T };
const ap = pixIsoRoof(g, sR, SP, 1, { back: '6', left: '7', front: '9', right: '0' });
paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'b', lip: 'B', tones: ['A'] }));
paint(g, '9', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'c', lip: 'A', tones: ['b'] }));
paint(g, '0', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'e', lip: 'b', tones: ['c'] }));
paint(g, '6', () => 'c');
line(g, sR.L, sR.Bm, 'k'); line(g, sR.Bm, sR.Rr, 'k'); line(g, sR.Bm, ap, 'k'); line(g, [sR.Bm[0] - 1, sR.Bm[1]], [ap[0] - 1, ap[1]], 'B');
pixStamp(g, ap[0] - 2, ap[1] - 9, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
..k..
`);

const baseG = outline(g, 'k', { l: 'm', y: 'Y', S: 'q', B: 'A' });

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
    k: '#24180f',                                                        // ink
    l: '#efe7d2', m: '#e0d5bb', M: '#cbbf9f',                            // limestone lit wall: light / mid / shadow
    r: '#c4b89c', s: '#ad9f80', Q: '#8f8268',                            // limestone shaded wall
    S: '#a39a8c', q: '#9a8f78', j: '#6f6a60',                            // plinth / trim
    y: '#cdc2a6', Y: '#bdb194', x: '#b0a487', z: '#9a8e72',              // flagstones
    A: '#b85a3a', B: '#d07a58', b: '#a0482e', c: '#7a3522', e: '#5e2a1a', // roof tiles
    w: '#6a3a1a', W: '#e89a3a', O: '#ffd36a',                            // lancet recess, candlelight
    n: '#3f6fb8', R: '#b8342a', G: '#ffe28a', g: '#c0953a',              // stained glass, gold, bell
    i: '#1f1610',                                                        // belfry dark
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
