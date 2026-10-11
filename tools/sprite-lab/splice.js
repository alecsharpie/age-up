// Pure string utilities shared by the node CLI (lab.mjs / extract.mjs) and the browser lab (lab.js).
// No DOM, no fs. Everything here is about locating and rewriting pieces of the game's drawing code.

/** Index of the `}` matching the first `{` at or after `from`, skipping strings, templates and comments. */
export function balanced(src, from) {
  let i = src.indexOf('{', from);
  if (i < 0) throw new Error('no { after offset ' + from);
  let depth = 0;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch; i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        else if (q === '`' && src[i] === '$' && src[i + 1] === '{') i = balanced(src, i + 1);
        i++;
      }
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) i = src.length; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('unbalanced braces from offset ' + from);
}

/** Offset just past the parameter list of the function whose `(` is the first one at or after `from`, so that
 *  `balanced(src, functionBodyFrom(src, at))` finds the body even when a default parameter is `{}`. */
export function functionBodyFrom(src, from) {
  let i = src.indexOf('(', from), depth = 0;
  for (; i < src.length; i++) { const ch = src[i]; if (ch === '(') depth++; else if (ch === ')' && --depth === 0) return i + 1; }
  return from;
}

/**
 * Split the body of drawBuilding/drawUnit into switch segments.
 * The game formats every case on its own line with exactly two leading spaces:
 *   "  case'house':...break;"  or  "  case'a':case'b':{...}"  or  "  default:..."
 * Returns [{start,end,text,types|null}] where types===null means the default segment.
 */
export function caseSegments(fnText) {
  const re = /\n  (?=case'[a-z]+':|default:)/g;
  const segs = [];
  let m;
  while ((m = re.exec(fnText))) segs.push({ start: m.index + 1 });
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (i < segs.length - 1) s.end = segs[i + 1].start;
    else { const nl = fnText.indexOf('\n', s.start); s.end = nl < 0 ? fnText.length : nl + 1; }
    s.text = fnText.slice(s.start, s.end);
    const first = s.text.slice(0, s.text.indexOf('\n') < 0 ? s.text.length : s.text.indexOf('\n'));
    if (first.startsWith('  default:')) { s.types = null; continue; }
    let rest = first.slice(2); const types = []; let mm;
    while ((mm = /^case'([a-z]+)':/.exec(rest))) { types.push(mm[1]); rest = rest.slice(mm[0].length); }
    s.types = types;
  }
  return segs;
}

