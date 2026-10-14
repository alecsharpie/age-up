// Headless movement and combat scenarios. Each scenario builds a small fight in a cleared arena, runs the real sim,
// and reports numbers (see README.md). `ONLY=name,name` runs a subset, `JSON=1` prints raw JSON.
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.resolve(here, '../../index.html');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(url); await page.waitForFunction(() => !!window.dbg);
await page.addScriptTag({ path: path.join(here, 'lib.js') });

const S = {};

// A unit that is hit answers: it hits back or at least turns on its attacker. Victims in several states, attackers
// out of the victim's sight (longbow), in melee, or a tower. Units under a plain move order are expected to keep going.
S.retaliate = () => {
  const victims = ['swordsman', 'spearman', 'archer', 'horseman', 'knight', 'skirmisher', 'axethrower'];
  const attackers = ['longbow', 'swordsman', 'horseman', 'tower'];
  const states = ['idle', 'follow', 'attackBld', 'chase', 'amove', 'ground'];
  let n = 0, ok = 0, tsum = 0, holds = 0, held = 0; const fails = {}, holdFails = [];
  for (const vt of victims) for (const at of attackers) for (const st of states) {
    if (st === 'ground' && !UNITS[vt].proj && at !== 'swordsman' && at !== 'horseman') continue; // a melee unit standing its ground cannot answer a shooter
    CB.arena(3);
    const v = CB.unit(vt, 0, 0, 0); v.hp = v.hp * 3;
    if (st === 'follow') { const f = CB.unit('villager', 0, 1.5, 0); CB.order(0, [v], { k: 'follow', t: f }) }
    if (st === 'attackBld') { const h = CB.bld('house', 1, -1, 3); CB.order(0, [v], { k: 'attack', t: h }) }
    if (st === 'chase') { const s = CB.unit('scout', 1, 0, -3); s.hp = 999; CB.order(0, [v], { k: 'attack', t: s }); cmdMove(s, CB.CX + 0, CB.CY - 14) }
    if (st === 'amove') CB.order(0, [v], { k: 'amove', x: 0, y: -13 });
    if (st === 'ground') applyCmd(0, { v: 'stance', ids: [v.id], s: 'ground' });
    let a;
    if (at === 'tower') { a = CB.bld('tower', 1, 4, -2) } else { a = CB.unit(at, 1, at === 'longbow' ? 6.2 : 4, 0); a.hp *= 3; applyCmd(1, { v: 'stance', ids: [a.id], s: 'ground' }); cmdAttack(a, v) }
    const hp0 = v.hp, ahp0 = a.hp; let hitT = -1, ansT = -1, chaseKeep = false, groundOut = false;
    CB.tick(20 * 14, () => {
      if (hitT < 0 && v.hp < hp0) { hitT = G.tick; groundOut = entDist(v, a) > unitStat(v, 'range') + 0.05; if (v.target && v.target !== a && v.target.kind === 'unit') chaseKeep = entDist(v, a) > entDist(v, v.target) && entDist(v, a) > UNITS[vt].los }
      if (hitT >= 0 && ansT < 0 && (a.hp < ahp0 || (v.target === a))) ansT = G.tick;
    });
    if (hitT < 0) continue;
    // keeping the order is right for a unit chasing a target nearer than an unseen shooter, for a unit busy with a building or a chase when a tower shoots it, and for a unit
    // standing its ground that cannot reach the shooter
    const hold = chaseKeep || (at === 'tower' && (st === 'attackBld' || st === 'chase')) || (st === 'ground' && groundOut);
    if (hold) { holds++; if (v.state !== 'move' && !(v.target === a)) held++; else holdFails.push(vt + '/' + at + '/' + st); continue }
    n++;
    const answered = ansT >= 0 && ansT - hitT <= 80; if (answered) { ok++; tsum += (ansT - hitT) / 20 } else { const k = vt + '/' + at + '/' + st; fails[k] = { state: v.state, tgt: v.target ? (v.target.type || '?') : null } }
  }
  return { cases: n, answered: ok, holdCases: holds, held, holdFails, rate: +(ok / n).toFixed(2), meanSecs: +(tsum / Math.max(1, ok)).toFixed(2), fails };
};

