import { Frame, RAMP, emit } from './engine.mjs';
import { human, WALK, STAND } from './body.mjs';
import { smear, arm, lying, shaft } from './kit.mjs';
import fs from 'fs';
const H = 26;
const FACE = `
......
......
......
qSssk.
qSssss
.SssS.
`;
const FACEB = FACE.replace('qSssk.', 'qSsss.');
// pointed (conical) cap, point leaning back a touch
const HELM = `
..m...
..mM..
.mMMN.
mMMMMN
NNNNNN
`;
const SHIELD = `
.wWv.
wTmDv
wTDDv
.vvV.
`;
// spear: hand at (hx,hy), angle, from/to along the shaft (head at `to`)
function spear(f, hx, hy, ang, from, to) {
  const s = shaft(f, hx, hy, ang, from, to - 3, 'W', { ramp: RAMP.wood, outline: false });
  const h = shaft(f, hx, hy, ang, to - 2, to, 'm', { ink: 'n' }); h.p.px(h.end[0], h.end[1], 'M');
  const k = shaft(f, hx, hy, ang, to - 3, to - 3, 'N', { ink: 'n' });
}
const fig = (pose, wp) => human(pose.W || 16, H, pose, {
  head: FACE, headBlink: FACEB,
  back: (f, P) => { const [sx, sy] = P.shF; const h = wp.hand(P); if (wp.spear) spear(f, h[0], h[1], ...wp.spear); if (wp.streak) wp.streak(f, h); arm(f, sx, sy + 1, h[0], h[1], true, 'linen'); },
  front: (f, P) => { f.part({ ramp: RAMP.steel, ink: 'n' }).stamp(P.head[0], P.head[1] - 2, HELM);
    if (wp.near) { const n = wp.near(P); arm(f, P.shN[0] + 1, P.shN[1] + 1, n[0], n[1], false, 'linen'); }
    const s = wp.shield ? wp.shield(P) : [P.shN[0] - 2, P.shN[1] + 2]; f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(s[0], s[1], SHIELD); } });
const at = (dx, dy) => P => [P.shF[0] + dx, P.shF[1] + dy];
const fr = {};
// idle: spear upright, butt resting on the ground row
const idle = pose => { const G = H - 1, hy = G - 14 + (pose.uy || 0) + 4; return fig(pose, { hand: at(2, 4), spear: [-90, -(G - 1 - hy), 13] }); };
const i0 = idle({ ...STAND }).render(), i1 = idle({ ...STAND, uy: 1, hy: 0 }).render(), i2 = idle({ ...STAND, hem: 1 }).render(), i3 = idle({ ...STAND, blink: 1 }).render();
fr.idle = [i0, i0, i1, i1, i2, i3];
const sw = [1, 1, 0, -1, -1, -1, 0, 1];
fr.walk = WALK.map((w, i) => fig({ ...w }, { hand: at(2 + sw[i], 4), spear: [-90 + sw[i] * 3, -7, 17] }).render());
const AW = 24;
const lunge = { W: AW, near: { x: 11 }, far: { x: 3, toe: 1 }, ux: 2, uy: 1, hy: 1 };
fr.attack = [
  fig(lunge, { hand: at(4, 3), spear: [0, -6, 14], near: at(1, 4),
    streak: (f, h) => { const p = f.part({ outline: false }); for (let i = 0; i < 4; i++) { p.px(h[0] + 6 + i, h[1] - 2, i ? 'F' : 'f'); p.px(h[0] + 4 + i, h[1] + 2, 'F'); } } }).render(),
  fig(lunge, { hand: at(4, 3), spear: [0, -6, 14], near: at(1, 4) }).render(),
  fig({ ...lunge, ux: 1, near: { x: 10 } }, { hand: at(3, 3), spear: [2, -8, 12], near: at(0, 4) }).render(),
  fig({ W: AW, near: { x: 9 }, far: { x: 3 } }, { hand: at(2, 3), spear: [3, -9, 11], near: at(-1, 4) }).render(),
];
const readyW = { hand: at(2, 3), spear: [3, -9, 11], near: at(-1, 4), shield: P => [P.shN[0] - 2, P.shN[1] + 1] };
fr.ready = [fig({ W: AW, near: { x: 9 }, far: { x: 3 } }, readyW).render(), fig({ W: AW, near: { x: 9 }, far: { x: 3 }, uy: 1, hy: 1 }, readyW).render()];
const DW = 26, DX = 15;
const SHIELD_FLAT = `
.wWWv.
wTTTDv
.vvvV.
`;
const dropped = (x, y, ang, len) => (f, yo) => spear(f, x, y + yo, ang, 0, len);
fr.death = [
  fig({ W: DW, cx: DX, near: { x: DX }, far: { x: DX - 3 }, ux: -1, hx: -1 }, { hand: at(2, 2), spear: [-80, -9, 13], shield: P => [P.shN[0] - 3, P.shN[1] + 1] }).render(),
  fig({ W: DW, cx: DX, near: { x: DX, knee: 2 }, far: { x: DX - 3, knee: 2 }, ux: -2, uy: 2, hy: 2, hx: -1 }, { hand: at(2, 2), spear: undefined, shield: P => [P.shN[0] - 3, P.shN[1] + 2] }).render().replace(/^/, ''),
  lying(DW, H, { neck: [10, 14], hip: [14, 18], head: [8, 11], up: -135, tr: 2.2, farLeg: [[14, 18], [16, 20], [14, 22]], nearLeg: [[14, 18], [17, 19], [16, 22]],
    before: dropped(17, 12, 60, 14), after: (f, yo) => f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(4, 13 + yo, SHIELD) }),
  lying(DW, H, { neck: [7, 18], hip: [14, 18], head: [4, 18], up: 180, farLeg: [[14, 19], [18, 18], [21, 21]], nearLeg: [[14, 19], [18, 20], [22, 21]],
    before: dropped(1, 21, 3, 22), after: (f, yo) => f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(8, 14 + yo, SHIELD_FLAT) }),
  lying(DW, H, { neck: [7, 19], hip: [14, 19], head: [4, 19], up: 180, farLeg: [[14, 20], [18, 19], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    before: dropped(1, 22, 0, 23), after: (f, yo) => f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(8, 15 + yo, SHIELD_FLAT) }),
  lying(DW, H, { neck: [7, 19], hip: [14, 19], head: [4, 19], up: 190, farLeg: [[14, 20], [18, 20], [21, 21]], nearLeg: [[14, 20], [18, 21], [22, 21]],
    before: dropped(1, 22, 0, 23), after: (f, yo) => f.part({ ramp: RAMP.wood, iline: 'k' }).stamp(8, 15 + yo, SHIELD_FLAT) }),
];
fs.writeFileSync(process.argv[2], emit({ id: 'spearman', anchor: [7, H], anchors: { attack: [7, H], ready: [7, H], death: [DX, H] },
  header: `// @pixel spearman\n// Spearman: pointed steel cap, team tunic over linen sleeves, small round buckler, ash spear a head taller than the man.\n// Composed by painter-melee (scratchpad compositor). 16×26 (attack/ready 24×26 with the spear levelled, death 26×26), feet at [7,26], faces right.\n`, frames: fr }));
