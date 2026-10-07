// @pixel crossbowguard
// Genoese crossbowman: kettle helmet, team tunic, a tall pavise shield slung on the back, crossbow held level.
// 18×24, anchor [8,24] (the pavise sits behind him on the left, the crossbow points right).
const W = 18, H = 24;
const HEAD = `
.mmmm.
mmmmmm
.ssess
.sssSS
..ss..
`;
const BRIM = `MMMMMMMM`;
const TORSO = `
.LTTTTD.
sLTTTTDs
sLTTTTDs
sLTTTTDs
sLTTTTDs
sbbbbbbs
`;
// pavise: tall shield with a light cross, worn on the back (behind the left arm)
const PAVISE = `
.DD.
DTTD
DTLD
DLLL
DTLD
DTLD
DTLD
DTTD
DTTD
.DD.
`;
const LEGS = {
  idle: [4, 14, `
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
  w0: [3, 14, `
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
  w1: [4, 13, `
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
  w2: [2, 14, `
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
  w3: [4, 13, `
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
// crossbow carried: stock angled down in the front hand
const XB_CARRY = [10, 9, `
....m..
...wmm.
..ww.M.
.ww....
sw.....
`];
// aimed at the shoulder: level stock, bow limbs vertical, string
const XB_AIM = [10, 8, `
......m.
s.....ym
swwwwwwm
......ym
......m.
`];
// loosed: bolt leaving, limbs sprung
const XB_LOOSE = [10, 8, `
.....m..
s....y.m
swwwwwff
.....y.m
.....m..
`];
function frame(legs, bob, extras) {
  const g = pixGrid(W, H); const dy = bob ? -1 : 0;
  pixStamp(g, 1, 6 + dy, PAVISE); pixStamp(g, 5, 2 + dy, HEAD); pixStamp(g, 4, 4 + dy, BRIM); pixStamp(g, 4, 8 + dy, TORSO);
  const [lx, ly, lt] = LEGS[legs]; pixStamp(g, lx, ly, lt);
  for (const [x, y, t] of extras) pixStamp(g, x, y + dy, t);
  return pixText(g);
}
export default {
  id: 'crossbowguard', anchor: [8, 24],
  palette: {
    k: '#3b2a1a', s: '#e8c39e', S: '#c9a07a', e: '#2a1a10',
    m: '#cfd4d8', M: '#9aa0a6',
    T: 'team', D: 'teamdark', L: 'teamlight',
    b: '#6a4a2a', p: '#6a5a48', P: '#55483a',
    w: '#8a6a3a', y: '#e8dcc0', f: '#e8dcc0',
  },
  frames: {
    idle: [frame('idle', false, [XB_CARRY])],
    walk: [frame('w0', false, [XB_CARRY]), frame('w1', true, [XB_CARRY]), frame('w2', false, [XB_CARRY]), frame('w3', true, [XB_CARRY])],
    attack: [frame('idle', false, [XB_AIM]), frame('idle', false, [XB_AIM]), frame('idle', false, [XB_LOOSE])],
  },
};
