# Holistic pass (2026-10-12): one town, one light, one team language

The bar every sprite family meets after the whole-game review. It came from simulating 4- and 8-player games and shooting
them at zoom 0.5 / 1 / 2 (`gameshots.mjs`), and from the team line-up (`lineup.mjs`): every building × 8 colours × 4 ages.
Read it alongside `AAA.md`, `LAYERING.md` and `REFERENCE.md`.

## What the review found

1. **You cannot tell whose town is whose.** At zoom 0.5 in an 8-player game bases are indistinguishable; at zoom 1 only the
   unit tunics show. Houses carry 0.6–1.8 % team pixels, temple/wonder 0.7 %, town hall ~1.5 %, mine ~1–2 %, farms 0 %, and the
   archery range drops from 15.6 % to 1.6 % in Castle (its awning loses team colour). Yellow and orange vanish against thatch and
   wheat, red against clay tiles, grey against stone, blue against slate.
2. **Too many ruler-straight lines** (the user: "a lot of straight lines in the building sprites … make some things a little
   more natural"). Ridges, eaves, wall bases, plinths, fences and paving edges are perfect 2:1 lines from end to end.
3. **Shadows disagree.** Trees paint a round "forest floor" blob into the sprite; edge trees also get the engine's directional
   cast shadow (`fxTreeShadows`); buildings get a sheared cast shadow; units an ellipse. The user asked for tree shadows to be
   consistent and more realistic.
4. Flags were vector polygons (anti-aliased, off-style); now pixel-art (engine).
5. Zoomed-out sprites dropped pixels (nearest-neighbour downscale); now filtered below 1× (engine).

## Team language (buildings)

- **Roof tint is the engine's job.** `pixBuild` leans every roof char toward the owner's colour (luminance-preserving,
  `pixTeamRoofs()`, menu option). It recognises the age kit's roof chars `αβγδεζη` and any chars listed in `spec.roofChars`
  (a string). If a building paints its roof with its own chars, either switch to `AK.R` or set `roofChars` — roof material only,
  never walls, stone, timber or ground. Check in `lineup.mjs <type>` that every roof leans.
- **Team cloth carries the detail.** Every building, every age, has at least one team-cloth feature on a *front* face (lit left
  wall or shaded right wall, not hidden behind the roof) that reads as a shape at 1×: roughly ≥ 40 contiguous team px for a
  1–2 tile building, ≥ 90 for 3×3, ≥ 150 for 4×4 and 5×5. Target total team share (`teamstat.mjs`) ≥ 3 % for small buildings
  and ≥ 2.5 % for big stone ones, without spraying single pixels.
- **Age vocabulary** (matches `pixAgeKit`): Dark — dyed hides and door hangings, cloth on a drying rack, a rag pennant on a
  pole; Feudal — painted shutters and door, a pennant, striped awnings on workshops; Castle — long banners on iron rods, team
  awnings; Imperial — gilt-fringed banners, team pennants on spires. Awnings that are team-striped stay team-striped in every
  age.
- **Edge team cloth** with `D` (team dark) or ink on its lower/shaded side so it separates from a same-hue background (yellow
  cloth on thatch, red on tiles).
- Code flags (`spec.flags` → `flag()`) are now pixel sprites; keep using them for the skyline but they do not count toward the
  cloth target.

## Natural lines

Variation is 1 px, never a broken iso grid. The user asked before for iso-correct floors, doors, windows and roof courses and
symmetry on formal buildings, so:

- **Vernacular and early buildings get the most** (houses, farms, lumber, mill, mine, Dark and Feudal everything); formal and
  late ones the least (temple, wonder, keep, Imperial). Age progression: Dark most organic → Imperial most regular.
- Ridges: a 1 px sag across a long ridge (Dark/Feudal), a slightly lifted end; eaves: thatch fringes ragged (already), shingle
  eaves with a lifted or missing shingle or two, tile eaves with an uneven drip line.
- Walls: corner posts and studs not all perfectly plumb (a 1 px kink), daub patches, stones that break the silhouette by 1 px
  at corners and plinth tops, moss/lichen and rain streaks low on stone, sooty stains above chimneys and doors.
- Ground contact: no hard footprint diamonds. Grass tufts and weeds overlapping the foot of walls, a worn path at doors, mud
  and straw by stables and farms, stones and chips by the mine and smith. Fences and palisades: posts of varied height and a
  little lean, sagging rails.
- Chimneys and poles may lean 1 px; smoke already drifts.
- Do not add random props or flags for the sake of it (the user dislikes clutter); naturalness comes from the edges and
  surfaces of what is already there.

## Shadows (one light)

Light from the upper-left; shadows fall to the right and a little toward the viewer (`SUN` in the RENDER FX block:
k 0.5, s 0.13, alpha 0.34). Everything that stands throws the same kind of shadow: the same direction, softness and darkness.
A painted ground shadow inside a sprite must agree with that (offset right/down, not a centred disc); contact shadow under
the trunk/feet is darker and tight, the cast part lighter and long.

## Process

Own worktree and branch per family (`git worktree add ../aoe-pt4-<family> -b pt4-<family> pt4-sprites`). Edit only your
family's `gen/` scripts and their drafts; do not edit `drafts/helpers.js` or engine code (put kit-local helpers in your family
kit; tell the lead if a shared change is needed). Loop: generate → `lab.mjs render pixel <id>` → Read the PNG → `lab.mjs aaa <id>`
→ `lab.mjs ages <id> --zoom 2` → `lab.mjs diff` → `lab.mjs apply pixel <id>` (into your worktree's index.html; then `git mv`
the draft to `applied.pixel.<id>.js` if apply did not) → `node tools/sprite-lab/lineup.mjs <id> --zooms 0.5,1,2` → Read it →
`node tools/sprite-lab/teamstat.mjs | grep <id>` → `lab.mjs verify`. Check every change against `LAYERING.md`. Commit on your
branch (attribution line as in git log), do not push or merge. Never write the franchise name anywhere.
