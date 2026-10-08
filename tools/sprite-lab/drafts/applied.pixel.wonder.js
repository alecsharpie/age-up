// @pixel wonder
// Wonder (5×5): a Gothic cathedral — two-step plinth; coursed-ashlar nave with clerestory lancets under a slate roof; a lower
// south aisle with a lean-to roof and flying buttresses springing from pinnacled piers; transept arms with the great rose
// window and a team-colour portal on the lit gable; a west front with its own rose and portal; a crossing tower with belfry
// lancets and a team banner, crocketed slate spire and gold tip. Generated with local texture routines; anchor = bottom corner.
// idle: 4 frames — a glint runs up the gold spire tip and flashes, candlelight flickers in the windows.
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

const W = 5, H = 5;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 6 + 74 + 58 + 12;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const PL = 8;
// bottom corner (in cells) of a block occupying tiles [i,i+w) × [j,j+h), raised by z px
const blockBm = (i, j, w, h, z = 0) => [bx + (i - j + (w - h)) * 32, by - (W + H) * 16 + (i + j + w + h) * 16 - z];
const ashL = { h: 4, w: 8, joint: 'q', seam: 'q', lip: 'l', tones: ['l', 'm', 'l', 'm', 'M'] };
const ashR = { h: 4, w: 8, joint: 'Q', seam: 'Q', tones: ['r', 'r', 's'] };
/** a coursed-ashlar block: lit left face, shaded right face, plinth course and eave shadow; returns the top face */
const block = (i, j, w, h, z, z0 = PL) => {
  const bm = blockBm(i, j, w, h, z0); const t = pixIsoBox(g, bm[0], bm[1], w, h, z, 1, { left: '4', right: '5' }); const b = t.base;
  paint(g, '4', (x, y) => { const hh = wallH(b.L, b.Bm, x, y); return (z0 === PL && hh < 3) ? (hh < 1 ? 'Q' : 'q') : hh > z - 2 ? 'M' : course(x, y, 0.5, ashL); });
  paint(g, '5', (x, y) => { const hh = wallH(b.Bm, b.Rr, x, y); return (z0 === PL && hh < 3) ? (hh < 1 ? 'j' : 'Q') : hh > z - 2 ? 's' : course(x, y, -0.5, ashR); });
  return t;
};
const slateLit = { h: 3, w: 4, joint: 'v', seam: 'v', lip: 'U', tones: ['u', 'u', 'U'] };
const slateMid = { h: 3, w: 4, joint: 'V', seam: 'V', lip: 'u', tones: ['v', 'v', 'u'] };
const slateDk = { h: 3, w: 4, joint: 'K', seam: 'K', lip: 'v', tones: ['V'] };
/** gable roof, ridge along i (x axis) — front slope lit-ish, end gable on the right face */
const gableX = (t, rise) => {
  const m1 = lerp(t.T, t.L, 0.5), m2 = lerp(t.Rr, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eL = [t.L[0] - 1, t.L[1] + 2], eB = [t.Bm[0] - 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.Rr, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, 0.5, slateDk));
  pixPoly(g, [t.Rr, t.Bm, r2], '5'); paint(g, '5', (x, y) => course(x, y, 0, ashR));
  pixPoly(g, [eL, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, slateMid));
  line(g, r1, r2, 'k'); line(g, r1, r2, 'f', 1); line(g, eL, eB, 'k'); line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1] - 1], [r2[0] + 1, r2[1]], 'Q'); line(g, t.Rr, r2, 'k');
  return { r1, r2 };
};
/** gable roof, ridge along j (y axis) — left slope brightest, end gable on the lit left face */
const gableY = (t, rise) => {
  const m1 = lerp(t.T, t.Rr, 0.5), m2 = lerp(t.L, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eR = [t.Rr[0] + 1, t.Rr[1] + 2], eB = [t.Bm[0] + 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.L, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, -0.5, slateLit));
  pixPoly(g, [t.L, t.Bm, r2], '4'); paint(g, '4', (x, y) => course(x, y, 0, ashL));
  pixPoly(g, [eR, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, -0.5, slateDk));
  line(g, r1, r2, 'k'); line(g, r1, r2, 'f', 1); line(g, eR, eB, 'k'); line(g, eB, r2, 'k'); line(g, t.L, r2, 'k'); line(g, [t.L[0] + 1, t.L[1]], [r2[0], r2[1] + 1], 'l');
  return { r1, r2 };
};
const LANCET = `
..k..
.kik.
kiNik
kiNik
kiiik
kNiNk
kNiNk
kiiik
kiNik
kmmmk
`;
const LANCETR = LANCET.replace(/m/g, 's');
const lit = []; // candle-lit window cells, flickered per frame
const lancet = (x, y, tpl) => { pixStamp(g, Math.round(x) - 2, Math.round(y), tpl); lit.push([Math.round(x), Math.round(y) + 4]); };
const pinnacle = (x, y, hgt) => { x = Math.round(x); y = Math.round(y);
  for (let k = 0; k < hgt; k++) { pixSet(g, x - 1, y - k, 'k'); pixSet(g, x, y - k, 'l'); pixSet(g, x + 1, y - k, 'r'); pixSet(g, x + 2, y - k, 'k'); }
  pixStamp(g, x - 1, y - hgt - 5, `
.k..
.lk.
klrk
klrk
kkkk
`); };
const rose = (cx, cy, R) => { cx = Math.round(cx); cy = Math.round(cy); for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R + 0.4) continue;
  const a = (Math.atan2(y, x) * 6 / Math.PI + 12) % 2;
  pixSet(g, cx + x, cy + y, d > R - 0.6 ? 'k' : d > R - 1.6 ? 'q' : d < 1.3 ? 'G' : d < 2.3 ? 'k' : (Math.abs(a - 1) < 0.28 ? 'k' : (d < R * 0.62 ? 'R' : 'n'))); } };

