# CLAUDE.md — GoldMoodAstro

## Proje Özeti

Danışman & kullanıcı eşleştirme platformu. Kullanıcı danışman seçiyor → randevu alıyor → ödeme yapıyor → uygulama içi sesli görüşme yapıyor. Astroloji / mood danışmanlığı odaklı.

**Müşteri:** Murat Kısıkçılar  
**Bütçe:** 30.000 TL | **Süre:** 30 gün | **Başlangıç:** 2026-04-24  
**Lisans:** MIT — Orhan Güzel

## Mimari

| Bileşen | Stack | Port (prod) | PM2 Adı |
|---------|-------|-------------|---------|
| **Backend** | Fastify 5, Drizzle ORM, MySQL, Bun, Zod | 8094 | goldmoodastro-backend |
| **Admin Panel** | Next.js 16, React 19, Tailwind v4, Radix UI, React Query, Zustand | 3094 | goldmoodastro-admin |
| **Mobile** | Expo (React Native 0.81), TypeScript, expo-router, Zustand, React Query, react-native-agora, expo-notifications | — | iOS + Android |

**Entegrasyonlar:** Agora SDK (sesli görüşme), Firebase FCM (push), Iyzipay (ödeme)

## Monorepo Yapısı

```
goldmoodastro/                        ← bun workspaces root
├── packages/
│   ├── shared-backend/               ← @goldmood/shared-backend (24 modül)
│   ├── shared-ui/                    ← @goldmood/shared-ui
│   ├── shared-types/                 ← @goldmood/shared-types
│   ├── shared-config/                ← @goldmood/shared-config
│   └── core/                         ← @goldmood/core
├── backend/                          ← Fastify API
├── admin_panel/                      ← Next.js admin (Faz 2'de oluşturulacak)
└── mobile/                           ← Flutter (Faz 3'te oluşturulacak)
```

## Komutlar

```bash
# Root
bun run dev:backend
bun run dev:admin
bun run db:seed

# Backend
cd backend && bun run dev
bun run db:seed           # DB sıfırla + seed
bun run db:seed:nodrop    # Seed (DROP yok)
bun run typecheck

# Admin Panel
cd admin_panel && bun run dev
```

## Ajan Görev Dağılımı

| Ajan | Sorumluluk |
|------|-----------|
| **Claude Code** | Mimari, DB şema tasarımı, API kontratları, kod review |
| **Codex** | Backend modülleri, SQL seed'ler, admin panel sayfaları, cron |
| **Antigravity** | UI implementasyon (web sayfaları, mobile ekranlar, admin formları), görsel doğrulama, e2e |
| **Copilot** | Autocomplete, boilerplate, RN/Expo tamamlama |

> **2026-04-27 orchestrasyon revize:** Codex token tasarrufu — UI ağırlıklı görevler
> Antigravity'e devredildi (FAZ 15 web tema, FAZ 16 mobile ekranlar, banner/campaign UI).
> Codex sadece backend SQL + module logic'te kalır.

- `AGENTS.md` → Codex okur (tüm görev listesi, schema tanımları)
- `CLAUDE.md` → Claude Code okur (bu dosya)
- `doc/mvp-checklist.md` → Tüm plan ve checklist (FAZ 0-18)
- `doc/antigravity-kb.md` → Antigravity bağlam dosyası
- `doc/goldmoodastro-altyapi-raporu.md` → LiveKit kararı, mimari
- `doc/goldmoodastro-rakip-analizi.md` → Rakip analizi + F1-F12 differentiator listesi

## Backend Modülleri

### packages/shared-backend — paylaşılan modüller (FAZ 6+ sonrası)
**Auth/User:** `auth`, `profiles`, `userRoles`
**Booking/Order:** `bookings`, `availability`, `resources`, `orders`, `wallet`
**Communication:** `chat`, `notifications`, `mail`, `telegram`
**Content:** `siteSettings`, `emailTemplates`, `announcements`, `storage`, `contact`, `support`
**Review:** `review`, `reviewOutcomes` (T17-6 astrolog karnesi)
**Astroloji & İçerik:** `astrology` (Swiss Ephemeris compute/transit/synastry), `readings` (LLM yorum)
**Ödeme:** `subscriptions` (T10-1, Iyzipay+IAP), `credits` (T10-2)
**Pazarlama:** `banners` (T12), `campaigns` (T13)
**KVKK:** `kvkk` (T18 — data export + 7gün account deletion)
**Diğer:** `dashboard`, `db_admin`, `health`, `audit`, `_shared` (içerik moderation)

