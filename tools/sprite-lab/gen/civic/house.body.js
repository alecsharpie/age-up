const W = 2, H = 2, Z = 16, ROOF = 24, PL = 3;
const GW = (W + H) * 32 + 4, GH = (W + H) * 16 + Z + ROOF + 14;
const bx = W * 32 + 2, by = GH - 4;
const g = pixGrid(GW, GH);

// ---- walls: stone plinth, wattle-and-daub panels in a timber frame
const top = pixIsoBox(g, bx, by, W, H, Z, 1, { left: 'l', right: 'r' });
const B = top.base;
paint(g, 'l', (x, y) => { const h = wallH(B.L, B.Bm, x, y); return h < PL ? course(x, y, 0.5, { h: 3, w: 6, joint: 'j', tones: ['S', 'q', 'S'], lip: 'S' }) : (h > Z - 3 ? 'h' : (hash(x >> 2, Math.floor((y - 0.5 * x) / 3)) < 0.25 ? 'm' : 'l')); });
paint(g, 'r', (x, y) => { const h = wallH(B.Bm, B.Rr, x, y); return h < PL ? course(x, y, -0.5, { h: 3, w: 6, joint: 'j', tones: ['q', 'Q', 'q'], lip: 'q' }) : (h > Z - 3 ? 'H' : (hash(x >> 2, Math.floor((y + 0.5 * x) / 3)) < 0.25 ? 's' : 'r')); });
// timber frame: corner/mid posts, sill beam over the plinth, mid rail, braces
const post = (a, b, t, lit) => { const p = lerp(a, b, t); pixLine(g, p[0], p[1] - Z + 2, p[0], p[1] - PL, lit ? 't' : 'u'); pixLine(g, p[0] + 1, p[1] - Z + 2, p[0] + 1, p[1] - PL, lit ? 'u' : 'v'); };
for (const t of [0.02, 0.5, 0.97]) post(B.L, B.Bm, t, true);
for (const t of [0.5, 0.97]) post(B.Bm, B.Rr, t, false);
line(g, B.L, B.Bm, 't', -PL); line(g, B.L, B.Bm, 'u', -PL + 1);
line(g, B.Bm, B.Rr, 'u', -PL); line(g, B.Bm, B.Rr, 'v', -PL + 1);
line(g, B.L, B.Bm, 't', -9); line(g, B.Bm, B.Rr, 'u', -9);
{ const a = lerp(B.L, B.Bm, 0.53), b = lerp(B.L, B.Bm, 0.95); pixLine(g, a[0] + 2, a[1] - PL - 1, b[0] - 1, b[1] - 9, 'u'); pixLine(g, a[0] + 2, a[1] - PL - 2, b[0] - 1, b[1] - 10, 't'); }
{ const a = lerp(B.Bm, B.Rr, 0.53), b = lerp(B.Bm, B.Rr, 0.95); pixLine(g, a[0] + 2, a[1] - 9, b[0] - 1, b[1] - PL - 1, 'v'); }
// corner quoins on the front corner
for (let k = 0; k < Z - 3; k += 3) { pixRect(g, B.Bm[0] - 2, B.Bm[1] - k - 3, 2, 2, 'S'); pixRect(g, B.Bm[0], B.Bm[1] - k - 3, 2, 2, 'q'); pixSet(g, B.Bm[0] - 2, B.Bm[1] - k - 1, 'j'); pixSet(g, B.Bm[0] + 1, B.Bm[1] - k - 1, 'Q'); }
// window on the lit wall: deep recess, warm glow, team shutters, stone sill
const WIN = lerp(B.L, B.Bm, 0.27);
pixStamp(g, WIN[0] - 5, WIN[1] - 11, `
...vvvvv....
.TTvwwwvD...
.TLvwggvD...
.TLvwgGvDD..
.TTvwggvTD..
..DvvvvvTD..
...SSSSSqD..
.......qq...
`);
// door in team colour on the shaded wall: plank leaves, iron strap, dark frame and step
const DR = lerp(B.Bm, B.Rr, 0.3);
pixStamp(g, DR[0] - 4, DR[1] - 12, `
.vvvvvvv.
vLTTTDTDv
vLTTTDTDv
vLkkkkkDv
vLTTTDTDv
vLTTTTkDv
vLTTTDTDv
vLkkkkkDv
vLTTTDTDv
vDDDDDDDv
SSqqqqqQQ
`);
// a log pile against the lit wall, near the front corner
pixStamp(g, B.Bm[0] - 26, B.Bm[1] - 14, `
...kkkk..kkkk..
..kNnnnkkNnnnk.
..knnyntknnyntk
.kkkkkkkkkkkkkk
kNnnnkkNnnnkkk.
knnyntknnyntk..
.kkkkkkkkkkkk..
`);