// ---- plinth: two stepped courses
{ const t = pixIsoBox(g, bx, by, W, H, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 2, w: 9, joint: 'j', seam: 'j', tones: ['m', 'M'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 2, w: 9, joint: 'j', seam: 'j', tones: ['s', 'Q'] }));
  paint(g, '3', (x, y) => course(x, y, 0.5, { h: 6, w: 12, joint: 'z', seam: 'z', tones: ['y', 'Y', 'y'] })); }
{ const s2 = blockBm(0.3, 0.3, 4.4, 4.4); const t = pixIsoBox(g, s2[0], s2[1] - 4, 4.4, 4.4, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 2, w: 9, joint: 'j', seam: 'j', tones: ['l', 'm'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 2, w: 9, joint: 'j', seam: 'j', tones: ['r', 's'] }));
  paint(g, '3', (x, y) => course(x, y, 0.5, { h: 6, w: 12, joint: 'z', seam: 'z', tones: ['y', 'Y', 'x'] })); }

// ---- back arm of the transept (behind the nave)
const trB = block(2.0, 0.6, 1.5, 0.95, 34);
for (const f of [0.5]) { const a = lerp(trB.base.Bm, trB.base.Rr, f); lancet(a[0], a[1] - 28, LANCETR); }
gableY(trB, 18);

// ---- nave: tall ashlar walls, clerestory lancets, slate roof; west front on the right end
const nave = block(0.5, 1.55, 4, 1.9, 38);
for (let k = 0; k < 7; k++) { const a = lerp(nave.base.L, nave.base.Bm, (k + 0.5) / 7); lancet(a[0], a[1] - 36, LANCET); }
const nroof = gableX(nave, 24);
// west front: deep portal in team colour, rose window, corner pinnacles
{ const B = nave.base; const m = lerp(B.Bm, B.Rr, 0.5);
  rose(m[0], m[1] - 27, 7);
  pixStamp(g, Math.round(m[0]) - 6, Math.round(m[1]) - 19, `
....kkkkk....
...kqqqqqk...
..kqkkkkkqk..
.kqkTTTTTkqk.
kqkTTLTTDTkqk
kqkTLTTTDTkqk
kqkTLTTDTDkqk
kqkTLTkkTDkqk
kqkTLTkkTDkqk
kqkTLTTTTDkqk
kqkTLTTTTDkqk
kqkTLTTTTDkqk
kqkDDDDDDDkqk
kjjjjjjjjjjjk
`);
  for (const f of [0.18, 0.82]) { const a = lerp(B.Bm, B.Rr, f); lancet(a[0], a[1] - 26, LANCETR); } }

