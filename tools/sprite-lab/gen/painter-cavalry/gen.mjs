import fs from 'fs';
import { grid, put, get, stamp, line, text, horse, mkT } from './horse.mjs';
const OUT = process.env.OUTDIR || './tools/sprite-lab/drafts/';
const which = process.argv[2] || 'horseman';

// ---------------- gait ----------------
function canterLegs(t, GY, fxo, R = 2.6) {
  // right-lead canter seen from the left: LH, then RH+LF together (diagonal), then RF (leading fore), then suspension
  const legs = [
    { t0: 0.00, hip: 6.4, off: -0.4, lift: 2.8 },
    { t0: 0.17, hip: 7.6, off: -0.4, lift: 2.8 },
    { t0: 0.19, hip: 15.4 + fxo, off: 0.6, lift: 3.6 },
    { t0: 0.36, hip: 16.5 + fxo, off: 0.6, lift: 3.6 },
  ];
  const duty = 0.40;
  return legs.map(l => {
    const q = ((t - l.t0) % 1 + 1) % 1; const c = l.hip + l.off;
    if (q < duty) { const s = q / duty; return [c + R - 2 * R * s, GY]; }
    const s = (q - duty) / (1 - duty); const e = s * s * (3 - 2 * s);
    return [c - R + 2 * R * e, GY - l.lift * Math.pow(Math.sin(Math.PI * s), 0.8)];
  });
}
function standLegs(GY, fxo, lift = null) {
  const L = [[5.8, GY], [7.6, GY], [15.6 + fxo, GY], [17.0 + fxo, GY]];
  if (lift !== null) L[lift] = [L[lift][0] + 0.8, GY - 1.6];
  return L;
}

// ---------------- palettes ----------------
const BASE = {
  k: '#24180f',                                   // ink
  s: '#e8c39e', o: '#f2d2b0', S: '#c9a07a',        // skin
  w: '#e6eaee', v: '#9aa0a6', V: '#5f656c', x: '#1e2a33',  // steel
  l: '#a07a4a', e: '#8a6a3a', E: '#5a3a18', q: '#3b2614',  // leather / wood
  i: '#efe6d2', j: '#d9c7a0', J: '#a8946e',                      // linen (spear shaft, smear)
  g: '#e1b12c', G: '#a87a12',                      // gold
  T: 'team', D: 'teamdark', L: 'teamlight',
};
const COATS = {
  bay: { a: '#b07a48', b: '#8a5530', c: '#5e3418', d: '#3b2010', m: '#4a2e1c', n: '#2e1c12' },
  chestnut: { a: '#d8a160', b: '#b5763a', c: '#82491e', d: '#4f2a10', m: '#f0d9a0', n: '#c79a52' },   // light-maned chestnut
  grey: { a: '#d6d3cc', b: '#a8a39a', c: '#706b63', d: '#423e38', m: '#e8e4dc', n: '#8a857c' },
};
const HAIR = { h: '#7a5030', H: '#5a3a1a', y: '#3b2a1a' };
const HP = { a: 'a', b: 'b', c: 'c', d: 'd', k: 'k', m: 'm', n: 'n', h: 'k' };

// ---------------- riders (hand-painted; facing right, origin = top-left) ----------------
// upper body rows 0..11 (breathes), lower body rows 12.. (seat, thigh, shin, boot)
const RIDERS = {
  horseman: { up: `
...xx....
..xwvVx..
.xwvvVVx.
.xxxxxxx.
..kHsksk.
..kHsSSk.
...kSSk..
..kLTTDk.
.kLLTTTDk
.kLTTTTDk
.kLTTTDDk
.kqeeeEqk
`, lo: `
..kTTTDk.
..kTTEeek
.....kEek
.....kEk.
.....kqk.
.....kqqk
`},
  scout: { up: `
...kkk...
..kHhhk..
.kHhhhHk.
.kyHooHk.
.kyHkosk.
..kHsSSk.
...kSSk..
..kLTTDk.
.kLLTTTDk
.kLTTTDk.
.kLTTTDk.
.kqeeeEk.
`, lo: `
..kTTTDk.
..kTTEeek
.....kEek
.....kEk.
.....kqk.
.....kqqk
`},
  knight: { up: `
.xxxxxx..
xwwvvVVx.
xwvvvVVx.
xvvxxxxx.
xvvvvVVx.
xVvvvVVx.
.xxVVxx..
.kijjjJk.
kiijTjjJk
kiTTTTjJk
kijjTjJJk
kqeegeEqk
`, lo: `
.kjjjjJk.
.kjjJvVVk
.....kvVk
.....kVk.
.....kxk.
.....kxxk
`},
};
const SHIELD = `
.kkkk.
kLTTTk
kLgTDk
kggggk
.kgTk.
.kTDk.
..kk..
`;
// scout's short cape (team), 3 flutter states, hangs from the shoulders behind the rider
const CAPE = [`
kTk.
kTDk
kDTk
.kDk
`, `
kTk..
kTDk.
.kDTk
..kk.
`, `
kTk...
.kTDk.
..kDTk
...kk.
`];

