// ==head
// @pixel market
// Market (3×3): a cobbled courtyard on a low stone kerb, four stalls on timber posts under pitched awnings striped in team
// colour and cream with scalloped hems, counters of goods (terracotta pots, bolts of cloth, fruit baskets, grain sacks), a
// well in the middle, crates and barrels, a pennant pole at the left corner. The code flag flies from the right corner (clear of the awnings).
// idle ×4: the awning hems flutter and the pennant waves.
// Drawn by drafts/building.market.js: pixDraw(PIXELS.market,'idle',b.built?Math.floor(G.time*4):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ==end
const W = 3, H = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 44;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 96;
const g = pixGrid(GW, GH);
const KZ = 3;                                             // kerb height

// ---- courtyard: stone kerb faces, cobbled setts on top in staggered rows with mortar
wallC(g, 3, 0, 3, 0, KZ, (U, V) => (Math.floor(U) % 9 === 0 ? 'j' : V >= 2 ? 'P' : 'p'));
wallA(g, 3, 3, 0, 0, KZ, (U, V) => (Math.floor(U) % 9 === 0 ? 'J' : V >= 2 ? 'Q' : 'U'));
flat(g, 0, 3, 0, 3, KZ, (s, t, x, y) => {
  const a = s * 3 / 0.16, c = t * 3 / 0.13, row = Math.floor(c), col = Math.floor(a + (row % 2) * 0.5), fa = a + (row % 2) * 0.5 - col, fc = c - row;
  if (fc < 0.2 || fa < 0.14) return 'j';
  const h = hash(col, row, 3); return h < 0.3 ? 'q' : h < 0.75 ? 'p' : 'P';
});

// ---- props
const pot = (gr, x, y) => pixStamp(gr, x, y, `
.kkk.
kOook
kOoik
kooik
.kkk.
`);
const goods = {
  pots: (gr, x, y) => { pixStamp(gr, x, y - 3, `
..kkk....kkk..
.kOook..kOook.
.kOooik.kOooik
.kooiik.kooiik
..kkkk...kkkk.
`); pot(gr, x + 5, y + 1); },
  cloth: (gr, x, y) => pixStamp(gr, x, y - 3, `
kkkkkkk.......
kRRRRrk.kkkkk.
krrrrrkkbBBbbk
.kkkkkkkbbbbak
..kkkkkk.kkkk.
..kxXxxNk.....
..kNNNNNk.....
..kkkkkkk.....
`),
  fruit: (gr, x, y) => pixStamp(gr, x, y - 3, `
..k.k.k...kk..
.kFfkFfk.kAek.
.kffkffk.keeek
kwwwwwwvkkeek.
kWWWWWWvkwwwvk
.kkkkkkk.kkkk.
`),
  sacks: (gr, x, y) => pixStamp(gr, x, y - 4, `
...k......k...
..kvk....kvk..
.kSssk..kSssk.
kSSsssk.kSsssk
kSsssmk.ksssmk
ksssmmk.kssmmk
.kkkkk...kkkk.
`),
};
function crate(gr, a, c) { const p = iso(a, c, KZ); pixStamp(gr, Math.round(p[0]) - 4, Math.round(p[1]) - 8, `
..kkkkk..
.kwwwwwk.
kwwwwwwWk
kWkWWWvvk
kWWkWvvvk
kWWWkvvvk
kWWkWvvvk
.kkWvvvk.
...kkkk..
`); }
function barrel(gr, a, c) { const p = iso(a, c, KZ); pixStamp(gr, Math.round(p[0]) - 3, Math.round(p[1]) - 9, `
.kkkkk.
kWvvvWk
kwWWWvk
knnnnnk
kwWWWvk
kwWWWvk
knnnnnk
kwWWWvk
.kkkkk.
`); }

