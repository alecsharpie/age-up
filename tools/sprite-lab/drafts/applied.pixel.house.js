// @pixel house
// House (2×2): Feudal cottage with a close-studded timber frame (sill beam, studs, mid rail, top plate) and daub panels on a stone
// plinth, hipped thatch roof in layered strands with a bound ridge, stone chimney with a cap course, a team-colour plank door and
// a casement window with team shutters laid out in wall space (they slant with their walls), a log pile by the front corner.
// Generated: kit faces + local texture routines (courses, thatch, selective ink outline). Anchor = footprint bottom corner.
// idle: 6 frames — chimney smoke rises and drifts, the hearth glow in the window flickers. Drawn by drafts/building.house.js.
// ---- local texture kit (deterministic) ----
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const copy = g => g.map(r => r.slice());
/** Replace every cell holding one of `chs` by fn(x,y,ch) (null keeps it). */
const paint = (g, chs, fn) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (chs.includes(g[y][x])) { const c = fn(x, y, g[y][x]); if (c) g[y][x] = c; } };
/** Courses on a face whose rows run with slope s (+0.5 down-right, -0.5 up-right, 0 flat): rows of height h, blocks of width w
 *  staggered by half a block, 1-px joint under each row, optional lit lip on top of each row, block tones picked per block.
 *  o.flip: the face slopes away from the viewer (a back roof slope), so downhill is up the screen and the joint/lip swap ends. */
const course = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  if (v >= o.h - 1) return o.joint;
  // o.fall: seams follow a roof's fall line (screen dx per dy, from the ridge down to the eave) instead of the vertical
  const xt = o.fall ? Math.round((x - o.fall * y) / (1 - o.fall * s)) : x;
  const xs = xt + (((row % 2) + 2) % 2) * Math.floor(o.w / 2) + (o.xoff || 0), col = Math.floor(xs / o.w);
  if (o.seam && ((xs % o.w) + o.w) % o.w === 0) return o.seam;
  if (o.lip && v < 1) return o.lip;
  return o.tones[Math.floor(hash(col + 17, row + 91) * o.tones.length)];
};
/** Thatch: layered bands (slope s, height h) of short vertical strands; the bottom of every band is the shaded underside.
 *  o.flip: a back slope (downhill is up the screen), so the shaded underside is at the top of every band. */
const thatch = (x, y, s, o) => {
  const u = y - s * x + (o.off || 0), row = Math.floor(u / o.h), v0 = u - row * o.h, v = o.flip ? o.h - 1 - v0 : v0;
  const hx = hash(x + 5, row + 3);
  if (v >= o.h - 1 - (hx < 0.3 ? 1 : 0)) return o.under;
  return o.tones[Math.floor(hash(x >> 1, row * 7 + 1) * o.tones.length)];
};
/** Selective ink outline: every solid cell touching transparency becomes ink, except on upper-left edges where `sel` maps the
 *  material to its shade tone (so the lit side is not stickered). */
const outline = (g, ink, sel = {}) => {
  const H = g.length, W = g[0].length, o = copy(g); const sol = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] !== '.';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!sol(x, y)) continue; const l = !sol(x - 1, y), r = !sol(x + 1, y), u = !sol(x, y - 1), d = !sol(x, y + 1);
    if (!(l || r || u || d)) continue;
    o[y][x] = (!r && !d && sel[g[y][x]]) ? sel[g[y][x]] : ink;
  }
  return o;
};
const line = (g, a, b, ch, dy = 0) => pixLine(g, a[0], a[1] + dy, b[0], b[1] + dy, ch);
/** height above the base line of an iso wall from a to b (a.x < b.x) at (x,y) */
const wallH = (a, b, x, y) => (a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])) - y;
/** Ground-plane paving (floors, yards, plinth tops): flagstones on the 2:1 iso grid, so every joint runs along one of the two
 *  ground axes and the floor reads as lying flat. o.a: stone size across the down-right rows, o.b: along them (both in px of
 *  screen height), rows staggered by half a stone; o.joint: joint colour; o.lip: optional lit edge just past each joint;
 *  o.tones: per-stone tones; o.ox/o.oy: grid origin. */
const pave = (x, y, o) => {
  const X = x - (o.ox || 0), Y = y - (o.oy || 0), a = Y - X / 2, b = Y + X / 2;
  const ra = Math.floor(a / o.a), bb = b + (((ra % 2) + 2) % 2) * Math.floor(o.b / 2), rb = Math.floor(bb / o.b);
  const va = a - ra * o.a, vb = bb - rb * o.b;
  if (va < 1 || vb < 1) return o.joint;
  if (o.lip && (va < 2 || vb < 2)) return o.lip;
  return o.tones[Math.floor(hash(ra + 31, rb + 7) * o.tones.length)];
};
/** pixStamp on an iso wall: each column of the template drops by slope × its distance from the centre column, so a door,
 *  window, banner or emblem lies flat on a wall whose eave runs with that slope (+0.5 lit left face, -0.5 shaded right face). */
