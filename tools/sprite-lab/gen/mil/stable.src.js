// @pixel stable
// Stable (3×3): a long stall block along the back-right edge under a hipped roof of wooden shingles laid in courses,
// team-colour fascia boards on the eaves; six open bays on its lit long face with team-colour half-doors, three horses
// (bay, grey, black) looking out over them and hay racks in the others. In front, a fenced paddock with a muddy floor,
// a water trough and a bay horse; two hay bales by a hay-rack bay, a hay pile and a pitchfork. Generated (code before
// export); anchor = footprint bottom corner. idle: 4 frames — a stall horse bobs its head, the paddock horse swishes
// its tail and flicks an ear, another stall horse turns its head.
//   Feudal   (as above) timber stall block under brown shingles.
//   Castle   taller dressed-stone stall block: stone piers and round-arched bays, a stone end wall with an arched loft door,
//            red clay tiles with ridge tiles and iron finials, a tiled hay-loft dormer with a hoist beam on the front slope.
//   Imperial pale limestone with pilasters and a gilt string course, slate roof with gilt cresting and eaves, a lantern
//            cupola on the ridge with a gilt weathervane, gilt-fringed banners; white-railed paddock fence.
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 46 + [0, 0, 10, 30][AGE];
const bx = W * 32 + 2, by = GH - 4, OY = by - 138;              // OY: extra headroom of the taller ages (fixed coordinates shift by it)
//@KIT
const g = pixGrid(GW, GH);
const top = pixIsoBox(g, bx, by, W, H, 2, 1, { left: 'z', right: 'x' });
const { T, L, Rr, Bm } = top;

// ---- ground: earth with straw clusters; the paddock (front-left) trodden to mud with hoof marks
const iso = (tx, ty) => [bx + (tx - ty) * 32, by - 98 + (tx + ty) * 16];            // a point on the ground (top of the plinth)
const PAD = { ty: 1.55, tx: 2.1 };
const inPad = (x, y) => { const d = (x - bx) / 32, s = (y - by + 98) / 16, tx = (s + d) / 2, ty = (s - d) / 2; return ty > PAD.ty && tx < PAD.tx; };
for (const [x, y] of cells([T, Rr, Bm, L])) {
  const n = vnoise(x, y, 7, 4), s = vnoise(x, y, 3, 9);
  let ch = n < 0.32 ? 'Y' : n > 0.74 ? 'j' : 'y';
  if (inPad(x, y)) ch = n < 0.45 ? 'J' : n > 0.8 ? 'y' : 'Y';
  else if (s > 0.86) ch = 'j';
  g[y][x] = ch;
}
for (let i = 0; i < 40; i++) { const p = [24 + hash(i, 71) * 100, 92 + OY + hash(i, 72) * 40], x = Math.round(p[0]), y = Math.round(p[1]);   // hoof prints in the mud: a little dark crescent
  if (g[y] && inPad(x, y) && 'yYJ'.includes(g[y][x]) && 'yYJ'.includes(g[y][x + 1]) && g[y + 1] && 'yYJ'.includes(g[y + 1][x])) { g[y][x] = 'u'; g[y][x + 1] = 'x'; g[y + 1][x] = 'x'; } }
for (let i = 0; i < 30; i++) { const x = Math.round(80 + hash(i, 73) * 110), y = Math.round(70 + OY + hash(i, 74) * 60), d = hash(i, 75) < 0.5 ? 1 : -1;   // loose straw
  if (g[y] && g[y + d] && !inPad(x, y) && 'yYj'.includes(g[y][x]) && 'yYj'.includes(g[y + d][x + 1])) { g[y][x] = 'h'; g[y + d][x + 1] = 'H'; } }
for (const [x, y0] of [[40, 104], [54, 112], [70, 118], [46, 96], [84, 122], [62, 104]]) { const y = y0 + OY; g[y][x] = 'u'; g[y][x + 1] = 'u'; g[y + 1][x + 1] = 'J'; }

