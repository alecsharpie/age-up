// The AAA bar for painted sprites, as numbers (see AAA.md). `lab.mjs aaa [id|all]` runs it over drafts/pixel.<id>.js,
// falling back to drafts/applied.pixel.<id>.js, and prints what is missing. Pure: takes a parsed spec, returns a report.
import { normaliseGrid } from './splice.js';

export const CLASSES = {
  human: ['villager', 'swordsman', 'spearman', 'archer', 'skirmisher', 'handgunner', 'monk', 'longbow', 'axethrower', 'crossbowguard'],
  mounted: ['horseman', 'knight', 'scout', 'horsearcher', 'camelrider', 'warelephant'],
  siege: ['catapult', 'ram', 'trebuchet', 'bombard', 'tradecart'],
  ship: ['fishing', 'transport', 'warship', 'fireship', 'siegeship'],
  animal: ['sheep', 'deer', 'boar'],
  resource: ['wood', 'food', 'gold', 'stone'],
  effect: ['fire'],
};
export function classOf(id, spec) {
  if (spec && spec.kind === 'building') return 'building';
  for (const k in CLASSES) if (CLASSES[k].includes(id)) return k;
  return 'other';
}
/** Minimum frames per set, per class. A set listed with 0 is optional; missing required sets are problems. */
export const REQUIRED = {
  human: { idle: 4, walk: 8, attack: 4, death: 6 },
  mounted: { idle: 4, walk: 8, attack: 4, death: 6 },
  siege: { idle: 2, walk: 4, attack: 5, death: 5 },
  ship: { idle: 4, walk: 4, attack: 3, death: 6 },
  animal: { idle: 4, walk: 6, death: 5 },
  resource: { idle: 3 },
  effect: { idle: 6 },
  building: { idle: 2 },
  other: { idle: 1 },
};
const EXTRA = { villager: { chop: 4, mine: 4, farm: 4, build: 4 }, monk: { convert: 4, attack: 0 }, tradecart: { attack: 0 }, fishing: { attack: 0, work: 4 }, transport: { attack: 0 }, sheep: {}, deer: {}, boar: { attack: 3 }, fire: { big: 6 } };

const hexRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const TEAMS = { team: '#2f6fd6', teamdark: '#1f4a94', teamlight: '#6f9ff0' };

