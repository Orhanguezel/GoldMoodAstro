# YAPILACAKLAR — Danışman Profili: Uzmanlık + Dil + KYC + Ödeme + Komisyon

> Oluşturulma: 2026-05-20. Sahip: Claude Code (mimar).
> Uygulama: Codex (backend + şema), Antigravity (UI). Deploy: Claude.
> Roadmap: bu dosya kökte tutulur ki unutulmasın; bitince `doc/`'a taşı.

---

## A — Uzmanlık Alanları (`consultants.expertise`) — DB-driven yap

**Sorun:** Şu an chip'lerde Astroloji, Doğum Haritası, Tarot vb. **+ "Kahve Falı, Ruhsal Rehberlik, Rüya Tabiri, Enerji Şifası"** seçenekleri serbestçe gösteriliyor. Liste hardcoded olabilir veya `service_categories` ile tam senkron değil.

- [ ] **A1 — Şema check (Claude):** `service_categories` tablosu zaten var (11 kategori). Mevcut consultants.expertise json slug'ları (`astrology`, `tarot`, …) bu tablonun slug'ları ile birebir mi? `JOIN service_categories sc ON JSON_CONTAINS(c.expertise, JSON_QUOTE(sc.slug))` ile orphan slug kontrolü.
- [ ] **A2 — UI sadece DB'den (Antigravity):** `ProfilePanel`'de `useListServiceCategoriesPublicQuery()` zaten kullanılıyor — fallback hardcoded `expertiseOptions` (BecomeConsultantPage'deki `EXPERTISE_OPTIONS`) **kaldırılsın**; serviceCategories boş ise "Yükleniyor…" göster, hardcoded liste hiç render edilmesin.
- [ ] **A3 — Backend validation (Codex):** PATCH `/me/consultant` body'de `expertise` her elemanı `service_categories.slug` whitelist'inde olmalı. Yoksa 400.
- [ ] **A4 — Mevcut data migration (Claude):** Prod'da DB consult.expertise json'unda `service_categories.slug` listesinde olmayan slug varsa raporla (sadece audit, otomatik silme yok — kullanıcı onayıyla).
- [ ] **A5 — Min/max count (Codex):** En az 1, en çok 8 uzmanlık seçilebilir kuralı.
- [ ] **A6 — Become-consultant başvuru formu (Antigravity):** `BecomeConsultantPage` `EXPERTISE_OPTIONS` da DB'den çekilsin (aynı `useListServiceCategoriesPublicQuery`). Hardcoded array kaldırılsın.

---

## B — Diller — DB-driven + tam adlı görünüm

**Sorun:** Chip'lerde "tr", "en" slug'ları görünüyor; "+Türkçe", "+İngilizce" alt linkler var. Tutarsız. Hardcoded array `[tr, en, de, fr]`.

- [ ] **B1 — Şema (Claude):** Yeni tablo veya site_settings:
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
  Seed: tr/en/de/fr (gerekirse + ru, ar, es). Locale'e göre name görünür.
- [ ] **B2 — Backend (Codex):** `GET /languages` public endpoint + admin CRUD `/admin/languages`.
- [ ] **B3 — UI (Antigravity):** ProfilePanel'de slug yerine `language.name_<locale>` chip'lerde gösterilsin (`tr` → "Türkçe", `en` → "İngilizce"). "+Almanca" tıklayınca `de` slug ekle. Tutarlı görünüm.
- [ ] **B4 — Become-consultant formu (Antigravity):** Aynı şekilde DB-driven dil seçimi.
- [ ] **B5 — Min count (Codex):** En az 1 dil zorunlu.

---

## C — KYC: Bireysel / Şirket ayrımı + belgeler

**Sorun:** Şu an consultants tablosunda sadece `bank_name`/`bank_iban`/`bank_account_holder` var. Yasal ödeme için TC kimlik / vergi numarası, hesap sahibi kontrolü, e-fatura/serbest meslek makbuzu hattı gerekli.

- [ ] **C1 — Şema (Claude → `030_consultants_schema.sql` edit + prod additive ALTER):**
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
  ```
- [ ] **C2 — Backend (Codex):**
  - PATCH `/me/consultant`: `account_type` zorunlu. Bireysel ise `identity_number` (TC 11 hane regex + checksum), `bank_account_holder` zorunlu. Şirket ise `tax_number` (10/11 hane), `tax_office`, `company_name`, `bank_account_holder` zorunlu.
  - POST `/me/consultant/kyc/documents` — belge yükle (storage modülü ile). `kyc_documents` JSON'a push.
  - POST `/me/consultant/kyc/submit` — KYC durumu `none` → `pending`. Admin notification tetikle.
  - Admin: `GET /admin/kyc/pending`, `POST /admin/kyc/:consultantId/approve|reject`.
  - Withdraw endpoint: `kyc_status != 'approved'` ise 403 (KYC'siz para çekilemez).
- [ ] **C3 — UI (Antigravity):**
  - ProfilePanel'de "Hesap Tipi" radio: Bireysel / Şirket.
  - Bireysel form: TC kimlik no (mask 11 hane), IBAN, hesap sahibi, fatura adresi.
  - Şirket form: Vergi no, vergi dairesi, şirket unvanı, IBAN, hesap sahibi, fatura adresi.
  - "Kimlik / Vergi Levhası Yükle" upload bölümü (id_front, id_back, tax_certificate).
  - KYC durumu badge: "Doğrulama bekleniyor" / "Onaylandı" / "Reddedildi (sebep)".
  - "KYC'yi Gönder" butonu (kyc_status='none' iken aktif).
- [ ] **C4 — Admin paneli (Antigravity):** `/admin/kyc` sayfası — pending KYC danışmanları, belgeleri görüntüle, onayla/reddet (gerekçe ile). Reddedince danışmana mail bildirimi.
- [ ] **C5 — Audit log (Codex):** KYC onay/red admin user_id + zaman.

---

## D — Hakediş + Cüzdan + Ödeme talebi akışı

**Sorun:** Danışman para çekme akışı net değil. Hakedişlerin ne zaman "kullanılabilir" olacağı, refund periyodu, kesinti, manual transfer prosedürü.

- [ ] **D1 — Hakediş düzeni (Codex):**
  - Booking `completed` durumuna geçtiğinde:
    - `wallet_transactions` row: `type='credit'`, `amount = booking.session_price * (1 - platform_commission_rate)`, `status='pending'`, `purpose='session_earning'`.
    - Cron (mevcut consultant-analytics ile aynı): N gün (default 7) sonra `status='pending'` → `status='available'` (refund period geçti).
- [ ] **D2 — Withdrawal request tablosu (Claude):**
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
  ```
- [ ] **D3 — Backend (Codex):**
  - `POST /me/consultant/wallet/withdraw` mevcut endpoint extend: yeni `withdrawal_requests` row yarat, amount `available` balance'tan düşür → `pending_withdrawal`. KYC gate (C2-3).
  - `GET /me/consultant/withdrawals` — danışmanın geçmiş çekim talepleri.
  - Admin: `GET /admin/withdrawals?status=pending`, `POST /admin/withdrawals/:id/approve`, `/reject`, `/mark-paid` (transfer_reference + paid_at).
- [ ] **D4 — UI Cüzdan (Antigravity):**
  - WalletPanel'de 3 kart: **Pending Earnings** (henüz çekilemez, N gün sonra), **Available Balance** (çekilebilir), **Pending Withdrawal** (talep edildi, ödeme bekliyor).
  - "Para Çek" butonu — modal: tutar + IBAN doğrulama + "3-5 iş günü içinde hesabınıza yatırılır" not + KYC değilse uyarı.
  - Geçmiş çekimler tablosu (status badge, paid_at, transfer_reference).
- [ ] **D5 — Admin paneli (Antigravity):** `/admin/withdrawals` — pending withdrawals listesi, onayla → mark-paid → transfer_reference gir.
- [ ] **D6 — Mail bildirimleri (Codex):** Withdrawal approved/paid/rejected → danışmana e-posta.

---

## E — Platform Komisyon Oranı + Şeffaflık

**Sorun:** Danışman kazancından kesintinin oranını ve nasıl uygulandığını bilmeli. Kayıt sırasında onaylamalı.

- [ ] **E1 — Konfig (Claude):** `site_settings`:
  ```json
  { "key": "platform_commission_rate", "value": {"percent": 15} }
  ```
  Admin edit'ler. Default %15.
- [ ] **E2 — Backend (Codex):**
  - Hakediş hesabı: `net = gross * (1 - commission_rate/100)`. wallet_transactions'a yazılır, ayrıca `metadata` veya `purpose` ile gross/commission audit edilir.
  - Public endpoint `GET /settings/commission` → `{percent: 15}` (danışman ve müşteri görür).
- [ ] **E3 — Become-consultant form (Antigravity):**
  - Komisyon oranı açıkça gösterilir: "Platform %15 komisyon kesintisi uygular".
  - Sözleşme onay checkbox: "Komisyon oranı ve danışmanlık sözleşmesini okudum, kabul ediyorum" — bağlı: `/tr/legal/consultant-agreement` (custom_pages).
  - Onaysız form submit edilmez.
- [ ] **E4 — Danışman dashboard (Antigravity):** Cüzdan'da info kutusu: "Komisyon Oranı: %15 — Hizmet ücretinin %15'i platform tarafından kesilir, kalan tutar cüzdanınıza eklenir."
- [ ] **E5 — Müşteri tarafı (Antigravity):** Booking sayfasında "%X platform hizmet bedeli" satırı (KDV gibi göster) — şeffaflık.
- [ ] **E6 — Admin paneli (Antigravity):** Site settings altında "Komisyon Oranı" edit alanı.

---

## F — Yasal Sözleşme + Fatura Akışı

- [ ] **F1 — Danışman Sözleşmesi (Claude/içerik):** `custom_pages` modülünde yeni key `consultant-agreement` (tr/en/de). Komisyon, ödeme süreci, KVKK, sorumluluk maddeleri.
- [ ] **F2 — Onay kaydı (Codex):** Become-consultant başvurusunda `agreement_accepted_at` consultants tablosuna kayıt.
- [ ] **F3 — E-fatura/Stopaj (uzun vadeli):** Şirket danışmanı için e-fatura kesim akışı (mevcut `e-fatura-service` projesiyle entegrasyon — memory `faz36_earsiv_fatura`). Bireysel için gelir vergisi stopajı bilgi notu (platform vergi kesmez; danışman beyan eder).
- [ ] **F4 — Tahsilat süreci dokümante (Claude/içerik):** "Para Nasıl Hesabıma Geçer?" SSS sayfası — booking → 7 gün hold → available → çekim talebi → 3-5 iş günü → IBAN.

---

## G — Admin Audit + Funnel + Kullanıcı İzleme

**Sorun:** `/admin/audit?tab=map&days=14&limit=50` sayfasında hata var (component veya data 500). Mevcut audit_events tablosu olay log'u tutuyor ama: funnel (landing→register→booking→completed), kullanıcı bazlı izleme (X kullanıcısı sitede neler yaptı), conversion oranları, real-time aktivite akışı yok.

### G1 — Audit sayfası hata fix
- [ ] Browser console + backend log ile spesifik hata ne — component hatası mı, API 500 mü? (`AuditGeoMap.tsx`, `AuditDailyChart.tsx`, controller).
- [ ] Boş data / undefined map projection / leaflet eksik dependency — case-by-case düzelt.
- [ ] Filtre kombinasyonları (tab=map + days=14 + limit=50) edge case'leri.

### G2 — Funnel sistemi (yeni)
- [ ] **Şema (Claude):** `funnel_events` tablosu (id, user_id?, session_id, event_name, properties JSON, occurred_at). veya mevcut `audit_events`'i extend (topic'e `funnel:` prefix).
- [ ] **Tracking endpoints (Codex):** `POST /api/track` — anon/auth fark etmez, frontend tetikler. Standart event'ler: `page_view`, `signup_start`, `signup_complete`, `consultant_view`, `service_select`, `booking_start`, `booking_payment`, `booking_completed`, `session_started`, `session_completed`.
- [ ] **Frontend instrumentation (Antigravity):** key sayfalarda `trackEvent('event_name', props)` çağrısı (proxy ya da hook).
- [ ] **Funnel report endpoint (Codex):** `GET /admin/funnel?range=30d&segment=` → her step'in count + drop-off rate.
- [ ] **Admin UI funnel sayfası (Antigravity):** `/admin/audit?tab=funnel` veya yeni `/admin/funnel` — sankey/bar chart: 100 ziyaretçi → 40 signup_start → 25 signup_complete → 8 booking_start → 5 booking_payment → 4 completed. Filtre: tarih, source (UTM), locale.

