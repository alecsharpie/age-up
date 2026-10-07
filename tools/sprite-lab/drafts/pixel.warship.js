// @pixel warship
// Galley: long hull, metal ram at the prow, five oars, square sail billowing in team colour. Faces right; waterline = anchor row.
// Generated hull/sail from the kit, hand-stamped details. Frames: idle, attack ×2 (volley of arrows).
const W = 36, H = 36;
function base() {
  const g = pixGrid(W, H);
  pixPoly(g, [[2, 27], [32, 27], [32, 29], [2, 29]], 'g');          // gunwale
  pixPoly(g, [[1, 29], [34, 29], [31, 36], [8, 36]], 'h');          // hull down to the waterline
  pixPoly(g, [[3, 32], [33, 32], [31, 36], [8, 36]], 'H');          // lower hull in shade
  pixLine(g, 2, 30, 33, 30, 'p');                                    // plank seam
  pixPoly(g, [[32, 31], [36, 33], [36, 35], [31, 36]], 's');         // ram
  pixLine(g, 33, 34, 35, 35, 'S');
  pixLine(g, 2, 26, 2, 23, 'm'); pixSet(g, 3, 22, 'm');             // stern post
  for (const x of [6, 10, 14, 22, 26]) pixLine(g, x, 30, x + 4, 35, 'G');   // oars
  pixLine(g, 16, 7, 16, 27, 'm'); pixLine(g, 10, 11, 23, 11, 'm');  // mast, yard
  pixStamp(g, 17, 7, 'TT\nT.');                                      // pennant
  pixPoly(g, [[12, 12], [23, 12], [28, 18], [24, 24], [13, 24]], 'T');   // sail
  pixLine(g, 12, 12, 13, 23, 'L'); pixLine(g, 13, 12, 13, 16, 'L');
  pixLine(g, 23, 12, 28, 18, 'D'); pixLine(g, 28, 18, 24, 24, 'D'); pixLine(g, 13, 24, 24, 24, 'D');
  pixStamp(g, 5, 23, '.kk\n.ss\n.TT'); pixStamp(g, 29, 23, 'kk.\nss.\nTT.');   // two crew heads at the rails
  return g;
}
const idle = base();
const a0 = base(); for (const x of [6, 11, 21, 26]) pixLine(a0, x, 26, x + 1, 24, 'r');                    // arrows nocked, pointing up
const a1 = base(); pixLine(a1, 29, 22, 32, 19, 'r'); pixLine(a1, 31, 24, 34, 21, 'r'); pixLine(a1, 27, 20, 30, 17, 'r');   // arrows away
export default {
  id: 'warship', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', G: '#5a3a18', m: '#3a2a1a', T: 'team', D: 'teamdark', L: 'teamlight', s: '#8d8d93', S: '#5c5c62', r: '#e8dcc0', k: '#5a3a1a' },
  frames: { idle: [pixText(idle)], attack: [pixText(a0), pixText(a1)] },
};
