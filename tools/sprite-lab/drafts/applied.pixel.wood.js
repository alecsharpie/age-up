// @pixel wood
// Trees, generated: an oak, a birch and a pine. 64×80, ground point [32,68]. idle = [oak, birch, pine] (v2 stays the pine, as in the old code).
// Each canopy: offset discs lay down shade → mid → light (light from the upper-left), then leaf *clumps* (little spheres with a lit
// top-left crescent and a shaded lower-right) break it into clusters, then a selective outline: dark hue-shifted ink all round,
// one step lighter on the lit top-left rim. Trunks get a 3-tone bark ramp with flared roots. The ground shadow is a translucent disc.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
const OAK = ['o', 'k', 'd', 'm', 'l', 'h'], BIRCH = ['o', 'k', 'n', 'N', 'Y', 'y'], PINE = ['O', 'P', 'p', 'q', 'Q'];
const BARK = ['x', 'b', 't', 'T'];
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
const inkOf = (n, x, y, litRim) => {
  if (PINE.includes(n)) return litRim && x < AX ? 'P' : 'O';
  if (BIRCH.includes(n) || OAK.includes(n)) return litRim && x < AX - 2 ? 'k' : 'o';
  return 'x';
};
function trunk(g, h, w, lad, marks) {
  pixPoly(g, [[AX - w, AY], [AX + w, AY], [AX + w, AY - h], [AX - w, AY - h]], lad[2]);
  pixLine(g, AX - w + 1, AY - 1, AX - w + 1, AY - h, lad[3]);                     // lit edge
  pixLine(g, AX + w - 1, AY - 1, AX + w - 1, AY - h, lad[1]);                     // shaded edge
  for (const [dx, dy, c] of [[-w - 1, -1, 2], [w, -1, 1], [-w - 2, 0, 2], [w + 1, 0, 1], [-w - 1, 0, 3], [w, 0, 1], [w - 1, -2, 1]]) pixSet(g, AX + dx, AY + dy, lad[c]);   // flared roots
  if (marks) for (const [dy, dx, len] of marks) pixLine(g, AX + dx, AY - dy, AX + dx + len - 1, AY - dy, 'x');
}
function canopy(g, cx, cy, blobs, lad, seed, rs) { crown(g, lad, rng(seed), blobs, cx, cy, rs || 3.2); }
function oak() {
  const g = pixGrid(W, H); disc(g, AX, AY, 15, 'z', 6);
  trunk(g, 24, 3, BARK);
  pixLine(g, AX - 1, AY - 20, AX - 5, AY - 27, 't'); pixLine(g, AX + 1, AY - 19, AX + 6, AY - 26, 'b');     // boughs into the crown
  const blobs = [[0, 2, 13], [-10, 6, 9], [10, 6, 9], [-5, -6, 9], [6, -6, 8], [0, -12, 7]];
  canopy(g, AX, AY - 34, blobs, OAK, 11, 3.8);
  ink(g, inkOf); return g;
}
function birch() {
  const g = pixGrid(W, H); disc(g, AX, AY, 12, 'z', 5);
  trunk(g, 36, 2, ['x', 'w', 'W', 'W'], [[5, -1, 2], [11, 0, 2], [16, -1, 1], [21, 0, 2], [27, -1, 2], [32, 0, 1]]);
  pixLine(g, AX, AY - 30, AX - 6, AY - 36, 'w'); pixLine(g, AX + 1, AY - 32, AX + 6, AY - 39, 'w');           // forked white limbs
  const blobs = [[-7, -1, 6], [7, -3, 6], [0, -8, 8], [-4, -16, 6], [5, -16, 5], [0, 3, 5], [0, -22, 4]];
  canopy(g, AX, AY - 38, blobs, BIRCH, 29, 2.6);
  ink(g, inkOf); return g;
}
function pine() {
  const g = pixGrid(W, H); disc(g, AX, AY, 13, 'z', 5);
  trunk(g, 22, 2, BARK);
  const R = rng(7), bases = [];
  for (let k = 0; k < 4; k++) {                                                    // bottom tier first; upper tiers overlap it leaving shelves
    const base = AY - 17 - k * 10, apex = base - 17, hw = 18 - k * 4; bases.push([base, hw]);
    pixPoly(g, [[AX, apex], [AX + hw, base], [AX, base]], 'P');                    // shaded right half
    pixPoly(g, [[AX, apex], [AX, base], [AX - hw, base]], 'q');                    // lit left half
    pixPoly(g, [[AX, apex + 4], [AX + 3, base], [AX - 1, base]], 'p');             // the ridge between them
    for (let x = AX - hw + 1; x < AX + hw; x += 2) pixSet(g, x, base, '.');         // drooping needle fringe (sawtooth hem)
    for (let r = apex + 4; r < base - 1; r += 3) {                                // needle sprays: short strokes sloping out and down
      const t = (r - apex) / (base - apex), half = hw * t;
      for (let s = 0; s < 2; s++) { const xl = AX - 2 - s * Math.max(3, half / 2) - R() * 2, xr = AX + 2 + s * Math.max(3, half / 2) + R() * 2;
        if (xl > AX - half + 1) { pixSet(g, xl, r, 'Q'); pixSet(g, xl - 1, r + 1, 'Q'); }
        if (xr < AX + half - 1) { pixSet(g, xr, r, 'p'); pixSet(g, xr + 1, r + 1, 'p'); } }
    }
    pixLine(g, AX - 1, apex + 1, AX - hw + 1, base - 1, 'Q');                      // sunlit leading edge
  }
  for (const [base, hw] of bases.slice(1)) for (let x = AX - hw - 2; x <= AX + hw + 2; x++) {   // each tier shades the one below it
    const c = pixGet(g, x, base + 1); const d = { Q: 'q', q: 'p', p: 'P', P: 'O' }[c]; if (d) pixSet(g, x, base + 1, d);
  }
  ink(g, inkOf); return g;
}

export default {
  id: 'wood', kind: 'resource', anchor: [AX, AY],
  palette: {
    o: '#122a14', k: '#1f4a1e', d: '#2e6a2b', m: '#3c8236', l: '#53a044', h: '#8cc860',   // oak leaves: ink → deep → shade → mid → light → sun
    n: '#3f7a2e', N: '#5c9a3a', Y: '#82b84a', y: '#b4d870',                                // birch leaves: warmer, yellower
    O: '#0e2219', P: '#1d4a34', p: '#2a6444', q: '#3f7d52', Q: '#68a46a',                  // pine needles: cooler, bluer
    x: '#24160a', b: '#3b2614', t: '#5b3a1c', T: '#86603a',                                // bark: ink, shade, mid, lit
    W: '#ece8dc', w: '#b8b0a0',                                                            // birch bark
    z: 'rgba(0,0,0,0.18)',                                                                 // ground shadow
  },
  frames: { idle: [pixText(oak()), pixText(birch()), pixText(pine())] },
};
