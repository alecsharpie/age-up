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
const fall = (p, q) => (p[0] - q[0]) / (p[1] - q[1]);   // screen dx per dy from q down to p (a roof's fall line)
const slateLit = { h: 3, w: 4, joint: 'v', seam: 'v', lip: 'U', tones: ['u', 'u', 'U'] };
const slateMid = { h: 3, w: 4, joint: 'V', seam: 'V', lip: 'u', tones: ['v', 'v', 'u'] };
const slateDk = { h: 3, w: 4, joint: 'K', seam: 'K', lip: 'v', tones: ['V'] };
/** gable roof, ridge along i (x axis) — front slope lit-ish, end gable on the right face */
const gableX = (t, rise) => {
  const m1 = lerp(t.T, t.L, 0.5), m2 = lerp(t.Rr, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eL = [t.L[0] - 1, t.L[1] + 2], eB = [t.Bm[0] - 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.Rr, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, 0.5, { ...slateDk, flip: true, fall: fall(t.T, r1) }));   // back slope: downhill is up the screen
  pixPoly(g, [t.Rr, t.Bm, r2], '5'); paint(g, '5', (x, y) => course(x, y, -0.5, ashR));   // gable: the wall's own courses
  pixPoly(g, [eL, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(eL, r1) }));
  line(g, r1, r2, 'k'); line(g, r1, r2, 'f', 1); line(g, eL, eB, 'k'); line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1] - 1], [r2[0] + 1, r2[1]], 'Q'); line(g, t.Rr, r2, 'k');
  return { r1, r2 };
};
/** gable roof, ridge along j (y axis) — left slope brightest, end gable on the lit left face */
const gableY = (t, rise) => {
  const m1 = lerp(t.T, t.Rr, 0.5), m2 = lerp(t.L, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eR = [t.Rr[0] + 1, t.Rr[1] + 2], eB = [t.Bm[0] + 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.L, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, -0.5, { ...slateLit, flip: true, fall: fall(t.T, r1) }));  // back slope
  pixPoly(g, [t.L, t.Bm, r2], '4'); paint(g, '4', (x, y) => course(x, y, 0.5, ashL));   // gable: the wall's own courses
  pixPoly(g, [eR, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, -0.5, { ...slateDk, fall: fall(eR, r1) }));
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
const lancet = (x, y, tpl) => { stampOn(g, Math.round(x) - 2, Math.round(y), tpl, tpl === LANCET ? 0.5 : -0.5); lit.push([Math.round(x), Math.round(y) + 4]); };
const pinnacle = (x, y, hgt) => { x = Math.round(x); y = Math.round(y);
  for (let k = 0; k < hgt; k++) { pixSet(g, x - 1, y - k, 'k'); pixSet(g, x, y - k, 'l'); pixSet(g, x + 1, y - k, 'r'); pixSet(g, x + 2, y - k, 'k'); }
  pixStamp(g, x - 1, y - hgt - 5, `
.k..
.lk.
klrk
klrk
kkkk
`); };
/** rose window lying flat on a wall of the given eave slope */
const rose = (cx, cy, R, slope) => discOn(g, Math.round(cx), Math.round(cy), R, slope, (x, y) => { const d = Math.hypot(x, y), a = (Math.atan2(y, x) * 6 / Math.PI + 12) % 2;
  return d > R - 0.6 ? 'k' : d > R - 1.6 ? 'q' : d < 1.3 ? 'G' : d < 2.3 ? 'k' : (Math.abs(a - 1) < 0.28 ? 'k' : (d < R * 0.62 ? 'R' : 'n')); });

// ---- plinth: two stepped courses
{ const t = pixIsoBox(g, bx, by, W, H, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['m', 'M'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['s', 'Q'] }));
  paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 10, ox: bx, oy: by, joint: 'z', tones: ['y', 'Y', 'y'] })); }   // flagstones flat on the ground
{ const s2 = blockBm(0.3, 0.3, 4.4, 4.4); const t = pixIsoBox(g, s2[0], s2[1] - 4, 4.4, 4.4, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['l', 'm'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['r', 's'] }));
  paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 10, ox: bx, oy: by - 4, joint: 'z', tones: ['y', 'Y', 'x'] })); }

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
  rose(m[0], m[1] - 27, 7, -0.5);
  // the portal stands on the wall's foot (its sill row is the bottom course), with a stone step out onto the paving
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]) - 14, `
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
`, -0.5);
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]), `
krrrrrrrrrrrrk
.kkkkkkkkkkkkkk
`, -0.5);
  for (const f of [0.18, 0.82]) { const a = lerp(B.Bm, B.Rr, f); lancet(a[0], a[1] - 26, LANCETR); } }

