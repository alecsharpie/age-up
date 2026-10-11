// @pixel wonder
// Wonder (5×5): a Gothic cathedral — two-step plinth; coursed-ashlar nave with clerestory lancets under a slate roof; a lower
// south aisle with a lean-to roof and flying buttresses springing from pinnacled piers; transept arms with the great rose
// window and a team-colour portal on the lit gable; a west front with its own rose and portal; a crossing tower with belfry
// lancets and a team banner, crocketed slate spire and gold tip. Generated with local texture routines; anchor = bottom corner.
// idle: 4 frames — a glint runs up the gold spire tip and flashes, candlelight flickers in the windows.
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

const W = 5, H = 5;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 6 + 74 + 58 + 12;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const PL = 8;
// bottom corner (in cells) of a block occupying tiles [i,i+w) × [j,j+h), raised by z px
const blockBm = (i, j, w, h, z = 0) => [bx + (i - j + (w - h)) * 32, by - (W + H) * 16 + (i + j + w + h) * 16 - z];
const ashL = { h: 4, w: 8, joint: 'q', seam: 'q', lip: 'l', tones: ['l', 'm', 'l', 'm', 'M'] };
const ashR = { h: 4, w: 8, joint: 'Q', seam: 'Q', tones: ['r', 'r', 's'] };
/** a coursed-ashlar block: lit left face, shaded right face, plinth course and eave shadow; returns the top face */
const block = (i, j, w, h, z, z0 = PL) => {
  const bm = blockBm(i, j, w, h, z0); const t = pixIsoBox(g, bm[0], bm[1], w, h, z, 1, { left: '4', right: '5' }); const b = t.base;
  paint(g, '4', (x, y) => { const hh = wallH(b.L, b.Bm, x, y); return (z0 === PL && hh < 3) ? (hh < 1 ? 'Q' : 'q') : hh > z - 2 ? 'M' : course(x, y, 0.5, ashL); });
  paint(g, '5', (x, y) => { const hh = wallH(b.Bm, b.Rr, x, y); return (z0 === PL && hh < 3) ? (hh < 1 ? 'j' : 'Q') : hh > z - 2 ? 's' : course(x, y, -0.5, ashR); });
  return t;
};
const fall = (p, q) => (p[0] - q[0]) / (p[1] - q[1]);   // screen dx per dy from q down to p (a roof's fall line)
const slateLit = { h: 3, w: 4, joint: 'v', seam: 'v', lip: 'U', tones: ['u', 'u', 'U'] };
const slateMid = { h: 3, w: 4, joint: 'V', seam: 'V', lip: 'u', tones: ['v', 'v', 'u'] };
const slateDk = { h: 3, w: 4, joint: 'K', seam: 'K', lip: 'v', tones: ['V'] };
/** gable roof, ridge along i (x axis) — front slope lit-ish, end gable on the right face */
const gableX = (t, rise) => {
  const m1 = lerp(t.T, t.L, 0.5), m2 = lerp(t.Rr, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eL = [t.L[0] - 1, t.L[1] + 2], eB = [t.Bm[0] - 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.Rr, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, 0.5, { ...slateDk, flip: true, fall: fall(t.T, r1) }));   // back slope: downhill is up the screen
  pixPoly(g, [t.Rr, t.Bm, r2], '5'); paint(g, '5', (x, y) => course(x, y, -0.5, ashR));   // gable: the wall's own courses
  pixPoly(g, [eL, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(eL, r1) }));
  line(g, r1, r2, 'k'); line(g, r1, r2, 'f', 1); line(g, eL, eB, 'k'); line(g, eB, r2, 'k'); line(g, [eB[0] + 1, eB[1] - 1], [r2[0] + 1, r2[1]], 'Q'); line(g, t.Rr, r2, 'k');
  return { r1, r2 };
};
/** gable roof, ridge along j (y axis) — left slope brightest, end gable on the lit left face */
const gableY = (t, rise) => {
  const m1 = lerp(t.T, t.Rr, 0.5), m2 = lerp(t.L, t.Bm, 0.5), r1 = [m1[0], m1[1] - rise], r2 = [m2[0], m2[1] - rise];
  const eR = [t.Rr[0] + 1, t.Rr[1] + 2], eB = [t.Bm[0] + 1, t.Bm[1] + 2];
  pixPoly(g, [t.T, t.L, r2, r1], '6'); paint(g, '6', (x, y) => course(x, y, -0.5, { ...slateLit, flip: true, fall: fall(t.T, r1) }));  // back slope
  pixPoly(g, [t.L, t.Bm, r2], '4'); paint(g, '4', (x, y) => course(x, y, 0.5, ashL));   // gable: the wall's own courses
  pixPoly(g, [eR, eB, r2, r1], '7'); paint(g, '7', (x, y) => course(x, y, -0.5, { ...slateDk, fall: fall(eR, r1) }));
  line(g, r1, r2, 'k'); line(g, r1, r2, 'f', 1); line(g, eR, eB, 'k'); line(g, eB, r2, 'k'); line(g, t.L, r2, 'k'); line(g, [t.L[0] + 1, t.L[1]], [r2[0], r2[1] + 1], 'l');
  return { r1, r2 };
};
const LANCET = `
..k..
.kik.
kiNik
kiNik
kiiik
kNiNk
kNiNk
kiiik
kiNik
kmmmk
`;
const LANCETR = LANCET.replace(/m/g, 's');
const lit = []; // candle-lit window cells, flickered per frame
const lancet = (x, y, tpl) => { stampOn(g, Math.round(x) - 2, Math.round(y), tpl, tpl === LANCET ? 0.5 : -0.5); lit.push([Math.round(x), Math.round(y) + 4]); };
const pinnacle = (x, y, hgt) => { x = Math.round(x); y = Math.round(y);
  for (let k = 0; k < hgt; k++) { pixSet(g, x - 1, y - k, 'k'); pixSet(g, x, y - k, 'l'); pixSet(g, x + 1, y - k, 'r'); pixSet(g, x + 2, y - k, 'k'); }
  pixStamp(g, x - 1, y - hgt - 5, `
.k..
.lk.
klrk
klrk
kkkk
`); };
/** rose window lying flat on a wall of the given eave slope */
const rose = (cx, cy, R, slope) => discOn(g, Math.round(cx), Math.round(cy), R, slope, (x, y) => { const d = Math.hypot(x, y), a = (Math.atan2(y, x) * 6 / Math.PI + 12) % 2;
  return d > R - 0.6 ? 'k' : d > R - 1.6 ? 'q' : d < 1.3 ? 'G' : d < 2.3 ? 'k' : (Math.abs(a - 1) < 0.28 ? 'k' : (d < R * 0.62 ? 'R' : 'n')); });