// ---- south aisle in front of the nave: lean-to roof, flying buttresses springing to the nave wall
const aisle = block(0.5, 3.45, 4, 0.75, 20);
for (let k = 0; k < 7; k++) { const a = lerp(aisle.base.L, aisle.base.Bm, (k + 0.5) / 7); lancet(a[0], a[1] - 17, LANCET); }
{ const up = (p, z) => [p[0], p[1] - z]; const aT = up(aisle.T, 9), aRr = up(aisle.Rr, 9);
  pixPoly(g, [aisle.L, aisle.Bm, aRr, aT], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, slateMid));
  line(g, aisle.L, aisle.Bm, 'k'); line(g, aisle.L, aisle.Bm, 'u', -1); line(g, aT, aRr, 'k');
  pixPoly(g, [aisle.Bm, aisle.Rr, aRr], '5'); paint(g, '5', (x, y) => course(x, y, 0, ashR)); line(g, aisle.Bm, aRr, 'k'); }
for (let k = 0; k <= 7; k++) { const t = k / 7; const ii = 0.5 + 4 * t; if (ii > 1.9 && ii < 3.6) continue; const a = lerp(aisle.base.L, aisle.base.Bm, t);
  const x = Math.round(a[0]) - 1, y = Math.round(a[1]);
  // pier on the aisle wall, rising past the lean-to into a pinnacle
  for (let yy = y - 1; yy > y - 30; yy--) { pixSet(g, x - 2, yy, 'k'); pixSet(g, x - 1, yy, 'l'); pixSet(g, x, yy, 'm'); pixSet(g, x + 1, yy, 'r'); pixSet(g, x + 2, yy, 'k'); }
  for (let yy = y - 1; yy > y - 12; yy--) { pixSet(g, x - 3, yy, 'k'); pixSet(g, x - 2, yy, 'l'); }
  pinnacle(x, y - 30, 4);
  // the flyer: a quarter arch from the pier to the clerestory wall
  for (let s = 0; s <= 20; s++) { const u = s / 20; const fx = x + 1 + u * 22, fy = y - 27 - u * 11 - Math.sin(u * Math.PI) * 4 - u * 8; pixSet(g, fx, fy, 'k'); pixSet(g, fx, fy + 1, 'r'); pixSet(g, fx, fy + 2, 'k'); } }

// ---- front arm of the transept: north portal and the great rose window on its lit gable end
const trF = block(2.0, 3.45, 1.5, 0.95, 34);
const troof = gableY(trF, 18);
{ const B = trF.base; const m = lerp(B.L, B.Bm, 0.5);
  rose(m[0], m[1] - 30, 8);
  pixStamp(g, Math.round(m[0]) - 6, Math.round(m[1]) - 17, `
....kkkkk....
...kmmmmmk...
..kmkkkkkmk..
.kmkTTTTTkmk.
kmkTLTTTDTkmk
kmkTLTTTDTkmk
kmkTLTTkkDkmk
kmkTLTTkkDkmk
kmkTLTTTTDkmk
kmkTLTTTTDkmk
kmkDDDDDDDkmk
kQQQQQQQQQQQk
`);
  for (const f of [0.12, 0.88]) { const a = lerp(B.L, B.Bm, f); pinnacle(a[0], a[1] - 32, 14); }
  const a = lerp(B.Bm, B.Rr, 0.5); lancet(a[0], a[1] - 28, LANCETR); }

// ---- crossing tower rising from the roofs, belfry lancets, team banners, corner pinnacles, crocketed spire with a gold tip
const TZ0 = 46, TZ = 84 - TZ0, SP = 84;
const tow = block(2.35, 1.9, 1.1, 1.1, TZ, PL + TZ0);
{ const B = tow.base; for (const f of [0.3, 0.7]) { const a = lerp(B.L, B.Bm, f); lancet(a[0], a[1] - TZ + 3, LANCET); const b2 = lerp(B.Bm, B.Rr, f); lancet(b2[0], b2[1] - TZ + 3, LANCETR); }
  line(g, [B.L[0], B.L[1] - 4], [B.Bm[0], B.Bm[1] - 4], 'k'); line(g, [B.Bm[0], B.Bm[1] - 4], [B.Rr[0], B.Rr[1] - 4], 'k'); }