// ---------------- frame composer ----------------
function compose(U, f) {
  const W = f.W || U.W, H = f.H || U.H, GY = U.GY; const g = grid(W, H);
  const r = horse(g, HP, { GY, build: U.build, legs: f.legs, bob: f.bob || 0, head: f.head || 0, tailPose: f.tail, maneFlick: f.mane || 0,
    headStamp: f.headStamp || U.headStamp, mane: !U.barding, T: f.T, neckAng: f.neckAng, headAng: f.headAng, neckDx: f.neckDx, neckDy: f.neckDy, headDx: f.headDx, headDy: f.headDy, noCrest: f.noCrest, straight: f.straight, noLegs: f.noLegs });
  const { by } = r;
  if (U.barding) caparison(g, r, f, U); else saddleCloth(g, r, U);
  if (f.noRider) return { g, r };
  const seat = r.T.fw(10 + r.fx * 0.5, by - 3);
  const sx = Math.round(seat[0] + (f.lean || 0)), sy = Math.round(seat[1] + (f.ry || 0));
  const ox = sx - 4, oy = sy - 12;
  const R = RIDERS[U.rider];
  if (U.rider === 'scout') stamp(g, ox - 3 + (f.capeDx || 0), oy + 7 + (f.breathe || 0), CAPE[(f.cape || 0) % 3]);
  stamp(g, ox - (f.lean || 0), oy + 12, R.lo);
  stamp(g, ox + (f.back || 0), oy + (f.breathe || 0), R.up);
  if (U.rider === 'knight') stamp(g, ox - 2, oy + 7 + (f.breathe || 0), SHIELD);
  if (f.weapon) f.weapon(g, ox, oy + (f.breathe || 0));
  return { g, r };
}

function saddleCloth(g, r, U) {
  const { by, T, fx } = r; const x0 = 6 + fx * 0.5, x1 = 13.4 + fx * 0.5;
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
    const [lx, ly] = T.inv(x + 0.5, y + 0.5);
    const hem = by + 2.0 + ((Math.floor(lx) & 1) ? 0.6 : -0.2);
    if (lx < x0 || lx > x1 || ly < by - 3.4 || ly > hem) continue;
    if (r.fill[y][x] !== 1 && ly > by - 2.5) continue;
    const top = ly < by - 2.3, bot = ly > hem - 1, right = lx > x1 - 1;
    put(g, x, y, top ? 'L' : bot ? 'D' : right ? 'D' : 'T');
  }
}

function caparison(g, r, f, U) {
  const { by, T, fx, fill, lev } = r; const W = g[0].length, H = g.length;
  const ph = f.phase || 0;
  const hemY = x => by + 3.6 + 0.7 * Math.sin(x * 1.1 + ph * 6.28);
  const cov = Array.from({ length: H }, () => Array(W).fill(0));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [lx, ly] = T.inv(x + 0.5, y + 0.5);
    const inHead = lx > r.head[0] - 0.3 && ly < r.head[1] + 4.6;
    if (fill[y][x] === 1 && !inHead) cov[y][x] = 1;
    else if (!f.lying && lx > 2.6 && lx < 18.4 + fx && ly > by - 1 && ly < hemY(lx)) cov[y][x] = 2;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cov[y][x]) {
    const b = cov[y][x] === 1 ? lev[y][x] : -0.2 - (y - by) * 0.08;
    const fold = cov[y][x] === 2 && ((x + Math.round(ph * 3)) % 4 === 0);
    put(g, x, y, b > 0.45 ? 'L' : (b < -0.62 || fold) ? 'D' : 'T');
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cov[y][x] !== 2) continue;
    if (!get(cov, x, y + 1)) { put(g, x, y, 'g'); put(g, x, y + 1, 'k'); }
    if (!get(cov, x - 1, y) && get(fill, x - 1, y) !== 1) put(g, x - 1, y, 'k');
    if (!get(cov, x + 1, y) && get(fill, x + 1, y) !== 1) put(g, x + 1, y, 'k');
  }
}

