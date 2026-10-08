// preview.mjs <draft.js> <set> [scale] -> out png with all frames of the set side by side (blue team), on mid grey with ground line
import fs from 'fs'; import zlib from 'zlib';
const [file, set, scArg] = process.argv.slice(2); const S = +(scArg || 10);
const src = fs.readFileSync(file, 'utf8');
const mod = await import('data:text/javascript,' + encodeURIComponent(src));
const spec = mod.default; const T = { team: '#2f6fd6', teamdark: '#1f4a94', teamlight: '#6f9ff0' };
const sets = set === 'all' ? Object.keys(spec.frames) : set.split(',');
const rowsOf = g => g.replace(/^\n+|\n+$/g, '').split('\n');
let frames = []; for (const s of sets) for (const g of spec.frames[s]) frames.push(rowsOf(g));
const fw = Math.max(...frames.map(f => f[0].length)), fh = Math.max(...frames.map(f => f.length));
const perRow = Math.min(frames.length, +(process.env.PER || 8)); const nrows = Math.ceil(frames.length / perRow);
const Wp = perRow * (fw + 2) * S, Hp = nrows * (fh + 2) * S;
const buf = Buffer.alloc(Wp * Hp * 3);
const hex = h => { h = (T[h] || h).replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
for (let i = 0; i < buf.length; i += 3) { buf[i] = 120; buf[i + 1] = 150; buf[i + 2] = 90; }
frames.forEach((f, n) => {
  const ox = (n % perRow) * (fw + 2) + 1, oy = Math.floor(n / perRow) * (fh + 2) + 1;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const ch = (f[y] || '')[x]; let c = [100, 130, 80]; if ((x + y) % 2) c = [108, 138, 86];
    if (ch && ch !== '.') c = hex(spec.palette[ch]);
    for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { const p = (((oy + y) * S + yy) * Wp + (ox + x) * S + xx) * 3; buf[p] = c[0]; buf[p + 1] = c[1]; buf[p + 2] = c[2]; }
  }
});
const raw = Buffer.alloc((Wp * 3 + 1) * Hp); for (let y = 0; y < Hp; y++) { raw[y * (Wp * 3 + 1)] = 0; buf.copy(raw, y * (Wp * 3 + 1) + 1, y * Wp * 3, (y + 1) * Wp * 3); }
const crc = (b) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = 0xffffffff; for (const x of b) r = t[(r ^ x) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(Wp, 0); ih.writeUInt32BE(Hp, 4); ih[8] = 8; ih[9] = 2;
const out = process.env.OUT || 'tools/sprite-lab/gen/painter-cavalry/prev.png';
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, Wp + 'x' + Hp);
