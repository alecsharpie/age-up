import { Canvas, render, text, deg, emit } from './lib.mjs';
import { G, HIPS, gaitFeet, leg, body } from './horse.mjs';
import fs from 'fs';
const OUT = process.argv[2] || './tools/sprite-lab/drafts/pixel.horsearcher.js';
const INK = 'o';
const MATS = {
  horse: { l: 'r', m: 'h', s: 'H', o: 'H', band: true },
  far: { l: 'H', m: 'H', s: 'F', o: 'F', flat: null },
  mane: { l: 'm', m: 'n', s: 'n', o: 'n', noLeftLight: true },
  eye: { raw: 'o' }, nostril: { raw: 'F' }, blaze: { raw: 'c' },
  hoof: { raw: 'v' }, sock: { l: 'y', m: 'c', s: 'C', o: 'C' },
  team: { l: 'L', m: 'T', s: 'D', o: 'D' }, cloth: { l: 'T', m: 'D', s: 'D', o: 'D', d: 'L' }, teamraw: { raw: 'T' },
  leather: { l: 'w', m: 'q', s: 'Q', o: 'Q' },
  boot: { l: 'Q', m: 'z', s: 'z', o: 'z' },
  trou: { l: 'p', m: 'p', s: 'P', o: 'P' },
  skin: { l: 'j', m: 's', s: 'S', o: 'S' },
  bow: { raw: 'b' }, bowS: { raw: 'B' }, string: { raw: 'y' }, tip: { raw: 'c' },
  steel: { raw: 'i' }, shaft: { raw: 'q' }, fletch: { raw: 'c' },
  ink: { raw: INK }, hd_h: { raw: 'h', grp: 'horse' }, hd_r: { raw: 'r', grp: 'horse' }, hd_H: { raw: 'H', grp: 'horse', o: 'H' },
};
// raw char → material for stamps
const R = {}; for (const [k, v] of Object.entries({ Q: 'Q', q: 'q', w: 'w', c: 'c', C: 'C', z: 'z', j: 'j', s: 's', S: 'S', o: 'o', L: 'L', T: 'T', D: 'D', p: 'p', P: 'P', y: 'y', b: 'b', B: 'B', i: 'i', n: 'n', m: 'm', h: 'h', H: 'H', r: 'r', v: 'v', F: 'F' })) { MATS['raw_' + k] = { raw: v }; R[k] = 'raw_' + k; }

// rider torso+head (no arms), origin = top-left at (9, 2)
const RIDER = `
...Q...
..Qqw..
.ycccC.
.zjjjs.
.zjjos.
..SsS..
.LLTTD.
LLTTTD.
.LTTTD.
.QqqqQ.
.LTTTD.
.LTTDD.
`;
function rider(cv, x, y, o = {}) {
  // quiver behind, on the back hip
  cv.save(); cv.translate(x, y);
  cv.pline([9, 10], [8, 14], 'leather:s'); cv.pline([10, 11], [9, 14], 'leather:m'); cv.px(9, 9, 'fletch'); cv.px(8, 9, 'fletch');
  cv.restore();
  cv.save(); cv.translate(x, y);
  cv.withRing('ink', t => t.stamp(9, 2, RIDER, R));
  // near leg on the flank
  cv.withRing('ink', t => { t.capsule([12.0, 12.8], [14.6, 14.8], 1.0, 'team'); t.capsule([14.6, 15.4], [14.2, 17.4], 0.7, 'boot'); t.px(14, 17, 'boot'); t.px(15, 17, 'boot'); });
  cv.restore();
}
// composite bow: grip at (gx,gy); draw: string hand x (absolute) or null; tilt 0/1
function bow(cv, gx, gy, o = {}) { cv.withRing('ink', t => bow0(t, gx, gy, o)); }
function bow0(cv, gx, gy, o = {}) {
  const pts = [[-1, -4, 'tip'], [-2, -3, 'bowS'], [-1, -2, 'bow'], [0, -1, 'bow'], [0, 0, 'bowS'], [0, 1, 'bow'], [-1, 2, 'bow'], [-2, 3, 'bowS'], [-1, 4, 'tip']];
  const flex = o.flex || 0;
  const P = pts.map(([dx, dy, m]) => [gx + dx - (Math.abs(dy) >= 3 ? flex : 0) + (o.tilt && dy < 0 ? 1 : 0) - (o.tilt && dy > 0 ? 0 : 0), gy + dy, m]);
  const e1 = P[1], e2 = P[7];
  if (o.hand) { cv.pline([e1[0] - 0.5 + 0.5, e1[1] + 1], o.hand, 'string'); cv.pline([e2[0], e2[1] - 1], o.hand, 'string'); }
  else if (o.snap) { for (let yy = e1[1] + 1; yy <= e2[1] - 1; yy++) cv.px(gx - 1 - flex, yy, 'string'); }
  else for (let yy = e1[1] + 1; yy <= e2[1] - 1; yy++) cv.px(e1[0], yy, 'string');
  for (const [x, y, m] of P) cv.px(x, y, m);
}
function arm(cv, sh, el, hand, sleeve = 'team') {
  cv.pline(sh, el, sleeve); cv.pline(el, hand, 'skin:m'); cv.px(hand[0], hand[1], 'skin:l');
}
function arrow(cv, x0, x1, y) { for (let x = x0; x <= x1; x++) cv.px(x, y, 'shaft'); cv.px(x1 + 1, y, 'steel'); cv.px(x0, y - 1, 'fletch'); }

