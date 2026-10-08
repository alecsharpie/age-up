// ==head
// @pixel mill
// Windmill (2×2): a round tapering tower of coursed stone on a plinth, an arched team-colour door and lit slit windows,
// a thatched conical cap with a finial, four lattice sails in team cloth on the front of the cap; grain sacks, a spare
// millstone and a cobbled ring on the packed-earth apron. idle ×4: the sails turn in 22.5° steps (4 arms → seamless loop).
// Drawn by drafts/building.mill.js: pixDraw(PIXELS.mill,'idle',b.built?Math.floor(G.time*3):0,tc,bm.Bm[0],bm.Bm[1],{clip:p}).
// ==end
const W = 2, H = 2, Z = 18, ROOF = 14, ARM = 25;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + ARM + 4;
const bx = W * 32 + 2, by = GH - 4, OX = bx, OY = by - 64;
const g = pixGrid(GW, GH);
const CX = OX, CY = OY + 32;                 // footprint centre on the ground
const RB = 19, RT = 15, TH = 44;             // tower radius at base / top, height

// ---- apron: packed earth, a ring of cobbles round the tower, a worn path to the door
const GROUND = 'eEfcC';
flat(g, 0, 2, 0, 2, 0, (s, t, x, y) => {
  const dx = x - CX, dy = (y - CY) * 2, d = Math.hypot(dx, dy), h = hash(x >> 1, y >> 1, 2);
  if (d < RB + 6) { const cb = hash(Math.floor((x + (y % 2) * 1.5) / 3), y >> 1, 8); return ((x + (y >> 1)) % 3 === 0 || y % 2 === 0) ? 'f' : cb < 0.5 ? 'c' : 'C'; }
  const path = Math.abs(dx + dy * 0.9 + 4) < 6 && dx < 0 && dy > 0;
  if (path) return h < 0.5 ? 'E' : 'e';
  return h < 0.2 ? 'f' : h < 0.32 ? 'E' : 'e';
});

// ---- tower: per height row v, paint the front half-ellipse arc; stone courses curve round the drum
const SH = ['P', 'p', 'q', 'Q', 'U', 'V'];                 // stone ramp light → deep
const tone = (nx, bump) => SH[Math.max(0, Math.min(5, Math.floor((nx + 1) / 2 * 5.2 + 0.2) - bump))];
function drum(gr, v0, v1, rad, fn) {
  for (let v = v0; v <= v1; v++) {
    const r = rad(v), yc = CY - v;
    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) {
      const nx = dx / r, front = Math.round(yc + (r / 2) * Math.sqrt(Math.max(0, 1 - nx * nx)));
      for (let y = front; y <= front + 1; y++) { const ch = fn(dx, v, nx, Math.asin(Math.max(-1, Math.min(1, nx)))); if (ch) pixSet(gr, CX + dx, y, ch); }
    }
  }
}
const rTower = v => RB - (RB - RT) * v / TH;
// plinth: a wider, darker course
drum(g, 0, 3, () => RB + 2, (dx, v, nx) => (v === 3 ? tone(nx, 1) : (dx + 40) % 5 === 0 ? 'V' : tone(nx, -1)));
drum(g, 4, TH, rTower, (dx, v, nx, ph) => {
  const course = Math.floor((v - 4) / 4), r = (v - 4) % 4, arc = ph * rTower(v) * 1.15 + (course % 2) * 3.5 + hash(course, 1, 3) * 3;
  const blk = hash(Math.floor(arc / 7), course, 5);
  if (r === 0) return nx > 0.35 ? 'J' : 'j';
  if (Math.floor(arc / 7) !== Math.floor((arc - 1.15) / 7)) return nx > 0.35 ? 'J' : 'j';
  return tone(nx, (r === 3 ? 1 : 0) + (blk < 0.25 ? -1 : blk > 0.8 ? 1 : 0) * (nx > 0.6 ? 0 : 1));
});
// an eave shadow under the cap
drum(g, TH - 2, TH, rTower, (dx, v, nx) => (nx > 0.2 ? 'V' : 'U'));

// openings on the drum: arched team door (left of centre, lit side), slit windows with lit sills
function onDrum(gr, dx0, dx1, v0, v1, fn) { drum(gr, v0, v1, rTower, (dx, v, nx) => (dx >= dx0 && dx <= dx1 ? fn(dx - dx0, v - v0, dx1 - dx0, v1 - v0) : null)); }
onDrum(g, -12, -4, 2, 16, (u, v, uw, vh) => {
  const arch = v > vh - 3 && (u === 0 || u === uw || (v === vh && (u < 2 || u > uw - 2)));
  if (v > vh - 1 && (u <= 1 || u >= uw - 1)) return null;
  if (arch || u === 0 || u === uw || v === vh) return 'w';                       // stone-dressed jambs read as a timber frame
  if (v < 2) return 'v';                                                           // threshold
  if (u === 1) return 'L'; if (u === uw - 1) return 'D';
  if (v === 7 || v === 12) return 'D';                                             // ledges
  return u === 4 ? 'D' : 'T';
});
for (const [x0, v0] of [[2, 22], [-9, 32], [6, 36]]) onDrum(g, x0, x0 + 2, v0, v0 + 5, (u, v) => (v === 0 ? 'P' : u === 2 ? 'Q' : v === 5 ? 'j' : 'K'));