// ---- the stall block
const SZ = [18, 18, 22, 24][AGE], DY = SZ - 18, LT = AGE >= 2 ? 5 : 3;   // wall height, its growth, lintel rows
const st = pixIsoBox(g, 156, 107 + OY, 3, 1.2, SZ, 1, {});
const sb = st.base;
const RISE = [15, 15, 15, 17][AGE];
const { R: AR, S: AS, Au, Fe, Gl, DEEP } = AK;
const mL = lerp(st.T, st.L, 0.5), mR = lerp(st.Rr, st.Bm, 0.5);
const r1 = P(lerp(mL, mR, 0.12), 0, -RISE), r2 = P(lerp(mL, mR, 0.88), 0, -RISE);
const HORSES = { bay: 'CcnNM', grey: 'AaBGg', black: 'gFfNM' };
// a horse looking out over a half-door, facing out of the bay (muzzle low-left, poll up, neck running down behind the door)
const HEAD = `
....4...
...424..
..12224.
.1e22234
11222234
55.12234
55..2334
....2334
....2334
....2334
`;
const paintHorse = (t, x, y, text, cols) => pixStamp(t, x, y, text.replace(/[1-5e]/g, ch => ch === 'e' ? 'k' : cols['12345'.indexOf(ch) === -1 ? 0 : '12345'.indexOf(ch)]));
inked(g, t => {
  // back plane + short shaded end wall
  if (AGE === 1) {
  wall(t, st.Bm, st.Rr, 18, (a, v) => v < 2 ? 'u' : v >= 16 ? 'u' : planks({ t: ['w', 't', 'u'], ph: 3, s: 21 })(a, v));
  wall(t, st.Bm, st.Rr, 18, (a, v) => a >= 14 && a <= 22 && v >= 4 && v <= 10 ? (v === 4 || a === 14 || a === 22 ? 'u' : v === 10 ? 'w' : 'I') : null);  // hay loft door
  } else wall(t, st.Bm, st.Rr, SZ, (a, v) => {                                          // stone end wall, an arched loft door
    const h = SZ - 1 - v, su = a - 14, n = 8, top = SZ - 5;
    if (su >= 0 && su <= n && h >= top - 9 && h <= top) { const c = n / 2, dh = h - (top - c); if (!(dh > 0 && Math.hypot(su - c, dh * 1.2) > c + 0.3)) {
      if (su === 0 || su === n || h === top - 9 || (dh > 0 && Math.hypot(su - c, (dh + 1) * 1.2) > c + 0.3)) return AGE === 3 && su === 4 && h > top - 2 ? Au[1] : AS[2];
      return su === 4 ? 'u' : (su % 2 ? 'w' : 't'); } }
    return AK.wallTex(a, h, 1, { len: 38, H: SZ, step: 20 });
  });
  // the open long face: lintel, six bays, posts, team half-doors
  if (AGE === 1) wall(t, st.L, st.Bm, 18, (a, v) => {
    const bay = Math.floor(a / 16), k = a - bay * 16;
    if (v === 0) return 'W'; if (v === 1) return 't'; if (v === 2) return 'u';
    if (k <= 1) return k === 0 ? 'w' : 't';                                                 // posts
    if (v === 17) return 'u';
    if (v >= 11) return v === 11 ? 'L' : (k === 2 ? 'D' : (k % 3 === 0 ? 'D' : 'T'));          // half-door
    return v <= 4 ? 'I' : 'i';                                                               // stall interior
  });
  else wall(t, st.L, st.Bm, SZ, (a, v) => {                                                // stone piers, round-arched bays
    const bay = Math.floor(a / 16), k = a - bay * 16, h = SZ - 1 - v, su = k - 3, n = 12, c = n / 2;
    const archTop = SZ - LT - 1, dh = h - (archTop - c);
    const inOpen = su >= 0 && su <= n && h <= archTop && !(dh > 0 && Math.hypot(su - c, dh * 1.6) > c + 0.3);
    if (!inOpen) {
      const ring = su >= -1 && su <= n + 1 && h <= archTop + 2 && dh > -1;                   // voussoirs round each arch
      if (ring && h > archTop - c) return AGE === 3 && su === c && h >= archTop ? Au[0] : (su + h) % 3 === 0 ? AS[3] : AS[1];
      return AK.wallTex(a, h, 0, { len: 96, H: SZ, step: 16 });
    }
    if (h === 0) return AS[3];
    if (su === 0 || su === n) return AS[2];                                                 // jambs
    if (v >= SZ - 7) return v === SZ - 7 ? 'L' : (su === 1 ? 'D' : (su % 3 === 0 ? 'D' : 'T'));  // half-door
    return v <= LT + 1 || dh > 0 ? 'I' : 'i';                                               // stall interior
  });
  // hay racks in the empty bays
  for (const bay of [1, 3, 5]) { const p = lerp(st.L, st.Bm, (bay * 16 + 4) / 96); stampL(t, p[0], p[1] + 5 + DY + (AGE >= 2 ? 1 : 0), `
u.u.u.u.u.u
hHhhHhhHhh.
.HhhhHhhH..
`); }
  // corner post at the front arris
  pixLine(t, st.Bm[0], st.Bm[1], st.Bm[0], st.Bm[1] + SZ - 1, AGE === 1 ? 'u' : AS[4]);
  // roof: back plane, lit hip, front plane, shaded hip; shingles in courses with a lit butt and a shadow line
  // the back plane slopes away: its eave T→Rr sits above the ridge on screen, so its courses lap upward (flip)
  {                                                                                         // the age kit's shingles / tiles / slate (they lean to the owner's colour)
    plane(t, [st.T, st.Rr, r2, r1], st.T, st.Rr, (a, d, u, x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true }), true);
    plane(t, [st.L, st.T, r1], st.L, st.T, (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 2, { flip: true }));
    plane(t, [st.L, st.Bm, r2, r1], st.L, st.Bm, (a, d, u, x, y) => AK.roofXY(x, y, 0.5, 0));
    plane(t, [st.Bm, st.Rr, r2], st.Bm, st.Rr, (a, d, u, x, y) => AK.roofXY(x, y, -0.5, 1));
    if (AGE === 1) sagLine(t, r1, r2, 1, (x, y) => { put(t, x, y, 'k'); AK.crest(t, [x, y], [x, y]); });   // the timber ridge has settled
    else { pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); AK.crest(t, r1, r2); }
    for (const [a, b] of [[st.L, r1], [st.T, r1], [st.Bm, r2], [st.Rr, r2]]) pixLine(t, a[0], a[1], b[0], b[1], AR[5]);
    pixLine(t, st.Bm[0] - 1, st.Bm[1] - 1, r2[0] - 1, r2[1], AR[1]);
    for (const [a, b, c1, c2] of [[st.L, st.Bm, 'T', 'D'], [st.Bm, st.Rr, 'D', 'D']]) { pixLine(t, a[0], a[1], b[0], b[1], c1); pixLine(t, a[0], a[1] + 1, b[0], b[1] + 1, c2); }
    if (AGE === 3) { AK.trim(t, st.L, st.Bm, -1); AK.trim(t, st.Bm, st.Rr, -1); }
  }
});
// Castle: a tiled hay-loft dormer with a hoist beam on the front slope; Imperial: a lantern cupola with a gilt weathervane
let VANE = null;
if (AGE === 2) inked(g, t => {                                                          // a tiled louvre vent astride the ridge
  const m = lerp(r1, r2, 0.42), cb = [Math.round(m[0]) + 1, Math.round(m[1]) + 5];
  const q = pixIsoBox(t, cb[0], cb[1], 0.26, 0.26, 7, 1, {});
  wall(t, q.L, q.Bm, 7, (a, v) => v === 0 ? AS[0] : v % 2 ? DEEP : AK.W[0]);
  wall(t, q.Bm, q.Rr, 7, (a, v) => v === 0 ? AS[2] : v % 2 ? DEEP : AK.W[1]);
  const RF = { L: [q.L[0] - 2, q.L[1] + 1], Bm: [q.Bm[0], q.Bm[1] + 2], Rr: [q.Rr[0] + 2, q.Rr[1] + 1], T: q.T };
  const ap = pixIsoRoof(t, RF, 7, 1, { back: '1', left: '2', front: '3', right: '4' });
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = t[y][x]; if ('34'.includes(c)) t[y][x] = AK.roofXY(x, y, c === '3' ? 0.5 : -0.5, c === '3' ? 0 : 1); else if ('12'.includes(c)) t[y][x] = AR[2]; }
  pixLine(t, RF.Bm[0], RF.Bm[1], ap[0], ap[1], AR[1]);
  AK.finial(t, Math.round(ap[0]), Math.round(ap[1]) - 1);
  AK.finial(t, Math.round(r1[0]), Math.round(r1[1]) - 1); AK.finial(t, Math.round(r2[0]), Math.round(r2[1]) - 1);
});
if (AGE === 3) inked(g, t => {
  const m = lerp(r1, r2, 0.5), cb = [Math.round(m[0]) + 1, Math.round(m[1]) + 6];
  const q = pixIsoBox(t, cb[0], cb[1], 0.3, 0.3, 14, 1, {});
  wall(t, q.L, q.Bm, 14, (a, v) => a >= 3 && a <= 6 && v >= 3 && v <= 10 ? (v === 3 ? AS[2] : Gl[v < 7 ? 1 : 0]) : v === 0 ? Au[1] : AS[a < 1 ? 1 : 0]);
  wall(t, q.Bm, q.Rr, 14, (a, v) => a >= 3 && a <= 6 && v >= 3 && v <= 10 ? (v === 3 ? AS[3] : Gl[0]) : v === 0 ? Au[2] : AS[2]);
  const RF = { L: [q.L[0] - 1, q.L[1] + 1], Bm: [q.Bm[0], q.Bm[1] + 2], Rr: [q.Rr[0] + 1, q.Rr[1] + 1], T: q.T };
  const ap = pixIsoRoof(t, RF, 10, 1, { back: '1', left: '2', front: '3', right: '4' });
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = t[y][x]; if ('34'.includes(c)) t[y][x] = AK.roofXY(x, y, c === '3' ? 0.5 : -0.5, c === '3' ? 0 : 1); else if ('12'.includes(c)) t[y][x] = AR[2]; }
  pixLine(t, RF.Bm[0], RF.Bm[1], ap[0], ap[1], Au[1]); pixLine(t, RF.L[0], RF.L[1], RF.Bm[0], RF.Bm[1], Au[1]); pixLine(t, RF.Bm[0], RF.Bm[1], RF.Rr[0], RF.Rr[1], Au[2]);
  VANE = [Math.round(ap[0]), Math.round(ap[1])];
  AK.finial(t, Math.round(r1[0]), Math.round(r1[1]) - 1); AK.finial(t, Math.round(r2[0]), Math.round(r2[1]) - 1);
});
// a team banner on the stone end wall, left of the loft door (Castle: iron rod; Imperial: gilt rod and fringe)
if (AGE >= 2) inked(g, t => AK.banner(t, Math.round(st.Bm[0]) + 5, Math.round(st.Bm[1]) + 4, -0.5, 5, AGE === 3 ? 11 : 10));
// the gilt weathervane: rod, a cockerel and an arrow that swings with the wind (drawn per frame)
function vane(t, f) {
  if (!VANE) return; const [x, y] = VANE;
  pixLine(t, x, y, x, y - 9, Fe[1]); pixSet(t, x, y - 1, Au[1]);
  const d = [1, 1, -1, -1][f]; pixLine(t, x - 4 * d, y - 6, x + 4 * d, y - 6, Au[1]); pixSet(t, x + 4 * d, y - 6, Au[0]); pixSet(t, x + 3 * d, y - 7, Au[0]); pixSet(t, x + 3 * d, y - 5, Au[0]);
  stampL(t, x - 2, y - 13, `
.ab.
abbb
.bbc
..c.
`.replace(/a/g, Au[0]).replace(/b/g, Au[1]).replace(/c/g, Au[2]));
}

