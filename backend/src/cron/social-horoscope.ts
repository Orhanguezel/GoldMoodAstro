// backend/src/cron/social-horoscope.ts
// GoldMoodAstro — Günlük burç sosyal medya otomasyonu.
//
// Yeni politika (2026-07-30):
// - Eski tek-burç döngüsü iptal edildi.
// - Her gün TÜM burçlar paylaşılır.
// - Instagram carousel limiti 10 medya olduğu için günlük yorum 2 carousel'e bölünür:
//   1/2 = Koç, Boğa, İkizler, Yengeç, Aslan, Başak
//   2/2 = Terazi, Akrep, Yay, Oğlak, Kova, Balık
// - Görseller mevcut `backend/uploads/zodiac/*.png` setinden üretilir.
// - Kapak/CTA slide yok; sadece kaliteli zodyak görseli + kısa okunaklı günlük yorum.

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { env } from '@/core/env';
import { getDailyHoroscope } from '@/modules/horoscopes/repository';
import { type SignKey } from '@/modules/horoscopes/schema';
import { db as socialDb } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';

const TENANT = 'goldmoodastro';
const TARGET_HOUR_UTC = 6; // 09:00 TR
const PART_GAP_MINUTES = 10;
const HOUR_MS = 60 * 60 * 1000;
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
const HASHTAGS = '#goldmoodastro #astroloji #burc #astrolojiyorumlari #günlükburç #yükselenburç';

const SIGN_LABEL: Record<SignKey, string> = {
  aries: 'Koç',
  taurus: 'Boğa',
  gemini: 'İkizler',
  cancer: 'Yengeç',
  leo: 'Aslan',
  virgo: 'Başak',
  libra: 'Terazi',
  scorpio: 'Akrep',
  sagittarius: 'Yay',
  capricorn: 'Oğlak',
  aquarius: 'Kova',
  pisces: 'Balık',
};

// Zodyak sırası — "günün burcu" rotasyonu için (her gün farklı kapak).
const SIGN_ORDER: SignKey[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

// Güne göre deterministik burç seçimi. offset ile aynı gün iki farklı kapak
// (part 1/2) üretilir; her gün tüm liste kaydığından kapak sürekli değişir.
export function signOfDay(dateStr: string, offset = 0): SignKey {
  const dayNumber = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / (24 * 60 * 60 * 1000));
  const idx = (((dayNumber + offset) % SIGN_ORDER.length) + SIGN_ORDER.length) % SIGN_ORDER.length;
  return SIGN_ORDER[idx]!;
}

const SIGN_ELEMENT: Record<SignKey, 'Ateş' | 'Toprak' | 'Hava' | 'Su'> = {
  aries: 'Ateş',
  leo: 'Ateş',
  sagittarius: 'Ateş',
  taurus: 'Toprak',
  virgo: 'Toprak',
  capricorn: 'Toprak',
  gemini: 'Hava',
  libra: 'Hava',
  aquarius: 'Hava',
  cancer: 'Su',
  scorpio: 'Su',
  pisces: 'Su',
};

