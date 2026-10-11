// Sprite Lab engine. Runs in the browser (headless via lab.mjs, or interactively via `lab.mjs serve`).
// It renders the game's live drawing code (and any drafts) into inspection sheets, scenes and lint reports.
import { spliceCase, spliceResource, parseDraft, parseHelpers, parsePixelDraft, normaliseGrid, serializePixelSpec } from './splice.js';

const LAB = (window.LAB = { ready: false, meta: null, drafts: { building: {}, unit: {}, resource: {}, pixel: {} }, fns: {}, errors: [], helpers: [], serializePixelSpec, parsePixelDraft, normaliseGrid });
const $ = s => document.querySelector(s);
const outCv = () => LAB.target || $('#out');  // sheets draw here; the catalogue points it elsewhere
const HEADLESS = /headless/.test(location.search);
if (HEADLESS) document.body.classList.add('headless');

const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('failed to load ' + src)); document.head.appendChild(s); });
const fnFromText = t => new Function('return (' + t + ')')();
const log = (msg, cls) => { const el = $('#log'); if (!el) return; const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = msg; el.appendChild(d); };

// ---------------------------------------------------------------- boot: load live game code + drafts
async function boot() {
  LAB.errors = []; LAB.drafts = { building: {}, unit: {}, resource: {}, pixel: {} };
  const inline = window.__INLINE__;  // the single-file catalogue embeds meta/drafts and the game code instead of fetching
  const meta = inline ? inline.meta : await (await fetch('/api/meta.json')).json(); LAB.meta = meta;
  if (!window.drawBuilding) await loadScript('/api/game.js?t=' + Date.now());
  const drafts = inline ? inline.drafts : await (await fetch('/api/drafts.json')).json();
  if (drafts.helpers) {
    try { for (const h of parseHelpers(drafts.helpers)) { globalThis[h.name] = new Function(h.text + ';return ' + h.name)(); LAB.helpers.push(h.name); } }
    catch (e) { LAB.errors.push('helpers.js: ' + e.message); }
  }
  LAB.fns.current = { drawBuilding, drawUnit, drawResource, resSprite };
  let db = meta.fn.drawBuilding, du = meta.fn.drawUnit, rs = meta.fn.resSprite;
  // painted sprites first, so case bodies can refer to them
  for (const k in PIX_CACHE) delete PIX_CACHE[k];
  LAB.pixSets = { current: Object.assign({}, PIXELS), draft: null }; LAB.pixActive = 'draft';
  for (const f of drafts.files) {
    if (!/^pixel\./.test(f.name)) continue;
    try { const spec = parsePixelDraft(f.src); spec.id = spec.id || f.name.slice(6, -3); PIXELS[spec.id] = spec; LAB.drafts.pixel[spec.id] = { file: f.name, spec }; }
    catch (e) { LAB.errors.push(f.name + ': ' + e.message); }
  }
  LAB.pixSets.draft = Object.assign({}, PIXELS);
  for (const f of drafts.files) {
    if (/^pixel\./.test(f.name)) continue;
    try {
      const d = parseDraft(f.src);
      const m = /^(building|unit|resource)\.([a-z]+)\.js$/.exec(f.name);
      if (m) { d.kind = d.kind || m[1]; d.type = d.type || m[2]; }
      if (!d.kind || !d.type) throw new Error('cannot tell kind/type: name the file kind.type.js or add `// @sprite kind type`');
      d.file = f.name; LAB.drafts[d.kind][d.type] = d;
      if (d.kind === 'building') db = spliceCase(db, d.type, d.body);
      else if (d.kind === 'unit') du = spliceCase(du, d.type, d.body);
      else rs = spliceResource(rs, d.type, d.body);
    } catch (e) { LAB.errors.push(f.name + ': ' + e.message); }
  }
  globalThis.__resSpritesDraft = {};
  const safe = (text, name, fallback) => { try { return fnFromText(text); } catch (e) { LAB.errors.push(name + ' (with drafts spliced in): ' + e.message); return fallback; } };
  globalThis.__resSpriteDraft = safe(rs.replace(/resSprites\[/g, '__resSpritesDraft[').replace(/^function resSprite/, 'function __resSpriteDraft'), 'resSprite', resSprite);
  LAB.fns.draft = {
    drawBuilding: safe(db, 'drawBuilding', drawBuilding),
    drawUnit: safe(du, 'drawUnit', drawUnit),
    drawResource: fnFromText(meta.fn.drawResource.replace(/\bresSprite\(/g, '__resSpriteDraft(').replace(/^function drawResource/, 'function __drawResourceDraft')),
    resSprite: globalThis.__resSpriteDraft,
  };
  LAB.ready = true;
  for (const e of LAB.errors) log('draft error: ' + e, 'err');
  buildUI();
  window.dispatchEvent(new Event('lab-ready'));
}

// ---------------------------------------------------------------- fake entities
const hasDraft = (kind, type) => !!LAB.drafts[kind][type];
function fakeBuilding(type, o = {}) {
  const d = BUILDINGS[type]; const p = o.p ?? 1; const built = p >= 1;
  return { id: o.id ?? 11, kind: 'bld', type, team: o.team ?? 0, tx: o.tx ?? 0, ty: o.ty ?? 0, w: d.w, h: d.h, built, progress: built ? 1 : p,
    hp: built ? Math.round(d.hp * (o.hpf ?? 1)) : Math.round(d.hp * p), flash: 0, garrison: o.garrison || [], relics: o.relics || 0, queue: [],
    ...(o.age !== undefined && o.age !== null ? { age: o.age } : {}) };   // b.age: the lab's override of the owner's age (pixAgeOf)
}
const AGE_NAMES = ['Dark', 'Feudal', 'Castle', 'Imperial'];
/** The ages a building can stand in (its first age … Imperial; the starting Town Hall stands from the Dark Age). */
const agesOf = type => { const a0 = type === 'townhall' ? 0 : (BUILDINGS[type].age || 0); return [0, 1, 2, 3].filter(a => a >= a0); };
function fakeUnit(type, o = {}) {
  const d = UNITS[type]; const st = o.state || 'idle';
  const u = { id: o.id ?? 5, kind: 'unit', type, team: o.team ?? (d.animal ? -1 : 0), x: o.x ?? 0.5, y: o.y ?? 0.5, hp: d.hp, state: 'idle', goal: null, phase: null,
    anim: o.anim ?? 0, swing: 0, face: o.face ?? 1, flash: 0, carry: 0, carryKind: null, relic: !!o.relic, faith: 0, cargo: o.cargo || [], inside: null, naval: !!d.naval, target: null, cool: 0 };
  if (st === 'move') { u.state = 'move'; u.goal = {}; }
  else if (st === 'attack') { u.state = 'attack'; u.swing = o.swing ?? 0.15; u.target = {}; }
  else if (st === 'work') { u.state = 'gather'; u.phase = 'gathering'; u.carryKind = o.carryKind || 'wood'; }
  else if (st === 'carry') { u.state = 'gather'; u.goal = {}; u.carry = 10; u.carryKind = o.carryKind || 'wood'; }
  else if (st === 'convert') { u.state = 'convert'; u.target = {}; u.goal = {}; }
  if (o.carry) { u.carry = o.carry; u.carryKind = o.carryKind || 'food'; }
  if (d.packs) u.packed = o.packed ?? true;
  return u;
}
function fakeRes(kind, o = {}) { return { id: 3, kind: 'res', res: kind, tx: o.tx ?? 0, ty: o.ty ?? 0, amount: o.amount ?? 100, max: 100, v: o.v ?? 0, fish: !!o.fish, gatherers: 0 }; }

// ---------------------------------------------------------------- ground (mirrors buildTerrain in the game)
const TERRAIN_COLS = [['#5f9a3e', '#67a344', '#5a9239', '#6aa64a'], ['#9a7b4a', '#a0824f', '#917246'], ['#2f6fb0', '#2c69a8'], ['#d8c88a', '#d1bf80']];
function tile(c, cx, cy, t, r) {
  const pal = TERRAIN_COLS[t] || TERRAIN_COLS[0];
  c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + HW, cy + HH); c.lineTo(cx, cy + TH); c.lineTo(cx - HW, cy + HH); c.closePath();
  c.fillStyle = pal[Math.floor(r() * pal.length)]; c.fill();
  if (t === 0) { c.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 3; k++) c.fillRect(cx + (r() - 0.5) * 40, cy + HH + (r() - 0.5) * 18, 2, 1); if (r() < 0.15) { c.fillStyle = '#7fbf55'; c.fillRect(cx + (r() - 0.5) * 30, cy + 6 + r() * 18, 2, 3); } }
  if (t === 2) { c.strokeStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.moveTo(cx - 14, cy + HH + (r() - 0.5) * 6); c.lineTo(cx + 10, cy + HH + (r() - 0.5) * 6); c.stroke(); }
  if (t === 1) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(cx + (r() - 0.5) * 30, cy + 8 + r() * 14, 3, 2); }
  c.strokeStyle = 'rgba(0,0,0,0.04)'; c.stroke();
}
/** Fill a canvas region with terrain; (ox,oy) is where tile (0,0)'s top corner lands. */
function drawGround(c, ox, oy, W, H, seed = 3, terrainAt = () => 0) {
  const r = mulberry32(seed);
  c.fillStyle = '#5f9a3e'; c.fillRect(0, 0, W, H);
  const inv = (sx, sy) => ({ x: ((sx - ox) / HW + (sy - oy) / HH) / 2, y: ((sy - oy) / HH - (sx - ox) / HW) / 2 });
  const cs = [inv(0, 0), inv(W, 0), inv(0, H), inv(W, H)];
  const x0 = Math.floor(Math.min(...cs.map(p => p.x))) - 1, x1 = Math.ceil(Math.max(...cs.map(p => p.x))) + 1;
  const y0 = Math.floor(Math.min(...cs.map(p => p.y))) - 1, y1 = Math.ceil(Math.max(...cs.map(p => p.y))) + 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tile(c, ox + wpx(x, y), oy + wpy(x, y), terrainAt(x, y), r);
}

