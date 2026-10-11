// @pixel siege
// Siege Workshop (3×3): a big timber workshop along the back-left edge — plank end wall with a team banner, shingle
// gable roof, an open bay showing a workbench, tools on the back wall and a glowing brazier. In the yard: a sheer-leg
// A-frame crane with a windlass and a beam swinging on its hook, a half-built mangonel (one wheel still missing),
// spoked wheels stacked and one leaning on the shed, a log pile under a team-colour tarp, a sawhorse in wood chips.
// Generated (code before export); anchor = footprint bottom corner. idle: 4 frames — the crane hook and its load sway,
// the brazier flickers.
//   Castle   (as above) the timber workshop under brown shingles with the sheer-leg crane.
//   Imperial a taller limestone workshop: an arcade of limestone piers and round arches across the open bay with a gilt
//            string course, a limestone end wall with pilasters and an arched, iron-banded double door under a gilt keystone,
//            an oculus in the gable, a blue slate roof with gilt cresting and an orb finial, a gilt-fringed banner; in the
//            yard a big timber-and-iron gantry crane (two braced trestles, an iron-strapped beam, a trolley whose hook and
//            load sway) with gilt caps.
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 56 + (AGE === 3 ? 12 : 0);
const bx = W * 32 + 2, by = GH - 4, OY = by - 148;               // OY: extra headroom of the taller age (fixed coordinates shift by it)
const IMP = AGE === 3, { R: AR, S: AS, Au, Fe, Gl, DEEP } = AK;
// ---- local texture kit (needs GW, GH, by) ----
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const P = (p, dx = 0, dy = 0) => [p[0] + dx, p[1] + dy];
const hash = (x, y, s = 0) => { let h = Math.imul((x | 0) + 7919 * s, 374761393) ^ Math.imul((y | 0) - 104729 * s, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// smooth value noise on a lattice of `sc` cells (for clustered ground patches, never per-pixel noise)
const vnoise = (x, y, sc, s) => { const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0; const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s); const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
/** cells whose centre lies inside the polygon (same rule as pixPoly) */
function cells(pts) {
  const out = []; const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(GH - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [qx, qy] = pts[(i + 1) % pts.length]; if ((ay <= cy && qy > cy) || (qy <= cy && ay > cy)) xs.push(ax + (cy - ay) / (qy - ay) * (qx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(GW - 1, Math.floor(xs[k + 1] - 0.5)); x++) out.push([x, y]);
  }
  return out;
}
const put = (g, x, y, ch) => { if (ch && y >= 0 && y < GH && x >= 0 && x < GW) g[y][x] = ch; };
/** vertical wall face whose top edge runs A→B, z cells tall. fn(a, v, u, x, y): a = columns from A, v = rows below the top edge. */
function wall(g, A, B, z, fn) {
  const a0 = Math.floor(A[0]);
  for (const [x, y] of cells([A, B, P(B, 0, z), P(A, 0, z)])) { const u = Math.max(0, Math.min(1, (x + 0.5 - A[0]) / (B[0] - A[0]))); const ty = A[1] + u * (B[1] - A[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(y + 0.5 - ty)), u, x, y)); }
}
/** sloped plane (roof): fn(a, d, u, x, y) with d = rows above the eave line E0→E1, a = columns from E0.
 *  flip: the plane slopes away from the viewer (a back roof slope whose eave sits above its ridge on screen), so downhill is
 *  up the screen and d counts rows *below* the eave instead; course helpers like tiles() then lap the right way. */
function plane(g, pts, E0, E1, fn, flip = false) {
  const a0 = Math.floor(E0[0]);
  for (const [x, y] of cells(pts)) { const u = (x + 0.5 - E0[0]) / (E1[0] - E0[0]); const ey = E0[1] + u * (E1[1] - E0[1]); put(g, x, y, fn(x - a0, Math.max(0, Math.floor(flip ? y + 0.5 - ey : ey - y - 0.5)), u, x, y)); }
}
/** coursed ashlar: o = {t:[lit,mid,dark], m:mortar, ch, bw, s, q:[quoinLit,quoinDark]?, qa:[a-ranges at corners], len, ao} */
const stone = o => (a, v, u) => {
  const c = Math.floor(v / o.ch), r = v % o.ch;
  if (o.q && o.len) { const w = c % 2 ? 4 : 7; if (o.qL && a < w || o.qR && a >= o.len - w) { if (r === o.ch - 1 || a === w && o.qL || a === o.len - w && o.qR) return o.m; return r === 0 ? o.q[0] : o.q[1]; } }
  if (r === o.ch - 1) return o.m;
  const off = c % 2 ? (o.bw >> 1) : 0, j = a + off + c * 3;
  if (((j % o.bw) + o.bw) % o.bw === 0) return o.m;
  const t = hash(Math.floor(j / o.bw), c, o.s) + (o.ao ? v / o.ao * 0.3 : 0);
  const k = t < 0.3 ? 0 : t < 0.85 ? 1 : 2;
  return r === 0 ? o.t[Math.max(0, k - 1)] : o.t[k];
};
/** horizontal planks following the face: o = {t:[lit,mid,seam], ph, s, nail} */
const planks = o => (a, v) => { const r = v % o.ph, c = Math.floor(v / o.ph); if (r === o.ph - 1) return o.t[2]; if (o.nail && r === 1 && ((a + c * 5) % 11) === 0) return o.nail; const gr = hash(Math.floor((a + c * 7) / 9), c, o.s); return r === 0 ? o.t[0] : (gr < 0.25 ? o.t[0] : o.t[1]); };
/** vertical boards (doors, sheds): o = {t:[lit,mid,seam], bw} */
const boards = o => (a, v) => { const k = ((a % o.bw) + o.bw) % o.bw; return k === o.bw - 1 ? o.t[2] : k === 0 ? o.t[0] : o.t[1]; };
/** roof courses (tiles / shingles): o = {t:[lip,mid,shadow], ch, tw, s}; lip on the butt edge, shadow cast by the course above */
const tiles = o => (a, d) => { const c = Math.floor(d / o.ch), r = d % o.ch; if (r === o.ch - 1) return o.t[2]; const j = a + (c % 2) * (o.tw >> 1); if (r > 0 && ((j % o.tw) + o.tw) % o.tw === 0) return o.t[2]; if (r === 0) return o.t[0]; return (o.t[3] && hash(Math.floor(j / o.tw), c, o.s) < 0.18) ? o.t[3] : o.t[1]; };
/** outer 1-px ink outline; lit (upper-left) side softer. Pixels of `self` chars are thin props that carry their own dark edge. */
function outline(g, ink, inkLit, self = '') {
  const add = [];
  for (let y = 0; y < Math.min(GH, by); y++) for (let x = 0; x < GW; x++) {
    if (g[y][x] !== '.') continue;
    const sol = (xx, yy) => yy >= 0 && yy < GH && xx >= 0 && xx < GW && g[yy][xx] !== '.' && !self.includes(g[yy][xx]);
    const r = sol(x + 1, y), d = sol(x, y + 1), l = sol(x - 1, y), u = sol(x, y - 1);
    if (r || d || l || u) add.push([x, y, (r || d) && !(l || u) ? inkLit : ink]);
  }
  for (const [x, y, c] of add) g[y][x] = c;
}
const copy = g => g.map(r => r.slice());
/** draw into a fresh layer, ink its outline, composite it: props and masses get their own dark edge inside the silhouette */
function inked(g, draw, ink = 'k', inkLit = 'K', self = '') { const t = pixGrid(GW, GH); draw(t); outline(t, ink, inkLit, self); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (t[y][x] !== '.') g[y][x] = t[y][x]; }
const stampL = (g, x, y, text) => pixStamp(g, Math.round(x), Math.round(y), text);
const g = pixGrid(GW, GH);
const iso = (tx, ty) => [bx + (tx - ty) * 32, by - 98 + (tx + ty) * 16];          // ground point (top of the plinth)
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- yard: packed earth with sawdust drifts and wood chips in clusters
for (const [x, y] of cells([T, Rr, Bm, L])) { const n = vnoise(x, y, 7, 5), s = vnoise(x, y, 4, 13); g[y][x] = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : (s > 0.78 ? 'd' : 'y'); }
for (const [x, y0] of [[150, 96], [153, 98], [147, 99], [120, 126], [123, 128], [90, 118], [172, 106], [60, 124]]) { const y = y0 + OY; g[y][x] = 'e'; g[y][x + 1] = 'E'; }

// ---- spoked wheel, seen at an angle (ellipse): iron tyre, felloe, 8 spokes, hub
function wheel(t, cx, cy, R, sq = 0.72) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = cy - R - 1; y <= cy + R + 1; y++) for (let x = cx - R; x <= cx + R; x++) {
    const dx = (x + 0.5 - cx - 0.5) / sq, dy = y + 0.5 - cy - 0.5, r = Math.hypot(dx, dy);
    if (r > R + 0.2) continue;
    if (r > R - 1.1) put(t, x, y, dx + dy < -2 ? 'S' : 'G');
    else if (r > R - 2.3) put(t, x, y, dx + dy < 0 ? 'W' : 't');
  }
  for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + 0.2; pixLine(t, cx, cy, cx + Math.cos(an) * (R - 2) * sq, cy + Math.sin(an) * (R - 2), k < 4 ? 't' : 'w'); }
  pixSet(t, cx, cy, 'G'); pixSet(t, cx - 1, cy, 'S'); pixSet(t, cx, cy - 1, 'S'); pixSet(t, cx + 1, cy, 'G'); pixSet(t, cx, cy + 1, 'G');
}
// a log lying along the tx axis (end towards the viewer's left), len in cells
function log(t, x, y, len, cap = true) {
  for (let i = 0; i < len; i++) { const xx = x + i, yy = y - Math.floor(i / 2); put(t, xx, yy - 2, 'W'); put(t, xx, yy - 1, 'w'); put(t, xx, yy, 'w'); put(t, xx, yy + 1, 't'); }
  if (cap) stampL(t, x - 2, y - 2, `
.ee.
eEEe
eEhe
.ee.
`);
}

