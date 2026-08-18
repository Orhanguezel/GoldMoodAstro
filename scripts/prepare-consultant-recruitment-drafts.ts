#!/usr/bin/env bun
/**
 * DANIŞMAN ARAMA (recruitment) sosyal içerik paketi — carousel + reel + story.
 *
 * NEDEN AYRI BİR SCRIPT: Ağustos günlük omurgası (burç/tarot/rüya) tarih bazlı
 * üretiliyor; danışman arama içeriği ise tarihe değil ihtiyaca bağlı ve tekrar
 * tekrar yayınlanabilir. Aynı dosyaya sıkıştırmak günlük planı kirletirdi.
 *
 * İÇERİK SINIRI (CLAUDE.md yasaklı konular): rakip ilanlarındaki "medyum /
 * falcı / kesin kazanç" çerçevesi KULLANILMAZ. Stripe ve Meta/Google hesap
 * kapatma riski buradan geliyor. İzinli çerçeve: kişisel farkındalık, gelişim,
 * değerlendirme. Kazanç "cazip gelir" gibi vaatle değil, komisyon modeliyle
 * olgu olarak anlatılır.
 *
 * Görsel: sitenin kendi danışman görseli (frontend/public/images/become-consultant.png).
 * Fotoğraf olduğu için asset değil bgAsset kullanılır — asset yolu fotoğrafı
 * bulanıklaştırıp marka paletini bozuyor (bkz. Slide tipi notu).
 *
 * Kullanım:
 *   bun run scripts/prepare-consultant-recruitment-drafts.ts            # sadece görsel + manifest
 *   bun run scripts/prepare-consultant-recruitment-drafts.ts --db       # taslakları DB'ye yaz (status=draft)
 */
import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { carousel, reel, story, type DraftPost, type Slide } from "./prepare-august-2026-week1-extra-drafts";
import { findRiskyTopics } from "../packages/shared-backend/modules/_shared/contentModeration";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const ROOT = process.cwd();
const WRITE_DB = process.argv.includes("--db");
const TENANT = "goldmoodastro";
const SITE = "https://goldmoodastro.com";
// DİKKAT: /tr/danisman-ol 404 döner. Türkçe slug haritasında (i18n/localizedRoutes.ts)
// become-consultant için bir karşılık YOK; canlıda çalışan tek adres bu.
const APPLY_URL = `${SITE}/tr/become-consultant`;
const TAGS = "#goldmoodastro #danışmanarıyoruz #astroloji #tarot #numeroloji #ruhsaldanismanlik #uzmanilani";

const BRAND = path.resolve(ROOT, "backend/uploads/brand/become-consultant.png");
// Panel/uygulama görselleri: "nasıl çalışıyoruz" slaytlarında danışmanın
// gerçekten kullanacağı ekranı gösteriyor. Sembol asset'i (fincan/rüya) burada
// KULLANILMAZ — onların sözlükte anlamı var, ilan bağlamında yanlış çağrışım
// yapar (bkz memory social_content_quality_rules).
const APP_CHART = path.resolve(ROOT, "backend/uploads/features/natal_chart.png");
// Sitenin ana hero görseli — 3. slaytta marka fotoğrafını TEKRAR etmemek için.
// Üç slaytta aynı fotoğraf kullanınca 3 ve 4 neredeyse ayırt edilemiyordu.
const HERO_MOON = path.resolve(ROOT, "backend/uploads/brand/hero-moon.png");

/** Rakip ilanındaki yasaklı çerçeveyi kazara kopyalamayalım diye açık kara liste. */
const FORBIDDEN_PHRASES = [
  "medyum", "falcı", "kehanet", "kesin kazanç", "garantili gelir",
  "zengin ol", "büyü", "muska", "bağlama",
];

function assertSafe(label: string, text: string) {
  const hits = findRiskyTopics(text);
  if (hits.length) {
    throw new Error(`${label}: yasaklı konu (${hits.map((h) => `${h.category}:${h.matched}`).join(", ")})`);
  }
  const lowered = text.toLocaleLowerCase("tr");
  const banned = FORBIDDEN_PHRASES.filter((p) => lowered.includes(p));
  if (banned.length) {
    throw new Error(`${label}: rakip ilanı çerçevesi sızmış (${banned.join(", ")})`);
  }
}

const CAPTION_CAROUSEL = [
  "Danışman arıyoruz.",
  "",
  "GoldMoodAstro'da astroloji, tarot, numeroloji ve rüya yorumu alanlarında çalışan danışmanlarla birlikte ilerliyoruz. Aradığımız kişi, danışanı bir kalıba sokmak yerine kendi haritasını anlamasına yardımcı olan, sınırlarını bilen ve sorumlu bir dille konuşan biri.",
  "",
  "Nasıl çalışıyoruz:",
  "• Takvimini sen belirliyorsun — müsaitlik saatlerini panelden sen açıyorsun.",
  "• Görüşmeler uygulama içinden sesli veya görüntülü yapılıyor; kendi telefon numaranı paylaşmıyorsun.",
  "• Ödeme ve fatura tarafını platform yürütüyor; kazanç komisyon modeliyle hesaplanıyor ve panelde kalem kalem görünüyor.",
  "• Profilin, yorumların ve SEO'n bizim tarafımızdan yönetiliyor.",
  "",
  "Başvuru için profilinde uzmanlık alanların, deneyimin ve çalışma yaklaşımın yeterli. Başvurular 48 saat içinde değerlendiriliyor.",
  "",
  `Başvuru: ${APPLY_URL}`,
  "",
  TAGS,
].join("\n");