// ---------------- weapons ----------------
const shaft = (g, x0, y0, x1, y1, ch = 'j') => line(g, x0, y0, x1, y1, ch);
function arm(g, ox, oy, hx, hy, C = ['L', 'D', 'T']) {
  const sx = ox + 3, sy = oy + 8; const ex = sx + Math.round((hx - sx) * 0.35), ey = Math.max(sy + 1, Math.round((sy + hy) / 2) + 1);
  line(g, sx, sy, ex, ey, (x, y) => { put(g, x, y, C[0]); put(g, x, y + 1, C[1]); });
  line(g, ex, ey, hx - 1, hy, (x, y) => { put(g, x, y, C[2]); put(g, x, y + 1, C[1]); });
  put(g, hx, hy, 's'); put(g, hx, hy + 1, 'S');
}
const ARMC = { horseman: ['L', 'D', 'T'], scout: ['L', 'D', 'T'], knight: ['v', 'V', 'v'] };
let RT = 'horseman';
function spearVertical(pennon = null) {
  return (g, ox, oy) => {
    const hx = ox + 8, hy = oy + 10, top = 0;
    shaft(g, hx, top + 2, hx, hy + 4); put(g, hx, top, 'w'); put(g, hx, top + 1, 'V');
    if (pennon !== null) stamp(g, hx + 1, top + 2, pennon % 2 ? 'TTL.\nDTTT' : 'TTTL\nDTD.');
    arm(g, ox, oy, hx, hy, ARMC[RT]);
  };
}
function spearAt(ang, len, smear, back = 3, pennon = null) {
  return (g, ox, oy) => {
    const hx = ox + 8, hy = oy + 10; const c = Math.cos(ang), s = Math.sin(ang);
    const tx = hx + c * len, ty = hy + s * len, bx = hx - c * back, byy = hy - s * back;
    if (smear) { line(g, hx + c * (len - 7), hy + s * (len - 7) + 1, tx - c, ty + 1, (x, y) => put(g, x, y, 'i')); line(g, hx + c * (len - 4), hy + s * (len - 4) - 1, tx - 2 * c, ty - 1, (x, y) => put(g, x, y, 'i')); }
    shaft(g, bx, byy, tx - c, ty - s);
    put(g, tx, ty, 'w'); put(g, tx - c, ty - s, 'v');
    arm(g, ox, oy, hx, hy, ARMC[RT]);
  };
}
// sword: guard at the hand, 5-px blade at angle ang (0 = forward, -pi/2 = up); smear = arc swept from ang0
function sword(ang, opt = {}) {
  return (g, ox, oy) => {
    const hx = ox + 8 + (opt.hdx || 0), hy = oy + 10 + (opt.hdy || 0); const c = Math.cos(ang), s = Math.sin(ang), len = opt.len || 6;
    if (opt.smear !== undefined) {
      for (let a = opt.smear; a < ang - 0.15; a += 0.08) for (const rr of [len - 1, len]) put(g, hx + Math.cos(a) * rr, hy + Math.sin(a) * rr, rr === len ? 'i' : 'j');
    }
    arm(g, ox, oy, hx, hy, ARMC[RT]);
    line(g, hx + c * 1.5, hy + s * 1.5, hx + c * len, hy + s * len, (x, y, i, n) => put(g, x, y, i === n - 1 ? 'w' : (i < 1 ? 'v' : 'w')));
    put(g, hx - s, hy + c, 'g'); put(g, hx + s, hy - c, 'g');           // cross-guard
    put(g, hx, hy, 'G');
  };
}