// ---- south aisle in front of the nave: lean-to roof, flying buttresses springing to the nave wall
const aisle = block(0.5, 3.45, 4, 0.75, 20);
for (let k = 0; k < 7; k++) { const a = lerp(aisle.base.L, aisle.base.Bm, (k + 0.5) / 7); lancet(a[0], a[1] - 17, LANCET); }
{ const up = (p, z) => [p[0], p[1] - z]; const aT = up(aisle.T, 9), aRr = up(aisle.Rr, 9);
  pixPoly(g, [aisle.L, aisle.Bm, aRr, aT], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(aisle.L, aT) }));
  line(g, aisle.L, aisle.Bm, 'k'); line(g, aisle.L, aisle.Bm, 'u', -1); line(g, aT, aRr, 'k');
  pixPoly(g, [aisle.Bm, aisle.Rr, aRr], '5'); paint(g, '5', (x, y) => course(x, y, 0, ashR)); line(g, aisle.Bm, aRr, 'k'); }
for (let k = 0; k <= 7; k++) { const t = k / 7; const ii = 0.5 + 4 * t; if (ii > 1.9 && ii < 3.6) continue; const a = lerp(aisle.base.L, aisle.base.Bm, t);
  const x = Math.round(a[0]) - 1, y = Math.round(a[1]);
  // pier on the aisle wall, rising past the lean-to into a pinnacle
  for (let yy = y - 1; yy > y - 30; yy--) { pixSet(g, x - 2, yy, 'k'); pixSet(g, x - 1, yy, 'l'); pixSet(g, x, yy, 'm'); pixSet(g, x + 1, yy, 'r'); pixSet(g, x + 2, yy, 'k'); }
  for (let yy = y - 1; yy > y - 12; yy--) { pixSet(g, x - 3, yy, 'k'); pixSet(g, x - 2, yy, 'l'); }
  pinnacle(x, y - 30, 4);
  // the flyer: a quarter arch from the pier to the clerestory wall (the corner piers have no wall behind them to spring to)
  if (k === 0 || k === 7) continue;
  for (let s = 0; s <= 20; s++) { const u = s / 20; const fx = x + 1 + u * 22, fy = y - 27 - u * 11 - Math.sin(u * Math.PI) * 4 - u * 8; pixSet(g, fx, fy, 'k'); pixSet(g, fx, fy + 1, 'r'); pixSet(g, fx, fy + 2, 'k'); } }

