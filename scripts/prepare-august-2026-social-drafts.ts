#!/usr/bin/env bun

/**
 * GoldMoodAstro — 1–7 Agustos 2026 sosyal medya üretim paketi.
 *
 * Varsayılan: görselleri + içerik manifestini üretir.
 * DB taslak yazmak için: bun run scripts/prepare-august-2026-social-drafts.ts --db
 *
 * Not: Taslaklar `status=draft` yazılır; yanlışlıkla otomatik yayınlanmaz.
 */

import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import mysql from "mysql2/promise";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const WRITE_DB = process.argv.includes("--db");
const OUT_DIR = path.resolve(process.cwd(), "backend/uploads/social/august-2026-v2");
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || "https://goldmoodastro.com").replace(/\/$/, "");
const PUBLIC_DIR = `${PUBLIC_BASE}/uploads/social/august-2026-v2`;
const TENANT = "goldmoodastro";
const HASHTAGS = "#goldmoodastro #astroloji #burc #günlükburç #tarot #numeroloji #ruyatabiri #spirituelsemboller";

type Sign = {
  key: string;
  label: string;
  symbol: string;
  element: "Ateş" | "Toprak" | "Hava" | "Su";
};

type DraftPost = {
  sourceRef: string;
  title: string;
  postType: "etkilesim" | "tanitim" | "kampanya";
  caption: string;
  platform: "both";
  imageUrl?: string;
  mediaUrls?: string[];
  notes: string;
};

const signs: Sign[] = [
  { key: "aries", label: "Koç", symbol: "♈", element: "Ateş" },
  { key: "taurus", label: "Boğa", symbol: "♉", element: "Toprak" },
  { key: "gemini", label: "İkizler", symbol: "♊", element: "Hava" },
  { key: "cancer", label: "Yengeç", symbol: "♋", element: "Su" },
  { key: "leo", label: "Aslan", symbol: "♌", element: "Ateş" },
  { key: "virgo", label: "Başak", symbol: "♍", element: "Toprak" },
  { key: "libra", label: "Terazi", symbol: "♎", element: "Hava" },
  { key: "scorpio", label: "Akrep", symbol: "♏", element: "Su" },
  { key: "sagittarius", label: "Yay", symbol: "♐", element: "Ateş" },
  { key: "capricorn", label: "Oğlak", symbol: "♑", element: "Toprak" },
  { key: "aquarius", label: "Kova", symbol: "♒", element: "Hava" },
  { key: "pisces", label: "Balık", symbol: "♓", element: "Su" },
];

const days = [
  { day: 1, dow: "Cumartesi", theme: "Ağustos ayına içini toparlayarak başla.", focus: "Ayın ana niyetini netleştir." },
  { day: 2, dow: "Pazar", theme: "Haftaya girerken iç sesin daha görünür.", focus: "Yükselenin hangi kapıyı açıyor?" },
  { day: 3, dow: "Pazartesi", theme: "Haftanın ilk adımı sade ama güçlü olsun.", focus: "Planı küçült, devamlılığı büyüt." },
  { day: 4, dow: "Salı", theme: "Sezgi ve karar enerjisi birlikte çalışıyor.", focus: "İlk tepki yerine içindeki mesajı dinle." },
  { day: 5, dow: "Çarşamba", theme: "Sayılar, ritimler ve tekrarlar yol gösteriyor.", focus: "Bugün aynı döngüye farklı cevap ver." },
  { day: 6, dow: "Perşembe", theme: "Son dördün: bırakma ve hafifleme zamanı.", focus: "Seni yoran yükü isimlendir." },
  { day: 7, dow: "Cuma", theme: "Haftayı hafiflet: mizah da farkındalıktır.", focus: "Kendini fazla ciddiye aldığın yeri gör." },
] as const;

