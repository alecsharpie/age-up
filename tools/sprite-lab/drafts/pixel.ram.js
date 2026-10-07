// @pixel ram
// Battering ram: a hide-covered hut on three wheels with the iron-capped log sticking out the front (right).
// Generated grid 28×24, faces right, anchor at the wheels' ground line, bottom centre. Roof edge is team colour.
const W = 28, H = 24;
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
  pixLine(g, 1, 20, 26, 20, 'd');                                      // axle line
  pixStamp(g, 1, 17, wheel); pixStamp(g, 10, 17, wheel); pixStamp(g, 19, 17, wheel);
  pixRect(g, 3, 15, 22, 2, 'd');                                       // chassis beam
  pixRect(g, 4, 9, 20, 6, 'w');                                        // plank body
  pixRect(g, 4, 11, 20, 1, 'd'); pixRect(g, 4, 13, 20, 1, 'd');        // plank seams
  pixRect(g, 23, 9, 1, 6, 'd');                                        // shaded front edge
  pixPoly(g, [[3, 9], [13.5, 4], [14, 9]], 'h'); pixPoly(g, [[13.5, 4], [25, 9], [14, 9]], 'H');  // hide roof, lit left / shaded right
  pixLine(g, 3, 9, 25, 9, 'T'); pixLine(g, 13, 5, 14, 5, 'T');         // team-colour eaves and ridge
  pixLine(g, 5, 8, 23, 8, 'r');                                        // lashing rope under the eaves
  pixSet(g, 8, 12, 'k'); pixSet(g, 16, 12, 'k');                       // dark slits
  pixRect(g, logX, 12, 27 - logX, 2, 'w'); pixRect(g, logX, 12, 27 - logX, 1, 'W'); // the log
  pixRect(g, 26, 11, 2, 4, 'n'); pixSet(g, 26, 11, 'm'); pixSet(g, 26, 12, 'm');     // iron cap with highlight
  return g;
}
export default {
  id: 'ram', anchor: [14, 24],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520', k: '#2a2018',
    h: '#a78b5a', H: '#7d6540', r: '#6a4a2a', n: '#555555', m: '#9aa0a6',
    T: 'team', D: 'teamdark',
  },
  frames: {
    idle: [pixText(base(WHEEL_A, 19))],
    walk: [pixText(base(WHEEL_A, 19)), pixText(base(WHEEL_B, 19))],
    attack: [pixText(base(WHEEL_A, 21)), pixText(base(WHEEL_A, 17))],
  },
};
