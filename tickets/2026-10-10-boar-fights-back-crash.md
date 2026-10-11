# Wild boar fighting back crashes the simulation (`damageOf` reads `player(-1).techs`)

- **Status:** fixed 2026-10-11 on `main` (the `damageOf` guard below). The repro now runs the full 60 s without an exception.
- **Severity:** high. Any boar hunt stops the game from that tick on. Hunting boar is a documented
  action (the unit tooltip says "Fights back! Hunt with 3+ villagers").
- **Where:** `index.html:643`, `damageOf(att, target)`, on `main` as of commit b70e728 (2026-10-10).
- **Found by:** the LLM-agent harness on branch `llm-agents` (matrix 4, game
  `llm_qwen2.5:3b_v2_s2_d2_plains`); reproduced on `main` with the script below.

## Symptom

The first time a wild animal lands a hit, `update()` throws:

```
TypeError: Cannot read properties of undefined (reading 'techs')
    at damageOf (index.html:643:118)
    at fireAt (index.html:666:96)
    at attackStep (index.html:673:212)
    at animalStep (index.html:734:25)
    at updateUnit, update, stepSim, frame
```

`frame()` calls `stepSim()` without a try/catch, so the exception repeats every frame and units
after the boar in `G.units` never update again. The game is effectively frozen. In lockstep
multiplayer every peer hits the same tick, so the match halts for everyone.

## Root cause

`damageOf` starts with

```js
const pt=player(att.team).techs;
```

Wild animals have `team: -1`, and `player(t)` is `G.players[t]`, so `pt` is read off `undefined`.
The same function is reached for animals because `applyDamage` (line 652) switches a boar to
`state='attack'` with `target=att` when it is hit, and `animalStep` then runs the normal
`attackStep` / `fireAt` path.

The rest of the engine already guards this case: `unitStat` returns raw stats for `u.team<0`
(line 517), `applyDamage` checks `att.team>=0` before touching `lastHit`, and `kill` checks
`att.team>=0` before crediting kills. `damageOf` is the one path that does not.

## Fix (verified on a patched copy of `main`)

```js
// index.html:643, damageOf
const pt=att.team>=0?player(att.team).techs:{};
```

Nothing else in `damageOf` dereferences `pt` for an animal: the `fletch`/`chem`/`towers` terms
are only used when `att.kind==='bld'`, `siegeeng` only when `d.bonus` exists, and `sappers` only
for villagers. With the guard in place the repro below runs 60 game seconds without an error and
the boar keeps fighting (hp 75 → 63 against one villager).

Alternative with the same effect: have `player()` return a shared stub for negative teams
(`{team:-1, techs:{}, res:{}, stats:{}, age:0}`), which is what the harness does in
`agent/src/bridge.js` on the `llm-agents` branch. The one-line guard is smaller and local.

## Repro

Manual: start any game, select a villager, right-click a boar. The sim stops as soon as the boar
swings (about 20 s after the first hit lands, because the boar walks to its target first).

Automated (headless, uses the Playwright already installed for the agent harness):

```js
// node boar-repro.cjs [path/to/index.html]
const { chromium } = require('/Users/alec/me/aoe-llm-agents/agent/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto('file://' + (process.argv[2] || '/Users/alec/me/aoe/index.html'));
  const out = await p.evaluate(() => {
    window.render = () => {}; window.sfx = () => {};
    startGame({ seed: 1, players: 2, teams: 'ffa', mapType: 'plains', mapSize: 'medium', diff: 2, civ: 'random' });
    const v = G.units.find(u => u.team === 0 && u.type === 'villager');
    const boar = spawnAnimal('boar', v.x + 1.2, v.y, -1);
    cmdAttack(v, boar);
    for (let i = 0; i < 20 * 60; i++) {
      try { update(); } catch (e) { return { crashedAtTick: i, error: String(e), stack: e.stack.split('\n').slice(0, 5).join('\n') }; }
      if (boar.dead) return { crashed: false, boarDeadAtTick: i };
    }
    return { crashed: false, timeout: true, boarHp: boar.hp };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
```

Output on `main` today: `crashedAtTick: 445`, the stack above. Output on the patched copy:
`crashed: false, timeout: true, boarHp: 63`.

## After fixing

- Run the multiplayer tests in `tools/mp` (sim change).
- Remove the `window.player` shim from `agent/src/bridge.js` on `llm-agents` once this is merged;
  it is only there to work around this crash.
- Worth a grep for other `player(x.team)` reads reachable from an animal attacker. `fireAt` and
  the projectile splash at line 772 call `damageOf` with `pr.src`, so the guard above covers
  them; no other site was found.
