import * as H from './tools/sprite-lab/drafts/helpers.js';
import fs from 'fs';
Object.assign(globalThis, H);
const id = process.argv[2];
const src = fs.readFileSync(`./tools/sprite-lab/drafts/pixel.${id}.js`, 'utf8');
const t0 = performance.now();
const spec = new Function(src.replace(/\bexport\s+default\b/, 'return'))();
const ms = performance.now() - t0;
const g = spec.frames.idle[0].trim().split('\n');
let team = 0; for (const r of g) for (const c of r) if ('TDL'.includes(c) && /^team/.test(spec.palette[c] || '')) team++;
// bbox
let minx = 1e9, maxx = -1, miny = 1e9; g.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); } }));
console.log(`${id}: ${g[0].length}x${g.length} anchor ${spec.anchor} team px ${team} bbox x ${minx}..${maxx} top ${miny} build ${ms.toFixed(0)}ms frames ${spec.frames.idle.length}`);
