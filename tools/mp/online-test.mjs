// Online path: two separate browser contexts play through the relay server, run locally with `wrangler dev` (the
// real Workers runtime; no internet needed). Checks that the lobby forms, the game starts on both sides, the sims stay
// in sync, and that a bad code, a dead server and a departing host give clear messages.
// RELAY=wss://… tests against a deployed relay instead of starting one.
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path'; import http from 'http'; import fs from 'fs'; import { spawn } from 'child_process';
const here = path.dirname(fileURLToPath(import.meta.url)), serverDir = path.resolve(here, '../../server');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let relay = process.env.RELAY, dev = null;
if (!relay) {
  const port = 8800 + Math.floor(Math.random() * 100);
  dev = spawn('npx', ['wrangler', 'dev', '--port', String(port), '--ip', '127.0.0.1'], { cwd: serverDir, stdio: 'ignore', detached: true });
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break; } catch (e) {} await sleep(250); }
  relay = `ws://127.0.0.1:${port}`;
}
// serve the page from localhost: the relay only accepts allowed Origins, and file:// pages send "null"
const page = fs.readFileSync(path.resolve(here, '../../index.html'));
const site = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(page); });
await new Promise(ok => site.listen(0, '127.0.0.1', ok));
const url = r => `http://localhost:${site.address().port}/?relay=${encodeURIComponent(r)}`;
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
let failed = 0; const check = (ok, what) => { console.log((ok ? 'OK   ' : 'FAIL ') + what); if (!ok) failed++; };
async function open(name, r = relay) { const ctx = await browser.newContext(); const p = await ctx.newPage(); p.on('pageerror', e => console.log(`[${name}]`, e.message)); await p.goto(url(r)); await p.waitForFunction(() => !!window.dbg); return p; }
const status = p => p.evaluate(() => dbg.net().lobby && dbg.net().lobby.status);
const join = (p, code) => p.evaluate(c => { document.getElementById('mp-tr').value = 'online'; document.getElementById('pn-0').value = 'Bob'; document.getElementById('mp-code').value = c; document.getElementById('mp-join').click(); }, code);

// errors players can hit
const lost = await open('lost'); await join(lost, 'ZZZZZ'); await lost.waitForFunction(() => /Error/.test(dbg.net().lobby.status), null, { timeout: 10000 });
check(/no game with that code/.test(await status(lost)), 'unknown code: ' + await status(lost));
const dead = await open('dead', 'ws://127.0.0.1:9'); await join(dead, 'ZZZZZ'); await dead.waitForFunction(() => /Error/.test(dbg.net().lobby.status), null, { timeout: 15000 });
check(/could not reach the game server/.test(await status(dead)), 'server down: ' + await status(dead));

// a full game
const host = await open('host'), client = await open('client');
await host.evaluate(() => { document.getElementById('mp-tr').value = 'online'; document.getElementById('pn-0').value = 'Alice'; document.getElementById('mp-host').click(); });
await host.waitForFunction(() => dbg.net().tr && dbg.net().tr.id, null, { timeout: 10000 });
const code = await host.evaluate(() => dbg.net().room);
console.log('room', code, 'status:', await status(host));
await join(client, code);
await host.waitForFunction(() => dbg.net().peers.size === 1, null, { timeout: 10000 });
console.log('joined; client lobby:', await status(client));
await host.evaluate(() => document.getElementById('play').click());
await Promise.all([host, client].map(p => p.waitForFunction(() => dbg.net().active && G && G.tick > 0, null, { timeout: 15000 })));
const fuzz = p => p.evaluate(() => { window._fr = window._fr || dbg.rng(dbg.me() + 3); const c = dbg.fuzzCmd(dbg.me(), window._fr); if (c) dbg.submit(c); });
const t0 = Date.now(); while (Date.now() - t0 < 20000) { await Promise.all([fuzz(host), fuzz(client)]); await sleep(200); }
const h = await host.evaluate(() => ({ tick: G.tick, desync: dbg.net().desync, waiting: dbg.net().waiting }));
const c = await client.evaluate(() => ({ tick: G.tick, rtt: dbg.net().rtt, waiting: dbg.net().waiting }));
console.log('host', h, 'client', c);
check(h.desync === 0 && h.tick > 300 && Math.abs(h.tick - c.tick) <= 24 && !h.waiting && !c.waiting, 'game ran in sync');

// the host leaves: the client is told
await host.evaluate(() => NET.leave());
const lostHost = () => /disconnected|Lost the connection/.test(String(dbg.net().waiting || '') + ' ' + (dbg.net().lobby && dbg.net().lobby.status || ''));
await client.waitForFunction(lostHost, null, { timeout: 10000 }).catch(() => {});
const after = await client.evaluate(() => ({ waiting: dbg.net().waiting, status: dbg.net().lobby && dbg.net().lobby.status }));
check(await client.evaluate(lostHost), 'host left: ' + JSON.stringify(after));

await browser.close(); site.close(); if (dev) try { process.kill(-dev.pid) } catch (e) {}
console.log(failed ? 'online test FAILED' : 'online test passed'); process.exit(failed ? 1 : 0);
