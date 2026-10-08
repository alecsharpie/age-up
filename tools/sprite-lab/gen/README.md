# Sprite generators

The node scripts the painters used to build the AAA sprite pass (2026-10-08). The drafts they write are ordinary
`drafts/pixel.<id>.js` files (literal grids for units/animals/resources/fire, generated code for buildings), so the game
never needs these; keep them to iterate on a sprite instead of hand-editing hundreds of grid rows.

Run from the **repo root** (paths are repo-relative). Each folder is one painter's kit:

| folder | sprites | entry point |
| --- | --- | --- |
| painter-villager | villager, monk | `node tools/sprite-lab/gen/painter-villager/build-villager.mjs`, `…/monk.mjs` |
| painter-melee | swordsman, spearman, axethrower | `node …/painter-melee/<sword|spear|axe>.mjs <draft path>` |
| painter-archers | archer, longbow, crossbowguard | `sh …/painter-archers/run.sh <id>` |
| painter-skirm | skirmisher, handgunner, tradecart | `node …/painter-skirm/<skirm|gun|cart>.mjs` |
| painter-cavalry | horseman, scout, knight | `node …/painter-cavalry/gen.mjs <id>` |
| painter-exotic | horsearcher, camelrider, warelephant | `node …/painter-exotic/<horsearcher|camel|elephant>.mjs` |
| painter-siege | catapult, ram, trebuchet, bombard | `node …/painter-siege/<id>.mjs` |
| painter-ships | fishing, transport, warship, fireship, siegeship | `node …/painter-ships/<id>.mjs` |
| painter-nature | sheep, deer, boar, wood, food, gold, stone, fire | `node …/painter-nature/<id>.mjs` |
| civic, mil, econ, forts | buildings (generated drafts are head+body files concatenated) | `build.sh` / `build.mjs` in each |

Some scripts write previews next to themselves; previews are not kept in git. Check a script's top before running it,
and after regenerating: `lab.mjs render pixel <id>` → `lab.mjs aaa <id>` → `lab.mjs apply pixel <id>` → `verify`.
