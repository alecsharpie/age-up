// @pixel siegeship
// Siege ship (cannon galleon's ancestor): warship hull with a mangonel on deck. Small sail astern in team colour.
// Frames: idle (arm cocked), attack ×2 (cocked, released with the stone away).
const W = 36, H = 36;
function base() {
  const g = pixGrid(W, H);
  pixPoly(g, [[4, 27], [31, 27], [31, 29], [4, 29]], 'g');
  pixPoly(g, [[3, 29], [33, 29], [30, 36], [9, 36]], 'h');
  pixPoly(g, [[5, 32], [32, 32], [30, 36], [9, 36]], 'H');
  pixLine(g, 4, 30, 32, 30, 'p');
  for (const x of [7, 11, 27]) pixLine(g, x, 30, x + 4, 35, 'G');                 // oars
  pixLine(g, 32, 26, 33, 23, 'm'); pixLine(g, 4, 26, 4, 24, 'm');                  // posts
  pixLine(g, 9, 9, 9, 27, 'm'); pixLine(g, 5, 13, 14, 13, 'm'); pixStamp(g, 10, 9, 'TT\nT.');   // mast, yard, pennant
  pixPoly(g, [[6, 14], [13, 14], [15, 18], [13, 22], [7, 22]], 'T');               // sail
  pixLine(g, 6, 14, 7, 21, 'L'); pixLine(g, 13, 14, 15, 18, 'D'); pixLine(g, 15, 18, 13, 22, 'D'); pixLine(g, 7, 22, 13, 22, 'D');
  pixPoly(g, [[18, 24], [28, 24], [28, 27], [18, 27]], 'w');                       // mangonel bed (lit wood)
  pixLine(g, 18, 25, 28, 25, 'G');
  pixLine(g, 20, 19, 20, 24, 'w'); pixLine(g, 26, 19, 26, 24, 'w'); pixLine(g, 20, 19, 26, 19, 'G');   // uprights + crossbar
  pixStamp(g, 18, 26, 'S.S.S.S.S.S');                                              // wheel hubs
  pixStamp(g, 29, 21, 'kk\nss\nTT');                                               // crewman
  return g;
}
const cocked = base(); pixLine(cocked, 23, 20, 17, 13, 'm'); pixStamp(cocked, 15, 11, 'SS.\nSrS');     // arm back, stone in the bucket
const fired = base(); pixLine(fired, 23, 20, 29, 13, 'm'); pixStamp(fired, 28, 11, 'SS\nS.'); pixSet(fired, 32, 8, 'r'); pixSet(fired, 33, 7, 'r');   // arm up, stone away
export default {
  id: 'siegeship', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', G: '#5a3a18', m: '#3a2a1a', w: '#a07a3e', T: 'team', D: 'teamdark', L: 'teamlight', S: '#5c5c62', r: '#8d8d93', k: '#5a3a1a', s: '#e8c39e' },
  frames: { idle: [pixText(cocked)], attack: [pixText(cocked), pixText(fired)] },
};
