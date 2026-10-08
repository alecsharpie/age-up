// Grid painting kit for the ship sprites. Grids: arrays of rows of chars, '.' empty.
import fs from 'fs';
export const W = 36, H = 36, WL = 35; // bottom row = waterline row

export const PAL = {
  o: '#24180f',                       // ink
  w: '#a07a4a', m: '#8a6a3a', s: '#5a3a18', d: '#3b2614', // wood
  T: 'team', D: 'teamdark', L: 'teamlight',
  c: '#efe6d2', n: '#d9c7a0', N: '#a8946e',              // linen
  e: '#e6eaee', i: '#9aa0a6', I: '#5f656c', Q: '#1e2a33', // steel
  k: '#e8c39e', K: '#c9a07a', h: '#5a3a1a',               // skin, hair
  f: '#eef6f6', F: '#a8d0d8', u: '#2a4a64',               // foam, foam shade, water shadow
  y: '#fff2a0', Y: '#ffd04a', r: '#ff8c2a', R: '#c8401a', // fire
  g: '#9a9690', G: '#66625e',                             // smoke
  b: '#e1b12c', B: '#a87a12',                             // gold
};
// outline: material → [lit-edge char, dark-edge char]; chars not listed are not outlined
const MAT = { w: 'wood', m: 'wood', s: 'wood', d: 'wood', T: 'team', L: 'team', D: 'team', c: 'lin', n: 'lin', N: 'lin', e: 'steel', i: 'steel', I: 'steel', b: 'gold', B: 'gold' };
const EDGE = { wood: ['s', 'o'], team: ['D', 'o'], lin: ['N', 'o'], steel: ['I', 'Q'], gold: ['B', 'o'] };

export const grid = () => Array.from({ length: H }, () => Array(W).fill('.'));
export const clone = g => g.map(r => r.slice());
export function set(g, x, y, ch) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; }
export function get(g, x, y) { x = Math.round(x); y = Math.round(y); return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function rect(g, x, y, w, h, ch) { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) set(g, x + xx, y + yy, ch); }
export function line(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { set(g, x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
export function poly(g, pts, ch) {
  const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(g.length - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(g[0].length - 1, Math.floor(xs[k + 1] - 0.5)); x++) g[y][x] = ch;
  }
}
/** stamp a multi-line string; '.' transparent; top-left at x,y */
export function stamp(g, x, y, text) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') set(g, x + xx, y + yy, r[xx]); }); }
/** recolour cells of char `from` inside predicate */
export function recolour(g, fn) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { const c = fn(g[y][x], x, y); if (c) g[y][x] = c; } }

/** selective outline: recolour outline-able edge cells. dark on bottom/right-facing edges, material shade on lit top/left-only edges. */
export function outline(g, opts = {}) {
  const src = clone(g); const solid = (x, y) => get(src, x, y) !== '.';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = src[y][x]; const mat = MAT[ch]; if (!mat) continue;
    if (opts.skip && opts.skip(x, y, ch)) continue;
    const up = !solid(x, y - 1), dn = !solid(x, y + 1), lf = !solid(x - 1, y), rt = !solid(x + 1, y);
    if (!(up || dn || lf || rt)) continue;
    const [lit, dark] = EDGE[mat];
    g[y][x] = (dn || rt) ? dark : lit;
  }
  return g;
}
/** paste src onto dst (non-empty cells) with offset */
export function over(dst, src, dx = 0, dy = 0) { for (let y = 0; y < src.length; y++) for (let x = 0; x < src[0].length; x++) if (src[y][x] !== '.') set(dst, x + dx, y + dy, src[y][x]); return dst; }
/** nearest-neighbour rotate about (cx,cy), degrees (positive = clockwise on screen) */
export function rotate(g, deg, cx, cy) {
  const a = -deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); const o = grid();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy; const sx = c * px - s * py + cx - 0.5, sy = s * px + c * py + cy - 0.5;
    o[y][x] = get(g, Math.round(sx), Math.round(sy));
  }
  return o;
}
export function shift(g, dx, dy) { const o = grid(); over(o, g, dx, dy); return o; }
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';

/** remove isolated single cells (no 8-neighbours) except listed chars */
export function despeckle(g, keep = '') {
  const src = clone(g);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (src[y][x] === '.' || keep.includes(src[y][x])) continue; let n = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && get(src, x + i, y + j) !== '.') n++;
    if (!n) g[y][x] = '.';
  }
  return g;
}