const AUGUST_2026_DAILY_PLAN: Record<string, { theme: string; focus: string; angles: Record<SignKey, string> }> = {
  '2026-08-01': {
    theme: 'Ağustos ayına içini toparlayarak başla.',
    focus: 'Ayın ana niyetini netleştir.',
    angles: {
      aries: 'cesaret',
      taurus: 'güven',
      gemini: 'iletişim',
      cancer: 'aile',
      leo: 'görünürlük',
      virgo: 'düzen',
      libra: 'ilişki',
      scorpio: 'derinlik',
      sagittarius: 'ufuk',
      capricorn: 'hedef',
      aquarius: 'fikir',
      pisces: 'sezgi',
    },
  },
  '2026-08-02': {
    theme: 'Haftaya girerken iç sesin daha görünür.',
    focus: 'Yükselenin hangi kapıyı açıyor?',
    angles: {
      aries: 'ilk adım',
      taurus: 'para düzeni',
      gemini: 'haber',
      cancer: 'iç güven',
      leo: 'yaratıcılık',
      virgo: 'sağlık',
      libra: 'denge',
      scorpio: 'sezgi',
      sagittarius: 'öğrenme',
      capricorn: 'sorumluluk',
      aquarius: 'arkadaşlık',
      pisces: 'rüya',
    },
  },
  '2026-08-03': {
    theme: 'Haftanın ilk adımı sade ama güçlü olsun.',
    focus: 'Planı küçült, devamlılığı büyüt.',
    angles: {
      aries: 'netlik',
      taurus: 'ritim',
      gemini: 'zihin',
      cancer: 'ev',
      leo: 'kalp',
      virgo: 'iş',
      libra: 'seçim',
      scorpio: 'dönüşüm',
      sagittarius: 'yol',
      capricorn: 'kariyer',
      aquarius: 'gelecek',
      pisces: 'şefkat',
    },
  },
  '2026-08-04': {
    theme: 'Sezgi ve karar enerjisi birlikte çalışıyor.',
    focus: 'İlk tepki yerine içindeki mesajı dinle.',
    angles: {
      aries: 'beden enerjisi',
      taurus: 'beden',
      gemini: 'merak',
      cancer: 'duygu',
      leo: 'özgüven',
      virgo: 'detay',
      libra: 'estetik',
      scorpio: 'güven',
      sagittarius: 'inanç',
      capricorn: 'plan',
      aquarius: 'özgünlük',
      pisces: 'akış',
    },
  },
  '2026-08-05': {
    theme: 'Sayılar, ritimler ve tekrarlar yol gösteriyor.',
    focus: 'Bugün aynı döngüye farklı cevap ver.',
    angles: {
      aries: 'aceleyi yumuşatma',
      taurus: 'sadeleşme',
      gemini: 'karar',
      cancer: 'hatıra',
      leo: 'sahne',
      virgo: 'verim',
      libra: 'uzlaşma',
      scorpio: 'sır',
      sagittarius: 'özgürlük',
      capricorn: 'sabır',
      aquarius: 'sistem',
      pisces: 'yaratıcılık',
    },
  },
  '2026-08-06': {
    theme: 'Son dördün: bırakma ve hafifleme zamanı.',
    focus: 'Seni yoran yükü isimlendir.',
    angles: {
      aries: 'bırakma',
      taurus: 'konfor alanı',
      gemini: 'düşünce temizliği',
      cancer: 'geçmişi bırakma',
      leo: 'gururu bırakma',
      virgo: 'fazla kontrolü bırakma',
      libra: 'onay ihtiyacını bırakma',
      scorpio: 'yük bırakma',
      sagittarius: 'abartıyı bırakma',
      capricorn: 'ağır yükü bırakma',
      aquarius: 'mesafeyi bırakma',
      pisces: 'dağınıklığı bırakma',
    },
  },
  '2026-08-07': {
    theme: 'Haftayı hafiflet: mizah da farkındalıktır.',
    focus: 'Kendini fazla ciddiye aldığın yeri gör.',
    angles: {
      aries: 'mizah',
      taurus: 'keyif',
      gemini: 'espri',
      cancer: 'yakınlık',
      leo: 'eğlence',
      virgo: 'pratiklik',
      libra: 'kararsızlık',
      scorpio: 'kara mizah',
      sagittarius: 'neşe',
      capricorn: 'disiplin',
      aquarius: 'tuhaflık',
      pisces: 'tatlı kaçış',
    },
  },
};

