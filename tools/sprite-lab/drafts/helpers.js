// Shared helpers that drafts may call. `lab.mjs apply helpers` installs them into index.html (after `battlements`).
// Pixel sprites: PIXELS.<id> specs are painted grids. pixBlit draws one frame, recoloured for the team, snapped to whole
// pixels; pixDraw is pixBlit onto the game's ctx. Spec fields: id, anchor [cells], palette, frames, scale (cells → px, default 1).

export function pixBuild(spec, grid, tc) {
  const sc = spec.scale || 1;
  const lines = grid.replace(/\r/g, '').split('\n').filter((l, i, a) => !(i === 0 && !l.trim()) && !(i === a.length - 1 && !l.trim()));
  const w = Math.max(1, ...lines.map(l => l.length)), h = lines.length;
  const c = document.createElement('canvas'); c.width = w * sc; c.height = h * sc; const x = c.getContext('2d');
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < lines[yy].length; xx++) {
    const ch = lines[yy][xx]; if (ch === '.' || ch === ' ') continue;
    let col = spec.palette[ch]; if (!col) continue;
    if (col === 'team') col = tc ? tc.c : '#888'; else if (col === 'teamdark') col = tc ? tc.d : '#555'; else if (col === 'teamlight') col = tc ? tc.l : '#bbb';
    x.fillStyle = col; x.fillRect(xx * sc, yy * sc, sc, sc);
  }
  return c;
}

/** Cached canvas for frame i of animation `frame` (wraps), coloured for team tc. */
export function pixFrame(spec, frame, i, tc) {
  const list = spec.frames[frame] || spec.frames.idle || Object.values(spec.frames)[0];
  const n = list.length, k = ((Math.floor(i) % n) + n) % n;
  const key = spec.id + '|' + frame + '|' + k + '|' + (tc ? tc.c : '');
  let c = PIX_CACHE[key]; if (!c) { c = pixBuild(spec, list[k], tc); PIX_CACHE[key] = c; }
  return c;
}

/** Blit onto any 2D context with the sprite's anchor at (x,y) of the current transform. o.clip (0..1) reveals the bottom part only — construction. */
export function pixBlit(c2d, spec, frame, i, tc, x = 0, y = 0, o) {
  const c = pixFrame(spec, frame, i, tc); const sc = spec.scale || 1;
  const m = c2d.getTransform();
  c2d.save(); c2d.setTransform(m.a, m.b, m.c, m.d, Math.round(m.e), Math.round(m.f)); c2d.imageSmoothingEnabled = false;
  if (o && o.alpha !== undefined) c2d.globalAlpha *= o.alpha;
  const dx = Math.round(x - spec.anchor[0] * sc), dy = Math.round(y - spec.anchor[1] * sc);
  const clip = o && o.clip !== undefined ? Math.max(0, Math.min(1, o.clip)) : 1;
  if (clip < 1) { const sh = Math.round(c.height * clip); if (sh > 0) c2d.drawImage(c, 0, c.height - sh, c.width, sh, dx, dy + c.height - sh, c.width, sh); }
  else c2d.drawImage(c, dx, dy);
  c2d.restore();
}

export function pixDraw(spec, frame, i, tc, x = 0, y = 0, o) { pixBlit(ctx, spec, frame, i, tc, x, y, o); }

// ---- grid painting kit for *generated* pixel drafts (code before `export default` builds the grids) ----
// Grids are arrays of rows of single characters. Coordinates are cells. All take/return plain data; nothing touches the DOM.
export function pixGrid(w, h, ch = '.') { return Array.from({ length: h }, () => Array(w).fill(ch)); }
export function pixSet(g, x, y, ch) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; }
export function pixGet(g, x, y) { x = Math.round(x); y = Math.round(y); return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function pixRect(g, x, y, w, h, ch) { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) pixSet(g, x + xx, y + yy, ch); }
export function pixLine(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { pixSet(g, x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
/** Scan-line polygon fill. pts = [[x,y],...] in cells (fractions allowed). Fills cells whose centre is inside. */
export function pixPoly(g, pts, ch) {
  const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(g.length - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(g[0].length - 1, Math.floor(xs[k + 1] - 0.5)); x++) g[y][x] = ch;
  }
}
/** Paste a small hand-painted grid (multi-line string) with its top-left at (x,y); '.' is transparent. */
export function pixStamp(g, x, y, text) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') pixSet(g, x + xx, y + yy, r[xx]); }); }
/** Mirror a grid left-right (character meanings are kept). */
export function pixFlip(g) { return g.map(r => r.slice().reverse()); }
export function pixText(g) { return '\n' + g.map(r => r.join('')).join('\n') + '\n'; }
/**
 * Isometric box in cells, matching the game's projection (tile 64×32 px at scale 1). (bx,by) = the footprint's BOTTOM corner,
 * w,h = footprint in tiles, z = wall height in px, sc = sprite scale (px per cell). ch = {top,left,right}. Returns the top-face
 * corners {T,Rr,Bm,L} (in cells, at height z) so roofs and props can be placed on it.
 */
export function pixIsoBox(g, bx, by, w, h, z, sc, ch) {
  const HW = 32 / sc, HH = 16 / sc, zz = z / sc;
  const Bm = [bx, by], L = [bx - w * HW, by - w * HH], Rr = [bx + h * HW, by - h * HH], T = [bx - (w - h) * HW, by - (w + h) * HH];
  const up = p => [p[0], p[1] - zz];
  if (ch.left) pixPoly(g, [L, Bm, up(Bm), up(L)], ch.left);
  if (ch.right) pixPoly(g, [Bm, Rr, up(Rr), up(Bm)], ch.right);
  if (ch.top) pixPoly(g, [up(T), up(Rr), up(Bm), up(L)], ch.top);
  return { T: up(T), Rr: up(Rr), Bm: up(Bm), L: up(L), base: { T, Rr, Bm, L } };
}
/** Hipped/pyramid roof on a top face (as returned by pixIsoBox): apex rise `rise` px. ch = {left,right,front,back} — two or four tones. */
export function pixIsoRoof(g, top, rise, sc, ch) {
  const ap = [(top.L[0] + top.Rr[0]) / 2, (top.T[1] + top.Bm[1]) / 2 - rise / sc];
  if (ch.back) pixPoly(g, [top.T, top.Rr, ap], ch.back);
  if (ch.left) pixPoly(g, [top.T, top.L, ap], ch.left);
  if (ch.front) pixPoly(g, [top.L, top.Bm, ap], ch.front);
  if (ch.right) pixPoly(g, [top.Bm, top.Rr, ap], ch.right);
  return ap;
}