// ---------------------------------------------------------------- single-entity cells
function cellGeom(kind, type) {
  if (kind === 'building') { const d = BUILDINGS[type]; const fw = (d.w + d.h) * HW, fh = (d.w + d.h) * HH; const cw = fw + 28, ch = fh + 104; return { cw, ch, ax: cw / 2 - (d.w - d.h) * HW / 2, ay: ch - 12 - fh }; }
  if (kind === 'unit') { const cw = 76, ch = 76; return { cw, ch, ax: cw / 2, ay: ch - 22 - HH }; }
  const cw = 84, ch = 104; return { cw, ch, ax: cw / 2, ay: ch - 26 - HH };
}
/** Point PIXELS at the game's painted sprites ('current') or the drafts ('draft'); the frame cache is per set. */
function usePixels(which) {
  if (!LAB.pixSets || LAB.pixActive === which) return;
  const set = LAB.pixSets[which]; for (const k of Object.keys(PIXELS)) if (!(k in set)) delete PIXELS[k]; Object.assign(PIXELS, set);
  for (const k in PIX_CACHE) delete PIX_CACHE[k]; LAB.pixActive = which;
}
function drawEntity(c, kind, type, o) {
  usePixels(o.src === 'draft' ? 'draft' : 'current');
  const F = LAB.fns[o.src === 'draft' ? 'draft' : 'current'];
  ctx = c; G.time = o.time ?? 0;
  if (kind === 'building') F.drawBuilding(fakeBuilding(type, o), !!o.sel);
  else if (kind === 'unit') F.drawUnit(fakeUnit(type, o), !!o.sel);
  else F.drawResource(fakeRes(type, o));
}
function drawFootprint(c, kind, type) {
  c.save(); c.setLineDash([3, 3]); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1;
  if (kind === 'building') { const d = typeof type === 'object' ? type : BUILDINGS[type]; const k = corners(0, 0, d.w, d.h, 0); c.beginPath(); c.moveTo(k.T[0], k.T[1]); c.lineTo(k.Rr[0], k.Rr[1]); c.lineTo(k.Bm[0], k.Bm[1]); c.lineTo(k.L[0], k.L[1]); c.closePath(); c.stroke(); }
  else { c.beginPath(); c.moveTo(0, 0); c.lineTo(HW, HH); c.lineTo(0, TH); c.lineTo(-HW, HH); c.closePath(); c.stroke(); }
  c.restore();
}
/** Render one entity into an offscreen 1x canvas (ground + sprite). */
function renderCell(kind, type, o = {}) {
  const g = cellGeom(kind, type);
  const off = document.createElement('canvas'); off.width = g.cw; off.height = g.ch;
  const c = off.getContext('2d');
  if (o.ground !== false) drawGround(c, g.ax, g.ay, g.cw, g.ch, o.seed ?? 3, o.terrainAt);
  c.save(); c.translate(g.ax, g.ay);
  if (o.footprint) drawFootprint(c, kind, type);
  try { drawEntity(c, kind, type, o); }
  catch (e) { c.restore(); c.fillStyle = '#ff5a4a'; c.font = '10px Menlo'; c.fillText('ERR ' + e.message.slice(0, 60), 2, 12); off.error = e.message; return off; }
  c.restore(); return off;
}
/** Vector zoom: the same cell drawn at N× scale (shows shape intent, not pixel truth). */
function renderCellVector(kind, type, o, mag) {
  const g = cellGeom(kind, type);
  const off = document.createElement('canvas'); off.width = g.cw * mag; off.height = g.ch * mag;
  const c = off.getContext('2d'); c.scale(mag, mag);
  if (o.ground !== false) drawGround(c, g.ax, g.ay, g.cw, g.ch, o.seed ?? 3);
  c.save(); c.translate(g.ax, g.ay); if (o.footprint) drawFootprint(c, kind, type);
  try { drawEntity(c, kind, type, o); } catch (e) { off.error = e.message; }
  c.restore(); return off;
}
function magnify(src, mag) { if (mag === 1) return src; const off = document.createElement('canvas'); off.width = src.width * mag; off.height = src.height * mag; const c = off.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0, off.width, off.height); return off; }