const signDailyAngles: Record<string, string[]> = {
  aries: ["cesaret", "ilk adım", "netlik", "beden enerjisi", "aceleyi yumuşatma", "bırakma", "mizah"],
  taurus: ["güven", "para düzeni", "ritim", "beden", "sadeleşme", "konfor alanı", "keyif"],
  gemini: ["iletişim", "haber", "zihin", "merak", "karar", "düşünce temizliği", "espri"],
  cancer: ["aile", "iç güven", "ev", "duygu", "hatıra", "geçmişi bırakma", "yakınlık"],
  leo: ["görünürlük", "yaratıcılık", "kalp", "özgüven", "sahne", "gururu bırakma", "eğlence"],
  virgo: ["düzen", "sağlık", "iş", "detay", "verim", "fazla kontrolü bırakma", "pratiklik"],
  libra: ["ilişki", "denge", "seçim", "estetik", "uzlaşma", "onay ihtiyacını bırakma", "kararsızlık"],
  scorpio: ["derinlik", "sezgi", "dönüşüm", "güven", "sır", "yük bırakma", "kara mizah"],
  sagittarius: ["ufuk", "öğrenme", "yol", "inanç", "özgürlük", "abartıyı bırakma", "neşe"],
  capricorn: ["hedef", "sorumluluk", "kariyer", "plan", "sabır", "ağır yükü bırakma", "disiplin"],
  aquarius: ["fikir", "arkadaşlık", "gelecek", "özgünlük", "sistem", "mesafeyi bırakma", "tuhaflık"],
  pisces: ["sezgi", "rüya", "şefkat", "akış", "yaratıcılık", "dağınıklığı bırakma", "tatlı kaçış"],
};

function prettyDate(day: number) {
  return `${day} Ağustos 2026`;
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && lines[maxLines - 1]!.length > maxChars) {
    lines[maxLines - 1] = `${lines[maxLines - 1]!.slice(0, maxChars - 1).trim()}…`;
  }
  return lines;
}

