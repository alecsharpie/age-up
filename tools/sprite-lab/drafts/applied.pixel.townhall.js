// @pixel townhall
// Town Centre (3×3): a paved stone plinth (flags on the iso ground grid). On the back 2×2 tiles an open-sided market pavilion:
// a big hipped red-tile roof with a slatted smoke louvre on timber posts over a raised floor, open on every side (you see
// through its back), with the town hearth, stores and gold inside and team banners under the eaves. A coursed stone tower on
// the right corner tile (arched door, lancet windows and a banner laid out on its faces, tile cap; the code flag waves from
// its apex). Forecourt: a well on the front tile, a market stall under a team awning. Anchor = bottom corner.
// idle: 6 frames — hearth fire flickers and its glow pulses on the floor, smoke rises from the louvre. building.townhall.js.
// ---- local texture kit (deterministic) ----
// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).
const make = (AGE) => {
const AK = pixAgeKit(AGE);
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

// ---- team cloth and natural edges (holistic pass): grass, moss, soot chars every civic palette merges via ...NPAL
const NPAL = { 'ǧ': '#3e6a2a', 'ǥ': '#56883a', 'ǵ': '#78a94c', 'ɱ': '#6e7a3c', 'ɲ': '#56602e', 'ʂ': '#3c342c' };
/** a line from a to b whose middle sags `sag` px (negative lifts it): ridges, eaves and rails that are not ruler-straight */
const sagLine = (g, a, b, ch, sag = 1, dy = 0) => {
  const n = Math.max(1, Math.round(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))));
  for (let i = 0; i <= n; i++) { const t = i / n; pixSet(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + dy + Math.round(sag * Math.sin(Math.PI * t)), ch); }
};
/** grass tufts along a wall's base line a→b (screen points): 2–4 blades rising 1–3 px over the foot of the wall and its ink line,
 *  so no footprint edge is a hard ruler line. o.n tufts per 64 px, o.seed, o.skip(x) keeps doorways clear. */
const tufts = (g, a, b, o = {}) => {
  const len = Math.abs(b[0] - a[0]), n = Math.round(len / 64 * (o.n ?? 4)), seed = o.seed || 0;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.2 + hash(k + seed, 41) * 0.6) / n, x0 = Math.round(a[0] + (b[0] - a[0]) * t);
    if (o.skip && o.skip(x0)) continue;
    const blades = 2 + Math.floor(hash(k + seed, 43) * 3);
    for (let j = 0; j < blades; j++) {
      const x = x0 + j - (blades >> 1), y = Math.round(a[1] + (b[1] - a[1]) * ((x - a[0]) / (b[0] - a[0]))), hgt = 1 + Math.floor(hash(x, 44 + seed) * 3);
      for (let d = 0; d < hgt + 1; d++) pixSet(g, x, y - d, d === hgt ? 'ǵ' : d === 0 ? 'ǧ' : 'ǥ');
    }
  }
};
/** moss/lichen and rain streaks low on a stone face: for cells of `chs` within `rows` px of the base line a→b (and streaks from
 *  the sill/eave down), darken via map `dk` or set moss. Clustered by hash on 3×2 cells so it never reads as noise. */
const weather = (g, a, b, chs, dk, o = {}) => {
  const rows = o.rows ?? 5, seed = o.seed || 0;
  for (let x = Math.ceil(a[0]); x < b[0]; x++) {
    const base = a[1] + (b[1] - a[1]) * ((x + 0.5 - a[0]) / (b[0] - a[0]));
    for (let h = 0; h < (o.H || 40); h++) {
      const y = Math.floor(base - h - 0.5); if (y < 0 || y >= g.length) continue; const c = g[y][x]; if (!chs.includes(c)) continue;
      const cl = hash((x >> 2) + seed, (h >> 1) + 7);
      if (h < rows && cl < 0.22 - h * 0.03) { g[y][x] = hash(x, h + seed) < 0.5 ? 'ɱ' : 'ɲ'; continue; }      // moss at the foot
      if (h < rows + 2 && cl > 0.82 && dk[c]) { g[y][x] = dk[c]; continue; }                             // damp splash
      if (o.streaks && hash(x + seed, 13) < o.streaks && h < (o.H || 40) - 2 && dk[c] && hash(x + seed, Math.floor(h / 5) + 3) < 0.55) g[y][x] = dk[c];   // rain streak
    }
  }
};
/** a rag pennant / small team pennant tied to a pole top at (x,y), streaming right (the way the smoke drifts); frame i ripples it.
 *  len cells long, hgt cells deep at the hoist, ragged tail; D on the lower edge, ink outline. */
const pennant = (f, x, y, len, hgt, i, rag = true) => {
  for (let c = 0; c < len; c++) {
    const t = c / len, wav = Math.round(Math.sin(t * 5 - i * 1.6) * 1.1 * t), depth = Math.max(1, Math.round(hgt * (1 - t * (rag ? 0.45 : 0.8))));
    const y0 = y + wav + (rag ? 0 : Math.round(t * hgt * 0.4));
    if (rag && c === len - 1 && (i % 2)) continue;
    pixSet(f, x + 1 + c, y0 - 1, 'k');
    for (let r = 0; r < depth; r++) pixSet(f, x + 1 + c, y0 + r, r === depth - 1 ? 'D' : (r === 0 && c < len - 2) ? 'L' : 'T');
    pixSet(f, x + 1 + c, y0 + depth, 'k');
    if (rag && c > len * 0.5 && hash(c, i) < 0.3) pixSet(f, x + 1 + c, y0 + depth - 1, 'k');                 // a torn notch
  }
  pixSet(f, x + 1 + len, y + Math.round(Math.sin(5 - i * 1.6) * 1.1), 'k');
};
/** a pole from (x,y) foot up h cells, 1 px lean every `lean` rows (0: plumb), lit/dark timber chars a/b; returns its top */
const pole = (g, x, y, h, a, b, lean = 0) => {
  let px = x; const wd = b ? 2 : 1; for (let k = 0; k < h; k++) { if (lean && k && k % lean === 0) px += Math.sign(lean); pixSet(g, px - 1, y - k, 'k'); pixSet(g, px, y - k, a); if (b) pixSet(g, px + 1, y - k, b); pixSet(g, px + wd, y - k, 'k'); }
  for (let d = 0; d < wd; d++) pixSet(g, px + d, y - h, 'k'); return [px + wd - 2, y - h];
};
/** A team banner laid flat on a wall of eave slope `slope` (+0.5 lit, -0.5 shade): top-left (x,y), w×h cells. Rod by age (Dark/
 *  Feudal timber, Castle iron, Imperial gilt), ink sides so it parts from a same-hue wall or roof, lit left hem L, shaded right
 *  hem D, a pale charge (o.charge: 'cross' | 'chevron' | 'disc' | 'none'), hem by age: Dark ragged, Feudal square, Castle
 *  swallowtail, Imperial gilt fringe and gilt side borders. Returns the cells it covers (for counting). */
