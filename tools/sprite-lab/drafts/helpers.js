// Shared helpers that drafts may call. `lab.mjs apply helpers` installs them into index.html (after `battlements`).
// Pixel sprites: PIXELS.<id> specs are painted grids. pixBlit draws one frame, recoloured for the team, snapped to whole
// pixels; pixDraw is pixBlit onto the game's ctx. Spec fields: id, anchor [cells], palette, frames, scale (cells → px, default 1).

export function pixBuild(spec, grid, tc) {
  const sc = spec.scale || 1;
  const lines = grid.replace(/\r/g, '').split('\n').filter((l, i, a) => !(i === 0 && !l.trim()) && !(i === a.length - 1 && !l.trim()));
  const w = Math.max(1, ...lines.map(l => l.length)), h = lines.length;
  const c = document.createElement('canvas'); c.width = w * sc; c.height = h * sc; const x = c.getContext('2d');
  const tint = tc && spec.kind === 'building' ? pixTeamRoofs() : 0, tinted = {};   // roofs take a little of their owner's colour
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < lines[yy].length; xx++) {
    const ch = lines[yy][xx]; if (ch === '.' || ch === ' ') continue;
    let col = spec.palette[ch]; if (!col) continue;
    if (tint && col[0] === '#' && (PIX_ROOF.includes(ch) || (spec.roofChars && spec.roofChars.includes(ch)))) col = tinted[ch] || (tinted[ch] = pixTint(col, tc.c, tint));
    if (col === 'team') col = tc ? tc.c : '#888'; else if (col === 'teamdark') col = tc ? tc.d : '#555'; else if (col === 'teamlight') col = tc ? tc.l : '#bbb';
    x.fillStyle = col; x.fillRect(xx * sc, yy * sc, sc, sc);
  }
  return c;
}

/** Team roofs: building roofs (the age kit's roof chars) lean towards the owner's colour so a town reads as theirs from far
 *  out. Luminance-preserving, so the material's light and texture stay; the strength is a menu option (off / subtle / strong). */
export const PIX_ROOF = 'αβγδεζη';
export function pixTeamRoofs() {
  if (pixTeamRoofs.v === undefined) { let m = 'subtle'; try { m = localStorage.getItem('age-up-team-roofs') || 'subtle'; } catch (e) { } pixTeamRoofs.v = m === 'off' ? 0 : m === 'strong' ? 0.3 : 0.16; }
  return pixTeamRoofs.v;
}
export function pixTint(base, team, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], a = p(base), b = p(team);
  const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], m = a.map((v, i) => v + (b[i] - v) * t), d = lum(a) - lum(m);
  return '#' + m.map(v => Math.max(0, Math.min(255, Math.round(v + d))).toString(16).padStart(2, '0')).join('');
}
/** Cached canvas for frame i of animation `frame` (wraps), coloured for team tc. */
export function pixFrame(spec, frame, i, tc) {
  const list = spec.frames[frame] || spec.frames.idle || Object.values(spec.frames)[0];
  const n = list.length, k = ((Math.floor(i) % n) + n) % n;
  const key = spec.id + '|' + frame + '|' + k + '|' + (tc ? tc.c : '');
  let c = PIX_CACHE[key]; if (!c) { c = pixBuild(spec, list[k], tc); PIX_CACHE[key] = c; }
  return c;
}

/** Blit onto any 2D context with the sprite's anchor at (x,y) of the current transform. o.clip (0..1) reveals the bottom part only — construction. */
export function pixBlit(c2d, spec, frame, i, tc, x = 0, y = 0, o) {
  let c = pixFrame(spec, frame, i, tc); const sc = spec.scale || 1;
  if (o && o.flash) c = pixFlash(c);
  const m = c2d.getTransform();
  c2d.save(); c2d.setTransform(m.a, m.b, m.c, m.d, Math.round(m.e), Math.round(m.f)); c2d.imageSmoothingEnabled = false;
  if (o && o.alpha !== undefined) c2d.globalAlpha *= o.alpha;
  const an = (spec.anchors && spec.anchors[frame]) || spec.anchor;  // a set may have its own size/anchor (death: lying down is wider)
  const dx = Math.round(x - an[0] * sc), dy = Math.round(y - an[1] * sc);
  const clip = o && o.clip !== undefined ? Math.max(0, Math.min(1, o.clip)) : 1;
  if (pixBlit.hook && pixBlit.hook(c2d, c, dx, dy, clip, [an[0] * sc, an[1] * sc])) { c2d.restore(); return; }  // game-side render FX (construction, shadows)
  if (clip < 1) { const sh = Math.round(c.height * clip); if (sh > 0) c2d.drawImage(c, 0, c.height - sh, c.width, sh, dx, dy + c.height - sh, c.width, sh); }
  else c2d.drawImage(c, dx, dy);
  c2d.restore();
}

