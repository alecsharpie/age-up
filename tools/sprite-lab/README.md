# Sprite Lab

A workbench for designing the game's visual assets. The game (`index.html`) draws every building, unit and
resource procedurally on a canvas with a small vocabulary (`box`, `pyramid`, `battlements`, `flag`, `human`, …).
The lab extracts that live code, renders it in headless Chromium into sheets you can **look at**, lints it,
composes a village scene, and splices approved drafts back into `index.html` with a backup.

Nothing is copied by hand: every run re-reads `index.html`, so the lab always shows the game as it is.

```
node tools/sprite-lab/lab.mjs <command>        # run from the repo root
```

## The loop

1. `lab.mjs list` — what exists, footprints, which units still fall through to the generic `human()`.
2. `lab.mjs new unit longbow` — scaffolds `drafts/unit.longbow.js`, pre-filled with the current art and a
   comment block naming every local and helper the body may use.
3. Edit the draft. Check `REFERENCE.md` for what the real thing looks like and the house style rules.
4. `lab.mjs render unit longbow` → `out/unit.longbow.png`. **Read the PNG.** Draft (left) and current (right):
   team colours, walk cycle / construction stages, animation over time, states, and a ×N pixel-true detail
   next to a vector zoom. Dashed line = footprint. Iterate until it is right at 1×, not just zoomed in.
5. `lab.mjs lint unit longbow` — exceptions, drawing below the base line or outside the footprint, missing team
   colour, construction stages that do not change, missing walk/attack animation, colours new to the palette.
6. `lab.mjs scene --src draft` — the asset among its neighbours, on terrain, in depth order. Delight lives here.
7. `lab.mjs diff unit longbow`, then `lab.mjs apply unit longbow`. A backup of `index.html` goes to `backups/`,
   the draft is renamed `applied.*` (ignored by the lab). `lab.mjs revert` undoes the last apply.
8. `lab.mjs sheet all` — contact sheet of everything; check the new piece sits with the rest.

Catalogue: `lab.mjs catalog` builds `out/catalog.html`, a self-contained browsable catalogue (live animated stage,
team/state/construction controls, a prominent age bar shared by the stage and the village, lint, genre reference notes
from `reference.json`, village, contact sheet, palette, free-text notes and ink marks per sprite). It also writes the same
file to the repo root as `catalog.html`, which the deployed site serves at `/catalog.html` next to the game (commit it;
`--no-root` skips it). Served from http(s) it shows a "← Play the game" link to `./index.html`; as an Artifact it does not.
It is also served at `/catalog.html` by `serve`, and can be published as an Artifact as-is.