function tspans(lines: string[], x: number, dy: number) {
  return lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${esc(line)}</tspan>`).join("");
}

function dailyMessage(sign: Sign, dayIndex: number) {
  const day = days[dayIndex]!;
  const angle = signDailyAngles[sign.key]![dayIndex]!;
  const elementAdvice = {
    Ateş: "Küçük ama cesur bir adım yeter.",
    Toprak: "Planı somutlaştır, bedenini ihmal etme.",
    Hava: "Net cümleler seni karmaşadan korur.",
    Su: "Duygunu dinle; iç sesin ayrıntıda konuşur.",
  }[sign.element];
  return `${sign.label} için bugün ${angle} alanı öne çıkıyor. ${elementAdvice}`;
}

function cardSvg(opts: {
  width: number;
  height: number;
  kicker: string;
  title: string;
  subtitle?: string;
  body?: string;
  symbol?: string;
  footer?: string;
  variant?: "dark" | "gold" | "cream" | "purple";
}) {
  const w = opts.width;
  const h = opts.height;
  const variant = opts.variant ?? "dark";
  const bg = {
    dark: ["#0d0920", "#1b1233", "#39205d"],
    gold: ["#151009", "#2c2111", "#5a4218"],
    cream: ["#fffaf0", "#f5ead7", "#ead3a6"],
    purple: ["#160d2b", "#2b1850", "#6d3dc1"],
  }[variant];
  const text = variant === "cream" ? "#160d2b" : "#fffaf2";
  const muted = variant === "cream" ? "#6b5b79" : "#d8cde9";
  const gold = "#f2d27d";
  const border = variant === "cream" ? "#c59b3d" : "#d7b35f";
  const bodyLines = wrap(opts.body ?? "", w > 1080 ? 42 : 36, h > 1500 ? 7 : 5);
  const titleLines = wrap(opts.title, w > 1080 ? 20 : 18, 3);
  const titleSize = h > 1500 ? 78 : 64;
  const bodySize = h > 1500 ? 40 : 30;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/><stop offset="0.58" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[2]}"/>
    </linearGradient>
    <radialGradient id="moon" cx="76%" cy="16%" r="42%">
      <stop offset="0" stop-color="#f7dc84" stop-opacity="0.52"/><stop offset="1" stop-color="#f7dc84" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000" flood-opacity="0.25"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#moon)"/>
  <circle cx="${w * 0.82}" cy="${h * 0.15}" r="${w * 0.19}" fill="none" stroke="${border}" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="${w * 0.18}" cy="${h * 0.84}" r="${w * 0.22}" fill="none" stroke="#8059d8" stroke-opacity="0.22" stroke-width="2"/>
  <rect x="54" y="54" width="${w - 108}" height="${h - 108}" rx="36" fill="none" stroke="${border}" stroke-opacity="0.58" stroke-width="2.5"/>
  <text x="86" y="118" font-family="Georgia, serif" font-size="28" font-weight="800" letter-spacing="3" fill="${gold}">GOLDMOODASTRO</text>
  <text x="86" y="154" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${muted}">${esc(opts.kicker)}</text>
  ${opts.symbol ? `<text x="${w / 2}" y="${h * 0.34}" text-anchor="middle" font-family="Georgia, serif" font-size="${h > 1500 ? 190 : 160}" fill="${gold}" filter="url(#shadow)">${esc(opts.symbol)}</text>` : ""}
  <text x="${w / 2}" y="${opts.symbol ? h * 0.47 : h * 0.30}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" font-weight="900" fill="${text}">${tspans(titleLines, w / 2, titleSize * 0.96)}</text>
  ${opts.subtitle ? `<text x="${w / 2}" y="${opts.symbol ? h * 0.58 : h * 0.45}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${h > 1500 ? 30 : 26}" font-weight="700" fill="${gold}">${esc(opts.subtitle)}</text>` : ""}
  <text x="${w / 2}" y="${opts.symbol ? h * 0.66 : h * 0.55}" text-anchor="middle" font-family="Georgia, serif" font-size="${bodySize}" fill="${text}" opacity="0.94">${tspans(bodyLines, w / 2, bodySize * 1.30)}</text>
  <rect x="${w * 0.17}" y="${h - 190}" width="${w * 0.66}" height="76" rx="26" fill="rgba(0,0,0,.32)" stroke="${border}" stroke-opacity=".70"/>
  <text x="${w / 2}" y="${h - 142}" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="${gold}">${esc(opts.footer ?? "Kaydet • Paylaş • Yükselenini oku")}</text>
  <text x="${w / 2}" y="${h - 70}" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${variant === "cream" ? "#8d6c22" : "#d8bf7a"}">goldmoodastro.com</text>
</svg>`;
}

async function renderPng(fileName: string, svg: string) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, fileName);
  if (existsSync(filePath)) {
    return `${PUBLIC_DIR}/${fileName}`;
  }
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(filePath);
  return `${PUBLIC_DIR}/${fileName}`;
}

async function renderZodiacDailyPng(fileName: string, sign: Sign, date: string, body: string) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, fileName);
  if (existsSync(filePath)) {
    return `${PUBLIC_DIR}/${fileName}`;
  }
  const zodiacPath = path.resolve(process.cwd(), "backend/uploads/zodiac", `${sign.key}.png`);
  const bodyLines = wrap(body, 42, 4);
  const titleLines = wrap(sign.label, 16, 1);
  const base = await sharp(zodiacPath)
    .resize(1080, 1350, { fit: "cover" })
    .blur(10)
    .modulate({ brightness: 0.55, saturation: 1.18 })
    .png()
    .toBuffer();
  const hero = await sharp(zodiacPath)
    .resize(1000, 1000, { fit: "cover" })
    .png()
    .toBuffer();
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
  <text x="88" y="150" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="4" fill="#e8ddff">${esc(date)} • GÜNLÜK YORUM</text>
  <text x="540" y="840" text-anchor="middle" font-family="Georgia, serif" font-size="96" font-weight="900" fill="#fff8ee">${tspans(titleLines, 540, 90)}</text>
  <text x="540" y="908" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#f5d978">${esc(sign.element)} enerjisi</text>
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
  return `${PUBLIC_DIR}/${fileName}`;
}