// Villagers hit by soldiers run (idle, gathering or building), then go back to work once the attacker is gone.
// One villager is boxed in by trees on three sides.
S.villagerFlee = () => {
  const out = []; let fled = 0, resumed = 0, stalls = 0, n = 0;
  for (const kind of ['idle', 'wood', 'build', 'boxed', 'gold']) for (const side of [-1, 1]) {
    CB.arena(4); CB.bld('townhall', 0, -8, -8);
    const v = CB.unit('villager', 0, 0.5, 0.5); v.hp = 400;
    let job = null;
    if (kind === 'wood' || kind === 'boxed') { const t = CB.tree(1, 0); if (kind === 'boxed') { CB.tree(0, -1); CB.tree(0, 1); CB.tree(-1, -1); CB.tree(-1, 1); CB.tree(1, 1); CB.tree(1, -1) } CB.order(0, [v], { k: 'gather', t }); job = 'gather' }
    if (kind === 'gold') { const g = makeResource('gold', CB.CX + 1, CB.CY, 500); CB.order(0, [v], { k: 'gather', t: g }); job = 'gather' }
    if (kind === 'build') { const b = tryPlace('barracks', CB.CX + 1, CB.CY - 1, 0, null, false); CB.order(0, [v], { k: 'build', t: b }); job = 'build' }
    CB.tick(60);
    const a = CB.unit('swordsman', 1, 0.5 + side * 4.5, 0.5); cmdAttack(a, v); let hit = -1; const hp1 = v.hp;
    const sw = CB.stallWatch(u => u === v);
    let maxAway = 0; const x0 = v.x, y0 = v.y;
    CB.tick(20 * 8, () => { sw(); if (hit < 0 && v.hp < hp1) hit = G.tick; maxAway = Math.max(maxAway, Math.hypot(v.x - x0, v.y - y0)) });
    a.dead = true; G.units = G.units.filter(u => !u.dead);
    let back = -1; CB.tick(20 * 20, () => { sw(); if (back < 0 && job && v.state === job && settled(v)) back = G.tick });
    function settled(u) { return CB.settled(u) }
    n++; if (maxAway > 1.5) fled++; if (!job || back >= 0) resumed++; stalls += sw.events();
    out.push({ kind, side, hit: hit >= 0, fled: +maxAway.toFixed(1), state: v.state, hp: Math.round(v.hp), resumed: !job || back >= 0 });
  }
  return { cases: n, fled, resumed, stalls, rows: out.map(r => `${r.kind}${r.side > 0 ? '+' : '-'}: ${r.hit ? 'hit' : 'not hit'}, away ${r.fled} ${r.state}${r.resumed ? '' : ' NOT-RESUMED'}`) };
};

// Melee units spread around a target instead of queueing behind each other.
S.surround = () => {
  const res = {};
  for (const n of [6, 10]) {
    CB.arena(5);
    const t = CB.unit('warelephant', 1, 0, 0); t.hp = 5000; applyCmd(1, { v: 'stance', ids: [t.id], s: 'ground' });
    const us = []; for (let i = 0; i < n; i++) us.push(CB.unit('swordsman', 0, -6 - (i % 3) * 0.7, -1 + Math.floor(i / 3) * 0.7));
    CB.order(0, us, { k: 'attack', t });
    let samples = 0, engaged = 0; const sw = CB.stallWatch(u => u.team === 0);
    CB.tick(20 * 20, () => { sw(); if (G.tick % 10) return; if (G.tick < 20 * 8) return; samples++; engaged += us.filter(u => !u.dead && CB.inRangeOf(u)).length / us.length });
    res['n' + n] = { engaged: +(engaged / samples).toFixed(2), stalls: sw.events() };
  }
  // two melee blobs meeting
  CB.arena(6); const A = [], B = [];
  for (let i = 0; i < 12; i++) { A.push(CB.unit('swordsman', 0, -6 - (i % 4) * 0.7, -1.5 + Math.floor(i / 4) * 0.8)); B.push(CB.unit('swordsman', 1, 6 + (i % 4) * 0.7, -1.5 + Math.floor(i / 4) * 0.8)) }
  CB.order(0, A, { k: 'amove', x: 8, y: 0 }); for (const u of B) cmdAttackMove(u, CB.CX - 8, CB.CY);
  let samples = 0, engaged = 0, idleNear = 0; const sw = CB.stallWatch(u => u.team >= 0);
  CB.tick(20 * 25, () => { sw(); if (G.tick % 10) return; const live = A.concat(B).filter(u => !u.dead); if (!live.length || A.every(u => u.dead) || B.every(u => u.dead)) return; samples++; engaged += live.filter(u => CB.inRangeOf(u)).length / live.length; idleNear += live.filter(u => u.state === 'idle').length });
  res.brawl = { engaged: +(engaged / Math.max(1, samples)).toFixed(2), idleSamples: idleNear, stalls: sw.events(), aLeft: A.filter(u => !u.dead).length, bLeft: B.filter(u => !u.dead).length };
  return res;
};

