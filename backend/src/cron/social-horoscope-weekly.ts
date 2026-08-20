// backend/src/cron/social-horoscope-weekly.ts
// GoldMoodAstro — HAFTALIK burç sosyal medya otomasyonu.
//
// Politika değişikliği (kullanıcı kararı, 2026-08-20):
// - Günlük burç akışı (günde 2 carousel) sayfayı boğuyordu; günlük feed'in 3
//   postundan 2'si burçtu ve sayfa "çöplük" görünümüne kayıyordu.
// - Günlük akış DURDURULDU (SOCIAL_DAILY_HOROSCOPE_ENABLED=0); burç içeriği
//   artık haftada BİR kez, Pazartesi sabahı 2 carousel (12 burç) olarak çıkar.
// - İçerik kaynağı: daily_horoscopes tablosunda period='weekly' satırları
//   (LLM job her Pazartesi 02:00'de üretir — bkz. cron/horoscope-job.ts).
//   İçerik motordan gelir, elle yazılmaz (CLAUDE.md içerik üretim kuralı).
// - Görsel dil günlük akışla aynı (zodyak kartı + 12 burç tekerlek kapağı),
//   yalnız etiketler "HAFTALIK" olur.
// - Günlük akıştan scheduled/draft kalmış carousel'ler bu cron tarafından
//   otomatik iptal edilir (deploy sırası/yerel ortam farkı bırakmamak için).

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { getHoroscopeByPeriod } from '@/modules/horoscopes/repository';
import { getPeriodStartDate, type SignKey } from '@/modules/horoscopes/schema';
import { db as socialDb } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';
import {
  PARTS,
  SIGN_ELEMENT,
  SIGN_LABEL,
  SIGN_ORDER,
  cleanContent,
  esc,
  prettyDate,
  tspans,
  uploadsDir,
  wrap,
} from '@/cron/social-horoscope';

const TENANT = 'goldmoodastro';
const TARGET_HOUR_UTC = 6; // 09:00 TR — Pazartesi
const PART_GAP_MINUTES = 10;
const HOUR_MS = 60 * 60 * 1000;
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
const HASHTAGS = '#goldmoodastro #astroloji #haftalıkburç #burçyorumları #yükselenburç';

const FALLBACK_MARK = '[fallback]';
const REFRESH_MARK = '[llm-refresh]';

// ── Tarih yardımcıları ──────────────────────────────────────

/** Bu haftanın Pazartesi'si — LLM içerik satırlarıyla AYNI hesap (server local). */
function currentWeekStart(): string {
  return getPeriodStartDate('weekly');
}

function weekDate(weekStart: string, dayOffset: number): Date {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d;
}

/** "17–23 Ağustos 2026" / ay-yıl kırılımında "31 Ağustos – 6 Eylül 2026". */
function weekRangeLabel(weekStart: string): string {
  const start = weekDate(weekStart, 0);
  const end = weekDate(weekStart, 6);
  const endLabel = end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${start.getUTCDate()}–${endLabel}`;
  }
  const startLabel = start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${startLabel} – ${endLabel}`;
}

function targetPublishTime(weekStart: string, part: 1 | 2): Date {
  const date = new Date(`${weekStart}T${String(TARGET_HOUR_UTC).padStart(2, '0')}:00:00.000Z`);
  if (part === 2) date.setUTCMinutes(date.getUTCMinutes() + PART_GAP_MINUTES);
  return date;
}

function weeklySourceRef(weekStart: string, part: 1 | 2): string {
  return `weekly-horoscope-carousel-${weekStart}-part${part}`;
}

// ── Metin ───────────────────────────────────────────────────

// LLM içeriği henüz yoksa (Pazartesi 05:00 son-çare planlaması): elemente göre
// dönen havuz — sabit tek cümle değil, haftadan haftaya değişir.
const WEEKLY_GENERIC: Record<'Ateş' | 'Toprak' | 'Hava' | 'Su', string[]> = {
  Ateş: [
    'Bu hafta enerjini tek bir hedefe topla; dağınık cesaret yorar, odaklı cesaret kapı açar.',
    'Hafta boyunca ilk adımı sen at; hız değil yön belirleyici olacak.',
    'Görünür olmak isteyeceğin bir hafta; sahneyi al ama sözünü ölçerek söyle.',
  ],
  Toprak: [
    'Bu hafta düzen kurmanın haftası; küçük ve somut adımlar büyük plandan daha çok ilerletir.',
    'Kaynaklarını gözden geçir; biriktirdiğin emeğin karşılığını isteme zamanı.',
    'Bedenine ve rutinine iyi bak; istikrar bu hafta senin süper gücün.',
  ],
  Hava: [
    'Bu hafta iletişim öne çıkıyor; net cümleler kur, yazışmaları bekletme.',
    'Yeni bir fikir ya da teklif gündeme gelebilir; acele karar yerine soru sor.',
    'Çevrenle temasın artıyor; doğru kişiyle kurulacak tek konuşma haftayı değiştirir.',
  ],
  Su: [
    'Bu hafta sezgin güçlü; iç sesini bastırma, not al ve akışına güven.',
    'Duygusal sınırlarını koru; hayır demek uzaklaşmak değildir.',
    'Yakın ilişkilerde derinleşme haftası; hissettiğini isimlendirerek paylaş.',
  ],
};

