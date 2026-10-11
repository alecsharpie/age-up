import { grid, set, get, line, stamp, outline, toStr, parse } from './rig.mjs';
import fs from 'fs';

export const PAL = {
  k: '#24180f', n: '#1e2a33',
  a: '#f2d2b0', s: '#e8c39e', S: '#c9a07a', z: '#8a5a3a',
  H: '#7a5030', h: '#5a3a1a', j: '#3b2a1a',
  T: 'team', D: 'teamdark', L: 'teamlight',
  w: '#a07a4a', W: '#8a6a3a', b: '#5a3a18', B: '#3b2614',
  c: '#efe6d2', C: '#d9c7a0', q: '#a8946e',
  m: '#e6eaee', M: '#9aa0a6', N: '#5f656c',
  g: '#ffe28a', G: '#e1b12c', y: '#a87a12',
  r: '#d8463a', R: '#8e2a22', e: '#6fae3c', E: '#3f7a2a',
  o: '#c8c2b4', O: '#948d80', Q: '#5e584e',
};

const HEAD = `
.HHH.
HHhaa
hSsks
hssss
.SSS.`;
const HEAD_BLINK = HEAD.replace('sks', 'sSs');
const TORSO = `
LLsSTD
LTTTTD
LTTTDD
LTTTDD
BbbGbB
LTTTDD
DDDDDD`;   // team-dark hem: the tunic keeps a dark lower edge on same-hue ground (yellow on wheat)

// leg: hip (x,y) → foot (fx, bottom row fb); tones [left,right]; knee bends forward when foot is lifted or legs crouch
function leg(g, hx, hy, fx, fb, tones, bend = 0) {
  const ay = fb - 2;                          // ankle row (boot occupies fb-1..fb)
  const kx = Math.round((hx + fx) / 2 + bend), ky = Math.round((hy + ay) / 2);
  const paint = (x0, y0, x1, y1) => { for (const [x, y] of line(null, x0, y0, x1, y1)) { set(g, x, y, tones[0]); set(g, x + 1, y, tones[1]); } };
  paint(hx, hy, kx, ky); paint(kx, ky, fx, ay);
  set(g, fx, fb - 1, 'B'); set(g, fx + 1, fb - 1, 'B');
  set(g, fx, fb, 'B'); set(g, fx + 1, fb, 'B'); set(g, fx + 2, fb, 'B');
}
// arm: shoulder → hand, straight 1-px; first part sleeve, rest skin; hand pixel
function arm(g, sx, sy, hx, hy, sleeve, skin, elbow) {
  const pts = elbow ? [...line(null, sx, sy, elbow[0], elbow[1]), ...line(null, elbow[0], elbow[1], hx, hy).slice(1)] : line(null, sx, sy, hx, hy);
  const ns = Math.max(1, Math.round(pts.length * 0.35));
  pts.forEach(([x, y], i) => set(g, x, y, i < ns ? sleeve : skin));
}

/** overlay: {y0, art} rows of chars; '+' front hand, '*' back hand; returns hand positions */
function readOverlay(ov) {
  const hands = {}; const px = [];
  if (!ov) return { hands, px };
  parse(ov.art).forEach((r, j) => r.forEach((c, i) => {
    const x = i + (ov.x0 || 0), y = j + ov.y0;
    if (c === '+') hands.front = [x, y]; else if (c === '*') hands.back = [x, y]; else if (c !== '.' && c !== ' ') px.push([x, y, c]);
  }));
  return { hands, px };
}

/**
 * Pose: bob (body down px), lean (upper body x shift), headDx/headDy extra, legs {near:[fx,lift,bend], far:[...]} absolute foot x,
 * front/back hand [x,y] (or from tool overlay), tool overlay, blink, crouch (hip lower).
 */
