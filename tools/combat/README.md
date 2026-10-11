# Movement and combat scenarios

Headless checks of how units move and fight. Like `tools/mp`, they need the system Chrome and take Playwright from
`~/me/agentic-evals/node_modules`. `lib.js` is injected into the page: it starts a 2-player game with both AIs off,
clears and flattens a 31x31 arena in the middle of a large map, and gives helpers to drop units, buildings and trees
into it and run the real sim (`CB.arena`, `CB.unit`, `CB.bld`, `CB.tree`, `CB.order`, `CB.tick`, `CB.stallWatch`).

| Script | What it does |
|---|---|
| `node tools/combat/scenarios.mjs` | Runs every scenario below and prints its numbers. `ONLY=retaliate,sheep` runs a subset, `JSON=1` prints raw JSON. About 20 s. |
| `node tools/combat/shots.mjs` | Three duels (sword v spear, archer v knight, villager v horseman), one screenshot per tick, and a contact sheet `out/duels.png` for checking wind-up, impact, recoil and facing by eye. |

A **stall** is 3 s in which a unit that wants to move (not idle, not working, not in range of its target) never gets
0.35 tiles from where it was.

| Scenario | Measures | Good |
|---|---|---|
| `retaliate` | 7 soldier types hit while idle, following, attacking a building, chasing a scout, attack-moving or standing ground, by a longbow from beyond sight, a swordsman, a horseman or a tower. `answered` = turned on or hit the attacker within 4 s. Hold cases (a tower while busy with a building or a chase, a chase whose target is nearer than an unseen shooter, standing ground out of reach) should keep their order. | rate 1, held = holdCases |
| `villagerFlee` | Villagers idle / chopping / building / mining / boxed in by trees, hit by a swordsman from either side for 8 s, attacker then removed. | `fled` for every case that was hit, all `resumed`, no stalls |
| `surround` | 6 and 10 swordsmen on one elephant, and a 12 v 12 melee brawl: share of attackers in reach of their target. | high `engaged`, no stalls |
| `choke` | 20 soldiers through a one-tile gap between barracks, through a gap in a tree line, and against 10 villagers coming the other way. | `secs90` ~13, no stalls |
| `amove` | Attack-move through scattered spearmen; three hunters chasing a walking villager / archer / scout. | all arrive; every chase kills |
| `ranged` | Archers holding against charging swordsmen, stand-ground archers (drift), a skirmisher caught in melee in the open and against a tree line. | skirmisher fires, does not run around |
| `workers` | 6 farmers (share of samples standing off their plot), builders on a house, barracks, town hall and wall line (distance from the footprint while building; `far` = over 1.2). | offPlot 0, builders ~0.4 |
| `sheep` | A captured sheep: selectable (`ownSheep`, box select), walks where right-clicked, ignores attack orders, can still be eaten. | all true except `fought` |
| `aigame` | 13 minutes of a hard AI-vs-AI game: stalls, soldiers hit by enemy units that are not fighting a unit 3 s later, builders far from their foundation, farmers off their plot. `AIMINS` is read from `globalThis`. | near 0 everywhere |

Numbers from the first run (before the fixes in the same commit) and after:

| | before | after |
|---|---|---|
| retaliate rate | 0.58 (tower, follow, chase cases never answered) | 1.00 |
| villagers hit / fled | 0 of 10 hit (soldiers stood just out of reach) | 9 hit, all fled and resumed |
| horseman chasing a walking villager | never caught | killed at 8.8 s |
| skirmisher in melee: shots / tiles run | 3 / 17.1 (open), 1 / 0 (against trees) | 10 / 1.4, 10 / 1.0 |
| farmers off their plot | 100 % (max 1.05 tiles out) | 0 % |
| builders' distance from the footprint | 1.02 mean | 0.44 mean |
| sheep selectable / walks | no / no | yes / yes |
| AI game stalls (units) | 118 (17), villagers at drop sites and resources | 1 (1) |
| AI game farmers off plot | 7827 of 8151 samples | 0 |
