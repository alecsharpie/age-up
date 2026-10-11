// @pixel stable
// Stable (3×3): a long stall block along the back-right edge under a hipped roof of wooden shingles laid in courses,
// team-colour fascia boards on the eaves; six open bays on its lit long face with team-colour half-doors, three horses
// (bay, grey, black) looking out over them and hay racks in the others. In front, a fenced paddock with a muddy floor,
// a water trough and a bay horse; hay bales stacked at the end, a hay pile and a pitchfork. Generated (code before
// export); anchor = footprint bottom corner. idle: 4 frames — a stall horse bobs its head, the paddock horse swishes
// its tail and flicks an ear, another stall horse turns its head.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 46;
const bx = W * 32 + 2, by = GH - 4;
// ---- local texture kit (needs GW, GH, by) ----
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const P = (p, dx = 0, dy = 0) => [p[0] + dx, p[1] + dy];
const hash = (x, y, s = 0) => { let h = Math.imul((x | 0) + 7919 * s, 374761393) ^ Math.imul((y | 0) - 104729 * s, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// smooth value noise on a lattice of `sc` cells (for clustered ground patches, never per-pixel noise)
const vnoise = (x, y, sc, s) => { const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0; const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s); const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
/** cells whose centre lies inside the polygon (same rule as pixPoly) */
function cells(pts) {
  const out = []; const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(GH - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [qx, qy] = pts[(i + 1) % pts.length]; if ((ay <= cy && qy > cy) || (qy <= cy && ay > cy)) xs.push(ax + (cy - ay) / (qy - ay) * (qx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(GW - 1, Math.floor(xs[k + 1] - 0.5)); x++) out.push([x, y]);
  }
  return out;
}
const put = (g, x, y, ch) => { if (ch && y >= 0 && y < GH && x >= 0 && x < GW) g[y][x] = ch; };
/** vertical wall face whose top edge runs A→B, z cells tall. fn(a, v, u, x, y): a = columns from A, v = rows below the top edge. */
function wall(g, A, B, z, fn) {
  const a0 = Math.floor(A[0]);
  for (const [x, y] of cells([A, B, P(B, 0, z), P(A, 0, z)])) { const u = Math.max(0, Math.min(1, (x + 0.5 - A[0]) / (B[0] - A[0]))); const ty = A[1] + u * (B[1] - A[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(y + 0.5 - ty)), u, x, y)); }
}
/** sloped plane (roof): fn(a, d, u, x, y) with d = rows above the eave line E0→E1, a = columns from E0.
 *  flip: the plane slopes away from the viewer (a back roof slope whose eave sits above its ridge on screen), so downhill is
 *  up the screen and d counts rows *below* the eave instead; course helpers like tiles() then lap the right way. */
function plane(g, pts, E0, E1, fn, flip = false) {
  const a0 = Math.floor(E0[0]);
  for (const [x, y] of cells(pts)) { const u = (x + 0.5 - E0[0]) / (E1[0] - E0[0]); const ey = E0[1] + u * (E1[1] - E0[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(flip ? y + 0.5 - ey : ey - y - 0.5)), u, x, y)); }
}
/** coursed ashlar: o = {t:[lit,mid,dark], m:mortar, ch, bw, s, q:[quoinLit,quoinDark]?, qa:[a-ranges at corners], len, ao} */
const stone = o => (a, v, u) => {
  const c = Math.floor(v / o.ch), r = v % o.ch;
  if (o.q && o.len) { const w = c % 2 ? 4 : 7; if (o.qL && a < w || o.qR && a >= o.len - w) { if (r === o.ch - 1 || a === w && o.qL || a === o.len - w && o.qR) return o.m; return r === 0 ? o.q[0] : o.q[1]; } }
  if (r === o.ch - 1) return o.m;
  const off = c % 2 ? (o.bw >> 1) : 0, j = a + off + c * 3;
  if (((j % o.bw) + o.bw) % o.bw === 0) return o.m;
  const t = hash(Math.floor(j / o.bw), c, o.s) + (o.ao ? v / o.ao * 0.3 : 0);
  const k = t < 0.3 ? 0 : t < 0.85 ? 1 : 2;
  return r === 0 ? o.t[Math.max(0, k - 1)] : o.t[k];
};
/** horizontal planks following the face: o = {t:[lit,mid,seam], ph, s, nail} */
const planks = o => (a, v) => { const r = v % o.ph, c = Math.floor(v / o.ph); if (r === o.ph - 1) return o.t[2]; if (o.nail && r === 1 && ((a + c * 5) % 11) === 0) return o.nail; const gr = hash(Math.floor((a + c * 7) / 9), c, o.s); return r === 0 ? o.t[0] : (gr < 0.25 ? o.t[0] : o.t[1]); };
/** vertical boards (doors, sheds): o = {t:[lit,mid,seam], bw} */
const boards = o => (a, v) => { const k = ((a % o.bw) + o.bw) % o.bw; return k === o.bw - 1 ? o.t[2] : k === 0 ? o.t[0] : o.t[1]; };
/** roof courses (tiles / shingles): o = {t:[lip,mid,shadow], ch, tw, s}; lip on the butt edge, shadow cast by the course above */
const tiles = o => (a, d) => { const c = Math.floor(d / o.ch), r = d % o.ch; if (r === o.ch - 1) return o.t[2]; const j = a + (c % 2) * (o.tw >> 1); if (r > 0 && ((j % o.tw) + o.tw) % o.tw === 0) return o.t[2]; if (r === 0) return o.t[0]; return (o.t[3] && hash(Math.floor(j / o.tw), c, o.s) < 0.18) ? o.t[3] : o.t[1]; };
/** outer 1-px ink outline; lit (upper-left) side softer. Pixels of `self` chars are thin props that carry their own dark edge. */
function outline(g, ink, inkLit, self = '') {
  const add = [];
  for (let y = 0; y < Math.min(GH, by); y++) for (let x = 0; x < GW; x++) {
    if (g[y][x] !== '.') continue;
    const sol = (xx, yy) => yy >= 0 && yy < GH && xx >= 0 && xx < GW && g[yy][xx] !== '.' && !self.includes(g[yy][xx]);
    const r = sol(x + 1, y), d = sol(x, y + 1), l = sol(x - 1, y), u = sol(x, y - 1);
    if (r || d || l || u) add.push([x, y, (r || d) && !(l || u) ? inkLit : ink]);
  }
  for (const [x, y, c] of add) g[y][x] = c;
}
const copy = g => g.map(r => r.slice());
/** draw into a fresh layer, ink its outline, composite it: props and masses get their own dark edge inside the silhouette */
function inked(g, draw, ink = 'k', inkLit = 'K', self = '') { const t = pixGrid(GW, GH); draw(t); outline(t, ink, inkLit, self); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (t[y][x] !== '.') g[y][x] = t[y][x]; }
const stampL = (g, x, y, text) => pixStamp(g, Math.round(x), Math.round(y), text);
const g = pixGrid(GW, GH);
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- ground: earth with straw clusters; the paddock (front-left) trodden to mud with hoof marks
const iso = (tx, ty) => [bx + (tx - ty) * 32, by - 98 + (tx + ty) * 16];            // a point on the ground (top of the plinth)
const PAD = { ty: 1.55, tx: 2.1 };
const inPad = (x, y) => { const d = (x - bx) / 32, s = (y - by + 98) / 16, tx = (s + d) / 2, ty = (s - d) / 2; return ty > PAD.ty && tx < PAD.tx; };
for (const [x, y] of cells([T, Rr, Bm, L])) {
  const n = vnoise(x, y, 7, 4), s = vnoise(x, y, 3, 9);
  let ch = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : 'y';
  if (inPad(x, y)) ch = n < 0.45 ? 'J' : n > 0.8 ? 'y' : 'Y';
  else if (s > 0.86) ch = 'j';
  g[y][x] = ch;
}
for (const [x, y] of [[40, 104], [54, 112], [70, 118], [46, 96], [84, 122], [62, 104]]) { g[y][x] = 'u'; g[y][x + 1] = 'u'; g[y + 1][x + 1] = 'J'; }

// ---- the stall block
const st = pixIsoBox(g, 156, 107, 3, 1.2, 18, 1, {});
const sb = st.base;
const RISE = 15;
const mL = lerp(st.T, st.L, 0.5), mR = lerp(st.Rr, st.Bm, 0.5);
const r1 = P(lerp(mL, mR, 0.12), 0, -RISE), r2 = P(lerp(mL, mR, 0.88), 0, -RISE);
const HORSES = { bay: 'CcnNM', grey: 'AaBGg', black: 'FfNkM' };
const HEAD = `
....44....
...4224...
..112224..
.112e2224.
1122222234
1122.22334
552..22334
55...23334
.....23334
`;
const paintHorse = (t, x, y, text, cols) => pixStamp(t, x, y, text.replace(/[1-5e]/g, ch => ch === 'e' ? 'k' : cols['12345'.indexOf(ch) === -1 ? 0 : '12345'.indexOf(ch)]));
inked(g, t => {
  // back plane + short shaded end wall
  wall(t, st.Bm, st.Rr, 18, (a, v) => v < 2 ? 'u' : v >= 16 ? 'u' : planks({ t: ['w', 't', 'u'], ph: 3, s: 21 })(a, v));
  wall(t, st.Bm, st.Rr, 18, (a, v) => a >= 14 && a <= 22 && v >= 4 && v <= 10 ? (v === 4 || a === 14 || a === 22 ? 'u' : v === 10 ? 'w' : 'I') : null);  // hay loft door
  // the open long face: lintel, six bays, posts, team half-doors
  wall(t, st.L, st.Bm, 18, (a, v) => {
    const bay = Math.floor(a / 16), k = a - bay * 16;
    if (v === 0) return 'W'; if (v === 1) return 't'; if (v === 2) return 'u';
    if (k <= 1) return k === 0 ? 'w' : 't';                                                 // posts
    if (v === 17) return 'u';
    if (v >= 11) return v === 11 ? 'L' : (k === 2 ? 'D' : (k % 3 === 0 ? 'D' : 'T'));          // half-door
    return v <= 4 ? 'I' : 'i';                                                               // stall interior
  });
  // hay racks in the empty bays
  for (const bay of [1, 3, 5]) { const p = lerp(st.L, st.Bm, (bay * 16 + 4) / 96); stampL(t, p[0], p[1] + 5, `
u.u.u.u.u.u
hHhhHhhHhh.
.HhhhHhhH..
`); }
  // corner post at the front arris
  pixLine(t, st.Bm[0], st.Bm[1], st.Bm[0], st.Bm[1] + 17, 'u');
  // roof: back plane, lit hip, front plane, shaded hip; shingles in courses with a lit butt and a shadow line
  // the back plane slopes away: its eave T→Rr sits above the ridge on screen, so its courses lap upward (flip)
  plane(t, [st.T, st.Rr, r2, r1], st.T, st.Rr, tiles({ t: ['P', 'R', 'p'], ch: 3, tw: 5, s: 22 }), true);
  plane(t, [st.L, st.T, r1], st.L, st.T, tiles({ t: ['O', 'Q', 'P'], ch: 3, tw: 5, s: 23 }));
  { const hi = tiles({ t: ['V', 'O', 'Q'], ch: 3, tw: 5, s: 24 }), mid = tiles({ t: ['O', 'Q', 'q', 'P'], ch: 3, tw: 5, s: 24 }), lo = tiles({ t: ['Q', 'q', 'P'], ch: 3, tw: 5, s: 24 });
    plane(t, [st.L, st.Bm, r2, r1], st.L, st.Bm, (a, d, u) => d >= 21 ? hi(a, d) : d < 6 ? lo(a, d) : mid(a, d)); }
  plane(t, [st.Bm, st.Rr, r2], st.Bm, st.Rr, tiles({ t: ['R', 'p', 'u'], ch: 3, tw: 5, s: 25 }));
  pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); pixLine(t, r1[0], r1[1] + 1, r2[0], r2[1] + 1, 'O');
  for (const [a, b] of [[st.L, r1], [st.T, r1], [st.Bm, r2], [st.Rr, r2]]) pixLine(t, a[0], a[1], b[0], b[1], 'u');
  // team fascia boards along both visible eaves
  for (const [a, b, c1, c2] of [[st.L, st.Bm, 'T', 'D'], [st.Bm, st.Rr, 'D', 'D']]) { pixLine(t, a[0], a[1], b[0], b[1], c1); pixLine(t, a[0], a[1] + 1, b[0], b[1] + 1, c2); }
});