/** write a pixel draft file */
export function writeDraft(file, { id, header, frames, fps, anchors }) {
  const used = new Set(); for (const L of Object.values(frames)) for (const g of L) for (const ch of g) if (ch !== '.' && ch !== '\n') used.add(ch);
  const pal = Object.keys(PAL).filter(k => used.has(k)).map(k => `${k}: ${JSON.stringify(PAL[k]).replace(/"/g, "'")}`).join(', ');
  // dedupe identical grids into consts so holds stay readable
  const consts = []; const names = new Map();
  const ref = (set, g, k) => { if (names.has(g)) return names.get(g); const nm = `${set}${k}`; names.set(g, nm); consts.push(`const ${nm} = \`${g}\`;`); return nm; };
  const fr = Object.entries(frames).map(([set, L]) => `    ${set}: [${L.map((g, k) => ref(set, g, k)).join(', ')}],`).join('\n');
  let s = `// @pixel ${id}\n${header.map(l => '// ' + l).join('\n')}\n${consts.join('\n')}\nexport default {\n  id: '${id}', anchor: [18, 36],\n`;
  if (fps) s += `  fps: ${JSON.stringify(fps).replace(/"/g, '')},\n`;
  if (anchors) s += `  anchors: ${JSON.stringify(anchors).replace(/"/g, '')},\n`;
  s += `  palette: { ${pal} },\n  frames: {\n${fr}\n  },\n};\n`;
  fs.writeFileSync(file, s);
}

// ---------- shared ship pieces ----------
/** waterline foam lapping a hull spanning [x0,x1] at row WL, phase p; plus a 1px dark water line under */
export function lap(g, x0, x1, p) {
  for (let x = x0; x <= x1; x++) { if (get(g, x, WL) !== '.') set(g, x, WL, ((x + p) % 6 < 2) ? 'F' : 'u'); }
  // foam curls just outside the hull ends
  const k = p % 2; set(g, x0 - 1, WL, k ? 'f' : 'F'); set(g, x0 - 2, WL, 'F'); set(g, x1 + 1, WL, k ? 'F' : 'f'); if (k) set(g, x1 + 2, WL, 'F');
}
/** bow wave + wake for moving frames. bx = bow x, sx = stern x, p = phase 0..n */
export function wake(g, bx, sx, p) {
  // bow wave: a crest that rises and falls
  const hgt = [2, 3, 2, 1][p % 4];
  for (let j = 0; j < hgt; j++) { set(g, bx + 1 + j, WL - j, 'f'); set(g, bx + 2 + j, WL - j, j === hgt - 1 ? 'F' : 'f'); }
  set(g, bx + 1, WL - 1, hgt > 1 ? 'F' : '.');
  // wake: dashes trailing behind the stern, scrolling left
  for (let k = 0; k < 3; k++) { const x = sx - 2 - ((p * 2 + k * 5) % 12); set(g, x, WL, 'f'); set(g, x - 1, WL, 'F'); }
  for (let k = 0; k < 2; k++) { const x = sx - 1 - ((p * 2 + k * 6 + 3) % 10); if (get(g, x, WL - 1) === '.') { set(g, x, WL - 1, 'F'); set(g, x - 1, WL - 1, 'F'); } }
}
/** a crew figure (3 tall): hair, face, team body; facing right. x = left col */
export function crew(g, x, y, opts = {}) {
  set(g, x, y, 'h'); set(g, x + 1, y, 'h');
  set(g, x, y + 1, 'K'); set(g, x + 1, y + 1, 'k');
  set(g, x, y + 2, 'D'); set(g, x + 1, y + 2, 'T');
  if (opts.tall) { set(g, x, y + 3, 'D'); set(g, x + 1, y + 3, 'T'); }
}
/** pennant on a masthead at (x,y) flying right; phase p (3 shapes) */
export function pennant(g, x, y, p) {
  const S = [`TTTT\nDT..`, `TTT.\nDTT.`, `TTTT\nTD..`][p % 3];
  stamp(g, x, y, S);
  if (p % 3 === 1) set(g, x + 3, y + 1, 'D');
}
/** sinking sequence from a full ship grid (no foam). returns frames */
export function sinking(ship, opts) {
  const { cx, hull0, hull1, flot } = opts; const out = [];
  // [angle, sink rows]
  const steps = opts.steps || [[0, 0, 'hit'], [-5, 1], [-10, 3], [-14, 6], [-18, 11], [-20, 17], [-22, 25], [0, 99, 'flot']];
  steps.forEach(([ang, sink, tag], k) => {
    let g;
    if (tag === 'flot') { g = grid(); flot(g); out.push(g); return; }
    g = rotate(ship, ang, cx, WL);
    g = shift(g, 0, sink);
    // cut below waterline is automatic (out of grid). foam ring where the hull meets the water
    let xs = []; for (let x = 0; x < W; x++) if (g[WL][x] !== '.') xs.push(x);
    if (xs.length) { const a = xs[0], b = xs[xs.length - 1]; for (let x = a; x <= b; x++) set(g, x, WL, (x + k) % 3 ? 'u' : 'F'); set(g, a - 1, WL, 'f'); set(g, a - 2, WL, 'F'); set(g, b + 1, WL, 'f'); set(g, b + 2, WL, 'F'); }
    if (tag === 'hit' && opts.hit) opts.hit(g);
    if (sink >= 6) { // bubbles + spray rising alongside
      const bx = [cx - 6, cx + 4, cx + 9];
      for (let j = 0; j < bx.length; j++) { const yy = WL - 2 - ((k + j * 2) % 4); stamp(g, bx[j] + (k % 2), yy, 'f\nF'); }
    }
    if (opts.debris) opts.debris(g, k, sink);
    out.push(g);
  });
  return out;
}
