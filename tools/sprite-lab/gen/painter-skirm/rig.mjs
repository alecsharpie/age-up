// Shared human rig: legs, death frames from a standing body.
import { grid, put, get, line, rect, stamp, outline, rotate, over, clone, W, H } from './lib.mjs';
export function putBehind(g, x, y, c) { if (get(g, Math.round(x), Math.round(y)) === '.') put(g, x, y, c); }
export function lineBehind(g, x0, y0, x1, y1, c) { const t = grid(W(g), H(g)); line(t, x0, y0, x1, y1, c); for (let y = 0; y < H(g); y++) for (let x = 0; x < W(g); x++) if (t[y][x] !== '.') putBehind(g, x, y, t[y][x]); }
/** Leg from hip (hx,hy) to foot x fx, foot lifted `lift` px; cols [lit, mid], boot [top, sole]. Knee bends forward when lifted. */
export function leg(g, hx, hy, fx, lift, cols, boot, groundY = 21, kneeFwd = 0) {
  const ay = groundY - lift, ky = Math.round((hy + ay) / 2);
  const kx = Math.round((hx + fx) / 2) + (lift ? 1 : 0) + kneeFwd;
  const seg = (x0, y0, x1, y1) => { line(g, x0, y0, x1, y1, cols[0]); line(g, x0 + 1, y0, x1 + 1, y1, cols[1]); };
  seg(hx, hy, kx, ky); seg(kx, ky, fx, ay);
  // boot: 2 rows, toe forward (right)
  put(g, fx, ay + 1, boot[0]); put(g, fx + 1, ay + 1, boot[0]);
  put(g, fx, ay + 2, boot[1]); put(g, fx + 1, ay + 2, boot[1]); put(g, fx + 2, ay + 2, boot[1]);
}
/** Remove isolated single pixels (no 8-neighbours). */
export function despeckle(g) { const o = clone(g); for (let y = 0; y < H(g); y++) for (let x = 0; x < W(g); x++) { if (g[y][x] === '.') continue; let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && get(g, x + i, y + j) !== '.') n++; if (!n) o[y][x] = '.'; } return o; }
/** bounding box of solid cells */
export function bbox(g) { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < H(g); y++) for (let x = 0; x < W(g); x++) if (g[y][x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return { x0, y0, x1, y1 }; }
/** Place body g (feet at fx,fy) rotated by deg (negative = falling backward/left) into a DW×DH grid, feet at (ax, ...), bottom row resting on ground. */
export function fallen(body, fx, fy, deg, DW, DH, ax, lift = 0, dx = 0) {
  const r = rotate(body, fx, fy, deg, DW, DH + 16, ax + dx, DH);
  // rest the lowest pixel on the ground row (DH-1), then lift
  const b = bbox(r); const sh = (DH - 1) - b.y1 - lift;
  const o = grid(DW, DH); over(o, r, 0, sh); return o;
}