const PARTS: Array<{ part: 1 | 2; signs: SignKey[]; label: string }> = [
  {
    part: 1,
    signs: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo'],
    label: 'Koç, Boğa, İkizler, Yengeç, Aslan ve Başak',
  },
  {
    part: 2,
    signs: ['libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
    label: 'Terazi, Akrep, Yay, Oğlak, Kova ve Balık',
  },
];

function isoDate(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function prettyDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function cleanContent(raw: string): string {
  return raw
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/[*_`>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      cur = candidate;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && lines[maxLines - 1]!.length > maxChars) {
    lines[maxLines - 1] = `${lines[maxLines - 1]!.slice(0, maxChars - 1).trim()}…`;
  }
  return lines;
}

function tspans(lines: string[], x: number, dy: number): string {
  return lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${esc(line)}</tspan>`).join('');
}

function uploadsDir(): string {
  return env.LOCAL_STORAGE_ROOT ? path.resolve(env.LOCAL_STORAGE_ROOT) : path.resolve(process.cwd(), 'uploads');
}

function fallbackMessage(sign: SignKey, dateStr: string): string {
  const planned = AUGUST_2026_DAILY_PLAN[dateStr];
  const element = SIGN_ELEMENT[sign];
  const advice = {
    Ateş: 'Küçük ama cesur bir adım yeter.',
    Toprak: 'Planı somutlaştır, bedenini ihmal etme.',
    Hava: 'Net cümleler seni karmaşadan korur.',
    Su: 'Duygunu dinle; iç sesin ayrıntıda konuşur.',
  }[element];

  if (planned) {
    return `${SIGN_LABEL[sign]} için bugün ${planned.angles[sign]} alanı öne çıkıyor. ${advice}`;
  }

  return `${SIGN_LABEL[sign]} için bugün iç ses ve günlük ritim öne çıkıyor. ${advice}`;
}

function socialCardMessage(sign: SignKey, raw: string, dateStr: string): string {
  const cleaned = cleanContent(raw);
  if (!cleaned) return fallbackMessage(sign, dateStr);

  const paragraph = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 25) ?? cleaned;
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const summary = sentences.slice(0, 2).join(' ');
  const text = summary || paragraph;
  return text.length > 145 ? `${text.slice(0, 142).trim()}…` : text;
}

async function renderZodiacCard(sign: SignKey, dateStr: string, message: string): Promise<{ filePath: string; publicUrl: string }> {
  const dateLabel = prettyDate(dateStr);
  const dir = path.join(uploadsDir(), 'social', 'daily-horoscope-all', dateStr);
  fs.mkdirSync(dir, { recursive: true });

  const fileName = `${dateStr}-${sign}.png`;
  const filePath = path.join(dir, fileName);
  const publicUrl = `${PUBLIC_BASE}/uploads/social/daily-horoscope-all/${dateStr}/${fileName}`;
  if (fs.existsSync(filePath)) return { filePath, publicUrl };

  const zodiacPath = path.resolve(uploadsDir(), 'zodiac', `${sign}.png`);
  const repoFallbackPath = path.resolve(process.cwd(), 'uploads', 'zodiac', `${sign}.png`);
  const sourcePath = fs.existsSync(zodiacPath) ? zodiacPath : repoFallbackPath;
  if (!fs.existsSync(sourcePath)) throw new Error(`Zodyak görseli bulunamadı: ${sign}`);

  const bodyLines = wrap(message, 42, 4);
  const base = await sharp(sourcePath)
    .resize(1080, 1350, { fit: 'cover' })
    .blur(10)
    .modulate({ brightness: 0.55, saturation: 1.18 })
    .png()
    .toBuffer();
  const hero = await sharp(sourcePath)
    .resize(1000, 1000, { fit: 'cover' })
    .png()
    .toBuffer();
  const label = SIGN_LABEL[sign];
  const element = SIGN_ELEMENT[sign];
  const overlay = `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#090313" stop-opacity="0.10"/>
      <stop offset="0.52" stop-color="#090313" stop-opacity="0.08"/>
      <stop offset="0.70" stop-color="#090313" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#090313" stop-opacity="0.92"/>
    </linearGradient>
    <filter id="soft"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.35"/></filter>
  </defs>
  <rect width="1080" height="1350" fill="url(#shade)"/>
  <rect x="42" y="42" width="996" height="1266" rx="34" fill="none" stroke="#e0bd68" stroke-opacity="0.72" stroke-width="2.5"/>
  <rect x="74" y="756" width="932" height="448" rx="34" fill="#10091f" fill-opacity="0.78" stroke="#e0bd68" stroke-opacity="0.72" stroke-width="2.2" filter="url(#soft)"/>
  <text x="88" y="112" font-family="Georgia, serif" font-size="30" font-weight="900" letter-spacing="4" fill="#f5d978">GOLDMOODASTRO</text>
  <text x="88" y="150" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="4" fill="#e8ddff">${esc(dateLabel)} • GÜNLÜK YORUM</text>
  <text x="540" y="840" text-anchor="middle" font-family="Georgia, serif" font-size="96" font-weight="900" fill="#fff8ee">${esc(label)}</text>
  <text x="540" y="908" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#f5d978">${esc(element)} enerjisi</text>
  <text x="540" y="985" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#fffaf0">${tspans(bodyLines, 540, 46)}</text>
  <rect x="230" y="1128" width="620" height="62" rx="22" fill="#07040c" fill-opacity=".55" stroke="#e0bd68" stroke-opacity=".70"/>
  <text x="540" y="1168" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#f5d978">Yükselenini de oku • Kaydet</text>
  <text x="540" y="1264" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#d9bd74">goldmoodastro.com</text>
</svg>`;

  await sharp(base)
    .composite([
      { input: hero, left: 40, top: 36 },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(filePath);

  return { filePath, publicUrl };
}

// JENERİK günlük kapak — TEK burç değil, 12 burç tekerleği + ay + "GÜNLÜK BURÇ
// YORUMLARI". Dışarıdan "bugün X burcunu paylaşmış" algısını kırar; her gün aynı
// marka kapağı (tarih değişir), tüm burçlara hitap eder. Günde tek dosya (iki
// carousel de aynı kapağı kullanır).
export async function renderDailyCoverCard(dateStr: string): Promise<{ filePath: string; publicUrl: string }> {
  const dateLabel = prettyDate(dateStr);
  const weekday = new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('tr-TR', { weekday: 'long', timeZone: 'UTC' });
  const dir = path.join(uploadsDir(), 'social', 'daily-horoscope-all', dateStr);
  fs.mkdirSync(dir, { recursive: true });

  const fileName = `${dateStr}-cover.png`;
  const filePath = path.join(dir, fileName);
  const publicUrl = `${PUBLIC_BASE}/uploads/social/daily-horoscope-all/${dateStr}/${fileName}`;
  if (fs.existsSync(filePath)) return { filePath, publicUrl };

  const W = 1080, H = 1350;
  // Zodyak tekerleği geometrisi
  const cx = 540, cy = 610, R = 372, SIZE = 150;

  // Arka plan: gece gökyüzü + yıldızlar + çerçeve (sabit yıldız koordinatları).
  const stars = [
    [120, 200, 3], [980, 260, 2], [180, 980, 2.5], [900, 1040, 3], [520, 120, 2],
    [300, 520, 2], [780, 560, 2.5], [160, 700, 2], [940, 720, 2], [420, 1180, 2.5],
    [660, 1160, 2], [240, 340, 2], [860, 380, 2], [540, 1230, 2.5], [1000, 900, 2],
  ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5e6a8" opacity="0.7"/>`).join('');

  const bgSvg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sky" cx="50%" cy="42%" r="75%">
      <stop offset="0" stop-color="#241143"/>
      <stop offset="0.55" stop-color="#160a2c"/>
      <stop offset="1" stop-color="#0a0418"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="36" fill="none" stroke="#e0bd68" stroke-opacity="0.85" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e0bd68" stroke-opacity="0.30" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="188" fill="#0d0620" fill-opacity="0.55" stroke="#e0bd68" stroke-opacity="0.5" stroke-width="2"/>
</svg>`;

  // 12 burcu daire şeklinde diz (üstten başla, saat yönü).
  const symbolInputs: Array<{ input: Buffer; left: number; top: number }> = [];
  for (let i = 0; i < SIGN_ORDER.length; i += 1) {
    const sign = SIGN_ORDER[i]!;
    const zp = path.resolve(uploadsDir(), 'zodiac', `${sign}.png`);
    const fb = path.resolve(process.cwd(), 'uploads', 'zodiac', `${sign}.png`);
    const src = fs.existsSync(zp) ? zp : fb;
    if (!fs.existsSync(src)) continue;
    const theta = (-90 + i * 30) * (Math.PI / 180);
    const left = Math.round(cx + R * Math.cos(theta) - SIZE / 2);
    const top = Math.round(cy + R * Math.sin(theta) - SIZE / 2);
    const circ = await sharp(src)
      .resize(SIZE, SIZE, { fit: 'cover' })
      .composite([
        { input: Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/></svg>`), blend: 'dest-in' },
        { input: Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2 - 2}" fill="none" stroke="#e0bd68" stroke-width="3"/></svg>`), blend: 'over' },
      ])
      .png()
      .toBuffer();
    symbolInputs.push({ input: circ, left, top });
  }

  // Üst yazı + orta ay + alt tarih/CTA overlay.
  const overlay = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="moon"><rect width="120" height="120" fill="black"/><circle cx="52" cy="60" r="42" fill="white"/><circle cx="72" cy="54" r="38" fill="black"/></mask>
  </defs>
  <text x="${cx}" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="900" letter-spacing="7" fill="#f5d978">GOLDMOODASTRO</text>
  <text x="${cx}" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="6" fill="#c9b9ef">ASTROLOJİ · TAROT · NUMEROLOJİ</text>
  <g transform="translate(${cx - 60}, ${cy - 150})"><rect width="120" height="120" fill="#f5d978" mask="url(#moon)"/></g>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="900" fill="#fff8ee">GÜNLÜK</text>
  <text x="${cx}" y="${cy + 66}" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="900" fill="#fff8ee">BURÇ YORUMLARI</text>
  <text x="${cx}" y="${cy + 116}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3" fill="#f5d978">12 BURÇ · HER GÜN</text>
  <rect x="240" y="1112" width="600" height="150" rx="30" fill="#0d0620" fill-opacity="0.72" stroke="#e0bd68" stroke-opacity="0.7" stroke-width="2"/>
  <text x="${cx}" y="1170" text-anchor="middle" font-family="Georgia, serif" font-size="40" font-weight="900" fill="#fffaf0">${esc(dateLabel)}</text>
  <text x="${cx}" y="1212" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="2" fill="#c9b9ef">${esc(weekday)} · burcunu bul, kaydır →</text>
  <text x="${cx}" y="1250" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#d9bd74">goldmoodastro.com</text>
