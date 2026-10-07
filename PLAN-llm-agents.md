# Plan: small local models playing Age Up

Goal: get 0.5B to 8B local models to play `index.html` as a real opponent, through a harness that
plays to their strengths (short decisions over a small vocabulary) and hides their weaknesses
(spatial reasoning, long contexts, micro). Then measure it the way `agentic-evals` did: a model
ladder, pre-registered predictions, full traces, and a scoreboard against the scripted AI.

## 0. What we already have

**The game is nearly headless and already exposes a debug API.**

| Fact | Where | Why it matters |
|---|---|---|
| Sim is `update()` at 20 TPS, pure state; rendering is separate in `frame()` | `index.html:638`, `:1093` | We can tick the sim as fast as we like without rendering |
| Only `sfx()` (wrapped in try) and `endGame()` touch DOM/audio from the sim | `index.html:965`, `:1101` | Headless Chromium runs it untouched; a Node stub needs 3 shims |
| Seeded RNG (`mulberry32`) | `index.html:255` | Fully deterministic replays, same as `check-determinism.mjs` in agentic-evals |
| `window.dbg = {start, ff, ai, G, summary}` | `index.html:1119` | `dbg.ai(team,false)` turns off scripted AI for a seat; `dbg.ff(sec)` fast-forwards |
| Scripted AI `aiThink(p)` runs every 20 ticks per AI seat | `index.html:689` | It is both the baseline opponent and a library of helpers (`placeNear`, `buildWith`, `farmSpot`, `needKind`, rally/attack logic) |
| Command primitives: `issue(u,{k,...})`, `tryTrain`, `tryAge`, `tryResearch`, `tryPlace`, `marketBuy/Sell`, `townBell` | `index.html:445-760` | The whole action space is ~15 functions |
| 6 civs, 27 unit types, 19 buildings, ~35 techs | `index.html:152-240` | Big enough that a model has to choose; small enough to list in a prompt |

**Lessons from the sibling projects that shape every decision below** (`~/me/agentic-evals/README.md`,
`~/me/agent-ecology/notes/`):

1. Floor is ~0.5B. Below that nothing works. 1.5B is the sweet spot for cost vs sense.
2. Grammar-constrained JSON with enums gave **zero parse failures** (agent-ecology). Constrained
   free-form JSON did *not* help and hurt Llama 1B via runaway `thought` strings (agentic-evals).
   So: constrain to enums, cap or drop the thought field.
3. **Strong position bias**: Qwen 1.5B picks the first listed option 62% of the time. Shuffle option
   order every call.
4. Small models **repeat themselves** (92% repeat-own-pick after 5 losses) and ignore refusals. A
   loop guard that says "no" changes nothing; the harness must *remove* the option instead.
5. "The example is the program": worked examples get copied, including their constants. Few-shot
   examples must be generic or absent.
6. Wording and labels matter as much as model size. Concrete names ("archer") beat abstract ("A").
7. Prompt effects that look real on one task set vanish on a fresh one. Pre-register, use a
   held-out map/seed set, use Wilson intervals (`agentic-evals/src/lib/stats.ts`).
8. Greedy decoding is a best case; sampling trades loops for confabulation. Report both T=0 and T=0.7.

## 1. Architecture

```
┌──────────────────────┐   JSON observation   ┌──────────────────────┐   OpenAI-style   ┌───────────────┐
│ Game (headless       │ ───────────────────► │ Harness (Node/TS)    │ ───────────────► │ Ollama        │
│ Chromium via         │                      │  - observation text  │                  │ (or WebLLM)   │
│ Playwright, or Node  │ ◄─────────────────── │  - legal intents     │ ◄─────────────── │ qwen2.5:1.5b  │
│ stub)                │   intent → commands  │  - parse / validate  │   {"intent":..}  │ gemma3:4b ... │
└──────────────────────┘                      │  - executor (uses    │                  └───────────────┘
                                              │    aiThink helpers)  │
                                              │  - trace logger      │
                                              └──────────────────────┘
```

**Three layers, with a sharp boundary between "LLM decides" and "code executes":**

| Layer | Who | Cadence | Does |
|---|---|---|---|
| Reflex | code (existing `aiThink` pieces) | every 1s | idle villagers to work, re-assign orphaned builds, bell on raid, army defends home, scout wanders, farms replace exhausted berries |
| Macro | LLM | every 30s game time (tunable), or on an event (attacked, age up, 60s of idle resources) | one or two **intents** from a menu |
| Policy | code | on each intent | maps an intent to primitives: picks the site, the villagers, the building, the target |

