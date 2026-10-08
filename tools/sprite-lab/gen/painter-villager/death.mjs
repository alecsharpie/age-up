import { grid, set, get, outline } from './rig.mjs';
export function place(src, w, h, ox, oy) { const g = grid(w, h); src.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') set(g, x + ox, y + oy, c); })); return g; }
export function bbox(g) { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; g.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } })); return { x0, y0, x1, y1 }; }
export function crop(g) { const b = bbox(g); return g.slice(b.y0, b.y1 + 1).map(r => r.slice(b.x0, b.x1 + 1)); }
/** rotate counter-clockwise (top → left) */
export function rotCCW(g) { const H = g.length, W = g[0].length; return Array.from({ length: W }, (_, y) => Array.from({ length: H }, (_, x) => g[x][W - 1 - y])); }
export function remap(g, m) { return g.map(r => r.map(c => m[c] || c)); }
/** shear: rows shift left by k*(bottom - y) — a body toppling backwards, feet fixed */
export function shear(g, k, bottom) { const H = g.length, W = g[0].length; const o = grid(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] !== '.') set(o, x - Math.round(k * (bottom - y)), y, g[y][x]); return o; }
/** compress vertically: drop every n-th row above `from` (a falling body foreshortens) */
export function squash(g, keep) { return g.filter((r, y) => keep(y)); }
export function ink(g) { const o = outline(g, () => 'k'); for (let y = 0; y < o.length; y++) for (let x = 0; x < o[0].length; x++) if (o[y][x] === 'k' && 'Hh'.includes(get(g, x, y + 1))) o[y][x] = 'j'; return o; }
