#!/usr/bin/env bun
/**
 * BLOG TANITIM paketi — bir blog yazısını carousel + reel + story olarak duyurur.
 *
 * İlk kullanım: Nilay Gençarslan'ın "Merkür Retrosunda Eski Sevgili Döner mi?"
 * yazısı. 13 Ağustos'ta tek bir tanıtım postu olarak paylaşılmıştı; aynı içerik
 * post/reel/hikaye olarak yeniden planlanıyor (taslak, yayın kullanıcıda).
 *
 * İÇERİK KURALI (CLAUDE.md): astrolojik OLGU motordan gelir, üslup editöryeldir.
 * Bu paket yazının KENDİ argümanını taşıyor ve burç adı geçirmiyor — dolayısıyla
 * lunationDate/symbols gerektiren "hangi burç ne yaşar" iddiasına girmiyor.
 * Kesin sonuç/geri getirme vaadi yok; yazının tezi zaten bunun tersini söylüyor.
 *
 * Kullanım: bun run scripts/prepare-blog-promo-drafts.ts
 */
import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { carousel, reel, story, type DraftPost, type Slide } from "./prepare-august-2026-week1-extra-drafts";
import { findRiskyTopics } from "../packages/shared-backend/modules/_shared/contentModeration";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const ROOT = process.cwd();
const SITE = "https://goldmoodastro.com";
const ARTICLE = `${SITE}/tr/blog/merkur-retrosunda-eski-sevgili-doner-mi`;
const AUTHOR = `${SITE}/tr/danismanlar/nilay-gencarslan`;
const TAGS = "#goldmoodastro #merkürretrosu #astroloji #ilişkiastrolojisi #doğumharitası #retro #ruhsaldanismanlik";

const RETRO = path.resolve(ROOT, "backend/uploads/brand/retrograde.png");
const NILAY = path.resolve(ROOT, "backend/uploads/brand/nilay.png");

function assertSafe(label: string, text: string) {
  const hits = findRiskyTopics(text);
  if (hits.length) throw new Error(`${label}: yasaklı konu (${hits.map((h) => `${h.category}:${h.matched}`).join(", ")})`);
}

const CAPTION = [
  "Eski sevgiliden gelen beklenmedik bir mesaj… Yarım kalan bir konuşmanın yeniden açılması… Peki bunların nedeni gerçekten Merkür retrosu mu? 🌙",
  "",
  "Her Merkür retrosu eski sevgilinin döneceği anlamına gelmez. Bazen geçmişin yeniden gündeme gelmesi; ilişkiye dönmekten çok bir konuyu tamamlamak, yanlış anlaşılmayı düzeltmek veya duygusal bir döngüyü kapatmak içindir.",
  "",
  "Astrolog Nilay Gençarslan, GoldMoodAstro için hazırladığı yazısında Merkür retrosunun geçmişi neden gündeme getirdiğini, doğum haritasında hangi göstergelerin incelendiğini ve geçmişten biri iletişime geçtiğinde nelere dikkat edilmesi gerektiğini anlatıyor.",
  "",
  "Nilay Gençarslan; astroloji, doğum haritası, enerji çalışmaları, Reiki ve bilinçaltı dönüşüm alanlarında danışanlarının süreçlerini anlamlandırmalarına rehberlik ediyor.",
  "",
  `Yazı: ${ARTICLE}`,
  `Profil: ${AUTHOR}`,
  "",
  "✨ Sizce geçmişten gelen her mesaj yeni bir başlangıç mıdır, yoksa bazen yalnızca bir kapanış mı?",
  "",
  TAGS,
].join("\n");

const CAPTION_REEL = [
  "Her Merkür retrosu eski sevgilinin döneceği anlamına gelmez. 🌙",
  "",
  "Geçmişin yeniden gündeme gelmesi çoğu zaman dönmek için değil; bir konuyu tamamlamak, yanlış anlaşılmayı düzeltmek ya da döngüyü kapatmak içindir.",
  "",
  `Astrolog Nilay Gençarslan'ın yazısı: ${ARTICLE}`,
  "",
  TAGS,
].join("\n");