async function renderMp4FromPng(pngPath: string, mp4Name: string) {
  const outPath = path.join(OUT_DIR, mp4Name);
  if (existsSync(outPath)) {
    return `${PUBLIC_DIR}/${mp4Name}`;
  }
  const result = spawnSync("ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", pngPath,
    "-t", "8",
    "-vf", "scale=1080:1920,zoompan=z='min(zoom+0.0008,1.06)':d=200:s=1080x1920:fps=25,format=yuv420p",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outPath,
  ], { stdio: "pipe" });
  if (result.status !== 0) {
    const detail = result.stderr ? result.stderr.toString() : "ffmpeg bulunamadı veya çalıştırılamadı";
    throw new Error(`ffmpeg failed: ${detail}`);
  }
  return `${PUBLIC_DIR}/${mp4Name}`;
}

async function createDailyCarousel(dayIndex: number): Promise<DraftPost[]> {
  const day = days[dayIndex]!;
  const date = prettyDate(day.day);
  const dayCode = String(day.day).padStart(2, "0");
  const signUrls: string[] = [];
  for (const [index, sign] of signs.entries()) {
    signUrls.push(await renderZodiacDailyPng(
      `2026-08-${dayCode}-daily-${String(index + 1).padStart(2, "0")}-${sign.key}.png`,
      sign,
      date,
      dailyMessage(sign, dayIndex),
    ));
  }
  const mediaUrls1 = signUrls.slice(0, 6);
  const mediaUrls2 = signUrls.slice(6, 12);

  const baseCaption = `${date} günlük burç yorumları hazır. 🌙\n\nBugünün ana enerjisi: ${day.theme}\n\nGüneş burcunu oku ama yükselenini de mutlaka kontrol et; günlük akış çoğu zaman yükselende daha net görünür.\n\nYükselenini yorumlara yaz, gün sonunda hangi cümlenin sende çalıştığını tekrar kontrol et.\n\n🔗 Daha kişisel yorum ve danışmanlık için: goldmoodastro.com\n\n${HASHTAGS}`;

  return [{
    sourceRef: `august-2026:${dayCode}:daily-carousel-1`,
    title: `[CAROUSEL] ${date} Günlük Burç Yorumları 1/2`,
    postType: "etkilesim",
    caption: `${baseCaption}\n\nBu bölüm: Koç, Boğa, İkizler, Yengeç, Aslan, Başak.`,
    platform: "both",
    imageUrl: mediaUrls1[0],
    mediaUrls: mediaUrls1,
    notes: "Ağustos 2026 üretim planı. Günlük burç carousel 1/2. Sadece mevcut zodyak görselleri kullanıldı; kapak/CTA yok.",
  }, {
    sourceRef: `august-2026:${dayCode}:daily-carousel-2`,
    title: `[CAROUSEL] ${date} Günlük Burç Yorumları 2/2`,
    postType: "etkilesim",
    caption: `${baseCaption}\n\nBu bölüm: Terazi, Akrep, Yay, Oğlak, Kova, Balık.`,
    platform: "both",
    imageUrl: mediaUrls2[0],
    mediaUrls: mediaUrls2,
    notes: "Ağustos 2026 üretim planı. Günlük burç carousel 2/2. Sadece mevcut zodyak görselleri kullanıldı; kapak/CTA yok.",
  }];
}

