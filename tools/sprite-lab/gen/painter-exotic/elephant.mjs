import { Canvas, render, text, deg, emit, ik } from './lib.mjs';
import fs from 'fs';
const OUT = process.argv[2] || './tools/sprite-lab/drafts/pixel.warelephant.js';
const INK = 'o', GY = 29.5, HGT = 30;
const MATS = {
  hide: { l: 'a', m: 'g', s: 'G', o: 'K', band: true },
  far: { l: 'G', m: 'G', s: 'K', o: 'K' },
  ear: { l: 'e', m: 'E', s: 'G', o: 'K', band: true },
  trunk: { l: 'a', m: 'g', s: 'G', o: 'K', grp: 'trunk' },
  crease: { raw: 'G' }, creaseK: { raw: 'K' }, nail: { raw: 'a' }, eye: { raw: 'o' },
  tusk: { l: 'i', m: 'i', s: 'I', o: 'I' },
  hair: { raw: 'K' },
  team: { l: 'L', m: 'T', s: 'D', o: 'D' }, cloth: { l: 'L', m: 'T', s: 'D', o: 'D', band: true },
  gold: { l: 'y', m: 'u', s: 'U', o: 'U' }, tassel: { raw: 'r' },
  wood: { l: 'w', m: 'q', s: 'Q', o: 'Q' }, woodS: { raw: 'Q' },
  skin: { l: 'j', m: 's', s: 'S', o: 'S' },
  steel: { raw: 'm' }, shaft: { raw: 'q' }, smear: { raw: 'j' },
  ink: { raw: INK },
};
const R = {}; for (const k of 'QqwzjsSoLTDymMuUrnckK') { MATS['raw_' + k] = { raw: k }; R[k] = 'raw_' + k; }
const HIPS = { nf: [20.0, 20.6], nh: [7.4, 20.6], ff: [18.0, 20.0], fh: [9.6, 20.0] };
// 4-beat lateral walk: LH, LF, RH, RF; long stance so 3 feet carry the weight
function walkFeet(f, n) {
  const duty = 0.72, S = 1.9, lift = 1.8, off = { fh: 0, ff: 0.25, nh: 0.5, nf: 0.75 }; const r = {};
  for (const k in off) { const p = ((f / n - off[k]) % 1 + 1) % 1, hip = HIPS[k]; let fx, fy;
    if (p < duty) { fx = hip[0] + S - 2 * S * p / duty; fy = GY; }
    else { const q = (p - duty) / (1 - duty), e = 0.5 - 0.5 * Math.cos(Math.PI * q); fx = hip[0] - S + 2 * S * e; fy = GY - lift * Math.sin(Math.PI * q); }
    r[k] = { foot: [fx, fy] }; }
  return r;
}
function leg(cv, hip, foot, kind, mat) {
  const fore = kind === 'f'; const [j] = ik(hip, foot, 4.6, 4.6, fore ? 1 : -1);
  cv.capsule(hip, j, 2.15, mat, 1.95); cv.capsule(j, [foot[0], foot[1] - 1.0], 1.95, mat, 1.95);
  const fx = Math.round(foot[0]), fy = Math.floor(foot[1]);
  for (let x = fx - 2; x <= fx + 1; x++) cv.px(x, fy, mat === 'far' ? 'far:s' : 'hide:s');
  if (mat !== 'far') { cv.px(fx + 1, fy, 'nail'); cv.px(fx - 1, fy, 'nail'); cv.px(fx - 1, Math.floor(j[1]) + 1, 'crease'); cv.px(fx, Math.floor(j[1]) + 1, 'crease'); }
}
/** pose: ear (0..2 flap), trunk: list of points, tail, head (rad), mouth */
function elephantBody(cv, o) {
  const H = 'hide';
  cv.ellipse(8.4, 16.2, 6.4, 5.4, H);        // rump / hind quarters
  cv.ellipse(13.6, 16.2, 9.4, 5.2, H);       // barrel
  cv.ellipse(12.4, 12.2, 5.2, 2.4, H);       // back ridge
  cv.save(); cv.rotate(o.head || 0, 20, 15);
  cv.ellipse(22.8, 12.8, 4.4, 4.8, H);       // head dome
  cv.ellipse(21.4, 9.8, 2.6, 1.8, H);        // twin dome
  cv.ellipse(24.6, 16.0, 2.8, 2.6, H);       // cheek / trunk root
  // trunk
  cv.withRing('creaseK', t => { t.T = cv.T.map(r => r.slice()); const P = o.trunk;
    for (let i = 0; i + 1 < P.length; i++) t.capsule(P[i], P[i + 1], 1.55 - i * 0.28, 'trunk', 1.55 - (i + 1) * 0.28); });
  // tusks
  const tk = o.tusk || [[24.6, 17.8], [27.2, 19.2], [28.4, 18.0]];
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); t.capsule(tk[0], tk[1], 0.75, 'tusk', 0.6); t.capsule(tk[1], tk[2], 0.6, 'tusk', 0.45); });
  cv.px(24, 12, 'eye'); cv.px(23, 11, 'creaseK');
  // ear: a big flap on the side of the head, outlined
  const ex = [0, 0.8, 1.6][o.ear || 0];
  cv.withRing('creaseK', t => { t.T = cv.T.map(r => r.slice()); t.poly([[18.6, 9.4], [21.4, 9.0], [22.4, 12.0], [21.8, 16.6], [20.6, 19.4 + ex * 0.3], [18.8, 19.0], [17.2 - ex, 16.0], [17.0 - ex, 11.4]], 'ear'); });
  cv.restore();
  const t = o.tail || [[2.4, 15.6], [1.6, 19.0], [1.6, 22.0]];
  cv.line(t, 0.5, 'far'); cv.px(Math.floor(t[2][0]), Math.floor(t[2][1]) + 1, 'hair');
}
// howdah: wooden box with gold rail on a big team cloth; rider inside (head/torso above the rail)
const RIDER = `
..MMm.
.MmmmM
.Mjjsk
.njjoS
..sSs.
.LTTTD
LLTTTD
`;
function howdah(cv, o = {}) {
  // caparison: team cloth over the back and upper flank, gold border, red tassels
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    t.poly([[6.6, 10.2], [17.2, 10.2], [17.8, 16.8], [6.0, 16.8]], 'cloth');
    t.rect(6.0, 16.0, 11.8, 1.0, 'gold:m');
  });
  for (let x = 7; x <= 17; x += 2) cv.px(x, 17.0, 'tassel');
  // rider: head + shoulders above the box
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); t.stamp(9 + (o.rx || 0), 3 + (o.ry || 0), RIDER, R); });
  // the box: wood with a gold rail, posts
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    t.rect(7.6, 7.6, 9.0, 2.8, 'wood');
    t.rect(7.6, 7.6, 9.0, 1, 'gold:l');
    for (const x of [9, 12, 15]) t.rect(x, 8.6, 1, 1.6, 'woodS');
  });
}
function spear(cv, hand, tip) { cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); t.pline(hand, tip, 'shaft'); t.px(tip[0], tip[1], 'steel'); }); }
function elephant(cv, pose) {
  cv.save(); cv.translate(pose.x, pose.y); cv.rotate(pose.pitch || 0, ...(pose.pivot || [13, 22]));
  const feet = {}; for (const k in pose.feet) { const f = pose.feet[k]; feet[k] = f.world ? { foot: cv.inv([pose.x + f.foot[0], f.foot[1]]) } : f; }
  for (const k of ['ff', 'fh']) leg(cv, HIPS[k], feet[k].foot, k[1], 'far');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); elephantBody(t, pose); for (const k of ['nf', 'nh']) leg(t, HIPS[k], feet[k].foot, k[1], 'hide'); });
  // re-draw ear + trunk on top of the ring
  cv.save(); cv.rotate(pose.hr || 0, 12, 11); cv.translate(pose.hx || 0, pose.hy || 0); howdah(cv, pose); cv.restore();
  if (pose.spear) spear(cv, pose.spear[0], pose.spear[1]);
  cv.restore();
}
const STAND = { nf: { foot: [20.4, GY] }, nh: { foot: [7.2, GY] }, ff: { foot: [17.6, GY] }, fh: { foot: [10.0, GY] } };
const frame = (W, fn) => { const cv = new Canvas(W, HGT); fn(cv); return text(render(cv, MATS, INK)); };
const trunkAt = (sw, curl = 0) => [[25.6, 16.0], [26.8 + sw * 0.3, 20.4], [27.0 + sw * 0.7, 24.2], [26.6 + sw + curl, 27.0 - curl * 0.8]];
const TAILS = [[[2.4, 15.6], [1.6, 19.0], [1.6, 22.0]], [[2.4, 15.6], [1.8, 19.0], [2.4, 22.0]], [[2.4, 15.6], [1.2, 19.0], [0.8, 21.8]]];
// ---------- idle: trunk sways, ears fan, tail flicks, rider breathes
const IDL = [{ sw: 0, ear: 0, t: 0 }, { sw: 0.8, ear: 1, t: 1 }, { sw: 1.4, ear: 2, t: 0, ry: 1 }, { sw: 0.6, ear: 1, t: 2, ry: 1 }];
const idle = IDL.map(p => frame(30, cv => elephant(cv, { x: 0, y: 0, feet: STAND, trunk: trunkAt(p.sw - 0.6), ear: p.ear, tail: TAILS[p.t], ry: p.ry || 0,
  spear: [[15, 6 + (p.ry || 0)], [15, 1 + (p.ry || 0)]] })));
