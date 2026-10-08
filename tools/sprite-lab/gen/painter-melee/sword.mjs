import { Frame, RAMP, emit } from './engine.mjs';
import { human, WALK, STAND } from './body.mjs';
import { sword, smear, arm, headAt, limb, shaft } from './kit.mjs';
import fs from 'fs';
const FACE = `
......
......
......
qSssk.
qSssss
.SssS.
`;
const FACEB = FACE.replace('qSssk.', 'qSsss.');
const HELM = `
.MmmM.
MmMMMN
NNNNNN
.....N
`;
const SHIELD = `
.wWWv.
wLTTDv
wTmMDv
wTMNDv
wTDDDv
.vvvV.
`;
const figure = (pose, wp) => human(pose.W || 16, 24, pose, {
  head: FACE, headBlink: FACEB,
  back: (f, P) => { const [sx, sy] = P.shF; const h = wp.hand(P); arm(f, sx, sy + 1, h[0], h[1], true); if (wp.ang !== undefined) sword(f, h[0], h[1], wp.ang, wp.len || 7); if (wp.smear) wp.smear(f, P, h); },
  front: (f, P, pose) => { f.part({ ramp: RAMP.steel, ink: 'n' }).stamp(P.head[0], P.head[1], HELM);
    const sp = f.part({ ramp: RAMP.wood, iline: 'k' }); const s = wp.shield ? wp.shield(P) : [P.shN[0] - 3, P.shN[1] + 1]; sp.stamp(s[0], s[1], SHIELD); if (wp.front) wp.front(f, P); } });
const at = (dx, dy) => P => [P.shF[0] + dx, P.shF[1] + dy];
const fr = {};
const idleW = (d = 0) => ({ hand: at(2, 4 + d), ang: -90 });
const i0 = figure({ ...STAND }, idleW()).render(), i1 = figure({ ...STAND, uy: 1, hy: 0 }, idleW()).render(),
  i2 = figure({ ...STAND, hem: 1 }, idleW()).render(), i3 = figure({ ...STAND, blink: 1 }, idleW()).render();
fr.idle = [i0, i0, i1, i1, i2, i3];
const swing = [1, 1, 0, -1, -1, -1, 0, 1];
fr.walk = WALK.map((w, i) => figure({ ...w }, { hand: at(2 + swing[i], 4), ang: -90 + swing[i] * 8 }).render());
const W2 = 20, lunge = { W: W2, near: { x: 10 }, far: { x: 3, toe: 1 }, ux: 2, uy: 1, hy: 1 };
fr.attack = [
  figure(lunge, { hand: at(3, 2), ang: 5, len: 8, smear: (f, P, h) => smear(f, P.shF[0] + .5, P.shF[1] + 1.5, 10, -95, 2, 3) }).render(),
  figure(lunge, { hand: at(3, 3), ang: 30, len: 8, smear: (f, P, h) => smear(f, P.shF[0] + .5, P.shF[1] + 1.5, 10, -20, 28, 2) }).render(),
  figure({ ...lunge, ux: 1 }, { hand: at(2, 5), ang: 65, len: 7 }).render(),
  figure({ W: W2, near: { x: 9 }, far: { x: 4 } }, { hand: at(2, 3), ang: -45 }).render(),
];
const readyW = { hand: at(2, 3), ang: -45, shield: P => [P.shN[0] - 2, P.shN[1] - 1] };
fr.ready = [figure({ near: { x: 8 }, far: { x: 3 } }, readyW).render(), figure({ near: { x: 8 }, far: { x: 3 }, uy: 1, hy: 1 }, readyW).render()];
// death: 26x24, anchor [15,24]; falls backwards (to the left)
const DW = 26, DX = 15;
const dfig = (pose, wp) => figure({ W: DW, cx: DX, ...pose }, wp);
const at2 = (dx, dy) => P => [P.shF[0] + dx, P.shF[1] + dy];
function lying(j) {
  const f = new Frame(DW, 24);
  if (j.sword) sword(f, j.sword[0], j.sword[1], j.sword[2], 7);
  limb(f, j.farLeg, RAMP.hoseFar); f.part({ ramp: RAMP.bootFar }).disc(j.farLeg.at(-1)[0] + .5, j.farLeg.at(-1)[1] + .5, 1.2);
  if (j.farArm) { limb(f, j.farArm, RAMP.teamFar, .8); }
  const t = f.part({ ramp: RAMP.team, shade: 'rb', light: 'lt' }); t.capsule(j.neck[0] + .5, j.neck[1] + .5, j.hip[0] + .5, j.hip[1] + .5, j.tr || 2.1);
  limb(f, j.nearLeg, RAMP.hose); f.part({ ramp: RAMP.boot }).disc(j.nearLeg.at(-1)[0] + .5, j.nearLeg.at(-1)[1] + .5, 1.2);
  headAt(f, j.head[0] + .5, j.head[1] + .5, j.up);
  if (j.shield) f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(j.shield[0], j.shield[1], j.shieldTxt || SHIELD);
  if (j.after) j.after(f);
  return f.render();
}
const SHIELD_FLAT = `
.wWWWWv.
wLTTTTDv
.vvvvvV.
`;
fr.death = [
  dfig({ near: { x: DX }, far: { x: DX - 3 }, ux: -1, hx: -1 }, { hand: at2(2, 1), ang: -70, shield: P => [P.shN[0] - 4, P.shN[1]] }).render(),
  dfig({ near: { x: DX, knee: 2 }, far: { x: DX - 3, knee: 2 }, ux: -2, uy: 2, hy: 2, hx: -1, hdy: 0 }, { hand: at2(2, 2), front: f => sword(f, DX + 5, 12, -120, 7), shield: P => [P.shN[0] - 4, P.shN[1] + 1] }).render(),
  lying({ neck: [10, 14], hip: [14, 18], head: [8, 11], up: -135, tr: 2.2, farLeg: [[14, 18], [16, 20], [14, 22]], nearLeg: [[14, 18], [17, 19], [16, 22]],
    shield: [3, 12], sword: [19, 16, 160] }),
  lying({ neck: [7, 18], hip: [14, 18], head: [4, 18], up: 180, farLeg: [[14, 19], [18, 18], [21, 21]], nearLeg: [[14, 19], [18, 20], [22, 21]],
    shieldTxt: SHIELD_FLAT, shield: [7, 14], after: f => sword(f, 13, 21, 8, 8) }),
  lying({ neck: [7, 19], hip: [14, 19], head: [4, 19], up: 180, farLeg: [[14, 20], [18, 19], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    shieldTxt: SHIELD_FLAT, shield: [7, 15], after: f => sword(f, 13, 22, 0, 8) }),
  lying({ neck: [7, 19], hip: [14, 19], head: [4, 19], up: 190, farLeg: [[14, 20], [18, 20], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    shieldTxt: SHIELD_FLAT, shield: [7, 15], after: f => sword(f, 13, 22, 0, 8) }),
];
const src = emit({ id: 'swordsman', anchor: [7, 24], anchors: { attack: [7, 24], death: [DX, 24] },
  header: `// @pixel swordsman\n// Swordsman (Man-at-Arms line): steel nasal helmet, team tunic, round team shield with a steel boss on the near arm, arming sword.\n// Composed by painter-melee (scratchpad compositor: auto light/shade + selective outline). 16×24 (attack 20×24, death 26×24), feet at [7,24], faces right.\n`,
  frames: fr });
fs.writeFileSync(process.argv[2], src);