// ---- front arm of the transept: north portal and the great rose window on its lit gable end
// The aisle runs on past the transept's right face (i 3.5..4.5), so its wall and lean-to stand in front of that face's back
// part: `underTrF` keeps them so those cells can be restored once the transept is dressed.
const underTrF = copy(g);
const trF = block(2.0, 3.45, 1.5, 0.95, 34);
const troof = gableY(trF, 18);
{ const B = trF.base; const m = lerp(B.L, B.Bm, 0.5);
  rose(m[0], m[1] - 30, 8, 0.5);
  // the portal stands on the wall's foot (its sill row is the bottom course), with a stone step out onto the paving
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]) - 12, `
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
`, 0.5);
  stampOn(g, Math.round(m[0]) - 7, Math.round(m[1]), `
kllllllllllllk
kkkkkkkkkkkkkk.
`, 0.5);
  for (const f of [0.12, 0.88]) { const a = lerp(B.L, B.Bm, f); pinnacle(a[0], a[1] - 32, 14); }
  const a = lerp(B.Bm, B.Rr, 0.12); lancet(a[0], a[1] - 28, LANCETR); }   // clear of the aisle roof
{ const aisleZ = j => j > 4.2 ? -1 : PL + 20 + 9 * (4.2 - j) / 0.75;          // aisle wall / lean-to surface in front of the face
  const hid = (x, y) => { if (x <= trF.base.Bm[0]) return false; const j = 3.5 - (x + 0.5 - bx) / 32, z = by - 160 + (3.5 + j) * 16 - (y + 0.5); return z < aisleZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTrF[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTrF[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'j'; }

// ---- crossing tower rising from the roofs, belfry lancets, team banners, corner pinnacles, crocketed spire with a gold tip
const TZ0 = 46, TZ = 84 - TZ0, SP = 84;
// The crossing tower stands on the nave's ridge: the nave roof is in front of its lower faces (a gable-shaped bite out of the
// right face, a few rows off the left), so those cells are restored from `underTow` once the tower is dressed.
const underTow = copy(g);
const tow = block(2.35, 1.9, 1.1, 1.1, TZ, PL + TZ0);
{ const B = tow.base; for (const f of [0.3, 0.7]) { const a = lerp(B.L, B.Bm, f); lancet(a[0], a[1] - TZ + 3, LANCET); const b2 = lerp(B.Bm, B.Rr, f); lancet(b2[0], b2[1] - TZ + 3, LANCETR); }
  line(g, [B.L[0], B.L[1] - 4], [B.Bm[0], B.Bm[1] - 4], 'k'); line(g, [B.Bm[0], B.Bm[1] - 4], [B.Rr[0], B.Rr[1] - 4], 'k'); }
// spire
const sB = { L: [tow.L[0] - 1, tow.L[1] + 1], Bm: [tow.Bm[0], tow.Bm[1] + 2], Rr: [tow.Rr[0] + 1, tow.Rr[1] + 1], T: tow.T };
const apex = pixIsoRoof(g, sB, SP, 1, { back: '6', left: '7', front: '8', right: '9' });
paint(g, '7', (x, y) => course(x, y, -0.5, { ...slateLit, fall: fall(lerp(sB.T, sB.L, 0.5), apex) })); paint(g, '8', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(lerp(sB.L, sB.Bm, 0.5), apex) }));
paint(g, '9', (x, y) => course(x, y, -0.5, { ...slateDk, fall: fall(lerp(sB.Bm, sB.Rr, 0.5), apex) })); paint(g, '6', () => 'V');
line(g, sB.L, sB.Bm, 'k'); line(g, sB.Bm, sB.Rr, 'k'); line(g, sB.Bm, apex, 'k'); line(g, [sB.Bm[0] - 1, sB.Bm[1]], [apex[0] - 1, apex[1]], 'f');
// crockets: little gold-lit knobs up the front hip
for (let k = 1; k < 8; k++) { const p = lerp(sB.Bm, apex, k / 8.5); pixSet(g, p[0] + 1, p[1], 'n'); pixSet(g, p[0] + 2, p[1], 'k'); }
for (const P of [tow.L, tow.Bm, tow.Rr]) pinnacle(P[0] + (P === tow.L ? 1 : P === tow.Rr ? -2 : 0), P[1], 4);
// team banners down both visible tower faces, under the belfry lancets; painted before the nave roof is restored in front
// of the tower's foot, so the roof hides their lower ends
{ const a = lerp(tow.base.L, tow.base.Bm, 0.5); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 26, 0.5, 10, 26, { charge: 'cross' }); }
{ const a = lerp(tow.base.Bm, tow.base.Rr, 0.5); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 26, -0.5, 10, 26, { charge: 'cross' }); }
{ const naveZ = j => j >= 2.5 ? PL + 36 + 26 * (3.45 - j) / 0.95 : PL + 38 + 24 * (j - 1.55) / 0.95;   // nave roof surface height
  const hid = (x, y) => { const cx = x + 0.5 - bx, cy = y + 0.5; let i, j; if (cx <= tow.base.Bm[0] - bx) { j = 3.0; i = 3.0 + cx / 32; } else { i = 3.45; j = 3.45 - cx / 32; }
    return by - 160 + (i + j) * 16 - cy < naveZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTow[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTow[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'Q'; }
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
// (teamBanner, civic kit: gilt rod, gilt borders and fringe, gilt charge — the Imperial banner every civic building shares)
{ const B = trF.base; for (const f of [0.22, 0.78]) { const a = lerp(B.L, B.Bm, f); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 33, 0.5, 10, 29); } }
// the west front: long banners either side of the portal
{ const B = nave.base; for (const f of [0.29, 0.71]) { const a = lerp(B.Bm, B.Rr, f); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 21, -0.5, 10, 20); } }

// weathering low on the walls (moss, damp, a few rain streaks); grass over the foot of the plinth
weather(g, nave.base.L, nave.base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: 4, seed: 2, H: 34, streaks: 0.04 });
weather(g, aisle.base.L, aisle.base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: 4, seed: 5, H: 18, streaks: 0.04 });
weather(g, nave.base.Bm, nave.base.Rr, 'rsQ', { r: 's', s: 'Q' }, { rows: 4, seed: 7, H: 34, streaks: 0.04 });
const baseG = outline(g, 'k', { l: 'm', y: 'Y', U: 'u', f: 'u' });
{ const P = [[bx - 160, by - 80], [bx, by], [bx + 160, by - 80]]; tufts(baseG, P[0], P[1], { n: 2, seed: 3 }); tufts(baseG, P[1], P[2], { n: 2, seed: 4 }); }

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
    ...AK.pal, ...NPAL,
    k: '#24180f',                                                         // ink
    l: '#f2ead6', m: '#e2d6ba', M: '#cbbd9c',                             // limestone lit: light / mid / shadow
    r: '#c7b994', s: '#ad9e7a', Q: '#8c7d60', q: '#b3a688', j: '#6f6450', // limestone shade, joints
    y: '#ddd1b4', Y: '#cfc2a2', x: '#c2b493', z: '#a69878',               // plinth top
    U: '#a3afbf', u: '#7a8698', v: '#5f6b7c', V: '#48525f', K: '#2f3640', f: '#b8c2ce', // slate
    i: '#1d2633', N: '#3f6fb8', R: '#b8342a', n: '#e1b12c', G: '#ffe28a', w: '#fffbe6', // glass, rose, gold, glint
    o: '#e89a3a', O: '#ffd36a',                                           // candlelight
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  roofChars: 'UuvVKf',
  frames: { idle: frames },
};