/** The hit flash: the frame with its pixels pushed towards white (cached per frame canvas). */
export function pixFlash(c) {
  if (c._flash) return c._flash;
  const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,250,235,0.65)'; x.fillRect(0, 0, f.width, f.height);
  return (c._flash = f);
}
export function pixDraw(spec, frame, i, tc, x = 0, y = 0, o) { pixBlit(ctx, spec, frame, i, tc, x, y, o); }

/**
 * Draw a unit from its painted sprite, choosing the frame set from the unit's state. One rule for every unit:
 * moving → walk (u.anim × fps.walk), attacking → attack (spread over the 0.3 s swing), working → o.work || 'work',
 * in combat between blows → ready (if painted), otherwise idle, looping on G.time and offset per unit so a crowd does not breathe in step. Frame sets that a sprite
 * does not have fall back to idle. spec.fps = {idle,walk,work,attack?} overrides the default rates. o.set forces a set.
 * Returns the set drawn, so a case body can add code-drawn props for it.
 */
export function pixUnit(u, spec, tc, o = {}) {
  const F = spec.frames, fps = spec.fps || {};
  const SW = typeof SWING !== 'undefined' ? SWING : 0.3, HIT = typeof STRIKE !== 'undefined' ? STRIKE / TPS : 0.15;
  const gathering = u.state === 'gather' && u.phase === 'gathering';
  // walking = it actually moved on the last tick (a chase or a back-off steps without a path goal); the old goal test is the fallback
  const moving = u.mv !== undefined ? (u.mv === G.tick && !gathering) : (u.goal && u.state !== 'idle' && !gathering);
  const working = gathering || (u.state === 'build' && !u.goal);
  let set = 'idle', i = (G.time + (u.id % 7) * 0.37) * (fps.idle || 4), ox = 0;
  if (o.set && F[o.set]) { set = o.set; i = (o.i !== undefined ? o.i : G.time * (fps[o.set] || 8)); }
  else if (u.swing > 0 && F.attack) {
    // The painted sets put the blow first for melee (frame 0 is the strike, with its smear; the last frame is the weapon
    // raised again) and last for shooters (draw ... release). So: hold the wind-up pose until the sim lands the hit,
    // snap to the impact frame and hold it a beat, then play the follow-through.
    const n = F.attack.length, e = Math.max(0, SW - u.swing); set = 'attack';
    const ranged = typeof UNITS !== 'undefined' && UNITS[u.type] && UNITS[u.type].proj;
    if (ranged) { i = e < HIT ? Math.floor(e / HIT * Math.max(1, n - 1)) : n - 1; ox = e >= HIT && e < HIT + 0.1 ? -1 : 0; }
    else { const rest = SW - HIT - 0.1; i = e < HIT ? n - 1 : e < HIT + 0.1 ? 0 : Math.min(n - 1, 1 + Math.floor((e - HIT - 0.1) / Math.max(0.01, rest) * (n - 1)));
      // lean back on the wind-up, lunge into the blow, settle
      ox = e < HIT ? -1 : Math.round(2 * Math.max(0, 1 - (e - HIT) / 0.2)); }
  }
  else if (moving && F.walk) { set = 'walk'; i = u.anim * (fps.walk || 12); }
  else if (u.state === 'attack' && F.ready) { set = 'ready'; i = (G.time + (u.id % 7) * 0.37) * (fps.ready || fps.idle || 4); }
  else if (working && F[o.work || 'work']) { set = o.work || 'work'; i = u.anim * (fps.work || 8); }
  // knocked back a pixel or two away from whoever hit it, while the hit flash lasts (the context is mirrored by facing)
  if (u.flash > 0 && u.hitFrom) { const s = (u.x - u.hitFrom.x) - (u.y - u.hitFrom.y); if (Math.abs(s) > 0.01) ox += Math.round(Math.min(1, u.flash / 0.15) * 2) * (s < 0 ? -1 : 1) * (u.face || 1); }
  // the white flash is a short pulse at the start of the hit, so the struck unit's own pose stays readable
  pixDraw(spec, set, i, tc, ox, 0, u.flash > 0.07 ? { flash: true } : undefined);
  return set;
}
/** Death: play `death` once at fps.death (default 10) from time t0, then hold the last frame (the corpse). */
export function pixDeath(c2d, spec, t0, tc) {
  const n = spec.frames.death.length; const fps = (spec.fps && spec.fps.death) || 10;
  pixBlit(c2d, spec, 'death', Math.min(n - 1, Math.floor((G.time - t0) * fps)), tc);
}

