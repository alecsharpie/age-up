// @pixel trebuchet
// Trebuchet: wheeled bed, tall A-frame, long throwing arm with a counterweight box on the short end and a sling on the long end.
// Generated grid 30×44, faces right, anchor at the wheels' ground line. idle = cocked (arm down-forward, weight up-back).
const W = 30, H = 44;
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
const PX = 15, PY = 13;   // pivot (apex of the A-frame)
function base(wheel) {
  const g = pixGrid(W, H);
  pixLine(g, 9, 40, 20, 40, 'd');
  pixStamp(g, 3, 37, wheel); pixStamp(g, 20, 37, wheel);
  pixRect(g, 3, 33, 24, 1, 'W'); pixRect(g, 3, 34, 24, 1, 'w'); pixRect(g, 3, 35, 24, 1, 'T'); pixRect(g, 3, 36, 24, 1, 'd'); // bed + team band
  pixLine(g, 7, 33, PX, PY, 'w'); pixLine(g, 8, 33, PX + 1, PY, 'W');      // left leg (lit)
  pixLine(g, 23, 33, PX, PY, 'd'); pixLine(g, 22, 33, PX - 1, PY, 'w');    // right leg (shaded)
  pixLine(g, 10, 26, 20, 26, 'd');                                         // cross brace
  pixRect(g, PX - 1, PY, 3, 1, 'n');                                       // iron axle
  pixStamp(g, PX - 1, PY - 5, `
.T.
TT.
TT.
.T.
d..
`);                                                                        // pennant on the apex post
  return g;
}
// arm from the pivot: long end to (lx,ly), short end to (sx,sy); counterweight box centred on the short end; sling from the long end.
function arm(g, lx, ly, sx, sy, sling, stone) {
  pixLine(g, PX, PY, lx, ly, 'w'); pixLine(g, PX, PY - 1, lx, ly - 1, 'W');
  pixLine(g, PX, PY, sx, sy, 'w');
  pixRect(g, sx - 2, sy - 1, 5, 5, 'n'); pixRect(g, sx - 2, sy - 1, 5, 1, 'm'); pixRect(g, sx - 2, sy, 1, 4, 'M'); // counterweight: iron box, lit top/left
  if (sling) { pixLine(g, lx, ly, sling[0], sling[1], 'r'); pixSet(g, sling[0], sling[1], 'd'); if (stone) pixSet(g, sling[0], sling[1] - 1, 's'); }
}
const cocked = base(WHEEL_A); arm(cocked, 26, 28, 9, 6, [22, 31], true);
const walk0 = base(WHEEL_A); arm(walk0, 26, 28, 9, 6, [22, 31], true);
const walk1 = base(WHEEL_B); arm(walk1, 26, 28, 9, 6, [22, 31], true);
const mid = base(WHEEL_A); arm(mid, 28, 10, 4, 15, [28, 3], true);
const fired = base(WHEEL_A); arm(fired, 18, 0, 13, 23, [25, 2], false);

export default {
  id: 'trebuchet', anchor: [15, 44],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520',
    n: '#555555', m: '#9aa0a6', M: '#6d7679', r: '#6a4a2a', s: '#8d8478',
    T: 'team', D: 'teamdark',
  },
  frames: {
    idle: [pixText(cocked)],
    walk: [pixText(walk0), pixText(walk1)],
    attack: [pixText(cocked), pixText(mid), pixText(fired)],
  },
};
