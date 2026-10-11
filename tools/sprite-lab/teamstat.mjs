// Team-colour share of every painted sprite (idle frame 0, each age): opaque px, team px, %, frame sets, code flags. Roof tint is
// not counted (it is a hue lean, not team cloth). usage (repo root): node tools/sprite-lab/teamstat.mjs [index.html] | grep house
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const html = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../index.html');
const b = await chromium.launch({ headless: true, channel: 'chrome' }); const p = await b.newPage();
await p.goto('file://' + html); await p.waitForFunction(() => !!window.dbg);
const r = await p.evaluate(() => {
  const out = [];
  for (const k of Object.keys(PIXELS)) { const s0 = PIXELS[k]; if (!s0 || !s0.frames) continue;
    const ages = s0.make ? [0, 1, 2, 3] : [null];
    for (const a of ages) { const s = a === null ? s0 : pixAge(s0, a); const fr = s.frames.idle || s.frames.built || Object.values(s.frames)[0]; const g = fr[0];
      const team = new Set(Object.entries(s.palette).filter(([c, v]) => /team/.test(v)).map(e => e[0]));
      let op = 0, tm = 0; for (const ch of g) { if (ch === '.' || ch === ' ' || ch === '\n') continue; op++; if (team.has(ch)) tm++; }
      out.push([k + (a === null ? '' : '~' + a), op, tm, (100 * tm / op).toFixed(1), Object.keys(s.frames).join('/'), s.flags ? JSON.stringify(s.flags) : '']) } }
  return out;
});
for (const x of r) console.log(x.join('\t')); await b.close();
