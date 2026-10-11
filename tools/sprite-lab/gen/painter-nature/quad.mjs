// Naturalistic quadruped painter (feedback round 1): body = overlapping shaded volumes (rump, barrel, shoulder, neck, skull,
// muzzle) lit from the upper-left in 3D, legs = tapered two-segment IK limbs (hock behind on the hind leg, knee on the fore
// leg) that end in thin cannons and a hoof pixel, so the animal stands on four believable legs instead of sticks under a
// blob. Far legs sit behind the body in a darker ramp; near legs are painted over it. The outline is drawn from the body
// mask only (legs stay unoutlined and thin): dark hue-shifted ink below/right, the material's deep tone on the lit rim.
// Works in "animal local" coords (ground row GY), with an optional rigid transform T (rotate about a pivot, translate)
// for rearing and falling. Used by sheep/deer/boar here and by the trade cart's draught horse (painter-skirm/cart.mjs).
export const grid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
export const get = (g, x, y) => (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.';
export function put(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length && c && c !== '.') g[y][x] = c; }
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
export function line(g, x0, y0, x1, y1, ch) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, i = 0;
  for (; ;) { if (typeof ch === 'function') ch(x0, y0, i++); else put(g, x0, y0, ch); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
export function mkT(t = {}) {
  const a = t.ang || 0, c = Math.cos(a), s = Math.sin(a), px = t.px || 0, py = t.py || 0, tx = t.tx || 0, ty = t.ty || 0, sy = t.sy || 1;
  const fw = (x, y) => { const X = x - px, Y = (y - py) * sy; return [px + c * X - s * Y + tx, py + s * X + c * Y + ty]; };
  const inv = (x, y) => { const X = x - px - tx, Y = y - py - ty; return [px + c * X + s * Y, py + (-s * X + c * Y) / sy]; };
  return { fw, inv, a, c, s };
}
const LN = (() => { const v = [-0.5, -0.72, 0.48]; const n = Math.hypot(...v); return v.map(a => a / n); })();

/** two-bone IK. bend: 'hind' puts the joint behind (hock), 'fore' in front (knee/carpus). Returns [hip, joint, foot]. */
export function ik(hip, foot, L1, L2, bend) {
  const [hx, hy] = hip; let [fx, fy] = foot; let dx = fx - hx, dy = fy - hy, D = Math.hypot(dx, dy); const maxD = L1 + L2 - 0.01;
  if (D > maxD) { fx = hx + dx / D * maxD; fy = hy + dy / D * maxD; D = maxD; }
  const a = Math.atan2(fy - hy, fx - hx), A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
  const ja = bend === 'hind' ? a + A : a - A;
  return [[hx, hy], [hx + Math.cos(ja) * L1, hy + Math.sin(ja) * L1], [fx, fy]];
}

/**
 * spec: { T, mats: {name:{t:[light,mid,shade,deep], thr?:[a,b,c], ink, rim}}, forms:[{cx,cy,rx,ry,ang,mat,z}],
 *   legs:[{pts:[hip,joint,foot] | hip,foot,L1,L2,bend, far, w:[hip,joint,foot], mat, hoof}], tex(x,y,info)->char|null,
 *   pre(ctx), post(ctx), late(ctx) }
 * ctx = { g, fill, T, P(x,y) local→screen int, put(lx,ly,ch) }
 */
export function paint(W, H, s) {
  const g = grid(W, H), T = mkT(s.T), fill = grid(W, H), info = grid(W, H);
  const P = (x, y) => { const [X, Y] = T.fw(x, y); return [Math.floor(X), Math.floor(Y)]; };
  const ctx = { g, fill, info, T, P, put: (x, y, ch) => { const [X, Y] = P(x, y); put(g, X, Y, ch); }, line: (x0, y0, x1, y1, ch) => { const a = T.fw(x0, y0), b = T.fw(x1, y1); line(g, Math.floor(a[0]), Math.floor(a[1]), Math.floor(b[0]), Math.floor(b[1]), ch); } };
  const legs = (s.legs || []).map(l => ({ ...l, pts: (l.pts || ik(l.hip, l.foot, l.L1, l.L2, l.bend)).map(([x, y]) => T.fw(x, y)) }));
  for (const l of legs.filter(l => l.far)) drawLeg(g, l, s.mats, null);
  if (s.pre) s.pre(ctx);
  // body volumes: highest z wins, then the deepest (most interior) form
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [lx, ly] = T.inv(x + 0.5, y + 0.5); let best = null;
    for (const f of s.forms) {
      const c = Math.cos(-f.ang || 0), sn = Math.sin(-f.ang || 0), X = lx - f.cx, Y = ly - f.cy;
      const u = (c * X - sn * Y) / f.rx, v = (sn * X + c * Y) / f.ry, r2 = u * u + v * v; if (r2 > 1) continue;
      const z = f.z || 0, dep = 1 - r2;
      if (best && (z < best.z || (z === best.z && dep <= best.dep))) continue;
      const cf = Math.cos(f.ang || 0), sf = Math.sin(f.ang || 0), nx0 = cf * u - sf * v, ny0 = sf * u + cf * v;
      const nx = T.c * nx0 - T.s * ny0, ny = T.s * nx0 + T.c * ny0, nz = Math.sqrt(dep) * (f.flat || 1);
      const n = Math.hypot(nx, ny, nz), d = (nx * LN[0] + ny * LN[1] + nz * LN[2]) / n;
      best = { z, dep, d, f, lx, ly, u, v };
    }
    if (!best) continue;
    const m = s.mats[best.f.mat], thr = m.thr || [0.62, 0.22, -0.2];
    let t = best.d > thr[0] ? 0 : best.d > thr[1] ? 1 : best.d > thr[2] ? 2 : 3;
    t = Math.max(0, Math.min(3, t + (best.f.bias || 0)));
    fill[y][x] = 1; info[y][x] = { mat: best.f.mat, t, f: best.f, lx: best.lx, ly: best.ly, d: best.d };
    g[y][x] = m.t[t];
  }
  // hand-drawn stamps (heads, ears) laid over the volumes, in local coords through T; they join the body mask
  for (const st of s.stamps || []) st.txt.replace(/^\n+|\n+$/g, '').split('\n').forEach((row, yy) => { for (let xx = 0; xx < row.length; xx++) {
    const ch = row[xx]; if (ch === '.' || ch === ' ') continue; const [X, Y] = T.fw(st.x + xx + 0.5, st.y + yy + 0.5), x = Math.floor(X), y = Math.floor(Y);
    if (y < 0 || y >= H || x < 0 || x >= W) continue; fill[y][x] = 1; info[y][x] = { mat: st.mat, t: 1, stamp: true, d: 0 }; g[y][x] = ch; } });
  if (s.tex) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fill[y][x] === 1) { const c = s.tex(x, y, info[y][x], ctx); if (c) g[y][x] = c; }
  if (s.post) s.post(ctx);
  // outline from the body mask: rim tone where the outline sits above/left of the form (lit side), ink elsewhere
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (fill[y][x] === 1) continue;
    const nb = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => get(fill, x + dx, y + dy) === 1 ? info[y + dy][x + dx] : null);
    const any = nb.find(Boolean); if (!any) continue;
    if (s.noOutline && s.noOutline(x, y, any)) continue;
    const m = s.mats[any.mat], litSide = (nb[0] || nb[1]) && !nb[2] && !nb[3] && (nb[0] || nb[1]).d > (s.rimD ?? 0.1);
    add.push([x, y, litSide && m.rim && y < (s.rimBelow ?? 99) ? m.rim : (m.ink || 'o')]);
  }
  for (const [x, y, c] of add) if (g[y][x] === '.' || !(s.keep && s.keep.includes(g[y][x]))) g[y][x] = c;
  for (const l of legs.filter(l => !l.far)) drawLeg(g, l, s.mats, fill);
  if (s.late) s.late(ctx);
  return { g, fill, info, ctx, legs };
}

