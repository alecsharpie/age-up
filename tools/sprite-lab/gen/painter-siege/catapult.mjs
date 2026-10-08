import { G, deg, emit, WOOD, STEEL, TEAM, ROPE } from './kit.mjs';
const W = 26, H = 26, PV = [11, 11], AL = 10;
const FLAGS = [`
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
function tipOf(a, L = AL) { return [PV[0] + L * Math.cos(deg(a)), PV[1] - L * Math.sin(deg(a))]; }
// The cart, everything but the arm. o = {dy, flag}
function cart(g, o) {
  const dy = o.dy || 0;
  // bed: two wood rows over a team-painted side board
  g.rect(2, 13 + dy, 22, 1, 'W'); g.rect(2, 14 + dy, 22, 1, 'w'); g.rect(2, 15 + dy, 22, 1, 'T'); g.rect(2, 16 + dy, 22, 1, 'D');
  g.rect(2, 15 + dy, 1, 2, 'L');
  [6, 13, 20].forEach(x => { g.set(x, 15 + dy, 'n'); });                     // iron bolts on the side board
  // front uprights + crossbar (padded with rope where the arm strikes)
  g.rect(16, 6 + dy, 1, 7, 'W'); g.rect(17, 6 + dy, 1, 7, 'd');
  g.beam(22, 12 + dy, 18, 8 + dy, 1.6, WOOD);                                 // brace
  g.rect(12, 4 + dy, 7, 1, 'W'); g.rect(12, 5 + dy, 7, 1, 'd');
  g.rect(12, 4 + dy, 2, 2, 'R'); g.set(13, 5 + dy, 'r');
  // winch drum at the back
  g.rect(2, 11 + dy, 3, 2, 'n'); g.set(2, 11 + dy, 'm'); g.set(3, 11 + dy, 's');
  // flag pole at the front corner, team pennant streaming back
  g.rect(24, 5 + dy, 1, 8, 'd'); g.set(24, 4 + dy, 'm');
  g.stamp(20, 5 + dy, FLAGS[o.flag || 0]);
  // torsion skein on its block: rope bundle with iron caps
  g.rect(8, 12 + dy, 7, 1, 'w');
  g.rect(10, 10 + dy, 3, 2, 'r'); g.set(10, 10 + dy, 'R'); g.set(11, 10 + dy, 'R'); g.set(9, 10 + dy, 'n'); g.set(9, 11 + dy, 'n'); g.set(13, 11 + dy, 'n'); g.set(13, 10 + dy, 'm');
}
function arm(g, a, o = {}) {
  const dy = o.dy || 0, [tx, ty] = tipOf(a);
  g.layer(l => {
    l.beam(PV[0], PV[1] - 1 + dy, tx, ty + dy, 2, WOOD);
    const bx = Math.round(tx), by = Math.round(ty + dy);
    l.stamp(bx - 2, by - 1, o.load ? `
.ab.
Wbcd
.wd.
` : `
....
Wqqd
.wd.
`);
  }, true, 'q');
}
function wheels(g, k, o = {}) { const th = deg(22.5 * k); g.wheel(1 + (o.bx || 0), 17, 9, th); g.wheel(16 + (o.fx || 0), 17, 9, th + (o.fth || 0)); }
function frame({ a = 150, load = true, k = 0, flag = 0, dy = 0, smear, rope, dust }) {
  const g = new G(W, H);
  cart(g, { dy, flag }); arm(g, a, { dy, load }); wheels(g, k);
  g.outline();
  if (smear) for (const s of smear) { const [tx, ty] = tipOf(s.a, AL - 1); g.line(PV[0] + 2 * Math.cos(deg(s.a)), PV[1] - 2 * Math.sin(deg(s.a)) + dy, tx, ty + dy, s.ch); }
  if (rope) { const [tx, ty] = tipOf(a, rope); g.line(4, 11 + dy, tx, ty + dy, 'R'); }
  if (dust) g.stamp(dust[0], dust[1] + dy, dust[2]);
  return g.text();
}
const idle = [frame({ flag: 0 }), frame({ flag: 1 }), frame({ a: 153, flag: 2 }), frame({ a: 153, flag: 3 })];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => frame({ k, flag: k % 4, a: k % 4 === 2 ? 153 : 150 }));
const attack = [
  frame({ a: 105, load: false, smear: [{ a: 140, ch: 'r' }, { a: 128, ch: 'R' }] }),
  frame({ a: 80, load: false, dy: -1, dust: [11, 2, `
e..
.e.
e..
`] }),
  frame({ a: 88, load: false, dust: [10, 2, `
e...
....
.e..
`] }),
  frame({ a: 81, load: false }),
  frame({ a: 120, load: false, rope: 5 }),
  frame({ a: 150, load: false, rope: 6 }),
];
// ---- death: 34×24, ground row 23, the cart's centre at x=15
const DW = 34, DH = 24, OX = 2;
function dframe(step) {
  const g = new G(DW, DH);
  if (step === 0) {           // hit: cart jolts, arm snaps mid-length
    const h = new G(W, H); cart(h, { dy: -1, flag: 1 }); h.beam(PV[0], PV[1] - 2, 8, 6, 2, WOOD); wheels(h, 1); h.outline();
    h.stamp(5, 1, `
.R.
W.d
`); h.set(13, 3, 'e'); h.set(14, 1, 'e');
    return pad(h);
  }
  const BED = ['W', 'w', 'T', 'D'];
  if (step === 1) {           // front wheel gives way, bed tips forward, uprights lean
    g.wheel(3, 15, 9, deg(30));
    g.layer(l => l.wheel(21, 16, 9, deg(80)));
    g.layer(l => { l.beam(17, 13, 21, 5, 2, WOOD); l.beam(15, 4, 22, 5, 2, WOOD); }, true, 'q');
    g.layer(l => l.beam(3, 12, 25, 15, 4, BED), true, 'q');
    g.layer(l => { l.beam(12, 11, 8, 6, 2, WOOD); l.rect(3, 9, 3, 2, 'n'); }, true, 'q');
    g.outline(); g.stamp(6, 3, `
R.
.d
`); g.stamp(25, 2, `
eR
`);
    return g.text();
  }
  if (step === 2) {           // front of the bed hits the ground; uprights fall forward
    g.wheel(2, 15, 9, deg(30));
    g.layer(l => l.wheel(25, 15, 9, deg(140)));
    g.layer(l => { l.beam(19, 17, 27, 11, 2, WOOD); l.beam(25, 9, 30, 13, 2, WOOD); }, true, 'q');
    g.layer(l => l.beam(3, 13, 24, 19, 4, BED), true, 'q');
    g.layer(l => { l.beam(11, 14, 9, 8, 2, WOOD); l.rect(3, 10, 3, 2, 'n'); }, true, 'q');
    g.outline();
    g.stamp(13, 21, `
eR...Re..eR
`); return g.text();
  }
  // steps 3–5: on the ground; back wheel flattened under the bed, front wheel rolls off and topples
  g.rect(OX + 1, 21, 9, 1, 'q'); g.rect(OX + 2, 20, 7, 1, 'w'); g.rect(OX + 3, 19, 5, 1, 'W');  // flattened back wheel
  g.layer(l => l.beam(OX + 1, 19, OX + 21, 20, 4, BED), true, 'q');                             // bed on its side board
  g.beam(OX + 15, 17, OX + 22, 13, 1.6, WOOD);                                                   // broken upright
  g.beam(OX + 6, 17, OX + 12, 15, 2, WOOD);                                                      // arm stump
  g.stamp(OX + 12, 13, `
WwwW
.dd.
`);                                                                                               // the bucket
  g.rect(OX + 2, 17, 3, 2, 'n');
  if (step === 3) { g.wheel(OX + 22, 15, 9, deg(200)); }
  else if (step === 4) { g.wheel(OX + 23, 15, 9, deg(250)); }
  else { g.rect(OX + 22, 21, 9, 1, 'q'); g.rect(OX + 23, 20, 7, 1, 'w'); g.rect(OX + 24, 19, 5, 1, 'W'); g.set(OX + 26, 19, 'n'); }
  g.outline();
  if (step === 3) g.stamp(OX, 21, `
eR.....................Re
`), g.stamp(OX + 9, 14, `
Re..eR
`);
  if (step === 4) g.stamp(OX + 1, 20, `
Re....................eR
`);
  return g.text();
}
function pad(h) { const g = new G(DW, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (h.c[y][x] !== '.') g.set(x + OX, y, h.c[y][x]); return g.text(); }
const death = [0, 1, 2, 3, 4, 5].map(k => k === 0 ? dframe(0) : '\n' + '.'.repeat(DW) + '\n' + '.'.repeat(DW) + dframe(k));
emit(process.argv[2], `
// @pixel catapult
// Mangonel (painter-siege AAA pass): four-wheel cart (two wheels side-on), torsion skein + arm with bucket,
// padded crossbar on front uprights, winch at the back, team side board + pennant. Faces right, 26×26, anchor at the ground.
// idle = cocked + loaded (rope/arm creak, pennant flutters) · walk 8 (spokes 22.5°/frame) · attack 6: arm whips (smear) →
// slams the crossbar (frame jolts, dust) → rebound → settle → winch back ×2 · death 6 (34×26): arm snaps → front wheel
// gives way → bed hits the ground → wheel rolls off → settles as timbers with the team board.
`, { id: 'catapult', anchor: [13, 26], anchors: { death: [15, 26] }, fps: { idle: 3, death: 9 }, frames: { idle, walk, attack, death } });