// ---------------------------------------------------------------- sheet layout
const FONT = '11px Georgia'; const PAD = 10;
function compose(title, panels) {
  // panels: [{title, rows:[{label, cells:[{label, img}]}]}]
  const titleH = 26, panelTitleH = 20, rowLabelH = 16, cellLabelH = 14;
  const measure = p => { let w = 0, h = panelTitleH; for (const r of p.rows) { let rw = 0, rh = 0; for (const cl of r.cells) { rw += cl.img.width + PAD; rh = Math.max(rh, cl.img.height); } w = Math.max(w, rw); h += rowLabelH + rh + cellLabelH + PAD; } return { w: w + PAD, h }; };
  const sizes = panels.map(measure);
  const W = sizes.reduce((a, s) => a + s.w + PAD, PAD), H = titleH + Math.max(...sizes.map(s => s.h)) + PAD;
  const out = outCv(); out.width = W; out.height = H; const c = out.getContext('2d');
  c.fillStyle = '#1b1612'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#d9b35a'; c.font = '14px Georgia'; c.fillText(title, PAD, 18);
  let px = PAD;
  panels.forEach((p, i) => {
    let y = titleH; c.fillStyle = '#f1e6cf'; c.font = '13px Georgia'; c.fillText(p.title, px + 4, y + 14); y += panelTitleH;
    c.strokeStyle = '#4a3826'; c.strokeRect(px + 0.5, titleH + 0.5, sizes[i].w, sizes[i].h);
    for (const r of p.rows) {
      c.fillStyle = '#b9a78a'; c.font = FONT; c.fillText(r.label, px + 4, y + 12); y += rowLabelH;
      let x = px + PAD / 2, rh = 0;
      for (const cl of r.cells) { c.drawImage(cl.img, x, y); c.fillStyle = cl.img.error ? '#ff8a7a' : '#8e8070'; c.font = '10px Georgia'; c.fillText(cl.label, x + 2, y + cl.img.height + 11); x += cl.img.width + PAD; rh = Math.max(rh, cl.img.height); }
      y += rh + cellLabelH + PAD;
    }
    px += sizes[i].w + PAD;
  });
  return { w: W, h: H };
}

const TEAMS_FOR = (kind, type) => (kind === 'unit' && UNITS[type].animal) ? [-1, 0] : [0, 1, 2, 3];
const teamName = t => t < 0 ? 'wild' : TEAM[t].n.toLowerCase();