const teamBanner = (g, x, y, slope, w, h, o = {}) => {
  const A = AK.age, cx = (w - 1) / 2, charge = o.charge || (A >= 3 ? 'disc' : A === 2 ? 'cross' : 'none');
  const at = (c, r) => [x + c, y + r + Math.round(slope * (c - cx) + 1e-9)];
  const rod = A === 3 ? AK.Au[1] : A === 2 ? AK.Fe[1] : AK.W[2];
  for (let c = -1; c <= w; c++) { const [px, py] = at(c, -1); pixSet(g, px, py, c === -1 || c === w ? 'k' : rod); if (A === 3 && (c === -1 || c === w)) pixSet(g, px, py, AK.Au[0]); }
  for (let c = 0; c < w; c++) {
    let hh = h; const mid = Math.abs(c - cx);
    if (A === 2) hh = h - (mid < w / 4 ? 2 : 0);                                   // swallowtail notch
    if (A === 1) hh = h;
    if (A === 0) hh = h - Math.floor(hash(x + c, 9) * 3);                          // ragged
    if (A === 3) hh = h - (mid < 0.6 ? 0 : Math.round(mid * 0.5));                  // pointed hem with a fringe
    for (let r = 0; r < hh; r++) {
      let ch = 'T';
      if (c === 0) ch = 'k'; else if (c === w - 1) ch = 'k';
      else if (c === 1) ch = A === 3 ? AK.Au[0] : 'L'; else if (c === w - 2) ch = A === 3 ? AK.Au[2] : 'D';
      if (r === hh - 1) ch = A === 3 ? AK.Au[1] : 'k'; else if (r === hh - 2 && c > 0 && c < w - 1) ch = A === 3 ? AK.Au[1] : 'D';
      if (r === 0 && c > 0 && c < w - 1 && ch === 'T') ch = 'D';                   // shade under the rod
      const inner = c >= 2 && c <= w - 3 && r >= 2 && r < hh - 2, rr = r - Math.floor(h * 0.42);
      if (inner && ch === 'T') {
        if (charge === 'cross' && ((Math.abs(c - cx) < 0.6 && r >= 2 && r < hh - 3) || (rr === 0))) ch = 'L';
        if (charge === 'chevron' && Math.abs(rr - (2 - Math.abs(c - cx))) < 0.6) ch = 'L';
        if (charge === 'sun' && Math.hypot(c - cx, rr * 1.1) < Math.max(1.2, (w - 4) / 2.4)) ch = 'L';
        if (charge === 'disc' && Math.hypot(c - cx, rr * 1.1) < Math.max(1.2, (w - 4) / 3.2)) ch = Math.hypot(c - cx, rr * 1.1) < 0.9 ? AK.Au[0] : AK.Au[1];
      }
      const [px, py] = at(c, r); pixSet(g, px, py, ch);
    }
  }
};

// Age variants (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs). The Castle variant (AGE 2) is the tuned art below, kept
// as it was; the other ages swap materials and change the silhouette around the same plan:
//   Dark     a low timber longhall under a steep, deep golden thatch with a smoke hole and crossed gable poles, open on rough
//            log posts over a trampled-earth yard with fieldstone footings; team hides hang from the beams; the side tower is a
//            palisade-log lookout with an open watch gallery under a shaggy thatch cap; a hide hung in its doorway.
//   Feudal   the same hall on squared posts with stone bases under oak shingles and a shingled louvre with a knob finial; a
//            timber-framed tower in storeys on a rubble plinth, shuttered windows, a team plank door, a shingle cap.
//   Castle   the dressed-stone tower, red tiles, slatted louvre, iron and stone (the original art).
//   Imperial pale limestone throughout: fluted stone columns with gilt capitals, a slate roof with gilt cresting and eave trim,
//            an arcaded cupola with a gilt orb, the tower raised with gilt string courses, corner pinnacles and a tall slate
//            spire with an orb finial; gilt-fringed banners.
const C = AGE === 2;
const W = 3, H = 3, PL = 4, DAIS = 2;
const Z = [28, 32, 32, 36][AGE], ROOF = [40, 32, 30, 32][AGE], TZ = [46, 56, 64, 74][AGE];
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + PL + 22 + 26 + 56;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const { R: RK, W: TW, Au, Fe, DEEP } = AK;

// ---- helpers: ground-plane paving and face-space painting
/** iso ground coordinates of a cell from origin O: a along L->T (+2,-1 px per unit), b along L->Bm (+2,+1 px per unit) */
const isoAB = (O, x, y) => { const dx = x + 0.5 - O[0], dy = y + 0.5 - O[1]; return [(dx / 2 - dy) / 2, (dx / 2 + dy) / 2]; };
/** stone flags on the ground plane: joints run along both iso ground axes (a 2:1 diamond grid), rows staggered */
const paveFlags = (O, sz, J, tone) => (x, y) => {
  const [a, b] = isoAB(O, x, y), rb = Math.floor(b / sz), aa = a + (((rb % 2) + 2) % 2) * sz / 2, ra = Math.floor(aa / sz);
  if (aa - ra * sz < 0.5 || b - rb * sz < 0.5) return J;
  return tone(ra, rb, a, b);
};
/** paint on a vertical face from A to Bp (A.x < Bp.x) in face space: su = 0..u1-u0 along the face, sh = 0..h1-h0 up it.
 *  Rows of constant sh follow the face's slope, so anything painted this way slants with the wall. */
const face = (A, Bp, u0, u1, h0, h1, fn) => {
  const sl = (Bp[1] - A[1]) / (Bp[0] - A[0]);
  for (let u = u0; u <= u1; u++) { const x = Math.round(A[0]) + u, base = A[1] + sl * (x + 0.5 - A[0]);
    for (let h = h0; h <= h1; h++) { const c = fn(u - u0, h - h0); if (c) pixSet(g, x, Math.floor(base - h - 0.5), c); } }
};
/** screen cell of the point u along / h up a face from A to Bp */
const facePt = (A, Bp, u, h) => { const sl = (Bp[1] - A[1]) / (Bp[0] - A[0]), x = Math.round(A[0]) + u; return [x, Math.floor(A[1] + sl * (x + 0.5 - A[0]) - h - 0.5)]; };
const up = (p, z) => [p[0], p[1] - z];
/** Dark: trampled earth with a few bedded fieldstones (same chars as the paving, so the hearth glow still finds it) */
const earth = (x, y, J, A, B) => { const st = hash((x >> 2) + 50, (y >> 1) + 9); if (st < 0.025) return (x & 3) === 0 ? 's' : (x & 3) < 3 ? 'S' : 'q';
  const h = hash(x >> 2, (y >> 1) + 3), h2 = hash(x, y + 11); return h2 < 0.06 ? J : h < 0.3 ? B : A; };

