#!/usr/bin/env bun

/**
 * GoldMoodAstro — 1–7 Ağustos 2026 burç dışı ek içerik paketi.
 *
 * Kullanım:
 *   bun run scripts/prepare-august-2026-week1-extra-drafts.ts
 *   bun run scripts/prepare-august-2026-week1-extra-drafts.ts --db
 *
 * Bu script günlük burç cron'una dokunmaz. Sadece ek içerikleri `draft` olarak yazar.
 * Görsel üretimi AI değildir; mevcut GoldMoodAstro asset'leri (zodyak, tarot, sembol,
 * feature görselleri) üzerine premium mor/altın tipografi bindirir.
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
const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, "backend/uploads/social/august-2026-week1-extra-v3");
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || "https://goldmoodastro.com").replace(/\/$/, "");
const PUBLIC_DIR = `${PUBLIC_BASE}/uploads/social/august-2026-week1-extra-v3`;
const TENANT = "goldmoodastro";
const HASHTAGS = "#goldmoodastro #astroloji #tarot #numeroloji #spirituelsemboller #ruhsaldanismanlik";
const SITE_URL = "https://goldmoodastro.com";

export type PostType = "etkilesim" | "tanitim" | "kampanya";
export type DraftPost = {
  sourceRef: string;
  title: string;
  postType: PostType;
  caption: string;
  platform: "both" | "instagram" | "facebook";
  imageUrl?: string;
  mediaUrls?: string[];
  notes: string;
};

export type Slide = {
  title: string;
  kicker?: string;
  subtitle?: string;
  body?: string;
  footer?: string;
  asset?: string;
  layout?: "four-tarot";
  variant?: "deep" | "gold" | "cream" | "violet";
  accent?: string;
};

export const assets = {
  daily: path.resolve(ROOT, "backend/uploads/features/daily_reading.png"),
  natal: path.resolve(ROOT, "backend/uploads/features/natal_chart.png"),
  synastry: path.resolve(ROOT, "backend/uploads/features/synastry_chart.png"),
  tarotBack: path.resolve(ROOT, "backend/uploads/tarot_back.png"),
  // Açılmış tarot yüz kartları — element eşlemesi (Ateş=Değnek, Su=Kupa, Toprak=Tılsım, Hava=Kılıç)
  tarotFire: path.resolve(ROOT, "backend/uploads/tarot/ace-of-wands.png"),
  tarotWater: path.resolve(ROOT, "backend/uploads/tarot/ace-of-cups.png"),
  tarotEarth: path.resolve(ROOT, "backend/uploads/tarot/ace-of-pentacles.png"),
  tarotAir: path.resolve(ROOT, "backend/uploads/tarot/ace-of-swords.png"),
  libra: path.resolve(ROOT, "backend/uploads/zodiac/libra.png"),
  moon: path.resolve(ROOT, "backend/uploads/symbols/dream/moon.png"),
  door: path.resolve(ROOT, "backend/uploads/symbols/dream/door.png"),
  sun: path.resolve(ROOT, "backend/uploads/symbols/dream/sun.png"),
  key: path.resolve(ROOT, "backend/uploads/symbols/coffee/key.png"),
  candle: path.resolve(ROOT, "backend/uploads/symbols/coffee/candle.png"),
  eye: path.resolve(ROOT, "backend/uploads/symbols/coffee/eye.png"),
  heart: path.resolve(ROOT, "backend/uploads/symbols/coffee/heart.png"),
  road: path.resolve(ROOT, "backend/uploads/symbols/coffee/road.png"),
  numerology: (n: number) => path.resolve(ROOT, `backend/uploads/symbols/numerology/${n}.png`),
};

function mustExist(file: string) {
  if (!existsSync(file)) throw new Error(`Asset bulunamadı: ${file}`);
  return file;
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
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

function tspans(lines: string[], x: number, dy: number) {
  return lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${esc(line)}</tspan>`).join("");
}

function palette(variant: Slide["variant"] = "deep") {
  if (variant === "cream") {
    // Sıcak altın ama KOYU tema (diğer slaytlarla tutarlı, açık metin → okunur).
    // Eski açık-tema koyu metni koyu asset üstünde okunmuyordu (kontrast bug'ı).
    return {
      bg1: "#140d09",
      bg2: "#2b2013",
      bg3: "#6d5322",
      text: "#fff7e8",
      muted: "#e8d9bb",
      panel: "rgba(14,9,4,.78)",
      panel2: "rgba(240,214,140,.12)",
      gold: "#f0cf80",
      line: "#d8b660",
    };
  }
  if (variant === "gold") {
    return {
      bg1: "#130d17",
      bg2: "#2a1f15",
      bg3: "#70521e",
      text: "#fff8ea",
      muted: "#e3d4b8",
      panel: "rgba(12,7,18,.76)",
      panel2: "rgba(255,224,139,.11)",
      gold: "#f3d276",
      line: "#d5ad55",
    };
  }
  if (variant === "violet") {
    return {
      bg1: "#0b0616",
      bg2: "#25113f",
      bg3: "#743ed2",
      text: "#fff8ef",
      muted: "#ded1ff",
      panel: "rgba(12,5,26,.78)",
      panel2: "rgba(157,98,255,.16)",
      gold: "#f5d978",
      line: "#c7a6ff",
    };
  }
  return {
    bg1: "#090512",
    bg2: "#171027",
    bg3: "#3b2362",
    text: "#fff8ee",
    muted: "#d8cbee",
    panel: "rgba(13,7,24,.78)",
    panel2: "rgba(242,210,125,.10)",
    gold: "#f2d27d",
    line: "#d7b35f",
  };
}

function overlaySvg(slide: Slide, width: number, height: number) {
  const p = palette(slide.variant);
  const titleLines = wrap(slide.title, width > 1080 ? 22 : 19, 3);
  const bodyLines = wrap(slide.body ?? "", width >= 1080 && height > 1500 ? 28 : 36, height > 1500 ? 6 : 5);
  const titleSize = height > 1500 ? 70 : 56;
  const bodySize = height > 1500 ? 36 : 30;
  const topY = height > 1500 ? 120 : 96;
  const titleY = height > 1500 ? 905 : 690;
  const bodyY = height > 1500 ? 1160 : 910;
  const panelY = height > 1500 ? 1048 : 820;
  const panelH = height > 1500 ? 470 : 330;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.bg1}"/>
      <stop offset=".58" stop-color="${p.bg2}"/>
      <stop offset="1" stop-color="${p.bg3}"/>
    </linearGradient>
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05020a" stop-opacity=".10"/>
      <stop offset=".55" stop-color="#05020a" stop-opacity=".20"/>
      <stop offset="1" stop-color="#05020a" stop-opacity=".82"/>
    </linearGradient>
    <radialGradient id="orb" cx="76%" cy="13%" r="45%">
      <stop offset="0" stop-color="${slide.accent ?? p.gold}" stop-opacity=".45"/>
      <stop offset="1" stop-color="${slide.accent ?? p.gold}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".36"/></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#orb)"/>
  <rect width="${width}" height="${height}" fill="url(#veil)"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="36" fill="none" stroke="${p.line}" stroke-opacity=".62" stroke-width="2.4"/>
  <text x="82" y="${topY}" font-family="Georgia, serif" font-size="30" font-weight="900" letter-spacing="4" fill="${p.gold}">GOLDMOODASTRO</text>
  <text x="82" y="${topY + 38}" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3.5" fill="${p.muted}">${esc(slide.kicker ?? "AĞUSTOS 2026")}</text>
  <rect x="${width * 0.09}" y="${panelY}" width="${width * 0.82}" height="${panelH}" rx="34" fill="${p.panel}" stroke="${p.line}" stroke-opacity=".58" filter="url(#shadow)"/>
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" font-weight="900" fill="${p.text}">${tspans(titleLines, width / 2, titleSize * 0.95)}</text>
  ${slide.subtitle ? `<text x="${width / 2}" y="${titleY + titleLines.length * titleSize * 0.93 + 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${height > 1500 ? 31 : 27}" font-weight="900" letter-spacing=".5" fill="${p.gold}">${esc(slide.subtitle)}</text>` : ""}
  ${slide.body ? `<text x="${width / 2}" y="${bodyY}" text-anchor="middle" font-family="Georgia, serif" font-size="${bodySize}" fill="${p.text}" opacity=".96">${tspans(bodyLines, width / 2, bodySize * 1.34)}</text>` : ""}
  <rect x="${width * 0.18}" y="${height - 180}" width="${width * 0.64}" height="68" rx="24" fill="${p.panel2}" stroke="${p.line}" stroke-opacity=".72"/>
  <text x="${width / 2}" y="${height - 137}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${p.gold}">${esc(slide.footer ?? "Kaydet • Yorumlara yaz • Paylaş")}</text>
  <text x="${width / 2}" y="${height - 72}" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${p.gold}" opacity=".88">goldmoodastro.com</text>
</svg>`;
}

function artFrameSvg(width: number, height: number, size: number, top: number, slide: Slide) {
  const p = palette(slide.variant);
  const left = Math.round((width - size) / 2);
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="artShadow"><feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#000" flood-opacity=".34"/></filter>
  </defs>
  <rect x="${left - 14}" y="${top - 14}" width="${size + 28}" height="${size + 28}" rx="42" fill="rgba(8,4,15,.34)" stroke="${p.line}" stroke-opacity=".72" stroke-width="2.4" filter="url(#artShadow)"/>
  <rect x="${left + 18}" y="${top + 18}" width="${size - 36}" height="${size - 36}" rx="30" fill="none" stroke="${p.gold}" stroke-opacity=".30" stroke-width="1.8"/>
</svg>`;
}

function tarotCardNumbersSvg(width: number, height: number) {
  const isStory = height > 1500;
  const cards = isStory
    ? [
        { x: 300, y: 205, n: "1", w: 200 },
        { x: 580, y: 205, n: "2", w: 200 },
        { x: 300, y: 505, n: "3", w: 200 },
        { x: 580, y: 505, n: "4", w: 200 },
      ]
    : [
        { x: 315, y: 145, n: "1", w: 190 },
        { x: 575, y: 145, n: "2", w: 190 },
        { x: 315, y: 365, n: "3", w: 190 },
        { x: 575, y: 365, n: "4", w: 190 },
      ];
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="numShadow"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter>
  </defs>
  ${cards.map((card) => `
    <circle cx="${card.x + card.w / 2}" cy="${card.y + Math.round(card.w * 0.65)}" r="${isStory ? 38 : 36}" fill="rgba(10,4,18,.72)" stroke="#f2d27d" stroke-opacity=".75" stroke-width="2" filter="url(#numShadow)"/>
    <text x="${card.x + card.w / 2}" y="${card.y + Math.round(card.w * 0.65) + 15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isStory ? 44 : 42}" font-weight="900" fill="#fff7e8">${card.n}</text>
  `).join("")}
  </svg>`;
}

async function roundedArtBuffer(asset: string, size: number) {
  const art = await sharp(asset)
    .resize(size, size, { fit: "cover" })
    .modulate({ brightness: 1.04, saturation: 1.12 })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="34" fill="#fff"/></svg>`);
  return sharp(art).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function tarotCardBuffer(size: number) {
  const card = await sharp(assets.tarotBack)
    .resize(size, Math.round(size * 1.30), { fit: "cover" })
    .modulate({ brightness: 1.08, saturation: 1.10 })
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${size}" height="${Math.round(size * 1.30)}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${Math.round(size * 1.30)}" rx="24" fill="#fff"/></svg>`);
  return sharp(card).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function renderSlide(fileName: string, slide: Slide, size: "post" | "story" = "post") {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const width = 1080;
  const height = size === "story" ? 1920 : 1350;
  const filePath = path.join(OUT_DIR, fileName);
  // FORCE_REGEN=1 → var olan (ör. eski/eksik metinli) görseli de YENİDEN üret. Yoksa cache: atla.
  if (!process.env.FORCE_REGEN && existsSync(filePath)) return `${PUBLIC_DIR}/${fileName}`;

  let base: Buffer;
  if (slide.asset) {
    base = await sharp(mustExist(slide.asset))
      .resize(width, height, { fit: "cover" })
      .blur(8)
      .modulate({ brightness: 0.58, saturation: 1.15 })
      .png()
      .toBuffer();
  } else {
    base = await sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#10091f"/></svg>`))
      .png()
      .toBuffer();
  }

  const composites: sharp.OverlayOptions[] = [];
  if (slide.layout === "four-tarot") {
    const isStory = size === "story";
    const cardW = isStory ? 200 : 190;
    const card = await tarotCardBuffer(cardW);
    const frame = isStory
      ? { x: 258, y: 178, w: 564, h: 660 }
      : { x: 285, y: 122, w: 510, h: 520 };
    const positions = isStory
      ? [
          { left: 300, top: 205 },
          { left: 580, top: 205 },
          { left: 300, top: 505 },
          { left: 580, top: 505 },
        ]
      : [
          { left: 315, top: 145 },
          { left: 575, top: 145 },
          { left: 315, top: 365 },
          { left: 575, top: 365 },
        ];
    const shadowFrame = Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#000" flood-opacity=".42"/></filter></defs>
      <rect x="${frame.x}" y="${frame.y}" width="${frame.w}" height="${frame.h}" rx="38" fill="rgba(8,4,15,.30)" stroke="#d7b35f" stroke-opacity=".38" filter="url(#shadow)"/>
    </svg>`);
    composites.push({ input: shadowFrame, left: 0, top: 0 });
    for (const pos of positions) {
      composites.push({ input: card, left: pos.left, top: pos.top });
    }
    composites.push({ input: Buffer.from(tarotCardNumbersSvg(width, height)), left: 0, top: 0 });
  } else if (slide.asset) {
    const artSize = size === "story" ? 590 : 360;
    const top = size === "story" ? 220 : 178;
    const art = await roundedArtBuffer(slide.asset, artSize);
    composites.push({ input: Buffer.from(artFrameSvg(width, height, artSize, top, slide)), left: 0, top: 0 });
    composites.push({ input: art, left: Math.round((width - artSize) / 2), top });
  }
  composites.push({ input: Buffer.from(overlaySvg(slide, width, height)), left: 0, top: 0 });

  await sharp(base).composite(composites).png({ compressionLevel: 9 }).toFile(filePath);
  return `${PUBLIC_DIR}/${fileName}`;
}

async function renderReel(fileName: string, coverUrl: string) {
  const coverPath = path.join(OUT_DIR, path.basename(new URL(coverUrl).pathname));
  const outPath = path.join(OUT_DIR, fileName);
  if (existsSync(outPath)) return `${PUBLIC_DIR}/${fileName}`;
  const result = spawnSync("ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", coverPath,
    "-t", "8",
    "-vf", "scale=1080:1920,zoompan=z='min(zoom+0.0009,1.065)':d=200:s=1080x1920:fps=25,format=yuv420p",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outPath,
  ], { stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed: ${result.stderr?.toString() || "bilinmeyen hata"}`);
  }
  return `${PUBLIC_DIR}/${fileName}`;
}

function caption(title: string, body: string, cta: string, tags = HASHTAGS) {
  return `${title}\n\n${body}\n\n${cta}\n\n🔗 Daha fazla içerik ve danışmanlık seçenekleri için: ${SITE_URL}\n\n${tags}`;
}

export async function carousel(day: number, slug: string, title: string, slides: Slide[], captionText: string, postType: PostType = "etkilesim"): Promise<DraftPost> {
  const code = String(day).padStart(2, "0");
  const mediaUrls: string[] = [];
  for (const [index, slide] of slides.entries()) {
    mediaUrls.push(await renderSlide(`2026-08-${code}-${slug}-${String(index + 1).padStart(2, "0")}.png`, slide, "post"));
  }
  return {
    sourceRef: `august-2026-extra:${code}:${slug}`,
    title: `[CAROUSEL] ${title}`,
    postType,
    caption: captionText,
    platform: "both",
    imageUrl: mediaUrls[0],
    mediaUrls,
    notes: "Ağustos 2026 week-1 ek içerik taslağı. Mevcut GoldMoodAstro asset'leriyle üretildi; yayın öncesi manuel onay önerilir.",
  };
}

export async function reel(day: number, slug: string, title: string, cover: Slide, captionText: string): Promise<DraftPost> {
  const code = String(day).padStart(2, "0");
  const coverUrl = await renderSlide(`2026-08-${code}-${slug}-cover.png`, cover, "story");
  const videoUrl = await renderReel(`2026-08-${code}-${slug}.mp4`, coverUrl);
  return {
    sourceRef: `august-2026-extra:${code}:reel:${slug}`,
    title: `[REEL] ${title}`,
    postType: "etkilesim",
    caption: captionText,
    platform: "both",
    imageUrl: coverUrl,
    mediaUrls: [videoUrl],
    notes: "Reel taslağı: MP4 hazır. Yayınlamadan önce Instagram içinde trend ses eklenebilir.",
  };
}

export async function story(day: number, slug: string, title: string, slide: Slide): Promise<DraftPost> {
  const code = String(day).padStart(2, "0");
  const imageUrl = await renderSlide(`2026-08-${code}-story-${slug}.png`, slide, "story");
  return {
    sourceRef: `august-2026-extra:${code}:story:${slug}`,
    title: `[STORY] ${title}`,
    postType: "etkilesim",
    caption: slide.footer ?? title,
    platform: "instagram",
    imageUrl,
    mediaUrls: [imageUrl],
    notes: "Instagram Story taslağı. Story'de caption görünmeyebilir; ana metin görselin içindedir.",
  };
}

async function buildPosts(): Promise<DraftPost[]> {
  const posts: DraftPost[] = [];

  posts.push(await carousel(1, "monthly-energy", "Ağustos’ta Seni Bekleyen Ana Tema", [
    { title: "Ağustos’ta seni bekleyen ana tema", subtitle: "Ayın enerjisini seç", body: "İçinden geçen ilk kapı bu ayın ipucunu verebilir.", asset: assets.moon, variant: "deep", footer: "Kaydır • İlk hissettiğini yorumla" },
    { title: "1. Kapı", subtitle: "Cesaret", body: "Ertelediğin bir adımı küçült. Büyük karar değil; devamlılığı başlatan küçük hamle önemli.", asset: assets.door, variant: "gold" },
    { title: "2. Kapı", subtitle: "Denge", body: "Aile, iş ve iç huzur arasında yeniden ayar yapman gerekebilir. Her şeye aynı anda yetişmek zorunda değilsin.", asset: assets.moon, variant: "deep" },
    { title: "3. Kapı", subtitle: "Bereket", body: "Para, emek ve zaman yönetiminde sadeleşme bereketi açar. Önce dağınıklığı toparla.", asset: assets.key, variant: "cream" },
    { title: "4. Kapı", subtitle: "İç ses", body: "Bu ay sezgisel işaretler daha güçlü. Tekrar eden rüya, sembol ya da cümleleri not et.", asset: assets.eye, variant: "violet" },
  ], caption(
    "Ağustos’ta seni bekleyen ana tema ✨",
    "Bir kapı seç ve ay boyunca hangi temanın sende çalıştığını gözlemle: cesaret, denge, bereket veya iç ses.",
    "Yorumlara seçtiğin kapıyı yaz: 1, 2, 3 veya 4."
  )));

  posts.push(await carousel(2, "rising-open-doors", "Bu Ay Kapısı Açılan Yükselenler", [
    { title: "Bu ay kapısı açılan yükselenler", subtitle: "Ağustos 2026", body: "Bu bir garanti değil; hangi alanda fırsat kapısının aralanabileceğini gösteren kolektif bir okuma.", asset: assets.sun, variant: "deep" },
    { title: "Koç & Aslan", subtitle: "Görünürlük", body: "Kendini saklamadığın yerde yeni bir yol açılabilir. Cesaret bu ay sana alan kazandırır.", asset: path.resolve(ROOT, "backend/uploads/zodiac/leo.png"), variant: "gold" },
    { title: "Boğa & Başak", subtitle: "Düzen", body: "İş, para ve günlük ritimde toparlanma fırsatı var. Küçük sistemler büyük rahatlık getirir.", asset: path.resolve(ROOT, "backend/uploads/zodiac/taurus.png"), variant: "cream" },
    { title: "Yengeç & Terazi", subtitle: "İlişki", body: "Duygusal güven ve denge arayışı görünür. Net sınırlar ilişkileri hafifletebilir.", asset: path.resolve(ROOT, "backend/uploads/zodiac/libra.png"), variant: "deep" },
    { title: "Akrep & Balık", subtitle: "Sezgi", body: "İç sesin daha yüksek konuşabilir. Rüyalar, semboller ve hisler bir şeyi fark ettirebilir.", asset: path.resolve(ROOT, "backend/uploads/zodiac/pisces.png"), variant: "violet" },
    { title: "Yay & Oğlak", subtitle: "Hedef", body: "Uzak planlar ve sorumluluklar netleşir. Artık neye enerji vereceğini daha iyi seçebilirsin.", asset: path.resolve(ROOT, "backend/uploads/zodiac/capricorn.png"), variant: "gold" },
  ], caption(
    "Ağustos’ta hangi kapı açılıyor? 🚪✨",
    "Yükselen burcuna göre bu ay hangi tema görünür olabilir: görünürlük, düzen, ilişki, sezgi veya hedef.",
    "Yükselenini yorumlara yaz; ay sonunda tekrar bakmak için kaydet."
  )));

  posts.push(await reel(3, "weekly-energy", "Haftanın Enerjisi", {
    title: "Bu hafta evren senden ne istiyor?",
    kicker: "REELS • HAFTANIN ENERJİSİ",
    subtitle: "3–9 Ağustos",
    body: "Daha az dağıl. Daha net seç. İç sesinle planını aynı masaya oturt.",
    asset: assets.sun,
    variant: "violet",
    footer: "Kaydet • Hafta sonunda tekrar bak",
  }, caption(
    "3–9 Ağustos haftasının enerjisi 🌙",
    "Bu hafta tarot, numeroloji, semboller ve bırakma temaları açılıyor. Enerji net: dağılmadan seç, seçtiğini küçük bir adımla destekle.",
    "Bu hafta en çok hangi alanda netleşmeye ihtiyacın var?"
  )));

  posts.push(await carousel(4, "tarot-pick-4", "Tarot: 4 Kart Seç", [
    { title: "Evren şu an sana bir şey anlatmaya çalışıyor", body: "Bir kart seç: 1, 2, 3 ya da 4. İlk çekildiğin kartın açıklamasını kaydır.", asset: assets.tarotBack, layout: "four-tarot", variant: "violet", footer: "Kart numaranı yorumlara yaz" },
    { title: "1. Kart", subtitle: "Ateş", body: "Beklettiğin karar hareket istiyor. Mükemmel anı beklemek yerine küçük bir başlangıç yap.", asset: assets.tarotFire, variant: "gold" },
    { title: "2. Kart", subtitle: "Su", body: "Kalbin bir şeyi çoktan biliyor. Bugün cevabı zorlamadan, hissettiğini isimlendir.", asset: assets.tarotWater, variant: "deep" },
    { title: "3. Kart", subtitle: "Toprak", body: "Dağınık alanı toparladığında içindeki yük hafifler. Önce düzen, sonra karar.", asset: assets.tarotEarth, variant: "cream" },
    { title: "4. Kart", subtitle: "Hava", body: "Konuşulmayan bir cümle zihnini yoruyor olabilir. Net ama yumuşak ifade alan açar.", asset: assets.tarotAir, variant: "violet" },
  ], caption(
    "Tarot: 4 kart seç ✨",
    "Aklından bir konu geçir, derin bir nefes al ve ilk çekildiğin kartı seç. Bu genel bir kolektif okumadır; daha derin yorumlar için GoldMoodAstro içeriklerini takip edebilirsin.",
    "Yorumlara kart numaranı bırak: 1, 2, 3 ya da 4."
  )));

  const numerologySlides: Slide[] = [
    { title: "Ağustos 2026 yaşam yolu mesajı", subtitle: "Doğum tarihini topla", body: "Yaşam yolu sayını bul: gün + ay + yıl rakamlarını tek haneye indir. Sonra mesajını kaydır.", asset: assets.road, variant: "deep", footer: "Sayını yorumlara yaz" },
  ];
  const numerologyBodies = [
    "Başlatma cesareti. Bu ay kendini seçtiğin yerde yeni bir kapı açılır.",
    "Denge ve ortaklık. Her şeyi tek başına taşımak zorunda değilsin.",
    "İfade ve görünürlük. İçinden geçen cümleyi saklama.",
    "Düzen ve yapı. Küçük planlar bu ay seni büyük yorgunluktan korur.",
    "Değişim ve hareket. Eski ritmi bırak, yeni deneyime alan aç.",
    "Aile ve sorumluluk. Şefkatli sınır bu ay en büyük destek.",
    "İç ses ve derinleşme. Kalabalıktan biraz çekilmek netlik getirir.",
    "Güç ve bereket. Emeğini küçümseme; karşılığını istemeyi öğren.",
    "Tamamlanma. Eski bir döngüyü kapatıp daha hafif ilerleyebilirsin.",
  ];
  for (let n = 1; n <= 9; n += 1) {
    numerologySlides.push({ title: `Yaşam Yolu ${n}`, subtitle: "Ağustos mesajın", body: numerologyBodies[n - 1]!, asset: assets.numerology(n), variant: n % 3 === 0 ? "violet" : n % 2 === 0 ? "cream" : "gold" });
  }
  posts.push(await carousel(5, "numerology-life-path", "Numeroloji: Ağustos Yaşam Yolu Mesajı", numerologySlides, caption(
    "Ağustos 2026 numeroloji mesajın 🔢✨",
    "Yaşam yolu sayını hesapla ve Ağustos boyunca hangi tema sende çalışabilir oku. Bu içerik farkındalık amaçlıdır.",
    "Doğum tarihini değil, çıkan yaşam yolu sayını yorumlara yaz."
  )));

  posts.push(await carousel(6, "last-quarter-release", "Son Dördün: Bırakman Gereken Yük", [
    { title: "Son dördün enerjisi", subtitle: "6 Ağustos", body: "Ay küçülürken biz de gereksiz yükleri azaltırız. Bugün soru şu: neyi artık taşımayacaksın?", asset: assets.moon, variant: "deep" },
    { title: "1. Kontrol", subtitle: "Her şeyi yönetme ihtiyacı", body: "Bırakman gereken şey bazen bir kişi değil, her sonucu kontrol etme yorgunluğudur.", asset: assets.candle, variant: "gold" },
    { title: "2. Eski hikâye", subtitle: "Kendine anlattığın tekrar", body: "Aynı cümleyi tekrar ediyorsan, bugün ona başka bir cevap verme zamanı.", asset: assets.key, variant: "cream" },
    { title: "3. Duygusal yük", subtitle: "Senin olmayan sorumluluk", body: "Şefkat güzel; ama başkasının yükünü sürekli taşımak senin yolunu ağırlaştırır.", asset: assets.heart, variant: "violet" },
    { title: "Mini ritüel", subtitle: "Yaz ve azalt", body: "Bugün bir kâğıda 'artık taşımıyorum' diye başlayan 3 cümle yaz. Sonra küçük bir düzenleme yap.", asset: assets.candle, variant: "deep" },
  ], caption(
    "6 Ağustos Son Dördün: bırakman gereken yük ne? 🌘",
    "Bu dönem büyük karar baskısı değil; hafifleme ve iç düzen zamanı. Kendine şu soruyu sor: bunu taşımaya gerçekten devam etmeli miyim?",
    "Yorumlara tek kelime yaz: bırakıyorum."
  )));

  posts.push(await reel(7, "libra-decision-humor", "Mizah: Terazi Karar Verirken", {
    title: "Terazi karar verirken...",
    kicker: "REELS • MİZAH",
    subtitle: "Aklım: evet • Kalbim: belki",
    body: "Sepete ekle. Çıkar. Tekrar ekle. Bir de arkadaşına sor.",
    asset: assets.libra,
    variant: "violet",
    footer: "Terazi arkadaşını etiketle",
  }, caption(
    "Terazi karar verirken... 😅",
    "Bazen karar vermek de başlı başına bir spiritüel yolculuk. Özellikle konu ilişki, alışveriş ya da 'hangi mesajı atayım?' ise.",
    "Terazi arkadaşını etiketle; kendini gördüyse sadece gülücük bıraksın."
  )));

  posts.push(await story(1, "word-poll", "İlk gördüğün kelime", { title: "Ağustos için ilk niyetin ne?", kicker: "STORY • ANKET", subtitle: "Aşk • Para • Huzur • Kariyer", body: "İlk çekildiğin kelimeyi seç ve kendine küçük bir niyet yaz.", asset: assets.moon, variant: "deep", footer: "Anket: Aşk / Para / Huzur / Kariyer" }));
  posts.push(await story(2, "rising-question", "Yükselenini yaz", { title: "Yükselen burcun ne?", kicker: "STORY • SORU", subtitle: "Bugünkü mesajını ona göre oku", body: "Güneş burcun kimliğini, yükselenin günlük akışı daha net gösterebilir.", asset: assets.door, variant: "gold", footer: "Soru kutusu: Yükselenini yaz" }));
  posts.push(await story(3, "weekly-save", "Hafta sonu tekrar bak", { title: "Bu haftanın cümlesi", kicker: "STORY • HATIRLATMA", subtitle: "Net seç, küçük başla", body: "Bugün kaydet; hafta sonunda ne değiştiğini tekrar kontrol et.", asset: assets.moon, variant: "violet", footer: "Kaydet • Cuma tekrar bak" }));
  posts.push(await story(4, "tarot-number", "Kart numaranı yaz", { title: "Kartını seçtin mi?", kicker: "STORY • TAROT", body: "İlk çekildiğin kart çoğu zaman zihnin değil sezginin seçtiğidir.", asset: assets.tarotBack, layout: "four-tarot", variant: "deep", footer: "Soru: Kart numaran kaç?" }));
  posts.push(await story(5, "life-path", "Yaşam yolu sayın", { title: "Yaşam yolu sayın kaç?", kicker: "STORY • NUMEROLOJİ", subtitle: "1’den 9’a", body: "Sayını bul ve Ağustos mesajını posttan oku.", asset: assets.numerology(8), variant: "gold", footer: "Soru kutusu: Sayını yaz" }));
  posts.push(await story(6, "release-box", "Neyi bırakıyorsun?", { title: "Bugün neyi bırakıyorsun?", kicker: "STORY • SON DÖRDÜN", subtitle: "Bir kelime yeter", body: "Kontrol, korku, bekleyiş, yorgunluk… Hangisi?", asset: assets.moon, variant: "cream", footer: "Soru kutusu: Bırakıyorum..." }));
  posts.push(await story(7, "tag-libra", "Terazi arkadaşını etiketle", { title: "Karar vermek zor iş", kicker: "STORY • MİZAH", subtitle: "Terazi enerjisi aktif", body: "Bir şeyi seçmeden önce 12 farklı ihtimali tartan arkadaşını etiketle.", asset: assets.libra, variant: "violet", footer: "Etiketle • Gül geç" }));

  return posts;
}

async function writeManifest(posts: DraftPost[]) {
  const manifestDir = path.resolve(ROOT, "references/monthly-content/2026-08");
  await fs.mkdir(manifestDir, { recursive: true });
  const markdown = `# GoldMoodAstro — 1–7 Ağustos 2026 Ek İçerik Paketi

Üretim tarihi: ${new Date().toISOString()}

Görseller/video: \`backend/uploads/social/august-2026-week1-extra/\`

Bu paket günlük burç cron'una ek olarak hazırlanmıştır. Tüm kayıtlar taslakta kalır.

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
  await Bun.write(path.join(manifestDir, "01-07-extra-drafts.md"), markdown);
  await Bun.write(path.join(manifestDir, "01-07-extra-drafts.json"), JSON.stringify(posts, null, 2));
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
      "DELETE FROM social_posts WHERE sub_type = ? AND status = 'draft' AND source_ref REGEXP '^august-2026-extra:0[1-7]:'",
      [TENANT],
    );
    for (const post of posts) {
      await conn.execute(
        `INSERT INTO social_posts
         (uuid, post_type, sub_type, title, caption, hashtags, image_url, media_urls, platform, status, source_type, source_ref, ai_generated, created_by, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, 'draft', 'manual', ?, 0, 'codex-august-week1-extra', ?, NOW(3), NOW(3))`,
        [
          randomUUID(),
          post.postType,
          TENANT,
          post.title,
          post.caption,
          HASHTAGS,
          post.imageUrl ?? null,
          JSON.stringify(post.mediaUrls ?? (post.imageUrl ? [post.imageUrl] : [])),
          post.platform,
          post.sourceRef,
          post.notes,
        ],
      );
      console.log(`inserted draft: ${post.sourceRef}`);
    }
  } finally {
    await conn.end();
  }
}

async function main() {
  if (!existsSync(path.resolve(ROOT, "backend"))) throw new Error("Bu script repo kökünden çalıştırılmalı.");
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const file of Object.values(assets)) {
    if (typeof file === "string") mustExist(file);
  }
  for (let n = 1; n <= 9; n += 1) mustExist(assets.numerology(n));
  const posts = await buildPosts();
  // Manifest (references/*) git-tracked; sadece --db veya --manifest ile yaz ki
  // salt görsel yeniden üretimi prod git tree'sini kirletip deploy'u kırmasın.
  if (WRITE_DB || process.argv.includes("--manifest")) await writeManifest(posts);
  if (WRITE_DB) await upsertDrafts(posts);
  console.log(`\nHazır: ${posts.length} ek taslak`);
  console.log(`Görseller/video: ${OUT_DIR}`);
  console.log("Manifest: references/monthly-content/2026-08/01-07-extra-drafts.md");
  console.log(WRITE_DB ? "DB: taslaklar yazıldı." : "DB: yazılmadı. Yazmak için --db kullan.");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