function buildingPanel(type, src) {
  const d = BUILDINGS[type]; const mag = Math.max(2, Math.min(5, Math.floor(420 / ((d.w + d.h) * HW))));
  const rows = [];
  rows.push({ label: 'ages · the owner\'s age picks the variant (pixAge)', cells: agesOf(type).map(a => ({ label: AGE_NAMES[a], img: renderCell('building', type, { src, age: a, time: 0.3 }) })) });
  rows.push({ label: 'team colours · built · t=0', cells: TEAMS_FOR('building', type).map(t => ({ label: teamName(t), img: renderCell('building', type, { src, team: t }) })) });
  rows.push({ label: 'construction progress', cells: [0.05, 0.3, 0.55, 0.8, 1].map(p => ({ label: 'p=' + p, img: renderCell('building', type, { src, p }) })) });
  rows.push({ label: 'animation over time (s)', cells: [0, 0.4, 0.8, 1.2].map(t => ({ label: 't=' + t, img: renderCell('building', type, { src, time: t }) })) });
  rows.push({ label: 'states', cells: [
    { label: 'selected', img: renderCell('building', type, { src, sel: true }) },
    ...[0.7, 0.4, 0.2].map(f => ({ label: `damaged ${f * 100}%`, img: renderCell('building', type, { src, hpf: f, time: 0.3 }) })),
    { label: 'garrison 3', img: renderCell('building', type, { src, garrison: [1, 2, 3] }) },
    { label: 'relics 2', img: renderCell('building', type, { src, relics: 2 }) },
  ] });
  rows.push({ label: `detail ×${mag}: pixel-true (left) · vector (right) · dashed = footprint`, cells: [
    { label: 'pixels ×' + mag, img: magnify(renderCell('building', type, { src, footprint: true }), mag) },
    { label: 'vector ×' + mag, img: renderCellVector('building', type, { src, footprint: true }, mag) },
  ] });
  return { title: `${src}${src === 'draft' && !hasDraft('building', type) ? ' (no draft file → same as current)' : ''}`, rows };
}
function unitPanel(type, src) {
  const d = UNITS[type]; const mag = 6; const mil = !d.animal && !['villager', 'monk', 'fishing', 'transport', 'tradecart'].includes(type);
  const rows = [];
  rows.push({ label: 'team colours · idle', cells: TEAMS_FOR('unit', type).map(t => ({ label: teamName(t), img: renderCell('unit', type, { src, team: t }) })) });
  rows.push({ label: 'walk cycle', cells: [0, 0.11, 0.22, 0.33].map(a => ({ label: 'anim=' + a, img: renderCell('unit', type, { src, state: 'move', anim: a, time: a }) })) });
  let actions;
  if (type === 'villager') actions = [['carry wood', { state: 'carry', carryKind: 'wood' }], ['carry food', { state: 'carry', carryKind: 'food' }], ['carry gold', { state: 'carry', carryKind: 'gold' }], ['carry stone', { state: 'carry', carryKind: 'stone' }], ['work a=0.1', { state: 'work', anim: 0.1 }], ['work a=0.3', { state: 'work', anim: 0.3 }]];
  else if (type === 'monk') actions = [['relic', { relic: true }], ['convert', { state: 'convert' }], ['relic walking', { relic: true, state: 'move', anim: 0.11 }]];
  else if (type === 'fishing') actions = [['fishing', { state: 'work' }], ['t=0.5', { time: 0.5 }], ['t=1.0', { time: 1.0 }]];
  else if (type === 'transport') actions = [['cargo 4', { cargo: [1, 2, 3, 4] }], ['t=0.5', { time: 0.5 }], ['t=1.0', { time: 1.0 }]];
  else if (type === 'tradecart') actions = [['carrying gold', { carry: 10, carryKind: 'gold' }], ['moving', { state: 'move', anim: 0.11 }]];
  else if (d.animal) actions = [['owned by blue', { team: 0 }], ['moving a=0.11', { state: 'move', anim: 0.11 }], ['moving a=0.22', { state: 'move', anim: 0.22 }]];
  else actions = [0.29, 0.22, 0.15, 0.07].map(s => ['swing=' + s, { state: 'attack', swing: s }]);
  rows.push({ label: mil ? 'attack swing (0.3 → 0)' : 'actions', cells: actions.map(([l, o]) => ({ label: l, img: renderCell('unit', type, Object.assign({ src }, o)) })) });
  rows.push({ label: 'facing · selected', cells: [
    { label: 'face right', img: renderCell('unit', type, { src, face: 1 }) },
    { label: 'face left', img: renderCell('unit', type, { src, face: -1 }) },
    { label: 'selected', img: renderCell('unit', type, { src, sel: true }) },
  ] });
  rows.push({ label: `detail ×${mag}: pixel-true (left) · vector (right) · dashed = tile`, cells: [
    { label: 'pixels ×' + mag, img: magnify(renderCell('unit', type, { src, footprint: true }), mag) },
    { label: 'vector ×' + mag, img: renderCellVector('unit', type, { src, footprint: true }, mag) },
  ] });
  return { title: `${src}${src === 'draft' && !hasDraft('unit', type) ? ' (no draft file → same as current)' : ''}`, rows };
}
function resourcePanel(type, src) {
  const mag = 4; const rows = [];
  rows.push({ label: 'variants (v) · full', cells: [0, 1, 2].map(v => ({ label: 'v=' + v, img: renderCell('resource', type, { src, v }) })) });
  rows.push({ label: 'depletion (gold/stone shrink)', cells: [100, 60, 25].map(a => ({ label: a + '%', img: renderCell('resource', type, { src, amount: a }) })) });
  rows.push({ label: `detail ×${mag}: pixel-true · vector`, cells: [
    { label: 'pixels ×' + mag, img: magnify(renderCell('resource', type, { src, footprint: true }), mag) },
    { label: 'vector ×' + mag, img: renderCellVector('resource', type, { src, footprint: true }, mag) },
  ] });
  return { title: `${src}${src === 'draft' && !hasDraft('resource', type) ? ' (no draft file → same as current)' : ''}`, rows };
}