// A crowd walks through a one-tile gap between buildings, and through a gap in a tree line, both ways at once.
S.choke = () => {
  const res = {};
  for (const kind of ['bld', 'trees', 'twoway']) {
    CB.arena(7);
    if (kind === 'trees') { for (let y = -12; y <= 12; y++) if (y !== 0 && y !== 1) CB.tree(0, y) }
    else { CB.bld('barracks', 1, -1, -3); CB.bld('barracks', 1, -1, 1); for (let y = -12; y <= 12; y++) if (y < -3 || y > 3) CB.tree(0, y) }
    // the barracks are 3x3: tiles -3..-1 and 1..3, so the gap is row 0
    const us = []; for (let i = 0; i < 20; i++) us.push(CB.unit(i % 3 ? 'swordsman' : 'archer', 0, -7 - (i % 5) * 0.8, -2 + Math.floor(i / 5) * 0.9));
    const back = []; if (kind === 'twoway') for (let i = 0; i < 10; i++) back.push(CB.unit('villager', 0, 6 + (i % 5) * 0.8, -1 + Math.floor(i / 5) * 0.9));
    const pts = formation(us, CB.CX + 7, CB.CY + 0.5);
    applyCmd(0, { v: 'orders', list: us.map((u, i) => ({ id: u.id, c: { k: 'move', x: pts[i].x, y: pts[i].y } })) });
    if (back.length) { const p2 = formation(back, CB.CX - 7, CB.CY + 0.5); applyCmd(0, { v: 'orders', list: back.map((u, i) => ({ id: u.id, c: { k: 'move', x: p2[i].x, y: p2[i].y } })) }) }
    const all = us.concat(back); const sw = CB.stallWatch(u => all.includes(u)); let t90 = -1;
    CB.tick(20 * 60, () => { sw(); if (t90 < 0) { const passed = us.filter(u => u.x > CB.CX + 1.5).length + back.filter(u => u.x < CB.CX - 0.5).length; if (passed >= all.length * 0.9) t90 = G.tick } });
    res[kind] = { secs90: t90 < 0 ? 'never' : +(t90 / 20 - 0).toFixed(1), stillMoving: all.filter(u => u.state === 'move').length, stalls: sw.events(), stalledUnits: sw.units() };
  }
  return res;
};

// Attack-move across a field with a few defenders; then a chase of a running target.
S.amove = () => {
  CB.arena(8); const us = []; for (let i = 0; i < 10; i++) us.push(CB.unit(i < 5 ? 'swordsman' : 'archer', 0, -12 + (i % 2) * 0.8, -4 + i * 0.8));
  const ens = []; for (let i = 0; i < 6; i++) ens.push(CB.unit('spearman', 1, R(-3, 6), R(-6, 6)));
  CB.order(0, us, { k: 'amove', x: 12, y: 0 }); const sw = CB.stallWatch(u => u.team >= 0);
  CB.tick(20 * 60, sw);
  const arrived = us.filter(u => !u.dead && u.x > CB.CX + 9).length, alive = us.filter(u => !u.dead).length;
  const amove = { enemiesLeft: ens.filter(u => !u.dead).length, arrived, alive, stalls: sw.events() };
  // chase: horsemen run down a villager that walks away; swordsmen chase an archer that walks away
  const chase = {};
  for (const [h, p] of [['horseman', 'villager'], ['swordsman', 'archer'], ['spearman', 'scout']]) {
    CB.arena(9); const prey = CB.unit(p, 1, 0, 0); prey.hp = 60; cmdMove(prey, CB.CX + 13, CB.CY + 10);
    const hs = [CB.unit(h, 0, -4, 0), CB.unit(h, 0, -4, 1), CB.unit(h, 0, -4, -1)]; CB.order(0, hs, { k: 'attack', t: prey });
    let kill = -1; const sw2 = CB.stallWatch(u => hs.includes(u)); CB.tick(20 * 40, () => { sw2(); if (kill < 0 && prey.dead) kill = G.tick });
    chase[h + '>' + p] = { killedAt: kill < 0 ? 'no' : +(kill / 20).toFixed(1), stalls: sw2.events(), hunters: hs.map(u => u.state).join(',') };
  }
  return { amove, chase };
};