/** Normalise a draft body: strip blank edges, dedent, re-indent to the game's 3-space continuation style. */
export function indentBody(body, pad = '   ') {
  const lines = body.replace(/\t/g, '  ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const min = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return lines.map(l => (l.trim() ? pad + l.slice(min) : '')).join('\n');
}

/** Replace (or add) the switch case for `type` inside a drawBuilding/drawUnit function text. */
export function spliceCase(fnText, type, body) {
  const segs = caseSegments(fnText);
  if (!segs.length) throw new Error('no switch cases found');
  const newSeg = `  case'${type}':{\n${indentBody(body)}\n   break}\n`;
  const own = segs.find(s => s.types && s.types.includes(type));
  if (!own) {
    const def = segs.find(s => !s.types) || segs[segs.length - 1];
    return fnText.slice(0, def.start) + newSeg + fnText.slice(def.start);
  }
  if (own.types.length === 1) return fnText.slice(0, own.start) + newSeg + fnText.slice(own.end);
  // Shared label (e.g. case'horseman':case'knight':case'scout'): peel this type off and give it its own segment.
  const stripped = own.text.replace(`case'${type}':`, '');
  return fnText.slice(0, own.start) + newSeg + stripped + fnText.slice(own.end);
}

/** Current body text of a case (without label and trailing break), or null if the type has no own case. */
export function caseBody(fnText, type) {
  const own = caseSegments(fnText).find(s => s.types && s.types.includes(type));
  if (!own) return null;
  let t = own.text.replace(/^  (case'[a-z]+':)+/, '').replace(/\n$/, '');
  if (t.startsWith('{') && t.endsWith('}')) t = t.slice(1, -1);
  t = t.replace(/;?\s*break;?\s*$/, '');
  return { text: t, shared: own.types.length > 1 ? own.types : null };
}

/**
 * Resource sprites live in resSprite() as an if/else chain. Rather than rewrite that chain we insert a
 * marked early-return block right after the shared preamble (`const ox=32,oy=68;`). Re-applying replaces the block.
 */
export function spliceResource(fnText, kind, body) {
  const marker = `/*lab:${kind}*/`;
  const block = `\n ${marker}if(kind==='${kind}'){\n${indentBody(body, '  ')}\n  resSprites[key]=c;return c}`;
  const at = fnText.indexOf(marker);
  if (at >= 0) {
    const close = balanced(fnText, at);
    const lineStart = fnText.lastIndexOf('\n', at);
    return fnText.slice(0, lineStart) + block + fnText.slice(close + 1);
  }
  const pre = 'const ox=32,oy=68;';
  const p = fnText.indexOf(pre);
  if (p < 0) throw new Error('resSprite preamble not found');
  return fnText.slice(0, p + pre.length) + block + fnText.slice(p + pre.length);
}

/** Parse a draft file: `export default function(b,{...}){ BODY }` plus an optional `// @sprite kind type` header. */
export function parseDraft(src) {
  const m = /export\s+default\s+function\s*[A-Za-z0-9_$]*\s*\(([^)]*)\)\s*\{/.exec(src);
  if (!m) throw new Error('draft must contain `export default function(...){ ... }`');
  const open = m.index + m[0].length - 1;
  const close = balanced(src, open);
  const meta = /@sprite\s+(building|unit|resource)\s+([a-z]+)/.exec(src);
  return { params: m[1].trim(), body: src.slice(open + 1, close), kind: meta ? meta[1] : null, type: meta ? meta[2] : null };
}

/** Parse drafts/helpers.js: every `export function name(...){...}` becomes a global helper. */
export function parseHelpers(src) {
  const out = []; const re = /export\s+function\s+([A-Za-z0-9_$]+)\s*\(/g; let m;
  while ((m = re.exec(src))) {
    const close = balanced(src, functionBodyFrom(src, m.index));
    out.push({ name: m[1], text: src.slice(m.index, close + 1).replace(/^export\s+/, '') });
  }
  return out;
}

/** The locals each kind of draft body may use (what the surrounding game function has in scope). */
export const DRAFT_LOCALS = {
  building: ['b', 'd', 'cx', 'cy', 'w', 'h', 'p', 'tc', 'bm', 'z'],
  unit: ['u', 'tc', 'd', 'swing', 'working', 'wph', 'r', 'wx', 'wy'],
  resource: ['x', 'c', 'key', 'kind', 'v', 'r', 'ox', 'oy'],
};

// ---------------------------------------------------------------- pixel sprites
// A pixel sprite is a plain object: { id, anchor:[x,y], palette:{char:'#hex'|'team'|'teamdark'|'teamlight'}, frames:{name:[grid,...]} }
// where a grid is a multi-line string, one character per pixel, '.' or ' ' = transparent. Drafts live in drafts/pixel.<id>.js
// as `export default {...}` (code before the export is allowed). The game stores them as `PIXELS.<id>={...};` statements.

export function parsePixelDraft(src) {
  const body = src.replace(/\bexport\s+default\b/, 'return');
  const spec = new Function(body)();
  if (!spec || typeof spec !== 'object' || !spec.frames) throw new Error('pixel draft must `export default` an object with frames');
  if (!spec.anchor) spec.anchor = [0, 0];
  if (!spec.palette) spec.palette = {};
  return spec;
}

export function normaliseGrid(g) {
  const lines = g.replace(/\r/g, '').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const w = Math.max(1, ...lines.map(l => l.length));
  return lines.map(l => l.padEnd(w, '.').replace(/ /g, '.'));
}

/** Readable JS for the game: template-literal grids, one frame per block. */
/** End offset (exclusive, after the `;`) of the statement starting at `start`, honouring strings, templates, comments and nesting. */
export function statementEnd(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"' || ch === '`') { const q = ch; i++; while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; else if (q === '`' && src[i] === '$' && src[i + 1] === '{') i = balanced(src, i + 1); i++; } continue; }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) return src.length; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (ch === '{' || ch === '(' || ch === '[') depth++;
    else if (ch === '}' || ch === ')' || ch === ']') depth--;
    else if (ch === ';' && depth === 0) return i + 1;
  }
  return src.length;
}

/** A pixel draft is "generated" when it has code (not just comments) before `export default`; it is then stored as an IIFE. */
export function isGeneratedPixelDraft(src) {
  const i = src.search(/\bexport\s+default\b/); if (i < 0) return false;
  const pre = src.slice(0, i).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return !!pre.trim();
}
export function generatedPixelText(src, id) {
  return `Object.assign((()=>{\n${src.replace(/\bexport\s+default\b/, 'return').trim()}\n})(),{id:${JSON.stringify(id)}})`;
}

export function serializePixelSpec(spec) {
  // per-set anchors (death, carried loads) and per-set fps must survive the trip into index.html: pixBlit and pixUnit read them
  const extra = (spec.scale && spec.scale !== 1 ? `,scale:${spec.scale}` : '') + (spec.kind ? `,kind:${JSON.stringify(spec.kind)}` : '') + (spec.footprint ? `,footprint:[${spec.footprint[0]},${spec.footprint[1]}]` : '')
    + (spec.anchors ? `,anchors:${JSON.stringify(spec.anchors)}` : '') + (spec.fps ? `,fps:${JSON.stringify(spec.fps)}` : '');
  const pal = Object.entries(spec.palette).map(([k, v]) => `${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}:${JSON.stringify(v)}`).join(',');
  const frames = Object.entries(spec.frames).map(([name, list]) => `  ${name}:[\n${list.map(g => '`\n' + normaliseGrid(g).join('\n') + '\n`').join(',\n')}\n  ]`).join(',\n');
  return `{id:${JSON.stringify(spec.id)},anchor:[${spec.anchor[0]},${spec.anchor[1]}]${extra},palette:{${pal}},frames:{\n${frames}\n}}`;
}

/** Insert or replace `PIXELS.<id>=...;` in the game script. Needs `const PIXELS={}` to exist (applyPixel in extract.mjs ensures it). */
export function splicePixel(scriptText, id, specText) {
  const stmt = `PIXELS.${id}=${specText};`;
  const re = new RegExp('\\nPIXELS\\.' + id + '=');
  const m = re.exec(scriptText);
  if (m) { const start = m.index + 1; const end = statementEnd(scriptText, start); return scriptText.slice(0, start) + stmt + scriptText.slice(end); }
  const decl = scriptText.indexOf('const PIXELS={};');
  if (decl < 0) throw new Error('const PIXELS={}; not found in the game script');
  const lineEnd = scriptText.indexOf('\n', decl);
  return scriptText.slice(0, lineEnd) + '\n' + stmt + scriptText.slice(lineEnd);
}
