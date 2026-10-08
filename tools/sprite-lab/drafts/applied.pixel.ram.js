// @pixel ram
// Battering ram: a hide-covered hut on three wheels with the iron-capped log sticking out the front (right).
// Generated grid 28×24, faces right, anchor at the wheels' ground line, bottom centre. Roof edge is team colour.
const W = 30, H = 24;
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
function base(wheel, logX) {
  const g = pixGrid(W, H);
  pixLine(g, 1, 20, 27, 20, 'd');                                      // axle line
  pixStamp(g, 1, 17, wheel); pixStamp(g, 10, 17, wheel); pixStamp(g, 19, 17, wheel);
  pixRect(g, 3, 16, 22, 1, 'd');                                       // chassis beam
  pixRect(g, 4, 8, 20, 6, 'w');                                        // plank body
  pixRect(g, 4, 10, 20, 1, 'd'); pixRect(g, 4, 12, 20, 1, 'd');        // plank seams
  pixRect(g, 23, 8, 1, 6, 'd');                                        // shaded front edge
  pixPoly(g, [[3, 8], [13.5, 3], [14, 8]], 'h'); pixPoly(g, [[13.5, 3], [25, 8], [14, 8]], 'H');  // hide roof, lit left / shaded right
  pixLine(g, 3, 8, 25, 8, 'T'); pixLine(g, 13, 4, 14, 4, 'T');         // team-colour eaves and ridge
  pixLine(g, 5, 7, 23, 7, 'r');                                        // lashing rope under the eaves
  pixSet(g, 8, 11, 'k'); pixSet(g, 16, 11, 'k');                       // dark slits
  pixRect(g, 4, 14, 20, 2, 'k');                                       // dark gap under the body where the log swings
  pixRect(g, logX, 14, 10, 2, 'o'); pixRect(g, logX, 14, 10, 1, 'O');  // the log (10 long, slides)
  pixRect(g, logX + 9, 13, 2, 4, 'n'); pixSet(g, logX + 9, 13, 'm'); pixSet(g, logX + 9, 14, 'm'); // iron cap with highlight
  pixLine(g, 9, 13, 9, 14, 'r'); pixLine(g, 18, 13, 18, 14, 'r');      // ropes the log hangs from
  return g;
}
export default {
  id: 'ram', anchor: [15, 24],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520', k: '#2a2018',
    h: '#a78b5a', H: '#7d6540', r: '#6a4a2a', n: '#555555', m: '#9aa0a6', o: '#6a4a2a', O: '#8a6a3a',
    T: 'team', D: 'teamdark',
  },
  frames: {
    idle: [pixText(base(WHEEL_A, 16))],
    walk: [pixText(base(WHEEL_A, 16)), pixText(base(WHEEL_B, 16))],
    attack: [pixText(base(WHEEL_A, 13)), pixText(base(WHEEL_A, 19))],
  },
};
