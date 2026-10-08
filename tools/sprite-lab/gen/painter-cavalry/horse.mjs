// Procedural horse painter: ellipse forms with directional (upper-left) shading, auto outline, IK legs.
// Works in "horse local" coords (ground y = GY at standing), with an optional rigid transform (rotate about a pivot, translate)
// for rearing / falling. Output: char grid.
export function grid(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
export function put(g, x, y, ch) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; }
export function get(g, x, y) { return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
export function stamp(g, ox, oy, txt, opt = {}) {
  const rows = txt.replace(/^\n+|\n+$/g, '').split('\n');
  rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.' || ch === ' ') continue; const X = opt.flip ? ox + (r.length - 1 - xx) : ox + xx; put(g, X, oy + yy, ch); } });
}
export function line(g, x0, y0, x1, y1, ch, skipFirst = false) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const pts = [];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (; ;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  for (let i = skipFirst ? 1 : 0; i < pts.length; i++) { const [x, y] = pts[i]; if (typeof ch === 'function') ch(x, y, i, pts.length); else put(g, x, y, ch); }
  return pts;
}
export const text = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';

// transform: {ang (rad), px, py (pivot, local), tx, ty}
export function mkT(t = {}) {
  const a = t.ang || 0, c = Math.cos(a), s = Math.sin(a), px = t.px || 0, py = t.py || 0, tx = t.tx || 0, ty = t.ty || 0, sy = t.sy || 1;
  const fw = (x, y) => { const X = x - px, Y = (y - py) * sy; return [px + c * X - s * Y + tx, py + s * X + c * Y + ty]; };
  const inv = (x, y) => { const X = x - px - tx, Y = y - py - ty; return [px + c * X + s * Y, py + (-s * X + c * Y) / sy]; };
  return { fw, inv, a, c, s };
}

/**
 * Paint a horse. P = palette chars {a light, b mid, c shade, d deep, k ink, m mane mid, n mane dark, h hoof}.
 * o: {legs: [[hx,hy] hoof targets in local for LH, RH, LF, RF] , bob, head (dy of head/neck nod), neck ang offset,
 *     tail: [dx,dy] tip offset, maneFlick, T transform, build: 'light'|'heavy', skipNear: bool, barding: fn}
 */
export const DEFAULT_HEAD = `
.ab...
aabb..
bkbbb.
cbbbbd
.cc.dd
`;
export function horse(g, P, o) {
  const T = mkT(o.T); const B = o.build || { };
  const bob = o.bob || 0, hd = o.head || 0;
  const sc = B.scale || 1; // not used for size, just for legs
  // ---- body forms (local coords, standing, ground at GY) ----
  const GY = o.GY;
  const by = GY - 11.5 + bob;                       // barrel centre y
  const fx = (B.fx ?? -0.9), nd = o.neckDx || 0, ndy = o.neckDy || 0;
  const forms = [
    { cx: 11.3 + fx * 0.5, cy: by, rx: B.barrelRx || 5.9, ry: B.barrelRy || 2.9, ang: 0 },       // barrel
    { cx: 6.0, cy: by - 0.6, rx: B.rumpRx || 3.4, ry: B.rumpRy || 3.3, ang: 0 },        // quarters
    { cx: 15.6 + fx, cy: by - 0.3, rx: B.chestRx || 2.7, ry: B.chestRy || 3.1, ang: 0 },                // chest / shoulder
    { cx: 17.6 + fx + nd, cy: by - 5.2 + hd * 0.5 + ndy, rx: B.neckRx || 4.0, ry: B.neckRy || 1.8, ang: -1.0 + (o.neckAng || 0) },     // neck
    ...(o.noCrest ? [] : [{ cx: 16.8 + fx + nd, cy: by - 6.2 + hd * 0.5 + ndy, rx: 3.0, ry: 1.25, ang: -0.62 + (o.neckAng || 0) }]),          // crest (arches the neck)
  ];
  o._head = { poll: [18.5 + fx + nd + (o.headDx || 0), by - 10.2 + hd + (o.headDy || 0)] };
  const W = g[0].length, H = g.length;
  const fill = Array.from({ length: H }, () => Array(W).fill(0)), lev = Array.from({ length: H }, () => Array(W).fill(0));
  const L = [-0.62, -0.78];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [lx, ly] = T.inv(x + 0.5, y + 0.5);
    let best = null, bd = -1;
    for (const f of forms) {
      const c = Math.cos(-f.ang), s = Math.sin(-f.ang); const X = lx - f.cx, Y = ly - f.cy;
      const u = (c * X - s * Y) / f.rx, v = (s * X + c * Y) / f.ry; const r2 = u * u + v * v;
      if (r2 <= 1 && 1 - r2 > bd) {
        bd = 1 - r2;
        // normal in local → rotate back by f.ang, then by T.a into screen
        const cf = Math.cos(f.ang), sf = Math.sin(f.ang); let nx = cf * u - sf * v, ny = sf * u + cf * v;
        const nX = T.c * nx - T.s * ny, nY = T.s * nx + T.c * ny;
        best = L[0] * nX + L[1] * nY;
      }
    }
    if (best !== null) { fill[y][x] = 1; lev[y][x] = best; }
  }
  const over = {};
  const HEAD = (o.headStamp || DEFAULT_HEAD).replace(/^\n+|\n+$/g, '').split('\n');
  const hx0 = 18.2 + fx + nd + (o.headDx || 0), hy0 = by - 10.3 + hd + (o.headDy || 0);
  HEAD.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.') continue;
    const [X, Y] = T.fw(hx0 + xx + 0.5, hy0 + yy + 0.5); const x = Math.floor(X), y = Math.floor(Y);
    if (y < 0 || y >= H || x < 0 || x >= W) continue; fill[y][x] = 1; over[x + ',' + y] = P[ch] || ch; } });
  // far legs first (behind body)
  const legs = legGeom(o, by, T);
  if (!o.noLegs) for (const leg of legs.filter(l => l.far)) drawLeg(g, leg, P, true);
  if (o.tail !== false) drawTail(g, o, by, T, P);
  // body
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fill[y][x] === 1) {
    const b = lev[y][x]; put(g, x, y, over[x + ',' + y] || (b > 0.5 ? P.a : b < -0.62 ? P.c : P.b));
  }
  // outline: 4-neighbour ring outside the body fill
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (fill[y][x] === 1) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => get(fill, x + dx, y + dy) === 1);
    if (!n.length) continue;
    const below = get(fill, x, y + 1) === 1 && get(fill, x, y - 1) !== 1 && get(fill,x+1,y)!==1;  // pixel sits on top of the form
    put(g, x, y, below && o.selective !== false ? P.c : P.k);
  }
  // body detail: belly shadow line, girth fold, dark muzzle, nostril, eye
  // mane along the crest: top outline pixel of each neck column becomes dark hair, the one under it mane-mid
  const hh = o._head; const [pX, pY] = T.fw(hh.poll[0], hh.poll[1]); const [wX] = T.fw(13.8 + fx, by - 3);
  const mf = o.maneFlick || 0;
  if (o.mane !== false) for (let x = Math.round(wX); x <= Math.round(pX); x++) {
    let top = -1; for (let y = 0; y < H; y++) if (fill[y][x] === 1) { top = y; break; }
    if (top < 0) continue;
    put(g, x, top - 1, P.n); put(g, x, top, P.m);
    const k = x - Math.round(wX);
    if ((k + mf) % 3 === 0 && x < pX - 1) put(g, x - 1, top - 1, P.n);          // locks lifted by the wind
    if (k > 0 && (k + mf) % 3 === 1 && x < pX - 1 && x > wX + 1) put(g, x, top - 2, P.n);
  }
  // ears + forelock above the poll
  { const e = (dx, dy, ch) => { const [x, y] = T.fw(hx0 + dx + 0.5, hy0 + dy + 0.5); put(g, Math.floor(x), Math.floor(y), ch); };
    e(1, -1, P.c); e(1, -2, P.k); e(0, -1, P.k); e(2, 0, P.n); }
  if (o.detail) o.detail(g, T, by, hd, fill);
  if (!o.noLegs) for (const leg of legs.filter(l => !l.far)) drawLeg(g, leg, P, false, o.straight ? null : fill);
  return { by, T, fill, lev, legs, fx, head: [hx0, hy0] };
}

