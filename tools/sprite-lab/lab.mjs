#!/usr/bin/env node
// Sprite Lab CLI — see README.md. Everything renders through headless Chromium so what you see is
// exactly what the game's canvas code produces.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as X from './extract.mjs';
import * as AAA from './aaa.mjs';
import { parseDraft, parseHelpers, caseBody, DRAFT_LOCALS, parsePixelDraft, serializePixelSpec, isGeneratedPixelDraft, generatedPixelText } from './splice.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out'), DRAFTS = path.join(HERE, 'drafts');
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2); const cmd = argv[0]; const flags = {}; const pos = [];
for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const nxt = argv[i + 1]; flags[k] = nxt !== undefined && !nxt.startsWith('--') ? argv[++i] : true; } else pos.push(a); }
const rel = p => path.relative(process.cwd(), p) || '.';
const KINDS = ['building', 'unit', 'resource', 'pixel'];
function kindOf(k) { if (!k) die('missing <kind> (building|unit|resource)'); const m = { b: 'building', bld: 'building', buildings: 'building', u: 'unit', units: 'unit', r: 'resource', res: 'resource', resources: 'resource', px: 'pixel', pixels: 'pixel' }[k] || k; if (!KINDS.includes(m)) die('unknown kind ' + k); return m; }
function die(msg) { console.error('error: ' + msg); process.exit(1); }

// ---------------------------------------------------------------- drafts
function readDrafts() {
  fs.mkdirSync(DRAFTS, { recursive: true });
  const files = fs.readdirSync(DRAFTS).filter(f => /^(building|unit|resource|pixel)\.[a-z]+\.js$/.test(f)).sort().map(name => ({ name, src: fs.readFileSync(path.join(DRAFTS, name), 'utf8') }));
  const hp = path.join(DRAFTS, 'helpers.js');
  return { files, helpers: fs.existsSync(hp) ? fs.readFileSync(hp, 'utf8') : null };
}
function draftPath(kind, type) { return path.join(DRAFTS, `${kind}.${type}.js`); }
/** Generated pixel drafts call the grid kit from drafts/helpers.js; make those functions globals in node so the drafts can be evaluated here too. */
function installHelpersInNode() {
  const hp = path.join(DRAFTS, 'helpers.js'); if (!fs.existsSync(hp)) return;
  for (const h of parseHelpers(fs.readFileSync(hp, 'utf8'))) { try { globalThis[h.name] = new Function(h.text + ';return ' + h.name)(); } catch { } }
}
function loadDraft(kind, type) {
  const p = draftPath(kind, type); if (!fs.existsSync(p)) die(`no draft at ${rel(p)} — run: lab.mjs new ${kind} ${type}`);
  const d = parseDraft(fs.readFileSync(p, 'utf8'));
  try { new Function(...DRAFT_LOCALS[kind], d.body); } catch (e) { die(`${rel(p)} body does not parse as a ${kind} case body: ${e.message}`); }
  return d;
}