// ---- plinth: two stepped courses
{ const t = pixIsoBox(g, bx, by, W, H, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['m', 'M'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['s', 'Q'] }));
  paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 10, ox: bx, oy: by, joint: 'z', tones: ['y', 'Y', 'y'] })); }   // flagstones flat on the ground
{ const s2 = blockBm(0.3, 0.3, 4.4, 4.4); const t = pixIsoBox(g, s2[0], s2[1] - 4, 4.4, 4.4, 4, 1, { left: '1', right: '2', top: '3' });
  paint(g, '1', (x, y) => course(x, y, 0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['l', 'm'] })); paint(g, '2', (x, y) => course(x, y, -0.5, { h: 4, w: 12, joint: 'j', seam: 'j', tones: ['r', 's'] }));
  paint(g, '3', (x, y) => pave(x, y, { a: 6, b: 10, ox: bx, oy: by - 4, joint: 'z', tones: ['y', 'Y', 'x'] })); }

// ---- back arm of the transept (behind the nave)
const trB = block(2.0, 0.6, 1.5, 0.95, 34);
for (const f of [0.5]) { const a = lerp(trB.base.Bm, trB.base.Rr, f); lancet(a[0], a[1] - 28, LANCETR); }
gableY(trB, 18);

// ---- nave: tall ashlar walls, clerestory lancets, slate roof; west front on the right end
const nave = block(0.5, 1.55, 4, 1.9, 38);
for (let k = 0; k < 7; k++) { const a = lerp(nave.base.L, nave.base.Bm, (k + 0.5) / 7); lancet(a[0], a[1] - 36, LANCET); }
const nroof = gableX(nave, 24);
// west front: deep portal in team colour, rose window, corner pinnacles
{ const B = nave.base; const m = lerp(B.Bm, B.Rr, 0.5);
  rose(m[0], m[1] - 27, 7, -0.5);
  // the portal stands on the wall's foot (its sill row is the bottom course), with a stone step out onto the paving
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]) - 14, `
....kkkkk....
...kqqqqqk...
..kqkkkkkqk..
.kqkTTTTTkqk.
kqkTTLTTDTkqk
kqkTLTTTDTkqk
kqkTLTTDTDkqk
kqkTLTkkTDkqk
kqkTLTkkTDkqk
kqkTLTTTTDkqk
kqkTLTTTTDkqk
kqkTLTTTTDkqk
kqkDDDDDDDkqk
kjjjjjjjjjjjk
`, -0.5);
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]), `
krrrrrrrrrrrrk
.kkkkkkkkkkkkkk
`, -0.5);
  for (const f of [0.18, 0.82]) { const a = lerp(B.Bm, B.Rr, f); lancet(a[0], a[1] - 26, LANCETR); } }