// legs: hips/shoulders in local; hoof targets given per leg (local)
export function legGeom(o, by, T) {
  const GY = o.GY, B = o.build || {};
  const defs = [
    { id: 'LH', hip: [6.4, by - 0.5], far: false, hind: true },
    { id: 'RH', hip: [7.6, by - 0.7], far: true, hind: true },
    { id: "LF", hip: [15.4 + ((o.build && o.build.fx) ?? -0.9), by + 0.5], far: false, hind: false },
    { id: "RF", hip: [16.5 + ((o.build && o.build.fx) ?? -0.9), by + 0.3], far: true, hind: false },
  ];
  return defs.map((d, i) => {
    const tgt = o.legs[i];
    const L1 = d.hind ? (B.hindL1 || 6.8) : (B.foreL1 || 5.6), L2 = d.hind ? (B.hindL2 || 6.0) : (B.foreL2 || 5.8);
    const [hx, hy] = d.hip, [fx, fy] = tgt;
    let dx = fx - hx, dy = fy - hy, D = Math.hypot(dx, dy); const maxD = L1 + L2 - 0.01;
    let ex = fx, ey = fy; if (D > maxD) { ex = hx + dx / D * maxD; ey = hy + dy / D * maxD; D = maxD; }
    const a = Math.atan2(ey - hy, ex - hx);
    const cosA = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D); const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    // hind: hock points back (joint to -x side); fore: knee forward (+x). With leg pointing down (a≈+90°), +A rotates toward -x.
    const ja = d.hind ? a + A : a - A;
    const jx = hx + Math.cos(ja) * L1, jy = hy + Math.sin(ja) * L1;
    const P = (x, y) => T.fw(x, y);
    if (o.straight) { const h = o.straight[i]; return { ...d, hipS: P(h[0], h[1]), jS: P((h[0] + fx) / 2, (h[1] + fy) / 2), fS: P(fx, fy), lifted: true }; }
    return { ...d, hipS: P(hx, hy), jS: P(jx, jy), fS: P(ex, ey), lift: GY - ey, lifted: GY - ey > 0.6 };
  });
}

