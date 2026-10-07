// @pixel tradecart
// Trade cart: an ox pulling a two-wheel cart with a team-colour cloth cover; sacks of gold show at the back when loaded.
// Generated grid 34×24, faces right (ox leads), anchor at the ground line, bottom centre. Frame sets: idle, walk ×4, gold ×4 (loaded, walking).
const W = 34, H = 24;
const WHEEL_A = `
.xxxxx.
xx.d.xx
x..d..x
xdddddx
x..d..x
xx.d.xx
.xxxxx.
`;
const WHEEL_B = `
.xxxxx.
xd...dx
x.d.d.x
x..d..x
x.d.d.x
xd...dx
.xxxxx.
`;
// ox: body, head with horns, legs in two poses (stand / stride)
const OX = `
..........cc..
.oooooooo.cOo.
oooooooooOOOo.
oOOoooooooOOok
oOOoooooooOO..
.ooooooooOOO..
`;
const LEGS_STAND = `
.oo...oo.
.oo...oo.
.kk...kk.
`;
const LEGS_STRIDE = `
oo.....oo
oo.....oo
kk.....kk
`;
const LEGS_PASS = `
..oo.oo..
..oo.oo..
..kk.kk..
`;
const SACKS = `
.gg.gg.
gGggGgg
ggggggg
`;
function cart(wheel, legs, loaded) {
  const g = pixGrid(W, H);
  // cover: a rounded hood in team colour, dark on the shaded (right) side, light rim on top-left
  pixPoly(g, [[3, 15], [3, 10], [5, 7], [9, 5], [14, 5], [17, 7], [18, 10], [18, 15]], 'T');
  pixLine(g, 14, 5, 17, 7, 'D'); pixLine(g, 17, 7, 18, 10, 'D'); pixRect(g, 17, 10, 2, 5, 'D');
  pixLine(g, 5, 7, 9, 5, 'L'); pixLine(g, 3, 10, 5, 7, 'L');
  pixLine(g, 7, 6, 7, 14, 'D'); pixLine(g, 12, 5, 12, 14, 'D');          // hoop seams
  pixRect(g, 2, 15, 18, 2, 'w'); pixRect(g, 2, 15, 18, 1, 'W'); pixRect(g, 2, 17, 18, 1, 'd'); // bed
  pixLine(g, 19, 16, 24, 14, 'd'); pixLine(g, 19, 15, 24, 13, 'w');        // shafts to the ox
  pixStamp(g, 7, 17, wheel);                                              // the one visible wheel
  pixRect(g, 3, 17, 3, 1, 'd');                                            // rear prop
  if (loaded) pixStamp(g, 1, 12, SACKS);                                   // gold sacks peeking out the back
  pixStamp(g, 20, 9, OX); pixStamp(g, 22, 15, legs);                       // ox + legs
  pixSet(g, 31, 10, 'k');                                                  // eye
  pixLine(g, 24, 11, 25, 11, 'r');                                         // yoke strap
  return g;
}
const legsCycle = [LEGS_STRIDE, LEGS_PASS, LEGS_STRIDE, LEGS_PASS];
const wheels = [WHEEL_A, WHEEL_B, WHEEL_A, WHEEL_B];
export default {
  id: 'tradecart', anchor: [17, 24],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520', k: '#2a2018',
    o: '#8a5a2b', O: '#6a4420', c: '#e8dcc0', r: '#6a4a2a',
    g: '#e1b12c', G: '#f0cd5a',
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: {
    idle: [pixText(cart(WHEEL_A, LEGS_STAND, false))],
    walk: legsCycle.map((l, i) => pixText(cart(wheels[i], l, false))),
    gold: legsCycle.map((l, i) => pixText(cart(wheels[i], l, true))),
  },
};
