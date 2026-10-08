import { grid, put, get, line, rect, stamp, outline, over, clone, replace, emit, W, H } from './lib.mjs';
import { leg, putBehind, lineBehind, despeckle, fallen } from './rig.mjs';
const OUT = process.argv[2];
// morion: crest, dome, brim with upturned ends
const HEAD = `
..mmM...
mmmMMnN.
MmMMMnnN
.hsasss.
.hssoss.
.HSsssS.
..SsS...
`;
const HEAD_BLINK = HEAD.replace('.hssoss.', '.hsssss.');
const CHEST = `
.CTTq.
cLTTDq
cLTTDq
CLTTDq
`;
const LOWER = `
XWuWWX
cLTTDq
.CTTq.
`;
function body(o) {
  const g = grid(16, 24); const dy = o.dy || 0, by = o.by || 0, lean = o.lean || 0;
  const hy = 15 + dy;
  leg(g, 6, hy, 6 + (o.ff || 0), o.fl || 0, ['W', 'X'], ['X', 'X'], 21, o.knee || 0);
  leg(g, 7, hy, 7 + (o.nf || 0), o.nl || 0, ['w', 'W'], ['W', 'X'], 21, o.knee || 0);
  stamp(g, 4 + Math.round(lean / 2), 12 + dy, LOWER);
  stamp(g, 4 + Math.round(lean / 2), 8 + dy + by, CHEST);
  stamp(g, 3 + lean, 1 + dy + by + (o.hdy || 0), o.blink ? HEAD_BLINK : HEAD);
  // powder flask + match cord at the hip (back)
  put(g, 3 + Math.round(lean / 2), 13 + dy, 'u'); put(g, 3 + Math.round(lean / 2), 14 + dy, 'W');
  // front arm: shoulder → hand
  const sx = 9 + Math.round(lean / 2), sy = 9 + dy + by; const hx = o.hand[0], hyy = o.hand[1] + dy + by;
  line(g, sx, sy, hx, hyy, (x, y) => (Math.abs(x - hx) + Math.abs(y - hyy) <= 0 ? 's' : 'C'));
  put(g, sx, sy, 'q');
  return g;
}
// hand cannon: wooden tiller (stock) + iron barrel, drawn as a thin prop over the outline
function gun(f, x0, y0, x1, y1, stockLen = 4) {
  // from butt (x0,y0) to muzzle (x1,y1); 2 px thick: lit side + shade side
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  for (let k = 0; k <= n; k++) {
    const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
    const stock = k < stockLen, end = k === n;
    put(f, x, y, stock ? (k === 0 ? 'W' : 'u') : end ? 'n' : 'M');
    if (k < n || steep) put(f, steep ? x + 1 : x, steep ? y : y + 1, stock ? 'W' : end ? 'N' : 'N');
  }
}
function frame(o) { const f = outline(body(o));
  // smouldering slow-match hanging from the belt: the ember pulses
  if (o.ember) { const x = 3 + Math.round((o.lean || 0) / 2), y = 15 + (o.dy || 0); put(f, x, y, 'X'); put(f, x, y + 1, o.ember); } if (o.gun) o.gun(f, (o.dy || 0) + (o.by || 0)); if (o.fx) o.fx(f); return f; }
