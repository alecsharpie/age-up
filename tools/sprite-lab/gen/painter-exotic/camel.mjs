import { Canvas, render, text, deg, emit, ik } from './lib.mjs';
import fs from 'fs';
const OUT = process.argv[2] || './tools/sprite-lab/drafts/pixel.camelrider.js';
const INK = 'o', GY = 29.5, HGT = 30;
const MATS = {
  camel: { l: 'a', m: 'c', s: 'C', o: 'K', band: true },
  far: { l: 'C', m: 'C', s: 'K', o: 'K' },
  pad: { raw: 'v' }, eye: { raw: 'o' }, lip: { raw: 'K' }, knee: { raw: 'K' },
  hair: { l: 'C', m: 'K', s: 'K', o: 'K' },
  team: { l: 'L', m: 'T', s: 'D', o: 'D' }, cloth: { l: 'T', m: 'D', s: 'D', o: 'D', d: 'L' },
  tassel: { raw: 'g' },
  leather: { l: 'w', m: 'q', s: 'Q', o: 'Q' }, boot: { l: 'Q', m: 'z', s: 'z', o: 'z' },
  skin: { l: 'j', m: 's', s: 'S', o: 'S' },
  steel: { raw: 'i' }, steelM: { raw: 'I' }, steelS: { raw: 'J' }, hilt: { raw: 'g' }, smear: { raw: 'y' },
  ink: { raw: INK },
};
const R = {}; for (const k of 'QqwcCzjsSoLTDyiIJgaKvAkn') { MATS['raw_' + k] = { raw: k }; R[k] = 'raw_' + k; }
// camel head (hand painted), top-left at local (21,6): long face, droopy lip, small ear
const HEAD = `
.AA.....
aAccc...
acccccc.
acoccccc
cccccccK
.CCCCKK.
`;
const HMAP = { a: 'hd_a', c: 'hd_c', C: 'hd_C', A: 'hd_A', o: 'eye', K: 'lip' };
Object.assign(MATS, { hd_a: { raw: 'a', grp: 'camel' }, hd_c: { raw: 'c', grp: 'camel' }, hd_C: { raw: 'C', grp: 'camel', o: 'K' }, hd_A: { raw: 'C', grp: 'camel', o: 'K' } });

