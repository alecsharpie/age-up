// @pixel barracks
// Barracks (3×3): a fortified stone yard. Coursed ashlar curtain walls with quoins, a plinth and a coping, crenellated
// parapets, four crenellated corner turrets with arrow slits and team pennants, an arched gate with team-colour doors,
// a long team banner on the front-left wall; inside, a tiled sleeping hall, a spear-and-shield rack and a straw
// training dummy in a worn sparring ring. Generated (code before export) + hand-painted stamps; anchor = footprint
// bottom corner. idle: 4 frames — banners ripple, the dummy wobbles.
const W = 3, H = 3, Z = 20, TZ = 14;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + TZ + 30;
const bx = W * 32 + 2, by = GH - 4;
//@KIT
const g = pixGrid(GW, GH);
const top = pixIsoBox(g, bx, by, W, H, Z, 1, {});
const { T, L, Rr, Bm } = top;
const LEN = 96;

// ---- curtain walls: coping, ashlar courses (3 tones per face), quoins at the corners, a plinth course
const ashL = stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 9, s: 1, q: ['q', 'b'], qL: true, qR: true, len: LEN, ao: 14 });
const ashR = stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 9, s: 2, q: ['Q', 'e'], qL: true, qR: true, len: LEN, ao: 14 });
const plL = stone({ t: ['c', 'p', 'p'], m: 'n', ch: 4, bw: 12, s: 3 }), plR = stone({ t: ['f', 'P', 'P'], m: 'k', ch: 4, bw: 12, s: 4 });
const face = (ash, pl, cop, sh, ledge) => (a, v, u) => v === 0 ? cop : v === 1 ? sh : v === Z - 5 ? ledge : v > Z - 5 ? pl(a, v - (Z - 4)) : ash(a, v - 2, u);
wall(g, L, Bm, Z, face(ashL, plL, 'o', 'm', 'o'));
wall(g, Bm, Rr, Z, face(ashR, plR, 'O', 'n', 'O'));
pixLine(g, Bm[0], Bm[1], Bm[0], Bm[1] + Z - 1, 'n');            // the front arris, in shade

