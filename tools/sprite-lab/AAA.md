# The AAA bar for painted sprites

What "AAA" means for this game's pixel art, as rules a painter can follow and `lab.mjs aaa` can check.
Read with `PAINTING.md` (format, sizes, anchors) and `REFERENCE.md` (what each thing is in the genre).
The bar is the best commercial pixel-art RTS/strategy work: every unit readable at 1× in a crowd, every
action telegraphed by its silhouette, nothing ever stiff or frozen.

`node tools/sprite-lab/lab.mjs aaa [id|all] [--verbose]` measures the numeric part. Passing it is necessary,
not sufficient: **read the rendered PNG** (`render pixel <id>`), especially the "1× on grass" rows.

## 1. Rendering rules (every sprite)

- **Selective outline.** The outer silhouette is a 1-px line in a dark, hue-shifted ink (not `#000`): ink
  `#24180f` for most things, or the darkest tone of the adjacent material (team dark `D` on cloth edges, `#1e2a33`
  on steel). On the lit upper-left edges the outline may lighten to the material's shade tone ("selective" outline)
  so the sprite does not look stickered. ≥ 55 % of silhouette edge pixels must be dark (lum < 70). Interior lines
  only where two materials of similar value meet (arm over tunic, shield over body).
- **Three-tone ramps.** Every material gets light / mid / shade, plus an optional 1-px specular on metal.
  Hue-shift: shades cooler and more saturated, lights warmer. Light from the **upper-left**. Shade the
  lower-right of every form, including legs, horses' bellies, sails, hulls.
- **Shared ramps** (use these so the cast reads as one game):
  | material | light | mid | shade | deep |
  | --- | --- | --- | --- | --- |
  | skin | `#f2d2b0` | `#e8c39e` | `#c9a07a` | `#8a5a3a` |
  | hair brown | `#7a5030` | `#5a3a1a` | `#3b2a1a` | |
  | steel | `#e6eaee` | `#9aa0a6` | `#5f656c` | `#1e2a33` |
  | leather / wood | `#a07a4a` | `#8a6a3a` | `#5a3a18` | `#3b2614` |
  | linen / cloth | `#efe6d2` | `#d9c7a0` | `#a8946e` | |
  | gold | `#ffe28a` | `#e1b12c` | `#a87a12` | |
  | team | `L` | `T` | `D` | ink |
- **Clusters, not noise.** No isolated single pixels (except a deliberate glint/eye), no pillow shading
  (shading that follows the outline inward), no banding (stair-steps of equal length side by side). Lines are
  clean pixel lines: 1-1-1 or 2-2-2 runs, not 2-1-3.
- **Team colour** on a large, front-and-back-visible area (tunic, barding, sail, cart cloth): at least ~12 px
  per frame for humans, ~25 for mounted/siege/ships. It must survive in the death frames (the corpse says whose).
- Sizes stay as `PAINTING.md` says (humans 14×24, up to 16×26 if a weapon needs it). Do not scale units up.

## 2. Animation rules

Frame sets and how the game plays them (`pixUnit` in `drafts/helpers.js`; `spec.fps` overrides the rates):

| set | when | default rate | frames (min) |
| --- | --- | --- | --- |
| `idle` | standing | 4 fps, looping, offset per unit | human/mounted/animal/ship 4, siege 2 |
| `ready` (optional) | in combat between blows | idle rate | 2–4 |
| `walk` | moving | 12 fps × `u.anim` (loops) | human/mounted 8, animal 6, siege/ship 4 |
| `attack` | the 0.3 s after each blow/shot | spread over 0.3 s, plays once | 4 (siege 5, ship 3) |
| `work` / named | gathering, building | 8 fps | 4 each |
| `death` | on death; last frame stays as the corpse ~12 s | 10 fps, once | human/mounted/ship 6, siege/animal 5 |

Frames may repeat inside a list to hold a pose (e.g. idle `[a,a,b,c,c,b]`).

- **Idle is alive.** Breathing (shoulders + head down 1 px for 2 frames), a weight shift, a blink (1 frame),
  a cloth/plume/tail/mane flick. Horses shift a hoof and swish the tail; sheep graze (head down); ships' sails
  billow and pennants flutter, with 1–2 px of foam moving at the waterline; siege engines creak (a rope or arm
  settles 1 px). Never a frozen pose.
- **Walk is a real cycle.** 8 frames: contact, down (lowest), passing, up (highest) for each leg. Arms swing
  opposite the legs. Head and torso bob 1 px with the down/up frames. At least one foot is on the ground line
  in every frame (lint checks the last two rows). Quadrupeds use a proper 4-beat walk or a canter (legs in
  diagonal pairs), with the rider bobbing against the horse. Wheels turn (spokes advance 45° per frame).
  Ships: bow wave and wake pattern scroll, oars stroke for galleys.
- **Attack reads at a glance.** Damage lands when the set starts, so frame 0 is the strike/release itself:
  melee = smear frame of the weapon at full extension → impact hold → follow-through → recover.
  Bows/crossbows = release (string snaps forward, arrow gone) → bow recoil → reach for the quiver → nock.
  Guns = muzzle flash + smoke puff (2 frames) → recoil → lower. Siege = arm/beam fires with motion, the frame
  rocks, then resets. Exaggerate: 2–3 px of lean is what makes a 20-px figure read as "hitting".
