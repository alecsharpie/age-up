// writes a literal pixel draft
import fs from 'fs';
import { toStr } from './rig.mjs';
export function emit(file, { id, header, anchor, anchors, fps, palette, frames }) {
  let s = `// @pixel ${id}\n${header}\nexport default {\n  id: '${id}', anchor: ${JSON.stringify(anchor)},\n`;
  if (anchors) s += `  anchors: ${JSON.stringify(anchors)},\n`;
  if (fps) s += `  fps: ${JSON.stringify(fps)},\n`;
  s += `  palette: {\n${Object.entries(palette).map(([k, v]) => `    ${k}: '${v}',`).join('\n')}\n  },\n  frames: {\n`;
  for (const [k, list] of Object.entries(frames)) s += `    ${/^[a-z]+$/.test(k) ? k : `'${k}'`}: [${list.map(g => '`' + (typeof g === 'string' ? g : toStr(g)) + '`').join(', ')}],\n`;
  s += `  },\n};\n`;
  fs.writeFileSync(file, s);
}