// Archers hold and shoot at charging melee; stand-ground archers do not move; skirmishers caught in melee.
S.ranged = () => {
  const res = {};
  CB.arena(10); const ar = [], sw_ = [];
  for (let i = 0; i < 6; i++) ar.push(CB.unit('archer', 0, 4, -2.5 + i));
  for (let i = 0; i < 6; i++) sw_.push(CB.unit('swordsman', 1, -6, -2.5 + i));
  for (const u of sw_) cmdAttackMove(u, CB.CX + 8, CB.CY);
  let shots = 0, contact = -1; const c0 = G.projectiles.length; const seen = new Set();
  CB.tick(20 * 30, () => { for (const p of G.projectiles) if (!seen.has(p)) { seen.add(p); if (contact < 0) shots++ } if (contact < 0 && sw_.some(s => !s.dead && s.state === 'attack' && CB.inRangeOf(s))) contact = G.tick });
  res.hold = { shotsBeforeContact: shots, archersLeft: ar.filter(u => !u.dead).length, swordsLeft: sw_.filter(u => !u.dead).length };
  CB.arena(10); const g = []; for (let i = 0; i < 4; i++) { const a = CB.unit('archer', 0, 0, i); g.push(a) } applyCmd(0, { v: 'stance', ids: g.map(u => u.id), s: 'ground' });
  const e = CB.unit('swordsman', 1, -3, 2); e.hp = 999; cmdAttack(e, g[0]); const st = g.map(u => ({ x: u.x, y: u.y }));
  CB.tick(20 * 10);
  res.ground = { maxDrift: +Math.max(...g.map((u, i) => Math.hypot(u.x - st[i].x, u.y - st[i].y))).toFixed(2), shooting: g.filter(u => !u.dead && u.state === 'attack').length };
  for (const wall of [false, true]) {
    CB.arena(11); const s = CB.unit('skirmisher', 0, 0, 0); s.hp = 400; if (wall) for (let y = -3; y <= 3; y++) CB.tree(1, y);
    const m = CB.unit('swordsman', 1, -3, 0); m.hp = 400; cmdAttack(m, s); cmdAttack(s, m);
    const sw = CB.stallWatch(u => u === s); let fired = 0; const seen2 = new Set(); let path = 0, px = s.x, py = s.y;
    CB.tick(20 * 20, () => { sw(); path += Math.hypot(s.x - px, s.y - py); px = s.x; py = s.y; for (const p of G.projectiles) if (!seen2.has(p) && p.src === s) { seen2.add(p); fired++ } });
    res[wall ? 'skirmWall' : 'skirmOpen'] = { fired, walked: +path.toFixed(1), stalls: sw.events(), state: s.state, hp: Math.round(s.hp), swordHp: Math.round(m.hp) };
  }
  return res;
};

