import { G, deg, emit, WOOD, STEEL } from './kit.mjs';
const W = 30, H = 20;
const CHEEK = ['W', 'L', 'T', 'T', 'D'], BARREL = ['m', 'n', 'n', 'n', 'z'];
// cannon at offset (ox, oy); rec = recoil px (back), lift = muzzle kick up, th = wheel angle
function cannon(g, { ox = 0, oy = 0, rec = 0, lift = 0, th = 0 } = {}) {
  const X = x => x + ox - rec, Y = y => y + oy;
  g.layer(l => l.beam(X(2), Y(16), X(18), Y(12), 5, CHEEK), true, 'q');                      // carriage cheek (team-painted, wood top edge, team-dark underside)
  g.layer(l => { l.rect(X(1), Y(17), 3, 3, 'T'); l.set(X(1), Y(17), 'L'); l.rect(X(1), Y(19), 3, 1, 'D'); }, true, 'q');  // trail end on the ground (team-painted)
  g.layer(l => { l.rect(X(6), Y(11), 4, 2, 'W'); l.rect(X(6), Y(12), 4, 1, 'd'); }, true, 'q');  // quoin under the breech
  g.layer(l => {                                                                                // barrel: hooped iron staves
    l.beam(X(6), Y(8), X(24), Y(7) - lift, 5, BARREL);
    for (let x = X(8); x < X(24); x++) { for (let y = 0; y < H + 8; y++) if (l.get(x, y) === 'm') { l.set(x, y, 's'); break; } }   // specular along the top
    for (const t of [0.12, 0.42, 0.72]) { const x = Math.round(X(6 + 18 * t)), y = Math.round(Y(8 - t) - lift * t); l.line(x, y - 2, x, y + 2, 'm'); l.set(x, y - 2, 's'); l.line(x + 1, y - 2, x + 1, y + 2, 'z'); }
    l.rect(X(24), Y(4) - lift, 3, 7, 'm'); l.rect(X(24), Y(4) - lift, 3, 1, 's'); l.rect(X(24), Y(10) - lift, 3, 1, 'n'); l.rect(X(26), Y(5) - lift, 1, 5, 'n'); l.set(X(26), Y(7) - lift, 'z'); l.set(X(26), Y(8) - lift, 'z');  // muzzle ring + bore
    l.rect(X(3), Y(7), 3, 3, 'm'); l.set(X(3), Y(7), 's'); l.rect(X(3), Y(9), 3, 1, 'n'); l.set(X(2), Y(8), 'n');   // breech knob
    l.set(X(9), Y(5), 'z');                                                                     // touch hole
  }, true, 'q');
  g.layer(l => l.wheel(X(11), Y(9), 11, th, { iron: true }));
}
function puff(g, cx, cy, r) {
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); if (d > r) continue;
    const k = (dx + dy) / (r || 1);
    const ch = k < -0.55 ? 'k' : k > 0.45 && d > r * 0.45 ? 'j' : 'K';
    const cur = g.get(x, y); if (cur === '.' || 'kKj'.includes(cur) || ch === 'k') g.set(x, y, ch);
  }
}
function frame(o = {}) { const g = new G(W, H); cannon(g, o); g.outline(); return g.text(); }
const idle = [frame(), frame({ lift: 0, th: deg(4) })];
// idle 2: a curl of smoke from the touch hole (slow match), so it is never frozen
idle[1] = (() => { const g = new G(W, H); cannon(g); g.outline(); g.stamp(9, 2, `
.k
k.
.K
`); return g.text(); })();
idle.push((() => { const g = new G(W, H); cannon(g); g.outline(); g.stamp(9, 1, `
k.
.k
..
`); return g.text(); })());
idle.push(idle[0]);
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(k => frame({ th: deg(22.5 * k), lift: k % 4 === 2 ? 1 : 0 }));
// ---- attack: 42×24 (room for the smoke cloud), cannon at (0,+4)
const AW = 42, AH = 24, AY = 4;
function aframe({ rec = 0, lift = 0, flash, smoke = [], dust }) {
  const g = new G(AW, AH); cannon(g, { oy: AY, rec, lift, th: -rec / 5.5 }); g.outline();
  for (const [x, y, r] of smoke) puff(g, x, y, r);
  if (flash) g.stamp(26 - rec, 6 + AY - lift - 3, flash);
  if (dust) g.stamp(dust[0], dust[1], dust[2]);
  return g.text();
}
const FLASH = `
...f.f..
..fFFf..
.fFFFFfy
yFFFFFFf
.fFFFFfy
..fFFf..
...f.f..
`;
const attack = [
  aframe({ rec: 1, lift: 1, flash: FLASH, smoke: [[34, 7, 1.6]] }),
  aframe({ rec: 2, lift: 1, smoke: [[26, 9, 2.4], [30, 8, 3.2], [34, 9, 2.6]], dust: [2, 23, `
eR.
`] }),
  aframe({ rec: 3, smoke: [[26, 8, 3], [31, 6, 4], [36, 9, 3], [29, 2, 2.4]], dust: [0, 23, `
Re
`] }),
  aframe({ rec: 2, smoke: [[29, 5, 2.6], [34, 3, 3.4], [38, 6, 2.4]] }),
  aframe({ rec: 1, smoke: [[34, 2, 2.2], [38, 3, 2.6]] }),
  aframe({ rec: 0, smoke: [[37, 1, 1.6]] }),
];
// ---- death: 38×20, ground row 19
const DW = 38, DH = 20, OX = 3;
function dframe(step) {
  const g = new G(DW, DH);
  if (step === 0) { cannon(g, { ox: OX, oy: -1, lift: 1, th: deg(10) }); g.outline(); g.stamp(OX + 12, 6, `
e..R
.R..
`); return g.text(); }
  if (step === 1) {       // the wheel gives way, carriage drops at the front, barrel tips nose-down
    g.layer(l => l.beam(OX + 2, 17, OX + 22, 14, 4, CHEEK), true, 'q');
    g.layer(l => { l.beam(OX + 6, 8, OX + 25, 10, 5, BARREL); l.rect(OX + 25, 8, 3, 7, 'm'); l.rect(OX + 25, 8, 3, 1, 's'); l.rect(OX + 27, 9, 1, 5, 'n'); l.rect(OX + 3, 7, 3, 3, 'm'); }, true, 'q');
    g.layer(l => l.wheel(OX + 13, 9, 11, deg(40), { iron: true }));
    g.outline(); g.stamp(OX + 24, 17, `
eR
`); return g.text();
  }
  if (step === 2) {       // barrel slides off onto the ground, wheel rolls out from under
    g.layer(l => l.beam(OX + 1, 18, OX + 20, 17, 4, CHEEK), true, 'q');
    g.layer(l => { l.beam(OX + 8, 12, OX + 27, 15, 5, BARREL); l.rect(OX + 27, 13, 3, 6, 'm'); l.rect(OX + 29, 14, 1, 5, 'n'); l.rect(OX + 5, 11, 3, 3, 'm'); }, true, 'q');
    g.layer(l => l.wheel(OX + 18, 8, 11, deg(110), { iron: true }));
    g.outline(); g.stamp(OX + 2, 19, `
eR..............Re
`); return g.text();
  }
  // 3–5: barrel lying on the ground, broken carriage cheek with team colour, quoin, wheel rolling away then down
  g.layer(l => { l.rect(OX + 0, 18, 4, 2, 'w'); l.rect(OX + 0, 19, 4, 1, 'd'); }, true, 'q');
  g.layer(l => l.beam(OX + 2, 17, OX + 16, 17, 4, CHEEK), true, 'q');
  g.layer(l => l.beam(OX + 15, 18, OX + 21, 16, 2, WOOD), true, 'q');
  g.layer(l => { l.beam(OX + 9, 15, OX + 27, 16, 5, BARREL); l.rect(OX + 27, 13, 3, 7, 'm'); l.rect(OX + 27, 13, 3, 1, 's'); l.rect(OX + 29, 14, 1, 6, 'n'); l.rect(OX + 6, 14, 3, 3, 'm'); }, true, 'q');
  if (step === 3) g.layer(l => l.wheel(OX + 22, 7, 11, deg(190), { iron: true }));
  else if (step === 4) g.layer(l => l.wheel(OX + 24, 7, 11, deg(260), { iron: true }));
  else g.layer(l => { l.rect(OX + 23, 19, 11, 1, 'z'); l.rect(OX + 24, 18, 9, 1, 'n'); l.rect(OX + 25, 17, 7, 1, 'm'); l.set(OX + 28, 17, 'w'); }, true, 'q');
  g.outline();
  if (step === 3) g.stamp(OX - 2, 19, `
eR.........................Re
`), g.stamp(OX + 28, 9, `
.k
kK
`);
  if (step === 4) g.stamp(OX + 29, 8, `
k.
.k
`);
  if (step === 5) g.stamp(OX + 30, 9, `
k
k
`);
  return g.text();
}
const death = [0, 1, 2, 3, 4, 5].map(dframe);
emit(process.argv[2], `
// @pixel bombard
// Bombard (painter-siege AAA pass): a fat hooped-iron barrel with a flared muzzle on a team-painted carriage cheek, one big
// iron-tyred wheel (side-on), quoin under the breech, trail on the ground. Faces right, 30×20, anchor at the ground.
// idle = slow-match smoke curling from the touch hole · walk 8 (spokes 22.5°/frame, barrel jolts) · attack 6 (42×24,
// room for the cloud): muzzle flash + recoil → big smoke cloud, carriage rolls back 2–3px (wheel turns backwards) →
// cloud billows up → thins → drifts → wisp, back in place · death 6 (38×20): jolt → wheel gives way → barrel slides
// off → barrel on the ground, wheel rolls away and topples.
`, { id: 'bombard', anchor: [15, 20], anchors: { attack: [15, 24], death: [18, 20] }, fps: { idle: 3, death: 9 }, frames: { idle, walk, attack, death } });
