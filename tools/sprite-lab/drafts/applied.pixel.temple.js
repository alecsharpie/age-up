// @pixel temple
// Temple / Monastery (3×3), Western chapel: flagstone cloister yard, long ashlar-limestone nave with stepped buttresses and
// candle-lit lancets, pitched red-tile roof in courses, front gable with a stained-glass rose window, an arched team door and a
// gold cross; square bell tower at the front-left with string courses, quoins, an open belfry, team banner and tiled spire.
// Generated with local texture routines; anchor = bottom corner. idle: 4 frames — the bells swing, candlelight flickers.
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

// Age variants (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs); the temple stands from the Castle Age.
//   Castle   the chapel as tuned: limestone nave, red tiles, bell tower with a tiled spire and a gold cross (the original art).
//   Imperial pale limestone ashlar and blue-grey slate; gilt cresting along the nave ridge and gilt eave trim; the bell tower
//            raised a stage with gilt string courses, corner pinnacles and a taller slate spire under a gilt orb and cross;
//            a gilt-ringed rose window, gilt-fringed team banners flanking the west door.
const C = AGE === 2, { Au } = AK;
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 96 + (C ? 0 : 24);
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
// bottom corner of a box occupying tiles [x0,x0+w) × [y0,y0+h)
const bmOf = (x0, y0, w, h) => [bx + ((x0 + w) - (y0 + h)) * 32, by - 96 + ((x0 + w) + (y0 + h)) * 16];
const ashL = { h: 4, w: 7, joint: 'q', seam: 'q', lip: 'l', tones: ['l', 'm', 'l', 'm', 'M'] };
const ashR = { h: 4, w: 7, joint: 'Q', seam: 'Q', tones: ['r', 'r', 's'] };

// ---- cloister yard: flagstones in a stone kerb
const yard = pixIsoBox(g, bx, by, W, H, 3, 1, { left: '1', right: '2', top: '3' });
paint(g, '1', (x, y) => course(x, y, 0.5, { h: 3, w: 6, joint: 'j', seam: 'j', tones: ['S', 'q'] }));
paint(g, '2', (x, y) => course(x, y, -0.5, { h: 3, w: 6, joint: 'j', seam: 'j', tones: ['q', 'Q'] }));
paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 8, ox: bx, oy: by, joint: 'z', tones: ['y', 'Y', 'y', 'x'] }));   // flat on the ground

// ---- nave: long along x, ashlar limestone, buttresses, lancet windows with candle glow
const NX = 0.15, NY = 0.95, NW = 2.75, NH = 1.45, Z = 26, RISE = 18;
const nb = bmOf(NX, NY, NW, NH); nb[1] -= 3;
const top = pixIsoBox(g, nb[0], nb[1], NW, NH, Z, 1, { left: '4', right: '5' });
const base = top.base;
paint(g, '4', (x, y) => { const h = wallH(base.L, base.Bm, x, y); return h < 3 ? (h < 1 ? 'Q' : 'q') : h > Z - 3 ? 'M' : course(x, y, 0.5, ashL); });
paint(g, '5', (x, y) => { const h = wallH(base.Bm, base.Rr, x, y); return h < 3 ? (h < 1 ? 'j' : 'Q') : h > Z - 3 ? 's' : course(x, y, -0.5, ashR); });
const LANCET = `
..k..
.kwk.
kwWwk
kwWwk
kwwwk
kwWwk
kwwwk
kmmmk
`;
const lancets = [];
for (let k = 0; k < 6; k++) { const p = lerp(base.L, base.Bm, (k + 0.5) / 6); const x = Math.round(p[0]) - 2, y = Math.round(p[1]) - Z + 8; stampOn(g, x, y, LANCET, 0.5); lancets.push([x, y]); }
// buttresses: stepped piers, lit face / shade face / ink edge, a sloped cap halfway up
for (let k = 1; k < 6; k++) { const p = lerp(base.L, base.Bm, k / 6); const x = Math.round(p[0]), y = Math.round(p[1]);
  pixRect(g, x - 2, y - Z + 6, 2, Z - 6, 'l'); pixRect(g, x, y - Z + 6, 2, Z - 6, 'r'); pixRect(g, x + 2, y - Z + 6, 1, Z - 6, 'k');
  pixRect(g, x - 3, y - 11, 2, 11, 'l'); pixSet(g, x - 3, y - 12, 'k'); pixSet(g, x - 2, y - 13, 'k');
  pixRect(g, x - 2, y - Z + 5, 4, 1, 'k'); pixRect(g, x - 2, y - 1, 4, 1, 'Q'); }
