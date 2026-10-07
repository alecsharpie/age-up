// @pixel wood
// Trees, generated: shapes lay down three-tone canopies and cones, then a seeded leaf texture pass. 64×80, ground point [32,68].
// idle = [oak, taller oak, pine] (v2 is the pine, as in the current code). Light from the upper-left: lit side is left/top.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
function canopy(g, cx, cy, blobs, seed) {
  for (const [ch, ox, oy, dr] of [['d', 1, 1, 0], ['m', -1, -1, -2], ['l', -3, -3, -5]]) for (const [bx, by, r] of blobs) if (r + dr >= 2) disc(g, cx + bx + ox, cy + by + oy, r + dr, ch);
  const R = rng(seed);
  for (const [bx, by, r] of blobs) for (let i = 0; i < r * 3; i++) {
    const a = R() * 6.283, rr = R() * r; const x = cx + bx + Math.cos(a) * rr, y = cy + by + Math.sin(a) * rr; const ch = pixGet(g, x, y);
    if (ch === 'm' && R() < 0.45) pixSet(g, x, y, R() < 0.5 ? 'l' : 'd'); else if (ch === 'l' && R() < 0.35) pixSet(g, x, y, R() < 0.5 ? 'h' : 'm'); else if (ch === 'd' && R() < 0.3) pixSet(g, x, y, R() < 0.3 ? 'k' : 'm');
  }
}
function trunk(g, h, w) {
  pixPoly(g, [[AX - w, AY], [AX + w, AY], [AX + w - 1, AY - h], [AX - w + 1, AY - h]], 't');
  pixLine(g, AX - w + 1, AY - 1, AX - w + 2, AY - h, 'T');                       // lit edge
  pixLine(g, AX + w - 1, AY - 1, AX + w - 2, AY - h, 'k');                       // shaded edge
  for (const [dx, dy] of [[-w - 1, -1], [w + 1, -1], [-w - 2, 0], [w + 2, 0], [-w - 1, 0], [w + 1, 0]]) pixSet(g, AX + dx, AY + dy, 't');   // roots
}
function oak(blobs, seed, th) {
  const g = pixGrid(W, H); disc(g, AX, AY, 15, 'z', 6);
  trunk(g, th, 3);
  disc(g, AX, AY - th + 4, 7, 'k', 4);                                               // dark underside where branches meet the canopy
  canopy(g, AX, AY - th - 10, blobs, seed);
  return g;
}
function pine(seed) {
  const g = pixGrid(W, H); disc(g, AX, AY, 13, 'z', 5);
  trunk(g, 24, 2);
  const R = rng(seed);
  for (let k = 0; k < 4; k++) {                                                    // bottom tier first; upper tiers overlap it leaving shelves
    const base = AY - 19 - k * 10, apex = base - 17, hw = 18 - k * 4;
    pixPoly(g, [[AX, apex], [AX + hw, base], [AX, base]], 'd');                    // shaded right half
    pixPoly(g, [[AX, apex], [AX, base], [AX - hw, base]], 'm');                    // lit left half
    pixLine(g, AX, apex, AX - hw, base, 'l'); pixLine(g, AX - hw, base, AX - 1, base, 'd');
    pixLine(g, AX + 1, apex + 1, AX + hw, base, 'k'); pixLine(g, AX, base, AX + hw, base, 'k');
    for (let i = 0; i < 14; i++) { const t = 0.2 + R() * 0.75, side = R() < 0.55 ? -1 : 1; const x = AX + side * hw * t * R(), y = apex + (base - apex) * t; const ch = pixGet(g, x, y); if (ch === 'm') pixSet(g, x, y, R() < 0.6 ? 'l' : 'd'); else if (ch === 'd') pixSet(g, x, y, R() < 0.5 ? 'k' : 'm'); }
  }
  pixSet(g, AX, AY - 66, 'l');
  return g;
}
const oak0 = oak([[0, 2, 13], [-9, 6, 9], [9, 6, 9], [-4, -6, 9], [5, -6, 8], [0, -11, 6]], 11, 22);
const oak1 = oak([[0, 0, 11], [-7, 6, 8], [7, 5, 8], [-1, -9, 8], [4, -15, 6], [-5, -14, 5]], 29, 26);
const pine2 = pine(7);

export default {
  id: 'wood', kind: 'resource', anchor: [AX, AY],
  palette: {
    k: '#1f4a1e', d: '#2e6a2b', m: '#3c8236', l: '#4f9a42', h: '#6cb858',   // leaf tones: deepest shade → highlight
    t: '#5b3a1c', T: '#7a5230',                                              // bark, lit bark
    z: 'rgba(0,0,0,0.18)',                                                    // ground shadow
  },
  frames: { idle: [pixText(oak0), pixText(oak1), pixText(pine2)] },
};
