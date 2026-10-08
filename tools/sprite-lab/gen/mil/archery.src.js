// @pixel archery
// Archery Range (3×3): a packed-earth range on a low plinth. Along the back-left edge an open timber shooting shed
// under a lean-to awning striped in team colour and canvas, with a scalloped valance; bows and quivers hang inside.
// Worn shooting lanes lead to three straw butts on A-frame stands (red/white rings, gold centre) with arrows stuck
// in them; a rail fence with a gap, hay bales and an arrow barrel. Generated (code before export); anchor = footprint
// bottom corner. idle: 4 frames — the awning valance flutters, the pennant on the barrel stake flicks.
const W = 3, H = 3, Z = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
const bx = W * 32 + 2, by = GH - 4;
//@KIT
const g = pixGrid(GW, GH);
const tile = (tx, ty) => [bx + (tx - ty) * 32, by - 96 + (tx + ty) * 16 + 16];
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- ground: packed earth in patches, three worn lanes from the shed to the butts, a chalk shooting line
for (const [x, y] of cells([T, Rr, Bm, L])) { const n = vnoise(x, y, 8, 2); g[y][x] = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : 'y'; }
for (let ty = 0; ty < 3; ty++) {
  const a = tile(0.75, ty + 0.5), b = tile(2.35, ty + 0.5);
  for (const [x, y] of cells([P(a, -4, -2), P(b, -4, -2), P(b, 4, 2), P(a, 4, 2)])) { const n = vnoise(x, y, 4, 7 + ty); if (g[y][x] !== '.') g[y][x] = n > 0.45 ? 'j' : 'y'; }
}
{ const a = tile(0.62, 0.15), b = tile(0.62, 2.55); for (let k = 0; k <= 40; k++) if (k % 4 < 3) { const p = lerp(a, b, k / 40); pixSet(g, p[0], p[1], 'B'); } }
for (const [x, y] of [[120, 70], [64, 112], [150, 100], [92, 92], [176, 90]]) { g[y][x] = 'J'; g[y][x + 1] = 'Y'; }

// ---- straw butts: a disc in the plane that faces the shed (sheared ellipse), bale thickness behind, A-frame stand
function butt(t, c, arrows) {
  const R = 6.6, AX = 0.82;
  const disc = (ox, oy, fn) => { for (let y = Math.floor(c[1] - 10); y <= c[1] + 10; y++) for (let x = Math.floor(c[0] - 9); x <= c[0] + 9; x++) { const U = (c[0] + ox - x - 0.5) / AX, V = c[1] + oy - (y + 0.5); const r = Math.hypot(U, V); if (r < R) put(t, x, y, fn(r, U, V)); } };
  // stand legs first (behind), then the bale side, then the painted face
  pixLine(t, c[0] + 2, c[1], c[0] + 6, c[1] + 11, 'u');
  for (let s = 3; s >= 1; s--) disc(s * 0.9, s * 0.3, () => s === 3 ? 'e' : 'E');
  disc(0, 0, (r, U, V) => r > 5.5 ? (V - U > 1 ? 'h' : V - U < -3 ? 'E' : 'H') : r > 4.4 ? 'A' : r > 3.2 ? ((U + V) < -2 ? 'R' : 'r') : r > 2.0 ? 'A' : r > 1.0 ? 'r' : 'g');
  pixLine(t, c[0] - 1, c[1] + 4, c[0] - 4, c[1] + 12, 't'); pixLine(t, c[0] + 2, c[1] + 4, c[0] + 2, c[1] + 12, 't');
  for (const [dx, dy] of arrows) { const x = Math.round(c[0] + dx), y = Math.round(c[1] + dy); pixLine(t, x, y, x - 4, y - 2, 'W'); pixSet(t, x - 5, y - 3, 'A'); pixSet(t, x - 4, y - 3, 'r'); pixSet(t, x - 5, y - 2, 'r'); }
}
const butts = [[tile(2.25, 0.5), [[1, -2], [-1, 2]]], [tile(2.25, 1.5), [[2, 1], [0, -3], [-2, 0]]], [tile(2.25, 2.5), [[1, 2]]]];
for (const [p, ar] of butts) inked(g, t => butt(t, P(p, 0, -12), ar));
// arrows that missed, stuck in the earth behind the butts
for (const [x, y] of [[170, 86], [151, 103], [184, 92], [118, 120]]) { pixLine(g, x, y, x - 3, y - 2, 'W'); pixSet(g, x - 4, y - 3, 'A'); pixSet(g, x - 3, y - 3, 'r'); }

// ---- hay bales and an arrow barrel near the shed's front end
inked(g, t => {
  stampL(t, 46, 104, `
...hhhhhh...
..hhHhhhhHE.
.hHhhhhhhHEe
.EeEEEEEEEEe
.HhhhHhhhhEe
.EEEEEEEEEEe
`);
  stampL(t, 58, 100, `
.hhhhhh..
hhHhhhHE.
hhhhhhhEe
EEEEEEEEe
`);
});
inked(g, t => {
  stampL(t, 76, 108, `
.A.A.A.
.r.W.r.
.W.W.W.
uwwwwwu
uWwwwwu
GGGGGGG
uWwwwwu
.uwwwu.
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

// ---- animated: valance hem flutter + a team pennant on a stake by the barrel
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
function pennant(t, f) {
  const x = 84, y = 108; pixLine(t, x, y, x, y - 14, 'u');
  const rows = [[`TTTL`, `TTTTT`, `DTT`], [`TTTT`, `TTTTD`, `DTTT`], [`TTTL`, `TTTTT`, `DTTT`], [`TTT`, `TTTTD`, `DTTL`]][f];
  rows.forEach((r, k) => { for (let i = 0; i < r.length; i++) put(t, x + 1 + i, y - 14 + k + (f === 1 && i > 2 ? 1 : 0), r[i]); });
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  inked(q, t => valance(t, f));
  inked(q, t => pennant(t, f));
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
