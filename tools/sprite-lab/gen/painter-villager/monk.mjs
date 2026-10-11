import { grid, set, get, line, outline, parse } from './rig.mjs';
import { emit } from './emit.mjs';
import { place, shear, ink } from './death.mjs';
import { toolLayer } from './villager.mjs';
const OUT = './tools/sprite-lab/drafts/pixel.monk.js';
export const PAL = {
  k: '#24180f', n: '#1e2a33',
  a: '#f2d2b0', s: '#e8c39e', S: '#c9a07a', z: '#8a5a3a',
  T: 'team', D: 'teamdark', L: 'teamlight',
  w: '#a07a4a', W: '#8a6a3a', b: '#5a3a18', B: '#3b2614',
  c: '#efe6d2', C: '#d9c7a0', q: '#a8946e',
  g: '#ffe28a', G: '#e1b12c', y: '#a87a12',
};
// hooded head, face in the hood's shadow, facing right
const HOOD = `
.wwWW.
wwWWWb
wWbaas
wWbsks
wWbsss
.WbSS.`;
const HOOD_BLINK = HOOD.replace('sks', 'sSs');
// robe body rows (from the shoulders, row 8), cols from x=4; team shoulder cape (dark lower edge) and a wide team stole down the front, rope belt
const ROBE = `
.LLTTTD.
.LTTTTDb
.wDDLTDb
.wWLTDb.
.wWLTDb.
.CCCCCq.
.wCLTDb.
.wCLTDb.
.wWLTDb.
.wWLTDbb
wwWWWWbb
wwWWWWbb
wWWWWbbb
BBBBBBBB`;
/**
 * p: bob, sway (hem rows shift x), feet [[x,lift],[x,lift]], front/back hand, staff {x0,y0,x1,y1} or default planted, blink, headDy, lean
 */
export function monk(p = {}) {
  const g = grid();
  const bob = p.bob || 0, up = 8 + bob + (p.stoop || 0), lean = p.lean || 0;
  const front = p.front || [11, 14 + bob], back = p.back || [3, 14 + bob];
  // back sleeve (wide robe sleeve, shaded) behind the body
  for (const [x, y] of line(null, 4 + lean, up + 1, back[0], back[1])) { set(g, x, y, 'b'); set(g, x + 1, y, 'b'); }
  set(g, back[0], back[1], 'S');
  // feet peeking under the hem
  for (const [fx, lift] of p.feet || [[5, 0], [9, 0]]) { set(g, fx, 22 - lift, 'B'); set(g, fx + 1, 22 - lift, 'B'); }
  // robe: upper rows lean, hem sways
  const rows = parse(ROBE);
  rows.forEach((r, j) => r.forEach((c, i) => {
    if (c === '.') return;
    const y = up + j; if (y > 21) return;
    const sh = j < 5 ? lean : j >= 9 ? (p.sway || 0) : 0;
    set(g, 4 + i + sh, y, c);
  }));
  // make sure the hem reaches row 21 when bobbing up
  for (let y = up + rows.length; y <= 21; y++) for (let x = 4; x < 12; x++) if (get(g, x, y - 1) !== '.' && get(g, x, y - 1) !== 'B') set(g, x + 0, y, get(g, x, y - 1));
  parse(p.blink ? HOOD_BLINK : HOOD).forEach((r, j) => r.forEach((c, i) => { if (c !== '.') set(g, 5 + lean + i, up - 6 + j + (p.headDy || 0), c); }));
  // front sleeve over the robe
  for (const [x, y] of line(null, 10 + lean, up + 1, front[0], front[1])) { set(g, x, y, 'W'); }
  set(g, front[0], front[1], 's');
  if (p.raw) return g;
  const o = ink(g);
  // staff: wood line with a gold cross on top
  const st = p.staff === undefined ? { x0: 12, y0: 3, x1: 12, y1: 23 } : p.staff;
  const px = [];
  if (st) {
    for (const [x, y] of line(null, st.x0, st.y0 + 2, st.x1, st.y1)) if (!(x === front[0] && y === front[1])) px.push([x, y, 'b']);
    const cx = st.x0, cy = st.y0;
    px.push([cx, cy - 1, 'g'], [cx, cy, 'G'], [cx - 1, cy, 'g'], [cx + 1, cy, 'y'], [cx, cy + 1, 'y']);
  }
  for (const [x, y, c] of px) set(o, x, y, c);
  // ink around the cross so it reads on grass
  for (const [x, y, c] of px) if ('gGy'.includes(c)) for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (get(o, a, b) === '.') set(o, a, b, 'k');
  // repaint the gripping hand over the staff
  set(o, front[0], front[1], 's');
  return o;
}

