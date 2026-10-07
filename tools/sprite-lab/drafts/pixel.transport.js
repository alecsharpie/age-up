// @pixel transport
// Transport ship: wide flat hull, low sides with stakes and a rail, awning in team colour amidships, steering oar at the stern.
const W = 36, H = 36;
const g = pixGrid(W, H);
pixPoly(g, [[2, 27], [34, 27], [34, 29], [2, 29]], 'g');
pixPoly(g, [[1, 29], [35, 29], [32, 36], [6, 36]], 'h');
pixPoly(g, [[3, 32], [34, 32], [32, 36], [6, 36]], 'H');
pixLine(g, 2, 30, 34, 30, 'p');
for (let x = 3; x < 34; x += 4) pixLine(g, x, 24, x, 27, 'G');                 // stakes
pixLine(g, 2, 24, 34, 24, 'g');                                                // rail
pixPoly(g, [[12, 21], [27, 21], [27, 24], [12, 24]], 'T');                     // awning side
pixPoly(g, [[11, 19], [28, 19], [27, 21], [12, 21]], 'L');                     // awning top, lit
pixLine(g, 12, 24, 26, 24, 'D'); pixLine(g, 26, 19, 26, 24, 'D');
pixLine(g, 12, 24, 12, 27, 'm'); pixLine(g, 26, 24, 26, 27, 'm');             // awning posts
pixLine(g, 6, 14, 6, 24, 'm'); pixStamp(g, 7, 14, 'TT\nT.');                   // stern mast + pennant
pixLine(g, 3, 28, 0, 35, 'G');                                                 // steering oar
pixLine(g, 34, 26, 35, 23, 'm');                                               // bow curl
pixStamp(g, 29, 21, 'kk\nss\nTT');                                             // crewman at the bow
export default {
  id: 'transport', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', G: '#5a3a18', m: '#3a2a1a', T: 'team', D: 'teamdark', L: 'teamlight', k: '#5a3a1a', s: '#e8c39e' },
  frames: { idle: [pixText(g)] },
};
