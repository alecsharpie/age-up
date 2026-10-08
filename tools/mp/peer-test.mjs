// Online path: two separate browser contexts connect through PeerJS (public signaling server, WebRTC data channel).
// Needs internet. Checks that the lobby forms, the game starts on both sides, and the sims stay in sync.
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.resolve(here, '../../index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
async function open(name) { const ctx = await browser.newContext(); const p = await ctx.newPage(); p.on('pageerror', e => console.log(`[${name}]`, e.message)); await p.goto(url); await p.waitForFunction(() => !!window.dbg); return p; }
const host = await open('host'), client = await open('client');
await host.evaluate(() => { document.getElementById('mp-tr').value = 'peer'; document.getElementById('mp-name').value = 'Alice'; document.getElementById('mp-host').click(); });
await host.waitForFunction(() => dbg.net().tr && dbg.net().tr.id, null, { timeout: 20000 });
const code = await host.evaluate(() => dbg.net().room);
console.log('room', code, 'status:', await host.evaluate(() => dbg.net().lobby.status));
await client.evaluate(c => { document.getElementById('mp-tr').value = 'peer'; document.getElementById('mp-name').value = 'Bob'; document.getElementById('mp-code').value = c; document.getElementById('mp-join').click(); }, code);
await host.waitForFunction(() => dbg.net().peers.size === 1, null, { timeout: 30000 });
console.log('joined; client lobby:', await client.evaluate(() => dbg.net().lobby.status));
await host.evaluate(() => document.getElementById('play').click());
await Promise.all([host, client].map(p => p.waitForFunction(() => dbg.net().active && G && G.tick > 0, null, { timeout: 15000 })));
const fuzz = p => p.evaluate(() => { window._fr = window._fr || dbg.rng(dbg.me() + 3); const c = dbg.fuzzCmd(dbg.me(), window._fr); if (c) dbg.submit(c); });
const t0 = Date.now(); while (Date.now() - t0 < 20000) { await Promise.all([fuzz(host), fuzz(client)]); await sleep(200); }
const h = await host.evaluate(() => ({ tick: G.tick, desync: dbg.net().desync, waiting: dbg.net().waiting }));
const c = await client.evaluate(() => ({ tick: G.tick, rtt: dbg.net().rtt, waiting: dbg.net().waiting }));
console.log('host', h, 'client', c);
const ok = h.desync === 0 && h.tick > 300 && Math.abs(h.tick - c.tick) <= 24 && !h.waiting && !c.waiting;
await browser.close(); console.log(ok ? 'peer test passed' : 'peer test FAILED'); process.exit(ok ? 0 : 1);