// a log lying on the ground along the ty axis (screen direction (2,-1)): a cylinder of diameter D swept from its near end
// c (the end that faces the viewer, lower-left) for len px of screen x. The cross-section is the ellipse spanned by the
// other ground axis (screen (2,1)) and the vertical, so the end grain is an ellipse leaning down-right, not a circle.
// fn(part, s, b) picks a colour: part 'bark' (s = 0..1 along the log from the near end, b = -1 underside .. 1 top) or 'end'.
function cyl(t, c, D, len, fn) {
  const pg = [D * 0.45, D * 0.225], vt = [0, -D / 2];                       // half cross-section axes (ground, vertical)
  const det = pg[0] * vt[1] - pg[1] * vt[0];
  const at = (x, y, o) => { const dx = x + 0.5 - o[0], dy = y + 0.5 - o[1]; const al = (dx * vt[1] - dy * vt[0]) / det, be = (pg[0] * dy - pg[1] * dx) / det; return [al, be]; };
  const n = Math.ceil(len * 2);
  for (let i = n; i >= 0; i--) {                                             // far end first, so nearer sections cover it
    const sx = len * i / n, o = [c[0] + sx, c[1] - sx / 2], part = i === 0 ? 'end' : 'bark';
    for (let y = Math.floor(o[1] - D); y <= o[1] + D; y++) for (let x = Math.floor(o[0] - D); x <= o[0] + D; x++) {
      const [al, be] = at(x, y, o), r = Math.hypot(al, be); if (r > 1) continue;
      put(t, x, y, part === 'end' ? fn('end', 0, be, r) : fn('bark', sx / len, be, r));
    }
  }
}
const barkCol = (s, b) => b > 0.45 ? 'W' : b < -0.35 ? 't' : 'w';
const endCol = r => r > 0.8 ? 't' : r < 0.32 ? 'E' : 'e';           // bark rim, sapwood, pith

