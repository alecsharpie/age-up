// Integration test: starts `wrangler dev` (the real Workers runtime, Durable Objects included, offline) and drives
// the relay over real WebSockets. Run from server/: npm run test:relay
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8790 + Math.floor(Math.random() * 100), BASE = `127.0.0.1:${PORT}`;
const ORIGIN = 'http://localhost:5173';
let dev;

before(async () => {
  dev = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--ip', '127.0.0.1'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let log = ''; dev.stdout.on('data', d => log += d); dev.stderr.on('data', d => log += d);
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(`http://${BASE}/health`)).ok) return; } catch (e) {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('wrangler dev did not start:\n' + log);
});
after(() => { try { process.kill(-dev.pid) } catch (e) {} });

let n = 0; const code = () => 'TEST' + 'ABCDEFGHJK'[n++ % 10];
// a client that queues every message so tests can await them in order
function client(room, role, origin = ORIGIN) {
  const ws = new WebSocket(`ws://${BASE}/room/${room}?role=${role}`, { headers: { Origin: origin } });
  const q = [], waiters = [];
  ws.onmessage = e => { const m = e.data === 'pong' ? 'pong' : JSON.parse(e.data); const w = waiters.shift(); w ? w(m) : q.push(m); };
  ws.closed = new Promise(r => ws.onclose = e => r(e.code));
  ws.next = () => q.length ? Promise.resolve(q.shift()) : new Promise((r, j) => { waiters.push(r); setTimeout(() => j(new Error('timeout')), 3000); });
  ws.ready = new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.post = (to, body) => ws.send(JSON.stringify({ to, body }));
  return ws;
}

test('host and guest meet and relay both ways', async () => {
  const room = code(), h = client(room, 'host');
  const hello = await h.next(); assert.equal(hello.t, 'hello'); assert.equal(hello.role, 'host');
  const g = client(room, 'guest');
  const gh = await g.next(), gp = await g.next(), hp = await h.next();
  assert.equal(gp.t, 'peer'); assert.equal(gp.id, hello.id); assert.equal(hp.id, gh.id);
  g.post(null, { t: 'join', name: 'Bob' });
  assert.deepEqual(await h.next(), { t: 'msg', from: gh.id, body: { t: 'join', name: 'Bob' } });
  h.post(gh.id, { t: 'lobby', big: 'x'.repeat(200000) }); // snapshot-sized
  const m = await g.next(); assert.equal(m.body.big.length, 200000);
  g.send('ping'); assert.equal(await g.next(), 'pong');
  h.close(); assert.deepEqual(await g.next(), { t: 'gone', id: hello.id }); assert.equal(await g.closed, 1000);
});

test('a second host for the same code is refused', async () => {
  const room = code(), h = client(room, 'host'); await h.next();
  const h2 = client(room, 'host');
  assert.deepEqual(await h2.next(), { t: 'error', type: 'unavailable-id' }); assert.equal(await h2.closed, 4000);
  h.close();
});

test('joining a code nobody is hosting is refused', async () => {
  const g = client(code(), 'guest');
  assert.deepEqual(await g.next(), { t: 'error', type: 'peer-unavailable' }); assert.equal(await g.closed, 4000);
});

test('host hears when a guest leaves, and the code is free again after the host leaves', async () => {
  const room = code(), h = client(room, 'host'); await h.next();
  const g = client(room, 'guest'); const gh = await g.next(); await h.next();
  g.close(); assert.deepEqual(await h.next(), { t: 'gone', id: gh.id });
  h.close(); await h.closed;
  const h2 = client(room, 'host'); assert.equal((await h2.next()).t, 'hello'); h2.close();
});

test('front door: other origins, bad codes and plain requests are turned away', async () => {
  const bad = client(code(), 'host', 'https://evil.example');
  await assert.rejects(bad.ready);
  assert.equal((await fetch(`http://${BASE}/room/lower`)).status, 404);
  assert.equal((await fetch(`http://${BASE}/room/ABCDE`)).status, 426);
});
