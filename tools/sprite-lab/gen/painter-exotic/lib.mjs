// Tiny rig rasteriser: parts drawn as material regions, then directional 3-tone shading + selective outline.
export class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => Array(w).fill(null)); this.T = [[1,0,0],[0,1,0]]; this.stack = []; }
  // transform helpers
  save() { this.stack.push(this.T.map(r => r.slice())); }
  restore() { this.T = this.stack.pop(); }
  translate(x, y) { const T = this.T; T[0][2] += T[0][0] * x + T[0][1] * y; T[1][2] += T[1][0] * x + T[1][1] * y; }
  rotate(a, px = 0, py = 0) { this.translate(px, py); const c = Math.cos(a), s = Math.sin(a), T = this.T;
    const a0 = T[0][0], a1 = T[0][1], b0 = T[1][0], b1 = T[1][1];
    T[0][0] = a0 * c + a1 * s; T[0][1] = -a0 * s + a1 * c; T[1][0] = b0 * c + b1 * s; T[1][1] = -b0 * s + b1 * c; this.translate(-px, -py); }
  tp([x, y]) { const T = this.T; return [T[0][0] * x + T[0][1] * y + T[0][2], T[1][0] * x + T[1][1] * y + T[1][2]]; }
  inv([x, y]) { const T = this.T, det = T[0][0] * T[1][1] - T[0][1] * T[1][0]; const dx = x - T[0][2], dy = y - T[1][2];
    return [(T[1][1] * dx - T[0][1] * dy) / det, (-T[1][0] * dx + T[0][0] * dy) / det]; }
  put(x, y, m) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) { if (m === null) this.c[y][x] = null; else this.c[y][x] = typeof m === 'string' ? parse(m) : m; } }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.c[y][x] : null; }
  // fill every cell whose centre passes test(localPoint)
  fillTest(test, m, bbox) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const p = this.inv([x + 0.5, y + 0.5]); if (test(p[0], p[1])) this.put(x, y, m); }
  }
  ellipse(cx, cy, rx, ry, m) { this.fillTest((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, m); }
  rect(x0, y0, w, h, m) { this.fillTest((x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h, m); }
  poly(pts, m) { this.fillTest((x, y) => inPoly(pts, x, y), m); }
  capsule(a, b, r, m, r2) { r2 = r2 ?? r; this.fillTest((x, y) => { const [t, d] = segDist(a, b, x, y); return d <= r + (r2 - r) * t; }, m); }
  line(pts, r, m) { for (let i = 0; i + 1 < pts.length; i++) this.capsule(pts[i], pts[i + 1], r, m); }
  // pixel-exact line in device space (after transform) using Bresenham
  pline(a, b, m) { let [x0, y0] = this.tp(a).map(Math.floor), [x1, y1] = this.tp(b).map(Math.floor);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { this.put(x0, y0, m); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  px(x, y, m) { const p = this.tp([x + 0.5, y + 0.5]); this.put(p[0], p[1], m); }
  // literal stamp in device space with translation only: map chars → material spec
  stamp(x, y, text, map) { const p = this.tp([x, y]); const rows = text.replace(/^\n+|\n+$/g, '').split('\n');
    rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.' || ch === ' ') continue; const m = map[ch]; if (m) this.put(Math.round(p[0]) + xx, Math.round(p[1]) + yy, m); } }); }
  // stamp that follows the full transform (rotation too): inverse-sample each device cell
  stampT(x, y, text, map) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n');
    for (let yy = 0; yy < this.h; yy++) for (let xx = 0; xx < this.w; xx++) { const p = this.inv([xx + 0.5, yy + 0.5]);
      const sx = Math.floor(p[0] - x), sy = Math.floor(p[1] - y); if (sy < 0 || sy >= rows.length || sx < 0 || sx >= rows[sy].length) continue;
      const ch = rows[sy][sx]; if (ch === '.' || ch === ' ' || !map[ch]) continue; this.put(xx, yy, map[ch]); } }
  // outline ring for whatever is drawn by fn (drawn onto a scratch, dilated, ring painted with `ink` over current)
  withRing(ink, fn, dirs = 'all') {
    const tmp = new Canvas(this.w, this.h); tmp.T = this.T.map(r => r.slice()); fn(tmp);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (tmp.c[y][x]) continue;
      const nb = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => tmp.get(x + dx, y + dy));
      if (nb && this.c[y][x]) this.c[y][x] = parse(ink);
    }
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (tmp.c[y][x]) this.c[y][x] = tmp.c[y][x];
  }
}
function parse(m) { const [mat, tone] = m.split(':'); return { m: mat, t: tone || null }; }
function inPoly(pts, x, y) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
function segDist([ax, ay], [bx, by], x, y) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? ((x - ax) * dx + (y - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return [t, Math.hypot(x - ax - t * dx, y - ay - t * dy)]; }

/**
 * Resolve to chars. mats: { name: { l,m,s (chars), o?: char for selective outline, flat?: tone, band?: 2 shade rows, grp?: shading group } }
 * ink: outline char. Tones: light on top/left edges, shade on bottom/right edges.
 */
export function render(cv, mats, ink, opt = {}) {
  const { w, h } = cv; const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const grp = c => c ? (mats[c.m]?.grp || c.m) : null;
  const same = (x, y, G) => { const c = cv.get(x, y); return c && grp(c) === G; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = cv.c[y][x]; if (!c) continue;
    if (c.m === 'ink') { g[y][x] = ink; continue; }
    const M = mats[c.m]; if (!M) throw new Error('no mat ' + c.m);
    if (M.raw) { g[y][x] = M.raw; continue; }
    let t = c.t || M.flat;
    if (!t) {
      const G = grp(c);
      const down = same(x, y + 1, G), right = same(x + 1, y, G), up = same(x, y - 1, G), left = same(x - 1, y, G);
      const down2 = same(x, y + 2, G);
      if (!down || (M.band && !down2) || (!right && !M.noRightShade)) t = 's';
      else if (!up || (!left && !M.noLeftLight)) t = 'l';
      else t = 'm';
    }
    if (t === 'd') g[y][x] = M.d || ink; else g[y][x] = M[t] || M.m;
  }
  // outer outline
  const out = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y][x] !== '.') continue;
    const below = cv.get(x, y + 1), rightc = cv.get(x + 1, y), above = cv.get(x, y - 1), leftc = cv.get(x - 1, y);
    if (!(below || rightc || above || leftc)) continue;
    if (opt.noOutlineRows && opt.noOutlineRows(y)) continue;
    // selective: on the lit top/left side use the material's own dark tone
    const src = below || rightc;
    let ch = ink;
    if (src && !above && !leftc && src.m !== 'ink') { const M = mats[src.m]; if (M && M.o) ch = M.o; }
    out[y][x] = ch;
  }
  if (opt.post) opt.post(out);
  return out;
}
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
export const deg = d => d * Math.PI / 180;
// two-bone IK: from hip to foot, lengths a,b, bend sign (+1 joint toward +x)
export function ik(hip, foot, a, b, bend) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1]; let d = Math.hypot(dx, dy); const maxd = a + b - 0.01;
  if (d > maxd) { foot = [hip[0] + dx / d * maxd, hip[1] + dy / d * maxd]; d = maxd; }
  const ca = (a * a + d * d - b * b) / (2 * a * d); const ang = Math.acos(Math.max(-1, Math.min(1, ca)));
  const base = Math.atan2(dy, dx); const th = base - bend * ang;  // screen coords: y down
  return [[hip[0] + Math.cos(th) * a, hip[1] + Math.sin(th) * a], foot];
}
export function emit({ id, header, anchor, anchors, fps, palette, frames }) {
  const pal = Object.entries(palette).map(([k, [v, c]]) => `    ${JSON.stringify(k).length === 3 && /^[A-Za-z_$]$/.test(k) ? k : JSON.stringify(k)}: ${JSON.stringify(v)},${c ? '  // ' + c : ''}`).join('\n');
  const fr = Object.entries(frames).map(([n, list]) => `    ${n}: [${list.map(g => '`' + g + '`').join(', ')}],`).join('\n');
  return `${header}
export default {
  id: '${id}', anchor: ${JSON.stringify(anchor)},${anchors ? `\n  anchors: ${JSON.stringify(anchors)},` : ''}${fps ? `\n  fps: ${JSON.stringify(fps)},` : ''}
  palette: {
${pal}
  },
  frames: {
${fr}
  },
};
`;
}
