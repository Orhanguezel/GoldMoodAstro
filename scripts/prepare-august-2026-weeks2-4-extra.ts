#!/usr/bin/env bun

/** 8–31 Ağustos 2026: her gün bir ek ana içerik + bir story. */
import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { assets, carousel, reel, story, type DraftPost, type Slide } from "./prepare-august-2026-week1-extra-drafts";
import { getDaySky, houseMapByRising, MOON_PHASE_TR, SIGN_TR } from "../packages/shared-backend/modules/astrology/daySky";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
const ROOT = process.cwd();
const WRITE_DB = process.argv.includes("--db");
const SYNC_SCHEDULED = process.argv.includes("--sync-scheduled");
const BUST = (process.argv.find((a) => a.startsWith("--bust="))?.split("=")[1] ?? "").trim();
const TENANT = "goldmoodastro";
const TAGS = "#goldmoodastro #astroloji #tarot #ruyatabiri #spirituelsemboller #ruhsaldanismanlik";
const SITE = "https://goldmoodastro.com";

/**
 * secondTitle/secondBody — carousel'in İKİNCİ slaytı.
 *
 * Eskiden 2. slayt `title: s.subtitle, body: s.body` ile kuruluyordu: yani başlık
 * 1. slaytın alt başlığı, gövde ise BİREBİR aynı metindi. Görsel değişiyor, bilgi
 * değişmiyordu — kaydırmanın karşılığı yoktu. Her yeni carousel'de 2. slayta kendi
 * içeriğini yaz; boş bırakılırsa eski (tekrarlayan) davranışa düşer.
 *
 * İyi bir 2. slayt 1.'yi TEKRAR ETMEZ, ilerletir: nasıl uygulanır, neye dikkat
 * edilir, hangi yaygın yanlış anlaşılma var.
 */
type Spec = {
  day: number;
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  asset: string;
  secondAsset?: string;
  secondTitle?: string;
  secondBody?: string;
  bgAsset?: string;
  reel?: boolean;
  campaign?: boolean;
  /**
   * Bu içerik bir yeniay/dolunaya dayanıyorsa o lunasyonun TARİHİ.
   * Verilirse caption'a Swiss Ephemeris'ten hesaplanan "yükselenine göre hangi ev"
   * dağılımı eklenir — okuyucu kendi yükselenini bulup mantığı takip edebilir.
   * Gövde metnindeki burç iddiaları da bu hesapla tutarlı olmalı (elle grupla YAZMA).
   */
  lunationDate?: string;
};
const zodiac = (slug: string) => path.resolve(ROOT, `backend/uploads/zodiac/${slug}.png`);
const dream = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/dream/${slug}.png`);
const coffee = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/coffee/${slug}.png`);
const tarot = (slug: string) => path.resolve(ROOT, `backend/uploads/tarot/${slug}.png`);

