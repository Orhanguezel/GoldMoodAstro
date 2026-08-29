#!/usr/bin/env bun

/**
 * GoldMoodAstro — 1–30 Eylül 2026 sosyal içerik paketi.
 *
 * Astrolojik olgular daySky motorundan, sembol anlamları canlı sözlüklerden,
 * numeroloji örneği calculateLifePath() motorundan gelir. `--db` verilmedikçe
 * veritabanına yazmaz; görseller ve manifest yerelde üretilir.
 */
import "dotenv/config";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import {
  assets,
  carousel,
  story,
  type ContentRenderContext,
  type DraftPost,
  type Slide,
} from "./prepare-august-2026-week1-extra-drafts";
import {
  getDaySky,
  houseMapByRising,
  MOON_PHASE_TR,
  SIGN_TR,
  describeDaySky,
} from "../packages/shared-backend/modules/astrology/daySky";
import { calculateLifePath } from "../backend/src/modules/numerology/logic";
import { findRiskyTopics } from "../packages/shared-backend/modules/_shared/contentModeration";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const ROOT = process.cwd();
const WRITE_DB = process.argv.includes("--db");
const TENANT = "goldmoodastro";
const SITE = "https://goldmoodastro.com";
const TAGS = "#goldmoodastro #astroloji #burcuyumu #yukselenburc #ruyatabiri #numeroloji #kisiselfarkindalik";
const OUT_DIR = path.resolve(ROOT, "backend/uploads/social/september-2026-v1");
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || SITE).replace(/\/$/, "");
const CONTEXT: ContentRenderContext = {
  yearMonth: "2026-09",
  sourcePrefix: "september-2026",
  outDir: OUT_DIR,
  publicDir: `${PUBLIC_BASE}/uploads/social/september-2026-v1`,
  notesLabel: "Eylül 2026 SEO ve topluluk içerik paketi",
};

type SymbolSource = "dream" | "coffee" | "tarot";
type SymbolSpec = { source: SymbolSource; slugs: string[] };
type Spec = {
  day: number;
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  secondTitle: string;
  secondBody: string;
  cta: string;
  url: string;
  asset: string;
  secondAsset?: string;
  lunationDate?: string;
  skyDate?: string;
  symbols?: SymbolSpec;
  campaign?: boolean;
};

