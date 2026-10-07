# Painting guide (pixel sprites)

How every asset in the game gets painted. Read `REFERENCE.md` for what each thing must look like.
All commands run from the repo root: `node tools/sprite-lab/lab.mjs …`.

## Two kinds of pixel draft, one format

A pixel draft is `drafts/pixel.<id>.js` exporting `{ id, anchor, palette, frames, scale?, kind?, footprint? }`.

- **Literal** (units, animals, resources, small props): frames are hand-painted multi-line strings, one char per
  cell, `.` transparent. Start with `lab.mjs new pixel <id> --size 14x24`. See `drafts/pixel.villager.js`.
- **Generated** (buildings): code before `export default` lays down the isometric faces with the kit in
  `drafts/helpers.js` (`pixGrid`, `pixIsoBox`, `pixIsoRoof`, `pixPoly`, `pixLine`, `pixRect`, `pixStamp`, `pixText`),
  then hand-painted stamps add doors, windows, props. See `drafts/pixel.house.js`. Stored in the game as code.

Palette keys: any single character. `T` = team colour, `D` = team dark, `L` = team light (resolved per player).
Use the house palette families from `REFERENCE.md`; every sprite needs 2–3 tones per material (lit / mid / shade).

## Sizes and anchors (scale 1 everywhere, no mixed pixel sizes)

| kind | grid | anchor | notes |
| --- | --- | --- | --- |
| human unit | 14×24 | `[7,24]` feet, bottom centre | figure ~21 px tall; face **right**; the game mirrors for left |
| mounted / big unit | 22×28 to 28×30 | bottom centre | horse body ~20 wide, rider on top; elephant up to 30 wide |
| siege / cart | 24×22 to 30×26 | bottom centre | wheels on the ground line; show the mechanism |
| ship | 36×36 | bottom centre, at the waterline | hull sits *on* y=anchor; mast up; sail in team colour |
| animal | 16×14 to 22×20 | bottom centre | sheep, deer, boar; wild = no team colour |
| resource | 64×80 | `[32,68]` the ground point | three variants = three frames of `idle`; gold/stone shrink in code |
| building w×h tiles | `(w+h)*32+4` × `(w+h)*16 + walls + roof + 10` | bottom corner of footprint `[w*32+2, GH-4]` | `kind:'building'`, `footprint:[w,h]`; keep inside the footprint sideways |

Light comes from the **upper-left**: left-facing faces lit, right-facing faces in shade, tops brightest.
Draw crisp: no anti-aliasing tricks, no stray single pixels, 1-px dark outline only where a silhouette needs it.

## Frame sets the drafts ask for

- Units: `idle` (1), `walk` (4: stride, pass with one boot lifted and body up 1px, stride, pass other boot),
  `attack` or `work` (2–3). Cavalry: legs cycle; ships: 2 bob frames or none (code bobs); siege: wheels turn (2).
- Buildings: `idle` (1, or 2–4 for animated parts like mill sails / smoke / forge glow). Construction is **not**
  painted: the draft draws with `{clip:p}` so the sprite rises out of the ground.
- Resources: `idle` = variants `[v0, v1, v2]`.

## Wiring a sprite into the game (the case-body drafts)

Unit `drafts/unit.<type>.js` (context already at the feet, mirrored by facing):
```js
const moving=u.goal&&u.state!=='idle'&&!(u.state==='gather'&&u.phase==='gathering');
const frame=moving?'walk':u.swing>0?'attack':'idle';
const i=moving?Math.floor(u.anim*12):u.swing>0?Math.floor((0.3-u.swing)/0.3*3):0;
pixDraw(PIXELS.<id>,frame,i,tc);
```
Building `drafts/building.<type>.js`:
```js
pixDraw(PIXELS.<id>,'idle',Math.floor(G.time*4),tc,bm.Bm[0],bm.Bm[1],{clip:p});
if(b.built)flag(cx+(w-h)*HW/2,cy+(w+h)*HH/2-<height>,b.team,16);   // flags stay code-drawn so they wave
```
Resource `drafts/resource.<kind>.js` (inside resSprite; `x` is the 64×80 sprite ctx):
```js
x.imageSmoothingEnabled=false;const c2=pixFrame(PIXELS.<kind>,'idle',v,null);x.drawImage(c2,ox-PIXELS.<kind>.anchor[0],oy-PIXELS.<kind>.anchor[1]);
```
Mix code where it is better: carried resources, flags, smoke, projectiles, mill sails rotating by angle.

## The loop (do not skip the looking)

1. `new pixel <id>` (or copy a generated draft) and `new <kind> <type>` for the case body.
2. Paint. 3. `render pixel <id>` → **Read the PNG**. Fix. Repeat until the 1× cell reads at a glance.
4. `render <kind> <type>` → **Read** draft-vs-current; `lint <kind> <type>`; for buildings check the clip stages.
5. Never `apply` from a painting task; the review pass applies everything together.

## Quality bar

- Reads at 1× in the "on grass" cell: what is it, whose is it, what is it doing.
- Silhouette distinct from its neighbours (archer ≠ skirmisher ≠ longbow: bow size, hood, shield).
- Team colour visible from the front and back: tunic / sail / barding / door / awning / roof trim.
- Nothing below the anchor line, nothing outside the footprint sideways (lint checks both).