// ---- roof: hipped thatch overhanging the walls, layered strands, dark eave, bound ridge
const OV = 1, DROP = 2;
const R = { L: [top.L[0] - OV, top.L[1] + DROP], Bm: [top.Bm[0], top.Bm[1] + DROP + 1], Rr: [top.Rr[0] + OV, top.Rr[1] + DROP], T: [top.T[0], top.T[1] - 1] };
const ap = pixIsoRoof(g, R, ROOF, 1, { back: '2', left: '3', front: '4', right: '5' });
paint(g, '3', (x, y) => thatch(x, y, -0.5, { h: 5, under: 'f', tones: ['1', 'A', 'A', 'A', 'A', 'f'], flip: true }));   // back slopes: flip
paint(g, '4', (x, y) => thatch(x, y, 0.5, { h: 5, under: 'a', tones: ['A', 'f', 'f', 'f', 'b'] }));
paint(g, '2', (x, y) => thatch(x, y, 0.5, { h: 5, under: 'c', tones: ['b', 'a', 'a', 'a'], flip: true }));
paint(g, '5', (x, y) => thatch(x, y, -0.5, { h: 5, under: 'd', tones: ['a', 'c', 'c', 'c'] }));
// eaves: a thick trimmed edge, darker on the shaded side
line(g, R.L, R.Bm, 'c', 0); line(g, R.L, R.Bm, 'e', 1); line(g, R.Bm, R.Rr, 'd', 0); line(g, R.Bm, R.Rr, 'e', 1);
// hips: a light rib on the lit side, a dark crease on the shaded side
line(g, R.L, ap, 'f'); line(g, R.L, ap, 'c', 1); line(g, R.Bm, ap, 'e'); line(g, [R.Bm[0] - 1, R.Bm[1]], [ap[0] - 1, ap[1]], 'f'); line(g, R.Rr, ap, 'd');
line(g, R.T, ap, 'b');
// bound ridge cap at the apex
pixStamp(g, ap[0] - 3, ap[1] - 2, `
.kkkkk.
k1fAAck
kebbbek
.kkkkk.
`);
// chimney: stone stack in courses on the shaded slope, sooty cap. The slope falls toward the Bm-Rr eave, i.e. along the stack's
// L->Bm edge, so the roof stands ROOF*0.24 px higher at its L corner than at Bm: the left face's foot follows the slope (cells
// below it are thatch in front of the stack, restored from `underCh`) with a dark seam where stone meets thatch.
const ch = lerp(lerp(R.Bm, R.Rr, 0.66), ap, 0.42);
const underCh = copy(g);
const chTop = pixIsoBox(g, ch[0], ch[1], 0.24, 0.24, 14, 1, { top: 'j', left: '6', right: '7' });
paint(g, '6', (x, y) => course(x, y, 0.5, { h: 3, w: 4, joint: 'Q', tones: ['S', 'q'] }));
paint(g, '7', (x, y) => course(x, y, -0.5, { h: 3, w: 4, joint: 'j', tones: ['q', 'Q'] }));
pixRect(g, chTop.T[0] - 1, chTop.T[1] + 1, 4, 2, 'k');
pixRect(g, chTop.L[0], chTop.L[1] + 3, Math.round(chTop.Rr[0] - chTop.L[0]) + 1, 1, 'e');
{ const rise = ROOF * 0.24, cL = ch[0] - 0.24 * 32;
  const hid = (x, y) => { const cx = x + 0.5, d = ch[0] - cx; return d > 0 && y + 0.5 > ch[1] - d * 0.5 - rise * d / (ch[0] - cL); };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underCh[y][x] && hid(x, y)) g[y][x] = underCh[y][x];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== underCh[y][x] && !hid(x, y) && hid(x, y + 1)) g[y][x] = 'j'; }

const base = outline(g, 'k', { '1': 'A', 'f': 'A', l: 'm', S: 'q' });

// ---- idle: 6 frames — chimney smoke curls up and drifts right, the window glow flickers
const sx = Math.round(chTop.T[0]), sy = Math.round(chTop.T[1]);
const puff = (f, x, y, r) => { // a soft round puff: light top-left, grey bottom-right
  if (r === 0) { pixRect(f, x, y, 2, 2, 'x'); pixSet(f, x, y, 'z'); return; }
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + r * 0.6) continue; pixSet(f, x + xx, y + yy, (xx + yy < 0) ? 'z' : (xx + yy > r ? 'X' : 'x')); }
};
const frames = [];
for (let i = 0; i < 6; i++) {
  const f = copy(base);
  for (let k = 0; k < 4; k++) { // puffs born at the chimney, rise 4 px per frame
    const t = ((i + k * 1.5) % 6) / 6, rise = 2 + t * 22;
    const r = t < 0.2 ? 0 : t < 0.75 ? 2 : 1;
    puff(f, sx + Math.round(Math.sin(t * 5) * 1.5 + t * 9), sy - Math.round(rise), r);
  }
  const fl = [0, 1, 0, 2, 1, 0][i]; // flicker: glow core moves / dims
  if (fl === 1) { pixSet(f, WIN[0] - 1, WIN[1] - 10, 'g'); pixSet(f, WIN[0], WIN[1] - 9, 'G'); }
  if (fl === 2) { pixSet(f, WIN[0], WIN[1] - 10, 'G'); pixSet(f, WIN[0], WIN[1] - 9, 'g'); pixSet(f, WIN[0] - 1, WIN[1] - 9, 'G'); }
  frames.push(pixText(f));
}

export default {
  id: 'house', kind: 'building', footprint: [W, H], anchor: [bx, by],
  palette: {
    k: '#24180f',                                                         // ink
    l: '#e8dcc0', m: '#d6c49c', h: '#a8946e',                             // daub lit wall: lit / mid / eave shadow
    r: '#b8a582', s: '#a6926c', H: '#7e6c4e',                             // daub shaded wall
    t: '#8a6a3a', u: '#5a3a18', v: '#3b2614',                             // timber light / mid / deep
    S: '#a39a8c', q: '#8d8478', Q: '#6f6a60', j: '#4f4a42',               // stone lit / mid / shade / mortar
    '1': '#f2d488', A: '#dcb056', f: '#c99a44', b: '#b8873a', a: '#9c7230', c: '#80592a', d: '#5f4220', e: '#3e2a14', // thatch
    w: '#3a2414', g: '#e89a3a', G: '#ffd36a',                             // window recess / firelight
    N: '#c09a62', n: '#8a6a3a', y: '#5a3a18',                             // log ends
    z: '#e4e0da', x: '#c4beb8', X: '#948e88',                             // smoke
    T: 'team', D: 'teamdark', L: 'teamlight',
  },
  frames: { idle: frames },
};