function pixCell(spec, grid, tc, mag, showAnchor = true, set) {
  const img = pixBuild(spec, grid, tc); const sc = spec.scale || 1; const off = document.createElement('canvas'); off.width = img.width * mag + 8; off.height = img.height * mag + 8; const c = off.getContext('2d');
  for (let y = 0; y < off.height; y += 4) for (let x = 0; x < off.width; x += 4) { c.fillStyle = ((x + y) / 4) % 2 ? '#2a2420' : '#211c18'; c.fillRect(x, y, 4, 4); }
  c.imageSmoothingEnabled = false; c.drawImage(img, 4, 4, img.width * mag, img.height * mag);
  if (showAnchor) { c.strokeStyle = 'rgba(255,80,80,0.9)'; const an = (set && spec.anchors && spec.anchors[set]) || spec.anchor; const ax = 4 + an[0] * sc * mag, ay = 4 + an[1] * sc * mag; c.beginPath(); c.moveTo(ax - 6, ay); c.lineTo(ax + 6, ay); c.moveTo(ax, ay - 6); c.lineTo(ax, ay + 6); c.stroke(); }
  return off;
}
function pixGroundCell(spec, frame, i, tc, face) {
  const off = document.createElement('canvas'); off.width = 76; off.height = 76; const c = off.getContext('2d');
  drawGround(c, 38, 76 - 22 - HH, 76, 76, 3); c.save(); c.translate(38, 76 - 22); c.scale(face, 1); ctx = c;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 0, 7, 3.5, 0, 0, 7); c.fill();
  try { pixBlit(c, spec, frame, i, tc); } catch (e) { off.error = e.message; } c.restore(); return off;
}
function pixBuildingCell(spec, frame, i, tc, clip) {
  const [w, h] = spec.footprint || [2, 2]; const fw = (w + h) * HW, fh = (w + h) * HH; const cw = fw + 28, ch = fh + 104;
  const off = document.createElement('canvas'); off.width = cw; off.height = ch; const c = off.getContext('2d');
  const ax = cw / 2 - (w - h) * HW / 2, ay = ch - 12 - fh; drawGround(c, ax, ay, cw, ch, 3);
  c.save(); c.translate(ax, ay); drawFootprint(c, 'building', { w, h }); const k = corners(0, 0, w, h, 0);
  try { pixBlit(c, spec, frame, i, tc, k.Bm[0], k.Bm[1], { clip }); } catch (e) { off.error = e.message; } c.restore(); return off;
}
function pixelPanel(id) {
  usePixels('draft');
  const spec = PIXELS[id]; if (!spec) throw new Error('no pixel sprite ' + id);
  const rows = []; const tc0 = TEAM[0]; const first = Object.keys(spec.frames)[0];
  const big = spec.kind === 'building'; const mag = big ? Math.max(1, Math.min(3, Math.floor(400 / pixBuild(spec, spec.frames[first][0], tc0).width))) : 6;
  for (const [name, list] of Object.entries(spec.frames)) rows.push({ label: `${name} · ${list.length} frame(s) · ×${mag} · red cross = anchor`, cells: list.map((g, i) => ({ label: name + ' ' + i, img: pixCell(spec, g, tc0, mag, true, name) })) });
  if (spec.kind !== 'resource') rows.push({ label: `team colours · first frame · ×${big ? 1 : 4}`, cells: [0, 1, 2, 3].map(t => ({ label: teamName(t), img: pixCell(spec, spec.frames[first][0], TEAM[t], big ? 1 : 4, false) })) });
  if (big && spec.make) {
    const ages = [0, 1, 2, 3].filter(a => a >= spec.age).map(a => [a, pixAge(spec, a)]);
    rows.push({ label: 'ages at 1× on the footprint (spec.make(AGE) · pixAge) · blue / red', cells: ages.flatMap(([a, s]) => [0, 1].map(t => ({ label: AGE_NAMES[a] + (t ? ' · red' : ''), img: pixBuildingCell(s, first, 0, TEAM[t], 1) }))) });
    rows.push({ label: 'ages ×2 pixel-true', cells: ages.map(([a, s]) => ({ label: AGE_NAMES[a], img: magnify(pixBuildingCell(s, first, 0, tc0, 1), 2) })) });
  }
  if (big) rows.push({ label: 'at 1× on its footprint · construction clip 0.3 / 0.65 / 1 · frames over time', cells: [
    { label: 'clip 0.3', img: pixBuildingCell(spec, first, 0, tc0, 0.3) }, { label: 'clip 0.65', img: pixBuildingCell(spec, first, 0, tc0, 0.65) }, { label: 'built', img: pixBuildingCell(spec, first, 0, tc0, 1) },
    ...(spec.frames[first].length > 1 ? spec.frames[first].slice(1).map((g, i) => ({ label: 'frame ' + (i + 1), img: pixBuildingCell(spec, first, i + 1, tc0, 1) })) : []) ] });
  else rows.push({ label: 'at 1× on grass, as the game shows it · facing right / left · walk frames', cells: [
    { label: 'idle →', img: pixGroundCell(spec, first, 0, tc0, 1) }, { label: 'idle ←', img: pixGroundCell(spec, first, 0, tc0, -1) },
    ...(spec.frames.walk || []).map((g, i) => ({ label: 'walk ' + i, img: pixGroundCell(spec, 'walk', i, tc0, 1) })) ] });
  if (!big) for (const name of Object.keys(spec.frames).filter(n => !['walk'].includes(n) && spec.frames[n].length > 1))
    rows.push({ label: `${name} at 1× on grass`, cells: spec.frames[name].map((g, i) => ({ label: name + ' ' + i, img: pixGroundCell(spec, name, i, tc0, 1) })) });
  if (!big) { const pick = Object.keys(spec.frames).map(n => [n, n === 'death' ? spec.frames[n].length - 1 : Math.floor(spec.frames[n].length / 2)]);
    rows.push({ label: 'the 1× render magnified ×3 (what a player sees, zoomed in) · one frame per set', cells: pick.map(([n, i]) => ({ label: `${n} ${i}`, img: magnify(pixGroundCell(spec, n, i, tc0, 1), 3) })) }); }
  const g0 = normaliseGrid(spec.frames[first][0]);
  return { title: `pixel sprite "${id}" · ${g0[0].length}×${g0.length} cells${spec.scale > 1 ? ' × scale ' + spec.scale : ''} · anchor [${spec.anchor}]${spec.footprint ? ' · footprint ' + spec.footprint.join('×') : ''} · ${Object.keys(spec.palette).length} colours`, rows };
}

// ---------------------------------------------------------------- views
LAB.sheet = (kind, type, src = 'both') => {
  if (kind === 'pixel') return compose(`pixel · ${type}`, [pixelPanel(type)]);
  const panelFn = kind === 'building' ? buildingPanel : kind === 'unit' ? unitPanel : resourcePanel;
  const srcs = src === 'both' ? (hasDraft(kind, type) ? ['draft', 'current'] : ['current']) : [src];
  const info = kind === 'building' ? `${BUILDINGS[type].name} · ${BUILDINGS[type].w}×${BUILDINGS[type].h} tiles` : kind === 'unit' ? `${UNITS[type].name}${UNITS[type].naval ? ' · naval' : ''}${UNITS[type].animal ? ' · animal' : ''}` : type;
  return compose(`${kind} · ${type} · ${info} · tile ${TW}×${TH}`, srcs.map(s => panelFn(type, s)));
};

LAB.contact = (kind = 'all', src = 'current', mag = 2, maxW = 1500) => {
  const groups = [];
  if (kind === 'all' || kind === 'building') groups.push(['buildings', BUILD_ORDER.map(t => ['building', t])]);
  if (kind === 'all' || kind === 'unit') groups.push(['units', Object.keys(UNITS).map(t => ['unit', t])]);
  if (kind === 'all' || kind === 'resource') groups.push(['resources', ['wood', 'food', 'gold', 'stone'].map(t => ['resource', t])]);
  const panels = [];
  for (const [title, list] of groups) {
    const rows = []; let cur = { label: '', cells: [] }, w = 0;
    for (const [k, t] of list) {
      const img = magnify(renderCell(k, t, { src, time: 0.3 }), mag);
      const lbl = k === 'building' ? `${t} ${BUILDINGS[t].w}×${BUILDINGS[t].h}${LAB.meta.buildingCases[t] ? '' : ' (default!)'}` : k === 'unit' ? `${t}${LAB.meta.unitCases[t] ? (LAB.meta.unitCases[t].length > 1 ? ' (shared)' : '') : ' (default!)'}` : t;
      if (w + img.width + PAD > maxW && cur.cells.length) { rows.push(cur); cur = { label: '', cells: [] }; w = 0; }
      cur.cells.push({ label: lbl, img }); w += img.width + PAD;
    }
    if (cur.cells.length) rows.push(cur);
    rows[0].label = `${title} · ${src} · ×${mag} pixel-true · t=0.3`;
    panels.push({ title, rows });
  }
  // stack groups vertically by composing them as rows of one panel
  return compose(`contact sheet · ${kind}`, [{ title: '', rows: panels.flatMap(p => p.rows) }]);
};

