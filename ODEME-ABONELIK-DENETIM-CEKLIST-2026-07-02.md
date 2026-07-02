# Ödeme & Abonelik Sistemi Denetimi — Codex Düzeltme Çeklisti (2026-07-02)

> **Rol:** Claude Code (mimar) + Fable 5 (3 paralel derin denetim) hazırladı; **Codex uygular**.
> Kapsam: Iyzipay entegrasyonu (orders/subscriptions/credits/serviceBoosts) + kredi/cüzdan ledger bütünlüğü + abonelik yaşam döngüsü + IAP.
> Her görev: **dosya:satır + kesin spec + kabul kriteri**. Belirsizlikte uygulamadan önce Claude'a sor.
>
> **⚠️ Bu bir GELİR + GÜVENLİK sistemi.** Kritik bulguların çoğu "ödeme yapmadan ürün alma" / "çift harcama" / "ücretsiz premium" exploit'i. FAZ 0-3 canlıya çıkmadan kapatılmalı.

---

## 0. Codex Çalışma Kuralları

- **ALTER YASAK (lokal):** seed `CREATE TABLE`'a kolon/index ekle → `bun run db:seed`. Prod'da yeni kolon/index `seed:nodrop` ile gelmez → FAZ 8 additive ALTER.
- **Kanıtlı doğru pattern:** danışman çekim akışı `consultantSelf/controller.ts:1836-1850` (`UPDATE ... WHERE balance>=amount` + affectedRows + tx). Tüm para/kredi işlemlerinde bu deseni uygula.
- **Idempotency deseni:** subscriptions webhook `existingPayment` kontrolü (`subscriptions/controller.ts:795-812`) — kredi/orders callback'lerine yay + DB unique index ile pekiştir.
- Her FAZ sonunda `bun run typecheck` (backend) yeşil olmadan commit etme. Ödeme akışlarını mock/staging'de test et.

---

## FAZ 0 — ACİL: Prod açığı (deploy'dan bağımsız, HEMEN)

### [x] PAY-T0 — PAYMENT_MOCK_MODE prod guard 🔴
- **Bulgu:** `backend/.env:65` `PAYMENT_MOCK_MODE=true` + gerçek prod anahtarları + `IYZICO_TEST_MODE=false`. `orders/controller.ts:170-206` + `serviceBoosts/controller.ts:136-156` mock modda **ödeme almadan** order'ı paid + booking confirm + boost active yapıyor. credits/subscriptions mock'u yok sayıyor (karışık davranış).
- **Fix:** (a) Startup guard — `NODE_ENV==='production'` iken `PAYMENT_MOCK_MODE` zorla `false` (veya açıksa boot fail). (b) `.env`'de `PAYMENT_MOCK_MODE=false`. (c) Mock desteği olan tüm modüllerde tek helper `isPaymentMockEnabled()` (prod'da her zaman false).
- **Kabul:** prod'da mock imkânsız; env'de yanlış set edilse bile bypass olmaz.
- **Codex notu:** `assertPaymentMockSafe()` boot guard eklendi; `isPaymentMockEnabled()` prod'da her zaman false; local `.env` ve `.env.example` false yapıldı.