// ---- the workshop
const SZ = IMP ? 26 : 22;
const sh = pixIsoBox(g, 44, 119 + OY, 1.3, 3, SZ, 1, {});
const sb = sh.base;
const mT = lerp(sh.T, sh.Rr, 0.5), mB = lerp(sh.L, sh.Bm, 0.5), RISE = IMP ? 22 : 20;
const r1 = P(mB, 0, -RISE), r2 = P(mT, 0, -RISE);
const GLOW = lerp(sh.Bm, sh.Rr, 0.78);   // brazier spot in the bay, clear of the mangonel in front of it
inked(g, t => {
  // open bay: back wall planks in shadow, tools hanging, workbench, floor
  wall(t, sh.Bm, sh.Rr, SZ, (a, v) => v < 3 ? 'I' : v >= SZ - 2 ? 'Y' : v % 4 === 3 ? 'I' : 'i');
  for (let k = 0; k < 5; k++) { const p = lerp(sh.Bm, sh.Rr, 0.1 + k * 0.08); const x = Math.round(p[0]), y = Math.round(p[1]) + 5 + SZ - 22; pixLine(t, x, y, x, y + 5, 'w'); pixSet(t, x, y, 'S'); if (k % 2) pixSet(t, x + 1, y, 'S'); }
  { const a = P(lerp(sh.Bm, sh.Rr, 0.08), 0, SZ - 22), b = P(lerp(sh.Bm, sh.Rr, 0.46), 0, SZ - 22); pixLine(t, a[0], a[1] + 14, b[0], b[1] + 14, 'W'); pixLine(t, a[0], a[1] + 15, b[0], b[1] + 15, 't');
    for (const k of [0, 1]) { const p = lerp(a, b, k ? 0.92 : 0.08); pixLine(t, p[0], p[1] + 16, p[0], p[1] + 19, 't'); } }
  // posts across the opening
  if (!IMP) {
  for (let k = 0; k <= 6; k++) { const p = lerp(sb.Bm, sb.Rr, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]); pixRect(t, x - 1, y - 23, 1, 23, 'W'); pixRect(t, x, y - 23, 1, 23, 't'); }
  pixLine(t, sh.Bm[0], sh.Bm[1] + 1, sh.Rr[0], sh.Rr[1] + 1, 'W'); pixLine(t, sh.Bm[0], sh.Bm[1] + 2, sh.Rr[0], sh.Rr[1] + 2, 't');  // lintel beam
  } else wall(t, sh.Bm, sh.Rr, SZ, (a, v) => {                                             // limestone arcade across the bay
    const k = Math.floor(a / 16), j = a - k * 16, h = SZ - 1 - v;
    if (v <= 3) return v === 0 ? AS[1] : v === 2 ? Au[2] : AS[2];                          // entablature with a gilt string course
    if (j <= 2 || a >= 94) return j === 0 ? AS[1] : j === 1 ? AS[2] : AS[3];                // piers
    if (h <= 0) return AS[3];
    const c = 9.5, r = 6.5, dh = h - (SZ - 4 - 1 - r); if (dh > 0 && Math.hypot(j - c, dh * 1.2) > r) return Math.hypot(j - c, dh * 1.2) < r + 1.2 ? (j === 9 || j === 10 ? Au[1] : AS[3]) : AS[2];
    return null;
  });
  // lit end wall, timber-framed: corner posts, a wall plate at the eave, a sill on the plinth, board-and-batten cladding
  // (boards vary in tone, weather darker near the ground), a braced double barn door (darker planks) under a header
  const EA = x => x - Math.floor(sh.L[0]), EW = Math.round(sh.Bm[0] - sh.L[0]);
  const board = (a, v) => { const k = (((a + 2) % 4) + 4) % 4; return k === 3 ? 't' : k === 0 ? 'W' : 'w'; };
  const DL = 9, DR = 29, DM = 19, DT = 6;                                      // door jambs, centre seam, head
  if (IMP) wall(t, sh.L, sh.Bm, SZ, (a, v) => {                                          // limestone end wall, arched iron-banded doors
    const h = SZ - 1 - v, su = a - 9, n = 20, top = 17;
    if (su >= 0 && su <= n && h <= top) { const c = n / 2, dh = h - (top - c); if (!(dh > 0 && Math.hypot(su - c, dh * 1.4) > c + 0.3)) {
      if (su === 0 || su === n || (dh > 0 && Math.hypot(su - c, (dh + 1.5) * 1.4) > c + 0.3)) return su === c ? Au[0] : (su + h) % 3 ? AS[1] : AS[2];
      if (su === c) return 'u'; if (h === 4 || h === 11) return Fe[1]; if ((su === 3 || su === n - 3) && (h === 5 || h === 12)) return Fe[0];
      return (su % 3 === 2) ? 'u' : su < c ? 'w' : 't'; } }
    return AK.wallTex(a, h, 0, { len: EW, H: SZ, step: 21 });
  });
  else wall(t, sh.L, sh.Bm, 22, (a, v) => {
    if (a <= 1) return a === 0 ? 'W' : 'w';                                   // lit corner post
    if (a >= EW - 2) return a === EW - 1 ? 'u' : 't';                         // shaded corner post
    if (v <= 1) return v === 0 ? 'W' : 't';                                   // wall plate
    if (v >= 20) return v === 20 ? 'w' : 'u';                                 // sill
    if (a >= DL - 1 && a <= DR + 1 && v === DT - 1) return 'W';                // header over the door
    if (a >= DL - 1 && a <= DR + 1 && v === DT) return 'u';
    if (a >= DL && a <= DR && v > DT) {
      if (a === DL || a === DR || a === DM) return 'u';                       // jambs and the meeting stiles
      const left = a < DM, lo = left ? DL + 1 : DM + 1, hi = left ? DM - 1 : DR - 1, w = hi - lo;
      if (v === 8 || v === 18) return 'W'; if (v === 9 || v === 19) return 't';   // ledges
      const s = (18 - v) / 10, br = left ? lo + Math.round(s * w) : hi - Math.round(s * w);   // Z-brace from the hinge foot
      if (v > 9 && v < 18 && a === br) return 'W'; if (v > 9 && v < 18 && a === br + (left ? 1 : -1)) return 't';
      return (a - lo) % 3 === 2 ? 'u' : 't';
    }
    return board(a, v);
  });
  // gable over the end wall: the same boards up to the barge boards, a louvred vent under the ridge
  for (const [x, y] of cells([sh.L, sh.Bm, r1])) {
    const a = EA(x), d = Math.floor(sh.L[1] + (x + 0.5 - sh.L[0]) / (sh.Bm[0] - sh.L[0]) * (sh.Bm[1] - sh.L[1]) - y - 0.5), c = Math.abs(a - EW / 2 + 0.5);
    if (IMP) { const oc = Math.hypot(c, (d - 8) * 1.1); t[y][x] = oc < 2.2 ? (d > 8 ? Gl[0] : Gl[1]) : oc < 3.4 ? (oc < 2.8 && d > 7 && c < 1 ? Au[1] : AS[2]) : AS[d % 4 === 3 ? 1 : 0]; continue; }
    t[y][x] = (d >= 5 && d <= 9 && c <= 3.5) ? (d === 5 || d === 9 || c > 3 ? 'u' : d % 2 ? 'I' : 't') : board(a, 0);
  }
  pixLine(t, sh.L[0], sh.L[1], sh.Bm[0], sh.Bm[1], IMP ? Au[1] : 'W');
  if (IMP) {
    plane(t, [sh.L, sh.T, r2, r1], sh.L, sh.T, (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 2, { flip: true }), true);
    plane(t, [r1, r2, P(sh.Rr, 1, 1), P(sh.Bm, 0, 1)], P(sh.Bm, 0, 1), P(sh.Rr, 1, 1), (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 1));
    pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k');
    pixLine(t, sh.L[0], sh.L[1], r1[0], r1[1], AR[5]); pixLine(t, sh.Bm[0], sh.Bm[1] + 1, r1[0], r1[1], AR[6]);
    AK.trim(t, P(sh.Bm, 0, 1), P(sh.Rr, 1, 1), 0); AK.trim(t, sh.L, r1, -1); AK.trim(t, P(sh.Bm, 0, 1), r1, 0);
    AK.crest(t, r1, r2);
    pixLine(t, sh.Bm[0], sh.Bm[1], sh.Bm[0], sh.Bm[1] + SZ - 1, AS[4]);
  } else {
  // the back slope faces away: its eave L→T sits above the ridge on screen, so its courses lap upward (flip)
  plane(t, [sh.L, sh.T, r2, r1], sh.L, sh.T, tiles({ t: ['O', 'Q', 'P'], ch: 3, tw: 5, s: 41 }), true);
  plane(t, [r1, r2, P(sh.Rr, 1, 1), P(sh.Bm, 0, 1)], P(sh.Bm, 0, 1), P(sh.Rr, 1, 1), (a, d) => tiles({ t: d > 14 ? ['Q', 'q', 'P'] : ['q', 'P', 'p', 'R'], ch: 3, tw: 5, s: 42 })(a, d));
  pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); pixLine(t, r1[0], r1[1] - 1, r2[0], r2[1] - 1, 'O');
  pixLine(t, sh.L[0], sh.L[1], r1[0], r1[1], 'u'); pixLine(t, sh.Bm[0], sh.Bm[1] + 1, r1[0], r1[1], 'u');
  pixLine(t, sh.Bm[0], sh.Bm[1] + 1, sh.Rr[0] + 1, sh.Rr[1] + 1, 'p');
  pixLine(t, sh.Bm[0], sh.Bm[1], sh.Bm[0], sh.Bm[1] + 21, 'u');
  }
});
if (IMP) inked(g, t => AK.finial(t, Math.round(r1[0]), Math.round(r1[1]) - 1));
// team banner hung on the gable end
inked(g, t => wall(t, sh.L, sh.Bm, SZ, (a, v) => {
  const i = a - 31, vo = IMP ? 2 : 0; v -= vo; if (i < 0 || i > 8 || v < 1) return null; if (v === 1) return i === 0 || i === 8 ? 'h' : IMP ? Au[1] : 't';
  const end = 15 - (Math.abs(i - 4) < 2 ? 2 : 0); if (v > end) return null; if (v === end) return IMP ? Au[i % 2] : 'D';
  if (IMP && (i === 0 || i === 8)) return Au[i === 0 ? 0 : 2];
  if (v >= 5 && v <= 9 && ((i === 4) || (v === 7 && i >= 2 && i <= 6))) return 'L';
  return i === 0 ? 'L' : i === 8 ? 'D' : 'T';
}));
// the shed as painted so far: the brazier inside the bay may only show where nothing in the yard was drawn over it
const gShed = copy(g);
// a wheel leaning on the corner post of the open bay (the end wall stands on the plinth edge, so there is no ground in front of it)
inked(g, t => wheel(t, 50, 112 + OY, 6));

