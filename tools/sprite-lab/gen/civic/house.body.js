// Age variants (AGE, AK = pixAgeKit(AGE) come from gen/ages/wrap.mjs):
//   Dark     low wattle-and-daub hut under a steep, deep golden thatch that reaches almost to the ground; crossed gable poles,
//            smoke curling from a hole under the ridge (no chimney), a team-colour hide hung in the dark doorway, a shuttered hole.
//   Feudal   the close-studded timber-framed cottage on a stone plinth, brown oak shingles, stone chimney, carved knob finial.
//   Castle   taller dressed-stone house, red clay tiles with a ridge of crested tiles, tall chimney, arched windows, an iron
//            finial and a team banner on the lit wall.
//   Imperial tallest: pale limestone with pilasters and a gilt string course, blue slate with gilt cresting, a gilt orb finial,
//            two chimneys, an arched doorway with a gilt keystone, a gilt-fringed banner.
const W = 2, H = 2, PL = AK.plinth;
const Z = [14, 20, 23, 25][AGE], ROOF = [33, 24, 25, 29][AGE];
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + 40 + 14 + AK.head;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);
const { R, S, P: PZ, W: TW, Au, Fe, Gl, INK, DEEP } = AK;

// ---- walls. Every opening is laid out in wall space (u along the wall from its left end, h height above the base line), so
// windows, doors, rails and straps follow the wall's iso slope instead of being upright screen rectangles.
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'l', right: 'r' });
const B = top.base;
const RAIL = 8, PLATE = 14; // Feudal: the eave hangs to about h 16, so the top plate sits just under it
const wallUV = (a, b, x, y) => [x - a[0], Math.floor(wallH(a, b, x + 0.5, y + 0.5))];
// lit wall (L -> Bm): the window panel; shaded wall (Bm -> Rr): the door panel
const LW = { a: B.L, b: B.Bm, studs: [0, 11, 22, 37, 49, 62], win: { u0: 24, u1: 36, h0: 6, h1: PLATE } };
const RW = { a: B.Bm, b: B.Rr, studs: [0, 13, 27, 39, 51, 62], door: { u0: 15, u1: 25, h0: PL, h1: PLATE } };
// Feudal: the half-timbered wall exactly as it was tuned
const wallCellFeudal = (wl, lit, x, y) => {
  const [u, h] = wallUV(wl.a, wl.b, x, y);
  const T1 = lit ? 't' : 'u', T2 = lit ? 'u' : 'v', P = lit ? 'l' : 'r', Pm = lit ? 'm' : 's', Sh = lit ? 'h' : 'H';
  const win = wl.win, dr = wl.door;
  if (win && u >= win.u0 && u <= win.u1 && h >= win.h0 && h <= win.h1) {
    // casement window: open team shutters flat against the wall either side, dark frame, firelit panes, centre mullion
    const su = u - win.u0, n = win.u1 - win.u0;
    if (h === win.h0) return su <= 1 || su >= n - 1 ? (su === 0 || su === n ? T2 : 'Q') : (su === 2 ? 'S' : (su === n - 2 ? 'q' : 'S')); // stone sill
    if (su <= 2 || su >= n - 2) { const e = su <= 2 ? su : n - su; return h === win.h1 || h === win.h0 + 1 ? 'D' : (e === 0 ? 'D' : (e === 2 ? 'L' : 'T')); }
    if (su === 3 || su === n - 3 || h === win.h0 + 1 || h === win.h1) return 'v';
    if (su === Math.round(n / 2)) return 'v';
    return h === win.h1 - 1 ? 'w' : ((su === 5 && h === win.h0 + 2) ? 'G' : 'g');
  }
  if (dr && u >= dr.u0 && u <= dr.u1 && h >= dr.h0 - 1 && h <= dr.h1) {
    // plank door in team colour: frame, lintel, vertical boards, two iron straps running with the wall, stone step
    const su = u - dr.u0, n = dr.u1 - dr.u0;
    if (h < dr.h0) return su === 0 || su === n ? null : 'S';
    if (h >= dr.h1 - 1) return h === dr.h1 ? 'u' : 'v';
    if (su === 0 || su === n) return 'v';
    if (h === dr.h0 + 2 || h === dr.h1 - 4) return 'k';
    if (su === 1) return 'L';
    if (su === n - 1) return 'D';
    if (su % 3 === 1) return 'D';
    return (su === n - 2 && h === dr.h0 + 5) ? 'k' : 'T';
  }
  if (h < PL) return null; // plinth, painted separately
  for (const s of wl.studs) if (u >= s && u <= s + 1) return u === s ? T1 : T2;
  if (h === PL || h === PL + 1) return h === PL + 1 ? T1 : T2;            // sill beam
  if (h === RAIL || h === RAIL - 1) return h === RAIL ? T1 : T2;          // mid rail
  if (h === PLATE || h === PLATE + 1) return h === PLATE + 1 ? T1 : T2;   // top plate
  if (h > PLATE + 1) return Sh;                                           // eave shadow
  if (h === PLATE - 1) return Pm;                                         // shadow under the plate
  // daub: weathered in soft clusters (a splash stain above the sill, a few patches), never per-pixel noise
  if (h === PL + 2 && hash(u >> 2, 7) < 0.6) return Pm;
  const pn = wl.studs.findIndex(s => s > u), cl = hash(pn * 3 + (h > RAIL ? 1 : 0), lit ? 5 : 9);
  if (cl < 0.35 && Math.abs(u - (wl.studs[pn - 1] || 0) - 5) + Math.abs(h - (h > RAIL ? 11 : 6)) * 2 < 4) return Pm;
  return P;
};
// Dark / Castle / Imperial: the age kit's wall material with this age's door and window cut into it
const DOOR = [{ u0: 15, u1: 24, h1: 11 }, null, { u0: 15, u1: 25, h1: 15 }, { u0: 14, u1: 26, h1: 18 }][AGE];
const WIN = [{ u0: 27, u1: 32, h0: 6, h1: 10 }, null, { u0: 26, u1: 34, h0: 7, h1: 16 }, { u0: 25, u1: 35, h0: 7, h1: 19 }][AGE];
const WIN2 = AGE >= 2 ? { u0: 44, u1: 50, h0: 8, h1: 15 + (AGE - 2) * 2 } : null; // a second, narrower window on the door wall
const arch = (su, n, h, h1) => { const c = n / 2, r = Math.max(1, Math.round(n / 2)); const dh = h - (h1 - r); return dh > 0 && Math.hypot(su - c, dh * 1.3) > r + 0.3; }; // outside a round head
const wallCellAge = (wl, lit, x, y) => {
  const [u, h] = wallUV(wl.a, wl.b, x, y), len = 64, face = lit ? 0 : 1, sc = lit ? S[0] : S[2], sd = lit ? S[1] : S[3];
  const dr = lit ? null : DOOR, wn = lit ? WIN : WIN2;
  if (dr && u >= dr.u0 && u <= dr.u1 && h <= dr.h1) {
    const su = u - dr.u0, n = dr.u1 - dr.u0;
    if (AGE === 0) { // low doorway under a log lintel, a team-colour hide hung across most of it
      if (h >= dr.h1 - 1) return h === dr.h1 ? TW[0] : TW[2];
      if (su === 0 || su === n) return TW[1];
      if (su >= n - 2) return DEEP;                                                  // the gap where the hide is drawn aside
      if (h < 1) return DEEP;
      return su === 1 ? 'L' : (su + Math.floor(h / 4)) % 4 === 0 ? 'D' : su === n - 3 ? 'D' : 'T';
    }
    if (arch(su, n, h, dr.h1)) return null;
    if (su <= 1 || su >= n - 1 || h >= dr.h1 - 1 || arch(su, n, h + 2, dr.h1)) {                          // stone surround
      if (AGE === 3 && su === Math.round(n / 2) && h >= dr.h1 - 3) return Au[0];                         // gilt keystone
      return su === 0 || su === n ? sd : sc;
    }
    if (h < 1) return AGE === 3 ? S[0] : sd;                                                             // step
    if (h === 3 || h === dr.h1 - 6) return Fe[1];                                                        // iron straps
    return su === 2 ? 'L' : su === n - 2 ? 'D' : su === Math.round(n / 2) ? 'D' : 'T';
  }
  if (wn && u >= wn.u0 && u <= wn.u1 && h >= wn.h0 && h <= wn.h1) {
    const su = u - wn.u0, n = wn.u1 - wn.u0;
    if (AGE === 0) { // a hole with a propped plank shutter
      if (h === wn.h1) return TW[1];
      if (su === 0) return TW[2];
      return su <= 2 ? TW[0] : (su === n ? TW[2] : DEEP);
    }
    if (arch(su, n, h, wn.h1)) return null;
    if (h === wn.h0) return AGE === 3 ? Au[lit ? 0 : 1] : sc;                                            // sill
    if (su === 0 || su === n || arch(su, n, h + 1, wn.h1)) return AGE === 3 && h >= wn.h1 - 1 ? Au[1] : sd;
    if (su === 1 || su === n - 1 || h === wn.h0 + 1) return DEEP;
    if (su === Math.round(n / 2)) return DEEP;                                                           // mullion
    return h === wn.h0 + 2 && su === 2 ? Gl[1] : Gl[0];                                                  // firelight
  }
  return AK.wallTex(u, h, face, { len, H: Z });
};
if (AGE === 1) {
  paint(g, 'l', (x, y) => { const h = wallH(B.L, B.Bm, x, y); return h < PL ? course(x, y, 0.5, { h: 3, w: 6, joint: 'j', tones: ['S', 'q', 'S'], lip: 'S' }) : null; });
  paint(g, 'r', (x, y) => { const h = wallH(B.Bm, B.Rr, x, y); return h < PL ? course(x, y, -0.5, { h: 3, w: 6, joint: 'j', tones: ['q', 'Q', 'q'], lip: 'q' }) : null; });
}
{ const o = copy(g), cell = AGE === 1 ? wallCellFeudal : wallCellAge;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (o[y][x] === 'l') { const c = cell(LW, true, x, y); g[y][x] = c || (AGE === 1 ? 'l' : '.'); }
    else if (o[y][x] === 'r') { const c = cell(RW, false, x, y); g[y][x] = c || (AGE === 1 ? 'r' : '.'); }
  } }
