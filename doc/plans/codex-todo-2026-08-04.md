# GoldMoodAstro — Codex Yapılacaklar Çeklisti (2026-08-04)

> Kaynak: 2026-08-01→04 Claude Code oturumu. Aşağıdakiler **açık kalan** işler.
> Tamamlananlar hariç tutuldu (SW v4, ZodError→400, health-check, jenerik kapak,
> tarot/sembol fix'leri, hafta-1 içerik zamanlama vb. **bitti**).
> Her madde: **ne / dosya / kabul kriteri / kim**.
> Görsel/içerik üretiminde ZORUNLU: `social_content_quality_rules` kuralları
> (asset tipi tutarlılığı, app-screenshot≠sembol, tarot açık-yüz+element, kontrast,
> tek-burç kapak yasağı, üretimden sonra GÖRSELİ gözle doğrula).

---

## A. KRİTİK / ALTYAPI

### [x] A1. nginx `/uploads/` cache: `immutable` → `must-revalidate`  · [ops/server]
- **Ne:** `/etc/nginx/sites-available/goldmoodastro.conf` içinde `location /uploads/`
  bloğu `add_header Cache-Control "public, immutable"; expires 30d;` gönderiyor.
  Görsel yerinde güncellenince tarayıcı/Meta 30 gün eskiyi gösteriyor (biz `?v=`
  ile geçici çözdük). Kök çözüm: `must-revalidate`.
- **Yap:** o bloğu `expires 1h; add_header Cache-Control "public, must-revalidate";`
  yap. `/_next/static/` bloğuna DOKUNMA (o gerçekten immutable, hash'li).
- **Kabul:** `curl -I .../uploads/social/<bir gorsel>.png` → `Cache-Control` içinde
  `immutable` YOK. `nginx -t` OK + `systemctl reload nginx`.
- **Tamamlandı (2026-08-04):** `expires 1h` + `public, must-revalidate`; `nginx -t`,
  reload ve canlı header kontrolü geçti. Önceki config `.bak-20260804` olarak yedeklendi.

### [x] A2. Backend bellek limitini çalışan process'e uygula  · [ops/server]
- **Ne:** `backend/ecosystem.config.cjs` `max_memory_restart: '768M'` yapıldı ama
  çalışan process eski runtime'da. `pm2 reload <name>` bu değeri RE-READ etmiyor.
- **Yap:** bakım penceresinde `pm2 restart /var/www/goldmoodastro/backend/ecosystem.config.cjs --only goldmoodastro-backend` (≈5 sn kesinti).
- **Kabul:** `pm2 describe goldmoodastro-backend` → memory limit 768M; uptime sıfırlanmış.
- **Tamamlandı (2026-08-04):** process ecosystem dosyasından restart edildi;
  `max memory restart=805306368`, yeni uptime ve API listen/health logları doğrulandı.

### A3. VPS aralıklı erişilemezlik  · [ops — kod değil]
- **Ne:** Deploy'larda tekrarlayan `dial tcp :22 i/o timeout` + health-check'te
  08:46/22:29 kısa FAIL'ler = VPS ara sıra anlık düşüyor (host/ağ seviyesi).
- **Yap:** Hostinger'a ağ kesintisi bildir / kaynak (RAM-CPU) yükselt veya 2. instance
  + nginx failover değerlendir. **Karar Orhan'da** — Codex uygulamaz, sadece not.
- **Durum (2026-08-04):** Orhan'ın sağlayıcı/yükseltme/failover kararı bekleniyor.

---

## B. BİLDİRİM / İZLEME

### [x] B1. Telegram uyarı secret'ları  · [Orhan — secret değeri gerekli]
- **Ne:** `health-check.yml` Telegram'a atmaya hazır ama secret yok.
- **Yap:** `gh secret set TELEGRAM_BOT_TOKEN` + `gh secret set TELEGRAM_CHAT_ID`
  (goldmoodastro repo). Token @BotFather'dan veya mevcut haldefiyat botundan; chat_id
  `api.telegram.org/bot<TOKEN>/getUpdates`'ten.
- **Kabul:** bir FAIL run'ı Re-run → Telegram mesajı gelir.
- **Tamamlandı (2026-08-04):** `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID`, haldefiyat
  backend env'inden değerler loglanmadan GitHub repository secret'larına aktarıldı.
  Kasıtlı üretim FAIL'i oluşturulmadı.

---

## C. SOSYAL İÇERİK (asıl büyük iş)

### [x] C1. Ağustos 2-4. hafta ek içerikleri (8–31 Ağustos)  · [Codex]
- **Ne:** Aylık plan `reports/GoldMoodAstro-Agustos-2026-Icerik-Plani.md`'de 31 günün
  tamamı tanımlı ama SADECE 1. hafta (1–7 Ağu) üretildi + zamanlandı. 8–31 Ağustos
  ek içerikleri (yeniay/güneş tutulması kampanyası 12 Ağu, dolunay/ay tutulması 28 Ağu,
  sinastri, tarot, spiritüel semboller, rüya, mizah reel, danışman tanıtımı 16 Ağu) YOK.
- **Yap:** `scripts/prepare-august-2026-week1-extra-drafts.ts`'i şablon alarak 2-4. hafta
  script(ler)ini yaz; aynı render altyapısı (`renderSlide`, palette, asset objesi).
  Plan takvimindeki her günün "Ek ana içerik" + "Story" sütununu üret. `--db` ile
  taslak yaz, sonra plana göre zamanla (ana 13:00 TR, story 19:00 TR — bkz
  `scripts/schedule-august-week1-extra.ts`).
- **KURAL:** her carousel tek tür asset (tarot→`backend/uploads/tarot/*` açık yüz,
  zodiac→`zodiac/*`, sembol→`symbols/*`). `features/*` (natal/synastry/daily) = app
  mockup, SEMBOL OLARAK KULLANMA. Kapak jenerik (tek burç değil). Kontrast: koyu tema
  + açık metin, brightness 0.58. **Üretince her carousel'den 1-2 slaytı gözle doğrula.**
- **Kabul:** 8–31 Ağustos için taslaklar DB'de, plana göre zamanlı; admin "Yaklaşan
  İçerikler"de burç + ek içerik + story birlikte; görseller tutarlı (gözle doğrulandı).
- **Tamamlandı (2026-08-04):** `prepare-august-2026-weeks2-4-extra.ts` ile 24 ana
  içerik + 24 story üretildi ve 13:00/19:00 TR zamanlarına alındı. DB: 48/48
  `scheduled`; iki reel MP4. Her ana içeriğin kapak ve ikinci slaytı contact sheet ile
  gözle doğrulandı; placeholder/kesik medya görülmedi.

### [x] C2. Videosuz 2 reel  · [Codex + Orhan(video)]
- **Ne:** `august-2026-extra:03:reel:weekly-energy` (id 607) ve
  `:07:reel:libra-decision-humor` (id 611) videosuz olduğu için taslakta duruyor
  (reel MP4 gerektirir).
- **Yap:** MP4 üret/ekle (public URL, `.mp4`), postun `media_urls`'ına koy, zamanla.
  Video yoksa Orhan'dan iste.
- **Kabul:** iki reel `scheduled`; `media_urls` bir `.mp4` içeriyor.
- **Tamamlandı (2026-08-04):** iki MP4 canlı URL'de 200 dönüyor ve iki DB kaydı da
  `scheduled`. Tarihi geçen 3 Ağustos içeriği en yakın kuyruğa, 7 Ağustos içeriği
  plana uygun 13:00 TR'ye alındı.

---

## D. SEO (zamana bağlı)

### D1. GSC 7/14/28. gün karşılaştırması  · [Codex — takvimli]
- **Ne:** Gün-0 baseline var (`doc/plans/gsc-tracking/day-00-baseline-2026-07-31.json`),
  günlük snapshot cron biriktiriyor (`backend/var/gsc-history.ndjson`).
- **Yap:** 7 (2026-08-07) / 14 (08-14) / 28 (08-28) günlerinde snapshot al
  (`bun run scripts/gsc-snapshot.ts`), Gün-0 ile karşılaştır, `doc/plans/gsc-tracking/day-NN-*.json`
  kaydet. İstenirse otomatik karşılaştırma raporu üreten küçük script yaz.
- **Kabul:** dupCanonical 41→?, totalUrls 303→~159, impressions/position trendi raporlu.
- **Durum:** takvim bekleniyor; bugün 2026-08-04. İlk kabul ölçümü 2026-08-07'de.

### D2. İç link / backlink fazı  · [sinyaller oturunca]
- **Ne:** SEO checklist H son maddesi. Teknik sinyaller stabil olunca (dupCanonical~0,
  totalUrls~159) pozisyon 5–17 sayfalarına iç link + backlink.
- **Kabul:** pozisyon 5–17 sayfalarına iç link haritası + uygulama.
- **Durum:** D1 sinyallerinin stabil olması bekleniyor; bugün başlanmadı.

---

## E. OPSİYONEL / İYİLEŞTİRME

- **E1.** Gereksiz: A1 tamamlandı.
- **E2.** Backend malformed-query robustluğu artık 400 (bitti) — regresyon testi eklenebilir.

---

### Referans dosyalar
- Aylık plan: `reports/GoldMoodAstro-Agustos-2026-Icerik-Plani.md`
- Hafta-1 şablonu: `scripts/prepare-august-2026-week1-extra-drafts.ts` + `scripts/schedule-august-week1-extra.ts`
- SW: `frontend/public/sw.js` (v4, network-first — DOKUNMA gerekmiyor)
- Health-check: `.github/workflows/health-check.yml` + `scripts/site-health-check.sh`
- Kalite kuralları (hafıza): `social_content_quality_rules`, `api_error_handler_order`
