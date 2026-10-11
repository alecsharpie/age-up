# Layering pass (2026-10-11)

The user's recurring feedback: parts of sprites look like they are **floating** or sit on the wrong layer. The cause is
painting in a fixed code order with no sense of depth. Something drawn later always covers whatever is under it, even when
it should be behind or inside it.

Reference fix: `gen/civic/townhall.body.js` (search `underTower`, `hiddenByRoof`, `flip: true`). The side tower stands on a
corner tile inside the roofed footprint but was painted after the roof, so its base sat on the eave line with the colonnade
running underneath it, and it hovered. Now the tower's inner face is restored to what was under it wherever the main roof
surface is in front of it (worked out from tile depth and roof height), so the tower rises out of the roof. Its outer face is
flush with the wall and runs down to the plinth. Back roof slopes (the faces running from the back corner T: `[T,L,ap]` and
`[T,Rr,ap]`) slope away from the viewer, so downhill is *up* the screen; `course(..., { flip: true })` swaps the joint and
lip ends so the tiles overlap the right way.

## What counts as a layering defect

1. **Occlusion order.** A part that passes behind or into another volume (towers, chimneys, dormers, spires, gables,
   lean-tos, masts, poles, beams, chains, pillars, banners, decor) must be hidden wherever the other volume is in front of
   it. A later stamp covering something that should be in front of it is a defect.
2. **Contact.** Everything rests on something: the ground or plinth, a roof surface, a wall, a hand. There should be no
   bottom edge ending in mid-air or on a line that is really in front of it, no posts or poles whose foot is not on a
   surface, and no decor hovering beside a wall. Where two volumes meet, a contact line or shadow makes the join read.
3. **Slope direction.** Tiles, thatch and planks on faces that slope away from the viewer overlap toward the top of the
   screen (`flip`). Courses run parallel to that face's eave.
4. **Code overlays line up with the painting.** `flag(...)` poles, fire positions, garrison, relic and carry markers in the
   draw case (`drafts/applied.building.<id>.js` or `drafts/applied.unit.<id>.js`) must touch the surface they stand on.
   A flag pole's foot must be on a roof or tower top, not floating above or sunk into it.
5. **Units:** far-side limbs, weapons, shields, reins, mounts, carried loads and riders sit on the correct side of the body
   in every frame and facing (the far arm or leg behind the torso, a shield in front if held on the near side, a rider in
   the saddle and not hovering). Feet and wheels touch the ground at the anchor, and nothing pops layers between frames.

## How to work

- Work only in this worktree (`/Users/alec/me/aoe-layering`, branch `layering-pass`) and only on the files of your group.
  Run commands from the worktree root.
- To iterate on a sprite, `git mv tools/sprite-lab/drafts/applied.pixel.<id>.js tools/sprite-lab/drafts/pixel.<id>.js`
  (same for `applied.building.<id>.js` → `building.<id>.js` or `applied.unit.<id>.js` → `unit.<id>.js` if you must
  change the draw case, e.g. a flag offset). Regenerate from `gen/` (see `gen/README.md`); never hand-edit grids.
- Render with `node tools/sprite-lab/lab.mjs render pixel <id>` and **look** at `tools/sprite-lab/out/pixel.<id>.png`,
  cropped and enlarged (PIL is available: `python3 -c "from PIL import Image; ..."` with NEAREST resize). For draw-case
  changes also run `render building <id> --src draft` / `render unit <id> --src draft`. Check with
  `node tools/sprite-lab/lab.mjs aaa <id>`, which must still pass.
- **Do not run `apply`, `verify` or anything that writes `index.html`.** The lead applies everything at the end.
- Keep each fix minimal and in the sprite's existing style. Do not redesign sprites. If a sprite has no layering defect,
  leave it alone and say so.