### G3 — Kullanıcı bazlı izleme (User Journey)
- [ ] **Backend (Codex):** `GET /admin/users/:id/activity?range=30d` → o kullanıcının tüm audit/funnel event'leri kronolojik. Bağlı booking, payment, review, message özet metrikleri.
- [ ] **Admin UI (Antigravity):** `/admin/users/:id` user detail sayfasına "Aktivite" tab — timeline:
  ```
  2026-05-20 14:30  signup_complete  (Google OAuth)
  2026-05-20 14:35  consultant_view  (zeynep-yildiz)
  2026-05-20 14:38  service_select  (Doğum Haritası 60dk)
  2026-05-20 14:42  booking_payment  ✓ ₺1800
  2026-05-20 15:00  session_completed  (45 dk)
  2026-05-20 15:05  review_left  ★5
  ```
- [ ] Kullanıcı detayında: toplam harcama, randevu sayısı, favori kategori, son aktif, gönderdiği mesajlar.

### G4 — Cohort + Retention analizi
- [ ] **Endpoint (Codex):** `GET /admin/cohorts?metric=booking&range=12w` → kayıt tarihi haftasına göre kullanıcıları gruplandır, sonraki haftalarda hâlâ aktif olanların yüzdesi (D1/D7/D30 retention).
- [ ] **Admin UI:** Heatmap görselleştirme (cohort × week, color intensity = retention%).