function horse(cv, pose) {
  cv.save(); cv.translate(pose.x, pose.y); cv.rotate(pose.pitch || 0, ...(pose.pivot || [12.5, 17]));
  const feet = {}; for (const k in pose.feet) { const f = pose.feet[k]; feet[k] = f.world ? { foot: cv.inv([pose.x + f.foot[0], f.foot[1]]) } : f; }
  // far legs (behind)
  for (const k of ['ff', 'fh']) leg(cv, HIPS[k], feet[k].foot, k[1], 'far', 'hoof');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    body(t, pose);
    // saddle cloth (team) with a leather saddle
    t.poly([[8.8, 13.2], [16.0, 13.2], [16.4, 19.8], [8.4, 19.8]], 'cloth'); t.rect(8.4, 19, 8.2, 1, 'cloth:d');
    for (const k of ['nf', 'nh']) leg(t, HIPS[k], feet[k].foot, k[1], 'horse', 'hoof', k === 'nh' ? null : null);
  });
  // fringe at the bottom of the cloth, saddle
  cv.restore();
}
const STAND = { nf: { foot: [19.2, G] }, nh: { foot: [6.8, G] }, ff: { foot: [16.6, G] }, fh: { foot: [9.4, G] } };
const XO = 1;
function frame(W, fn) { const cv = new Canvas(W, 28); fn(cv); return text(render(cv, MATS, INK)); }
const TAILS = [[[3.6, 14.0], [2.0, 16.2], [1.6, 19.6]], [[3.6, 14.0], [2.2, 16.4], [2.4, 19.8]], [[3.6, 14.0], [1.8, 16.0], [1.0, 19.2]], [[3.6, 14.0], [2.0, 16.2], [1.6, 19.6]]];