// ---- two hay bales side by side on the ground in front of the first hay-rack bay (iso boxes on the ground plane, twine
// bands, cut ends in shade), then a hay pile and a pitchfork at the front corner
function bale(t, tx, ty, z) {
  const b0 = iso(tx, ty), q = pixIsoBox(t, b0[0], b0[1] - z, 0.32, 0.16, 4, 1, {});
  wall(t, q.L, q.Bm, 4, (a, v) => (a === 3 || a === 7) ? 'e' : v === 3 ? 'E' : (a + v * 3) % 5 === 0 ? 'H' : 'h');      // long side, lit
  wall(t, q.Bm, q.Rr, 4, (a, v) => v === 3 ? 'e' : (a + v) % 3 === 0 ? 'e' : 'E');                                      // cut end, shade
  plane(t, [q.L, q.T, q.Rr, q.Bm], q.L, q.T, (a, d) => (a === 3 || a === 7) ? 'E' : d % 2 ? 'h' : 'V');                 // top
}
inked(g, t => { bale(t, 0.92, 1.33, 0); bale(t, 0.9, 1.51, 0); });
inked(g, t => {
  stampL(t, 150, 104 + OY, `
.....hhh......
...hhHhhhh....
..hHhhhHhhhE..
.hhhhhhhhhEEe.
hHhhEhhhhEEEee
`);
  pixLine(t, 166, 108 + OY, 160, 92 + OY, 'w'); pixSet(t, 159, 91 + OY, 'G'); pixSet(t, 161, 91 + OY, 'G'); pixSet(t, 159, 90 + OY, 'S'); pixSet(t, 161, 90 + OY, 'S');
});