/** Every building across the ages: one row per building, one cell per age it can stand in. */
LAB.ages = (type = 'all', src = 'current', mag = 2, team = 0) => {
  const list = type === 'all' ? BUILD_ORDER : [type];
  const rows = list.map(t => ({ label: `${t} ${BUILDINGS[t].w}×${BUILDINGS[t].h}`, cells: agesOf(t).map(a => ({ label: AGE_NAMES[a], img: magnify(renderCell('building', t, { src, time: 0.3, age: a, team }), mag) })) }));
  return compose(`buildings across the ages · ${src} · ×${mag} pixel-true · t=0.3`, [{ title: '', rows }]);
};

/** A hand-placed village so sprites can be judged together, in depth order, on real terrain. */
LAB.sceneCanvas = (o = {}) => {
  const team = o.team ?? 0, src = o.src || 'current', time = o.time ?? 0.3, zoom = o.zoom ?? 1, M = 14;
  const terrainAt = (x, y) => (x + y >= 22 ? 2 : x + y >= 20 ? 3 : (x >= 4 && x <= 8 && y >= 4 && y <= 8) ? 1 : 0);
  const B = (type, tx, ty, p = 1, extra = {}) => Object.assign(fakeBuilding(type, { team, tx, ty, p, id: tx * 31 + ty, age: o.age }), extra);
  const U = (type, x, y, o2 = {}) => fakeUnit(type, Object.assign({ team, x, y, id: Math.round(x * 7 + y * 13) }, o2));
  const R = (res, tx, ty, o2 = {}) => fakeRes(res, Object.assign({ tx, ty }, o2));
  const blds = [B('townhall', 5, 5), B('house', 2, 1), B('house', 5, 1), B('mill', 10, 4), B('farm', 12, 4), B('farm', 10, 6), B('farm', 12, 2), B('lumber', 1, 7), B('mine', 8, 9), B('smith', 2, 4),
    B('barracks', 1, 10), B('archery', 5, 9), B('tower', 9, 0), B('wall', 10, 0), B('wall', 11, 0), B('gate', 12, 0), B('wall', 13, 0), B('dock', 12, 9), B('house', 8, 2, 0.45), B('temple', 9, 11, 0.8)];
  const trees = [[0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [1, 9], [2, 9], [0, 3], [0, 4], [1, 3]];
  const res = [...trees.map(([x, y], i) => R('wood', x, y, { v: i % 3 })), R('gold', 10, 9, { v: 1 }), R('gold', 10, 8, { v: 0 }), R('stone', 6, 12, { v: 2 }), R('stone', 7, 12, { v: 0 }), R('food', 12, 7, { v: 1 }), R('food', 11, 8, { v: 0 }), R('food', 13, 12, { fish: true }), R('food', 12, 12, { fish: true })];
  const units = [U('villager', 1.5, 6.3, { state: 'work', anim: time, carryKind: 'wood' }), U('villager', 3.6, 7.6, { state: 'carry', carryKind: 'wood', anim: time, face: 1 }), U('villager', 12.7, 4.6, { state: 'work', anim: time, carryKind: 'food' }),
    U('villager', 9.9, 9.4, { state: 'work', anim: time, carryKind: 'gold', face: -1 }), U('villager', 8.6, 4.4), U('villager', 8.3, 3.4, { state: 'work', anim: time }), U('swordsman', 8.5, 12.4, { state: 'attack', swing: 0.15 }), U('swordsman', 9.2, 12.9), U('spearman', 8.8, 13.4),
    U('archer', 9.5, 2.5, { state: 'attack', swing: 0.2 }), U('skirmisher', 10.3, 2.8), U('knight', 7.4, 1.4, { state: 'move', anim: time }), U('scout', 3.6, 9.4, { state: 'move', anim: time, face: -1 }), U('monk', 8.5, 7.5, { relic: true }),
    U('sheep', 4.5, 4.2, { team }), U('sheep', 4.9, 3.5, { team }), U('sheep', 4.1, 3.6, { team: -1 }), U('deer', 0.6, 13.4, { team: -1 }), U('deer', 1.6, 13.3, { team: -1, state: 'move', anim: time }), U('boar', 5.4, 13.4, { team: -1 }),
    U('fishing', 13.4, 11.4, { state: 'work' }), U('catapult', 11.5, 1.6, { team: 1 }), U('horseman', 12.3, 1.3, { team: 1, state: 'move', anim: time, face: -1 }), U('tradecart', 6.5, 7.9, { carry: 10, carryKind: 'gold', state: 'move', anim: time }), U('ram', 11.0, 11.0, { team: 1 })];
  const relics = [{ kind: 'relic', x: 3.5, y: 3.3 }];
  const ox = M * HW + 16, oy = 90; const W = (M + M) * HW + 32, H = (M + M) * HH + oy + 24;
  const off = document.createElement('canvas'); off.width = W; off.height = H; const c = off.getContext('2d');
  c.fillStyle = '#070503'; c.fillRect(0, 0, W, H);
  const r = mulberry32(9);
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) tile(c, ox + wpx(x, y), oy + wpy(x, y), terrainAt(x, y), r);
  c.save(); c.translate(ox, oy); ctx = c; G.time = time;
  usePixels(src === 'draft' ? 'draft' : 'current'); const F = LAB.fns[src === 'draft' ? 'draft' : 'current'];
  const errors = [];
  const safely = (fn) => { try { fn(); } catch (e) { errors.push(e.message); } };
  for (const b of blds) if (b.type === 'farm') safely(() => F.drawBuilding(b, false));
  const items = [];
  for (const b of blds) if (b.type !== 'farm') items.push({ k: b.tx + b.ty + b.w - 0.01, e: b });
  for (const rs of res) items.push({ k: rs.tx + rs.ty + 1, e: rs });
  for (const u of units) items.push({ k: u.x + u.y, e: u });
  for (const rl of relics) items.push({ k: rl.x + rl.y, e: rl });
  items.sort((a, b) => a.k - b.k);
  for (const it of items) {
    const e = it.e;
    if (e.kind === 'unit') safely(() => F.drawUnit(e, false));
    else if (e.kind === 'bld') safely(() => F.drawBuilding(e, false));
    else if (e.kind === 'res') safely(() => F.drawResource(e));
    else { const wx = wpx(e.x, e.y), wy = wpy(e.x, e.y); c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(wx, wy, 7, 3.5, 0, 0, 7); c.fill();
      if (typeof pixRelic === 'function' && PIXELS.relic) safely(() => pixRelic(wx, wy, 'idle'));   // the game's relic, with its halo
      else { c.fillStyle = '#e8c55a'; c.fillRect(wx - 5, wy - 14, 10, 12); c.strokeStyle = '#8a6a12'; c.strokeRect(wx - 5, wy - 14, 10, 12); c.fillStyle = '#fff8d0'; c.fillRect(wx - 2, wy - 11, 4, 3); } }
  }
  c.restore();
  if (o.caption !== false) { c.fillStyle = '#d9b35a'; c.font = '14px Georgia'; c.fillText(`scene · ${src} · team ${teamName(team)}${o.age !== undefined ? ' · ' + AGE_NAMES[o.age] + ' Age' : ''} · t=${time}${errors.length ? ' · ERRORS: ' + errors.join(' | ') : ''}`, 10, 20); }
  const img = magnify(off, zoom); img.errors = errors; return img;
};
LAB.scene = (o = {}) => { const img = LAB.sceneCanvas(o); const out = outCv(); out.width = img.width; out.height = img.height; out.getContext('2d').drawImage(img, 0, 0); return { w: img.width, h: img.height, errors: img.errors }; };

