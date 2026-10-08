// Composition kit: paint a material map (with optional forced tones), auto-shade (light upper-left), outline, add linework.
export const MATS = {
  skin:    { k: 'asSx', c: ['#f2d2b0', '#e8c39e', '#c9a07a', '#8a5a3a'] },
  hair:    { k: 'hHjj', c: ['#7a5030', '#5a3a1a', '#3b2a1a', '#3b2a1a'] },
  leather: { k: 'wWvV', c: ['#a07a4a', '#8a6a3a', '#5a3a18', '#3b2614'] },
  linen:   { k: 'nNcC', c: ['#efe6d2', '#d9c7a0', '#a8946e', '#7e6c4e'] },
  steel:   { k: 'iImM', c: ['#e6eaee', '#9aa0a6', '#5f656c', '#3e464e'] },
  team:    { k: 'LTDD', c: ['teamlight', 'team', 'teamdark', 'teamdark'] },
  wool:    { k: 'pPqQ', c: ['#8a7a62', '#6a5a48', '#4a4038', '#352d28'] },
  boot:    { k: 'bBzz', c: ['#6e4a28', '#5a3a18', '#3b2614', '#3b2614'] },
  hood:    { k: 'gGfF', c: ['#6a9a44', '#3f6b2e', '#2a4d22', '#1d3618'] },
  felt:    { k: 'rRyY', c: ['#b0703a', '#8a4e2a', '#5e3220', '#40200f'] },
  red:     { k: 'ooOO', c: ['#d0503a', '#b03a2a', '#7a2418', '#7a2418'] },
};
export const INK = { k: '#24180f', K: '#1e2a33', e: '#2a1a10', F: '#1d3618' };
const CHAR = {}; for (const [m, d] of Object.entries(MATS)) [...d.k].forEach((ch, t) => { if (!(ch in CHAR)) CHAR[ch] = [m, t]; });
export function palette() { const p = {}; for (const d of Object.values(MATS)) [...d.k].forEach((ch, t) => p[ch] = d.c[t]); Object.assign(p, INK); return p; }

