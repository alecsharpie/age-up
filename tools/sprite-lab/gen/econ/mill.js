// ==head
// @pixel mill
// Mill (2×2), one variant per age (AGE, AK = pixAgeKit(AGE) from gen/ages/wrap.mjs):
//   Dark     no windmill yet: a low round wattle-and-daub quern hut under a shaggy golden thatch cone with crossed poles over
//            the smoke hole, a team-colour hide in the doorway, grain sacks by the wall, a hand quern on a stump in the yard and
//            a team pennant on a pole. idle ×4: the quern handle goes round, smoke curls from the roof, the pennant waves.
//   Feudal   a timber post mill: a weatherboarded body with a brown shingle roof raised on a trestle (cross-trees on stone
//            piers, quarterbars, the main post), a ladder down the back, four team-cloth lattice sails on the front gable.
//   Castle   the stone tower mill: a round tapering tower of coursed stone on a plinth, an arched team door, lit slit windows,
//            a red-tiled conical cap with an iron finial and four team-cloth sails.
//   Imperial taller, slenderer limestone tower with gilt string courses, a railed timber reefing gallery hung with gilt-fringed
//            team banners, arched windows with gilt sills, a blue slate cap with a gilt eave ring and orb finial, longer sails.
// Every age: packed-earth apron, flour/grain sacks clear of the building (the pallet stands in front of the wall, never
// inside it), a spare millstone and a handcart where the age has them. idle ×4: sails turn in 22.5° steps (seamless loop).
// Drawn by drafts/building.mill.js: pixDraw(pixAge(PIXELS.mill,b),'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ==end
const W = 2, H = 2;
const ARM = [0, 23, 25, 28][AGE];
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + [46, 61, 61, 79][AGE];
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const CX = OX, CY = OY + 32;                 // footprint centre on the ground
const { R: RK, S: SK, W: TW, Au, Fe, INK, DEEP } = AK;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- apron: packed earth; stone ages get a cobbled ring round the tower and a worn path to the door
const GROUND = 'eEfcC';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => {
  const dx = x - CX, dy = (y - CY) * 2, d = Math.hypot(dx, dy), h = hash(x >> 1, y >> 1, 2);
  if (AGE >= 2 && d < (AGE === 3 ? 26 : 25)) { const cb = hash(Math.floor((x + (y % 2) * 1.5) / 3), y >> 1, 8); return ((x + (y >> 1)) % 3 === 0 || y % 2 === 0) ? 'f' : cb < 0.5 ? 'c' : 'C'; }
  const path = Math.abs(dx + dy * 0.9 + 4) < 6 && dx < 0 && dy > 0;
  if (path) return h < 0.5 ? 'E' : 'e';
  return h < 0.2 ? 'f' : h < 0.32 ? 'E' : 'e';
});

// ---- round volumes: per height row v, paint the front half-ellipse arc (2 px tall) of a drum of radius rad(v)
function drum(gr, v0, v1, rad, fn, cx = CX, cy = CY) {
  for (let v = v0; v <= v1; v++) {
    const r = rad(v), yc = cy - v;
    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
      const nx = dx / r, front = Math.round(yc + (r / 2) * Math.sqrt(Math.max(0, 1 - nx * nx)));
      for (let y = front; y <= front + 1; y++) { const ch = fn(dx, v, nx, Math.asin(Math.max(-1, Math.min(1, nx)))); if (ch) pixSet(gr, cx + dx, y, ch); }
    }
  }
}
/** A cone of base radius R0 whose eave sits at screen row y0, rising Hc px: tex(nx, t, k) per cell (t 0 eave → 1 tip). */
function cone(gr, cx, y0, R0, Hc, tex) {
  for (let k = 0; k <= Hc * 2; k++) {
    const t = k / (Hc * 2), r = R0 * (1 - t), yc = y0 - t * Hc;
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      const nx = r > 0.5 ? dx / r : 0; if (Math.abs(nx) > 1) continue;
      const front = Math.round(yc + (r / 2) * Math.sqrt(1 - nx * nx)), ch = tex(nx, t, dx);
      pixSet(gr, cx + dx, front, ch); pixSet(gr, cx + dx, front - 1, ch);
    }
  }
}
/** Conical roof material from the age kit: thatch strands in bands, tile barrels, slate courses; lit from the left. */
const capTex = Hc => (nx, t) => {
  const ph = Math.asin(nx), lv = (nx + 1) / 2, v = t * Hc, base = 1 + Math.round(lv * 4);
  if (AK.roof === 'thatch') {
    const strand = Math.floor((ph + 2) * 9), band = Math.floor(t * 6), h = hash(strand, band, 4);
    let l = lv * 4.2 + (h < 0.3 ? 1 : h > 0.85 ? -1 : 0);
    if ((t * 6) % 1 < 0.1 || t < 0.05) l += 1.5;
    return RK[clamp(Math.floor(l), 0, 6)];
  }
  if (t < 0.04) return RK[clamp(base + 2, 0, 6)];                                         // shaded eave edge
  const row = Math.floor(v / 3), r = v - row * 3, cols = AK.roof === 'tile' ? 7 : 5, cu = (ph + 2) * cols + (row % 2) * 0.5, j = cu - Math.floor(cu);
  if (r < 1) return RK[clamp(base + 2, 0, 6)];                                             // underside of the course above
  if (AK.roof === 'tile') return j < 0.22 ? RK[clamp(base + 1, 0, 6)] : j < 0.5 ? RK[clamp(base - 1, 0, 6)] : RK[base];
  if (j < 0.14) return RK[clamp(base + 2, 0, 6)];                                          // slate seam
  if (r >= 2) return RK[clamp(base - 1, 0, 6)];                                            // lit butt edge
  return RK[hash(Math.floor(cu), row, 3) < 0.25 ? clamp(base + 1, 0, 6) : base];
};

