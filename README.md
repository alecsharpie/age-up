# Age Up

A real-time strategy skirmish that runs in the browser from a single HTML file. Gather, build, age up,
and wipe out your rivals. Inspired by the classic real-time strategy games of the late 1990s; all code,
art, and sound are original and generated procedurally.

**Play:** https://alecsharpie.github.io/age-up/

## Features

- Four ages, six invented cultures with their own bonuses and unique units, 26 unit types, 21 buildings,
  37 technology lines (60 levels), naval play, monks and relics, markets and trade, diplomacy and tribute.
- A full in-game tech tree, post-game statistics with a score timeline, and an AI that expands to several
  Town Halls and fills its population cap on the higher difficulties.
- Eight map types plus nomad starts, five AI difficulties, free-for-all or team games for 2 to 4 players.
- Human versus human multiplayer: host a game, share a five-letter room code, and friends join from
  their own browser. Empty seats are filled by the AI. Everyone runs the same deterministic simulation and
  only orders travel over the network.
- Save and load, replays by seed, and a debug API for headless play.

## Multiplayer in short

Open the start screen, expand "Multiplayer", enter a name, and press Host. The other person enters the room
code and presses Join. The host picks the settings and starts. Connections go peer to peer over WebRTC
(signalling via PeerJS's public server). A player who drops can rejoin with the same name and room code.
Details and the test harness are in [tools/mp/README.md](tools/mp/README.md).

## Development

There is no build step: edit `index.html` and reload. Tooling lives under `tools/`:

- `tools/mp` tests determinism and the lockstep networking headlessly (see its README).
- `tools/sprite-lab` renders, lints, and applies the procedural art.

## License

MIT. See [LICENSE](LICENSE).
