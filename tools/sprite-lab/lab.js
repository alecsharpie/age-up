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
  else if (st === 'build') { u.state = 'build'; u.target = {}; }   // hammering at a foundation (drawUnit: build without a goal = working)
  if (o.carry) { u.carry = o.carry; u.carryKind = o.carryKind || 'food'; }
  if (d.packs) u.packed = o.packed ?? true;
  return u;
}
function fakeRes(kind, o = {}) { return { id: 3, kind: 'res', res: kind, tx: o.tx ?? 0, ty: o.ty ?? 0, amount: o.amount ?? 100, max: 100, v: o.v ?? 0, fish: !!o.fish, gatherers: 0 }; }

// ---------------------------------------------------------------- world: small maps drawn with the game's own code
// extract.mjs hands the lab the game's terrain texture + water (buildTerrain, gtFill, wtrPaint …) and its render FX (fxApron,
// fxShadows, fxLight …). A lab world is a little G (terrain, seed, buildings, resources, units) with MAP set to its size while
// the game's functions run, so the ground, shores, aprons and shadows are the game's own.
const HAS_WORLD = () => typeof LAB_WORLD !== 'undefined' && LAB_WORLD && typeof buildTerrain === 'function';
const HAS_FX = () => typeof LAB_FX !== 'undefined' && LAB_FX && typeof fxApron === 'function';
function withWorld(w, fn) {
  const sG = G, sMAP = MAP, sN = N; G = w.g; MAP = w.n; N = w.n * w.n;
  try { return fn(); } finally { G = sG; MAP = sMAP; N = sN; }
}
/** An n×n map; terrainAt(x,y) → 0 grass, 1 dirt, 2 water, 3 sand. Its terrain canvas is built once by the game's buildTerrain. */
function makeWorld(n, terrainAt, seed = 7) {
  const g = { time: 0, tick: 0, seed, terrain: new Uint8Array(n * n), elev: new Uint8Array((n + 1) * (n + 1)), buildings: [], resources: [], units: [], relics: [], effects: [], projectiles: [], pings: [], sel: [], vis: [new Uint8Array(n * n).fill(2)], players: [0, 1, 2, 3].map(t => ({ age: 0, techs: {}, side: t })) };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) g.terrain[y * n + x] = terrainAt(x, y);
  const w = { n, g };
  withWorld(w, () => { buildTerrain(); w.cv = terrainCv; w.tox = TOX; w.toy = TOY; });
  return w;
}
// ground for single cells: a few cached 24×24 maps; the entity stands on tile (GC,GC)
const GC = 12, GROUND_PROFILES = {
  grass: () => 0,
  shore: (x, y) => (x >= GC && y >= GC ? 2 : (x >= GC - 1 && y >= GC - 1) ? 3 : 0),   // dock: on water, a beach behind it
  sea: (x, y) => (x + y >= 2 * GC - 3 ? 2 : x + y >= 2 * GC - 5 ? 3 : 0),            // ships, fish: open water, the shore behind
};
const groundCache = {};
function groundWorld(profile = 'grass') { return groundCache[profile] || (groundCache[profile] = makeWorld(24, GROUND_PROFILES[profile] || GROUND_PROFILES.grass, 11)); }
/** Which ground an entity stands on in the game. */
function profileFor(kind, type, o = {}) {
  if (kind === 'building' && BUILDINGS[type] && BUILDINGS[type].water) return 'shore';
  if (kind === 'unit' && UNITS[type] && UNITS[type].naval) return 'sea';
  if (kind === 'resource' && o.fish) return 'sea';
  return 'grass';
}
/** The earth apron fxGround lays under a building, for one drawn at local tile (0,0) (computed on the ground map, then shifted). */
const apronCache = new Map();
function cellApron(b) {
  const key = b.type + '|' + b.w + '|' + b.h + '|' + (b.built ? 1 : 0); let a = apronCache.get(key); if (a) return a;
  const tmp = -7771; a = withWorld(groundWorld(), () => { const r = fxApron(Object.assign({}, b, { id: tmp, tx: GC, ty: GC })); FX.aprons.delete(tmp); return { key: r.key, cv: r.cv, front: r.front, x: r.x, y: r.y - GC * TH }; });
  apronCache.set(key, a); return a;
}
let scratchCv = null;
function scratch() { if (!scratchCv) { scratchCv = document.createElement('canvas'); scratchCv.width = scratchCv.height = 8; } return scratchCv.getContext('2d'); }
/** Draw a building once off-screen so the FX hook records its sprite (FX.seen), as the previous frame does in the game. */
function primeBuilding(F, b) { const keep = ctx; ctx = scratch(); try { F.drawBuilding(b, false); } catch (e) { } finally { ctx = keep; } }
// one light: the same shadows fxShadows casts in the game, drawn straight onto the canvas at SUN.a
function buildingShadow(c, b) {
  const s = FX.seen.get(b.id); if (!s || !s.c || s.clip < 1 || s.type !== b.type) return;
  const sh = fxShadowCanvas(s.c, s.an[0], s.an[1], s.w, s.h); c.save(); c.globalAlpha = SUN.a; c.drawImage(sh.cv, s.dx - sh.pad, s.dy - sh.pad); c.restore();
}
function unitShadow(c, u) {
  if (UNITS[u.type].naval) return; const sp = PIXELS[u.type], an = sp && sp.anchor;
  c.save(); c.globalAlpha = SUN.a; fxBodyShadow(c, wpx(u.x, u.y), wpy(u.x, u.y), an ? an[0] * 2 : 14, an ? an[1] : 22); c.restore();
}
function resourceShadow(c, r) {
  if (r.fish || !PIXELS[r.res]) return; c.save(); c.globalAlpha = SUN.a;
  if (r.res === 'wood') { const [cv, x, y] = fxTreeShadow(r); c.drawImage(cv, x, y); }
  else { const sp = resSprite(r.res, r.v), s = r.res === 'food' ? 1 : 0.55 + 0.45 * r.amount / r.max, sh = fxVolShadow(sp, 32, 68); const wx = wpx(r.tx + 0.5, r.ty + 0.5), wy = wpy(r.tx + 0.5, r.ty + 0.5); c.drawImage(sh.cv, wx - 32 * s - sh.pad * s, wy - 68 * s - sh.pad * s, sh.cv.width * s, sh.cv.height * s); }
  c.restore();
}