let hub = null, smokeAt = null;
const G0 = g;
/** Lay a separately painted structure over the scene with an ink line round its silhouette (so it reads against the apron). */
function inkOnto(dst, src) { outline(src, () => 'k'); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (src[y][x] !== '.') dst[y][x] = src[y][x]; }
// ================================================================ Castle / Imperial: the stone tower mill
if (AGE >= 2) {
  const RB = AGE === 3 ? 20 : 19, RT = AGE === 3 ? 14 : 15, TH = AGE === 3 ? 58 : 44, VD = 30; // VD: Imperial gallery level
  const SH = ['P', 'p', 'q', 'Q', 'U', 'V'];                 // stone ramp light → deep (Imperial: limestone, see the palette)
  const tone = (nx, bump) => SH[Math.max(0, Math.min(5, Math.floor((nx + 1) / 2 * 5.2 + 0.2) - bump))];
  const rTower = v => RB - (RB - RT) * v / TH;
  const body = (dx, v, nx, ph) => {
    if (AGE === 3 && (v === 18 || v === TH - 5)) return Au[nx < -0.4 ? 0 : nx > 0.4 ? 2 : 1];   // gilt string courses
    const course = Math.floor((v - 4) / 4), r = (v - 4) % 4, arc = ph * rTower(v) * 1.15 + (course % 2) * 3.5 + hash(course, 1, 3) * 3;
    const blk = hash(Math.floor(arc / 7), course, 5);
    if (r === 0) return nx > 0.35 ? 'J' : 'j';
    if (Math.floor(arc / 7) !== Math.floor((arc - 1.15) / 7)) return nx > 0.35 ? 'J' : 'j';
    if (v < (AGE === 3 ? 6 : 9) && hash(Math.floor(arc / 2), v >> 1, 31) < (AGE === 3 ? 0.12 : 0.3) * (1 - v / 10)) return nx > 0.3 ? 'ä' : 'ã';   // moss low on the stone
    return tone(nx, (r === 3 ? 1 : 0) + (blk < 0.25 ? -1 : blk > 0.8 ? 1 : 0) * (nx > 0.6 ? 0 : 1));
  };
  function onDrum(gr, dx0, dx1, v0, v1, fn) { drum(gr, v0, v1, rTower, (dx, v, nx) => (dx >= dx0 && dx <= dx1 ? fn(dx - dx0, v - v0, dx1 - dx0, v1 - v0) : null)); }
  const DOORH = AGE === 3 ? 18 : 16;
  const door = (u, v, uw, vh) => {
    const arch = v > vh - 3 && (u === 0 || u === uw || (v === vh && (u < 2 || u > uw - 2)));
    if (v > vh - 1 && (u <= 1 || u >= uw - 1)) return null;
    if (arch || u === 0 || u === uw || v === vh) { if (AGE === 3) return v === vh && u === Math.round(uw / 2) ? Au[0] : u === uw ? 'q' : 'P'; return 'w'; }
    if (v < 2) return 'v';                                                           // threshold
    if (u === 1) return 'L'; if (u === uw - 1) return 'D';
    if (v === 7 || v === 12) return AGE === 3 ? Fe[1] : 'D';                         // ledges / iron straps
    return u === 4 ? 'D' : 'T';
  };
  const WINS = AGE === 3 ? [[2, 22], [-9, 38], [5, 44]] : [[2, 22], [-9, 32], [6, 36]];
  const win = (u, v) => (v === 0 ? (AGE === 3 ? Au[u === 2 ? 2 : 1] : 'P') : u === 2 ? 'Q' : v === 5 ? 'j' : 'K');
  // plinth: a wider, darker course
  drum(g, 0, 3, () => RB + 2, (dx, v, nx) => (v === 3 ? (AGE === 3 ? Au[nx < 0 ? 1 : 2] : tone(nx, 1)) : (dx + 40) % 5 === 0 ? 'V' : tone(nx, -1)));
  if (AGE === 2) {
    drum(g, 4, TH, rTower, body);
    drum(g, TH - 2, TH, rTower, (dx, v, nx) => (nx > 0.2 ? 'V' : 'U'));            // eave shadow under the cap
    onDrum(g, -12, -4, 2, 2 + DOORH - 2, door);
    for (const [x0, v0] of WINS) onDrum(g, x0, x0 + 2, v0, v0 + 5, win);
  } else {
    // below the gallery, then the gallery deck (it hides the tower behind/below it), then the tower above it (in front of the
    // deck's far half): a horizontal deck can never cover stonework that rises above it.
    drum(g, 4, VD - 1, rTower, body);
    onDrum(g, -12, -4, 2, 2 + DOORH - 2, door);
    onDrum(g, WINS[0][0], WINS[0][0] + 2, WINS[0][1], WINS[0][1] + 5, win);
    const RG = rTower(VD) + 6, deck = (dy0, fn) => { for (let dy = -Math.ceil(RG / 2); dy <= Math.ceil(RG / 2); dy++) for (let dx = -RG; dx <= RG; dx++) { const q = (dx / RG) ** 2 + (dy / (RG / 2)) ** 2; if (q <= 1) { const ch = fn(dx, dy, q); if (ch) pixSet(g, CX + dx, CY - VD + dy + dy0, ch); } } };
    // the deck boards with a dark edge and its underside
    deck(2, (dx, dy, q) => (q > 0.84 ? 'v' : null));                                   // underside: the deck's thickness
    deck(0, (dx, dy, q) => (q > 0.84 ? (dy > 0 ? 'W' : 'v') : Math.floor((dx + 40) / 3) % 2 ? 'w' : 'O'));
    drum(g, VD, TH, rTower, body);
    drum(g, TH - 2, TH, rTower, (dx, v, nx) => (nx > 0.2 ? 'V' : 'U'));
    for (const [x0, v0] of WINS.slice(1)) onDrum(g, x0, x0 + 2, v0, v0 + 5, win);
    // the near half of the rail: posts every 6 px standing on the deck rim, a timber rail with a gilt cap
    for (let dx = -RG; dx <= RG; dx++) {
      const yy = Math.round((RG / 2) * Math.sqrt(Math.max(0, 1 - (dx / RG) ** 2)));
      if ((dx + RG) % 6 === 0 || Math.abs(dx) === RG) for (let z = 1; z < 5; z++) pixSet(g, CX + dx, CY - VD - z + yy, dx < 0 ? 'w' : 'v');
      pixSet(g, CX + dx, CY - VD - 5 + yy, dx < -RG * 0.3 ? Au[0] : Au[1]); pixSet(g, CX + dx, CY - VD - 4 + yy, 'v');
    }
    // two gilt-fringed team banners hung from the near rail over the lit side
    for (const dx of [-15, -6]) { const nx = dx / RG, yy = Math.round((RG / 2) * Math.sqrt(1 - nx * nx)); AK.banner(g, CX + dx - 2, CY - VD - 3 + yy, -0.5 * nx / Math.sqrt(1 - nx * nx), 4, 12); }
  }
  // ---- cap: a cone over the drum top in the age's roof material, dark eave fringe, binding band, finial
  const CAPR = RT + 4, CAPH = AGE === 3 ? 24 : 19, capY = CY - TH;
  cone(g, CX, capY, CAPR, CAPH, capTex(CAPH));
  if (AGE === 3) for (let dx = -CAPR; dx <= CAPR; dx++) { const nx = dx / CAPR, y = Math.round(capY + (CAPR / 2) * Math.sqrt(Math.max(0, 1 - nx * nx))); pixSet(g, CX + dx, y, Au[nx < -0.3 ? 0 : nx > 0.4 ? 2 : 1]); pixSet(g, CX + dx, y + 1, 'v'); }
  else for (let dx = -8; dx <= 8; dx++) { const r = CAPR * 0.42, nx = dx / r; if (Math.abs(nx) > 1) continue; pixSet(g, CX + dx, Math.round(capY - CAPH * 0.58 + (r / 2) * Math.sqrt(1 - nx * nx)), nx > 0.3 ? Fe[1] : RK[5]); }
  AK.finial(g, CX, capY - CAPH - 1);
  hub = [CX - 12, capY - 3];
}

