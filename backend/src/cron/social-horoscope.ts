// backend/src/cron/social-horoscope.ts
// FAZ 3 — Günlük burç sosyal medya otomasyonu.
// Her sabah 09:00 TR (06:00 UTC): o günün öne çıkan burcunu (gün sırasına göre
// 12 burç dönüşümlü) daily_horoscopes'tan alır, altın/cream bir kart görseli
// render eder (sharp), uploads'a kaydeder ve Facebook + Instagram'a paylaşır.
//
// - setInterval ile saatte bir kontrol (node-cron yok; mevcut cron deseniyle aynı).
// - Idempotent: aynı gün ikinci kez paylaşmaz (source_ref = daily-horoscope-<tarih>).
// - Env kapisi: SOCIAL_DAILY_HOROSCOPE_ENABLED=1 (kapaliysa hic calismaz).
// - SOCIAL_DAILY_HOROSCOPE_DRYRUN=1: paylasmadan sadece gorsel+caption uretir (test).

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { env } from '@/core/env';
import { getDailyHoroscope } from '@/modules/horoscopes/repository';
import { ALL_SIGNS, type SignKey } from '@/modules/horoscopes/schema';
import { db as socialDb } from '@/social/db/client';
import { platformAccounts, socialPosts } from '@/social/db/schema';
import { publishPhotoPost as fbPublishPhoto } from '@/social/modules/platforms/facebook';
import { publishPhotoPost as igPublishPhoto } from '@/social/modules/platforms/instagram';

const TENANT = 'goldmoodastro';
const TARGET_HOUR_UTC = 6; // 09:00 TR
const HOUR_MS = 60 * 60 * 1000;
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || 'https://goldmoodastro.com').replace(/\/$/, '');
const HASHTAGS = '#goldmoodastro #astroloji #burc #astrolojiyorumlari #günlükburç #danismanlik';

const SIGN_LABEL: Record<SignKey, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};
const SIGN_SYMBOL: Record<SignKey, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