async function createCarouselPost(input: {
  day: number;
  sourceSlug: string;
  title: string;
  caption: string;
  slides: Array<{ title: string; subtitle?: string; body: string; symbol?: string; variant?: "dark" | "gold" | "cream" | "purple"; footer?: string }>;
  postType?: "etkilesim" | "tanitim" | "kampanya";
}) {
  const mediaUrls: string[] = [];
  for (const [index, slide] of input.slides.entries()) {
    mediaUrls.push(await renderPng(`2026-08-${String(input.day).padStart(2, "0")}-${input.sourceSlug}-${String(index + 1).padStart(2, "0")}.png`, cardSvg({
      width: 1080,
      height: 1350,
      kicker: "GOLDMOODASTRO",
      title: slide.title,
      subtitle: slide.subtitle,
      body: slide.body,
      symbol: slide.symbol,
      footer: slide.footer,
      variant: slide.variant,
    })));
  }
  return {
    sourceRef: `august-2026:${String(input.day).padStart(2, "0")}:${input.sourceSlug}`,
    title: `[CAROUSEL] ${input.title}`,
    postType: input.postType ?? "etkilesim",
    caption: `${input.caption}\n\n${HASHTAGS}`,
    platform: "both" as const,
    imageUrl: mediaUrls[0],
    mediaUrls,
    notes: "Ağustos 2026 üretim planı — ek ana içerik.",
  };
}

async function createReelPost(input: {
  day: number;
  sourceSlug: string;
  title: string;
  caption: string;
  coverTitle: string;
  coverSubtitle: string;
  coverBody: string;
  symbol?: string;
}) {
  const coverName = `2026-08-${String(input.day).padStart(2, "0")}-${input.sourceSlug}-cover.png`;
  const coverUrl = await renderPng(coverName, cardSvg({
    width: 1080,
    height: 1920,
    kicker: "REELS • GOLDMOODASTRO",
    title: input.coverTitle,
    subtitle: input.coverSubtitle,
    body: input.coverBody,
    symbol: input.symbol ?? "✦",
    footer: "Yorumlara yaz • Kaydet",
    variant: "purple",
  }));
  const videoUrl = await renderMp4FromPng(path.join(OUT_DIR, coverName), `2026-08-${String(input.day).padStart(2, "0")}-${input.sourceSlug}.mp4`);
  return {
    sourceRef: `august-2026:${String(input.day).padStart(2, "0")}:reel:${input.sourceSlug}`,
    title: `[REEL] ${input.title}`,
    postType: "etkilesim" as const,
    caption: `${input.caption}\n\n${HASHTAGS}`,
    platform: "both" as const,
    imageUrl: coverUrl,
    mediaUrls: [videoUrl],
    notes: "Ağustos 2026 üretim planı — kısa MP4 reel taslağı. Yayın öncesi ses/trend eklenebilir.",
  };
}

async function buildPosts() {
  const posts: DraftPost[] = [];
  for (let i = 0; i < 7; i += 1) {
    posts.push(...await createDailyCarousel(i));
  }

  return posts;
}