// ---------------------------------------------------------------- ground fallback (a build of the game without buildTerrain)
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
/** Fill a canvas region with the game's ground; (ox,oy) is where tile (0,0)'s top corner lands. profile: grass | shore | sea. */
function drawGround(c, ox, oy, W, H, seed = 3, profile = 'grass') {
  if (HAS_WORLD()) {
    const w = groundWorld(typeof profile === 'string' ? profile : 'grass');
    c.save(); c.fillStyle = '#5a9239'; c.fillRect(0, 0, W, H); c.imageSmoothingEnabled = false;
    c.drawImage(w.cv, Math.round(ox - w.tox), Math.round(oy - w.toy - GC * TH)); c.restore(); return;
  }
  const terrainAt = typeof profile === 'function' ? profile : () => 0;
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
  const c = off.getContext('2d'); const ground = o.ground !== false;
  if (ground) drawGround(c, g.ax, g.ay, g.cw, g.ch, o.seed ?? 3, o.terrainAt || profileFor(kind, type, o));
  c.save(); c.translate(g.ax, g.ay);
  const fxId = ground ? groundFX(c, kind, type, o) : null;
  if (o.footprint) drawFootprint(c, kind, type);
  try { drawEntity(c, kind, type, o); }
  catch (e) { c.restore(); c.fillStyle = '#ff5a4a'; c.font = '10px Menlo'; c.fillText('ERR ' + e.message.slice(0, 60), 2, 12); off.error = e.message; return off; }
  finally { if (fxId !== null) FX.aprons.delete(fxId); }
  c.restore(); return off;
}
/** What the game lays under an entity before drawing it: a building's earth apron (and foundation stakes), and every cast shadow
 *  (one light). Returns the building id whose apron front-skirt fxBldPost should draw, so the caller can clear it after. */