The LLM never sees coordinates and never picks a unit id. It sees counts, ratios, deltas and a
list of things it is *allowed* to do right now.

### 1.1 Intent vocabulary (the whole action space)

Keep it under ~25 tokens of choice. Each intent is one enum value; the schema only lists the ones
that are currently legal (affordable, age-gated, not already queued), which is how we kill the
"repeat the same illegal call forever" failure for free.

```
eco:     villagers | house | farms | lumber_camp | mining_camp | mill | dock | fishing_boats | market
         rebalance_food | rebalance_wood | rebalance_gold | rebalance_stone
         sell_wood | sell_food | sell_stone | buy_food | buy_wood
tech:    age_up | research_eco | research_attack | research_armor | upgrade_main_unit
mil:     barracks | archery | stable | siege_workshop | smith | tower | keep | walls
         train_swordsman | train_spearman | train_archer | train_skirmisher | train_horseman
         train_knight | train_ram | train_catapult | train_trebuchet | train_monk | train_unique
strat:   attack | raid_villagers | defend | retreat | scout | wonder
none:    wait
```

Each intent has a code policy. Examples:

- `farms` → `farmSpot()` x2, `buildWith('farm', pos, 1, 'wood')`.
- `rebalance_gold` → bump `want.gold` for the next N reflex ticks (the reflex layer's `needKind()`
  already redistributes idle and over-allocated villagers).
- `attack` → the existing wave logic with `threshold` forced to current army size; `retreat` →
  `S.attacking=false`, move to rally.
- `train_archer` → `tryTrain` on every built archery with a short queue, bounded by spare resources.

Intents are *sticky*: `train_archer` keeps queueing archers until the model says something else or
resources run dry. That matters because 30s between decisions is long and small models answer
one thing at a time.

### 1.2 Observation (what the model reads)

Plain text, ~300 tokens, numbers rounded, no coordinates, no ids, newest-first history capped at
3 lines. Format is the same every call so the model learns the shape from the system prompt alone.

```
Time 7:30, Feudal Age (Castle Age costs 800 food 200 gold; you have 620 food 140 gold).
Civ: Woodfolk (wood +15%, free lumber camps, unique: Longbowman).
Resources: food 620 (+41/min)  wood 310 (+55/min)  gold 140 (+12/min)  stone 200 (+0/min)
Villagers 18/22 target: food 8, wood 7, gold 3, stone 0, idle 0. Pop 24/30 (1 house underway).
Buildings: townhall, 2 house, 3 farm, lumber, mine, barracks, archery. Building: house.
Army: 4 swordsman, 2 archer. Queued: archer x1. Smith techs: none.
Enemy (Red, Steppe Riders): seen 3 horseman, 1 scout near your lumber camp 40s ago.
   Known enemy buildings: townhall, stable, barracks. Enemy age: Feudal.
Recent: you chose farms (2 placed), then train_archer (1 queued).
Alerts: horsemen counter archers; spearmen counter horsemen.
```

The `Alerts:` line is where code injects *counter advice derived from `UNITS[].bonus`*, so the
model does not have to know the unit table. That line is the single biggest lever we have for
making a 1.5B model look smart, and it is honest: it is information the UI already gives a human.

Fog of war is respected: enemy info comes only from `visibleTo(team, ...)` / `exploredBy`, with a
"last seen N s ago" memory the harness keeps.

### 1.3 Decision format

Ask for one object, grammar-constrained (Ollama supports `format: <json schema>`; WebLLM supports
`response_format.schema`):

```json
{"intent": "<enum of currently legal intents>", "second": "<enum, optional>", "why": "<=12 words"}
```

- `why` is capped by `maxLength` (the "thought cap" from agentic-evals Part 3). It is for the trace,
  not for the model. Variant B drops it entirely.
- Option order in the prompt is shuffled per call; the enum in the schema is the same set.
- Temperature 0 by default, seed = (game seed, decision index) so a replay reproduces the run.
- `max_tokens` 60. Stop after one object.

Fallback ladder when the reply is unusable (should be ~0% with constraints, log it anyway):
`JSON.parse` → regex for any legal intent word → `wait`. Tag every decision `ok | repaired | failed`.