### backend/src/modules — proje-özel
- `consultants` — profil, uzmanlık, onay, supports_video
- `livekit` — token üretimi, room webhook (T7) ← **Agora yerine**
- `firebase` — FCM push
- `birthCharts` — doğum haritası API (T8)
- `geocode` — şehir → lat/lng (Nominatim)
- `horoscopes`, `numerology`, `tarot` — astroloji içerik modülleri

### Route kayıt
- Shared modüller: `backend/src/routes/shared.ts`
- Proje-özel: `backend/src/routes/goldmood.ts`

## Veritabanı

### DB Şema Kuralı — KESİN
**`ALTER TABLE` YASAK.** Değişiklik: seed dosyasını düzenle → `bun run db:seed`

### Kritik Tablolar
```
users              ← Tüm roller: user/consultant/admin + fcm_token
consultants        ← Danışman profili (uzmanlık, fiyat, onay, supports_video, video_session_price)
live_sessions     ← LiveKit kanal + token + süre + media_type (audio/video) [eski voice_sessions]
bookings           ← Randevular (consultant_id, media_type, session_price)
availability       ← Danışman çalışma saatleri
orders             ← Ödeme kayıtları (Iyzipay subscription/credit purchase)
payments           ← Ödeme işlemleri
wallet/wallets     ← Danışman kazanç ledger

## Yeni Tablolar (FAZ 6+ vizyon revize sonrası)
subscription_plans + subscriptions   ← FAZ 10 abonelik (Iyzipay + IAP)
credit_packages + user_credits + credit_transactions   ← FAZ 10 kredi sistemi
banners                              ← FAZ 12 reklam banner placement + click tracking
campaigns + campaign_redemptions     ← FAZ 13 promo kod, indirim, hedefli kampanya
birth_charts + geocode_cache         ← FAZ 8 doğum haritası + şehir koordinatları
daily_readings + daily_horoscopes    ← FAZ 9 günlük yorum (LLM + embedding anti-copy-paste)
review_outcomes                      ← T17-6 astrolog karnesi (6 ay sonra "gerçekleşti mi?")
account_deletion_requests            ← T18 KVKK 7-gün cooling-off
reviews + review_i18n                ← + is_verified (T17-1), consultant_reply (T17-2)
```

### Seed Dosya Sıralaması (FAZ 6+ sonrası)
```
001-003: Auth + roller
010-012: Site settings + custom CSS + chat widget
020:     Audit
030-031: Consultants (+ supports_video, video_session_price)
035:     birth_charts (FAZ 8)
036:     geocode_cache (FAZ 8)
037:     daily_horoscopes (FAZ 9)
040-041: Availability
050-051: Bookings (+ media_type)
060-061: Orders
065:     subscription_plans + subscriptions (FAZ 10)
070:     live_sessions (eski voice_sessions — LiveKit)
080:     Wallet
082:     credits (FAZ 10 — packages, user_credits, transactions)
090-110: Chat, notifications, support
120-125: Reviews + review_outcomes (T17)
130:     Announcements
140-150: Storage, email templates
160:     Banners (FAZ 12)
170:     Campaigns (FAZ 13)
200:     account_deletion_requests (FAZ 18 KVKK)
140-150: Storage, email templates
```

## Ortam Değişkenleri

### Backend (.env)
```
PORT=8094
DB_HOST, DB_PORT=3306, DB_USER, DB_PASSWORD, DB_NAME=goldmoodastro
JWT_SECRET, COOKIE_SECRET
STORAGE_DRIVER=cloudinary|local
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SMTP_HOST, SMTP_PORT=465, SMTP_USER, SMTP_PASS, MAIL_FROM
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
AGORA_APP_ID, AGORA_APP_CERTIFICATE
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
IYZIPAY_API_KEY, IYZIPAY_SECRET_KEY, IYZIPAY_BASE_URL
CORS_ORIGIN, PUBLIC_URL
```

### Admin Panel (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:8094/api
NEXT_PUBLIC_SITE_URL=http://localhost:3094
```

## Deploy

```yaml
trigger: push to main
jobs:
  backend:  bun build → rsync VPS → pm2 reload goldmoodastro-backend
  admin:    bun build → rsync VPS → pm2 reload goldmoodastro-admin
```

## Bekleyen Temizlikler (Codex T0)

Proje konigsmassage'den kopyalandı. Codex'in T0 görevi:
- `frontend/` sil
- `packages/shared-backend/modules/_shared/` içi temizle
- `backend/src/db/sql/` 87 dosyayı sil + yeniden yaz
- `backend/.env.example` oluştur