// ---------- idle: breathe, tail swish, hoof shift, ear flick
const idle = [0, 1, 2, 3].map(f => frame(28, cv => {
  const feet = JSON.parse(JSON.stringify(STAND)); if (f === 3) feet.nh.foot = [7.8, G - 0.9];
  horse(cv, { x: XO, y: 0, feet, tail: TAILS[f], neck: f === 2 ? deg(4) : 0, ear: f === 1 ? 1 : 0 });
  const b = f === 2 || f === 3 ? 1 : 0;
  rider(cv, XO, b);
  bow(cv, XO + 16, 10 + b, {});
  arm(cv, [XO + 13, 8 + b], [XO + 14, 10 + b], [XO + 15, 10 + b]);
}));
// ---------- walk (canter): 8 frames
const BOB = [0, -1, -1, 0, 0, 0, 1, 0], PITCH = [-2, -3, -1, 1, 2, 2, 0, -1], RB = [1, 1, 0, 0, -1, 0, 0, 1];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(f => frame(28, cv => {
  const feet = gaitFeet(f, 8);
  const tail = [[3.6, 14.0], [1.6, 15.0 + (f % 4 < 2 ? 0 : 0.6)], [0.6, 17.4 + (f % 4 < 2 ? 0 : 1)]];
  horse(cv, { x: XO, y: BOB[f], pitch: deg(PITCH[f]), feet, tail, neck: deg(PITCH[f] * -1.5), mane: f % 2 ? [17, 10] : null });
  const ry = BOB[f] + RB[f] > 0 ? 1 : BOB[f] + RB[f];
  rider(cv, XO, ry);
  bow(cv, XO + 16, 9 + ry, {});
  arm(cv, [XO + 13, 8 + ry], [XO + 14, 9 + ry], [XO + 15, 9 + ry]);
}));
// ---------- attack: release, recoil, reach to quiver, nock, draw
const AT = [
  { bow: { snap: 1 }, g: [18, 8], draw: [[12, 8], [10, 7], [9, 7]] },
  { bow: { tilt: 1 }, g: [18, 8], draw: [[12, 8], [11, 9], [10, 9]], lean: 0 },
  { bow: {}, g: [17, 9], draw: [[12, 9], [10, 10], [9, 9]] },
  { bow: {}, g: [18, 8], draw: [[12, 8], [13, 9], [15, 8]], arrow: [14, 19] },
  { bow: { flex: 1 }, g: [18, 8], draw: [[12, 8], [12, 9], [13, 7]], arrow: [13, 19], hand: [13, 7] },
];
const attack = AT.map((a, f) => frame(28, cv => {
  horse(cv, { x: XO, y: 0, feet: STAND, tail: TAILS[f % 4], neck: f === 0 ? deg(-4) : 0, ear: f === 0 ? 1 : 0 });
  rider(cv, XO, 0);
  const g = [XO + a.g[0], a.g[1]];
  const hand = a.hand ? [XO + a.hand[0], a.hand[1]] : null;
  if (a.arrow) arrow(cv, XO + a.arrow[0], XO + a.arrow[1] - 1, a.g[1] - (a.hand ? 1 : 0));
  bow(cv, g[0], g[1], Object.assign({}, a.bow, hand ? { hand } : {}));
  arm(cv, [XO + 13, 8], [XO + 15, 8], [g[0] - 1, g[1]]);
  const d = a.draw.map(p => [XO + p[0], p[1]]); arm(cv, d[0], d[1], d[2]);
}));

