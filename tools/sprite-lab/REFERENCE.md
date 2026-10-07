# Reference: what "true" and "delightful" mean here

Two sources of truth. **The genre** (the Western European architecture set as the default look) tells us what each
thing *is*. **This game's style** tells us how to say it in 64×32 tiles with flat-shaded canvas shapes.
Footprints that differ from the genre are design choices of this game, not errors, and are noted as such.

## House style (measured from the current code — keep to it)

- Tile 64×32 (`TW×TH`), half sizes `HW=32`, `HH=16`. `(cx,cy)` is the **top** corner of a tile or footprint;
  `corners(cx,cy,w,h,z)` gives `T` top, `Rr` right, `Bm` bottom, `L` left. Units stand at tile centres.
- Light from the **upper-left**: `box()` paints the top ×1.05, left face ×0.78, right face ×0.60 of the base colour.
  Everything new must agree: highlights up-left, darkest faces lower-right.
- Shadows: units get an ellipse `rgba(0,0,0,.25)` of radius r (7 humans, 10 cavalry/siege, 14 ships).
  Resources have an ellipse at the ground point. Buildings cast none (a soft lower-right shade is a candidate).
- Line weights at 1×: 1px edges, 1.5px weapons and masts, 2–2.5px timbers. Draw crisp at 1×; zoom only to inspect.
- Scale: humans ≈ 20–24px tall, mounted ≈ 28–32px, ships ≈ 40px. House 14 tall + 10 roof, barracks 22,
  tower 42, keep 36 + 16 turrets. Rule of thumb: the taller the footprint-to-height ratio, the more important.
- Team colour (`tc.c` main, `tc.d` dark, `tc.l` light): on flags, tunics, shields, awnings, doors, horse
  barding, sails, cart cloth. Every owned thing needs at least one clear patch of it (lint checks this).
  Teams: Blue `#2f6fd6`, Red `#cf3b2b`, Green `#3ba34a`, Yellow `#d9b13a`; wild `#cfc4a8`.
- Palette families in use (see `lab.mjs palette`): timber `#8a6a3a #5a3a18 #4a3520 #6a4a2a`, plaster/thatch
  `#d9c7a0 #c9b58e #e5dcc5`, stone `#8d8478 #7d7468 #9a8b78 #6f6a60`, roof reds `#a0482e #8a3a2a #c9452a`,
  gold `#e1b12c #c99a2a`, skin `#e8c39e`, steel `#9aa0a6 #cfd4d8`, grass `#5f9a3e..#6aa64a`, water `#2f6fb0`.
  Prefer an existing colour; introduce a new one on purpose (lint lists new colours).
- Construction: progress `p` 0→1. Foundation outline is dashed by the game; the body should rise with
  `z(height)`; roofs, battlements, flags and props appear only late (`p>0.6`, `b.built`). Doors and team
  patches should also wait (the current house paints its door at p=0.05 — a thing to fix).
- Animation is sampled from `G.time`: flags `sin(G.time*4)`, mill sails `G.time*1.2`, smoke `(G.time*0.6)%1`,
  ships bob `sin(G.time*2+id)`, units walk `sin(u.anim*14)`, work `sin(u.anim*10)`, attack `swing` 1→0 over 0.3s.
- Depth: the game sorts by `x+y`; sprites must never draw below their base line (`Bm` for buildings,
  the shadow ellipse for units) or they will overlap the tile in front. Sideways spill past the footprint
  must be small (flags, eaves ≤ 6px).

## Buildings — what the real thing says

