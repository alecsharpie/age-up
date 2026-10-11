// In-page helpers for the combat/movement scenario harness (injected by scenarios.mjs). Everything runs the real sim
// headlessly: build an empty, flat arena in the middle of the map, drop units in, give orders through applyCmd, tick.
(function () {
  const CX = 36, CY = 36, RAD = 15;
  // A fresh 2-player game, both AIs off, map revealed, the middle of the map cleared and flattened.
  function arena(seed) {
    dbg.start(seed || 5, 2, { players: 2, mapType: 'plains', mapSize: 'large', reveal: 'visible' });
    for (const p of G.players) p.ai = false;
    for (const p of G.players) { p.age = 3; for (const k of RES_KINDS) p.res[k] = 5000 }
    const inA = (x, y) => Math.abs(x - CX) <= RAD && Math.abs(y - CY) <= RAD;
    for (const r of G.resources.slice()) if (inA(r.tx, r.ty)) removeResource(r);
    for (const b of G.buildings.slice()) if (inA(b.tx, b.ty)) removeBuilding(b);
    for (const u of G.units) if (inA(u.x, u.y)) u.dead = true;
    G.units = G.units.filter(u => !u.dead);
    for (let y = CY - RAD - 1; y <= CY + RAD + 1; y++) for (let x = CX - RAD - 1; x <= CX + RAD + 1; x++) { const i = idx(x, y); G.terrain[i] = 0; G.block[i] = 0; G.bAt[i] = null; G.rAt[i] = null }
    const W1 = MAP + 1; for (let y = CY - RAD - 1; y <= CY + RAD + 2; y++) for (let x = CX - RAD - 1; x <= CX + RAD + 2; x++) G.elev[y * W1 + x] = 0;
    buildGrid(); updateVis();
    return { cx: CX, cy: CY };
  }
  const unit = (type, team, x, y) => makeUnit(type, team, CX + x, CY + y);
  const bld = (type, team, x, y, built = true) => makeBuilding(type, team, CX + x, CY + y, built);
  const tree = (x, y) => makeResource('wood', CX + x, CY + y, 100);
  const order = (seat, us, c, q) => applyCmd(seat, { v: 'orders', list: us.map(u => ({ id: u.id, c: Object.assign({}, c, c.t ? { t: c.t.id } : {}, c.x !== undefined ? { x: c.x + CX, y: c.y + CY } : {}) })), q: !!q });
  const tick = (n, each) => { for (let i = 0; i < n && !G.over; i++) { update(); if (each) each(G.tick) } };
  const inRangeOf = (u) => { const t = u.target; if (!t || t.dead) return false; return entDist(u, t) <= unitStat(u, 'range') + 0.05 };
  // A unit is "busy in place" when it is doing its job without needing to move.
  function settled(u) {
    if (u.dead || u.inside) return true;
    switch (u.state) {
      case 'idle': case 'pack': return true;
      case 'attack': case 'hunt': return inRangeOf(u) || (UNITS[u.type].minRange && u.target && entDist(u, u.target) < UNITS[u.type].minRange && false);
      case 'gather': return u.phase === 'gathering';
      case 'build': case 'repair': return !u.goal;
      case 'follow': return u.target && Math.hypot(u.target.x - u.x, u.target.y - u.y) < 2.2;
      case 'convert': return u.target && entDist(u, u.target) <= UNITS.monk.range + 2;
      default: return false;
    }
  }
  // Tracks units that want to move but make no progress: a "stall" is 3 s without getting 0.35 tiles from where it was.
  function stallWatch(filter) {
    const hist = new Map(); const stalls = new Map();
    const fn = () => {
      if (G.tick % 10) return;
      for (const u of G.units) {
        if (filter && !filter(u)) continue;
        let h = hist.get(u.id); if (!h) { h = []; hist.set(u.id, h) }
        h.push({ x: u.x, y: u.y, s: settled(u) }); if (h.length > 7) h.shift();
        if (h.length === 7 && h.every(p => !p.s && Math.hypot(p.x - h[0].x, p.y - h[0].y) < 0.35)) {
          const s = stalls.get(u.id) || { n: 0, type: u.type, team: u.team, state: u.state, phase: u.phase, x: +u.x.toFixed(1), y: +u.y.toFixed(1) }; s.n++; stalls.set(u.id, s); h.length = 0;
        }
      }
    };
    fn.units = () => stalls.size; fn.events = () => [...stalls.values()].reduce((a, s) => a + s.n, 0); fn.list = () => [...stalls.values()];
    return fn;
  }
  window.CB = { arena, unit, bld, tree, order, tick, settled, stallWatch, inRangeOf, CX, CY };
})();
