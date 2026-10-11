// Screenshots of a few duels, tick by tick, to eyeball attack timing (wind-up, impact, recoil) and facing.
// Writes tools/combat/out/duel_<n>.png and a contact sheet tools/combat/out/duels.png. `FRAMES=` (default 16).
import { chromium } from '/Users/alec/me/agentic-evals/node_modules/playwright-core/index.mjs';
import { fileURLToPath } from 'url'; import path from 'path'; import fs from 'fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto('file://' + path.resolve(here, '../../index.html')); await page.waitForFunction(() => !!window.dbg);
await page.addScriptTag({ path: path.join(here, 'lib.js') });
await page.evaluate(() => {
  CB.arena(5); const pair = (a, b, x, y) => { const A = CB.unit(a, 0, x - 1.5, y + 0.4), B = CB.unit(b, 1, x + 1.5, y - 0.6); A.hp = B.hp = 999; cmdAttack(A, B); cmdAttack(B, A) };
  pair('swordsman', 'spearman', 0, 0); pair('archer', 'knight', -3, 3); pair('villager', 'horseman', 2, -3);
  cam.zoom = 2.2; centerOn(CB.CX, CB.CY); for (let i = 0; i < 30; i++) update();
});
// frame the fighters: the bounding box of their screen positions, padded
const clip = await page.evaluate(() => { const ps = G.units.filter(u => u.team >= 0 && Math.hypot(u.x - CB.CX, u.y - CB.CY) < 8).map(u => w2s(u.x, u.y)); const x0 = Math.min(...ps.map(p => p.x)) - 80, x1 = Math.max(...ps.map(p => p.x)) + 80, y0 = Math.min(...ps.map(p => p.y)) - 110, y1 = Math.max(...ps.map(p => p.y)) + 40; return { x: Math.max(0, Math.round(x0)), y: Math.max(0, Math.round(y0)), width: Math.round(x1 - x0), height: Math.round(y1 - y0) } });
const n = Number(process.env.FRAMES || 16), files = [];
for (let k = 0; k < n; k++) { await page.evaluate(() => { update(); render() }); const f = path.join(out, `duel_${k}.png`); await page.screenshot({ path: f, clip }); files.push(f) }
// contact sheet, 4 across, drawn by the page itself
const sheet = await page.evaluate(async (imgs) => { const ims = await Promise.all(imgs.map(src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src }))); const c = document.createElement('canvas'); const w = ims[0].width, h = ims[0].height; c.width = w * 4; c.height = h * Math.ceil(ims.length / 4); const x = c.getContext('2d'); ims.forEach((im, k) => x.drawImage(im, (k % 4) * w, Math.floor(k / 4) * h, w, h)); return c.toDataURL('image/png') }, files.map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')));
fs.writeFileSync(path.join(out, 'duels.png'), Buffer.from(sheet.split(',')[1], 'base64')); console.log('wrote', path.join(out, 'duels.png'));
await browser.close();
