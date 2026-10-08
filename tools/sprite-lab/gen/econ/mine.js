// ==head
// @pixel mine
// Mining camp (2×2): a coursed-stone ore store with a board roof and a team-colour door along the back, a timber-cribbed shaft
// with a headframe, pulley and bucket on the front-left tile, rails with an ore cart full of gold, gold and stone heaps.
// idle ×4: the pulley turns (spokes advance 45°), the bucket rides 1 px on its rope, glints twinkle across the gold.
// Drawn by drafts/building.mine.js: pixDraw(PIXELS.mine,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ==end
const W = 2, H = 2, Z = 12, ROOF = 14;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 14;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const rnd = mulberry(17);

// ---- ground: gravel and spoil in 2×2 clusters, a trodden darker band where the cart runs
const GROUND = 'efEFh';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => { const h = hash(x >> 1, y >> 1, 5), c = t * 2; if (Math.abs(c - 1.55) < 0.16 && s > 0.45) return h < 0.5 ? 'f' : 'e'; return h < 0.16 ? 'f' : h < 0.3 ? 'E' : h < 0.36 ? 'h' : 'e'; });

// ---- ore store on the back strip: stone courses, plinth, quoins, a timber-framed doorway with a team door
const A0 = 0.05, A1 = 1.95, C0 = 0.05, C1 = 0.86;
const litStone = blocks(['P', 'p', 'q', 'p', 'Q'], 'j', 4, 8, 1), shStone = blocks(['q', 'Q', 'U', 'Q', 'V'], 'J', 4, 8, 2);
wallC(g, C1, A0, A1, 0, Z, (U, V) => (V < 2 ? (Math.floor(U) % 6 === 0 ? 'j' : 'Q') : litStone(U, V - 2)));
wallA(g, A1, C1, C0, 0, Z, (U, V) => (V < 2 ? (Math.floor(U) % 6 === 0 ? 'J' : 'V') : shStone(U, V - 2)));
{ const p = iso(A1, C1, 0); for (let z = 2; z < Z; z++) { const row = Math.floor((z - 2) / 4), r = (z - 2) % 4; const len = row % 2 ? 2 : 4; for (let i = 0; i < len; i++) pixSet(g, p[0] - 1 - i, p[1] - z + Math.floor((i + 1) / 2), r === 0 ? 'j' : r === 3 ? 'P' : 'p'); pixSet(g, p[0], p[1] - z, r === 0 ? 'J' : 'q'); } }
// doorway: dark recess, timber jambs and lintel, a team-colour plank door standing open against the wall
{ const da = 1.04, dw = 0.36, dh = 10;
  wallC(g, C1, da, da + dw, 0, dh, (U, V) => { const u = Math.floor(U); if (V >= dh - 2) return V >= dh - 1 ? 'w' : 'v'; if (u < 1) return 'w'; if (u >= 10) return 'v'; return V < 1 ? 'i' : (u < 3 ? 'K' : 'i'); });
  wallC(g, C1 + 0.02, da - 0.24, da, 0, dh - 2, (U, V) => { const u = Math.floor(U); if (u === 0) return 'D'; if (Math.floor(V) === 2 || Math.floor(V) === 6) return 'k'; return u % 3 === 0 ? 'D' : u > 5 ? 'T' : 'L'; });
  // a lantern hook glinting by the door
  const l = iso(da + dw + 0.06, C1, 8); pixSet(g, l[0], l[1], 'Y'); pixSet(g, l[0], l[1] + 1, 'y'); }
// gable roof of weathered boards, ridge along a; eave shadow under the front
const RA0 = -0.02, RA1 = 2.0, RC0 = 0.0, RC1 = 0.98, RR = 0.48;
wallC(g, C1, A0, A1, Z - 2, Z, () => 'k');
{ const o = iso(RA0, RC0, Z), u = sub2(iso(RA1, RC0, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o); face(g, o, u, v, (s) => (Math.floor(s * u[0]) % 4 === 0 ? 'c' : 'a')); }
{ const pA = iso(RA1, RC1, Z), pB = iso(RA1, RC0, Z), pC = iso(RA1, RR, Z + ROOF); poly(g, [pA, pB, pC], (x, y) => ((x - pA[0]) % 4 === 1 ? 'c' : y > pA[1] - 2 ? 'c' : 'a')); }
{ const o = iso(RA0, RC1, Z), u = sub2(iso(RA1, RC1, Z), o), v = sub2(iso(RA0, RR, Z + ROOF), o);
  face(g, o, u, v, (s, t, x, y) => {
    const U = s * u[0], b = Math.floor(U / 4), cu = U - b * 4, h = hash(b, 0, 3);
    if (cu < 1) return 'c';                                     // gap between boards
    if (t > 0.3 && t < 0.38) return 'c';                        // batten shadow
    if (t >= 0.38 && t < 0.46) return 'A';                      // batten lit
    if (cu < 2) return t > 0.85 ? 'A' : 'B';                     // lit board edge
    return h < 0.25 ? 'b' : (s > 0.7 ? 'b' : 'B');
  }); }
line(g, iso(RA0, RR, Z + ROOF), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0, RC1, Z), iso(RA1, RC1, Z), 'k');
line(g, iso(RA1, RC1, Z), iso(RA1, RR, Z + ROOF), 'k'); line(g, iso(RA1, RC0, Z), iso(RA1, RR, Z + ROOF), 'k');
line(g, iso(RA0, RC0, Z), iso(RA1, RC0, Z), 'k');