// ---- yard: sunk at ground level inside the curtain walls. Looking down through the open top, a cell either lands on the
// wall-walk (coping), on the inner face of one of the two back walls (stone courses running down to the yard), or on the
// packed-earth floor 20 px lower; the front walls hide the floor's front strip. The back-left inner face turns away from
// the light (shade ashlar), the back-right one catches it; the floor darkens in the shadow of the left walls and gets a
// contact line at every wall foot.
const TW = 0.14, IN = 3 - TW, S0 = Z / 32;                        // wall thickness (tiles); a ray drops Z/32 tiles back
const gp = (u, v, z = 0) => [bx + 32 * (v - u), by - 16 * (u + v) - z];   // footprint (u along the left edge, v along the right) → screen
const uvAt = (x, y, z) => { const dx = x + 0.5 - bx, dy = y + 0.5 - (by - z); return [(-dx / 32 - dy / 16) / 2, (dx / 32 - dy / 16) / 2]; };
const DUM = [122, 104];                                           // training dummy foot (ground)
const inU = stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 9, s: 21, ao: 10 });   // back-left wall, inner face (shade)
const inV = stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 9, s: 22, ao: 10 });   // back-right wall, inner face (lit)
const AU = gp(IN, TW, Z), AV = gp(IN, IN, Z);
for (const [x, y] of cells([T, Rr, Bm, L])) {
  const [u, v] = uvAt(x, y, Z);
  let ch;
  if (u > IN || v > IN || u < TW || v < TW) {                     // the wall-walk, flagged coping with joints across it
    const along = (u < TW || u > IN) ? v : u;
    ch = (Math.floor(along * 32) % 7 === 0) ? 'O' : 'o';
  } else {
    const u0 = u + S0, v0 = v + S0;
    if (u0 <= IN && v0 <= IN) {
      const n = vnoise(x, y, 7, 3); ch = n < 0.33 ? 'Y' : n > 0.72 ? 'j' : 'y';
      const ex = (x - DUM[0]) / 17, ey = (y - DUM[1] + 1) / 8.5, e = ex * ex + ey * ey; if (e < 1) ch = e > 0.82 ? 'Y' : 'j';
      const shade = IN - u0 < 0.32 || v0 < TW + S0 + 0.22;         // shadow of the back-left and front-left walls
      if (shade) ch = ch === 'j' ? 'y' : n < 0.4 ? 'J' : 'Y';
      if (IN - u0 < 0.06 || IN - v0 < 0.06 || v0 < TW + S0 + 0.04 || u0 < TW + S0 + 0.04) ch = 'J';   // wall feet
    } else {
      const zU = Z - 32 * (IN - u), zV = Z - 32 * (IN - v);
      if (zU >= zV) { const r = Math.floor(Z - zU); ch = r === 0 ? 'O' : r === 1 ? 'n' : r >= Z - 1 ? 'f' : inU(x - Math.floor(AU[0]), r - 2); }
      else { const r = Math.floor(Z - zV); ch = r === 0 ? 'o' : r === 1 ? 'm' : r >= Z - 1 ? 'c' : inV(x - Math.floor(AV[0]), r - 2); }
    }
  }
  g[y][x] = ch;
}
// the inner corner where the two back walls meet, in shade
{ const c = gp(IN, IN, Z); pixLine(g, Math.round(c[0]) - 1, Math.round(c[1]) + 1, Math.round(c[0]) - 1, Math.round(c[1]) + Z - 1, 'f'); }
// a worn track of cobbles and ruts from the gate to the hall door (clusters, not noise)
for (let i = 0; i < 22; i++) { const t = (i + 0.5) / 22; const p = lerp([118, 121], [90, 106], t); const x = Math.round(p[0]) + (i % 3) - 1, y = Math.round(p[1]) + (i % 2); if ('yYj'.includes(g[y][x]) && 'yYj'.includes(g[y][x + 1])) { g[y][x] = 'Y'; g[y][x + 1] = 'J'; } }

// ---- back parapets (their inner faces look at us): low wall + merlons, coping on top
const merlon = (a, per, w) => ((a % per) + per) % per < w;
inked(g, t => {
  wall(t, P(T, 0, -7), P(L, 0, -7), 7, (a, v) => (v < 3 && !merlon(a, 8, 5)) ? null : v === 0 || v === 3 && !merlon(a, 8, 5) ? 'O' : stone({ t: ['d', 'e', 'f'], m: 'n', ch: 3, bw: 6, s: 5 })(a, v));
  wall(t, P(T, 0, -7), P(Rr, 0, -7), 7, (a, v) => (v < 3 && !merlon(a, 8, 5)) ? null : v === 0 || v === 3 && !merlon(a, 8, 5) ? 'o' : stone({ t: ['a', 'b', 'c'], m: 'm', ch: 3, bw: 6, s: 6 })(a, v));
});