// ================================================================ Feudal: a timber post mill on its trestle
if (AGE === 1) {
  const g = pixGrid(GW, GH);
  const BA0 = 0.68, BA1 = 1.3, BC0 = 0.6, BC1 = 1.36, BZ0 = 22, BZ1 = 50, RZ = 59, PA = 0.99, PC = 0.99;
  const AM = (BA0 + BA1) / 2;
  // ladder up to the back door (behind the body; it shows to the right of it) and the tail pole beside it
  for (const la of [AM - 0.09, AM + 0.07]) line(g, iso(la, BC0, BZ0 + 3), iso(la, 0.1, 0), (i, n) => (i === n ? INK : la < AM ? 'w' : 'v'));
  for (let k = 1; k < 9; k++) { const t = k / 9; line(g, iso(AM - 0.09, BC0 + (0.1 - BC0) * t, (BZ0 + 3) * (1 - t)), iso(AM + 0.07, BC0 + (0.1 - BC0) * t, (BZ0 + 3) * (1 - t)), 'W'); }
  line(g, iso(BA1 - 0.04, BC0, BZ0 + 1), iso(BA1 + 0.18, 0.18, 4), (i, n) => (i === n ? INK : 'v'));
  // trestle: two cross-trees on four stone piers, quarterbars from their ends up to the main post
  const pier = (a, c) => { const q = 0.05; wallC(g, c + q, a - q, a + q, 0, 4, (U, V) => (V >= 3 ? SK[1] : Math.floor(U) % 4 === 0 ? SK[4] : SK[2])); wallA(g, a + q, c + q, c - q, 0, 4, (U, V) => (V >= 3 ? SK[3] : SK[4])); flat(g, a - q, a + q, c - q, c + q, 4, () => SK[0]); };
  const beam = (p, q, lit) => { line(g, p, q, lit ? 'w' : 'W'); line(g, [p[0], p[1] + 1], [q[0], q[1] + 1], 'v'); };
  const ENDS = [[0.58, PC], [PA, 0.58], [1.4, PC], [PA, 1.4]];
  for (const [a, c] of ENDS.slice(0, 2)) pier(a, c);
  beam(iso(0.58, PC, 6), iso(PA, PC, 6), false); beam(iso(PA, 0.58, 6), iso(PA, PC, 6), true);
  for (const [a, c] of ENDS.slice(0, 2)) beam(iso(a, c, 6), iso(PA, PC, 17), a < PA);
  // the main post
  wallC(g, PC + 0.05, PA - 0.05, PA + 0.05, 0, BZ0 + 1, (U) => (U < 1 ? 'O' : 'w'));
  wallA(g, PA + 0.05, PC + 0.05, PC - 0.05, 0, BZ0 + 1, (U) => (U > 2 ? 'W' : 'v'));
  for (const [a, c] of ENDS.slice(2)) pier(a, c);
  beam(iso(PA, PC, 6), iso(1.4, PC, 6), false); beam(iso(PA, PC, 6), iso(PA, 1.4, 6), true);
  for (const [a, c] of ENDS.slice(2)) beam(iso(a, c, 6), iso(PA, PC, 17), c > PC);
  // the body: weatherboards (3 px laps) on both faces, corner posts; the sails' gable faces the lit side
  const board = lit => (U, V, len) => { const u = Math.floor(U), v = Math.floor(V);
    if (u < 2 || u > len - 3) return lit ? (u < 1 ? 'O' : 'W') : (u > len - 2 ? 'v' : 'W');
    if (v % 3 === 0) return 'v'; if (v % 3 === 2) return lit ? 'O' : 'w'; return lit ? 'w' : 'W'; };
  const LEN_A = (BA1 - BA0) * 32, LEN_C = (BC1 - BC0) * 32;
  wallA(g, BA1, BC1, BC0, BZ0, BZ1, (U, V) => board(false)(U, V, LEN_C));
  wallC(g, BC1, BA0, BA1, BZ0, BZ1, (U, V) => board(true)(U, V, LEN_A));
  // sole plate under the body (it rests on the crown tree)
  line(g, iso(BA0, BC1, BZ0), iso(BA1, BC1, BZ0), 'v'); line(g, iso(BA1, BC1, BZ0), iso(BA1, BC0, BZ0), INK);
  // shingle roof: the shaded (+a) slope reads; the lit (-a) slope is a sliver at this pitch (back face: flip)
  { const ov = 0.06, o = iso(BA1 + ov, BC1 + ov, BZ1 - 2), u = sub2(iso(BA1 + ov, BC0 - ov, BZ1 - 2), o), v = sub2(iso(AM, BC1 + ov, RZ), o);
    face(g, o, u, v, (s, t, x, y) => (t < 0.08 ? RK[5] : AK.roofXY(x, y, -0.5, 1))); }
  line(g, iso(AM, BC1 + 0.06, RZ), iso(AM, BC0 - 0.06, RZ), INK);
  line(g, iso(AM, BC1 + 0.06, RZ - 1), iso(AM, BC0 - 0.06, RZ - 1), RK[2]);
  // front gable triangle up to the ridge (the breast the sails turn on)
  wallC(g, BC1, BA0, BA1, BZ1, RZ, (U, V) => { const half = LEN_A / 2, w = half * (1 - V / (RZ - BZ1)); if (Math.abs(U - half) > w) return null; return board(true)(U + 2, V + BZ1 - BZ0, LEN_A + 8); });
  // barge boards on the front gable
  line(g, iso(BA0 - 0.06, BC1 + 0.06, BZ1 - 1), iso(AM, BC1 + 0.06, RZ), (i) => (i % 5 === 2 ? 'v' : 'w'));
  line(g, iso(BA1 + 0.06, BC1 + 0.06, BZ1 - 2), iso(AM, BC1 + 0.06, RZ), 'W');
  // a shuttered window on the side, a carved knob finial at the ridge's back end
  { const p = iso(BA1, (BC0 + BC1) / 2 - 0.05, BZ0 + 13); AK.windowAt(g, Math.round(p[0]), Math.round(p[1]), -0.5, 1); }
  { const p = iso(AM, BC0 - 0.06, RZ); AK.finial(g, Math.round(p[0]), Math.round(p[1]) - 1); }
  const hp = iso(AM, BC1 + 0.06, BZ1 + 1); hub = [Math.round(hp[0]), Math.round(hp[1])];
  inkOnto(G0, g);
}