// ---- sets
const idleA = monk(), idleB = monk({ stoop: 1, front: [11, 15], back: [3, 15] }), idleC = monk({ blink: true }), idleD = monk({ sway: -1 });
const BOB = [0, 1, 0, -1, 0, 1, 0, -1];
const FEET = [[[8, 0], [4, 0]], [[8, 0], [5, 0]], [[7, 0], [6, 1]], [[6, 0], [8, 1]], [[4, 0], [9, 0]], [[5, 0], [8, 0]], [[6, 1], [7, 0]], [[8, 1], [6, 0]]];
const SWAY = [1, 1, 0, -1, -1, -1, 0, 1];
const walk = [0, 1, 2, 3, 4, 5, 6, 7].map(f => {
  const bob = BOB[f], arm = [1, 1, 0, -1, -1, -1, 0, 1][f];
  return monk({ bob, sway: SWAY[f], feet: FEET[f], front: [11 + Math.max(0, arm), 14 + bob - (arm > 0 ? 1 : 0)], back: [3 - Math.min(0, -arm), 14 + bob],
    staff: { x0: 12 + Math.max(0, arm), y0: 3 + bob, x1: 13 + arm, y1: 23 } });
});
// convert: staff raised high, other hand lifted, chanting (head tips back on the peak)
const convert = [
  monk({ front: [12, 10], back: [2, 9], staff: { x0: 13, y0: 1, x1: 12, y1: 16 } }),
  monk({ front: [12, 6], back: [2, 4], staff: { x0: 13, y0: 0, x1: 12, y1: 12 } }),
  monk({ front: [12, 5], back: [2, 3], staff: { x0: 13, y0: 0, x1: 12, y1: 11 }, lean: -1, blink: true }),
  monk({ front: [12, 6], back: [2, 4], staff: { x0: 13, y0: 0, x1: 12, y1: 12 }, sway: -1 }),
  monk({ front: [12, 10], back: [2, 8], staff: { x0: 13, y0: 1, x1: 12, y1: 16 }, sway: 1 }),
];
// death: 24×24
const DW = 24, DH = 24, pad = g => place(g, DW, DH, 4, 0);
const d0 = pad(monk({ lean: -2, front: [12, 6], back: [2, 8], staff: { x0: 14, y0: 2, x1: 13, y1: 20 } }));
const cross = (x, y) => [[x, y - 1, 'g'], [x, y, 'G'], [x - 1, y, 'g'], [x + 1, y, 'y'], [x, y + 1, 'y']];
const inked = (g, px) => { toolLayer(g, px); for (const [x, y, c] of px) if ('gGy'.includes(c)) for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (get(g, a, b) === '.') set(g, a, b, 'k'); };
// d1: the staff is let go and starts to topple; drawn on the 24-wide canvas so the cross keeps its right arm
const d1 = pad(monk({ stoop: 2, lean: -1, blink: true, front: [11, 16], back: [3, 16], staff: null }));
inked(d1, [...line(null, 19, 8, 17, 23).map(([x, y]) => [x, y, 'b']), ...cross(19, 6)]);
const d2 = ink(shear(place(monk({ blink: true, raw: true, front: [12, 9], back: [3, 9] }), DW, DH, 9, 0), 0.6, 22));
const CORPSE = `
...as.................
.wassa.LLLLLLLL.......
wwWsss.TTTTTTTTwWWWWBB
wWbSSWWWCWWWWWWWWWWWbB
.Wb..sbbCbbbbbbbbbbbbB
.....sS...............`;
const CORPSE_UP = `
.........ss...........
...as...sW............
.wassa.WLLLLLLL.......
wwWsss.TTTTTTTTwWWWWBB
wWbSSWWWCWWWWWWWWWWWbB
.Wb....bCbbbbbbbbbbbbB`;
const lie = (art, lift) => { const R = parse(art); return place(R, DW, DH, 1, 22 - R.length + 1 - lift); };
const d3 = ink(lie(CORPSE_UP, 0)), d4 = ink(lie(CORPSE, 1)), d5 = ink(lie(CORPSE, 0));
// the staff he lets go of in d1 keeps falling (d2) and lies on the ground beside him from the impact on (d3..d5),
// so it never vanishes and reappears between frames
inked(d2, [...line(null, 17, 23, 21, 17).map(([x, y]) => [x, y, 'b']), ...cross(22, 15)]);
const STAFF_DOWN = [...line(null, 11, 23, 19, 23).map(([x, y]) => [x, y, 'b']), [20, 23, 'y'], [21, 23, 'G'], [21, 22, 'g'], [22, 23, 'y']];
for (const g of [d3, d4, d5]) toolLayer(g, STAFF_DOWN);
emit(OUT, {
  id: 'monk', anchor: [8, 24], anchors: { death: [12, 24] }, fps: { convert: 6 }, palette: PAL,
  header: `// Monk: brown hooded robe to the ankles (lit left, shaded right), team shoulder cape and wide team stole down the front (team-dark edges), rope belt, staff with a gold cross.
// 16×24, feet at the bottom centre, faces right. idle breathes/blinks/sways, walk: hem sways with the feet peeking, convert: staff raised
// high and the free hand lifted, chanting (relic and halo are code-drawn by the unit draft). Death: 24×24, corpse with the staff beside it.
// generated by painter-villager rig (scratchpad monk.mjs)`,
  frames: { idle: [idleA, idleA, idleB, idleB, idleD, idleC], walk, convert, death: [d0, d1, d2, d3, d4, d5] },
});