</svg>`;

  await sharp(Buffer.from(bgSvg))
    .composite([...symbolInputs, { input: Buffer.from(overlay), left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(filePath);

  return { filePath, publicUrl };
}

function targetPublishTime(dateStr: string, part: 1 | 2): Date {
  const date = new Date(`${dateStr}T${String(TARGET_HOUR_UTC).padStart(2, '0')}:00:00.000Z`);
  if (part === 2) date.setUTCMinutes(date.getUTCMinutes() + PART_GAP_MINUTES);
  return date;
}

function sourceRef(dateStr: string, part: 1 | 2): string {
  return `daily-horoscope-carousel-${dateStr}-part${part}`;
}

async function cancelLegacySingleSignPosts(): Promise<number> {
  const result = await socialDb
    .update(socialPosts)
    .set({
      status: 'cancelled',
      notes: sql`CONCAT(COALESCE(${socialPosts.notes}, ''), '\n[auto] Eski tek-burç günlük cron iptal edildi; tüm burç carousel cron aktif.')`,
    } as any)
    .where(
      and(
        eq(socialPosts.subType, TENANT),
        sql`${socialPosts.sourceRef} REGEXP '^daily-horoscope-[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
        sql`${socialPosts.status} IN ('draft','scheduled')`,
      ),
    );
  return Number((result as { rowsAffected?: number }).rowsAffected ?? 0);
}

