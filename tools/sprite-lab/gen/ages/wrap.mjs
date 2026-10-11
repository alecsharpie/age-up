#!/usr/bin/env node
// Wrap a freshly built generated building draft (drafts/pixel.<id>.js) so it renders one variant per age:
//   <header comments>
//   const make = (AGE) => { const AK = pixAgeKit(AGE); <generator body, `export default` → `return`> };
//   export default pixAged(make, <first age the building exists in>);
// The generator body reads AGE (0 Dark … 3 Imperial) and the age kit AK (drafts/helpers.js: pixAgeKit) and must
// `...AK.pal` into its palette. Idempotent: a draft that is already wrapped is left alone.
// usage (repo root): node tools/sprite-lab/gen/ages/wrap.mjs <id> [<id> …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS = path.resolve(HERE, '../../drafts');
// first age each building can stand in (the starting Town Hall stands from the Dark Age); wonder/btower are Imperial-only
export const MIN_AGE = { house: 0, farm: 0, lumber: 0, mine: 0, mill: 0, barracks: 0, dock: 0, outpost: 0, wall: 0, townhall: 0,
  archery: 1, stable: 1, smith: 1, market: 1, tower: 1, gate: 1, siege: 2, temple: 2, keep: 2, wonder: 3, btower: 3 };
export function wrap(src, id) {
  if (/\bpixAged\(make,/.test(src)) return src;
  const lines = src.split('\n'); let i = 0; while (i < lines.length && /^\s*\/\//.test(lines[i])) i++;
  const head = lines.slice(0, i).join('\n'), body = lines.slice(i).join('\n');
  const m = [...body.matchAll(/^export\s+default\b/gm)].pop(); if (!m) throw new Error(id + ': no `export default`');
  const inner = body.slice(0, m.index) + 'return' + body.slice(m.index + m[0].length);
  return `${head}\n// Age variants (gen/ages/wrap.mjs): the generator runs per age; AGE 0 Dark … 3 Imperial, AK = pixAgeKit(AGE).\nconst make = (AGE) => {\nconst AK = pixAgeKit(AGE);\n${inner.trim()}\n};\nexport default pixAged(make, ${MIN_AGE[id] ?? 0});\n`;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const id of process.argv.slice(2)) {
    const f = path.join(DRAFTS, `pixel.${id}.js`); if (!fs.existsSync(f)) { console.error('no draft ' + f); process.exitCode = 1; continue; }
    const src = fs.readFileSync(f, 'utf8'), out = wrap(src, id); fs.writeFileSync(f, out);
    console.log(out === src ? `${id}: already wrapped` : `${id}: wrapped (min age ${MIN_AGE[id] ?? 0})`);
  }
}
