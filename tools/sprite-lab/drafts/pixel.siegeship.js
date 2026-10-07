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
  pixPoly(g, [[6, 14], [14, 14], [17, 19], [15, 23], [7, 23]], 'T');               // sail
  pixLine(g, 6, 14, 7, 22, 'L'); pixLine(g, 14, 14, 17, 19, 'D'); pixLine(g, 17, 19, 15, 23, 'D'); pixLine(g, 7, 23, 15, 23, 'D');
  pixPoly(g, [[17, 24], [28, 24], [28, 27], [17, 27]], 'G');                       // mangonel bed
  pixLine(g, 18, 23, 27, 23, 'm');
  pixLine(g, 20, 20, 20, 24, 'm'); pixLine(g, 25, 20, 25, 24, 'm'); pixLine(g, 20, 20, 25, 20, 'm');   // uprights + crossbar
  pixStamp(g, 29, 21, 'kk\nss\nTT');                                               // crewman
  return g;
}
const cocked = base(); pixLine(cocked, 22, 21, 15, 16, 'w'); pixStamp(cocked, 13, 14, 'SS\nSrS');     // arm back, stone in the bucket
const fired = base(); pixLine(fired, 22, 21, 28, 14, 'w'); pixStamp(fired, 27, 12, 'SS\nS.'); pixSet(fired, 32, 9, 'r'); pixSet(fired, 33, 8, 'r');   // arm up, stone away
export default {
  id: 'siegeship', anchor: [18, 36],
  palette: { h: '#6b4a2a', H: '#4a3520', p: '#5e3f22', g: '#8a6a3a', G: '#5a3a18', m: '#3a2a1a', w: '#a07a3e', T: 'team', D: 'teamdark', L: 'teamlight', S: '#5c5c62', r: '#8d8d93', k: '#5a3a1a', s: '#e8c39e' },
  frames: { idle: [pixText(cocked)], attack: [pixText(cocked), pixText(fired)] },
};