// ================================================================ Dark: a thatched quern hut, no windmill yet
let quern = null, pole = null;
if (AGE === 0) {
  const g = pixGrid(GW, GH);
  const HR = 17, HW = 14, ER = 22, EZ = 12, CH = 25;
  // wattle-and-daub drum: the kit's wattle texture wrapped round the wall (u = arc length), the lit side to the left
  drum(g, 0, HW, () => HR, (dx, v, nx, ph) => {
    const u = (ph + 2) * HR, face = nx > 0.3 ? 1 : 0;
    if (dx >= -15 && dx <= -3 && v <= 11) {                                         // doorway with a team hide hung across it
      const su = dx + 15;
      if (v === 11) return TW[2]; if (su === 0 || su === 12) return TW[1];
      if (su >= 10 || v < 1) return DEEP;
      return su === 1 ? 'L' : (su + (v >> 2)) % 3 === 0 ? 'D' : 'T';
    }
    return AK.wallTex(u, v, face, { len: 400, H: HW + 2, pl: 1 });
  });
  // the thatch: a steep cone overhanging the wall almost to the doorhead, ragged strands at the eave
  const capY = CY - EZ;
  cone(g, CX, capY, ER, CH, capTex(CH));
  for (let dx = -ER; dx <= ER; dx++) if (hash(dx, 7, 9) < 0.45) { const nx = dx / ER, y = Math.round(capY + (ER / 2) * Math.sqrt(Math.max(0, 1 - nx * nx))); pixSet(g, CX + dx, y + 1, RK[5]); if (hash(dx, 8, 9) < 0.3) pixSet(g, CX + dx, y + 2, RK[6]); }
  // the eave's shadow on the daub just under the fringe
  for (let dx = -HR + 1; dx < HR; dx++) { const nx = dx / ER, y = Math.round(capY + (ER / 2) * Math.sqrt(Math.max(0, 1 - nx * nx))), y2 = y + (hash(dx, 7, 9) < 0.45 ? 2 : 1); if (dx < -15 || dx > -3) pixSet(g, CX + dx, y2, AK.P[2]); pixSet(g, CX + dx, y + 1, RK[6]); }
  // smoke hole at the tip under crossed poles
  pixStamp(g, CX - 2, capY - CH - 1, `.kkk.\nkΨΨΨk`.replace(/k/g, INK));
  AK.finial(g, CX, capY - CH - 1);
  smokeAt = [CX, capY - CH - 3];
  quern = iso(1.76, 1.46, 0); pole = iso(0.22, 1.78, 0);
  inkOnto(G0, g);
}