// ---- hay bales stacked at the left end, a hay pile and a pitchfork at the front corner
inked(g, t => {
  // the top bale rests on the two below it
  stampL(t, 46, 55, `
...hhhhhhh...
..hHhhhhhHhE.
.hhhhhhhhhhEe
.EeEEEEEEEEEe
.hHhhhHhhhhEe
.EEEEEEEEEEEe
`);
  stampL(t, 40, 60, `
..hhhhhhh..hhhhhhh..
.hHhhhhhHE.hHhhhhHE.
hhhhhhhhhEehhhhhhhEe
EeEEEEEEEEeEEEEEEEEe
hHhhhHhhhEehHhhhhhEe
EEEEEEEEEEeEEEEEEEEe
`);
});
inked(g, t => {
  stampL(t, 150, 104, `
.....hhh......
...hhHhhhh....
..hHhhhHhhhE..
.hhhhhhhhhEEe.
hHhhEhhhhEEEee
`);
  pixLine(t, 166, 108, 160, 92, 'w'); pixSet(t, 159, 91, 'G'); pixSet(t, 161, 91, 'G'); pixSet(t, 159, 90, 'S'); pixSet(t, 161, 90, 'S');
});

// ---- paddock: inner fence, water trough
const fence = (t, a, b, n) => {
  for (let k = 0; k <= n; k++) { const p = lerp(a, b, k / n); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x, y - 8, 1, 8, 'u'); pixSet(t, x, y - 9, 'w'); }
  for (const [h, c] of [[7, 'W'], [6, 't'], [3, 't']]) for (let i = 0; i <= 64; i++) { const p = lerp(a, b, i / 64); put(t, Math.floor(p[0]), Math.floor(p[1]) - h, c); }
};
fence(g, iso(0, PAD.ty), iso(PAD.tx, PAD.ty), 6);                                        // back runs of the paddock fence
fence(g, iso(0, PAD.ty), iso(0, 3), 4);
inked(g, t => {
  const tp = iso(1.55, 1.95); const q = pixIsoBox(t, tp[0], tp[1], 0.42, 0.18, 5, 1, {});
  wall(t, q.L, q.Bm, 5, planks({ t: ['W', 'w', 't'], ph: 2, s: 31 })); wall(t, q.Bm, q.Rr, 5, planks({ t: ['w', 't', 'u'], ph: 2, s: 32 }));
  for (const [x, y] of cells([q.T, q.Rr, q.Bm, q.L])) t[y][x] = 'b';
  pixLine(t, q.L[0], q.L[1], q.T[0], q.T[1], 'W'); pixLine(t, q.T[0], q.T[1], q.Rr[0], q.Rr[1], 'w');
  pixLine(t, q.L[0] + 3, q.L[1], q.Bm[0] - 2, q.Bm[1] - 1, 'B');
});