function weekSeed(sign: SignKey, weekStart: string): number {
  const weekNumber = Math.floor(Date.parse(`${weekStart}T00:00:00.000Z`) / (7 * 86_400_000));
  return weekNumber * 5 + Math.max(0, SIGN_ORDER.indexOf(sign)) * 3;
}

function weeklyFallbackMessage(sign: SignKey, weekStart: string): string {
  const element = SIGN_ELEMENT[sign];
  const pool = WEEKLY_GENERIC[element];
  return `${SIGN_LABEL[sign]}: ${pool[weekSeed(sign, weekStart) % pool.length]!}`;
}

/** LLM haftalık metnini kart/caption boyutuna indir (ilk 2-3 cümle, ~190 karakter). */
function weeklyCardMessage(sign: SignKey, raw: string, weekStart: string): string {
  const cleaned = cleanContent(raw);
  if (!cleaned) return weeklyFallbackMessage(sign, weekStart);

  const paragraph = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 30) ?? cleaned;
  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  let text = '';
  for (const sentence of sentences) {
    const candidate = text ? `${text} ${sentence}` : sentence;
    if (candidate.length > 190 && text) break;
    text = candidate;
    if (sentences.indexOf(sentence) >= 2) break;
  }
  if (!text) text = paragraph;
  return text.length > 190 ? `${text.slice(0, 187).trim()}…` : text;
}

// ── Görseller ───────────────────────────────────────────────