// ---- stacked wheels and a spare axle (front-left of the yard)
inked(g, t => { const p = iso(1.55, 2.55); wheel(t, p[0] - 6, p[1] - 6, 6); wheel(t, p[0] + 4, p[1] - 6, 6); wheel(t, p[0] - 1, p[1] - 12, 6); });

// ---- half-built mangonel (side view like the unit): base beams, A-frame uprights, cocked arm with its cup, the
//      torsion skein; the front wheel is fitted, the rear one still lies on the ground beside a bare axle
inked(g, t => {
  const p = iso(1.8, 1.2); const x = Math.round(p[0]) - 13, y = Math.round(p[1]) - 4;
  pixLine(t, x, y, x + 26, y, 'W'); pixLine(t, x, y + 1, x + 26, y + 1, 'w'); pixLine(t, x, y + 2, x + 26, y + 2, 't');
  pixLine(t, x + 3, y - 1, x + 23, y - 1, 'i');
  for (const [a0, a1, c] of [[9, 14, 'W'], [19, 14, 't']]) { pixLine(t, x + a0, y - 1, x + a1, y - 13, c); pixLine(t, x + a0 + 1, y - 1, x + a1 + 1, y - 13, 't'); }
  pixLine(t, x + 10, y - 6, x + 19, y - 6, 'w');
  pixLine(t, x + 17, y - 2, x + 3, y - 17, 'W'); pixLine(t, x + 18, y - 2, x + 4, y - 17, 't');
  stampL(t, x - 1, y - 21, `
.GGGG.
GwwwwG
.GttG.
`);
  pixRect(t, x + 15, y - 4, 5, 2, 'B'); pixSet(t, x + 17, y - 4, 'b');
  pixLine(t, x + 9, y - 10, x + 25, y - 1, 'B');
  wheel(t, x + 5, y + 2, 5);
  pixRect(t, x + 21, y + 2, 2, 2, 'G');
  // the rear end, with no wheel yet, rests on a timber chock down to the ground line of the fitted wheel
  pixRect(t, x + 19, y + 4, 6, 4, 'w'); pixLine(t, x + 19, y + 4, x + 24, y + 4, 'W'); pixLine(t, x + 19, y + 7, x + 24, y + 7, 't');
});
inked(g, t => { const p = iso(1.95, 1.75); wheel(t, p[0] + 2, p[1] - 3, 5, 1.0); });