export class Pic {
  constructor(w, h) { this.w = w; this.h = h; this.c = Array.from({ length: h }, () => Array(w).fill(null)); this.lines = []; }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  put(x, y, m, t = null, sh = 0) { x = Math.round(x); y = Math.round(y); if (this.in(x, y)) this.c[y][x] = { m, t, sh }; }
  get(x, y) { return this.in(x, y) ? this.c[y][x] : null; }
  rect(x, y, w, h, m, t = null, sh = 0) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, m, t, sh); }
  line(x0, y0, x1, y1, m, t = null, w = 1, sh = 0) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { for (let k = 0; k < w; k++) this.put(x0 + k, y0, m, t, sh); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // stamp text: palette chars force material+tone; '.' transparent; '?X' not supported. map: optional extra char -> [m,t|null]
  stamp(x, y, text, map = {}, sh = 0) {
    const rows = text.replace(/^\n+|\n+$/g, '').split('\n');
    rows.forEach((r, j) => [...r].forEach((ch, i) => {
      if (ch === '.' || ch === ' ') return;
      const d = map[ch] || CHAR[ch]; if (d) this.put(x + i, y + j, d[0], d[1] ?? null, sh);
      else if (INK[ch]) this.put(x + i, y + j, '#' + ch, null, 0);
    }));
  }
  // linework drawn after outlining (no outline of its own): chars are palette chars
  ln(x0, y0, x1, y1, ch) { this.lines.push(['l', x0, y0, x1, y1, ch]); }
  px(x, y, ch) { this.lines.push(['p', x, y, ch]); }
  shift(dx, dy) { const n = new Pic(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.c[y][x]) n.put(x + dx, y + dy, this.c[y][x].m, this.c[y][x].t, this.c[y][x].sh); n.lines = this.lines.map(l => l[0] === 'l' ? ['l', l[1] + dx, l[2] + dy, l[3] + dx, l[4] + dy, l[5]] : ['p', l[1] + dx, l[2] + dy, l[3]]); return n; }
  // rotate the material map about (px,py) by deg (positive = counter-clockwise on screen); forced tones dropped
  rotate(deg, px, py) {
    const W = this.w, H = this.h; const n = new Pic(W, H); const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py;
      // inverse rotate: screen CCW by a == (x,y) -> (x cos + y sin, -x sin + y cos) with y down
      const sx = dx * ca - dy * sa + px, sy = dx * sa + dy * ca + py;
      const c = this.get(Math.floor(sx), Math.floor(sy)); if (c) n.c[y][x] = { m: c.m, t: c.m.startsWith('#') ? null : (c.keep ? c.t : null), sh: c.sh, keep: c.keep };
    }
    return n;
  }
  // paste another pic over this one
  over(o, dx = 0, dy = 0) { for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (o.c[y][x]) { const c = o.c[y][x]; this.put(x + dx, y + dy, c.m, c.t, c.sh); } for (const l of o.lines) this.lines.push(l[0] === 'l' ? ['l', l[1] + dx, l[2] + dy, l[3] + dx, l[4] + dy, l[5]] : ['p', l[1] + dx, l[2] + dy, l[3]]); return this; }

  render(opt = {}) {
    const { W = this.w, H = this.h } = {};
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const same = (x, y, m) => { const c = this.get(x, y); return c && c.m === m; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = this.c[y][x]; if (!c) continue;
      if (c.m.startsWith('#')) { g[y][x] = c.m.slice(1); continue; }
      let t = c.t;
      if (t === null || t === undefined) {
        const dr = !same(x + 1, y, c.m) || !same(x, y + 1, c.m), ul = !same(x - 1, y, c.m) || !same(x, y - 1, c.m);
        t = dr ? 2 : ul ? 0 : 1;
        if (MATS[c.m].flat) t = Math.min(t, 1);
      }
      t = Math.min(3, t + (c.sh || 0));
      g[y][x] = MATS[c.m].k[t];
    }
    // outline: empty cells 4-adjacent to a solid
    const solid = (x, y) => this.in(x, y) && !!this.c[y][x];
    const out = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (solid(x, y)) continue;
      const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => solid(a, b));
      if (!nb.length) continue;
      const mats = nb.map(([a, b]) => this.c[b][a].m);
      let ch = mats.includes('steel') ? 'K' : mats.every(m => m === 'hood') ? 'F' : 'k';
      // selective: a top edge (solid below only) over a light material on the upper-left takes the material's shade
      if (opt.selective && nb.length === 1 && nb[0][1] === y + 1 && x < opt.selective && ['hair', 'hood', 'felt', 'linen', 'skin'].includes(mats[0])) ch = MATS[mats[0]].k[2];
      out.push([x, y, ch]);
    }
    for (const [x, y, ch] of out) g[y][x] = ch;
    for (const l of this.lines) {
      const put = (x, y, ch) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch; };
      if (l[0] === 'p') put(l[1], l[2], l[3]);
      else { let [, x0, y0, x1, y1, ch] = l; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { put(x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
    }
    return '\n' + g.map(r => r.join('')).join('\n') + '\n';
  }
}
// copy a rendered grid string into a pic as forced cells (for hand-fixes)
export function emit(id, header, spec) {
  const pal = Object.entries(spec.palette).map(([k, v]) => `${k}:'${v}'`).join(', ');
  const sets = Object.entries(spec.frames).map(([n, l]) => `    ${n}:[${l.map(g => '`' + g + '`').join(', ')}]`).join(',\n');
  const extra = [spec.fps ? `  fps:${JSON.stringify(spec.fps)},\n` : '', spec.anchors ? `  anchors:${JSON.stringify(spec.anchors)},\n` : ''].join('');
  return `// @pixel ${id}\n${header}\nexport default {\n  id:'${id}', anchor:[${spec.anchor}],\n${extra}  palette:{ ${pal} },\n  frames:{\n${sets}\n  }\n};\n`;
}
