// Lists units whose path searches keep failing over 20 s at minute 19 (the unreachable-resource loop in PERFORMANCE.md).
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const url = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../index.html');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
await page.goto(url); await page.waitForFunction(() => !!window.dbg);
const r = await page.evaluate(() => {
  dbg.start(11, 4, { players: 4, mapSize: 'large', pop: 200, mapType: 'plains' }); dbg.ai(0, true); while (G.time < 19 * 60) update();
  const f = window.findPath; const ids = new Map(); let cur = null;
  const uu = window.updateUnit; window.updateUnit = function (u) { cur = u; return uu(u) };
  window.findPath = function (...a) { const r = f(...a); if (!r.complete && cur) { const e = ids.get(cur.id) || { n: 0, team: cur.team, tgt: new Set(), start: [cur.x, cur.y] }; e.n++; if (cur.target) e.tgt.add(cur.target.id + ':' + (cur.target.res || cur.target.type)); ids.set(cur.id, e) } return r };
  const before = {}; for (const u of G.units) if (u.type === 'villager') before[u.id] = [u.x, u.y];
  const gath0 = G.players.map(p => p.stats.gathered);
  for (let i = 0; i < 400; i++) update();
  const list = [...ids.entries()].sort((a, b) => b[1].n - a[1].n);
  const vills = G.units.filter(u => u.type === 'villager').length;
  return { distinctUnits: list.length, villagers: vills, top: list.slice(0, 8).map(([id, e]) => ({ id, team: e.team, fails: e.n, targets: [...e.tgt].slice(0, 4), moved: (() => { const u = G.units.find(x => x.id === id); return u ? Math.hypot(u.x - e.start[0], u.y - e.start[1]).toFixed(1) : 'dead' })() })) };
});
console.log(JSON.stringify(r, null, 1)); await browser.close();