// ---------------------------------------------------------------- catalogue (single self-contained HTML)
function buildCatalog() {
  const read = f => fs.readFileSync(path.join(HERE, f), 'utf8');
  const tpl = read('catalog.template.html');
  const noModule = t => t.replace(/^import .*$/m, '').replace(/^export /gm, '');
  const json = o => JSON.stringify(o).replace(/<\//g, '<\\/');
  const slots = { STUBS: read('stubs.js'), GAME: X.gameJs(), INLINE: json({ meta: X.meta(), drafts: readDrafts() }), REF: json(JSON.parse(read('reference.json'))), SPLICE: noModule(read('splice.js')), LAB: noModule(read('lab.js')) };
  return tpl.replace(/\/\*@(\w+)@\*\//g, (m, k) => { if (!(k in slots)) throw new Error('unknown slot ' + k); return slots[k]; });
}

// ---------------------------------------------------------------- server
function send(res, code, type, body) { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); }
function startServer(port = 0) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      try {
        if (u.pathname === '/api/game.js') return send(res, 200, 'application/javascript', X.gameJs());
        if (u.pathname === '/api/meta.json') return send(res, 200, 'application/json', JSON.stringify(X.meta()));
        if (u.pathname === '/api/drafts.json') return send(res, 200, 'application/json', JSON.stringify(readDrafts()));
        if (u.pathname === '/catalog.html') return send(res, 200, 'text/html', buildCatalog());
        const file = path.normalize(path.join(HERE, u.pathname === '/' ? 'lab.html' : u.pathname));
        if (!file.startsWith(HERE) || !/\.(html|js|css|json|png)$/.test(file) || !fs.existsSync(file)) return send(res, 404, 'text/plain', 'not found');
        const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.json') ? 'application/json' : 'image/png';
        send(res, 200, type, fs.readFileSync(file));
      } catch (e) { send(res, 500, 'text/plain', String(e.stack || e)); }
    });
    srv.listen(port, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

// ---------------------------------------------------------------- headless
function loadPlaywright() {
  for (const c of ['playwright', path.join(os.homedir(), '.claude/skills/screenshot-verify/node_modules/playwright')]) { try { return require(c); } catch { } }
  die('Playwright not found. Install once with:\n  cd ~/.claude/skills/screenshot-verify && npm install && npx playwright install chromium');
}
async function withPage(fn) {
  const pw = loadPlaywright(); const { srv, port } = await startServer(0);
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  try {
    await page.goto(`http://127.0.0.1:${port}/lab.html?headless=1`);
    await page.waitForFunction(() => window.LAB && window.LAB.ready, null, { timeout: 30000 });
    const boot = await page.evaluate(() => ({ errors: window.LAB.errors, failed: window.LAB.bootFailed || null }));
    if (boot.failed) die('lab failed to boot: ' + boot.failed);
    for (const e of boot.errors) console.error('draft error: ' + e);
    return await fn(page);
  } finally { await browser.close(); srv.close(); }
}
async function shoot(page, view, opts, outName) {
  const size = await page.evaluate(([v, o]) => window.LAB.show(v, o), [view, opts]);
  await page.setViewportSize({ width: Math.max(400, Math.min(size.w + 20, 6000)), height: Math.max(300, Math.min(size.h + 20, 6000)) });
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, outName + '.png');
  await page.locator('#out').screenshot({ path: file });
  console.log(`${rel(file)}  (${size.w}×${size.h})${size.errors && size.errors.length ? '  ERRORS: ' + size.errors.join(' | ') : ''}`);
  return file;
}