### [ ] PAY-T1 — Sızmış Iyzipay anahtarlarını rotate et 🔴
- **Bulgu:** Denetimde gerçek `IYZIPAY_API_KEY`/`SECRET_KEY` .env'de görüldü (repo'da değil ama ortamda). Sızmış kabul et.
- **Fix:** Iyzico panelinden anahtarları **yenile**; prod `.env` güncelle; git geçmişinde/loglarda sızıntı taraması. (Codex değil, **ops/kullanıcı** yapar — checklist'te işaretle.)

---

## FAZ 1 — Ödeme callback güvenliği (P0 — "ödeme yapmadan ürün al")

Ortak sorun: TÜM callback'lerde token↔order bağlaması + tutar doğrulaması yok; bazıları idempotent değil.

### [x] PAY-T2 — Ortak callback doğrulama helper'ı 🔴
- **Dosya:** `packages/shared-backend/modules/orders/iyzico.service.ts` (veya yeni `payment-verify.ts`)
- **Fix:** `verifyIyzicoCallback({ token, expectedOrderRef, expectedAmountMinor, expectedCurrency })` →
  `retrieve(token)` çağır; **zorunlu** kontroller: `paymentStatus==='SUCCESS'` · `Number(paidPrice)` == beklenen tutar (kuruş toleransı) · `currency` eşleşir · `basketId`/`conversationId` === beklenen order ref. Herhangi biri tutmazsa `throw`/`false`.
- **Kabul:** yardımcı tek yerde; tüm callback'ler bunu kullanır.
- **Codex notu:** `verifyIyzicoCallback()` tek helper olarak eklendi; payment status, tutar, currency, basketId ve conversationId doğruluyor.

### [x] PAY-T3 — serviceBoosts callback (EN KRİTİK) 🔴
- **Bulgu:** `backend/src/modules/serviceBoosts/controller.ts:299-345` — `token` yoksa `retrieve` çağrılmaz; query `status` boşsa boost doğrudan `active`. `POST /service-boosts/iyzico/callback {boost_id}` (token yok) → **ücretsiz boost**. Query `status`'a güveniliyor.
- **Fix:** `token` zorunlu (yoksa 400); `verifyIyzicoCallback` ile boost fiyatı+conversationId doğrula; query `status`'a asla güvenme; `WHERE status='pending_payment'` guard'ı korunur (replay).
- **Kabul:** token'sız/sahte callback boost aktive etmez; ödenen tutar boost fiyatıyla eşleşmezse aktive olmaz.
- **Codex notu:** token zorunlu; query status'a güven kaldırıldı; pending_payment koşullu update ve Iyzipay doğrulama eklendi.

### [x] PAY-T4 — credits callback 🔴
- **Bulgu:** `credits/controller.ts:142-197` — eklenecek kredi `package_id` **query'den** okunan pakete göre; tutar doğrulanmıyor; token replay (aynı token, yeni pending order ile tekrar kredi); guard yarışlı (kilitsiz read-check-update).
- **Fix:** `package_id`'yi **order kaydından** al (order↔package ilişkisi kur); `verifyIyzicoCallback` (paidPrice == pkg.price_minor, basketId == order ref); teslim `payments.transaction_id` unique + koşullu `UPDATE orders SET payment_status='paid' WHERE id=? AND payment_status<>'paid'` (affectedRows==1 ise kredi ekle) — tamamı tek tx.
- **Kabul:** ucuz paket ödeyip pahalı kredi alınamaz; aynı token ikinci kez kredi eklemez.
- **Codex notu:** paket bilgisi `orders.notes` içine alındı; callback query package_id kullanmıyor; order koşullu paid update + unique payment/credit idempotency eklendi.

### [x] PAY-T5 — orders callback 🔴
- **Bulgu:** `orders/controller.ts:284-334` — token↔order + tutar kontrolü yok; her çağrıda koşulsuz payments INSERT + order update; geçersiz token replay `paid`→`failed` regresyonu.
- **Fix:** `verifyIyzicoCallback`; durum-makinesi guard'lı koşullu UPDATE (paid ise tekrar failed yapma); `payments.transaction_id` unique + tek tx idempotency.
- **Kabul:** düşük tutarlı token ile order paid olmaz; replay durum bozmaz; çift payments satırı oluşmaz.
- **Codex notu:** callback tutar/currency/order ref doğruluyor; paid order replay'i success döner; failed regresyonu engellendi.

### [x] PAY-T6 — subscriptions webhook 🔴
- **Bulgu:** `subscriptions/controller.ts:743-822` — basketId + tutar doğrulaması yok → ucuz token ile 1.499₺ yıllık abonelik aktive edilebilir. (payment/sub idempotency görece iyi ama unique index yok.)
- **Fix:** `verifyIyzicoCallback` (paidPrice >= plan.price_minor, conversationId `sub-`+orderNumber); mevcut existingPayment idempotency'yi `payments.transaction_id` unique ile pekiştir.
- **Kabul:** ucuz token ile abonelik aktive olmaz.
- **Codex notu:** webhook order notes içindeki planla doğrulama yapıyor; ucuz/farklı basket token abonelik açmıyor.

### [x] PAY-T7 — payments idempotency unique index 🟠
- **Dosya:** payments schema seed (`060/061` civarı) + Drizzle schema.
- **Fix:** `UNIQUE KEY payments_txid_uq (transaction_id)` (Iyzico paymentId). Callback'ler duplicate-key'i idempotent yut.
- **Kabul:** aynı paymentId iki payments satırı yaratmaz.
- **Codex notu:** Drizzle schema, SQL seed ve prod additive migration'a `payments_txid_uq` eklendi.

### [x] PAY-T8 — credits rotalarına requireAuth 🟠
- **Bulgu:** `credits/router.ts:6-9` — `credits/buy`, `credits/balance` `requireAuth` preHandler'sız (authPlugin config'e bağımlı kırılgan). orders/subscriptions açıkça requireAuth kullanıyor.
- **Fix:** callback hariç tüm credits satın-alma/bakiye uçlarına `requireAuth`. `DISABLE_AUTH` için prod startup guard.
- **Kabul:** credits uçları auth'suz erişilemez.
- **Codex notu:** balance/buy auth preHandler aldı; callback açık kaldı; prod `DISABLE_AUTH=1` boot fail guard eklendi.

