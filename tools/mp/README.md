# Multiplayer: how it works and how to test it

Human-versus-human play is deterministic lockstep relayed through a host. Every browser runs the full
simulation; only player commands cross the network.

## In the game

- `applyCmd(seat, cmd)` is the single entry point for every player action (orders, train, place, buy, ally,
  resign, taunt, cheat...). Commands are plain data; entities travel by id. `submit(cmd)` applies it at once
  in single-player and hands it to `NET.submit` in multiplayer.
- `ME` is the local seat. Fog, selection, alerts, sounds and the win/defeat check all use it.
- `NET` (search `MULTIPLAYER` in `index.html`): host-relayed lockstep. A turn is `TURN_TICKS` (4) ticks. The host
  batches received commands into a numbered `turn` packet at each turn boundary; a client never advances into a turn
  it has not received. The host stalls if any client falls more than `MAX_LEAD` turns behind, and drops a client
  that has been silent for 15 s.
- Every `HASH_EVERY` turns clients send `stateHash()` with their ack. On a mismatch the host sends `snapshot()`
  (full state including projectiles, next entity id and RNG state) and the client `restore()`s it. The same path
  serves a player who rejoins with the same name and room code.
- Transports: `localTransport` (BroadcastChannel, two tabs of the same browser, needs an http origin) and
  `peerTransport` (PeerJS over WebRTC, loaded from unpkg on demand, public signaling server, room code = peer id).
- A hidden tab keeps ticking through a Worker timer (`startBgTicker`) because requestAnimationFrame pauses.
- Pause and chat are network messages, not sim commands. Game speed is locked to 1x. Cheats are refused.

## Scripts (need the system Chrome; Playwright comes from `~/me/agentic-evals/node_modules`)

| Script | What it proves |
|---|---|
| `node tools/mp/determinism.mjs` | Two browser contexts, same seed, same seeded random commands: identical hashes. Also in-page rerun and replay-from-log. `SEEDS=`, `SECS=` env vars. |
| `node tools/mp/lockstep-test.mjs` | Two tabs host/join over BroadcastChannel, play with random commands from both sides, no desync; a corrupted client is detected and resynced; a closed tab rejoins; chat and pause travel both ways. `SHOTS=1` saves screenshots to `tools/mp/out`. |
| `node tools/mp/peer-test.mjs` | The online PeerJS path between two separate contexts (needs internet). |
| `node tools/mp/sp-smoke.mjs` | Single-player still works through the real UI handlers. |

Debug hooks in the page: `dbg.hash()`, `dbg.snapshot()`, `dbg.restore(d)`, `dbg.fuzzRun(setup, secs, fseed, log?)`,
`dbg.selftest(seed, secs, fseed)`, `dbg.submit(cmd)`, `dbg.net()`, `dbg.me()`.

## Known limits

- Fairness: clients report their round-trip time in acks and the host holds its own orders for that long (whole turns, max 5), so both sides see about the same click-to-execution lag.
- Cross-browser play (Chrome vs Safari) is untested: `Math.hypot`, `sin`, `cos`, `atan2` may differ between engines.
  Same browser on both sides is safe.
- A projectile whose firing unit died before a resync is dropped on the restored side (rare; the next hash catches it).
- Online play uses STUN only, so it needs a direct WebRTC path between the players. The TURN relays PeerJS used to
  ship with no longer resolve. When the networks block a direct link (symmetric NAT, client-isolated or corporate
  Wi-Fi), the guest shows "found the host but could not connect" after 20 s. To fix it, put both players on the same
  network or a phone hotspot, or add a TURN relay (for example a free Metered or Cloudflare TURN account) by opening the
  game once on both machines with `?turn=turn:HOST:PORT|turns:HOST:443,USER,PASS`. It is remembered in
  localStorage `ageup-turn`.
- No spectators, no mid-game save/load in multiplayer.