export function figure(p) {
  const g = grid();
  const bob = p.bob || 0, lean = p.lean || 0, hipY = 15 + bob + (p.crouch || 0);
  const ov = readOverlay(p.tool);
  const front = ov.hands.front || p.front || [11, 14 + bob], back = ov.hands.back || p.back || [4, 14 + bob];
  const upY = 8 + bob + (p.crouch || 0) + (p.stoop || 0);
  // far (back) arm first, behind everything
  arm(g, 4 + lean, upY + 1, back[0], back[1], 'D', 'S', p.backElbow);
  // legs
  const legs = p.legs || { near: [5, 0], far: [8, 0] };
  const L1 = legs.far, L2 = legs.near;
  leg(g, 7, hipY, L1[0], 22 - (L1[1] || 0), ['W', 'b'], L1[2] || 0);
  leg(g, 6, hipY, L2[0], 22 - (L2[1] || 0), ['w', 'W'], L2[2] || 0);
  // torso (upper rows lean; skirt follows hips)
  parse(TORSO).forEach((r, j) => r.forEach((c, i) => { const sh = j < 4 ? lean : j < 5 ? Math.round(lean / 2) : 0; set(g, 5 + i + sh, upY + j, c); }));
  // head
  parse(p.blink ? HEAD_BLINK : HEAD).forEach((r, j) => r.forEach((c, i) => { if (c !== '.') set(g, 6 + lean + (p.headDx || 0) + i, upY - 5 + (p.headDy || 0) + j, c); }));
  // front arm over torso
  arm(g, 11 + lean, upY + 1, front[0], front[1], 'T', 's', p.frontElbow);
  set(g, front[0], front[1], 's'); set(g, back[0], back[1], 'S');
  if (p.extra) for (const [x, y, c] of p.extra) set(g, x, y, c);
  if (p.raw) return { g, tool: ov.px };
  let o = outline(g, n => 'k');
  // hair-coloured outline on the top of the head (selective outline)
  for (let y = 0; y < o.length; y++) for (let x = 0; x < o[0].length; x++) if (o[y][x] === 'k' && 'Hh'.includes(get(g, x, y + 1))) o[y][x] = 'j';
  // tool layer: not outlined (carries its own ink)
  toolLayer(o, ov.px);
  if (p.after) p.after(o);
  return o;
}

/** tool pixels go over the outlined body; steel heads get their own steel-ink outline where they meet empty space */
export function toolLayer(o, px) {
  for (const [x, y, c] of px) set(o, x, y, c);
  for (const [x, y, c] of px) if ('mMN'.includes(c)) for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) if (get(o, a, b) === '.') set(o, a, b, 'n');
}
// ---------- walk ----------
const WX = [3, 2, 0, -2, -3, -2, 0, 2], WL = [0, 0, 0, 0, 0, 1, 2, 1], BOB = [0, 1, 0, -1, 0, 1, 0, -1];
export function walkFrame(f, opt = {}) {
  const a = f % 8, b = (f + 4) % 8;
  const near = [6 + WX[a], WL[a], WL[a] ? 1 : 0], far = [7 + WX[b], WL[b], WL[b] ? 1 : 0];
  const bob = BOB[f % 8];
  // arms opposite legs: front (right) arm swings with far leg
  const fs = Math.sign(WX[b]) * (Math.abs(WX[b]) >= 2 ? 1 : 0), bs = Math.sign(WX[a]) * (Math.abs(WX[a]) >= 2 ? 1 : 0);
  return figure({ bob, legs: { near, far }, front: [11 + fs, 14 + bob - (fs > 0 ? 1 : 0)], back: [4 + bs, 14 + bob - (bs < 0 ? 1 : 0)], ...opt });
}

if (process.argv[1] && process.argv[1].endsWith('/villager.mjs')) {
  const out = { idle: [figure({}), figure({ bob: 0, blink: true })], walk: [0, 1, 2, 3, 4, 5, 6, 7].map(f => walkFrame(f)) };
  for (const [k, l] of Object.entries(out)) l.forEach((g, i) => console.log(k, i + toStr(g)));
}