function isoDate(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function dayOfYear(d = new Date()): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
}
function cleanContent(raw: string): string {
  return raw
    .replace(/^#{1,6}\s.*$/gm, '')   // markdown basliklari (ör. "# 25 Temmuz ... Yorumu")
    .replace(/\*\*/g, '')            // kalin
    .replace(/[*_`>]/g, '')          // artik md isaretleri
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur && lines.length < maxLines) lines.push(cur.trim());
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (last.length > maxChars - 1) lines[maxLines - 1] = last.slice(0, maxChars - 1).trim() + '…';
  }
  return lines;
}

function uploadsDir(): string {
  return env.LOCAL_STORAGE_ROOT ? path.resolve(env.LOCAL_STORAGE_ROOT) : path.resolve(process.cwd(), 'uploads');
}

/** Burç kartını 1080x1080 JPEG render eder, uploads/social altina kaydeder. */
async function renderCard(sign: SignKey, dateStr: string, content: string): Promise<{ filePath: string; publicUrl: string }> {
  const label = SIGN_LABEL[sign];
  const symbol = SIGN_SYMBOL[sign];
  const prettyDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const lines = wrap(content, 42, 6);
  const bodyTspans = lines
    .map((ln, i) => `<tspan x="540" dy="${i === 0 ? 0 : 58}">${esc(ln)}</tspan>`)
    .join('');

  const svg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1512"/><stop offset="0.55" stop-color="#241d16"/><stop offset="1" stop-color="#3a2f22"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0" stop-color="#b8964f" stop-opacity="0.28"/><stop offset="1" stop-color="#b8964f" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <rect width="1080" height="1080" fill="url(#glow)"/>
  <rect x="40" y="40" width="1000" height="1000" rx="28" fill="none" stroke="#b8964f" stroke-opacity="0.55" stroke-width="2"/>
  <text x="540" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="8" fill="#d4bb7a">GOLDMOODASTRO</text>
  <text x="540" y="188" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="6" fill="#9c8f79">GÜNÜN BURÇ YORUMU</text>
  <text x="540" y="360" text-anchor="middle" font-family="serif" font-size="150" fill="#d4bb7a">${symbol}</text>
  <text x="540" y="450" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="#faf6ef">${esc(label)}</text>
  <text x="540" y="500" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="#b8964f">${esc(prettyDate)}</text>
  <line x1="380" y1="540" x2="700" y2="540" stroke="#b8964f" stroke-opacity="0.5" stroke-width="1.5"/>
  <text x="540" y="620" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#efe7d8" style="line-height:1.5">${bodyTspans}</text>
  <text x="540" y="1000" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="2" fill="#d4bb7a">goldmoodastro.com</text>
</svg>`;

  const dir = path.join(uploadsDir(), 'social');
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `horoscope-${dateStr}-${sign}.jpg`;
  const filePath = path.join(dir, fileName);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(filePath);
  return { filePath, publicUrl: `${PUBLIC_BASE}/uploads/social/${fileName}` };
}

async function getAccounts() {
  const rows = await socialDb.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, TENANT));
  return {
    fb: rows.find((r) => r.platform === 'facebook') || null,
    ig: rows.find((r) => r.platform === 'instagram') || null,
  };
}

/** Bir gunun burc gonderisini uretir ve (dryRun degilse) paylasir. */
export async function runDailyHoroscopePost(
  dateStr = isoDate(),
  opts: { dryRun?: boolean } = {},
): Promise<{ status: string; detail?: string }> {
  const dryRun = opts.dryRun ?? (process.env.SOCIAL_DAILY_HOROSCOPE_DRYRUN === '1');
  const sourceRef = `daily-horoscope-${dateStr}`;

  // Idempotency
  const existing = await socialDb
    .select({ id: socialPosts.id })
    .from(socialPosts)
    .where(and(eq(socialPosts.subType, TENANT), eq(socialPosts.sourceRef, sourceRef)))
    .limit(1);
  if (existing.length && !dryRun) return { status: 'skipped', detail: 'bugun zaten paylasildi' };

  const sign = ALL_SIGNS[dayOfYear(new Date(dateStr + 'T00:00:00Z')) % ALL_SIGNS.length];
  const h = await getDailyHoroscope(sign, dateStr);
  const content = cleanContent(h?.content || '');
  if (!content) return { status: 'no-content', detail: `${sign} icin ${dateStr} yorumu yok (uretim beklenir)` };

  const { publicUrl } = await renderCard(sign, dateStr, content);
  const captionBody = content.length > 600 ? content.slice(0, 597).trim() + '…' : content;
  const caption = `${SIGN_SYMBOL[sign]} ${SIGN_LABEL[sign]} — Günün Yorumu\n\n${captionBody}\n\nTüm burçlar 👉 goldmoodastro.com\n\n${HASHTAGS}`;

  if (dryRun) {
    console.log(`[social-horoscope] DRYRUN ${dateStr} ${sign} | image=${publicUrl}`);
    console.log(`[social-horoscope] caption:\n${caption.slice(0, 200)}...`);
    return { status: 'dryrun', detail: publicUrl };
  }

  const { fb, ig } = await getAccounts();
  let fbId: string | null = null;
  let igId: string | null = null;
  const errors: string[] = [];

  if (fb) {
    try {
      const r = await fbPublishPhoto(publicUrl, caption, { pageId: fb.pageId || undefined, pageAccessToken: fb.pageToken || fb.accessToken || undefined });
      fbId = (r as any)?.id || (r as any)?.postId || null;
    } catch (e) { errors.push('FB: ' + (e as Error).message); }
  }
  if (ig) {
    try {
      const r = await igPublishPhoto(publicUrl, caption, { accountId: ig.accountId || undefined, accessToken: ig.accessToken || ig.pageToken || undefined });
      igId = (r as any)?.id || (r as any)?.mediaId || null;
    } catch (e) { errors.push('IG: ' + (e as Error).message); }
  }

  const posted = Boolean(fbId || igId);
  await socialDb.insert(socialPosts).values({
    uuid: randomUUID(),
    postType: 'etkilesim',
    subType: TENANT,
    caption,
    hashtags: HASHTAGS,
    imageUrl: publicUrl,
    platform: 'both',
    status: posted ? 'posted' : 'failed',
    postedAt: posted ? new Date() : null,
    errorMessage: errors.length ? errors.join(' | ').slice(0, 990) : null,
    fbPostId: fbId,
    igMediaId: igId,
    sourceType: 'ai',
    sourceRef,
    aiGenerated: 1,
    createdBy: 'cron',
  } as any);

  console.log(`[social-horoscope] ${dateStr} ${sign} -> FB:${fbId ? 'OK' : 'x'} IG:${igId ? 'OK' : 'x'} ${errors.join('; ')}`);
  return { status: posted ? 'posted' : 'failed', detail: errors.join('; ') || `${sign}` };
}

export function registerSocialHoroscopeCron(_app?: unknown) {
  if (process.env.SOCIAL_DAILY_HOROSCOPE_ENABLED !== '1') {
    console.log('[social-horoscope] devre disi (SOCIAL_DAILY_HOROSCOPE_ENABLED != 1)');
    return;
  }
  let lastBucket = '';
  const tick = async () => {
    const now = new Date();
    if (now.getUTCHours() !== TARGET_HOUR_UTC) return;
    const bucket = isoDate(now);
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    try {
      const res = await runDailyHoroscopePost(bucket);
      console.log('[social-horoscope] gunluk calisma:', JSON.stringify(res));
    } catch (e) {
      console.error('[social-horoscope] hata:', (e as Error).message);
    }
  };
  setInterval(tick, HOUR_MS);
  void tick();
  console.log(`[social-horoscope] aktif — her gun ${TARGET_HOUR_UTC}:00 UTC (09:00 TR)`);
}
