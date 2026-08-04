#!/usr/bin/env bun

/** 8–31 Ağustos 2026: her gün bir ek ana içerik + bir story. */
import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { assets, carousel, reel, story, type DraftPost, type Slide } from "./prepare-august-2026-week1-extra-drafts";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
const ROOT = process.cwd();
const WRITE_DB = process.argv.includes("--db");
const TENANT = "goldmoodastro";
const TAGS = "#goldmoodastro #astroloji #tarot #ruyatabiri #spirituelsemboller #ruhsaldanismanlik";
const SITE = "https://goldmoodastro.com";

type Spec = { day: number; slug: string; title: string; subtitle: string; body: string; cta: string; asset: string; secondAsset?: string; reel?: boolean; campaign?: boolean };
const zodiac = (slug: string) => path.resolve(ROOT, `backend/uploads/zodiac/${slug}.png`);
const dream = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/dream/${slug}.png`);
const coffee = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/coffee/${slug}.png`);
const tarot = (slug: string) => path.resolve(ROOT, `backend/uploads/tarot/${slug}.png`);

const specs: Spec[] = [
  { day: 8, slug: "moon-symbol", title: "Ay Sembolü Sana Ne Anlatıyor?", subtitle: "Sezgi • döngü • iç ses", body: "Ay sembolü, görünmeyen duygularla ve tekrar eden iç döngülerle bağ kurar.", cta: "Bugün dikkatini çeken sembolü yaz", asset: dream("moon"), secondAsset: dream("stars") },
  { day: 9, slug: "dream-sea", title: "Rüyada Su veya Deniz Görmek", subtitle: "Duyguların aynası", body: "Suyun hali, duygusal alanının ritmini anlatabilir: sakinlik, taşma ya da arınma.", cta: "Rüyanı yorumlara yaz", asset: dream("sea"), secondAsset: dream("water") },
  { day: 10, slug: "new-moon-prepare", title: "Yeni Döngüye Hazırlan", subtitle: "Alan aç • sadeleş • niyet et", body: "Yeni bir niyetten önce eski yükü azalt. Bugün yalnız bir alanı sadeleştir.", cta: "Niyetini seç: aşk / para / huzur / kariyer", asset: dream("moon"), secondAsset: dream("door") },
  { day: 11, slug: "new-moon-rising", title: "Kapısı Açılacak Yükselenler", subtitle: "Yeniay ön hazırlığı", body: "Koç, Aslan ve Yay yükselenler görünürlük; Boğa, Başak ve Oğlak düzen alanında hareket hissedebilir.", cta: "Yükselenini yorumlara yaz", asset: zodiac("aries"), secondAsset: zodiac("leo") },
  { day: 12, slug: "solar-eclipse", title: "Yeniay ve Güneş Tutulması", subtitle: "Yeni bir sayfa açılıyor", body: "Hızlı karar yerine net niyet. Görünür olmak istediğin alanı seç ve küçük bir adım belirle.", cta: "Kaydet • kişisel yorum için siteyi ziyaret et", asset: dream("sun"), secondAsset: dream("moon"), campaign: true },
  { day: 13, slug: "intention-working", title: "Bu Niyet Sende Çalışıyor Olabilir", subtitle: "Yeniay sonrası", body: "Tekrar eden düşünce, konuşma veya fırsat yeni döngünün ilk işareti olabilir.", cta: "Hangi niyeti seçtiğini yaz", asset: dream("door"), reel: true },
  { day: 14, slug: "coffee-road-key", title: "Fincandaki Yol, Kapı ve Anahtar", subtitle: "Kahve falı sembolleri", body: "Yol hareketi, kapı fırsatı, anahtar ise çözüm ve erişimi simgeler.", cta: "Fincanında çıkan sembolü yaz", asset: coffee("road"), secondAsset: coffee("key") },
  { day: 15, slug: "incoming-news", title: "Sana Gelen Haber Ne Anlatıyor?", subtitle: "İletişim ve fırsat", body: "Beklenen haber geldiğinde yalnız söze değil, sende uyandırdığı ilk duyguya da bak.", cta: "Mesaj bekliyor musun?", asset: coffee("bird"), secondAsset: coffee("bell") },
  { day: 16, slug: "consultant-fatma", title: "Astrolog Fatma Güçlü ile Tanış", subtitle: "Astroloji danışmanlığı", body: "Doğum haritası ve ilişki dinamiklerini kişisel bağlamınla birlikte değerlendirmek için profilini incele.", cta: "Profili incele • randevunu seç", asset: path.resolve(ROOT, "backend/uploads/consultant_fatma.jpg"), campaign: true },
  { day: 17, slug: "weekly-rising", title: "Haftanın Yükselen Mesajları", subtitle: "Ateş • toprak • hava • su", body: "Bu hafta yükselen burcun, enerjini hangi alanda daha bilinçli kullanacağını gösterebilir.", cta: "Kaydet • yükselenini oku", asset: zodiac("sagittarius"), secondAsset: zodiac("aquarius") },
  { day: 18, slug: "tarot-soul-message", title: "Ruhunun Duyması Gereken Mesaj", subtitle: "Bir kart seç", body: "İlk çekildiğin açık kartı seç. Mesajı kesin gelecek değil, farkındalık alanı olarak oku.", cta: "Kartını seç ve kaydet", asset: tarot("the-high-priestess"), secondAsset: tarot("the-hermit") },
  { day: 19, slug: "evil-eye", title: "Nazar Boncuğu ve Enerji Koruma", subtitle: "Sınır • niyet • farkındalık", body: "Korunma yalnız sembolle değil, net sınırlar ve dinlenme alanıyla da güçlenir.", cta: "Bu sembolü ihtiyacı olan birine gönder", asset: coffee("eye"), secondAsset: coffee("candle") },
  { day: 20, slug: "first-quarter-action", title: "Niyeti Eyleme Çevirme Zamanı", subtitle: "İlk dördün", body: "Niyetini destekleyen en küçük somut adımı bugün takvimine yerleştir.", cta: "Bu hafta atacağın adımı yaz", asset: dream("moon"), secondAsset: dream("road") },
  { day: 21, slug: "pisces-im-fine", title: "Balık ‘İyiyim’ Dediğinde...", subtitle: "Dışarıda sakin • içeride okyanus", body: "Bir şarkı, üç eski anı ve kimseye anlatılmayan bütün ihtimaller aynı anda çalışır.", cta: "Emojiyle tepki ver", asset: zodiac("pisces"), reel: true },
  { day: 22, slug: "synastry-view", title: "Aklındaki Kişi Seni Nasıl Görüyor?", subtitle: "Sinastri farkındalığı", body: "İki harita arasındaki bağ; çekim, iletişim ve güven dinamiklerini birlikte okumaya yardım eder.", cta: "İkinizin burcunu yazın", asset: assets.synastry, secondAsset: assets.synastry },
  { day: 23, slug: "dream-old-house", title: "Rüyada Eski Ev veya Eski Kişi", subtitle: "Geçmişten gelen iz", body: "Eski ev iç dünyayı, eski kişi ise kapanmamış bir duygu ya da öğrenilmiş kalıbı gösterebilir.", cta: "Rüyanı soru kutusuna yaz", asset: dream("house"), secondAsset: dream("door") },
  { day: 24, slug: "full-moon-visible", title: "Hangi Konu Görünür Oluyor?", subtitle: "Dolunay ön hazırlığı", body: "Uzun süredir ertelediğin konu artık daha net bir karar ya da sınır isteyebilir.", cta: "Yükselenini yaz", asset: dream("moon"), secondAsset: dream("sun") },
  { day: 25, slug: "infinity-cycle", title: "Tekrar Eden Döngü Sana Ne Söylüyor?", subtitle: "Sonsuzluk sembolü", body: "Aynı sonuç tekrar ediyorsa yalnız kişileri değil, verdiğin otomatik tepkiyi de gözlemle.", cta: "Kapatmak istediğin döngüyü yaz", asset: coffee("ring"), secondAsset: coffee("road") },
  { day: 26, slug: "rising-relief", title: "Rahat Nefes Alacak Yükselenler", subtitle: "Dolunay ön hazırlığı", body: "Yengeç, Akrep ve Balık yükselenler duygusal; İkizler, Terazi ve Kova iletişim alanında netleşebilir.", cta: "Kaydet • yükseleninle tekrar bak", asset: zodiac("cancer"), secondAsset: zodiac("scorpio") },
  { day: 27, slug: "release-list", title: "Dolunay Arifesi Bırakma Listesi", subtitle: "Bırak • koru • dönüştür", body: "Seni tüketen üç şeyi ve yanında tutmak istediğin üç desteği yaz.", cta: "Story’de bırakıyorum / tutuyorum seç", asset: dream("moon"), secondAsset: dream("fire") },
  { day: 28, slug: "lunar-eclipse", title: "Dolunay ve Ay Tutulması", subtitle: "Tamamlanma ve görünürlük", body: "Duyguyu bastırmadan, acele karar vermeden izle. Tamamlanan döngünün dersini adlandır.", cta: "Kaydet • danışman yorumunu incele", asset: dream("moon"), secondAsset: dream("stars"), campaign: true },
  { day: 29, slug: "lighter-rising", title: "Yükü Hafifleyen Yükselenler", subtitle: "Dolunay sonrası", body: "Bıraktığın yükün yerini hemen doldurma. Açılan alanı dinlenme ve netlik için kullan.", cta: "Yükselenini paylaş", asset: zodiac("libra"), secondAsset: zodiac("capricorn") },
  { day: 30, slug: "august-review", title: "Ağustos Sana Ne Öğretti?", subtitle: "Ay sonu değerlendirmesi", body: "Ayın başındaki niyetine dön: ne başladı, ne değişti, neyi geride bıraktın?", cta: "İlk kelimeni yeniden seç", asset: dream("road"), secondAsset: dream("sun") },
  { day: 31, slug: "september-door", title: "Eylül’e Açılan Yeni Kapı", subtitle: "Yeni ayın eşiği", body: "Eylül için tek bir niyet ve onu destekleyecek tek bir alışkanlık seç.", cta: "Eylül niyetini yorumlara yaz", asset: dream("door"), secondAsset: dream("key") },
];

