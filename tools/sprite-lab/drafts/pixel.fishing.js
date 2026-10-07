// @pixel fishing
// Fishing ship: small hull, lateen sail in team colour, a fisherman, net with cork floats hanging over the starboard side.
const W = 36, H = 36;
const g = pixGrid(W, H);
pixPoly(g, [[8, 29], [28, 29], [28, 31], [8, 31]], 'g');
pixPoly(g, [[7, 31], [29, 31], [26, 36], [11, 36]], 'h');
pixPoly(g, [[9, 33], [28, 33], [26, 36], [11, 36]], 'H');
pixLine(g, 8, 32, 28, 32, 'p');
pixLine(g, 28, 28, 29, 26, 'm'); pixLine(g, 7, 28, 7, 27, 'm');                 // bow and stern posts
pixLine(g, 13, 13, 13, 29, 'm'); pixStamp(g, 14, 13, 'TT\nT.');                  // mast + pennant
pixPoly(g, [[14, 15], [14, 26], [24, 22]], 'T');                                 // lateen sail
pixLine(g, 14, 15, 14, 26, 'L'); pixLine(g, 14, 26, 24, 22, 'D');
pixLine(g, 13, 26, 25, 22, 'm');                                                 // boom
for (let y = 27; y <= 33; y++) for (let x = 24; x <= 31; x++) if ((x + y) % 2 === 0 && x - 24 <= (33 - y) + 3) pixSet(g, x, y, 'n');   // net mesh
pixStamp(g, 23, 27, 'o.o.o');                                                    // cork floats
pixStamp(g, 17, 22, '.kk.\n.ss.\n.TT.\n.TT.\n.pp.');                            // fisherman at the mast
export default {
  id: 'fishing', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', m: '#3a2a1a', T: 'team', D: 'teamdark', L: 'teamlight', n: '#dfe3e6', o: '#c9a24a', k: '#5a3a1a', s: '#e8c39e' },
  frames: { idle: [pixText(g)] },
};