// ---- grid painting kit for *generated* pixel drafts (code before `export default` builds the grids) ----
// Grids are arrays of rows of single characters. Coordinates are cells. All take/return plain data; nothing touches the DOM.
export function pixGrid(w, h, ch = '.') { return Array.from({ length: h }, () => Array(w).fill(ch)); }
export function pixSet(g, x, y, ch) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; }
export function pixGet(g, x, y) { x = Math.round(x); y = Math.round(y); return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function pixRect(g, x, y, w, h, ch) { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) pixSet(g, x + xx, y + yy, ch); }
export function pixLine(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { pixSet(g, x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
/** Scan-line polygon fill. pts = [[x,y],...] in cells (fractions allowed). Fills cells whose centre is inside. */
export function pixPoly(g, pts, ch) {
  const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(g.length - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(g[0].length - 1, Math.floor(xs[k + 1] - 0.5)); x++) g[y][x] = ch;
  }
}
/** Paste a small hand-painted grid (multi-line string) with its top-left at (x,y); '.' is transparent. */
export function pixStamp(g, x, y, text) { const rows = text.replace(/^\n+|\n+$/g, '').split('\n'); rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.' && r[xx] !== ' ') pixSet(g, x + xx, y + yy, r[xx]); }); }
/** Mirror a grid left-right (character meanings are kept). */
export function pixFlip(g) { return g.map(r => r.slice().reverse()); }
export function pixText(g) { return '\n' + g.map(r => r.join('')).join('\n') + '\n'; }
/**
 * Isometric box in cells, matching the game's projection (tile 64×32 px at scale 1). (bx,by) = the footprint's BOTTOM corner,
 * w,h = footprint in tiles, z = wall height in px, sc = sprite scale (px per cell). ch = {top,left,right}. Returns the top-face
 * corners {T,Rr,Bm,L} (in cells, at height z) so roofs and props can be placed on it.
 */
export function pixIsoBox(g, bx, by, w, h, z, sc, ch) {
  const HW = 32 / sc, HH = 16 / sc, zz = z / sc;
  const Bm = [bx, by], L = [bx - w * HW, by - w * HH], Rr = [bx + h * HW, by - h * HH], T = [bx - (w - h) * HW, by - (w + h) * HH];
  const up = p => [p[0], p[1] - zz];
  if (ch.left) pixPoly(g, [L, Bm, up(Bm), up(L)], ch.left);
  if (ch.right) pixPoly(g, [Bm, Rr, up(Rr), up(Bm)], ch.right);
  if (ch.top) pixPoly(g, [up(T), up(Rr), up(Bm), up(L)], ch.top);
  return { T: up(T), Rr: up(Rr), Bm: up(Bm), L: up(L), base: { T, Rr, Bm, L } };
}
/** Hipped/pyramid roof on a top face (as returned by pixIsoBox): apex rise `rise` px. ch = {left,right,front,back} — two or four tones. */
export function pixIsoRoof(g, top, rise, sc, ch) {
  const ap = [(top.L[0] + top.Rr[0]) / 2, (top.T[1] + top.Bm[1]) / 2 - rise / sc];
  if (ch.back) pixPoly(g, [top.T, top.Rr, ap], ch.back);
  if (ch.left) pixPoly(g, [top.T, top.L, ap], ch.left);
  if (ch.front) pixPoly(g, [top.L, top.Bm, ap], ch.front);
  if (ch.right) pixPoly(g, [top.Bm, top.Rr, ap], ch.right);
  return ap;
}

// ---- age variants: every building evolves with its owner's age (Dark → Feudal → Castle → Imperial) ----
// A generated building draft built through gen/ages/wrap.mjs exports `pixAged(make, minAge)`: `make(AGE)` is the whole
// generator as a function of the age, run once for the building's first age at load and lazily (or in idle time) for the
// rest. Draw cases pick the variant with `pixAge(PIXELS.<id>, b)`; sprites without variants pass straight through.
/** Wrap an age-parametric generator: the returned spec is the minAge variant and carries the others in spec.ages. */
export function pixAged(make, minAge = 0) {
  const s = make(minAge); s.make = make; s.age = minAge; s.ages = []; s.ages[minAge] = s; return s;
}
/** The age a building is drawn at: b.age when set (the sprite lab), else its owner's current age, else 0. */
export function pixAgeOf(b) {
  if (b && b.age !== undefined) return b.age;
  const P = b && typeof G !== 'undefined' && G && G.players ? G.players[b.team] : null;
  return P && P.age !== undefined ? P.age : 0;
}
/** The variant of an age-aware spec for a building (or an age number). Generates it on first use and then warms the rest. */
export function pixAge(spec, b) {
  if (!spec || !spec.make) return spec;
  const a = Math.max(spec.age, Math.min(3, (typeof b === 'number' ? b : pixAgeOf(b)) | 0));
  let s = spec.ages[a];
  if (!s) {
    s = spec.make(a); s.id = spec.id + '~' + a; s.make = spec.make; s.age = a; s.ages = spec.ages; spec.ages[a] = s;
    if (!s.flags && spec.flags === undefined) s.flags = undefined;
  }
  if (!pixAge.warm && typeof requestIdleCallback === 'function' && typeof PIXELS !== 'undefined') {
    // generate every other variant in idle time so ageing up never stalls a frame (~5–30 ms per variant)
    pixAge.warm = true; const todo = [];
    for (const k in PIXELS) { const q = PIXELS[k]; if (q && q.make) for (let i = q.age; i <= 3; i++) todo.push([q, i]); }
    const step = dl => { while (todo.length && dl.timeRemaining() > 4) { const [q, i] = todo.shift(); if (!q.ages[i]) pixAge(q, i); } if (todo.length) requestIdleCallback(step); };
    requestIdleCallback(step);
  }
  return s;
}
/** Code-drawn flags for a painted building, from spec.flags ([[dx,dy,h],…] relative to the footprint's bottom corner) or a default list. */
export function pixFlags(spec, b, bm, def) {
  const fl = spec && spec.flags !== undefined ? spec.flags : def;
  if (b.built && fl) for (const f of fl) flag(bm.Bm[0] + f[0], bm.Bm[1] + f[1], b.team, f[2] || 14);
}

/**
 * The age kit: materials, palettes and ornaments shared by every building generator so the whole town ages as one.
 * Progression (keep footprints; silhouettes change, not just colours):
 *   0 Dark     timber, wattle-and-daub and golden thatch; low walls, steep shaggy roofs, crossed gable poles, smoke holes,
 *              rough posts and stakes, fieldstone footings at most. Team colour on cloth (doors' hangings, a pennant, a hide).
 *   1 Feudal   timber frame on stone footings, brown wooden shingles, shuttered windows, chimneys, carved knob finials.
 *   2 Castle   dressed grey stone, red clay tiles, taller walls, arched stone windows, iron finials, team banners on walls,
 *              crenellations and turrets where the building is martial.
 *   3 Imperial grand pale limestone, blue-grey slate, tallest, gilt ridge cresting and orb finials, pilasters, gilt string
 *              courses, banners with gilt fringes, pinnacles and spires.
 * Chars are Greek letters so they never collide with a generator's own palette or temporary chars:
 *   roof R[0..6] (highlight → deepest), stone S[0..4] + S[5] mortar, plaster P[0..2], timber W[0..2], gilt Au[0..2],
 *   iron Fe[0..1], glow Gl[0..1] (warm, core), ink INK, recess DEEP. Merge AK.pal into the spec's palette.
 * Roof faces: 0 front-left (lit), 1 front-right (shade), 2 back-left (brightest, slopes away: flip), 3 back-right (flip).
 */
export function pixAgeKit(age) {
  const A = Math.max(0, Math.min(3, age | 0));
  const hash = (a, b, c = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const R = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η'], S = ['σ', 'ς', 'τ', 'υ', 'φ', 'χ'], P = ['π', 'ρ', 'ο'], W = ['θ', 'ι', 'κ'];
  const Au = ['λ', 'μ', 'ν'], Fe = ['ξ', 'ψ'], Gl = ['ω', 'Ω'], INK = 'Φ', DEEP = 'Ψ';
  const ROOF = [
    ['#f2d488', '#dcb056', '#c99a44', '#b8873a', '#9c7230', '#80592a', '#5f4220'],   // golden thatch
    ['#c4a47a', '#ab8a60', '#937450', '#7d6242', '#675036', '#523e2a', '#3a2c1e'],   // weathered oak shingles
    ['#eea582', '#d8805c', '#b85a3e', '#a0482e', '#8a3a2a', '#73301f', '#4e2016'],   // red clay tiles
    ['#b8c2ce', '#a3afbf', '#8a95a4', '#7a8698', '#5f6b7c', '#48525f', '#2f3640'],   // blue-grey slate
  ][A];
  const STONE = [
    ['#b0a48e', '#9c907a', '#857a66', '#6c6252', '#544b3e', '#3e3830'],   // fieldstone (footings only)
    ['#b8ae9c', '#a39a8c', '#8d8478', '#6f6a60', '#5a554c', '#4f4a42'],   // grey rubble stone
    ['#c8bca6', '#b3a692', '#9a8b78', '#857868', '#6a6258', '#4f4840'],   // dressed ashlar
    ['#f2ead6', '#e2d6ba', '#cbbd9c', '#ad9e7a', '#8c7d60', '#6f6450'],   // pale limestone
  ][A];
  const PLASTER = [['#cdb98e', '#b49f74', '#927e58'], ['#e8dcc0', '#d6c49c', '#a8946e'], ['#f0e9d8', '#ddd3bd', '#b9ad92'], ['#f4eedf', '#e4dac4', '#c2b597']][A];
  const TIMBER = [['#8a6a3a', '#6a4e2a', '#46321c'], ['#8a6a3a', '#5a3a18', '#3b2614'], ['#6e4a28', '#4a3018', '#2e1e10'], ['#6e4a28', '#4a3018', '#2e1e10']][A];
  const pal = {};
  R.forEach((c, i) => (pal[c] = ROOF[i])); S.forEach((c, i) => (pal[c] = STONE[i])); P.forEach((c, i) => (pal[c] = PLASTER[i])); W.forEach((c, i) => (pal[c] = TIMBER[i]));
  Object.assign(pal, { [Au[0]]: '#ffe28a', [Au[1]]: '#e1b12c', [Au[2]]: '#a87a12', [Fe[0]]: '#9aa0a6', [Fe[1]]: '#4a5058', [Gl[0]]: '#e89a3a', [Gl[1]]: '#ffd36a', [INK]: '#24180f', [DEEP]: '#1f1610' });
  // roof face → [lip, body tones, joint/underside] as indices into R
  const FACE = { 2: [0, [1, 1, 1, 0], 2], 0: [1, [2, 2, 2, 1], 3], 3: [2, [3, 3, 3, 2], 4], 1: [3, [4, 4, 4, 3], 5] };
  const MAT = ['thatch', 'shingle', 'tile', 'slate'][A];
  /** Roof material at column `col`, `d` rows above the eave (0 = eave row; courses lap downhill), on face 0..3. */
  function roofTex(col, d, face) {
    const [lip, body, joint] = FACE[face] || FACE[0]; d = Math.floor(d); col = Math.floor(col);
    if (MAT === 'thatch') { // layered courses of straw: 1-px strands of varied tone and length, course edges ragged per strand, a shaded underside
      const dd = d + Math.floor(hash(col, 41) * 2.6), band = Math.floor(dd / 5), v = dd - band * 5, hx = hash(col + 5, band + 3);
      if (v === 0 || (v === 1 && hx < 0.45)) return R[joint];
      const t = hash(col, band * 7 + 1), s2 = hash(col + 1, band * 7 + 1);
      if (v === 4 && t > 0.6) return R[lip];                                   // sunlit straw ends at the top of the course
      if (v === 2 && s2 < 0.18) return R[joint];                               // a stray short strand in shadow
      return R[t < 0.22 ? Math.min(6, body[0] + 1) : t > 0.82 ? Math.max(0, body[0] - 1) : body[0]];
    }
    const ch = MAT === 'slate' ? 3 : 3, bw = MAT === 'tile' ? 3 : MAT === 'slate' ? 5 : 4;
    const row = Math.floor(d / ch), v = d - row * ch, xs = col + (((row % 2) + 2) % 2) * Math.floor(bw / 2), k = Math.floor(xs / bw), j = xs - k * bw;
    if (v === 0) return R[joint];                                  // shaded underside of the course above
    if (MAT === 'tile') return j === 0 ? R[Math.min(6, joint)] : j === 1 ? R[lip] : R[body[0]];   // barrel tiles: gap, lit crown, body
    if (j === 0) return R[joint];                                  // seam between shingles / slates
    if (v === ch - 1) return R[lip];                               // lit butt edge
    const t = hash(k + 17, row + 91); return R[t < 0.25 ? body[3] : t > 0.85 ? Math.min(6, body[0] + 1) : body[0]];
  }
  /** roofTex in screen space for a face whose courses run with slope s (+0.5 / -0.5 / 0); o.flip for back faces, o.off shifts courses. */
  function roofXY(x, y, s, face, o = {}) { const u = y - s * x + (o.off || 0); return roofTex(x, o.flip ? Math.floor(u) : Math.floor(-u), face); }
  const WALL = ['wattle', 'timber', 'stone', 'ashlar'][A];
  const PLINTH = [1, 3, 2, 3][A];
  /** Wall material at u px along the wall (0 = its left end), h px above the base line; face 0 lit, 1 shade; o.len, o.H (wall
   *  height), o.pl (plinth rows), o.step (stud / pilaster spacing). Openings are the generator's: paint them over this. */
  function wallTex(u, h, face, o = {}) {
    const len = o.len || 64, H = o.H || 16, pl = o.pl !== undefined ? o.pl : PLINTH, lit = face === 0;
    const st = lit ? [S[0], S[1], S[2]] : [S[2], S[3], S[4]], pz = lit ? [P[0], P[1]] : [P[1], P[2]], tw = lit ? [W[0], W[1]] : [W[1], W[2]];
    u = Math.floor(u); h = Math.floor(h);
    const courses = (ch, bw, seed) => { const r = Math.floor(h / ch), v = h - r * ch, xs = u + (r % 2) * Math.floor(bw / 2) + Math.floor(hash(r, seed) * 3), k = Math.floor(xs / bw);
      if (v === ch - 1 || xs % bw === 0) return S[5]; if (v === ch - 2 && lit) return st[0]; return st[1 + (hash(k, r, seed) < 0.4 ? 1 : 0)]; };
    if (WALL === 'wattle') {
      if (h < pl) return hash(u >> 2, 3) < 0.5 ? st[1] : st[2];                                   // a row of fieldstones
      if (u <= 1 || u >= len - 2) return u === 0 || u === len - 1 ? W[2] : tw[0];                  // rough corner posts
      if (h >= H - 1) return pz[1];                                                                // shade under the thatch
      const cx = Math.floor(u / 9), cy = Math.floor(h / 6), r0 = hash(cx, cy, 11);
      if (r0 < 0.4 && Math.abs(u - cx * 9 - 4.5) + Math.abs(h - cy * 6 - 3) * 1.5 < 4) {          // daub fallen off: the wattle shows
        const row = Math.floor(h / 2); return ((u + (row % 2) * 2) % 4 < 2) ? tw[0] : W[2];
      }
      return hash(u >> 2, h >> 2, 5) < 0.3 ? pz[1] : pz[0];
    }
    if (WALL === 'timber') {
      const step = o.step || 11, mid = Math.round(pl + (H - pl) * 0.5);
      if (h < pl) return courses(3, 6, 2);
      if (u <= 1 || u >= len - 2 || (u % step) < 2) return (u % step) === 1 || u === 1 || u === len - 1 ? tw[1] : tw[0];   // studs, corner posts
      if (h <= pl + 1) return h === pl + 1 ? tw[0] : tw[1];                                          // sill
      if (h === mid || h === mid - 1) return h === mid ? tw[0] : tw[1];                              // mid rail
      if (h >= H - 2) return h === H - 1 ? tw[0] : tw[1];                                            // top plate
      if (h === H - 3) return pz[1];
      return hash(Math.floor(u / step), h > mid ? 1 : 0, lit ? 5 : 9) < 0.25 && h === pl + 2 ? pz[1] : pz[0];
    }
    if (WALL === 'stone') {
      if (h < pl) return h === pl - 1 ? st[0] : st[2];
      const q = (u < 4 || u >= len - 4), r = Math.floor((h - pl) / 4);                             // quoins: long and short blocks
      if (q && ((r % 2 === 0) || u < 2 || u >= len - 2)) { const v = (h - pl) % 4; return v === 3 ? S[5] : v === 2 && lit ? S[0] : st[0]; }
      if (h >= H - 2) return h === H - 1 ? st[0] : S[5];                                            // string course under the eave
      return courses(4, 7, 4);
    }
    // ashlar
    const step = o.step || 22;
    if (h < pl) return h === pl - 1 ? st[0] : h === 0 ? S[5] : st[2];                              // moulded plinth
    if (h >= H - 3) return h === H - 3 ? Au[lit ? 1 : 2] : h === H - 1 ? st[0] : st[1];           // gilt string course, cornice
    const pu = ((u % step) + step) % step;
    if (u >= 3 && u <= len - 4 && pu >= step - 3) return pu === step - 3 ? st[0] : pu === step - 2 ? st[1] : st[2];   // pilasters
    if (u < 3 || u > len - 4) return u === 0 || u === len - 1 ? st[1] : st[0];                    // corner pilasters
    return courses(3, 9, 6);
  }
  const put = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
  const stamp = (g, x, y, t) => t.split('\n').filter(r => r.length).forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) if (r[xx] !== '.') put(g, x + xx, y + yy, r[xx]); });
  const sub = (t) => t.replace(/k/g, INK).replace(/a/g, Au[0]).replace(/b/g, Au[1]).replace(/c/g, Au[2]).replace(/i/g, Fe[0]).replace(/j/g, Fe[1])
    .replace(/w/g, W[0]).replace(/x/g, W[1]).replace(/y/g, W[2]).replace(/r/g, R[1]).replace(/s/g, R[4]);
  /** An age finial standing on a roof apex (x,y = the apex cell; drawn upward). Returns its height in cells. */
  function finial(g, x, y) {
    const T = [
      `k...k\n.w.y.\n..x..`,                 // Dark: crossed gable poles
      `.k.\nkwk\n.x.`,                       // Feudal: carved wooden knob
      `.k.\nkik\n.j.\n.j.`,                  // Castle: iron ball and spike
      `..k..\n.kak.\nkabck\n.kck.\n..j..\n..j.`, // Imperial: gilt orb on an iron spike
    ][A];
    const rows = T.split('\n'); stamp(g, x - Math.floor(rows[0].length / 2), y - rows.length + 1, sub(T)); return rows.length;
  }
  /** Ridge dressing along the ridge line A→B (screen cells), drawn on and just above it. */
  function crest(g, a, b) {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) | 0;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(a[0] + (b[0] - a[0]) * i / Math.max(1, n)), y = Math.round(a[1] + (b[1] - a[1]) * i / Math.max(1, n));
      if (A === 0) { put(g, x, y, i % 4 === 1 ? W[2] : R[5]); put(g, x, y - 1, R[3]); }                         // bound straw ridge
      else if (A === 1) { put(g, x, y, W[1]); put(g, x, y - 1, W[0]); }                                       // ridge board
      else if (A === 2) { put(g, x, y, R[4]); put(g, x, y - 1, i % 3 === 0 ? R[1] : R[3]); }                  // ridge tiles
      else { put(g, x, y, Fe[1]); put(g, x, y - 1, Au[1]); if (i % 3 === 0) { put(g, x, y - 2, Au[0]); put(g, x, y - 3, INK); } }   // gilt cresting
    }
  }
  /** A hanging banner on a wall: top-left (x,y), w×h cells, the wall slope (+0.5 lit, -0.5 shade). Castle: plain team cloth on
   *  an iron rod; Imperial: gilt rod, gilt fringe and a gilt charge; earlier ages: a hide/cloth hanging (shorter, no rod). */
  function banner(g, x, y, slope, w = 4, h = 9) {
    if (A < 2) h = Math.max(4, h - 3);
    for (let c = -1; c <= w; c++) { const dy = Math.round(slope * (c - (w - 1) / 2) + 1e-9); put(g, x + c, y - 1 + dy, A === 3 ? Au[c === -1 ? 2 : 1] : A === 2 ? Fe[1] : W[2]); }
    for (let c = 0; c < w; c++) {
      const dy = Math.round(slope * (c - (w - 1) / 2) + 1e-9), tail = (w >= 3 && c === Math.floor(w / 2)) ? 1 : 0;
      for (let r = 0; r < h - tail; r++) {
        let ch = c === 0 ? 'L' : c === w - 1 ? 'D' : 'T';
        if (r === h - tail - 1) ch = A === 3 ? Au[1] : 'D';
        if (A === 3 && (c === 0 || c === w - 1) && r > 0 && r < h - 2) ch = Au[c === 0 ? 0 : 2];
        if (A >= 2 && r === Math.floor(h / 2) - 1 && c === Math.floor((w - 1) / 2) && w >= 3) ch = A === 3 ? Au[0] : 'L';
        put(g, x + c, y + r + dy, ch);
      }
    }
  }
  /** Eave trim along A→B: Imperial gilt, Castle a pale stone cornice; nothing earlier (returns false). */
  function trim(g, a, b, dy = 0) {
    if (A < 2) return false;
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) | 0;
    for (let i = 0; i <= n; i++) put(g, a[0] + (b[0] - a[0]) * i / Math.max(1, n), a[1] + (b[1] - a[1]) * i / Math.max(1, n) + dy, A === 3 ? (i % 2 ? Au[1] : Au[0]) : S[0]);
    return true;
  }
  /** An age window centred at (x,y) on a wall of slope s (lit face 0 / shade 1). Returns its cells' height. */
  function windowAt(g, x, y, s, face) {
    const T = [
      `kkk\nk~k\nkkk`,                                   // Dark: a smoke-dark hole
      `TkkkD\nT~g~D\nT~g~D\n.xxx.`,                     // Feudal: shuttered casement (team shutters), firelit
      `.SSS.\nS~~~S\nS~g~S\nS~g~S\nSSSSS`,              // Castle: round-headed stone window
      `..a..\n.S~S.\nS~g~S\nS~G~S\nS~g~S\naaaaa`,       // Imperial: tall arched window, gilt keystone and sill
    ][A];
    const rows = T.split('\n'), w = rows[0].length, c0 = (w - 1) / 2;
    rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { let ch = r[xx]; if (ch === '.') continue;
      ch = ch === '~' ? DEEP : ch === 'g' ? Gl[0] : ch === 'G' ? Gl[1] : ch === 'S' ? (face === 0 ? S[0] : S[2]) : sub(ch);
      put(g, x - Math.floor(c0) + xx, y - Math.floor(rows.length / 2) + yy + Math.round(s * (xx - c0) + 1e-9), ch); } });
    return rows.length;
  }
  return {
    age: A, name: ['Dark', 'Feudal', 'Castle', 'Imperial'][A], roof: MAT, wall: WALL, plinth: PLINTH,
    zMul: [0.8, 1, 1.12, 1.25][A], roofMul: [1.3, 1, 1, 1.12][A], head: [0, 0, 8, 18][A],
    R, S, P, W, Au, Fe, Gl, INK, DEEP, pal, hash,
    sel: { [R[0]]: R[1], [R[1]]: R[2], [R[2]]: R[3], [S[0]]: S[1], [S[1]]: S[2], [P[0]]: P[1], [W[0]]: W[1], [Au[0]]: Au[1] },
    roofTex, roofXY, wallTex, finial, crest, banner, trim, windowAt,
  };
}

