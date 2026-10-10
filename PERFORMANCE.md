# Performance review

Reviewed 2026-10-10.

**Verdict:** for its size the game runs light. Drawing, memory and load time are all fine. Nearly all the
late-game slowdown comes from one problem in the simulation, and that problem is also a gameplay bug.

## How it was tested

Headless Chrome on an Apple M3 (16 GB). The test game was a 4-player large map, population 200, hardest AI,
seed 11, plains. Slot 0 was also handed to the AI so all four sides built up. Every part of the game was timed
at minutes 1, 5, 10, 15 and 20. The same game was then run with the CPU slowed 4× (Chrome DevTools CPU
throttling) at 1366×768, which roughly stands in for an older budget laptop. One AI won at about minute 23.

| | M3 (normal) | 4× slower CPU |
|---|---|---|
| Page load / memory after load | 0.4 s / 14 MB | 0.5 s / 15 MB |
| Game update, minute 10 (217 units) | 0.2 ms | 0.9 ms |
| Game update, minute 15 (248 units) | 2.1 ms | 8.8 ms (worst 83 ms) |
| Game update, minute 20 (333 units) | **3.8 ms** (worst 46 ms) | **15.5 ms** (worst 34 ms) |
| Drawing one frame, zoomed in / out (median) | 0.5–1.9 ms | 1.2–6 ms |
| Drawing one frame, slowest 5% | up to 5.5 ms | up to 13.6 ms |
| Command and info panel refresh | < 0.3 ms | < 1 ms |
| Memory used during play (JS heap) | 20–45 MB | same |

The terrain is drawn once onto a backing canvas of up to 4608×2304 px (about 42 MB on large maps), and sprite
frames are cached after first use, so drawing stays cheap.

The game updates 20 times a second, so 15.5 ms per update uses about a third of a CPU core on the simulation
alone. At 60 fps, any frame that also runs an update goes over its 16.7 ms budget. On a slow laptop that means a
choppy late game, plus 30–80 ms freezes.

## Main finding: villagers stuck on resources they can't reach

In the late game about 75% of simulation time goes to pathfinding (`findPath` 45%, `heapPop` 24%, `heapPush`
4%). That works out to about 36 failed path searches per update, and each one gives up only after checking
3,500 tiles.

- At minute 19, **77 of 258 villagers did not move at all for 20 seconds** while searching for a path every
  single update. They were stuck on resources (wood, gold, stone, farms) that are walled in, often by the AI's
  own buildings.
- The resource search (`findResource`, `index.html:600`) only checks that a tile next to the resource is open.
  It does not check whether that open tile can be reached from where the villager is.
- When the path is incomplete, the villager walks to the nearest reachable point, `goNear` reports `stuck`,
  clears the goal, and the next update searches again. After 20 tries it gives up and picks the nearest
  resource again, which is usually the same one, so the loop never ends.

That means roughly 30% of the AI's villagers are idle late in the game. It is a real hit to AI strength, not
only to frame rate.

## Laptop specs

- **Minimum:** a laptop from about 2015 onwards with a dual-core ~2 GHz CPU, 4 GB RAM, integrated graphics and a
  current Chrome, Edge or Firefox. Small and medium maps should play smoothly. Large 4-player games will stutter
  after about 15 minutes until the bug above is fixed.
- **Recommended:** a 2018+ quad-core (Intel 8th gen i5, Ryzen 3000 or any Apple Silicon) with 8 GB RAM, which
  should hold 60 fps throughout.
- **Multiplayer:** every player's computer runs the full game in lock step, so the slowest machine sets the pace
  for everyone. Budget Chromebooks (Celeron-class) will probably hold the room back in big late games.
- The graphics card barely matters. The canvas is drawn at CSS pixel size even on Retina or 4K screens
  (`resize()` ignores `devicePixelRatio`), so drawing stays cheap. It also looks a bit soft on those screens.

**Caveat:** the 4× slowdown only imitates a slower CPU, and headless Chrome does not use the graphics card the
way a normal window does. Treat these specs as estimates, not results measured on real older laptops.

## Recommendations, most impactful first

1. **Fix the unreachable-resource loop.** Label which areas of land connect to each other (a flood fill over
   walkable tiles), and update the labels when buildings are placed or removed. `findResource` should then only
   pick resources whose open neighbour is in the villager's own area. Also have each villager remember resources
   it failed to reach, and wait a few seconds before trying again instead of searching every update. Expected:
   late-game updates drop from about 3.8 ms to about 1 ms on the M3, and the idle AI villagers go back to work.
2. **Limit pathfinding work per update.** Queue path requests and cap how many tiles get checked in one update.
   That removes the 30–80 ms freezes even with very large armies.
3. **Speed up the pathfinding queue.** `heapPop` alone takes 24% of the time. The heap stores a new `[f, i]`
   array for every tile it adds; preallocated typed arrays would roughly halve that cost and cut garbage
   collection.
4. **Pre-build sprites.** Each sprite frame is built into `PIX_CACHE` the first time it is seen, which can cause
   small hitches when new unit types appear. Building them for each player's colours at game start or age-up
   would avoid that.
5. **Smaller items:**
   - The fog is rebuilt as a per-tile path every frame. `updateFog` already builds a fog image but looks unused,
     so the fog could be drawn from that image and refreshed only when visibility changes (every 5 updates).
   - The command panel is rebuilt with `innerHTML` twice a second. It costs under 1 ms, but rebuilding only what
     changed would also stop it eating clicks and hovers.
   - If the canvas is ever made sharp on Retina screens, cap the scaling at 2× to keep fill cost in check.

## Raw numbers

M3, 1920×1080 (median / slowest 5% / slowest, in ms):

| Minute | Units | Buildings | Update | Draw zoom 1 | Draw zoom 0.5 |
|---|---|---|---|---|---|
| 1 | 80 | 14 | 0.1 / 0.8 / 1.4 | 0.5 / 0.9 | 1.2 / 1.6 |
| 5 | 145 | 51 | 0.1 / 0.8 / 1.1 | 0.6 / 1.2 | 1.3 / 2.3 |
| 10 | 217 | 115 | 0.2 / 0.9 / 1.3 | 0.8 / 1.0 | 1.9 / 2.4 |
| 15 | 248 | 158 | 2.1 / 2.9 / 3.7 | 0.9 / 3.0 | 1.7 / 2.6 |
| 20 | 333 | 261 | 3.8 / 5.1 / 46.3 | 1.3 / 4.1 | 1.9 / 5.5 |

4× slower CPU, 1366×768:

| Minute | Update | Draw zoom 1 | Draw zoom 0.5 |
|---|---|---|---|
| 1 | 0.4 / 3.3 / 5.6 | 1.2 / 2.3 | 2.4 / 3.2 |
| 5 | 0.7 / 3.6 / 5.5 | 1.7 / 3.9 | 3.9 / 5.5 |
| 10 | 0.9 / 4.3 / 11.4 | 2.1 / 4.0 | 5.2 / 9.7 |
| 15 | 8.8 / 15.3 / 83.4 | 2.5 / 4.3 | 5.1 / 10.8 |
| 20 | 15.5 / 20.2 / 33.6 | 3.3 / 13.0 | 5.6 / 7.1 |

Breakdown of one update at minute 19 on the M3 (1.9 ms total): unit updates 1.6 ms (mostly pathfinding),
fog of war 0.09 ms, separation 0.06 ms, buildings 0.04 ms, AI 0.03 ms, everything else under 0.02 ms.
