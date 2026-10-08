import { grid, set, get, text, emit } from './lib.mjs';
import fs from 'fs';
const W = 16, H = 28, AX = 8, N = 8;
// flame: union of tongues (teardrops) whose heights flicker on a loop of N frames; colour by depth inside the flame
function flame(g, f, big) {
  const base = H - 1, T = 2 * Math.PI * f / N;
  // [dx, height, half-width, phase]: a broad body plus licking tongues; heights and sway are periodic in f
  const tongues = big
    ? [[0, 11, 5.0, 0.0], [-3, 15, 2.4, 1.3], [1, 20, 2.6, 3.0], [4, 14, 2.0, 4.6], [-4, 10, 1.7, 2.2]]
    : [[0, 7, 3.6, 0.0], [-1, 11, 1.9, 2.0], [2, 9, 1.5, 4.2]];
  const field = Array.from({ length: H }, () => Array(W).fill(0));
  for (const [dx, h0, w0, ph] of tongues) {
    const h = h0 * (0.82 + 0.18 * Math.sin(T + ph)), sway = Math.sin(T + ph * 1.7) * (big ? 1.4 : 0.9);
    for (let y = 0; y < h; y++) {
      const t = y / h;                                                      // 0 at the base, 1 at the tip
      const w = w0 * (t < 0.25 ? 0.8 + t * 0.8 : 1 - (t - 0.25) / 0.75 * 0.92);
      const cx = AX + dx + sway * t * t - 0.5;
      for (let x = 0; x < W; x++) { const d = Math.abs(x + 0.5 - cx) / Math.max(0.4, w); if (d < 1) field[base - y][x] = Math.max(field[base - y][x], (1 - d * d) * Math.pow(1 - t, 0.7)); }
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = field[y][x]; if (v <= 0.04) continue;
    const c = v > (big ? 0.8 : 0.72) ? 'W' : v > 0.55 ? 'Y' : v > 0.38 ? 'y' : v > 0.22 ? 'O' : v > 0.1 ? 'r' : 'R';
    set(g, x, y, c);
  }
  // embers flying up, looping
  const em = big ? [[-3, 0.0], [3, 0.5]] : [[2, 0.3]];
  for (const [dx, ph] of em) { const p = ((f / N) + ph) % 1, y = Math.round(H - 1 - (big ? 12 : 7) - p * (big ? 9 : 5)), x = Math.round(AX + dx + Math.sin(p * 6 + dx) * 1.5); if (get(g, x, y) === '.' && p < 0.75) { set(g, x, y, p < 0.4 ? 'e' : 'r'); } }
}
// smoke: a column of overlapping puffs; each loop every puff climbs exactly one slot, so the column scrolls seamlessly.
// Drawn first (behind the flame), lit from the upper-left, with a light outline in the darkest grey
function smoke(g, f, big) {
  const n = big ? 6 : 4, top = big ? 1 : 9, start = big ? H - 14 : H - 8;
  for (let k = n - 1; k >= 0; k--) {
    const p = (k + f / N) / n, cy = start - p * (start - top), r = (big ? 1.7 : 0.8) + p * (big ? 2.6 : 1.2), cx = AX + 0.5 + Math.sin(p * 4.5) * (big ? 1.2 : 1.0) + p * (big ? 2 : 1.5);
    if (!big && p > 0.92) continue;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy) / r; if (d > 1) continue;
      const lit = (-dx - dy) / r + (big ? p * 0.5 : p * 0.9);
      const c = big ? (lit > 1.1 ? 's' : lit > 0.45 ? 'S' : 'k') : (lit > 0.45 ? 's' : 'S');
      set(g, x, y, c);
    }
  }
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(g, x, y) === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => 'sSk'.includes(get(g, x + a, y + b)) && get(g, x + a, y + b) !== '.')) add.push([x, y]);
  for (const [x, y] of add) set(g, x, y, big ? 'q' : 'k');
}
function frame(f, big) { const g = grid(W, H); smoke(g, f, big); flame(g, f, big); return text(g); }
const spec = {
  id: 'fire', anchor: [AX, H],
  palette: {
    W: ['#fffbe0', 'white-hot core'], Y: ['#ffe060', 'yellow'], y: ['#ffb020', 'amber'], O: ['#f07818', 'orange'], r: ['#d0401a', 'red'], R: ['#8a2012', 'deep red tips'], e: ['#ffd040', 'ember'],
    s: ['#9a948e', 'smoke light'], S: ['#6a6460', 'smoke'], k: ['#46403e', 'dark smoke / smoke outline'], q: ['#2e2a2a', 'big-smoke outline'],
  },
  frames: { idle: [...Array(N)].map((_, f) => frame(f, false)), big: [...Array(N)].map((_, f) => frame(f, true)) },
};
fs.writeFileSync('pixel.fire.json', JSON.stringify(spec));
fs.writeFileSync(process.argv[2], emit('fire', ['Fire on damaged buildings (new effect). The game draws pixDraw(PIXELS.fire, \'idle\'|\'big\', G.time*10+k*3, null, x, y) with the anchor at the flame base.',
  'idle = small flame (~8×12) with a grey smoke wisp; big = a larger blaze (~14×20) with dark smoke rolling up. 8 frames each, looping seamlessly',
  '(tongue heights, sway, embers and smoke puffs are all periodic in the frame number). White-hot core → yellow → orange → red → deep-red tips;',
  'the smoke is lit from the upper-left and lightly outlined, the flame is not. 16×28, anchor [8,28]. Composed by a script, emitted as literal grids.'], spec));