// ---------------------------------------------------------------- commands
const commands = {
  async list() {
    const m = X.meta(); const drafts = readDrafts().files.map(f => f.name);
    const has = (k, t) => drafts.includes(`${k}.${t}.js`) ? 'draft' : '';
    console.log('BUILDINGS (type  size  art  draft)');
    const sizes = Object.fromEntries([...m.fn.drawBuilding.matchAll(/case'([a-z]+)'/g)].map(x => [x[1], true]));
    const fp = Object.fromEntries([...X.grabObject(X.scriptOf(X.readIndex()).text, 'const BUILDINGS=').text.matchAll(/^ ([a-z]+):\{[^\n]*?w:(\d+),h:(\d+)/gm)].map(x => [x[1], `${x[2]}×${x[3]}`]));
    for (const t of m.buildings) console.log(`  ${t.padEnd(10)} ${(fp[t] || '').padEnd(5)} ${m.buildingCases[t] ? 'own case' : '!! default box'}  ${has('building', t)}`.replace(/\s+$/, ''));
    console.log('UNITS');
    for (const t of m.units) { const c = m.unitCases[t]; console.log(`  ${t.padEnd(14)} ${c ? (c.length > 1 ? 'shares case with ' + c.filter(x => x !== t).join(',') : 'own case') : '!! generic human() — needs art'}  ${has('unit', t)}`.replace(/\s+$/, '')); }
    console.log('RESOURCES'); for (const t of m.resources) console.log(`  ${t.padEnd(10)} ${has('resource', t)}`.replace(/\s+$/, ''));
    const px = [...new Set([...m.pixels, ...drafts.filter(f => f.startsWith('pixel.')).map(f => f.slice(6, -3))])];
    if (px.length) { console.log('PIXEL SPRITES'); for (const t of px) console.log(`  ${t.padEnd(14)} ${m.pixels.includes(t) ? 'in game' : ''} ${drafts.includes('pixel.' + t + '.js') ? 'draft' : ''}`.replace(/\s+$/, '')); }
    if (!m.hasPix) console.log('(pixel helpers not yet in index.html — `apply helpers` installs pixDraw/pixBuild)');
    if (readDrafts().helpers) console.log('HELPERS: ' + parseHelpers(readDrafts().helpers).map(h => h.name).join(', '));
    console.log(`\npalette: ${m.palette.all.length} distinct colours in use`);
  },
  async new() {
    const kind = kindOf(pos[0]), type = pos[1]; if (!type) die('usage: new <kind> <type>');
    if (kind === 'pixel') {
      if (!/^[a-z]+$/.test(type)) die('pixel sprite ids are lowercase letters only');
      const p = draftPath('pixel', type); if (fs.existsSync(p) && !flags.force) die(`${rel(p)} exists (use --force to overwrite)`);
      const [w, h] = String(flags.size || '14x24').split('x').map(Number); const blank = Array.from({ length: h }, () => '.'.repeat(w)).join('\n');
      fs.writeFileSync(p, `// @pixel ${type}\n// Painted sprite. One character per pixel; '.' is transparent; letters are palette keys.\n// 'T' = team colour, 'D' = team dark, 'L' = team light. anchor = [x,y] of the pixel that stands on the unit's feet (bottom centre).\n// Frame sets the unit draft can ask for: idle, walk, work, attack. A human is ~21 px tall at 1×.\n// Render: lab.mjs render pixel ${type}   Install: lab.mjs apply pixel ${type}   (pixDraw/pixBuild come from drafts/helpers.js → lab.mjs apply helpers)\nexport default {\n  id:'${type}', anchor:[${Math.floor(w / 2)},${h}],\n  palette:{ k:'#3b2a1a', s:'#e8c39e', h:'#5a3a1a', T:'team', D:'teamdark', L:'teamlight', p:'#6a5a48', w:'#8a6a3a', m:'#cfd4d8' },\n  frames:{\n    idle:[\`\n${blank}\n\`],\n  }\n};\n`);
      console.log(`created ${rel(p)} (${w}×${h} blank). Paint it, then: lab.mjs render pixel ${type}`); return;
    }
    const m = X.meta();
    const known = kind === 'building' ? m.buildings : kind === 'unit' ? m.units : m.resources;
    if (!known.includes(type)) die(`${type} is not a ${kind} in index.html (${known.join(', ')})`);
    const p = draftPath(kind, type); if (fs.existsSync(p) && !flags.force) die(`${rel(p)} exists (use --force to overwrite)`);
    let current = '';
    if (kind === 'resource') current = '  // resSprite() draws every resource with an if/else chain; see tools/sprite-lab/build or REFERENCE.md.\n  // Draw onto `x` (64×80 canvas ctx), base point (ox,oy)=(32,68), rng r(), variant v (0..2).\n  x.fillStyle=\'#888\';x.beginPath();x.arc(ox,oy-10,10,0,7);x.fill();';
    else { const cb = caseBody(m.fn[kind === 'building' ? 'drawBuilding' : 'drawUnit'], type); current = cb ? cb.text.split('\n').map(l => '  ' + l.replace(/^ {2,3}/, '')).join('\n') + (cb.shared ? `\n  // NOTE: currently shares a case with ${cb.shared.filter(x => x !== type).join(', ')}; applying splits ${type} out on its own.` : '') : (kind === 'unit' ? '  human(u,tc,{});  // currently no art of its own' : '  box(cx,cy,w,h,z(14),\'#999\');'); }
    const locals = DRAFT_LOCALS[kind].join(',');
    const guide = kind === 'building'
      ? `// Locals: b (building), d=BUILDINGS[type], cx,cy = screen px of the footprint's TOP corner, w,h tiles, p = build progress 0..1,\n// tc = team colours {c,d,l}, bm = corners(cx,cy,w,h,0) → {T,Rr,Bm,L}, z(ht) = ht*p (min 2).\n// Helpers: box(cx,cy,w,h,ht,col[,topCol]) pyramid(cx,cy,w,h,z,roofH,col) battlements(cx,cy,w,h,z,col) flag(x,y,team,h) corners() poly(pts,fill,stroke) shade(hex,f) mulberry32(seed) G.time HW HH TW TH ctx\n// Rules: no return/break at top level; gate details behind p (construction); flags only when b.built; light from upper-left.`
      : kind === 'unit'
        ? `// Locals: u (unit), tc = team colours {c,d,l}, d=UNITS[type], swing 0..1 (attack arc), working (gathering/building), wph = sin wobble when working, r = shadow radius.\n// The context is already translated to the unit's feet (0,0) and flipped by u.face; draw upward in negative y. Shadow + selection ring are already drawn.\n// Helpers: human(u,tc,{body,helmet}) poly(pts,fill,stroke) shade(hex,f) G.time ctx.  Humans are ~20px tall, mounted ~28px.\n// Rules: no return/break at top level; moving = u.goal && u.state!=='idle' → animate legs with Math.sin(u.anim*14).`
        : `// Locals: x = 2D ctx of a 64×80 sprite canvas, c = that canvas, key, kind, v = variant 0..2, r = seeded rng, ox=32, oy=68 (ground point).\n// drawResource() scales gold/stone by remaining amount. Keep the ground shadow ellipse at (ox,oy).`;
    fs.writeFileSync(p, `// @sprite ${kind} ${type}\n// Draft for ${kind} "${type}". Render: node tools/sprite-lab/lab.mjs render ${kind} ${type}   Apply: ... apply ${kind} ${type}\n${guide}\nexport default function ${type}(${DRAFT_LOCALS[kind][0]},{${DRAFT_LOCALS[kind].slice(1).join(',')}}){\n${current}\n}\n`);
    console.log(`created ${rel(p)} (pre-filled with the current art). Edit it, then: lab.mjs render ${kind} ${type}`);
  },
  async render() {
    const kind = kindOf(pos[0]), type = pos[1]; if (!type) die('usage: render <kind> <type> [--src both|current|draft]');
    if (kind === 'pixel') { await withPage(page => shoot(page, 'sheet', { kind: 'pixel', type }, `pixel.${type}`)); return; }
    await withPage(page => shoot(page, 'sheet', { kind, type, src: flags.src || 'both' }, `${kind}.${type}`));
  },
  async sheet() {
    const kind = pos[0] && pos[0] !== 'all' ? kindOf(pos[0]) : 'all';
    await withPage(page => shoot(page, 'contact', { kind, src: flags.src || 'current', mag: +(flags.zoom || 2), maxW: +(flags.width || 1500) }, `contact.${kind}.${flags.src || 'current'}`));
  },
  async scene() {
    await withPage(page => shoot(page, 'scene', { team: +(flags.team || 0), time: +(flags.time ?? 0.3), src: flags.src || 'current', zoom: +(flags.zoom || 1) }, `scene.${flags.src || 'current'}.t${flags.team || 0}`));
  },
  async palette() { await withPage(page => shoot(page, 'palette', {}, 'palette')); },
  async catalog() {
    fs.mkdirSync(OUT, { recursive: true }); const file = path.join(OUT, 'catalog.html'); const html = buildCatalog(); fs.writeFileSync(file, html);
    console.log(`${rel(file)}  (${(html.length / 1024).toFixed(0)} KB) — open it in a browser, or publish it`);
  },
  async lint() {
    const m = X.meta(); let targets = [];
    if (!pos[0] || pos[0] === 'all') targets = [...m.buildings.map(t => ['building', t]), ...m.units.map(t => ['unit', t]), ...m.resources.map(t => ['resource', t])];
    else if (KINDS.includes(kindOf(pos[0])) && !pos[1]) { const k = kindOf(pos[0]); targets = (k === 'building' ? m.buildings : k === 'unit' ? m.units : m.resources).map(t => [k, t]); }
    else targets = [[kindOf(pos[0]), pos[1]]];
    const reps = await withPage(page => page.evaluate(([ts, src]) => ts.map(([k, t]) => window.LAB.lint(k, t, src)), [targets, flags.src || 'both']));
    let bad = 0;
    for (const r of reps) {
      const M = r.measures; const meas = M.widthPx ? `${M.widthPx}×${M.heightPx}px${M.riseAboveTop !== undefined ? ` rise ${M.riseAboveTop}` : ''}` : '';
      const line = `${(r.kind + ' ' + r.type).padEnd(22)} ${r.src.padEnd(7)} ${meas.padEnd(22)}`;
      if (!r.problems.length && !flags.verbose) { console.log(line + ' ok' + (r.notes.length ? '   · ' + r.notes.join(' · ') : '')); continue; }
      bad += r.problems.length; console.log(line); for (const p of r.problems) console.log('    PROBLEM  ' + p); for (const n of r.notes) console.log('    note     ' + n);
    }
    console.log(`\n${reps.length} checked, ${bad} problem(s)`);
  },
  async aaa() {
    installHelpersInNode();
    const ids = !pos[0] || pos[0] === 'all'
      ? [...new Set(fs.readdirSync(DRAFTS).map(f => (/^(?:applied\.)?pixel\.([a-z]+)\.js$/.exec(f) || [])[1]).filter(Boolean))].sort()
      : pos;
    let bad = 0, pass = 0;
    for (const id of ids) {
      const f = [draftPath('pixel', id), path.join(DRAFTS, `applied.pixel.${id}.js`)].find(p => fs.existsSync(p));
      if (!f) { console.log(`${id.padEnd(14)} no pixel draft`); bad++; continue; }
      let spec; try { spec = parsePixelDraft(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`${id.padEnd(14)} FAILS TO PARSE: ${e.message}`); bad++; continue; }
      const r = AAA.check(id, spec); const M = r.m;
      const sets = Object.entries(M.sets).map(([k, v]) => k + ':' + v).join(' ');
      const head = `${id.padEnd(14)} ${r.cls.padEnd(9)} ${path.basename(f).startsWith('applied') ? 'applied' : 'draft  '} ${String(M.colours).padStart(2)} col  outline ${String(M.outline).padStart(3)}%  ${sets}`;
      if (!r.problems.length) { pass++; console.log(head + '  AAA ✓' + (r.notes.length && flags.verbose ? '\n    note ' + r.notes.join('\n    note ') : '')); continue; }
      bad++; console.log(head); for (const p of r.problems) console.log('    MISSING  ' + p); if (flags.verbose) for (const n of r.notes) console.log('    note     ' + n);
    }
    console.log(`\n${ids.length} sprites: ${pass} at AAA, ${bad} short of it (bar: tools/sprite-lab/AAA.md)`);
  },
  async diff() {
    installHelpersInNode();
    const kind = kindOf(pos[0]), type = pos[1];
    if (kind === 'pixel') { const src = fs.readFileSync(draftPath('pixel', type), 'utf8'); const spec = parsePixelDraft(src); spec.id = type; console.log('--- would store in index.html as ---\nPIXELS.' + type + '=' + (isGeneratedPixelDraft(src) ? generatedPixelText(src, type) + '  // generated: stored as code' : serializePixelSpec(spec)) + ';'); return; }
    const d = loadDraft(kind, type);
    const r = X.applyCase(kind, type, d.body, { dry: true });
    const fname = kind === 'building' ? 'drawBuilding' : kind === 'unit' ? 'drawUnit' : 'resSprite';
    console.log(`--- ${fname} before (segment for ${type}) ---`); console.log(kind === 'resource' ? '(resource: inserted as a marked block after the preamble)' : (caseBody(r.before, type) || { text: '(no case — falls to default)' }).text);
    console.log(`--- after ---`); console.log(kind === 'resource' ? r.after.slice(r.after.indexOf(`/*lab:${type}*/`), X.balanced ? undefined : undefined).split('\n').slice(0, 40).join('\n') : caseBody(r.after, type).text);
    console.log(`\nwhole-script parse: ok. Apply with: lab.mjs apply ${kind} ${type}`);
  },
  async apply() {
    installHelpersInNode();
    if (pos[0] === 'all') {
      // helpers → painted sprites → case bodies, one backup, keep going on errors, report at the end
      const dry = !!flags.dry; const d = readDrafts(); const results = []; let backupFile = null;
      if (!dry) backupFile = X.backup();
      if (d.helpers) { try { const hs = parseHelpers(d.helpers); for (const h of hs) new Function(h.text); X.applyHelpers(hs, { dry, backup: false }); results.push(['helpers', hs.length + ' functions', 'ok']); } catch (e) { results.push(['helpers', '', 'FAILED: ' + e.message]); } }
      const px = d.files.filter(f => f.name.startsWith('pixel.')), cases = d.files.filter(f => !f.name.startsWith('pixel.'));
      for (const f of px) { const id = f.name.slice(6, -3); try { const spec = parsePixelDraft(f.src); spec.id = id; const text = isGeneratedPixelDraft(f.src) ? generatedPixelText(f.src, id) : serializePixelSpec(spec); X.applyPixel(id, text, { dry, backup: false }); results.push(['pixel ' + id, (text.length / 1024).toFixed(1) + ' KB', 'ok']); } catch (e) { results.push(['pixel ' + id, '', 'FAILED: ' + e.message]); } }
      for (const f of cases) { const [, kind, type] = /^(building|unit|resource)\.([a-z]+)\.js$/.exec(f.name); try { const dr = parseDraft(f.src); new Function(...DRAFT_LOCALS[kind], dr.body); X.applyCase(kind, type, dr.body, { dry, backup: false }); results.push([kind + ' ' + type, '', 'ok']); } catch (e) { results.push([kind + ' ' + type, '', 'FAILED: ' + e.message]); } }
      for (const [a, b, c] of results) console.log(`  ${a.padEnd(24)} ${b.padEnd(14)} ${c}`);
      const failed = results.filter(r => r[2].startsWith('FAILED')).length;
      if (dry) { console.log(`(dry) ${results.length - failed} would apply, ${failed} failed`); return; }
      console.log(`applied ${results.length - failed}, failed ${failed}   backup: ${rel(backupFile)}`);
      if (!flags.keep) { for (const f of d.files) { const ok = results.find(r => r[0].endsWith(' ' + f.name.replace(/^(pixel|building|unit|resource)\./, '').slice(0, -3)) && r[2] === 'ok'); if (ok) fs.renameSync(path.join(DRAFTS, f.name), path.join(DRAFTS, 'applied.' + f.name)); } console.log('applied drafts renamed to drafts/applied.* (rename back to iterate)'); }
      console.log('now: lab.mjs verify   (smoke-test the real game)'); return;
    }
    if (pos[0] === 'helpers') {
      const hp = path.join(DRAFTS, 'helpers.js'); if (!fs.existsSync(hp)) die('no drafts/helpers.js');
      const hs = parseHelpers(fs.readFileSync(hp, 'utf8')); for (const h of hs) new Function(h.text);
      for (const line of X.applyHelpers(hs, { dry: !!flags.dry })) console.log((flags.dry ? '(dry) ' : '') + line);
      return;
    }
    const kind = kindOf(pos[0]), type = pos[1];
    if (kind === 'pixel') {
      const p = draftPath('pixel', type); if (!fs.existsSync(p)) die(`no draft at ${rel(p)}`);
      const src = fs.readFileSync(p, 'utf8'); const spec = parsePixelDraft(src); spec.id = type;
      const text = isGeneratedPixelDraft(src) ? generatedPixelText(src, type) : serializePixelSpec(spec);
      const m = X.meta(); if (!m.hasPix) console.log('note: pixDraw/pixBuild are not in index.html yet — run `lab.mjs apply helpers` too, or units using this sprite will throw');
      const r = X.applyPixel(type, text, { dry: !!flags.dry });
      console.log(flags.dry ? `(dry) would store PIXELS.${type} (${text.length} chars) in index.html — script parses ok` : `stored PIXELS.${type} in index.html   backup: ${rel(r.backup)}`); return;
    }
    const d = loadDraft(kind, type);
    const r = X.applyCase(kind, type, d.body, { dry: !!flags.dry });
    if (flags.dry) { console.log(`(dry) would splice ${rel(draftPath(kind, type))} into index.html — script parses ok`); return; }
    console.log(`applied ${kind} ${type} → index.html   backup: ${rel(r.backup)}`);
    if (flags.keep) return;
    fs.renameSync(draftPath(kind, type), path.join(DRAFTS, `applied.${kind}.${type}.js`)); console.log(`draft renamed to drafts/applied.${kind}.${type}.js (the lab ignores it; delete when happy, or rename back to iterate)`);
  },
  async verify() {
    // Smoke test: load the real game, press Play, let it run, and report page errors. Screenshot to out/game.png.
    const pw = loadPlaywright();
    const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const f = path.normalize(path.join(X.ROOT, u.pathname === '/' ? 'index.html' : u.pathname)); if (!f.startsWith(X.ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, 'text/plain', 'nf'); send(res, 200, f.endsWith('.html') ? 'text/html' : 'application/octet-stream', fs.readFileSync(f)); });
    await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
    const browser = await pw.chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    try {
      await page.goto(`http://127.0.0.1:${port}/index.html`); await page.waitForTimeout(800);
      if (flags.seed) await page.fill('#s-seed', String(flags.seed));
      if (flags.age) await page.selectOption('#s-age', String(flags.age)).catch(() => { });
      if (flags.map) await page.selectOption('#s-map', String(flags.map)).catch(() => { });
      await page.selectOption('#s-reveal', 'visible').catch(() => { });
      await page.click('#play'); await page.waitForTimeout(+(flags.wait || 4000));
      fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, 'game.png') });
      const stats = await page.evaluate(() => (typeof G !== 'undefined' && G ? { tick: G.tick, units: G.units.length, buildings: G.buildings.length } : null));
      console.log(`game ran: ${JSON.stringify(stats)}   screenshot: ${rel(path.join(OUT, 'game.png'))}`);
    } finally { await browser.close(); srv.close(); }
    if (errs.length) { console.log('ERRORS:'); for (const e of [...new Set(errs)].slice(0, 20)) console.log('  ' + e); process.exit(1); }
    console.log('no page errors');
  },
  async revert() {
    const bs = X.listBackups(); if (!bs.length) die('no backups');
    const b = flags.to ? path.join(X.BACKUPS, flags.to) : bs[bs.length - 1];
    if (!fs.existsSync(b)) die('no such backup ' + b);
    const cur = X.backup(); fs.copyFileSync(b, X.INDEX); console.log(`index.html restored from ${rel(b)} (the version you replaced is saved as ${rel(cur)})`);
  },
  async backups() { for (const b of X.listBackups()) console.log(rel(b)); },
  async serve() {
    const { port } = await startServer(+(flags.port || 8765));
    console.log(`Sprite Lab at http://127.0.0.1:${port}/lab.html  (ctrl-c to stop; drafts and index.html are re-read on every reload)`);
    await new Promise(() => { });
  },
};