### 1.4 Memory

No long context. The model gets: system prompt, current observation, last 3 decisions and their
outcome ("train_archer: 1 queued", "attack: lost 4 units, retreated"). That is it. A sliding
window of 3 is the agent-ecology finding (5-round memory did nothing at 1.5B); we can test 0 / 3 / 8.

One optional structured memory the *code* maintains and prints: `Plan:` a one-line goal the model
set earlier (`goal: "boom to castle then knights"`), re-shown each turn. Cheap to try, easy to ablate.

## 2. Running the game headless

Two options; start with (a), keep (b) as the speed path.

**(a) Playwright + headless Chromium** (already installed: `~/Library/Caches/ms-playwright/chromium-*`;
`agentic-evals/scripts/run-headless.mjs` is the template).

- `page.goto('file:///Users/alec/me/aoe/index.html')`, then `page.evaluate` against `window.dbg`.
- Add ~40 lines to `index.html` under `window.dbg`:
  - `dbg.obs(team)` → JSON observation (counts, income over the last 60s, visible enemies, legal intents).
  - `dbg.act(team, intent)` → runs the policy for that intent, returns `{ok, note}`.
  - `dbg.reflex(team)` → the reflex subset of `aiThink` (needs `aiThink` split into `aiEco`, `aiBuild`, `aiMil` so pieces can be called separately; pure refactor, no behaviour change, verified by a determinism replay before/after).
  - `dbg.ffUntil(sec)`, `dbg.state()` → `{over, winner, time, scores}`.
- Game speed: `ff(30)` runs 600 ticks of `update()`; on an M-series Mac that is ~tens of ms. A full
  20-minute game is seconds of sim plus 40 LLM calls at ~1s each. So wall time ≈ LLM time.

**(b) Node stub**: wrap the `<script>` body with shims for `$`, `document`, `window`, `requestAnimationFrame`,
`localStorage`, `AudioContext`, extracted at build time by slicing `index.html` between `<script>` and
`</script>`. Faster and no browser, but needs maintenance whenever the UI code changes. Do this
only if (a) is too slow for the experiment matrix.

## 3. Model backend

`agentic-evals` and `agent-ecology` share an `LLM` interface (`complete(messages, {temperature,
maxTokens, jsonSchema, seed, stop})`). Reuse that interface; add an **Ollama adapter** so runs
happen in Node without WebGPU:

```ts
// POST http://localhost:11434/api/chat
{ model, messages, stream:false, format: jsonSchema, options:{ temperature, seed, num_predict: maxTokens } }
```

Installed now (all 18-24 months old): `gemma2:2b`, `gemma3:latest` (4b), `gemma3:12b`, `llama3.1:8b`,
`codellama:7b`. Pull a proper ladder that mirrors the earlier projects:

| Tier | Model | Why |
|---|---|---|
| floor | `qwen2.5:0.5b` | known floor from agentic-evals |
| small | `qwen2.5:1.5b`, `llama3.2:1b`, `gemma2:2b` | the band the question is about |
| mid | `qwen2.5:3b`, `gemma3:4b`, `qwen3:4b` | where instruction following gets reliable |
| ref | `qwen2.5:7b`, `llama3.1:8b`, `gemma3:12b` | ceiling for "what does the harness cost us" |

Keep the WebLLM adapter working too, so a "watch a 1.5B model play live in the browser" page is
possible later (the single-file house style). Not needed for the first results.

## 4. Baselines and scoring

**Opponent**: the scripted AI at each of the 5 difficulties (`AI_DIFF`, `index.html:687`). Being a
scripted bot with known behaviour, it is a stable yardstick; the LLM seat is `team 0` with `dbg.ai(0,false)`.