// ---------- death (36×28): hit → rear → fall → impact → bounce → settle; corpse with the rider thrown clear
const XD = XO + 4;
const FALLING = `
.....zz
....LTz
...LTT.
..LTTD.
.zjjT..
zjjs...
.jSs...
`;
const LYING = `
.zjj.LLTTTDz.
zjjsSLTTTDDzz
.zSs.DDDDDDz.
`;
const W = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { foot: v, world: true }]));
function corpse(cv, dy, relax) {
  cv.save(); cv.translate(2, dy);
  // far legs, stiff, out from the belly behind the near ones
  cv.capsule([22.2, 23.0], [27.4, 25.4 - relax], 0.8, 'far'); cv.capsule([14.6, 23.2], [19.8, 25.6], 0.8, 'far');
  cv.px(27.6, 25.6 - relax, 'hoof'); cv.px(20, 25.8, 'hoof');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    t.ellipse(11.6, 21.6, 3.8, 3.4, 'horse');
    t.ellipse(17.6, 21.8, 7.4, 3.2, 'horse');
    t.poly([[22.0, 18.8], [24.6, 19.0], [28.6, 23.4], [28.0, 26.9], [24.0, 25.0]], 'horse');
    t.poly([[27.2, 23.2], [29.6, 22.8], [32.8, 24.8], [33.0, 27.0], [27.6, 27.0]], 'horse');
    t.px(27, 22, 'horse:s'); t.px(29, 24, 'eye'); t.px(32, 25, 'nostril');
    t.line([[22.0, 18.8], [25.0, 19.6], [28.0, 22.4]], 0.8, 'mane');
    t.poly([[14.4, 18.4], [20.2, 18.4], [20.6, 22.8], [14.0, 22.8]], 'cloth');
    t.rect(14.0, 22, 6.6, 1, 'cloth:d');
    // near legs, stiff, angled down onto the ground
    t.capsule([21.0, 23.6], [25.0, 26.4 - relax * 0.6], 0.85, 'horse'); t.capsule([13.0, 23.6], [17.0, 26.4], 0.85, 'horse');
    t.px(25.4, 26.6 - relax * 0.6, 'hoof'); t.px(26.4, 26.6 - relax * 0.6, 'hoof'); t.px(17.4, 26.6, 'hoof'); t.px(18.4, 26.6, 'hoof');
  });
  cv.line([[8.4, 20.4], [6.4, 23.8], [5.4, 27.0]], 0.8, 'mane');
  cv.restore();
}
const death = [0, 1, 2, 3, 4, 5].map(f => frame(36, cv => {
  if (f === 0) {
    horse(cv, { x: XD, y: 0, feet: STAND, tail: [[3.6, 14.0], [1.4, 15.0], [0.4, 17.0]], neck: deg(-10), ear: 1 });
    rider(cv, XD - 1, 0); bow(cv, XD + 15, 5, { tilt: 1 }); arm(cv, [XD + 12, 8], [XD + 13, 6], [XD + 14, 5]);
  } else if (f === 1) {
    horse(cv, { x: XD, y: 1, pitch: deg(-19), pivot: [7.5, 19], neck: deg(-6), ear: 1, tail: [[3.6, 14.0], [1.8, 17.0], [1.6, 21.0]],
      feet: Object.assign(W({ nh: [7.8, G], fh: [9.2, G] }), { nf: { foot: [20.2, 21.6] }, ff: { foot: [18.6, 22.2] } }) });
    rider(cv, XD - 3, 3); bow(cv, XD + 9, 6, { tilt: 1 }); arm(cv, [XD + 10, 11], [XD + 10, 9], [XD + 9, 7]);
  } else if (f === 2) {
    horse(cv, { x: XD, y: 3, pitch: deg(10), pivot: [12.5, 17], neck: deg(14), ear: 1, tail: [[3.6, 14.0], [1.6, 17.0], [1.0, 20.6]],
      feet: W({ nf: [21.0, G], ff: [20.0, G], nh: [5.6, G], fh: [6.8, G] }) });
    cv.withRing('ink', t => t.stamp(1, 18, FALLING, R));
    bow(cv, 9, 24, {});
  } else {
    corpse(cv, f === 4 ? -1 : 0, f === 5 ? 1 : 0);
    cv.withRing('ink', t => t.stamp(0, 25, LYING, R));
    // bow on the ground beside the rider
    cv.withRing('ink', t => { for (let x = 2; x <= 8; x++) t.px(x, 24, x === 2 || x === 8 ? 'tip' : 'bow'); });
  }
}));
fs.writeFileSync(OUT, emit({
  id: 'horsearcher', anchor: [14, 28], anchors: { death: [18, 28] },
  header: `// @pixel horsearcher
// Horse archer, facing right: light bay horse (neck, ears, mane, tail, fetlocks, hooves) with a team saddle cloth; rider in a
// team tunic and fur-trimmed cap with a short recurved composite bow and a back quiver. 28×28, hooves on the bottom row.
// walk = 8-frame canter; attack = release → recoil → reach for the quiver → nock → draw. Generated by painter-exotic's rig.`,
  palette: {
    o: ['#24180f', 'ink outline'], r: ['#bd8a52', 'horse light'], h: ['#8e5a2e', 'horse'], H: ['#5f3620', 'horse shade'], F: ['#40241a', 'far legs shade'],
    m: ['#5a3a26', 'mane light'], n: ['#2e1c12', 'mane, tail'], v: ['#3d3530', 'hooves'],
    j: ['#f2d2b0', 'skin light'], s: ['#e8c39e', 'skin'], S: ['#c9a07a', 'skin shade'],
    T: ['team'], D: ['teamdark'], L: ['teamlight'],
    w: ['#a07a4a', 'leather light'], q: ['#8a6a3a', 'leather'], Q: ['#5a3a18', 'leather shade'], z: ['#3b2614', 'boots'],
    p: ['#6e5c4a', 'trousers'], P: ['#4e3f32', 'trousers shade'],
    y: ['#efe6d2', 'bowstring, linen light'], c: ['#d9c7a0', 'fur trim, blaze, fletching'], C: ['#a8946e', 'linen shade'],
    b: ['#8a4a2a', 'composite bow'], B: ['#55281a', 'bow shade'], i: ['#e6eaee', 'arrowhead'],
  },
  frames: { idle, walk, attack, death },
}));
console.log('wrote', OUT);