// roof: pitched, red tile courses with lit lips; ridge along x, gable at the front-right end
const r1 = [lerp(top.T, top.L, 0.5)[0], lerp(top.T, top.L, 0.5)[1] - RISE], r2 = [lerp(top.Rr, top.Bm, 0.5)[0], lerp(top.Rr, top.Bm, 0.5)[1] - RISE];
const eL = [top.L[0] - 1, top.L[1] + 2], eB = [top.Bm[0] - 1, top.Bm[1] + 2];
pixPoly(g, [top.T, top.Rr, r2, r1], '6');
pixPoly(g, [top.Rr, top.Bm, r2], '8');
// (the far gable end at i = NX faces away from the viewer: the two roof slopes hide it, so it is not painted)
pixPoly(g, [eL, eB, r2, r1], '7');
// tile seams follow each slope's fall line (ridge to eave), courses run with the eave
const fallF = (eL[0] - r1[0]) / (eL[1] - r1[1]), fallB = (top.T[0] - r1[0]) / (top.T[1] - r1[1]);
paint(g, '7', (x, y) => course(x, y, 0.5, { h: 4, w: 6, joint: 'c', seam: 'b', lip: 'B', tones: ['A', 'A', 'B'], fall: fallF }));
paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 6, joint: 'e', seam: 'e', tones: ['c', 'b'], flip: true, fall: fallB }));   // back slope
paint(g, '8', (x, y) => course(x, y, -0.5, ashR));   // gable: same courses as the wall under it
line(g, r1, r2, 'k'); line(g, r1, r2, 'B', 1); line(g, eL, eB, 'k'); line(g, eL, eB, 'e', -1);
line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1]], [r2[0] + 1, r2[1]], 'B'); line(g, top.Rr, r2, 'k');
// gable: rose window (stained glass), arched team door, cross at the peak
const gm = lerp(top.Rr, top.Bm, 0.5);
const ROSE = [Math.round(gm[0]), Math.round(gm[1] - 5)];
discOn(g, ROSE[0], ROSE[1], 5, -0.5, (x, y) => { const d = Math.hypot(x, y), a = (Math.atan2(y, x) * 4 / Math.PI + 8) % 1;
  return d > 4.4 ? 'k' : d > 3.6 ? (C ? 'q' : Au[1]) : d < 1.2 ? 'G' : (a < 0.18 || a > 0.82) ? 'k' : ((Math.atan2(y, x) * 4 / Math.PI + 8) % 2 < 1 ? 'n' : 'R'); });
