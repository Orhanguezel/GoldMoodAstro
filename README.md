# GoldMoodAstro

Danisman ve kullanici eslestirme platformu.
Kullanici danisman secer, randevu olusturur, odeme yapar ve uygulama ici sesli gorusme gerceklestirir.

Odak alanlari: astroloji ve mood danismanligi.

## Teknoloji

| Katman | Stack |
|--------|-------|
| Backend | Fastify 5, Drizzle ORM, MySQL, Bun, Zod |
| Admin Panel | Next.js 16, React 19, Tailwind v4, React Query, Zustand, Radix UI |
| Mobile | Expo (React Native 0.81), TypeScript, expo-router, Zustand, React Query, react-native-agora, expo-notifications |

## Monorepo Yapisi

```
goldmoodastro/
├── backend/
├── packages/
│   ├── core/               # @goldmood/core
│   ├── shared-backend/     # @goldmood/shared-backend
│   ├── shared-types/       # @goldmood/shared-types
│   ├── shared-config/      # @goldmood/shared-config
│   └── shared-ui/          # @goldmood/shared-ui
├── admin_panel/            # Faz 2
└── mobile/                 # Faz 3
```

Not: Bu projede eski musteri web sitesi (`frontend/`) bulunmaz.

## Paket Dokumani

- Paket genel bakis: [packages/README.md](packages/README.md)
- Paket kullanim rehberi: [packages/KULLANIM.md](packages/KULLANIM.md)

## Hizli Baslangic

### Gereksinimler

- Bun
- MySQL 8

### Root komutlari

```bash
cd /home/orhan/Documents/Projeler/goldmoodastro
bun install
bun run dev:backend
```

Sik kullanilan komutlar:

```bash
bun run dev:backend
bun run dev:admin
bun run build:backend
bun run build:admin
bun run db:seed
bun run typecheck
```

## Backend Ortam Degiskenleri

`backend/.env` dosyasi AGENTS.md ile uyumlu olmali. Temel alanlar:

- `PORT=8094`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `COOKIE_SECRET`
- `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `IYZIPAY_API_KEY`, `IYZIPAY_SECRET_KEY`, `IYZIPAY_BASE_URL`
- `CORS_ORIGIN`, `PUBLIC_URL`

## Backend Mimari Kurallari

- Shared moduller: `packages/shared-backend/modules/`
- Proje-ozel moduller: `backend/src/modules/`
- Shared route kaydi: `backend/src/routes/shared.ts`
- Proje-ozel route kaydi: `backend/src/routes/goldmood.ts`

Proje-ozel moduller (Faz 1):

- `consultants`
- `agora`
- `firebase`

Modul dosya pattern'i:

```text
schema.ts
router.ts
admin.routes.ts
controller.ts
repository.ts
validation.ts
index.ts
```

## Veritabani Kurali (Kritik)

- `ALTER TABLE` kullanma
- Semayi `backend/src/db/sql/` altindaki seed SQL dosyalari ile yonet
- Degisiklikten sonra `bun run db:seed` calistir
- Yeni modullerde id tipi `CHAR(36)` UUID pattern'i kullan

## Yol Haritasi

### Faz 0

- Eski kalintilarin temizligi
- SQL seed dosyalarinin GoldMoodAstro'ya gore yeniden yazimi
- `backend/.env.example` guncellemesi

### Faz 1

- `consultants` modulu
- `agora` modulu (token ve session yonetimi)
- `firebase` modulu (FCM token ve push)

### Faz 2

- `admin_panel/` olusturma ve dashboard/yonetim sayfalari

### Faz 3

- `mobile/` Flutter uygulama iskeleti ve temel ekranlar

### Faz 4

- Nginx + PM2 deploy akisi (tamamlandi)
- VPS provisioning + manuel deploy script'leri (`deploy/`)

## Deploy

Production: <https://goldmoodastro.com> (admin: <https://admin.goldmoodastro.com>)

Deploy manuel — GitHub Actions kullanilmiyor. Scripts: `deploy/`

| Komut | Aciklama |
|-------|----------|
| `./deploy/provision-vps.sh` | Bir kerelik VPS kurulumu (idempotent) |
| `./deploy/deploy.sh [backend\|admin\|frontend\|all] [--seed\|--fresh-seed]` | Build + pm2 reload |
| `./deploy/sync-env.sh` | `backend/.env` (VPS) yenile (3rd-party credentials degisiminde) |
| `./deploy/setup-backup.sh [--run-now]` | DB backup cron (gunluk 03:00 UTC, 7 gun retention) |
| `./deploy/logs.sh [backend\|admin\|frontend\|nginx\|backup\|sshd] [-n N] [-f]` | Log shortcut |

Detayli rehber: [doc/deploy-notes.md](doc/deploy-notes.md)

Credentials: `.secrets/credentials.env` (gitignore'lu, master vault).

## Lisans

[**GPL-3.0-or-later**](LICENSE) — Orhan Güzel · 2026

> **Neden GPL?** Astroloji hesaplama altyapısında [Swiss Ephemeris](https://www.astro.com/swisseph/swephinfo_e.htm)
> bağımlılığı (`swisseph-wasm`) GPL-3.0 lisanslı olduğu için, viral şart gereği ana
> proje de GPL-3.0 altında dağıtılmaktadır. Bu **geçici çözümdür** — proje sahibi
> Astrodienst Professional License (~750 CHF) satın aldığında lisans tescilli/kapalı
> kaynağa dönüştürülecek. Detay: [doc/raporlar/swiss-ephemeris-lisans-raporu.md](doc/raporlar/swiss-ephemeris-lisans-raporu.md).