function weekDir(weekStart: string): string {
  const dir = path.join(uploadsDir(), 'social', 'weekly-horoscope', weekStart);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function weekPublicUrl(weekStart: string, fileName: string): string {
  return `${PUBLIC_BASE}/uploads/social/weekly-horoscope/${weekStart}/${fileName}`;
}

function zodiacSourcePath(sign: SignKey): string {
  const zodiacPath = path.resolve(uploadsDir(), 'zodiac', `${sign}.png`);
  const repoFallbackPath = path.resolve(process.cwd(), 'uploads', 'zodiac', `${sign}.png`);
  const sourcePath = fs.existsSync(zodiacPath) ? zodiacPath : repoFallbackPath;
  if (!fs.existsSync(sourcePath)) throw new Error(`Zodyak görseli bulunamadı: ${sign}`);
  return sourcePath;
}

async function renderWeeklyZodiacCard(
  sign: SignKey,
  weekStart: string,
  message: string,
  force = false,
): Promise<{ filePath: string; publicUrl: string }> {
  const rangeLabel = weekRangeLabel(weekStart);
  const dir = weekDir(weekStart);
  const fileName = `${weekStart}-${sign}.png`;
  const filePath = path.join(dir, fileName);
  const publicUrl = weekPublicUrl(weekStart, fileName);
  // force=true → gerçek LLM yorumu geldiğinde bayat kartı yeniden bas
  if (!force && fs.existsSync(filePath)) return { filePath, publicUrl };

  const sourcePath = zodiacSourcePath(sign);
  const bodyLines = wrap(message, 42, 5);
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
  <rect x="74" y="726" width="932" height="478" rx="34" fill="#10091f" fill-opacity="0.78" stroke="#e0bd68" stroke-opacity="0.72" stroke-width="2.2" filter="url(#soft)"/>
  <text x="88" y="112" font-family="Georgia, serif" font-size="30" font-weight="900" letter-spacing="4" fill="#f5d978">GOLDMOODASTRO</text>
  <text x="88" y="150" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="4" fill="#e8ddff">${esc(rangeLabel)} • HAFTALIK YORUM</text>
  <text x="540" y="808" text-anchor="middle" font-family="Georgia, serif" font-size="92" font-weight="900" fill="#fff8ee">${esc(label)}</text>
  <text x="540" y="872" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#f5d978">${esc(element)} enerjisi</text>
  <text x="540" y="944" text-anchor="middle" font-family="Georgia, serif" font-size="31" fill="#fffaf0">${tspans(bodyLines, 540, 43)}</text>
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

// Haftalık kapak — günlük kapakla aynı marka dili (12 burç tekerleği + ay),
// başlık "HAFTALIK BURÇ YORUMLARI" + hafta aralığı. Haftada tek dosya.
async function renderWeeklyCoverCard(weekStart: string): Promise<{ filePath: string; publicUrl: string }> {
  const rangeLabel = weekRangeLabel(weekStart);
  const dir = weekDir(weekStart);
  const fileName = `${weekStart}-cover.png`;
  const filePath = path.join(dir, fileName);
  const publicUrl = weekPublicUrl(weekStart, fileName);
  if (fs.existsSync(filePath)) return { filePath, publicUrl };

  const W = 1080, H = 1350;
  const cx = 540, cy = 610, R = 372, SIZE = 150;

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

  const symbolInputs: Array<{ input: Buffer; left: number; top: number }> = [];
  for (let i = 0; i < SIGN_ORDER.length; i += 1) {
    const sign = SIGN_ORDER[i]!;
    let src: string;
    try {
      src = zodiacSourcePath(sign);
    } catch {
      continue;
    }
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

  const overlay = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="moon"><rect width="120" height="120" fill="black"/><circle cx="52" cy="60" r="42" fill="white"/><circle cx="72" cy="54" r="38" fill="black"/></mask>
  </defs>
  <text x="${cx}" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="900" letter-spacing="7" fill="#f5d978">GOLDMOODASTRO</text>
  <text x="${cx}" y="168" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" font-weight="800" letter-spacing="6" fill="#c9b9ef">ASTROLOJİ · TAROT · NUMEROLOJİ</text>
  <g transform="translate(${cx - 60}, ${cy - 150})"><rect width="120" height="120" fill="#f5d978" mask="url(#moon)"/></g>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="900" fill="#fff8ee">HAFTALIK</text>
  <text x="${cx}" y="${cy + 66}" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="900" fill="#fff8ee">BURÇ YORUMLARI</text>
  <text x="${cx}" y="${cy + 116}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3" fill="#f5d978">12 BURÇ · HER PAZARTESİ</text>
  <rect x="200" y="1112" width="680" height="150" rx="30" fill="#0d0620" fill-opacity="0.72" stroke="#e0bd68" stroke-opacity="0.7" stroke-width="2"/>
  <text x="${cx}" y="1170" text-anchor="middle" font-family="Georgia, serif" font-size="38" font-weight="900" fill="#fffaf0">${esc(rangeLabel)}</text>
  <text x="${cx}" y="1212" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="2" fill="#c9b9ef">burcunu bul, kaydır →</text>
  <text x="${cx}" y="1250" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#d9bd74">goldmoodastro.com</text>
</svg>`;

  await sharp(Buffer.from(bgSvg))
    .composite([...symbolInputs, { input: Buffer.from(overlay), left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(filePath);

  return { filePath, publicUrl };
}

// ── İçerik hazırlığı ────────────────────────────────────────

async function getWeeklyContent(sign: SignKey, weekStart: string): Promise<string | null> {
  const row = await getHoroscopeByPeriod({ sign, period: 'weekly', date: weekStart, locale: 'tr' });
  return row?.content ?? null;
}

async function allWeeklyReady(weekStart: string): Promise<boolean> {
  for (const sign of SIGN_ORDER) {
    if (!(await getWeeklyContent(sign, weekStart))) return false;
  }
  return true;
}

export async function buildWeeklyPart(
  weekStart: string,
  part: 1 | 2,
  opts: { force?: boolean } = {},
): Promise<{
  title: string;
  caption: string;
  imageUrl: string;
  mediaUrls: string[];
  scheduledAt: Date;
  sourceRef: string;
  missing: number;
}> {
  const partConfig = PARTS.find((item) => item.part === part)!;
  const rangeLabel = weekRangeLabel(weekStart);
  const mediaUrls: string[] = [];
  const captionLines: string[] = [];
  let missing = 0;

  const cover = await renderWeeklyCoverCard(weekStart);
  mediaUrls.push(cover.publicUrl);

  for (const sign of partConfig.signs) {
    const content = await getWeeklyContent(sign, weekStart);
    if (!content) missing += 1;
    const message = content
      ? weeklyCardMessage(sign, content, weekStart)
      : weeklyFallbackMessage(sign, weekStart).replace(`${SIGN_LABEL[sign]}: `, '');
    const { publicUrl } = await renderWeeklyZodiacCard(sign, weekStart, message, opts.force ?? false);
    mediaUrls.push(publicUrl);
    captionLines.push(`${SIGN_LABEL[sign]}: ${message}`);
  }

  const title = `[CAROUSEL] ${rangeLabel} Haftalık Burç Yorumları ${part}/2`;
  const caption = `${rangeLabel} haftalık burç yorumları ${part}/2. 🌙\n\nBu bölüm: ${partConfig.label}.\n\nGüneş burcunu oku ama yükselenini de mutlaka kontrol et; haftalık akış çoğu zaman yükselende daha net görünür.\n\n${captionLines.join('\n\n')}\n\nYükselenini yorumlara yaz, kaydet ve hafta boyunca dön dön bak.\n\n${HASHTAGS}`;

  // Pazartesi 06:00/06:10 UTC; saat geçtiyse (geç deploy / cron gecikmesi)
  // aynı hafta içinde bir sonraki uygun ana kaydır.
  let scheduledAt = targetPublishTime(weekStart, part);
  const minAt = new Date(Date.now() + (part === 1 ? 10 : 20) * 60 * 1000);
  if (scheduledAt < minAt) scheduledAt = minAt;

  return { title, caption, imageUrl: mediaUrls[1] ?? cover.publicUrl, mediaUrls, scheduledAt, sourceRef: weeklySourceRef(weekStart, part), missing };
}

// ── DB işlemleri ────────────────────────────────────────────

/** Günlük burç akışından kalan scheduled/draft carousel'leri iptal et (tek yön geçiş). */
export async function cancelScheduledDailyCarousels(): Promise<number> {
  const result = await socialDb
    .update(socialPosts)
    .set({
      status: 'cancelled',
      notes: sql`CONCAT(COALESCE(${socialPosts.notes}, ''), '\n[auto] Günlük burç akışı durduruldu (2026-08-20 kararı); haftalık akışa geçildi.')`,
    } as any)
    .where(
      and(
        eq(socialPosts.subType, TENANT),
        sql`${socialPosts.sourceRef} LIKE 'daily-horoscope-carousel-%'`,
        sql`${socialPosts.status} IN ('draft','scheduled')`,
      ),
    );
  return Number((result as { rowsAffected?: number }).rowsAffected ?? 0);
}

async function existingWeeklyRows(weekStart: string) {
  const refs = [weeklySourceRef(weekStart, 1), weeklySourceRef(weekStart, 2)];
  return socialDb
    .select({ id: socialPosts.id, sourceRef: socialPosts.sourceRef, status: socialPosts.status, notes: socialPosts.notes })
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.subType, TENANT),
        sql`${socialPosts.sourceRef} IN (${refs[0]}, ${refs[1]})`,
        sql`${socialPosts.status} != 'cancelled'`,
      ),
    );
}

async function insertWeeklyPart(weekStart: string, part: 1 | 2, usedFallback: boolean): Promise<string> {
  const built = await buildWeeklyPart(weekStart, part);
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
    notes: `Otomatik HAFTALIK burç carousel ${part}/2 (${weekStart} haftası). Medya: ${built.mediaUrls.length}. Eksik LLM: ${built.missing}.${usedFallback ? `\n${FALLBACK_MARK} LLM haftalık yorum hazır değildi; jenerik metinle planlandı.` : ''}`,
  } as any);
  console.log(`[social-horoscope-weekly] ${built.sourceRef} planlandi -> ${built.scheduledAt.toISOString()}`);
  return built.sourceRef;
}

/** Fallback ile planlanmış ve hâlâ scheduled olan kartları gerçek LLM yorumuyla yeniden bas. */
async function refreshWeeklyFallbackRows(weekStart: string): Promise<number> {
  const rows = await existingWeeklyRows(weekStart);
  const pending = rows.filter(
    (row) => row.status === 'scheduled' && (row.notes ?? '').includes(FALLBACK_MARK) && !(row.notes ?? '').includes(REFRESH_MARK),
  );
  if (!pending.length) return 0;
  if (!(await allWeeklyReady(weekStart))) return 0;

  let updated = 0;
  for (const row of pending) {
    const part: 1 | 2 = row.sourceRef === weeklySourceRef(weekStart, 2) ? 2 : 1;
    const built = await buildWeeklyPart(weekStart, part, { force: true });
    await socialDb
      .update(socialPosts)
      .set({
        title: built.title,
        caption: built.caption,
        imageUrl: built.imageUrl,
        mediaUrls: built.mediaUrls,
        notes: `${(row.notes ?? '').trim()}\n${REFRESH_MARK} Gerçek haftalık LLM yorumuyla yeniden basıldı.`.trim(),
      } as any)
      .where(eq(socialPosts.id, row.id));
    updated += 1;
  }
  console.log(`[social-horoscope-weekly] ${weekStart} kartlari gercek haftalik yorumla yenilendi (${updated} post)`);
  return updated;
}

// ── Ana akış ────────────────────────────────────────────────

/**
 * Haftalık planlama penceresi: Pazartesi 00:00 → Çarşamba 00:00 (UTC).
 * - Pencere içinde: LLM içerik hazırsa planla; değilse Pazartesi 05:00'e kadar
 *   bekle, sonra jenerik fallback ile planla (slot kaçmasın), içerik gelince tazele.
 * - Pencere dışında (Çarşamba+ deploy vb.): o hafta atlanır, sıradaki Pazartesi'yi bekler.
 */
export async function ensureWeeklyHoroscopePostScheduled(
  opts: { dryRun?: boolean } = {},
): Promise<{ status: string; detail?: string }> {
  const weekStart = currentWeekStart();
  const windowStart = weekDate(weekStart, 0).getTime();
  const windowEnd = weekDate(weekStart, 2).getTime(); // Çarşamba 00:00 UTC
  const now = Date.now();
  if (now < windowStart || now >= windowEnd) {
    return { status: 'skipped', detail: `${weekStart}: planlama penceresi dışında` };
  }

  const rows = await existingWeeklyRows(weekStart);
  const haveParts = new Set(rows.map((row) => row.sourceRef));
  if (haveParts.has(weeklySourceRef(weekStart, 1)) && haveParts.has(weeklySourceRef(weekStart, 2))) {
    const refreshed = await refreshWeeklyFallbackRows(weekStart);
    return { status: 'skipped', detail: `${weekStart}: 2 parça zaten var${refreshed ? `; ${refreshed} kart tazelendi` : ''}` };
  }

  const ready = await allWeeklyReady(weekStart);
  const fallbackDeadline = new Date(`${weekStart}T05:00:00.000Z`).getTime();
  if (!ready && now < fallbackDeadline) {
    return { status: 'waiting', detail: `${weekStart}: LLM haftalık yorum bekleniyor` };
  }
  if (opts.dryRun) {
    return { status: 'dryrun', detail: `${weekStart}: planlanacak (ready=${ready})` };
  }

  const scheduled: string[] = [];
  for (const part of [1, 2] as const) {
    if (haveParts.has(weeklySourceRef(weekStart, part))) continue;
    scheduled.push(await insertWeeklyPart(weekStart, part, !ready));
  }
  return { status: 'scheduled', detail: `${weekStart}: ${scheduled.join(', ')}${ready ? '' : ' (fallback)'}` };
}

export function registerSocialWeeklyHoroscopeCron(_app?: unknown) {
  if (process.env.SOCIAL_WEEKLY_HOROSCOPE_ENABLED !== '1') {
    console.log('[social-horoscope-weekly] devre disi (SOCIAL_WEEKLY_HOROSCOPE_ENABLED != 1)');
    return;
  }
  let lastBucket = '';
  const tick = async () => {
    const now = new Date();
    const bucket = `${now.toISOString().slice(0, 10)}-${now.getUTCHours()}`;
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    try {
      const cancelled = await cancelScheduledDailyCarousels();
      if (cancelled > 0) console.log(`[social-horoscope-weekly] ${cancelled} bekleyen GÜNLÜK carousel iptal edildi`);
    } catch (e) {
      console.error('[social-horoscope-weekly] gunluk iptal hatasi:', (e as Error).message);
    }
    try {
      const res = await ensureWeeklyHoroscopePostScheduled();
      if (res.status !== 'skipped') console.log('[social-horoscope-weekly] plan:', JSON.stringify(res));
    } catch (e) {
      console.error('[social-horoscope-weekly] hata:', (e as Error).message);
    }
  };
  setInterval(tick, HOUR_MS);
  void tick();
  console.log(`[social-horoscope-weekly] aktif — 12 burç, 2 carousel/hafta, Pazartesi ${TARGET_HOUR_UTC}:00 ve +${PART_GAP_MINUTES}dk UTC (09:00 TR)`);
}