**Control agents** (crucial, same lesson as agent-ecology's `run-rule.ts`):

1. `random-legal`: picks a uniformly random legal intent. If a model does not beat this, the harness is doing the work.
2. `scripted-as-intents`: the scripted AI's own decisions re-expressed as intents. Upper bound for the intent layer: if this is much worse than raw `aiThink`, the vocabulary or policies are lossy and no model can fix it.
3. `wait-only`: reflex layer alone. Measures how much the reflexes carry.

**Metrics per game** (from `dbg.summary()` and `computeScore`, `index.html:636`):
win/loss/timeout, score at end, time of first attack, age-up times, villager count at 10 min,
army at 15 min, resources floating (a waste signal), idle villager-seconds, decision validity rate,
decisions per minute, LLM latency. Fixed cap of 25 game minutes; a timeout is scored by score ratio.

**Matrix for the first pre-registered run**: 4 models × 2 harness variants × 2 difficulties (Easy,
Normal) × 8 seeds × T=0 → 128 games, each ~1-2 min wall time with Ollama, so a couple of hours. Maps:
`plains` and `forest` only at first (no water, no nomad). Hold out 8 more seeds and the `lakes` map
for the replication pass (the agentic-evals Part 4 lesson).

**Pre-registered predictions** to write before running (format from the agentic-evals README):
- 0.5B will not beat `random-legal` on Normal.
- 1.5B beats `random-legal` but loses to the scripted AI on Normal; beats it on Easy in >50% of seeds.
- `Alerts:` counter-advice line is worth more than 3-turn memory.
- No small model will ever choose `retreat`; `attack` will be chosen too early (repeat bias). Check the trace.

## 5. Harness variants to ablate (one knob at a time)

| Variant | Hypothesis |
|---|---|
| A. baseline (intents + alerts + 3-memory, T=0) | |
| B. no `why` field | runaway-thought risk removed; no accuracy loss |
| C. no alerts line | counters are where the model fails without help |
| D. legal-only enum vs full enum + refusal | removing options beats refusing (agent-ecology) |
| E. decision cadence 15s / 30s / 60s | more calls does not mean more sense |
| F. one-line `goal` memory the model sets | cheap planning; probably ignored at 1.5B |
| G. T=0.7, 3 trials | loops break, but does chaos lose games? |

## 6. Milestones

1. **Headless driver** (half a day). Playwright script, `dbg.obs/act/reflex/ffUntil`, split `aiThink`
   into callable pieces, determinism replay test (same seed, same `summary()` before and after the refactor).
2. **Intents + policies + control agents** (1 day). `random-legal`, `scripted-as-intents`, `wait-only`.
   Run the controls first; fix the vocabulary until `scripted-as-intents` ≈ raw scripted AI.
3. **Ollama adapter + prompt** (half a day). Reuse the `LLM` interface from `agentic-evals/src/lib/types.ts`.
   Play 5 games with `qwen2.5:1.5b` by hand and read every trace before touching a metric.
4. **Experiment runner + traces** (half a day). Copy the shape of `agentic-evals/src/lib/experiment.ts`:
   resumable by run key, JSON log per decision (observation, prompt, raw output, parsed, policy result,
   game time), `analyse.ts` with Wilson intervals.
5. **Pre-register, run, replicate** (compute time). Write predictions, run the matrix, then the
   held-out seeds and map.
6. **Write-up page** (optional, later). Single-file `index.html` in the house style, with a
   "watch it play" mode that uses the WebLLM adapter and draws decisions on the minimap.

## 7. Risks and how the design handles them

- **Spatial decisions.** Models cannot place buildings; the policy layer does (`placeNear`, `farmSpot`).
  The model never sees a coordinate.
- **Repeat bias.** Sticky intents plus legal-only enums mean repeating a choice is harmless or impossible.
- **Early aggression.** `attack` is only legal above a code-set minimum army and after a barracks
  exists; the model chooses *when*, not *whether it is sane*.
- **Prompt leakage from examples.** No few-shot examples in the first run. If added later, they use
  resource numbers that cannot occur in game (e.g. 9999) so copying is detectable in traces.
- **Over-crediting the harness.** The three control agents bound the LLM's contribution from below
  and above. The question we answer is "does the model add decisions worth having on top of
  reflexes", not "can a 1.5B model play RTS".
- **Non-determinism from Ollama.** Seeded calls are mostly reproducible but not guaranteed across
  runs; log raw outputs and replay from logs for re-scoring (`rescore.ts` pattern).

## 8. Open questions (decide at milestone 2, after reading traces)

- One intent per call or two? Two halves the call count but doubles the schema branches.
- Should `villagers` be an intent at all, or a reflex (the scripted AI trains to a target count)?
  Making it a reflex removes the most common "obvious" choice and forces the model to spend its
  decision on something interesting. Test both.
- Event-driven calls (on raid, on age-up) in addition to the fixed cadence.
- Team games later: 2v2 with one LLM seat and one scripted ally exercises the tribute/trade intents.
