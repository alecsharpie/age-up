// @pixel wood
// Forest trees (feedback round 1 repaint: "too much like individual trees, not a forest; more realistic, less cartoony").
// 64×80, ground point [32,68]. idle = six variants: [oak, birch stand, spruce, beech, birch + hazel, spruce pair] (v0–v2 are the
// set the game picks from today; v3–v5 are alternates the draw code can pick by tile hash).
// Canopies are wide (up to ~58 px) so neighbouring tiles' crowns overlap into one canopy. Each broadleaf crown is a cloud of
// leaf masses laid back-to-front over a deep-shade base: the base shows through the seams as a dark interior, each mass is lit
// by a blend of its own sphere and the whole crown (light from the upper-left), leafy value noise breaks the tone bands into
// clusters, sun flecks dapple the lit side, and a few sky holes and limbs show through. Conifers are drooping branch tiers with
// needle fringes, each tier shading the one below. Trunks taper, lean a little, carry bark furrows and darken under the crown.
// The outline is dark ink on the shaded (lower/right) side only; the lit rim is the leaves themselves. Ferns sit at the base.
// No painted ground shadow: the engine casts every tree's shadow from this silhouette along the one light (render FX
// fxShadows: the canopy's cast shadow, merged across a wood with sun flecks, plus a tight contact shadow at the trunk foot).
const W = 64, H = 80, AX = 32, AY = 68;
function rng(seed) { let a = seed | 0; return () => { a = (a * 1664525 + 1013904223) | 0; return ((a >>> 8) & 0xffff) / 65536; }; }
const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, sc, s) {   // smooth value noise, cell size sc
  const X = x / sc, Y = y / sc, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t);
  const a = hsh(x0, y0, s), b = hsh(x0 + 1, y0, s), c = hsh(x0, y0 + 1, s), d = hsh(x0 + 1, y0 + 1, s), u = sm(fx), v = sm(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const L3 = (() => { const v = [-0.55, -0.68, 0.48]; const n = Math.hypot(...v); return v.map(a => a / n); })();
const SOLID = c => c !== '.';
// ---- ramps (dark → light) ----
const OAK = ['k', 'd', 'm', 'l', 'h'], BEECH = ['k', 'd', 'e', 'E', 'j'], BIRCH = ['k', 'n', 'N', 'Y', 'y'], PINE = ['P', 'p', 'q', 'Q'], BARK = ['x', 'b', 't', 'T'];

/** broadleaf crown: leaf masses scattered in an irregular ellipse around (cx,cy); paints into g */
function crown(g, o) {
  const R = rng(o.seed), lad = o.lad, cx = o.cx, cy = o.cy, RX = o.rx, RY = o.ry;
  const cl = [];
  for (let i = 0; i < o.n; i++) {
    const a = R() * Math.PI * 2; let rr = Math.sqrt(R()) * 0.82; if (i < o.n * 0.45) rr = 0.72 + R() * 0.22;   // more masses on the rim: a lumpy outline
    const r = o.rmin + R() * (o.rmax - o.rmin);
    cl.push([cx + Math.cos(a) * rr * (RX - r * 0.6), cy + Math.sin(a) * rr * (RY - r * 0.6) + (o.droop || 0) * Math.cos(a) * Math.cos(a) * rr, r, R()]);
  }
  for (const c of o.extra || []) cl.push([cx + c[0], cy + c[1], c[2], R()]);
  const inC = (x, y, c, pad = 0) => { const dx = x + 0.5 - c[0], dy = (y + 0.5 - c[1]) * 1.12; return dx * dx + dy * dy <= (c[2] + pad) * (c[2] + pad); };
  // deep base under everything (shows through the seams as the dark interior), with a few limbs drawn into it
  const x0 = Math.floor(cx - RX - 4), x1 = Math.ceil(cx + RX + 4), y0 = Math.floor(cy - RY - 4), y1 = Math.ceil(cy + RY + 6);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (cl.some(c => inC(x, y, c, -0.4))) pixSet(g, x, y, lad[0]);
  for (const [ax, ay, bx, by] of o.limbs || []) pixLine(g, ax, ay, bx, by, 'b');
  // masses back-to-front (top first; lower masses overlap the ones above, so their lit tops sit on the shade beneath)
  cl.sort((a, b) => (a[1] + a[3] * 3) - (b[1] + b[3] * 3));
  const lit = new Map();
  for (const c of cl) {
    const [px, py, r] = c;
    for (let y = Math.floor(py - r - 1); y <= py + r + 1; y++) for (let x = Math.floor(px - r - 1); x <= px + r + 1; x++) {
      if (!inC(x, y, c, -0.55)) continue;
      const u = (x + 0.5 - px) / r, v = (y + 0.5 - py) * 1.12 / r, w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
      const U = (x + 0.5 - cx) / (RX + 2), V = (y + 0.5 - cy) / (RY + 2), Wg = Math.sqrt(Math.max(0, 1 - U * U - V * V));
      const nx = u * 0.55 + U * 0.6, ny = v * 0.55 + V * 0.6, nz = w * 0.55 + Wg * 0.6, nn = Math.hypot(nx, ny, nz) || 1;
      let d = (nx * L3[0] + ny * L3[1] + nz * L3[2]) / nn;
      d += (vnoise(x, y, 1.7, o.seed) - 0.5) * 0.42;                                    // leaf clusters break the bands
      d -= Math.max(0, V) * 0.18;                                                        // the underside of the crown is darker
      const t = d > 0.72 ? 4 : d > 0.42 ? 3 : d > 0.12 ? 2 : d > -0.22 ? 1 : 0;
      pixSet(g, x, y, lad[t]); lit.set(x + ',' + y, d);
    }
  }
  // sun flecks on the lit side (2-px leaf glints); sky holes near the rim
  for (let i = 0; i < (o.flecks || 14); i++) {
    const x = Math.round(cx - RX * 0.75 + R() * RX * 1.1), y = Math.round(cy - RY * 0.85 + R() * RY * 1.0), d = lit.get(x + ',' + y);
    if (d !== undefined && d > 0.45 && pixGet(g, x + 1, y) !== '.') { pixSet(g, x, y, lad[4]); pixSet(g, x + 1, y, lad[4]); if (R() < 0.5) pixSet(g, x, y + 1, lad[3]); }
  }
  for (let i = 0; i < (o.holes || 0); i++) {
    const a = -0.6 + R() * 2.4, x = Math.round(cx + Math.cos(a) * RX * 0.66), y = Math.round(cy + Math.sin(a) * RY * 0.6);
    if ([[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]].every(([dx, dy]) => SOLID(pixGet(g, x + dx, y + dy)))) { pixSet(g, x, y, '.'); if (R() < 0.5) pixSet(g, x + 1, y, '.'); }
  }
}
/** conifer: drooping branch tiers from the bottom up; each tier is a skirt with a jagged needle hem, lit left, shaded right */
function conifer(g, o) {
  const R = rng(o.seed), cx = o.cx, top = o.top, base = o.base, n = o.tiers, maxW = o.w, lad = PINE;
  const tiers = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), yb = base - (base - top) * t * 0.86, hw = maxW * (1 - t * 0.85) * (0.88 + R() * 0.2);
    tiers.push({ yb, hl: hw * (0.78 + R() * 0.4), hr: hw * (0.78 + R() * 0.4), h: (base - top) / n * 1.9 + 2 });
  }
  const hemAt = (tr, x) => tr.yb + 1.6 * Math.pow(Math.abs(x + 0.5 - cx) / Math.max(tr.hl, tr.hr), 2);
  tiers.forEach((tr, k) => {
    const apex = tr.yb - tr.h;
    for (let x = Math.floor(cx - tr.hl - 1); x <= cx + tr.hr + 1; x++) {
      const dx = x + 0.5 - cx, side = dx < 0 ? tr.hl : tr.hr, f = Math.abs(dx) / side; if (f > 1) continue;
      const ytop = apex + (tr.yb - apex) * Math.pow(f, 0.85) - 1.2 * Math.sin(f * Math.PI);
      const hem = tr.yb + 1.6 * f * f + (hsh(x, k, o.seed) < 0.5 ? 1 : 0) + (f > 0.25 && hsh(x, k + 9, o.seed) < 0.3 ? 1 : 0) + (f > 0.8 && hsh(x, k + 3, o.seed) < 0.5 ? 1 : 0);
      for (let y = Math.floor(ytop); y <= hem; y++) {
        const v = (y - ytop) / Math.max(1, hem - ytop);                              // 0 at the top of the tier, 1 at the hem
        let d = -dx / side * 0.55 + (0.5 - v) * 0.9 + (vnoise(x, y, 1.6, o.seed + k) - 0.5) * 0.5;
        if ((x + y * 2) % 4 === 0 && v > 0.2) d -= 0.3;                               // needle sprays slanting out and down
        pixSet(g, x, y, lad[d > 0.55 ? 3 : d > 0.05 ? 2 : d > -0.45 ? 1 : 0]);
      }
    }
    for (const sd of [-1, 1]) if (R() < 0.7) { const ex = cx + sd * ((sd < 0 ? tr.hl : tr.hr) + 1 + R() * 2), ey = tr.yb + 1 + R(); pixLine(g, cx + sd * (sd < 0 ? tr.hl : tr.hr) * 0.6, tr.yb - 1, ex, ey, sd < 0 ? 'q' : 'p'); }   // a drooping branch tip past the skirt
    // this tier's hem casts a shade band on the tier below
    for (let x = Math.floor(cx - tr.hl); x <= cx + tr.hr; x++) for (const dy of [1, 2]) { const y = Math.round(hemAt(tr, x)) + dy, dk = { Q: 'q', q: 'p', p: 'P' }[pixGet(g, x, y)]; if (dk && k > 0) pixSet(g, x, y, dk); }
  });
  pixLine(g, cx, top - 2, cx, top + 2, 'p'); pixSet(g, cx, top - 3, 'P');            // leader
}
/** tapered, slightly leaning trunk with bark furrows, root flare and the crown's shadow on its upper part */
function trunk(g, o) {
  const { x, h, w0, w1 } = o, lean = o.lean || 0, lad = o.bark || BARK, shadeTo = o.shadeTo ?? -1;
  for (let y = AY - h; y <= AY; y++) {
    const t = (AY - y) / h, cxp = x + lean * t, hw = w0 + (w1 - w0) * t;
    for (let xx = Math.floor(cxp - hw); xx <= Math.ceil(cxp + hw) - 1; xx++) {
      const u = (xx + 0.5 - cxp) / hw; if (Math.abs(u) > 1.05) continue;
      let tt = o.birch ? (u < 0.35 ? 3 : u < 0.75 ? 2 : 1) : (u < -0.45 ? 3 : u < 0.2 ? 2 : u < 0.7 ? 1 : 0);
      if (!o.birch && vnoise(xx * 3, y, 2.2, o.seed || 3) < 0.3 && tt > 1) tt--;       // bark furrows
      if (y < shadeTo && tt > 1) tt--;                                                  // crown shadow on the upper trunk
      pixSet(g, xx, y, lad[tt]);
    }
    if (o.birch && hsh(Math.round(cxp), y, o.seed || 5) < 0.25 && y % 2 === 0) { pixSet(g, Math.floor(cxp - hw * 0.4), y, 'x'); pixSet(g, Math.floor(cxp), y, 'x'); }   // lenticel marks
  }
  for (const [dx, dy, c] of [[-w0 - 1, 0, 2], [-w0 - 2, 0, 1], [-w0 - 1, -1, 2], [w0, 0, 1], [w0 + 1, 0, 0], [w0, -1, 1]]) pixSet(g, Math.round(x + dx), AY + dy, BARK[c]);   // root flare
}
/** ferns at the base: small fans of fronds, lit at the tips */
function ferns(g, spots, seed) {
  const R = rng(seed);
  for (const [fx, fy, s] of spots) {
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.5 + (R() - 0.5) * 0.3, L = s * (0.7 + R() * 0.4);
      const ex = fx + Math.cos(a) * L * 1.5, ey = fy + Math.sin(a) * L * 0.75;
      pixLine(g, fx, fy, ex, ey, 'f'); pixSet(g, ex, ey, 'F'); if (k % 2) pixSet(g, (fx + ex) / 2, (fy + ey) / 2 - 1, 'F');
    }
    pixSet(g, fx, fy, 'f');
  }
}
/** shaded-side outline: empty cells right of / below the silhouette get ink; on the lit upper-left the leaf edge stands alone */
function ink(g) {
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (SOLID(g[y][x])) continue;
    const l = SOLID(pixGet(g, x - 1, y)), u = SOLID(pixGet(g, x, y - 1)), r = SOLID(pixGet(g, x + 1, y)), d = SOLID(pixGet(g, x, y + 1));
    if (!(l || u || r || d)) continue;
    const nb = l ? pixGet(g, x - 1, y) : u ? pixGet(g, x, y - 1) : r ? pixGet(g, x + 1, y) : pixGet(g, x, y + 1);
    const dark = PINE.includes(nb) ? 'O' : 'o';
    if (l || u || x >= AX + 4 || y > AY - 4) add.push([x, y, dark]);
    else if (y > 20 && hsh(x, y, 2) < 0.75) add.push([x, y, dark]);                     // lower-left: broken ink
  }
  for (const [x, y, c] of add) pixSet(g, x, y, c);
}
function despeckle(g) {
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const c = g[y][x]; if (!SOLID(c) || 'hjyQx'.includes(c)) continue;
    const n = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]];
    if (n.every(k => k === n[0]) && n[0] !== c && SOLID(n[0])) g[y][x] = n[0];
  }
}
// ---- the six variants ----
function oak() {
  const g = pixGrid(W, H);
  trunk(g, { x: 31, h: 27, w0: 3.6, w1: 2.4, lean: -1, shadeTo: AY - 14, seed: 4 });
  crown(g, { seed: 11, lad: OAK, cx: 32, cy: 29, rx: 28, ry: 22, n: 46, rmin: 3.6, rmax: 6.6, droop: 3, flecks: 18, holes: 3,
    limbs: [[30, 44, 22, 34], [31, 44, 41, 32], [30, 40, 33, 26]], extra: [[-22, 10, 5], [22, 9, 5.5], [-4, -20, 5], [-7, 13, 4.2]] });
  ferns(g, [[21, AY + 1, 5], [43, AY, 4], [27, AY + 3, 3]], 5);
  ink(g); despeckle(g); return g;
}
function birch() {
  const g = pixGrid(W, H);
  trunk(g, { x: 28, h: 46, w0: 2.2, w1: 1.4, lean: -3, birch: true, bark: ['x', 'w', 'w', 'W'], shadeTo: AY - 34, seed: 6 });
  trunk(g, { x: 37, h: 40, w0: 1.8, w1: 1.1, lean: 4, birch: true, bark: ['x', 'w', 'w', 'W'], shadeTo: AY - 30, seed: 7 });
  crown(g, { seed: 29, lad: BIRCH, cx: 33, cy: 22, rx: 22, ry: 18, n: 52, rmin: 2.6, rmax: 4.6, droop: 5, flecks: 22, holes: 7,
    limbs: [[26, 30, 20, 22], [39, 30, 46, 22]], extra: [[-17, 12, 3.5], [16, 13, 3.6], [0, 17, 3]] });
  ferns(g, [[22, AY + 1, 4], [41, AY + 1, 5]], 8);
  ink(g); despeckle(g); return g;
}
function spruce() {
  const g = pixGrid(W, H);
  trunk(g, { x: 32, h: 16, w0: 2.4, w1: 1.6, shadeTo: AY - 4, seed: 9 });
  conifer(g, { seed: 7, cx: 32, top: 4, base: AY - 7, tiers: 8, w: 21 });
  ferns(g, [[22, AY + 1, 4], [42, AY + 1, 3]], 12);
  ink(g); despeckle(g); return g;
}
function beech() {
  const g = pixGrid(W, H);
  trunk(g, { x: 33, h: 34, w0: 3.0, w1: 2.0, lean: 1, bark: ['x', 'G', 'g', 'v'], shadeTo: AY - 16, seed: 2 });
  crown(g, { seed: 41, lad: BEECH, cx: 32, cy: 25, rx: 27, ry: 21, n: 50, rmin: 3.2, rmax: 6.0, droop: 5, flecks: 16, holes: 1,
    limbs: [[33, 36, 25, 28], [33, 38, 43, 30]], extra: [[-21, 12, 4.6], [21, 12, 4.8]] });
  ferns(g, [[23, AY + 1, 5], [44, AY + 1, 4]], 14);
  ink(g); despeckle(g); return g;
}
function birchHazel() {
  const g = pixGrid(W, H);
  trunk(g, { x: 36, h: 44, w0: 2.0, w1: 1.3, lean: 2, birch: true, bark: ['x', 'w', 'w', 'W'], shadeTo: AY - 32, seed: 8 });
  crown(g, { seed: 57, lad: BIRCH, cx: 37, cy: 22, rx: 20, ry: 17, n: 44, rmin: 2.6, rmax: 4.4, droop: 5, flecks: 18, holes: 6 });
  for (const [sx, lean] of [[19, -2], [22, 0], [25, 2]]) pixLine(g, sx, AY, sx + lean, AY - 6, 'b');   // hazel stems under a low leafy dome
  crown(g, { seed: 63, lad: OAK, cx: 22, cy: AY - 10, rx: 13, ry: 8, n: 20, rmin: 2.6, rmax: 4.2, flecks: 6, extra: [[-9, 4, 3.2], [9, 4, 3.2]] });
  ferns(g, [[45, AY + 1, 4]], 16);
  ink(g); despeckle(g); return g;
}
function sprucePair() {
  const g = pixGrid(W, H);
  trunk(g, { x: 23, h: 12, w0: 1.8, w1: 1.2, shadeTo: AY - 3, seed: 10 });
  conifer(g, { seed: 19, cx: 23, top: 14, base: AY - 6, tiers: 7, w: 16 });
  trunk(g, { x: 39, h: 15, w0: 2.4, w1: 1.6, shadeTo: AY - 4, seed: 11 });
  conifer(g, { seed: 23, cx: 39, top: 3, base: AY - 7, tiers: 8, w: 19 });
  ferns(g, [[31, AY + 2, 4]], 18);
  ink(g); despeckle(g); return g;
}

