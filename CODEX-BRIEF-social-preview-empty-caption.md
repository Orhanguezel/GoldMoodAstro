# CODEX BRIEF — Sosyal önizlemede caption BOŞ + içerik kalite gözden geçirme

> Hazırlayan: Claude (mimari/lokalizasyon). Uygulayan: Codex.
> Bağlam: GoldMoodAstro admin sosyal medya modülü. Bu bileşen ekosistem-sosyal-medya
> reposunda da KOPYA olarak var; aynı bug iki tarafta. Bu brief goldmood kopyası içindir.

---

## GÖREV 1 — /admin/social/[platform] önizlemesinde caption/içerik BOŞ

### Semptom
`admin.goldmoodastro.com/admin/social/instagram` (ve facebook) — bir post önizleme
modalında **GÖRSEL geliyor ama caption/içerik metni BOŞ** (gold/mor kozmik temalı modal;
üstte görsel = dream-sea altın dalga, altında boş metin kutuları). Kullanıcı 2 ekran
görüntüsü verdi (biri ekosistem sosial.tarvista.com, biri goldmood admin — AYNI bileşen).

### KANITLANMIŞ — bu bir RENDER bug'ı, veri eksikliği DEĞİL (çok önemli)
- Goldmood `social_posts` verisi %100 dolu: `/api/ext/social/content-catalog`'da 73 postun
  caption'ı boş olan **0**; blog body/excerpt boş **0**. Yani caption verisi VAR.
- Aynı içerik Telegram grubunda DOLU görünüyor ("Rüyada Su veya Deniz Görmek ✨...").
- → Önizleme/render katmanında caption bind edilmiyor. Backend'de caption'ı doldurmaya çalışma;
  veri zaten dolu.

### Dosyalar
- Route: `admin_panel/src/app/(main)/admin/(admin)/social/[platform]/_components/platform-client.tsx`
  → instagram/facebook için `<SocialPlatformPage platformKey="..." />` render eder (tiktok → TikTokSandboxPage).
- **Ana bileşen:** `admin_panel/src/ekosistem/components/social/SocialPlatformPage.tsx` (~1679 satır).
  - Kendi postları: `posts.list(...)` → `createdPosts` + `scheduledPosts` (satır ~312-313). Bunlarda `p.caption` dolu.
  - Canlı platform postları: `accountItems` (state ~183, render ~1018). Caption olarak `m.message` kullanıyor (satır ~1035: `{m.message || "(açıklama yok)"}`).
  - Önizleme modalları: `previewImage` (satır ~1552, SADECE görsel, caption yok) ve `previewGallery` (satır ~1580, görsel + `g.title` + thumbnail). `g.title = p.caption || p.title` (satır ~255).

### Codex adımları
1. **Modalı reprodüksiyon et:** uygulamayı çalıştır, `/admin/social/instagram`'a git, bir post önizlemesini aç. React DevTools ile HANGİ bileşen/state olduğunu belirle (previewImage / previewGallery / accountItems kartı / başka). NOT: ekran görüntüsündeki gold-temalı modal + boş metin kutuları yukarıdaki iki slate-temalı modalla TAM eşleşmiyor olabilir — gerçek DOM'u incele.
2. **Caption neden boş, üç hipotez — hangisi olduğunu bul:**
   - (a) **Canlı IG fetch `message` getirmiyor:** goldmood backend'in canlı-post/insights fetch'i Instagram Graph'tan `caption` alanını istemiyor olabilir → `m.message` boş → "(açıklama yok)". Backend: `backend/src/social/modules/platforms/instagram.ts` + `posts/insights.ts` (Graph `fields=` parametresine `caption` ekli mi?).
   - (b) **Önizleme modalı caption bind etmiyor:** previewImage caption'ı hiç göstermiyor (tasarım); previewGallery yalnız `title` gösteriyor. Kullanıcının gördüğü boş kutular caption için ama modal onu render etmiyor olabilir.
   - (c) **Alan adı uyuşmazlığı:** kendi postlarında `caption`, canlı postlarda `message`, API'de `content` — önizleme yanlış alanı okuyor olabilir.
3. **Düzelt:** önizleme modalı caption'ı DOĞRU alandan (`caption ?? message ?? content`) okuyup GÖSTERSİN. Canlı IG için (a) doğrulanırsa Graph fetch'ine `caption` field'ını ekle.

### Kabul kriteri
- `/admin/social/instagram` + `/admin/social/facebook` önizlemesinde post caption'ı DOLU görünür (kendi postları için kesin; canlı IG postları için Graph `caption` döndürüyorsa).
- Boş caption'da "(açıklama yok)" fallback'i kalır ama data dolu olduğu için görünmemeli.

---

## GÖREV 2 — İçerik kalite gözden geçirme ("içeriklerde hatalar var")

Kullanıcı üretilen sosyal içerikte (günlük burç + fal metinleri) hatalar olduğunu söyledi.
- Kaynak: günlük burç `backend/src/cron/social-horoscope.ts` (caption üretimi) + `horoscope-job.ts`
  (LLM burç yorumu) + fal içerikleri (`horoscopes/tarot/coffee/dreams` modül seed'leri).
- İçerik kalite kuralları hafızada: asset tipi tutarlılığı, tarot açık-yüz+element, kontrast,
  tek-burç kapak yasağı, üretimden sonra GÖRSEL doğrulama.
- **Codex:** üretilen son ~20 postun caption'larını + tema metinlerini incele, somut hataları
  (yazım, tekrar, tutarsızlık, yanlış burç/tarih) listele. Kullanıcıdan ÖRNEK hata istenmeli
  (hangi tip hata: metin mi, görsel mi, eşleşme mi) — sonra düzelt. Prod DB içeriğini seed
  ON DUPLICATE ile EZME (bkz workspace kuralı: kullanıcı içeriğini overwrite etme).

---

## Notlar (Codex için)
- Bu bileşen ekosistem reposunda da KOPYA → orada da aynı fix gerekebilir (ayrı oturum halleder).
- Prod deploy: kapasite sınırında; admin build eksik çıkabiliyor → `scripts/vps-deploy.sh`
  build doğrulaması yapıyor. Route dizini eklemedin/silmediysen incremental sorun yok.
- Test: değişiklikten sonra `admin_panel` `bun run typecheck` + UI'da önizlemeyi görsel doğrula.