### G5 — Trafik kaynağı (UTM + Referrer)
- [ ] **Frontend:** ziyaretçi ilk landing'de `utm_source/medium/campaign` + `referrer` JSON property olarak ilk `page_view` event'ine eklenir; cookie/session ile saklanır.
- [ ] **Backend (Codex):** `GET /admin/traffic-sources?range=30d` → her source'un signup/booking conversion oranı.
- [ ] **Admin UI:** Source tablosu (kaynak, ziyaretçi, signup, booking, gelir).

### G6 — Real-time aktivite akışı (canlı)
- [ ] **Backend (Codex):** SSE veya WebSocket endpoint `/admin/live-feed` — son 100 audit event stream'i.
- [ ] **Admin UI:** Sticky panel — kim ne yapıyor (consultant_view, booking_start, session_join) anlık.

### Done tanımı (G)
- Audit sayfası 200 + tüm tab'lar (geo/daily/funnel/users) hatasız.
- Funnel step'leri rakamla tutarlı (sql query verify).
- User journey: en az 1 kullanıcı için tam timeline çıkar.
- Cohort heatmap renkleri doğru.

---

## H — Onboarding CTA + Header Sadeleştirme

**Sorun:** Üye ol akışı belirgin değil, header çok kalabalık (Ana Sayfa, Burçlar, Astroloji ▾, Fal & Tarot ▾, Numeroloji, Danışmanlar, Blog, Hakkımızda + sağda 3 buton). Danışman Ol CTA'sı yalnız footer + become-consultant'ta görünür; anasayfa segmentinde yok.