const SLIDES: Slide[] = [
  {
    kicker: "YENİ YAZI",
    // Başlık KISA olmalı: uzun hâli ("Merkür Retrosunda Eski Sevgili Döner mi?")
    // şablonda üç satıra taşıp alt başlığın üstüne biniyordu.
    title: "Eski Sevgili Döner mi?",
    subtitle: "Merkür retrosu • Nilay Gençarslan",
    body: "Beklenmedik bir mesaj, yarım kalan bir konuşma… Nedeni gerçekten retro mu?",
    footer: "goldmoodastro.com • Blog",
    bgAsset: RETRO,
    variant: "deep",
  },
  {
    kicker: "YAYGIN YANLIŞ",
    title: "Retro = Geri Dönüş Değil",
    subtitle: "Gündeme gelmek, dönmek demek değil",
    body: "Geçmişin görünür olması çoğu zaman ilişkiye dönmek için değil; bir konuyu tamamlamak, yanlış anlaşılmayı düzeltmek ya da döngüyü kapatmak içindir.",
    footer: "Yazının ana tezi bu",
    variant: "violet",
  },
  {
    kicker: "NEYE BAKILIR",
    title: "Takvim Değil, Harita",
    subtitle: "Retro takvimi tek başına yetmez",
    body: "Retronun gerçekleştiği element, doğum haritasında geçtiği ev ve natal gezegenlerle kurduğu açılar birlikte değerlendirilir.",
    footer: "Yazıda göstergeler tek tek anlatılıyor",
    variant: "gold",
  },
  {
    kicker: "YAZAR",
    title: "Nilay Gençarslan",
    subtitle: "Astroloji • Doğum haritası • Bilinçaltı dönüşüm",
    body: "Danışanlarının yaşadıkları süreçleri anlamlandırmalarına ve yollarını daha net görmelerine rehberlik ediyor.",
    footer: "Profil ve randevu: goldmoodastro.com",
    bgAsset: NILAY,
    variant: "cream",
  },
];

const REEL_COVER: Slide = {
  kicker: "YENİ YAZI",
  title: "Eski Sevgili Gerçekten Döner mi?",
  subtitle: "Merkür retrosu üzerine",
  body: "Geçmişin gündeme gelmesi her zaman dönüş değildir — bazen sadece kapanıştır.",
  footer: "Astrolog Nilay Gençarslan • goldmoodastro.com",
  bgAsset: RETRO,
  variant: "deep",
};

const STORY_SLIDE: Slide = {
  kicker: "BLOG",
  title: "Merkür Retrosu ve Geçmiş",
  subtitle: "Dönüş mü, kapanış mı?",
  body: "Astrolog Nilay Gençarslan'ın yeni yazısı yayında.",
  footer: "Link: goldmoodastro.com/tr/blog",
  bgAsset: RETRO,
  variant: "violet",
};

async function main() {
  const DAY = 91; // günlük 1-31 numaralandırmasıyla çakışmasın
  assertSafe("caption", CAPTION);
  assertSafe("reel caption", CAPTION_REEL);
  for (const [i, s] of SLIDES.entries()) {
    assertSafe(`slayt ${i + 1}`, [s.title, s.subtitle, s.body, s.footer].filter(Boolean).join(" "));
  }

  const posts: DraftPost[] = [];
  posts.push(await carousel(DAY, "merkur-retro-blog", "Merkür Retrosunda Eski Sevgili Döner mi?", SLIDES, CAPTION, "tanitim"));
  posts.push(await reel(DAY, "merkur-retro-blog", "Merkür Retrosunda Eski Sevgili Döner mi?", REEL_COVER, CAPTION_REEL));
  posts.push(await story(DAY, "merkur-retro-blog", "Merkür retrosu yazısı • blog linki", STORY_SLIDE));

  const out = path.resolve(ROOT, "reports/merkur-retro-blog-sosyal-paket.json");
  await fs.writeFile(out, JSON.stringify(posts.map((p) => ({
    title: p.title, postType: p.postType, platform: p.platform,
    imageUrl: p.imageUrl, mediaUrls: p.mediaUrls, caption: p.caption,
  })), null, 2), "utf8");
  console.log(`\n${posts.length} içerik → ${out}`);
  for (const p of posts) console.log(`  ${p.title}\n    ${p.mediaUrls?.join("\n    ")}`);
}

await main();