// ---- log pile: logs lying along the ty axis, side by side along tx (4, then 3 in the grooves, then 2), end grain to the
// viewer; a team-colour tarp is thrown over the far half of the pile, with a dark hem across it
const LOGD = 5, LOGL = 22, SP = [LOGD * 0.9, LOGD * 0.45];
inked(g, t => {
  const base = P(iso(2.02, 2.86), 0, -LOGD / 2);
  // the cloth is shaded as one draped surface (light over the crown, team on the slopes, dark down the near flank), not per log
  const tarp = (s, b, row, edge) => s < 0.5 ? null : s < 0.56 ? 'D' : row === 2 && b > 0 ? 'L' : edge && b < 0.3 ? 'D' : 'T';
  for (const [n, row] of [[4, 0], [3, 1], [2, 2]]) for (let k = 0; k < n; k++) {
    const c = P(base, SP[0] * (k + row / 2), SP[1] * (k + row / 2) - row * LOGD * 0.82);
    cyl(t, c, LOGD, LOGL, (part, s, b, r) => part === 'end' ? endCol(r) : tarp(s, b, row, k === n - 1) || barkCol(s, b));
  }
});
// a sawhorse in wood chips: two X-trestles across the ty axis carrying a log, a saw left in its cut
inked(g, t => {
  const c = P(iso(2.62, 1.5), 0, -8);                                           // near end of the log, resting in the trestles
  for (const s of [3, 15]) { const q = [c[0] + s, c[1] - s / 2 + 8]; pixLine(t, q[0] - 3, q[1] - 1, q[0] + 2, q[1] - 8, 't'); pixLine(t, q[0] + 3, q[1] + 1, q[0] - 2, q[1] - 8, 'w'); }
  cyl(t, c, 4, 20, (part, s, b, r) => part === 'end' ? endCol(r) : barkCol(s, b));
  const m = [c[0] + 11, c[1] - 6]; pixLine(t, m[0], m[1] - 1, m[0] + 3, m[1] - 6, 'S'); pixLine(t, m[0] + 1, m[1] - 1, m[0] + 4, m[1] - 6, 'G'); pixRect(t, m[0] + 3, m[1] - 9, 2, 3, 'W');
});