// ---- plinth: a coursed stone platform paved with flags; the forecourt is the open, lit part of it (Dark: a fieldstone kerb
// round a trampled-earth yard)
const pl = pixIsoBox(g, bx, by, W, H, PL, 1, { left: '1', right: '2', top: 'p' });
paint(g, '1', (x, y) => course(x, y, 0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['S', 'q', 'S'] }));
paint(g, '2', (x, y) => course(x, y, -0.5, { h: 2, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q'] }));
if (AGE === 0) paint(g, 'p', (x, y) => earth(x, y, 'K', 'p', 'P'));
else paint(g, 'p', paveFlags(pl.L, 3, 'P', (ra, rb) => ['p', 'p', 'p', 's', 'P'][Math.floor(hash(ra + 40, rb + 7) * 5)]));

// ---- the market pavilion: an open-sided hall on the back 2×2 tiles, a big hipped roof on timber posts over a raised stone
// floor with the town hearth at its centre. Its back sides are open too, so you look right through it. The side tower stands
// on the right corner tile and closes the back half of the pavilion's right side.
const dz = pixIsoBox(g, bx, by - 32 - PL, 2, 2, DAIS, 1, { left: '3', right: '4', top: '5' });
const D = dz;                                                    // floor corners (top of the dais)
paint(g, '3', () => 'S'); paint(g, '4', () => 'q');
line(g, dz.base.L, dz.base.Bm, 'j', -1); line(g, dz.base.Bm, dz.base.Rr, 'j', -1);
// floor flags: lit near the open front, in the roof's shade further in (Dark: an earth floor)
if (AGE === 0) paint(g, '5', (x, y) => { const [a, b] = isoAB(D.L, x, y), deep = Math.min(a, 2 - b); return deep > 0.12 ? earth(x, y, 'K', 'F', 'f') : earth(x, y, 'K', 'p', 'P'); });
else paint(g, '5', paveFlags(D.L, 3, 'K', (ra, rb, a, b) => { const deep = Math.min(a, 2 - b); return deep > 0.3 ? (hash(ra, rb) < 0.3 ? 'f' : 'F') : deep > 0.12 ? (hash(ra, rb) < 0.5 ? 'f' : 'F') : 'p'; }));
/** a point on the floor, a tiles toward the back (L->T), b tiles toward the front corner (L->Bm) */
const gp = (a, b) => [D.L[0] + 32 * a + 32 * b, D.L[1] - 16 * a + 16 * b];
// timber post on a stone base with a flared capital; lit = left-facing side catches the light.
// Dark: a rough log set straight into the earth; Imperial: a fluted limestone column on a moulded base with a gilt capital.
const post = (p, lit, h = Z) => {
  const x = Math.round(p[0]), y = Math.round(p[1]);
  if (AGE === 0) {
    const [a, b, c] = lit ? ['t', 'u', 'v'] : ['u', 'v', 'V'];
    const lean = hash(x, 5) < 0.45 ? (hash(x, 6) < 0.5 ? -1 : 1) : 0;   // rough logs: some stand a pixel off plumb in their top half
    for (let yy = y - h + 1; yy < y; yy++) { const kn = hash(x, yy) < 0.08, xx = x + (yy < y - h * 0.55 ? lean : 0); pixSet(g, xx - 1, yy, kn ? b : a); pixSet(g, xx, yy, kn ? c : b); pixSet(g, xx + 1, yy, c); pixSet(g, xx - 2, yy, 'k'); pixSet(g, xx + 2, yy, 'k'); }
    pixSet(g, x - 1, y - 1, 'V'); pixSet(g, x, y - 1, 'V'); pixSet(g, x + 1, y - 1, 'V');           // damp foot in the earth
    pixStamp(g, x - 2, y - h, `k...k\nkt.vk`.replace(/t/g, a).replace(/v/g, c));                   // forked top cradles the beam
    return;
  }
  if (AGE === 3) {
    const [a, b, c] = lit ? ['s', 'S', 'q'] : ['S', 'q', 'Q'];
    for (let yy = y - h + 3; yy < y - 2; yy++) { pixSet(g, x - 1, yy, a); pixSet(g, x, yy, (yy & 1) ? b : a); pixSet(g, x + 1, yy, c); pixSet(g, x - 2, yy, 'k'); pixSet(g, x + 2, yy, 'k'); }
    pixStamp(g, x - 3, y - 3, lit ? `
ksssSqk
kSSqQQk
` : `
kSSqQQk
kqqQQjk
`);
    pixStamp(g, x - 3, y - h + 1, `
kλλμμνk
.kμμνk.
`);
    return;
  }
  const [a, b, c] = lit ? ['t', 'u', 'v'] : ['u', 'v', 'V'];
  for (let yy = y - h + 3; yy < y - 2; yy++) { pixSet(g, x - 1, yy, a); pixSet(g, x, yy, b); pixSet(g, x + 1, yy, c); pixSet(g, x - 2, yy, 'k'); pixSet(g, x + 2, yy, 'k'); }
  pixStamp(g, x - 2, y - 3, lit ? `
kSqQk
kqQjk
` : `
kqQjk
kQjjk
`);
  pixStamp(g, x - 3, y - h + 1, lit ? `
ktttuvk
.kuuvk.
` : `
kuuvvVk
.kvvVk.
`);
};
const beam = (a, b, lit) => {
  const [r1, r2] = AGE === 3 ? (lit ? ['s', Au[1]] : ['S', Au[2]]) : (lit ? ['t', 'u'] : ['u', 'v']);
  line(g, a, b, 'k', 0); line(g, a, b, r1, 1); line(g, a, b, r2, 2); line(g, a, b, 'k', 3);
};
// back row first (painter's order): posts along the open back-left side, its tie beam
for (const a of [0.5, 1, 1.5]) post(gp(a, 0), false);
beam(up(gp(0, 0), Z), up(gp(2, 0), Z), false);

// the town hearth: a raised stone ring with embers in the front-left half of the hall, where it shows between the posts
// under the eave (the roof hides anything deeper than ~0.7 tile); flames are per frame
const HC = gp(0.42, 0.85);
const HEARTH = [Math.round(HC[0]), Math.round(HC[1])];
pixStamp(g, HEARTH[0] - 7, HEARTH[1] - 4, `
...kkkkkkkk...
.kkSsSqSsSqkk.
kSqjiiiiiijqQk
kqQjoooooojQjk
.kkQqQjQqQjkk.
...kkkkkkkk...
`);
// stores kept dry under the roof, against the back of the hall and clear of every post
const SACKS = `
..kk..kk...
.kwwkkwWk..
kwwWWkwWxk.
kwWWxkWWxk.
kwWWxkwWxkk
.kxxk.kxxkwk
..kk...kkWxk
.........kk.
`;
const CRATES = `
kkkkkkkk.
kttttttuk
ktvtttvuk
kttvtvtuk
ktttvttuk
ktvtttvuk
kuuuuuuvk
kkkkkkkk.
`;
const BARREL = `
.kkkk.
kuttuk
kvvvvk
kuttuk
kuttuk
kvvvvk
.kkkk.
`;
const GOLD = `
...kk...
..kGnk..
.kGnnNk.
kGnGnnNk
kkkkkkkk
`;
const at = (p, dx, h, s) => pixStamp(g, Math.round(p[0]) + dx, Math.round(p[1]) - h, s);
// (every store sits at least 0.3 tile behind the front posts, which are drawn after it, so a post always passes in front)
at(gp(0.45, 0.25), -5, 7, CRATES); at(gp(0.55, 1.75), -4, 7, SACKS); at(gp(0.35, 1.35), -4, 4, GOLD); at(gp(0.9, 1.75), -3, 6, BARREL);

// front row: posts along both open front sides (the tower carries the right side's back half), tie beams on top
for (const b of [0, 0.5, 1, 1.5, 2]) post(gp(0, b), true);
post(gp(0.5, 2), false);
const TWL = gp(1, 2);                                            // where the tower's left corner meets the pavilion
beam(up(gp(0, 0), Z), up(gp(0, 2), Z), true); beam(up(gp(0, 2), Z), up(TWL, Z), false);
// team hangings in the open bays of both front sides: each hangs from a rail run between two posts just under the eave
// (so it shows below the roof and the rail rests on the posts), long enough to read at 1×. The age sets the rail (log /
// timber / iron / gilt), the hem and the charge (Dark a pale sun on a hide, Feudal a chevron, Castle a cross, Imperial gilt).
const RAILZ = Z - (AGE === 0 ? 11 : 8), BH = AGE === 0 ? 13 : 15;
const hang = (A, Bp, u0) => {   // u0: the bay's left post along the face (bays are 16 px)
  face(A, Bp, u0 + 2, u0 + 14, RAILZ, RAILZ, () => AGE === 3 ? Au[1] : AGE === 2 ? AK.Fe[1] : TW[2]);
  face(A, Bp, u0 + 2, u0 + 14, RAILZ + 1, RAILZ + 1, () => 'k');
  const sl = (Bp[1] - A[1]) / (Bp[0] - A[0]), w = 9, c = facePt(A, Bp, u0 + 4 + (w - 1) / 2, RAILZ - 1);
  teamBanner(g, Math.round(A[0]) + u0 + 4, c[1], sl, w, BH, { charge: ['sun', 'chevron', 'cross', 'disc'][AGE] });
};
hang(gp(0, 0), gp(0, 2), 16); hang(gp(0, 0), gp(0, 2), 48); hang(gp(0, 2), gp(2, 2), 0); hang(gp(0, 2), gp(2, 2), 16);

// ---- the big roof: hipped red tile over the pavilion, overhanging along the iso axes so its eaves stay 2:1 and parallel to
// the courses; every face uses the same tile (4-px courses, 5-px tiles, lit lip, seams), each face starting from its own eave.
// Other ages: the age kit's roof material (Dark: a deeper overhang, the thatch dropping low over the posts).
const e = AGE === 0 ? 4 : 2, dr = AGE === 0 ? 4 : 2, rb = { L: up(D.L, Z), Bm: up(D.Bm, Z), Rr: up(D.Rr, Z), T: up(D.T, Z) };
const R = { L: [rb.L[0] - 2 * e, rb.L[1] + dr], Bm: [rb.Bm[0], rb.Bm[1] + e + dr], Rr: [rb.Rr[0] + 2 * e, rb.Rr[1] + dr], T: [rb.T[0], rb.T[1] - e + dr] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '6', left: '7', front: '8', right: '9' });
const offP = p => -Math.round(p[1] - 0.5 * p[0]), offM = p => -Math.round(p[1] + 0.5 * p[0]);
const LIT = { h: 4, w: 5, joint: 'd', seam: 'd', lip: 'g', tones: ['c', 'c', 'b'] }, SHD = { h: 4, w: 5, joint: 'e', seam: 'e', lip: 'a', tones: ['d', 'd', 'a'] };
/** paint a hipped roof's four faces: the tuned tile courses (Castle) or the age kit's material */
const roofFaces = (Rf) => {
  if (C) {
    paint(g, '8', (x, y) => course(x, y, 0.5, { off: offP(Rf.L), ...LIT }));
    paint(g, '9', (x, y) => course(x, y, -0.5, { off: offM(Rf.Bm), ...SHD }));
    paint(g, '7', (x, y) => course(x, y, -0.5, { off: offM(Rf.L), flip: true, ...LIT }));     // back slopes: flip
    paint(g, '6', (x, y) => course(x, y, 0.5, { off: offP(Rf.Rr), flip: true, ...SHD }));
    return;
  }
  paint(g, '8', (x, y) => AK.roofXY(x, y, 0.5, 0, { off: offP(Rf.L) }));
  paint(g, '9', (x, y) => AK.roofXY(x, y, -0.5, 1, { off: offM(Rf.Bm) }));
  paint(g, '7', (x, y) => AK.roofXY(x, y, -0.5, 2, { off: offM(Rf.L), flip: true }));          // back slopes: flip
  paint(g, '6', (x, y) => AK.roofXY(x, y, 0.5, 3, { off: offP(Rf.Rr), flip: true }));
};
/** eave edge and the age's eave dressing (Dark: a ragged thatch fringe; Imperial: gilt trim) */
const roofEaves = (Rf) => {
  const E = C ? 'e' : RK[6], sag = AGE <= 1 ? 1 : 0;   // the long Dark/Feudal eaves sag a pixel between the corners
  sagLine(g, Rf.L, Rf.Bm, E, sag, 0); sagLine(g, Rf.Bm, Rf.Rr, E, sag, 0);
  if (AGE === 0) for (let x = Math.ceil(Rf.L[0]) + 1; x < Rf.Rr[0]; x++) { const cl = hash(x >> 1, 76); if (cl < 0.3) continue;   // ragged straw clumps
    const t = x <= Rf.Bm[0] ? (x - Rf.L[0]) / (Rf.Bm[0] - Rf.L[0]) : (x - Rf.Bm[0]) / (Rf.Rr[0] - Rf.Bm[0]);
    const ey = (x <= Rf.Bm[0] ? Rf.L[1] + (x - Rf.L[0]) * 0.5 : Rf.Bm[1] - (x - Rf.Bm[0]) * 0.5) + Math.round(sag * Math.sin(Math.PI * t)), n = 1 + Math.floor(hash(x, 77) * (cl > 0.8 ? 3 : 2));
    for (let d = 0; d < n; d++) pixSet(g, x, Math.round(ey) + 1 + d, d === n - 1 ? RK[6] : RK[hash(x, 78) < 0.5 ? 4 : 5]); }
  if (AGE === 3) AK.trim(g, [Rf.L[0] + 1, Rf.L[1]], Rf.Bm, -1) && AK.trim(g, Rf.Bm, [Rf.Rr[0] - 1, Rf.Rr[1]], -1);
};
roofFaces(R);
roofEaves(R);
for (const [P, lit] of [[R.L, 1], [R.Bm, 1], [R.Rr, 0], [R.T, 0]]) { line(g, P, ap, 'k'); line(g, [P[0] - 1, P[1]], [ap[0] - 1, ap[1]], C ? (lit ? 'h' : 'b') : AGE === 0 ? RK[lit ? 3 : 5] : RK[lit ? 1 : 3]); }
if (AGE === 3) for (const P of [R.L, R.Bm, R.Rr]) AK.crest(g, lerp(P, ap, 0.14), lerp(P, ap, 0.86));
// smoke louvre astride the apex: a small slatted box whose base corners sit on the four hips (so its foot is on the roof),
// with its own tiled cap and a gilt finial. Dark: no louvre, a smoke hole under crossed gable poles. Imperial: a taller
// arcaded limestone cupola with a slate cap and a gilt orb.
let smoke;
if (AGE === 0) {
  pixStamp(g, ap[0] - 4, ap[1] - 1, `
.kkkkkkk.
kbbcccbbk
.kkkkkkk.
`.replace(/b/g, RK[4]).replace(/c/g, DEEP));
  AK.finial(g, Math.round(ap[0]), Math.round(ap[1]) - 2);
  smoke = [Math.round(ap[0]), Math.round(ap[1]) - 2];
} else {
  const LS = 0.3, LD = ROOF * (LS / 2) / ((64 + 2 * e) / 64), LZ = LD + (AGE === 3 ? 14 : 7);
  const lv = pixIsoBox(g, ap[0], ap[1] + 16 * LS + LD, LS, LS, LZ, 1, { left: '!', right: '@' });
  if (AGE === 3) {
    const arc = (A, Bp, lit) => (x, y) => { const u = x - Math.round(A[0]), h = Math.floor(wallH(A, Bp, x + 0.5, y + 0.5)) - Math.ceil(LD);
      if (h < 0) return lit ? 'S' : 'q';
      if (h >= LZ - LD - 2) return lit ? Au[0] : Au[1];
      return (u === 3 || u === 4) && h >= 2 && h < LZ - LD - 4 ? 'i' : (lit ? 's' : 'S'); };
    paint(g, '!', arc(lv.base.L, lv.base.Bm, true)); paint(g, '@', arc(lv.base.Bm, lv.base.Rr, false));
  } else {
    paint(g, '!', (x, y) => (Math.floor(wallH(lv.base.L, lv.base.Bm, x + 0.5, y + 0.5)) % 2 ? 'i' : 't'));
    paint(g, '@', (x, y) => (Math.floor(wallH(lv.base.Bm, lv.base.Rr, x + 0.5, y + 0.5)) % 2 ? 'i' : 'u'));
  }
  const lR = { L: [lv.L[0] - 2, lv.L[1] + 1], Bm: [lv.Bm[0], lv.Bm[1] + 2], Rr: [lv.Rr[0] + 2, lv.Rr[1] + 1], T: [lv.T[0], lv.T[1]] };
  const lap = pixIsoRoof(g, lR, AGE === 3 ? 9 : 6, 1, { back: '6', left: '7', front: '8', right: '9' });
  if (C) { paint(g, '8', () => 'c'); paint(g, '7', () => 'b'); paint(g, '9', () => 'd'); paint(g, '6', () => 'a'); }
  else { paint(g, '8', () => RK[2]); paint(g, '7', () => RK[1]); paint(g, '9', () => RK[4]); paint(g, '6', () => RK[3]); }
  line(g, lR.L, lR.Bm, C ? 'e' : RK[6]); line(g, lR.Bm, lR.Rr, C ? 'e' : RK[6]); line(g, lR.Bm, lap, 'k');
  if (AGE === 3) AK.trim(g, lR.L, lR.Bm, 0) && AK.trim(g, lR.Bm, lR.Rr, 0);
  if (C) pixStamp(g, lap[0] - 1, lap[1] - 4, `
.G.
kGk
.n.
`);
  else AK.finial(g, Math.round(lap[0]), Math.round(lap[1]) - 1);
  // smoke leaves through the louvre's side slats, just under its cap
  smoke = C ? [Math.round(lap[0]), Math.round(lap[1]) - 4] : [Math.round(lap[0]) + 3, Math.round(lap[1]) - 2];
}

// ---- side tower on the right corner tile: coursed stone, quoins, an arched door onto the forecourt, lancet windows and a
// team banner laid out on each face (they slant with the wall), tile cap. The code flag waves from its apex.
// Dark: a palisade-log lookout with an open watch gallery; Feudal: timber-framed storeys on a stone plinth; Imperial: the
// stone tower raised, gilt string courses, pinnacles and a slate spire.
const tw = pixIsoBox(g, bx + 64, by - PL - 32, 1, 1, TZ, 1, { left: '!', right: '@' });
const TB = tw.base;
if (AGE === 0) {
  const GAL = TZ - 11;                                                          // the open watch gallery from here up
  const logs = (A, Bp, lit) => (x, y) => {
    const u = x - Math.round(A[0]), h = Math.floor(wallH(A, Bp, x + 0.5, y + 0.5)), n = Math.round(Bp[0] - A[0]);
    if (h < 2) return hash(u >> 2, 3) < 0.5 ? (lit ? 'S' : 'q') : (lit ? 'q' : 'Q');            // fieldstone footing
    if (h >= GAL && h < TZ - 1) {                                               // watch gallery: corner posts, a rail, the dark inside
      if (u < 2 || u >= n - 2 || u === 15 || u === 16) return u % 2 ? TW[1] : TW[0];
      if (h === GAL + 4 || h === GAL + 5) return h === GAL + 5 ? TW[0] : TW[2];
      return DEEP;
    }
    if (h === GAL - 1 || h === TZ - 1) return TW[2];                            // gallery floor beam / wall plate
    if (h === 14 || h === 30) return hash(u, h) < 0.5 ? 'x' : 'W';             // rope lashing round the logs
    const c = ((u % 4) + 4) % 4;
    return lit ? [TW[0], TW[0], TW[1], TW[2]][c] : [TW[1], TW[1], TW[2], 'V'][c];
  };
  paint(g, '!', logs(TB.L, TB.Bm, true)); paint(g, '@', logs(TB.Bm, TB.Rr, false));
  line(g, TB.Bm, tw.Bm, 'k');
  // a hide hung across the low doorway onto the forecourt, drawn aside at one edge
  face(TB.L, TB.Bm, 12, 21, 0, 15, (su, sh) => {
    if (sh === 15) return TW[2];
    if (su === 0 || su === 9) return 'k';
    if (su === 1 || su === 8) return TW[1];
    if (su >= 6) return DEEP;
    if (sh <= 1) return sh === 0 ? DEEP : (hash(su, 3) < 0.5 ? 'D' : 'T');
    if (Math.hypot(su - 3, (sh - 9) * 1.2) < 1.5) return 'L';
    return su === 2 ? 'L' : su === 5 ? 'D' : 'T';
  });
  // a team hide stretched on a pole frame on the shaded face
  face(TB.Bm, TB.Rr, 9, 17, 16, 28, (su, sh) => {
    if (su === 0 || su === 8 || sh === 0 || sh === 12) return (su === 0 || su === 8) ? TW[2] : TW[1];
    if (Math.abs(su - 4) + Math.abs(sh - 6) * 0.8 > 6) return null;
    if (Math.hypot(su - 4, sh - 6) < 1.6) return 'L';
    return su < 3 ? 'T' : 'D';
  });
  // arrow-slit peepholes
  for (const [A, Bp, u, h] of [[TB.L, TB.Bm, 6, 20], [TB.Bm, TB.Rr, 22, 12]]) face(A, Bp, u, u + 1, h, h + 3, () => DEEP);
} else if (AGE === 1) {
  const STY = 17, PLT = 3;
  const frame = (A, Bp, lit) => (x, y) => {
    const u = x - Math.round(A[0]), h = Math.floor(wallH(A, Bp, x + 0.5, y + 0.5)), n = Math.round(Bp[0] - A[0]) + 1;
    if (h < PLT) return AK.wallTex(u, h, lit ? 0 : 1, { len: n, H: TZ, pl: PLT });
    const c = AK.wallTex(u, (h - PLT) % STY, lit ? 0 : 1, { len: n, H: STY, pl: 0, step: 11 });
    return lit ? c : (SHADE[c] || c);
  };
  // the shaded face one tone down again, so the tower's two faces part clearly at 1×
  const SHADE = { [AK.P[0]]: AK.P[1], [AK.P[1]]: AK.P[2], [TW[0]]: TW[1], [TW[1]]: TW[2] };
  paint(g, '!', frame(TB.L, TB.Bm, true)); paint(g, '@', frame(TB.Bm, TB.Rr, false));
  line(g, TB.Bm, tw.Bm, 'k');
  // a dark line under each storey's sill, so the storeys read as stacked
  for (let s = 1; s * STY + PLT < TZ; s++) { const h = s * STY + PLT - 1; face(TB.L, TB.Bm, 0, 31, h, h, () => TW[2]); face(TB.Bm, TB.Rr, 0, 31, h, h, () => 'V'); }
  // shuttered windows (team shutters)
  for (const s of [0, 1, 2]) { const h = PLT + s * STY + 9;
    if (h > TZ - 4) continue;
    if (s) for (const u of [6, 17]) { const p = facePt(TB.L, TB.Bm, u, h); AK.windowAt(g, p[0], p[1], 0.5, 0); }
    for (const u of s ? [17, 27] : [27]) { const q = facePt(TB.Bm, TB.Rr, u, h); AK.windowAt(g, q[0], q[1], -0.5, 1); } }
  // team plank door onto the forecourt under a timber lintel, iron straps running with the wall
  face(TB.L, TB.Bm, 12, 21, 0, 15, (su, sh) => {
    if (sh === 15 || sh === 14) return sh === 15 ? TW[2] : TW[1];
    if (su === 0 || su === 9) return TW[2];
    if (su === 1 || su === 8 || sh === 13) return 'k';
    if (sh === 0) return 'S';
    if (sh === 4 || sh === 10) return Fe[1];
    if (su === 6 && sh === 7) return Au[1];
    return su === 2 ? 'L' : su % 2 ? 'D' : 'T';
  });
  // a long team banner down the lit face's upper storeys, hung from the jetty beam beside the windows
  { const c = facePt(TB.L, TB.Bm, 22 + 3.5, PLT + 2 * STY - 2); teamBanner(g, Math.round(TB.L[0]) + 22, c[1], 0.5, 8, 22, { charge: 'chevron' }); }
} else {
  paint(g, '!', (x, y) => course(x, y, 0.5, { h: 4, w: 7, joint: 'q', seam: 'q', lip: 's', tones: ['S', 'S', 's', 'q'] }));
  paint(g, '@', (x, y) => course(x, y, -0.5, { h: 4, w: 7, joint: 'j', seam: 'j', tones: ['q', 'Q', 'q', 'S'] }));
  // quoins: long and short dressed blocks alternating up the front corner, each course flush with its face's slope
  face(TB.L, TB.Bm, 25, 31, 0, TZ - 1, (su, sh) => { const c = Math.floor(sh / 4), long = c % 2 === 0; if (su < (long ? 0 : 3)) return null; return sh % 4 === 3 ? 'q' : 's'; });
  face(TB.Bm, TB.Rr, 0, 5, 0, TZ - 1, (su, sh) => { const c = Math.floor(sh / 4), long = c % 2 === 1; if (su > (long ? 5 : 2)) return null; return sh % 4 === 3 ? 'j' : 'S'; });
  line(g, TB.Bm, tw.Bm, 'k');
  // Imperial: gilt string courses ring the raised tower
  if (AGE === 3) for (const h of [22, 40, TZ - 3]) { face(TB.L, TB.Bm, 0, 31, h, h + 1, (su, sh) => sh ? Au[0] : Au[1]); face(TB.Bm, TB.Rr, 0, 31, h, h + 1, (su, sh) => sh ? Au[1] : Au[2]); }
  const lancet = (A, Bp, u0, h0, lit) => face(A, Bp, u0, u0 + 4, h0, h0 + 9, (su, sh) => {
    if (sh === 9) return su === 2 ? 'k' : null;
    if (sh === 8) return su === 0 || su === 4 ? null : (su === 2 ? (lit ? 'O' : 'i') : 'k');
    if (sh === 0) return lit ? 'S' : 'q';                                         // sill
    if (su === 0 || su === 4) return 'k';
    return lit ? (su === 2 ? 'y' : (sh > 5 ? 'i' : 'O')) : (su === 2 && sh > 2 && sh < 7 ? 'o' : 'i');
  });
  lancet(TB.L, TB.Bm, 6, 44, true); lancet(TB.L, TB.Bm, 6, 26, true);
  lancet(TB.Bm, TB.Rr, 20, 46, false); lancet(TB.Bm, TB.Rr, 20, 28, false);
  if (AGE === 3) { lancet(TB.L, TB.Bm, 6, 58, true); lancet(TB.Bm, TB.Rr, 20, 58, false); }
  // arched door onto the forecourt: plank leaf, iron straps that run with the wall, stone jambs (Imperial: a gilt keystone)
  face(TB.L, TB.Bm, 11, 21, 0, 18, (su, sh) => {
    const n = 10, k = sh - 14;                                                    // the arch springs at h 14
    if (k >= 0 && (su < k || su > n - k)) return null;                            // outside the arch
    if (AGE === 3 && sh >= 17 && su === 5) return Au[0];
    if (su === 0 || su === n || (k >= 0 && (su === k || su === n - k)) || sh === 18) return 'q';  // stone jambs and voussoirs
    if (su === 1 || su === n - 1 || (k >= 0 && (su === k + 1 || su === n - k - 1)) || sh === 17) return 'k';
    if (sh === 4 || sh === 11) return 'k';                                        // iron straps, running with the wall
    if (su === n - 3 && sh === 8) return 'G';                                     // ring handle
    return su % 2 ? 'u' : 'v';
  });
  // team banner on the lit face, hung from an iron rod between the windows and the corner (Imperial: gilt rod and fringe)
  face(TB.L, TB.Bm, 14, 21, 32, 52, (su, sh) => {
    if (sh === 20) return su === 0 || su === 7 ? 'k' : AGE === 3 ? Au[1] : 'j';
    if (sh <= 1 && (su === 3 || su === 4)) return null;
    if (su === 0 || su === 7) return 'k';
    if (su === 1 || su === 6) return AGE === 3 ? Au[su === 1 ? 0 : 2] : 'D';
    if (AGE === 3 && sh === 2) return Au[1];
    if ((sh >= 7 && sh <= 15 && (su === 3 || su === 4)) || (sh >= 11 && sh <= 12 && su >= 2 && su <= 5)) return 'L';
    return 'T';
  });
  // and a second on the shaded face, between the corner quoins and the lancets
  { const c = facePt(TB.Bm, TB.Rr, 8 + 3.5, 50); teamBanner(g, Math.round(TB.Bm[0]) + 8, c[1], -0.5, 8, 21); }
  // weathering low on the tower: moss at the foot, damp splash, a few rain streaks under the windows
  { const dk = { s: 'S', S: 'q', q: 'Q', Q: 'j' }; weather(g, TB.L, TB.Bm, 'sSq', dk, { rows: AGE === 3 ? 3 : 5, seed: 4, H: 30, streaks: AGE === 3 ? 0.04 : 0.08 });
    weather(g, TB.Bm, TB.Rr, 'Sq', dk, { rows: AGE === 3 ? 3 : 5, seed: 8, H: 30, streaks: AGE === 3 ? 0.04 : 0.08 }); }
}
// tower cap: the same tile as the main roof, courses from each eave (Dark: a steep shaggy thatch over the gallery; Imperial:
// a tall slate spire with gilt trim, corner pinnacles and an orb)
const TO = AGE === 0 ? 3 : 2, CAP = [22, 16, 12, 32][AGE];
const tR = { L: [tw.L[0] - TO, tw.L[1] + TO / 2], Bm: [tw.Bm[0], tw.Bm[1] + TO], Rr: [tw.Rr[0] + TO, tw.Rr[1] + TO / 2], T: [tw.T[0], tw.T[1] - 1] };
const tap = pixIsoRoof(g, tR, CAP, 1, { back: '6', left: '7', front: '8', right: '9' });
roofFaces(tR);
if (C) { line(g, tR.L, tR.Bm, 'e'); line(g, tR.Bm, tR.Rr, 'e'); } else roofEaves(tR);
line(g, tR.Bm, tap, 'k'); line(g, [tR.Bm[0] - 1, tR.Bm[1]], [tap[0] - 1, tap[1]], C ? 'h' : RK[AGE === 0 ? 3 : 1]);
if (AGE === 3) {
  AK.crest(g, lerp(tR.Bm, tap, 0.15), lerp(tR.Bm, tap, 0.8));
  // pinnacles on the three visible corners of the tower top, each on the eave corner it rises from
  for (const P of [tR.L, tR.Bm, tR.Rr]) pixStamp(g, Math.round(P[0]) - 1, Math.round(P[1]) - 7, `
.k.
kλk
kμk
kSk
kSk
kqk
kkk
`);
}
if (!C) AK.finial(g, Math.round(tap[0]), Math.round(tap[1]) - (AGE === 0 ? 1 : 2));

// ---- forecourt: the well on the front tile, on the hall's axis; a market stall under a team awning on the left corner tile;
// barrels and a sack set against the tower wall by its door
const FC = p => [p[0], p[1] - PL];
{ // well: a coursed stone drum with dark water, two posts, a crossbar and a bucket on its rope
  const [cx, cy] = FC([bx, by - 14]), top = cy - 5;
  const pre = copy(g);
  for (let x = -6; x <= 6; x++) {
    const ey = Math.round(Math.sqrt(Math.max(0, 1 - (x / 6.5) ** 2)) * 3), wy = Math.round(Math.sqrt(Math.max(0, 1 - (x / 4.5) ** 2)) * 2);
    for (let yy = top + ey; yy <= cy + ey - 1; yy++) pixSet(g, cx + x, yy, (yy - top - ey) % 3 === 2 ? 'j' : (x < -1 ? 'S' : x < 3 ? 'q' : 'Q'));
    for (let yy = top - ey; yy < top + ey; yy++) pixSet(g, cx + x, yy, Math.abs(x) <= 4 && yy >= top - wy && yy < top + wy ? (yy === top - wy ? 'i' : 'B') : (x < 0 ? 's' : 'q'));
  }
  pixSet(g, cx - 2, top, 'z');
  // a low windlass across the rim (two short posts and a roller with its rope coiled on it); the bucket stands on the
  // paving by the drum
  for (const sx of [-6, 5]) for (let yy = top - 5; yy < top; yy++) { pixSet(g, cx + sx, yy, sx < 0 ? 't' : 'u'); pixSet(g, cx + sx + 1, yy, 'v'); }
  pixLine(g, cx - 5, top - 5, cx + 4, top - 5, 'x'); pixLine(g, cx - 5, top - 4, cx + 4, top - 4, 'u');
  pixStamp(g, cx + 7, cy - 1, `
kkkk
kutk
kuvk
.kk.
`);
  // ink the well's silhouette where it meets the paving, so it stands on the forecourt instead of melting into it
  const mine = (x, y) => g[y][x] !== pre[y][x];
  const ink = [];
  for (let y = cy - 20; y <= cy + 8; y++) for (let x = cx - 9; x <= cx + 12; x++) if (!mine(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => mine(x + dx, y + dy))) ink.push([x, y]);
  for (const [x, y] of ink) g[y][x] = 'k';
}
{ // market stall: a plank counter with produce, four posts, and a striped team awning sloping toward the customer
  const s0 = FC([bx - 60, by - 42]);                                          // front corner of the counter
  const cw = 0.42, cd = 0.22, ch = 6, ah = 15, ab = 18;
  const cL = [s0[0] - cw * 32, s0[1] - cw * 16], cR = [s0[0] + cd * 32, s0[1] - cd * 16], cT = [cL[0] + cd * 32, cL[1] - cd * 16];
  // back posts first, then the counter, then the front posts and the cloth. The back posts run all the way down to the paving
  // (the counter covers their feet where it is in front of them), so the back-right one, at the counter's right end, is seen
  // standing on the ground instead of stopping in mid-air at counter height (round-2 note "floating pillar on the small tent").
  for (const P of [cT, cR]) { const x = Math.round(P[0]), y = Math.round(P[1]); for (let yy = y - ab; yy < y; yy++) { pixSet(g, x, yy, 'u'); pixSet(g, x + 1, yy, 'v'); pixSet(g, x + 2, yy, 'k'); } }
  const ctr = pixIsoBox(g, s0[0], s0[1], cw, cd, ch, 1, { left: '$', right: '%', top: '^' });
  paint(g, '$', (x, y) => (Math.floor(wallH(ctr.base.L, ctr.base.Bm, x + 0.5, y + 0.5)) % 3 === 2 ? 'v' : 't'));
  paint(g, '%', (x, y) => (Math.floor(wallH(ctr.base.Bm, ctr.base.Rr, x + 0.5, y + 0.5)) % 3 === 2 ? 'V' : 'u'));
  paint(g, '^', () => 'w');
  // produce on the counter: apples, cabbages, a cheese
  for (const [t, c1, c2] of [[0.2, 'O', 'o'], [0.45, 'G', 'n'], [0.72, 'O', 'o']]) { const p = lerp(ctr.L, ctr.Bm, t); const x = Math.round(p[0]) + 2, y = Math.round(p[1]) - 2; pixRect(g, x - 1, y - 1, 3, 2, c1); pixSet(g, x + 1, y, c2); pixSet(g, x - 1, y - 2, 'k'); pixSet(g, x, y - 2, 'k'); pixSet(g, x + 1, y - 2, 'k'); }
  for (const P of [cL, s0]) { const x = Math.round(P[0]), y = Math.round(P[1]); for (let yy = y - ah; yy < y; yy++) { pixSet(g, x, yy, 't'); pixSet(g, x + 1, yy, 'v'); } }
  const f0 = up(cL, ah), f1 = up(s0, ah), b0 = up(cT, ab), b1 = up(cR, ab);
  pixPoly(g, [f0, f1, b1, b0], '&');
  // stripes run from the high back edge down to the hem (along the cloth's slope), alternating team and light
  paint(g, '&', (x, y) => { const s = (x - f0[0]) - 2 * (y - f0[1]); return Math.floor(s / 6) % 2 ? 'L' : 'T'; });
  line(g, b0, b1, 'k'); line(g, f0, b0, 'k');
  for (let k = 0; k <= 8; k++) { const p = lerp(f0, f1, k / 8); pixSet(g, p[0], p[1], 'D'); pixSet(g, p[0], p[1] + 1, k % 2 ? 'D' : 'k'); }
}

{ const p = lerp(TB.L, TB.Bm, 0.12); pixStamp(g, Math.round(p[0]) - 4, Math.round(p[1]) - 7, `
.kkkk.kk..
kuttukwWk.
kvvvvkWxk.
kuttukWxk.
kuttukkkk.
kvvvvk....
.kkkk.....
`); }

const base = outline(g, 'k', C ? { S: 'q', g: 'b', h: 'b', s: 'S', p: 'P' } : { S: 'q', s: 'S', p: 'P', ...AK.sel });
// grass over the foot of the plinth, so the footprint is not a ruler-straight diamond (fewer round the grander halls)
tufts(base, pl.base.L, pl.base.Bm, { n: [7, 6, 4, 3][AGE], seed: 5 }); tufts(base, pl.base.Bm, pl.base.Rr, { n: [7, 6, 4, 3][AGE], seed: 6 });

// ---- idle: 6 frames — the hearth fire flickers and its glow pulses on the floor flags; smoke rises from the louvre
const H0 = [HEARTH[0], HEARTH[1] - 3];
const FLAMES = [`
...y...
..yOy..
.yOYOy.
`, `
..y....
..Oyy..
.yOYOy.
`, `
....y..
..yyO..
.yOYOy.
`];
const [sx, sy] = smoke;
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  const R2 = [7, 8, 6, 9, 7, 8][i];
  paint(f, 'fFp', (x, y) => { const d = Math.hypot((x - H0[0]) * 0.5, (y - H0[1] - 1) * 1.1); return d < R2 * 0.45 ? 'r' : d < R2 ? (f[y][x] === 'f' ? 'F' : null) : null; });
  pixStamp(f, H0[0] - 3, H0[1] - 2, FLAMES[i % 3]);
  for (let k = 0; k < 3; k++) {
    const t = ((i + k * 2) % 6) / 6, r = t < 0.2 ? 0 : t < 0.7 ? 2 : 1;
    const x = sx + Math.round(Math.sin(t * 5) * 1.5 + t * 10), y = sy - Math.round(2 + t * 24);
    if (r === 0) { pixRect(f, x, y, 2, 2, 'Z'); pixSet(f, x, y, 'z'); continue; }
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.6) pixSet(f, x + xx, y + yy, xx + yy < 0 ? 'z' : xx + yy > r ? 'X' : 'Z');
  }
  frames.push(pixText(f));
}

