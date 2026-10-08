// @pixel stone
// Stone quarry, generated: cool-grey slabs and boulders (lit top-left facet, shaded right, dark cracks). 64×80, ground point [32,68].
// idle = three layouts: a stacked pile, flat slabs, one big boulder with chips. drawResource shrinks the sprite as it empties.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
function rock(g, cx, cy, w, h, R) {
  const hw = w / 2, j = () => (R() - 0.5) * 2;
  const pts = [[cx - hw, cy], [cx - hw + 1 + j(), cy - h * 0.55], [cx - hw * 0.35 + j(), cy - h], [cx + hw * 0.3 + j(), cy - h * 0.92], [cx + hw - 1 + j(), cy - h * 0.45], [cx + hw, cy]];
  pixPoly(g, pts, 'm');
  pixPoly(g, [[cx + hw * 0.15, cy - h * 0.86], [pts[3][0], pts[3][1]], [pts[4][0], pts[4][1]], [cx + hw, cy], [cx + hw * 0.2, cy]], 'd');
  pixPoly(g, [[pts[1][0], pts[1][1]], [pts[2][0], pts[2][1]], [cx + hw * 0.1, cy - h * 0.8], [cx - hw * 0.4, cy - h * 0.5]], 'l');
  pixLine(g, cx - hw + 1, cy, cx + hw - 1, cy, 'k'); pixLine(g, pts[4][0], pts[4][1], cx + hw, cy, 'k');
  if (w > 12) pixLine(g, cx - hw * 0.2, cy - h * 0.7, cx + hw * 0.1, cy - h * 0.25, 'c');          // a crack
}
/** A flat slab: a thin iso-ish parallelogram with a lit top and a shaded front edge. */
function slab(g, cx, cy, w, t) { const hw = w / 2; pixPoly(g, [[cx - hw, cy - t], [cx - hw + 3, cy - t - 3], [cx + hw, cy - t - 3], [cx + hw - 3, cy - t]], 'l'); pixPoly(g, [[cx - hw, cy - t], [cx + hw - 3, cy - t], [cx + hw - 3, cy], [cx - hw, cy]], 'm'); pixPoly(g, [[cx + hw - 3, cy - t], [cx + hw, cy - t - 3], [cx + hw, cy - 3], [cx + hw - 3, cy]], 'd'); pixLine(g, cx - hw, cy, cx + hw - 3, cy, 'k'); }
function chips(g, R, n) { for (let i = 0; i < n; i++) { const x = Math.round(AX - 20 + R() * 40), y = Math.round(AY - 4 + R() * 5); if (pixGet(g, x, y) === 'z' || pixGet(g, x, y) === '.') { pixSet(g, x, y, 'm'); pixSet(g, x + 1, y, 'd'); pixSet(g, x, y - 1, 'l'); } } }
function sheen(g, R, n) { let k = 0, tries = 0; while (k < n && tries++ < 200) { const x = Math.round(AX - 18 + R() * 36), y = Math.round(AY - 22 + R() * 18); if (pixGet(g, x, y) === 'l') { pixSet(g, x, y, 'w'); k++; } } }
function v(seed, build) { const g = pixGrid(W, H); disc(g, AX, AY - 2, 18, 'z', 7); const R = rng(seed); build(g, R); chips(g, R, 5); sheen(g, R, 4); return g; }
const v0 = v(9, (g, R) => { rock(g, AX - 9, AY - 8, 15, 9, R); rock(g, AX + 9, AY - 8, 14, 8, R); rock(g, AX, AY - 2, 18, 12, R); rock(g, AX - 15, AY, 11, 6, R); rock(g, AX + 13, AY, 11, 6, R); });
const v1 = v(31, (g, R) => { slab(g, AX + 2, AY - 10, 26, 5); slab(g, AX - 4, AY - 5, 28, 5); slab(g, AX, AY, 30, 5); rock(g, AX + 14, AY - 1, 10, 7, R); rock(g, AX - 17, AY, 9, 5, R); });
const v2 = v(77, (g, R) => { rock(g, AX + 12, AY - 6, 12, 7, R); rock(g, AX - 2, AY - 1, 24, 16, R); rock(g, AX - 16, AY, 10, 6, R); rock(g, AX + 13, AY + 1, 9, 5, R); });

export default {
  id: 'stone', kind: 'resource', anchor: [AX, AY],
  palette: {
    k: '#464e52', d: '#6d7679', m: '#8d979a', l: '#aab3b5', w: '#d6dcdd',   // grey rock: base edge, shade, body, lit facet, sheen
    c: '#5a6367',                                                            // crack
    z: 'rgba(0,0,0,0.16)',
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
