// Where one update() spends its time at minute MIN (default 19): per-phase timings, then a CPU profile of the hottest functions.
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const url = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../index.html');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const cdp = await page.context().newCDPSession(page);
await page.goto(url); await page.waitForFunction(() => !!window.dbg);
const MIN = +(process.env.MIN || 19);
await page.evaluate((m) => { dbg.start(11, 4, { players: 4, mapSize: 'large', pop: 200, mapType: 'plains' }); dbg.ai(0, true); while (G.time < m * 60 && !G.over) update(); }, MIN);
// per-phase timing by wrapping globals
const phases = await page.evaluate(() => {
  const names = ['aiThink', 'updateBuilding', 'updateUnit', 'separation', 'updateProjectiles', 'updateVis', 'checkWin', 'buildGrid'];
  const acc = {}; for (const n of names) { const f = window[n]; acc[n] = 0; window[n] = function (...a) { const t = performance.now(); try { return f.apply(this, a) } finally { acc[n] += performance.now() - t } } }
  const t = performance.now(); for (let i = 0; i < 400 && !G.over; i++) update(); const tot = performance.now() - t;
  for (const n of names) acc[n] = +(acc[n] / 400).toFixed(3); return { perTick: +(tot / 400).toFixed(3), ...acc, units: G.units.length, blds: G.buildings.length };
});
console.log(phases);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start');
await page.evaluate(() => { for (let i = 0; i < 400 && !G.over; i++) update(); });
const { profile } = await cdp.send('Profiler.stop');
const self = {}; const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map(n => [n.id, n]));
for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const k = n.callFrame.functionName + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + (dt[i] || 0) }
const tot = Object.values(self).reduce((a, b) => a + b, 0);
console.log(Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `${(100 * v / tot).toFixed(1)}%  ${k}`).join('\n'));
await browser.close();
