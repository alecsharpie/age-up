import fs from 'fs';
const SL='./tools/sprite-lab/';
const { parsePixelDraft, parseHelpers } = await import(SL+'splice.js');
for (const h of parseHelpers(fs.readFileSync(SL+'drafts/helpers.js','utf8'))) { try { globalThis[h.name] = new Function(h.text + ';return ' + h.name)(); } catch { } }
const id=process.argv[2];
const spec=parsePixelDraft(fs.readFileSync(SL+`drafts/pixel.${id}.js`,'utf8'));
fs.writeFileSync(`dump.${id}.json`,JSON.stringify(spec));