// ---------- walk: slow 4-beat, heavy 1-px bob, trunk swings as a pendulum, ears flap
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(f => frame(30, cv => {
  const bob = [0, 1, 1, 0, 0, 1, 1, 0][f], sw = Math.sin(f / 8 * Math.PI * 2) * 1.4;
  elephant(cv, { x: 0, y: bob, feet: walkFeet(f, 8), trunk: trunkAt(sw - 0.4), ear: [0, 1, 2, 1][f % 4], tail: TAILS[[0, 1, 0, 2][f % 4]], ry: [0, 0, 1, 0, 0, 0, 1, 0][f],
    spear: [[15, 6], [15, 1]] });
}));
// ---------- attack: tusk/trunk swipe (strike lands on frame 0) → hold → rear up slightly → peak → settle
const AT = [
  { pitch: 4, head: 10, trunk: [[25.6, 16.0], [28.0, 19.8], [29.2, 23.0], [29.4, 25.8]], smear: 1, spear: [[16, 8], [21, 11]] },
  { pitch: 3, head: 8, trunk: [[25.6, 16.0], [27.6, 20.0], [28.8, 23.4], [29.2, 26.2]], spear: [[16, 8], [20, 10]] },
  { pitch: -3, head: -6, trunk: [[25.6, 15.6], [27.8, 13.0], [28.6, 10.8], [27.6, 8.6]], ear: 2, lift: 1, spear: [[15, 7], [16, 1]] },
  { pitch: -5, head: -10, trunk: [[25.6, 15.4], [27.8, 12.6], [28.4, 9.2], [27.2, 7.0]], ear: 2, lift: 2, spear: [[14, 7], [12, 2]] },
  { pitch: -1, head: -2, trunk: trunkAt(0.6), ear: 1, lift: 0, spear: [[15, 6], [15, 1]] },
];
const attack = AT.map(a => frame(30, cv => {
  const feet = Object.assign({}, { nh: { foot: [7.2, GY], world: true }, fh: { foot: [10.0, GY], world: true } },
    a.lift ? { nf: { foot: [20.4, GY - a.lift * 1.3] }, ff: { foot: [17.8, GY - a.lift] } } : { nf: { foot: [20.4, GY], world: true }, ff: { foot: [17.6, GY], world: true } });
  elephant(cv, { x: 0, y: 0, pitch: deg(a.pitch), pivot: a.pitch < 0 ? [8, 24] : [14, 24], head: deg(a.head), trunk: a.trunk, ear: a.ear || 0, tail: TAILS[0], feet, spear: a.spear });
  if (a.smear) for (const [x, y] of [[29, 17], [29, 18], [29, 19], [29, 20], [28, 16]]) cv.px(x, y, 'smear');
}));
// ---------- death 38×30: hit (rears, trumpets) → stagger, fore knees buckle → falling, howdah tips → down on its side → bounce → settle
const XD = 4;
const W = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { foot: v, world: true }]));
const LYING = `
.MMjj.LLTTTD.
MmmjjSLTTTDDz
.MMsS.DDDDDD.
`;
function corpse(cv, dy, relax) {
  cv.save(); cv.translate(XD, dy);
  // broken howdah tipped over behind, team canopy on the ground
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); t.rotate(deg(-18), 4, 24); t.rect(-0.6, 21.6, 8.4, 3.2, 'wood'); t.rect(-0.6, 21.6, 8.4, 1, 'gold:l'); for (const x of [1, 4]) t.rect(x, 22.6, 1, 1.6, 'woodS'); });
  cv.capsule([22.0, 25.6], [27.6, 26.6], 1.8, 'far'); cv.capsule([12.0, 25.8], [17.4, 26.8], 1.8, 'far');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    t.ellipse(15.0, 23.0, 10.6, 4.4, 'hide'); t.ellipse(10.0, 22.2, 5.6, 4.8, 'hide');
    t.ellipse(26.6, 24.0, 4.4, 3.4, 'hide');
    t.poly([[6.4, 19.0], [19.6, 18.4], [20.0, 23.6], [7.0, 23.8]], 'cloth'); t.rect(7.0, 23.0, 13.0, 1, 'gold:m');
    t.poly([[24.0, 21.0], [27.0, 20.6], [28.4, 24.2], [26.0, 27.0], [22.6, 26.0]], 'ear');
    t.capsule([29.8, 25.4], [33.0, 26.6], 1.3, 'trunk', 0.9); t.capsule([33.0, 26.6], [35.2, 27.0], 0.9, 'trunk', 0.6);
    t.capsule([29.4, 26.6], [32.0, 27.6], 0.6, 'tusk', 0.45);
    t.capsule([20.6, 26.4], [26.0, 27.4], 1.6, 'hide'); t.capsule([9.6, 26.4], [14.6, 27.4], 1.6, 'hide');
  });
  cv.px(28, 23, 'eye');
  cv.restore();
}
const death = [
  cv => { elephant(cv, { x: XD, y: 0, pitch: deg(-4), pivot: [8, 24], head: deg(-12), trunk: [[25.6, 15.4], [27.8, 12.6], [28.4, 9.2], [27.2, 7.0]], ear: 2, tail: TAILS[2],
    feet: Object.assign(W({ nh: [XD + 7.2, GY], fh: [XD + 10.0, GY] }), { nf: { foot: [20.4, GY - 2] }, ff: { foot: [17.8, GY - 1.5] } }), rx: -1, spear: [[XD + 14, 6], [XD + 10, 1]] }); },
  cv => { elephant(cv, { x: XD, y: 2, pitch: deg(7), pivot: [14, 24], head: deg(14), trunk: trunkAt(1.6, 1), ear: 1, tail: TAILS[1],
    feet: Object.assign(W({ nh: [XD + 7.2, GY], fh: [XD + 10.0, GY] }), { nf: { foot: [18.6, 26.4] }, ff: { foot: [16.6, 26.0] } }), ry: 1, rx: 1, hr: deg(8) }); },
  cv => { elephant(cv, { x: XD, y: 5, pitch: deg(4), pivot: [14, 24], head: deg(18), trunk: trunkAt(2.4, 1.4), ear: 0, tail: TAILS[0],
    feet: { nf: { foot: [19.0, 24.4] }, ff: { foot: [17.0, 24.0] }, nh: { foot: [8.6, 24.4] }, fh: { foot: [10.4, 24.0] } }, ry: 2, rx: -2, hr: deg(-28), hx: -2, hy: 2 }); },
  cv => { corpse(cv, 0, 0); cv.withRing('ink', t => t.stamp(0, 27, LYING, Object.assign({}, R, { M: 'raw_M', m: 'raw_m' }))); },
  cv => { corpse(cv, -1, 0); cv.withRing('ink', t => t.stamp(0, 27, LYING, Object.assign({}, R, { M: 'raw_M', m: 'raw_m' }))); },
  cv => { corpse(cv, 0, 1); cv.withRing('ink', t => t.stamp(0, 27, LYING, Object.assign({}, R, { M: 'raw_M', m: 'raw_m' }))); spear(cv, [9, 26], [16, 25]); },
].map(fn => frame(38, fn));
fs.writeFileSync(OUT, emit({
  id: 'warelephant', anchor: [15, 30], anchors: { death: [19, 30] },
  header: `// @pixel warelephant
// War elephant, facing right: big grey elephant (domed head, fanning ear, swinging trunk, ivory tusks, pillar legs with toenails)
// under a gold-bordered team caparison and a wooden howdah with a team canopy; a spearman rides in the box. 30×30, feet on the
// bottom row. walk = slow 8-frame 4-beat; attack = tusk/trunk swipe (frame 0) → hold → rear up → peak → settle.
// death = rears → knees buckle → falls → lies on its side with the howdah broken beside it. Generated by painter-exotic's rig.`,
  palette: {
    o: ['#24180f', 'ink outline'], a: ['#b2aea8', 'hide light'], g: ['#8c8a90', 'hide'], G: ['#686878', 'hide shade'], K: ['#40404c', 'hide deep'],
    e: ['#a4969a', 'ear light'], E: ['#84787e', 'ear'], i: ['#f4ecd8', 'ivory'], I: ['#c8b890', 'ivory shade'],
    T: ['team'], D: ['teamdark'], L: ['teamlight'],
    y: ['#ffe28a', 'gold light'], u: ['#e1b12c', 'gold'], U: ['#a87a12', 'gold shade'], r: ['#b0402a', 'tassels'],
    w: ['#a07a4a', 'wood light'], q: ['#8a6a3a', 'wood'], Q: ['#5a3a18', 'wood shade'], z: ['#3b2614', 'boots'],
    j: ['#f2d2b0', 'skin light'], s: ['#e8c39e', 'skin'], S: ['#c9a07a', 'skin shade'],
    m: ['#e6eaee', 'spear tip, helmet light'], M: ['#9aa0a6', 'helmet'], n: ['#5f656c', 'helmet shade'], k: ['#3b2a1a', 'hair'],
  },
  frames: { idle, walk, attack, death },
}));
console.log('wrote', OUT);