### H1 — Üye Ol (signup) CTA belirginleştir
- [ ] **Header (desktop):** Anonim kullanıcıya "Giriş Yap" + **"Üye Ol"** ikili buton (Giriş Yap → outline, Üye Ol → solid primary). Şu an muhtemelen yalnız "Giriş Yap" var veya gizli.
- [ ] **Header (mobile/offcanvas):** Üye Ol + Giriş Yap iki sütun grid (zaten var, label/style sadeleştir).
- [ ] **Anasayfa hero altında "Hesap Aç"** ana CTA — Google OAuth + e-posta tek-tıklamada formsuz başlat (mevcut /register sayfası varsa kısayol).
- [ ] **Footer "Hızlı" bölümü:** anonim kullanıcıya "Hesap Aç" linki.
- [ ] **Authenticated kullanıcıya:** Üye Ol/Giriş Yap gizlenir; yerine avatar dropdown (Panelim, Profilim, Çıkış).

### H2 — Danışman Ol CTA bir kaç yerde
- [ ] **Header (desktop):** sağ köşeye küçük metin linki "Danışman mısın? Başvur" (sade, ana CTA "DANIŞMAN BUL"u gölgelemesin). isConsultant olunca gizle.
- [ ] **Anasayfa**: hero altı veya footer üstü segment: "Danışman mısın? Platforma katıl" — `HomeBecomeConsultantBanner.tsx` zaten var, daha üst kısma alınabilir veya görünür yer.
- [ ] **Footer:** "Şirket" bölümünde "Danışman Ol" linki ZATEN VAR (2026-05-19'da eklendi); kalıcı.
- [ ] **become-consultant sayfası**: "Üye değil misin? Önce hesap aç → o sonra başvur" yönlendirmesi (henüz auth yoksa).

### H3 — Header menü sadeleştirme (kalabalığı azalt)
- [ ] **Mevcut üst seviye linkler (8 adet):** Ana Sayfa, Burçlar, Astroloji ▾, Fal & Tarot ▾, Numeroloji, Danışmanlar, Blog, Hakkımızda → **çok**.
- [ ] **Önerilen sade (6 adet):** Ana Sayfa, **Astroloji ▾** (alt: Burçlar, Doğum Haritası, Sinastri, Yıldızname, Yükselen Burç, Günlük Yorum), **Fal & Tarot ▾** (alt: Tarot, Kahve Falı, Rüya Tabiri, **Numeroloji**), Danışmanlar, Blog, Hakkımızda.
- [ ] `Burçlar` ve `Numeroloji` üst seviyeden alınıp dropdown'lara yerleştirilir. Üst seviye 8 → 6.
- [ ] **Veya daha agresif (5 adet):** Hakkımızda → footer'a taşı, header'dan çıkar. Üst seviye 6 → 5.
- [ ] DB-driven nav (`menu_items`) içinde mevcut seed'i bu düzene göre güncelle (`196_navigation_seed.sql` edit + prod additive UPDATE/DELETE/INSERT).
- [ ] **Mobile offcanvas:** her şey orada kalsın (yer var, hamburger içi); desktop üst bar minimal.

### H4 — Kayıt/Giriş akış UX iyileştirme
- [ ] **Tek sayfa Auth modal**: header'dan "Üye Ol" → modal aç (sayfa değiştirme yok); 3 sekme: Giriş / Üye Ol / Şifremi Unuttum. Google OAuth her sekmede üstte.
- [ ] **Üye olduktan sonra**: doğrudan ana sayfa veya `?next=` parametre ile geldiği sayfaya dön.
- [ ] **E-posta doğrulama**: mevcut /verify-email akışı var; signup → otomatik mail gönder + UI'da "Mailini kontrol et" ekranı.

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

## Notlar (memory ile bağlantılı uyarılar)

- Şema değişiklikleri: ALTER lokal **YASAK**. Schema dosyasına ekle + prod additive ALTER (memory `prod_schema_drift_media_type`).
- Deploy: feat HEAD detached worktree (memory `deploy_source_is_feat_not_main`).
- `uploads/` deploy.sh sync etmiyor (memory `deploy_uploads_gap`) — KYC belgeleri için ya cloudinary ya manual rsync.
- RTK transformResponse `{data}/{items}` unwrap kalıbı (memory `rtk_envelope_unwrap_pattern`) — yeni endpoint'lerde unutma.
- i18n seed bash heredoc'unda `\"{name}\"` escape **bozuluyor** (2026-05-20 örneği). Tırnak gerektiğinde sade `{name}` kullan; cümleyi tırnaksız kur.
- Next ISR fetch-cache data değişiminde manuel temizle: `ssh ... rm -rf .next/cache/fetch-cache && pm2 reload`.