/** tapered limb: per pixel distance to the bone; lit on the left edge, shade on the right, far legs one ramp darker */
function drawLeg(g, l, mats, mask) {
  const m = mats[l.mat], [a, b, c] = l.pts, w = l.w || [2.4, 1.6, 1.1];
  const tone = (side, far) => far ? (side < 0 ? m.t[2] : m.t[3]) : (side < -0.25 ? m.t[l.lit ?? 1] : side > 0.25 ? m.t[3] : m.t[2]);
  const seg = (p, q, w0, w1) => {
    const x0 = Math.floor(Math.min(p[0], q[0]) - 2), x1 = Math.ceil(Math.max(p[0], q[0]) + 2), y0 = Math.floor(Math.min(p[1], q[1]) - 2), y1 = Math.ceil(Math.max(p[1], q[1]) + 1);
    const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy || 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - p[0], py = y + 0.5 - p[1]; let t = (px * dx + py * dy) / L2; t = Math.max(0, Math.min(1, t));
      const ex = px - t * dx, ey = py - t * dy, r = (w0 + (w1 - w0) * t) / 2;
      if (ex * ex + ey * ey > r * r) continue;
      if (mask && get(mask, x, y) === 1) continue;
      put(g, x, y, tone(r > 0.7 ? ex / r : 0, l.far));
    }
    // guarantee a continuous 1-px core even where the taper is thinner than a pixel
    line(g, p[0], p[1], q[0], q[1], (x, y) => { if (mask && get(mask, x, y) === 1) return; if (get(g, x, y) === '.' || !Object.values(mats).some(mm => mm.t.includes(get(g, x, y)))) put(g, x, y, tone(0, l.far)); });
  };
  seg(a, b, w[0], w[1]); seg(b, [c[0], c[1] - 0.6], w[1], w[2]);
  const fx = Math.floor(c[0]), fy = Math.floor(c[1]);
  if (!(mask && get(mask, fx, fy) === 1)) put(g, fx, fy, l.hoof || m.t[3]);
  if (l.hoofW) put(g, fx + 1, fy, l.hoof || m.t[3]);
}

