# GoldMoodAstro — Dashboard Denetim & İyileştirme Checklist

> Tarih: 2026-07-01 · Denetim: Fable 5 (3 paralel derin inceleme) · Kapsam: Kullanıcı (danışan) + Danışman dashboard'ları + ilgili backend
> Önem: 🔴 kritik (güvenlik/veri kaybı/kırık akış) · 🟠 yüksek (yanlış davranış/UX kırığı) · 🟡 orta/iyileştirme
> Not: "doğrulanmadı" = kod akışından çıkarıldı, runtime'da test edilmedi.

---

## A. KULLANICI (DANIŞAN) DASHBOARD

### 🔴 Kritik
- [x] **Şifre değişimi mevcut şifre doğrulaması OLMADAN yapılıyor** — `dashboard/page.tsx:302-315` + `packages/shared-backend/modules/auth/controller.ts:746-770`. "Current password" toplanıyor ama gönderilmiyor; `PUT /auth/user` eski şifreyi istemiyor/doğrulamıyor → açık oturum şifreyi **ve e-postayı (re-verify yok)** değiştirebilir = hesap ele geçirme. **Fix:** backend `updateBody`'ye zorunlu `current_password` + hash karşılaştırma; FE `passData.old` gönder; e-posta değişimini doğrulama akışına bağla.
- [x] **Mesaj kutusu düz kullanıcıda 403 (kök neden) — `/me/customer/threads*` `requireConsultant` ile korunuyor** — `packages/shared-backend/modules/consultantSelf/router.ts:8,49-53`. role=`user` danışan kendi gelen kutusuna erişemiyor (UserMessagesPanel dashboard'da). **Fix:** `/me/customer/*` rotalarını `[requireAuth]`'a düşür (controller zaten `chat_participants` üyeliğiyle yetki kontrolü yapıyor, 2344-2349).
- [x] **Mesaj balonu hizalaması yanlış** — `UserMessagesPanel.tsx:101-103,206`. `myUserId` son mesajın `from_self`'inden türetiliyor ama backend mesaj satırlarında `from_self` dönmüyor → danışman son mesajı attıysa kullanıcının kendi mesajları da "karşı taraf" gibi sola hizalanır. **Fix:** `useAuthStore` `user.id` ile `mine = m.sender_user_id === user.id`; veya backend satırlara `from_self` ekle.
- [x] **me/settings "DELETE ACCOUNT" butonu ölü** — `me/settings/page.tsx:164-166`. `onClick` yok; backend (`/auth/account/delete`) + çalışan UI (`profile/privacy`) hazır. KVKK riski. **Fix:** privacy'ye linkle veya `useRequestAccountDeletionMutation` bağla.

### 🟠 Yüksek
- [x] **Booking status rozeti çevrilmiyor** — `dashboard/page.tsx:687`. `status_label_tr/en` backend'de yok; ham enum (confirmed/pending...) gösteriliyor. **Fix:** status → `ui()` anahtar map'i.
- [x] **Booking "Details" (göz) butonu kendine dönen ölü link** — `dashboard/page.tsx:729-735` → `/booking/{id}` → proxy → `/profile/bookings` → `/dashboard?tab=bookings`. **Fix:** butonu kaldır veya `?highlight` ile scroll+vurgu uygula.
- [x] **Kredi sayfası i18n bozuk** — `me/credits/page.tsx:33,93,101`. `pkg.nameTr` (locale yok sayılıyor) + `buyCredits` `locale:'tr'` hardcoded + sabit `₺`. **Fix:** locale'i packages query + buy body'sine geçir, `pkg.name` kullan, `currency` sembolü.
- [x] **me/readings numeroloji kaydı 404** — `me/readings/page.tsx:42,159`. `/numeroloji/<id>` sayfası yok; dashboard index'e yönlendiriyor (tutarsız). **Fix:** index'e yönlendir.
- [x] **`me/readings`, `me/credits`, `me/settings` orphan + guard yok** — auth guard yok, hiçbir yerden link verilmiyor, dashboard sekmeleriyle duplike ve ayrışmış. **Fix:** ya guard+navigasyon, ya dashboard'ı kanonik kabul edip bunları redirect'e çevir/sil.
- [x] **Okuma detay endpoint'leri public + ownership yok** — `tarot/coffee/dreams/yildizname router.ts` `reading/:id` auth'suz; kişisel içerik UUID ile herkese açık (`synastry` tryAuth'lu — tutarsız). Paylaşım linki mi belirsiz (doğrulanmadı). **Fix:** `is_public` bayrağı + uyarı, ya da `tryAuth` + owner-veya-public.
- [x] **Mesajlarda canlı güncelleme yok** — `UserMessagesPanel.tsx:41-48`. polling/WS yok; danışman cevabı yenilemeden görünmez. **Fix:** `pollingInterval` (threads 30sn, mesajlar 10-15sn).
- [ ] **me/readings büyük ölçüde çevrilmemiş/dil karışık** — `TYPE_CONFIG`/`FILTERS`/boş durum hardcoded. **Fix:** `ui()`'ye taşı; dashboard `HISTORY_TYPES/HISTORY_META` ile ortak modüle çıkar.

### 🟡 Orta / İyileştirme
- [x] "Member since" görünmüyor — `/auth/user` `created_at` dönmüyor (`dashboard/page.tsx:278-283`).
- [x] `UserMessagesPanel` `isTr` ölü + tarih hep `tr-TR` (21,35-39); `BookingMessageButton.tsx:37` aynı.
- [ ] Sekme geçişi `replaceState` vs kart `Link` push — history tutarsız.
- [x] Login redirect `?tab` kaybediyor (`dashboard/page.tsx:195`).
- [x] Ölü `AlertDialog` importları (`dashboard/page.tsx:48-58`); `window.confirm`'e geçilmiş.
- [x] Silme sonrası çift fetch (invalidate + manuel `refetchHistory`).
- [x] `CityAutocomplete` EN kullanıcı `tr` şehirlerine hapsoluyor (`dashboard/page.tsx:607`).
- [x] Şifre inputlarında `autocomplete`/`required`/`minLength` yok.
- [x] me/settings toggle anlık kayıt izlenimi + Save `isLoading`/disabled yok + `aria-checked` yok.
- [x] me/credits balance hatası "0" olarak gizleniyor (`isError` göster).
- [x] Review modal `targetId` fallback şüpheli (`consultant_id || resource_id`) — `consultant_id` yoksa butonu gizle.
- [x] History boş durum CTA'sı filtreyi yok sayıyor (hep `/tarot`).

---

## B. DANIŞMAN (CONSULTANT) DASHBOARD

### 🔴 Kritik
- [x] **KYC belgeleri hiç kaydedilmiyor + kimlik görselleri PUBLIC bucket'ta** — `ConsultantDashboard.tsx:1543-1565` / `consultantSelf/controller.ts:29-76`. `KycUploadBox` public `uploads/kyc`'ye yüklüyor; güvenli `uploadKycDocument` endpoint'i web'de kullanılmıyor; `kyc_documents` PATCH body'de ama `profilePatchSchema`'da yok → Zod düşürüyor. UI "yüklendi" der, DB'ye yazılmaz. KVKK riski. **Fix:** `POST /me/consultant/kyc/documents?type=` endpoint'ine bağla; PATCH'ten `kyc_documents`'ı çıkar.
- [x] **Profil kaydetme KYC tamamlanmadan HER ZAMAN 400** — `ConsultantDashboard.tsx:718-735` / `controller.ts:292-298`. `handleSave` her kayıtta `account_type/identity_number/bank_account_holder` gönderiyor → `touchesKyc=true` → `bank_account_holder` zorunlu + TC checksum. Yeni danışman bio değiştirip kaydedemez. **Fix:** dirty-diff PATCH veya `touchesKyc` kontrolünü `submitKyc`'e taşı.
- [x] **`approveBooking`'de statü guard yok → çifte rezervasyon / ödemesiz onay** — `controller.ts:653-711`. reject edilip slotu serbest kalmış (başkasına satılmış) booking approve edilince confirmed; `pending_payment` ödemesiz confirmed; expired `requested_now` onaylanabilir; `cancelled/completed`→confirmed. **Fix:** `WHERE status IN ('pending','pending_payment','requested_now')` + `requested_now` 5dk kontrolü + slot yeniden-rezerve kontrolü.
- [x] **Çekim talebinde `affectedRows` kontrolü yok → bakiye düşmeden talep** — `controller.ts:1727-1776`. Bakiye kontrolü tx dışında (TOCTOU); `UPDATE wallets ... WHERE balance>=amount` 0 satır etkilese bile `withdrawal_requests`+debit INSERT ediliyor (admin onaylarsa çifte ödeme). **Fix:** UPDATE affectedRows=0 ise tx abort (throw).

### 🟠 Yüksek
- [x] **Yayınlanmış blog düzenlemesi yayın durumunu koruyor — admin moderasyon bypass** — `controller.ts:571-593` + `BlogPanel.tsx:127-129`. `updateBlogPost` `is_published`'a dokunmuyor; danışman taslağı onaylatıp canlı içeriği serbestçe değiştirebilir; yayınlanmışı silebilir. **Fix:** consultant update'te `is_published:false`'a çek (yeniden onay) veya düzenlemeyi kilitle; silmeyi taslağa sınırla.
- [x] **`/storage/:bucket/upload` tamamen auth'suz** — `storage/router.ts:9`, `controller.ts:98-204`. `preHandler` yok → anonim yükleme; MIME kontrolü sadece `consultant_avatars`+`coffee`'de; deterministik path + upsert ile başka danışmanın blog kapağı anonim ezilebilir. **Fix:** `requireAuth` + bucket-bazlı sahiplik/rol + `consultant_blog` image MIME zorunlu. *(Not: 2026-07-01 path→uuid fix'i uygulandı; auth hâlâ eksik.)*
- [x] **Expertise/languages limit çelişkisi save'i kırıyor** — FE max20 / backend `z.max(8)`; boş dizi backend `.min(1)`. **Fix:** limitleri tek kaynaktan eşitle; boş diziyi FE'de engelle/anlamlı hata.
- [x] **`rejectBooking`'de statü guard yok** — `controller.ts:716-783`. confirmed/completed reddedilebilir, iade/kazanç geri alma yok. **Fix:** `cancellable` liste kontrolü + ödenmişse refund.
- [x] **Overview kazanç BRÜT, Wallet NET (%30 düşük) — iki farklı rakam** — `controller.ts:868-890`. "This Month" aslında rolling 30 gün. **Fix:** stats'a net hesap/"brüt" etiketi + takvim ayı ya da "son 30 gün" etiketi.
- [x] **KYC submit `handleSave` başarısız olsa da gönderiliyor** — `ConsultantDashboard.tsx:1033-1041`. **Fix:** `handleSave` boolean dönsün, false'ta submit dur.
- [x] **Yorum yanıtı sessizce kaybolabilir + duplicate satır riski** — `controller.ts:2024-2032` (sadece UPDATE, satır yoksa 0 etkiler ama 200) ve `listMyReviews` `LEFT JOIN review_i18n` locale filtresiz → aynı yorum 2-3 kez listelenebilir (duplicate React key). İki farklı reply implementasyonu (consultantSelf vs review modülü). **Fix:** UPSERT'e delege; `listMyReviews`'a `i.locale=r.submitted_locale` / `GROUP BY r.id`; tek reply endpoint.
- [x] **Availability kaydı transaction'sız DELETE+INSERT** — `controller.ts:2144-2151`. Ortada hata olursa tüm çalışma saatleri kaybolur. **Fix:** `db.transaction`.
- [x] **Chat mesajlarında bildirim yok + panel polling/WS yok** — `controller.ts:1430-1483,2404-2440`. reply'lar notification/push üretmiyor; MessagesPanel'de canlı güncelleme yok. **Fix:** reply'da karşı tarafa notification+push; panele `pollingInterval` veya WS.
- [x] **Boost paket fiyatları FE'de hardcoded** — `ServicesPanel.tsx:711-715` `{599,1099,1899}`, backend site-setting'ten okuyor → yanlış fiyat/checkout tutarsızlığı. **Fix:** API'den çek.
- [x] **ReviewsPanel filtre sayaçları 'unreplied' seçiliyken yanlış** — `ReviewsPanel.tsx:40-53`. Sayaçlar daraltılmış listeden hesaplanıyor. **Fix:** sayaçları filtresiz cache'ten hesapla.
- [x] **Danışman onaysız yorumları görüyor; `is_verified` rozeti render edilmiyor** — `controller.ts:1990-1995`. Sadece `is_active=1` filtre; moderasyon bekleyen yorum "yayında" görünür. Tipteki `customer_name/user/title/booking_id/admin_reply` backend'de dönmüyor (ölü alanlar). **Fix:** "onay bekliyor" + "doğrulanmış randevu" rozetleri; tip↔SELECT eşitle.
- [x] **Optimistic update yalnız filtresiz cache'i yamalıyor** — `consultant_self.endpoints.ts:406-462`. Statü filtresi aktifken approve/reject anında yansımaz.
- [x] **Cüzdan filtre/CSV yalnız ilk 50 işlemde** — `WalletPanel.tsx:107-123`. `from/to/page/type` FE'den gönderilmiyor → eksik export. **Fix:** query param'ları geçir; CSV için tüm sayfalar.

### 🟡 Orta / İyileştirme
- [x] Overview acil rozet expired talepler için de yanıyor (backend 5dk filtresi yok) — `controller.ts:899-902`.
- [x] Paid servis `price 0` çelişkisi (FE≥0 / backend>0) → ham hata kodu (`ServicesPanel.tsx:125,510`).
- [x] "Loyal" rozeti yanlış (`idx===0`=en son randevu) + iptal/red booking'ler sayılıyor (`ClientsPanel.tsx:128-133`).
- [x] `ClientsPanel` debounce yok + çifte filtre (44-53).
- [x] Availability preset tüm haftayı REPLACE ediyor (onay yok) (`AvailabilityPanel.tsx:105-108`).
- [x] Kapasite kalıntısı: backend `capacity max(100)` hâlâ kabul; eski `capacity>1` geri yazılıyor. **Fix:** backend'de 1'e sabitle.
- [ ] Timezone: `toISOString().slice(0,10)` UTC (`AvailabilityPanel.tsx:71`); Wallet tarih filtresi UTC-midnight; RequestNow sayaç TZ riski; ProfileViews gün sınırı.
- [x] Profil tamamlama "Go→" butonu ölü (backend item'da `tab` yok) + Türkçe hardcoded label (`controller.ts:1202-1212`).
- [x] `CompletionScoreWidget` ring rengi çalışmıyor (`bg-*` yerine `text-*` olmalı) (`ConsultantDashboard.tsx:1466-1472`).
- [x] `ConsultantCardPreview` kök div `relative` değil → "Preview" overlay tüm sidebar'ı kaplar (40,117). Ayrıca `₺` hardcoded, "Verified" rozeti approval'dan bağımsız hep görünür, `rating_avg` null → "NaN", video seans fiyatı önizlenmiyor.
- [x] `MessagesPanel`: thread değişince taslak temizlenmiyor (yanlış kişiye gönderme riski) (41,109); `isError` yutuluyor; okundu çift-işaretleme (GET yan etkisi + `markAsRead`); `tr-TR` hardcoded.
- [x] CSV escape + BOM yok (Excel Türkçe bozulur) (`WalletPanel.tsx:340`).
- [x] Para birimi format tutarsız (Wallet `1.234,56 TRY` vs `₺X`) — tek helper.
- [x] "Deactivate" hızlı butonu kaydedilmemiş taslağı da persist ediyor (`ServicesPanel.tsx:587`).
- [x] Boost rozeti metni bozuk birleşim (`{days}` çift) (`ServicesPanel.tsx:553`).
- [ ] Blog: kapak kaldırınca `image_url` temizlenmiyor (`controller.ts:588`); sahiplik serbest-metin tag marker'ıyla (enjeksiyon/kayıp riski) — `author_user_id` kolonu ekle; taslak locale-bazlı görünürlük kafa karıştırıcı.
- [x] Tab state popstate ile senkron değil (`ConsultantDashboard.tsx:94-103`).
- [ ] Backend bildirim/e-posta/mesajları Türkçe hardcoded (çok dilli platform) (`controller.ts:666-669,743-745,819-820,1785`).
- [x] Cüzdan seçimi `ORDER BY`'sız belirsiz + zorla `consultant_id` bağlama (`controller.ts:1493-1525`).
- [ ] Performans: `listMessageThreads` N+1 (thread başına 3-4 sorgu, LIMIT yok); `listBookings` LIMIT 200 sabit, sayfalama yok.
- [x] ProfileViews ölü kod (`RANGE_OPTIONS.label`, `{skip:false}`) + bayat "endpoint yakında" hata metni.
- [x] ReviewsPanel buton "Publish Review" (yanıt yayınlanıyor, yorum değil) + `aria-label`/`title` hardcoded İngilizce.

---

## C. OLUMLU BULGULAR (denetimde sağlam çıkanlar)
- Danışman `/me/consultant/*` endpoint'leri scope'lu (`getCallerConsultant`); danışmanlar arası **yatay erişim yok**.
- Withdraw'da KYC şartı hem FE hem BE (403).
- Kalan panellerde (Messages/Reviews/Blog) **RTK `{data}` unwrap doğru** (`res.data ?? []`) — bu bug burada yok.
- Chat thread sahiplik SQL'leri (consultant_lead + booking EXISTS) doğru; reply maxLength FE/BE eşit (2000).
- ProfileViews: bot filtresi + 30dk throttle + 90 gün KVKK anonimleştirme cron'u düzgün.

---

## ÖNERİLEN SIRA (uygulama)
1. **Güvenlik 🔴 (hemen):** şifre-current-password doğrulaması, KYC public-bucket + belge persist, storage upload auth, çekim affectedRows guard.
2. **Kırık akışlar 🔴:** customer threads 403 (mesaj kutusu), mesaj hizalama, DELETE ACCOUNT butonu, profil kaydet 400, booking approve/reject guard.
3. **Para/veri doğruluğu 🟠:** brüt/net kazanç etiketi, boost fiyat API, availability transaction, yorum reply upsert/duplicate.
4. **i18n & UX 🟠/🟡:** status rozet çeviri, kredi/readings i18n, polling, orphan me/* sayfaları, timezone.
5. **Kozmetik/temizlik 🟡:** kalan liste maddeleri.

> Uygulama notu: değişiklikler git akışıyla (push → canlıda `git pull` + build + seed + pm2 restart) deploy edilir. Her düzeltmede ilgili tarafın typecheck'i + mümkünse playwright doğrulaması yapılmalı.