pixStamp(g, r2[0] - 2, r2[1] - 8, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
`);
{ const dm = lerp(base.Rr, base.Bm, 0.5); stampOn(g, Math.round(dm[0]) - 4, Math.round(dm[1]) - 15, `
...kkk...
..kqqqk..
.kqTTTqk.
kqTLTTDqk
kqLTTTDqk
kqLTDTDqk
kqLTDTDqk
kqLTGTDqk
kqLTDTDqk
kqLTDTDqk
kqLTDTDqk
kqDDDDDqk
kSSSSSSSk
`, -0.5); }

if (!C) { // Imperial: gilt cresting along the nave ridge, gilt eave trim, gilt-fringed banners flanking the west door
  AK.crest(g, [r1[0] + 2, r1[1]], [r2[0] - 2, r2[1]]);
  AK.trim(g, [eL[0] + 1, eL[1] - 1], [eB[0] - 1, eB[1] - 1], 0);
}
// team banners flanking the west door on iron (Imperial: gilt) rods
{ const dm = lerp(base.Rr, base.Bm, 0.5);
  for (const du of [-15, 9]) teamBanner(g, Math.round(dm[0]) + du, Math.round(dm[1] - (du + 2.5) * 0.5) - 21, -0.5, 6, C ? 14 : 15); }
// weathering low on the nave: moss at the foot, damp splash, rain streaks (formal: no change to the lines themselves)
weather(g, base.L, base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: C ? 6 : 4, seed: 2, H: Z - 3, streaks: C ? 0.06 : 0.04 });
weather(g, base.Rr[0] > base.Bm[0] ? base.Bm : base.Rr, base.Rr, 'rsQ', { r: 's', s: 'Q' }, { rows: C ? 6 : 4, seed: 7, H: Z - 3, streaks: C ? 0.06 : 0.04 });
// ---- bell tower at the front-left corner, ashlar with string courses, open belfry with a swinging bell, spire, gold cross
const TX = 0.1, TY = 2.0, TS = 0.9, TZ = C ? 50 : 64, SP = C ? 40 : 50;
const tb = bmOf(TX, TY, TS, TS); tb[1] -= 3;
// The tower overlaps the nave's front-left end: the back part of its right face (j < 2.4, behind the nave's front wall) is
// hidden by the nave wall and roof, so it rises out of the roof. `underTower` keeps the nave to restore those cells.
const underTower = copy(g);
const tt = pixIsoBox(g, tb[0], tb[1], TS, TS, TZ, 1, { left: '4', right: '5' });
const tbase = tt.base;
paint(g, '4', (x, y) => { const h = wallH(tbase.L, tbase.Bm, x, y); return h < 3 ? 'q' : course(x, y, 0.5, ashL); });
paint(g, '5', (x, y) => { const h = wallH(tbase.Bm, tbase.Rr, x, y); return h < 3 ? 'Q' : course(x, y, -0.5, ashR); });
for (const yy of C ? [17, 33] : [17, 33, 49]) { line(g, [tbase.L[0], tbase.L[1] - yy], [tbase.Bm[0], tbase.Bm[1] - yy], 'k'); line(g, [tbase.L[0], tbase.L[1] - yy + 1], [tbase.Bm[0], tbase.Bm[1] - yy + 1], C ? 'l' : Au[0]);
  line(g, [tbase.Bm[0], tbase.Bm[1] - yy], [tbase.Rr[0], tbase.Rr[1] - yy], 'k'); line(g, [tbase.Bm[0], tbase.Bm[1] - yy + 1], [tbase.Rr[0], tbase.Rr[1] - yy + 1], C ? 's' : Au[1]); }
// quoins on the tower's front corner
for (let k = 3; k < TZ - 2; k += 4) { const o = (k >> 2) % 2; pixRect(g, tbase.Bm[0] - 2 - o, tbase.Bm[1] - k - 3, 2 + o, 3, 'l'); pixRect(g, tbase.Bm[0], tbase.Bm[1] - k - 3, 2 + (1 - o), 3, 's'); }
const BELFRY = `
..kkk..
.kiiik.
kiiiiik
kiiiiik
kiiiiik
kiiiiik
kiiiiik
kmmmmmk
`;
const pL = lerp(tbase.L, tbase.Bm, 0.5), pR = lerp(tbase.Bm, tbase.Rr, 0.5);
const BELL_L = [Math.round(pL[0]) - 3, Math.round(pL[1]) - TZ + 3], BELL_R = [Math.round(pR[0]) - 3, Math.round(pR[1]) - TZ + 3];
stampOn(g, BELL_L[0], BELL_L[1], BELFRY, 0.5); stampOn(g, BELL_R[0], BELL_R[1], BELFRY.replace(/m/g, 's'), -0.5);
if (!C) { stampOn(g, Math.round(pL[0]) - 2, Math.round(pL[1]) - 45, LANCET, 0.5); lancets.push([Math.round(pL[0]) - 2, Math.round(pL[1]) - 45]); }
stampOn(g, Math.round(pL[0]) - 3, Math.round(pL[1]) - 30, `
.kkkkk.
kqnnnqk
knnGnnk
kqnnnqk
.kkkkk.
`, 0.5);
{ const pB = lerp(tbase.Bm, tbase.Rr, 0.42), w = 9; teamBanner(g, Math.round(pB[0]) - 4, Math.round(pB[1]) - 32, -0.5, C ? w : w + 1, C ? 22 : 30, { charge: 'cross' }); }
// and a long one down the lit face, hung under the second string course beside the gilt plaque
{ const pA = lerp(tbase.L, tbase.Bm, 0.76); teamBanner(g, Math.round(pA[0]) - 4, Math.round(pA[1]) - 32, 0.5, 8, 27, { charge: C ? 'cross' : 'disc' }); }
{ const roofZ = j => 3 + 24 + 20 * (NY + NH - j) / (NH / 2);   // nave front slope / wall in front of the tower's right face
  const hid = (x, y) => { if (x + 0.5 <= tbase.Bm[0]) return false; const i = TX + TS, j = i - (x + 0.5 - bx) / 32; return j < NY + NH && by - 96 + (i + j) * 16 - (y + 0.5) < roofZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTower[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTower[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'Q'; }
// spire: slate-dark tile faces in courses, cross on top
const sR = { L: [tt.L[0] - 1, tt.L[1] + 1], Bm: [tt.Bm[0], tt.Bm[1] + 2], Rr: [tt.Rr[0] + 1, tt.Rr[1] + 1], T: tt.T };
const ap = pixIsoRoof(g, sR, SP, 1, { back: '6', left: '7', front: '9', right: '0' });
paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'b', lip: 'B', tones: ['A'] }));
paint(g, '9', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'c', lip: 'A', tones: ['b'] }));
paint(g, '0', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'e', lip: 'b', tones: ['c'] }));
paint(g, '6', () => 'c');
line(g, sR.L, sR.Bm, 'k'); line(g, sR.Bm, sR.Rr, 'k'); line(g, sR.Bm, ap, 'k'); line(g, [sR.Bm[0] - 1, sR.Bm[1]], [ap[0] - 1, ap[1]], 'B');
if (C) pixStamp(g, ap[0] - 2, ap[1] - 9, `
..k..
.kGk.
kGGGk
.kGk.
.kGk.
.kgk.
..k..
`);
else { // gilt eave trim, crested front hip, pinnacles on the tower's corners, and a gilt cross over an orb
  AK.trim(g, [sR.L[0] + 1, sR.L[1]], sR.Bm, -1); AK.trim(g, sR.Bm, [sR.Rr[0] - 1, sR.Rr[1]], -1);
  AK.crest(g, lerp(sR.Bm, ap, 0.15), lerp(sR.Bm, ap, 0.75));
  for (const P of [sR.L, sR.Bm, sR.Rr]) pixStamp(g, Math.round(P[0]) - 1, Math.round(P[1]) - 8, `
.k.
kλk
kμk
klk
klk
kmk
kMk
kkk
`);
  pixStamp(g, ap[0] - 2, ap[1] - 12, `
..k..
.kλk.
kλλμk
.kμk.
.kμk.
.kλk.
kλμνk
kμμνk
.kνk.
..k..
`);
}

const baseG = outline(g, 'k', { l: 'm', y: 'Y', S: 'q', B: 'A' });
tufts(baseG, yard.base.L, yard.base.Bm, { n: C ? 3 : 2, seed: 3 }); tufts(baseG, yard.base.Bm, yard.base.Rr, { n: C ? 3 : 2, seed: 4 });

// ---- idle: 4 frames — the bells swing (left, centre, right, centre), candlelight flickers in the lancets
const BELLS = [`
.gg..
gGGg.
gGGgg
.g.k.
`, `
.gg.
gGGg
gGGg
gggg
.k..
`, `
..gg.
.gGGg
ggGGg
.k.g.
`];
const frames = [];
for (let i = 0; i < 4; i++) {
  const f = copy(baseG);
  const bell = BELLS[[0, 1, 2, 1][i]];
  for (const [x, y] of [BELL_L, BELL_R]) { pixSet(f, x + 3, y + 1, 'k'); pixStamp(f, x + 1, y + 2, bell); }
  lancets.forEach(([x, y], k) => { const on = (k + i) % 3; for (const [dy, n] of [[2, 0], [3, 1], [5, 2]]) if ('wW'.includes(pixGet(baseG, x + 2, y + dy))) pixSet(f, x + 2, y + dy, on === n ? 'O' : 'W'); });
  frames.push(pixText(f));
}

return {
  id: 'temple', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    k: '#24180f',                                                        // ink
    l: '#efe7d2', m: '#e0d5bb', M: '#cbbf9f',                            // limestone lit wall: light / mid / shadow
    r: '#c4b89c', s: '#ad9f80', Q: '#8f8268',                            // limestone shaded wall
    S: '#a39a8c', q: '#9a8f78', j: '#6f6a60',                            // plinth / trim
    y: '#cdc2a6', Y: '#bdb194', x: '#b0a487', z: '#9a8e72',              // flagstones
    A: '#b85a3a', B: '#d07a58', b: '#a0482e', c: '#7a3522', e: '#5e2a1a', // roof tiles
    w: '#6a3a1a', W: '#e89a3a', O: '#ffd36a',                            // lancet recess, candlelight
    n: '#3f6fb8', R: '#b8342a', G: '#ffe28a', g: '#c0953a',              // stained glass, gold, bell
    i: '#1f1610',                                                        // belfry dark
    ...NPAL,
    T: 'team', D: 'teamdark', L: 'teamlight',
    // Imperial: the same courses in the age kit's pale limestone and blue-grey slate
    ...(C ? {} : { l: AK.pal['σ'], m: AK.pal['ς'], M: AK.pal['τ'], r: AK.pal['ς'], s: AK.pal['τ'], Q: AK.pal['υ'],
      B: AK.pal['α'], A: AK.pal['γ'], b: AK.pal['δ'], c: AK.pal['ε'], e: AK.pal['η'], y: '#e6dcc4', Y: '#d6caae', x: '#c8bb9c', z: '#a89878' }),
  },
  roofChars: 'ABbce',
  frames: { idle: frames },
};
};
export default pixAged(make, 2);
