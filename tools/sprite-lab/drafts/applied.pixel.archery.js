// @pixel archery
// Archery Range (3×3): a packed-earth range on a low plinth. Along the back-left edge an open timber shooting shed
// under a lean-to awning striped in team colour and canvas, with a scalloped valance; bows and quivers hang inside.
// Worn shooting lanes lead to three straw butts on A-frame stands (red/white rings, gold centre) with arrows stuck
// in them; a rail fence with a gap and an arrow barrel at the shooting line. Generated (code before export); anchor = footprint
// bottom corner. idle: 4 frames — the awning valance flutters.
const W = 3, H = 3, Z = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
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
const tile = (tx, ty) => [bx + (tx - ty) * 32, by - 96 + (tx + ty) * 16 + 16];
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- ground: packed earth in patches, three worn lanes from the shed to the butts, a chalk shooting line
for (const [x, y] of cells([T, Rr, Bm, L])) { const n = vnoise(x, y, 8, 2); g[y][x] = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : 'y'; }
// (tile() sits ~0.56 tile in from the footprint's back corner, so the front lane and butt use ty 2.25, not 2.5, to stay on the plinth)
const LANE = [0.5, 1.5, 2.25];
for (let ty = 0; ty < 3; ty++) {
  const a = tile(0.75, LANE[ty]), b = tile(2.35, LANE[ty]);
  for (const [x, y] of cells([P(a, -4, -2), P(b, -4, -2), P(b, 4, 2), P(a, 4, 2)])) { const n = vnoise(x, y, 4, 7 + ty); if (g[y][x] !== '.') g[y][x] = n > 0.45 ? 'j' : 'y'; }
}
{ const a = tile(0.62, 0.15), b = tile(0.62, 2.55); for (let k = 0; k <= 40; k++) if (k % 4 < 3) { const p = lerp(a, b, k / 40), x = Math.round(p[0]), y = Math.round(p[1]); if ('yYj'.includes(g[y][x])) g[y][x] = 'B'; } }   // chalk only on the range floor, not past the plinth edge
for (const [x, y] of [[120, 70], [64, 112], [150, 100], [92, 92], [176, 90]]) { g[y][x] = 'J'; g[y][x + 1] = 'Y'; }

// ---- straw butts: a disc in the plane that faces the shed (sheared ellipse), bale thickness behind, A-frame stand
// Clean concentric rings (straw rim, white, red, white, red, gold), a splayed A-frame with a crossbar and a back prop, a
// contact shadow on the earth, and one or two arrows drawn after the inking so their fletching stays crisp.
function buttShadow(c) { for (const [x, y] of cells([P(c, -5, 12), P(c, 3, 9), P(c, 12, 12), P(c, 4, 15)])) if ('yYj'.includes(g[y][x])) g[y][x] = 'J'; }
function butt(t, c) {
  const R = 6.6, AX = 0.82;
  const disc = (ox, oy, fn) => { for (let y = Math.floor(c[1] - 10); y <= c[1] + 10; y++) for (let x = Math.floor(c[0] - 9); x <= c[0] + 9; x++) { const U = (c[0] + ox - x - 0.5) / AX, V = c[1] + oy - (y + 0.5); const r = Math.hypot(U, V); if (r < R) put(t, x, y, fn(r, U, V)); } };
  // back prop first (behind the bale), then the bale side, then the painted face, then the front legs
  for (let s = 3; s >= 1; s--) disc(s * 0.9, s * 0.3, () => s === 3 ? 'e' : 'E');
  disc(0, 0, (r, U, V) => r > 5.4 ? (V - U > 2 ? 'h' : V - U < -3 ? 'E' : 'H') : r > 4.3 ? 'A' : r > 3.1 ? 'r' : r > 1.9 ? 'A' : r > 0.9 ? 'r' : 'g');
}
// the stand: thin 1-px timbers drawn after the inking (splayed front legs, a back prop behind the bale)
function stand(c) {
  const bk = (x, y) => { if (g[y][x] === 'J' || 'yYj'.includes(g[y][x])) g[y][x] = 'u'; };
  { const a = P(c, 4, 4), b = P(c, 7, 12); for (let k = 0; k <= 8; k++) { const p = lerp(a, b, k / 8); bk(Math.round(p[0]), Math.round(p[1])); } }
  pixLine(g, c[0] - 2, c[1] + 6, c[0] - 4, c[1] + 12, 'u'); pixLine(g, c[0] + 1, c[1] + 6, c[0] + 3, c[1] + 12, 'u');
}
function arrow(x, y) { pixLine(g, x, y, x - 3, y - 1, 'W'); pixSet(g, x, y, 'u'); pixSet(g, x - 4, y - 2, 'A'); pixSet(g, x - 5, y - 2, 'A'); pixSet(g, x - 5, y - 3, 'a'); pixSet(g, x - 4, y - 1, 'a'); }
const butts = [[tile(2.25, 0.5), [[-2, -2]]], [tile(2.25, 1.5), [[-1, 1], [-2, -3]]], [tile(2.05, 2.15), [[-2, 2]]]];
for (const [p] of butts) buttShadow(P(p, 0, -12));
for (const [p, ar] of butts) { const c = P(p, 0, -12); inked(g, t => butt(t, c)); stand(c); for (const [dx, dy] of ar) arrow(Math.round(c[0] + dx), Math.round(c[1] + dy)); }

