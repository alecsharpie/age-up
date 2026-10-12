// Minimal game-state stubs so the extracted draw functions can run outside the game.
// Loaded as a classic script BEFORE /api/game.js so these are plain globals the game code can see.
var G = { time: 0 };          // draw code reads G.time for animation
var ctx = null;               // the game's single 2D context; the lab points it at whatever canvas it is drawing
function player(t) { return { techs: {}, civ: null, team: t }; }
function bldHp(b) { return BUILDINGS[b.type].hp; }
function unitStat(u, k) { const d = UNITS[u.type]; return k === 'maxhp' ? d.hp : (d[k] || 0); }
function civ() { return {}; }
// The world renderer (terrain, water, render FX) reads these; the lab's mini maps set them while they draw.
var ME = 0;                   // whose eyes: every lab tile is seen (G.vis[0] filled with 2)
var cam = { x: 0, y: 0, zoom: 1 }, W = 0, H = 0;   // camera + screen size, as the game's render() has them
function allied(a, b) { return true; }
function exploredBy(t, x, y) { return true; }
function visibleTo(t, x, y) { return true; }