async function writeManifest(posts: DraftPost[]) {
  const manifestDir = path.resolve(process.cwd(), "references/monthly-content/2026-08");
  await fs.mkdir(manifestDir, { recursive: true });
  const markdown = `# GoldMoodAstro — 1–7 Ağustos 2026 Üretim Paketi

Üretim tarihi: ${new Date().toISOString()}

Görseller: \`backend/uploads/social/august-2026-v2/\`

## Taslaklar

${posts.map((post) => `### ${post.title}

- sourceRef: \`${post.sourceRef}\`
- postType: \`${post.postType}\`
- platform: \`${post.platform}\`
- medya: ${post.mediaUrls?.length ?? (post.imageUrl ? 1 : 0)}
- ilk görsel/video: ${post.imageUrl ?? post.mediaUrls?.[0] ?? "-"}
- not: ${post.notes}

Caption:

\`\`\`text
${post.caption}
\`\`\`
`).join("\n")}
`;
  await Bun.write(path.join(manifestDir, "01-07-drafts.md"), markdown);
  await Bun.write(path.join(manifestDir, "01-07-drafts.json"), JSON.stringify(posts, null, 2));
}

async function dbConnection() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "goldmoodastro";
  return mysql.createConnection({ host, port, user, password, database, charset: "utf8mb4" });
}

async function upsertDrafts(posts: DraftPost[]) {
  const conn = await dbConnection();
  try {
    await conn.execute(
      "DELETE FROM social_posts WHERE sub_type = ? AND status = 'draft' AND source_ref REGEXP '^august-2026:[0-9]{2}:daily-carousel$'",
      [TENANT],
    );
    await conn.execute(
      "DELETE FROM social_posts WHERE sub_type = ? AND status = 'draft' AND source_ref IN (?, ?, ?, ?, ?, ?, ?)",
      [
        TENANT,
        "august-2026:01:monthly-energy",
        "august-2026:02:rising-open-doors",
        "august-2026:03:reel:weekly-energy",
        "august-2026:04:tarot-pick-4",
        "august-2026:05:numerology-life-path",
        "august-2026:06:last-quarter-release",
        "august-2026:07:reel:libra-decision-humor",
      ],
    );
    for (const post of posts) {
      const [existing] = await conn.execute(
        "SELECT id FROM social_posts WHERE sub_type = ? AND source_ref = ? LIMIT 1",
        [TENANT, post.sourceRef],
      ) as any;
      const payload = {
        post_type: post.postType,
        sub_type: TENANT,
        title: post.title,
        caption: post.caption,
        hashtags: HASHTAGS,
        image_url: post.imageUrl ?? null,
        media_urls: post.mediaUrls ? JSON.stringify(post.mediaUrls) : null,
        platform: post.platform,
        status: "draft",
        source_type: "manual",
        source_ref: post.sourceRef,
        ai_generated: 0,
        created_by: "codex-august-plan",
        notes: post.notes,
      };
      if (Array.isArray(existing) && existing[0]?.id) {
        await conn.execute(
          `UPDATE social_posts
           SET post_type=?, title=?, caption=?, hashtags=?, image_url=?, media_urls=?, platform=?, status='draft',
               source_type='manual', created_by='codex-august-plan', notes=?, updated_at=NOW(3)
           WHERE id=?`,
          [payload.post_type, payload.title, payload.caption, payload.hashtags, payload.image_url, payload.media_urls, payload.platform, payload.notes, existing[0].id],
        );
        console.log(`updated draft #${existing[0].id}: ${post.sourceRef}`);
      } else {
        await conn.execute(
          `INSERT INTO social_posts
           (uuid, post_type, sub_type, title, caption, hashtags, image_url, media_urls, platform, status, source_type, source_ref, ai_generated, created_by, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, 'draft', 'manual', ?, 0, 'codex-august-plan', ?, NOW(3), NOW(3))`,
          [randomUUID(), payload.post_type, payload.sub_type, payload.title, payload.caption, payload.hashtags, payload.image_url, payload.media_urls, payload.platform, payload.source_ref, payload.notes],
        );
        console.log(`inserted draft: ${post.sourceRef}`);
      }
    }
  } finally {
    await conn.end();
  }
}

async function main() {
  if (!existsSync(path.resolve(process.cwd(), "backend"))) {
    throw new Error("Bu script repo kökünden çalıştırılmalı.");
  }
  await fs.mkdir(OUT_DIR, { recursive: true });
  const posts = await buildPosts();
  await writeManifest(posts);
  if (WRITE_DB) {
    await upsertDrafts(posts);
  }
  console.log(`\nHazır: ${posts.length} taslak içerik`);
  console.log(`Görseller/video: ${OUT_DIR}`);
  console.log("Manifest: references/monthly-content/2026-08/01-07-drafts.md");
  console.log(WRITE_DB ? "DB: taslaklar yazıldı/güncellendi." : "DB: yazılmadı. Yazmak için --db kullan.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
