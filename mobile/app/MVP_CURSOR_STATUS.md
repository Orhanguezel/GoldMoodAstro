# MVP checklist — Cursor (mobil) durum özeti

**Kaynak:** `doc/mvp-checklist.md` (bu dosya oradaki maddeleri **yansıtır**; ana plan dosyası paralel geliştirici tarafından güncellenir — `.cursorrules` gereği `mvp-checklist.md` Cursor ile **işaretlenmez / editlemez**).

**Son tarama:** 2026-05-16

---

## FAZ 0 — Temizlik

| Madde | Cursor / mobil |
|-------|----------------|
| T0-1 … T0-6 | Backend/frontend işi; mobil kodda Cursor görevi yok. |

---

## FAZ 1 — Backend core

| Madde | Cursor / mobil |
|-------|----------------|
| T1-1 … T1-6 | Backend; `mobile/REQUESTS.md` ile endpoint isteği dışında iş yok. |

---

## FAZ 2 — Admin

| Madde | Cursor / mobil |
|-------|----------------|
| T2-* | Admin panel; Cursor sahası dışı. |

---

## FAZ 3 — Expo Mobile (M0–M5)

Ana checklist’te FAZ 3 tamam işaretli. Kod doğrulaması:

- [x] **T3-0 … T3-6** — Scaffold, onboarding, auth, danışman/randevu, ödeme, görüşme, ayarlar mevcut.
- [x] **FAZ 32 (doğum haritası)** — Mobil: offset / wheel; liste `loading` + girişli `setLoading(true)`; **`authHydrating`** ile kısa spinner, sonra misafir CTA veya harita — token varken misafir flash yok.
- [x] **Büyük Üçlü (FAZ 20)** — `/zodiac/big-three` (`POST /birth-charts/preview-big-three`), Burçlar sekmesinden erişim.
- [x] **Doğum haritası misafir** — Giriş yoksa natal sekme artık yönlendirme kartı (giriş / üye ol / hesapsız büyük üçlü); yanıltıcı `+`/birthdata 401 zinciri kesildi.
- [x] **Onboarding `birthdata`** — Oturumsuz uyarı + API öncesi `setAuthToken` (Authorization senkronu); Alert “Kayıt / Giriş” `router.push`.
- [x] **Bugün / Günlük (misafir)** — `today`: iskelet `authHydrating` veya girişli veri yüklenirken (`isAuthenticated && loading`); misafirde başlangıç `loading=false` + `loadData` içinde girişli `setLoading(true)`. CTA kartı + sahte Güneş/Ay rozeti yok (`mainChart`). `daily`: API yalnızca girişliyken; misafire açıklama + giriş. **Onboarding karşılama** — “Hesap oluştur” satırı (`/auth/register`). **Danışman detay** — mesaj için Alert’te “Kayıt ol”.
- [x] **HTTP 401 (merkezi)** — Süresi dolmuş JWT ile korumalı istek → oturum temizle + `/auth/login` (`login` / `register` / `social-login` istisna).

**2026-05-15 ek düzeltmeler (checklist “M0-3 / bildirim” ile uyum):**

- [x] Giriş, kayıt ve Apple ile giriş denemesi öncesi `setAuthToken(null)` — eski Bearer yanlışlıkla gönderilmez.


- [x] `useAuth` — `authHydrating` (ilk oturum kontrolü; `loading` ile aynı) export; misafir/giriş dallarında tercih edilen isim.
- [x] `useAuth` — kayıtlı oturumla açılışta `registerPushToken()` yeniden denenir.
- [x] Giriş / kayıt / Apple girişi sonrası `registerPushToken()` — token backend’e oturum açıldıktan sonra da iletilir.
- [x] Push `data.booking_id` veya `bookingId` → `/booking/[id]` derin link; `screen: 'bookings'` → randevular sekmesi.
- [x] **Randevular (`(tabs)/bookings`)** — Misafirde `router.replace` kaldırıldı; `loading` kilidi `setLoading(false)` ile çözülür; tanıtım + Giriş / Kayıt + danışmanlara git.
- [x] **Bildirimler (`/notifications`)** — Misafirde aynı CTA ekranı; liste yalnızca girişliyken.
- [x] **Profil sekmesi (`(tabs)/profile`)** — Misafirde sonsuz yükleyici yerine özet + Giriş / Kayıt + Danışmanlar; `router.replace` yok.
- [x] **Favoriler sekmesi** — `refreshFavorites()` race düzeltmesi; misafir bandı `!authHydrating && !isAuthenticated`; Giriş linki.
- [x] **Sohbet (`/chat/[id]`)** — Oturum + geçersiz `id` koruması.
- [x] **Randevu detay / checkout / görüşme / değerlendirme** — `booking/[id]`, `booking/checkout`, `call/[bookingId]`, `call/rate`, `booking/[id]/review`, `chat/[id]`: misafirde `router.replace` login yok; CTA + geri; LiveKit yalnızca girişliyken; `chat` `id` dizi parametresi normalize. **`booking/review` (query shim)** — eksik `booking_id`/`consultant_id` için “Geri” + randevulara dön.
- [x] **Danışman detay (`/consultant/[id]`)** — Liste/slot incelemesi misafire açık; **mesaj** için `createThread` öncesi giriş uyarısı + hata yakalama; **`authHydrating`** iken mesaj butonu `disabled` + soluk; eksik `id` veya yükleme hatasında mesaj + geri.