const CAPTION_REEL = [
  "Danışmanlığını kendi düzeninde sürdürmek ister misin?",
  "",
  "GoldMoodAstro'da saatini sen belirliyorsun, görüşme uygulama içinde oluyor, ödeme ve fatura tarafını biz yürütüyoruz. Sen işine odaklanıyorsun.",
  "",
  `Başvuru: ${APPLY_URL}`,
  "",
  TAGS,
].join("\n");

const CAROUSEL_SLIDES: Slide[] = [
  {
    kicker: "EKİBE KATIL",
    title: "Danışman Arıyoruz",
    subtitle: "Astroloji • Tarot • Numeroloji • Rüya",
    body: "Danışanı kalıba sokmayan, kendi haritasını anlamasına yardım eden danışmanlarla çalışıyoruz.",
    footer: "goldmoodastro.com/tr/become-consultant",
    bgAsset: BRAND,
    variant: "deep",
  },
  {
    kicker: "NASIL ÇALIŞIYORUZ",
    title: "Takvimin Sende",
    subtitle: "Müsaitliğini panelden sen açarsın",
    body: "Görüşmeler uygulama içinden sesli veya görüntülü yapılır; kendi telefon numaranı paylaşmazsın.",
    footer: "Randevu, hatırlatma ve iptal akışı otomatik",
    asset: APP_CHART,
    variant: "violet",
  },
  {
    kicker: "KAZANÇ VE FATURA",
    title: "Şeffaf Komisyon",
    subtitle: "Panelde kalem kalem görünür",
    body: "Ödeme tahsilatını ve fatura tarafını platform yürütür. Hakedişini ve çekim taleplerini aynı panelden takip edersin.",
    footer: "Gizli koşul yok",
    // Buraya uygulama ekranı KOYMA: "Günlük Rehber" başlığı komisyon
    // anlatan slaytın arkasında dev filigran olarak çıkıyor ve konuyla
    // ilgisiz bir vaat gibi okunuyor.
    bgAsset: HERO_MOON,
    variant: "gold",
  },
  {
    kicker: "BAŞVURU",
    title: "48 Saatte Dönüş",
    subtitle: "Uzmanlığın, deneyimin, yaklaşımın",
    body: "Başvurunu değerlendirip profilini birlikte kuruyoruz. SEO ve görünürlük tarafı bizde.",
    footer: "goldmoodastro.com/tr/become-consultant",
    bgAsset: BRAND,
    variant: "cream",
  },
];

const REEL_COVER: Slide = {
  kicker: "EKİBE KATIL",
  title: "Danışman Arıyoruz",
  subtitle: "Takvimin sende, kazancın şeffaf",
  body: "Astroloji, tarot, numeroloji ve rüya yorumu alanında çalışan danışmanları ekibimize bekliyoruz.",
  footer: "Başvuru: goldmoodastro.com/tr/become-consultant",
  bgAsset: BRAND,
  variant: "deep",
};

const STORY_SLIDE: Slide = {
  kicker: "İLAN",
  title: "Danışman Arıyoruz",
  subtitle: "Astroloji • Tarot • Numeroloji • Rüya",
  body: "Takvimini sen belirle, görüşmeyi uygulamadan yap, kazancını panelden takip et.",
  footer: "Link: goldmoodastro.com/tr/become-consultant",
  bgAsset: BRAND,
  variant: "violet",
};

async function build(): Promise<DraftPost[]> {
  // Gün numarası dosya adlandırması için; recruitment içeriği tarihe bağlı değil,
  // 90 = "kampanya" bloğu olarak ayrılmış numara (günlük 1-31 ile çakışmaz).
  const DAY = 90;
  assertSafe("carousel caption", CAPTION_CAROUSEL);
  assertSafe("reel caption", CAPTION_REEL);
  for (const [i, s] of CAROUSEL_SLIDES.entries()) {
    assertSafe(`slayt ${i + 1}`, [s.title, s.subtitle, s.body, s.footer].filter(Boolean).join(" "));
  }

  const posts: DraftPost[] = [];
  posts.push(await carousel(DAY, "danisman-arayisi", "Danışman Arıyoruz", CAROUSEL_SLIDES, CAPTION_CAROUSEL, "kampanya"));
  posts.push(await reel(DAY, "danisman-arayisi", "Danışman Arıyoruz", REEL_COVER, CAPTION_REEL));
  posts.push(await story(DAY, "danisman-arayisi", "Danışman ilanı • başvuru linki", STORY_SLIDE));
  return posts;
}

async function main() {
  const posts = await build();

  const manifest = posts.map((p) => ({
    title: p.title, postType: p.postType, platform: p.platform,
    imageUrl: p.imageUrl, mediaUrls: p.mediaUrls, caption: p.caption,
  }));
  const out = path.resolve(ROOT, "reports/danisman-arayisi-sosyal-paket.json");
  await fs.writeFile(out, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\n${posts.length} içerik üretildi → ${out}`);
  for (const p of posts) console.log(`  ${p.title}\n    ${p.mediaUrls?.join("\n    ")}`);

  if (!WRITE_DB) {
    console.log("\nDB'ye yazılmadı. Taslak olarak eklemek için: --db");
    return;
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  for (const p of posts) {
    await conn.execute(
      `INSERT INTO social_posts (uuid, tenant_key, source_type, source_ref, title, caption, hashtags,
         platform, post_type, status, image_url, media_urls, link_url, notes, created_at, updated_at)
       VALUES (?, ?, 'manual', ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE caption = VALUES(caption), media_urls = VALUES(media_urls), updated_at = NOW(3)`,
      [randomUUID(), TENANT, p.sourceRef, p.title, p.caption, TAGS, p.platform, p.postType,
       p.imageUrl ?? null, JSON.stringify(p.mediaUrls ?? []), APPLY_URL, p.notes],
    );
    console.log(`  DB taslak: ${p.title}`);
  }
  await conn.end();
}

await main();
