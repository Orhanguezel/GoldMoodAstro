import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const outDir = resolve(dirname(new URL(import.meta.url).pathname), '../uploads/tarot');
mkdirSync(outDir, { recursive: true });

const cards = [
  'the-fool', 'the-magician', 'the-high-priestess', 'the-empress', 'the-emperor',
  'the-hierophant', 'the-lovers', 'the-chariot', 'strength', 'the-hermit',
  'wheel-of-fortune', 'justice', 'the-hanged-man', 'death', 'temperance',
  'the-devil', 'the-tower', 'the-star', 'the-moon', 'the-sun', 'judgement',
  'the-world',
  'ace-of-cups', 'ace-of-swords', 'ace-of-wands', 'ace-of-pentacles',
  'two-of-cups', 'three-of-cups', 'four-of-cups', 'five-of-cups', 'six-of-cups',
  'seven-of-cups', 'eight-of-cups', 'nine-of-cups', 'ten-of-cups',
  'page-of-cups', 'knight-of-cups', 'queen-of-cups', 'king-of-cups',
  'two-of-swords', 'three-of-swords', 'four-of-swords', 'five-of-swords',
  'six-of-swords', 'seven-of-swords', 'eight-of-swords', 'nine-of-swords',
  'ten-of-swords', 'page-of-swords', 'knight-of-swords', 'queen-of-swords',
  'king-of-swords',
  'two-of-wands', 'three-of-wands', 'four-of-wands', 'five-of-wands',
  'six-of-wands', 'seven-of-wands', 'eight-of-wands', 'nine-of-wands',
  'ten-of-wands', 'page-of-wands', 'knight-of-wands', 'queen-of-wands',
  'king-of-wands',
  'two-of-pentacles', 'three-of-pentacles', 'four-of-pentacles',
  'five-of-pentacles', 'six-of-pentacles', 'seven-of-pentacles',
  'eight-of-pentacles', 'nine-of-pentacles', 'ten-of-pentacles',
  'page-of-pentacles', 'knight-of-pentacles', 'queen-of-pentacles',
  'king-of-pentacles',
];

const palette = {
  base: [16, 12, 34],
  deep: [36, 24, 58],
  plum: [91, 70, 130],
  amethyst: [123, 94, 167],
  gold: [212, 175, 55],
  cream: [250, 246, 239],
  ink: [10, 8, 20],
};

function suitOf(slug) {
  if (slug.endsWith('-of-cups')) return 'cups';
  if (slug.endsWith('-of-swords')) return 'swords';
  if (slug.endsWith('-of-wands')) return 'wands';
  if (slug.endsWith('-of-pentacles')) return 'pentacles';
  return 'major';
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function crc32(buf) {
  let crc = -1;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function drawCard(slug, index) {
  const width = 720;
  const height = 1080;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const suit = suitOf(slug);
  const accent = {
    major: palette.gold,
    cups: [108, 150, 205],
    swords: [226, 225, 232],
    wands: [231, 142, 72],
    pentacles: [212, 175, 55],
  }[suit];

  const seed = Array.from(slug).reduce((sum, c) => sum + c.charCodeAt(0), 0) + index * 31;
  const cx = width * (0.42 + ((seed % 19) - 9) / 100);
  const cy = height * (0.45 + (((seed >> 2) % 19) - 9) / 100);
  const ringCount = 3 + (seed % 4);
  const rayStep = 42 + (seed % 18);

  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      let color = mix(palette.base, palette.deep, Math.min(1, ny * 1.2));

      const glow = Math.max(0, 1 - dist / 520);
      color = mix(color, palette.plum, glow * 0.65);
      color = mix(color, accent, Math.max(0, 1 - dist / 190) * 0.42);

      const border = x < 28 || x > width - 29 || y < 28 || y > height - 29;
      const innerBorder = x < 44 || x > width - 45 || y < 44 || y > height - 45;
      if (border) color = palette.gold;
      else if (innerBorder) color = mix(palette.ink, accent, 0.24);

      for (let r = 0; r < ringCount; r++) {
        const radius = 138 + r * 74 + (seed % 23);
        if (Math.abs(dist - radius) < 3.2) color = mix(color, palette.gold, 0.78);
      }

      const ray = Math.abs(Math.sin(angle * rayStep + seed));
      if (dist > 120 && dist < 430 && ray > 0.985) color = mix(color, accent, 0.5);

      if (suit !== 'major') {
        const stripe = (x + y + seed * 5) % 96;
        if (stripe < 3 && y > 120 && y < height - 120) color = mix(color, accent, 0.36);
      }

      const moon = Math.abs(dist - 72) < 5 || (dist < 58 && dx > 8);
      if (moon) color = mix(color, palette.cream, 0.85);

      const star = (Math.abs(dx) + Math.abs(dy) < 64) || (Math.abs(dx - dy) < 4 && dist < 84) || (Math.abs(dx + dy) < 4 && dist < 84);
      if (star && (seed + index) % 3 !== 0) color = mix(color, palette.gold, 0.7);

      const px = row + 1 + x * 4;
      raw[px] = color[0];
      raw[px + 1] = color[1];
      raw[px + 2] = color[2];
      raw[px + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let created = 0;
let skipped = 0;
for (const [index, slug] of cards.entries()) {
  const file = resolve(outDir, `${slug}.png`);
  if (existsSync(file)) {
    skipped++;
    continue;
  }
  writeFileSync(file, drawCard(slug, index));
  created++;
}

console.log(JSON.stringify({ created, skipped, total: cards.length, outDir }, null, 2));
