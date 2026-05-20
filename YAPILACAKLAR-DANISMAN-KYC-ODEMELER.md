# YAPILACAKLAR — Danışman Profili: Uzmanlık + Dil + KYC + Ödeme + Komisyon

> Oluşturulma: 2026-05-20. Sahip: Claude Code (mimar).
> Uygulama: Codex (backend + şema), Antigravity (UI). Deploy: Claude.
> Roadmap: bu dosya kökte tutulur ki unutulmasın; bitince `doc/`'a taşı.

---

## A — Uzmanlık Alanları (`consultants.expertise`) — DB-driven yap

**Sorun:** Şu an chip'lerde Astroloji, Doğum Haritası, Tarot vb. **+ "Kahve Falı, Ruhsal Rehberlik, Rüya Tabiri, Enerji Şifası"** seçenekleri serbestçe gösteriliyor. Liste hardcoded olabilir veya `service_categories` ile tam senkron değil.

- [x] **A1 — Şema check (Claude):** Audit query hazır (2026-05-20 Claude). Deploy sonrası prod'da koşulup A4 ile birlikte raporlanacak:
  ```sql
  SELECT JSON_UNQUOTE(JSON_EXTRACT(c.expertise, CONCAT('$[', idx.n, ']'))) AS slug,
         COUNT(*) AS cnt,
         (SELECT COUNT(*) FROM service_categories sc
           WHERE sc.slug = JSON_UNQUOTE(JSON_EXTRACT(c.expertise, CONCAT('$[', idx.n, ']')))) AS is_known
    FROM consultants c
    JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
          UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) idx
      ON JSON_EXTRACT(c.expertise, CONCAT('$[', idx.n, ']')) IS NOT NULL
   WHERE c.expertise IS NOT NULL
   GROUP BY slug
   ORDER BY is_known ASC, cnt DESC;
  ```
  `is_known = 0` olan satır orphan (service_categories'de eşleşeni yok).
- [x] **A2 — UI sadece DB'den (Antigravity):** `ProfilePanel`'de `useListServiceCategoriesPublicQuery()` zaten kullanılıyor — fallback hardcoded `expertiseOptions` (BecomeConsultantPage'deki `EXPERTISE_OPTIONS`) **kaldırılsın**; serviceCategories boş ise "Yükleniyor…" göster, hardcoded liste hiç render edilmesin.
- [x] **A3 — Backend validation (Codex):** PATCH `/me/consultant` body'de `expertise` her elemanı `service_categories.slug` whitelist'inde olmalı. Yoksa 400. — Codex: aktif `service_categories.slug` whitelist + `invalid_expertise_slug` 400 eklendi.
- [x] **A4 — Mevcut data migration (Claude):** 2026-05-20 Claude — prod audit koşuldu, orphan **YOK**: 10 distinct slug (astrology×7, relationship/birth_chart/numerology/tarot/mood×3, career×2, spiritual_guidance/dream_interpretation/coffee×1) hepsi `service_categories.slug` whitelist'inde (`is_known=1`). Migration gerekmiyor; A3 backend validation mevcut veri için temiz.
- [x] **A5 — Min/max count (Codex):** En az 1, en çok 8 uzmanlık seçilebilir kuralı. — Codex: PATCH ve consultant register validasyonunda `min(1).max(8)`.
- [x] **A6 — Become-consultant başvuru formu (Antigravity):** `BecomeConsultantPage` `EXPERTISE_OPTIONS` da DB'den çekilsin (aynı `useListServiceCategoriesPublicQuery`). Hardcoded array kaldırılsın.

---

## B — Diller — DB-driven + tam adlı görünüm

**Sorun:** Chip'lerde "tr", "en" slug'ları görünüyor; "+Türkçe", "+İngilizce" alt linkler var. Tutarsız. Hardcoded array `[tr, en, de, fr]`.

- [x] **B1 — Şema (Claude):** Yeni tablo veya site_settings:
  ```sql
  CREATE TABLE languages (
    id CHAR(36) PRIMARY KEY,
    slug VARCHAR(8) UNIQUE,         -- tr, en, de, fr, …
    name_tr VARCHAR(50),             -- Türkçe
    name_en VARCHAR(50),             -- Turkish
    name_de VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active TINYINT DEFAULT 1
  );
  ```
  Seed: tr/en/de/fr (gerekirse + ru, ar, es). Locale'e göre name görünür. — Codex: `032d_languages_schema.sql` ile tablo + tr/en/de/fr/ru/ar/es seed eklendi.
- [x] **B2 — Backend (Codex):** `GET /languages` public endpoint + admin CRUD `/admin/languages`. — Codex: shared-backend `languages` modülü ve route kayıtları eklendi.
- [x] **B3 — UI (Antigravity):** ProfilePanel'de slug yerine `language.name_<locale>` chip'lerde gösterilsin (`tr` → "Türkçe", `en` → "İngilizce"). "+Almanca" tıklayınca `de` slug ekle. Tutarlı görünüm.
- [x] **B4 — Become-consultant formu (Antigravity):** Aynı şekilde DB-driven dil seçimi.
- [x] **B5 — Min count (Codex):** En az 1 dil zorunlu. — Codex: PATCH ve consultant register validasyonunda `min(1)`, aktif `languages.slug` whitelist 400.

---

## C — KYC: Bireysel / Şirket ayrımı + belgeler

**Sorun:** Şu an consultants tablosunda sadece `bank_name`/`bank_iban`/`bank_account_holder` var. Yasal ödeme için TC kimlik / vergi numarası, hesap sahibi kontrolü, e-fatura/serbest meslek makbuzu hattı gerekli.

- [x] **C1 — Şema (Claude → `030_consultants_schema.sql` edit + prod additive ALTER):**
  ```sql
  ALTER TABLE consultants
    ADD COLUMN account_type ENUM('individual','company') NULL,
    ADD COLUMN identity_number VARCHAR(11) NULL,    -- TC kimlik (bireysel)
    ADD COLUMN tax_number VARCHAR(11) NULL,         -- Vergi no (şirket)
    ADD COLUMN tax_office VARCHAR(120) NULL,
    ADD COLUMN company_name VARCHAR(200) NULL,
    ADD COLUMN billing_address TEXT NULL,
    ADD COLUMN kyc_status ENUM('none','pending','approved','rejected') DEFAULT 'none',
    ADD COLUMN kyc_submitted_at DATETIME(3) NULL,
    ADD COLUMN kyc_reviewed_at DATETIME(3) NULL,
    ADD COLUMN kyc_rejection_reason TEXT NULL,
    ADD COLUMN kyc_documents JSON NULL;             -- [{type:'id_front',url:'...'},{type:'tax_certificate',url:'...'}]
  ``` — `030_consultants_schema.sql` + prod additive `030a_consultants_kyc_migrate.sql` hazır.
- [x] **C2 — Backend (Codex):**
  - PATCH `/me/consultant`: `account_type` zorunlu. Bireysel ise `identity_number` (TC 11 hane regex + checksum), `bank_account_holder` zorunlu. Şirket ise `tax_number` (10/11 hane), `tax_office`, `company_name`, `bank_account_holder` zorunlu.
  - POST `/me/consultant/kyc/documents` — belge yükle (storage modülü ile). `kyc_documents` JSON-a push.
  - POST `/me/consultant/kyc/submit` — KYC durumu `none` → `pending`. Admin notification tetikle.
  - Admin: `GET /admin/kyc/pending`, `POST /admin/kyc/:consultantId/approve|reject`.
  - Withdraw endpoint: `kyc_status != 'approved'` ise 403 (KYC-siz para çekilemez). — Codex: profil KYC validasyonu, belge upload, submit, admin approve/reject ve withdrawal KYC gate eklendi.
- [x] **C3 — UI (Antigravity):**
  - ProfilePanel'de "Hesap Tipi" radio: Bireysel / Şirket.
  - Bireysel form: TC kimlik no (mask 11 hane), IBAN, hesap sahibi, fatura adresi.
  - Şirket form: Vergi no, vergi dairesi, şirket unvanı, IBAN, hesap sahibi, fatura adresi.
  - "Kimlik / Vergi Levhası Yükle" upload bölümü (`id_front`, `id_back`, `tax_certificate`).
  - KYC durumu badge: "Doğrulama bekleniyor" / "Onaylandı" / "Reddedildi (sebep)".
  - "KYC-yi Gönder" butonu (`kyc_status='none'` iken aktif).
- [x] **C4 — Admin paneli (Antigravity):** `/admin/kyc` sayfası — pending KYC danışmanları, belgeleri görüntüle, onayla/reddet (gerekçe ile). Reddedince danışmana mail bildirimi.
- [x] **C5 — Audit log (Codex):** KYC onay/red admin user_id + zaman. — Codex: `audit_events` içine KYC upload/submit/approve/reject eventleri yazılıyor.

---

## D — Hakediş + Cüzdan + Ödeme talebi akışı

**Sorun:** Danışman para çekme akışı net değil. Hakedişlerin ne zaman "kullanılabilir" olacağı, refund periyodu, kesinti, manual transfer prosedürü.

- [x] **D1 — Hakediş düzeni (Codex):**
  - Booking `completed` durumuna geçtiğinde:
    - `wallet_transactions` row: `type='credit'`, `amount = booking.session_price * (1 - platform_commission_rate)`, `status='pending'`, `purpose='session_earning'`.
    - Cron (mevcut consultant-analytics ile aynı): N gün (default 7) sonra `status='pending'` → `status='available'` (refund period geçti). — Codex: mevcut `wallet_transactions.payment_status` enum'una uyumlu olarak `pending` → `completed`; `pending_balance` → `balance`.
- [x] **D2 — Withdrawal request tablosu (Claude):**
  ```sql
  CREATE TABLE withdrawal_requests (
    id CHAR(36) PRIMARY KEY,
    consultant_id CHAR(36) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    bank_iban VARCHAR(64) NOT NULL,     -- snapshot
    bank_holder VARCHAR(160) NOT NULL,  -- snapshot
    status ENUM('pending','approved','paid','rejected','cancelled') DEFAULT 'pending',
    requested_at DATETIME(3) NOT NULL,
    reviewed_at DATETIME(3) NULL,
    paid_at DATETIME(3) NULL,
    rejection_reason TEXT NULL,
    admin_note TEXT NULL,
    transfer_reference VARCHAR(120) NULL  -- banka transfer ref
  );
  ``` — `081_withdrawal_requests_schema.sql` hazır.
- [x] **D3 — Backend (Codex):**
  - `POST /me/consultant/wallet/withdraw` mevcut endpoint extend: yeni `withdrawal_requests` row yarat, amount `available` balance'tan düşür → `pending_withdrawal`. KYC gate (C2-3).
  - `GET /me/consultant/withdrawals` — danışmanın geçmiş çekim talepleri.
  - Admin: `GET /admin/withdrawals?status=pending`, `POST /admin/withdrawals/:id/approve`, `/reject`, `/mark-paid` (transfer_reference + paid_at). — Codex: endpointler eklendi; reddetmede bakiye iadesi yapılıyor.
- [x] **D4 — UI (Antigravity):** Cüzdan Sayfası (`WalletPanel`)
  - Güncel bakiye (`wallet.balance`)
  - Bekleyen (hakediş sürecinde olan) bakiye (`wallet.pending_balance`) (D2'den gelecek).
  - Listeleme: `wallet_transactions` history (tarih, tutar, tip, açıklama, durum).
  - "Para Çek" butonu:
    - Eğer `kyc_status != 'approved'` ise disabled, tooltip: "Para çekmek için Kimlik Doğrulama (KYC) işlemini tamamlayın."
    - Modal: Çekilecek tutar girilir (max: balance). Submit edilince POST `/me/consultant/wallet/withdraw`.
    - Eğer `balance < 500` (min limit) ise uyarı.
- [x] **D5 — Admin paneli (Antigravity):** `/admin/withdrawals` — pending withdrawals listesi, onayla → mark-paid → transfer_reference gir.
- [x] **D6 — Mail bildirimleri (Codex):** Withdrawal approved/paid/rejected → danışmana e-posta. — Codex: `withdrawal_approved_consultant`, `withdrawal_paid_consultant`, `withdrawal_rejected_consultant` template keyleriyle best-effort mail.

---

## E — Platform Komisyon Oranı + Şeffaflık

**Sorun:** Danışman kazancından kesintinin oranını ve nasıl uygulandığını bilmeli. Kayıt sırasında onaylamalı.

- [x] **E1 — Konfig (Claude):** `site_settings`:
  ```json
  { "key": "platform_commission_rate", "value": {"percent": 15} }
  ```
  Admin edit'ler. Default %15. — `010b_commission_setting_seed.sql` içinde komisyon + hold/withdrawal limitleri hazır.
- [x] **E2 — Backend (Codex):**
  - Hakediş hesabı: `net = gross * (1 - commission_rate/100)`. wallet_transactions'a yazılır, ayrıca `metadata` veya `purpose` ile gross/commission audit edilir.
  - Public endpoint `GET /settings/commission` → `{percent: 15}` (danışman ve müşteri görür). — Codex: endpoint eklendi; audit bilgisi `description` JSON içinde gross/commission/net olarak tutuluyor.
- [x] **E3 — Become-consultant form (Antigravity):**
  - Komisyon oranı açıkça gösterilir: "Platform %15 komisyon kesintisi uygular".
  - Sözleşme onay checkbox: "Komisyon oranı ve danışmanlık sözleşmesini okudum, kabul ediyorum" — bağlı: `/tr/legal/consultant-agreement` (custom_pages).
  - Onaysız form submit edilmez.
- [x] **E4 — Danışman dashboard (Antigravity):** Cüzdan'da info kutusu: "Komisyon Oranı: %15 — Hizmet ücretinin %15'i platform tarafından kesilir, kalan tutar cüzdanınıza eklenir."
- [x] **E5 — Müşteri tarafı (Antigravity):** Booking sayfasında "%X platform hizmet bedeli" satırı (KDV gibi göster) — şeffaflık.
- [x] **E6 — Admin paneli (Antigravity):** Site settings altında "Komisyon Oranı" edit alanı.

---

## F — Yasal Sözleşme + Fatura Akışı

- [x] **F1 — Danışman Sözleşmesi (Claude/içerik):** 2026-05-20 Claude: `backend/src/db/sql/198a_consultant_legal_pages_seed.sql` — `custom_pages` module_key `consultant_agreement` + TR/EN/DE içerik (10 madde: komisyon %15, 7-gün hold, KYC, e-fatura/stopaj, hesap devri, KVKK, sorumluluk, jurisdiction). `cp-consultant-agreement` parent + 3 i18n satır. Deploy sonrası `/tr/legal/danisman-sozlesmesi` URL'inden erişilir.
- [x] **F2 — Onay kaydı (Codex):** Become-consultant başvurusunda `agreement_accepted_at` consultants tablosuna kayıt. — Codex: başvuru onaylanınca consultant kaydına başvuru zamanı yazılıyor; doğrudan register akışı `agreement_accepted=true` gönderirse kayıt alıyor.
- [ ] **F3 — E-fatura/Stopaj (uzun vadeli):** Şirket danışmanı için e-fatura kesim akışı (mevcut `e-fatura-service` projesiyle entegrasyon — memory `faz36_earsiv_fatura`). Bireysel için gelir vergisi stopajı bilgi notu (platform vergi kesmez; danışman beyan eder).
- [x] **F4 — Tahsilat süreci dokümante (Claude/içerik):** 2026-05-20 Claude: `backend/src/db/sql/198a_consultant_legal_pages_seed.sql` aynı dosyada `cp-payout-faq` parent + TR/EN/DE `payout_faq` module_key. 10-bölüm SSS: akış özeti, %15 komisyon, neden 7 gün hold, KYC, min/max çekim, IBAN, vergi/fatura, ret, bildirim, destek.

---

## G — Admin Audit + Funnel + Kullanıcı İzleme

**Sorun:** `/admin/audit?tab=map&days=14&limit=50` sayfasında hata var (component veya data 500). Mevcut audit_events tablosu olay log'u tutuyor ama: funnel (landing→register→booking→completed), kullanıcı bazlı izleme (X kullanıcısı sitede neler yaptı), conversion oranları, real-time aktivite akışı yok.

### G1 — Audit sayfası hata fix
- [x] Browser console + backend log ile spesifik hata ne — component hatası mı, API 500 mü? (`AuditGeoMap.tsx`, `AuditDailyChart.tsx`, controller). (MySQL INTERVAL parameterization hatası bulundu)
- [x] Boş data / undefined map projection / leaflet eksik dependency — case-by-case düzelt. (react-simple-maps items undefined check eklendi, Drizzle INTERVAL fix uygulandı).
- [x] Filtre kombinasyonları (tab=map + days=14 + limit=50) edge case'leri.

### G2 — Funnel sistemi (yeni)
- [x] **Şema (Claude):** `funnel_events` tablosu (id, user_id?, session_id, event_name, properties JSON, occurred_at). veya mevcut `audit_events`'i extend (topic'e `funnel:` prefix). — Codex: yeni tablo yerine mevcut `audit_events.topic='funnel:*'` modeliyle kapatıldı.
- [x] **Tracking endpoints (Codex):** `POST /api/track` — anon/auth fark etmez, frontend tetikler. Standart event'ler: `page_view`, `signup_start`, `signup_complete`, `consultant_view`, `service_select`, `booking_start`, `booking_payment`, `booking_completed`, `session_started`, `session_completed`. — Codex: `audit_events.topic='funnel:*'` olarak persist ediliyor.
- [x] **Frontend instrumentation (Antigravity):** key sayfalarda `trackEvent('event_name', props)` çağrısı (proxy ya da hook).
- [x] **Funnel report endpoint (Codex):** `GET /admin/funnel?range=30d&segment=` → her step'in count + drop-off rate. — Codex: `/admin/funnel` ve `/admin/audit/funnel` eklendi.
- [x] **Admin UI funnel sayfası (Antigravity):** `/admin/audit?tab=funnel` veya yeni `/admin/funnel` — sankey/bar chart: 100 ziyaretçi → 40 signup_start → 25 signup_complete → 8 booking_start → 5 booking_payment → 4 completed. Filtre: tarih, source (UTM), locale.

### G3 — Kullanıcı bazlı izleme (User Journey)
- [x] **Backend (Codex):** `GET /admin/users/:id/activity?range=30d` → o kullanıcının tüm audit/funnel event'leri kronolojik. Bağlı booking, payment, review, message özet metrikleri. — Codex: audit event + request timeline ve spend/booking/last_active summary eklendi.
- [x] **Admin UI (Antigravity):** `/admin/users/:id` user detail sayfasına "Aktivite" tab — timeline:
  ```
  2026-05-20 14:30  signup_complete  (Google OAuth)
  2026-05-20 14:35  consultant_view  (zeynep-yildiz)
  2026-05-20 14:38  service_select  (Doğum Haritası 60dk)
  2026-05-20 14:42  booking_payment  ✓ ₺1800
  2026-05-20 15:00  session_completed  (45 dk)
  2026-05-20 15:05  review_left  ★5
  ```
- [x] Kullanıcı detayında: toplam harcama, randevu sayısı, favori kategori, son aktif, gönderdiği mesajlar.

### G4 — Cohort + Retention analizi
- [x] **Endpoint (Codex):** `GET /admin/cohorts?metric=booking&range=12w` → kayıt tarihi haftasına göre kullanıcıları gruplandır, sonraki haftalarda hâlâ aktif olanların yüzdesi (D1/D7/D30 retention). — Codex: cohort sizes + retention rows eklendi.
- [x] **Admin UI:** Heatmap görselleştirme (cohort × week, color intensity = retention%).

### G5 — Trafik kaynağı (UTM + Referrer)
- [x] **Frontend:** ziyaretçi ilk landing'de `utm_source/medium/campaign` + `referrer` JSON property olarak ilk `page_view` event'ine eklenir; cookie/session ile saklanır.
- [x] **Backend (Codex):** `GET /admin/traffic-sources?range=30d` → kaynak bazında dönüşüm hunisi (Ziyaretçi → Kayıt → Randevu → Harcama) . — Codex: endpoint eklendi.
- [x] **Admin UI:** UTM verisini kullanarak acquisition maliyeti hesabı (opsiyonel) / tablo.arı eklendi.
- [x] **Admin UI:** Source tablosu (kaynak, ziyaretçi, signup, booking, gelir).

### G6 — Real-time aktivite akışı (canlı)
- [x] **Backend (Codex):** SSE veya WebSocket endpoint `/admin/live-feed` — son 100 audit event stream'i. — Codex: mevcut audit SSE handler'ı `/admin/live-feed` alias'ına bağlandı.
- [x] **Admin UI:** Admin dashboard'a (veya audit sayfasına) canlı akan bildirim paneli (kim ne yapıyor: booking_start, session_join) anlık.

### Done tanımı (G)
- Audit sayfası 200 + tüm tab'lar (geo/daily/funnel/users) hatasız.
- Funnel step'leri rakamla tutarlı (sql query verify).
- User journey: en az 1 kullanıcı için tam timeline çıkar.
- Cohort heatmap renkleri doğru.

---

## H — Onboarding CTA + Header Sadeleştirme

**Sorun:** Üye ol akışı belirgin değil, header çok kalabalık (Ana Sayfa, Burçlar, Astroloji ▾, Fal & Tarot ▾, Numeroloji, Danışmanlar, Blog, Hakkımızda + sağda 3 buton). Danışman Ol CTA'sı yalnız footer + become-consultant'ta görünür; anasayfa segmentinde yok.

### H1 — Üye Ol (signup) CTA belirginleştir
- [x] **Header (desktop):** Anonim kullanıcıya "Giriş Yap" + **"Üye Ol"** ikili buton (Giriş Yap → outline, Üye Ol → solid primary). Şu an muhtemelen yalnız "Giriş Yap" var veya gizli.
- [x] **Header (mobile/offcanvas):** Üye Ol + Giriş Yap iki sütun grid (zaten var, label/style sadeleştir).
- [x] **Anasayfa hero altında "Hesap Aç"** ana CTA — Google OAuth + e-posta tek-tıklamada formsuz başlat (mevcut /register sayfası varsa kısayol).
- [x] **Footer "Hızlı" bölümü:** anonim kullanıcıya "Hesap Aç" linki.
- [x] **Authenticated kullanıcıya:** Üye Ol/Giriş Yap gizlenir; yerine avatar dropdown (Panelim, Profilim, Çıkış).

### H2 — Danışman Başvurusu CTA'yı ufalt ama erişilebilir kılaç yerde
- [x] **Header (desktop):** sağ köşeye küçük metin linki "Danışman mısın? Başvur" (sade, ana CTA "DANIŞMAN BUL"u gölgelemesin). `isConsultant` olunca gizle.
- [x] **Anasayfa**: hero altı veya footer üstü segment: "Danışman mısın? Platforma katıl" — `HomeBecomeConsultantBanner.tsx` zaten var, daha üst kısma alınabilir veya görünür yer.
- [x] **Footer:** "Şirket" bölümünde "Danışman Ol" linki ZATEN VAR (2026-05-19'da eklendi); kalıcı.
- [x] **Header (mobile):** Offcanvas menü en alta `isConsultant ? ""` : "Danışman mısın? Platforma Katıl" linki.

### H3 — Header menü sadeleştirme (kalabalığı azalt)
- [x] Burçlar ve Numeroloji üst seviyeden alınıp dropdown'lara yerleştirilir. Üst seviye 8 → 6.
- [x] Önerilen sade (6 adet): Ana Sayfa, Astroloji ▾ (alt: Burçlar, Doğum Haritası, Sinastri, Yıldızname, Yükselen Burç, Günlük Yorum), Fal & Tarot ▾ (alt: Tarot, Kahve Falı, Rüya Tabiri, Numeroloji), Danışmanlar, Blog, Hakkımızda.
- [x] DB-driven nav (`menu_items`) içinde mevcut seed'i bu düzene göre güncelle (`196_navigation_seed.sql` edit + prod additive UPDATE/DELETE/INSERT).
- [ ] **Veya daha agresif (5 adet):** Hakkımızda → footer'a taşı, header'dan çıkar. Üst seviye 6 → 5.
- [ ] DB-driven nav (`menu_items`) içinde mevcut seed'i bu düzene göre güncelle (`196_navigation_seed.sql` edit + prod additive UPDATE/DELETE/INSERT).
- [ ] **Mobile offcanvas:** her şey orada kalsın (yer var, hamburger içi); desktop üst bar minimal.

### H4 — Kayıt/Giriş akış UX iyileştirme
- [ ] **Tek sayfa Auth modal**: header'dan "Üye Ol" → modal aç (sayfa değiştirme yok); 3 sekme: Giriş / Üye Ol / Şifremi Unuttum. Google OAuth her sekmede üstte.
- [ ] **Üye olduktan sonra**: doğrudan ana sayfa veya `?next=` parametre ile geldiği sayfaya dön.
- [x] **E-posta doğrulama**: mevcut /verify-email akışı var; signup → otomatik mail gönder + UI'da "Mailini kontrol et" ekranı. — Codex: backend signup auto-send, resend ve confirm endpoint'leri eklendi; mail içeriği `email_verification` template seed'iyle DB'den yönetiliyor; mevcut frontend `/verify-email` akışıyla uyumlu.

### Done tanımı (H)
- Header desktop'ta üst seviye link sayısı ≤ 6.
- Anonim ana sayfa açar: "Üye Ol" + "Danışman misin?" CTA'ları görünür.
- Authenticated kullanıcı: dropdown menü düzeni, login/signup gizli.
- `menu_items` DB güncel, frontend nav DB-driven olarak yansıtır.

---

## Sıra / öncelik

1. **A + B** (uzmanlık + dil DB-driven görünüm) — UI cila, hızlı.
2. **H** (üye ol CTA + danışman ol CTA + header sadeleştirme) — **trafik+conversion için kritik**, hızlı kazanım.
3. **E** (komisyon oranı şeffaflığı) — yasal/etik öncelik.
4. **C** (KYC bireysel/şirket) — yasal zorunluluk para akışına geçmeden.
5. **D** (withdrawal + hakediş) — para akışı.
6. **F** (sözleşme + fatura) — paralel, sürekli.
7. **G1** (audit hata fix) — acil, kullanıcı görüyor.
8. **G2-G6** (funnel + user tracking + cohort + traffic + live feed) — orta vadeli analitik altyapı; iş kararları için.

## Done tanımı (genel)

- Her bölümün şeması committed + prod additive ALTER reconcile.
- Backend typecheck temiz, endpoint'ler 401 (auth) veya 200.
- UI tüm metinler `ui()` ile sarılı, TR/EN/DE seed'li.
- Admin paneli ilgili sekme/sayfa eklendi.
- KVKK/audit log her hassas işlemde tutuluyor (KYC, withdrawal, commission change).

---

## Deploy & Audit raporu (2026-05-20 Claude)

- **Şema dosyaları yazıldı:** `010b_commission_setting_seed.sql` (E1), `030_consultants_schema.sql` (C1 canonical — KYC kolonları + `agreement_accepted_at`), `030a_consultants_kyc_migrate.sql` (C1 prod additive INFORMATION_SCHEMA-guarded ALTER), `032d_languages_schema.sql` (B1), `081_withdrawal_requests_schema.sql` (D2), `198a_consultant_legal_pages_seed.sql` (F1+F4 TR/EN/DE).
- **Deploy adımları:**
  1. `./deploy/deploy.sh backend --seed` → 96 SQL seed dosyası additive koştu, port 8094 canlı.
  2. `./deploy/deploy.sh admin` → modal.tsx eklendi, withdrawals page sadeleştirildi, Badge/Button variant'ları düzeltildi, port 3094 canlı.
  3. `./deploy/deploy.sh frontend` → port 3095 canlı.
- **TS audit:** ConsultantDashboard.tsx broken JSX (eksik `);` + extra `<div>` wrapper) düzeltildi; admin `KycPending`/`Withdrawals` ve frontend `Languages`/`Commission`/`ConsultantWithdrawals` tag'leri eklendi; `commissionRate` `?? ` cast'i; duplicate `CheckCircle2` import temizlendi.
- **Prod DB audit:** orphan expertise slug **YOK**; 12 KYC kolonu mevcut; `withdrawal_requests` tablosu mevcut; `platform_commission_rate=15`, `wallet_hold_days=7`, min/max withdrawal 100/50000 TRY; `cp-consultant-agreement` + `cp-payout-faq` her ikisi de 3 i18n satırla aktif; languages tablosu 7 dil ile dolu.
- **Smoke test:** `/api/health` 200, `/api/languages` JSON dolu, `/api/settings/commission` `{"percent":15}`, `/api/custom-pages?module_key=consultant_agreement&locale=tr` dolu liste.

## Notlar (memory ile bağlantılı uyarılar)

- Şema değişiklikleri: ALTER lokal **YASAK**. Schema dosyasına ekle + prod additive ALTER (memory `prod_schema_drift_media_type`).
- Deploy: feat HEAD detached worktree (memory `deploy_source_is_feat_not_main`).
- `uploads/` deploy.sh sync etmiyor (memory `deploy_uploads_gap`) — KYC belgeleri için ya cloudinary ya manual rsync.
- RTK transformResponse `{data}/{items}` unwrap kalıbı (memory `rtk_envelope_unwrap_pattern`) — yeni endpoint'lerde unutma.
- i18n seed bash heredoc'unda `\"{name}\"` escape **bozuluyor** (2026-05-20 örneği). Tırnak gerektiğinde sade `{name}` kullan; cümleyi tırnaksız kur.
- Next ISR fetch-cache data değişiminde manuel temizle: `ssh ... rm -rf .next/cache/fetch-cache && pm2 reload`.
