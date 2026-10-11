// @pixel siege
// Siege Workshop (3×3): a big timber workshop along the back-left edge — plank end wall with a team banner, shingle
// gable roof, an open bay showing a workbench, tools on the back wall and a glowing brazier. In the yard: a sheer-leg
// A-frame crane with a windlass and a beam swinging on its hook, a half-built mangonel (one wheel still missing),
// spoked wheels stacked and one leaning on the shed, a log pile under a team-colour tarp, a sawhorse in wood chips.
// Generated (code before export); anchor = footprint bottom corner. idle: 4 frames — the crane hook and its load sway,
// the brazier flickers.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 56;
const bx = W * 32 + 2, by = GH - 4;
//@KIT
const g = pixGrid(GW, GH);
const iso = (tx, ty) => [bx + (tx - ty) * 32, by - 98 + (tx + ty) * 16];          // ground point (top of the plinth)
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- yard: packed earth with sawdust drifts and wood chips in clusters
for (const [x, y] of cells([T, Rr, Bm, L])) { const n = vnoise(x, y, 7, 5), s = vnoise(x, y, 4, 13); g[y][x] = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : (s > 0.78 ? 'd' : 'y'); }
for (const [x, y] of [[150, 96], [153, 98], [147, 99], [120, 126], [123, 128], [90, 118], [172, 106], [60, 124]]) { g[y][x] = 'e'; g[y][x + 1] = 'E'; }

// ---- spoked wheel, seen at an angle (ellipse): iron tyre, felloe, 8 spokes, hub
function wheel(t, cx, cy, R, sq = 0.72) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = cy - R - 1; y <= cy + R + 1; y++) for (let x = cx - R; x <= cx + R; x++) {
    const dx = (x + 0.5 - cx - 0.5) / sq, dy = y + 0.5 - cy - 0.5, r = Math.hypot(dx, dy);
    if (r > R + 0.2) continue;
    if (r > R - 1.1) put(t, x, y, dx + dy < -2 ? 'S' : 'G');
    else if (r > R - 2.3) put(t, x, y, dx + dy < 0 ? 'W' : 't');
  }
  for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + 0.2; pixLine(t, cx, cy, cx + Math.cos(an) * (R - 2) * sq, cy + Math.sin(an) * (R - 2), k < 4 ? 't' : 'w'); }
  pixSet(t, cx, cy, 'G'); pixSet(t, cx - 1, cy, 'S'); pixSet(t, cx, cy - 1, 'S'); pixSet(t, cx + 1, cy, 'G'); pixSet(t, cx, cy + 1, 'G');
}
// a log lying along the tx axis (end towards the viewer's left), len in cells
function log(t, x, y, len, cap = true) {
  for (let i = 0; i < len; i++) { const xx = x + i, yy = y - Math.floor(i / 2); put(t, xx, yy - 2, 'W'); put(t, xx, yy - 1, 'w'); put(t, xx, yy, 'w'); put(t, xx, yy + 1, 't'); }
  if (cap) stampL(t, x - 2, y - 2, `
.ee.
eEEe
eEhe
.ee.
`);
}

