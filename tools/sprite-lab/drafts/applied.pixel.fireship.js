// @pixel fireship
// Fire ship: short hull, iron brazier at the bow with flames (2 flicker frames), bigger blaze when attacking, team pennant astern.
const W = 36, H = 36;
function base() {
  const g = pixGrid(W, H);
  pixPoly(g, [[8, 28], [30, 28], [30, 30], [8, 30]], 'g');
  pixPoly(g, [[7, 30], [32, 30], [29, 36], [11, 36]], 'h');
  pixPoly(g, [[9, 33], [31, 33], [29, 36], [11, 36]], 'H');
  pixLine(g, 8, 31, 30, 31, 'p');
  pixLine(g, 9, 29, 29, 29, 'T'); pixLine(g, 9, 30, 29, 30, 'D');                 // team-colour trim along the gunwale
  pixLine(g, 10, 18, 10, 28, 'm'); pixStamp(g, 11, 18, 'TT\nT.');                 // mast + pennant
  pixPoly(g, [[24, 24], [30, 24], [30, 28], [24, 28]], 'S');                      // brazier box
  for (let x = 25; x <= 29; x += 2) pixLine(g, x, 24, x, 27, 's');                 // iron bars
  pixLine(g, 23, 28, 24, 25, 'S');                                                 // brace
  pixStamp(g, 14, 22, '.kk.\n.ss.\n.TT.\n.TT.');                                  // crewman
  return g;
}
const FIRE0 = `
.....F....
....FF.F..
...FFf.F..
..fFFff...
..fFffff..
.fffFfff..
.ffffff...
`;
const FIRE1 = `
...F......
..FF..F...
..FFfFF...
..fFFff...
.ffFfff...
.fffFfff..
..ffffff..
`;
const BIG0 = `
.....o....
....o.F...
...F.FF...
...FFFfF..
..FFFfff..
..fFFffff.
..fFffff..
.fffFfff..
.ffffff...
`;
const BIG1 = `
...o.....o
.....F.o..
...FF.F...
..FFFfFF..
..fFFfff..
.fFFffff..
..fFffff..
.fffFffff.
.fffffff..
`;
const i0 = base(); pixStamp(i0, 22, 17, FIRE0);
const i1 = base(); pixStamp(i1, 22, 17, FIRE1);
const a0 = base(); pixStamp(a0, 22, 15, BIG0);
const a1 = base(); pixStamp(a1, 22, 15, BIG1);
export default {
  id: 'fireship', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', m: '#3a2a1a', T: 'team', D: 'teamdark', L: 'teamlight', s: '#8d8d93', S: '#5c5c62', f: '#ff8c2a', F: '#ffd04a', o: '#8a8a86', k: '#5a3a1a' },
  frames: { idle: [pixText(i0), pixText(i1)], attack: [pixText(a0), pixText(a1)] },
};