// ---- heaps by the store: gold ore and quarried stone
heap(g, ...iso(1.62, 1.14, 0), 9, 6, ['Y', 'y', 'z', 'Z'], 3);
heap(g, ...iso(1.9, 1.32, 0), 7, 5, ['P', 'p', 'Q', 'V'], 4, 3);
heap(g, ...iso(1.42, 1.0, 0), 5, 4, ['P', 'p', 'Q', 'V'], 6, 3);

// ---- the shaft: timber cribbing, inner walls going down into the dark
const S0 = 0.16, S1 = 0.86, T0 = 1.14, T1 = 1.84;
flat(g, S0, S1, T0, T1, 0, () => 'K');
wallC(g, T0, S0, S1, -9, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? (Math.floor(U) % 5 === 0 ? 'v' : 'w') : V > -6 ? (hash(x >> 1, y, 1) < 0.4 ? 'U' : 'Q') : 'V') : null));
wallA(g, S0, T1, T0, -9, 0, (U, V, x, y) => (pixGet(g, x, y) === 'K' ? (V > -3 ? 'v' : V > -6 ? 'V' : 'J') : null));
// cribbing: a plank collar on the back rims, raised log faces on the front rims
line(g, iso(S0, T0, 0), iso(S1, T0, 0), 'w'); line(g, iso(S0, T0, 1), iso(S1, T0, 1), 'W');
line(g, iso(S0, T0, 0), iso(S0, T1, 0), 'W'); line(g, iso(S0, T0, 1), iso(S0, T1, 1), 'w');
wallC(g, T1, S0, S1 + 0.04, 0, 3, (U, V) => (Math.floor(U) % 11 === 0 ? 'V' : V >= 2 ? 'w' : V >= 1 ? 'W' : 'v'));
wallA(g, S1 + 0.04, T1, T0, 0, 3, (U, V) => (Math.floor(U) % 11 === 0 ? 'V' : V >= 2 ? 'W' : 'v'));

// ---- rails from the shaft to the front-right, sleepers, the ore cart
for (let a = 0.92; a < 1.96; a += 0.11) line(g, iso(a, 1.43, 0), iso(a, 1.69, 0), 'v');
line(g, iso(0.9, 1.47, 0), iso(1.96, 1.47, 0), 'n'); line(g, iso(0.9, 1.47, 1), iso(1.96, 1.47, 1), 'M');
line(g, iso(0.9, 1.65, 0), iso(1.96, 1.65, 0), 'n'); line(g, iso(0.9, 1.65, 1), iso(1.96, 1.65, 1), 'M');
{ const ca0 = 1.32, ca1 = 1.72, cc0 = 1.42, cc1 = 1.7, cz0 = 3, cz1 = 10;
  // wheels behind (far side) first
  for (const a of [ca0 + 0.08, ca1 - 0.08]) { const p = iso(a, cc0, 3); disc(g, Math.round(p[0]), Math.round(p[1]), 2, (dx, dy, ring) => (ring ? 'k' : 'n')); }
  heap(g, ...iso((ca0 + ca1) / 2, (cc0 + cc1) / 2, cz1 - 1), 9, 4, ['Y', 'y', 'z', 'Z'], 9);
  wallC(g, cc1, ca0, ca1, cz0, cz1, (U, V) => { const u = Math.floor(U); if (u < 1 || u >= 12) return 'v'; if (V >= cz1 - cz0 - 1) return 'n'; if (V < 1) return 'n'; return Math.floor(V) % 3 === 0 ? 'W' : 'w'; });
  wallA(g, ca1, cc1, cc0, cz0, cz1, (U, V) => { if (V >= cz1 - cz0 - 1 || V < 1) return 'n'; return Math.floor(V) % 3 === 0 ? 'v' : 'W'; });
  for (const a of [ca0 + 0.08, ca1 - 0.08]) { const p = iso(a, cc1, 3); disc(g, Math.round(p[0]), Math.round(p[1]), 3, (dx, dy, ring) => (ring ? 'k' : (dx === 0 && dy === 0) ? 'M' : dx + dy < 0 ? 'M' : 'n')); }
}
// a pick and a shovel leaning on the store wall, a crate of tools
{ const p = iso(1.66, C1, 0); line(g, [p[0] - 2, p[1]], [p[0] + 2, p[1] - 11], 'w'); line(g, [p[0] - 1, p[1]], [p[0] + 3, p[1] - 11], 'v');
  pixStamp(g, p[0] - 1, p[1] - 14, `
kkkkkkk
kmMMMnk
.kk.kk.
`); }