// ---- the workshop
const sh = pixIsoBox(g, 44, 119, 1.3, 3, 22, 1, {});
const sb = sh.base;
const mT = lerp(sh.T, sh.Rr, 0.5), mB = lerp(sh.L, sh.Bm, 0.5), RISE = 12;
const r1 = P(mB, 0, -RISE), r2 = P(mT, 0, -RISE);
const GLOW = lerp(sh.Bm, sh.Rr, 0.78);   // brazier spot in the bay, clear of the mangonel in front of it
inked(g, t => {
  // open bay: back wall planks in shadow, tools hanging, workbench, floor
  wall(t, sh.Bm, sh.Rr, 22, (a, v) => v < 3 ? 'I' : v >= 20 ? 'Y' : v % 4 === 3 ? 'I' : 'i');
  for (let k = 0; k < 5; k++) { const p = lerp(sh.Bm, sh.Rr, 0.1 + k * 0.08); const x = Math.round(p[0]), y = Math.round(p[1]) + 5; pixLine(t, x, y, x, y + 5, 'w'); pixSet(t, x, y, 'S'); if (k % 2) pixSet(t, x + 1, y, 'S'); }
  { const a = lerp(sh.Bm, sh.Rr, 0.08), b = lerp(sh.Bm, sh.Rr, 0.46); pixLine(t, a[0], a[1] + 14, b[0], b[1] + 14, 'W'); pixLine(t, a[0], a[1] + 15, b[0], b[1] + 15, 't');
    for (const k of [0, 1]) { const p = lerp(a, b, k ? 0.92 : 0.08); pixLine(t, p[0], p[1] + 16, p[0], p[1] + 19, 't'); } }
  // posts across the opening
  for (let k = 0; k <= 6; k++) { const p = lerp(sb.Bm, sb.Rr, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x - 1, y - 23, 1, 23, 'W'); pixRect(t, x, y - 23, 1, 23, 't'); }
  pixLine(t, sh.Bm[0], sh.Bm[1] + 1, sh.Rr[0], sh.Rr[1] + 1, 'W'); pixLine(t, sh.Bm[0], sh.Bm[1] + 2, sh.Rr[0], sh.Rr[1] + 2, 't');  // lintel beam
  // lit end wall: vertical boards, big double door with iron straps
  wall(t, sh.L, sh.Bm, 22, (a, v) => {
    if (a >= 12 && a <= 30 && v >= 5) { if (v === 5 || a === 12 || a === 30) return 'u'; if (a === 21) return 'u'; if (v === 9 || v === 17) return 'G'; return (a % 3 === 0) ? 't' : 'w'; }
    return v >= 20 ? 'u' : boards({ t: ['W', 'w', 't'], bw: 4 })(a, v);
  });
  // gable over the end wall, then the two roof planes in shingle courses
  for (const [x, y] of cells([sh.L, sh.Bm, r1])) t[y][x] = (x % 4 === 3) ? 't' : 'W';
  // the back slope faces away: its eave L→T sits above the ridge on screen, so its courses lap upward (flip)
  plane(t, [sh.L, sh.T, r2, r1], sh.L, sh.T, tiles({ t: ['O', 'Q', 'P'], ch: 3, tw: 5, s: 41 }), true);
  plane(t, [r1, r2, P(sh.Rr, 1, 1), P(sh.Bm, 0, 1)], P(sh.Bm, 0, 1), P(sh.Rr, 1, 1), (a, d) => tiles({ t: d > 14 ? ['Q', 'q', 'P'] : ['q', 'P', 'p', 'R'], ch: 3, tw: 5, s: 42 })(a, d));
  pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); pixLine(t, r1[0], r1[1] - 1, r2[0], r2[1] - 1, 'O');
  pixLine(t, sh.L[0], sh.L[1], r1[0], r1[1], 'u'); pixLine(t, sh.Bm[0], sh.Bm[1] + 1, r1[0], r1[1], 'u');
  pixLine(t, sh.Bm[0], sh.Bm[1] + 1, sh.Rr[0] + 1, sh.Rr[1] + 1, 'p');
  pixLine(t, sh.Bm[0], sh.Bm[1], sh.Bm[0], sh.Bm[1] + 21, 'u');
});
// team banner hung on the gable end
inked(g, t => wall(t, sh.L, sh.Bm, 22, (a, v) => {
  const i = a - 31; if (i < 0 || i > 8 || v < 1) return null; if (v === 1) return i === 0 || i === 8 ? 'h' : 't';
  const end = 15 - (Math.abs(i - 4) < 2 ? 2 : 0); if (v > end) return null; if (v === end) return 'D';
  if (v >= 5 && v <= 9 && ((i === 4) || (v === 7 && i >= 2 && i <= 6))) return 'L';
  return i === 0 ? 'L' : i === 8 ? 'D' : 'T';
}));
// the shed as painted so far: the brazier inside the bay may only show where nothing in the yard was drawn over it
const gShed = copy(g);
// a wheel leaning on the corner post of the open bay (the end wall stands on the plinth edge, so there is no ground in front of it)
inked(g, t => wheel(t, 50, 112, 6));

// ---- stacked wheels and a spare axle (front-left of the yard)
inked(g, t => { const p = iso(1.55, 2.55); wheel(t, p[0] - 6, p[1] - 6, 6); wheel(t, p[0] + 4, p[1] - 6, 6); wheel(t, p[0] - 1, p[1] - 12, 6); });

