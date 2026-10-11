// ==head
// @pixel farm
// Farm (2×2, flat, no team colour by design): ploughed ridges and furrows inside a post-and-rail fence with a gap at the
// near corner, wheat on every ridge, stooks of cut sheaves by the gate.
// Sets: idle ×4 = ripe wheat swaying in a wave that travels across the rows; young ×1 = green shoots while being built.
// Drawn by drafts/building.farm.js (fades in with alpha while building; flat, so no clip).
// ==end
const W = 2, H = 2;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 14;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const ROWS = 8, RC0 = 0.2, RC1 = 1.8, RA0 = 0.16, RA1 = 1.84;
const rowC = i => RC0 + (RC1 - RC0) * i / (ROWS - 1);

function soil(gr) {
  flat(gr, 0, 2, 0, 2, 0, (s, t, x, y) => {
    const a = s * 2, c = t * 2, h = hash(x >> 1, y, 6);
    if (a < 0.08 || a > 1.92 || c < 0.08 || c > 1.92) return h < 0.4 ? 'f' : 'e';      // headland under the fence
    const sp = (RC1 - RC0) / (ROWS - 1), k = (c - RC0 + sp / 2) / sp, fr = k - Math.floor(k);
    if (fr < 0.2) return 'F';                               // furrow bottom (shade)
    if (fr < 0.36) return 'f';
    if (fr > 0.78) return h < 0.5 ? 'E' : 'e';              // lit ridge shoulder (faces the upper-left light)
    return h < 0.15 ? 'f' : 'e';
  });
}
// fence: rails at z 2 and 5 between posts, posts 2 px wide with a lit cap
function fence(gr, a0, c0, a1, c1, gapAt) {
  const n = 4;
  const rail = (z, ch) => line(gr, iso(a0, c0, z), iso(a1, c1, z), (i, m) => (gapAt !== undefined && Math.abs(i / m - gapAt) < 0.12 ? null : ch));
  rail(6, 'O'); rail(5, 'v'); rail(3, 'w'); rail(2, 'v');
  for (let k = 0; k <= n; k++) { const p = iso(a0 + (a1 - a0) * k / n, c0 + (c1 - c0) * k / n, 0); for (let z = 0; z < 7; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } pixSet(gr, p[0], p[1] - 7, 'O'); pixSet(gr, p[0] + 1, p[1] - 7, 'w'); }
}
// one plant: young = 2-cell shoot, ripe = stalk + a 2×2 ear that leans with the wind
function plant(gr, x, y, ripe, lean, h) {
  if (!ripe) { pixSet(gr, x, y, 'c'); pixSet(gr, x, y - 1, h < 0.5 ? 'C' : 'c'); if (h > 0.6) pixSet(gr, x + 1, y - 1, 'C'); return; }
  const tall = 3 + (h > 0.6 ? 1 : 0);
  for (let z = 0; z < tall; z++) pixSet(gr, x, y - z, z === 0 ? 'z' : 'g');
  const ex = x + lean, ey = y - tall - 2;
  pixSet(gr, ex, ey, 'Y'); pixSet(gr, ex, ey + 1, 'y'); pixSet(gr, ex, ey + 2, 'y');
  // a second, shorter stalk beside it makes a clump
  pixSet(gr, x + 1, y, 'g'); pixSet(gr, x + 1, y - 1, 'g'); pixSet(gr, x + 1 + lean, y - 2, 'y'); pixSet(gr, x + 1 + lean, y - 3, h < 0.5 ? 'Y' : 'y'); pixSet(gr, x + 1, y + 0, 'z');
}
function crops(gr, ripe, f) {
  for (let i = 0; i < ROWS; i++) {
    const c = rowC(i);
    for (let a = RA0; a <= RA1; a += ripe ? 0.085 : 0.1) {
      const p = iso(a, c, 0), h = hash(Math.round(a * 50), i, 2);
      const phase = (a * 3 - i * 0.6) - f * Math.PI / 2;               // the wave travels across the field
      const lean = ripe ? (Math.sin(phase) > 0.35 ? 1 : 0) : 0;
      plant(gr, Math.round(p[0]), Math.round(p[1]) - 1, ripe, lean, h);
    }
  }
}
// a stook: sheaves leaned together, tied at the waist
const stook = (gr, a, c) => { const p = iso(a, c, 0); pixStamp(gr, Math.round(p[0]) - 3, Math.round(p[1]) - 8, `
..kYk..
.kYyyk.
kYyyzzk
kYyzzzk
.kvvvk.
kYyyzzk
kyyzzZk
.kkkkk.
`); };

function build(ripe, f) {
  const gr = pixGrid(GW, GH);
  soil(gr);
  fence(gr, 0.02, 0.02, 1.98, 0.02); fence(gr, 0.02, 0.02, 0.02, 1.98);           // back edges first
  crops(gr, ripe, f);
  if (ripe) { stook(gr, 1.55, 1.9); stook(gr, 1.86, 1.62); }
  // worn path through the gate at the near corner
  for (let k = 0; k < 6; k++) { const p = iso(1.94 - k * 0.04, 1.94 - k * 0.04, 0); pixSet(gr, p[0], p[1] - 1, 'E'); pixSet(gr, p[0] - 1, p[1] - 1, 'e'); }
  // a scythe leaning on the right fence from the field side: its foot in the headland, the snath resting on the top rail,
  // painted before the front fences so the rails cross in front of it
  { const p = iso(1.98, 1.3, 0); line(gr, [p[0] - 3, p[1] - 2], [p[0] + 1, p[1] - 13], 'O'); line(gr, [p[0] - 2, p[1] - 2], [p[0] + 2, p[1] - 13], 'v');
    pixStamp(gr, p[0] - 4, p[1] - 15, `
kkkkkkk..
kmMMMMnk.
.kkkkkknk
.......kk
`); }
  fence(gr, 0.02, 1.98, 1.98, 1.98, 0.92); fence(gr, 1.98, 1.98, 1.98, 0.02, 0.08);  // front edges, gap at the near corner
  // a water bucket by the gate
  { const p = iso(1.8, 1.98, 0); pixStamp(gr, Math.round(p[0]) - 2, Math.round(p[1]) - 4, `
.kkkk.
kMnnMk
kwwwvk
kwwvvk
.kkkk.
`); }
  outline(gr, ch => ('efEF'.includes(ch) ? 'X' : 'wvO'.includes(ch) ? 'K' : 'k'));   // fence wood gets a wood-brown line, not ink, so thin rails stay light
  return pixText(gr);
}

export default {
  id: 'farm', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8b6a3a', E: '#a3803f', f: '#755830', F: '#5e4526', X: '#4a3520',          // soil: mid, lit ridge, shade, furrow, rim
    c: '#5f9a34', C: '#8fc24a',                                                  // young shoots
    g: '#a89a3a', z: '#a87a12', y: '#e1b12c', Y: '#ffe28a', Z: '#6e4d0a',        // stalk, ear ramp (shared gold)
    w: '#b58f5c', v: '#80603a', O: '#d8bc84', k: '#24180f', K: '#4e3519', m: '#e6eaee', M: '#9aa0a6', n: '#5f656c',                      // rails/posts, cap, ink
  },
  frames: { idle: [0, 1, 2, 3].map(f => build(true, f)), young: [build(false, 0)] },
};