function cap(s: Spec) { return `${s.title} ✨\n\n${s.body}\n\n${s.cta}\n\n🔗 ${SITE}\n\n${TAGS}`; }
async function build(): Promise<DraftPost[]> {
  const posts: DraftPost[] = [];
  for (const s of specs) {
    const cover: Slide = { title: s.title, subtitle: s.subtitle, body: s.body, asset: s.asset, variant: s.campaign ? "gold" : "deep", footer: s.cta };
    if (s.reel) posts.push(await reel(s.day, s.slug, s.title, cover, cap(s)));
    else posts.push(await carousel(s.day, s.slug, s.title, [cover, { title: s.subtitle, body: s.body, asset: s.secondAsset ?? s.asset, variant: s.campaign ? "violet" : "gold", footer: s.cta }], cap(s), s.campaign ? "kampanya" : "etkilesim"));
    posts.push(await story(s.day, `${s.slug}-cta`, s.cta, { ...cover, kicker: "STORY • AĞUSTOS 2026", body: s.cta, footer: "Etkileşim aracını ekle" }));
  }
  return posts;
}

async function persist(posts: DraftPost[]) {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "", database: process.env.DB_NAME || "goldmoodastro", charset: "utf8mb4" });
  try {
    for (const post of posts) {
      const day = Number(post.sourceRef.split(":")[1]);
      const isStory = post.sourceRef.includes(":story:");
      const scheduledAt = `2026-08-${String(day).padStart(2, "0")} ${isStory ? "16:00:00" : "10:00:00"}`; // DB UTC = TR 19:00/13:00
      await conn.execute("DELETE FROM social_posts WHERE sub_type=? AND source_ref=? AND status IN ('draft','scheduled')", [TENANT, post.sourceRef]);
      await conn.execute(`INSERT INTO social_posts (uuid,post_type,sub_type,title,caption,hashtags,image_url,media_urls,platform,status,scheduled_at,source_type,source_ref,ai_generated,created_by,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,CAST(? AS JSON),?,'scheduled',?,'manual',?,0,'codex-august-weeks2-4',?,NOW(3),NOW(3))`, [randomUUID(), post.postType, TENANT, post.title, post.caption, TAGS, post.imageUrl ?? null, JSON.stringify(post.mediaUrls ?? []), post.platform, scheduledAt, post.sourceRef, post.notes]);
    }
  } finally { await conn.end(); }
}

async function main() {
  const posts = await build();
  const dir = path.resolve(ROOT, "references/monthly-content/2026-08");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "08-31-extra-drafts.json"), JSON.stringify(posts, null, 2));
  if (WRITE_DB) await persist(posts);
  console.log(`Hazır: ${posts.length} kayıt (${posts.length / 2} ana + ${posts.length / 2} story)${WRITE_DB ? ", DB zamanlandı" : ""}`);
}
main().catch((error) => { console.error(error); process.exit(1); });