const specs: Spec[] = [
  { day: 8, slug: "moon-symbol", title: "Ay Sembolü Sana Ne Anlatıyor?", subtitle: "Sezgi • döngü • iç ses", body: "Ay sembolü, görünmeyen duygularla ve tekrar eden iç döngülerle bağ kurar.", cta: "Bugün dikkatini çeken sembolü yaz", secondTitle: "Sembolü Nasıl Okursun?", secondBody: "Sembolü gördüğün ANI not et: ne düşünüyordun, ne hissediyordun? Anlam çoğu zaman sembolde değil, o anda saklıdır.", asset: dream("moon"), secondAsset: dream("stars") },
  { day: 9, slug: "dream-sea", title: "Rüyada Su veya Deniz Görmek", subtitle: "Duyguların aynası", body: "Suyun hali, duygusal alanının ritmini anlatabilir: sakinlik, taşma ya da arınma.", cta: "Rüyanı yorumlara yaz", secondTitle: "Suyun Hali Ne Söyler?", secondBody: "Durgun su dinginliği, dalgalı su bastırılmış duyguyu, bulanık su ise henüz netleşmemiş bir kararı anlatabilir.", asset: dream("sea"), secondAsset: dream("water") },
  { day: 10, slug: "new-moon-prepare", title: "Yeni Döngüye Hazırlan", subtitle: "Alan aç • sadeleş • niyet et", body: "Yeni bir niyetten önce eski yükü azalt. Bugün yalnız bir alanı sadeleştir.", cta: "Niyetini seç: aşk / para / huzur / kariyer", secondTitle: "Bugün Kapatacağın Tek Şey", secondBody: "Bir çekmece, bir klasör ya da ertelediğin bir konuşma seç ve yalnız onu bitir. Yeniay boş alana gelir.", asset: dream("moon"), secondAsset: dream("door") },
  { day: 11, slug: "new-moon-rising", title: "Kapısı Açılacak Yükselenler", subtitle: "Yeniay ön hazırlığı", body: "Yeniay Aslan burcunda. Aslan yükselen kimlik, Koç yaratıcılık, Yay ise ufuk alanında yeni bir kapı hissedebilir.", cta: "Yükselenini yorumlara yaz", secondTitle: "Yükselenini Bilmiyorsan", secondBody: "Yükselen doğum SAATİ olmadan hesaplanamaz. Nüfus kaydındaki saatle siteden doğum haritanı çıkarabilirsin.", asset: zodiac("leo"), secondAsset: zodiac("aries"), lunationDate: "2026-08-12" },
  { day: 12, slug: "solar-eclipse", title: "Yeniay ve Güneş Tutulması", subtitle: "Yeni bir sayfa açılıyor", body: "Yeniay Aslan burcunda: sahne, yaratıcılık ve kendini gösterme temaları öne çıkıyor. Hızlı karar yerine net niyet.", cta: "Kaydet • kişisel yorum için siteyi ziyaret et", secondTitle: "Tutulmada Ne Yapılmaz?", secondBody: "Tutulma günü geri dönüşü olmayan büyük kararlar için uygun değil. Niyeti bugün yaz, uygulamayı birkaç güne bırak.", asset: dream("sun"), secondAsset: dream("moon"), campaign: true, lunationDate: "2026-08-12" },
  { day: 13, slug: "intention-working", title: "Bu Niyet Sende Çalışıyor Olabilir", subtitle: "Yeniay sonrası", body: "Tekrar eden düşünce, konuşma veya fırsat yeni döngünün ilk işareti olabilir.", cta: "Hangi niyeti seçtiğini yaz", asset: dream("door"), reel: true },
  { day: 14, slug: "coffee-road-key", title: "Fincandaki Yol, Kapı ve Anahtar", subtitle: "Kahve falı sembolleri", body: "Yol hareketi, kapı fırsatı, anahtar ise çözüm ve erişimi simgeler.", cta: "Fincanında çıkan sembolü yaz", secondTitle: "Sembol Nerede Çıktı?", secondBody: "Fincanın kenarı yakın zamanı, dibi uzağı anlatır. Aynı sembol, çıktığı yere göre farklı okunur.", asset: coffee("road"), secondAsset: coffee("key") },
  { day: 15, slug: "incoming-news", title: "Sana Gelen Haber Ne Anlatıyor?", subtitle: "İletişim ve fırsat", body: "Beklenen haber geldiğinde yalnız söze değil, sende uyandırdığı ilk duyguya da bak.", cta: "Mesaj bekliyor musun?", secondTitle: "Haber Gelmiyorsa", secondBody: "Sessizlik de bir cevaptır. Beklemek yerine kendi adımını netleştir; çoğu haber sen hareket ettikten sonra gelir.", asset: coffee("bird"), secondAsset: coffee("bell") },
  { day: 16, slug: "consultant-fatma", title: "Astrolog Fatma Güçlü ile Tanış", subtitle: "Astroloji danışmanlığı", body: "Doğum haritası ve ilişki dinamiklerini kişisel bağlamınla birlikte değerlendirmek için profilini incele.", cta: "Profili incele • randevunu seç", secondTitle: "Görüşmeye Ne Getirmelisin?", secondBody: "Doğum tarihi, saati ve yeri yeterli. Aklındaki tek net soruyla gelmen seansı çok daha verimli yapar.", asset: path.resolve(ROOT, "backend/uploads/consultant_fatma.jpg"), bgAsset: dream("stars"), campaign: true },
  { day: 17, slug: "weekly-rising", title: "Haftanın Yükselen Mesajları", subtitle: "Ateş • toprak • hava • su", body: "Bu hafta yükselen burcun, enerjini hangi alanda daha bilinçli kullanacağını gösterebilir.", cta: "Kaydet • yükselenini oku", secondTitle: "Güneş mi, Yükselen mi?", secondBody: "Güneş burcun kim olduğunu, yükselenin dünyaya nasıl göründüğünü anlatır. Haftalık akışta yükselen daha nettir.", asset: zodiac("sagittarius"), secondAsset: zodiac("aquarius") },
  { day: 18, slug: "tarot-soul-message", title: "Ruhunun Duyması Gereken Mesaj", subtitle: "Bir kart seç", body: "İlk çekildiğin açık kartı seç. Mesajı kesin gelecek değil, farkındalık alanı olarak oku.", cta: "Kartını seç ve kaydet", secondTitle: "Kart Nasıl Okunur?", secondBody: "Kartı kehanet gibi değil ayna gibi oku. İlk hissettiğin şey, kitaptaki anlamdan daha çok şey söyler.", asset: tarot("the-high-priestess"), secondAsset: tarot("the-hermit") },
  { day: 19, slug: "evil-eye", title: "Nazar Boncuğu ve Enerji Koruma", subtitle: "Sınır • niyet • farkındalık", body: "Korunma yalnız sembolle değil, net sınırlar ve dinlenme alanıyla da güçlenir.", cta: "Bu sembolü ihtiyacı olan birine gönder", secondTitle: "Sembolden Fazlası", secondBody: "Nazar boncuğu bir hatırlatıcı. Asıl koruma: uykunu düzenlemek, hayır diyebilmek ve yorulduğunda durmak.", asset: coffee("eye"), secondAsset: coffee("candle") },
  { day: 20, slug: "first-quarter-action", title: "Niyeti Eyleme Çevirme Zamanı", subtitle: "İlk dördün", body: "Niyetini destekleyen en küçük somut adımı bugün takvimine yerleştir.", cta: "Bu hafta atacağın adımı yaz", secondTitle: "Adımı Küçült", secondBody: "15 dakikada yapılabilecek kadar küçük olsun. Büyük adım ertelenir, küçük adım süreklilik kurar.", asset: dream("moon"), secondAsset: dream("road") },
  { day: 21, slug: "pisces-im-fine", title: "Balık ‘İyiyim’ Dediğinde...", subtitle: "Dışarıda sakin • içeride okyanus", body: "Bir şarkı, üç eski anı ve kimseye anlatılmayan bütün ihtimaller aynı anda çalışır.", cta: "Emojiyle tepki ver", asset: zodiac("pisces"), reel: true },
  { day: 22, slug: "synastry-view", title: "Aklındaki Kişi Seni Nasıl Görüyor?", subtitle: "Sinastri farkındalığı", body: "İki harita arasındaki bağ; çekim, iletişim ve güven dinamiklerini birlikte okumaya yardım eder.", cta: "İkinizin burcunu yazın", secondTitle: "Sinastri Ne Değildir?", secondBody: "Uyum oranı bir kader notu değil. Haritalar zorluğu gösterir; ilişkiyi kuran, o zorlukla ne yaptığınızdır.", asset: assets.synastry, secondAsset: assets.synastry },
  { day: 23, slug: "dream-old-house", title: "Rüyada Eski Ev veya Eski Kişi", subtitle: "Geçmişten gelen iz", body: "Eski ev iç dünyayı, eski kişi ise kapanmamış bir duygu ya da öğrenilmiş kalıbı gösterebilir.", cta: "Rüyanı soru kutusuna yaz", secondTitle: "Geri Dönen Kim?", secondBody: "Rüyadaki kişi çoğu zaman o kişi değil, sende bıraktığı histir. 'Bana neyi hatırlatıyor?' diye sor.", asset: dream("house"), secondAsset: dream("door") },
  { day: 24, slug: "full-moon-visible", title: "Hangi Konu Görünür Oluyor?", subtitle: "Dolunay ön hazırlığı", body: "Uzun süredir ertelediğin konu artık daha net bir karar ya da sınır isteyebilir.", cta: "Yükselenini yaz", secondTitle: "Yeni Değil, Görünür", secondBody: "Dolunay yeni bir şey getirmez; zaten orada olanı aydınlatır. Bu hafta önüne tekrar tekrar çıkan konuya bak.", asset: dream("moon"), secondAsset: dream("sun") },
  { day: 25, slug: "infinity-cycle", title: "Tekrar Eden Döngü Sana Ne Söylüyor?", subtitle: "Sonsuzluk sembolü", body: "Aynı sonuç tekrar ediyorsa yalnız kişileri değil, verdiğin otomatik tepkiyi de gözlemle.", cta: "Kapatmak istediğin döngüyü yaz", secondTitle: "Döngüyü Kıran Soru", secondBody: "'Bu sefer ne farklı yaptım?' Cevap yoksa döngü kişilerde değil, verdiğin otomatik tepkidedir.", asset: coffee("ring"), secondAsset: coffee("road") },
  { day: 26, slug: "rising-relief", title: "Rahat Nefes Alacak Yükselenler", subtitle: "Dolunay ön hazırlığı", body: "Dolunay Balık burcunda. Balık yükselen kimlik, Başak yükselen ise ilişkiler alanında bir tamamlanma hissedebilir.", cta: "Kaydet • yükseleninle tekrar bak", secondTitle: "Rahatlama Nasıl Gelir?", secondBody: "Zorlamayla değil bırakmayla. Bu hafta bir sorumluluğu devret ya da verdiğin bir 'evet'i geri al.", asset: zodiac("pisces"), secondAsset: zodiac("virgo"), lunationDate: "2026-08-28" },
  { day: 27, slug: "release-list", title: "Dolunay Arifesi Bırakma Listesi", subtitle: "Bırak • koru • dönüştür", body: "Seni tüketen üç şeyi ve yanında tutmak istediğin üç desteği yaz.", cta: "Story’de bırakıyorum / tutuyorum seç", secondTitle: "Listeyi Nasıl Yazarsın?", secondBody: "Üç sütun: bırakıyorum, koruyorum, dönüştürüyorum. Dolunaydan sonra tekrar oku; çoğu madde yer değiştirir.", asset: dream("moon"), secondAsset: dream("fire") },
  { day: 28, slug: "lunar-eclipse", title: "Dolunay ve Ay Tutulması", subtitle: "Tamamlanma ve görünürlük", body: "Dolunay Balık burcunda: duyguyu bastırmadan, acele karar vermeden izle. Tamamlanan döngünün dersini adlandır.", cta: "Kaydet • danışman yorumunu incele", secondTitle: "Yerine Hemen Koyma", secondBody: "Bir şey biterken boşluğu acele doldurma. Ay tutulmasının etkisi haftalara yayılır, sonuç zamanla netleşir.", asset: dream("moon"), secondAsset: dream("stars"), campaign: true, lunationDate: "2026-08-28" },
  { day: 29, slug: "lighter-rising", title: "Yükü Hafifleyen Yükselenler", subtitle: "Dolunay sonrası", body: "Bıraktığın yükün yerini hemen doldurma. Açılan alanı dinlenme ve netlik için kullan.", cta: "Yükselenini paylaş", secondTitle: "Boşluğu Doldurma", secondBody: "Yük kalkınca hemen yeni sorumluluk alma isteği gelir. Bir hafta boş bırak ve ne geldiğini izle.", asset: zodiac("libra"), secondAsset: zodiac("capricorn") },
  { day: 30, slug: "august-review", title: "Ağustos Sana Ne Öğretti?", subtitle: "Ay sonu değerlendirmesi", body: "Ayın başındaki niyetine dön: ne başladı, ne değişti, neyi geride bıraktın?", cta: "İlk kelimeni yeniden seç", secondTitle: "Üç Soruyla Kapat", secondBody: "Ne başladı? Ne bitti? Neyi tekrar edeceğim? Cevapları yaz — Eylül niyetin buradan çıkacak.", asset: dream("road"), secondAsset: dream("sun") },
  { day: 31, slug: "september-door", title: "Eylül’e Açılan Yeni Kapı", subtitle: "Yeni ayın eşiği", body: "Eylül için tek bir niyet ve onu destekleyecek tek bir alışkanlık seç.", cta: "Eylül niyetini yorumlara yaz", secondTitle: "Niyeti Alışkanlığa Bağla", secondBody: "Niyet tek başına unutulur. Ona her gün yapacağın 10 dakikalık somut bir eylem eşlik etsin.", asset: dream("door"), secondAsset: dream("key") },
];

