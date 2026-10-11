// Team-colour line-up in the real game: one building (or unit) type for all 8 player colours × the four ages, on cleared grass,
// shot at several zooms. The question it answers: can you tell whose it is at a glance, at every zoom and age?
// usage (repo root): node tools/sprite-lab/lineup.mjs [type,type…|units|buildings] [--zooms 0.5,1,2] [--html path] [--tag t]
// writes tools/sprite-lab/out/lineup/<tag><type>_z<zoom>.png  (units: rows = unit types, cols = teams)
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out/lineup'); fs.mkdirSync(out, { recursive: true });
const argv = process.argv.slice(2); const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv.splice(i, 2)[1] : d };
const ZOOMS = opt('zooms', '0.5,1,2').split(',').map(Number), HTML = opt('html', path.resolve(here, '../../index.html')), TAG = opt('tag', '');
const BUILDINGS = ['house', 'townhall', 'farm', 'lumber', 'mine', 'mill', 'dock', 'market', 'barracks', 'archery', 'stable', 'smith', 'siege', 'temple', 'outpost', 'tower', 'wall', 'gate', 'keep', 'btower', 'wonder'];
let types = (argv[0] || 'buildings'); types = types === 'buildings' ? BUILDINGS : types.split(',');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + HTML); await page.waitForFunction(() => !!window.dbg);
await page.evaluate(() => {
  dbg.start(3, 2, { players: 8, mapType: 'plains', mapSize: 'large', teams: 'ffa', reveal: 'visible' }); window.endGame = () => {}; G.msgs = [];
  for (const p of G.players) p.ai = false;
  for (const r of G.resources.slice()) removeResource(r);
  for (const b of G.buildings.slice()) removeBuilding(b);
  G.units = []; G.terrain.fill(0); G.block.fill(0); G.bAt.fill(null); G.rAt.fill(null); G.elev.fill(0); terrainCv = null;
  buildGrid(); G.vis[ME].fill(2); updateFog();
  window.__clear = () => { for (const b of G.buildings.slice()) removeBuilding(b); G.units = []; G.projectiles = []; G.effects = []; buildGrid() };
});
const shoot = async (name, cx, cy) => {
  for (const z of ZOOMS) {
    await page.evaluate(({ z, cx, cy }) => { document.getElementById('overlay').classList.add('hidden'); G.sel = []; cam.zoom = z; centerOn(cx, cy); clampCam(); G.vis[ME].fill(2); updateFog(); render() }, { z, cx, cy });
    await page.screenshot({ path: path.join(out, `${TAG}${name}_z${z}.png`), clip: { x: 0, y: 40, width: 1600, height: 720 } });
  }
};
for (const t of types) {
  if (t === 'units') {
    const c = await page.evaluate(() => {
      __clear(); const ut = Object.keys(UNITS).filter(k => !/^(fishing|transport|warship|fireship|siegeship)$/.test(k));
      ut.forEach((k, r) => { for (let tm = 0; tm < 8; tm++) { const u = makeUnit(k, tm, 14 + tm * 1.6, 14 + r * 1.1); u.facing = 1 } });
      for (let i = 0; i < 4; i++) update(); return { x: 14 + 5.6, y: 14 + ut.length * 0.55 };
    });
    await shoot('units', c.x, c.y); continue;
  }
  const c = await page.evaluate((t) => {
    __clear(); const d = BUILDINGS[t], s = Math.max(d.w, d.h) + 1, x0 = 10, y0 = 10;
    for (let a = 0; a < 4; a++) for (let tm = 0; tm < 8; tm++) { const b = makeBuilding(t, tm, x0 + tm * s, y0 + a * s, true); b.age = a; b.hp = b.maxHp || b.hp }
    buildGrid(); for (let i = 0; i < 3; i++) update(); return { x: x0 + 4 * s, y: y0 + 2 * s };
  }, t);
  await shoot(t, c.x, c.y);
}
console.log('wrote', out, errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await browser.close();