| type | here | classic RTS (Western European) | silhouette essentials | delight |
| --- | --- | --- | --- | --- |
| townhall | 3×3 | Town Center is 4×4 | big hipped/thatch roof over an **open pillared ground floor**, side tower, flag | villagers visible inside; flag; smoke in Imperial |
| house | 2×2 | 2×2 | Dark Age wattle hut with thatch; Feudal timber frame; Castle half-timber + tile; Imperial stone | chimney smoke at night/cold; door in team colour |
| farm | 2×2 | 3×3 | crop rows in a wooden fence, farmer path, crops golden when mature | rows that grow with time; fence posts at corners |
| lumber | 2×2 | 2×2 | open shed, stacked logs, saw horse, axe in a stump | wood chips, log pile grows |
| mine | 2×2 | 2×2 | timber headframe over a pit, ore cart, piles of gold/stone | glints on gold nuggets |
| mill | 2×2 | 2×2 | stone base + **windmill sails** (Western); hand quern + sacks in Dark Age | turning sails (already), sacks of grain |
| barracks | 3×3 | 3×3 | fortified yard, corner turrets, training dummy, spear rack, banner | banner in team colour, straw dummy |
| archery | 3×3 | 3×3 | tent/awning + **straw targets** with red/white rings | target already; add arrows stuck in it |
| stable | 3×3 | 3×3 | long roof, open stalls with horses, hay bales, fenced paddock | horse heads in stalls, hay |
| siege | 3×3 | 4×4 | half-built engines, A-frame crane, stacked wheels, timber piles | a wheel leaning on the wall |
| smith | 2×2 | 3×3 | forge chimney with **smoke**, anvil, hanging tools, glow in the doorway | glow pulse, sparks |
| temple | 3×3 | 3×3 | Monastery: chapel with **bell tower**, round window, cross; dome belongs to the Middle Eastern set | relics stored = faint gold glow in the window |
| tower | 1×1 | 1×1 | round or square stone tower with wooden hoarding; taller per upgrade | arrow slits, flag at top |
| dock | 2×2 | 3×3 | piers on stilts over water, boathouse, crane, nets, barrels | lapping water lines around posts |
| market | 3×3 | 4×4 | stalls with **striped awnings**, pots, cloth, fruit, a courtyard | awning in team colour, goods |
| wonder | 5×5 | 5×5 | Britons: cathedral (Chichester); Franks: Chartres. Gothic: spire, rose window, buttresses | gold spire tip, glint |
| wall | 1×1 | 1×1 | palisade (wood) in Dark Age, stone wall from Feudal; segments **connect** | crenellations line up |
| gate | 1×1 | 1×4 | arch with portcullis between two flanking towers | portcullis raises for friends |
| keep | 4×4 | Castle 4×4 | tall keep, four corner towers, battlements, flags, gate | flags at corners, arrow slits |

Damage: classic RTS shows small flames at <75% hp, more at <50%, heavy at <25%. Destroyed → rubble that fades.
Construction: four visible stages — foundation, scaffolding + low walls, walls + roof frame, finished.

## Units — the one thing each must read as, at 20px

| type | reads as | team colour on |
| --- | --- | --- |
| villager | tunic, tool in hand (axe/pick/sickle/hammer), **carried resource visible**: logs on shoulder, basket, sack | tunic |
| swordsman | sword + **round shield**, helmet from Man-at-Arms | tunic, shield boss |
| spearman | spear taller than the man, small shield, pointed cap | tunic |
| archer | bow, **quiver on back**, no armour | tunic |
| skirmisher | javelin bundle, small round shield, light hide armour | tunic |
| horseman / scout | light horse, no barding; scout has no helmet | saddle cloth |
| knight | **barded horse**, lance, kite shield | barding, shield |
| camelrider | tan camel with hump, rider with spear | saddle cloth |
| warelephant | big grey elephant, howdah or armoured rider, slow | howdah cloth |
| longbow | bow as tall as the man, green hood, quiver | tunic |
| crossbowguard | crossbow held level, pavise shield | tunic, pavise |
| axethrower | throwing axe, Frankish helmet, axe-throw arc | tunic |
| horsearcher | light horse + bow, shooting while riding | saddle cloth |
| catapult (mangonel) | four-wheel cart, throwing arm with bucket | wood trim |
| ram | **covered** ram: a roofed hut on wheels, log protruding | roof trim |
| trebuchet | packed: wheeled frame; unpacked: tall A-frame, counterweight, sling | frame trim |
| monk | hooded robe, staff/cross; **relic held overhead** glows gold | sash |
| tradecart | ox + two-wheel covered cart | cover cloth |
| fishing | small boat, mast, net; transport: wide flat hull; warship (galley): long, oars, ram prow, sail | sail |
| sheep | white fleece, black face; deer: tan, stag antlers; boar: dark, tusks | sheep marker when owned |

Animation truth: feet move when moving (wheels turn or bob for carts/siege), weapons swing on attack
(ships: a volley), villagers chop/mine/sow when working, ships bob, monks' halo when converting.

## Resources & terrain

- Trees: oak (round canopy, three tones), pine (stacked cones); stump when depleted. Berry bush: dark green
  mound with red berries. Gold: rock pile with yellow nuggets; stone: grey slabs. Fish: ripples + silver shapes.
  Relic: gold reliquary with a soft glow.
- Terrain: grass with variation, dirt roads around the Town Center, shallows lighter than deep water, sand
  shore, dark forest floor under trees. Shorelines get a foam line.

## Delight checklist (cheap wins that make it feel alive)

1. Everything owned has a visible, moving flag or banner.
2. Smoke, sails, water and flags move on `G.time`; nothing feels frozen.
3. Villagers show what they carry; farms show crops; mines show ore.
4. Damaged buildings burn; destroyed ones leave rubble.
5. Attack reads at 1×: an arm swings, a bow bends, a stone flies with a shadow.
6. Construction visibly rises; a finished building "pops" its roof and flag.
7. Silhouettes differ at a glance: every unit line has one unmistakable prop.
