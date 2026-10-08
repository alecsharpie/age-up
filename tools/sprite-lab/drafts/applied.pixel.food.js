// @pixel food
// Berry bushes, generated: a low three-tone mound of leaf blobs, then red berries with a highlight pixel. 64×80, ground point [32,68].
// idle = three bush shapes (v0 wide, v1 round, v2 two clumps). Light from the upper-left.
const W = 64, H = 80, AX = 32, AY = 68;
function disc(g, cx, cy, r, ch, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) pixSet(g, x, y, ch); } }
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
function bush(blobs, seed, berries) {
  const g = pixGrid(W, H); disc(g, AX, AY - 1, 17, 'z', 6);
  for (const [ch, ox, oy, dr] of [['d', 1, 1, 0], ['m', -1, -1, -2], ['l', -2, -3, -4]]) for (const [bx, by, r, ry] of blobs) if (r + dr >= 2) disc(g, AX + bx + ox, AY + by + oy, r + dr, ch, (ry || r) + dr);
  const R = rng(seed);
  for (const [bx, by, r] of blobs) for (let i = 0; i < r * 3; i++) {
    const a = R() * 6.283, rr = R() * r; const x = AX + bx + Math.cos(a) * rr, y = AY + by + Math.sin(a) * rr * 0.8; const ch = pixGet(g, x, y);
    if (ch === 'm' && R() < 0.4) pixSet(g, x, y, R() < 0.5 ? 'l' : 'd'); else if (ch === 'l' && R() < 0.3) pixSet(g, x, y, 'm'); else if (ch === 'd' && R() < 0.3) pixSet(g, x, y, R() < 0.4 ? 'k' : 'm');
  }
  let n = 0, tries = 0;
  while (n < berries && tries++ < 400) {
    const x = Math.round(AX - 16 + R() * 32), y = Math.round(AY - 22 + R() * 20);
    const ok = ['m', 'l', 'd'].includes(pixGet(g, x, y)) && ['m', 'l', 'd'].includes(pixGet(g, x + 1, y + 1)) && !['r', 'R', 'q'].some(ch => [pixGet(g, x - 1, y), pixGet(g, x + 2, y), pixGet(g, x, y - 1), pixGet(g, x, y + 2), pixGet(g, x - 1, y - 1), pixGet(g, x + 2, y + 2)].includes(ch));
    if (!ok) continue;
    pixSet(g, x, y, 'R'); pixSet(g, x + 1, y, 'r'); pixSet(g, x, y + 1, 'r'); pixSet(g, x + 1, y + 1, 'q'); n++;
  }
  return g;
}
const v0 = bush([[0, -8, 12, 8], [-11, -5, 8, 6], [11, -5, 8, 6], [-4, -13, 6, 5], [5, -14, 6, 5]], 3, 13);
const v1 = bush([[0, -9, 11, 9], [-6, -6, 8, 6], [7, -7, 7, 6], [0, -16, 6, 5]], 17, 11);
const v2 = bush([[-8, -7, 9, 7], [9, -6, 8, 6], [-9, -13, 6, 5], [8, -12, 5, 4], [0, -5, 6, 4]], 42, 12);

export default {
  id: 'food', kind: 'resource', anchor: [AX, AY],
  palette: {
    k: '#1c4620', d: '#2d6e2f', m: '#3b8a3c', l: '#56b055',   // leaves: shade → lit
    R: '#ee7a80', r: '#c9303a', q: '#8a1f28',                 // berry highlight, berry, berry shade
    z: 'rgba(0,0,0,0.16)',
  },
  frames: { idle: [pixText(v0), pixText(v1), pixText(v2)] },
};