export default {
  id: 'wood', kind: 'resource', anchor: [AX, AY],
  palette: {
    o: '#0e1e0e', k: '#1a3a1c', d: '#284f26', m: '#3a6a30', l: '#56873c', h: '#86ad52',     // oak: ink → deep interior → shade → mid → light → sun fleck
    e: '#33602e', E: '#4f8036', j: '#7ea64a',                                              // beech: a touch bluer-green, smoother
    n: '#335e28', N: '#4d7e30', Y: '#76a03e', y: '#a6c25c',                                // birch: airy, yellower
    O: '#0a1a13', P: '#13301f', p: '#1f4630', q: '#2f5e40', Q: '#4a7c54',                  // spruce: cool blue-green needles
    x: '#1c120a', b: '#38261a', t: '#55402a', T: '#7a6244',                                // oak bark: ink, shade, mid, lit
    G: '#4a463e', g: '#6c6656', v: '#8e8874',                                              // beech bark: smooth grey
    W: '#e4ded0', w: '#a69e8e',                                                            // birch bark
    f: '#2c5022', F: '#4f7c32',                                                            // ferns
  },
  frames: { idle: [pixText(oak()), pixText(birch()), pixText(spruce()), pixText(beech()), pixText(birchHazel()), pixText(sprucePair())] },
};
