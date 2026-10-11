import { grid, put, get, line, rect, stamp, outline, over, clone, replace, emit, W, H } from './lib.mjs';
import { leg, putBehind, lineBehind, despeckle, fallen } from './rig.mjs';
const OUT = process.argv[2];
const HEAD = `
..ihhh..
.ihhhhH.
Rrrrrrrr
.hsasss.
.hssoss.
.HSsssS.
..SsS...
`;
const HEAD_BLINK = HEAD.replace('.hssoss.', '.hsssss.');
const CHEST = `
.uuwW.
LLTWDD
LTWTTD
LWTTTD
`;
const LOWER = `
XWuWWX
LTTTTD
.LTTD.
`;
const SHIELD = `
.XWX.
XLLTX
WLmTD
XTTDX
.XDX.
`;
// A frame: o = {dy, by (breath), lean (head/chest x), nf, ff (near/far foot x), nl, fl (lifts), arm:'hold'|..., hand:[x,y], jav, blink, band}
function body(o, thinProps = true) {
  const g = grid(16, 24); const dy = o.dy || 0, by = o.by || 0, lean = o.lean || 0;
  const hy = 15 + dy;
  // far leg (shade), then near leg
  leg(g, 6, hy, 6 + (o.ff || 0), o.fl || 0, ['q', 'W'], ['X', 'X'], 21, o.knee || 0);
  leg(g, 7, hy, 7 + (o.nf || 0), o.nl || 0, ['C', 'q'], ['W', 'X'], 21, o.knee || 0);
  stamp(g, 4 + Math.round(lean / 2), 12 + dy, LOWER);
  stamp(g, 4 + Math.round(lean / 2), 8 + dy + by, CHEST);
  stamp(g, 4 + lean, 1 + dy + by + (o.hdy || 0), o.blink ? HEAD_BLINK : HEAD);
  // headband tail streams behind
  const tail = o.band ?? 0; put(g, 3 + lean, 3 + dy + by + tail, 'R'); if (tail >= 0) put(g, 3 + lean, 4 + dy + by + tail, 'r');
  // shield on the back arm, face-on
  stamp(g, 1 + Math.round(lean / 2), 9 + dy + by + (o.sdy || 0), SHIELD);
  // front arm: shoulder → hand (2px: lit sleeve then skin hand)
  const sx = 9 + Math.round(lean / 2) + (o.lean ? 1 : 0), sy = 9 + dy + by; const [hx, hyy] = o.hand.map((v, i) => v + (i ? dy + by : 0));
  line(g, sx, sy, hx, hyy, (x, y) => (Math.abs(x - hx) + Math.abs(y - hyy) <= 1 ? 's' : 'u'));
  put(g, sx, sy, 'w');
  return g;
}
function finish(g, o) {
  let f = outline(g);
  const dy = o.dy || 0, by = o.by || 0, lean = o.lean || 0;
  // javelin bundle on the back: three shafts poking up behind the left shoulder
  const bx = 2 + Math.round(lean / 2);
  for (const [x0, y0, x1, y1] of [[bx + 2, 10, bx - 2, 2], [bx + 3, 10, bx, 1], [bx + 4, 10, bx + 2, 1]]) {
    lineBehind(f, x0, y0 + dy + by, x1, y1 + dy + by, 'w'); putBehind(f, x1, y1 + dy + by - 1, 'm');
  }
  // fix tips: steel
  if (o.jav) o.jav(f, dy + by);
  return f;
}
const holdJav = (hx) => (f, d) => { const x = hx + 1; line(f, x, 3 + d, x, 19 + d, 'w'); put(f, x, 19 + d, 'W'); put(f, x, 2 + d, 'n'); put(f, x, 1 + d, 'M'); put(f, x, 0 + d, 'm'); };
// fix: hand grips the shaft
function frame(o) { const f = finish(body(o), o); return f; }
const idleBase = { hand: [10, 12], jav: holdJav(10) };
const idle = [
  frame({ ...idleBase }),
  frame({ ...idleBase, by: 1, band: 1 }),
  frame({ ...idleBase, by: 1, band: 1 }),
  frame({ ...idleBase, blink: true, band: -1 }),
];
// walk: contact, down, passing, up × 2 legs; arm swings opposite the near leg
const W8 = [
  { nf: 3, ff: -3, dy: 0, hand: [10, 12] }, { nf: 2, ff: -2, dy: 1, hand: [10, 12] }, { nf: 0, ff: 1, fl: 1, dy: 0, hand: [11, 12] }, { nf: -2, ff: 2, fl: 1, dy: -1, hand: [11, 12] },
  { nf: -3, ff: 3, dy: 0, hand: [12, 12] }, { nf: -2, ff: 2, dy: 1, hand: [12, 12] }, { nf: 1, ff: 0, nl: 1, dy: 0, hand: [11, 12] }, { nf: 2, ff: -2, nl: 1, dy: -1, hand: [11, 12] },
];
const walk = W8.map((o, k) => frame({ ...o, band: k % 2 ? 1 : 0, jav: holdJav(o.hand[0]) }));
// attack: release (javelin leaving, arm whipped forward) → follow-through → reach to the bundle → new javelin cocked
const attack = [
  frame({ lean: 2, nf: 3, ff: -3, hand: [14, 8], band: 1, jav: (f, d) => { line(f, 13, 6, 15, 5, 'w'); put(f, 15, 4, 'm'); put(f, 12, 7, 'c'); put(f, 11, 8, 'c'); } }),
  frame({ lean: 2, nf: 3, ff: -3, dy: 1, hand: [13, 12], band: 1 }),
  frame({ lean: 0, nf: 2, ff: -2, hand: [7, 6], band: 0, hdy: 0 }),
  frame({ lean: -1, nf: 2, ff: -2, hand: [8, 7], band: -1, jav: (f, d) => { line(f, 2, 9 + d, 12, 5 + d, 'w'); put(f, 13, 5 + d, 'M'); put(f, 14, 4 + d, 'm'); } }),
];
// death: from a plain standing body (no thin props), rotated as it falls backward
// SX: the lying body is ~23 px long; a 26-wide canvas cropped the head at x<0, so the death canvas is 4 px wider on the left.
const SX = 4, DW = 26 + SX, DH = 24, AX = 21 + SX;
const stand = o => body({ hand: [11, 11], ...o });
const raw = [
  fallen(stand({ lean: -1, hand: [12, 7], band: -1 }), 7.5, 23.5, -10, DW, DH, AX),
  fallen(stand({ dy: 3, knee: 2, nf: 0, ff: -1, hand: [12, 10] }), 7.5, 23.5, -22, DW, DH, AX),
  fallen(stand({ hand: [12, 8] }), 7.5, 23.5, -55, DW, DH, AX, 0, -1),
  fallen(stand({ hand: [12, 9], nf: 2, ff: -2 }), 7.5, 23.5, -90, DW, DH, AX, 0, -1),
  fallen(stand({ hand: [12, 9], nf: 2, ff: -2 }), 7.5, 23.5, -90, DW, DH, AX, 1, -1),
  fallen(stand({ hand: [12, 10], nf: 2, ff: -1, knee: 1 }), 7.5, 23.5, -90, DW, DH, AX, 0, -1),
];
const death = raw.map((g, k) => {
  let f = outline(despeckle(g));
  if (k === 0) { line(f, SX + 21, 3, SX + 22, 21, 'w'); put(f, SX + 21, 2, 'm'); } // javelin still in hand, slipping
  if (k === 1) { line(f, SX + 19, 9, SX + 24, 20, 'w'); put(f, SX + 18, 8, 'm'); }
  if (k === 2) { line(f, SX + 18, 16, SX + 25, 22, 'w'); put(f, SX + 17, 15, 'm'); }
  if (k >= 3) { line(f, SX + 6, 23, SX + 17, 23, 'w'); put(f, SX + 18, 23, 'm'); put(f, SX + 19, 23, 'n'); }
  return f;
});
emit(OUT, [
  '@pixel skirmisher',
  'Skirmisher (AAA repaint): red headband, light hide cuirass over a team tunic, small round team shield on the back arm,',
  'javelin bundle on the back, one javelin in hand. 16×24, feet at [7,24], faces right; light from the upper-left; ink outline',
  '(#24180f, selective #4a3020 on the lit upper-left). idle 4 (breath, band flick, blink), walk 8 (contact/down/pass/up ×2),',
  'attack 4 (release with javelin leaving → follow-through → reach to the bundle → new javelin cocked), death 6 (30×24, falls backward).',
  'Generated with scratchpad/painter-skirm/skirm.mjs, then kept as literal grids.',
], {
  id: 'skirmisher', anchor: [7, 24], anchors: { death: [AX, 24] },
  palette: { i: '#7a5030', H: '#3b2a1a', C: '#d9c7a0', q: '#a8946e', o: '#24180f', O: '#4a3020', a: '#f2d2b0', s: '#e8c39e', S: '#c9a07a', h: '#5a3a1a', r: '#c0392b', R: '#8e2a1f', T: 'team', D: 'teamdark', L: 'teamlight', u: '#a07a4a', w: '#8a6a3a', W: '#5a3a18', X: '#3b2614', m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', c: '#efe6d2' },
  frames: { idle, walk, attack, death },
});