// Farmers stay on the plot; builders stand at the foundation's edge.
S.workers = () => {
  CB.arena(12); CB.bld('mill', 0, -2, -2); const farms = []; for (let i = 0; i < 6; i++) farms.push(CB.bld('farm', 0, -8 + (i % 3) * 4, 2 + Math.floor(i / 3) * 4));
  const vs = farms.map((f, i) => CB.unit('villager', 0, -6 + i, -5));
  vs.forEach((v, i) => CB.order(0, [v], { k: 'gather', t: farms[i] }));
  let samples = 0, off = 0, maxOut = 0;
  CB.tick(20 * 120, () => { if (G.tick % 5) return; for (const v of vs) { if (v.state !== 'gather' || v.phase !== 'gathering') continue; const f = v.target; samples++; const d = rectDist(v.x, v.y, { x0: f.tx, y0: f.ty, x1: f.tx + f.w, y1: f.ty + f.h }); if (d > 0.01) off++; maxOut = Math.max(maxOut, d) } });
  const farm = { samples, offPlot: +(off / Math.max(1, samples)).toFixed(2), maxOut: +maxOut.toFixed(2) };
  const build = {};
  for (const type of ['house', 'barracks', 'townhall', 'wall']) {
    CB.arena(13); const vs2 = []; for (let i = 0; i < 8; i++) vs2.push(CB.unit('villager', 0, R(-10, 10), R(-10, 10)));
    let b; if (type === 'wall') { applyCmd(0, { v: 'place', type: 'wall', tiles: [[CB.CX, CB.CY], [CB.CX + 1, CB.CY], [CB.CX + 2, CB.CY]], builders: vs2.map(v => v.id) }); b = null }
    else { b = tryPlace(type, CB.CX - 1, CB.CY - 1, 0, null, false); CB.order(0, vs2, { k: 'build', t: b }) }
    let s = 0, far = 0, mx = 0, sum = 0;
    CB.tick(20 * 40, () => { if (G.tick % 5) return; for (const v of vs2) { if (v.state !== 'build' || v.goal) continue; const t = v.target; if (!t || t.built) continue; const d = rectDist(v.x, v.y, rectOf(t)); s++; sum += d; mx = Math.max(mx, d); if (d > 1.2) far++ } });
    build[type] = { samples: s, mean: +(sum / Math.max(1, s)).toFixed(2), max: +mx.toFixed(2), far, done: type === 'wall' ? G.buildings.filter(x => x.type === 'wall' && x.built).length : !!(b && b.built) };
  }
  return { farm, build };
};

// A sheep that has become yours can be selected and walked around, and does not fight.
S.sheep = () => {
  CB.arena(14); const v = CB.unit('villager', 0, 0, 0); const sh = spawnAnimal('sheep', CB.CX + 1.5, CB.CY, -1);
  CB.tick(40); const captured = sh.team === 0;
  const selectable = typeof ownSheep === 'function' && ownSheep().includes(sh);
  // through the real UI: select it with a box, right-click somewhere
  ui.groups = {}; centerOn(sh.x, sh.y); const sp = w2s(sh.x, sh.y); selectBox(sp.x - 20, sp.y - 40, sp.x + 20, sp.y + 10, false); const boxSel = (G.sel || []).includes(sh);
  setSel([sh]); const tgt = w2s(CB.CX + 6, CB.CY + 4); rightClick(tgt.x, tgt.y, false); CB.tick(20 * 12);
  const movedTo = Math.hypot(sh.x - (CB.CX + 6), sh.y - (CB.CY + 4));
  // an attack order on an enemy does not make it fight
  const e = CB.unit('villager', 1, 3, -3); e.hp = 999; applyCmd(0, { v: 'orders', list: [{ id: sh.id, c: { k: 'attack', t: e.id } }] }); CB.tick(40);
  const fought = sh.state === 'attack' || e.hp < 999;
  // a villager can still be told to gather it after it was moved
  CB.order(0, [v], { k: 'gather', t: sh }); CB.tick(20 * 15); const eaten = v.state === 'gather' || v.state === 'hunt' || sh.dead;
  return { captured, selectable, boxSel, movedClose: movedTo < 1.5, dist: +movedTo.toFixed(2), fought, eaten };
};

