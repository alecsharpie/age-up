import fs from 'fs';
import { wrap } from '../ages/wrap.mjs';
const kit=fs.readFileSync(new URL('./kit.js',import.meta.url),'utf8');
for(const t of process.argv.slice(2)){const src=fs.readFileSync(new URL(`./body.${t}.js`,import.meta.url),'utf8');
fs.writeFileSync(`./tools/sprite-lab/drafts/pixel.${t}.js`,wrap(src.replace('//@@KIT\n',kit),t));}