function drawLeg(g, leg, P, far, mask) {
  const pt = (x, y, ch) => { if (mask && get(mask, x, y) === 1) return; put(g, x, y, ch); };
  const [hx, hy] = leg.hipS, [jx, jy] = leg.jS, [fx, fy] = leg.fS;
  const lite = far ? P.c : P.b, dark = P.d;
  // upper (forearm / gaskin): 3 px near (light-mid-dark), 2 px far
  line(g, hx, hy, jx, jy, (x, y, i, n) => {
    if (!far) { pt(x - 1, y, i < n - 2 ? P.b : P.d); pt(x, y, i < n - 1 ? P.b : P.b); pt(x + 1, y, dark); }
    else { pt(x, y, lite); pt(x + 1, y, dark); }
  });
  // lower (cannon + pastern): 2 px, light side toward the light
  line(g, jx, jy, fx, fy - 0.6, (x, y) => {
    const steep = Math.abs(fy - jy) >= Math.abs(fx - jx);
    if (steep) { pt(x, y, lite); pt(x + 1, y, dark); } else { pt(x, y, lite); pt(x, y + 1, dark); }
  });
  const Fx = Math.round(fx), Fy = Math.round(fy);
  pt(Fx, Fy, P.h); pt(Fx + 1, Fy, P.h);
}

function drawTail(g, o, by, T, P) {
  const tp = o.tailPose || [0, 0];
  const root = [3.3, by - 3.0];
  const mid = [1.4 + tp[0] * 0.5, by - 0.5 + tp[1] * 0.5];
  const tip = [0.6 + tp[0], by + 4.2 + tp[1]];
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12; const x = (1 - t) * (1 - t) * root[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0];
    const y = (1 - t) * (1 - t) * root[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1];
    pts.push(T.fw(x, y));
  }
  const seen = new Set();
  pts.forEach(([x, y], i) => {
    const X = Math.round(x), Y = Math.round(y); const k = X + ',' + Y; if (seen.has(k)) return; seen.add(k);
    put(g, X, Y, P.m);
    if (i > 1 && i < 11) put(g, X - 1, Y, P.n);          // tail is 2 px thick for most of its length
    if (i <= 2) put(g, X - 1, Y, P.k);
  });
}
