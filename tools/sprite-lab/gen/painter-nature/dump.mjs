import * as H from './tools/sprite-lab/drafts/helpers.js';
import fs from 'fs';
Object.assign(globalThis, H);
const id = process.argv[2];
const src = fs.readFileSync(`./tools/sprite-lab/drafts/pixel.${id}.js`, 'utf8');
const tmp = `./_tmp_${id}.mjs`; fs.writeFileSync(tmp, src);
const m = await import(tmp + '?' + Date.now()); fs.unlinkSync(tmp);
fs.writeFileSync(`pixel.${id}.json`, JSON.stringify(m.default));