async function buildPart(dateStr: string, part: 1 | 2): Promise<{
  title: string;
  caption: string;
  mediaUrls: string[];
  imageUrl: string;
  scheduledAt: Date;
  sourceRef: string;
  missing: number;
}> {
  const partConfig = PARTS.find((item) => item.part === part)!;
  const dateLabel = prettyDate(dateStr);
  const mediaUrls: string[] = [];
  const captionLines: string[] = [];
  let missing = 0;
  const planned = AUGUST_2026_DAILY_PLAN[dateStr];

  // İlk slide: JENERİK günlük kapak (12 burç tekerleği + ay). Tek burç değil —
  // "bugün X burcu" algısını kırar, her gün tüm burçlara hitap eder. İki carousel
  // de aynı kapağı kullanır (günde tek dosya).
  const cover = await renderDailyCoverCard(dateStr);
  mediaUrls.push(cover.publicUrl);

  for (const sign of partConfig.signs) {
    const horoscope = await getDailyHoroscope(sign, dateStr);
    if (!horoscope?.content) missing += 1;
    const message = socialCardMessage(sign, horoscope?.content ?? '', dateStr);
    const { publicUrl } = await renderZodiacCard(sign, dateStr, message);
    mediaUrls.push(publicUrl);
    captionLines.push(`${SIGN_LABEL[sign]}: ${message}`);
  }

  const title = `[CAROUSEL] ${dateLabel} Günlük Burç Yorumları ${part}/2`;
  const planIntro = planned ? `\n\nBugünün teması: ${planned.theme}\nOdak: ${planned.focus}` : '';
  const caption = `${dateLabel} günlük burç yorumları ${part}/2. 🌙${planIntro}\n\nBu bölüm: ${partConfig.label}.\n\nGüneş burcunu oku ama yükselenini de mutlaka kontrol et; günlük akış çoğu zaman yükselende daha net görünür.\n\n${captionLines.join('\n\n')}\n\nYükselenini yorumlara yaz, kaydet ve gün sonunda tekrar bak.\n\n${HASHTAGS}`;

  return {
    title,
    caption,
    mediaUrls,
    imageUrl: mediaUrls[0]!,
    scheduledAt: targetPublishTime(dateStr, part),
    sourceRef: sourceRef(dateStr, part),
    missing,
  };
}