// ---- an arrow barrel at the shooting line by the shed's open end (iron-hooped staves, a sheaf of fletched arrows)
inked(g, t => {
  stampL(t, 52, 100, `
.A..T..A.
.AA.T.AA.
..W.W.W..
..W.W.W..
.uWuWuWu.
uiiiiiiiu
Wuuuuuuut
WGGGGGGGt
Wwwwwwwwt
WwwwwwwWt
WGGGGGGGt
.wwwwwwt.
`);
});

// ---- the shooting shed: lean-to awning on posts, plank end wall, open front onto the range
const SB = [34, 102];
const sh = pixIsoBox(g, SB[0], SB[1], 1, 3, 14, 1, {});
const LR = P(sh.L, 0, -6), TR = P(sh.T, 0, -6);                   // raised back edge of the awning
const NS = 12;
const stripeAt = (x, y) => {                                      // which stripe (0..NS-1) a cell of the awning lies in
  const ex = sh.Rr[0] - sh.Bm[0], ey = sh.Rr[1] - sh.Bm[1], dx = LR[0] - sh.L[0] + (sh.L[0] - sh.Bm[0]), dy = LR[1] - sh.L[1] + (sh.L[1] - sh.Bm[1]);
  const px = x + 0.5 - sh.Bm[0], py = y + 0.5 - sh.Bm[1], det = ex * dy - ey * dx; const s = (px * dy - py * dx) / det; return Math.max(0, Math.min(NS - 1, Math.floor(s * NS)));
};
inked(g, t => {
  // interior seen through the open front: the back wall's planks in shadow, floor strip
  wall(t, sh.Bm, sh.Rr, 14, (a, v) => v < 3 ? 'I' : v >= 12 ? 'Y' : v % 3 === 2 ? 'I' : 'i');
  // bows and quivers hanging on the back wall
  for (let k = 0; k < 5; k++) { const p = lerp(sh.Bm, sh.Rr, (k + 0.6) / 6); const x = Math.round(p[0]), y = Math.round(p[1]) + 3;
    if (k % 2 === 0) { pixLine(t, x, y, x - 1, y + 2, 'W'); pixLine(t, x - 1, y + 3, x - 1, y + 5, 'W'); pixLine(t, x - 1, y + 6, x, y + 8, 'W'); pixLine(t, x + 1, y, x + 1, y + 8, 'B'); }
    else { pixRect(t, x - 1, y + 2, 3, 6, 'T'); pixSet(t, x + 1, y + 3, 'D'); pixSet(t, x + 1, y + 5, 'D'); pixSet(t, x + 1, y + 7, 'D'); pixSet(t, x - 1, y + 1, 'A'); pixSet(t, x + 1, y + 1, 'r'); pixSet(t, x, y, 'A'); } }
  // a bench along the opening
  { const a = lerp(sh.Bm, sh.Rr, 0.15), b = lerp(sh.Bm, sh.Rr, 0.55); pixLine(t, a[0], a[1] + 9, b[0], b[1] + 9, 'W'); pixLine(t, a[0], a[1] + 10, b[0], b[1] + 10, 'u'); }
  // posts: lit left edge, shaded body, a stone pad
  for (let k = 0; k <= 6; k++) { const p = lerp(sh.base.Bm, sh.base.Rr, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x - 1, y - 15, 1, 15, 'w'); pixRect(t, x, y - 15, 1, 15, 't'); pixSet(t, x - 1, y, 'J'); pixSet(t, x, y, 'J'); }
  // the plank end wall (lit) with a little window, and the end of the lean-to above it
  wall(t, sh.L, sh.Bm, 14, (a, v) => (a >= 13 && a <= 18 && v >= 4 && v <= 7) ? (v === 7 ? 'W' : v === 4 || a === 13 || a === 18 ? 'u' : 'I') : v >= 12 ? 'u' : boards({ t: ['W', 'w', 't'], bw: 4 })(a, v));
  for (const [x, y] of cells([sh.L, sh.Bm, LR])) t[y][x] = (x % 4 === 3) ? 't' : 'W';
  pixLine(t, sh.L[0], sh.L[1], sh.Bm[0], sh.Bm[1], 'u');
  pixLine(t, sh.Bm[0], sh.Bm[1], sh.Bm[0], sh.Bm[1] + 13, 'u');
  // the awning: stripes of team colour and canvas, lighter towards the raised back edge
  plane(t, [LR, TR, sh.Rr, sh.Bm], sh.Bm, sh.Rr, (a, d, u, x, y) => { const s = stripeAt(x, y), team = s % 2 === 0; const lvl = d > 24 ? 0 : d < 4 ? 2 : 1; return team ? ['L', 'T', 'D'][lvl] : ['A', 'B', 'a'][lvl]; });
  pixLine(t, LR[0], LR[1], TR[0], TR[1], 'u');
  pixLine(t, LR[0], LR[1], sh.Bm[0], sh.Bm[1], 'D');
});