// arched heads leave the wall above the opening's round top: put the wall back there
if (AGE !== 1) for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] === '.') {
  const l = wallH(B.L, B.Bm, x + 0.5, y + 0.5), r = wallH(B.Bm, B.Rr, x + 0.5, y + 0.5);
  if (x + 0.5 >= B.L[0] && x + 0.5 <= B.Bm[0] && l >= 0 && l < Z) g[y][x] = AK.wallTex(x - B.L[0], Math.floor(l), 0, { len: 64, H: Z });
  else if (x + 0.5 > B.Bm[0] && x + 0.5 <= B.Rr[0] && r >= 0 && r < Z) g[y][x] = AK.wallTex(x - B.Bm[0], Math.floor(r), 1, { len: 64, H: Z });
}
// a log pile on the ground against the lit wall, near the front corner (Dark and Feudal: firewood; later: a water butt)
if (AGE <= 1) pixStamp(g, B.Bm[0] - 26, B.Bm[1] - 14, `
...kkkk..kkkk..
..kNnnnkkNnnnk.
..knnyntknnyntk
.kkkkkkkkkkkkkk
kNnnnkkNnnnkkk.
knnyntknnyntk..
.kkkkkkkkkkkk..
`);
else pixStamp(g, B.Bm[0] - 22, B.Bm[1] - 15, `
.kkkkkk.
kNNnnnyk
kkkkkkkk
knNnnnyk
knNnnnyk
kkkkkkkk
knNnnnyk
.kkkkkk.
`);

