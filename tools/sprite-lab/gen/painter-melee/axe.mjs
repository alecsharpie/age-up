import { Frame, RAMP, emit } from './engine.mjs';
import { human, WALK, STAND } from './body.mjs';
import { smear, arm, lying, shaft } from './kit.mjs';
import fs from 'fs';
const H = 24;
// Frankish: long hair at the nape, drooping moustache
const FACE = `
......
......
......
RSssk.
RSssss
qRrrS.
`;
const FACEB = FACE.replace('RSssk.', 'RSsss.');
// rounded Frankish spangenhelm: gold bands, short nasal
const HELM = `
.MGmM.
MmGMMN
NyNNNN
.....N
`;
const rad = d => d * Math.PI / 180;
// francisca: haft from the hand along ang, flared head at the end on the forward side
export function axe(f, hx, hy, ang, len = 5, flip = 1) {
  const d = [Math.cos(rad(ang)), Math.sin(rad(ang))], b = [-d[1] * flip, d[0] * flip];
  shaft(f, hx, hy, ang, -1, len, 'W', { ramp: RAMP.wood, ink: 'k' });
  const p = f.part({ ramp: RAMP.steel, ink: 'n' }); const E = [hx + d[0] * len, hy + d[1] * len];
  const put = (u, v, ch) => p.px(E[0] + b[0] * u + d[0] * v, E[1] + b[1] * u + d[1] * v, ch);
  put(1, 0, 'M'); put(2, 0, 'm'); put(2, -1, 'M'); put(3, 0, 'm'); put(3, -1, 'm'); put(3, 1, 'N'); put(2, 1, 'N');
}
const belt = (f, P, n = 2) => { for (let i = 0; i < n; i++) { const x = P.cx + P.ux - 2 + i * 3; f.part({ ramp: RAMP.wood, ink: 'k' }).px(x, P.belt + 1, 'v').px(x, P.belt + 2, 'v'); f.part({ ramp: RAMP.steel, ink: 'n' }).px(x + 1, P.belt + 1, 'M').px(x + 1, P.belt + 2, 'N'); } };
const fig = (pose, wp) => human(pose.W || 16, H, pose, {
  head: FACE, headBlink: FACEB, hose: RAMP.linen, hoseFar: RAMP.linenFar,
  back: (f, P) => { const [sx, sy] = P.shF; const h = wp.hand(P); if (wp.axe) axe(f, h[0], h[1], ...wp.axe); arm(f, sx, sy + 1, h[0], h[1], true); if (wp.fly) wp.fly(f, P, h); },
  torso: (f, P) => belt(f, P, wp.belt ?? 2),
  front: (f, P) => { f.part({ ramp: RAMP.steel, ink: 'n' }).stamp(P.head[0], P.head[1], HELM);
    const n = wp.near ? wp.near(P) : [P.shN[0], P.shN[1] + 5]; arm(f, P.shN[0], P.shN[1], n[0], n[1], false, 'teamNear'); } });