async function ensurePartScheduled(dateStr: string, part: 1 | 2, opts: { dryRun?: boolean } = {}): Promise<{ status: string; detail?: string; missing: number }> {
  const dryRun = opts.dryRun ?? (process.env.SOCIAL_DAILY_HOROSCOPE_DRYRUN === '1');
  const ref = sourceRef(dateStr, part);
  const existing = await socialDb
    .select({ id: socialPosts.id, status: socialPosts.status })
    .from(socialPosts)
    .where(and(eq(socialPosts.subType, TENANT), eq(socialPosts.sourceRef, ref)))
    .limit(1);
  if (existing.length && !dryRun) {
    return { status: 'skipped', detail: `zaten var (#${existing[0]!.id}, ${existing[0]!.status})`, missing: 0 };
  }

  const built = await buildPart(dateStr, part);
  if (dryRun) {
    console.log(`[social-horoscope] DRYRUN ${ref} | media=${built.mediaUrls.length} | first=${built.imageUrl}`);
    return { status: 'dryrun', detail: built.imageUrl, missing: built.missing };
  }

  if (built.scheduledAt.getTime() <= Date.now()) {
    console.log(`[social-horoscope] ${built.sourceRef} atlandi — yayin saati gecmis (${built.scheduledAt.toISOString()})`);
    return { status: 'skipped-past', detail: `${built.sourceRef} yayin saati gecmis`, missing: built.missing };
  }

  await socialDb.insert(socialPosts).values({
    uuid: randomUUID(),
    postType: 'etkilesim',
    subType: TENANT,
    title: built.title,
    caption: built.caption,
    hashtags: HASHTAGS,
    imageUrl: built.imageUrl,
    mediaUrls: built.mediaUrls,
    platform: 'both',
    status: 'scheduled',
    scheduledAt: built.scheduledAt,
    sourceType: 'ai',
    sourceRef: built.sourceRef,
    aiGenerated: 1,
    createdBy: 'cron',
    notes: `Otomatik günlük tüm burç carousel ${part}/2. Medya: ${built.mediaUrls.length}. Eksik DB yorumu: ${built.missing}.`,
  } as any);

  console.log(`[social-horoscope] ${built.sourceRef} planlandi -> ${built.scheduledAt.toISOString()}`);
  return { status: 'scheduled', detail: `${built.sourceRef} @ ${built.scheduledAt.toISOString()}`, missing: built.missing };
}