// ---- roof: hipped, overhanging the walls. Dark: deep shaggy thatch dropping far below the wall plate.
const OV = AGE === 0 ? 3 : 1, DROP = AGE === 0 ? 4 : 2;
const RF = { L: [top.L[0] - OV, top.L[1] + DROP], Bm: [top.Bm[0], top.Bm[1] + DROP + 1], Rr: [top.Rr[0] + OV, top.Rr[1] + DROP], T: [top.T[0], top.T[1] - 1] };
const ap = pixIsoRoof(g, RF, ROOF, 1, { back: '2', left: '3', front: '4', right: '5' });
paint(g, '3', (x, y) => AK.roofXY(x, y, -0.5, 2, { flip: true }));   // back slopes: flip
paint(g, '4', (x, y) => AK.roofXY(x, y, 0.5, 0));
paint(g, '2', (x, y) => AK.roofXY(x, y, 0.5, 3, { flip: true }));
paint(g, '5', (x, y) => AK.roofXY(x, y, -0.5, 1));
// eaves: a thick trimmed edge, darker on the shaded side (thatch: a ragged hanging fringe)
line(g, RF.L, RF.Bm, R[3], 0); line(g, RF.L, RF.Bm, R[6], 1); line(g, RF.Bm, RF.Rr, R[5], 0); line(g, RF.Bm, RF.Rr, R[6], 1);
if (AGE === 0) for (let x = Math.ceil(RF.L[0]); x <= RF.Rr[0]; x++) if (hash(x, 77) < 0.35) {
  const e = x <= RF.Bm[0] ? RF.L[1] + (x - RF.L[0]) * 0.5 : RF.Bm[1] - (x - RF.Bm[0]) * 0.5; pixSet(g, x, Math.round(e) + 2, R[6]);
}
if (AGE >= 2) AK.trim(g, [RF.L[0] + 1, RF.L[1]], RF.Bm, -1) && AK.trim(g, RF.Bm, [RF.Rr[0] - 1, RF.Rr[1]], -1);
// hips: a light rib on the lit side, a dark crease on the shaded side
line(g, RF.L, ap, R[1]); line(g, RF.L, ap, R[4], 1); line(g, RF.Bm, ap, R[5]); line(g, [RF.Bm[0] - 1, RF.Bm[1]], [ap[0] - 1, ap[1]], R[2]); line(g, RF.Rr, ap, R[5]);
line(g, RF.T, ap, R[3]);
// Castle / Imperial: crested hips (ridge tiles; gilt cresting) break the skyline, and a gabled dormer stands on the lit slope
if (AGE >= 2) { AK.crest(g, lerp(RF.L, ap, 0.12), ap); AK.crest(g, lerp(RF.Rr, ap, 0.12), ap); }
if (AGE >= 2) {
  const dm = lerp(lerp(RF.L, RF.Bm, 0.5), ap, 0.28);   // foot of the dormer's front wall on the slope
  const tpl = `
.....k.....
....k1k....
...k11Ak...
..k11fAAk..
.k11fffAck.
k11ffffAAck
kkkkkkkkkkk
.kspppppqk.
.kswwwwwqk.
.kswgGgwqk.
.kswgggwqk.
.kswgggwqk.
.kaaaaaaak.
`;
  stampOn(g, Math.round(dm[0]) - 5, Math.round(dm[1]) - 12, tpl.replace(/1/g, R[0]).replace(/A/g, R[2]).replace(/f/g, R[1]).replace(/c/g, R[4])
    .replace(/s/g, S[0]).replace(/q/g, S[2]).replace(/w/g, DEEP).replace(/g/g, Gl[0]).replace(/G/g, Gl[1]).replace(/p/g, AGE === 3 ? Au[1] : S[1]).replace(/a/g, AGE === 3 ? Au[1] : S[1]), 0.5);
}