// ---- corner turrets: ashlar, coping, crenellated tops, arrow slits; pennants on the two side turrets
const TB = 0.7, TH = 22.4, TV = 11.2;
function turret(t, c, slitL, slitR) {
  const q = pixIsoBox(t, c[0], c[1], TB, TB, TZ, 1, {});
  wall(t, q.L, q.Bm, TZ, (a, v) => v === 0 ? 'o' : v === 1 ? 'm' : stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 7, s: 7, q: ['q', 'b'], qR: true, len: 22 })(a, v - 2));
  wall(t, q.Bm, q.Rr, TZ, (a, v) => v === 0 ? 'O' : v === 1 ? 'n' : stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 7, s: 8, q: ['Q', 'e'], qL: true, len: 22 })(a, v - 2));
  pixLine(t, q.Bm[0], q.Bm[1], q.Bm[0], q.Bm[1] + TZ - 1, 'n');
  for (const [x, y] of cells([q.T, q.Rr, q.Bm, q.L])) t[y][x] = y < q.T[1] + 5 ? 'f' : ((x + 2 * y) % 14 === 0 ? 'f' : 'e');
  // merlons: back pair first (inner faces), then the front pair
  wall(t, P(q.T, 0, -3), P(q.L, 0, -3), 3, (a, v) => merlon(a, 9, 4) || a <= -20 ? (v === 0 ? 'O' : 'e') : null);
  wall(t, P(q.T, 0, -3), P(q.Rr, 0, -3), 3, (a, v) => merlon(a, 9, 4) || a >= 19 ? (v === 0 ? 'o' : 'b') : null);
  wall(t, P(q.L, 0, -3), P(q.Bm, 0, -3), 3, (a, v) => merlon(a, 9, 4) || a >= 19 ? (v === 0 ? 'o' : 'b') : null);
  wall(t, P(q.Bm, 0, -3), P(q.Rr, 0, -3), 3, (a, v) => merlon(a, 9, 4) || a >= 19 ? (v === 0 ? 'O' : 'e') : null);
  const slit = (A, B, sill) => wall(t, A, B, TZ, (a, v) => a >= 10 && a <= 11 && v >= 4 && v <= 8 ? 'z' : a >= 9 && a <= 12 && v === 9 ? sill : null);
  if (slitL) slit(q.L, q.Bm, 'q'); if (slitR) slit(q.Bm, q.Rr, 'o');
  return q;
}
const tBack = [T[0], T[1] + 2 * TV], tLeft = [L[0] + TH, L[1] + TV], tRight = [Rr[0] - TH, Rr[1] + TV], tFront = Bm;
inked(g, t => turret(t, tBack, true, true));

// ---- weapon rack on the yard floor against the back-right wall (behind the hall, so painted first): spears with steel heads, team shields hung on the rail.
// The spear shafts and heads carry their own edge (no ink halo), so the wall stays visible between them behind the rack.
inked(g, t => {
  const p0 = gp(2.45, 2.68), p1 = gp(1.45, 2.68);
  for (let i = 0; i < 7; i++) { const p = lerp(p0, p1, (i + 0.5) / 7); const x = Math.round(p[0]), y = Math.round(p[1]); pixLine(t, x, y, x + 1, y - 13, 'w'); pixSet(t, x + 1, y - 14, 'S'); pixSet(t, x + 1, y - 15, 's'); pixSet(t, x + 2, y - 14, 'G'); }
  for (const k of [0, 1]) { const p = k ? p1 : p0; pixLine(t, Math.round(p[0]), Math.round(p[1]), Math.round(p[0]), Math.round(p[1]) - 9, 't'); }
  pixLine(t, p0[0], p0[1] - 8, p1[0], p1[1] - 8, 't'); pixLine(t, p0[0], p0[1] - 3, p1[0], p1[1] - 3, 'u');
  for (const k of [0.3, 0.72]) { const p = lerp(p0, p1, k); stampL(t, p[0] - 3, p[1] - 9, `
.DDD.
DTTLD
DTLTD
DTTTD
.DDD.
`); }
}, 'k', 'K', 'wsSG');
// ---- the sleeping hall on the yard floor along the back-left wall: plank walls, team door + shutters, red tile gable
// roof. It stands on the ground (u 1.78..2.58, v 0.79..2.25), so it rises inside the walls and stops short of the back turret.
{
  const HZ = 14, hb = gp(1.78, 0.79);
  inked(g, t => {
    const q = pixIsoBox(t, hb[0], hb[1], 0.8, 1.46, HZ, 1, {});
    const m1 = lerp(q.L, q.Bm, 0.5), m2 = lerp(q.T, q.Rr, 0.5), r1 = P(m1, 0, -10), r2 = P(m2, 0, -10);
    wall(t, q.L, q.Bm, HZ, (a, v) => v < 2 ? 't' : v === HZ - 1 ? 'u' : planks({ t: ['W', 'w', 't'], ph: 3, s: 9, nail: 'u' })(a, v));
    wall(t, q.Bm, q.Rr, HZ, (a, v) => v < 2 ? 'u' : v === HZ - 1 ? 'z' : planks({ t: ['w', 't', 'u'], ph: 3, s: 10 })(a, v));
    for (const k of [0, 1 / 3, 2 / 3]) { const p = lerp(q.Bm, q.Rr, k); pixLine(t, Math.round(p[0]), Math.round(p[1]) + 2, Math.round(p[0]), Math.round(p[1]) + HZ - 1, 'u'); }
    // door (team planks) and two shuttered windows on the long face
    wall(t, q.Bm, q.Rr, HZ, (a, v) => {
      if (a >= 20 && a <= 26 && v >= 4 && v <= HZ - 1) return v === 4 ? 'u' : a === 20 ? 'z' : a === 26 ? 'D' : (a - 21) % 2 ? 'T' : (v === 7 || v === 11 ? 'G' : 'L');
      for (const w0 of [5, 34]) if (a >= w0 && a <= w0 + 7 && v >= 4 && v <= 8) return v === 8 ? 'W' : (a === w0 || a === w0 + 7) ? 'T' : (a === w0 + 1 || a === w0 + 6) ? 'D' : v === 4 ? 'u' : 'z';
      return null;
    });
    // gable end over the lit wall (vertical boards), then the two roof planes
    for (const [x, y] of cells([q.L, q.Bm, r1])) t[y][x] = (x % 3 === 0) ? 'w' : 'W';
    plane(t, [q.L, q.T, r2, r1], q.L, q.T, tiles({ t: ['r', 'R', 'x'], ch: 3, tw: 4, s: 11 }));
    plane(t, [r1, r2, P(q.Rr, 1, 1), P(q.Bm, 0, 1)], P(q.Bm, 0, 1), P(q.Rr, 1, 1), tiles({ t: ['R', 'x', 'X', 'r'], ch: 3, tw: 4, s: 12 }));
    pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); pixLine(t, r1[0], r1[1] - 1, r2[0], r2[1] - 1, 'r');
    pixLine(t, q.L[0], q.L[1], r1[0], r1[1], 'k'); pixLine(t, q.Bm[0], q.Bm[1] + 1, r1[0], r1[1], 'k');
    pixLine(t, q.Bm[0], q.Bm[1] + 1, q.Rr[0] + 1, q.Rr[1] + 1, 'X');
  });
}

