// @pixel axethrower
// Frankish throwing axeman: iron helmet with a nose guard, team tunic, small round shield on the back, francisca axe.
// Attack: wind up behind the head, throw (axe in flight), follow-through. 16×24, anchor [7,24].
const W = 16, H = 24;
const HEAD = `
.mmmM.
mMMMMM
MsssMs
.sseMs
.sssSS
..ss..
`;
const TORSO = `
.LTTTTD.
sLTTTTDs
sLTTTTDs
sLTTTTDs
sLTTTTDs
sbbbbbbs
`;
// torso without the throwing arm (the attack stamps draw it)
const TORSO_R = `
.LTTTTD.
sLTTTTD.
sLTTTTD.
sLTTTTD.
sLTTTTD.
sbbbbbb.
`;
const SHIELD = `
.bb.
bmbb
bbbb
.bb.
`;
const LEGS = {
  idle: [3, 14, `
.pppppP.
.pppppP.
.pp..pP.
.pp..pP.
.pp..pP.
.pp..pP.
.pp..pP.
.pp..pP.
kkk..kkk
`],
  w0: [2, 14, `
..pppppP..
..pppppP..
.pp....pP.
.pp....pP.
.pp....pP.
.pp.....pP
.pp.....pP
.pp.....pP
kkk....kkk
`],
  w1: [3, 13, `
.pppppP.
.pppppP.
..pppP..
..pppP..
..pppP..
..pppP..
..pppP..
.kkk.pP.
.....kkk
`],
  w2: [1, 14, `
...pppppP..
...pppppP..
..pp....pP.
..pp....pP.
..pp....pP.
.pp......pP
.pp......pP
.pp......pP
kkk.....kkk
`],
  w3: [3, 13, `
.pppppP.
.pppppP.
..pppP..
..pppP..
..pppP..
..pppP..
..pppP..
..pp.kkk
.kkk....
`],
};
// axe held down at the side (idle/walk)
const AXE_SIDE = [10, 9, `
s..
w..
wmm
wMM
w..
`];
// wound up: arm raised, axe behind the head
const AXE_UP = [8, 0, `
mm...
MMw..
...w.
....s
....s
`];
// released: arm forward, axe spinning away
const AXE_FLY = [10, 8, `
.....wm
sss..MM
`];
// follow-through: arm forward, empty hand
const AXE_FOLLOW = [10, 10, `
ss.
..s
`];
function frame(legs, bob, extras, noArm) {
  const g = pixGrid(W, H); const dy = bob ? -1 : 0;
  pixStamp(g, 1, 9 + dy, SHIELD); pixStamp(g, 4, 2 + dy, HEAD); pixStamp(g, 3, 8 + dy, noArm ? TORSO_R : TORSO);
  const [lx, ly, lt] = LEGS[legs]; pixStamp(g, lx, ly, lt);
  for (const [x, y, t] of extras) pixStamp(g, x, y + dy, t);
  return pixText(g);
}
export default {
  id: 'axethrower', anchor: [7, 24],
  palette: {
    k: '#3b2a1a', s: '#e8c39e', S: '#c9a07a', e: '#2a1a10',
    m: '#cfd4d8', M: '#9aa0a6',
    T: 'team', D: 'teamdark', L: 'teamlight',
    b: '#6a4a2a', p: '#6a5a48', P: '#55483a', w: '#8a6a3a',
  },
  frames: {
    idle: [frame('idle', false, [AXE_SIDE])],
    walk: [frame('w0', false, [AXE_SIDE]), frame('w1', true, [AXE_SIDE]), frame('w2', false, [AXE_SIDE]), frame('w3', true, [AXE_SIDE])],
    attack: [frame('idle', false, [AXE_UP], true), frame('idle', false, [AXE_FLY], true), frame('idle', false, [AXE_FOLLOW], true)],
  },
};
