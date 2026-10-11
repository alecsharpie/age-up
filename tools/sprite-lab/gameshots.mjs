// Screenshots of real AI games for whole-game art review: every seat's base and the busiest fight, at several zooms.
// env: SEED, PLAYERS (4), COLORS (0,1,2,3…), MAP (plains), SIZE (medium), MINS (3,10,20), ZOOMS (0.5,1,2), W/H, TAG, CIVS
// writes tools/sprite-lab/out/game/<tag>_m<min>_<what>_z<zoom>.png
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out/game'); fs.mkdirSync(out, { recursive: true });
const E = process.env, N = +(E.PLAYERS || 4), SEED = +(E.SEED || 7), TAG = E.TAG || `s${SEED}`;
const COLORS = (E.COLORS || [...Array(N).keys()].join(',')).split(',').map(Number);
const MINS = (E.MINS || '3,10,20').split(',').map(Number), ZOOMS = (E.ZOOMS || '0.5,1,2').split(',').map(Number);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: +(E.W || 1600), height: +(E.H || 1000) } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + path.resolve(here, E.HTML || '../../index.html')); await page.waitForFunction(() => !!window.dbg);
await page.evaluate(({ SEED, N, COLORS, MAP, SIZE, CIVS }) => {
  const extra = { players: N, mapSize: SIZE, mapType: MAP, colors: COLORS, pop: 200, teams: 'ffa', reveal: 'visible' };
  if (CIVS) extra.civs = CIVS.split(',');
  dbg.start(SEED, 3, extra); for (let t = 0; t < N; t++) dbg.ai(t, true);
}, { SEED, N, COLORS, MAP: E.MAP || 'plains', SIZE: E.SIZE || 'medium', CIVS: E.CIVS });
for (const min of MINS) {
  const spots = await page.evaluate((to) => {
    while (G.time < to * 60 && !G.over) update();
    const s = [];
    for (const p of G.players) { const th = G.buildings.find(b => b.team === p.team && b.type === 'townhall') || G.buildings.find(b => b.team === p.team); if (th) s.push({ what: 'base' + p.team, x: th.tx + 1, y: th.ty + 1 }) }
    // the densest mixed-team cluster = a fight
    const us = G.units.filter(u => u.team >= 0 && u.hp > 0); let best = null, bc = 0;
    for (const u of us) { const teams = new Set(); let c = 0; for (const v of us) if (Math.abs(v.x - u.x) + Math.abs(v.y - u.y) < 7) { c++; teams.add(v.team) } if (teams.size > 1 && c > bc) { bc = c; best = u } }
    if (best) s.push({ what: 'fight', x: best.x, y: best.y, n: bc });
    return s;
  }, min);
  for (const sp of spots) for (const z of ZOOMS) {
    await page.evaluate(({ sp, z }) => { G.vis[ME].fill(2); G.sel = []; document.getElementById('overlay').classList.add('hidden'); cam.zoom = z; centerOn(sp.x, sp.y); clampCam(); update(); G.vis[ME].fill(2); updateFog(); render() }, { sp, z });
    const full = E.HUD || (sp.what === 'base0' && z === 1);
    await page.screenshot({ path: path.join(out, `${TAG}_m${min}_${sp.what}_z${z}.png`), clip: full ? undefined : { x: 0, y: 40, width: +(E.W || 1600), height: +(E.H || 1000) - 280 } });
  }
  console.log('min', min, spots.map(s => s.what + (s.n ? `(${s.n})` : '')).join(' '), JSON.stringify(await page.evaluate(() => G.players.map(p => p.age).join(''))));
}
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await browser.close();
