// @pixel catapult
// Mangonel: four-wheel cart (two visible side-on), throwing arm with a bucket, padded stop post in front.
// Generated: wheels/bucket are hand-painted stamps; beams and the arm are laid with the kit so every frame lines up.
// Faces right. Grid 26×24, anchor at the wheels' ground line, bottom centre.
const W = 26, H = 24;
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
const BUCKET_FULL = `
.ddd.
dsSsd
.ddd.
`;
const BUCKET_EMPTY = `
.ddd.
d...d
.ddd.
`;
function base(wheel) {
  const g = pixGrid(W, H);
  pixLine(g, 9, 20, 16, 20, 'd');                  // axle
  pixStamp(g, 2, 17, wheel); pixStamp(g, 17, 17, wheel);
  pixRect(g, 3, 13, 21, 1, 'W'); pixRect(g, 3, 14, 21, 1, 'w'); pixRect(g, 3, 15, 21, 1, 'T'); pixRect(g, 3, 16, 21, 1, 'd'); // bed with team band
  pixRect(g, 10, 12, 5, 1, 'd'); pixSet(g, 12, 12, 'n');  // pivot beam, iron pin
  pixRect(g, 18, 8, 2, 5, 'd'); pixRect(g, 18, 7, 2, 1, 'r'); // padded stop post
  pixLine(g, 4, 12, 7, 12, 'd'); pixLine(g, 4, 11, 4, 12, 'd'); // winch block at the back
  return g;
}
function arm(g, x1, y1, bucket, bx, by) {
  pixLine(g, 12, 11, x1, y1, 'w'); pixLine(g, 13, 11, x1 + 1, y1, 'W');
  pixStamp(g, bx, by, bucket);
}
const rest = base(WHEEL_A); arm(rest, 9, 4, BUCKET_FULL, 7, 1);
const walk0 = base(WHEEL_A); arm(walk0, 9, 4, BUCKET_FULL, 7, 1);
const walk1 = base(WHEEL_B); arm(walk1, 9, 4, BUCKET_FULL, 7, 1);
const cocked = base(WHEEL_A); arm(cocked, 4, 9, BUCKET_FULL, 1, 6);
const fired = base(WHEEL_A); arm(fired, 17, 4, BUCKET_EMPTY, 15, 1);
const settle = base(WHEEL_A); arm(settle, 11, 4, BUCKET_EMPTY, 9, 1);

export default {
  id: 'catapult', anchor: [13, 24],
  palette: {
    W: '#a3803f', w: '#8a6a3a', d: '#5a3a18', x: '#4a3520',   // wood lit / mid / dark, wheel rim
    n: '#555555', r: '#6a4a2a', s: '#8d8478', S: '#aab3b5',   // iron pin, leather pad, stone, stone highlight
    T: 'team', D: 'teamdark',
  },
  frames: {
    idle: [pixText(rest)],
    walk: [pixText(walk0), pixText(walk1)],
    attack: [pixText(cocked), pixText(fired), pixText(settle)],
  },
};