// ---------------- units ----------------
const UNITS = {
  horseman: { W: 24, H: 30, GY: 29, coat: 'bay', rider: 'horseman', build: {} },
  scout: { W: 24, H: 28, GY: 27, coat: 'chestnut', rider: 'scout', build: { barrelRy: 2.6, barrelRx: 5.6, rumpRx: 3.1, rumpRy: 3.0, chestRx: 2.5, chestRy: 2.8, neckRy: 1.6 } },
  knight: { W: 24, H: 30, GY: 29, coat: 'grey', rider: 'knight', barding: true, build: { barrelRy: 3.1 },
    headStamp: `
.wv...
wwvv..
vkvvV.
VvvvVx
.VV.xx
` },
};
const U = UNITS[which]; const fxo = -0.9; RT = U.rider;

function frames() {
  const F = { idle: [], walk: [], attack: [] };
  const GY = U.GY;
  const isK = U.rider === 'knight', isS = U.rider === 'scout';
  const wI = p => isS ? sword(1.0 + (p % 2) * 0.12) : spearVertical(isK ? p : null);
  const A = compose(U, { legs: standLegs(GY, fxo), tail: [0, 0], weapon: wI(0) });
  const B = compose(U, { legs: standLegs(GY, fxo), tail: [1.4, -1], mane: 1, weapon: wI(1), cape: 1 });
  const C = compose(U, { legs: standLegs(GY, fxo), tail: [0.6, 0], head: 1, breathe: 1, weapon: wI(0), cape: 0 });
  const D = compose(U, { legs: standLegs(GY, fxo, 2), tail: [-0.3, 0], mane: 2, weapon: wI(1), cape: 2 });
  F.idle = [A, A, B, C, C, D].map(x => text(x.g));
  const bobs = [0, 1, 1, 0, 0, -1, -1, 0];
  for (let k = 0; k < 8; k++) {
    const t = k / 8;
    const fr = compose(U, { legs: canterLegs(t, GY, fxo), bob: bobs[k], ry: bobs[(k + 7) % 8] - bobs[k], head: bobs[k] > 0 ? 1 : 0,
      tail: [-0.6 + 0.5 * Math.sin(k * 0.785), -2 + Math.cos(k * 0.785)], mane: k, phase: t, weapon: isS ? sword(-1.0 + (k % 2) * 0.15) : wI(k), cape: 1 + (k % 2) });
    F.walk.push(text(fr.g));
  }
  const atk = isS ? [
    { lean: 1, w: sword(0.35, { smear: -1.5, hdx: 1 }) },
    { lean: 1, w: sword(0.75, { hdx: 1, hdy: 1 }) },
    { lean: 0, w: sword(1.4, { hdy: 2 }) },
    { lean: 0, w: sword(-0.9) },
  ] : [
    { lean: 1, w: spearAt(0.03, isK ? 15 : 13, true, 5) },
    { lean: 1, w: spearAt(0.03, isK ? 14 : 12, false, 5) },
    { lean: 0, w: spearAt(-0.7, 10, false, 4) },
    { lean: 0, w: spearAt(-1.3, 11, false, 4) },
  ];
  atk.forEach((a, k) => F.attack.push(text(compose(U, { legs: standLegs(GY, fxo, k === 0 ? 2 : null), head: k === 0 ? -1 : 0, tail: [0.4, -0.5], lean: a.lean, weapon: a.w, cape: k }).g)));
  F.death = deathFrames();
  return F;
}