// ---- half-built mangonel (side view like the unit): base beams, A-frame uprights, cocked arm with its cup, the
//      torsion skein; the front wheel is fitted, the rear one still lies on the ground beside a bare axle
inked(g, t => {
  const p = iso(1.8, 1.2); const x = Math.round(p[0]) - 13, y = Math.round(p[1]) - 4;
  pixLine(t, x, y, x + 26, y, 'W'); pixLine(t, x, y + 1, x + 26, y + 1, 'w'); pixLine(t, x, y + 2, x + 26, y + 2, 't');
  pixLine(t, x + 3, y - 1, x + 23, y - 1, 'i');
  for (const [a0, a1, c] of [[9, 14, 'W'], [19, 14, 't']]) { pixLine(t, x + a0, y - 1, x + a1, y - 13, c); pixLine(t, x + a0 + 1, y - 1, x + a1 + 1, y - 13, 't'); }
  pixLine(t, x + 10, y - 6, x + 19, y - 6, 'w');
  pixLine(t, x + 17, y - 2, x + 3, y - 17, 'W'); pixLine(t, x + 18, y - 2, x + 4, y - 17, 't');
  stampL(t, x - 1, y - 21, `
.GGGG.
GwwwwG
.GttG.
`);
  pixRect(t, x + 15, y - 4, 5, 2, 'B'); pixSet(t, x + 17, y - 4, 'b');
  pixLine(t, x + 9, y - 10, x + 25, y - 1, 'B');
  wheel(t, x + 5, y + 2, 5);
  pixRect(t, x + 21, y + 2, 2, 2, 'G');
  // the rear end, with no wheel yet, rests on a timber chock down to the ground line of the fitted wheel
  pixRect(t, x + 19, y + 4, 6, 4, 'w'); pixLine(t, x + 19, y + 4, x + 24, y + 4, 'W'); pixLine(t, x + 19, y + 7, x + 24, y + 7, 't');
});
inked(g, t => { const p = iso(1.95, 1.75); wheel(t, p[0] + 2, p[1] - 3, 5, 1.0); });

// ---- log pile under a team tarp, and a sawhorse with a log and a saw in wood chips
inked(g, t => {
  const p = iso(2.75, 2.5); const x = Math.round(p[0]) - 16, y = Math.round(p[1]) - 2;
  for (let k = 0; k < 4; k++) log(t, x + k * 4, y + k * 0, 20);
  for (let k = 0; k < 3; k++) log(t, x + 2 + k * 4, y - 4, 20);
  for (let k = 0; k < 2; k++) log(t, x + 4 + k * 4, y - 8, 20);
  // tarp draped over the back half of the pile, folds in light and dark
  const tp = [[x + 12, y - 13], [x + 28, y - 21], [x + 37, y - 16], [x + 35, y - 9], [x + 24, y - 3], [x + 15, y - 6]];
  for (const [cx, cy] of cells(tp)) t[cy][cx] = (cx - x > 31 || cy - y > -6) ? 'D' : 'T';
  for (const k of [19, 26]) { pixLine(t, x + k, y - 17 + (k - 19) / 3, x + k + 2, y - 5 - (k - 19) / 7, 'L'); pixLine(t, x + k + 1, y - 17 + (k - 19) / 3, x + k + 3, y - 5 - (k - 19) / 7, 'D'); }
  pixLine(t, x + 12, y - 13, x + 28, y - 21, 'L'); pixLine(t, x + 15, y - 6, x + 24, y - 3, 'D');
});
inked(g, t => {
  const p = iso(2.7, 1.3); const x = Math.round(p[0]), y = Math.round(p[1]);
  for (const dx of [-5, 5]) { pixLine(t, x + dx - 2, y, x + dx, y - 6, 't'); pixLine(t, x + dx + 2, y, x + dx, y - 6, 'w'); }
  log(t, x - 9, y - 6, 20, true);
  pixLine(t, x + 1, y - 12, x + 6, y - 9, 'S'); pixLine(t, x + 1, y - 13, x + 6, y - 10, 'G'); pixSet(t, x, y - 13, 'W'); pixSet(t, x, y - 12, 't');
});