// ---- props on the apron, each with a job, all standing clear of the building's base so nothing sinks into its wall:
// sacks stacked on a pallet in front of the wall left of the door, a spare millstone lying flat on the shaded side, and a
// handcart at the end of the door path (Dark: the sacks sit on the ground and the quern takes the cart's place)
const sack = (x, y) => pixStamp(g, x, y, `
...k...
..kvk..
.kSssk.
kSSsssk
kSsssmk
ksssmmk
.kkkkk.
`);
{ const PA0 = 0.16, PA1 = 0.54, PC0 = 1.26, PC1 = 1.62;   // pallet: well outside the tower's base circle (round-2 fix)
  if (AGE >= 1) {
    flat(g, PA0, PA1, PC0, PC1, 0, (s, t) => (t < 0.08 ? 'J' : Math.floor(s * 4) !== Math.floor((s + 0.06) * 4) ? 'v' : t > 0.85 ? 'v' : 'W'));
    wallC(g, PC1, PA0, PA1, 0, 2, (U, V) => (V >= 1 ? 'w' : 'v'));
    wallA(g, PA1, PC1, PC0, 0, 2, () => 'v');
  }
  const p = iso((PA0 + PA1) / 2, (PC0 + PC1) / 2, AGE >= 1 ? 2 : 0), x = Math.round(p[0]), y = Math.round(p[1]);
  // back row, front row, one on top
  sack(x - 7, y - 10); sack(x - 1, y - 8); sack(x - 10, y - 6); sack(x - 4, y - 4); sack(x - 5, y - 12);
}
// millstone lying flat: a 2:1 disc with 3 px of edge, a dressed top (furrows) and the square eye
if (AGE >= 1) { const p = iso(1.56, 0.5, 0), mx = Math.round(p[0]), my = Math.round(p[1]), R = 8, ZT = 3;
  for (let z = 0; z < ZT; z++) for (let dx = -R; dx <= R; dx++) { const hy = Math.round(Math.sqrt(Math.max(0, R * R - dx * dx)) / 2); pixSet(g, mx + dx, my + hy - z, z === 0 ? 'k' : dx > R * 0.3 ? 'U' : dx < -R * 0.5 ? 'q' : 'Q'); }
  for (let dy = -5; dy <= 5; dy++) for (let dx = -R; dx <= R; dx++) { const d = Math.hypot(dx, dy * 2); if (d > R + 0.3) continue;
    const ang = Math.atan2(dy * 2, dx), sec = (ang + Math.PI) / (Math.PI / 3), fur = sec % 1 < 0.16 && d > 2.5 && d < R - 1.2;
    pixSet(g, mx + dx, my - ZT + dy, d > R - 0.9 ? (dx + dy * 2 < 0 ? 'p' : 'U') : fur ? 'U' : dx + dy * 2 < -2 ? 'P' : 'p'); }
  pixStamp(g, mx - 1, my - ZT - 1, `
KK
KK
`);
}
// handcart at the end of the door path: a plank bed on the iso axes (long along c), side boards, a spoked wheel on the
// near side, handles reaching toward the viewer and resting on the ground
if (AGE >= 1) { const A0 = 1.5, A1 = 1.74, C0 = 1.36, C1 = 1.7, BZ = 5;
  flat(g, A0 - 0.04, A1 + 0.1, C0 - 0.02, C1 + 0.2, 0, (s, t, x, y) => (hash(x, y, 9) < 0.7 ? 'f' : null));      // its shadow on the earth
  flat(g, A0, A1, C0, C1, BZ, (s, t) => (Math.floor(s * 4) !== Math.floor((s + 0.07) * 4) ? 'v' : t < 0.2 ? 'O' : 'w'));
  const sp = iso((A0 + A1) / 2, (C0 + C1) / 2 - 0.04, BZ); sack(Math.round(sp[0]) - 3, Math.round(sp[1]) - 9);
  wallA(g, A1, C1, C0, BZ - 2, BZ + 2, (U, V) => (V < 1 ? 'k' : V >= 3 ? 'W' : Math.floor(U) % 6 === 0 ? 'J' : 'v'));
  wallC(g, C1, A0, A1, BZ - 2, BZ + 2, (U, V) => (V < 1 ? 'k' : V >= 3 ? 'O' : 'w'));
  const wc = iso(A1 + 0.02, (C0 + C1) / 2, 4), wx = Math.round(wc[0]), wy = Math.round(wc[1]);
  disc(g, wx, wy, 4, (dx, dy, ring) => (ring ? 'k' : dx === 0 || dy === 0 ? 'w' : 'v'));
  pixSet(g, wx, wy, 'M');
  for (const sa of [A0 + 0.03, A1 - 0.03]) { line(g, iso(sa, C1, BZ + 1), iso(sa, C1 + 0.26, 1), (i, n) => (i === n ? 'k' : 'O')); line(g, iso(sa, C1, BZ), iso(sa, C1 + 0.26, 0), (i, n) => (i === n ? 'k' : 'v')); }
}
// Dark: the hand quern on a log stump (two small stones, the upper one turned by a peg handle) with flour spilt round it,
// a basket of grain beside it
/** An upright cylinder: side(dx, z, nx) and top(dx, dy) chars; base centre (cx, cy), radius r, from z0 to z1. */
function cyl(gr, cx, cy, r, z0, z1, side, top) {
  for (let z = z0; z < z1; z++) for (let dx = -r; dx <= r; dx++) { const hy = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx)) / 2); pixSet(gr, cx + dx, cy + hy - z, side(dx, z, dx / r)); }
  for (let dy = -Math.ceil(r / 2); dy <= Math.ceil(r / 2); dy++) for (let dx = -r; dx <= r; dx++) if (Math.hypot(dx, dy * 2) <= r + 0.3) pixSet(gr, cx + dx, cy - z1 + dy, top(dx, dy));
}
let quernTop = null;
if (AGE === 0) {
  const qx = Math.round(quern[0]), qy = Math.round(quern[1]);
  flat(g, 1.6, 1.92, 1.32, 1.62, 0, (s, t, x, y) => (hash(x, y, 3) < 0.35 ? 'S' : null));                      // flour on the earth
  const G1 = g; { const g = pixGrid(GW, GH);
  cyl(g, qx, qy, 6, 0, 5, (dx, z, nx) => (z === 0 ? 'k' : nx < -0.4 ? 'w' : nx > 0.4 ? 'v' : Math.abs(dx) % 3 === 0 ? 'v' : 'W'), (dx, dy) => (Math.hypot(dx, dy * 2) > 4.5 ? 'w' : (Math.hypot(dx, dy * 2) | 0) % 2 ? 'O' : 'w'));
  cyl(g, qx, qy, 5, 5, 8, (dx, z, nx) => (z === 5 ? SK[4] : nx < -0.4 ? SK[1] : nx > 0.4 ? SK[3] : SK[2]), (dx, dy) => (dx + dy < -1 ? SK[0] : SK[1]));
  cyl(g, qx, qy, 4, 8, 11, (dx, z, nx) => (z === 8 ? SK[5] : nx < -0.4 ? SK[0] : nx > 0.4 ? SK[3] : SK[1]), (dx, dy) => (dx === 0 && dy === 0 ? 'K' : dx + dy < -1 ? 'S' : SK[0]));
  inkOnto(G1, g); }
  quernTop = [qx, qy - 11];
  // a grain basket beside it
  const bk = iso(1.42, 1.74, 0); cyl(g, Math.round(bk[0]), Math.round(bk[1]), 4, 0, 5, (dx, z, nx) => (z === 0 ? 'k' : (dx + z) % 2 ? 'W' : nx > 0.3 ? 'v' : 'O'), (dx, dy) => (Math.hypot(dx, dy * 2) > 3.2 ? 'W' : dy < 0 ? 'A' : 'B'));
  // the pennant pole: a peeled sapling driven into the earth at the left corner
  for (let z = 0; z < 30; z++) { pixSet(g, pole[0], pole[1] - z, 'w'); pixSet(g, pole[0] + 1, pole[1] - z, 'v'); }
  pixSet(g, pole[0], pole[1] - 30, 'O');
}

