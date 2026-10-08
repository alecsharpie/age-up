import fs from 'fs';
const [file, set, i] = process.argv.slice(2);
const mod = await import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(file, 'utf8')));
const F = mod.default.frames[set]; const idx = i === undefined ? [...F.keys()] : [+i];
for (const k of idx) { console.log(set, k); console.log(F[k].replace(/^\n|\n$/g, '').split('\n').map((r, y) => String(y).padStart(2) + ' ' + r).join('\n')); }