const HIPS = { nf: [18.8, 19.6], nh: [8.2, 19.4], ff: [17.6, 19.6], fh: [9.4, 19.4] };
// pacing: both legs on one side move together
function pace(f, n) {
  const duty = 0.56, S = 2.4, lift = 2.6, off = { nf: 0, nh: 0.02, ff: 0.5, fh: 0.52 }; const r = {};
  for (const k in off) { const p = ((f / n - off[k]) % 1 + 1) % 1, hip = HIPS[k]; let fx, fy;
    if (p < duty) { fx = hip[0] + S - 2 * S * p / duty; fy = GY; }
    else { const q = (p - duty) / (1 - duty), e = 0.5 - 0.5 * Math.cos(Math.PI * q); fx = hip[0] - S + 2 * S * e; fy = GY - lift * Math.sin(Math.PI * q); if (k[1] === 'f') fx -= 1.2 * Math.sin(Math.PI * q); }
    r[k] = { foot: [fx, fy] }; }
  return r;
}
function leg(cv, hip, foot, kind, mat) {
  const fore = kind === 'f'; const a = fore ? 5.2 : 5.6, b = fore ? 5.1 : 5.2;
  const [j] = ik(hip, foot, a, b, fore ? 1 : -1);
  cv.capsule(hip, j, fore ? 0.95 : 1.15, mat, 0.7);
  cv.capsule(j, [foot[0], foot[1] - 0.5], 0.55, mat);
  cv.px(Math.floor(j[0]), Math.floor(j[1]), mat === 'far' ? 'far:s' : 'knee');
  const hx = Math.floor(foot[0] - 0.5), hy = Math.floor(foot[1]);
  cv.px(hx - 1, hy, 'pad'); cv.px(hx, hy, 'pad'); cv.px(hx + 1, hy, 'pad');
}
function camelBody(cv, o = {}) {
  const C = 'camel';
  cv.ellipse(7.8, 17.6, 3.6, 3.2, C);           // rump (slopes down to the tail)
  cv.ellipse(12.8, 18.0, 7.0, 2.8, C);          // barrel
  cv.ellipse(12.4, 14.6, 4.2, 3.6, C);          // hump
  cv.ellipse(18.4, 17.8, 2.6, 2.9, C);          // shoulder / chest
  cv.save(); cv.rotate(o.neck || 0, 19, 17);
  cv.capsule([18.6, 16.6], [22.0, 18.8], 1.9, C, 1.4);    // neck runs forward and down…
  cv.capsule([22.0, 18.8], [23.2, 13.4], 1.4, C, 1.15);    // …then up to the head
  cv.capsule([23.2, 13.4], [22.6, 10.4], 1.15, C, 1.1);
  cv.px(21, 20, 'hair'); cv.px(22, 20, 'hair');   // throat fringe
  cv.stampT(21 + (o.hx || 0), 7 + (o.hy || 0), HEAD, HMAP);
  if (o.chew) cv.px(27, 12, 'lip');
  cv.restore();
  // tail: short, tufted
  const t = o.tail || [[4.8, 16.4], [3.6, 18.4], [3.4, 21.0]];
  cv.line(t, 0.6, 'hair');
}
function cloth(cv) {
  // saddle cloth draped over the hump, tasselled hem
  const inside = (x, y) => (((x - 12.4) / 4.4) ** 2 + ((y - 14.6) / 3.8) ** 2 <= 1 || ((x - 12.8) / 7.0) ** 2 + ((y - 18.0) / 2.8) ** 2 <= 1);
  cv.fillTest((x, y) => x > 8.0 && x < 16.6 && y < 20.0 && y > 12.2 && inside(x, y), 'cloth');
  cv.fillTest((x, y) => x > 8.0 && x < 16.6 && y >= 19.0 && y < 20.0 && inside(x, y - 0.3), 'cloth:d');
}
function camel(cv, pose) {
  cv.save(); cv.translate(pose.x, pose.y); cv.rotate(pose.pitch || 0, ...(pose.pivot || [13, 18]));
  const feet = {}; for (const k in pose.feet) { const f = pose.feet[k]; feet[k] = f.world ? { foot: cv.inv([pose.x + f.foot[0], f.foot[1]]) } : f; }
  for (const k of ['ff', 'fh']) leg(cv, HIPS[k], feet[k].foot, k[1], 'far');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice()); camelBody(t, pose); cloth(t);
    for (const k of ['nf', 'nh']) leg(t, HIPS[k], feet[k].foot, k[1], 'camel'); });
  for (let x = 9; x <= 16; x += 2) cv.px(x, 20.0, 'tassel');
  cv.restore();
}
// rider: turban + team robe, top-left (9,1)
const RIDER = `
..yyk..
.yykkkn
.kkkkkn
.Ajjjs.
.Ajjos.
..SsS..
.LLTTD.
LLTTTD.
.LTTTD.
.qwwwq.
.LTTTD.
.LTTDD.
`;
function rider(cv, x, y) {
  cv.save(); cv.translate(x, y);
  cv.withRing('ink', t => t.stamp(9, 1, RIDER, Object.assign({}, R, { A: 'raw_n' })));
  cv.withRing('ink', t => { t.capsule([12.0, 11.8], [14.8, 13.8], 1.0, 'team'); t.capsule([14.8, 14.4], [14.4, 17.2], 0.7, 'boot'); t.px(14, 17, 'boot'); t.px(15, 17, 'boot'); });
  cv.restore();
}
function arm(cv, sh, el, hand) { cv.pline(sh, el, 'team'); cv.pline(el, hand, 'skin:m'); cv.px(hand[0], hand[1], 'skin:l'); }
// scimitar: list of blade points from the hilt outward (curving), hilt gold
function sword(cv, hand, pts, o = {}) {
  cv.withRing('ink', t => {
    t.px(hand[0], hand[1], 'hilt');
    pts.forEach(([x, y], i) => t.px(x, y, i === pts.length - 1 ? 'steelM' : (i % 3 === 1 ? 'steel' : 'steelM')));
    if (o.guard) t.px(o.guard[0], o.guard[1], 'hilt');
  });
}
const STAND = { nf: { foot: [19.2, GY] }, nh: { foot: [7.6, GY] }, ff: { foot: [17.0, GY] }, fh: { foot: [9.8, GY] } };
const frame = (W, fn, sx = 0) => { const cv = new Canvas(W, HGT); cv.translate(sx, 0); fn(cv); return text(render(cv, MATS, INK)); };
const TAILS = [[[4.8, 16.4], [3.6, 18.4], [3.4, 21.0]], [[4.8, 16.4], [3.8, 18.6], [4.0, 21.2]], [[4.8, 16.4], [3.4, 18.2], [2.8, 20.6]], [[4.8, 16.4], [3.6, 18.4], [3.4, 21.0]]];
// sword at rest on the shoulder: hand (15,10), blade sweeps up and back
const REST = (dy) => [[16, 10 + dy], [[16, 9 + dy], [17, 8 + dy], [17, 7 + dy], [17, 6 + dy], [17, 5 + dy], [16, 4 + dy]]];
// ---------- idle
const idle = [0, 1, 2, 3].map(f => frame(28, cv => {
  const feet = JSON.parse(JSON.stringify(STAND)); if (f === 3) feet.nf.foot = [19.8, GY - 0.8];
  camel(cv, { x: 0, y: 0, feet, tail: TAILS[f], neck: f === 2 ? deg(3) : f === 1 ? deg(-2) : 0, chew: f === 1 });
  const b = f >= 2 ? 1 : 0; rider(cv, 0, b);
  const [h, bl] = REST(b); arm(cv, [13, 7 + b], [15, 9 + b], h); sword(cv, h, bl);
}, -1));
// ---------- walk: 8-frame pace, the body rolls and bobs; the rider sways against it
const BOB = [0, 1, 1, 0, 0, 1, 1, 0], RB = [0, -1, 0, 0, 0, -1, 0, 0], NK = [0, 2, 3, 1, 0, 2, 3, 1];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(f => frame(28, cv => {
  const tail = TAILS[[0, 1, 0, 2, 0, 1, 0, 2][f]];
  camel(cv, { x: 0, y: BOB[f], feet: pace(f, 8), tail, neck: deg(NK[f] * 1.5) });
  const ry = BOB[f] + RB[f]; rider(cv, 0, ry);
  const [h, bl] = REST(ry); arm(cv, [13, 7 + ry], [15, 9 + ry], h); sword(cv, h, bl);
}, -1));
// ---------- attack: slash smear at full extension → impact hold → follow-through → recover
const attack = [
  cv => { camel(cv, { x: 0, y: 0, feet: STAND, tail: TAILS[0], neck: deg(4) }); rider(cv, 1, 1);
    for (const [x, y] of [[13, 3], [15, 3], [17, 4], [19, 5], [20, 7], [21, 9]]) cv.px(x, y, 'smear');
    for (const [x, y] of [[14, 3], [16, 3], [18, 4], [20, 6], [21, 8]]) cv.px(x, y, 'smear');
    arm(cv, [14, 8], [16, 9], [18, 10]); sword(cv, [18, 10], [[19, 10], [20, 10], [21, 11], [22, 11], [23, 12]]); },
  cv => { camel(cv, { x: 0, y: 0, feet: STAND, tail: TAILS[1], neck: deg(4) }); rider(cv, 1, 1);
    arm(cv, [14, 8], [16, 10], [17, 11]); sword(cv, [17, 11], [[18, 12], [19, 12], [20, 13], [21, 14], [22, 15]]); },
  cv => { camel(cv, { x: 0, y: 0, feet: STAND, tail: TAILS[2], neck: deg(2) }); rider(cv, 1, 1);
    arm(cv, [14, 8], [15, 10], [16, 12]); sword(cv, [16, 12], [[17, 13], [17, 14], [18, 15], [18, 16], [19, 17]]); },
  cv => { camel(cv, { x: 0, y: 0, feet: STAND, tail: TAILS[3], neck: 0 }); rider(cv, 0, 0);
    arm(cv, [14, 7], [16, 6], [17, 5]); sword(cv, [17, 5], [[17, 4], [18, 3], [18, 2], [18, 1], [17, 0]]); },
  cv => { camel(cv, { x: 0, y: 0, feet: STAND, tail: TAILS[0], neck: 0 }); rider(cv, 0, 0);
    arm(cv, [13, 7], [15, 8], [16, 8]); sword(cv, [16, 8], [[16, 7], [17, 6], [17, 5], [17, 4], [17, 3], [16, 2]]); },
].map(fn => frame(28, fn, -1));
// ---------- death 36×30: hit → knees buckle (camels kneel forward) → hind folds → over on the side → bounce → settle
const XD = 4;
const W = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { foot: v, world: true }]));
const FALLING = `
.....zz
....TTz
...LTT.
..LTTD.
.kkkT..
ykjjs..
.njjo..
..SS...
`;
const LYING = `
.ykkj.LLTTTDz.
ykkkjSLTTTDDzz
.knkS.DDDDDDz.
`;
function corpse(cv, dy, relax) {
  cv.save(); cv.translate(XD + 1, dy);
  cv.capsule([20.4, 25.4], [25.4, 27.0 - relax], 0.7, 'far'); cv.capsule([11.2, 25.4], [16.4, 27.0], 0.7, 'far');
  cv.withRing('ink', t => { t.T = cv.T.map(r => r.slice());
    t.ellipse(8.4, 23.8, 3.6, 3.2, 'camel'); t.ellipse(13.4, 24.4, 7.0, 2.8, 'camel'); t.ellipse(12.8, 21.4, 4.2, 3.0, 'camel');
    t.capsule([19.0, 23.6], [23.6, 25.4], 1.8, 'camel', 1.4); t.capsule([23.6, 25.4], [27.6, 26.6], 1.4, 'camel', 1.2);
    t.poly([[27.0, 25.0], [29.6, 24.6], [31.4, 25.8], [31.4, 27.0], [26.8, 27.0]], 'camel'); t.px(29, 25, 'eye'); t.px(31, 26, 'lip');
    const ins = (x, y) => (((x - 12.8) / 4.4) ** 2 + ((y - 21.4) / 3.2) ** 2 <= 1 || ((x - 13.4) / 7.0) ** 2 + ((y - 24.4) / 2.8) ** 2 <= 1);
    t.fillTest((x, y) => x > 8.6 && x < 17.0 && y < 25.0 && ins(x, y), 'cloth'); t.fillTest((x, y) => x > 8.6 && x < 17.0 && y >= 24.0 && y < 25.0, 'cloth:d');
    t.capsule([19.0, 26.0], [24.0, 27.0], 0.75, 'camel'); t.capsule([10.6, 26.0], [15.6, 27.2], 0.75, 'camel');
  });
  cv.px(25, 27 - relax, 'pad'); cv.px(16, 27, 'pad'); cv.px(26, 27, 'pad');
  cv.line([[5.2, 22.6], [3.8, 24.6], [3.6, 27.0]], 0.6, 'hair');
  cv.restore();
}
const death = [
  cv => { camel(cv, { x: XD, y: 0, feet: STAND, tail: TAILS[2], neck: deg(-12) }); rider(cv, XD - 1, 0);
    arm(cv, [XD + 12, 7], [XD + 13, 5], [XD + 14, 3]); sword(cv, [XD + 14, 3], [[XD + 15, 2], [XD + 16, 2], [XD + 17, 1]]); },
  cv => { camel(cv, { x: XD, y: 3, pitch: deg(12), pivot: [9, 20], neck: deg(10), tail: TAILS[1],
      feet: Object.assign(W({ nh: [XD - 4 + 7.8 + 4, GY], fh: [XD - 4 + 9.8 + 4, GY] }), { nf: { foot: [17.6, 26.6] }, ff: { foot: [16.4, 26.8] } }) });
    rider(cv, XD + 1, 3); arm(cv, [XD + 14, 10], [XD + 16, 9], [XD + 17, 7]); },
  cv => { camel(cv, { x: XD, y: 6, pitch: deg(4), neck: deg(18), tail: TAILS[0],
      feet: { nf: { foot: [16.8, 24.0] }, ff: { foot: [15.6, 24.2] }, nh: { foot: [12.4, 24.2] }, fh: { foot: [13.4, 24.2] } } });
    cv.withRing('ink', t => t.stamp(1, 21, FALLING, Object.assign({}, R, { A: 'raw_n' }))); sword(cv, [9, 29], [[10, 29], [11, 29], [12, 28], [13, 28]]); },
  cv => { corpse(cv, 0, 0); cv.withRing('ink', t => t.stamp(0, 27, LYING, R)); sword(cv, [15, 29], [[16, 29], [17, 29], [18, 28], [19, 28]]); },
  cv => { corpse(cv, -1, 0); cv.withRing('ink', t => t.stamp(0, 27, LYING, R)); sword(cv, [15, 29], [[16, 29], [17, 29], [18, 28], [19, 28]]); },
  cv => { corpse(cv, 0, 1); cv.withRing('ink', t => t.stamp(0, 27, LYING, R)); sword(cv, [15, 29], [[16, 29], [17, 29], [18, 28], [19, 28]]); },
].map(fn => frame(36, fn));