const port = hx => (f, d) => gun(f, hx - 1, 15 + d, hx + 3, 3 + d, 5);
const idleBase = { hand: [10, 13], gun: port(10) };
const idle = [
  frame({ ...idleBase, ember: 'Y' }),
  frame({ ...idleBase, by: 1, ember: 'y' }),
  frame({ ...idleBase, by: 1, ember: 'Y' }),
  frame({ ...idleBase, blink: true, ember: 'G' }),
];
const W8 = [
  { nf: 3, ff: -3, dy: 0, hand: [10, 13] }, { nf: 2, ff: -2, dy: 1, hand: [10, 13] }, { nf: 0, ff: 1, fl: 1, dy: 0, hand: [11, 13] }, { nf: -2, ff: 2, fl: 1, dy: -1, hand: [11, 13] },
  { nf: -3, ff: 3, dy: 0, hand: [11, 13] }, { nf: -2, ff: 2, dy: 1, hand: [11, 13] }, { nf: 1, ff: 0, nl: 1, dy: 0, hand: [11, 13] }, { nf: 2, ff: -2, nl: 1, dy: -1, hand: [10, 13] },
];
const walk = W8.map((o, k) => frame({ ...o, gun: port(o.hand[0]), ember: k % 2 ? 'Y' : 'y' }));
// smoke / flash stamps (g light, G mid, Z shade; y flash core, Y flash rim)
const FLASH = `
Yy
yyY
Yy
`;
const PUFF1 = `
.gg
ggG
gGZ
`;
const PUFF2 = `
..ggg
.gggG
gggGZ
.GGZ.
`;
const PUFF3 = `
.gG.
gGGZ
.GZ.
`;
const WISP = `
.G
GZ
Z.
`;
const level = (dyGun = 0, dx = 0) => (f, d) => gun(f, 6 + dx, 9 + d, 13 + dx, 9 + d - dyGun, 3);
const attack = [
  // fire: flash at the muzzle, first puff bursting from it
  frame({ lean: 0, nf: 2, ff: -3, hand: [11, 10], gun: level(0), fx: f => { stamp(f, 13, 6, PUFF1); stamp(f, 14, 9, FLASH); } }),
  // puff blooms, recoil kicks the shoulder back and the muzzle up
  frame({ lean: -1, nf: 2, ff: -3, hand: [10, 10], gun: level(1, -1), fx: f => { stamp(f, 11, 4, PUFF2); put(f, 13, 9, 'Y'); } }),
  // recoil settles; the cloud rises and thins
  frame({ lean: -1, nf: 2, ff: -3, dy: 1, hand: [10, 10], gun: level(0, -1), fx: f => stamp(f, 12, 2, PUFF3) }),
  // lower to reload: gun brought down to the hip, last wisp
  frame({ lean: 0, nf: 2, ff: -2, hand: [10, 12], gun: (f, d) => gun(f, 7, 11 + d, 13, 14 + d, 4), fx: f => stamp(f, 13, 0, WISP) }),
];
const DW = 26, DH = 24, AX = 21;
const stand = o => body({ hand: [11, 12], ...o });
const raw = [
  fallen(stand({ lean: -1, hand: [12, 7] }), 7.5, 23.5, -10, DW, DH, AX),
  fallen(stand({ dy: 3, knee: 2, nf: 0, ff: -1, hand: [12, 10] }), 7.5, 23.5, -22, DW, DH, AX),
  fallen(stand({ hand: [12, 8] }), 7.5, 23.5, -55, DW, DH, AX, 0, -1),
  fallen(stand({ hand: [12, 9], nf: 2, ff: -2 }), 7.5, 23.5, -90, DW, DH, AX, 0, -1),
  fallen(stand({ hand: [12, 9], nf: 2, ff: -2 }), 7.5, 23.5, -90, DW, DH, AX, 1, -1),
  fallen(stand({ hand: [12, 10], nf: 2, ff: -1, knee: 1 }), 7.5, 23.5, -90, DW, DH, AX, 0, -1),
];
const death = raw.map((g, k) => {
  const f = outline(despeckle(g));
  if (k === 0) gun(f, 22, 18, 24, 6, 5);
  if (k === 1) gun(f, 21, 18, 25, 8, 5);
  if (k === 2) gun(f, 18, 22, 25, 17, 4);
  if (k >= 3) { gun(f, 5, 23, 15, 23, 4); }
  if (k === 3) stamp(f, 9, 18, `.g\ngG`);
  return f;
});
emit(OUT, [
  '@pixel handgunner',
  'Hand cannoneer (AAA repaint): steel morion with crest and upturned brim, padded linen coat under a team tabard, dark hose,',
  'hand cannon (wooden tiller + iron barrel) carried at the port. 16×24, feet at [7,24], faces right; light upper-left; ink outline',
  '(#24180f, selective #4a3020). idle 4 (breath, blink), walk 8, attack 4 (muzzle flash + first puff → puff grows, recoil kicks the',
  'muzzle up → smoke drifts and thins → lowered to the hip to reload; smoke is painted), death 6 (26×24, falls backward, gun dropped).',
  'Generated with scratchpad/painter-skirm/gun.mjs, then kept as literal grids.',
], {
  id: 'handgunner', anchor: [7, 24], anchors: { death: [AX, 24] },
  palette: { o: '#24180f', O: '#4a3020', a: '#f2d2b0', s: '#e8c39e', S: '#c9a07a', h: '#5a3a1a', H: '#3b2a1a', T: 'team', D: 'teamdark', L: 'teamlight', u: '#a07a4a', w: '#8a6a3a', W: '#5a3a18', X: '#3b2614', m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', N: '#1e2a33', c: '#efe6d2', C: '#d9c7a0', q: '#a8946e', g: '#ece8de', G: '#bdb6aa', Z: '#8a8378', y: '#fff6c0', Y: '#ffb534' },
  frames: { idle, walk, attack, death },
});