const stampOn = (g, x, y, tpl, slope) => {
  const rows = tpl.replace(/^\n+|\n+$/g, '').split('\n'), w = Math.max(...rows.map(r => r.length)), c = (w - 1) / 2;
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') pixSet(g, x + xx, y + yy + Math.round(slope * (xx - c) + 1e-9), r[xx]); });
};
/** A round window on an iso wall: fn(dx, dy) in wall units (dx along the wall, dy up it) for each cell of an R-radius disc
 *  that the wall's slope shears and the iso view narrows (0.9). */
const discOn = (g, cx, cy, R, slope, fn) => {
  for (let y = -R - 3; y <= R + 3; y++) for (let x = -R - 1; x <= R + 1; x++) { const u = x / 0.9, v = y - slope * x; if (Math.hypot(u, v) > R + 0.4) continue;
    const c = fn(u, v); if (c) pixSet(g, cx + x, cy + y, c); }
};


const W = 2, H = 2, Z = 20, ROOF = 24, PL = 3;
// canvas kept at its old size (it was sized for Z 16): the taller walls use the headroom over the ridge
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 40 + 14;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);

// ---- walls: stone plinth, close-studded timber frame (sill beam, studs, mid rail, top plate) with daub panels.
// Every opening is laid out in wall space (u along the wall from its left end, h height above the base line), so windows,
// doors, rails and straps follow the wall's iso slope instead of being upright screen rectangles.
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'l', right: 'r' });
const B = top.base;
const RAIL = 8, PLATE = 14; // the thatch eave hangs to about h 16, so the top plate sits just under it
const wallUV = (a, b, x, y) => [x - a[0], Math.floor(wallH(a, b, x + 0.5, y + 0.5))];
// lit wall (L -> Bm): back corner post, studs, the window panel between 22 and 37, front corner post
const LW = { a: B.L, b: B.Bm, studs: [0, 11, 22, 37, 49, 62], win: { u0: 24, u1: 36, h0: 6, h1: PLATE } };
// shaded wall (Bm -> Rr): front corner post, the door panel between 13 and 27, studs, back corner post
const RW = { a: B.Bm, b: B.Rr, studs: [0, 13, 27, 39, 51, 62], door: { u0: 15, u1: 25, h0: PL, h1: PLATE } };
const wallCell = (wl, lit, x, y) => {
  const [u, h] = wallUV(wl.a, wl.b, x, y);
  const T1 = lit ? 't' : 'u', T2 = lit ? 'u' : 'v', P = lit ? 'l' : 'r', Pm = lit ? 'm' : 's', Sh = lit ? 'h' : 'H';
  const win = wl.win, dr = wl.door;
  if (win && u >= win.u0 && u <= win.u1 && h >= win.h0 && h <= win.h1) {
    // casement window: open team shutters flat against the wall either side, dark frame, firelit panes, centre mullion
    const su = u - win.u0, n = win.u1 - win.u0;
    if (h === win.h0) return su <= 1 || su >= n - 1 ? (su === 0 || su === n ? T2 : 'Q') : (su === 2 ? 'S' : (su === n - 2 ? 'q' : 'S')); // stone sill
    if (su <= 2 || su >= n - 2) { const e = su <= 2 ? su : n - su; return h === win.h1 || h === win.h0 + 1 ? 'D' : (e === 0 ? 'D' : (e === 2 ? 'L' : 'T')); }
    if (su === 3 || su === n - 3 || h === win.h0 + 1 || h === win.h1) return 'v';
    if (su === Math.round(n / 2)) return 'v';
    return h === win.h1 - 1 ? 'w' : ((su === 5 && h === win.h0 + 2) ? 'G' : 'g');
  }
  if (dr && u >= dr.u0 && u <= dr.u1 && h >= dr.h0 - 1 && h <= dr.h1) {
    // plank door in team colour: frame, lintel, vertical boards, two iron straps running with the wall, stone step
    const su = u - dr.u0, n = dr.u1 - dr.u0;
    if (h < dr.h0) return su === 0 || su === n ? null : 'S';
    if (h >= dr.h1 - 1) return h === dr.h1 ? 'u' : 'v';
    if (su === 0 || su === n) return 'v';
    if (h === dr.h0 + 2 || h === dr.h1 - 4) return 'k';
    if (su === 1) return 'L';
    if (su === n - 1) return 'D';
    if (su % 3 === 1) return 'D';
    return (su === n - 2 && h === dr.h0 + 5) ? 'k' : 'T';
  }
  if (h < PL) return null; // plinth, painted separately
  for (const s of wl.studs) if (u >= s && u <= s + 1) return u === s ? T1 : T2;
  if (h === PL || h === PL + 1) return h === PL + 1 ? T1 : T2;            // sill beam
  if (h === RAIL || h === RAIL - 1) return h === RAIL ? T1 : T2;          // mid rail
  if (h === PLATE || h === PLATE + 1) return h === PLATE + 1 ? T1 : T2;   // top plate
  if (h > PLATE + 1) return Sh;                                           // eave shadow
  if (h === PLATE - 1) return Pm;                                         // shadow under the plate
  // daub: weathered in soft clusters (a splash stain above the sill, a few patches), never per-pixel noise
  if (h === PL + 2 && hash(u >> 2, 7) < 0.6) return Pm;
  const pn = wl.studs.findIndex(s => s > u), cl = hash(pn * 3 + (h > RAIL ? 1 : 0), lit ? 5 : 9);
  if (cl < 0.35 && Math.abs(u - (wl.studs[pn - 1] || 0) - 5) + Math.abs(h - (h > RAIL ? 11 : 6)) * 2 < 4) return Pm;
  return P;
};
paint(g, 'l', (x, y) => { const h = wallH(B.L, B.Bm, x, y); return h < PL ? course(x, y, 0.5, { h: 3, w: 6, joint: 'j', tones: ['S', 'q', 'S'], lip: 'S' }) : null; });
paint(g, 'r', (x, y) => { const h = wallH(B.Bm, B.Rr, x, y); return h < PL ? course(x, y, -0.5, { h: 3, w: 6, joint: 'j', tones: ['q', 'Q', 'q'], lip: 'q' }) : null; });
{ const o = copy(g);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (o[y][x] === 'l') { const c = wallCell(LW, true, x, y); if (c) g[y][x] = c; }
    else if (o[y][x] === 'r') { const c = wallCell(RW, false, x, y); if (c) g[y][x] = c; }
  } }
