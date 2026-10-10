// Late-game benchmark: 4 hardest AIs on a large plains map, timing update(), render(), the side panels and long paths
// at each checkpoint minute. Env: THROTTLE=4 (CPU slowdown), VW/VH (viewport), MINS=1,5,10 (checkpoints).
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const url = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../index.html');
const THROTTLE = +(process.env.THROTTLE || 1);
const VW = +(process.env.VW || 1920), VH = +(process.env.VH || 1080);
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--enable-gpu-rasterization','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
const errs = []; page.on('pageerror', e => errs.push(e.message));
const t0 = Date.now(); await page.goto(url); await page.waitForFunction(() => !!window.dbg);
console.log('load ms', Date.now() - t0);
const m0 = await cdp.send('Performance.getMetrics'); const g = k => m0.metrics.find(x => x.name === k)?.value;
console.log('heap after load MB', (g('JSHeapUsedSize') / 1e6).toFixed(1), 'scriptDuration s', g('ScriptDuration')?.toFixed(2));
if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await page.evaluate(() => { dbg.start(11, 4, { players: 4, mapSize: 'large', pop: 200, mapType: 'plains' }); dbg.ai(0, true); });
const checkpoints = (process.env.MINS || '1,5,10,15,20,25,30').split(',').map(Number);
let done = 0;
for (const min of checkpoints) {
  const r = await page.evaluate(async ({ to }) => {
    while (G.time < to * 60 && !G.over) update();
    // sim timing over 200 ticks
    const ts = []; for (let i = 0; i < 200 && !G.over; i++) { const a = performance.now(); update(); ts.push(performance.now() - a); }
    ts.sort((a, b) => a - b);
    // render timing: centre camera on densest player-0 area
    const mine = G.units.filter(u => u.team >= 0); let best = mine[0], bc = -1;
    for (const u of mine.slice(0, 400)) { let c = 0; for (const v of mine) if (Math.abs(v.x - u.x) + Math.abs(v.y - u.y) < 12) c++; if (c > bc) { bc = c; best = u } }
    G.vis[0].fill(2); // see everything so everything draws
    if (best) centerOn(best.x, best.y);
    const out = {};
    for (const z of [1, 0.5]) {
      cam.zoom = z; clampCam(); render(); render();
      const rs = []; for (let i = 0; i < 60; i++) { const a = performance.now(); render(); rs.push(performance.now() - a); }
      rs.sort((a, b) => a - b); out['render_z' + z] = [rs[30].toFixed(2), rs[57].toFixed(2)];
    }
    cam.zoom = 1;
    // DOM panel refresh cost
    setSel(G.units.filter(u => u.team === 0 && u.type !== 'villager').slice(0, 60));
    const ds = []; for (let i = 0; i < 20; i++) { const a = performance.now(); renderCmds(); renderInfo(); updateTop(); ds.push(performance.now() - a); } ds.sort((a, b) => a - b);
    const pf = []; const vs = G.units.filter(u => u.type === 'villager').slice(0, 50);
    for (const u of vs) { const a = performance.now(); findPath(Math.floor(u.x), Math.floor(u.y), { x0: MAP - 3, y0: MAP - 3, x1: MAP - 2, y1: MAP - 2 }, false, u.team, false); pf.push(performance.now() - a) } pf.sort((a, b) => a - b);
    return { t: Math.round(G.time / 60), over: G.over, units: G.units.length, inView: bc, blds: G.buildings.length, res: G.resources.length, proj: G.projectiles.length,
      tick_med: ts[ts.length >> 1]?.toFixed(3), tick_p95: ts[Math.floor(ts.length * .95)]?.toFixed(3), tick_max: ts[ts.length - 1]?.toFixed(2), ...out,
      dom_med: ds[10].toFixed(2), pathLong_med: pf[pf.length >> 1]?.toFixed(3), pathLong_max: pf[pf.length - 1]?.toFixed(2), ages: G.players.map(p => p.age).join('') };
  }, { to: min });
  const m = await cdp.send('Performance.getMetrics'); const h = m.metrics.find(x => x.name === 'JSHeapUsedSize').value;
  console.log(JSON.stringify({ ...r, heapMB: (h / 1e6).toFixed(0) }));
  if (r.over) break;
}
// real frame loop: measure actual rAF fps for 3s
const fps = await page.evaluate(() => new Promise(res => { let n = 0; const s = performance.now(); function f() { n++; if (performance.now() - s < 3000) requestAnimationFrame(f); else res(n / 3) } requestAnimationFrame(f) }));
console.log('rAF fps (headless, live game)', fps.toFixed(1));
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors');
await browser.close();