// ---- stalls
const PZ = 19;
const post = (gr, a, c, z0, z1) => { const p = iso(a, c, z0); for (let z = 0; z < z1 - z0; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } };
function stall(gr, s0, f) {
  const { a0, a1, c0, c1, kind } = s0;
  post(gr, a0, c0, KZ, PZ + 5); post(gr, a1, c0, KZ, PZ + 5);
  // front posts stand behind the counter, so they go down before it and the counter and its goods hide their feet
  const cm = c0 + (c1 - c0) * 0.5;
  post(gr, a0, cm, KZ, PZ); post(gr, a1, cm, KZ, PZ);
  // counter along the front edge, goods on it
  const ta0 = a0 + 0.08, ta1 = a1 - 0.08, tc0 = c1 - 0.32, tc1 = c1 - 0.06, TZ = KZ + 7;
  wallC(gr, tc1, ta0, ta1, KZ, TZ, (U, V) => { const u = Math.floor(U); if (V >= TZ - KZ - 1) return 'w'; return u % 8 === 0 ? 'v' : V < 1 ? 'v' : 'W'; });
  wallA(gr, ta1, tc1, tc0, KZ, TZ, (U, V) => (V >= TZ - KZ - 1 ? 'W' : 'v'));
  flat(gr, ta0, ta1, tc0, tc1, TZ, (s, t) => (t > 0.85 ? 'w' : Math.floor(s * 20) % 5 === 0 ? 'W' : 'u'));
  for (const fa of [0.27, 0.72]) { const m = iso(ta0 + (ta1 - ta0) * fa, (tc0 + tc1) / 2, TZ); goods[kind](gr, Math.round(m[0]) - 7, Math.round(m[1]) - 2); }
  // awning: back edge high, front edge low; stripes run front-to-back
  const o = iso(a0 - 0.04, c0 - 0.04, PZ + 5), u = sub2(iso(a1 + 0.04, c0 - 0.04, PZ + 5), o), v = sub2(iso(a0 - 0.04, cm + 0.06, PZ), o);
  const n = Math.max(6, Math.round((a1 - a0) * 8)) | 1;
  face(gr, o, u, v, (s, t) => { const st = Math.floor(s * n) % 2 === 0; if (st) return t < 0.12 ? 'D' : s * n % 1 < 0.2 ? 'L' : 'T'; return t < 0.12 ? 'C' : s * n % 1 < 0.2 ? 'c' : (s > 0.75 ? 'C' : 'c'); });
  // bargeboard along the front, ink edge
  line(gr, iso(a0 - 0.04, cm + 0.06, PZ), iso(a1 + 0.04, cm + 0.06, PZ), 'k');
  // scalloped hems on the front and right edges; they flutter by shifting the scallops
  const sh = [0, 1, 2, 1][f];
  wallC(gr, cm + 0.06, a0 - 0.04, a1 + 0.04, PZ - 4, PZ, (U, V) => { const u = Math.floor(U) + sh, k = Math.floor(Math.floor(U) / (32 * (a1 - a0 + 0.08)) * n); const team = k % 2 === 0; if (V >= 2) return team ? 'T' : 'c'; const sc = (u % 5); if (V >= 1) return sc < 4 ? (team ? 'D' : 'C') : null; return sc > 0 && sc < 3 ? (team ? 'D' : 'C') : null; });
  wallA(gr, a1 + 0.04, cm + 0.06, c0 - 0.04, PZ - 3 + 1, PZ + 5, (U, V) => (V >= 2 + U * 5 / ((cm - c0 + 0.1) * 32) ? null : ((Math.floor(U) + sh) % 5 < 3 ? 'D' : V >= 1 ? 'C' : null)));
}
const STALLS = [
  { a0: 0.2, a1: 1.2, c0: 0.2, c1: 1.15, kind: 'pots' },
  { a0: 1.85, a1: 2.8, c0: 0.2, c1: 1.1, kind: 'cloth' },
  { a0: 0.2, a1: 1.12, c0: 1.88, c1: 2.8, kind: 'fruit' },
  { a0: 1.9, a1: 2.8, c0: 1.9, c1: 2.8, kind: 'sacks' },
];

