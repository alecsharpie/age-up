import { G, deg, emit, WOOD, STEEL, TEAM } from './kit.mjs';
const W = 30, H = 24;
const PEN = [`
oo.
TLo
TTT
oo.
`, `
ooo
TLT
TTo
o..
`, `
.oo
TLo
TTT
.oo
`, `
ooo
TLT
oTT
..o
`];
// hide roof: trapezoid from the ridge (y0) to the eaves (y1), team hide with stitched seams, wood ridge pole + eaves beam
function roof(g, o = {}) {
  const dy = o.dy || 0, dx = o.dx || 0, r0 = 3 + dy + (o.sag || 0), r1 = 10 + dy;
  g.poly([[4 + dx, r0], [22 + dx, r0], [26 + dx, r1], [0 + dx, r1]], 'T');
  for (let x = 0; x < W; x++) { if (g.get(x, r0) === 'T') g.set(x, r0, 'L'); if (g.get(x, r0 + 1) === 'T') g.set(x, r0 + 1, 'L'); if (g.get(x, r1 - 1) === 'T') g.set(x, r1 - 1, 'D'); }
  for (const sx of [8, 18]) g.line(sx + dx, r0 + 2, sx + dx + (sx < 13 ? -2 : 2), r1 - 2, 'D');   // hide seams
  g.line(13 + dx, r0 + 2, 13 + dx, r1 - 2, 'D');
  if (o.torn) for (const [x, y] of o.torn) g.set(x + dx, y + dy, 'q');
  g.rect(3 + dx, r0 - 1, 20, 1, 'W'); g.set(22 + dx, r0 - 1, 'd');           // ridge pole
  g.rect(0 + dx, r1, 27, 1, 'w'); g.rect(0 + dx, r1, 1, 1, 'W');           // eaves beam
}
function hut(g, o = {}) {
  const dy = o.dy || 0, dx = o.dx || 0;
  g.rect(1 + dx, 15 + dy, 25, 1, 'W'); g.rect(1 + dx, 16 + dy, 25, 1, 'd');           // chassis beam
  g.rect(2 + dx, 11 + dy, 22, 1, 'w'); g.rect(2 + dx, 11 + dy, 1, 1, 'W');           // wall planks under the eaves
  g.rect(2 + dx, 12 + dy, 22, 3, 'q');                                             // the dark gap where the log hangs
  for (const x of [3, 12, 22]) { g.rect(x + dx, 11 + dy, 1, 4, x === 3 ? 'W' : 'd'); }   // posts
  g.rect(24 + dx, 11 + dy, 1, 4, 'q');                                             // open front
}
function log(g, tip, o = {}) {
  const dy = o.dy || 0;
  g.rect(tip - 18, 12 + dy, 15, 1, 'W'); g.rect(tip - 18, 13 + dy, 15, 1, 'w');
  for (let x = tip - 16; x < tip - 3; x += 5) g.set(x, 13 + dy, 'd');               // bark
  g.stamp(tip - 3, 11 + dy, `
.smz
smmnz
mnnnz
.zzz
`.replace(/^\n/, ''));
  // hanging ropes from the wall plank to the log, angled by the swing
  const sw = Math.sign(tip - 26);
  for (const px of [8, 17]) { g.set(px - sw, 11 + dy, 'R'); }
}
function frame({ tip = 26, k = 0, pen = 0, dx = 0, dy = 0, smear, dust }) {
  const g = new G(W, H);
  hut(g, { dx, dy, pen }); log(g, tip + dx, { dy }); roof(g, { dx, dy });
  const th = deg(22.5 * k); g.wheel(2, 15, 9, th); g.wheel(15, 15, 9, th);
  g.outline();
  if (smear) g.stamp(tip - 9, 14, smear);
  if (dust) g.stamp(dust[0], dust[1], dust[2]);
  return tall(g, dx, dy, pen);
}
// add two rows on top for the pennant on the rear of the ridge pole
function tall(g, dx = 0, dy = 0, pen = 0) {
  const t = new G(W, 26); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.c[y][x] !== '.') t.set(x, y + 2, g.c[y][x]);
  t.rect(5 + dx, 1 + dy, 1, 3, 'o'); t.set(5 + dx, 0 + dy, 'm'); t.stamp(2 + dx, 1 + dy, PEN[pen]);
  return t.text();
}
const idle = [frame({ pen: 0 }), frame({ pen: 1 }), frame({ tip: 25, pen: 2 }), frame({ tip: 25, pen: 3 })];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => frame({ k, pen: k % 4, tip: [26, 25, 25, 24, 25, 26, 26, 27][k] }));
const attack = [
  frame({ tip: 29, smear: `
.ReeR
`, dust: [29, 9, `
e
.
.
.
.
R
`] }),
  frame({ tip: 29, dx: -1, dust: [29, 10, `
R
.
.
R
`] }),
  frame({ tip: 26 }),
  frame({ tip: 22 }),
  frame({ tip: 21 }),
  frame({ tip: 24 }),
];
// ---- death: 34×24, ground row 23
const DW = 34, DH = 24, OX = 2;
function dframe(step) {
  const g = new G(DW, DH);
  if (step === 0) {        // hit: hide torn, hut jolts up, log head drops
    const h = new G(W, H);
    hut(h, { dy: -1, pen: 1 }); log(h, 26, { dy: 1 }); roof(h, { dy: -1, torn: [[9, 6], [10, 6], [10, 7], [16, 5], [17, 5]] });
    h.wheel(2, 15, 9, deg(10)); h.wheel(15, 15, 9, deg(10)); h.outline(); h.stamp(24, 1, `
eR
`);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (h.c[y][x] !== '.') g.set(x + OX, y, h.c[y][x]);
    return g.text();
  }
  if (step === 1) {        // roof sags, front wheel breaks, hut tips forward
    g.wheel(OX + 2, 15, 9, deg(10));
    g.layer(l => l.wheel(OX + 17, 16, 9, deg(60)));
    g.layer(l => { l.beam(OX + 1, 14, OX + 25, 16, 2, WOOD); l.rect(OX + 24, 17, 6, 2, 'W'); l.rect(OX + 24, 18, 6, 1, 'd'); l.stamp(OX + 29, 16, `
mz
nz
`); }, true, 'q');
    g.layer(l => { l.poly([[OX + 4, 6], [OX + 22, 7], [OX + 27, 13], [OX + 0, 11]], 'T'); l.beam(OX + 0, 11, OX + 27, 13, 1.5, ['w', 'w', 'd']); l.beam(OX + 3, 5, OX + 22, 6, 1.5, ['W', 'W', 'd']);
      for (const [x, y] of [[8, 8], [9, 8], [14, 9], [18, 9], [19, 10]]) l.set(OX + x, y, 'D'); l.set(OX + 7, 7, 'L'); l.set(OX + 8, 7, 'L'); l.set(OX + 9, 7, 'L'); }, true, 'q');
    g.outline(); return g.text();
  }
  if (step === 2) {        // the hut folds: roof slides forward and down, log on the ground
    g.layer(l => l.wheel(OX + 1, 15, 9, deg(10)));
    g.layer(l => { l.rect(OX + 14, 20, 15, 1, 'W'); l.rect(OX + 14, 21, 15, 1, 'd'); l.stamp(OX + 28, 19, `
mz
sn
nz
`); }, true, 'q');
    g.layer(l => { l.beam(OX + 4, 15, OX + 26, 19, 2, WOOD); }, true, 'q');
    g.layer(l => { l.poly([[OX + 6, 10], [OX + 22, 12], [OX + 28, 19], [OX + 3, 16]], 'T'); l.beam(OX + 3, 16, OX + 28, 19, 1.5, ['w', 'w', 'd']); l.beam(OX + 6, 9, OX + 22, 11, 1.5, ['W', 'W', 'd']);
      for (const [x, y] of [[10, 13], [11, 13], [16, 14], [20, 15]]) l.set(OX + x, y, 'D'); for (let x = 7; x < 20; x++) if (l.get(OX + x, 11) === 'T') l.set(OX + x, 11, 'L'); }, true, 'q');
    g.layer(l => l.wheel(OX + 22, 15, 9, deg(100)));
    g.outline(); g.stamp(OX + 3, 22, `
eR..............Re
`); return g.text();
  }
  // 3–5: flattened: hide draped over broken timbers, log beside it, the front wheel rolls away and topples
  g.layer(l => { l.rect(OX + 1, 21, 10, 1, 'q'); l.rect(OX + 2, 20, 8, 1, 'w'); l.rect(OX + 3, 19, 6, 1, 'W'); l.set(OX + 5, 19, 'n'); }, true, 'q');
  g.layer(l => { l.rect(OX + 9, 21, 16, 1, 'W'); l.rect(OX + 9, 22, 16, 1, 'd'); for (let x = OX + 11; x < OX + 24; x += 4) l.set(x, 22, 'q'); l.stamp(OX + 24, 20, `
mmz
snz
nzz
`); }, true, 'q');
  g.layer(l => { l.beam(OX + 12, 16, OX + 18, 20, 1.5, WOOD); l.beam(OX + 4, 17, OX + 9, 19, 1.5, WOOD); }, true, 'q');
  g.layer(l => { l.poly([[OX + 3, 16], [OX + 19, 15], [OX + 23, 20], [OX + 1, 21]], 'T'); l.beam(OX + 1, 21, OX + 23, 20, 1.5, ['w', 'w', 'd']);
    for (let x = 0; x < DW; x++) if (l.get(x, 16) === 'T') l.set(x, 16, 'L'); for (const [x, y] of [[8, 18], [9, 18], [14, 18], [15, 19]]) l.set(OX + x, y, 'D'); }, true, 'q');
  if (step === 3) g.layer(l => l.wheel(OX + 21, 14, 9, deg(160)));
  else if (step === 4) g.layer(l => l.wheel(OX + 23, 14, 9, deg(220)));
  else g.layer(l => { l.rect(OX + 23, 22, 9, 1, 'q'); l.rect(OX + 24, 21, 7, 1, 'w'); l.rect(OX + 25, 20, 5, 1, 'W'); l.set(OX + 27, 20, 'n'); }, true, 'q');
  g.outline();
  if (step === 3) g.stamp(OX, 22, `
eR......................Re
`);
  if (step === 4) g.stamp(OX + 2, 21, `
Re...................R
`);
  return g.text();
}
const death = [0, 1, 2, 3, 4, 5].map(k => '\n' + '.'.repeat(DW) + '\n' + '.'.repeat(DW) + dframe(k));
emit(process.argv[2], `
// @pixel ram
// Covered battering ram (painter-siege AAA pass): a hut on two spoked wheels (side-on), roof of team-colour hide with
// stitched seams under a wood ridge pole, the iron-capped log hung on ropes in the open gap under the wall; team pennant
// on the rear of the ridge. Faces right, 30×26, anchor at the ground.
// idle = log sways, pennant flutters · walk 8 (spokes 22.5°/frame, log swings on its ropes) · attack 6: log rammed out
// (impact dust) → hold, the hut rocks back → swing in → drawn back ×2 → forward · death 6 (34×26): hide tears → roof
// sags + front wheel breaks → hut folds → flattened hide over timbers, wheel rolls off and topples.
`, { id: 'ram', anchor: [15, 26], anchors: { death: [17, 26] }, fps: { idle: 3, death: 9 }, frames: { idle, walk, attack, death } });
