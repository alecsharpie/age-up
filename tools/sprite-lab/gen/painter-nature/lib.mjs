// tiny raster kit for composing animal frames
export const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
export const get = (g, x, y) => (y < 0 || y >= g.length || x < 0 || x >= g[0].length) ? '.' : g[y][x];
export const set = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
const LN = (() => { const v = [-0.55, -0.7, 0.45]; const n = Math.hypot(...v); return v.map(a => a / n); })();
/** shaded ellipse (optionally rotated by th radians). tones=[light,mid,shade,deep]; thr = dot thresholds */
export function ell(g, cx, cy, rx, ry, tones, o = {}) {
  const th = o.th || 0, c = Math.cos(th), s = Math.sin(th), thr = o.thr || [0.72, 0.32, -0.05];
  const R = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy;
    const u = (px * c + py * s) / rx, v = (-px * s + py * c) / ry;
    const r2 = u * u + v * v; if (r2 > 1) continue;
    if (o.only && !o.only(x, y)) continue;
    const nz = Math.sqrt(1 - r2); let nx = u * c - v * s, ny = u * s + v * c;
    const d = nx * LN[0] + ny * LN[1] + nz * LN[2];
    const t = d > thr[0] ? 0 : d > thr[1] ? 1 : d > thr[2] ? 2 : 3;
    set(g, x, y, tones[Math.min(t, tones.length - 1)]);
  }
}
/** polyline of 1px */
export function line(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { set(g, x0, y0, typeof ch === 'function' ? ch(x0, y0) : ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
export function poly(g, pts, ch) { for (let i = 0; i < pts.length - 1; i++) line(g, ...pts[i], ...pts[i + 1], ch); }
export function stamp(g, x, y, text) {
  const rows = text.replace(/^\n+|\n+$/g, '').split('\n');
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') set(g, x + xx, y + yy, r[xx]); });
}
/** outline every empty cell 4-adjacent to a filled one. lit(x,y,nbChar) may return a lighter char for top-left edges */
export function outline(g, ink, lit, skip = new Set()) {
  const H = g.length, W = g[0].length, add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '.') continue;
    const nb = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => get(g, x + dx, y + dy)).map(c => skip.has(c) ? '.' : c);
    if (nb.every(c => c === '.')) continue;
    let ch = ink;
    if (lit) { const l = lit(x, y, nb); if (l) ch = l; }
    add.push([x, y, ch]);
  }
  for (const [x, y, c] of add) g[y][x] = c;
}
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
export const clone = g => g.map(r => r.slice());
export function shift(g, dx, dy) { const H = g.length, W = g[0].length, n = grid(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] !== '.') set(n, x + dx, y + dy, g[y][x]); return n; }
export function emit(id, header, spec) {
  const fr = Object.entries(spec.frames).map(([k, L]) => `    ${k}: [${L.map(t => '`' + t + '`').join(', ')}],`).join('\n');
  const pal = Object.entries(spec.palette).map(([k, v]) => `    ${JSON.stringify(k).length === 3 && /^[A-Za-z]$/.test(k) ? k : JSON.stringify(k)}: '${v[0]}',${v[1] ? '  // ' + v[1] : ''}`).join('\n');
  const extra = Object.entries(spec).filter(([k]) => !['id', 'anchor', 'palette', 'frames'].includes(k)).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},\n`).join('');
  return `// @pixel ${id}\n${header.map(l => '// ' + l).join('\n')}\nexport default {\n  id: '${id}', anchor: ${JSON.stringify(spec.anchor)},\n${extra}  palette: {\n${pal}\n  },\n  frames: {\n${fr}\n  },\n};\n`;
}