// ---------------- death ----------------
const HEADS = { horseman: ['kvxk', 'kssk'], scout: ['kHHk', 'kssk'], knight: ['kvvk', 'kxvk'] };
const TUNIC = { horseman: ['L', 'T', 'D'], scout: ['L', 'T', 'D'], knight: ['i', 'T', 'J'] };
function riderFall(g, x, y) {
  const [h0, h1] = HEADS[RT], [l, t, d] = TUNIC[RT];
  const lg = RT === 'knight' ? ['x', 'vV'] : ['q', 'Ee'];
  stamp(g, x, y, `
......kk.
.....k${lg[0]}${lg[0]}k
....k${lg[1]}${lg[1][1]}k.
...k${t}${t}k..
..k${l}${t}${t}k..
.k${l}${t}${d}k...
${h0}${d}k....
${h1}k.....
.kk......
`);
}
function riderLie(g, x, y) {
  const [h0, h1] = HEADS[RT], [l, t, d] = TUNIC[RT];
  stamp(g, x, y, `
.kk...........
${h0}kkkkkk.kkk.
${h1}${l}${t}${t}${t}${d}k${RT === 'knight' ? 'vvVx' : 'EEEq'}k
.kkk${d}${d}${d}${d}kkkkkqk
....kssk...kkk.
`);
}
const FORE_LIE = `
.bd.cd.
..bd.cd
...bdkk
....kk.
`, HIND_LIE = `
...cd.bd
..cd.bd.
.kk.bd..
...kk...
`;
function droppedWeapon(g, x, y) {
  if (RT === 'scout') { line(g, x, y, x + 5, y, 'w'); put(g, x - 1, y, 'g'); put(g, x - 1, y - 1, 'g'); put(g, x - 2, y, 'G'); return; }
  line(g, x, y, x + 12, y - 1, 'j'); put(g, x + 13, y - 1, 'w'); put(g, x + 14, y - 1, 'w');
}
function deathFrames() {
  const DW = 34, DH = 30, GY = U.GY, out = [];
  const base = { W: DW, H: DH };
  const T0 = { tx: 6, ty: U.H === 30 ? 0 : 2 };
  const lie = { bob: 8.6, legs: standLegs(GY, fxo), noLegs: true, neckAng: 0.85, neckDx: 1.6, neckDy: 3.6, headDx: 3.4, headDy: 9.2, noCrest: true,
    lying: true, headStamp: U.barding ? `
wv....
wvvvv.
vkvvVx
.VVVxx
` : `
ab....
abbbb.
bkbbbd
.cccdd
`, tail: [-3.2, -1.4] };
  const tx = T0.tx, ty = T0.ty;
  // 0 hit: head thrown up, rider jolts back
  out.push(compose(U, { ...base, T: T0, legs: standLegs(GY, fxo, 2), headDy: -1, neckAng: -0.1, tail: [1.4, -1.5], lean: -1, weapon: null }).g);
  // 1 rear
  out.push(compose(U, { ...base, T: { ang: -0.3, px: 6.5, py: GY, tx, ty }, legs: [[5.4, GY], [7.0, GY], [17.2, 22], [16.4, 23.5]], headDy: -0.5, tail: [1.6, -0.5], back: -1, lean: -1, weapon: null }).g);
  // 2 rear high, rider thrown off the back
  { const r = compose(U, { ...base, T: { ang: -0.5, px: 6.5, py: GY, tx, ty }, legs: [[5.0, GY], [6.8, GY], [17.4, 21.5], [16.0, 22.5]], headDy: 0.5, tail: [2.0, 0.5], noRider: true });
    riderFall(r.g, 0, 6 + ty); out.push(r.g); }
  // 3 collapsing onto the side, legs buckle
  { const r = compose(U, { ...base, T: { ang: 0.12, px: 12, py: GY, tx, ty: ty - 1 }, bob: 4.5, legs: [[2.5, GY], [4.5, GY - 1.5], [21, GY], [19, GY - 1.5]], neckAng: 0.45, neckDy: 1.8, neckDx: 0.8, headDx: 1.6, headDy: 4.5, tail: [-1.4, -1], noRider: true });
    riderFall(r.g, 0, 15 + ty); out.push(r.g); }
  // 4 impact, 5 bounce, 6 settled
  for (const [k, b] of [[4, 0], [5, -1], [6, 0]]) {
    const r = compose(U, { ...base, T: { tx, ty: ty - 5 + b }, ...lie, noRider: true, phase: 0.25 });
    stamp(r.g, 21, DH - 8 + b, FORE_LIE); stamp(r.g, 3, DH - 8 + b, HIND_LIE);
    if (k >= 5) droppedWeapon(r.g, RT === 'scout' ? 24 : 19, DH - 1);
    riderLie(r.g, 8, DH - 5 + (k === 5 ? -1 : 0));
    out.push(r.g);
  }
  return out.map(text);
}
const F = frames();
const pal = { ...BASE, ...HAIR, ...COATS[U.coat] };
const lit = a => a.map(f => '`' + f + '`').join(',\n');
fs.writeFileSync(OUT + 'pixel.' + which + '.js', `// @pixel ${which}
export default {
  id: '${which}', anchor: [${U.W / 2}, ${U.H}], anchors: { death: [18, 30] }, fps: { death: 10 },
  palette: ${JSON.stringify(pal)},
  frames: {
${Object.entries(F).map(([k, v]) => `    ${k}: [${lit(v)}],`).join('\n')}
  },
};
`);
console.log('wrote', which);