if (!cmd || cmd === 'help' || cmd === '--help' || !commands[cmd]) {
  console.log(`Sprite Lab — design & verify visual assets for the game (see tools/sprite-lab/README.md)

  list                              what exists, what has drafts, what still uses generic art
  new <kind> <type>                 scaffold drafts/<kind>.<type>.js pre-filled with the current art
  render <kind> <type> [--src s]    sheet PNG: teams · construction/walk · animation · states · ×N detail (draft vs current)
  sheet [kind|all] [--zoom 2]       contact sheet of everything, for consistency
  scene [--team n] [--time t]       a composed village on terrain, in depth order [--src draft] [--zoom 2]
  aaa [id|all] [--verbose]          the AAA bar for painted sprites: frame counts, ramps, outline, ground contact (AAA.md)
  lint [kind [type] | all]          overflow, team colour, construction stages, animation, new colours, exceptions
  palette                           every colour currently in use, by section
  catalog                           build out/catalog.html: a self-contained browsable catalogue (also served at /catalog.html)
  diff <kind> <type>                show what apply would change
  apply <kind> <type> [--dry]       splice the draft into index.html (backup first); apply helpers → drafts/helpers.js; apply all → everything
  verify [--seed s] [--age n] [--map m] [--wait ms]  smoke-test the real game headlessly (press Play, run, report errors, out/game.png)
  revert [--to file]  · backups     restore index.html from a backup
  serve [--port 8765]               interactive lab in a browser

kinds: building | unit | resource | pixel (painted sprites: new pixel <id> [--size 14x24], render/apply pixel <id>).  Output PNGs land in tools/sprite-lab/out/ — Read them.`);
  process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0);
}
commands[cmd]().catch(e => { console.error(e.stack || e); process.exit(1); });
