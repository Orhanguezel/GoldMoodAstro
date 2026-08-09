# BRIEF — Önümüzdeki hafta sosyal içerik: planla + oluştur + eksikleri tamamla

> Hazırlayan: Claude (2026-08-09 oturumu). Uygulayan: yeni temiz oturum.
> Amaç: önümüzdeki haftanın (öncelik **Aug 10–16**, sonra Aug 17–24 / Eylül'e hazırlık)
> sosyal medya içeriğinin TAM olduğunu doğrula, EKSİK/BOZUK olanı yeniden üret, prod'a
> deploy et, ekosisteme re-sync ettir.

---

## 0) Bugünkü DURUM (bu oturumda tespit + düzeltildi)

- **August içerik planı EKSİKSİZ:** `reports/GoldMoodAstro-Agustos-2026-Icerik-Plani.md`
  (1–31 Ağustos tablosu: her gün günlük burç carousel + 1 ek ana içerik + story/CTA).
- **Her gün 4 post zamanlı:** 2 günlük burç carousel (part1 Koç–Başak / part2 Terazi–Balık)
  + 1 ana ek içerik (`august-2026-extra:GÜN:slug`) + 1 story-cta (`...:story:slug-cta`).
- **Aug 10–16 TAMAMEN zamanlanmış + görselli** (bu oturumda 110 görsel FORCE_REGEN ile
  yenilendi, metin baked, prod'a rsync'lendi, ekosistem re-sync edildi, media_urls `?v=2`
  cache-bust'landı). Günlük burç Aug 17'ye kadar cron'la planlı (2/gün).
- **Yani içeriğin ÇOĞU mevcut.** Bu brief'in işi: (a) DOĞRULA, (b) eksik/bozuk varsa YENİDEN
  ÜRET, (c) istenirse Eylül'e / sonraki haftaya UZAT.

> ⚠️ Bu oturumda çözülen kök sorun: eski görseller (4 Ağustos üretimi) BOŞ metinle (metin
> kutusu + CTA boş) üretilmişti; `renderSlide`'daki `existsSync` cache'i düzelmeyi engelliyordu.
> `FORCE_REGEN=1` ile aşıldı. Yeni görsel üretirken bu tuzağı unutma. Detay: memory
> [[social_card_empty_text_existssync]].

---

## 1) İÇERİK ÜRETİM ALTYAPISI (kritik — önce oku)

### Scriptler (repo kökünden, `bun run`)
- `scripts/prepare-august-2026-week1-extra-drafts.ts` — gün 1–7 + moon fazları/tarot/numeroloji
  temaları. `import.meta.main` → doğrudan çalışınca kendi main()'i döner. `renderSlide`, `carousel`,
  `story`, `reel`, `overlaySvg`, `Slide` tipi BURADA (weeks2-4 bunları import eder).
- `scripts/prepare-august-2026-weeks2-4-extra.ts` — gün 8–31. `specs[]` dizisi:
  `{ day, slug, title, subtitle, body, cta, asset, secondAsset?, reel?, campaign? }`.
  Her spec → 1 ana carousel (veya reel) + 1 story-cta üretir (satır ~54-60).
- `scripts/prepare-august-2026-social-drafts.ts` — ORİJİNAL, AYRI dizin (`august-2026-v2`).
  Video/mp4 reel üretimi burada.

### Görsel dizini + üretim
- Çıktı: `backend/uploads/social/august-2026-week1-extra-v3/` (week1-extra + weeks2-4 aynı dizine yazar).
- `renderSlide(fileName, slide, size)` — sharp + SVG ile metni GÖRSELE basar (başlık/alt başlık/
  gövde/footer/CTA). `overlaySvg` metni, `artFrameSvg` kutu+pill'i çizer.
- **CACHE TUZAĞI:** `renderSlide` satır ~283 `if (!process.env.FORCE_REGEN && existsSync(...)) return`.
  → var olan görseli YENİDEN üretmek için **`FORCE_REGEN=1`** ŞART.
- **DB yazma:** scriptler `--db` flag'iyle `social_posts`'a INSERT eder (scheduled). `--db` YOKSA
  sadece görsel üretir (DB'ye dokunmaz). Yeni içerik zamanlamak için `--db` gerekir.
- Görsel doğrulama: PNG'yi **Read tool ile AÇ** (görüntüle) — başlık+alt başlık+gövde+CTA baked mi?

### Günlük burç carousel (AYRI — otomatik)
- `backend/src/cron/social-horoscope.ts` — her gün 2 carousel (part1/part2) planlar, 06:00 UTC.
  İçerik `horoscope-job.ts` (LLM, 02:00) → `daily_horoscopes` tablosundan. Görseller
  `uploads/social/daily-horoscope-all/`. Bu OTOMATİK; elle üretme (cron hallediyor).

### Deploy + yayın akışı
- Görseller `backend/uploads/`'ta → **deploy uploads'ı SENKRONLAMAZ** ([[deploy_uploads_gap]]).
  Elle rsync: `rsync -az backend/uploads/social/august-2026-week1-extra-v3/ goldmoodastro:/var/www/goldmoodastro/backend/uploads/social/august-2026-week1-extra-v3/`
- **Yayını goldmood kendi cron'u yapar** (`social-queue` → `publishPost` → IG/FB, goldmood token'ı).
  Ekosistem YALNIZ okur+analiz (çift-post yok — bu oturumda teyit). [[ext_api_ecosystem_hybrid]]
- Görsel değişince ekosisteme "**re-sync et**" de (content_catalog güncellensin). Peer oturumu:
  `ekosistem-sosyal-medya` (ListAgents ile bul). Aynı URL + mtime değişince nginx yeni sunar;
  tarayıcı cache'i için media_urls'e `?v=N` cache-bust ekle (bu oturumda `?v=2` yapıldı).

---

## 2) TEMİZ OTURUMUN YAPACAKLARI (adım adım)

### A. Doğrula (önümüzdeki hafta — Aug 10–16, sonra 17–24)
1. DB'de zamanlı postları çek:
   `SELECT DATE(scheduled_at), source_ref, post_type, LEFT(image_url,80) FROM social_posts
    WHERE scheduled_at BETWEEN '2026-08-10' AND '2026-08-25' ORDER BY scheduled_at;`
   Plan (.md tablosu) ile karşılaştır — her gün 4 post var mı (2 burç + 1 ana + 1 story)?
2. Her ana/story görselini **Read ile aç**, metin baked mi kontrol et (BOŞ olan var mı?).
   Özellikle reel günleri (plan: 3,7,13,21,28) — reel .mp4 var mı (`social-drafts.ts` üretir)?

### B. Eksik/bozuk varsa YENİDEN ÜRET
- Görsel bozuk/boşsa: `FORCE_REGEN=1 bun run scripts/prepare-august-2026-weeks2-4-extra.ts`
  (gün 8–31) ve/veya `FORCE_REGEN=1 bun run scripts/prepare-august-2026-week1-extra-drafts.ts`.
  → **`--db` OLMADAN** çalıştır (yalnız görsel; scheduled kayıtları bozma). Sonra rsync + re-sync.
- Post hiç zamanlanmamışsa (DB'de yok): scripti **`--db` ile** çalıştır (INSERT scheduled).
  DİKKAT: weeks2-4 `persist()` önce aynı sourceRef'i DELETE edip INSERT eder (idempotent) —
  yani `--db` çift kayıt yapmaz. Ama önce mevcut scheduled'ları kontrol et.
- Yeni görselleri **Read ile doğrula** → prod'a rsync → ekosisteme re-sync.

### C. Uzatma (istenirse — Eylül / sonraki hafta)
- Plan Aug 31'de bitiyor ("Eylül'e hazırlık"). Kullanıcı Eylül isterse:
  `reports/`'a Eylül planı .md yaz (August tablosunun aynı yapısı) → yeni bir
  `prepare-september-2026-*.ts` script (weeks2-4'ün specs desenini kopyala, tarih/tema güncelle,
  OUT_DIR = `august-2026-week1-extra-v3` DEĞİL, yeni `september-2026-v1` dizini) → görsel üret
  (FORCE değil, yeni dosyalar) → **Read ile doğrula** → `--db` ile zamanla → rsync → re-sync.
- Eylül gökyüzü tarihlerini araştır (yeniay/dolunay/tutulma/retro) — planın omurgası bu.

### D. Kalite kontrol (memory [[social_content_quality_rules]])
- Asset tipi tutarlılığı (app-screenshot ≠ sembol), tarot açık-yüz + element, kontrast,
  TEK-BURÇ kapak YASAĞI (günlük burç kapağı tüm burçları temsil etmeli), üretimden sonra
  GÖRSEL doğrulama (Read ile aç). Metin kalitesi: yazım/tutarlılık/doğru burç-tarih.

---

## 3) KOORDİNASYON + REFERANSLAR

- **Ekosistem oturumu** (`ekosistem-sosyal-medya`, ListAgents): görsel/plan değişince "re-sync et"
  de. O sadece analiz + manuel paylaşım kaynağı (çift-post yok). Secret'ları kanaldan gönderme.
- **Plan:** `reports/GoldMoodAstro-Agustos-2026-Icerik-Plani.md` (+ PDF/HTML), strateji:
  `reports/GoldMoodAstro-Sosyal-Medya-Stratejisi-Fatma-Guclu.*`
- **Manifestler:** `references/monthly-content/2026-08/*.json|md` (script çıktıları).
- **Memory'ler:** [[social_card_empty_text_existssync]] (FORCE_REGEN), [[social_content_quality_rules]],
  [[social_daily_horoscope_carousel]], [[social_cron_single_source]], [[deploy_uploads_gap]],
  [[ext_api_ecosystem_hybrid]], [[next_route_delete_clean_build]] (admin build kapasite).
- **Deploy notu:** admin build server RAM sınırında eksik çıkabiliyor; içerik işi çoğunlukla
  backend/scripts + uploads (admin build gerekmez). Backend değişirse manuel deploy
  (`git pull && bun run build && pm2 reload goldmoodastro-backend`).

---

## 4) ÖZET — temiz oturuma tek cümle
"August planı (reports/) eksiksiz ve Aug 10–16 zamanlı+görselli (bu oturumda düzeltildi).
Sen: önümüzdeki haftayı DOĞRULA (her post'un görselini Read ile aç, boş/eksik var mı),
eksik/bozuğu FORCE_REGEN (görsel) / --db (zamanlama) ile YENİDEN ÜRET, rsync + ekosistem
re-sync yap. Kullanıcı Eylül'e uzatmak isterse yeni ay planı + scripti aynı desenle kur."