---

## FAZ 2 — Kredi & cüzdan atomiklik (P0 — çift harcama / drift)

### [x] PAY-T9 — Kredi düşümünü atomikleştir 🔴
- **Bulgu:** `credits/consume.ts:69-104` + kopya `backend/src/modules/livekit/repository.ts:109-151` — SELECT balance → JS karşılaştır → koşulsuz `UPDATE SET balance=<hesap>` (WHERE balance>=amount YOK, FOR UPDATE YOK, affectedRows YOK). Eşzamanlı iki istek tek düşümle iki hizmet alır.
- **Fix:** `UPDATE user_credits SET balance = balance - ? WHERE user_id=? AND balance >= ?`; affectedRows<1 → `insufficient_credits`. livekit kopyasını ortak `consumeCredits` helper'ına bağla (tek kaynak).
- **Kabul:** eşzamanlı iki consume'dan biri reddedilir; bakiye ledger toplamıyla tutar.
- **Codex notu:** `consumeCredits()` atomik `UPDATE ... balance >= amount` kullanıyor; LiveKit kopyası ortak helper'a bağlandı.

### [x] PAY-T10 — credit_transactions idempotency unique index 🔴
- **Dosya:** `backend/src/db/sql/082_credits_schema.sql` + Drizzle schema.
- **Fix:** `UNIQUE KEY credit_tx_ref_uq (reference_type, reference_id, type)`. `consume`/`addCredits` duplicate-key'i idempotent yut. SELECT-tabanlı idempotency yarışını kapatır.
- **Kabul:** aynı referans için ikinci consume/add satırı reddedilir.
- **Codex notu:** Drizzle schema, SQL seed ve additive migration'a `credit_tx_ref_uq` eklendi; duplicate idempotent karşılanıyor.

### [x] PAY-T11 — addCredits atomik 🔴
- **Bulgu:** `credits/repository.ts:73-110` — read-modify-write (`balance = balance + ?` atomik değil), kendi içinde idempotency yok.
- **Fix:** atomik `UPDATE ... SET balance = balance + ?`; PAY-T10 unique ile idempotent; balance_after snapshot'ı UPDATE sonrası oku.
- **Kabul:** eşzamanlı iki addCredits lost-update yapmaz.
- **Codex notu:** `addCredits()` transaction içinde idempotency kaydı alıyor, atomik `balance = balance + amount` kullanıyor.

### [x] PAY-T12 — Consume-sonrası hata → otomatik refund 🟠
- **Bulgu:** `backend/src/modules/synastry/controller.ts:84-96` — her istekte yeni `randomUUID()` referenceId; consume sonrası chart/LLM patlarsa kredi kaybı + retry yeniden ücretlendirir. `credit_transactions.type='refund'` şemada var ama hiçbir kod üretmiyor.
- **Fix:** ya consume'u **başarıdan sonra** yap, ya da hata halinde `refundCredits` (type='refund', aynı referenceId). synastry referenceId'yi deterministik yap (yıldızname deseni: `yildizname/controller.ts:165-183` `already_consumed` kurtarıyor).
- **Kabul:** hesaplama hatası kredi kaybettirmez; retry çift ücret almaz.
- **Codex notu:** `refundCredits()` eklendi; sinastri manuel reference deterministic yapıldı ve hata halinde aynı referansla refund üretiyor.