// A real AI-vs-AI game: stalled units, soldiers hit by enemy units that never answer, builder distance, farmers off plot.
S.aigame = () => {
  dbg.start(11, 3, { players: 2, mapType: 'plains', mapSize: 'medium', pop: 125 }); dbg.ai(0, true);
  const hits = []; const orig = window.applyDamage;
  window.applyDamage = function (t, amt, att) { if (t && !t.dead && t.kind === 'unit' && isMil(t) && att && att.kind === 'unit' && !att.dead && t.team >= 0 && att.team >= 0 && !allied(t.team, att.team) && t.state !== 'move' && t.state !== 'garrison' && !UNITS[t.type].onlyBuildings) hits.push({ t, att, tick: G.tick, st: t.state, tgt: t.target }); return orig.apply(this, arguments) };
  const sw = CB.stallWatch(u => u.team >= 0 && !isAnimal(u) && !u.naval);
  let bs = 0, bfar = 0, fs = 0, foff = 0; let unanswered = 0, checked = 0; const seen = new Set(); const why = {};
  const T = 20 * 60 * Number(globalThis.AIMINS || 14);
  for (let i = 0; i < T && !G.over; i++) {
    update(); sw();
    while (hits.length && hits[0].tick + 60 <= G.tick) { const h = hits.shift(); const k = h.t.id + ':' + h.att.id; if (seen.has(k)) continue; seen.add(k);
      if (h.t.dead || h.att.dead || h.t.inside || h.t.state === 'move' || h.t.state === 'garrison' || Math.hypot(h.t.x - h.att.x, h.t.y - h.att.y) > 8) continue; checked++;
      if (!(h.t.target && h.t.target.kind === 'unit' && (h.t.state === 'attack'))) { unanswered++; const r = h.st + '>' + h.t.state + (h.t.target ? ':' + (h.t.target.type) : ''); why[r] = (why[r] || 0) + 1 } }
    if (G.tick % 20) continue;
    for (const v of G.units) {
      if (v.type !== 'villager') continue;
      if (v.state === 'build' && !v.goal && v.target && !v.target.built) { bs++; if (rectDist(v.x, v.y, rectOf(v.target)) > 1.2) bfar++ }
      if (v.state === 'gather' && v.phase === 'gathering' && v.target && v.target.type === 'farm') { fs++; const f = v.target; if (rectDist(v.x, v.y, { x0: f.tx, y0: f.ty, x1: f.tx + f.w, y1: f.ty + f.h }) > 0.01) foff++ }
    }
  }
  window.applyDamage = orig;
  return { minutes: G.time / 60 | 0, stalls: sw.events(), stalledUnits: sw.units(), stallTop: Object.entries(sw.list().reduce((m, s) => { const k = s.type + ':' + s.state + (s.phase ? '/' + s.phase : ''); m[k] = (m[k] || 0) + s.n; return m }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8), hitPairs: checked, unanswered, why: Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 8), builderSamples: bs, builderFar: bfar, farmerSamples: fs, farmerOff: foff };
};

// Walls hold: a ring of wall (straight sides, staircase diagonals) and a diamond of corner-touching wall tiles, each around
// archers. Enemy swordsmen and horsemen attack-move to the middle or go straight for an archer; walls are unbreakable. `inside`
// counts enemy units that ever stood on a cell inside the wall (should be 0). `blocked` = still outside, held by the wall.
S.walls = () => {
  const res = {};
  for (const shape of ['ring', 'diamond']) {
    CB.arena(6);
    const cells = new Set(); const put = (x, y) => { const k = x + ',' + y; if (cells.has(k)) return; cells.add(k); const b = CB.bld('wall', 0, x, y); b.hp = 1e9 };
    if (shape === 'ring') { const pts = [[-3, -6], [3, -6], [6, -3], [6, 3], [3, 6], [-3, 6], [-6, 3], [-6, -3], [-3, -6]];
      for (let i = 0; i < pts.length - 1; i++) for (const t of wallLine({ x: pts[i][0], y: pts[i][1] }, { x: pts[i + 1][0], y: pts[i + 1][1] })) put(t.x, t.y) }
    else { for (let k = 0; k <= 6; k++) { put(k, -6 + k); put(6 - k, k); put(-k, 6 - k); put(-6 + k, -k) } }
    // inside = flood fill from the middle over cells that are not wall
    const inside = new Set(['0,0']); const st = [[0, 0]];
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (Math.abs(nx) > 8 || Math.abs(ny) > 8 || cells.has(k) || inside.has(k)) continue; inside.add(k); st.push([nx, ny]) } }
    const archers = []; for (let k = 0; k < 4; k++) archers.push(CB.unit('archer', 0, -1 + k * 0.7, 0.5));
    for (const a of archers) applyCmd(0, { v: 'stance', ids: [a.id], s: 'ground' });
    // half attack-move to the middle, half are sent straight at an archer (what a soldier shot over the wall does)
    const foes = []; for (let k = 0; k < 8; k++) { const ang = k / 8 * Math.PI * 2; const u = CB.unit(k % 2 ? 'horseman' : 'swordsman', 1, Math.cos(ang) * 8, Math.sin(ang) * 8); u.hp = 1e6; foes.push(u) }
    CB.order(1, foes.filter((u, k) => k % 4 === 0), { k: 'amove', x: 0, y: 0 });
    foes.forEach((u, k) => { if (k % 4) cmdAttack(u, archers[k % 4]) });
    for (const a of archers) a.hp = 1e6;
    const crossed = new Set(); const stall = CB.stallWatch(u => u.team === 1);
    CB.tick(20 * 40, () => { stall(); for (const u of foes) { const k = Math.floor(u.x - CB.CX) + ',' + Math.floor(u.y - CB.CY); if (inside.has(k)) crossed.add(u.id) } });
    res[shape] = { walls: cells.size, inside: crossed.size, blocked: foes.filter(u => !crossed.has(u.id)).length, archerShots: foes.filter(u => u.hp < 1e6).length };
  }
  return res;
};