// ---- paddock: inner fence, water trough
const fence = (t, a, b, n) => {
  const FC = AGE === 3 ? [AS[3], AS[0], AS[0], AS[2], AS[2]] : ['u', 'w', 'W', 't', 't'];
  const rough = AGE < 3, sd = Math.round(a[0] * 3 + b[1]);                                // posts of varied height and lean, sagging rails (Imperial: trim white rails)
  for (let k = 0; k <= n; k++) { const p = lerp(a, b, k / n); const x = Math.round(p[0]), y = Math.round(p[1]);
    const hk = hash(k, 51, sd), ht = 8 + (rough ? (hk < 0.3 ? 1 : 0) - (hk > 0.8 ? 1 : 0) : 0), ln = rough && hash(k, 52, sd) < 0.3 ? (hash(k, 53, sd) < 0.5 ? -1 : 1) : 0;
    pixRect(t, x, y - 4, 1, 4, FC[0]); pixRect(t, x + ln, y - ht, 1, ht - 4, FC[0]); pixSet(t, x + ln, y - ht - 1, FC[1]); }
  for (const [h, c, sg] of [[7, FC[2], 1.3], [6, FC[3], 1.3], [3, FC[4], 0.8]]) for (let i = 0; i <= 64; i++) { const p = lerp(a, b, i / 64), k = i / 64 * n;
    put(t, Math.floor(p[0]), Math.floor(p[1]) - h + (rough ? sagAt(k % 1, sg * (0.7 + hash(Math.floor(k), 54, sd) * 0.6)) : 0), c); }
};
fence(g, iso(0, PAD.ty), iso(PAD.tx, PAD.ty), 6);                                        // back runs of the paddock fence
fence(g, iso(0, PAD.ty), iso(0, 3), 4);
inked(g, t => {
  const tp = iso(1.55, 1.95); const q = pixIsoBox(t, tp[0], tp[1], 0.42, 0.18, 5, 1, {});
  wall(t, q.L, q.Bm, 5, planks({ t: ['W', 'w', 't'], ph: 2, s: 31 })); wall(t, q.Bm, q.Rr, 5, planks({ t: ['w', 't', 'u'], ph: 2, s: 32 }));
  for (const [x, y] of cells([q.T, q.Rr, q.Bm, q.L])) t[y][x] = 'b';
  pixLine(t, q.L[0], q.L[1], q.T[0], q.T[1], 'W'); pixLine(t, q.T[0], q.T[1], q.Rr[0], q.Rr[1], 'w');
  pixLine(t, q.L[0] + 3, q.L[1], q.Bm[0] - 2, q.Bm[1] - 1, 'B');
});