// ---- animated: crane (hook sway) and the brazier
// sheer-legs crane on iso axes: two front legs splayed along tx (feet on the ground line ty 0.62), a back leg raking to the
// back edge, all meeting at a lashed apex over the load. A windlass drum spans the front legs low down; its rope runs up to
// the pulley at the apex and drops to a hook carrying a beam slung along the tx axis.
const CR = iso(2.4, 0.4), CAP = P(CR, 0, -46);
const legAt = (foot, k) => lerp(foot, CAP, k);
// back leg and the slung load (behind the front legs)
function craneBack(t, f) {
  const FB = iso(2.4, 0.04), sw = [0, 1, 0, -1][f];
  pixLine(t, FB[0], FB[1], CAP[0], CAP[1], 't'); pixLine(t, FB[0] + 1, FB[1], CAP[0] + 1, CAP[1], 'u');
  const hk = [Math.round(CAP[0]) + sw, Math.round(CAP[1]) + 15];
  pixLine(t, CAP[0], CAP[1] + 2, hk[0], hk[1], 'B'); pixSet(t, hk[0], hk[1] + 1, 'G'); pixSet(t, hk[0] - 1, hk[1] + 2, 'G'); pixSet(t, hk[0], hk[1] + 3, 'G');
  const bc = [hk[0] + sw, hk[1] + 9];                                          // beam centre, slung along the tx axis
  pixLine(t, hk[0], hk[1] + 3, bc[0] - 6, bc[1] - 5, 'B'); pixLine(t, hk[0], hk[1] + 3, bc[0] + 6, bc[1], 'B');
  for (let i = -9; i <= 9; i++) { const x = bc[0] + i, y = Math.round(bc[1] + i / 2); put(t, x, y - 2, 'W'); put(t, x, y - 1, 'w'); put(t, x, y, 't'); }
  stampL(t, bc[0] - 11, bc[1] - 8, `
.ee
eEe
.et
`);
}
// the two front legs, splayed along tx, with the windlass drum low between them and its rope up to the apex pulley
function craneFront(t) {
  const F1 = iso(1.98, 0.7), F2 = iso(2.82, 0.7);
  pixLine(t, F1[0], F1[1], CAP[0], CAP[1], 'W'); pixLine(t, F1[0] + 1, F1[1], CAP[0] + 1, CAP[1], 't');
  pixLine(t, F2[0], F2[1], CAP[0], CAP[1], 'w'); pixLine(t, F2[0] + 1, F2[1], CAP[0] + 1, CAP[1], 't');
  const d1 = legAt(F1, 0.18), d2 = legAt(F2, 0.18);
  pixLine(t, d1[0] + 1, d1[1] - 1, d2[0], d2[1] - 1, 'W'); pixLine(t, d1[0] + 1, d1[1], d2[0], d2[1], 'w'); pixLine(t, d1[0] + 1, d1[1] + 1, d2[0], d2[1] + 1, 't');
  const dm = lerp(d1, d2, 0.5); for (let i = -2; i <= 2; i++) put(t, Math.round(dm[0]) + i, Math.round(dm[1] + i / 2), 'B');
  pixSet(t, d1[0], d1[1], 'G'); pixSet(t, d1[0] - 1, d1[1] + 1, 'G'); pixSet(t, d1[0] - 2, d1[1] + 2, 'W');   // crank
  pixLine(t, dm[0], dm[1] - 1, CAP[0] - 1, CAP[1] + 3, 'B');
  pixRect(t, CAP[0] - 1, CAP[1], 3, 2, 'B'); pixSet(t, CAP[0], CAP[1] + 2, 'G');       // lashing and pulley
}
function brazier(t, f) {
  const x = Math.round(GLOW[0]), y = Math.round(GLOW[1]) + 15 + SZ - 22;   // legs end on the bay floor (v 20)
  stampL(t, x - 2, y, ['\n.ogo.\nGogoG\n.GGG.\n..t..\n.t.t.\n', '\n..o..\nGgogG\n.GGG.\n..t..\n.t.t.\n', '\n.o.o.\nGogoG\n.GGG.\n..t..\n.t.t.\n', '\n..g..\nGoooG\n.GGG.\n..t..\n.t.t.\n'][f]);
  if (f % 2 === 0) { pixSet(t, x - 3, y + 1, 'r'); pixSet(t, x + 3, y + 1, 'r'); }
}
// Imperial: a gantry crane over the yard — two braced trestles (legs splayed along ty) joined by a beam along tx, iron straps
// and gilt caps; a trolley on the beam, its hook and a slung beam swaying below
const GT = [iso(1.95, 0.42), iso(2.85, 0.42)], GH0 = 44;
function gantryBack(t, f) {
  const sw = [0, 1, 0, -1][f];
  for (const p of GT) { const top = P(p, 0, -GH0); pixLine(t, p[0] + 6, p[1] - 3, top[0] + 1, top[1], 't'); pixLine(t, p[0] + 7, p[1] - 3, top[0] + 2, top[1], 'u'); }   // back legs
  const tr = lerp(P(GT[0], 0, -GH0), P(GT[1], 0, -GH0), 0.45), hk = [Math.round(tr[0]) + sw, Math.round(tr[1]) + 17];
  pixLine(t, tr[0], tr[1] + 2, hk[0], hk[1], 'B'); pixSet(t, hk[0], hk[1] + 1, Fe[1]); pixSet(t, hk[0] - 1, hk[1] + 2, Fe[1]); pixSet(t, hk[0], hk[1] + 3, Fe[1]);
  const bc = [hk[0] + sw, hk[1] + 9];
  pixLine(t, hk[0], hk[1] + 3, bc[0] - 6, bc[1] - 5, 'B'); pixLine(t, hk[0], hk[1] + 3, bc[0] + 6, bc[1], 'B');
  for (let i = -9; i <= 9; i++) { const x = bc[0] + i, y = Math.round(bc[1] + i / 2); put(t, x, y - 2, 'W'); put(t, x, y - 1, 'w'); put(t, x, y, 't'); if (i === -5 || i === 5) { put(t, x, y - 2, Fe[0]); put(t, x, y - 1, Fe[1]); put(t, x, y, Fe[1]); } }
}
function gantryFront(t) {
  for (const p of GT) { const top = P(p, 0, -GH0);
    pixLine(t, p[0] - 6, p[1] + 3, top[0] - 1, top[1], 'W'); pixLine(t, p[0] - 5, p[1] + 3, top[0], top[1], 't');                       // front legs
    pixLine(t, p[0] - 4, p[1] - 8, p[0] + 5, p[1] - 12, 'w');                                                                       // brace
    pixRect(t, top[0] - 1, top[1] - 1, 3, 2, Fe[1]); pixSet(t, top[0], top[1] - 2, Au[1]); pixSet(t, top[0], top[1] - 3, Au[0]); }
  const a = P(GT[0], -4, -GH0 - 1), b = P(GT[1], 4, -GH0 - 1);
  for (let i = 0; i <= 3; i++) pixLine(t, a[0], a[1] - 2 + i, b[0], b[1] - 2 + i, ['W', 'w', 'w', 't'][i]);                           // the beam
  for (const k of [0.15, 0.5, 0.85]) { const p = lerp(a, b, k); pixLine(t, p[0], p[1] - 2, p[0], p[1] + 1, Fe[1]); }                       // iron straps
  const tr = lerp(P(GT[0], 0, -GH0), P(GT[1], 0, -GH0), 0.45); pixRect(t, tr[0] - 2, tr[1] + 1, 5, 2, Fe[1]); pixSet(t, tr[0] - 1, tr[1] + 1, Fe[0]);   // trolley
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  // the brazier stands inside the bay: paint it on a layer and keep only the cells where the shed is still on top
  { const b = pixGrid(GW, GH); brazier(b, f); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (b[y][x] !== '.' && g[y][x] === gShed[y][x]) q[y][x] = b[y][x]; }
  if (IMP) { inked(q, t => gantryBack(t, f)); inked(q, t => gantryFront(t), 'k', 'K', 'B'); }
  else { inked(q, t => craneBack(t, f)); inked(q, t => craneFront(t), 'k', 'K', 'B'); }
  outline(q, 'k', 'K');
  frames.push(pixText(q));
}

return {
  id: 'siege', kind: 'building', footprint: [W, H], anchor: [bx, by],
  ...(IMP ? { flags: [[Math.round(sh.Bm[0]) - bx, Math.round(sh.Bm[1]) - by, 14]] } : {}),
  palette: {
    ...AK.pal,
    k: '#24180f', K: '#4a3520',                                                      // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', d: '#c9a24a', z: '#7d6236', x: '#5e4a28', // earth, sawdust, plinth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#241a12', // timber, bay interior
    O: '#c49a5c', Q: '#a07a44', q: '#8a6a3a', P: '#7a5a30', R: '#6a4a2a', p: '#4a3520', // shingles lit → shade
    e: '#d8b277', E: '#b58a3c', h: '#e6c272',                                        // log ends, chips, gilt
    S: '#cfd4d8', G: '#5f656c', B: '#c9b58e', b: '#9a8a66',                                        // iron, rope
    o: '#ff8c2a', g: '#ffd27a', r: '#7a2a18',                                       // glow
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
};
export default pixAged(make, 2);
