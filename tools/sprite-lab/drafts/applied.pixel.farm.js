// @pixel farm
// Flat farm: tilled soil inside a post-and-rail fence, furrows and crop rows. Frames: 0 = young (green), 1 = mature (golden).
// drafts/building.farm.js fades it in with alpha while under construction and switches to frame 1 when built.
const W = 2, H = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 14;
const bx = W * 32 + 2, by = GH - 4;
const T = [bx, by - 64], L = [bx - 64, by - 32], Rr = [bx + 64, by - 32], Bm = [bx, by];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
let seed = 5; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const speckle = (grid, from, to, prob) => { for (const r of grid) for (let x = 0; x < r.length; x++) if (r[x] === from && rnd() < prob) r[x] = to; };

function build(mature) {
  const g = pixGrid(GW, GH);
  pixPoly(g, [T, Rr, Bm, L], 'd'); speckle(g, 'd', 'D', 0.18); speckle(g, 'd', 'E', 0.06);
  // furrows parallel to the T–Rr edge, crops on the ridges between them
  for (let i = 1; i < 8; i++) { const a = lerp(T, L, i / 8), b = lerp(Rr, Bm, i / 8); pixLine(g, a[0] + 1, a[1], b[0] - 1, b[1], 'F'); }
  for (let i = 0; i < 8; i++) {
    const a = lerp(T, L, (i + 0.5) / 8), b = lerp(Rr, Bm, (i + 0.5) / 8);
    for (let k = 2; k < 30; k++) { const p = lerp(a, b, (k + 0.5) / 32); const tall = mature ? 2 : 1; pixSet(g, p[0], p[1], mature ? 'y' : 'c'); if (rnd() < 0.7) pixSet(g, p[0], p[1] - 1, mature ? (rnd() < 0.5 ? 'Y' : 'y') : 'C'); if (tall > 1 && rnd() < 0.35) pixSet(g, p[0], p[1] - 2, 'Y'); }
  }
  // fence: rails 3px above the ground along all four edges, posts at corners and mid-edges
  for (const [a, b] of [[T, Rr], [T, L], [L, Bm], [Bm, Rr]]) { pixLine(g, a[0], a[1] - 3, b[0], b[1] - 3, 'w'); pixLine(g, a[0], a[1] - 1, b[0], b[1] - 1, 'W'); }
  for (const [a, b] of [[T, Rr], [T, L], [L, Bm], [Bm, Rr]]) for (const t of [0, 0.5]) { const p = lerp(a, b, t); pixRect(g, p[0], p[1] - 6, 2, 7, 't'); pixSet(g, p[0], p[1] - 7, 'w'); }
  // worn path from the near corner into the field
  for (let k = 0; k < 10; k++) pixSet(g, Bm[0] - 1 + (k % 2), Bm[1] - 2 - k, 'E');
  return pixText(g);
}

export default {
  id: 'farm', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    d: '#8b6a3a', D: '#7d5f33', E: '#a3803f', F: '#6f5229',      // soil, dark soil, light soil, furrow
    c: '#6fae3e', C: '#8fc24a', y: '#c9a53a', Y: '#e6c75a',      // young crop, mature crop
    w: '#8a6a3a', W: '#6a4a2a', t: '#5a3a18',                    // rails, rail shade, posts
  },
  frames: { idle: [build(false), build(true)] },
};