/** remove lone interior pixels: a cell whose four neighbours all share one other colour takes that colour */
export function despeckle(g, keep = '') {
  const out = g.map(r => r.slice());
  for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[0].length - 1; x++) {
    const c = g[y][x]; if (c === '.' || keep.includes(c)) continue;
    const n = [g[y - 1][x], g[y + 1][x], g[y][x - 1], g[y][x + 1]];
    if (n.every(k => k === n[0]) && n[0] !== c && n[0] !== '.') out[y][x] = n[0];
  }
  return out;
}
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** emit a literal-grid draft (same format as lib.mjs emit, with string palette values) */
export function emit(id, header, spec) {
  const fr = Object.entries(spec.frames).map(([k, L]) => `    ${k}: [${L.map(t => '`' + t + '`').join(', ')}],`).join('\n');
  const pal = Object.entries(spec.palette).map(([k, v]) => `    ${/^[A-Za-z]$/.test(k) ? k : JSON.stringify(k)}: '${v[0]}',${v[1] ? '  // ' + v[1] : ''}`).join('\n');
  const extra = Object.entries(spec).filter(([k]) => !['id', 'anchor', 'palette', 'frames'].includes(k)).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},\n`).join('');
  return `// @pixel ${id}\n${header.map(l => '// ' + l).join('\n')}\nexport default {\n  id: '${id}', anchor: ${JSON.stringify(spec.anchor)},\n${extra}  palette: {\n${pal}\n  },\n  frames: {\n${fr}\n  },\n};\n`;
}
