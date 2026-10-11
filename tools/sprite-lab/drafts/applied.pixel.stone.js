// @pixel stone
// Stone quarry, generated: cool blue-grey slabs and boulders (sunlit top-left ridge, lit facet, body, cool shaded right facet,
// dark base seam), cracks, a few moss patches on the tops, loose chips on the ground, then a selective hue-shifted outline.
// 64×80, ground point [32,68]. idle = [stacked boulder pile, flat quarried slabs, one big split boulder]. drawResource shrinks it as it empties.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
function rock(g, cx, cy, w, h, R) {
  const hw = w / 2, j = () => (R() - 0.5) * 2;
  const pts = [[cx - hw, cy], [cx - hw + 1 + j(), cy - h * 0.55], [cx - hw * 0.35 + j(), cy - h], [cx + hw * 0.3 + j(), cy - h * 0.92], [cx + hw - 1 + j(), cy - h * 0.45], [cx + hw, cy]];
  pixPoly(g, pts, 'm');
  pixPoly(g, [[cx + hw * 0.15, cy - h * 0.86], pts[3], pts[4], [cx + hw, cy], [cx + hw * 0.2, cy]], 'd');
  pixPoly(g, [pts[1], pts[2], [cx + hw * 0.1, cy - h * 0.8], [cx - hw * 0.4, cy - h * 0.5]], 'l');
  pixLine(g, pts[1][0] + 1, pts[1][1], pts[2][0] + 1, pts[2][1] + 1, 'w'); pixLine(g, pts[2][0] + 1, pts[2][1] + 1, pts[2][0] + hw * 0.4, pts[2][1] + 1, 'w');   // sunlit ridge
  pixLine(g, cx - hw + 1, cy, cx + hw - 1, cy, 'k'); pixLine(g, pts[4][0], pts[4][1], cx + hw, cy, 'k');
  if (w > 12) { pixLine(g, cx - hw * 0.2, cy - h * 0.7, cx + hw * 0.05, cy - h * 0.4, 'c'); pixLine(g, cx + hw * 0.05, cy - h * 0.4, cx - hw * 0.1, cy - h * 0.15, 'c'); }   // a crack
}
/** A flat slab: a thin parallelogram with a lit top, a mid front face and a shaded end, dark seam under it. */
function slab(g, cx, cy, w, t) {
  const hw = w / 2;
  pixPoly(g, [[cx - hw, cy - t], [cx - hw + 3, cy - t - 3], [cx + hw, cy - t - 3], [cx + hw - 3, cy - t]], 'l');
  pixLine(g, cx - hw + 3, cy - t - 3, cx + hw - 1, cy - t - 3, 'w');
  pixPoly(g, [[cx - hw, cy - t], [cx + hw - 3, cy - t], [cx + hw - 3, cy], [cx - hw, cy]], 'm');
  pixPoly(g, [[cx + hw - 3, cy - t], [cx + hw, cy - t - 3], [cx + hw, cy - 3], [cx + hw - 3, cy]], 'd');
  pixLine(g, cx - hw, cy, cx + hw - 3, cy, 'k'); pixLine(g, cx - hw + 1, cy - t, cx + hw - 4, cy - t, 'c');
  for (let x = cx - hw + 4; x < cx + hw - 4; x += 7) pixLine(g, x, cy - t + 1, x, cy - 1, 'c');   // quarried block joints
}
/** moss: a small clump settled on a sunlit top (light top row, darker hem below) */
function moss(g, R, n) { let k = 0, tries = 0; while (k < n && tries++ < 400) { const x = Math.round(AX - 18 + R() * 36), y = Math.round(AY - 26 + R() * 18); if (['l', 'w'].includes(pixGet(g, x, y)) && ['l', 'w', 'm'].includes(pixGet(g, x + 3, y + 1)) && pixGet(g, x + 1, y - 1) !== '.') { for (const [dx, dy, c] of [[1, -1, 'G'], [2, -1, 'G'], [0, 0, 'G'], [1, 0, 'G'], [2, 0, 'M'], [3, 0, 'M'], [1, 1, 'M'], [2, 1, 'M']]) if (pixGet(g, x + dx, y + dy) !== '.') pixSet(g, x + dx, y + dy, c); k++; } } }
function chips(g, R, n) { let k = 0, tries = 0; while (k < n && tries++ < 200) { const x = Math.round(AX - 24 + R() * 48), y = Math.round(AY - 1 + R() * 2); const free = (a, b) => ['z', '.'].includes(pixGet(g, a, b)); if ([-2, -1, 0, 1, 2, 3].every(dx => free(x + dx, y) && free(x + dx, y - 2) && free(x + dx, y - 3) && free(x + dx, y + 1))) { pixSet(g, x, y, 'm'); pixSet(g, x + 1, y, 'd'); pixSet(g, x, y - 1, 'l'); pixSet(g, x + 1, y - 1, 'm'); k++; } } }   // loose spalls lying beside the pile
function ink(g) {
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y][x]; if (c !== '.' && c !== 'z') continue;
    const below = pixGet(g, x, y + 1);
    const nb = [below, pixGet(g, x + 1, y), pixGet(g, x, y - 1), pixGet(g, x - 1, y)].filter(n => n !== '.' && n !== 'z');
    if (nb.length) add.push([x, y, below !== '.' && below !== 'z' && x < AX - 4 ? 'k' : 'o']);
  }
  for (const [x, y, c] of add) pixSet(g, x, y, c);
}
/** occlusion: where a facet meets the ground or the rock below it, the bottom 1–2 px darken to a cool deep tone (ragged, not a ruled line) */
function occl(g) { for (let y = H - 2; y > 0; y--) for (let x = 0; x < W; x++) { const c = g[y][x], b = g[y + 1][x]; if ((c === 'd' || c === 'm') && (b === 'k' || b === '.' || b === 'D') && ((x * 7 + y * 3) % 5 < 3 || c === 'd')) g[y][x] = c === 'd' ? 'D' : 'd'; } }
function v(seed, build, m) { const g = pixGrid(W, H); const R = rng(seed); build(g, R); occl(g); moss(g, R, m); chips(g, R, 4); ink(g); return g; }
const v0 = v(9, (g, R) => { rock(g, AX - 9, AY - 8, 15, 9, R); rock(g, AX + 9, AY - 8, 14, 8, R); rock(g, AX, AY - 2, 18, 12, R); rock(g, AX - 15, AY, 11, 6, R); rock(g, AX + 13, AY, 11, 6, R); }, 3);
const v1 = v(31, (g, R) => { slab(g, AX + 2, AY - 10, 26, 5); slab(g, AX - 4, AY - 5, 28, 5); slab(g, AX, AY, 30, 5); rock(g, AX + 15, AY - 1, 10, 7, R); rock(g, AX - 17, AY, 9, 5, R); }, 2);
const v2 = v(77, (g, R) => { rock(g, AX + 12, AY - 6, 12, 7, R); rock(g, AX - 6, AY - 1, 20, 18, R); rock(g, AX + 5, AY - 1, 14, 14, R); rock(g, AX - 17, AY, 10, 6, R); rock(g, AX + 15, AY + 1, 9, 5, R); }, 4);

export default {
  id: 'stone', kind: 'resource', anchor: [AX, AY],
  palette: {
    o: '#1e262c', k: '#3a444a', c: '#4e585e', d: '#66717a', m: '#8a959a', l: '#adb7ba', w: '#d4dcdc', D: '#525c64',   // blue-grey rock: ink, seam, crack, shade, body, lit facet, sunlit ridge, occluded underside
    M: '#5a7a3a', G: '#7a9a4a',                                                                          // moss
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