const dream = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/dream/${slug}.png`);
const coffee = (slug: string) => path.resolve(ROOT, `backend/uploads/symbols/coffee/${slug}.png`);
const tarot = (slug: string) => path.resolve(ROOT, `backend/uploads/tarot/${slug}.png`);
const numerology = (n: number) => path.resolve(ROOT, `backend/uploads/symbols/numerology/${n}.png`);

const specs: Spec[] = [
  { day: 1, slug: "eylul-rehberi", title: "Eylül İçin Tek Bir Niyet Seç", subtitle: "30 gün • tek odak", body: "Ay boyunca takip edebileceğin tek bir farkındalık alanı seç: ilişki, düzen, iç ses ya da iletişim.", secondTitle: "Niyeti Ölçülebilir Yap", secondBody: "Ay sonunda cevaplayacağın tek soruyu şimdi yaz. Böylece değişimi yalnız hissetmez, fark edersin.", cta: "Niyetini yorumlara tek kelimeyle yaz", url: `${SITE}/tr/blog`, asset: assets.door, secondAsset: assets.road },
  { day: 2, slug: "yukselen-nedir", title: "Yükselen Burç Neyi Anlatır?", subtitle: "Doğum saati neden önemli?", body: "Yükselen burç hesabı doğum tarihi, doğum saati ve doğum yerine dayanır. Saat bilinmiyorsa sonuç yaklaşık kalır.", secondTitle: "Ücretsiz Hesapla", secondBody: "Bilgilerini doğru gir, sonucu kaydet ve burç detayındaki açıklamayla birlikte oku.", cta: "Yükselenini hesaplamak için bağlantıya git", url: `${SITE}/tr/yukselen-burc-hesaplayici`, asset: assets.natal, secondAsset: assets.sun, campaign: true },
  { day: 3, slug: "ruyada-kapi", title: "Rüyada Kapı Görmek", subtitle: "Sözlükten sembol okuması", body: "", secondTitle: "Bağlamı Unutma", secondBody: "Kapı açık mıydı, kapalı mıydı; sen içeri mi giriyor, dışarı mı çıkıyordun? Yorumu rüyanın bağlamıyla birlikte düşün.", cta: "Rüya sözlüğünde diğer sembollere bak", url: `${SITE}/tr/ruya-tabirleri`, asset: dream("door"), symbols: { source: "dream", slugs: ["door"] } },
  { day: 4, slug: "son-dordun", title: "Son Dördünde Sadeleşme", subtitle: "Ay İkizler'de • 12°", body: "Son dördün, devam etmeyen planı fark edip iletişim ve günlük notları sadeleştirmek için bir kontrol noktasıdır.", secondTitle: "Bugünün Küçük Adımı", secondBody: "Açık kalan tek konuşmayı, dosyayı ya da notu seç. Hepsini değil yalnız birini tamamla.", cta: "Kaydet • akşam tamamladığını işaretle", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: assets.moon, secondAsset: dream("road"), skyDate: "2026-09-04" },
  { day: 5, slug: "burc-uyumu-hub", title: "78 Burç Uyumu Tek Rehberde", subtitle: "12 burç • 78 benzersiz çift", body: "Burç uyumu sayfaları iletişim, tempo ve yaklaşım farklarını düşünmek için başlangıç sunar; ilişkiye kesin bir not vermez.", secondTitle: "İki Burcu Seç", secondBody: "Önce kendi burcunu, sonra merak ettiğin burcu seç. Detaydan iki burcun profil sayfasına da geçebilirsin.", cta: "Uyum rehberini aç ve çiftini seç", url: `${SITE}/tr/burclar/uyum`, asset: assets.synastry, secondAsset: assets.heart, campaign: true },
  { day: 6, slug: "dogum-haritasi-hazirlik", title: "Doğum Haritası İçin 3 Bilgi", subtitle: "Tarih • saat • yer", body: "Doğum haritasının hesaplanabilmesi için doğum tarihi, mümkün olduğunca kesin saat ve doğum yeri gerekir.", secondTitle: "Saat Bilinmiyorsa", secondBody: "Aile kaydı ve resmi belgeleri kontrol et. Yaklaşık saatle çıkan yükselen sonucunu kesin bilgi gibi kullanma.", cta: "Bilgilerini hazırlayıp haritanı oluştur", url: `${SITE}/tr/dogum-haritasi`, asset: assets.natal, secondAsset: assets.moon },
  { day: 7, slug: "fincanda-yol-anahtar", title: "Fincanda Yol ve Anahtar", subtitle: "İki sembol • tek bağlam", body: "", secondTitle: "Birlikte Nasıl Okunur?", secondBody: "Sembolleri tek tek ezberlemek yerine fincandaki konumlarını ve birbirlerine yakınlıklarını da not et.", cta: "Kahve sembolleri sözlüğünü keşfet", url: `${SITE}/tr/kahve-fali`, asset: coffee("road"), symbols: { source: "coffee", slugs: ["road", "key"] } },
  { day: 8, slug: "sinastri-nedir", title: "Sinastri Ne Değildir?", subtitle: "Uyum puanından daha fazlası", body: "Sinastri iki doğum haritasını iletişim, duygusal ihtiyaç ve ilişki dinamikleri açısından karşılaştırmaya yardım eder.", secondTitle: "Sonuç Değil Harita", secondBody: "Bir açı ilişkiyi tek başına tanımlamaz. Harita, konuşulabilecek temaları görünür kılan bir farkındalık aracıdır.", cta: "Sinastri aracını incele", url: `${SITE}/tr/sinastri`, asset: assets.synastry, secondAsset: assets.natal },
  { day: 9, slug: "yasam-yolu-hesabi", title: "Yaşam Yolu Sayısı Nasıl Bulunur?", subtitle: "Motorla hesaplanan örnek", body: `15.09.1990 örneğinin yaşam yolu sonucu ${calculateLifePath("1990-09-15")}. Doğum tarihindeki rakamlar toplanır ve uygun biçimde indirgenir.`, secondTitle: "Kendi Sayını Bul", secondBody: "Sonucu kişiliğe yapıştırılan sabit bir etiket değil, kendini değerlendirmek için bir tema olarak kullan.", cta: "Numeroloji hesaplayıcısını aç", url: `${SITE}/tr/numeroloji-hesaplama`, asset: numerology(calculateLifePath("1990-09-15")), secondAsset: assets.road },
  { day: 10, slug: "yeniay-hazirlik", title: "Yeniay Öncesi Alan Aç", subtitle: "Tek bir düzenleme seç", body: "Yeni bir başlangıç listesi yazmadan önce zamanını, notlarını ya da çalışma alanını sadeleştir.", secondTitle: "Yarın İçin Soru", secondBody: "Hangi alışkanlık günlük hayatını gerçekten kolaylaştırır? Cevabını tek cümlede yaz.", cta: "Yarınki yeniay rehberi için kaydet", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: dream("moon"), secondAsset: dream("door") },
  { day: 11, slug: "basak-yeniayi", title: "Başak Yeniayı: Yükselenine Göre Evler", subtitle: "22° • motor hesabı", body: "Yeniay Başak burcunda hesaplandı. Aşağıdaki açıklamada yükselenine göre hangi evin vurgulandığını bulabilirsin.", secondTitle: "Niyeti Küçült", secondBody: "Seçtiğin ev temasında 15 dakikada başlayabileceğin tek bir düzenleme belirle.", cta: "Yükselenini hesapla, sonra caption'daki evini bul", url: `${SITE}/tr/yukselen-burc-hesaplayici`, asset: assets.moon, secondAsset: assets.natal, lunationDate: "2026-09-11", campaign: true },
  { day: 12, slug: "uyum-nasil-okunur", title: "Burç Uyumu Nasıl Okunur?", subtitle: "Önce iki ayrı profil", body: "Uyum sayfasından önce her iki burcun güçlü yönlerini, ihtiyaçlarını ve iletişim biçimini ayrı ayrı okumak daha dengeli bir çerçeve verir.", secondTitle: "Sonra Ortak Dinamiğe Bak", secondBody: "Benzerlik kadar farklılıkların nasıl yönetildiğine odaklan. Uyum, değişmez bir kader sonucu değildir.", cta: "78 kombinasyondan birini seç", url: `${SITE}/tr/burclar/uyum`, asset: assets.synastry, secondAsset: assets.heart },
  { day: 13, slug: "dogum-saati", title: "Doğum Saatini Bilmiyorsan", subtitle: "Yükselen hesabında sınır", body: "Yükselen yaklaşık iki saatte bir değişebildiği için saat bilgisi olmadan kesin yükselen sonucu üretilemez.", secondTitle: "Ne Yapabilirsin?", secondBody: "Resmi kayıtları ve aile notlarını kontrol et; farklı saat aralıklarını karşılaştırırken sonucu yaklaşık olarak işaretle.", cta: "Hesaplayıcıdaki açıklamayı oku", url: `${SITE}/tr/yukselen-burc-hesaplayici`, asset: assets.natal, secondAsset: assets.moon },
  { day: 14, slug: "ruyada-deniz", title: "Rüyada Deniz Görmek", subtitle: "Sembol sözlüğünden", body: "", secondTitle: "Detayı Kaydet", secondBody: "Denizin sakinliği, rengi, kıyıya uzaklığın ve rüyadaki ilk duygun yorumu kişisel bağlama taşır.", cta: "Rüya sözlüğünde deniz maddesini aç", url: `${SITE}/tr/ruya-tabirleri`, asset: dream("sea"), symbols: { source: "dream", slugs: ["sea"] } },
  { day: 15, slug: "tarot-baslangic", title: "Tarot Sorusu Nasıl Kurulur?", subtitle: "Kesin cevap yerine farkındalık", body: "Tarot sorusunu 'ne olacak?' yerine 'bu konuda neyi görmem gerekiyor?' biçiminde kurmak yorumu daha işlevsel hale getirir.", secondTitle: "Tek Konu Seç", secondBody: "Aynı açılımda birbiriyle ilgisiz soruları çoğaltma. Bir konu, bir bağlam ve bir niyet yeterlidir.", cta: "Tarot kartları rehberini incele", url: `${SITE}/tr/tarot`, asset: tarot("the-high-priestess"), secondAsset: tarot("the-hermit") },
  { day: 16, slug: "burc-detaylari", title: "Burcunu Tek Cümleye Sığdırma", subtitle: "Profil + uyum + günlük akış", body: "Burç detay sayfasındaki genel çerçeveyi günlük yorum ve ilişki uyumu gibi farklı bağlamlarla birlikte değerlendir.", secondTitle: "12 Kombinasyona Geç", secondBody: "Her burç detayından o burcun 12 uyum kombinasyonuna ulaşabilir, iki profili yan yana okuyabilirsin.", cta: "12 burç rehberini aç", url: `${SITE}/tr/burclar`, asset: assets.sun, secondAsset: assets.synastry },
  { day: 17, slug: "ilk-dordun-hazirlik", title: "İlk Dördün: Niyeti Eyleme Çevir", subtitle: "Takvimde yer aç", body: "Yeniayda yazdığın niyeti bugün yapılabilir tek bir adıma çevir. Adımın küçük olması devamlılığı kolaylaştırır.", secondTitle: "15 Dakika Kuralı", secondBody: "Görevi 15 dakikada başlayabilecek hale getir ve takvimine belirli bir saat ekle.", cta: "Adımını yorumlara bir fiille yaz", url: `${SITE}/tr/blog`, asset: assets.moon, secondAsset: dream("road") },
  { day: 18, slug: "ilk-dordun-yay", title: "İlk Dördün Kontrolü", subtitle: "Ay Yay'da • 20°", body: "Motor çıktısı ilk dördünü Yay burcunda gösteriyor. Yeniay niyetini büyütmeden önce yönünü ve öğrendiğin bilgiyi kontrol et.", secondTitle: "Bir Kanıt Ara", secondBody: "İlerlemeni hisle değil, bu ay tamamladığın tek somut adımla değerlendir.", cta: "Kaydet • ay sonunda yeniden bak", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: assets.moon, secondAsset: assets.road, skyDate: "2026-09-18" },
  { day: 19, slug: "retro-ne-demek", title: "Retro Ne Demek?", subtitle: "Geri gitmek değil", body: "Retro, Dünya'dan bakıldığında gezegenin gökyüzünde geriye gidiyormuş gibi görünmesidir; değerlendirme ve gözden geçirme temasıyla okunur.", secondTitle: "Eylül Motor Çıktısı", secondBody: "Ayın bu bölümünde Satürn, Neptün, Uranüs ve Plüton retro listesinde. Yorumu kişisel harita bağlamından koparma.", cta: "Günlük gökyüzü içeriğini takip et", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: assets.natal, secondAsset: dream("stars"), skyDate: "2026-09-19" },
  { day: 20, slug: "iki-burc-profili", title: "Uyumdan Önce İki Profili Oku", subtitle: "Çapraz bağlantı rehberi", body: "Bir uyum metnini anlamanın en kolay yolu, önce iki burcun ayrı profil sayfalarındaki temel ihtiyaçları okumaktır.", secondTitle: "Dört Yola Devam Et", secondBody: "Uyum sayfasından iki profile, ilgili çiftlere ve tüm kombinasyonların bulunduğu merkeze geçebilirsin.", cta: "Merkezden çiftini seç", url: `${SITE}/tr/burclar/uyum`, asset: assets.synastry, secondAsset: assets.heart },
  { day: 21, slug: "fincanda-kus", title: "Fincanda Kuş Görmek", subtitle: "Sözlük kaynağından", body: "", secondTitle: "Konumunu da Oku", secondBody: "Sembolün fincanın ağız, orta ya da dip bölümünde oluşması zamanlama yorumunu değiştirebilir.", cta: "Kahve falı sembol rehberini aç", url: `${SITE}/tr/kahve-fali`, asset: coffee("bird"), symbols: { source: "coffee", slugs: ["bird"] } },
  { day: 22, slug: "terazi-sezonuna-gecis", title: "Ekinoks Öncesi Denge Kontrolü", subtitle: "Güneş yarın Terazi'ye geçiyor", body: "Motor çıktısı Güneş'in 23 Eylül'de Terazi burcuna geçtiğini gösteriyor. Bugün programındaki dengesiz yükleri fark et.", secondTitle: "Tek Bir Sınır", secondBody: "Bu hafta hangi isteğe hemen cevap vermek yerine düşünme payı bırakabilirsin?", cta: "Yarınki günlük gökyüzü notunu takip et", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: assets.sun, secondAsset: assets.libra, skyDate: "2026-09-23" },
  { day: 23, slug: "terazi-sezonu", title: "Güneş Terazi'de", subtitle: "Motor tarihi • 23 Eylül", body: "DaySky motoru Güneş'in bugün Terazi burcunda olduğunu gösteriyor. İlişkilerde karşılıklılık ve günlük dengeler üzerine not al.", secondTitle: "Denge Sorusu", secondBody: "Verdiğin emekle aldığın destek arasında hangi küçük ayar sana iyi gelir?", cta: "Burç detayını ve günlük yorumu birlikte oku", url: `${SITE}/tr/burclar/libra`, asset: assets.libra, secondAsset: assets.sun, skyDate: "2026-09-23" },
  { day: 24, slug: "dolunay-hazirlik", title: "Dolunay Öncesi Gözlem", subtitle: "Tamamlama listesini kısalt", body: "Ay boyunca tekrar eden tek konuyu seç. Dolunay öncesinde yeni hedef eklemek yerine görünür olanı adlandır.", secondTitle: "Üç Satırlık Not", secondBody: "Ne başladı, ne değişti, şimdi neyi bırakabilirsin? Her soruya yalnız bir cümle yaz.", cta: "26 Eylül dolunay rehberi için kaydet", url: `${SITE}/tr/gunluk-burc-yorumlari`, asset: dream("moon"), secondAsset: assets.road },
  { day: 25, slug: "tarot-iki-kart", title: "İki Kartı Birlikte Okumak", subtitle: "Başrahibe + Ermiş", body: "Kartları tek tek ezberlemek yerine aralarındaki ortak temayı, sorunun bağlamını ve ilk hissettiğin ayrıntıyı not et.", secondTitle: "Yorum Sınırı", secondBody: "Tarot kararı senin yerine vermez; seçeneklerini ve dikkat etmek istediğin temayı görünür kılabilir.", cta: "Tarot rehberindeki kartları incele", url: `${SITE}/tr/tarot`, asset: tarot("the-high-priestess"), secondAsset: tarot("the-hermit") },
  { day: 26, slug: "balik-dolunayi", title: "Balık Dolunayı: Yükselenine Göre Evler", subtitle: "29° • motor hesabı", body: "Dolunay Balık burcunda hesaplandı. Caption'daki ev dağılımından yükselenine göre hangi yaşam alanının vurgulandığını bul.", secondTitle: "Görünür Olanı Adlandır", secondBody: "Seçtiğin ev alanında bu ay tamamlanan, netleşen ya da bırakılabilecek tek konuyu yaz.", cta: "Yükselenini hesapla, sonra evini caption'da bul", url: `${SITE}/tr/yukselen-burc-hesaplayici`, asset: assets.moon, secondAsset: assets.natal, lunationDate: "2026-09-26", campaign: true },
  { day: 27, slug: "dolunay-sonrasi", title: "Dolunay Sonrası Not", subtitle: "Hemen karar vermek zorunda değilsin", body: "Dün görünür olan konuyu bugün yalnızca kaydet. Duygu sakinleştiğinde hangi adımın gerçekten gerekli olduğunu ayırmak kolaylaşır.", secondTitle: "24 Saatlik Alan", secondBody: "Notunu oku, gereksiz kesinlikleri sil ve geriye kalan tek uygulanabilir adımı seç.", cta: "Kişisel farkındalık notunu kaydet", url: `${SITE}/tr/blog`, asset: dream("moon"), secondAsset: dream("door") },
  { day: 28, slug: "ruyada-ev", title: "Rüyada Ev Görmek", subtitle: "Sözlükten sembol okuması", body: "", secondTitle: "Hangi Oda?", secondBody: "Evin eski ya da yeni oluşu, hangi odada bulunduğun ve oradaki duygu kişisel bağlamı belirler.", cta: "Rüya tabirleri sözlüğünde devam et", url: `${SITE}/tr/ruya-tabirleri`, asset: dream("house"), symbols: { source: "dream", slugs: ["house"] } },
  { day: 29, slug: "uc-buyuk", title: "Güneş, Ay ve Yükselen Farkı", subtitle: "Üç parçalı başlangıç", body: "Güneş, Ay ve yükselen aynı şeyi anlatmaz. Üçünü birlikte okumak tek burç etiketinden daha geniş bir çerçeve sağlar.", secondTitle: "Önce Hesapla", secondBody: "Doğum bilgilerini gir, üç sonucu kaydet ve her birinin açıklamasını ayrı ayrı oku.", cta: "Üç büyük hesaplayıcısını aç", url: `${SITE}/tr/uc-buyuk-hesaplayici`, asset: assets.natal, secondAsset: assets.sun, campaign: true },
  { day: 30, slug: "eylul-kapanis", title: "Eylül'den Yanına Ne Alıyorsun?", subtitle: "Ay sonu değerlendirmesi", body: "Ay başında seçtiğin niyete dön. Değişen davranışı, öğrendiğin bilgiyi ve Ekim'e taşımak istediğin tek adımı yaz.", secondTitle: "Üç Cümlede Kapat", secondBody: "Bıraktığım, öğrendiğim ve sürdüreceğim diye başlayan üç kısa cümle kur.", cta: "Bu gönderiyi kaydet • Ekim sonunda karşılaştır", url: `${SITE}/tr/blog`, asset: assets.door, secondAsset: assets.road },
];

const symbolConfig: Record<SymbolSource, { table: string; name: string; meaning: string; assetDir: string }> = {
  dream: { table: "dream_symbols", name: "name_tr", meaning: "meaning", assetDir: "backend/uploads/symbols/dream" },
  coffee: { table: "coffee_symbols", name: "name_tr", meaning: "meaning", assetDir: "backend/uploads/symbols/coffee" },
  tarot: { table: "tarot_cards", name: "name_tr", meaning: "upright_meaning", assetDir: "backend/uploads/tarot" },
};

async function db() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "goldmoodastro",
    charset: "utf8mb4",
  });
}

async function loadSymbols(symbols: SymbolSpec) {
  const cfg = symbolConfig[symbols.source];
  const conn = await db();
  try {
    const [rows] = await conn.execute(
      `SELECT slug, ${cfg.name} AS name, ${cfg.meaning} AS meaning FROM ${cfg.table} WHERE slug IN (${symbols.slugs.map(() => "?").join(",")})`,
      symbols.slugs,
    );
    const bySlug = new Map((rows as Array<{ slug: string; name: string; meaning: string }>).map((row) => [row.slug, row]));
    return symbols.slugs.map((slug) => {
      const row = bySlug.get(slug);
      if (!row) throw new Error(`${symbols.source}/${slug} sözlükte bulunamadı.`);
      const asset = path.resolve(ROOT, cfg.assetDir, `${slug}.png`);
      if (!existsSync(asset)) throw new Error(`Sembol görseli bulunamadı: ${asset}`);
      return { ...row, asset };
    });
  } finally {
    await conn.end();
  }
}

function symbolBody(facts: Array<{ name: string; meaning: string }>) {
  return facts.map((fact) => `${fact.name}: ${fact.meaning.trim().replace(/\.$/, "")}.`).join(" ");
}

async function lunationBlock(date: string) {
  const sky = await getDaySky(date);
  const rows = houseMapByRising(sky.moon.sign).map(
    (row) => `• ${row.risingSigns.map((sign) => SIGN_TR[sign]).join(", ")} yükselen → ${row.house}. ev: ${row.area}`,
  );
  return [
    `🌙 ${MOON_PHASE_TR[sky.moonPhase]} • ${SIGN_TR[sky.moon.sign]} ${sky.moon.degree.toFixed(0)}° (${date})`,
    "",
    "Yükselenine göre ev dağılımı:",
    ...rows,
  ].join("\n");
}

function assertDerived(spec: Spec) {
  const signs = ["Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak", "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"];
  const combined = `${spec.title} ${spec.subtitle} ${spec.body} ${spec.secondBody}`;
  const mentioned = signs.filter((sign) => new RegExp(`(?<!\\p{L})${sign}(?!\\p{L})`, "u").test(combined));
  const factualEducation = ["burç uyumu", "iki burç", "burcun", "burç detay", "yükselen burç", "yükselen yaklaşık", "Güneş, Ay ve yükselen"];
  const isEducational = factualEducation.some((phrase) => combined.toLocaleLowerCase("tr").includes(phrase.toLocaleLowerCase("tr")));
  if (mentioned.length && !spec.lunationDate && !spec.skyDate && !isEducational) {
    throw new Error(`${spec.day}/${spec.slug}: burç iddiası motor tarihine bağlı değil: ${mentioned.join(", ")}`);
  }
}

async function build() {
  const posts: DraftPost[] = [];
  for (const spec of specs) {
    assertDerived(spec);
    const facts = spec.symbols ? await loadSymbols(spec.symbols) : null;
    const body = facts ? symbolBody(facts) : spec.body;
    const firstAsset = facts?.[0]?.asset ?? spec.asset;
    const secondAsset = facts?.[1]?.asset ?? spec.secondAsset ?? firstAsset;
    const sky = spec.lunationDate
      ? `\n\n${await lunationBlock(spec.lunationDate)}`
      : spec.skyDate
        ? `\n\n🔭 Motor çıktısı: ${describeDaySky(await getDaySky(spec.skyDate))} (${spec.skyDate})`
        : "";
    const caption = `${spec.title} ✨\n\n${body}${sky}\n\n${spec.cta}\n\n🔗 ${spec.url}\n\n${TAGS}`;
    const risky = findRiskyTopics(`${caption}\n${spec.secondBody}`);
    if (risky.length) throw new Error(`${spec.day}/${spec.slug}: riskli içerik: ${JSON.stringify(risky)}`);
    const cover: Slide = {
      title: spec.title,
      kicker: "EYLÜL 2026",
      subtitle: spec.subtitle,
      body,
      asset: firstAsset,
      variant: spec.campaign ? "gold" : "deep",
      footer: spec.cta,
    };
    posts.push(await carousel(spec.day, spec.slug, spec.title, [
      cover,
      { title: spec.secondTitle, kicker: "EYLÜL 2026", subtitle: spec.subtitle, body: spec.secondBody, asset: secondAsset, variant: spec.campaign ? "violet" : "gold", footer: spec.cta },
    ], caption, spec.campaign ? "kampanya" : "etkilesim", CONTEXT));
    posts.push(await story(spec.day, `${spec.slug}-cta`, spec.cta, {
      ...cover,
      kicker: "STORY • EYLÜL 2026",
      body: spec.cta,
      footer: spec.url,
    }, CONTEXT));
  }
  return posts;
}

async function persist(posts: DraftPost[]) {
  const conn = await db();
  try {
    const [existing] = await conn.execute(
      "SELECT COUNT(*) AS count FROM social_posts WHERE sub_type=? AND scheduled_at >= '2026-09-01' AND scheduled_at < '2026-10-01' AND source_ref NOT LIKE 'september-2026:%'",
      [TENANT],
    );
    const foreignCount = Number((existing as Array<{ count: number }>)[0]?.count ?? 0);
    if (foreignCount) throw new Error(`Eylül'de başka kaynaktan ${foreignCount} kayıt var; otomatik yazma durduruldu.`);
    for (const post of posts) {
      const day = Number(post.sourceRef.split(":")[1]);
      const isStory = post.sourceRef.includes(":story:");
      const scheduledAt = `2026-09-${String(day).padStart(2, "0")} ${isStory ? "16:00:00" : "10:00:00"}`;
      await conn.execute("DELETE FROM social_posts WHERE sub_type=? AND source_ref=? AND status IN ('draft','scheduled')", [TENANT, post.sourceRef]);
      await conn.execute(
        `INSERT INTO social_posts (uuid,post_type,sub_type,title,caption,hashtags,image_url,media_urls,platform,status,scheduled_at,source_type,source_ref,ai_generated,created_by,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,CAST(? AS JSON),?,'scheduled',?,'manual',?,0,'codex-september-2026',?,NOW(3),NOW(3))`,
        [randomUUID(), post.postType, TENANT, post.title, post.caption, TAGS, post.imageUrl ?? null, JSON.stringify(post.mediaUrls ?? []), post.platform, scheduledAt, post.sourceRef, post.notes],
      );
    }
  } finally {
    await conn.end();
  }
}

async function writeManifest(posts: DraftPost[]) {
  const dir = path.resolve(ROOT, "references/monthly-content/2026-09");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "09-01-30-drafts.json"), JSON.stringify(posts, null, 2));
}

async function main() {
  if (specs.length !== 30 || new Set(specs.map((spec) => spec.day)).size !== 30) throw new Error("Eylül planı 30 benzersiz gün içermeli.");
  await fs.mkdir(OUT_DIR, { recursive: true });
  const posts = await build();
  await writeManifest(posts);
  if (WRITE_DB) await persist(posts);
  console.log(`Hazır: ${posts.length} kayıt (30 ana + 30 story)`);
  console.log(`Görseller: ${OUT_DIR}`);
  console.log(`Manifest: references/monthly-content/2026-09/09-01-30-drafts.json`);
  console.log(WRITE_DB ? "DB: Eylül kayıtları zamanlandı." : "DB: yazılmadı; --db ile zamanlanır.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
