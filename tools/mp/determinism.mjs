// Determinism harness for the lockstep multiplayer.
//
// Opens the game in two separate headless browser contexts, plays the same seeded game with the same
// seeded random commands in each, and compares the state hashes. Also runs the in-page self-test
// (re-run and replay-from-log) in each context. Any mismatch means the sim is not deterministic and
// multiplayer would desync.
//
//   node tools/mp/determinism.mjs            # defaults: seeds 1..3, 120 game seconds each
//   SEEDS=5 SECS=300 node tools/mp/determinism.mjs
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.resolve(here, '../../index.html');
const nSeeds = Number(process.env.SEEDS ?? 3), secs = Number(process.env.SECS ?? 120);

async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { console.log('bundled chromium unavailable (' + e.message.split('\n')[0] + '), trying system Chrome'); return chromium.launch({ headless: true, channel: 'chrome' }); }
}
const browser = await launch();
const pages = [];
for (let i = 0; i < 2; i++) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => !!window.dbg);
  pages.push(page);
}
let bad = 0;
for (let seed = 1; seed <= nSeeds; seed++) {
  const fseed = seed * 7919;
  const [a, b] = await Promise.all(pages.map(p => p.evaluate(([s, t, f]) => { const r = dbg.fuzzRun({ seed: s }, t, f); return { hs: r.hs, final: r.final, cmds: r.log.length, tick: r.tick }; }, [seed, secs, fseed])));
  const first = a.hs.findIndex((v, i) => v !== b.hs[i]);
  const same = first < 0 && a.final === b.final;
  console.log(`seed ${seed}: cross-context ${same ? 'OK' : 'MISMATCH at tick ' + first * 100} · ${a.cmds} cmds · ${a.tick} ticks · hash ${a.final.toString(16)} vs ${b.final.toString(16)}`);
  if (!same) bad++;
  const self = await pages[0].evaluate(([s, t, f]) => dbg.selftest(s, t, f), [seed, secs, fseed]);
  console.log(`seed ${seed}: in-page rerun ${self.rerun ? 'OK' : 'MISMATCH'} · replay-from-log ${self.replay ? 'OK' : 'MISMATCH'}${self.ok ? '' : ' (first bad tick ' + self.firstBadTick + ')'}`);
  if (!self.ok) bad++;
}
await browser.close();
console.log(bad ? `FAILED: ${bad} mismatch(es)` : 'all deterministic');
process.exit(bad ? 1 : 0);