// ---- animated: crane (hook sway) and the brazier
const CR = iso(2.45, 0.35);
function crane(t, f) {
  const [x, y] = [Math.round(CR[0]), Math.round(CR[1])], ap = [x, y - 44], sw = [0, 1, 0, -1][f];
  // back leg, then the two front legs of the sheer-legs, a cross-tie and the windlass
  pixLine(t, x + 9, y - 6, ap[0], ap[1], 't');
  for (const [dx, c1, c2] of [[-11, 'W', 't'], [11, 'w', 't']]) { pixLine(t, x + dx, y, ap[0], ap[1], c1); pixLine(t, x + dx + 1, y, ap[0] + 1, ap[1], c2); }
  pixLine(t, x - 6, y - 20, x + 7, y - 20, 'W'); pixLine(t, x - 6, y - 19, x + 7, y - 19, 't');
  pixRect(t, x - 3, y - 9, 8, 4, 'w'); pixLine(t, x - 3, y - 9, x + 4, y - 9, 'W'); pixLine(t, x - 3, y - 6, x + 4, y - 6, 't'); pixSet(t, x - 4, y - 8, 'G'); pixSet(t, x + 5, y - 8, 'G'); pixLine(t, x, y - 9, ap[0] - 9, ap[1] + 1, 'B');
  // jib towards the yard, rope + hook + a beam on two slings
  const tip = [ap[0] - 12, ap[1] + 2]; pixLine(t, ap[0] + 2, ap[1] - 1, tip[0], tip[1], 'W'); pixLine(t, ap[0] + 2, ap[1], tip[0], tip[1] + 1, 't');
  const hk = [tip[0] + sw, tip[1] + 17]; pixLine(t, tip[0], tip[1] + 2, hk[0], hk[1], 'B'); pixSet(t, hk[0], hk[1] + 1, 'G'); pixSet(t, hk[0] + 1, hk[1] + 2, 'G');
  const lx = hk[0] + sw, ly = hk[1] + 6; pixLine(t, hk[0], hk[1] + 2, lx - 5, ly - 1, 'B'); pixLine(t, hk[0], hk[1] + 2, lx + 5, ly - 1, 'B');
  for (let i = -8; i <= 8; i++) { put(t, lx + i, ly - 1 + Math.floor((i + 8) / 4) - 2, 'W'); put(t, lx + i, ly + Math.floor((i + 8) / 4) - 2, 'w'); put(t, lx + i, ly + 1 + Math.floor((i + 8) / 4) - 2, 't'); }
}
function brazier(t, f) {
  const x = Math.round(GLOW[0]), y = Math.round(GLOW[1]) + 15;   // legs end on the bay floor (v 20)
  stampL(t, x - 2, y, ['\n.ogo.\nGogoG\n.GGG.\n..t..\n.t.t.\n', '\n..o..\nGgogG\n.GGG.\n..t..\n.t.t.\n', '\n.o.o.\nGogoG\n.GGG.\n..t..\n.t.t.\n', '\n..g..\nGoooG\n.GGG.\n..t..\n.t.t.\n'][f]);
  if (f % 2 === 0) { pixSet(t, x - 3, y + 1, 'r'); pixSet(t, x + 3, y + 1, 'r'); }
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  // the brazier stands inside the bay: paint it on a layer and keep only the cells where the shed is still on top
  { const b = pixGrid(GW, GH); brazier(b, f); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (b[y][x] !== '.' && g[y][x] === gShed[y][x]) q[y][x] = b[y][x]; }
  inked(q, t => crane(t, f));
  outline(q, 'k', 'K');
  frames.push(pixText(q));
}

export default {
  id: 'siege', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f', K: '#4a3520',                                                      // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', d: '#c9a24a', z: '#7d6236', x: '#5e4a28', // earth, sawdust, plinth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#241a12', // timber, bay interior
    O: '#c49a5c', Q: '#a07a44', q: '#8a6a3a', P: '#7a5a30', R: '#6a4a2a', p: '#4a3520', // shingles lit → shade
    e: '#d8b277', E: '#b58a3c', h: '#e6c272',                                        // log ends, chips, gilt
    S: '#cfd4d8', G: '#5f656c', B: '#c9b58e', b: '#9a8a66',                                        // iron, rope
    o: '#ff8c2a', g: '#ffd27a', r: '#7a2a18',                                       // glow
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