fs.writeFileSync(OUT, emit({
  id: 'camelrider', anchor: [14, 30], anchors: { death: [18, 30] },
  header: `// @pixel camelrider
// Camel rider, facing right: tan dromedary (single hump, long U-curved neck, long knobby-kneed legs, broad pads, tufted tail)
// under a tasselled team saddle cloth; rider in a white turban and team robe with a curved scimitar. 28×30, pads on the bottom row.
// walk = 8-frame pace (both legs on one side move together); attack = slash smear → hold → follow-through → raise → ready.
// Generated by painter-exotic's rig.`,
  palette: {
    o: ['#24180f', 'ink outline'], a: ['#e6c890', 'camel light'], c: ['#c9a266', 'camel'], C: ['#9c7442', 'camel shade'], K: ['#5a3c22', 'camel deep, lips, knees'],
    v: ['#4a3a2c', 'foot pads'], g: ['#e1b12c', 'gold hilt, tassels'],
    j: ['#f2d2b0', 'skin light'], s: ['#e8c39e', 'skin'], S: ['#c9a07a', 'skin shade'],
    T: ['team'], D: ['teamdark'], L: ['teamlight'],
    w: ['#a07a4a', 'leather light'], q: ['#8a6a3a', 'leather'], Q: ['#5a3a18', 'leather shade'], z: ['#3b2614', 'boots'],
    y: ['#efe6d2', 'turban light, smear'], k: ['#d9c7a0', 'turban'], n: ['#a8946e', 'turban shade'],
    i: ['#e6eaee', 'steel light'], I: ['#9aa0a6', 'steel'], J: ['#5f656c', 'steel shade'],
  },
  frames: { idle, walk, attack, death },
}));
console.log('wrote', OUT);
