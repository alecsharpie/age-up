import { RAMP } from './engine.mjs';
const rad = d => d * Math.PI / 180;
// straight weapon from the hand: angle in degrees (0 = forward/right, -90 = up), cells from `from` to `to` along it
export function shaft(f, hx, hy, ang, from, to, ch, o = {}) {
  const p = f.part({ ramp: o.ramp || RAMP.steel, ink: o.ink || 'n', outline: o.outline !== false });
  const dx = Math.cos(rad(ang)), dy = Math.sin(rad(ang));
  const x0 = hx + dx * from, y0 = hy + dy * from, x1 = hx + dx * to, y1 = hy + dy * to;
  p.line(x0, y0, x1, y1, 1, 1, ch); return { p, end: [Math.round(x1), Math.round(y1)], dx, dy };
}
export function sword(f, hx, hy, ang, len = 7) {
  const g = f.part({ ramp: RAMP.gold, ink: 'k' }); const dx = Math.cos(rad(ang)), dy = Math.sin(rad(ang));
  const b = shaft(f, hx, hy, ang, 2, len, 'm'); b.p.px(b.end[0], b.end[1], 'M');
  const gx = hx + dx * 1, gy = hy + dy * 1; g.px(gx, gy, 'G').px(gx - dy, gy + dx, 'G').px(gx + dy, gy - dx, 'y');
  g.px(hx - dx, hy - dy, 'y');
}
// smear: arc band around (cx,cy) radius r from a0 to a1 degrees
export function smear(f, cx, cy, r, a0, a1, w = 2) {
  const p = f.part({ outline: false });
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) { const vx = x + .5 - cx, vy = y + .5 - cy; const d = Math.hypot(vx, vy); let a = Math.atan2(vy, vx) * 180 / Math.PI;
    if (a < a0 - 1e-6 || a > a1) continue; if (d > r + .5 || d < r - w + .5) continue; if (f.c[y][x]) continue;
    const t = (a - a0) / (a1 - a0); p.px(x, y, d > r - .5 && t > .25 ? 'f' : 'F'); }
}
// arm from shoulder to hand, sleeve + hand
export function arm(f, sx, sy, hx, hy, far, sleeve = 'team', iline) {
  const a = f.part({ ramp: far ? RAMP[sleeve + 'Far'] : RAMP[sleeve], iline }); a.line(sx, sy, hx, hy, 1, 1).line(sx, sy + 1, hx, hy, 1, 1);
  f.part({ ramp: far ? RAMP.skinFar : RAMP.skin }).px(hx, hy, far ? 'S' : 's').px(hx + 1, hy, far ? 'S' : 's');
}
// head at any angle: skin disc + helmet half-disc toward `up`; eye toward forward
export function headAt(f, hx, hy, upAng, helm = RAMP.steel, r = 2.4) {
  const up = [Math.cos(rad(upAng)), Math.sin(rad(upAng))], fw = [Math.cos(rad(upAng + 90)), Math.sin(rad(upAng + 90))];
  f.part({ ramp: RAMP.skin, shade: 'rb' }).disc(hx, hy, r);
  const hp = f.part({ ramp: helm, ink: 'n', shade: 'rb', light: 'lt' });
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) { const vx = x + .5 - hx, vy = y + .5 - hy; if (Math.hypot(vx, vy) > r + .35) continue; if (vx * up[0] + vy * up[1] > -0.2 && vx * fw[0] + vy * fw[1] < 1.2) hp.px(x, y); }
  f.part({ outline: false }).px(hx + fw[0] * 1.2 - up[0] * .6, hy + fw[1] * 1.2 - up[1] * .6, 'k');
}
// limb capsule chain
export function limb(f, pts, ramp, r = 1) { const p = f.part({ ramp }); for (let i = 0; i + 1 < pts.length; i++) p.capsule(pts[i][0] + .5, pts[i][1] + .5, pts[i + 1][0] + .5, pts[i + 1][1] + .5, r); return p; }

import { Frame } from './engine.mjs';
// lying/falling body from joints (y given for a 24-tall grid; yo shifts down for taller grids)
export function lying(W, H, j) {
  const f = new Frame(W, H); const yo = H - 24; const S = p => [p[0], p[1] + yo];
  const L = a => a.map(S);
  if (j.before) j.before(f, yo);
  limb(f, L(j.farLeg), RAMP[j.hoseFar || 'hoseFar']); f.part({ ramp: RAMP.bootFar }).disc(j.farLeg.at(-1)[0] + .5, j.farLeg.at(-1)[1] + yo + .5, 1.2);
  if (j.farArm) limb(f, L(j.farArm), RAMP.teamFar, .8);
  const t = f.part({ ramp: RAMP.team, shade: 'rb', light: 'lt' }); t.capsule(j.neck[0] + .5, j.neck[1] + yo + .5, j.hip[0] + .5, j.hip[1] + yo + .5, j.tr || 2.1);
  limb(f, L(j.nearLeg), RAMP[j.hose || 'hose']); f.part({ ramp: RAMP.boot }).disc(j.nearLeg.at(-1)[0] + .5, j.nearLeg.at(-1)[1] + yo + .5, 1.2);
  if (j.nearArm) limb(f, L(j.nearArm), RAMP.team, .8);
  headAt(f, j.head[0] + .5, j.head[1] + yo + .5, j.up);
  if (j.after) j.after(f, yo);
  return f.render();
}
