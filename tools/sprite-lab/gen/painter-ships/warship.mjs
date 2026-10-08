import * as P from './lib.mjs';
const { grid, set, get, rect, line, poly, stamp, outline, text, WL } = P;
const OUT = './tools/sprite-lab/drafts/pixel.warship.js';

// War galley: long low hull, bronze ram, aplustre curling up at the stern, row of team shields on the rail,
// square sail (team, linen band) billowing forward, oars along the side.
const OARS = [7, 11, 15, 19, 23];
function hull(g) {
  poly(g, [[3, 27], [30, 27], [33, 25], [34, 27], [31, 31], [31, 36], [7, 36], [3, 30]], 'm');
  line(g, 4, 27, 30, 27, 'w'); line(g, 31, 26, 33, 25, 'w');           // gunwale cap, lit
  line(g, 4, 28, 30, 28, 'm');
  line(g, 4, 29, 31, 29, 'd');                                            // wale
  for (let y = 30; y <= 35; y++) for (let x = 0; x < 33; x++) if (get(g, x, y) === 'm') set(g, x, y, y === 32 ? 'm' : 's');
  for (let x = 26; x <= 31; x++) set(g, x, 32, 's');
  for (const x of OARS) set(g, x, 30, 'o');                             // oar ports
  // aplustre: stern post curling forward
  stamp(g, 0, 18, `
.ww..
w..s.
w....
ww...
.ww..
.mww.
..mww
...mw
....m`);
  // bronze ram at the bow, on the waterline
  stamp(g, 30, 32, `
.bbb..
bbbBBb
bBBBBB
.BBBB.`);
  set(g, 31, 32, 'e');
  // eye on the bow
  set(g, 29, 29, 'c'); set(g, 30, 29, 'o');
}
function shields(g) { for (const x of [5, 9, 13, 21, 25]) stamp(g, x, 24, `oLTo\nLTbD\noDDo`); }
function mast(g, sway) {
  line(g, 17, 4, 17, 27, 's'); line(g, 18, 4, 18, 27, 'd');
  line(g, 9, 8 + sway, 26, 8 - sway, 'd');                                // yard
  line(g, 17, 4, 4, 22, 'N'); line(g, 18, 4, 30, 25, 'N');                // stays (rope, linen shade)
}
/** square sail, belly b (0..2) bulges to the right, sag on the bottom */
function sail(g, b, sway = 0) {
  const pts = [[10, 9], [26, 9], [27 + b, 13], [27 + b, 19], [25 + b, 23 + (b > 1 ? 1 : 0)], [11, 23], [10.5 + b * 0.5, 16]];
  poly(g, pts, 'T');
  // light on the upper-left, shade down the belly on the right
  for (let y = 9; y < 24; y++) for (let x = 10; x < 30; x++) {
    if (get(g, x, y) !== 'T') continue;
    if (x <= 12 + (y < 12 ? 2 : 0) && y < 21) set(g, x, y, 'L');
    else if (x >= 23 + b || y >= 21) set(g, x, y, 'D');
  }
  // linen band across the sail
  for (let x = 10; x < 30; x++) for (const y of [15, 16]) { const c = get(g, x, y); if (c === 'T' || c === 'L') set(g, x, y, y === 15 ? 'c' : 'n'); else if (c === 'D') set(g, x, y, 'N'); }
  // brails (vertical rope lines) give the belly form
  for (const x of [15, 20]) for (let y = 10; y < 23; y++) if (get(g, x + (y > 17 ? b >> 1 : 0), y) === 'T') set(g, x + (y > 17 ? b >> 1 : 0), y, 'D');
  void sway;
}
/** archer standing at x (deck figure, 4 tall; shields cover the legs). pose: rest|draw|loose|reach */
function archer(g, x, pose) {
  set(g, x, 22, 'h'); set(g, x + 1, 22, 'h');
  set(g, x, 23, 'K'); set(g, x + 1, 23, 'k');
  set(g, x, 24, 'D'); set(g, x + 1, 24, 'T');
  if (pose === 'rest') { stamp(g, x + 2, 21, `w\nw\nw`); }
  if (pose === 'draw') { stamp(g, x + 2, 20, `.w\nw.\nw.\n.w`); set(g, x + 2, 24, 'k'); }
  if (pose === 'loose') { stamp(g, x + 2, 20, `..w\n.w.\nw..`); set(g, x + 2, 23, 'k'); }
  if (pose === 'reach') { stamp(g, x + 2, 22, `w\nw\nw`); set(g, x - 1, 24, 'k'); }
}
/** oar from port (x,31) — phase: 'rest' | 0 catch | 1 pull | 2 finish | 3 recover */
function oar(g, x, ph) {
  const tip = { rest: [x + 2, 35], 0: [x + 3, 35], 1: [x + 1, 35], 2: [x - 2, 35], 3: [x + 1, 34] }[ph];
  line(g, x, 31, tip[0], tip[1], 'w');
  if (ph === 0 || ph === 1) { set(g, tip[0] + 1, 35, 'f'); set(g, tip[0] + 2, 35, 'F'); }
  if (ph === 2) { set(g, tip[0] - 1, 35, 'F'); set(g, tip[0] - 2, 35, 'F'); }
}

