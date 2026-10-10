# Performance scripts

Headless benchmarks behind [PERFORMANCE.md](../../PERFORMANCE.md). Like `tools/mp`, they need the system Chrome and
take Playwright from `~/me/agentic-evals/node_modules`. All use seed 11, 4 players, large plains map, population 200,
hardest AI, with slot 0 also handed to the AI.

| Script | What it shows |
|---|---|
| `node tools/perf/bench.mjs` | Update, draw, panel and pathfinding times plus heap size at minutes 1 to 30. `THROTTLE=4 VW=1366 VH=768` imitates an older laptop; `MINS=1,5` picks checkpoints. |
| `node tools/perf/profile.mjs` | Time per update split by phase (AI, buildings, units, fog...), then the hottest functions from a CPU profile. `MIN=` picks the minute (default 19). |
| `node tools/perf/stuck-paths.mjs` | Units whose path searches failed every update for 20 s at minute 19, with their targets and how far they moved. |

A full `bench.mjs` run takes a few minutes, and about four times longer with `THROTTLE=4`.
