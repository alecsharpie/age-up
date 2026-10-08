// Tiny pose rig for 16x24 human sprites. Layers drawn in order, then a 4-neighbour ink outline, then unoutlined tool layer.
export const W = 16, H = 24;
export function grid(w = W, h = H) { return Array.from({ length: h }, () => Array(w).fill('.')); }
export function set(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
export function get(g, x, y) { return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function line(g, x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (;;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  if (c) for (const [x, y] of pts) set(g, x, y, typeof c === 'function' ? c(x, y) : c);
  return pts;
}
/** Stamp an ascii picture; '.' skipped. (x,y) is where the '+' origin lands if present, else top-left. '+' itself painted as `plus`. */
export function stamp(g, art, x, y, plus = null) {
  const rows = art.replace(/^\n/, '').replace(/\n$/, '').split('\n');
  let ox = 0, oy = 0;
  rows.forEach((r, j) => { const i = r.indexOf('+'); if (i >= 0) { ox = i; oy = j; } });
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '.' || c === ' ') return; if (c === '+') { if (plus) set(g, x + i - ox, y + j - oy, plus); return; } set(g, x + i - ox, y + j - oy, c); }));
}
export function overlay(dst, src) { for (let y = 0; y < src.length; y++) for (let x = 0; x < src[0].length; x++) if (src[y][x] !== '.') set(dst, x, y, src[y][x]); }
/** Outline: every empty cell 4-adjacent to a filled one becomes ink (or a per-material ink). */
export function outline(g, inkFor = () => 'k') {
  const h = g.length, w = g[0].length, out = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y][x] !== '.') continue;
    const n = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => get(g, a, b)).filter(c => c !== '.');
    if (n.length) out[y][x] = inkFor(n, x, y);
  }
  return out;
}
export function toStr(g) { return '\n' + g.map(r => r.join('')).join('\n') + '\n'; }
export function pad(g, l, r, t = 0) { return g.map(row => [...Array(l).fill('.'), ...row, ...Array(r).fill('.')]).map(x => x).slice(0); }
export function parse(s) { return s.replace(/^\n/, '').replace(/\n$/, '').split('\n').map(r => [...r]); }