// ---- the well: stone ring, dark water, two posts, crossbar and bucket
function well(gr) {
  const c = iso(1.52, 1.52, KZ), cx = Math.round(c[0]), cy = Math.round(c[1]);
  for (let z = 0; z <= 6; z++) for (let dx = -8; dx <= 8; dx++) { const yy = Math.round(Math.sqrt(Math.max(0, 64 - dx * dx)) / 2); pixSet(gr, cx + dx, cy + yy - z, Math.abs(dx) >= 8 || z === 0 ? 'k' : z % 3 === 0 ? (dx > 3 ? 'J' : 'j') : dx < -3 ? 'P' : dx > 3 ? 'Q' : 'p'); }
  for (let dy = -4; dy <= 4; dy++) for (let dx = -8; dx <= 8; dx++) { const d = Math.hypot(dx, dy * 2); if (d > 8.3) continue; pixSet(gr, cx + dx, cy - 6 + dy, d > 7.2 ? 'k' : d > 5.5 ? (dx + dy < 0 ? 'P' : 'q') : d > 4.6 ? 'k' : 'z'); }
  pixSet(gr, cx - 2, cy - 7, 'Z'); pixSet(gr, cx - 1, cy - 7, 'Z');
  for (const dx of [-7, 6]) for (let z = 6; z < 20; z++) { pixSet(gr, cx + dx, cy - z, 'w'); pixSet(gr, cx + dx + 1, cy - z, 'v'); }
  line(gr, [cx - 7, cy - 19], [cx + 7, cy - 19], 'w'); line(gr, [cx - 7, cy - 20], [cx + 7, cy - 20], 'k');
  for (let y = cy - 18; y < cy - 12; y++) pixSet(gr, cx, y, 'R');
  pixStamp(gr, cx - 2, cy - 12, `
kkkkk
kwWvk
.kkk.
`);
}
// ---- pennant pole at the left corner
const pole = iso(0.12, 2.88, KZ);
function pennant(gr, f) {
  for (let z = 0; z < 40; z++) { pixSet(gr, pole[0], pole[1] - z, 'w'); pixSet(gr, pole[0] + 1, pole[1] - z, 'v'); }
  pixSet(gr, pole[0], pole[1] - 40, 'O'); pixSet(gr, pole[0] + 1, pole[1] - 40, 'o');
  const x0 = pole[0] + 2, y0 = pole[1] - 39, len = 14;
  for (let i = 0; i < len; i++) {
    const wave = Math.round(Math.sin((i / len) * Math.PI * 1.6 - f * Math.PI / 2) * 1.4 * (i / len)), hgt = Math.max(1, Math.round(6 * (1 - i / len)));
    const top = y0 + Math.round((6 - hgt) / 2) + wave;
    for (let k = 0; k < hgt; k++) pixSet(gr, x0 + i, top + k, k === 0 ? 'L' : k === hgt - 1 ? 'D' : 'T');
  }
}

const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = clone(g);
  // back to front: back stall, back-right stall, well, front-left, front-right, loose crates/barrels in depth order
  stall(fr, STALLS[0], f); stall(fr, STALLS[1], (f + 1) % 4);
  barrel(fr, 2.7, 1.4); crate(fr, 1.0, 1.55);
  well(fr);
  stall(fr, STALLS[2], (f + 2) % 4);
  crate(fr, 1.5, 2.55); barrel(fr, 1.36, 2.72);
  stall(fr, STALLS[3], (f + 3) % 4);
  pennant(fr, f);
  outline(fr, () => 'k');
  frames.push(pixText(fr));
}

export default {
  id: 'market', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    P: '#c4bba9', p: '#a89f8e', q: '#948b7b', Q: '#7c7466', U: '#655e53', j: '#6f675a', J: '#4f4940',    // kerb + setts, mortar
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', u: '#b58a54',                                           // timber, counter top
    c: '#efe6d2', C: '#bfae88', T: 'team', D: 'teamdark', L: 'teamlight',                             // awning cream / team
    O: '#d9955a', o: '#b5703a', i: '#7f4a24',                                                         // terracotta
    R: '#d0473a', r: '#8e2a1f', b: '#4a7fb0', B: '#7aa8d8', a: '#2a4f78', x: '#9a5a9a', X: '#c08ac0', N: '#5e3060', // cloth bolts
    F: '#e0503a', f: '#a8281e', A: '#ffc061', e: '#e08a2a',                                           // apples, oranges
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', n: '#5f656c', z: '#2a4a66', Z: '#8ab8e0',               // sacks, hoops, well water
    k: '#24180f',
  },
  frames: { idle: frames },
};