// chimney(s): stone stack in courses on the shaded slope, sooty cap. The slope falls toward the Bm-Rr eave, i.e. along the stack's
// L->Bm edge, so the roof stands ROOF*0.24 px higher at its L corner than at Bm: the left face's foot follows the slope (cells
// below it are roof in front of the stack, restored from `under`) with a dark seam where stone meets roof.
const stacks = [];
const chimney = (at, tall) => {
  const under = copy(g);
  const ct = pixIsoBox(g, at[0], at[1], 0.24, 0.24, tall, 1, { top: 'j', left: '6', right: '7' });
  paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'Q', tones: ['S', 'q'] }));
  paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'j', tones: ['q', 'Q'] }));
  pixRect(g, ct.T[0] - 1, ct.T[1] + 1, 4, 2, 'k');
  { const capL = (x, y) => y - (ct.L[1] + (x - ct.L[0]) * 0.5), capR = (x, y) => y - (ct.Bm[1] - (x - ct.Bm[0]) * 0.5);
    for (let y = 0; y < GH; y++) for (let x = Math.floor(ct.L[0]); x <= Math.ceil(ct.Rr[0]); x++) {
      const left = x + 0.5 < ct.Bm[0], d = left ? capL(x + 0.5, y + 0.5) : capR(x + 0.5, y + 0.5);
      if (!['S', 'q', 'Q', 'j'].includes(g[y][x]) || d < 0 || d > 3) continue;
      g[y][x] = d < 2 ? (left ? 'S' : 'q') : (left ? 'Q' : 'j');
    } }
  const rise = ROOF * 0.24, cL = at[0] - 0.24 * 32;
  const hid = (x, y) => { const cx = x + 0.5, d = at[0] - cx; return d > 0 && y + 0.5 > at[1] - d * 0.5 - rise * d / (at[0] - cL); };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== under[y][x] && hid(x, y)) g[y][x] = under[y][x];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== under[y][x] && !hid(x, y) && hid(x, y + 1)) g[y][x] = 'j';
  stacks.push([Math.round(ct.T[0]), Math.round(ct.T[1])]);
};
if (AGE === 3) chimney(lerp(lerp(RF.Bm, RF.Rr, 0.22), ap, 0.30), 16);           // a second stack near the front hip
if (AGE >= 1) chimney(lerp(lerp(RF.Bm, RF.Rr, 0.66), ap, 0.42), [0, 14, 18, 18][AGE]);
// ridge cap / finial at the apex (Dark: a smoke hole under crossed gable poles; smoke rises from it)
if (AGE === 0) { pixStamp(g, ap[0] - 3, ap[1] - 1, `
.kkkkk.
kbbcbbk
.kkkkk.
`.replace(/b/g, R[4]).replace(/c/g, DEEP)); stacks.push([Math.round(ap[0]), Math.round(ap[1]) - 1]); }
else pixStamp(g, ap[0] - 3, ap[1] - 2, `
.kkkkk.
k1fAAck
kebbbek
.kkkkk.
`.replace(/1/g, R[0]).replace(/f/g, R[2]).replace(/A/g, R[1]).replace(/c/g, R[4]).replace(/e/g, R[6]).replace(/b/g, R[3]));
AK.finial(g, Math.round(ap[0]), Math.round(ap[1]) - (AGE === 0 ? 2 : 3));
// a team banner hung on the lit wall between the window and the front corner (Castle, Imperial)
if (AGE >= 2) { const u = 46, bxx = B.L[0] + u, byy = Math.round(B.L[1] + u * 0.5 - Z + 3); AK.banner(g, bxx, byy, 0.5, 5, AGE === 3 ? 11 : 10); }

