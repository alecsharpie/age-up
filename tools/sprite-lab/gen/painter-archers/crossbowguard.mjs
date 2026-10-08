import { body, WALK, SWING, STAND, write, death, DOX, DW } from './common.mjs';
import { TUNIC } from './body.mjs';
const OUT = process.argv[2] || 'out.crossbowguard.js';
// steel kettle hat with a wide brim
const HELM = `
...iIm..
..iIIIm.
.IiIIIImM
..hsses.
..hassS.
..hsssS.
...SSS..
`;
const HELM_BLINK = HELM.replace('..hsses.', '..hssSs.');
// pavise slung on the back: a tall team-coloured shield with a light cross
const PAVISE = `
.DTD.
DLLTD
DLTTD
LLLLD
DLTTD
DLTTD
DLTTD
DLTTD
DLTTD
DTTDD
.DDD.
`;
function hooks(extra = {}) {
  return Object.assign({
    sleeve: 'wool',
    back(p, o) { if (!o.pose.noPavise) p.stamp(o.ux + 1, o.uy + 6, PAVISE); },
    torso(p, o) { p.stamp(5 + o.ux, 8 + o.uy, TUNIC); },
    head(p, o) { p.stamp(4 + o.ux, 1 + o.uy, o.pose.blink ? HELM_BLINK : HELM); },
  }, extra);
}
// crossbow: wooden stock (solid, outlined) from butt to muzzle, steel prod across the muzzle, string as linework.
// span: 'spanned' (string drawn back to the nut), 'loose' (string straight against the prod), bolt: lay a bolt.
function xbow(p, butt, muz, span = 'spanned', bolt = false, crank = null) {
  const [bx, by] = butt, [mx, my] = muz; const L = Math.hypot(mx - bx, my - by), dx = (mx - bx) / L, dy = (my - by) / L;
  p.line(bx, by, mx, my, 'leather'); if (Math.abs(dx) > 0.7) p.line(bx, by + 1, mx - Math.round(dx * 2), my + 1 - Math.round(dy * 2), 'leather'); else p.line(bx + 1, by, mx + 1 - Math.round(dx * 2), my - Math.round(dy * 2), 'leather');
  const px = -dy, py = dx; const t1 = [mx + px * 2.5, my + py * 2.5], t2 = [mx - px * 2.5, my - py * 2.5];
  p.line(Math.round(t1[0]), Math.round(t1[1]), Math.round(t2[0]), Math.round(t2[1]), 'steel');
  const nut = [mx - dx * 3, my - dy * 3];
  const T1 = [Math.round(t1[0] - dx), Math.round(t1[1] - dy)], T2 = [Math.round(t2[0] - dx), Math.round(t2[1] - dy)];
  if (span === 'spanned') { p.ln(T1[0], T1[1], Math.round(nut[0]), Math.round(nut[1]) - (Math.abs(dy) < 0.5 ? 0 : 0), 'N'); p.ln(Math.round(nut[0]), Math.round(nut[1]), T2[0], T2[1], 'N'); }
  else p.ln(T1[0], T1[1], T2[0], T2[1], 'N');
  if (bolt) { const ox = Math.round(-px), oy = Math.round(-py); p.ln(Math.round(nut[0]) + ox, Math.round(nut[1]) + oy, mx + ox + Math.round(dx), my + oy + Math.round(dy), 'W'); p.px(mx + ox + Math.round(dx), my + oy + Math.round(dy), 'i'); }
  if (crank) { p.ln(bx, by, crank[0], crank[1], 'M'); p.px(crank[0], crank[1], 'I'); }
}
function hands(p, o, pose) { for (const a of [pose.barm, pose.farm]) if (a) { const [x, y] = a[2]; p.put(x + o.ux, y + o.uy, 'skin', 1); p.put(x + o.ux + 1, y + o.uy, 'skin', 2); } }
const carry = (s = 0) => ({ farm: [[9, 9], [10, 11], [11, 12]], barm: [[6, 9], [6, 11], [7, 12]] });
function idleFrame(bob, blink, k = 0) {
  const pose = Object.assign({}, STAND, { bob, blink }, carry());
  return body(pose, hooks({ front(p, o) { xbow(p, [6 + o.ux, 13 + o.uy], [14 + o.ux, 13 + o.uy + (k ? 1 : 0)], 'spanned', false); hands(p, o, pose); } })).render();
}
function walkFrame(k) {
  const s = SWING[k], pose = Object.assign({}, WALK[k], carry(s));
  return body(pose, hooks({ front(p, o) { xbow(p, [6 + o.ux, 13 + o.uy], [14 + o.ux, 13 + o.uy], 'spanned', false); hands(p, o, pose); } })).render();
}
// aimed: stock to the cheek, held level
const AIMF = [[8, 9], [10, 11], [11, 10]], AIMB = [[6, 9], [6, 11], [7, 9]];
function aim(span, bolt, extra = {}) {
  const pose = Object.assign({}, STAND, { farm: extra.farm || AIMF, barm: extra.barm || AIMB, lean: extra.lean || 0, bob: extra.bob || 0 });
  return body(pose, hooks({ farmOpt: { hh: 1 }, barmOpt: { hh: 1 }, front(p, o) {
    const b = extra.butt || [7, 9], m = extra.muz || [13, 9];
    xbow(p, [b[0] + o.ux, b[1] + o.uy], [m[0] + o.ux, m[1] + o.uy], span, bolt, extra.crank ? [extra.crank[0] + o.ux, extra.crank[1] + o.uy] : null); hands(p, o, pose);
  } })).render();
}
function mkDeath(pose, ox) { return body(pose, hooks(), DW, 40, ox); }
const DEATH = death(mkDeath, {
  recoil: Object.assign({}, STAND, { lean: -1, farm: [[8, 9], [6, 6], [5, 4]], barm: [[6, 9], [4, 8], [3, 6]] }),
  buckle: { bob: 3, F: [10, 21], B: [8, 21], fk: 2, bk: 2, lean: -1, farm: [[8, 9], [6, 7], [4, 6]], barm: [[6, 9], [4, 10], [3, 12]] },
  lie: Object.assign({}, STAND, { F: [7, 21], B: [6, 21], farm: [[9, 9], [10, 12], [11, 15]], barm: null }),
}, (p, k) => {
  const X = DOX;
  if (k === 0) xbow(p, [X + 9, 11], [X + 15, 9], 'loose');
  if (k === 1) xbow(p, [X + 10, 17], [X + 16, 17], 'loose');
  if (k === 2) xbow(p, [X + 12, 20], [X + 17, 18], 'loose');
  if (k >= 3) xbow(p, [X + 10, 22], [X + 16, 22], 'loose');
});
const frames = {
  idle: [idleFrame(0), idleFrame(0), idleFrame(0, true), idleFrame(1), idleFrame(1, false, 1), idleFrame(1)],
  walk: WALK.map((_, k) => walkFrame(k)),
  ready: [aim('spanned', true), aim('spanned', true), aim('spanned', true, { bob: 1 })],
  attack: [
    aim('loose', false),                                                                                   // trigger: string slams forward, bolt gone
    aim('loose', false, { lean: -1, butt: [7, 10], muz: [13, 7] }),                                        // kick: muzzle jumps
    aim('loose', false, { butt: [9, 10], muz: [12, 17], farm: [[8, 9], [10, 11], [10, 11]], barm: [[6, 9], [7, 11], [9, 10]] }),   // nose to the ground
    aim('loose', false, { bob: 1, butt: [9, 11], muz: [12, 18], crank: [7, 9], farm: [[8, 10], [10, 12], [10, 12]], barm: [[6, 10], [6, 9], [7, 9]] }),  // crank
    aim('spanned', false, { bob: 1, butt: [9, 11], muz: [12, 18], crank: [11, 9], farm: [[8, 10], [10, 12], [10, 12]], barm: [[6, 10], [8, 8], [11, 9]] }), // crank round
    aim('spanned', true, { butt: [7, 11], muz: [13, 12], farm: [[8, 9], [10, 11], [11, 11]], barm: [[6, 9], [6, 11], [7, 11]] }),  // bolt laid, coming up
  ],
  death: DEATH,
};
write(OUT, 'crossbowguard', '// Crossbowguard: steel kettle hat, team tunic, team pavise slung on the back, crossbow held level. Generated by painter-archers/crossbowguard.mjs.', { anchor: [8, 24], anchors: { death: [8 + DOX, 24] }, frames });
