// Tiny layered pixel compositor: parts with ramps, auto light/shade, auto outline.
export const PAL = {
  k:'#24180f', n:'#1e2a33',
  a:'#f2d2b0', s:'#e8c39e', S:'#c9a07a', Z:'#8a5a3a',
  r:'#7a5030', R:'#5a3a1a', q:'#3b2a1a',
  m:'#e6eaee', M:'#9aa0a6', N:'#5f656c',
  w:'#a07a4a', W:'#8a6a3a', v:'#5a3a18', V:'#3b2614',
  c:'#efe6d2', C:'#d9c7a0', x:'#a8946e',
  L:'teamlight', T:'team', D:'teamdark',
  g:'#ffe28a', G:'#e1b12c', y:'#a87a12',
  p:'#7d6e5c', P:'#5e5244', o:'#433a30',
  f:'#f6f3ea', F:'#c3c9cf',
};
export const RAMP = {
  skin:['a','s','S'], skinFar:['s','S','Z'], hair:['r','R','q'], steel:['m','M','N'], steelFar:['M','N','n'],
  wood:['w','W','v'], woodFar:['W','v','V'], boot:['W','v','V'], bootFar:['v','V','V'], linen:['c','C','x'],
  team:['L','T','D'], teamFar:['T','D','D'], hose:['p','P','o'], hoseFar:['P','o','o'], gold:['g','G','y'], linenFar:['C','x','x'], teamNear:['T','T','T'], skinBare:['a','s','S'],
};
export class Frame {
  constructor(W, H) { this.W = W; this.H = H; this.c = Array.from({ length: H }, () => Array(W).fill(null)); this.parts = []; this.post = []; }
  part(o = {}) { const p = Object.assign({ outline: true, ink: 'k', light: 'left', shade: 'right', z: this.parts.length }, o); p.id = this.parts.length; this.parts.push(p); const f = this;
    const put = (x, y, ch = null) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= f.W || y >= f.H) return; f.c[y][x] = { p, ch }; };
    const api = {
      px(x, y, ch) { put(x, y, ch ?? null); return api; },
      rect(x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, ch); return api; },
      rows(x, y, spans, ch) { spans.forEach((s, j) => { for (let i = s[0]; i <= s[1]; i++) put(x + i, y + j, ch); }); return api; },
      line(x0, y0, x1, y1, w = 1, h = 1, ch) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x0 + i, y0 + j, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
        return api; },
      capsule(x0, y0, x1, y1, r, ch) { for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) { const px = x + .5, py = y + .5; const vx = x1 - x0, vy = y1 - y0; const L2 = vx * vx + vy * vy || 1; let t = ((px - x0) * vx + (py - y0) * vy) / L2; t = Math.max(0, Math.min(1, t)); const qx = x0 + t * vx - px, qy = y0 + t * vy - py; if (qx * qx + qy * qy <= r * r) put(x, y, ch); } return api; },
      disc(cx, cy, r, ch) { return api.capsule(cx, cy, cx, cy, r, ch); },
      // stamp: '.'/' ' skip, '0' auto tone, '1','2','3' ramp light/mid/shade, other chars fixed palette chars
      stamp(x, y, text) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.' || ch === ' ') continue; if (ch === '0') put(x + i, y + j, null); else if ('123'.includes(ch)) put(x + i, y + j, p.ramp[+ch - 1]); else put(x + i, y + j, ch); } }); return api; },
      erase(x, y) { if (f.c[y] && f.c[y][x] && f.c[y][x].p === p) f.c[y][x] = null; return api; },
    };
    return api; }
  clear(x, y) { if (this.c[y]) this.c[y][x] = null; }
  set(x, y, ch) { this.post.push([x, y, ch]); }
  render() {
    const { W, H } = this; const c = this.c; const out = Array.from({ length: H }, () => Array(W).fill('.'));
    const same = (x, y, p) => x >= 0 && y >= 0 && x < W && y < H && c[y][x] && c[y][x].p === p;
    const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !!c[y][x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const cell = c[y][x]; if (!cell) continue; const p = cell.p;
      if (cell.ch) { out[y][x] = cell.ch; continue; }
      const R = p.ramp || ['T', 'T', 'T']; let t = 1;
      const l = same(x - 1, y, p), r = same(x + 1, y, p), u = same(x, y - 1, p), d = same(x, y + 1, p);
      if (p.light === 'left' && !l && r) t = 0; if (p.light === 'lt' && ((!l && r) || (!u && d && !(!r)))) t = 0; if (p.light === 'top' && !u) t = 0;
      if (p.shade === 'right' && !r) t = 2; if (p.shade === 'rb' && (!r || !d)) t = 2; if (p.shade === 'bottom' && !d) t = 2;
      if (p.shadeCols) { let k = 0; for (let i = 1; i <= p.shadeCols; i++) if (!same(x + i, y, p)) { t = 2; break; } }
      if (p.lightRow && !u) t = Math.min(t, 0) === 0 && !r ? t : 0;
      out[y][x] = R[t]; }
    // interior lines: cells of earlier parts touching a part with iline get darkened
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const cell = c[y][x]; if (!cell || !cell.p.iline) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = solid(x + dx, y + dy) && c[y + dy][x + dx]; if (n && n.p !== cell.p && n.p.z < cell.p.z && !n.p.noiline) out[y + dy][x + dx] = cell.p.iline === true ? (n.p.ramp ? n.p.ramp[2] : 'k') : cell.p.iline; } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (c[y][x]) continue; let ink = null, selOnly = true, sel = null;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!solid(x + dx, y + dy)) continue; const p = c[y + dy][x + dx].p; if (p.outline === false) continue;
        if (!ink || p.ink === 'n') ink = p.ink; if (p.sel && (dx === 1 || dy === 1)) sel = sel || p.sel; else selOnly = false; }
      if (ink) out[y][x] = (sel && selOnly) ? sel : ink; }
    for (const [x, y, ch] of this.post) if (y >= 0 && y < H && x >= 0 && x < W) out[y][x] = ch;
    return '\n' + out.map(r => r.join('')).join('\n') + '\n';
  }
}
export function emit(spec) { // spec: {id, header, anchor, anchors, fps, frames:{set:[text]}}
  const used = new Set(Object.values(spec.frames).flat().join(''));
  const pal = Object.entries(PAL).filter(([k]) => used.has(k)).map(([k, v]) => `${k}:'${v}'`).join(', ');
  let s = spec.header + `export default {\n  id:'${spec.id}', anchor:${JSON.stringify(spec.anchor)},\n`;
  if (spec.anchors) s += `  anchors:${JSON.stringify(spec.anchors).replace(/"/g, '')},\n`;
  if (spec.fps) s += `  fps:${JSON.stringify(spec.fps).replace(/"/g, '')},\n`;
  s += `  palette:{ ${pal} },\n  frames:{\n`;
  for (const [set, list] of Object.entries(spec.frames)) s += `    ${set}:[${list.map(t => '`' + t + '`').join(', ')}],\n`;
  return s + '  }\n};\n';
}