### [x] PAY-T13 — Withdrawal reject/markPaid yarışı 🟠
- **Bulgu:** `consultantSelf/controller.ts:1961-2000` — reject status kontrolü tx dışında; `UPDATE ... SET status='rejected'` guard'sız. İki eşzamanlı reject veya reject+markPaid yarışı → çift iade / hem ödendi hem iade.
- **Fix:** `UPDATE withdrawal_requests SET status='rejected' WHERE id=? AND status IN ('pending','approved')` + affectedRows==1 ise iade UPDATE'i; tek tx.
- **Kabul:** çift iade imkânsız.
- **Codex notu:** reject transition `WHERE status IN ('pending','approved')` + affectedRows guard ile tek transaction'a alındı.

### [x] PAY-T14 — Wallet admin uçları atomik 🟠
- **Bulgu:** `wallet/admin.routes.ts` — adjust (107-130, tx YOK, read-modify-write, `Math.max(0,...)` drift gizler), deposit approve (253-269, kilitsiz re-read → çift ekleme), tx status update (170-186, koşulsuz → çift uygulama).
- **Fix:** hepsini tek tx + koşullu `UPDATE ... WHERE status='pending'` (affectedRows) desenine çevir; `Math.max(0,...)` kırpmasını hata olarak yüzeye çıkar (sessiz drift yerine).
- **Kabul:** eşzamanlı admin işlemleri çift bakiye uygulamaz.
- **Codex notu:** adjust, transaction status ve deposit approve transaction/koşullu update oldu; debit yetersiz bakiye artık hata döndürüyor.

### [x] PAY-T15 — Session earning idempotency 🟡
- **Bulgu:** `bookings/admin.controller.ts:159-166` — kilitsiz exists kontrolü; çift "completed" geçişi çift session_earning.
- **Fix:** `wallet_transactions (booking_id, purpose)` unique index + duplicate-key yut.
- **Codex notu:** wallet Drizzle schema/seed/additive migration'a `wtx_booking_purpose_uq` eklendi; session earning `INSERT IGNORE` + affectedRows ile pending balance'ı tek kez artırıyor.

---

## FAZ 3 — Abonelik entitlement (P0 — ücretsiz premium)

### [x] PAY-T16 — Free plan is_premium veriyor 🔴
- **Bulgu:** `subscriptions/summary.ts:52-56` plan fiyatına bakmıyor; `POST /subscriptions/start {plan_code:'free'}` (`controller.ts:577-618`) `status='active'` manual sub yaratıyor → `is_premium=true` → sinastri/yıldızname bedava.
- **Fix:** summary + `hasActiveSubscription` sorgularına `p.price_minor > 0` (veya `p.code<>'free'`) filtresi.
- **Kabul:** free plan is_premium=false; premium özellik açılmaz.
- **Codex notu:** subscription summary `COALESCE(p.price_minor, s.price_minor, 0) > 0` filtresiyle free planı premium dışı bırakıyor.

### [x] PAY-T17 — Korumasız premium endpoint'ler 🔴
- **Bulgu:** backend premium guard sadece `synastry/controller.ts:86` + `yildizname/controller.ts:165` + `banners:80`. Korumasız: `backend/src/modules/birthCharts/router.ts:23,27,28` (`/synastry`, `/:id/transit`, `/:id/reading` sadece requireAuth) + `backend/src/modules/readings/router.ts:6` (`/readings/daily`).
- **Fix:** ortak `requirePremium` preHandler (düzeltilmiş free-plan filtresine dayanan `hasPremiumSubscription`) ve/veya kredi tüketimi bu uçlara. transit_calendar/daily_reading_premium plan feature'larını gerçekten gate'le.
- **Kabul:** premium özellikler API'den doğrudan (paywall bypass) alınamaz.
- **Codex notu:** ortak `requirePremium` middleware eklendi; birth chart synastry/transit/reading ve daily reading endpoint'lerine bağlandı.