// ---- south aisle in front of the nave: lean-to roof, flying buttresses springing to the nave wall
const aisle = block(0.5, 3.45, 4, 0.75, 20);
for (let k = 0; k < 7; k++) { const a = lerp(aisle.base.L, aisle.base.Bm, (k + 0.5) / 7); lancet(a[0], a[1] - 17, LANCET); }
{ const up = (p, z) => [p[0], p[1] - z]; const aT = up(aisle.T, 9), aRr = up(aisle.Rr, 9);
  pixPoly(g, [aisle.L, aisle.Bm, aRr, aT], '7'); paint(g, '7', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(aisle.L, aT) }));
  line(g, aisle.L, aisle.Bm, 'k'); line(g, aisle.L, aisle.Bm, 'u', -1); line(g, aT, aRr, 'k');
  pixPoly(g, [aisle.Bm, aisle.Rr, aRr], '5'); paint(g, '5', (x, y) => course(x, y, 0, ashR)); line(g, aisle.Bm, aRr, 'k'); }
for (let k = 0; k <= 7; k++) { const t = k / 7; const ii = 0.5 + 4 * t; if (ii > 1.9 && ii < 3.6) continue; const a = lerp(aisle.base.L, aisle.base.Bm, t);
  const x = Math.round(a[0]) - 1, y = Math.round(a[1]);
  // pier on the aisle wall, rising past the lean-to into a pinnacle
  for (let yy = y - 1; yy > y - 30; yy--) { pixSet(g, x - 2, yy, 'k'); pixSet(g, x - 1, yy, 'l'); pixSet(g, x, yy, 'm'); pixSet(g, x + 1, yy, 'r'); pixSet(g, x + 2, yy, 'k'); }
  for (let yy = y - 1; yy > y - 12; yy--) { pixSet(g, x - 3, yy, 'k'); pixSet(g, x - 2, yy, 'l'); }
  pinnacle(x, y - 30, 4);
  // the flyer: a quarter arch from the pier to the clerestory wall (the corner piers have no wall behind them to spring to)
  if (k === 0 || k === 7) continue;
  for (let s = 0; s <= 20; s++) { const u = s / 20; const fx = x + 1 + u * 22, fy = y - 27 - u * 11 - Math.sin(u * Math.PI) * 4 - u * 8; pixSet(g, fx, fy, 'k'); pixSet(g, fx, fy + 1, 'r'); pixSet(g, fx, fy + 2, 'k'); } }