**İçerik / yorum araçları (korumalı API):** kahve, rüya, yıldızname, numeroloji, tarot — `useAuth().authHydrating` bitene kadar kısa spinner; ardından misafir CTA veya girişli akış — token varken misafir flash yok. Anında `/auth/login` redirect yok.
- [x] **Sinastri** — `requireUser` ile arama / davet / geçmiş / manuel analiz; **`authHydrating`** tam ekran spinner; ardından mod seçimi; misafirde üst bilgi bandı; davet ve “son analizler” yalnızca `user` varken; Alert’te “Kayıt ol”.
- [x] **`/packages`** — **`authHydrating`** spinner; misafir: örnek paket + Giriş/Kayıt CTA. Girişli: kartlar → `/(tabs)/profile/credits`, Premium → `/(tabs)/profile/subscription`.
- [x] **Ayarlar sekmesi (`(tabs)/settings`)** — Misafir: dil değişimi + giriş/kayıt CTA; “Çıkış” yok. Girişli: mevcut profil + çıkış.
- [x] **Ödeme WebView (`booking/payment`)** — `url` yoksa veya boşsa boş WebView yerine mesaj + randevulara dön; WebView `style={{ flex: 1 }}` (küçük ekran layout).
- [x] **Genel WebView (`webview/index`)** — `url` / `title` dizi parametreleri normalize; adres yoksa uyarı + geri; WebView `flex:1` + sarmalayıcı (`webviewWrap`).
- [x] **Randevu başarı (`booking/success`)** — `authHydrating` yükleyici; misafirde giriş CTA `router.push` (geri stack) + **Hesap oluştur**; ana sayfa; girişli akış aynı (`router.replace` `as any`).
- [x] **Danışmanlar (`connect`)** — `topic` query dizi/string normalize; bilinen uzmanlık `topic` ile filtre senkronu; danışman detayına `topic` ile gitme.
- [x] **Tarot sekmesi (misafir)** — Anında login redirect kaldırıldı; tanıtım + açılım önizlemesi + giriş / kayıt CTA.
- [x] **Kahve / Rüya / Yıldızname / Numeroloji (misafir)** — Aynı misafir UX: kılavuz veya özet + Giriş / Hesap oluştur; API çağrısı yok.

**2026-05-16 checklist devralma (FAZ 36 hariç):**

- [x] **FAZ 32 T32-2** — `onboarding/birthdata`: sabit `tz_offset: 180` kaldırıldı; TZ backend’de lat/lng’den.
- [x] **FAZ 41 T41-3 / T41-5** — `usePremium` + `BannerWidget` / `BannerSlider`: pro abonede house banner yok; yerleşimler (`mobile_welcome`, `mobile_home`, `mobile_call_end`) mevcut. `auth/me` `is_premium` gelince otomatik; yoksa `/subscriptions/me` yedek.
- [x] **FAZ 29 (mobil)** — Danışman detay: `GET /consultants/:id/services`, paket seçimi, ücretsiz tanışma → checkout’ta ödeme atlanır (`confirmed`). **Hemen görüşme talep et** → `POST /bookings/request-now`. Mesaj için giriş uyarısı + `authHydrating` kilidi.

- [x] **FAZ 28 T28-3 / T28-4 / T28-5 (mobil)** — `ConsultantFunnelCTA` + `funnel.config.ts`: misafir / free / premium kopya; danışmanlar sekmesine `topic` ile yönlendirme. **T28-4:** `connect` ekranı `topic` → filtre (mood chip eklendi). **T28-5:** Sonuç ekranları — tarot, kahve, rüya, numeroloji, sinastri, yıldızname.
- [x] **FAZ 28 T28-2 (mobil)** — `me/readings`: filtre chip’leri (7 tip), Aç/Sil, `DELETE /me/readings/:type/:id`, Tümünü Sil (KVKK), misafir CTA; API `/me/history` düzeltmesi; detay `me/readings/[type]/[id]`; sinastri + yıldızname tipleri.