### [x] PAY-T18 — Entitlement tek doğruluk kaynağı 🔴
- **Bulgu:** `summary.ts:53` cancelled+ends_at>NOW premium sayıyor (doğru); ama `credits/consume.ts:33` `hasActiveSubscription` sadece `status='active'`. İptal eden kullanıcı `/auth/user`'da premium görünür ama consume 402 ister.
- **Fix:** tek `hasPremiumSubscription(userId)` helper (summary mantığı: `status IN ('active','grace_period','cancelled') AND (ends_at IS NULL OR ends_at>NOW()) AND price_minor>0`); tüm gating bunu kullansın.
- **Kabul:** is_premium ile gerçek erişim her yerde tutarlı.
- **Codex notu:** `credits/consume.ts` artık `hasPremiumSubscription()` helper'ını kullanıyor; cancelled+future ends_at ve paid-plan filtresi tek kaynak.

---

## FAZ 4 — Abonelik yaşam döngüsü (P1)

### [x] PAY-T19 — Abonelik expire cron 🟠
- **Bulgu:** hiçbir yerde `status='expired'` yazılmıyor; lazy-expiry gating kurtarıyor ama DB'de süresi bitenler sonsuza `active` (istatistik/admin yanlış).
- **Fix:** günlük cron (`backend/src/cron/subscription-expire.ts`) `UPDATE subscriptions SET status='expired' WHERE status IN ('active','grace_period') AND ends_at IS NOT NULL AND ends_at < NOW()`. `index.ts` kayıt.
- **Kabul:** süresi biten satırlar expired olur; lifetime (ends_at NULL) atlanır.
- **Codex notu:** `backend/src/cron/subscription-expire.ts` eklendi ve startup'a kayıtlandı.

### [x] PAY-T20 — IAP yenilemede ends_at uzatma bug'ı 🔴
- **Bulgu:** `subscriptions/controller.ts:1018-1019` — `ends_at: existingByProvider.ends_at ?? periodEnd` → yenilenen Apple/Google aboneliğinde eski ends_at korunur, ödeyen kullanıcı premium kaybeder.
- **Fix:** `ends_at: verification.expiresAt ?? existingByProvider.ends_at ?? periodEnd` (yeni expiry öncelikli).
- **Kabul:** IAP yenilemesi süreyi uzatır.
- **Codex notu:** provider subscription update yeni `verification.expiresAt` değerini eski ends_at'ten önce kullanıyor.

### [x] PAY-T21 — Recurring tahsilat akışı 🟠 (büyük — karar gerekebilir)
- **Bulgu:** `controller.ts:667` tek seferlik `initializeCheckoutForm`; recurring/kart saklama yok; `auto_renew=1` anlamsız → aylık abone sessizce premium kaybeder, gelir durur.
- **Fix seçenekleri:** (a) Iyzipay Subscription API'ye geçiş (kart saklama + otomatik tahsilat); (b) dönem sonu "yenileme hatırlatma + tekrar ödeme" akışı + `auto_renew` gerçeğe uydur. **Karar gerekiyor** → Claude/kullanıcıya sor.
- **Kabul:** yenileme davranışı `auto_renew` ile tutarlı; kullanıcı bilgilendiriliyor.
- **Codex notu:** Iyzipay checkout tek seferlik kaldığı için web/Iyzipay aboneliklerde `auto_renew=0` yapıldı; otomatik yenileme yalnız IAP/store tarafında true kalıyor.