export function check(id, spec) {
  const cls = classOf(id, spec);
  const req = Object.assign({}, REQUIRED[cls], EXTRA[id] || {});
  const rep = { id, cls, problems: [], notes: [], m: {} };
  const F = spec.frames || {};
  for (const [set, n] of Object.entries(req)) {
    if (!n) continue;
    const have = (F[set] || []).length;
    if (have < n) rep.problems.push(`${set}: ${have} frame(s), needs ≥${n}`);
  }
  const col = ch => { const c = spec.palette[ch]; return c ? (TEAMS[c] || c) : null; };
  const pal = Object.keys(spec.palette || {});
  let edge = 0, darkEdge = 0, strays = 0, frames = 0, used = new Set(), noGround = [], blacks = 0, dupes = [];
  const sizeBySet = {};
  for (const [set, list] of Object.entries(F)) {
    const seen = new Map(); const sizes = sizeBySet[set] = new Set();
    list.forEach((g, k) => {
      if (typeof g !== 'string') return; frames++;
      const rows = normaliseGrid(g); const H = rows.length, W = rows[0].length; sizes.add(W + '×' + H);
      const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W) ? '.' : rows[y][x];
      const solid = (x, y) => { const c = at(x, y); return c !== '.' && !!spec.palette[c]; };
      if (seen.has(g)) dupes.push(`${set}[${k}]=${set}[${seen.get(g)}]`); else seen.set(g, k);
      let ground = false;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!solid(x, y)) continue; const ch = rows[y][x]; used.add(ch);
        const c = col(ch); if (c && /^#?0{3}(0{3})?$/.test(c.replace('#', ''))) blacks++;
        const n4 = [solid(x - 1, y), solid(x + 1, y), solid(x, y - 1), solid(x, y + 1)];
        if (!n4.some(Boolean) && !(solid(x - 1, y - 1) || solid(x + 1, y - 1) || solid(x - 1, y + 1) || solid(x + 1, y + 1))) strays++;
        if (n4.some(v => !v)) { edge++; if (c && lum(hexRgb(c)) < 70) darkEdge++; }
        { const an = (spec.anchors && spec.anchors[set]) || spec.anchor; if (an && y >= an[1] - 2) ground = true; }
      }
      if (!ground && !['death', 'convert'].includes(set) && !set.startsWith('load') && !['ship', 'effect', 'resource', 'building'].includes(cls)) noGround.push(`${set}[${k}]`);
    });
  }
  const M = rep.m; M.frames = frames; M.colours = used.size; M.outline = edge ? Math.round(darkEdge / edge * 100) : 0; M.strays = strays;
  M.sets = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v.length]));
  if (frames === 0) return rep;
  if (cls === 'building') {
    if (used.size < 18) rep.problems.push(`${used.size} colours — buildings need ≥18 (3-tone ramps for every material, ink, team, props)`);
    if (M.outline < 45) rep.problems.push(`outline: ${M.outline}% of silhouette edge pixels are dark — needs ≥45%`);
    { const L = F.idle || []; if (L.length > 1 && new Set(L).size === 1) rep.problems.push('idle: every frame identical'); }
    const teamKeys = pal.filter(k => /^team/.test(spec.palette[k]));
    if (!['wall', 'farm'].includes(id) && !teamKeys.some(k => used.has(k))) rep.problems.push('no team colour used');
    return rep;
  }
  for (const [set, sz] of Object.entries(sizeBySet)) if (sz.size > 1) rep.problems.push(`${set}: frames differ in size (${[...sz].join(', ')}) — the anchor will jump`);
  const base = [...(sizeBySet.idle || [])][0];
  for (const [set, sz] of Object.entries(sizeBySet)) if (base && sz.size === 1 && [...sz][0] !== base && !(spec.anchors && spec.anchors[set])) rep.problems.push(`${set} is ${[...sz][0]} but idle is ${base}: give it its own anchor in spec.anchors.${set}`);
  const minCol = { human: 12, mounted: 14, siege: 12, ship: 12, animal: 8, resource: 10, effect: 6 }[cls] || 8;
  if (used.size < minCol) rep.problems.push(`${used.size} colours — needs ≥${minCol} for 3-tone ramps per material + outline`);
  if (M.outline < 55 && cls !== 'effect') rep.problems.push(`outline: ${M.outline}% of silhouette edge pixels are dark — needs ≥55% (selective 1-px outline)`);
  if (strays > frames) rep.problems.push(`${strays} stray single pixels across ${frames} frames`);
  else if (strays) rep.notes.push(`${strays} stray pixel(s)`);
  if (blacks) rep.notes.push(`uses pure black (${blacks}px) — prefer a hue-shifted dark`);
  if (noGround.length) rep.problems.push(`not touching the ground line: ${noGround.slice(0, 6).join(' ')}${noGround.length > 6 ? '…' : ''}`);
  for (const set of ['idle', 'walk', 'attack', 'death']) { const L = F[set] || []; if (L.length > 1 && new Set(L).size === 1) rep.problems.push(`${set}: every frame identical`); }
  if (dupes.length) rep.notes.push(`repeated frames (fine for holds): ${dupes.slice(0, 4).join(' ')}${dupes.length > 4 ? '…' : ''}`);
  const owned = !['animal', 'resource', 'effect'].includes(cls);
  if (owned) { const teamKeys = pal.filter(k => /^team/.test(spec.palette[k])); if (!teamKeys.some(k => used.has(k))) rep.problems.push('no team colour used'); }
  return rep;
}
