import { Pic, palette, emit } from './kit.mjs';
import { body, GROUND } from './body.mjs';
// 8-frame walk: contact, down, passing, up ×2.  F/B = ankle (left px of the 2-px leg), y<21 = lifted.
export const WALK = [
  { bob: 0, F: [10, 21], B: [3, 21] },
  { bob: 1, F: [9, 21], B: [3, 20] },
  { bob: 0, F: [7, 21], B: [6, 19] },
  { bob: -1, F: [6, 21], B: [9, 20] },
  { bob: 0, F: [3, 21], B: [10, 21] },
  { bob: 1, F: [3, 20], B: [9, 21] },
  { bob: 0, F: [6, 19], B: [7, 21] },
  { bob: -1, F: [9, 20], B: [6, 21] },
];
// arm swing phase per walk frame: -1 back .. +1 forward for the front arm (back arm opposite)
export const SWING = [1, 0.5, 0, -0.5, -1, -0.5, 0, 0.5];
export const STAND = { bob: 0, F: [8, 21], B: [5, 21] };
export function usedPalette(frames) {
  const all = palette(), used = new Set();
  for (const l of Object.values(frames)) for (const g of l) for (const ch of g) used.add(ch);
  return Object.fromEntries(Object.entries(all).filter(([k]) => used.has(k)));
}
export function write(path, id, header, spec) {
  spec.palette = usedPalette(spec.frames);
  const fs = require_fs(); fs.writeFileSync(path, emit(id, header, spec));
}
import * as FS from 'fs';
function require_fs() { return FS; }
// bow as linework. g = grip point (stave belly), hh = half height, bend = how far the tips sit behind the belly,
// pull = [x,y] string point or null (straight string at the tips' x), twang = string bowed forward by 1.
export function bow(p, g, hh, bend, pull, opt = {}) {
  const [gx, gy] = g, pts = [];
  for (let i = -hh; i <= hh; i++) { const f = Math.abs(i) / hh; pts.push([gx - Math.round(bend * f * f * (opt.recurve ? 1.15 : 1)), gy + i]); }
  if (opt.tilt) for (const q of pts) q[0] += Math.round(opt.tilt * (gy - q[1]) / hh);
  const top = pts[0], bot = pts[pts.length - 1];
  if (pull) { p.ln(top[0], top[1] + 1, pull[0], pull[1], 'N'); p.ln(pull[0], pull[1], bot[0], bot[1] - 1, 'N'); }
  else if (opt.twang) { const mx = top[0] + 1; p.ln(top[0], top[1] + 1, mx, gy, 'N'); p.ln(mx, gy, bot[0], bot[1] - 1, 'N'); }
  else p.ln(top[0], top[1] + 1, bot[0], bot[1] - 1, opt.str || 'c');
  pts.forEach(([x, y], k) => p.px(x, y, k === 0 || k === pts.length - 1 ? 'V' : Math.abs(y - gy) <= 1 ? 'W' : 'v'));
  return { top, bot };
}
// a bow lying on the ground: stave arched up, string flat on the ground row. x0..x1 span, y = ground row
export function bowFlat(p, x0, x1, y, h = 2) {
  p.ln(x0 + 1, y, x1 - 1, y, 'c');
  const n = x1 - x0; for (let i = 0; i <= n; i++) { const f = Math.abs(i - n / 2) / (n / 2); const yy = y - Math.round(h * (1 - f * f)); p.px(x0 + i, yy, i === 0 || i === n ? 'V' : Math.abs(i - n / 2) < 1 ? 'W' : 'v'); if (yy < y - 1 && i > 0 && i < n) {} }
}
export function arrow(p, x0, y0, x1, y1) { // tail (x0,y0) to point (x1,y1)
  p.ln(x0, y0, x1, y1, 'W'); p.px(x0, y0, 'o'); if (x1 !== x0) p.px(x0 + Math.sign(x1 - x0), y0 + (y1 !== y0 ? Math.sign(y1 - y0) * 0 : 0), 'o'); p.px(x1, y1, 'i');
}
export { Pic, body, GROUND };
// ---- death: build bodies in a wider canvas, rotate the material map about a ground pivot, settle onto the ground ----
export const DW = 30, DOX = 12;           // death canvas width, x offset of the standing body inside it (anchor = 8 + DOX)
function settle(p) { // move the pic down so its lowest solid row is GROUND+1 (outline then lands on the bottom row)
  let low = -1; for (let y = 0; y < p.h; y++) if (p.c[y].some(Boolean)) low = y;
  return low < 0 ? p : p.shift(0, (GROUND + 1) - low);
}
/** mk(pose, ox) -> Pic in a DW×24 canvas. poses: recoil, buckle, lie. drop(p, k) draws the dropped weapon for death frame k. */
export function death(mk, P, drop) {
  const piv = [DOX + 5, 23];
  const f = [];
  f.push(mk(P.recoil, DOX).rotate(10, DOX + 8, 23));
  f.push(settle(mk(P.buckle, DOX).rotate(22, DOX + 7, 23)));
  f.push(settle(mk(P.buckle, DOX).rotate(55, DOX + 8, 23)));
  const lie = settle(mk(P.lie, DOX).rotate(90, DOX + 10, 23)).shift(P.lieDx ?? 3, 0);
  f.push(lie.shift(0, 0));
  f.push(lie.shift(0, -1));
  f.push(lie.shift(0, 0));
  return f.map(q => { const p = new Pic(DW, 24); for (let y = 0; y < 24; y++) p.c[y] = q.c[y].slice(); p.lines = q.lines; return p; }).map((p, k) => { if (drop) drop(p, k); return p.render(); });
}