// ---- cap: a thatched cone over the drum top, strands following the slope, dark eave fringe, finial
const CAPR = RT + 4, CAPH = 19, capY = CY - TH;
for (let k = 0; k <= CAPH * 2; k++) {
  const t = k / (CAPH * 2), r = CAPR * (1 - t), yc = capY - t * CAPH;
  for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
    const nx = r > 0.5 ? dx / r : 0; if (Math.abs(nx) > 1) continue;
    const front = Math.round(yc + (r / 2) * Math.sqrt(1 - nx * nx));
    const ph = Math.asin(nx), strand = Math.floor((ph + 2) * 9), band = Math.floor(t * 7), h = hash(strand, band, 4);
    let lv = (nx + 1) / 2 * 4.2 + (h < 0.3 ? 1 : h > 0.85 ? -1 : 0) - (t > 0.8 ? 0 : 0);
    if (t < 0.06) lv += 1.5;
    const TH_ = ['A', 'B', 'b', 'F', 'G', 'G'];
    pixSet(g, CX + dx, front, TH_[Math.max(0, Math.min(5, Math.floor(lv)))]);
    pixSet(g, CX + dx, front - 1, TH_[Math.max(0, Math.min(5, Math.floor(lv)))]);
  }
}
// a binding band two-thirds up the cap
for (let dx = -8; dx <= 8; dx++) { const r = CAPR * 0.42, nx = dx / r; if (Math.abs(nx) > 1) continue; pixSet(g, CX + dx, Math.round(capY - CAPH * 0.58 + (r / 2) * Math.sqrt(1 - nx * nx)), nx > 0.3 ? 'v' : 'W'); }
pixStamp(g, CX - 1, capY - CAPH - 4, `
.k.
kOk
kwk
`);

// ---- props on the apron: grain sacks by the door, a spare millstone against the shaded side
const sack = (x, y) => pixStamp(g, x, y, `
...k...
..kvk..
.kSssk.
kSSsssk
kSsssmk
ksssmmk
.kkkkk.
`);
for (const [x, y] of [[CX - 34, CY + 2], [CX - 29, CY + 4], [CX - 31, CY - 3], [CX - 24, CY + 7], [CX - 39, CY + 6]]) sack(x, y);
{ const mx = CX + 26, my = CY + 4; disc(g, mx, my, 6, (dx, dy, ring) => (ring ? 'k' : Math.hypot(dx, dy) < 1.5 ? 'K' : (Math.abs(Math.hypot(dx, dy) - 3.5) < 0.5 ? 'U' : dx + dy < -1 ? 'p' : dx + dy > 2 ? 'U' : 'q'))); }
// a handcart with a sack, front-right
pixStamp(g, CX + 8, CY + 14, `
....kkkk......
...kSssk......
.kkkkkkkkkkk..
kwwwwwwwwwwWk.
kWWWWWWWWWWvk.
.kkkkkkkkkkkkkk
..kk.....kk....
.kMnk...kMnk...
..kk.....kk....
`);

// ---- sails: hub on the front of the cap; the sail plane faces the lit (front-left) side
const hub = [CX - 12, capY - 3];
const e = th => [Math.cos(th) * 0.89, Math.cos(th) * 0.45 - Math.sin(th)];
const frames = [];
for (let f = 0; f < 4; f++) {
  const fr = clone(g);
  // windshaft stub
  line(fr, [hub[0] + 4, hub[1] - 1], hub, 'v');
  for (let j = 0; j < 4; j++) {
    const th = f * Math.PI / 8 + j * Math.PI / 2, d = e(th), n = e(th + Math.PI / 2);
    // lattice sail on the trailing side of the stock
    const o = [hub[0] + d[0] * 6 + n[0] * 1, hub[1] + d[1] * 6 + n[1] * 1], u = [d[0] * (ARM - 6), d[1] * (ARM - 6)], v = [n[0] * 7, n[1] * 7];
    face(fr, o, u, v, (s, t) => {
      const along = s * (ARM - 6);
      if (t > 0.84) return 'v';                                        // outer frame bar
      if (along % 4 < 1) return 'W';                                  // cross laths
      if (s > 0.96) return 'v';
      return t < 0.22 ? 'L' : t > 0.66 ? 'D' : 'T';
    });
    // the stock (whip) itself, 2 px, lit edge up-left
    line(fr, hub, [hub[0] + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'w');
    line(fr, [hub[0] + 1, hub[1]], [hub[0] + 1 + d[0] * (ARM + 1), hub[1] + d[1] * (ARM + 1)], 'v');
  }
  disc(fr, hub[0], hub[1], 2, (dx, dy, ring) => (ring ? 'k' : 'O'));
  outline(fr, ch => (GROUND.includes(ch) ? 'X' : 'k'));
  frames.push(pixText(fr));
}

export default {
  id: 'mill', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    e: '#8f7148', E: '#a3844f', f: '#6f5636', c: '#a39a8a', C: '#8d8478', X: '#4a3520',          // apron earth, cobbles, rim
    P: '#d6ccb4', p: '#c4b796', q: '#ab9d7e', Q: '#8f8268', U: '#746a55', V: '#584f40',          // tower stone ramp (warm)
    j: '#7d725e', J: '#4e4636', K: '#1e1814',                                                    // mortar lit / shade, dark
    A: '#e6c272', B: '#d0a650', b: '#b58a3c', F: '#8f6a2c', G: '#6a4c22',                        // thatch ramp
    w: '#a07a4a', W: '#8a6a3a', v: '#5a3a18', O: '#c9a86a', k: '#24180f',                       // timber, hub, ink
    S: '#e3d2a8', s: '#c4ad7c', m: '#937c55', M: '#9aa0a6', n: '#5f656c',                        // sacks, iron
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
