// Shared light-horse rig (used by the horse archer). Local coords: horse facing right, ground at y=G.
import { ik, deg } from './lib.mjs';
export const G = 27.5;  // hoof centre row (cells y=27)
// legs: near fore, near hind, far fore, far hind
export const HIPS = { nf: [18.6, 18.2], nh: [7.4, 18.0], ff: [17.2, 18.2], fh: [8.6, 18.0] };
export function gaitFeet(f, n, opts = {}) {
  const duty = opts.duty ?? 0.5, S = opts.S ?? 2.6, lift = opts.lift ?? 3;
  const off = opts.off ?? { fh: 0, nh: 0.22, ff: 0.22, nf: 0.44 };
  const r = {};
  for (const k in off) {
    let p = ((f / n - off[k]) % 1 + 1) % 1; const hip = HIPS[k];
    let fx, fy, swing = false;
    if (p < duty) { fx = hip[0] + S - 2 * S * (p / duty); fy = G; }
    else { const q = (p - duty) / (1 - duty); const e = 0.5 - 0.5 * Math.cos(Math.PI * q); fx = hip[0] - S + 2 * S * e; fy = G - (k[1] === 'f' ? lift : lift * 0.75) * Math.sin(Math.PI * q); swing = true;
      if (k[1] === 'f') fx -= 1.6 * Math.sin(Math.PI * q); }
    r[k] = { foot: [fx, fy], swing };
  }
  return r;
}
// draw one leg; mat = material for the leg, hoof mat
export function leg(cv, hip, foot, kind, mat, hoof, sock) {
  const fore = kind === 'f';
  const a = fore ? 4.9 : 5.3, b = fore ? 4.7 : 4.9;
  const [j] = ik(hip, foot, a, b, fore ? 1 : -1);
  // upper: forearm / gaskin, thick
  cv.capsule(hip, j, fore ? 1.15 : 1.35, mat, fore ? 0.9 : 0.85);
  // lower: cannon + pastern, 2 px
  cv.capsule(j, [foot[0], foot[1] - 0.6], 0.78, sock || mat);
  // hoof: 2 cells
  const hx = Math.floor(foot[0] - 0.5), hy = Math.floor(foot[1]);
  cv.px(hx, hy, hoof); cv.px(hx + 1, hy, hoof);
}
/** Horse body, neck and head. o: {neck: angle (rad, + = head down), ear: 0|1 (back), tail: [[x,y]...], mouth} */
// hand-painted head + neck (local x 15..25, y 4..16); chars are horse tones, grouped with the body for shading
export const HEAD = `
......h....
.....rH....
....nrhH...
...nnrhhhh.
..nnrhhohhh
.nnrhhhhhhh
nnrhhhHHhhF
nrhhhH.HHH.
rhhhhH.....
hhhhhH.....
hhhhhH.....
hhhhhH.....
hhhhH......
`;
export const HEAD_EARBACK = HEAD.replace('\n......h....\n.....rH....\n', '\n...........\n....hH.....\n');
export const HEADMAP = { h: 'hd_h', r: 'hd_r', H: 'hd_H', n: 'mane', o: 'eye', F: 'nostril' };
export function body(cv, o = {}) {
  const H = 'horse';  // body uses a 2-row belly shade band
  cv.ellipse(6.9, 15.8, 3.9, 3.5, H);       // hindquarters
  cv.ellipse(12.4, 16.7, 7.4, 3.4, H);      // barrel
  cv.ellipse(18.0, 16.3, 3.0, 3.3, H);      // chest/shoulder
  cv.save(); cv.rotate(o.neck || 0, 17.5, 14.5);
  cv.poly([[15.2, 13.4], [16.6, 11.6], [20.0, 15.0], [20.4, 18.2], [16.6, 18.4]], H);   // neck root into the chest
  cv.stampT(15 + (o.hx || 0), 4 + (o.hy || 0), o.ear ? HEAD_EARBACK : HEAD, HEADMAP);
  cv.px(15, 12, 'mane'); cv.px(14, 13, 'mane'); cv.px(13, 13, 'mane');
  if (o.mane) cv.px(o.mane[0], o.mane[1], 'mane');
  cv.restore();
  // tail
  const t = o.tail || [[3.6, 14.0], [2.0, 16.2], [1.6, 19.6]];
  cv.line(t, 0.85, 'mane');
}
