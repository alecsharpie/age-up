// @pixel food
// Berry bushes, generated: a low leafy mound built from leaf clumps (the same crown painter as the trees: clumps laid back-to-front,
// lit top-left caps, shaded bottom rims), then clusters of round berries (highlight · body · shade) bunched on the lit, outer side,
// then a selective hue-shifted outline. 64×80, ground point [32,68]. idle = [wide mound, round bush with twigs, two clumps].
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
const LEAF = ['o', 'k', 'd', 'm', 'l', 'h'], BERRY = ['R', 'r', 'q'];
function step(g, x, y, s, lad) { const c = pixGet(g, x, y), i = lad.indexOf(c); if (i < 1) return; pixSet(g, x, y, lad[Math.max(1, Math.min(lad.length - 1, i + s))]); }
/** leaf clumps: the crown silhouette is filled deep, then little leaf spheres are laid back-to-front (top rows first) inside it.
 *  Each clump's base tone comes from where it sits on the whole crown (upper-left lit); its own upper-left cap is one step
 *  lighter and its lower-right rim one step darker, so overlapping clumps read as layered foliage, not noise. */
function crown(g, lad, R, blobs, cx, cy, rs) {
  const inside = (x, y) => blobs.some(([bx, by, r, ry]) => { const dx = (x + 0.5 - (cx + bx)) / r, dy = (y + 0.5 - (cy + by)) / (ry || r); return dx * dx + dy * dy <= 1; });
  let x0 = 99, x1 = 0, y0 = 99, y1 = 0;
  for (const [bx, by, r, ry] of blobs) { x0 = Math.min(x0, cx + bx - r); x1 = Math.max(x1, cx + bx + r); y0 = Math.min(y0, cy + by - (ry || r)); y1 = Math.max(y1, cy + by + (ry || r)); }
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) if (inside(x, y)) pixSet(g, x, y, lad[2]);
  const pts = [];
  for (let y = y0 - 1; y <= y1 + 1; y += rs * 1.15) for (let x = x0 - 1 + ((Math.round((y - y0) / rs) % 2) * rs * 0.6); x <= x1 + 1; x += rs * 1.3) pts.push([x + (R() - 0.5) * 1.6, y + (R() - 0.5) * 1.6, rs * (0.85 + R() * 0.35)]);
  pts.sort((a, b) => a[1] - b[1]);
  for (const [px, py, r] of pts) {
    if (!inside(Math.round(px), Math.round(py))) continue;
    const u = (px - mx) / rx, v = (py - my) / ry, lit = -0.6 * u - 0.75 * v + 0.35 * Math.sqrt(Math.max(0, 1 - u * u - v * v));
    const base = lit > 0.55 ? 4 : lit > 0.1 ? 3 : lit > -0.35 ? 2 : 1;
    for (let y = Math.floor(py - r); y <= py + r; y++) for (let x = Math.floor(px - r); x <= px + r; x++) {
      const dx = x + 0.5 - px, dy = y + 0.5 - py; if (dx * dx + dy * dy > r * r || !inside(x, y)) continue;
      let t = base; const bx2 = x + 0.5 - px, by2 = y + 1.5 - py;
      if (bx2 * bx2 + by2 * by2 > r * r) t--;                                  // bottom rim: the clump's own shadow line
      else if (dy < -r * 0.3 && dx < r * 0.25 && dx > -r * 0.85) t++;          // top-left cap catches the light
      pixSet(g, x, y, lad[Math.max(1, Math.min(lad.length - 1, t))]);
    }
  }
}
/** selective outline: every empty/shadow cell touching the sprite gets ink; on the lit top-left rim it is one tone lighter */
function ink(g, inkOf) {
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y][x]; if (c !== '.' && c !== 'z') continue;
    const nb = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => pixGet(g, x + dx, y + dy)).filter(n => n !== '.' && n !== 'z');
    if (nb.length) add.push([x, y, inkOf(nb[0], x, y, pixGet(g, x, y + 1) !== '.' && pixGet(g, x, y + 1) !== 'z' && pixGet(g, x + 1, y) !== '.')]);
  }
  for (const [x, y, c] of add) pixSet(g, x, y, c);
}
const inkOf = (n, x, y, litRim) => BERRY.includes(n) ? 'Q' : n === 'x' || n === 't' ? 'x' : litRim && x < AX - 2 ? 'k' : 'o';
/** a berry: 2×2 round fruit, highlight top-left, shade bottom-right */
function berry(g, x, y) { pixSet(g, x, y, 'R'); pixSet(g, x + 1, y, 'r'); pixSet(g, x, y + 1, 'r'); pixSet(g, x + 1, y + 1, 'q'); }
function bush(blobs, seed, bunches, twigs) {
  const g = pixGrid(W, H);
  crown(g, LEAF, rng(seed), blobs, AX, AY, 3);
  const R = rng(seed + 1);
  for (const [bx, by, n] of bunches) {                                  // a bunch: n berries jostled together, the front one bigger
    const OFF = [[0, 0], [3, 1], [-2, 2], [1, 3], [4, 4]];
    for (let i = 0; i < n; i++) { const x = Math.round(AX + bx + OFF[i][0]), y = Math.round(AY + by + OFF[i][1]); if (LEAF.includes(pixGet(g, x, y)) && LEAF.includes(pixGet(g, x + 1, y + 1))) berry(g, x, y, false); }
  }
  ink(g, inkOf);
  if (twigs) for (const [x0, y0, x1, y1] of twigs) { pixLine(g, AX + x0, AY + y0, AX + x1, AY + y1, 'x'); pixSet(g, AX + x0, AY + y0, 't'); }   // bare woody stems poking out (1 px, dark enough to be their own outline)
  return g;
}
const v0 = bush([[0, -8, 12, 8], [-11, -5, 8, 6], [11, -5, 8, 6], [-4, -13, 6, 5], [5, -14, 6, 5]], 3, [[-11, -12, 5], [-4, -18, 3], [5, -15, 4], [11, -9, 4], [-16, -7, 3], [0, -8, 4]], [[-17, -9, -21, -12], [16, -11, 20, -14]]);
const v1 = bush([[0, -10, 10, 9], [-7, -6, 7, 6], [7, -7, 7, 6], [0, -17, 6, 5]], 17, [[-7, -15, 4], [1, -21, 3], [4, -12, 5], [-4, -7, 3]], [[-7, -14, -9, -18], [5, -17, 7, -21], [9, -10, 12, -13]]);
const v2 = bush([[-9, -7, 9, 7], [9, -6, 8, 6], [-9, -13, 6, 5], [8, -12, 5, 4], [0, -4, 6, 4]], 42, [[-14, -14, 3], [-8, -10, 5], [5, -13, 4], [11, -8, 3], [-2, -6, 3]], [[-11, -16, -13, -21], [10, -14, 12, -18]]);

export default {
  id: 'food', kind: 'resource', anchor: [AX, AY],
  palette: {
    o: '#12301a', k: '#1c4620', d: '#2d6e2f', m: '#3b8a3c', l: '#56b055', h: '#8ccf6a',   // leaves: ink → deep → shade → mid → light → sun (cooler than the oak)
    R: '#ff9a98', r: '#d0303c', q: '#8a1a2a', Q: '#4a0e18',                               // berries: highlight, body, shade, ink
    t: '#5a3a18', x: '#2e1c0c',                                                            // twigs
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
