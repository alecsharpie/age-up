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