/**
 * Lunasyonun 12 yükselen için ev dağılımı — sitenin astroloji motorundan (Swiss
 * Ephemeris) HESAPLANIR, elle yazılmaz. Caption'a eklenince okuyucu kendi
 * yükselenini bulup "neden bu alan?" sorusunu takip edebiliyor.
 */
async function risingHouseBlock(lunationDate: string): Promise<string> {
  const sky = await getDaySky(lunationDate);
  const phase = MOON_PHASE_TR[sky.moonPhase];
  const sign = SIGN_TR[sky.moon.sign];
  const lines = houseMapByRising(sky.moon.sign).map(
    (row) => `• ${row.risingSigns.map((s) => SIGN_TR[s]).join(", ")} yükselen → ${row.house}. ev: ${row.area}`,
  );
  return [
    `🌙 ${phase} • ${sign} ${sky.moon.degree.toFixed(0)}° (${lunationDate})`,
    "",
    "Yükselenine göre hangi alanın öne çıktığı:",
    ...lines,
    "",
    "Yükselenini bilmiyorsan doğum saatinle siteden haritanı çıkarabilirsin.",
  ].join("\n");
}

function cap(s: Spec, skyBlock = "") {
  const extra = skyBlock ? `\n\n${skyBlock}` : "";
  return `${s.title} ✨\n\n${s.body}${extra}\n\n${s.cta}\n\n🔗 ${SITE}\n\n${TAGS}`;
}
async function build(): Promise<DraftPost[]> {
  const posts: DraftPost[] = [];
  for (const s of specs) {
    // Lunasyona dayanan içerikte caption'a motordan hesaplanan ev dağılımını ekle.
    const skyBlock = s.lunationDate ? await risingHouseBlock(s.lunationDate) : "";
    const caption = cap(s, skyBlock);
    const cover: Slide = { title: s.title, subtitle: s.subtitle, body: s.body, asset: s.asset, bgAsset: s.bgAsset, variant: s.campaign ? "gold" : "deep", footer: s.cta };
    if (s.reel) posts.push(await reel(s.day, s.slug, s.title, cover, caption));
    else {
      // 2. slayt: kendi başlığı + kendi gövdesi. secondTitle/secondBody yoksa eski
      // (1. slaytı tekrarlayan) davranışa düşer — yeni gün eklerken ikisini de yaz.
      const second: Slide = {
        title: s.secondTitle ?? s.subtitle,
        subtitle: s.secondTitle ? s.subtitle : undefined,
        body: s.secondBody ?? s.body,
        asset: s.secondAsset ?? s.asset,
        bgAsset: s.bgAsset,
        variant: s.campaign ? "violet" : "gold",
        footer: s.cta,
      };
      posts.push(await carousel(s.day, s.slug, s.title, [cover, second], caption, s.campaign ? "kampanya" : "etkilesim"));
    }
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

/**
 * Zamanlanmış kayıtları GÜNCELLER — insert/delete YOK.
 *
 * persist() (--db) her sourceRef'i silip yeniden ekliyor ve scheduled_at'i gün
 * numarasından kuruyor; GEÇMİŞ günler için çalıştırılırsa geçmiş tarihli satır
 * INSERT eder ve kuyruk onu anında yayınlar (tekrar gönderi). Bu yüzden içerik
 * düzeltmesini persist ile değil bununla uygula: yalnız status='scheduled'
 * satırların başlık/caption/medyası güncellenir, yayınlanmışlara dokunulmaz.
 *
 * --bust=N: medya URL'lerine ?v=N ekler (aynı dosya adı yeniden basıldığında
 * tarayıcı/katalog bayat kopyayı sunmasın).
 */
async function syncScheduled(posts: DraftPost[], bust: string) {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "", database: process.env.DB_NAME || "goldmoodastro", charset: "utf8mb4" });
  const withBust = (url: string) => (bust ? `${url}${url.includes("?") ? "&" : "?"}v=${bust}` : url);
  let updated = 0;
  try {
    for (const post of posts) {
      const media = (post.mediaUrls ?? []).map(withBust);
      const [res] = await conn.execute(
        "UPDATE social_posts SET title=?, caption=?, image_url=?, media_urls=CAST(? AS JSON) WHERE sub_type=? AND source_ref=? AND status='scheduled'",
        [post.title, post.caption, post.imageUrl ? withBust(post.imageUrl) : null, JSON.stringify(media), TENANT, post.sourceRef],
      );
      updated += (res as { affectedRows?: number }).affectedRows ?? 0;
    }
  } finally { await conn.end(); }
  return updated;
}

async function main() {
  const posts = await build();
  const dir = path.resolve(ROOT, "references/monthly-content/2026-08");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "08-31-extra-drafts.json"), JSON.stringify(posts, null, 2));
  if (WRITE_DB) await persist(posts);
  if (SYNC_SCHEDULED) {
    const n = await syncScheduled(posts, BUST);
    console.log(`Zamanlanmış kayıt güncellendi: ${n}${BUST ? ` (cache-bust ?v=${BUST})` : ""}`);
  }
  console.log(`Hazır: ${posts.length} kayıt (${posts.length / 2} ana + ${posts.length / 2} story)${WRITE_DB ? ", DB zamanlandı" : ""}`);
}
main().catch((error) => { console.error(error); process.exit(1); });