function ship({ b = 1, flag = 0, oars = 'rest', poses = ['rest', 'rest', 'rest'], sway = 0, foam = 0, moving = false, arrows = null }) {
  const g = grid();
  mast(g, sway);
  sail(g, b, sway);
  P.pennant(g, 19, 3, flag);
  hull(g);
  outline(g);
  archer(g, 7, poses[0]); archer(g, 15, poses[1]); archer(g, 23, poses[2]);
  shields(g);
  // re-ink the crew heads' top/back after outline (they are not outlined, keep them small)
  for (const x of OARS) oar(g, x, oars === 'rest' ? 'rest' : (oars + (x % 2)) % 4);
  if (!moving) P.lap(g, 8, 30, foam); else { P.lap(g, 8, 30, foam); P.wake(g, 31, 7, foam); }
  if (arrows) arrows(g);
  return g;
}

// idle: sail breathes 0→1→2→1, pennant flutters, foam laps
const idle = [0, 1, 2, 3, 4, 5].map(k => ship({ b: [0, 1, 2, 2, 1, 0][k], flag: k % 3, foam: k, sway: 0 }));
const walk = [0, 1, 2, 3].map(k => ship({ b: 2, flag: k % 3, oars: k, foam: k, moving: true }));
const volley = n => g => { const A = n ? [[27, 7], [31, 10], [30, 4]] : [[10, 19], [18, 19], [26, 19]]; for (const [x, y] of A) { line(g, x, y, x + 2, y - 1, 'c'); set(g, x + 3, y - 1, 'e'); } };
const attack = [
  ship({ b: 2, poses: ['loose', 'loose', 'loose'], arrows: volley(0) }),
  ship({ b: 2, flag: 1, poses: ['loose', 'draw', 'loose'], arrows: volley(1), foam: 1 }),
  ship({ b: 1, flag: 2, poses: ['reach', 'reach', 'draw'], foam: 2 }),
  ship({ b: 1, poses: ['draw', 'draw', 'draw'], foam: 3 }),
];
const full = ship({ b: 1, poses: ['rest', 'rest', 'rest'] }); for (let x = 0; x < 36; x++) if ('fFu'.includes(full[WL][x])) full[WL][x] = 's';
const death = P.sinking(full, {
  cx: 19,
  hit: g => { stamp(g, 20, 22, `.g.\nGgg\n.G.`); stamp(g, 24, 27, `yr\nrR`); },
  debris: (g, k) => { if (k >= 3) { stamp(g, 28 + k, 33, `ww\n.s`); } },
  flot: g => {
    stamp(g, 9, 32, `
....DTTTL.......
..DTTTTTTD......
.FuuuuuuuuF..ww.`);
    stamp(g, 4, 34, `wmms`); stamp(g, 23, 33, `.bB\nFuuF`); stamp(g, 15, 30, `f\nF`); stamp(g, 27, 31, `f.\nFf`);
    stamp(g, 2, 35, 'F'); stamp(g, 31, 34, `ws\n.F`);
  },
});

P.writeDraft(OUT, {
  id: 'warship', fps: { idle: 4, walk: 8, death: 7 },
  header: ['War galley: long low hull, bronze ram, curled aplustre, team shields on the rail, square team sail with a linen band.',
    'Generated by the ship painter script (scratchpad), then stored as literal grids. Faces right; bottom row = waterline (foam).',
    'idle 6 (sail breathes, pennant, foam laps) · walk 4 (oars stroke, bow wave, wake) · attack 4 (volley, recoil, reach, nock) · death 8 (list, sink, flotsam).'],
  frames: { idle: idle.map(text), walk: walk.map(text), attack: attack.map(text), death: death.map(text) },
});
console.log('ok');