// ---- the side turrets (with pennant faces) and the front merlons
inked(g, t => turret(t, tLeft, false, true));
inked(g, t => turret(t, tRight, true, false));
inked(g, t => {
  wall(t, P(L, 0, -4), P(Bm, 0, -4), 4, (a, v) => a > 22 && a < 74 && merlon(a, 8, 4) ? (v === 0 ? 'o' : stone({ t: ['a', 'b', 'c'], m: 'm', ch: 4, bw: 4, s: 13 })(a, v)) : null);
  wall(t, P(Bm, 0, -4), P(Rr, 0, -4), 4, (a, v) => a > 22 && a < 74 && merlon(a, 8, 4) ? (v === 0 ? 'O' : stone({ t: ['d', 'e', 'f'], m: 'n', ch: 4, bw: 4, s: 14 })(a, v)) : null);
});
inked(g, t => turret(t, tFront, true, true));

// ---- the gate on the right wall: voussoir arch, recess, iron-banded team doors standing open on a dark passage
wall(g, Bm, Rr, Z, (a, v) => {
  const ac = 43, dx = a - ac, hw = 7.5; if (Math.abs(dx) > hw + 2) return null;
  const arch = 6 + Math.round(hw - Math.sqrt(Math.max(0, hw * hw - dx * dx))) * 0.6;
  if (v < arch - 2) return null;
  if (Math.abs(dx) > hw) return v < arch ? null : (v === Z - 1 ? 'P' : Math.abs(dx) > hw + 1 ? 'Q' : 'f');   // jambs
  if (v < arch) return (a % 3 === 0) ? 'n' : 'Q';                                                             // voussoirs
  if (v === Z - 1) return 'O';                                                                                 // threshold
  if (v === Math.ceil(arch) || Math.abs(dx) > hw - 1) return 'z';                                              // recess depth
  if (dx >= -1 && dx <= 1) return 'z';                                                                         // passage
  const leaf = dx < 0 ? dx + 7 : 7 - dx;                                                                        // 1..6 across a leaf
  if (v === 10 || v === 15) return 'G';
  return leaf === 1 ? 'D' : leaf % 2 ? 'T' : (dx < 0 ? 'L' : 'T');
});