// ---- animated: horses
const BODY = [`
....44..............
...4224.............
..12224.............
.112e224............
1122.2224....1......
55...12224111111....
5.....12222222222244
......122222222223344
......122222222333344
.......2223333333334.
.......24.3....4.33..
.......24.3....4..3..
.......24.3....4..3..
.......4..3....4..3..
.......4..3....4..3..
.......k..k....k..k..
`];
const faceA = x => x - Math.floor(st.L[0]), faceTop = x => st.L[1] + (x + 0.5 - st.L[0]) / (st.Bm[0] - st.L[0]) * (st.Bm[1] - st.L[1]);
// may a stall horse's pixel show here? only inside a bay opening: between the posts, under the lintel, above the half-door
const inBay = (x, y) => { const a = faceA(x), k = ((a % 16) + 16) % 16, v = Math.floor(y + 0.5 - faceTop(x)); return a >= 0 && a < 96 && (AGE === 1 ? k >= 2 : k >= 4 && k <= 14) && v >= LT && v <= SZ - 8; };
function stallHeads(q, f) {
  const before = copy(q);
  inked(q, t => {
    const heads = [['bay', 0, [0, 1, 1, 0][f]], ['grey', 2, 0], ['black', 4, [0, 0, 1, 1][f]]];
    for (const [kind, bay, dy] of heads) {
      const x0 = Math.round(st.L[0] + bay * 16 + 5), y0 = Math.round(faceTop(x0)) + 5 + DY + dy;
      let txt = HEAD; if (kind === 'grey' && (f === 2 || f === 3)) txt = txt.split('\n').map(r => r.split('').reverse().join('')).join('\n');   // turns its head
      paintHorse(t, x0, y0, txt, HORSES[kind].split(''));
    }
  });
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (q[y][x] !== before[y][x] && !inBay(x, y)) q[y][x] = before[y][x];
}
function horses(t, f) {
  const cols = s => s.split('');
  // the paddock horse: tail swish and an ear flick
  let b = BODY[0];
  const tail = [[[17, 5], [18, 6], [19, 6], [19, 7], [20, 8]], [[17, 5], [18, 6], [18, 7], [19, 8], [19, 9]], [[17, 5], [18, 6], [18, 7], [18, 8], [18, 9]], [[17, 5], [18, 6], [19, 7], [19, 8], [20, 9]]][f];
  b = b.replace(/4(?=\.\.\n|4\n|44\n|\.\n)/g, '.');
  const rows = b.replace(/^\n|\n$/g, '').split('\n').map(r => r.split(''));
  for (let y = 4; y < rows.length; y++) for (let x = 16; x < rows[y].length; x++) if (rows[y][x] === '4') rows[y][x] = '.';
  for (const [x, y] of tail) { while (rows[y].length <= x) rows[y].push('.'); rows[y][x] = '4'; }
  if (f === 1) { rows[0][4] = '.'; rows[1][3] = '4'; }
  paintHorse(t, iso(0.75, 2.3)[0] - 10, iso(0.75, 2.3)[1] - 15, '\n' + rows.map(r => r.join('')).join('\n') + '\n', cols(HORSES.bay));
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  stallHeads(q, f);
  inked(q, t => horses(t, f));
  // the paddock's front fence goes over the horse
  fence(q, iso(0, 3), iso(PAD.tx, 3), 6); fence(q, iso(PAD.tx, PAD.ty), iso(PAD.tx, PAD.ty + 0.55), 2); fence(q, iso(PAD.tx, 2.55), iso(PAD.tx, 3), 2);
  inked(q, t => vane(t, f));
  tufts(q, { s: 21 + AGE, dens: 0.42 });
  outline(q, 'k', 'K'); tuftInk(q);
  frames.push(pixText(q));
}