const base = outline(g, 'k', { [R[0]]: R[1], [R[2]]: R[1], l: 'm', S: 'q', [S[0]]: S[1], [PZ[0]]: PZ[1] });

// ---- idle: 6 frames — chimney smoke curls up and drifts right, the window glow flickers
const puff = (f, x, y, r) => { // a soft round puff: light top-left, grey bottom-right
  if (r === 0) { pixRect(f, x, y, 2, 2, 'x'); pixSet(f, x, y, 'z'); return; }
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + r * 0.6) continue; pixSet(f, x + xx, y + yy, (xx + yy < 0) ? 'z' : (xx + yy > r ? 'X' : 'x')); }
};
const glow = []; base.forEach((r, y) => r.forEach((c, x) => { if (c === 'g' || c === 'G' || c === Gl[0] || c === Gl[1]) glow.push([x, y, c]); }));
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  stacks.forEach(([sx, sy], n) => {
    for (let k = 0; k < (n ? 2 : 4); k++) { // puffs born at the chimney, rise 4 px per frame
      const t = ((i + k * 1.5 + n * 2) % 6) / 6, rise = 2 + t * (n ? 14 : 22);
      const r = t < 0.2 ? 0 : t < 0.75 ? (AGE === 0 ? 1 : 2) : 1;
      puff(f, sx + Math.round(Math.sin(t * 5) * 1.5 + t * 9), sy - Math.round(rise), r);
    }
  });
  const fl = [0, 1, 0, 2, 1, 0][i]; // flicker: glow core moves / dims
  if (fl) glow.forEach(([x, y, c], k) => { if ((k + fl) % 3 === 0) f[y][x] = c === 'G' ? 'g' : c === 'g' ? 'G' : c === Gl[1] ? Gl[0] : Gl[1]; });
  frames.push(pixText(f));
}

export default {
  id: 'house', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    ...AK.pal,
    k: '#24180f',                                                         // ink
    l: '#e8dcc0', m: '#d6c49c', h: '#a8946e',                             // daub lit wall: lit / mid / eave shadow
    r: '#b8a582', s: '#a6926c', H: '#7e6c4e',                             // daub shaded wall
    t: '#8a6a3a', u: '#5a3a18', v: '#3b2614',                             // timber light / mid / deep
    S: '#a39a8c', q: '#8d8478', Q: '#6f6a60', j: '#4f4a42',               // stone lit / mid / shade / mortar
    w: '#3a2414', g: '#e89a3a', G: '#ffd36a',                             // window recess / firelight
    N: '#c09a62', n: '#8a6a3a', y: '#5a3a18',                             // log ends / staves
    z: '#e4e0da', x: '#c4beb8', X: '#948e88',                             // smoke
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