// a log pile on the ground against the lit wall, near the front corner
pixStamp(g, B.Bm[0] - 26, B.Bm[1] - 14, `
...kkkk..kkkk..
..kNnnnkkNnnnk.
..knnyntknnyntk
.kkkkkkkkkkkkkk
kNnnnkkNnnnkkk.
knnyntknnyntk..
.kkkkkkkkkkkk..
`);

// ---- roof: hipped thatch overhanging the walls, layered strands, dark eave, bound ridge
const OV = 1, DROP = 2;
const R = { L: [top.L[0] - OV, top.L[1] + DROP], Bm: [top.Bm[0], top.Bm[1] + DROP + 1], Rr: [top.Rr[0] + OV, top.Rr[1] + DROP], T: [top.T[0], top.T[1] - 1] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '2', left: '3', front: '4', right: '5' });
paint(g, '3', (x, y) => thatch(x, y, -0.5, { h: 5, under: 'f', tones: ['1', 'A', 'A', 'A', 'A', 'f'], flip: true }));   // back slopes: flip
paint(g, '4', (x, y) => thatch(x, y, 0.5, { h: 5, under: 'a', tones: ['A', 'f', 'f', 'f', 'b'] }));
paint(g, '2', (x, y) => thatch(x, y, 0.5, { h: 5, under: 'c', tones: ['b', 'a', 'a', 'a'], flip: true }));
paint(g, '5', (x, y) => thatch(x, y, -0.5, { h: 5, under: 'd', tones: ['a', 'c', 'c', 'c'] }));
// eaves: a thick trimmed edge, darker on the shaded side
line(g, R.L, R.Bm, 'c', 0); line(g, R.L, R.Bm, 'e', 1); line(g, R.Bm, R.Rr, 'd', 0); line(g, R.Bm, R.Rr, 'e', 1);
// hips: a light rib on the lit side, a dark crease on the shaded side
line(g, R.L, ap, 'f'); line(g, R.L, ap, 'c', 1); line(g, R.Bm, ap, 'e'); line(g, [R.Bm[0] - 1, R.Bm[1]], [ap[0] - 1, ap[1]], 'f'); line(g, R.Rr, ap, 'd');
line(g, R.T, ap, 'b');
// bound ridge cap at the apex
pixStamp(g, ap[0] - 3, ap[1] - 2, `
.kkkkk.
k1fAAck
kebbbek
.kkkkk.
`);
// chimney: stone stack in courses on the shaded slope, sooty cap. The slope falls toward the Bm-Rr eave, i.e. along the stack's
// L->Bm edge, so the roof stands ROOF*0.24 px higher at its L corner than at Bm: the left face's foot follows the slope (cells
// below it are thatch in front of the stack, restored from `underCh`) with a dark seam where stone meets thatch.
const ch = lerp(lerp(R.Bm, R.Rr, 0.66), ap, 0.42);
const underCh = copy(g);
const chTop = pixIsoBox(g, ch[0], ch[1], 0.24, 0.24, 14, 1, { top: 'j', left: '6', right: '7' });
paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'Q', tones: ['S', 'q'] }));
paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'j', tones: ['q', 'Q'] }));
pixRect(g, chTop.T[0] - 1, chTop.T[1] + 1, 4, 2, 'k');
// cap stones: the top course of each face is a lit band, its joint running with that face (no flat screen-horizontal line)
{ const capL = (x, y) => y - (chTop.L[1] + (x - chTop.L[0]) * 0.5), capR = (x, y) => y - (chTop.Bm[1] - (x - chTop.Bm[0]) * 0.5);
  for (let y = 0; y < GH; y++) for (let x = Math.floor(chTop.L[0]); x <= Math.ceil(chTop.Rr[0]); x++) {
    const left = x + 0.5 < chTop.Bm[0], d = left ? capL(x + 0.5, y + 0.5) : capR(x + 0.5, y + 0.5);
    if (!['S', 'q', 'Q', 'j'].includes(g[y][x]) || d < 0 || d > 3) continue;
    g[y][x] = d < 2 ? (left ? 'S' : 'q') : (left ? 'Q' : 'j');
  } }
{ const rise = ROOF * 0.24, cL = ch[0] - 0.24 * 32;
  const hid = (x, y) => { const cx = x + 0.5, d = ch[0] - cx; return d > 0 && y + 0.5 > ch[1] - d * 0.5 - rise * d / (ch[0] - cL); };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underCh[y][x] && hid(x, y)) g[y][x] = underCh[y][x];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underCh[y][x] && !hid(x, y) && hid(x, y + 1)) g[y][x] = 'j'; }