Ground: `extract.mjs` also pulls the game's terrain + water (`buildTerrain`, `gtFill`, `wtrPaint` …) and render FX
(`fxApron`, `fxShadows`, `fxLight`, the construction reveal) into the lab. Cells, thumbnails and the village stand on small
maps built by that code (`makeWorld` in `lab.js`), so ground, beaches, aprons and the one-light shadows are the game's own.
The village (`villagePlan` in `lab.js`) is a laid-out 50×50 town drawn in the game's render order; its plan is checked
for overlapping footprints and land/water placement (problems show in the console and in `scene`'s caption).

Interactive: `lab.mjs serve` → http://127.0.0.1:8765/lab.html (drafts and `index.html` re-read on reload).

## Drafts

`drafts/<kind>.<type>.js`, kinds `building | unit | resource`. The default export's **body** is what gets
spliced into the game's switch, verbatim, so it must be a valid case body:

- Buildings: locals `b, d, cx, cy, w, h, p, tc, bm, z`. `(cx,cy)` is the footprint's top corner in world px;
  `p` is construction progress (gate detail behind it, use `z(height)` for heights); flags only `if(b.built)`.
- Units: locals `u, tc, d, swing, working, wph, r`. The context is already translated to the feet and flipped
  by facing; draw upward in negative y. Shadow and selection ring are drawn for you.
- Resources: locals `x, c, key, kind, v, r, ox, oy` — paints a 64×80 sprite canvas, ground point `(ox,oy)`.
- No `return` or `break` at the top level. New shared helpers go in `drafts/helpers.js` as
  `export function name(){}` and are installed with `lab.mjs apply helpers` (inserted after `battlements`).
- A unit that currently shares a case (knight/horseman/scout, the ships) is split out on its own when applied.

## Painted (pixel) sprites

Procedural code stays the tool for buildings and anything parametric. For small things where silhouette matters,
sprites can be **painted** as character grids and blitted by `pixDraw`:

- `lab.mjs new pixel <id> [--size 14x24]` scaffolds `drafts/pixel.<id>.js`: an object with `anchor`, a `palette`
  (`T`/`D`/`L` are the team colour, dark and light) and `frames` (`idle`, `walk`, `work`, `attack`, …), each frame a
  multi-line string, one character per pixel, `.` transparent. Code before the `export default` is allowed.
- `lab.mjs render pixel <id>` renders every frame at ×6 with the anchor marked, team variants, and 1× on grass.
- A unit draft uses it: `pixDraw(PIXELS.<id>, 'walk', Math.floor(u.anim*12), tc)`; mix in code-drawn props
  (see `drafts/unit.villager.js`). The context is already at the feet and mirrored by facing; `pixDraw` snaps to
  whole pixels so painted art stays crisp at fractional positions.
- Install: `lab.mjs apply helpers` (once: `pixBuild`/`pixDraw`), `lab.mjs apply pixel <id>` (stores
  `PIXELS.<id>={…}` in `index.html` with readable template-literal grids), then `lab.mjs apply unit <type>`.
- The catalogue's **Paint** tab is a pixel editor over the same format: paint with the mouse, switch frames,
  add frame sets and colours, see it at 1× on grass and ×4, and export the draft text to paste into `drafts/`.
  Loading text there updates every unit that uses the sprite, live.

## The AAA bar

`AAA.md` is the quality bar every sprite meets (outline, ramps, frame sets, timing, death, buildings' ambient life);
`lab.mjs aaa [id|all] [--verbose]` checks the measurable part (`aaa.mjs`). Units are wired with one helper,
`pixUnit(u, PIXELS.<id>, tc, {work, set, i})` (drafts/helpers.js), which picks idle / ready / walk / attack / work from the
unit's state; the engine plays `frames.death` on death (`pixDeath`, corpse fades over 12 s), uses an animal's last death
frame as its carcass, flashes painted units white when hit (`pixFlash`), and sets `PIXELS.fire` on buildings below
75/50/25 % hp. A set may have its own size via `spec.anchors.<set>`; `spec.fps` overrides the rates.
`gen/` holds the scripts that generated the current sprites (see `gen/README.md`).

## Age variants (buildings)

Every building evolves with its owner's age (`G.players[team].age`: 0 Dark, 1 Feudal, 2 Castle, 3 Imperial). The family build
scripts in `gen/` pass each built draft through `gen/ages/wrap.mjs`, which turns the generator into `make(AGE)` with the age kit
`AK = pixAgeKit(AGE)` in scope and exports `pixAged(make, firstAge)`. The game generates the building's first age at load and the
rest lazily (warmed in idle time); draw cases call `pixAge(PIXELS.<id>, b)`, and `pixFlags` places code flags from `spec.flags`
when a variant moves its mount. The kit (`drafts/helpers.js`) holds the shared progression — thatch/wattle → shingles/timber
frame → red tiles/dressed stone → slate/limestone/gilt — as Greek-letter palette chars, roof and wall textures, and ornaments
(finial, crest, banner, trim, windowAt); its doc comment is the bible. `gen/civic/house.body.js` is the reference generator.

- `lab.mjs ages [type|all] [--src draft]` → `out/ages.<type>.<src>.png`: every building across the ages it can stand in.
- `render pixel <id>` adds age rows; `render building <id>` adds an "ages" row; `scene --age n` draws the village at one age;
  the catalogue has an age selector per building, an age option in the village tab, and an "across the ages" contact view.
- `aaa <id>` checks every age variant. In the lab, `b.age` on a fake building overrides the owner's age.

## Batch apply and smoke test

- `lab.mjs apply all [--dry]` applies helpers, then every `pixel.*` draft, then every case-body draft, with one backup,
  continuing past failures and reporting each. Applied drafts are renamed `applied.*`.
- `lab.mjs verify [--seed s] [--wait ms]` loads the real `index.html` headlessly, presses Play, runs a few seconds,
  reports page errors and screenshots to `out/game.png`. Run it after every apply.
- `PAINTING.md` is the painter's guide used when fanning the work out to parallel painters.

## Files

| file | role |
| --- | --- |
| `lab.mjs` | CLI + static/API server + Playwright driver |
| `extract.mjs` | pulls constants, helpers and draw functions out of `index.html`; the only writer back into it |
| `splice.js` | pure string ops shared by node and browser: case segments, splicing, draft parsing |
| `lab.js`, `lab.html`, `stubs.js` | the browser engine: fake entities, game-ground worlds, sheets, village, lint, palette |
| `REFERENCE.md`, `reference.json` | what each asset truly is in the genre + this game's style rules (json feeds the catalogue) |
| `catalog.template.html` | the browsable catalogue; `lab.mjs catalog` inlines the game code, drafts and engine into `out/catalog.html` |
| `drafts/helpers.js` | shared helpers drafts may call (`pixBuild`, `pixDraw`); installed by `apply helpers` |
| `AAA.md`, `aaa.mjs` | the AAA bar and its checker |
| `gen/` | sprite generator scripts (regenerate a draft instead of hand-editing grids) |
| `drafts/` | your work in progress; `out/` rendered PNGs; `backups/` pre-apply copies of `index.html` |

Playwright is resolved from this folder's `node_modules` or from `~/.claude/skills/screenshot-verify/`.