/** Bir gün için iki carousel'i planlar. Eski tek-burç cron'u üretmez. */
export async function ensureDailyHoroscopePostScheduled(
  dateStr = isoDate(),
  opts: { dryRun?: boolean } = {},
): Promise<{ status: string; detail?: string }> {
  await cancelLegacySingleSignPosts();
  const p1 = await ensurePartScheduled(dateStr, 1, opts);
  const p2 = await ensurePartScheduled(dateStr, 2, opts);
  const statuses = [p1.status, p2.status];
  const missing = p1.missing + p2.missing;
  if (statuses.every((s) => s === 'skipped')) return { status: 'skipped', detail: `2 parça zaten var; missing=${missing}` };
  if (statuses.some((s) => s === 'scheduled')) return { status: 'scheduled', detail: `parts=${statuses.join(',')}; missing=${missing}` };
  if (statuses.some((s) => s === 'dryrun')) return { status: 'dryrun', detail: `parts=${statuses.join(',')}; missing=${missing}` };
  return { status: statuses.join(','), detail: `missing=${missing}` };
}

/** Geriye uyumlu manuel/test çalıştırma: artık yayınlamaz; iki carousel'i planlar. */
export async function runDailyHoroscopePost(
  dateStr = isoDate(),
  opts: { dryRun?: boolean } = {},
): Promise<{ status: string; detail?: string }> {
  return ensureDailyHoroscopePostScheduled(dateStr, opts);
}

export async function ensureDailyHoroscopePlan(daysAhead = 7): Promise<{ scheduled: number; skipped: number; missing: number; cancelledLegacy: number }> {
  let scheduled = 0;
  let skipped = 0;
  let missing = 0;
  const cancelledLegacy = await cancelLegacySingleSignPosts();
  const base = new Date();

  // Gün içinde cron geç çalışırsa bugünün sabah paylaşımını geçmiş saate
  // yazıp kuyrukta anında yayınlatmayalım; ertesi günden devam edelim.
  const todayStr = isoDate(base);
  const startOffset = targetPublishTime(todayStr, 2).getTime() <= Date.now() ? 1 : 0;

  for (let i = startOffset; i <= daysAhead + startOffset; i += 1) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i));
    const dateStr = isoDate(d);
    const res = await ensureDailyHoroscopePostScheduled(dateStr);
    if (res.status === 'scheduled') scheduled += 1;
    else if (res.status === 'skipped') skipped += 1;
    else missing += 1;
  }
  return { scheduled, skipped, missing, cancelledLegacy };
}

export function registerSocialHoroscopeCron(_app?: unknown) {
  if (process.env.SOCIAL_DAILY_HOROSCOPE_ENABLED !== '1') {
    console.log('[social-horoscope] devre disi (SOCIAL_DAILY_HOROSCOPE_ENABLED != 1)');
    return;
  }
  let lastBucket = '';
  const tick = async () => {
    const now = new Date();
    const bucket = `${isoDate(now)}-${now.getUTCHours()}`;
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    try {
      const res = await ensureDailyHoroscopePlan(7);
      console.log('[social-horoscope] tum-burclar plan kontrol:', JSON.stringify(res));
    } catch (e) {
      console.error('[social-horoscope] hata:', (e as Error).message);
    }
  };
  setInterval(tick, HOUR_MS);
  void tick();
  console.log(`[social-horoscope] aktif — tum burclar 2 carousel/gun, yayin ${TARGET_HOUR_UTC}:00 ve +${PART_GAP_MINUTES}dk UTC (09:00 TR)`);
}