const at = (dx, dy) => P => [P.shF[0] + dx, P.shF[1] + dy];
const fr = {};
const idleW = { hand: at(2, 4), axe: [-80, 5] };
const i0 = fig({ ...STAND }, idleW).render(), i1 = fig({ ...STAND, uy: 1, hy: 0 }, idleW).render(), i2 = fig({ ...STAND, hem: 1 }, idleW).render(), i3 = fig({ ...STAND, blink: 1 }, idleW).render();
fr.idle = [i0, i0, i1, i1, i2, i3];
const sw = [1, 1, 0, -1, -1, -1, 0, 1];
fr.walk = WALK.map((w, i) => fig({ ...w }, { hand: at(2 + sw[i], 4), axe: [-80 + sw[i] * 10, 5], near: P => [P.shN[0] - sw[i], P.shN[1] + 5] }).render());
const AW = 20, lunge = { W: AW, near: { x: 10 }, far: { x: 3, toe: 1 }, ux: 2, uy: 1, hy: 1 };
fr.attack = [
  // release: arm thrown forward, the axe just leaving the fingers, spinning
  fig(lunge, { hand: at(4, 0), belt: 2, near: P => [P.shN[0] - 1, P.shN[1] + 4],
    fly: (f, P, h) => { axe(f, h[0] + 3, h[1] - 2, 20, 2, -1); smear(f, h[0] + 4.5, h[1] - 1.5, 4, -200, -110, 1); } }).render(),
  fig(lunge, { hand: at(4, 4), belt: 2, near: P => [P.shN[0] - 1, P.shN[1] + 4] }).render(),
  fig({ ...lunge, ux: 1 }, { hand: at(1, 6), belt: 1, near: P => [P.shN[0], P.shN[1] + 5] }).render(),
  fig({ W: AW, near: { x: 9 }, far: { x: 4 } }, { hand: at(2, 3), axe: [-60, 5], belt: 1 }).render(),
];
const readyW = { hand: at(3, 1), axe: [-105, 6], near: P => [P.shN[0] + 2, P.shN[1] + 3] };
fr.ready = [fig({ near: { x: 8 }, far: { x: 3 } }, readyW).render(), fig({ near: { x: 8 }, far: { x: 3 }, uy: 1, hy: 1 }, readyW).render()];
const DW = 26, DX = 15;
fr.death = [
  fig({ W: DW, cx: DX, near: { x: DX }, far: { x: DX - 3 }, ux: -1, hx: -1 }, { hand: at(2, 1), axe: [-60, 5], near: P => [P.shN[0] - 2, P.shN[1] + 3] }).render(),
  fig({ W: DW, cx: DX, near: { x: DX, knee: 2 }, far: { x: DX - 3, knee: 2 }, ux: -2, uy: 2, hy: 2, hx: -1 }, { hand: at(2, 2), near: P => [P.shN[0] - 2, P.shN[1] + 2], fly: f => axe(f, DX + 5, 9, 140, 4) }).render(),
  lying(DW, H, { hose: 'linen', hoseFar: 'linenFar', neck: [10, 14], hip: [14, 18], head: [8, 11], up: -135, tr: 2.2, farLeg: [[14, 18], [16, 20], [14, 22]], nearLeg: [[14, 18], [17, 19], [16, 22]],
    nearArm: [[10, 15], [7, 16], [5, 15]], after: f => axe(f, 19, 18, 100, 3) }),
  lying(DW, H, { hose: 'linen', hoseFar: 'linenFar', neck: [7, 18], hip: [14, 18], head: [4, 18], up: 180, farLeg: [[14, 19], [18, 18], [21, 21]], nearLeg: [[14, 19], [18, 20], [22, 21]],
    nearArm: [[8, 17], [10, 15], [12, 15]], after: f => axe(f, 2, 22, -15, 4) }),
  lying(DW, H, { hose: 'linen', hoseFar: 'linenFar', neck: [7, 19], hip: [14, 19], head: [4, 19], up: 180, farLeg: [[14, 20], [18, 19], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    nearArm: [[8, 19], [11, 18], [13, 18]], after: f => axe(f, 1, 22, -5, 4) }),
  lying(DW, H, { hose: 'linen', hoseFar: 'linenFar', neck: [7, 19], hip: [14, 19], head: [4, 19], up: 190, farLeg: [[14, 20], [18, 20], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    nearArm: [[8, 19], [11, 19], [13, 18]], after: f => axe(f, 1, 22, -5, 4) }),
];
fs.writeFileSync(process.argv[2], emit({ id: 'axethrower', anchor: [7, H], anchors: { attack: [7, H], death: [DX, H] },
  header: `// @pixel axethrower\n// Frankish axe thrower: gold-banded spangenhelm, long hair and moustache, team tunic, linen leg-wraps, francisca in hand and two more on the belt.\n// Composed by painter-melee (scratchpad compositor). 16×24 (attack 20×24, death 26×24), feet at [7,24], faces right.\n// Attack: frame 0 = release (arm extended, axe leaving the hand), follow-through, hand to the belt, next axe drawn up.\n`, frames: fr }));