LAB.palette = () => {
  const P = LAB.meta.palette; const sections = ['team', 'buildings', 'units', 'resources', 'terrain', 'ui'];
  const sw = 64, sh = 40, cols = 12; let H = 30;
  for (const s of sections) H += 22 + Math.ceil(P[s].length / cols) * (sh + 16) + 8;
  const W = cols * (sw + 6) + 20; const out = outCv(); out.width = W; out.height = H; const c = out.getContext('2d');
  c.fillStyle = '#1b1612'; c.fillRect(0, 0, W, H); c.fillStyle = '#d9b35a'; c.font = '14px Georgia'; c.fillText(`palette in use · ${P.all.length} distinct colours · light from upper-left (top ×1.05, left ×0.78, right ×0.60)`, 10, 20);
  let y = 30;
  for (const s of sections) {
    c.fillStyle = '#f1e6cf'; c.font = '12px Georgia'; c.fillText(`${s} (${P[s].length})`, 10, y + 14); y += 22;
    P[s].forEach((hex, i) => { const x = 10 + (i % cols) * (sw + 6), yy = y + Math.floor(i / cols) * (sh + 16); c.fillStyle = hex; c.fillRect(x, yy, sw, sh); c.fillStyle = '#b9a78a'; c.font = '9px Menlo'; c.fillText(hex, x, yy + sh + 10); });
    y += Math.ceil(P[s].length / cols) * (sh + 16) + 8;
  }
  return { w: W, h: H };
};

// ---------------------------------------------------------------- lint
function alphaBBox(c2d, w, h) {
  const d = c2d.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return n ? { x0, y0, x1, y1, n } : null;
}
function transparentRender(kind, type, o) {
  const g = cellGeom(kind, type); const padX = 60, padY = 80;
  const off = document.createElement('canvas'); off.width = g.cw + padX * 2; off.height = g.ch + padY * 2; const c = off.getContext('2d');
  c.save(); c.translate(g.ax + padX, g.ay + padY); let err = null;
  try { drawEntity(c, kind, type, o); } catch (e) { err = e.message; }
  c.restore(); return { c, w: off.width, h: off.height, ax: g.ax + padX, ay: g.ay + padY, err };
}
function pixelDiff(a, b) { const A = a.c.getImageData(0, 0, a.w, a.h).data, B = b.c.getImageData(0, 0, b.w, b.h).data; let n = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== B[i] || A[i + 1] !== B[i + 1] || A[i + 2] !== B[i + 2] || A[i + 3] !== B[i + 3]) n++; return n; }