// ---- headframe over the shaft: two posts with braces, a crossbeam, the team banner
const HZ = 30, HL = 0.08, HR = 0.94, HC = 1.5;
const post = (gr, a) => { const p = iso(a, HC, 0); for (let z = 0; z <= HZ; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } };
post(g, HL);
{ const p = iso(HL, HC, 0); line(g, [p[0] - 5, p[1] + 2], [p[0], p[1] - 12], 'v'); }
const beamL = iso(HL, HC, HZ), beamR = iso(HR, HC, HZ);
// rope from the pulley into the shaft; drawn per frame with the bucket
const pul = iso((HL + HR) / 2, HC, HZ + 2);
function animated(fr, f) {
  // pulley wheel (radius 4) with 4 spokes advancing 45° per frame
  disc(fr, Math.round(pul[0]), Math.round(pul[1]), 4, (dx, dy, ring) => (ring ? 'k' : 'v'));
  disc(fr, Math.round(pul[0]), Math.round(pul[1]), 3, (dx, dy, ring) => (ring ? 'w' : null));
  for (let j = 0; j < 2; j++) { const an = f * Math.PI / 4 + j * Math.PI / 2; line(fr, [pul[0] - Math.cos(an) * 2.6, pul[1] - Math.sin(an) * 2.6], [pul[0] + Math.cos(an) * 2.6, pul[1] + Math.sin(an) * 2.6], 'W'); }
  pixSet(fr, pul[0], pul[1], 'M');
  // crossbeam drawn over the axle
  line(fr, beamL, beamR, 'w'); line(fr, [beamL[0], beamL[1] + 1], [beamR[0], beamR[1] + 1], 'v'); line(fr, [beamL[0], beamL[1] - 1], [beamR[0], beamR[1] - 1], 'k');
  // rope + bucket bobbing
  const bob = [0, 1, 2, 1][f], rx = Math.round(pul[0]) - 3, top = Math.round(pul[1]), bot = top + 22 + bob;
  for (let y = top; y < bot; y++) pixSet(fr, rx, y, 'R');
  pixStamp(fr, rx - 3, bot, `
.kkkkk.
kwwwWvk
kWyYyvk
.kvvvk.
`);
  // glints: one twinkle star per frame on the gold (heap and cart)
  const gl = [iso(1.58, 1.1, 5), iso(1.5, 1.52, 13), iso(1.7, 1.18, 2), iso(1.42, 1.6, 12)][f];
  const [gx, gy] = [Math.round(gl[0]), Math.round(gl[1])];
  pixSet(fr, gx, gy, 'G'); pixSet(fr, gx - 1, gy, 'Y'); pixSet(fr, gx + 1, gy, 'Y'); pixSet(fr, gx, gy - 1, 'Y'); pixSet(fr, gx, gy + 1, 'Y');
  const g2 = [iso(1.66, 1.06, 3), iso(1.56, 1.12, 6), iso(1.46, 1.55, 12), iso(1.6, 1.58, 11)][(f + 2) % 4]; pixSet(fr, g2[0], g2[1], 'G');
}
function front(fr) {
  post(fr, HR);
  const p = iso(HR, HC, 0); line(fr, [p[0] + 6, p[1] - 2], [p[0] + 1, p[1] - 13], 'v');
  // team banner hanging off the right post, below the beam
  const b = iso(HR, HC, HZ - 2); pixStamp(fr, b[0] + 2, b[1], `
kkkkkkk
kLLTTTk
kLTTTTk
kLTTTDk
kLTTTDk
kLTTTDk
kTTTTDk
.kTDDk.
..kDk..
`);
}
const inkOf = ch => (GROUND.includes(ch) ? 'X' : 'k');
const frames = [];
for (let f = 0; f < 4; f++) { const fr = clone(g); animated(fr, f); front(fr); outline(fr, inkOf); frames.push(pixText(fr)); }

export default {
  id: 'mine', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8a7a62', E: '#9c8c72', f: '#76684f', F: '#6a5d48', h: '#a8a090', X: '#3e352a',          // gravel, spoil, rim
    P: '#b8b0a2', p: '#9a9285', q: '#8d8478', Q: '#6f6a60', U: '#625d55', V: '#4f4a44', j: '#575249', J: '#3c3833', // stone
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', K: '#1c1612', i: '#2a221b',                         // timber, shaft dark, doorway
    A: '#9e8a6c', B: '#857258', b: '#715f48', a: '#5e4e3b', c: '#3e3226',                         // weathered boards
    Y: '#ffe28a', y: '#e1b12c', z: '#a87a12', Z: '#6e4d0a', G: '#fffbe8',                         // gold + glint
    m: '#e6eaee', M: '#9aa0a6', n: '#5f656c', R: '#c9b58e', k: '#24180f',                         // iron, rope, ink
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
