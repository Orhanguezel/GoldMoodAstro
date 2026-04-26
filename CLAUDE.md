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
| **Mobile** | Flutter, Dart, Riverpod, Agora SDK, Firebase FCM | — | iOS + Android |

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
| **Antigravity** | Admin panel UI doğrulama (Faz 2 sonrası) |
| **Copilot** | Autocomplete, boilerplate, Flutter tamamlama |

- `AGENTS.md` → Codex okur (tüm görev listesi, schema tanımları)
- `CLAUDE.md` → Claude Code okur (bu dosya)
- `doc/mvp-checklist.md` → Tüm plan ve checklist

## Backend Modülleri

### packages/shared-backend — paylaşılan 24 modül
`auth`, `profiles`, `availability`, `bookings`, `chat`, `contact`, `dashboard`, `db_admin`, `emailTemplates`, `health`, `mail`, `notifications`, `orders`, `resources`, `review`, `_shared`, `siteSettings`, `storage`, `support`, `telegram`, `userRoles`, `wallet`, `announcements`, `audit`

### backend/src/modules — proje-özel (Faz 1'de yazılacak)
- `consultants` — profil, uzmanlık, onay
- `agora` — Agora token, voice_sessions
- `firebase` — FCM push

### Route kayıt
- Shared modüller: `backend/src/routes/shared.ts`
- Proje-özel: `backend/src/routes/goldmood.ts`

## Veritabanı

### DB Şema Kuralı — KESİN
**`ALTER TABLE` YASAK.** Değişiklik: seed dosyasını düzenle → `bun run db:seed`

### Kritik Tablolar
```
users              ← Tüm roller: user/consultant/admin + fcm_token
consultants        ← Danışman profili, uzmanlık, fiyat, onay (YENİ)
voice_sessions     ← Agora kanal + token + süre (YENİ)
bookings           ← Randevular (consultant_id FK)
availability       ← Danışman çalışma saatleri
orders             ← Ödeme kayıtları (Iyzipay)
payments           ← Ödeme işlemleri
wallet             ← Danışman kazanç ledger
reviews            ← Danışman değerlendirmeleri
```

### Seed Dosya Sıralaması (goldmoodastro için yeniden yazılacak)
```
001-003: Auth + roller
010:     Site settings
020:     Audit
030-031: Consultants
040-041: Availability
050-051: Bookings
060-061: Orders
070:     Voice sessions
080:     Wallet
090-130: Chat, notifications, support, reviews, announcements
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
