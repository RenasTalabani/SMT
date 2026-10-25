'use strict';
// Draws the SAMPLE pictures used by the demo data (no dependencies).
// Run: node scripts/make-sample-assets.js  -> ../web/public/sample/** and ../web/public/default-avatar.png
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { products } = require('./sample-data');

const pub = path.join(__dirname, '..', '..', 'web', 'public');
const write = (rel, data) => {
  const file = path.join(pub, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log('wrote', rel);
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stamp = (w) => `<g transform="translate(${w - 8},8)"><rect x="-74" y="0" width="74" height="22" rx="11" fill="#111827" fill-opacity="0.75"/><text x="-37" y="15" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#fff" letter-spacing="1.5">SAMPLE</text></g>`;

const COLORS = { supplement: ['#f97316', '#facc15'], drink: ['#06b6d4', '#3b82f6'], gear: ['#475569', '#94a3b8'], apparel: ['#111827', '#6b7280'], membership: ['#7c3aed', '#ec4899'], other: ['#10b981', '#84cc16'] };
const ICON = { supplement: '💪', drink: '🥤', gear: '🏋️', apparel: '👕', membership: '🎫', other: '⭐' };

for (const p of products) {
  const [a, b] = COLORS[p.category] || COLORS.other;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="200" cy="128" r="72" fill="#fff" fill-opacity="0.18"/>
<text x="200" y="158" text-anchor="middle" font-size="84">${ICON[p.category] || ICON.other}</text>
<text x="200" y="262" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#fff">${esc(p.name)}</text>
${stamp(400)}
</svg>`;
  write(p.imageUrl.replace(/^\//, ''), svg);
}

const coaches = [['ahmed', 'AH', '#ea580c'], ['sara', 'SM', '#db2777'], ['karwan', 'KR', '#0891b2'], ['lana', 'LA', '#7c3aed']];
for (const [file, initials, color] of coaches) {
  write(`sample/coaches/${file}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<rect width="200" height="200" fill="${color}"/>
<circle cx="100" cy="78" r="38" fill="#fff" fill-opacity="0.9"/>
<path d="M30 200c6-46 36-70 70-70s64 24 70 70z" fill="#fff" fill-opacity="0.9"/>
<text x="100" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${color}">${initials}</text>
<rect x="50" y="168" width="100" height="22" rx="11" fill="#111827" fill-opacity="0.75"/>
<text x="100" y="183" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#fff" letter-spacing="1.5">SAMPLE</text>
</svg>`);
}

const courses = [['weight-training', 'Weight Training', '#ea580c', '#1f2937'], ['yoga', 'Yoga', '#14b8a6', '#6366f1'], ['hiit', 'HIIT', '#ef4444', '#f59e0b'], ['nutrition', 'Nutrition', '#22c55e', '#0ea5e9']];
for (const [file, title, a, b] of courses) {
  write(`sample/courses/${file}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="800" height="450" fill="url(#g)"/>
<g fill="#fff" fill-opacity="0.15"><rect x="150" y="205" width="500" height="40" rx="8"/><rect x="110" y="165" width="50" height="120" rx="10"/><rect x="640" y="165" width="50" height="120" rx="10"/></g>
<text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="#fff">${esc(title)}</text>
${stamp(800)}
</svg>`);
}

// default-avatar.png (referenced by the website when someone has no photo)
function png(size, pixel) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, g, b, a] = pixel((x + 0.5) / size, (y + 0.5) / size);
    const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
write('default-avatar.png', png(128, (u, v) => {
  const head = Math.hypot(u - 0.5, v - 0.4) < 0.18;
  const body = v > 0.66 && Math.hypot((u - 0.5) / 0.36, (v - 0.98) / 0.36) < 1;
  return head || body ? [241, 245, 249, 255] : [148, 163, 184, 255];
}));