export default {
  id: 'stable', kind: 'building', footprint: [W, H], anchor: [bx, by],
  ...(AGE >= 2 ? { flags: AGE === 2 ? [[Math.round(st.T[0]) - bx, Math.round(st.T[1]) - by + 1, 14]] : [[Math.round(st.T[0]) - bx, Math.round(st.T[1]) - by + 1, 14]] } : {}),
  palette: {
    ...AK.pal, ...NAT,
    k: '#24180f', K: '#4a3520',                                              // ink
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730', z: '#7d6236', x: '#5e4a28', // earth, mud, plinth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', i: '#3a2c1f', I: '#241a12', // timber, stall dark
    V: '#d8b277', O: '#c49a5c', Q: '#a07a44', q: '#8a6a3a', P: '#7a5a30', R: '#6a4a2a', p: '#4a3520', // shingles lit → shade
    h: '#e6c272', H: '#d8ab4f', E: '#b58a3c', e: '#8f6a2c',                  // hay
    C: '#b07a4a', c: '#8a5530', n: '#5a3520', N: '#2e2018', M: '#4a3428',    // bay horse
    A: '#ece6da', a: '#c8c0b2', B: '#9a9285', b: '#2f6fb0', G: '#5f656c', S: '#9aa0a6', // grey horse; water; iron
    F: '#5e524a', f: '#2e2826', g: '#6e6a64',                                              // black horse
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