function groundFX(c, kind, type, o) {
  if (!HAS_FX()) return null;
  const F = LAB.fns[o.src === 'draft' ? 'draft' : 'current']; usePixels(o.src === 'draft' ? 'draft' : 'current'); ctx = c; G.time = o.time ?? 0;
  try {
    if (kind === 'building') {
      const b = fakeBuilding(type, o); let id = null;
      if (type !== 'farm' && !BUILDINGS[type].water) { const a = cellApron(b); c.drawImage(a.cv, a.x, a.y); FX.aprons.set(b.id, a); id = b.id; if (!b.built) fxStakes(b); }
      if (type !== 'farm' && !BUILDINGS[type].water && b.built) { primeBuilding(F, b); buildingShadow(c, b); }
      return id;
    }
    if (kind === 'unit') unitShadow(c, fakeUnit(type, o));
    else resourceShadow(c, fakeRes(type, o));
  } catch (e) { /* the FX are decoration; a failure here must not hide the sprite */ }
  return null;
}
/** Vector zoom: the same cell drawn at N× scale (shows shape intent, not pixel truth). */
function renderCellVector(kind, type, o, mag) {
  const g = cellGeom(kind, type);
  const off = document.createElement('canvas'); off.width = g.cw * mag; off.height = g.ch * mag;
  const c = off.getContext('2d'); c.scale(mag, mag);
  if (o.ground !== false) drawGround(c, g.ax, g.ay, g.cw, g.ch, o.seed ?? 3, profileFor(kind, type, o));
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

// ---------------------------------------------------------------- the village: a town as it stands in the game
// A 50×50 map built once with the game's own terrain code: dirt roads from the Town Hall's plaza to the four quarters, a wood
// along the north-west and south-west edges, a coast with a beach in the south-east. The town is laid out on the tile grid
// (footprints never overlap, checked when the plan is built) and drawn in the game's render order: ground and water, building
// aprons, one-light shadows, farms, then everything that stands sorted by depth, then the warm light. Buildings stand in the
// chosen age (or their first age, if it comes later) and the chosen team; villagers walk their rounds, soldiers drill.
// Screen orientation: +x runs down-right, +y down-left; so x small = north-west (top-left), y small = north-east (top-right).
const VIL = { n: 50, cx: 25.5, cy: 23, vw: 1400, vh: 860 };
const vHash = (x, y, s = 0) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const coastX = y => 39 + Math.round(1.3 * Math.sin(y * 0.31 + 0.6) + 0.6 * Math.sin(y * 0.83));   // water from here east
const woodNW = y => 10 + Math.round(1.4 * Math.sin(y * 0.37 + 2) + 0.8 * Math.sin(y * 1.07));      // the north-west wood, x ≤ this
const woodSW = x => 41 + Math.round(1.2 * Math.sin(x * 0.41 + 1) + 0.7 * Math.sin(x * 0.93));      // the south-west wood, y ≥ this
const DOCK_X = Math.max(coastX(25), coastX(26));                                                  // the dock stands where the east road meets the water
const VROADS = [[25, 9, 25, 23], [12, 25, 23, 25], [27, 25, DOCK_X - 1, 25], [25, 27, 25, 39]]; // [x0,y0,x1,y1] tile lines
function villageTerrain(x, y) {
  if (x >= coastX(y)) return 2;
  for (const [x0, y0, x1, y1] of VROADS) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return 1;
  if (x >= 23 && x <= 27 && y >= 23 && y <= 27) return 1;                 // the plaza round the Town Hall
  if (x >= 18 && x <= 20 && y >= 18 && y <= 19) return 1;                 // the market square
  return 0;
}
/** The town plan: buildings, resources and the people in it (positions in tiles). Built once; ages/teams are applied per draw. */
function villagePlan() {
  const n = VIL.n, occ = new Uint8Array(n * n), blds = [], res = [], units = [], problems = [];
  const at = (x, y) => y * n + x;
  const B = (type, tx, ty, o = {}) => {
    const d = BUILDINGS[type]; if (!d) { problems.push('no building ' + type); return; }
    for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) {
      if (x < 0 || y < 0 || x >= n || y >= n) { problems.push(`${type}@${tx},${ty} off the map`); return; }
      if (occ[at(x, y)]) { problems.push(`${type}@${tx},${ty} overlaps at ${x},${y}`); return; }
      const water = villageTerrain(x, y) === 2; if (water !== !!d.water) { problems.push(`${type}@${tx},${ty} on ${water ? 'water' : 'land'} at ${x},${y}`); return; }
    }
    for (let y = ty; y < ty + d.h; y++) for (let x = tx; x < tx + d.w; x++) occ[at(x, y)] = 2;
    const b = fakeBuilding(type, { tx, ty, p: o.p ?? 1, id: 1000 + blds.length, relics: o.relics, garrison: o.garrison }); b.builders = o.p ? 0 : undefined; blds.push(b); return b;
  };
  const R = (kind, tx, ty, o = {}) => { if (tx < 0 || ty < 0 || tx >= n || ty >= n || occ[at(tx, ty)]) return; occ[at(tx, ty)] = 3; res.push(fakeRes(kind, Object.assign({ tx, ty, v: Math.floor(vHash(tx, ty, 5) * 3) }, o))); };
  const U = (type, x, y, o = {}) => units.push({ type, x, y, o, ph: vHash(x * 10, y * 10, 9) * 3 });
  const Walk = (type, path, o = {}) => units.push(Object.assign({ type, path, ph: 0, speed: 0.8 }, o));

  // ---- the heart: the Town Hall on its plaza
  B('townhall', 24, 24);
  // ---- civic core, north: market on its square, blacksmith, temple with a relic, the Wonder
  B('market', 19, 20); B('smith', 22, 18); B('temple', 15, 19, { relics: 1 }); B('wonder', 15, 12);
  // ---- the wall across the north-east road, a gate where the road passes, towers either side; the Keep inside it
  for (let x = 13; x <= 37; x++) if (x !== 25) B('wall', x, 9); B('gate', 25, 9);
  B('tower', 23, 10); B('tower', 27, 10); B('btower', 33, 10); B('outpost', 13, 10);
  B('keep', 28, 12);
  // ---- military quarter, east: barracks, range, stable, siege workshop round a drill yard
  B('barracks', 27, 18); B('archery', 31, 18); B('stable', 33, 14); B('siege', 33, 22);
  // ---- gold and stone by the north wall, a mining camp beside them
  B('mine', 20, 12);
  for (const [x, y] of [[21, 10], [22, 10], [22, 11]]) R('gold', x, y);
  for (const [x, y] of [[18, 10], [19, 10], [18, 11]]) R('stone', x, y);
  // ---- fields, south: eight farms round a mill, berry bushes beyond
  B('mill', 30, 30);
  for (const [x, y] of [[28, 28], [30, 28], [32, 28], [28, 30], [32, 30], [28, 32], [30, 32], [32, 32]]) B('farm', x, y);
  for (const [x, y] of [[35, 31], [36, 32], [35, 33], [36, 34]]) R('food', x, y);
  // ---- the harbour, south-east: a dock where the road meets the shore, fish offshore
  B('dock', DOCK_X, 25);
  for (const [x, y] of [[43, 28], [44, 22], [42, 33]]) if (villageTerrain(x, y) === 2) { occ[at(x, y)] = 0; R('food', x, y, { fish: true }); }
  // ---- homes, west: houses along the roads, one going up; a lumber camp at the wood's edge
  for (const [x, y] of [[14, 22], [20, 26], [17, 27], [22, 29], [19, 30], [22, 33], [26, 34], [27, 37], [35, 26], [36, 29]]) B('house', x, y);
  B('house', 19, 34, { p: 0.55 });
  B('lumber', 12, 26); B('lumber', 23, 38); B('tower', 37, 23);
  // garden trees between the houses
  for (const [x, y] of [[20, 29], [15, 28], [18, 33], [24, 32], [16, 24], [34, 28]]) R('wood', x, y);
  // ---- woods: the north-west and south-west edges are forest; a few lone trees and a copse elsewhere
  const nearB = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n && occ[at(X, Y)] === 2) return true; } return false; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const t = villageTerrain(x, y); if (t !== 0 || occ[at(x, y)] || nearB(x, y)) continue;
    const dNW = woodNW(y) - x, dSW = y - woodSW(x); const d = Math.max(dNW, dSW); const h = vHash(x, y, 1);
    const core = x >= 13 && x <= 38 && y >= 10 && y <= 39;   // inside the town only the garden trees above stand
    if (d >= 0 ? h < 0.93 : d >= -2 ? h < 0.3 + 0.15 * d : (y < 9 ? h < 0.06 : !core && h < 0.02)) R('wood', x, y);
  }
  // ---- people. Villagers at work: farmers on the fields, woodcutters, miners, a builder; carriers walk the roads with loads
  for (const [x, y] of [[29.1, 28.9], [31.2, 29.0], [33.0, 28.8], [29.0, 31.1], [33.1, 31.0], [29.2, 33.0], [31.1, 32.9]]) U('villager', x, y, { state: 'work', carryKind: 'food', face: vHash(x * 9, y, 3) < 0.5 ? 1 : -1 });
  U('villager', 11.6, 24.6, { state: 'work', carryKind: 'wood', face: -1 }); U('villager', 11.4, 28.4, { state: 'work', carryKind: 'wood', face: -1 }); U('villager', 15.3, 40.2, { state: 'work', carryKind: 'wood', face: 1 });
  U('villager', 21.4, 11.8, { state: 'work', carryKind: 'gold', face: 1 }); U('villager', 23.4, 11.6, { state: 'work', carryKind: 'gold', face: -1 }); U('villager', 19.6, 11.7, { state: 'work', carryKind: 'stone', face: -1 });
  U('villager', 35.0, 32.4, { state: 'work', carryKind: 'food', face: 1 });
  U('villager', 21.6, 34.6, { state: 'build', face: -1 }); U('villager', 20.2, 36.4, { state: 'build', face: -1 }); U('villager', 22.6, 40.6, { state: 'work', carryKind: 'wood', face: 1 });
  Walk('villager', [[12.5, 25.5], [23.2, 25.5]], { ph: 0, fwd: { state: 'carry', carryKind: 'wood' }, back: { state: 'move' }, speed: 0.9 });   // wood to the Town Hall
  Walk('villager', [[13.6, 25.6], [23.2, 25.4]], { ph: 7, fwd: { state: 'carry', carryKind: 'wood' }, back: { state: 'move' }, speed: 0.9 });
  Walk('villager', [[25.5, 13.6], [25.5, 23.2]], { ph: 3, fwd: { state: 'carry', carryKind: 'gold' }, back: { state: 'move' }, speed: 0.8 });
  Walk('villager', [[35.4, 31.6], [31.5, 27.5], [27.6, 25.6]], { ph: 2, fwd: { state: 'carry', carryKind: 'food' }, back: { state: 'move' }, speed: 0.85 });
  // the market's trade cart to the harbour and back; a monk carrying the relic home; a scout riding out of the gate
  Walk('tradecart', [[22.5, 22.6], [25.5, 25.5], [38.4, 25.5]], { ph: 1, fwd: { carry: 10, carryKind: 'gold', state: 'move' }, back: { state: 'move' }, speed: 0.7 });
  Walk('monk', [[25.6, 22.5], [19.2, 22.6]], { ph: 4, fwd: { relic: true, state: 'move' }, back: { state: 'move' }, speed: 0.5 });
  Walk('scout', [[25.5, 11.0], [25.5, 4.5]], { ph: 1, speed: 1.6 });
  Walk('knight', [[26.5, 38.0], [26.5, 27.6]], { ph: 6, speed: 1.0 });
  // soldiers: gate guards, archers by the towers, swordsmen sparring in the drill yard, spearmen in a file, siege parked
  U('spearman', 24.4, 10.7, { face: 1 }); U('spearman', 26.6, 10.9, { face: -1 });
  U('archer', 23.6, 11.6, { face: 1 }); U('crossbowguard', 27.7, 11.2, { face: -1 });
  for (const [x, y, f, s] of [[30.0, 22.3, 1, 0], [30.9, 22.0, -1, 0.5], [30.2, 23.4, 1, 0.9], [31.1, 23.1, -1, 0.2]]) U('swordsman', x, y, { state: 'attack', face: f, swing: s, spar: true });
  for (let k = 0; k < 4; k++) U('spearman', 28.0 + k * 0.7, 23.9 + k * 0.1, { face: 1 });
  U('archer', 34.6, 21.0, { state: 'attack', face: 1, spar: true, swing: 0.3 }); U('skirmisher', 35.4, 20.7, { face: 1 });
  U('catapult', 34.4, 25.8, { face: -1 }); U('ram', 36.4, 25.6, { face: -1 }); U('trebuchet', 31.8, 25.4, { face: 1 });
  U('horseman', 33.6, 16.6, { face: -1 }); U('horsearcher', 35.0, 17.3, { face: -1 });
  // ships: fishing boats at the shoals, a war galley and a transport by the dock
  U('fishing', 42.4, 28.6, { state: 'work', face: -1 }); U('fishing', 43.5, 23.0, { state: 'work', face: 1 }); U('warship', 41.6, 25.4, { face: 1 }); U('transport', 41.8, 31.8, { face: -1 });
  // animals: the flock by the Town Hall, deer in the wood's edge, a boar in the south wood
  for (const [x, y, f] of [[23.4, 27.7, 1], [23.9, 28.3, -1], [24.6, 27.9, 1], [22.8, 28.6, 1]]) U('sheep', x, y, { face: f, tame: true });
  for (const [x, y, f] of [[12.8, 33.6, -1], [13.6, 34.4, 1], [12.4, 34.9, 1]]) U('deer', x, y, { face: f, wild: true });
  U('boar', 30.6, 42.6, { face: -1, wild: true });
  return { blds, res, units, occ, problems };
}
let VILLAGE = null;
function villageWorld() {
  if (VILLAGE) return VILLAGE;
  const w = makeWorld(VIL.n, villageTerrain, 23); const plan = villagePlan();
  w.plan = plan; w.g.bAt = new Array(w.n * w.n).fill(null); w.g.rAt = new Array(w.n * w.n).fill(null);
  for (const b of plan.blds) for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) w.g.bAt[y * w.n + x] = b;
  for (const r of plan.res) w.g.rAt[r.ty * w.n + r.tx] = r;
  w.g.buildings = plan.blds; w.g.resources = plan.res;
  if (plan.problems.length) console.warn('village plan: ' + plan.problems.join('; '));
  return (VILLAGE = w);
}
/** A unit of the plan at time t: standing at work, or walking its round (out loaded, back empty), facing where it goes. */
function villageUnit(s, t, team) {
  const o = Object.assign({}, s.o || {}); o.team = s.wild || o.wild ? -1 : team; o.id = s.id ?? Math.round((s.x || s.path[0][0]) * 7 + (s.y || s.path[0][1]) * 13);
  o.anim = t + (s.ph || 0);
  if (o.spar) { const ph = (t * 0.9 + (o.swing || 0)) % 1.1; o.swing = ph < 0.3 ? 0.3 - ph : 0; }
  if (!s.path) { o.x = s.x; o.y = s.y; return fakeUnit(s.type, o); }
  const P = s.path, segs = []; let L = 0; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); segs.push(l); L += l; }
  const T = 2 * L / s.speed + 2; let q = ((t + (s.ph || 0) * 3) % T + T) % T;   // a second's pause at each end
  let d, back = false; if (q < 1) d = 0; else if (q < 1 + L / s.speed) d = (q - 1) * s.speed; else if (q < 2 + L / s.speed) d = L; else { d = L - (q - 2 - L / s.speed) * s.speed; back = true; }
  const moving = q >= 1 && !(q >= 1 + L / s.speed && q < 2 + L / s.speed);
  let i = 0, rem = d; while (i < segs.length - 1 && rem > segs[i]) { rem -= segs[i]; i++; }
  const A = P[i], Bp = P[i + 1], f = segs[i] ? Math.min(1, rem / segs[i]) : 0; o.x = A[0] + (Bp[0] - A[0]) * f; o.y = A[1] + (Bp[1] - A[1]) * f;
  const dir = back ? -1 : 1, sx = ((Bp[0] - A[0]) - (Bp[1] - A[1])) * dir; o.face = sx >= 0 ? 1 : -1;
  Object.assign(o, (back ? s.back : s.fwd) || {}); if (!moving) { if (o.state === 'move') o.state = 'idle'; if (o.state === 'carry') o.state = 'idle'; }
  return fakeUnit(s.type, o);
}
LAB.sceneCanvas = (o = {}) => {
  const team = o.team ?? 0, src = o.src || 'current', time = o.time ?? 0.3, zoom = o.zoom ?? 1;
  const vw = Math.round(Math.max(960, Math.min(1500, o.vw || VIL.vw))), vh = VIL.vh;   // 1500 px wide is as far as the map reaches without showing its edge
  const off = document.createElement('canvas'); off.width = vw; off.height = vh; const c = off.getContext('2d'); const errors = [];
  if (!HAS_WORLD() || !HAS_FX()) { c.fillStyle = '#070503'; c.fillRect(0, 0, off.width, off.height); c.fillStyle = '#e36a5a'; c.font = '14px Georgia'; c.fillText('this build of the game has no buildTerrain / render FX for the lab to draw the village with', 20, 30); const img = magnify(off, zoom); img.errors = ['no world code']; return img; }
  usePixels(src === 'draft' ? 'draft' : 'current'); const F = LAB.fns[src === 'draft' ? 'draft' : 'current'];
  const w = villageWorld(), g = w.g, P = w.plan;
  const ageOf = t => (o.age === undefined || o.age === null || o.age === '') ? agesOf(t)[0] : Math.max(+o.age, agesOf(t)[0]);
  for (const b of P.blds) { b.team = team; b.age = ageOf(b.type); }
  g.time = time; g.units = P.units.map(s => villageUnit(s, time, team)); g.relics = [];
  const ox = Math.round(vw / 2 - wpx(VIL.cx, VIL.cy)), oy = Math.round(vh / 2 - (VIL.cx + VIL.cy) * HH);
  const safely = fn => { try { fn(); } catch (e) { errors.push(e.message); } };
  withWorld(w, () => {
    const keep = ctx; ctx = c; cam.x = vw / 2 - ox; cam.y = vh / 2 - oy; cam.zoom = 1; W = vw; H = vh;
    c.fillStyle = '#070503'; c.fillRect(0, 0, vw, vh);
    c.setTransform(1, 0, 0, 1, ox, oy); c.imageSmoothingEnabled = false; c.drawImage(w.cv, -w.tox, -w.toy); c.imageSmoothingEnabled = true;
    const on = () => true;
    safely(() => wtrGlints(on));
    const sig = team + '|' + o.age + '|' + src; if (w.sig !== sig) { w.sig = sig; for (const b of P.blds) primeBuilding(F, b); }   // shadows need this frame's sprites
    safely(() => fxGround(on)); safely(() => fxShadows(on, -1e9, -1e9, 1e9, 1e9));
    for (const b of P.blds) if (b.type === 'farm') safely(() => F.drawBuilding(b, false));
    const items = [];
    for (const b of P.blds) if (b.type !== 'farm') items.push({ k: b.tx + b.ty + b.w - 0.01, e: b });
    for (const r of P.res) items.push({ k: r.tx + r.ty + 1, e: r });
    for (const u of g.units) items.push({ k: u.x + u.y, e: u });
    items.sort((a, b) => a.k - b.k);
    for (const it of items) { const e = it.e; c.save(); safely(() => e.kind === 'unit' ? F.drawUnit(e, false) : e.kind === 'bld' ? F.drawBuilding(e, false) : F.drawResource(e, false)); c.restore(); }   // save/restore: one failing sprite must not shift the rest
    if (o.grid) { c.font = '9px Menlo'; for (let y = 0; y < w.n; y += 1) for (let x = 0; x < w.n; x += 1) { if (x % 5 && y % 5) continue; const P2 = [wpx(x, y), (x + y) * HH]; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(P2[0] - 1, P2[1] - 1, 2, 2); if (!(x % 5) && !(y % 5)) c.fillText(x + ',' + y, P2[0] + 2, P2[1] - 2); } }
    c.setTransform(1, 0, 0, 1, 0, 0); safely(() => fxLight());
    ctx = keep;
  });
  if (P.problems.length) errors.push('plan: ' + P.problems.join('; '));
  if (o.caption !== false) { c.fillStyle = '#d9b35a'; c.font = '14px Georgia'; c.fillText(`village · ${src} · team ${teamName(team)}${o.age !== undefined ? ' · ' + AGE_NAMES[o.age] + ' Age' : ' · first ages'} · t=${time}${errors.length ? ' · ERRORS: ' + errors.join(' | ') : ''}`, 10, 20); }
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

Object.assign(LAB, { profileFor, makeWorld, withWorld, groundWorld,  agesOf, AGE_NAMES, pixCell, pixGroundCell, renderCell, renderCellVector, magnify, fakeBuilding, fakeUnit, fakeRes, drawGround, tile, drawEntity, cellGeom, drawFootprint, teamName, hasDraft });
boot().catch(e => { LAB.errors.push(e.message); log('boot failed: ' + e.message, 'err'); LAB.ready = true; LAB.bootFailed = e.message; });