/** A relic (PIXELS.relic) at (x,y) in the current transform with its pulsing gold halo. mode: 'idle' on the ground (the
 *  ground point), 'carry' held at a monk's chest (y = where the casket's feet sit), 'icon' small, for relics stored in a temple. */
export function pixRelic(x, y, mode = 'idle', seed = 0) {
  const S = PIXELS.relic; if (!S) return;
  const t = G.time + seed, pulse = 0.5 + 0.5 * Math.sin(t * 3), big = mode === 'idle';
  const r = (big ? 13 : 7) + 2 * pulse, cy = y - (big ? 9 : 4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(x, cy, 1, x, cy, r);
  gr.addColorStop(0, `rgba(255,226,140,${0.42 + 0.2 * pulse})`); gr.addColorStop(0.55, `rgba(255,200,80,${0.16 + 0.08 * pulse})`); gr.addColorStop(1, 'rgba(255,190,60,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, cy, r, 0, 7); ctx.fill();
  if (big) { ctx.fillStyle = `rgba(255,220,120,${0.12 + 0.08 * pulse})`; ctx.beginPath(); ctx.ellipse(x, y, 11, 5, 0, 0, 7); ctx.fill(); }   // light pooled on the ground
  ctx.restore();
  pixDraw(S, mode, t * ((S.fps && S.fps[mode]) || 6), null, x, y);
}
