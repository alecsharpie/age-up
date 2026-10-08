// @pixel longbow
// Longbowman: green hood and cloak over the team tunic, quiver on the back, a yew bow as tall as the man.
// Built from hand-painted stamps (same body as the villager) so all humans share proportions. 16×24, anchor [7,24].
const W = 16, H = 24;
const HEAD = `
.gggg.
gggggg
gsssss
gssess
gsssSS
.Gss..
`;
const TORSO = `
.LTTTTD.
sLTTTTDs
sLTTTTDs
sLTTTTDs
sLTTTTDs
sbbbbbbs
`;
const CLOAK = `
GG
GG
GG
GG
`;
const QUIVER = `
.f.f
.qq.
.qq.
.qq.
.qq.
.qq.
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
// bow held upright in the front hand: stave 'w', string 'y'
const BOW_IDLE = [10, 4, `
.w.
.yw
.y.w
.y.w
.y.w
.y.w
.y.w
.y.w
sy.w
sy.w
.y.w
.y.w
.y.w
.y.w
.yw
.w.
`];
// drawing: string pulled back to the chest, arrow nocked
const BOW_PULL = [8, 4, `
...w.
..y.w
.y..w
.y...w
y....w
y....w
y....w
y....w
sfffffmm
y....w
y....w
y....w
y....w
.y...w
.y..w
..yw.
...w.
`];
// release: string snapping back, arm extended
const BOW_LOOSE = [10, 4, `
.w.
.yw
.y.w
.y.w
.y.w
.y.w
.y.w
sy.w
sy.w
.y.w
.y.w
.y.w
.y.w
.y.w
.yw
.w.
`];
function frame(legs, bob, extras) {
  const g = pixGrid(W, H); const dy = bob ? -1 : 0;
  pixStamp(g, 4, 2 + dy, HEAD); pixStamp(g, 3, 8 + dy, TORSO); pixStamp(g, 2, 8 + dy, CLOAK); pixStamp(g, 1, 7 + dy, QUIVER);
  const [lx, ly, lt] = LEGS[legs]; pixStamp(g, lx, ly, lt);
  for (const [x, y, t] of extras) pixStamp(g, x, y + dy, t);
  return pixText(g);
}
export default {
  id: 'longbow', anchor: [7, 24],
  palette: {
    k: '#3b2a1a', s: '#e8c39e', S: '#c9a07a', e: '#2a1a10',
    g: '#3f6b2e', G: '#2f5222',            // hood, cloak shade
    T: 'team', D: 'teamdark', L: 'teamlight',
    b: '#6a4a2a', p: '#6a5a48', P: '#55483a',
    w: '#8a6a3a', y: '#e8dcc0', q: '#6a4a2a', f: '#e8dcc0', m: '#cfd4d8',
  },
  frames: {
    idle: [frame('idle', false, [BOW_IDLE])],
    walk: [frame('w0', false, [BOW_IDLE]), frame('w1', true, [BOW_IDLE]), frame('w2', false, [BOW_IDLE]), frame('w3', true, [BOW_IDLE])],
    attack: [frame('idle', false, [BOW_PULL]), frame('idle', false, [BOW_PULL]), frame('idle', false, [BOW_LOOSE])],
  },
};
