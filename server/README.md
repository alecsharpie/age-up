# Online relay server

Online games connect each player's browser to this small server over a WebSocket. It forwards messages between the
host and the guests in a room. Everything else (the lockstep, the lobby) stays in `index.html`.

```
browser ──wss──▶ Worker  /room/ABCDE?role=host|guest   checks Origin and code format
                   │ routes by room code
                   ▼
           Durable Object "ABCDE"   one per room, sleeps between messages
             host ◀──▶ relay ◀──▶ guests    guests can only talk to the host
```

Why a relay instead of peer-to-peer: the game already routes everything through the host, so a direct connection
gains little, while WebRTC fails on client-isolated Wi-Fi, strict NAT and many mobile or corporate networks. An
outbound WebSocket on port 443 works almost everywhere, and the whole path is ours (no public signaling server).

Why a Durable Object: every connection for a room code reaches the same single instance, wherever the players are,
which is the hard part of hosting rooms on serverless. The Hibernation API lets an idle room drop out of memory
(and stop costing anything) while its sockets stay open.

| File | |
|---|---|
| `room.js` | the relay rules: admission, routing, leaving, limits. Plain JavaScript with no Cloudflare APIs, so it can move to another host (a Node `ws` server, say) with a small adapter |
| `worker.js` | Cloudflare adapter: the Worker front door and the `Room` Durable Object |
| `wrangler.toml` | Worker name, account, allowed origins, Durable Object binding and migration |
| `deploy.sh` | deploys, writes `RELAY_URL` into `index.html`, checks `/health` |
| `test/room.test.mjs` | unit tests of `room.js` with fake connections (`npm test`) |
| `test/relay.test.mjs` | integration tests against `wrangler dev`, the real runtime, offline (`npm run test:relay`) |

The browser-level test is `node tools/mp/online-test.mjs`: it starts `wrangler dev` and plays a game between two
browser contexts.

## Protocol

| Server → client | |
|---|---|
| `{t:'hello', id, role}` | your id |
| `{t:'peer', id}` | host: a guest arrived. Guest: this is the host |
| `{t:'msg', from, body}` | a relayed game message |
| `{t:'gone', id}` | that peer left; guests are closed when the host leaves |
| `{t:'error', type}` | `unavailable-id` (code taken), `peer-unavailable` (nobody hosting), `room-full` |

Client → server: `{to, body}` (host: a guest id, or `null` for everyone; guests always reach the host), and
`'ping'` every 25 s, answered `'pong'` by the runtime without waking the room (keeps routers from dropping a quiet lobby).

Limits: 7 guests per room, 1 MB per message (a snapshot is about 70–130 KB), 300 messages per 5 s per connection
(normal play is about 10 per second), text frames only, origins from `ALLOWED_ORIGINS`.

## Local development

```sh
cd server && npm install
npm run dev                                   # relay on ws://localhost:8787
# open the game from a local web server (not file://) with ?relay=ws://localhost:8787
# (remembered in localStorage 'ageup-relay'; ?relay= with nothing after it goes back to the live server)
```

## Deploy

1. Cloudflare account. Open *Workers & Pages* once so it has a `workers.dev` subdomain.
2. API token: *My Profile → API Tokens → Create Token →* **Edit Cloudflare Workers** template, your account. It
   only needs to exist while deploying, so give it an expiry. (`npx wrangler login` works too, where the browser
   login completes.)
3. `export CLOUDFLARE_API_TOKEN=…` then `server/deploy.sh`.
4. `RELAY=wss://age-up-relay.<subdomain>.workers.dev node tools/mp/online-test.mjs`, then commit `index.html`
   (GitHub Pages deploys `main`).

Changing the room code alphabet in `randCode()` means changing `CODE` in `worker.js` too.

## Cost

The account stays on the **Workers Free plan**, where going over a limit makes requests fail until the daily reset
(midnight UTC) instead of billing. That is the budget cap: it cannot cost money unless someone subscribes the account
to Workers Paid. Free limits (checked 2026-10-11): 100,000 requests/day, where 20 incoming WebSocket messages count as
one request, and 13,000 GB-s/day of Durable Object duration. A 2-player game sends about 10 messages per second and
keeps its room awake, so the duration limit binds first at roughly 28 game-hours per day. Lobbies waiting for
players sleep and cost nothing.

## Privacy

Cloudflare sees players' IP addresses, as it does for any site behind it. Messages are game orders and lobby
settings, over TLS. The server stores nothing, logs nothing (observability off), and a room disappears when its
last player leaves.