// ---- front arm of the transept: north portal and the great rose window on its lit gable end
// The aisle runs on past the transept's right face (i 3.5..4.5), so its wall and lean-to stand in front of that face's back
// part: `underTrF` keeps them so those cells can be restored once the transept is dressed.
const underTrF = copy(g);
const trF = block(2.0, 3.45, 1.5, 0.95, 34);
const troof = gableY(trF, 18);
{ const B = trF.base; const m = lerp(B.L, B.Bm, 0.5);
  rose(m[0], m[1] - 30, 8, 0.5);
  // the portal stands on the wall's foot (its sill row is the bottom course), with a stone step out onto the paving
  stampOn(g, Math.round(m[0]) - 6, Math.round(m[1]) - 12, `
....kkkkk....
...kmmmmmk...
..kmkkkkkmk..
.kmkTTTTTkmk.
kmkTLTTTDTkmk
kmkTLTTTDTkmk
kmkTLTTkkDkmk
kmkTLTTkkDkmk
kmkTLTTTTDkmk
kmkTLTTTTDkmk
kmkDDDDDDDkmk
kQQQQQQQQQQQk
`, 0.5);
  stampOn(g, Math.round(m[0]) - 7, Math.round(m[1]), `
kllllllllllllk
kkkkkkkkkkkkkk.
`, 0.5);
  for (const f of [0.12, 0.88]) { const a = lerp(B.L, B.Bm, f); pinnacle(a[0], a[1] - 32, 14); }
  const a = lerp(B.Bm, B.Rr, 0.12); lancet(a[0], a[1] - 28, LANCETR); }   // clear of the aisle roof
{ const aisleZ = j => j > 4.2 ? -1 : PL + 20 + 9 * (4.2 - j) / 0.75;          // aisle wall / lean-to surface in front of the face
  const hid = (x, y) => { if (x <= trF.base.Bm[0]) return false; const j = 3.5 - (x + 0.5 - bx) / 32, z = by - 160 + (3.5 + j) * 16 - (y + 0.5); return z < aisleZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTrF[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTrF[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'j'; }

// ---- crossing tower rising from the roofs, belfry lancets, team banners, corner pinnacles, crocketed spire with a gold tip
const TZ0 = 46, TZ = 84 - TZ0, SP = 84;
// The crossing tower stands on the nave's ridge: the nave roof is in front of its lower faces (a gable-shaped bite out of the
// right face, a few rows off the left), so those cells are restored from `underTow` once the tower is dressed.
const underTow = copy(g);
const tow = block(2.35, 1.9, 1.1, 1.1, TZ, PL + TZ0);
{ const B = tow.base; for (const f of [0.3, 0.7]) { const a = lerp(B.L, B.Bm, f); lancet(a[0], a[1] - TZ + 3, LANCET); const b2 = lerp(B.Bm, B.Rr, f); lancet(b2[0], b2[1] - TZ + 3, LANCETR); }
  line(g, [B.L[0], B.L[1] - 4], [B.Bm[0], B.Bm[1] - 4], 'k'); line(g, [B.Bm[0], B.Bm[1] - 4], [B.Rr[0], B.Rr[1] - 4], 'k'); }
// spire
const sB = { L: [tow.L[0] - 1, tow.L[1] + 1], Bm: [tow.Bm[0], tow.Bm[1] + 2], Rr: [tow.Rr[0] + 1, tow.Rr[1] + 1], T: tow.T };
const apex = pixIsoRoof(g, sB, SP, 1, { back: '6', left: '7', front: '8', right: '9' });
paint(g, '7', (x, y) => course(x, y, -0.5, { ...slateLit, fall: fall(lerp(sB.T, sB.L, 0.5), apex) })); paint(g, '8', (x, y) => course(x, y, 0.5, { ...slateMid, fall: fall(lerp(sB.L, sB.Bm, 0.5), apex) }));
paint(g, '9', (x, y) => course(x, y, -0.5, { ...slateDk, fall: fall(lerp(sB.Bm, sB.Rr, 0.5), apex) })); paint(g, '6', () => 'V');
line(g, sB.L, sB.Bm, 'k'); line(g, sB.Bm, sB.Rr, 'k'); line(g, sB.Bm, apex, 'k'); line(g, [sB.Bm[0] - 1, sB.Bm[1]], [apex[0] - 1, apex[1]], 'f');
// crockets: little gold-lit knobs up the front hip
for (let k = 1; k < 8; k++) { const p = lerp(sB.Bm, apex, k / 8.5); pixSet(g, p[0] + 1, p[1], 'n'); pixSet(g, p[0] + 2, p[1], 'k'); }
for (const P of [tow.L, tow.Bm, tow.Rr]) pinnacle(P[0] + (P === tow.L ? 1 : P === tow.Rr ? -2 : 0), P[1], 4);
// team banners down both visible tower faces, under the belfry lancets; painted before the nave roof is restored in front
// of the tower's foot, so the roof hides their lower ends
{ const a = lerp(tow.base.L, tow.base.Bm, 0.5); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 26, 0.5, 10, 26, { charge: 'cross' }); }
{ const a = lerp(tow.base.Bm, tow.base.Rr, 0.5); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 26, -0.5, 10, 26, { charge: 'cross' }); }
{ const naveZ = j => j >= 2.5 ? PL + 36 + 26 * (3.45 - j) / 0.95 : PL + 38 + 24 * (j - 1.55) / 0.95;   // nave roof surface height
  const hid = (x, y) => { const cx = x + 0.5 - bx, cy = y + 0.5; let i, j; if (cx <= tow.base.Bm[0] - bx) { j = 3.0; i = 3.0 + cx / 32; } else { i = 3.45; j = 3.45 - cx / 32; }
    return by - 160 + (i + j) * 16 - cy < naveZ(j); };
  const cells = []; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underTow[y][x]) cells.push([x, y]);
  for (const [x, y] of cells) if (hid(x, y)) g[y][x] = underTow[y][x];
  for (const [x, y] of cells) if (!hid(x, y) && hid(x, y + 1) && g[y][x] !== 'k') g[y][x] = 'Q'; }
