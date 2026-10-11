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

// ---- yard: packed earth in soft patches, a coping walkway along the front walls, contact shade at the back
const fy = x => x <= Bm[0] ? L[1] + (x + 0.5 - L[0]) / 2 : Bm[1] - (x + 0.5 - Bm[0]) / 2;
const byk = x => x <= T[0] ? L[1] - (x + 0.5 - L[0]) / 2 : T[1] + (x + 0.5 - T[0]) / 2;
const DUM = [104, 96];                                            // training dummy foot
for (const [x, y] of cells([T, Rr, Bm, L])) {
  const df = fy(x) - (y + 0.5), db = y + 0.5 - byk(x);
  let ch;
  if (df < 4) ch = (((x + (df < 2 ? 0 : 3)) % 6) === 0) ? 'O' : df < 1 ? 'O' : 'o';
  else if (df < 5) ch = 'J';
  else if (db < 1.5) ch = 'J';
  else { const n = vnoise(x, y, 7, 3); ch = n < 0.33 ? 'Y' : n > 0.72 ? 'j' : 'y';
    const ex = (x - DUM[0]) / 17, ey = (y - DUM[1] + 1) / 8.5, e = ex * ex + ey * ey; if (e < 1) ch = e > 0.82 ? 'Y' : 'j'; }
  g[y][x] = ch;
}
// a few cobbles and ruts from the gate to the hall door (clusters, not noise)
for (let i = 0; i < 26; i++) { const t = (i + 0.5) / 26; const p = lerp([140, 108], [92, 90], t); const x = Math.round(p[0]) + (i % 3) - 1, y = Math.round(p[1]) + (i % 2); if (g[y][x] === 'y' || g[y][x] === 'Y' || g[y][x] === 'j') { g[y][x] = 'Y'; g[y][x + 1] = 'J'; } }
for (const [x, y] of [[60, 104], [128, 76], [150, 92], [80, 116], [118, 118], [70, 84]]) { g[y][x] = 'c'; g[y][x + 1] = 'b'; g[y + 1][x] = 'f'; g[y + 1][x + 1] = 'f'; }

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

// ---- the sleeping hall along the back-left wall: plank walls, team door + shutters, red tile gable roof
{
  const hb = [66.4, 94.8];
  inked(g, t => {
    const q = pixIsoBox(t, hb[0], hb[1], 0.8, 2.0, 11, 1, {});
    const m1 = lerp(q.L, q.Bm, 0.5), m2 = lerp(q.T, q.Rr, 0.5), r1 = P(m1, 0, -10), r2 = P(m2, 0, -10);
    wall(t, q.L, q.Bm, 11, (a, v) => v < 2 ? 't' : planks({ t: ['W', 'w', 't'], ph: 3, s: 9, nail: 'u' })(a, v));
    wall(t, q.Bm, q.Rr, 11, (a, v) => v < 2 ? 'u' : planks({ t: ['w', 't', 'u'], ph: 3, s: 10 })(a, v));
    for (const k of [0, 0.25, 0.5, 0.75]) { const p = lerp(q.Bm, q.Rr, k); pixLine(t, Math.round(p[0]), Math.round(p[1]) + 2, Math.round(p[0]), Math.round(p[1]) + 10, 'u'); }
    // door (team planks) and two shuttered windows on the long face
    wall(t, q.Bm, q.Rr, 11, (a, v) => {
      if (a >= 29 && a <= 35 && v >= 2 && v <= 10) return v === 2 ? 'u' : a === 29 ? 'z' : a === 35 ? 'D' : (a - 30) % 2 ? 'T' : (v === 5 || v === 8 ? 'G' : 'L');
      for (const w0 of [10, 48]) if (a >= w0 && a <= w0 + 7 && v >= 3 && v <= 7) return v === 7 ? 'W' : (a === w0 || a === w0 + 7) ? 'T' : (a === w0 + 1 || a === w0 + 6) ? 'D' : v === 3 ? 'u' : 'z';
      return null;
    });
    // gable end over the lit wall (vertical boards), then the two roof planes
    pixPoly(t, [q.L, q.Bm, r1], 'W'); for (const [x, y] of cells([q.L, q.Bm, r1])) t[y][x] = (x % 3 === 0) ? 'w' : 'W';
    plane(t, [q.L, q.T, r2, r1], q.L, q.T, tiles({ t: ['r', 'R', 'x'], ch: 3, tw: 4, s: 11 }));
    plane(t, [r1, r2, P(q.Rr, 1, 1), P(q.Bm, 0, 1)], P(q.Bm, 0, 1), P(q.Rr, 1, 1), tiles({ t: ['R', 'x', 'X', 'r'], ch: 3, tw: 4, s: 12 }));
    pixLine(t, r1[0], r1[1], r2[0], r2[1], 'k'); pixLine(t, r1[0], r1[1] - 1, r2[0], r2[1] - 1, 'r');
    pixLine(t, q.L[0], q.L[1], r1[0], r1[1], 'k'); pixLine(t, q.Bm[0], q.Bm[1] + 1, r1[0], r1[1], 'k');
    pixLine(t, q.Bm[0], q.Bm[1] + 1, q.Rr[0] + 1, q.Rr[1] + 1, 'X');
  });
}

// ---- weapon rack along the back-right parapet: spears with steel heads, team shields hung on the rail.
// The spear shafts and heads carry their own edge (no ink halo), so the parapet stays visible between them behind the rack.
inked(g, t => {
  const p0 = [128, 61], p1 = [158, 76];
  for (let i = 0; i < 7; i++) { const p = lerp(p0, p1, (i + 0.5) / 7); const x = Math.round(p[0]), y = Math.round(p[1]); pixLine(t, x, y, x + 1, y - 13, 'w'); pixSet(t, x + 1, y - 14, 'S'); pixSet(t, x + 1, y - 15, 's'); pixSet(t, x + 2, y - 14, 'G'); }
  for (const k of [0, 1]) { const p = k ? p1 : p0; pixLine(t, p[0], p[1], p[0], p[1] - 9, 't'); }
  pixLine(t, p0[0], p0[1] - 8, p1[0], p1[1] - 8, 't'); pixLine(t, p0[0], p0[1] - 3, p1[0], p1[1] - 3, 'u');
  for (const k of [0.3, 0.72]) { const p = lerp(p0, p1, k); stampL(t, p[0] - 3, p[1] - 9, `
.DDD.
DTTLD
DTLTD
DTTTD
.DDD.
`); }
}, 'k', 'K', 'wsSG');
// barrels and a chest by the hall door
inked(g, t => {
  stampL(t, 52, 94, `
.uwwu..
uWwwwu.
GGGGGG.
uWwwwu.
uWwwwu.
GGGGGG.
.uwwu..
`);
  stampL(t, 58, 98, `
.uwwu.
uWwwwu
GGGGGG
uWwwwu
.uwwu.
`);
});

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