// Building: time for 1, 2, 4 and 8 villagers to put up a house; a barracks foundation with 3 builders under attack by 4
// swordsmen must lose HP and fall (it used to heal back to its progress every tick).
S.construction = () => {
  const out = { secs: {} };
  for (const n of [1, 2, 4, 8]) {
    CB.arena(7); const vs = []; for (let k = 0; k < n; k++) vs.push(CB.unit('villager', 0, -2 + (k % 4) * 0.6, 2 + (k >> 2) * 0.6));
    const b = tryPlace('house', CB.CX, CB.CY - 1, 0, null, false); CB.order(0, vs, { k: 'build', t: b });
    let t = 0; CB.tick(20 * 120, () => { if (!t && b.built) t = G.time }); out.secs[n] = +(t - 0).toFixed(1);
  }
  CB.arena(8); const vs = []; for (let k = 0; k < 3; k++) vs.push(CB.unit('villager', 0, -3 + k, 3)); for (const v of vs) v.hp = 1e6;
  const b = tryPlace('barracks', CB.CX, CB.CY - 1, 0, null, false); CB.order(0, vs, { k: 'build', t: b });
  CB.tick(20 * 5); const hp5 = b.hp;
  const sw = []; for (let k = 0; k < 4; k++) { const u = CB.unit('swordsman', 1, 4, -2 + k); sw.push(u); cmdAttack(u, b) }
  let minHp = b.hp, fell = -1; CB.tick(20 * 60, () => { if (!b.dead) minHp = Math.min(minHp, b.hp); else if (fell < 0) fell = G.time });
  out.underAttack = { hpAt5s: Math.round(hp5), minHp: Math.round(minHp), fell: b.dead, progress: +b.progress.toFixed(2) };
  return out;
};

// A villager chopping wood hit by an enemy villager hits back, then goes back to chopping once the other is dead.
S.villAnswer = () => {
  CB.arena(9); CB.bld('townhall', 0, -8, -8); const t = CB.tree(1, 0);
  const v = CB.unit('villager', 0, 0.5, 0.5); v.hp = 200; CB.order(0, [v], { k: 'gather', t }); CB.tick(60);
  const e = CB.unit('villager', 1, 0.5, 2); e.hp = 20; cmdAttack(e, v);
  let fought = false; CB.tick(20 * 30, () => { if (v.state === 'attack' && v.target === e) fought = true });
  return { fought, attackerDead: e.dead, backTo: v.state, sameTree: v.target === t || (v.target && v.target.res === 'wood') };
};

// Berry patches on 6 maps: bushes with no open side (no reachable spot to pick from), and free cells next to a patch that
// are walled in on all four sides (a villager shoved in there is trapped).
S.berries = () => {
  let bushes = 0, shut = 0, pockets = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    dbg.start(seed, 2, { players: 4, mapType: 'plains', mapSize: 'medium' });
    const free = (x, y) => isWalkable(x, y, 0);
    const seen = new Set();
    for (const r of G.resources) {
      if (r.res !== 'food' || r.fish || r.carcass) continue; bushes++;
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => free(r.tx + dx, r.ty + dy))) shut++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = r.tx + dx, y = r.ty + dy, k = x + ',' + y; if (seen.has(k) || !free(x, y)) continue; seen.add(k);
        if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => free(x + a, y + b))) pockets++ }
    }
  }
  return { bushes, shut, pockets };
};

const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(S);
const out = {};
for (const k of only) {
  const t0 = Date.now();
  out[k] = await page.evaluate(`(${S[k].toString()})()`);
  if (!process.env.JSON) console.log(`\n== ${k} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n` + JSON.stringify(out[k], null, 1).replace(/\n\s+/g, ' '));
}
if (process.env.JSON) console.log(JSON.stringify(out, null, 1));
console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'no page errors');
await browser.close();
