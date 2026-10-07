// @pixel bombard
// Bombard cannon: a thick barrel on a wooden two-wheel carriage, muzzle to the right. attack = recoil + muzzle flash, then at rest.
// Generated grid 26×20, faces right, anchor at the wheels' ground line. Smoke is code-drawn by the unit draft.
const W = 26, H = 20;
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
function base(wheel, bx, flash) {
  const g = pixGrid(W, H);
  pixLine(g, 7, 16, 16, 16, 'd');                                        // axle
  pixStamp(g, 3, 13, wheel); pixStamp(g, 14, 13, wheel);
  pixRect(g, 5, 10, 16, 1, 'W'); pixRect(g, 5, 11, 16, 1, 'w'); pixRect(g, 5, 12, 16, 1, 'T'); // carriage with team band
  pixLine(g, 2, 13, 6, 10, 'd'); pixLine(g, 1, 13, 4, 13, 'd');            // trail at the back
  pixRect(g, 9, 8, 4, 2, 'd');                                             // cheek block the barrel rests on
  // barrel: three parallel lines, lit on top, iron body, dark underside; thicker breech at the back
  pixLine(g, bx, 8, bx + 15, 4, 'n'); pixLine(g, bx, 7, bx + 15, 3, 'M'); pixLine(g, bx, 6, bx + 15, 2, 'm');
  pixRect(g, bx - 1, 5, 3, 5, 'M'); pixRect(g, bx - 1, 5, 3, 1, 'm'); pixSet(g, bx - 1, 9, 'n');  // breech
  pixRect(g, bx + 14, 1, 2, 5, 'M'); pixSet(g, bx + 14, 1, 'm'); pixSet(g, bx + 15, 5, 'n');     // muzzle ring
  pixSet(g, bx + 1, 4, 'k');                                               // touch hole
  if (flash) { pixStamp(g, bx + 16, 0, `
..f.
.fFf
ffFf
.fFf
..f.
`); }
  return g;
}
export default {
  id: 'bombard', anchor: [13, 20],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520', k: '#2a2018',
    n: '#555555', M: '#6d7679', m: '#9aa0a6', f: '#ffb347', F: '#fff1a8',
    T: 'team', D: 'teamdark',
  },
  frames: {
    idle: [pixText(base(WHEEL_A, 7, false))],
    walk: [pixText(base(WHEEL_A, 7, false)), pixText(base(WHEEL_B, 7, false))],
    attack: [pixText(base(WHEEL_A, 5, true)), pixText(base(WHEEL_A, 7, false))],
  },
};
