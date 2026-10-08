// End-to-end lockstep test: two headless pages in one browser context play each other through the
// "same browser" (BroadcastChannel) transport. Both sides submit random commands; the host's desync
// counter must stay at zero. Then the client's state is deliberately corrupted to prove the hash check
// catches it and the host's snapshot repairs it. Finally the client page is closed and a new page rejoins.
//
//   node tools/mp/lockstep-test.mjs          (set SHOTS=1 to save screenshots into tools/mp/out)
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
// BroadcastChannel needs a real origin, so serve index.html over a throwaway local http server.
const server = http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); fs.createReadStream(path.join(root, 'index.html')).pipe(res); }).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const out = path.join(here, 'out'); if (process.env.SHOTS) fs.mkdirSync(out, { recursive: true });
const shot = async (p, name) => { if (process.env.SHOTS) await p.screenshot({ path: path.join(out, name + '.png') }); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0; const check = (ok, what) => { console.log((ok ? 'OK   ' : 'FAIL ') + what); if (!ok) failed++; };

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
async function open(name) {
  const p = await ctx.newPage(); p.on('pageerror', e => console.log(`[${name}] pageerror:`, e.message));
  p.on('console', m => { if (m.type() === 'error') console.log(`[${name}] console:`, m.text()); });
  await p.goto(url); await p.waitForFunction(() => !!window.dbg); return p;
}
const host = await open('host'), client = await open('client');
await host.evaluate(() => { document.getElementById('mp-tr').value = 'local'; document.getElementById('pn-0').value = 'Alice'; document.getElementById('s-seed').value = '42'; document.getElementById('mp-host').click(); });
await client.evaluate(() => { document.getElementById('mp-tr').value = 'local'; document.getElementById('pn-0').value = 'Bob'; document.getElementById('mp-join').click(); });
await host.waitForFunction(() => dbg.net().peers.size === 1, null, { timeout: 5000 });
await client.waitForFunction(() => dbg.net().lobby && dbg.net().lobby.rows && dbg.net().lobby.rows.filter(r => r.type === 'you' || r.type === 'human').length === 2, null, { timeout: 5000 });
await shot(host, 'lobby-host'); await shot(client, 'lobby-client');
check(await client.evaluate(() => document.getElementById('play').disabled), 'client cannot press start');
await host.evaluate(() => document.getElementById('play').click());
await Promise.all([host, client].map(p => p.waitForFunction(() => dbg.net().active && G && G.tick > 0, null, { timeout: 5000 })));
check(await host.evaluate(() => dbg.me()) === 0 && await client.evaluate(() => dbg.me()) === 1, 'seats assigned: host 0, client 1');
check(await client.evaluate(() => G.players[0].name === 'Alice' && G.players[1].name === 'Bob' && !G.players[1].ai && G.seed === 42), 'client got the same setup, both seats human');

// 40 wall seconds of play with random commands from both sides
const fuzz = p => p.evaluate(() => { window._fr = window._fr || dbg.rng(dbg.me() + 11); const c = dbg.fuzzCmd(dbg.me(), window._fr); if (c) dbg.submit(c); });
const t0 = Date.now(); let n = 0;
while (Date.now() - t0 < 40000) { await Promise.all([fuzz(host), fuzz(client)]); n++; await sleep(150); }
const hs = await host.evaluate(() => ({ tick: G.tick, desync: dbg.net().desync, waiting: dbg.net().waiting, units: G.units.length }));
const cs = await client.evaluate(() => ({ tick: G.tick, desync: dbg.net().desync, waiting: dbg.net().waiting, rtt: dbg.net().rtt }));
console.log(`host tick ${hs.tick}, client tick ${cs.tick}, ${n * 2} commands submitted, rtt ${cs.rtt} ms`);
check(hs.desync === 0, 'no desync after random play on both sides');
check(hs.tick > 600 && Math.abs(hs.tick - cs.tick) <= 24, 'client keeps up with the host (within one turn window)');
check(!hs.waiting && !cs.waiting, 'nobody is stalled');
await shot(host, 'game-host'); await shot(client, 'game-client');

// fairness: with a slow client (450 ms round trip reported), the host's own orders wait about two turns
await host.evaluate(() => { for (const q of dbg.net().peers.values()) q.rtt = 450; });
const fair = await host.evaluate(() => new Promise(res => { const t0 = G.tick; dbg.submit({ v: 'taunt', n: 9 }); const iv = setInterval(() => { if (G.msgs.some(m => /Well played/.test(m.t))) { clearInterval(iv); res({ t0, t1: G.tick }); } }, 10); }));
check(fair.t1 - fair.t0 >= 5 && fair.t1 - fair.t0 <= 16, `host order delayed to match client latency (${fair.t1 - fair.t0} ticks for a 450 ms round trip)`);
await host.evaluate(() => { for (const q of dbg.net().peers.values()) q.rtt = 0; });

// deliberate corruption on the client: the hash exchange must notice and the host must resync it
await client.evaluate(() => { G.players[0].res.wood += 1; });
await host.waitForFunction(() => dbg.net().desync === 1, null, { timeout: 8000 }).catch(() => {});
check(await host.evaluate(() => dbg.net().desync) === 1, 'host detected the corrupted client');
await client.waitForFunction(() => dbg.net().desync >= 1 && !dbg.net().waiting, null, { timeout: 8000 }).catch(() => {});
await sleep(4000);
check(await host.evaluate(() => dbg.net().desync) === 1, 'after the resync the hashes agree again (desync count did not grow)');
check(await client.evaluate(() => G.msgs.some(m => /Synced/.test(m.t))), 'client reported the resync');

// rejoin: close the client, open a fresh page, join with the same name
await client.close();
await sleep(1500);
const again = await open('rejoin');
await again.evaluate(() => { document.getElementById('mp-tr').value = 'local'; document.getElementById('pn-0').value = 'Bob'; document.getElementById('mp-join').click(); });
await again.waitForFunction(() => dbg.net().active && G && !dbg.net().waiting && G.tick > 0, null, { timeout: 25000 }).catch(() => {});
const rj = await again.evaluate(() => ({ me: dbg.me(), tick: G ? G.tick : -1, waiting: dbg.net().waiting, status: dbg.net().lobby && dbg.net().lobby.status }));
const ht = await host.evaluate(() => G.tick);
check(rj.me === 1 && !rj.waiting && Math.abs(ht - rj.tick) <= 24, `rejoined player is back in seat 1 and in step (host ${ht}, rejoined ${rj.tick})`);
await sleep(3000);
check(await host.evaluate(() => dbg.net().desync) === 1, 'rejoined player stays in sync');

// chat and pause travel both ways
await again.evaluate(() => dbg.net().chat('hello from Bob'));
await host.waitForFunction(() => G.msgs.some(m => /hello from Bob/.test(m.t)), null, { timeout: 3000 }).catch(() => {});
check(await host.evaluate(() => G.msgs.some(m => /Red \(Bob\): hello from Bob/.test(m.t))), 'chat reaches the host with the sender name');
await again.evaluate(() => setPaused(true));
await host.waitForFunction(() => G.paused, null, { timeout: 3000 }).catch(() => {});
check(await host.evaluate(() => G.paused) && await again.evaluate(() => !!(G && G.paused)), "client pause pauses both");
await host.evaluate(() => setPaused(false));
await again.waitForFunction(() => !G.paused, null, { timeout: 3000 }).catch(() => {});
check(!(await again.evaluate(() => G && G.paused)), "host unpause resumes both");

await browser.close(); server.close();
console.log(failed ? `FAILED: ${failed} check(s)` : 'lockstep test passed');
process.exit(failed ? 1 : 0);
