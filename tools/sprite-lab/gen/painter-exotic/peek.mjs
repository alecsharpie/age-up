// node peek.mjs <draft.js> <out.png> [sets] [scale] : frames side by side, zoomed, on grey
import zlib from 'zlib'; import fs from 'fs'; import { pathToFileURL } from 'url';
const [,, file, out, sets = '', S = '8'] = process.argv; const sc = +S;
const spec = (await import(pathToFileURL(file).href + '?' + Date.now())).default;
const TEAM = { team: '#2f6fd6', teamdark: '#1f4a94', teamlight: '#6f9ff0' };
const rows = []; const want = sets ? sets.split(',') : Object.keys(spec.frames);
for (const w0 of want) { const [s, ix] = w0.split(':'); rows.push(spec.frames[s].filter((_, k) => ix === undefined || ix.split('+').includes(String(k))).map(g => { const l = g.replace(/^\n+|\n+$/g, '').split('\n'); return l; })); }
const gap = 2; let W = 0, H = 0;
for (const r of rows) { W = Math.max(W, r.reduce((a, l) => a + (Math.max(...l.map(x => x.length)) + gap) * sc, 0)); H += (Math.max(...r.map(l => l.length)) + gap) * sc; }
const px = Buffer.alloc(W * H * 3); for (let i = 0; i < W * H; i++) { const y = Math.floor(i / W), x = i % W; const c = ((Math.floor(x / sc) + Math.floor(y / sc)) & 1) ? 0x6a : 0x74; px[i * 3] = c; px[i * 3 + 1] = c + 18; px[i * 3 + 2] = c - 10; }
let oy = 0;
for (const r of rows) { let ox = 0; for (const l of r) { const w = Math.max(...l.map(x => x.length));
  l.forEach((line, y) => { for (let x = 0; x < line.length; x++) { const ch = line[x]; let c = spec.palette[ch]; if (!c) continue; c = TEAM[c] || c; const n = parseInt(c.slice(1), 16);
    for (let yy = 0; yy < sc; yy++) for (let xx = 0; xx < sc; xx++) { const i = ((oy + y * sc + yy) * W + ox + x * sc + xx) * 3; px[i] = n >> 16; px[i + 1] = (n >> 8) & 255; px[i + 2] = n & 255; } } });
  ox += (w + gap) * sc; } oy += (Math.max(...r.map(l => l.length)) + gap) * sc; }
const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const crc = b => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, W, H);