LAB.lint = (kind, type, src = 'both') => {
  src = src === 'both' ? (hasDraft(kind, type) ? 'draft' : 'current') : src;
  const rep = { kind, type, src, problems: [], notes: [], measures: {} };
  const base = transparentRender(kind, type, { src });
  if (base.err) { rep.problems.push('throws: ' + base.err); return rep; }
  const bb = alphaBBox(base.c, base.w, base.h);
  if (!bb) { rep.problems.push('draws nothing'); return rep; }
  // footprint extents in the same pixel space
  let left, right, baseY, topY;
  if (kind === 'building') { const d = BUILDINGS[type]; const k = corners(base.ax, base.ay, d.w, d.h, 0); left = k.L[0]; right = k.Rr[0]; baseY = k.Bm[1]; topY = k.T[1]; }
  else if (kind === 'unit') { const d = UNITS[type]; const r = d.naval ? 14 : d.hp > 80 || d.pop > 1 ? 10 : 7; left = base.ax - r; right = base.ax + r; baseY = base.ay + HH + r * 0.5; topY = base.ay + HH - r * 0.5; }
  else { left = base.ax - HW; right = base.ax + HW; baseY = base.ay + TH; topY = base.ay; }
  const m = rep.measures;
  m.widthPx = bb.x1 - bb.x0 + 1; m.heightPx = bb.y1 - bb.y0 + 1; m.pixels = bb.n;
  m.overLeft = Math.max(0, left - bb.x0); m.overRight = Math.max(0, bb.x1 - right); m.belowBase = Math.max(0, bb.y1 - baseY); m.riseAboveTop = Math.round(topY - bb.y0);
  if (m.belowBase > 2) rep.problems.push(`draws ${m.belowBase}px below its base line — sprite will overlap the tile in front of it`);
  if (kind === 'building' && (m.overLeft > 6 || m.overRight > 6)) rep.problems.push(`spills ${Math.max(m.overLeft, m.overRight)}px outside its footprint sideways — will overlap neighbours`);
  if (kind === 'unit' && !UNITS[type].naval && (m.overLeft > 16 || m.overRight > 16)) rep.notes.push(`wide unit: ${m.overLeft}/${m.overRight}px beyond the shadow ellipse`);
  if (kind === 'unit' && !UNITS[type].naval && UNITS[type].pop <= 1 && !UNITS[type].animal && (m.heightPx < 16 || m.heightPx > 44)) rep.notes.push(`height ${m.heightPx}px — humans are ~20–24px, mounted ~28–32px at 1×`);
  // team colour
  if (kind !== 'resource' && !(kind === 'unit' && UNITS[type].animal)) {
    const t1 = transparentRender(kind, type, { src, team: 1 });
    const diff = t1.err ? -1 : pixelDiff(base, t1); m.teamColourPixels = diff;
    if (diff === 0) (kind === 'building' && ['farm', 'wall', 'gate'].includes(type) ? rep.notes : rep.problems).push('no team colour: identical pixels for blue and red');
    else if (diff > 0 && diff < 12) rep.notes.push(`very little team colour (${diff}px differ)`);
  }
  // construction stages
  if (kind === 'building') {
    const p3 = transparentRender(kind, type, { src, p: 0.3 }), p7 = transparentRender(kind, type, { src, p: 0.7 });
    if (p3.err || p7.err) rep.problems.push('throws during construction: ' + (p3.err || p7.err));
    else { const d1 = pixelDiff(p3, p7), d2 = pixelDiff(p7, base); m.stageDiff = [d1, d2]; if (d1 < 20 || d2 < 20) rep.notes.push(`construction stages barely differ (${d1}, ${d2}px) — show it being built`); }
  }
  // animation
  const tA = transparentRender(kind, type, { src, time: 0.37, anim: 0.37 });
  m.animPixels = tA.err ? -1 : pixelDiff(base, tA);
  rep.notes.push(m.animPixels > 0 ? `animated when idle (${m.animPixels}px change over time)` : 'static when idle');
  if (kind === 'unit') {
    const mv = transparentRender(kind, type, { src, state: 'move', anim: 0.11 }), mv2 = transparentRender(kind, type, { src, state: 'move', anim: 0.27 }); const dm = mv.err || mv2.err ? -1 : Math.max(pixelDiff(base, mv), pixelDiff(mv, mv2)); m.walkPixels = dm;
    if (dm === 0) (UNITS[type].naval ? rep.notes : rep.problems).push(UNITS[type].naval ? 'no walk animation (ships bob in code instead)' : 'no walk animation: moving frames identical to idle');
    const u = UNITS[type]; if (u.atk && !u.animal && !['villager', 'monk'].includes(type)) { const at = transparentRender(kind, type, { src, state: 'attack', swing: 0.15 }); const da = at.err ? -1 : pixelDiff(base, at); m.attackPixels = da; if (da === 0) rep.problems.push('no attack animation'); }
  }
  // palette
  const body = hasDraft(kind, type) && src === 'draft' ? LAB.drafts[kind][type].body : null;
  if (body) {
    const used = [...new Set((body.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(s => s.toLowerCase()))];
    const fresh = used.filter(h => !LAB.meta.palette.all.includes(h)); m.newColours = fresh;
    if (fresh.length) rep.notes.push(`introduces ${fresh.length} colour(s) not used anywhere else: ${fresh.join(' ')} — intentional?`);
    if (/\breturn\b/.test(body)) rep.problems.push('body uses `return` — inside the game switch that would skip health bars/overlays; use if/else');
  }
  if (kind === 'unit' && !LAB.meta.unitCases[type] && !hasDraft('unit', type)) rep.problems.push('no dedicated art: falls through to the generic human()');
  return rep;
};

// ---------------------------------------------------------------- CLI entry (called by lab.mjs through page.evaluate)
LAB.show = (view, o = {}) => {
  if (view === 'sheet') return LAB.sheet(o.kind, o.type, o.src);
  if (view === 'contact') return LAB.contact(o.kind, o.src, o.mag, o.maxW);
  if (view === 'scene') return LAB.scene(o);
  if (view === 'palette') return LAB.palette();
  if (view === 'ages') return LAB.ages(o.type, o.src, o.mag, o.team);
  throw new Error('unknown view ' + view);
};

// ---------------------------------------------------------------- interactive UI
function buildUI() {
  const kindSel = $('#kind'), typeSel = $('#type');
  if (!kindSel || !typeSel) return;  // page without the lab toolbar (the catalogue)
  const fill = () => { const k = kindSel.value; const list = k === 'building' ? BUILD_ORDER : k === 'unit' ? Object.keys(UNITS) : k === 'resource' ? LAB.meta.resources : []; typeSel.innerHTML = list.map(t => `<option>${t}</option>`).join(''); };
  fill(); kindSel.onchange = () => { fill(); go(); };
  const go = () => {
    $('#log').textContent = ''; for (const e of LAB.errors) log('draft error: ' + e, 'err');
    const v = $('#view').value, o = { kind: kindSel.value, type: typeSel.value, src: $('#src').value, team: +$('#team').value, time: +$('#time').value, zoom: +$('#zoom').value, mag: +$('#zoom').value + 1 };
    if (v === 'sheet' && o.kind === 'all') { o.kind = 'building'; kindSel.value = 'building'; fill(); o.type = typeSel.value; }
    try { LAB.show(v, o); } catch (e) { log('render error: ' + e.message, 'err'); }
  };
  for (const id of ['view', 'type', 'src', 'team', 'time', 'zoom']) $('#' + id).onchange = go;
  $('#go').onclick = go;
  $('#lintbtn').onclick = () => { if (kindSel.value === 'all') return; log(JSON.stringify(LAB.lint(kindSel.value, typeSel.value, $('#src').value), null, 1)); };
  $('#reload').onclick = async () => { LAB.ready = false; $('#log').textContent = ''; await boot(); go(); };
  if (!HEADLESS) go();
}

Object.assign(LAB, { agesOf, AGE_NAMES, pixCell, pixGroundCell, renderCell, renderCellVector, magnify, fakeBuilding, fakeUnit, fakeRes, drawGround, tile, drawEntity, cellGeom, drawFootprint, teamName, hasDraft });
boot().catch(e => { LAB.errors.push(e.message); log('boot failed: ' + e.message, 'err'); LAB.ready = true; LAB.bootFailed = e.message; });
