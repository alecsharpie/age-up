import fs from 'fs';
export const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
export const clone = g => g.map(r => r.slice());
export const W = g => g[0].length, H = g => g.length;
export function put(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length && c !== '.' && c !== ' ') g[y][x] = c; }
export function get(g, x, y) { return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function stamp(g, x, y, s) { const rows = s.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) put(g, x + xx, y + yy, r[xx]); }); }
export function line(g, x0, y0, x1, y1, c) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (;;) { put(g, x0, y0, typeof c === 'function' ? c(x0, y0) : c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
export function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c); }
/** 1-px outline around the silhouette in the transparent cells. Cells on the upper-left side get the selective ink. */
export function outline(g, ink = 'o', sel = 'O', skip = '') {
  const out = clone(g), s = (x, y) => { const c = get(g, x, y); return c !== '.' && !skip.includes(c); };
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    if (g[y][x] !== '.') continue;
    const R = s(x + 1, y), B = s(x, y + 1), L = s(x - 1, y), T = s(x, y - 1);
    if (!(R || B || L || T)) continue;
    out[y][x] = ((R || B) && !L && !T) ? sel : ink;
  }
  return out;
}
/** Nearest-neighbour rotation of g about (cx,cy) by deg (screen coords, positive = clockwise), into a w×h grid with (cx,cy) mapped to (ox,oy). */
export function rotate(g, cx, cy, deg, w, h, ox, oy) {
  const out = grid(w, h), a = -deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + 0.5 - ox, dy = y + 0.5 - oy;
    const sx = c * dx - s * dy + cx, sy = s * dx + c * dy + cy;
    out[y][x] = get(g, Math.floor(sx), Math.floor(sy));
  }
  return out;
}
export function shift(g, dx, dy) { const o = grid(W(g), H(g)); for (let y = 0; y < H(g); y++) for (let x = 0; x < W(g); x++) if (g[y][x] !== '.') put(o, x + dx, y + dy, g[y][x]); return o; }
export function over(dst, src, dx = 0, dy = 0) { for (let y = 0; y < H(src); y++) for (let x = 0; x < W(src); x++) if (src[y][x] !== '.') put(dst, x + dx, y + dy, src[y][x]); return dst; }
export function replace(g, map) { return g.map(r => r.map(c => map[c] !== undefined ? map[c] : c)); }
export const text = g => g.map(r => r.join('')).join('\n');
/** Write a literal draft file: header comment lines, spec with literal template grids. */
export function emit(file, header, spec) {
  const pal = Object.entries(spec.palette).map(([k, v]) => `${JSON.stringify(k).length === 3 && /^[A-Za-z]$/.test(k) ? k : JSON.stringify(k)}:'${v}'`).join(', ');
  const extra = [];
  if (spec.anchors) extra.push(`  anchors:{ ${Object.entries(spec.anchors).map(([k, v]) => `${k}:[${v[0]},${v[1]}]`).join(', ')} },`);
  if (spec.fps) extra.push(`  fps:{ ${Object.entries(spec.fps).map(([k, v]) => `${k}:${v}`).join(', ')} },`);
  const frames = Object.entries(spec.frames).map(([k, list]) => `    ${k}:[${list.map(t => '`\n' + (typeof t === 'string' ? t : text(t)) + '\n`').join(', ')}]`).join(',\n');
  const src = header.map(l => '// ' + l).join('\n') + `\nexport default {\n  id:'${spec.id}', anchor:[${spec.anchor[0]},${spec.anchor[1]}],\n${extra.join('\n')}${extra.length ? '\n' : ''}  palette:{ ${pal} },\n  frames:{\n${frames}\n  }\n};\n`;
  fs.writeFileSync(file, src);
}