// ---- animated: horses
const BODY = [`
....44..............
...4224.............
..12224.............
.112e224............
1122.2224....1......
55...12224111111.4..
5.....12222222222244
......122222222223344
......122222222333344
.......2223333333334.
.......3.3.....3..3..
.......3.3.....3..3..
.......k.k.....k..k..
`];
function horses(t, f) {
  const cols = s => s.split('');
  const heads = [['bay', 0, [0, 1, 1, 0][f]], ['grey', 2, 0], ['black', 4, [0, 0, 1, 1][f]]];
  for (const [kind, bay, dy] of heads) {
    const p = lerp(st.L, st.Bm, (bay * 16 + 4) / 96);
    let txt = HEAD; if (kind === 'grey' && (f === 2 || f === 3)) txt = txt.split('\n').map(r => r.split('').reverse().join('')).join('\n');   // turns its head
    paintHorse(t, p[0], p[1] + 4 + dy, txt, cols(HORSES[kind]));
  }
  // the paddock horse: tail swish and an ear flick
  let b = BODY[0];
  const tail = [[[17, 5], [18, 6], [19, 6], [19, 7], [20, 8]], [[17, 5], [18, 6], [18, 7], [19, 8], [19, 9]], [[17, 5], [18, 6], [18, 7], [18, 8], [18, 9]], [[17, 5], [18, 6], [19, 7], [19, 8], [20, 9]]][f];
  b = b.replace(/4(?=\.\.\n|4\n|44\n|\.\n)/g, '.');
  const rows = b.replace(/^\n|\n$/g, '').split('\n').map(r => r.split(''));
  for (let y = 4; y < rows.length; y++) for (let x = 16; x < rows[y].length; x++) if (rows[y][x] === '4') rows[y][x] = '.';
  for (const [x, y] of tail) { while (rows[y].length <= x) rows[y].push('.'); rows[y][x] = '4'; }
  if (f === 1) { rows[0][4] = '.'; rows[1][3] = '4'; }
  paintHorse(t, iso(0.75, 2.3)[0] - 10, iso(0.75, 2.3)[1] - 12, '\n' + rows.map(r => r.join('')).join('\n') + '\n', cols(HORSES.bay));
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  inked(q, t => horses(t, f));
  // the paddock's front fence goes over the horse
  fence(q, iso(0, 3), iso(PAD.tx, 3), 6); fence(q, iso(PAD.tx, PAD.ty), iso(PAD.tx, PAD.ty + 0.55), 2); fence(q, iso(PAD.tx, 2.55), iso(PAD.tx, 3), 2);
  outline(q, 'k', 'K');
  frames.push(pixText(q));
}

export default {
  id: 'stable', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f', K: '#4a3520',                                              // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730', z: '#7d6236', x: '#5e4a28', // earth, mud, plinth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#241a12', // timber, stall dark
    V: '#d8b277', O: '#c49a5c', Q: '#a07a44', q: '#8a6a3a', P: '#7a5a30', R: '#6a4a2a', p: '#4a3520', // shingles lit → shade
    h: '#e6c272', H: '#d8ab4f', E: '#b58a3c', e: '#8f6a2c',                  // hay
    C: '#b07a4a', c: '#8a5530', n: '#5a3520', N: '#2e2018', M: '#4a3428',    // bay horse
    A: '#ece6da', a: '#c8c0b2', B: '#9a9285', b: '#2f6fb0', G: '#5f656c', S: '#9aa0a6', // grey horse; water; iron
    F: '#5e524a', f: '#2e2826', g: '#6e6a64',                                              // black horse
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