// ---- the apron's edge frayed with weeds (no ruled diamond); a little spilt grain by the sacks
{ const isG = ch => GROUND.includes(ch);
  if (AGE >= 1) spill(g, ...iso(0.5, 1.5, 0), 9, 4, 7, ['A', 'B'], 'f', isG, 4);
  fray(g, isG, 7, { edge: 0.06, feet: 0.2, feetOf: 'PpqQUVjJ' + AK.P.join('') + SK.join('') + 'wWvO' }); }
// ---- idle frames
const e = th => [Math.cos(th) * 0.89, Math.cos(th) * 0.45 - Math.sin(th)];
function sails(fr, f) {
  if (AGE >= 2) line(fr, [hub[0] + 4, hub[1] - 1], hub, 'v');                       // windshaft stub out of the cap
  for (let j = 0; j < 4; j++) {
    const th = f * Math.PI / 8 + j * Math.PI / 2, d = e(th), n = e(th + Math.PI / 2);
    // lattice sail on the trailing side of the stock
    const o = [hub[0] + d[0] * 6 + n[0] * 1, hub[1] + d[1] * 6 + n[1] * 1], u = [d[0] * (ARM - 6), d[1] * (ARM - 6)], v = [n[0] * 7, n[1] * 7];
    face(fr, o, u, v, (s, t) => {
      const along = s * (ARM - 6);
      if (t > 0.84) return AGE === 3 && along % 8 < 1 ? Au[1] : 'v';               // outer frame bar
      if (along % 4 < 1) return 'W';                                                // cross laths
      if (s > 0.96) return 'v';
      return t < 0.22 ? 'L' : t > 0.66 ? 'D' : 'T';
    });
    // the stock (whip) itself, 2 px, lit edge up-left
    line(fr, hub, [hub[0] + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'w');
    line(fr, [hub[0] + 1, hub[1]], [hub[0] + 1 + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'v');
  }
  disc(fr, hub[0], hub[1], 2, (dx, dy, ring) => (ring ? 'k' : AGE === 3 ? Au[0] : 'O'));
}
const puff = (f, x, y, r) => {
  if (r === 0) { pixRect(f, x, y, 2, 2, 'h'); pixSet(f, x, y, 'z'); return; }
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + r * 0.6) continue; pixSet(f, x + xx, y + yy, (xx + yy < 0) ? 'z' : (xx + yy > r ? 'H' : 'h')); }
};
function hutLife(fr, f) {
  // the quern's peg handle goes round the upper stone (a quarter turn per frame)
  const ang = f * Math.PI / 2 + 0.4, px = Math.round(quernTop[0] + Math.cos(ang) * 3), py = Math.round(quernTop[1] + Math.sin(ang) * 1.5);
  for (let z = 0; z < 5; z++) pixSet(fr, px, py - z, z === 4 ? 'O' : 'w');
  pixSet(fr, px + 1, py - 1, 'v');
  // smoke from the hole in the thatch, rising and drifting right
  for (let k = 0; k < 3; k++) { const t = ((f + k * 4 / 3) % 4) / 4, r = t < 0.3 ? 1 : 2; puff(fr, smokeAt[0] + Math.round(Math.sin(t * 5) * 1.5 + t * 8), smokeAt[1] - Math.round(2 + t * 16), r); }
  // the team pennant on the sapling
  const x0 = pole[0] + 2, y0 = pole[1] - 29, len = 18;
  for (let i = 0; i < len; i++) {
    const wave = Math.round(Math.sin((i / len) * Math.PI * 1.6 - f * Math.PI / 2) * 1.5 * (i / len)), hgt = Math.max(1, Math.round(10 * (1 - i / len)));
    const top = y0 + Math.round((10 - hgt) / 2) + wave;
    for (let k = 0; k < hgt; k++) pixSet(fr, x0 + i, top + k, k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T');
  }
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = clone(g);
  if (AGE >= 1) sails(fr, f); else hutLife(fr, f);
  outline(fr, ch => (GROUND.includes(ch) ? 'X' : 'zhH'.includes(ch) ? 'H' : 'k'));
  frames.push(pixText(fr));
}

// Imperial tower: the stone ramp in pale limestone from the age kit (same chars, so the tower code is shared with Castle)
const LIME = AGE === 3 ? { P: AK.pal[SK[0]], p: AK.pal[SK[1]], q: AK.pal[SK[2]], Q: AK.pal[SK[3]], U: AK.pal[SK[4]], V: AK.pal[SK[5]], j: '#b9ab8a', J: '#857862' } : {};
export default {
  id: 'mill', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    e: '#8f7148', E: '#a3844f', f: '#6f5636', c: '#a39a8a', C: '#8d8478', X: '#4a3520',          // apron earth, cobbles, rim
    P: '#d6ccb4', p: '#c4b796', q: '#ab9d7e', Q: '#8f8268', U: '#746a55', V: '#584f40',          // tower stone ramp (warm)
    j: '#7d725e', J: '#4e4636', K: '#1e1814',                                                    // mortar lit / shade, dark
    A: '#e6c272', B: '#d0a650',                                                                  // grain
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', O: '#c9a86a', k: '#24180f',                       // timber, hub, ink
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', M: '#9aa0a6',                                      // sacks, iron
    z: '#e4e0da', h: '#c4beb8', H: '#948e88',                                                    // smoke
    ...LIME, ...NAT_PAL,
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
