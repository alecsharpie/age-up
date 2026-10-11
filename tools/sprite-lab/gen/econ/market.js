// ==head
// @pixel market
// Market (3×3): a cobbled courtyard on a low stone kerb, four different stalls: each faces its own way (counter toward +c or
// +a) under its own roof (a team-striped lean-to awning, an ochre ridged tent, a flat undyed canopy with a team valance), counters of goods (terracotta pots, bolts of cloth, fruit baskets, grain sacks), a
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

// ---- stalls: each has its own facing (counter toward +c 'L' or toward +a 'R'), roof type and cloth
const PZ = 19;
// cloth schemes: two alternating stripe ramps [light, mid, shade]; plain canvas uses the same ramp twice with seams
const CLOTH = {
  team: { A: ['L', 'T', 'D'], B: ['c', 'E', 'H'], n: 1 },
  ochre: { A: ['G', 'g', 'h'], B: ['c', 'E', 'H'], n: 1 },
  plain: { A: ['c', 'E', 'H'], B: ['E', 'E', 'H'], n: 0, hem: ['L', 'T', 'D'] },
};
const quad = (gr, p0, p1, p2, fn) => face(gr, p0, sub2(p1, p0), sub2(p2, p0), fn);
function stall(gr, s0, f) {
  const { a0, a1, c0, c1, kind, facing, roof } = s0, cl = CLOTH[s0.cloth];
  const R = facing === 'R';
  // local frame: u runs along the counter (u = 1 is the end nearest the viewer), w runs back (0) to front (1)
  const P = (u, w, z) => (R ? iso(a0 + w * (a1 - a0), c0 + u * (c1 - c0), z) : iso(a0 + u * (a1 - a0), c0 + w * (c1 - c0), z));
  const lenU = R ? c1 - c0 : a1 - a0, lenW = R ? a1 - a0 : c1 - c0;
  const e = 0.04 / lenU, ew = 0.04 / lenW, wm = 0.56;
  // which vertical faces are lit: c = const planes are lit, a = const are shade
  const frontLit = !R, endLit = R;
  const wood = lit => (lit ? ['w', 'W', 'v'] : ['W', 'v', 'v']);
  const post = (u, w, z1) => { const p = P(u, w, KZ); for (let z = 0; z < z1 - KZ; z++) { pixSet(gr, p[0], p[1] - z, 'w'); pixSet(gr, p[0] + 1, p[1] - z, 'v'); } };
  const sway = [0, 1, 2, 1][f];
  // stripe tone: k = stripe index, sh = 0 lit, 1 mid, 2 shade
  const tone = (k, sh) => (k % 2 === 0 ? cl.A : cl.B)[Math.min(2, sh)];
  const hemC = (k, sh) => (cl.hem ? cl.hem[Math.min(2, sh)] : tone(k, sh));

  // ---- posts
  const ztop = roof === 'lean' ? PZ + 5 : roof === 'flat' ? PZ + 2 : PZ - 2;
  const zfront = roof === 'lean' ? PZ : ztop;
  post(0, 0, ztop); post(1, 0, ztop);
  if (roof === 'gable') { post(0.5, 0, PZ + 11); }
  post(0, wm, zfront); post(1, wm, zfront);

  // ---- roof
  const nU = Math.max(6, Math.round(lenU * 8)) | 1;
  if (roof === 'lean') {
    // back edge high, front edge low; stripes run front-to-back
    const shade = R ? 1 : 0;
    quad(gr, P(-e, -ew, PZ + 5), P(1 + e, -ew, PZ + 5), P(-e, wm + ew, PZ), (s, t) => {
      const k = Math.floor(s * nU), fr = s * nU % 1; if (cl.n === 0 && fr < 0.12 && k % 2) return 'H';
      return t < 0.12 ? tone(k, shade + 1) : fr < 0.2 ? tone(k, shade) : tone(k, shade + (s > 0.75 ? 1 : 0));
    });
    // scalloped front hem (fluttering) and the triangular end hem
    quad(gr, P(-e, wm + ew, PZ - 4), P(1 + e, wm + ew, PZ - 4), P(-e, wm + ew, PZ), (s, t) => {
      const U = s * (lenU + 0.08) * 32, V = t * 4, k = Math.floor(s * nU), sc = (Math.floor(U) + sway) % 5, lt = frontLit ? 0 : 1;
      if (V >= 2) return hemC(k, lt); if (V >= 1) return sc < 4 ? hemC(k, lt + 1) : null; return sc > 0 && sc < 3 ? hemC(k, lt + 1) : null;
    });
    quad(gr, P(1 + e, wm + ew, PZ - 3), P(1 + e, -ew, PZ - 3), P(1 + e, wm + ew, PZ + 5), (s, t) => {
      const z = PZ - 3 + t * 8, roofZ = PZ + 5 * s, lt = endLit ? 0 : 1, U = s * (wm + 2 * ew) * lenW * 32;
      if (z > roofZ) return null; if (z > roofZ - 2) return hemC(0, lt); if (z > roofZ - 3) return (Math.floor(U) + sway) % 5 < 3 ? hemC(0, lt + 1) : null; return null;
    });
  } else if (roof === 'gable') {
    // a ridged tent: ridge front-to-back over the middle of the counter, two slopes, an open gable triangle at the front
    const RZ = PZ + 12, EZ = PZ - 2, nW = 7;
    for (const side of [0, 1]) {
      const ue = side ? 1 + e : -e, lit = (side === 0) !== R ? 0 : 1;
      quad(gr, P(0.5, -ew, RZ), P(0.5, wm + ew, RZ), P(ue, -ew, EZ), (s, t) => {
        const k = Math.floor(s * nW), fr = s * nW % 1;
        return t > 0.85 ? tone(k, lit + 1) : fr < 0.18 ? tone(k, lit === 0 ? 0 : 1) : tone(k, lit + (t > 0.6 ? 1 : 0));
      });
    }
    // dark inside of the tent under the front gable, then the gable's scalloped hem
    quad(gr, P(-e, wm + ew, EZ), P(1 + e, wm + ew, EZ), P(-e, wm + ew, RZ), (s, t) => {
      const z = EZ + t * (RZ - EZ), top = RZ - Math.abs(s - 0.5) * 2 * (RZ - EZ);
      if (z > top) return null; if (z > top - 2) return hemC(Math.floor(s * 4), frontLit ? 0 : 1); return 'v';
    });
    line(gr, P(0.5, -ew, RZ), P(0.5, wm + ew, RZ), 'k');
    quad(gr, P(-e, wm + ew, EZ - 3), P(1 + e, wm + ew, EZ - 3), P(-e, wm + ew, EZ), (s, t) => {
      const U = s * (lenU + 0.08) * 32, V = t * 3, sc = (Math.floor(U) + sway) % 4, lt = frontLit ? 0 : 1;
      if (V >= 2) return tone(0, lt + 1); return sc < 2 ? tone(1, lt + 1) : V >= 1 ? tone(0, lt + 1) : null;
    });
  } else {
    // flat canopy stretched on four posts, sagging a little in the middle; a team valance all round
    const FZ = PZ + 2;
    quad(gr, P(-e, -ew, FZ), P(1 + e, -ew, FZ), P(-e, wm + ew, FZ), (s, t) => {
      const sag = Math.abs(s - 0.5) < 0.3 && Math.abs(t - 0.5) < 0.3, seam = Math.floor(s * 5) !== Math.floor((s + 0.03) * 5);
      if (seam) return 'H'; return sag ? 'E' : t < 0.18 || s < 0.1 ? 'c' : 'E';
    });
    const val = (p0, p1, lit, len) => quad(gr, P(...p0, FZ - 3), P(...p1, FZ - 3), P(...p0, FZ), (s, t) => {
      const U = s * len * 32, V = t * 3, sc = (Math.floor(U) + sway) % 4;
      if (V >= 1) return hemC(0, lit + (V < 2 ? 1 : 0)); return sc < 2 ? hemC(0, lit + 1) : null;
    });
    val([-e, wm + ew], [1 + e, wm + ew], frontLit ? 0 : 1, lenU);
    val([1 + e, wm + ew], [1 + e, -ew], endLit ? 0 : 1, wm * lenW);
  }

  // ---- counter along the front edge (in front of the roof's front edge), goods on it
  const u0 = 0.08 / lenU, u1 = 1 - 0.08 / lenU, w0 = 1 - 0.32 / lenW, w1 = 1 - 0.06 / lenW, TZ = KZ + 7;
  const fw = wood(frontLit), ew2 = wood(endLit);
  quad(gr, P(u0, w1, KZ), P(u1, w1, KZ), P(u0, w1, TZ), (s, t) => { const U = s * (u1 - u0) * lenU * 32, V = t * 7; if (V >= 6) return fw[0]; return Math.floor(U) % 8 === 0 || V < 1 ? fw[2] : fw[1]; });
  quad(gr, P(u1, w1, KZ), P(u1, w0, KZ), P(u1, w1, TZ), (s, t) => (t * 7 >= 6 ? ew2[1] : ew2[2]));
  quad(gr, P(u0, w0, TZ), P(u1, w0, TZ), P(u0, w1, TZ), (s, t) => (t > 0.85 ? 'w' : Math.floor(s * 20) % 5 === 0 ? 'W' : 'u'));
  for (const fa of [0.27, 0.72]) { const m = P(u0 + (u1 - u0) * fa, (w0 + w1) / 2, TZ); goods[kind](gr, Math.round(m[0]) - 7, Math.round(m[1]) - 2, fa > 0.5); }
}
const STALLS = [
  { a0: 0.2, a1: 1.2, c0: 0.2, c1: 1.15, kind: 'pots', facing: 'L', roof: 'gable', cloth: 'ochre' },
  { a0: 1.85, a1: 2.8, c0: 0.2, c1: 1.1, kind: 'cloth', facing: 'R', roof: 'lean', cloth: 'team' },
  { a0: 0.2, a1: 1.12, c0: 1.88, c1: 2.8, kind: 'fruit', facing: 'R', roof: 'flat', cloth: 'plain' },
  { a0: 2.02, a1: 2.86, c0: 2.02, c1: 2.86, kind: 'sacks', facing: 'L', roof: 'lean', cloth: 'team' },
];

