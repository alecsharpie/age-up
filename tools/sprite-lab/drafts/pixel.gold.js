// @pixel gold
// Gold mine, generated: a pile of angular ochre boulders (lit top-left facet, shaded right) with bright nugget clusters and white glints.
// 64×80, ground point [32,68]. idle = three pile layouts. drawResource shrinks the sprite as the mine empties.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
/** One boulder: base at (cx,cy), width w, height h. Body 'm', right facet 'd', top-left facet 'l', dark base edge 'k'. */
function rock(g, cx, cy, w, h, R) {
  const hw = w / 2, j = () => (R() - 0.5) * 2;
  const pts = [[cx - hw, cy], [cx - hw + 1 + j(), cy - h * 0.55], [cx - hw * 0.35 + j(), cy - h], [cx + hw * 0.3 + j(), cy - h * 0.92], [cx + hw - 1 + j(), cy - h * 0.45], [cx + hw, cy]];
  pixPoly(g, pts, 'm');
  pixPoly(g, [[cx + hw * 0.15, cy - h * 0.86], [pts[3][0], pts[3][1]], [pts[4][0], pts[4][1]], [cx + hw, cy], [cx + hw * 0.2, cy]], 'd');
  pixPoly(g, [[pts[1][0], pts[1][1]], [pts[2][0], pts[2][1]], [cx + hw * 0.1, cy - h * 0.8], [cx - hw * 0.4, cy - h * 0.5]], 'l');
  pixLine(g, cx - hw + 1, cy, cx + hw - 1, cy, 'k');
  pixLine(g, pts[4][0], pts[4][1], cx + hw, cy, 'k');
}
function nugget(g, x, y, big) { pixSet(g, x, y, 'g'); pixSet(g, x + 1, y, 'G'); if (big) { pixSet(g, x, y + 1, 'G'); pixSet(g, x + 1, y + 1, 'g'); pixSet(g, x - 1, y, 'G'); } pixSet(g, x, y - 1, 'w'); }
function pile(rocks, seed, glints) {
  const g = pixGrid(W, H); disc(g, AX, AY - 2, 18, 'z', 7);
  const R = rng(seed);
  for (const [dx, dy, w, h] of rocks) rock(g, AX + dx, AY + dy, w, h, R);      // back rocks first (listed higher on screen)
  let n = 0, tries = 0;
  while (n < glints && tries++ < 300) { const x = Math.round(AX - 18 + R() * 36), y = Math.round(AY - 20 + R() * 18); if (['m', 'l'].includes(pixGet(g, x, y)) && ['m', 'l', 'd'].includes(pixGet(g, x + 1, y)) && pixGet(g, x, y - 1) !== 'w' && pixGet(g, x - 2, y) !== 'G') { nugget(g, x, y, R() < 0.5); n++; } }
  return g;
}
const v0 = pile([[-9, -8, 16, 9], [8, -9, 14, 8], [0, -3, 18, 11], [-14, -1, 12, 6], [12, 0, 12, 7]], 5, 10);
const v1 = pile([[0, -9, 20, 10], [-12, -3, 14, 8], [11, -2, 14, 8], [-2, 0, 14, 8]], 23, 9);
const v2 = pile([[-10, -7, 14, 8], [9, -7, 16, 9], [-1, -1, 16, 12], [14, 0, 10, 5], [-15, 0, 10, 5]], 61, 11);

export default {
  id: 'gold', kind: 'resource', anchor: [AX, AY],
  palette: {
    k: '#5a4418', d: '#8a6a2a', m: '#a8873a', l: '#c9a84a',   // ochre rock: base edge, shade, body, lit facet
    g: '#e1b12c', G: '#f0cd5a', w: '#fff6d0',                // nugget, nugget bright, glint
    z: 'rgba(0,0,0,0.16)',
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
