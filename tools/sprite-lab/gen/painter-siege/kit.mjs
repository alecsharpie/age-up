// painter-siege kit: tiny raster kit for composing siege frames, then emitting literal drafts.
import fs from 'fs';
export const PAL = {
  o: '#24180f',                                              // ink
  W: '#a07a4a', w: '#8a6a3a', d: '#5a3a18', q: '#3b2614',    // wood ramp + deep
  s: '#e6eaee', m: '#9aa0a6', n: '#5f656c', z: '#1e2a33',    // steel ramp + deep
  e: '#efe6d2', R: '#d9c7a0', r: '#a8946e',                  // rope / linen tan (e also dust)
  a: '#cfc8b8', b: '#8d8478', c: '#5e5850',                  // stone
  F: '#fff1a8', f: '#ffb347', y: '#e0602a',                  // fire / flash
  k: '#e4e2dc', K: '#b4b2ac', j: '#7e7c78',                  // smoke
  T: 'team', D: 'teamdark', L: 'teamlight',
};
export const WOOD = ['W', 'w', 'd'], STEEL = ['s', 'm', 'n'], TEAM = ['L', 'T', 'D'], ROPE = ['R', 'R', 'r'];
const DARK = new Set(['o', 'q', 'z', 'd']);
export class G {
  constructor(w, h) { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => Array(w).fill('.')); this.hole = Array.from({ length: h }, () => Array(w).fill(false)); }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, ch) { x = Math.round(x); y = Math.round(y); if (this.in(x, y) && ch && ch !== '.') this.c[y][x] = ch; }
  clr(x, y) { x = Math.round(x); y = Math.round(y); if (this.in(x, y)) this.c[y][x] = '.'; }
  get(x, y) { return this.in(x, y) ? this.c[y][x] : '.'; }
  rect(x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, ch); }
  line(x0, y0, x1, y1, ch) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (; ;) { this.set(x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  stamp(x, y, text) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.' && r[i] !== ' ') this.set(x + i, y + j, r[i]); }); }
  poly(pts, ch) {
    const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) {
      const cy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, ch);
    }
  }
  /** Thick shaded beam between pixel centres, ramp [light, mid, shade]; light side faces up-left. */
  beam(x0, y0, x1, y1, t, ramp = WOOD, cap = 0) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    let nx = -uy, ny = ux; if (nx + ny > 0 || (nx + ny === 0 && ny > 0)) { nx = -nx; ny = -ny; }
    const r = t / 2, pad = Math.ceil(r) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - pad); y <= Math.max(y0, y1) + pad; y++) for (let x = Math.floor(Math.min(x0, x1) - pad); x <= Math.max(x0, x1) + pad; x++) {
      const px = x - x0, py = y - y0, along = px * ux + py * uy, s = px * nx + py * ny;
      if (along < -cap - 0.5 || along > L + cap + 0.5) continue;
      if (Math.abs(s) > r) continue;
      const ch = ramp.length !== 3 ? ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor((r - s) / (2 * r) * ramp.length)))] : t < 2.5 ? (s > 0.01 ? ramp[0] : s < -0.01 ? ramp[2] : ramp[1]) : (s > r - 1 ? ramp[0] : s < -(r - 1) ? ramp[2] : ramp[1]);
      this.set(x, y, ch);
    }
  }
  /** Spoked wheel, odd diameter D, top-left (x0,y0); spoke angle th (radians, clockwise on screen). Ring is ink, tread wood, hub steel. */
  wheel(x0, y0, D, th, o = {}) {
    const R = D / 2, cx = x0 + (D - 1) / 2, cy = y0 + (D - 1) / 2;
    for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
      const px = x0 + x, py = y0 + y, dx = px - cx, dy = py - cy, dd = Math.hypot(dx, dy);
      if (dd > R - 0.05) continue;
      if (dd > R - 1.05) { this.set(px, py, (dx + dy < -R * 0.9 && !o.dark) ? 'd' : 'o'); continue; }
      if (dd > R - 2.05) { const k = dx + dy; this.set(px, py, o.iron ? (k < -R * 0.6 ? 's' : k > R * 0.5 ? 'n' : 'm') : (k < -R * 0.5 ? 'W' : k > R * 0.6 ? 'd' : 'w')); continue; }
      if (this.in(px, py)) this.hole[py][px] = true;
    }
    const ri = R - 2;
    for (let k = 0; k < 2; k++) { const a = th + k * Math.PI / 2; for (let t = -ri + 0.3; t <= ri - 0.3; t += 0.25) this.set(cx + Math.cos(a) * t, cy + Math.sin(a) * t, o.spoke || 'd'); }
    { const rr = R - 1.55; this.set(cx + Math.cos(th + 0.4) * rr, cy + Math.sin(th + 0.4) * rr, o.iron ? 'z' : 'n'); }   // a rim bolt, so the turn reads
    this.set(cx, cy, 'n'); if (D >= 11) { this.set(cx - 1, cy, 'n'); this.set(cx, cy - 1, 'm'); }
    return [cx, cy];
  }
  /** Global outline: transparent 4-neighbours of bright solid cells become ink (or wood shade on the lit upper-left). */
  outline(skip = new Set(), ink = false) {
    const out = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.c[y][x] !== '.' || this.hole[y][x]) continue;
      const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].map(([a, b]) => this.get(a, b));
      const src = nb.filter(ch => ch !== '.' && !DARK.has(ch) && !skip.has(ch) && !'FfykKjeaR'.includes(ch));
      if (!src.length) continue;
      const [l, r, u, dn] = nb; const upperLeft = (r !== '.' || dn !== '.') && l === '.' && u === '.';
      const woody = src.every(ch => 'Ww'.includes(ch));
      out.push([x, y, upperLeft && woody && !ink ? 'd' : 'o']);
    }
    for (const [x, y, ch] of out) this.c[y][x] = ch;
    return this;
  }
  /** Draw fn into its own layer, outline it in ink (so it separates from what is behind), paste it over this grid. */
  layer(fn, ink = true, ch = null) { const l = new G(this.w, this.h); fn(l); l.outline(new Set(), ink); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = l.c[y][x]; if (v === '.') continue; if (v === 'o' && ch) { if (this.c[y][x] !== '.') this.c[y][x] = ch; else this.c[y][x] = 'o'; } else this.c[y][x] = v; } return this; }
  shift(dx, dy) { const n = new G(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.c[y][x] !== '.') n.set(x + dx, y + dy, this.c[y][x]); return n; }
  text() { return '\n' + this.c.map(r => r.join('')).join('\n') + '\n'; }
  count(chs) { let n = 0; for (const r of this.c) for (const ch of r) if (chs.includes(ch)) n++; return n; }
}
export const deg = a => a * Math.PI / 180;
export function emit(file, head, spec) {
  const usedKeys = new Set(); for (const L of Object.values(spec.frames)) for (const g of L) for (const ch of g) usedKeys.add(ch);
  const pal = Object.fromEntries(Object.entries(PAL).filter(([k]) => usedKeys.has(k)));
  const q = v => JSON.stringify(v);
  let s = head.trim() + '\nexport default {\n';
  s += `  id: '${spec.id}', anchor: ${q(spec.anchor)},\n`;
  if (spec.anchors) s += `  anchors: ${JSON.stringify(spec.anchors).replace(/"(\w+)":/g, '$1: ')},\n`;
  if (spec.fps) s += `  fps: ${JSON.stringify(spec.fps).replace(/"(\w+)":/g, '$1: ')},\n`;
  s += '  palette: {\n'; for (const [k, v] of Object.entries(pal)) s += `    ${k}: '${v}',\n`; s += '  },\n  frames: {\n';
  for (const [set, L] of Object.entries(spec.frames)) { s += `    ${set}: [`; s += L.map(g => '`' + g + '`').join(', '); s += '],\n'; }
  s += '  },\n};\n';
  fs.writeFileSync(file, s);
}