// ---- the well: stone ring, dark water, two posts, crossbar and bucket
function well(gr) {
  const c = iso(1.4, 1.4, KZ), cx = Math.round(c[0]), cy = Math.round(c[1]);
  for (let z = 0; z <= 6; z++) for (let dx = -8; dx <= 8; dx++) { const yy = Math.round(Math.sqrt(Math.max(0, 64 - dx * dx)) / 2); pixSet(gr, cx + dx, cy + yy - z, Math.abs(dx) >= 8 || z === 0 ? 'k' : z % 3 === 0 ? (dx > 3 ? 'J' : 'j') : dx < -3 ? 'q' : dx > 3 ? 'U' : 'Q'); }
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
  crate(fr, 1.66, 2.78); barrel(fr, 1.82, 2.62);
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
    c: '#efe6d2', C: '#bfae88', E: '#d9c7a0', H: '#a8946e', G: '#e2b45a', g: '#c08a32', h: '#8a5a1e', T: 'team', D: 'teamdark', L: 'teamlight',                             // awning cream / team
    O: '#d9955a', o: '#b5703a', i: '#7f4a24',                                                         // terracotta
    R: '#d0473a', r: '#8e2a1f', b: '#4a7fb0', B: '#7aa8d8', a: '#2a4f78', x: '#9a5a9a', X: '#c08ac0', N: '#5e3060', // cloth bolts
    F: '#e0503a', f: '#a8281e', A: '#ffc061', e: '#e08a2a',                                           // apples, oranges
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', n: '#5f656c', z: '#2a4a66', Z: '#8ab8e0',               // sacks, hoops, well water
    k: '#24180f',
  },
  frames: { idle: frames },
};