// spire
const sB = { L: [tow.L[0] - 1, tow.L[1] + 1], Bm: [tow.Bm[0], tow.Bm[1] + 2], Rr: [tow.Rr[0] + 1, tow.Rr[1] + 1], T: tow.T };
const apex = pixIsoRoof(g, sB, SP, 1, { back: '6', left: '7', front: '8', right: '9' });
paint(g, '7', (x, y) => course(x, y, -0.5, slateLit)); paint(g, '8', (x, y) => course(x, y, 0.5, slateMid)); paint(g, '9', (x, y) => course(x, y, -0.5, slateDk)); paint(g, '6', () => 'V');
line(g, sB.L, sB.Bm, 'k'); line(g, sB.Bm, sB.Rr, 'k'); line(g, sB.Bm, apex, 'k'); line(g, [sB.Bm[0] - 1, sB.Bm[1]], [apex[0] - 1, apex[1]], 'f');
// crockets: little gold-lit knobs up the front hip
for (let k = 1; k < 8; k++) { const p = lerp(sB.Bm, apex, k / 8.5); pixSet(g, p[0] + 1, p[1], 'n'); pixSet(g, p[0] + 2, p[1], 'k'); }
for (const P of [tow.L, tow.Bm, tow.Rr]) pinnacle(P[0] + (P === tow.L ? 1 : P === tow.Rr ? -2 : 0), P[1], 4);
// team banners down the two visible tower faces, and long ones on the transept front
const BAN = `
kkkkkkk
kDTTTDk
kTTLTTk
kTLLLTk
kTTLTTk
kTTTTTk
kTTTTTk
kTTTTTk
kDTTTDk
.kTDTk.
..kDk..
...k...
`;
{ const a = lerp(tow.base.L, tow.base.Bm, 0.5); pixStamp(g, Math.round(a[0]) - 3, Math.round(a[1]) - 13, BAN); }
{ const B = trF.base; for (const f of [0.22, 0.78]) { const a = lerp(B.L, B.Bm, f); pixStamp(g, Math.round(a[0]) - 3, Math.round(a[1]) - 31, BAN); } }

const baseG = outline(g, 'k', { l: 'm', y: 'Y', U: 'u', f: 'u' });

// ---- idle: 4 frames — a glint runs up the gold spire tip and flashes; candlelight flickers in the windows
const ax = Math.round(apex[0]), ay = Math.round(apex[1]);
const TIP = `
...k...
..kwk..
..kGk..
.kkGkk.
kGGGGGk
.kkGkk.
..kGk..
..knk..
..knk..
.kGnNk.
`;
const frames = [];
for (let i = 0; i < 4; i++) {
  const f = copy(baseG);
  pixStamp(f, ax - 3, ay - 9, TIP);
  if (i === 1) { pixSet(f, ax, ay - 1, 'w'); }
  if (i === 2) { pixSet(f, ax, ay - 5, 'w'); pixSet(f, ax - 1, ay - 5, 'w'); pixSet(f, ax + 1, ay - 5, 'w'); }
  if (i === 3) { for (const [dx, dy] of [[0, -11], [0, -12], [-3, -5], [-4, -5], [3, -5], [4, -5], [0, -7]]) pixSet(f, ax + dx, ay + dy, 'w'); }
  lit.forEach(([x, y], k) => { const c = pixGet(baseG, x, y); if (c === 'i' || c === 'N') pixSet(f, x, y, (hash(k, i) < 0.35) ? 'O' : (hash(k, i + 9) < 0.5 ? 'o' : c)); });
  frames.push(pixText(f));
}

export default {
  id: 'wonder', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f',                                                         // ink
    l: '#f2ead6', m: '#e2d6ba', M: '#cbbd9c',                             // limestone lit: light / mid / shadow
    r: '#c7b994', s: '#ad9e7a', Q: '#8c7d60', q: '#b3a688', j: '#6f6450', // limestone shade, joints
    y: '#ddd1b4', Y: '#cfc2a2', x: '#c2b493', z: '#a69878',               // plinth top
    U: '#a3afbf', u: '#7a8698', v: '#5f6b7c', V: '#48525f', K: '#2f3640', f: '#b8c2ce', // slate
    i: '#1d2633', N: '#3f6fb8', R: '#b8342a', n: '#e1b12c', G: '#ffe28a', w: '#fffbe6', // glass, rose, gold, glint
    o: '#e89a3a', O: '#ffd36a',                                           // candlelight
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
