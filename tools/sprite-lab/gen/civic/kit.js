// ---- local texture kit (deterministic) ----
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const copy = g => g.map(r => r.slice());
/** Replace every cell holding one of `chs` by fn(x,y,ch) (null keeps it). */
const paint = (g, chs, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (chs.includes(g[y][x])) { const c = fn(x, y, g[y][x]); if (c) g[y][x] = c; } };
/** Courses on a face whose rows run with slope s (+0.5 down-right, -0.5 up-right, 0 flat): rows of height h, blocks of width w
 *  staggered by half a block, 1-px joint under each row, optional lit lip on top of each row, block tones picked per block.
 *  o.flip: the face slopes away from the viewer (a back roof slope), so downhill is up the screen and the joint/lip swap ends. */
const course = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  if (v >= o.h - 1) return o.joint;
  // o.fall: seams follow a roof's fall line (screen dx per dy, from the ridge down to the eave) instead of the vertical
  const xt = o.fall ? Math.round((x - o.fall * y) / (1 - o.fall * s)) : x;
  const xs = xt + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
  if (o.seam && ((xs % o.w) + o.w) % o.w === 0) return o.seam;
  if (o.lip && v < 1) return o.lip;
  return o.tones[Math.floor(hash(col + 17, row + 91) * o.tones.length)];
};
/** Thatch: layered bands (slope s, height h) of short vertical strands; the bottom of every band is the shaded underside.
 *  o.flip: a back slope (downhill is up the screen), so the shaded underside is at the top of every band. */
const thatch = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  const hx = hash(x + 5, row + 3);
  if (v >= o.h - 1 - (hx < 0.3 ? 1 : 0)) return o.under;
  return o.tones[Math.floor(hash(x >> 1, row * 7 + 1) * o.tones.length)];
};
/** Selective ink outline: every solid cell touching transparency becomes ink, except on upper-left edges where `sel` maps the
 *  material to its shade tone (so the lit side is not stickered). */
const outline = (g, ink, sel = {}) => {
  const H = g.length, W = g[0].length, o = copy(g); const sol = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!sol(x, y)) continue; const l = !sol(x - 1, y), r = !sol(x + 1, y), u = !sol(x, y - 1), d = !sol(x, y + 1);
    if (!(l || r || u || d)) continue;
    o[y][x] = (!r && !d && sel[g[y][x]]) ? sel[g[y][x]] : ink;
  }
  return o;
};
const line = (g, a, b, ch, dy = 0) => pixLine(g, a[0], a[1] + dy, b[0], b[1] + dy, ch);
/** height above the base line of an iso wall from a to b (a.x < b.x) at (x,y) */
const wallH = (a, b, x, y) => (a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])) - y;
/** Ground-plane paving (floors, yards, plinth tops): flagstones on the 2:1 iso grid, so every joint runs along one of the two
 *  ground axes and the floor reads as lying flat. o.a: stone size across the down-right rows, o.b: along them (both in px of
 *  screen height), rows staggered by half a stone; o.joint: joint colour; o.lip: optional lit edge just past each joint;
 *  o.tones: per-stone tones; o.ox/o.oy: grid origin. */
const pave = (x, y, o) => {
  const X = x - (o.ox || 0), Y = y - (o.oy || 0), a = Y - X / 2, b = Y + X / 2;
  const ra = Math.floor(a / o.a), bb = b + (((ra % 2) + 2) % 2) * Math.floor(o.b / 2), rb = Math.floor(bb / o.b);
  const va = a - ra * o.a, vb = bb - rb * o.b;
  if (va < 1 || vb < 1) return o.joint;
  if (o.lip && (va < 2 || vb < 2)) return o.lip;
  return o.tones[Math.floor(hash(ra + 31, rb + 7) * o.tones.length)];
};
/** pixStamp on an iso wall: each column of the template drops by slope × its distance from the centre column, so a door,
 *  window, banner or emblem lies flat on a wall whose eave runs with that slope (+0.5 lit left face, -0.5 shaded right face). */
const stampOn = (g, x, y, tpl, slope) => {
  const rows = tpl.replace(/^\n+|\n+$/g, '').split('\n'), w = Math.max(...rows.map(r => r.length)), c = (w - 1) / 2;
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') pixSet(g, x + xx, y + yy + Math.round(slope * (xx - c) + 1e-9), r[xx]); });
};
/** A round window on an iso wall: fn(dx, dy) in wall units (dx along the wall, dy up it) for each cell of an R-radius disc
 *  that the wall's slope shears and the iso view narrows (0.9). */
const discOn = (g, cx, cy, R, slope, fn) => {
  for (let y = -R - 3; y <= R + 3; y++) for (let x = -R - 1; x <= R + 1; x++) { const u = x / 0.9, v = y - slope * x; if (Math.hypot(u, v) > R + 0.4) continue;
    const c = fn(u, v); if (c) pixSet(g, cx + x, cy + y, c); }
};