// per-age material for the shared stone / paving / floor chars (Castle: the tuned colours)
const STONE = C ? {} : (() => { const k = AK.pal, s = AK.S; return { s: k[s[0]], S: k[s[1]], q: k[s[2]], Q: k[s[3]], j: k[s[AGE === 3 ? 4 : 5]] }; })();
const GROUND = [
  { p: '#9c7c54', P: '#866844', K: '#5e4a32', F: '#74593a', f: '#625034', r: '#a8804e' },   // trampled earth
  { p: '#b0a690', P: '#958b78', K: '#6b6355', F: '#857b6a', f: '#6e6658', r: '#b08a5e' },   // rubble flags
  {},
  { p: '#ece4cf', P: '#cdbf9f', K: '#a29274', F: '#b9aa8a', f: '#a49576', r: '#d8b47a' },   // limestone flags
][AGE];
// the code flag waves from the tower cap's front hip (Castle keeps the draw case's default [64,-112,16])
const FLAG = lerp(tR.Bm, tap, AGE === 3 ? 0.36 : 0.47);

return {
  id: 'townhall', kind: 'building', footprint: [W, H], anchor: [bx, by],
  ...(C ? {} : { flags: [[Math.round(FLAG[0]) - bx, Math.round(FLAG[1]) - by, 16]] }),
  palette: {
    ...AK.pal,
    k: '#24180f',                                                       // ink
    S: '#a39a8c', q: '#8d8478', Q: '#6f6a60', j: '#4f4a42', s: '#b8ae9c', // stone lit / mid / shade / mortar / light
    p: '#b3aa98', P: '#978e7e', K: '#6b6355', B: '#35505e',                           // paving, joints (forecourt / under the roof)
    F: '#857b6a', f: '#6e6658', r: '#b08a5e',                           // floor flags in the roof's shade, firelit flags
    t: '#a07a4a', u: '#8a6a3a', v: '#5a3a18', V: '#3b2614',             // timber
    i: '#1f1610', o: '#7a4a26', O: '#d8813a', y: '#ffc95a', Y: '#fff0b0', // dark, embers, fire
    g: '#d8805c', h: '#eea582', b: '#b85a3e', c: '#a0482e', a: '#8a3a2a', d: '#73301f', e: '#4e2016', // roof tiles
    w: '#efe6d2', W: '#d9c7a0', x: '#a8946e',                           // sacks, counter top, rope
    G: '#ffe28a', n: '#e1b12c', N: '#a87a12',                           // gold
    z: '#e4e0da', Z: '#c4beb8', X: '#948e88',                           // smoke, water glint
    ...NPAL,
    T: 'team', D: 'teamdark', L: 'teamlight',
    ...STONE, ...GROUND,
  },
  ...(C ? { roofChars: 'ghbcade' } : {}),
  frames: { idle: frames },
};
};
export default pixAged(make, 0);
