# Favoriler + Çevrimiçi Bildirimi + Ücretli Kayıtlı Sesli/Görüntülü Mesaj — Çeklist (2026-07-03)

> **Üç özellik:**
> **A)** Danışman favorileme + profilde favori sayısı
> **B)** Favori danışman çevrimiçi olunca bildirim (presence altyapısıyla)
> **C)** Ücretli **kayıtlı** (canlı değil, async) sesli + görüntülü mesaj/soru — danışman kayıtla yanıtlar
>
> **Mevcut durum (keşif 2026-07-03):** favori ve presence altyapısı YOK (sıfırdan). Hazır olanlar:
> `notifications` (+push.ts FCM), `credits/consume.ts` (consumeCredits), `wallet`, storage bucket kuralları
> (AUTH_REQUIRED_BUCKETS), chat (yalnız text — medya mesajı chat'e DEĞİL ayrı modele).
>
> **KESİN KURALLAR:**
> - `ALTER TABLE` YASAK → tüm yeni tablolar seed'de `CREATE TABLE IF NOT EXISTS` (bu tasarımda mevcut tabloya kolon GEREKMİYOR).
> - Seed'ler idempotent; kullanıcı verisi ezilmez (INSERT IGNORE).
> - **İş bitince COMMIT + PUSH zorunlu** (AGENTS.md kuralı) — her görev sonunda typecheck → commit → push.
> - JWT kimliği `sub` alanında (`req.user.id` DEĞİL) — bkz. storage 401 vakası.
> - RTK transformResponse {data} unwrap unutulmasın.

---

## FAZ A — Favoriler (FAV)

### Veri modeli
```sql
-- 0XX_user_favorites_schema.sql (yeni; numara sıradaki boşluğa)
CREATE TABLE IF NOT EXISTS user_favorites (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  online_notified_at DATETIME(3) NULL,   -- FAZ B spam koruması (6 saatte 1 bildirim)
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uf_user_consultant_uq (user_id, consultant_id),
  KEY uf_consultant_idx (consultant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### [x] FAV-T1 — Backend modül: favorites 🔴
- **Yeni:** `packages/shared-backend/modules/favorites/` (schema, repository, controller, router, index) + package.json exports (`./modules/favorites` — unutma, modül çözülmez yoksa).
- **API kontratı:**
  - `POST /me/favorites/:consultantId` (requireAuth) → ekle (idempotent; varsa 200)
  - `DELETE /me/favorites/:consultantId` → çıkar
  - `GET /me/favorites` → kullanıcının favorileri (danışman kart bilgisiyle join: id, full_name, avatar, uzmanlık, is_online)
  - `GET /me/favorites/ids` → hafif: sadece consultant_id[] (kart listelerinde kalp durumu için)
- Route kaydı `backend/src/routes/shared.ts`.
- **Kabul:** ekle/çıkar/idempotent; typecheck 0.
  - Not: `favorites` shared modülü, route kaydı ve `221_user_favorites_schema.sql` eklendi; backend typecheck temiz.

### [x] FAV-T2 — Public sayaç: danışman profillerinde favori sayısı 🔴
- `GET /consultants/:id` (public detail) response'una `favorite_count` ekle (COUNT subquery/LEFT JOIN).
- Danışman public LIST response'una da `favorite_count` (kartlarda rozet).
- Auth'lu istekte `is_favorited: boolean` (cookie/Bearer varsa tryAuth ile).
- **Kabul:** `/api/consultants/:id` favorite_count döner; auth'luysa is_favorited doğru.
  - Not: public consultant list/detail response'una `favorite_count` ve optional auth ile `is_favorited` eklendi; backend typecheck temiz.

### [x] FAV-T3 — Frontend: kalp butonu + favori sayısı + Favorilerim 🟠
- **ConsultantDetail** + danışman kartları (browse listesi): kalp toggle (optimistic; girişsizse login'e yönlendir `?next=`), yanında `favorite_count` rozeti ("♥ 12").
- **Danışman profil başlığında** favori sayısı görünür ("12 danışan favoriledi").
- **Kullanıcı dashboard'ına "Favorilerim" sekmesi:** GET /me/favorites listesi, karttan kaldırma, danışmana git.
- Tüm metinler `ui_` anahtarlarıyla tr/en/de (İngilizce fallback bırakma — bugünkü placeholder vakaları!). Yeni ui_ anahtarları seed'e eklenmeli.
- **Kabul:** favorile/çıkar canlı çalışır, sayaç anlık güncellenir (RTK invalidatesTags), 3 dilde metinler.
  - Not: ConsultantCard/ConsultantDetail kalp toggle, dashboard Favorilerim sekmesi, RTK favorite endpointleri ve TR/EN/DE ui seedleri eklendi; frontend+backend typecheck temiz.

### [x] FAV-T4 — Danışman panelinde kendi favori istatistiği 🟡
- `/me/consultant/stats` response'una `favorite_count` ekle; ConsultantDashboard istatistik kartlarında göster.
  - Not: `/me/consultant/stats` favori sayısını korumalı count ile döndürüyor; ConsultantDashboard toplam favori kartı ve TR/EN/DE ui seed eklendi; frontend+backend typecheck temiz.

## FAZ B — Presence + "favorin çevrimiçi" bildirimi (PRES)

### Veri modeli
```sql
-- 0XX_consultant_presence_schema.sql
CREATE TABLE IF NOT EXISTS consultant_presence (
  consultant_id CHAR(36) PRIMARY KEY,
  last_heartbeat_at DATETIME(3) NOT NULL,
  became_online_at DATETIME(3) NULL,     -- online geçiş anı (bildirim tetiği)
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> `is_online` = `last_heartbeat_at > NOW() - INTERVAL 2 MINUTE` (kolon değil, sorguda hesap).

### [x] PRES-T1 — Heartbeat + is_online 🔴
- `POST /me/consultant/heartbeat` (requireAuth, danışman): consultant_presence upsert. `became_online_at`: önceki heartbeat >2dk eskiyse ŞİMDİ'ye set (offline→online geçişi).
- Danışman paneli (web) açıkken 60 sn'de bir heartbeat (visibility API ile sekme gizliyken durdur). Mobil tarafı ayrı görev (FAZ dışı, not düş).
- Public danışman list/detail'e `is_online` (presence LEFT JOIN).
- **Kabul:** panel açık danışman 2dk içinde online görünür; kapatınca ~2dk'da düşer.
  - Not: `consultant_presence` seed ve shared presence modülü eklendi; `/me/consultant/heartbeat` panelden 60 sn'de bir visibility-aware çalışıyor; public consultant list/detail ve favoriler listesi `is_online` hesaplıyor; frontend+backend typecheck temiz.

### [x] PRES-T2 — Frontend online rozeti 🟠
- Danışman kartı + detayında yeşil "Çevrimiçi" noktası/rozeti (tr/en/de ui_ anahtarı).
- Favorilerim listesinde online olanlar üstte.
  - Not: Kart/detail online rozetleri gerçek `is_online` heartbeat alanına bağlandı; anlık görüş butonu da aynı durumu kullanıyor; Favorilerim backend sıralaması online önce; TR/EN/DE ui seed eklendi; frontend+backend typecheck temiz.

### [x] PRES-T3 — Favori-online bildirimi (cron) 🔴
- **Yeni cron** `backend/src/cron/favorite-online-notify.ts` (1 dk):
  - Son 2dk'da `became_online_at` güncellenen danışmanları bul.
  - Her biri için `user_favorites`'tan (o danışmanı favorileyen ve `online_notified_at` NULL veya >6 saat eski) kullanıcıları çek.
  - `createUserNotification` + `dispatchPushToUser` (FCM): "{Danışman} şimdi çevrimiçi — hemen görüşme başlatabilirsin" (tr/en/de: kullanıcının `users.locale`'ine göre; notifications helpers'taki mevcut locale deseni).
  - `online_notified_at = NOW()` işaretle (spam koruması: 6 saatte en fazla 1).
- Cron kaydı mevcut cron register desenine (booking-sla gibi).
- **Kabul:** danışman online olunca favorileyen kullanıcıya 1 bildirim + push; 6 saat içinde tekrar etmez.
  - Not: `favorite-online-notify` cron eklendi ve startup'a bağlandı; son 2 dk içinde online olan danışmanlar için favorileyen kullanıcılara `favorite_online` in-app+push bildirimi gönderiyor, `online_notified_at` ile 6 saat spam koruması uyguluyor; backend typecheck temiz.

## FAZ C — Ücretli kayıtlı sesli/görüntülü mesaj (VMSG)

> **Ürün:** "Sesli/Görüntülü Soru" — müşteri tarayıcıda KAYIT yapar (MediaRecorder), ücret öder,
> danışman kayıtlı sesli/görüntülü YANIT verir. Canlı seans DEĞİL; SLA'lı async.

### Veri modeli
```sql
-- 0XX_media_messages_schema.sql
CREATE TABLE IF NOT EXISTS consultant_media_settings (
  consultant_id CHAR(36) PRIMARY KEY,
  audio_enabled TINYINT NOT NULL DEFAULT 0,
  audio_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  video_enabled TINYINT NOT NULL DEFAULT 0,
  video_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  reply_sla_hours INT NOT NULL DEFAULT 72,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_messages (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,             -- gönderen müşteri
  consultant_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,               -- danışman yanıtı: müşteri mesajına bağlanır
  kind ENUM('audio','video') NOT NULL,
  direction ENUM('question','reply') NOT NULL DEFAULT 'question',
  storage_bucket VARCHAR(64) NOT NULL DEFAULT 'media_messages',
  storage_path VARCHAR(500) NOT NULL,
  duration_seconds INT NULL,
  note TEXT NULL,                        -- opsiyonel kısa yazılı not
  price DECIMAL(10,2) NOT NULL DEFAULT 0,        -- snapshot (question için)
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  charge_ref VARCHAR(64) NULL,           -- credits tx / order referansı
  status ENUM('sent','answered','expired','refunded') NOT NULL DEFAULT 'sent',
  reply_due_at DATETIME(3) NULL,         -- sent + sla saat
  answered_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY mm_user_idx (user_id, created_at),
  KEY mm_consultant_idx (consultant_id, status, created_at),
  KEY mm_due_idx (status, reply_due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### [x] VMSG-T1 — Storage: media_messages bucket'ı (ÖZEL/auth'lu) 🔴
- `AUTH_REQUIRED_BUCKETS`'a `media_messages` ekle + `validateBucketFile` kuralları:
  - audio: `audio/webm|audio/mp4|audio/mpeg`, ≤ 15MB
  - video: `video/webm|video/mp4`, ≤ 60MB
- **KRİTİK GİZLİLİK:** mevcut `publicServe` 302 ile HERKESE açar — `media_messages` bucket'ı için publicServe **reddetmeli**; yeni `GET /me/media-messages/:id/file` endpoint'i yalnız mesajın müşterisi VEYA danışmanına stream/redirect vermeli (yetki: media_messages satırından).
- **Kabul:** yetkisiz kullanıcı dosya URL'sine erişemez (403/404); taraflar erişir.
  - Not: `media_messages` storage bucket auth-required yapıldı, audio/video MIME+boyut validasyonu eklendi, public `/storage/media_messages/*` 403 döndürüyor; yetkili `GET /me/media-messages/:id/file` endpoint'i media_messages taraf kontrolüyle redirect veriyor; backend typecheck temiz.

### [x] VMSG-T2 — Backend modül: mediaMessages 🔴
- **Yeni:** `packages/shared-backend/modules/mediaMessages/` (+ exports).
- **API kontratı:**
  - `GET /consultants/:id/media-settings` (public): audio/video enabled + fiyatlar (danışman detayında butonları göstermek için).
  - `PUT /me/consultant/media-settings` (danışman): kendi ayarları (fiyat validasyonu: enabled ise price>0).
  - `POST /me/media-messages` (müşteri): {consultant_id, kind, storage_path, duration_seconds, note?} →
    1) settings'ten fiyat snapshot; 2) **ödeme**: `consumeCredits({referenceType:'media_message', referenceId})`
    yetersizse 402 `insufficient_credits` (frontend kredi yükleme sayfasına yönlendirir);
    3) satır insert (status=sent, reply_due_at=NOW()+sla); 4) danışmana notification+push.
  - `GET /me/media-messages` (müşteri) / `GET /me/consultant/media-messages` (danışman, gelen kutusu; unanswered üstte).
  - `POST /me/consultant/media-messages/:id/reply` (danışman): {storage_path, kind, duration_seconds, note?} → reply satırı (direction=reply, parent_id) + parent status=answered + **wallet'a hakediş** (mevcut komisyon oranı `platform_commission_rate` düşülerek; wallet ledger'a referansla) + müşteriye notification+push.
- **Kabul:** uçtan uca soru→ödeme→yanıt→hakediş akışı; çift charge yok (charge_ref idempotency).
  - Not: `mediaMessages` shared modülü, `223_media_messages_schema.sql`, settings/public/customer/consultant/reply/file route'ları eklendi; soru oluşturma kredi tüketiyor, yanıt parent'ı answered yapıp wallet hakedişi ve bildirim/push oluşturuyor; backend typecheck temiz.

### [x] VMSG-T3 — SLA iadesi (cron) 🔴
- `backend/src/cron/media-message-sla.ts` (saatlik): `status='sent' AND reply_due_at < NOW()` → status=expired + **kredi iadesi** (consumeCredits'in iade karşılığı / refund helper; yoksa credits modülüne `refundCredits` ekle) + müşteriye "yanıt gelmedi, ücret iade edildi" bildirimi.
- booking-sla.ts deseni referans.
- **Kabul:** SLA aşımında otomatik iade + bildirim; danışman yanıtlarsa cron dokunmaz.
  - Not: `media-message-sla` cron saatlik startup'a bağlandı; süresi geçmiş `sent` soruları `expired` yapıp `refundCredits` ile idempotent kredi iadesi ve `media_message_refunded` bildirim/push gönderiyor; backend typecheck temiz.

### [x] VMSG-T4 — Frontend müşteri akışı 🟠
- **ConsultantDetail:** media-settings'e göre "🎙 Sesli Soru (X₺)" / "🎥 Görüntülü Soru (Y₺)" butonları.
- **Kayıt modalı:** MediaRecorder (audio: webm/opus; video: webm, ön kamera) — süre limiti (audio 5dk, video 3dk) + önizleme/yeniden kayıt + upload (`/storage/media_messages/upload`) + not alanı + fiyat onayı → POST /me/media-messages. Tarayıcı desteği yoksa dosya seçici fallback.
- **Dashboard "Medya Sorularım":** durum (Yanıt bekliyor/Yanıtlandı/İade), yanıt player'ı (auth'lu file endpoint'ten).
- Tüm metinler ui_ tr/en/de.
- **Kabul:** kayıt→öde→gönder→yanıtı dinle/izle akışı 3 dilde.
  - Not: ConsultantDetail medya settings'e göre ses/video soru butonları gösteriyor; MediaRecorder + dosya fallback modalı upload edip krediyle soru oluşturuyor; dashboard "Medya Sorularım" yanıt player'ı auth'lu file endpoint'ten oynatıyor; TR/EN/DE ui seed eklendi; frontend+backend typecheck temiz.

### [x] VMSG-T5 — Danışman paneli akışı 🟠
- **Ayarlar:** ServicesPanel'e (veya profil ayarlarına) "Kayıtlı Mesaj" bölümü: audio/video aç-kapa + fiyat + SLA.
- **Gelen kutusu:** yeni sekme "Medya Soruları" — bekleyenler (kalan SLA süresi göstergesi), player, **yanıt kaydı** (aynı kayıt modalı) → reply POST.
- **Kabul:** danışman ayarlar, dinler, kayıtla yanıtlar; hakediş wallet'ta görünür.
  - Not: ConsultantDashboard'a "Medya Soruları" sekmesi eklendi; danışman ses/video fiyat+SLA ayarlarını kaydediyor, gelen soruyu auth'lu player'da dinleyip/görüp MediaRecorder veya dosya fallback ile yanıtlıyor; reply backend wallet hakedişini oluşturuyor; frontend+backend typecheck temiz.

### [x] VMSG-T6 — Admin görünürlük 🟡
- Admin'de basit liste: /admin/media-messages (durum filtreli; şikayet/uyuşmazlık inceleme için player admin'e de açık).
- Dashboard metriklerine: toplam medya mesajı / yanıt oranı.
  - Not: Backend admin liste/stats/file endpointleri ve admin panel `/admin/media-messages` sayfası eklendi; status filtresi, metrik kartları, soru/yanıt dosya linkleri ve sidebar menü bağlantısı hazır; backend+admin typecheck temiz.

## FAZ D — Bitirme

### [x] FIN-T1 — Bildirim şablonları + i18n 🟠
- Yeni notification tipleri: `favorite_online`, `media_message_received`, `media_message_replied`, `media_message_refunded` — notification helpers'a tr/en/de metinler; e-posta gerekmiyorsa yalnız in-app+push.
  - Not: `notifyText` sözlüğüne TR/EN/DE metinleri eklendi; favori-online cron'u, medya mesajı alma/yanıtlama ve SLA iade bildirimleri bu şablonları kullanıyor. Backend typecheck temiz.

### [ ] FIN-T2 — Deploy + doğrulama 🔴
- typecheck (backend+admin+frontend) → **commit+push** → git-deploy (tek kanal).
- Prod: yeni tablolar seed'le oluştu mu; smoke: favori ekle→sayaç, heartbeat→online rozet, (mock) medya mesaj akışı.
- Checklist maddeleri işaretlenip notlanır.

---

## Uygulama sırası ve bağımlılıklar
1. **FAV-T1→T4** (bağımsız, hızlı kazanç)
2. **PRES-T1→T3** (T3, FAV tablosundaki online_notified_at'i kullanır)
3. **VMSG-T1→T6** (bağımsız, en büyük parça — T1 gizlilik kuralı olmadan T2'ye BAŞLAMA)
4. **FIN-T1→T2**

## Mirror/referans desenleri
| İhtiyaç | Referans |
|---------|----------|
| Yeni shared modül + exports | `packages/shared-backend/modules/aiContent/` (exports tuzağı) |
| Kredi düşme/iade | `credits/consume.ts` (`consumeCredits`, referenceType/referenceId idempotency) |
| Bildirim + push | `notifications/service.ts` `createUserNotification` + `push.ts` `dispatchPushToUser` |
| Cron | `backend/src/cron/booking-sla.ts` (SLA/iade deseni) |
| Bucket kuralı + auth | `storage/controller.ts` (`AUTH_REQUIRED_BUCKETS`, `validateBucketFile`; **JWT sub!**) |
| Hakediş/komisyon | livekit repository'deki wallet charge + `platform_commission_rate` |
| Kayıt UI | CoffeeHub capture deseni (T40) + MediaRecorder |