const base = outline(g, 'k', { '1': 'A', 'f': 'A', l: 'm', S: 'q' });

// ---- idle: 6 frames — chimney smoke curls up and drifts right, the window glow flickers
const sx = Math.round(chTop.T[0]), sy = Math.round(chTop.T[1]);
const puff = (f, x, y, r) => { // a soft round puff: light top-left, grey bottom-right
  if (r === 0) { pixRect(f, x, y, 2, 2, 'x'); pixSet(f, x, y, 'z'); return; }
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + r * 0.6) continue; pixSet(f, x + xx, y + yy, (xx + yy < 0) ? 'z' : (xx + yy > r ? 'X' : 'x')); }
};
const glow = []; base.forEach((r, y) => r.forEach((c, x) => { if (c === 'g' || c === 'G') glow.push([x, y]); }));
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  for (let k = 0; k < 4; k++) { // puffs born at the chimney, rise 4 px per frame
    const t = ((i + k * 1.5) % 6) / 6, rise = 2 + t * 22;
    const r = t < 0.2 ? 0 : t < 0.75 ? 2 : 1;
    puff(f, sx + Math.round(Math.sin(t * 5) * 1.5 + t * 9), sy - Math.round(rise), r);
  }
  const fl = [0, 1, 0, 2, 1, 0][i]; // flicker: glow core moves / dims
  if (fl) glow.forEach(([x, y], k) => { if ((k + fl) % 3 === 0) f[y][x] = base[y][x] === 'G' ? 'g' : 'G'; });
  frames.push(pixText(f));
}

export default {
  id: 'house', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f',                                                         // ink
    l: '#e8dcc0', m: '#d6c49c', h: '#a8946e',                             // daub lit wall: lit / mid / eave shadow
    r: '#b8a582', s: '#a6926c', H: '#7e6c4e',                             // daub shaded wall
    t: '#8a6a3a', u: '#5a3a18', v: '#3b2614',                             // timber light / mid / deep
    S: '#a39a8c', q: '#8d8478', Q: '#6f6a60', j: '#4f4a42',               // stone lit / mid / shade / mortar
    '1': '#f2d488', A: '#dcb056', f: '#c99a44', b: '#b8873a', a: '#9c7230', c: '#80592a', d: '#5f4220', e: '#3e2a14', // thatch
    w: '#3a2414', g: '#e89a3a', G: '#ffd36a',                             // window recess / firelight
    N: '#c09a62', n: '#8a6a3a', y: '#5a3a18',                             // log ends
    z: '#e4e0da', x: '#c4beb8', X: '#948e88',                             // smoke
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