- [x] **FAZ 41 T41-4 (mobil)** — `BannerUpsell` + `PromoBannerSection`: free kullanıcıda house banner sonrası “Reklamsız deneyim → Premium” (`onboarding`, ana sayfa, bugün, görüşme sonu).
- [x] **FAZ 29 T29-6 (mobil)** — `ChatWarningBanner` sohbet ekranı üstünde (web ile aynı uyarı metni).
- [x] **FAZ 39 T39-2 (mobil)** — Danışman detay: `feature_video_enabled` + `supports_video` → sesli/görüntülü seçimi; checkout `media_type`; `siteSettingsApi.isFeatureEnabled`.

- [x] **FAZ 29 T29-5 (mobil)** — `booking/[id]`: Mesaj Gönder → `POST /chat/threads` (`context_type=booking`); uyarı banner; randevu detayında `media_type` özeti.
- [x] **Chat API düzeltmesi** — `chatApi`: `context_type`/`context_id` kontratı; `postMessage` `{ text }`; danışman lead + booking thread helper’ları; sohbet ekranı `sender_user_id` + `text`.
- [x] **FAZ 41 T41-2 (mobil taraf)** — Banner listesi oturum/premium hazır olduktan sonra yeniden yüklenir (JWT ile backend `target_segment` filtresi).

- [x] **FAZ 35 T35-4 (mobil iskelet)** — `useAmbientMixer` (expo-av), preset çözümleme, AsyncStorage kalıcılık, `RelaxMixerCard` (Bugün sekmesi), `app.json` `UIBackgroundModes: audio`; stem `.m4a` dosyaları T35-1 sonrası `stemAssets.ts`’e bağlanacak.
- [x] **Randevu listesi mesaj** — `BookingCard` + `bookings` sekmesi: hızlı “Mesaj” → booking thread.

**2026-05-16 FAZ 42 (CMS / yasal / danışman başvuru — mobil):**

- [x] **CMS** — `customPagesApi`, `CmsHtmlView`, `/legal`, `/cms/[moduleKey]`, `/blog`, `/blog/[slug]` (`GET /custom-pages`, `by-slug`).
- [x] **Danışman başvuru** — `/become-consultant` → `POST /consultants/apply` (uzmanlık/dil chip, biyografi).
- [x] **Navigasyon** — Ayarlar + menü: Blog, Yasal, Danışman Ol; `_layout` Stack kayıtları.
- [x] **T42-7 ErrorBoundary** — Kök `_layout` sarmalayıcı.
- [x] **Burçlar Büyük Üçlü** — `(tabs)/zodiac` kartı → `/zodiac/big-three`.
- [x] **Görüşme bekleme** — `call/[bookingId]` yüklemede “Mesaj Gönder” → booking thread.
- [x] **Randevular misafir (tekrar)** — `router.replace` login yok; giriş + danışmanlar CTA.

**2026-05-16 FAZ 42 devam (T42-1 / T42-2 / T42-3 / T42-7):**

- [x] **T42-1 Karne** — `/karne` → `GET /reviews/me/pending-outcomes`, `PATCH /reviews/:id/outcome`; profil + menü linki.
- [x] **T42-1 Ünlüler** — `/unluler` statik liste (frontend paritesi); Burçlar sekmesinden erişim.
- [x] **T42-1 Yükselen** — Burçlar araçları: yükselen → `/zodiac/big-three`, doğum haritası → `/(tabs)/birth-chart`.
- [x] **T42-2 Hakkında/SSS/İletişim** — `/info` (CMS about/faq), `/contact` → `POST /contacts`.
- [x] **T42-3 Favoriler** — Misafir CTA; boş liste → danışmanlar; AsyncStorage favoriler (mevcut hook).
- [x] **T42-7 API sağlamlık** — GET exponential backoff retry; 5 dk GET önbellek (offline son veri).

**Backend bekleyen (mobil hazır):** FAZ 41 T41-1 (`auth/me` `is_premium`) — `mobile/REQUESTS.md`. **FAZ 35 T35-1** — 8 stem dosyası + `stemAssets.ts` require.

---

## FAZ 4 — Deploy & test

| Madde | Durum | Not |
|-------|--------|-----|
| T4-1, T4-2 | Sunucu/CI | Cursor kod görevi yok. |
| T4-3 … T4-8 | Açık (manuel) | VPS `.env`, Iyzipay/LiveKit/FCM/EAS smoke — **Orhan / operasyon** |

---

## FAZ 5+ (Web, hardcode, D34, …)

Web, admin, backend ve “HC-* / D34-*” maddeleri **Cursor mobil sahası dışında**. İhtiyaç halinde `mobile/REQUESTS.md`.

---

## Komut

```bash
cd mobile/app && bun run lint
```