- **Death has weight.** Hit recoil → knees buckle / horse rears → falling → impact (1 px bounce) → settle.
  The final frame is a readable corpse lying on the ground (weapon dropped beside it, team colour visible).
  A lying body is wider than a standing one: give `death` its own size and anchor in `spec.anchors.death`
  (feet-point / ground point of the corpse, bottom row = ground). Cavalry: horse falls on its side, rider
  thrown. Siege: frame collapses into broken timbers/wheel. Ships: list, settle, sink (the hull loses rows at
  the waterline as it goes under; last frame = flotsam + bubbles). Animals: fall onto the side; **the last
  death frame is also the huntable carcass** the villagers gather from, so it must read as meat (sheep/deer/boar
  on its side, a little red).

## 3. Per-class checklist

- **Humans**: helmet/hat/hood silhouette distinct per type; weapon readable in idle; shield faces the viewer;
  idle 4+, walk 8, attack 4+, death 6+.
- **Villager**: separate work sets per job — `chop` (axe), `mine` (pick), `farm` (hoe/sickle, also used for
  berries/meat), `build` (hammer), each 4+ frames, plus `attack` (hunting with a spear/knife). Loads carried
  while walking are painted props (logs on shoulder, basket, sack of ore, stone block), shown by the unit
  draft over the walk frames.
- **Monk**: `convert` set 4+ (arms raised, glow is code), robes sway in walk.
- **Mounted**: horse anatomy (neck, head, ears, mane, tail, hocks), rider seated with legs on the flank.
  Barding/saddle cloth in team colour.
- **Siege**: show the mechanism working (torsion arm, counterweight, ram swinging, cannon recoil);
  wheels turn in walk.
- **Ships**: sails/pennants in team colour; idle shows wind and water; attack shows the weapon.
- **Animals**: wild (no team colour), idle grazing/ear twitch, death → carcass.
- **Resources**: three distinct variants, ≥ 10 colours, outline, ground contact (shadow is code).
- **Effects** (`fire`): `idle` small flame 6+ frames with a smoke wisp, `big` 6+ frames; anchor at the base.

## 4. Process

1. `cp drafts/applied.pixel.<id>.js drafts/pixel.<id>.js` (keep the applied file), repaint.
2. `lab.mjs render pixel <id>` → **Read the PNG**: frames ×6, every set at 1× on grass, the ×3 view.
3. `lab.mjs aaa <id> --verbose` until it says `AAA ✓`.
4. Unit wiring: `drafts/unit.<type>.js` whose body is `pixUnit(u,PIXELS.<id>,tc,{…})` plus any code props;
   `lab.mjs render unit <type>` and `lab.mjs lint unit <type>`.
5. Do not `apply`; the review pass applies everything together and runs `verify`.

## 5. Buildings

Buildings are *generated* pixel drafts (code before `export default` builds the grids with the kit in
`drafts/helpers.js`; see `PAINTING.md`). The same rules apply at a larger scale:

- **Faces**: lit left wall, mid top, shaded right wall (`box()` ratios ×0.78 / ×0.60), each a ramp, not one flat
  colour. A 1-px dark ink line on the silhouette and on roof ridges/eaves (≥ 45 % of silhouette edge pixels dark).
- **Material texture, drawn as structure, not noise**: roof tiles/shingles in courses with a lit lip per course
  and a shaded underside; thatch in strands with a darker eave edge; stone in staggered block courses with mortar
  lines and 2–3 block tones; timber as planks with grain and nail dots; plaster with half-timber beams. Corners
  get quoins; walls get a plinth course at the bottom; roofs overhang with a 1–2 px eave shadow on the wall.
- **Openings with depth**: windows and doors have a dark recess, a lit sill/jamb, and a frame. Doors and shutters
  or awnings, banners, roof trim in team colour — large enough to read at 1× (≥ ~40 px of team colour on a 2×2,
  ≥ ~80 px on a 3×3+).
- **Ground contact**: a foundation course or dirt/cobble apron where the walls meet the ground, props that tell
  what the building does (logs and a saw horse at the lumber camp, ore carts at the mine, hay at the stable,
  targets at the range, anvil and glow at the smithy, sacks at the mill, nets/barrels at the dock), each with its
  own ramp and outline.
- **Ambient life**, `idle` ≥ 2 frames (2–6), seamless loop played at ~4 fps (the case body picks the frame from
  `G.time`): chimney/forge smoke, forge glow pulse, a flickering window, water lapping at the dock piles, a
  banner rippling, a sail turning (mill sails are code), a door opening, chickens pecking. Wall/gate: torch flicker or
  banner. Flags stay code-drawn.
- **Construction** uses `{clip:p}` plus the game's code scaffolding. Do not paint stages.
- **Footprint**: nothing outside the footprint sideways beyond 6 px (eaves, flags), nothing below the bottom corner.
- Fire on damaged buildings is the engine's (`PIXELS.fire` at 75/50/25 % hp); keep roofs readable under it.