// team banners down the two visible tower faces, and long ones on the transept front
const BAN = `
kkkkkkk
kDTTTDk
kTTLTTk
kTLLLTk
kTTLTTk
kTTTTTk
kTTTTTk
kTTTTTk
kDTTTDk
.kTDTk.
..kDk..
...k...
`;
// (teamBanner, civic kit: gilt rod, gilt borders and fringe, gilt charge — the Imperial banner every civic building shares)
{ const B = trF.base; for (const f of [0.22, 0.78]) { const a = lerp(B.L, B.Bm, f); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 33, 0.5, 10, 29); } }
// the west front: long banners either side of the portal
{ const B = nave.base; for (const f of [0.29, 0.71]) { const a = lerp(B.Bm, B.Rr, f); teamBanner(g, Math.round(a[0]) - 5, Math.round(a[1]) - 21, -0.5, 10, 20); } }

// weathering low on the walls (moss, damp, a few rain streaks); grass over the foot of the plinth
weather(g, nave.base.L, nave.base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: 4, seed: 2, H: 34, streaks: 0.04 });
weather(g, aisle.base.L, aisle.base.Bm, 'lmM', { l: 'm', m: 'M', M: 'q' }, { rows: 4, seed: 5, H: 18, streaks: 0.04 });
weather(g, nave.base.Bm, nave.base.Rr, 'rsQ', { r: 's', s: 'Q' }, { rows: 4, seed: 7, H: 34, streaks: 0.04 });
const baseG = outline(g, 'k', { l: 'm', y: 'Y', U: 'u', f: 'u' });
{ const P = [[bx - 160, by - 80], [bx, by], [bx + 160, by - 80]]; tufts(baseG, P[0], P[1], { n: 2, seed: 3 }); tufts(baseG, P[1], P[2], { n: 2, seed: 4 }); }

// ---- idle: 4 frames — a glint runs up the gold spire tip and flashes; candlelight flickers in the windows
const ax = Math.round(apex[0]), ay = Math.round(apex[1]);
const TIP = `
...k...
..kwk..
..kGk..
.kkGkk.
kGGGGGk
.kkGkk.
..kGk..
..knk..
..knk..
.kGnNk.
`;
const frames = [];
for (let i = 0; i < 4; i++) {
  const f = copy(baseG);
  pixStamp(f, ax - 3, ay - 9, TIP);
  if (i === 1) { pixSet(f, ax, ay - 1, 'w'); }
  if (i === 2) { pixSet(f, ax, ay - 5, 'w'); pixSet(f, ax - 1, ay - 5, 'w'); pixSet(f, ax + 1, ay - 5, 'w'); }
  if (i === 3) { for (const [dx, dy] of [[0, -11], [0, -12], [-3, -5], [-4, -5], [3, -5], [4, -5], [0, -7]]) pixSet(f, ax + dx, ay + dy, 'w'); }
  lit.forEach(([x, y], k) => { const c = pixGet(baseG, x, y); if (c === 'i' || c === 'N') pixSet(f, x, y, (hash(k, i) < 0.35) ? 'O' : (hash(k, i + 9) < 0.5 ? 'o' : c)); });
  frames.push(pixText(f));
}

return {
  id: 'wonder', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal, ...NPAL,
    k: '#24180f',                                                         // ink
    l: '#f2ead6', m: '#e2d6ba', M: '#cbbd9c',                             // limestone lit: light / mid / shadow
    r: '#c7b994', s: '#ad9e7a', Q: '#8c7d60', q: '#b3a688', j: '#6f6450', // limestone shade, joints
    y: '#ddd1b4', Y: '#cfc2a2', x: '#c2b493', z: '#a69878',               // plinth top
    U: '#a3afbf', u: '#7a8698', v: '#5f6b7c', V: '#48525f', K: '#2f3640', f: '#b8c2ce', // slate
    i: '#1d2633', N: '#3f6fb8', R: '#b8342a', n: '#e1b12c', G: '#ffe28a', w: '#fffbe6', // glass, rose, gold, glint
    o: '#e89a3a', O: '#ffd36a',                                           // candlelight
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  roofChars: 'UuvVKf',
  frames: { idle: frames },
};
};
export default pixAged(make, 3);