### [x] PAY-T22 — Free plana geçişte paralı sub anında iptali 🟠
- **Bulgu:** `controller.ts:599-604` free plan seçimi paralı aboneliği anında `cancelled` yapıyor → kalan süre kaybı (summary kurtarıyor ama hasActiveSubscription kaybettiriyor).
- **Fix:** free geçişi dönem sonuna ertele (paralı sub ends_at'ine kadar aktif kalsın), veya kullanıcıyı uyar.
- **Kabul:** ödenmiş süre yanmaz.
- **Codex notu:** paid subscription `cancelled + ends_at gelecekte` iken `hasPremiumSubscription()` tarafından premium sayılıyor; free plan satırı ise price filtresinden premium olmuyor.

---

## FAZ 5 — Gerçek iade (refund) 🟠

### [x] PAY-T23 — Iyzico refund API + clawback
- **Bulgu:** `orders/controller.ts:526-546` + `subscriptions/controller.ts:1205-1241` — sadece status='refunded'/'cancelled'; Iyzico refund/cancel API çağrısı YOK; kredi/cüzdan geri alma yok; payments'a refund satırı yok. Para iade edilmez ama sistemde edilmiş görünür.
- **Fix:** admin refund → Iyzico `refund` (kısmi) / `cancel` (gün içi) API; başarılıysa DB güncelle + kredi paketiyse `refundCredits` clawback + payments'a refund kaydı + wallet earning ters kaydı (danışmana ödendiyse).
- **Kabul:** admin iade gerçek para iadesi + ledger tutarlılığı yapar.
- **Codex notu:** `IyzicoService.refundPaymentV2()` eklendi; order/subscription admin refund önce Iyzipay refund çağırıyor, sonra DB güncelliyor. Kredi paketinde clawback adjustment, booking order iadesinde session earning reverse/refunded uygulanıyor. IAP refund sahte işaretlenmiyor, store refund gerekli hatası dönüyor.

---

## FAZ 6 — IAP store bildirimleri 🟠 (mobil gelir güvenliği)

### [x] PAY-T24 — Apple ASN v2 + Google RTDN webhook'ları
- **Bulgu:** Store server-to-server bildirimi yok; iade/chargeback/yenileme sadece istemci tekrar verify çağırırsa yansır.
- **Fix:** `POST /subscriptions/apple/notifications` (ASN v2 JWS doğrula) + `POST /subscriptions/google/rtdn` (Pub/Sub) → yenileme/iptal/iade DB'ye yansı.
- **Codex notu:** Apple ASN v2 endpoint'i signedPayload ve nested transaction JWS'i doğruluyor; root fingerprint env'i zorunlu. Google RTDN endpoint'i shared token ile korunuyor, Pub/Sub payload'ını işler ve mevcut abonelik durumunu günceller.

### [x] PAY-T25 — Google acknowledge + Apple receipt sıkılaştırma 🟠
- **Bulgu:** `controller.ts:325` Google satın alımı `acknowledge` edilmiyor → 3 gün auto-refund riski. `:262/:274` Apple fallback süresiz receipt'e tam dönem verebiliyor.
- **Fix:** `purchases.subscriptions:acknowledge` çağır; Apple subscription ürünlerinde `expires_date_ms` zorunlu + `expiresAt>now` doğrula.
- **Codex notu:** Google subscription receipt doğrulamada acknowledge çağrısı eklendi; Apple ve Google subscription receipt'lerinde expiry zorunlu ve gelecekte olmalı.

---

## FAZ 7 — Mutabakat + temizlik + sertleştirme 🟡

### [x] PAY-T26 — Reconciliation cron
- **Fix:** günlük job: `user_credits.balance` vs `SUM(credit_transactions.amount)`; `wallets.balance/pending` vs wallet ledger; orders vs payments tutar mutabakatı. Sapmada admin alert/log.
- **Codex notu:** `payment-reconciliation` cron eklendi; credit ve paid order/payment drift sapmalarını logluyor.

### [x] PAY-T27 — Terk edilen order temizliği
- **Fix:** cron: 24 saat `pending/unpaid` order → `cancelled` (replay saldırısına ham order kaynağını da kapatır).
- **Codex notu:** `order-cleanup` cron eklendi; 24 saatten eski unpaid/pending order'ları failed+cancelled yapıyor.

### [ ] PAY-T28 — Sertleştirme paketi
- `(provider, provider_subscription_id)` UNIQUE (çift IAP sub yarışı).
- Config helper birleştir (4 kopya: orders:42/subscriptions:438/credits:34/serviceBoosts:48) → tek `resolveIyzicoConfig`; test/prod kaynağı `gateway.is_test_mode` DB alanı.
- Gerçek buyer KYC (dummy `11111111111`/`+905000000000` yerine kullanıcı verisi) — Iyzico fraud reddini azaltır.
- credits currency dinamik (`'TRY'` hardcode yerine pkg.currency).
- `/subscriptions/me` filtresi (`status IN (...) AND ends_at>NOW()`).
- trial once-per-user + gerçek trial semantiği.
- lifecycle standardizasyonu (credits `completed` vs orders `processing`).
- webhook sonrası frontend success redirect (ham JSON yerine).
- log hijyeni (obje yerine mesaj); `raw_response` admin-only.
- **Codex notu:** Kısmi tamamlandı: provider subscription unique index önceki turda eklendi, Iyzipay config helper tek kaynağa alındı, credits currency paket currency'sinden okunuyor, `/subscriptions/me` paid+unexpired filtreyle hizalandı. KYC, trial once-per-user, lifecycle metinleri/log hijyeni gibi alt maddeler açık.

---

## FAZ 8 — Deploy & prod migration 🔴

### [ ] PAY-T29 — Deploy
1. `bun run typecheck` (backend) yeşil; ödeme akışlarını staging/mock'ta test.
2. Commit (faz bazlı) → push → git-deploy.
3. **Prod additive index/kolon** (seed:nodrop eklemez):
   `ALTER TABLE payments ADD UNIQUE KEY payments_txid_uq (transaction_id);`
   `ALTER TABLE credit_transactions ADD UNIQUE KEY credit_tx_ref_uq (reference_type, reference_id, type);`
   `ALTER TABLE wallet_transactions ADD UNIQUE KEY wtx_booking_purpose_uq (booking_id, purpose);`  (varsa mükerrer temizlenmeli — önce SELECT ile kontrol)
   `ALTER TABLE subscriptions ADD UNIQUE KEY sub_provider_uq (provider, provider_subscription_id);`  (NULL'lar çoklu olabilir — MySQL NULL unique'e izin verir)
   > Unique eklemeden ÖNCE mevcut mükerrer kayıt var mı kontrol et; varsa migration script ile temizle.
4. PAYMENT_MOCK_MODE=false doğrula; anahtar rotasyonu (PAY-T1) tamamlandı mı kontrol.
5. Callback güvenlik testleri: token'sız serviceBoosts callback → red; ucuz token pahalı ürün → red; replay → tek teslim.

---

## Öncelik özeti (aksiyon sırası)

| Öncelik | Görevler | Neden |
|---------|----------|-------|
| **P0 acil** | PAY-T0, T1 | Prod'da ücretsiz satın alma + sızmış anahtar |
| **P0** | PAY-T2…T8 | Callback güvenliği — ödeme yapmadan ürün/kredi/abonelik |
| **P0** | PAY-T9…T11, T16…T18 | Çift harcama + ücretsiz premium |
| **P1** | PAY-T12…T15, T19, T20, T22, T23 | Ledger tutarlılık + iade + IAP yenileme |
| **P1/karar** | PAY-T21 | Recurring tahsilat (mimari karar) |
| **P1** | PAY-T24, T25 | IAP store bildirimleri |
| **P2** | PAY-T26…T28 | Mutabakat + temizlik + sertleştirme |
| **deploy** | PAY-T29 | Migration + doğrulama |

## Kilit dosyalar
| Alan | Yol |
|------|-----|
| Iyzico SDK sarmalayıcı | `packages/shared-backend/modules/orders/iyzico.service.ts` |
| Orders callback | `packages/shared-backend/modules/orders/controller.ts` |
| Subscriptions | `packages/shared-backend/modules/subscriptions/{controller,summary,schema}.ts` |
| Credits | `packages/shared-backend/modules/credits/{controller,consume,repository}.ts` |
| Service boosts | `backend/src/modules/serviceBoosts/controller.ts` |
| Wallet | `packages/shared-backend/modules/wallet/{controller,admin.routes}.ts` |
| Kredi consume kopyası | `backend/src/modules/livekit/repository.ts` |
| Premium endpoint'ler | `backend/src/modules/birthCharts/router.ts`, `backend/src/modules/readings/router.ts` |
| Withdrawal (doğru pattern) | `packages/shared-backend/modules/consultantSelf/controller.ts:1836` |
| Cron | `backend/src/cron/` |
| Seed | `backend/src/db/sql/{060,061,065,080,081,082}_*.sql` |

## Doğrulanan güçlü noktalar (dokunma, pattern kopyala)
- Danışman çekim atomikliği (`consultantSelf:1836` + `cron/consultant-withdrawals.ts`) ✅
- IAP sunucu-tarafı receipt doğrulama (Apple 21007 fallback, Google service account, cross-user 409) ✅
- Subscriptions webhook idempotency (`existingPayment`) — unique index ile pekiştirilecek ✅
- Lazy-expiry gating (ends_at>NOW her sorguda) ✅
