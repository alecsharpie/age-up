import { G, deg, emit, WOOD, STEEL, TEAM } from './kit.mjs';
const W = 30, H = 44, PV = [15, 17], LA = 16, SA = 5;
const PEN = [`
oooo
TTTL
DTTo
.oo.
`, `
.ooo
oTTL
TTTo
oo..
`, `
oooo
TTTL
oTTo
..oo
`, `
.ooo
DTTL
TTTo
o.o.
`];
const BOX = `
.aabba.
Wnnnnnd
WTTTTTd
WTTTTDd
Wnnnnnd
Wwwwwdd
`;
const at = (a, L, p = PV) => [p[0] + L * Math.cos(deg(a)), p[1] - L * Math.sin(deg(a))];
function frameBase(g, o = {}) {
  const dx = o.dx || 0, dy = o.dy || 0;
  g.rect(2 + dx, 31 + dy, 26, 1, 'W'); g.rect(2 + dx, 32 + dy, 26, 1, 'w'); g.rect(2 + dx, 33 + dy, 26, 1, 'T'); g.rect(2 + dx, 34 + dy, 26, 1, 'D');
  g.rect(2 + dx, 33 + dy, 1, 2, 'L'); [7, 15, 22].forEach(x => g.set(x + dx, 33 + dy, 'n'));
  g.rect(27 + dx, 22 + dy, 1, 9, 'd'); g.set(27 + dx, 21 + dy, 'm'); g.stamp(23 + dx, 22 + dy, PEN[o.pen || 0]);   // pennant at the front
  g.beam(6 + dx, 30 + dy, PV[0] + dx, PV[1] + dy, 2.2, WOOD); g.beam(24 + dx, 30 + dy, PV[0] + dx, PV[1] + dy, 2.2, WOOD);
  g.rect(10 + dx, 25 + dy, 11, 1, 'w'); g.rect(10 + dx, 26 + dy, 11, 1, 'd');        // cross brace
}
function beam(g, a, o = {}) {
  const dx = o.dx || 0, dy = o.dy || 0, P = [PV[0] + dx, PV[1] + dy];
  const [lx, ly] = at(a, LA, P), [sx, sy] = at(a + 180, SA, P);
  // hanging counterweight (always hangs straight down from the short end, offset by its swing)
  const bx = Math.round(sx + (o.swing || 0)), by = Math.round(sy) + 2;
  g.layer(l => { l.stamp(bx - 3, by, BOX); }, true, 'q');
  g.set(bx - 1, by - 1, 'n'); g.set(bx + 1, by - 1, 'n'); g.set(Math.round(sx), Math.round(sy) + 1, 'n');
  g.layer(l => { l.beam(sx, sy, lx, ly, 2, WOOD); }, true, 'q');
  g.rect(P[0] - 1, P[1], 3, 1, 'n'); g.set(P[0], P[1], 'm');     // iron axle
  return [lx, ly];
}
function sling(g, from, to, o = {}) {
  g.line(from[0], from[1], to[0], to[1], 'R');
  if (o.pouch !== false) g.stamp(Math.round(to[0]) - 1, Math.round(to[1]), o.stone ? `
rbc
.r.
` : `
r.r
.r.
`);
}
function frame({ a = 215, k = 0, pen = 0, sl, stone = false, swing = 0, smear, dx = 0, dy = 0, dust }) {
  const g = new G(W, H);
  frameBase(g, { pen, dx, dy });
  g.wheel(3, 35, 9, deg(22.5 * k)); g.wheel(18, 35, 9, deg(22.5 * k));
  const tip = beam(g, a, { swing, dx, dy });
  g.outline();
  if (smear) for (const sm of smear) { const [x0, y0] = at(sm.a, 6), [x1, y1] = at(sm.a, LA - 1); g.line(x0, y0, x1, y1, sm.ch); }
  if (sl) sling(g, [Math.round(tip[0]), Math.round(tip[1])], sl, { stone, pouch: sl.pouch });
  if (dust) g.stamp(dust[0], dust[1], dust[2]);
  return g.text();
}
const cockSl = [6, 29]; cockSl.pouch = true;
// ready (in combat, between shots) = cocked, beam down-back, stone in the sling; idle/walk = at rest, beam hanging tall
const ready = [
  frame({ pen: 0, sl: cockSl, stone: true }), frame({ pen: 1, sl: cockSl, stone: true }),
  frame({ a: 213, pen: 2, sl: [7, 29], stone: true }), frame({ a: 213, pen: 3, sl: [7, 29], stone: true }),
];
const idle = [
  frame({ a: 100, pen: 0, sl: [11, 9] }), frame({ a: 100, pen: 1, sl: [11, 9], swing: 0 }),
  frame({ a: 101, pen: 2, sl: [10, 9] }), frame({ a: 101, pen: 3, sl: [10, 9] }),
];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => frame({ k, a: 100, pen: k % 4, sl: [[11, 9], [12, 9], [13, 9], [12, 9], [11, 9], [10, 9], [9, 9], [10, 9]][k], swing: [0, 1, 1, 0, 0, -1, -1, 0][k] }));
const attack = [
  frame({ a: 80, sl: [27, 0], swing: 0, smear: [{ a: 150, ch: 'r' }, { a: 115, ch: 'R' }], dust: [10, 29, `
eR.......Re
`] }),
  frame({ a: 45, sl: [27, 12], swing: -2, dx: 0, dy: -1 }),
  frame({ a: 70, sl: [24, 8], swing: -1 }),
  frame({ a: 62, sl: [26, 9], swing: 1 }),
  frame({ a: 120, sl: [8, 9], swing: 0 }),
  frame({ a: 170, sl: [3, 20], swing: 0 }),
];
// ---- death: 42×44, ground row 43, the frame's centre at x=21
const DW = 42, DH = 44, OX = 6;
const BED = ['W', 'w', 'T', 'D'];
function boxAt(l, x, y) { l.stamp(x, y, BOX); }
function dframe(step) {
  const g = new G(DW, DH);
  if (step === 0) {          // hit: jolt, the long arm cracks
    const h = new G(W, H); frameBase(h, { dy: -1, pen: 1 }); h.wheel(3, 35, 9, deg(10)); h.wheel(18, 35, 9, deg(10));
    h.layer(l => boxAt(l, 16, 16), true, 'q');
    h.layer(l => { l.beam(19, 14, 15, 16, 2, WOOD); l.beam(15, 16, 7, 22, 2, WOOD); l.beam(6, 23, 3, 30, 2, WOOD); }, true, 'q');
    h.rect(14, 16, 3, 1, 'n'); h.outline(); h.stamp(5, 21, `
e.
.R
`); h.stamp(9, 15, `
eR
`);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (h.c[y][x] !== '.') g.set(x + OX, y, h.c[y][x]);
    return g.text();
  }
  if (step === 1) {          // legs buckle, the apex lurches forward and down, counterweight drops
    g.wheel(OX + 3, 35, 9, deg(10));
    g.layer(l => { l.beam(OX + 8, 31, OX + 20, 22, 2.2, WOOD); l.beam(OX + 25, 31, OX + 20, 22, 2.2, WOOD); }, true, 'q');
    g.layer(l => l.beam(OX + 2, 32, OX + 28, 33, 4, BED), true, 'q');
    g.layer(l => boxAt(l, OX + 19, 24), true, 'q');
    g.layer(l => { l.beam(OX + 20, 22, OX + 34, 14, 2, WOOD); l.beam(OX + 20, 22, OX + 4, 18, 2, WOOD); }, true, 'q');
    g.layer(l => l.wheel(OX + 19, 35, 9, deg(40)));
    g.outline(); g.stamp(OX + 15, 21, `
eR
`); return g.text();
  }
  if (step === 2) {          // frame topples forward, beam crashing down, front wheel kicked out
    g.wheel(OX + 2, 35, 9, deg(10));
    g.layer(l => l.beam(OX + 2, 33, OX + 27, 37, 4, BED), true, 'q');
    g.layer(l => { l.beam(OX + 10, 33, OX + 26, 29, 2.2, WOOD); l.beam(OX + 24, 37, OX + 28, 29, 2.2, WOOD); }, true, 'q');
    g.layer(l => boxAt(l, OX + 14, 36), true, 'q');
    g.layer(l => l.beam(OX + 30, 30, OX + 6, 26, 2, WOOD), true, 'q');
    g.layer(l => l.wheel(OX + 26, 35, 9, deg(100)));
    g.outline(); g.stamp(OX + 2, 42, `
eR...........Re
`); return g.text();
  }
  // 3–5: on the ground: bed with the team board, the broken A-frame across it, beam lying long, counterweight box, wheel
  g.layer(l => { l.rect(OX + 0, 42, 9, 1, 'q'); l.rect(OX + 1, 41, 7, 1, 'w'); l.rect(OX + 2, 40, 5, 1, 'W'); l.set(OX + 4, 40, 'n'); }, true, 'q');
  g.layer(l => l.beam(OX + 2, 40, OX + 26, 41, 4, BED), true, 'q');
  g.layer(l => { l.beam(OX + 9, 38, OX + 22, 35, 2.2, WOOD); l.beam(OX + 18, 38, OX + 27, 36, 2.2, WOOD); }, true, 'q');
  g.layer(l => l.beam(OX - 4, 37, OX + 25, 34, 2, WOOD), true, 'q');
  g.layer(l => boxAt(l, OX + 12, 33), true, 'q');
  if (step === 3) g.layer(l => l.wheel(OX + 26, 34, 9, deg(170)));
  else if (step === 4) g.layer(l => l.wheel(OX + 27, 34, 9, deg(240)));
  else g.layer(l => { l.rect(OX + 27, 42, 9, 1, 'q'); l.rect(OX + 28, 41, 7, 1, 'w'); l.rect(OX + 29, 40, 5, 1, 'W'); l.set(OX + 31, 40, 'n'); }, true, 'q');
  g.outline();
  if (step === 3) g.stamp(OX - 4, 42, `
eR...............................Re
`), g.stamp(OX + 8, 30, `
Re..eR
`);
  if (step === 4) g.stamp(OX - 2, 41, `
Re..........................eR
`);
  return g.text();
}
const death = [0, 1, 2, 3, 4, 5].map(dframe);
emit(process.argv[2], `
// @pixel trebuchet
// Trebuchet (painter-siege AAA pass): wheeled bed with a team side board, tall A-frame, long throwing beam on an iron axle,
// hinged counterweight box (iron bands, team stripe, heaped stones) and a rope sling; team pennant at the front.
// Faces right, 30×44 (the tallest unit), anchor at the ground. idle = at rest, beam hanging tall (sling sways, pennant
// flutters) · ready = cocked between shots (beam down-back, stone in the sling, beam creaks 1px) · walk 8 (rest pose; spokes 22.5°/frame, sling and box sway) · attack 6: release
// (beam whips over with smear, sling flung forward, stone gone, dust as the weight drops) → follow-through (frame
// rocks) → rebound → settle → winch back ×2 · death 6 (42×44): beam cracks → legs buckle → frame topples → timbers.
`, { id: 'trebuchet', anchor: [15, 44], anchors: { death: [21, 44] }, fps: { idle: 3, death: 9 }, frames: { idle, walk, ready, attack, death } });
