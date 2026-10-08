// A shared human body for the three bow/crossbow sprites. Interior coords in a 16×24 cell grid, feet at x≈8, ground row 22
// (outline lands on row 23). pose: {bob, lean, F:[x,y], B:[x,y], fk, bk (knee bend), farm:[[sx,sy],[ex,ey],[hx,hy]], barm, blink}
import { Pic } from './kit.mjs';
export const GROUND = 21; // boot top row when standing (boot rows 21..22)
function thick(p, x0, y0, x1, y1, m, t, sh, w) {
  const horiz = Math.abs(x1 - x0) > Math.abs(y1 - y0);
  for (let k = 0; k < w; k++) horiz ? p.line(x0, y0 + k, x1, y1 + k, m, t, 1, sh) : p.line(x0 + k, y0, x1 + k, y1, m, t, 1, sh);
}
export function leg(p, hx, hy, ax, ay, bend, sh, mat = 'wool') {
  const kx = Math.round((hx + ax) / 2) + bend, ky = Math.round((hy + ay) / 2);
  thick(p, hx, hy, kx, ky, mat, null, sh, 2);
  thick(p, kx, ky, ax, ay - 1, mat, null, sh, 2);
  // boot: shaft 2 wide, foot 3 wide toe right; lifted foot hangs toe-down
  if (ay >= GROUND) { p.rect(ax, ay, 2, 1, 'boot', null, sh); p.rect(ax, ay + 1, 3, 1, 'boot', null, sh); }
  else { p.rect(ax, ay, 2, 1, 'boot', null, sh); p.rect(ax + 1, ay + 1, 2, 1, 'boot', null, sh); }
}
export function arm(p, pts, sleeve, sh, opt = {}) {
  const [s, e, h] = pts;
  thick(p, s[0], s[1], e[0], e[1], sleeve, null, sh, opt.uw || 2);
  thick(p, e[0], e[1], h[0], h[1], opt.fore || 'skin', null, sh, opt.fw || 1);
  p.rect(h[0], h[1], opt.hw || 1, opt.hh || 2, 'skin', null, sh);
}
/** Build a body. hooks: back(p,o) behind everything, torso(p,o) override, head(p,o), front(p,o) after the front arm. o = {ux,uy} upper-body offset. */
export function body(pose, hooks, W = 16, H = 24, ox = 0) {
  const p = new Pic(W, H);
  const bob = pose.bob || 0, lean = pose.lean || 0, ux = ox + lean, uy = bob;
  const o = { ux, uy, ox, pose };
  const A = pts => pts.map(([x, y]) => [x + ux, y + uy]);
  if (hooks.back) hooks.back(p, o);
  // back arm (far side, one tone darker)
  if (pose.barm) arm(p, A(pose.barm), hooks.sleeve || 'linen', 1, hooks.barmOpt || {});
  // back leg (darker), then front leg
  const hy = 16 + bob;
  leg(p, ox + 6, hy, ox + pose.B[0], pose.B[1], pose.bk ?? (pose.B[1] < GROUND ? 1 : 0), 1, hooks.legMat);
  leg(p, ox + 7, hy, ox + pose.F[0], pose.F[1], pose.fk ?? (pose.F[1] < GROUND ? 1 : 0), 0, hooks.legMat);
  hooks.torso(p, o);
  hooks.head(p, o);
  if (hooks.mid) hooks.mid(p, o);
  if (pose.farm) arm(p, A(pose.farm), hooks.sleeve || 'linen', 0, hooks.farmOpt || {});
  if (hooks.front) hooks.front(p, o);
  return p;
}
// tunic: team, belt, skirt. 6 wide at x 5..10, rows 8..15
export const TUNIC = `
LLTTTD
LTTTTD
LTTTDD
LTTTDD
LTTTDD
wWWWWv
LTTTDD
LTTDD.
`;
export const HEAD_BARE = `
hhhhh.
hasse.
haseS.
hsssSS
.sSS..
`;