// ---- animated: banners (ripple) and the dummy (wobble)
function banner(t, A, B, a0, wdt, v0, len, f, emblem) {
  wall(t, A, B, Z + 40, (a, v) => {
    const i = a - a0; if (i < -1 || i > wdt) return null;
    if (v === v0) return i === -1 || i === wdt ? 'h' : 't';                                // rod with gilt ends
    if (i < 0 || i >= wdt) return null;
    const notch = Math.abs(i - (wdt - 1) / 2), wave = ((i + f) % 4 < 2) ? 0 : 1;
    const end = v0 + len - Math.round(notch < 1.5 ? 2 : 0) + wave;
    if (v <= v0 || v > end) return null;
    if (v === end) return 'D';
    const fold = (i + f) % 4;                                                                // folds travel along the cloth
    if (emblem && v >= v0 + 3 && v <= v0 + 8) { const ex = i - Math.floor(wdt / 2), ey = v - v0 - 3; if ((ex === ey - 2 || ex === 2 - ey) || (ey === 3 && Math.abs(ex) <= 2)) return 'L'; }
    if (i === 0) return 'L'; if (i === wdt - 1) return 'D';
    return fold === 0 ? 'L' : fold === 2 ? 'D' : 'T';
  });
}
function dummy(t, f) {
  const [x, y] = DUM, s = [0, 1, 0, -1][f];
  stampL(t, x - 3, y - 6, `
..ut..
..tu..
..tu..
.ut.u.
ut...t
`);
  stampL(t, x - 5 + s, y - 20, `
...GSSG...
..GSssSG..
..GGGGGG..
...hHhi...
...hhHi...
uwwTTLDwwu
h..TLTD..h
...TLTD...
...TTTD...
...hTDi...
....hi....
`);
  pixSet(t, x + s, y - 9, 't');
}
const frames = [];
for (let f = 0; f < 4; f++) {
  const q = copy(g);
  inked(q, t => banner(t, L, Bm, 39, 15, 2, 17, f, true));
  inked(q, t => banner(t, pixIsoBox(t, tLeft[0], tLeft[1], TB, TB, TZ, 1, {}).L, pixIsoBox(t, tLeft[0], tLeft[1], TB, TB, TZ, 1, {}).Bm, 8, 7, 1, 10, f + 1, false));
  inked(q, t => banner(t, pixIsoBox(t, tRight[0], tRight[1], TB, TB, TZ, 1, {}).Bm, pixIsoBox(t, tRight[0], tRight[1], TB, TB, TZ, 1, {}).Rr, 7, 7, 1, 10, f + 2, false));
  inked(q, t => dummy(t, f));
  outline(q, 'k', 'K');
  frames.push(pixText(q));
}

export default {
  id: 'barracks', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f', K: '#4a3520',                                                  // ink (lit side softer)
    a: '#c8bca6', b: '#b3a692', c: '#9a8b78', m: '#7a6d60',                      // ashlar, lit face + mortar
    d: '#8d8478', e: '#7d7468', f: '#6a6258', n: '#4f4840',                      // ashlar, shade face + mortar
    q: '#ddd2bc', Q: '#a39b8e', p: '#857868', P: '#5a524a', o: '#d6cbb5', O: '#a89e90', // quoins, plinth, coping
    y: '#a0824f', Y: '#8a6d3e', j: '#b8955a', J: '#6f5730',                      // packed earth
    t: '#5a3a18', w: '#8a6a3a', W: '#a07a4a', u: '#3b2614', z: '#1e1610',        // timber, recess
    r: '#d0603a', R: '#a0482e', x: '#7e3424', X: '#5a2418',                      // roof tiles
    h: '#e6c272', H: '#d8ab4f', i: '#a87a32',                                    // straw / gilt
    s: '#e6eaee', S: '#9aa0a6', G: '#5f656c',                                    // steel / iron
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
