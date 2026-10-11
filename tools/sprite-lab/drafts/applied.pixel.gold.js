// @pixel gold
// Gold mine, generated: a pile of angular brown-grey boulders (lit top-left facet, mid body, cool shaded right facet, dark seam at the base),
// veins of ore running across the faces, bright nugget clusters on the gold ramp, and 4-point white glints on the biggest nuggets.
// A hue-shifted dark-brown selective outline (one tone lighter on the lit top-left rim). 64×80, ground point [32,68].
// idle = [heaped pile, low spread with a big front boulder, a cracked outcrop]. drawResource shrinks the sprite as the mine empties.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
const ROCK = ['o', 'k', 'd', 'm', 'l', 'L'];
/** One boulder: base at (cx,cy), width w, height h. Body 'm', right facet 'd', top-left facet 'l', a sunlit cap 'L', dark base seam 'k'. */
function rock(g, cx, cy, w, h, R) {
  const hw = w / 2, j = () => (R() - 0.5) * 2;
  const pts = [[cx - hw, cy], [cx - hw + 1 + j(), cy - h * 0.55], [cx - hw * 0.35 + j(), cy - h], [cx + hw * 0.3 + j(), cy - h * 0.92], [cx + hw - 1 + j(), cy - h * 0.45], [cx + hw, cy]];
  pixPoly(g, pts, 'm');
  pixPoly(g, [[cx + hw * 0.15, cy - h * 0.86], pts[3], pts[4], [cx + hw, cy], [cx + hw * 0.2, cy]], 'd');
  pixPoly(g, [pts[1], pts[2], [cx + hw * 0.1, cy - h * 0.8], [cx - hw * 0.4, cy - h * 0.5]], 'l');
  pixLine(g, pts[2][0] + 1, pts[2][1] + 1, pts[2][0] + hw * 0.4, pts[2][1] + 1, 'L');                      // sunlit ridge
  pixLine(g, pts[1][0] + 1, pts[1][1], pts[2][0] + 1, pts[2][1] + 1, 'L');
  pixLine(g, cx - hw + 1, cy, cx + hw - 1, cy, 'k');                                                       // base seam
  pixLine(g, pts[4][0], pts[4][1], cx + hw, cy, 'k');
  pixLine(g, pts[3][0], pts[3][1] + 1, pts[4][0], pts[4][1], 'd');
}
/** ore vein: a wandering 1-px line of gold across rock faces, thickening into nuggets */
function vein(g, R, x0, y0, len) { let x = x0, y = y0; for (let i = 0; i < len; i++) { if (ROCK.includes(pixGet(g, x, y))) pixSet(g, x, y, i % 4 === 3 ? 'G' : 'g'); x += 1; y += R() < 0.4 ? (R() < 0.5 ? -1 : 1) : 0; } }
function nugget(g, x, y, big) {
  pixSet(g, x, y, 'y'); pixSet(g, x + 1, y, 'G'); pixSet(g, x, y + 1, 'G'); pixSet(g, x + 1, y + 1, 'g');
  if (big) { pixSet(g, x + 2, y, 'G'); pixSet(g, x + 2, y + 1, 'g'); pixSet(g, x - 1, y + 1, 'G'); pixSet(g, x, y + 2, 'g'); pixSet(g, x + 1, y + 2, 'g'); }
}
function glint(g, x, y) { pixSet(g, x, y, 'w'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (pixGet(g, x + dx, y + dy) !== '.') pixSet(g, x + dx, y + dy, 'y'); }
function ink(g) {
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y][x]; if (c !== '.' && c !== 'z') continue;
    const below = pixGet(g, x, y + 1), right = pixGet(g, x + 1, y);
    const nb = [below, right, pixGet(g, x, y - 1), pixGet(g, x - 1, y)].filter(n => n !== '.' && n !== 'z');
    if (nb.length) add.push([x, y, below !== '.' && below !== 'z' && x < AX - 4 ? 'k' : 'o']);
  }
  for (const [x, y, c] of add) pixSet(g, x, y, c);
}
function pile(rocks, seed, nuggets, veins, glints) {
  const g = pixGrid(W, H);
  const R = rng(seed);
  for (const [dx, dy, w, h] of rocks) rock(g, AX + dx, AY + dy, w, h, R);      // back rocks first (listed higher on screen)
  for (const [x, y, n] of veins) vein(g, R, AX + x, AY + y, n);
  let n = 0, tries = 0; const at = [];
  while (n < nuggets && tries++ < 400) {
    const x = Math.round(AX - 18 + R() * 36), y = Math.round(AY - 22 + R() * 19);
    if (['m', 'l', 'L'].includes(pixGet(g, x, y)) && ['m', 'l', 'd'].includes(pixGet(g, x + 2, y + 2)) && !at.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 4)) { nugget(g, x, y, n < glints + 2); at.push([x, y]); n++; }
  }
  ink(g);
  for (let i = 0; i < glints && i < at.length; i++) glint(g, at[i][0], at[i][1]);
  return g;
}
const v0 = pile([[-9, -9, 16, 11], [8, -10, 14, 10], [0, -3, 18, 14], [-14, -1, 12, 6], [12, 0, 12, 7]], 5, 9, [[-15, -5, 7], [4, -8, 6]], 3);
const v1 = pile([[-11, -4, 14, 9], [10, -3, 14, 8], [0, -1, 24, 13], [-17, 0, 8, 4], [17, 0, 7, 4]], 23, 8, [[-8, -6, 14], [-3, -10, 6]], 3);
const v2 = pile([[-2, -10, 12, 12], [-10, -8, 14, 15], [6, -6, 18, 18], [-1, -1, 14, 8], [15, 0, 10, 5], [-16, 0, 10, 6]], 61, 10, [[1, -17, 8], [-14, -12, 5], [6, -9, 6]], 4);

export default {
  id: 'gold', kind: 'resource', anchor: [AX, AY],
  palette: {
    o: '#261a10', k: '#3e3020', d: '#64543e', m: '#8a7a5c', l: '#aa9a76', L: '#c8b892',   // brown-grey host rock (kept duller than the ore so the gold pops): ink, seam, shade, body, lit facet, ridge
    g: '#a87a12', G: '#e1b12c', y: '#ffe28a', w: '#ffffff',                                // gold: shade, mid, light (shared ramp), glint
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
