// @pixel relic
// Relic: a gilt reliquary casket (a chasse) — a little gold house with a scale-tiled roof, a cresting ridge and a cross,
// three enamelled niches (blue, red, blue) between gold pillars, a moulded base on four ball feet. Precious and glowing:
// the code draws a pulsing gold halo (pixRelic in drafts/helpers.js); the painted frames add glints that travel round it.
// Sets: idle (on the ground, 6 frames: a sparkle orbits and the gilt glints), carry (held at the chest by a monk, the
// monk's hands on its sides, 4 frames), icon (the small casket alone, for relics shown stored in a temple, 2 frames).
// Neutral: no team colour (relics belong to nobody until a temple holds them).
const IDLE = `
...................
...................
...................
.........k.........
........kyk........
.......kyYgk.......
........kgk........
......kkkGkkkk.....
.....kyyYygggGk....
....kyYyygggggok...
...kyyyygggggGGok..
...kkkkkkkkkkkkok..
...kyGGyGGyGGgGok..
...kybByrRybBgGok..
...kybYyrYybYgGok..
...kyBByRRyBBgGok..
...kkkkkkkkkkkkok..
...kYyyyyggggGGGk..
....kok......kok...
`;
const CARRY = `
....k....
...kyk...
..kyYgk..
.kyyggGk.
.kkkkkkk.
skbyryBks
.kYyggGk.
..k...k..
`;
const ICON = `
...k...
..kyk..
.kyYGk.
kyyggGk
kkkkkkk
kbyryBk
kYyggGk
.k...k.
`;
const rows = t => t.replace(/^\n+|\n+$/g, '').split('\n').map(r => r.split(''));
const txt = g => '\n' + g.map(r => r.join('')).join('\n') + '\n';
const put = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length && g[y][x] === '.') g[y][x] = c; };
/** A four-pointed sparkle (only on empty cells): size 1 = a plus of 5, size 2 = longer arms with a white core. */
const spark = (g, x, y, s) => { put(g, x, y, 'Y'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { put(g, x + dx, y + dy, 'y'); if (s > 1) put(g, x + 2 * dx, y + 2 * dy, 'g'); } };
/** Swap the gilt glint highlights along the roof and base from frame to frame so the gold shimmers. */
const shimmer = (g, i) => { const out = g.map(r => r.slice()); const pts = []; out.forEach((r, y) => r.forEach((c, x) => { if (c === 'y' || c === 'Y') pts.push([x, y]); }));
  pts.forEach(([x, y], k) => { if ((x + y + i) % 5 === 0) out[y][x] = 'Y'; else if (out[y][x] === 'Y' && (x + y + i) % 5 === 2) out[y][x] = 'y'; }); return out; };
// sparkle path round the casket (clockwise from the upper left), with a second small one trailing half a turn behind
const ORBIT = [[3, 5, 2], [13, 3, 1], [16, 7, 2], [17, 14, 1], [1, 15, 1], [1, 9, 1]];
const idle = [];
for (let i = 0; i < 6; i++) {
  const g = shimmer(rows(IDLE), i); const [x, y, s] = ORBIT[i]; spark(g, x, y, s);
  const [x2, y2] = ORBIT[(i + 3) % 6]; if (i % 2 === 0) put(g, x2, y2, 'Y');
  idle.push(txt(g));
}
const carry = [0, 1, 2, 3].map(i => txt(shimmer(rows(CARRY), i)));
const icon = [0, 2].map(i => txt(shimmer(rows(ICON), i)));
export default {
  id: 'relic', anchor: [9, 19], anchors: { carry: [4, 8], icon: [3, 8] }, fps: { idle: 6, carry: 6, icon: 3 },
  palette: {
    k: '#24180f',                                                   // ink
    Y: '#fff6c0', y: '#ffe28a', g: '#e1b12c', G: '#a87a12', o: '#6e4a0a', // gilt: glint / light / mid / shade / deep
    b: '#3f6fb8', B: '#24407a', r: '#c0392b', R: '#7a1f18',             // champlevé enamel: blue, red
    s: '#e8c39e',                                                   // the monk's hands on the casket
  },
  frames: { idle, carry, icon },
};