// ---- rail fence along the two front edges (a gap in the left run for the archers)
{
  const t = g;
  for (const [a, b, k0, gap] of [[L, Bm, 3, true], [Bm, Rr, 0, false]]) {
    for (let k = k0; k <= 9; k++) { if (gap && (k === 5 || k === 6)) continue; const p = lerp(a, b, k / 9); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x, y - 7, 1, 7, 'u'); pixSet(t, x, y - 8, 'w'); }
    for (const [h, c] of [[6, 'W'], [5, 't'], [2, 't']]) for (let i = k0 * 96 / 9; i <= 96; i++) { const k = i / 96 * 9; if (gap && k > 5 && k < 6) continue; const p = lerp(a, b, i / 96); put(t, Math.floor(p[0]), Math.floor(p[1]) - h, c); }
  }
}

// ---- animated: valance hem flutter
function valance(t, f) {
  const n = 48; // per two pixels along the eave
  for (let i = 0; i < 96; i++) {
    const p = lerp(sh.Bm, sh.Rr, (i + 0.5) / 96); const x = Math.floor(p[0]), y = Math.floor(p[1]) + 1;
    const s = Math.min(NS - 1, Math.floor(i / 8)), team = s % 2 === 0, w = i % 8;
    const lift = [0, 1, 1, 0][(s + f) & 3];                                     // the hem lifts as a wave passes
    const len = (w === 0 || w === 7 ? 3 : w === 1 || w === 6 ? 4 : 5) - lift;
    for (let k = 0; k < len; k++) put(t, x, y + k, k === len - 1 ? (team ? 'D' : 'a') : (team ? 'T' : 'A'));
  }
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  inked(q, t => valance(t, f));
  outline(q, 'k', 'K');
  frames.push(pixText(q));
}

export default {
  id: 'archery', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f', K: '#4a3520',                                          // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730', z: '#7d6236', x: '#5e4a28', // earth, plinth faces
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#2a2018', // timber, shed interior
    A: '#efe6d2', B: '#d9c7a0', a: '#a8946e',                            // canvas, fletching, chalk
    h: '#e6c272', H: '#d8ab4f', E: '#b58a3c', e: '#8f6a2c',              // straw
    r: '#c9303a', R: '#8e1f28', g: '#ffe28a', G: '#5f656c',              // target rings, gold centre, iron hoop
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
