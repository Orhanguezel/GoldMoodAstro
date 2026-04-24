# CLAUDE.md — Konigsmassage

## Proje Özeti
Çok dilli masaj & wellness randevu platformu. 3 bileşen: müşteri web sitesi, yönetim paneli, backend API.

**Domain:** konigsmassage.de / konigsmassage.com
**Lisans:** MIT — Orhan Güzel

## Mimari

| Bileşen | Stack | Port (prod) | PM2 Adı |
|---------|-------|-------------|---------|
| **Frontend** | Next.js 16, React 19, Tailwind v4, Radix UI, Redux Toolkit (RTK Query) | 3055 | konigsmassage-frontend |
| **Backend** | Fastify 5, Drizzle ORM, MySQL, Bun runtime, Zod | 8093 | konigsmassage-backend |
| **Admin Panel** | Next.js 16, React 19, Tailwind v4, Radix UI, React Query, Zustand, Biome | 3056 | konigsmassage-admin-panel |

## Komutlar

```bash
# Frontend
cd frontend && bun install && bun run dev      # Dev
bun run build && bun run start                 # Prod
bun run typecheck                              # TS kontrolü
bun run lint                                   # ESLint
bun run test:e2e                               # Playwright E2E

# Backend
cd backend && bun install && bun run dev       # Dev (hot reload)
bun run build && bun run start                 # Prod (Node)
bun run db:seed                                # DB sıfırla + seed
bun run db:seed --no-drop                      # Seed (DROP yok)
bun run db:seed --only=40,50                   # Sadece belirli dosyalar

# Admin Panel
cd admin_panel && bun install && bun run dev   # Dev
bun run build && bun run start                 # Prod
bun run check:fix                              # Biome lint+format
```

## Portfolio Metadata Rule

- Bu proje kokunde `project.portfolio.json` dosyasi zorunludur.
- Yeni moduller, stack degisiklikleri, repo/live URL veya proje ozeti degisirse once bu dosya guncellenir.
- `/home/orhan/Documents/Projeler` altinda portfolio seedleri bu dosyadan uretildigi icin metadata guncellenmeden is tamamlanmis sayilmaz.

## Proje Yapısı

```
konigsmassage/
├── frontend/
│   └── src/
│       ├── app/                    # Next.js App Router
│       │   ├── [locale]/           # Dil prefix'li sayfalar (de, tr, en)
│       │   │   ├── about/
│       │   │   ├── appointment/    # Randevu sayfası
│       │   │   ├── blog/[slug]/
│       │   │   ├── contact/
│       │   │   ├── faqs/
│       │   │   ├── services/[slug]/
│       │   │   └── ... (kvkk, terms, privacy, legal-notice, login, register)
│       │   ├── layout.tsx          # Root layout
│       │   ├── page.tsx            # Anasayfa (default locale)
│       │   ├── providers.tsx       # StoreProvider + Toaster
│       │   └── ClientLayout.tsx    # Header + Footer + Analytics
│       ├── components/containers/  # Sayfa bileşenleri
│       ├── integrations/rtk/       # RTK Query (baseApi, endpoints, hooks, tags)
│       ├── i18n/                   # Dinamik locale yönetimi (DB-driven)
│       ├── layout/                 # Header, Footer, Banner, Cookie
│       ├── seo/                    # Server-side SEO (metadata, sitemap, hreflang)
│       ├── store/                  # Redux store (reducer: gwdApi)
│       └── features/              # Analytics, SEO helpers
│
├── backend/
│   └── src/
│       ├── app.ts                  # Fastify app setup + tüm route registrations
│       ├── index.ts                # Entry point (Bun/Node)
│       ├── core/                   # env.ts, error.ts
│       ├── plugins/                # authPlugin, mysql, staticUploads
│       ├── common/middleware/      # locale middleware
│       ├── db/
│       │   ├── index.ts            # Seeder (DROP/CREATE + SQL files)
│       │   └── sql/                # 68 numaralı SQL dosyası (001-201)
│       └── modules/                # 28 modül (aşağıda)
│
├── admin_panel/
│   └── src/
│       ├── app/(main)/admin/(admin)/  # Tüm admin route'ları
│       ├── integrations/              # baseApi, endpoints, hooks
│       ├── stores/                    # Zustand stores
│       └── components/               # Shared UI
│
└── .github/workflows/main.yml    # CI/CD: push main → build → rsync VPS → PM2 reload
```

## Backend Modülleri (28)

Her modül: `router.ts` (public) + `admin.routes.ts` (admin)

| Modül | Public Route | Admin Route | Açıklama |
|-------|-------------|-------------|----------|
| auth | /auth/* | /admin/auth/* | JWT + Google OAuth, token refresh |
| siteSettings | /site_settings/* | /admin/site-settings/* | Key-value config (locale bazlı) |
| services | /services/* | /admin/services/* | Hizmetler + galeri (i18n) |
| bookings | POST /bookings | /admin/bookings/* | Randevu sistemi |
| availability | /availability/* | /admin/availability/* | Çalışma saatleri, slot planlama |
| resources | — | /admin/resources/* | Oda/terapist kaynakları |
| faqs | /faqs/* | /admin/faqs/* | SSS (i18n) |
| slider | /sliders/* | /admin/slider/* | Anasayfa slider (i18n) |
| customPages | /custom_pages/* | /admin/custom-pages/* | Dinamik sayfalar (i18n) |
| contact | /contact/* | /admin/contact/* | İletişim formu |
| newsletter | /newsletter/* | /admin/newsletter/* | Bülten aboneliği |
| review | /reviews/* | /admin/reviews/* | Müşteri değerlendirmeleri |
| menuItems | /menu_items/* | /admin/menu-items/* | Navigasyon menüleri |
| footerSections | /footer_sections/* | /admin/footer-sections/* | Footer içerikleri |
| email-templates | — | /admin/email-templates/* | E-posta şablonları |
| mail | /mail/* | — | E-posta gönderimi (Nodemailer) |
| storage | /storage/* | /admin/storage/* | Dosya yönetimi (Cloudinary/local) |
| notifications | /notifications/* | — | Bildirimler |
| support | — | /admin/support/* | Destek talepleri |
| chat | /chat/* | /admin/chat/* | Gerçek zamanlı sohbet |
| profiles | /profiles/* | — | Kullanıcı profilleri |
| userRoles | /user-roles/* | — | Rol yönetimi |
| audit | — | /admin/audit/* | Denetim kayıtları |
| dashboard | — | /admin/dashboard/* | İstatistikler |
| db_admin | — | /admin/db/* | DB import/export |

Tüm route'lar `/api` prefix'i altında: `/api/services`, `/api/admin/services/*`

## Veritabanı Mimarisi

### i18n Pattern (Parent + i18n Child)
```sql
-- Ana tablo (locale-bağımsız)
services (id, is_active, display_order, created_at, updated_at)

-- Çeviri tablosu
services_i18n (id, service_id FK, locale, title, slug, description, meta_title, meta_description)
  UNIQUE(service_id, locale)
  UNIQUE(locale, slug)
```

Bu pattern: services, faqs, slider, customPages, menuItems, footerSections, email-templates

### Site Settings (Key-Value)
```sql
site_settings (key, locale, value JSON)
  UNIQUE(key, locale)
```
- locale='*' → global default
- UI string'leri: `ui_header`, `ui_hero`, `ui_footer`, `ui_services` vb. JSON blokları

### Seeder Dosyaları
`backend/src/db/sql/` altında numaralı SQL dosyaları:
- 001-005: Auth & roller
- 030: Audit
- 040-049: Site settings (meta, UI sections)
- 050-052: Custom pages
- 060-063: Reviews
- 070-071: Services
- 110-117: Availability & resources
- 120-121: Bookings

## Çok Dilli (i18n) Mimari

- **Diller:** de (varsayılan), tr, en — DB'den dinamik yönetim
- **Frontend URL:** `/[locale]/...` (App Router dynamic segment)
- **Backend Locale Çözme:** `?locale=` > `x-locale` header > `Accept-Language` > DB default
- **UI String'leri:** site_settings tablosundan RTK Query ile çekilir
- **SEO:** Server component'lerde `generateMetadata()` ile hreflang, canonical, OG tags

### Önemli i18n Dosyaları
- `frontend/src/i18n/locale.ts` — `useResolvedLocale()` hook (RTK Query ile deduplicate)
- `frontend/src/i18n/uiDb.ts` — `useUiSection()` hook (section bazlı UI string'leri)
- `frontend/src/i18n/server.ts` — Server-side locale çözme (`fetchSetting`, `getDefaultLocale`)
- `frontend/src/i18n/config.ts` — `FALLBACK_LOCALE = 'de'`

## RTK Query Yapısı

### Frontend
- **Base URL:** `NEXT_PUBLIC_API_URL` env'den, yoksa `/api` (reverse proxy)
- **Reducer Path:** `gwdApi`
- **Auth:** Cookie-based JWT + Bearer token, auto-refresh on 401
- **Deduplication:** `refetchOnMountOrArgChange: false`, `keepUnusedDataFor: 300-600`
- **Endpoint dosyaları:** `frontend/src/integrations/rtk/public/` + `hooks.ts` barrel export

### Admin Panel
- Aynı pattern, ayrı baseApi instance
- `admin_panel/src/integrations/endpoints/{admin,public}/`

## Deploy (CI/CD)

```yaml
# .github/workflows/main.yml
trigger: push to main
steps:
  1. bun install + bun run build (backend)
  2. rsync → /var/www/konigsmassage/backend (exclude: node_modules, .env, .git)
  3. bun install + bun run build (frontend)
  4. rsync → /var/www/konigsmassage/frontend
  5. pm2 reload konigsmassage-backend + konigsmassage-frontend
```

**Not:** `.env` dosyaları gitignore'da — VPS'te manual oluşturulur, rsync exclude ile korunur.

## Ortam Değişkenleri

### Backend (.env)
```
PORT=8093
DB_HOST, DB_PORT=3306, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET, COOKIE_SECRET
STORAGE_DRIVER=cloudinary|local
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SMTP_HOST, SMTP_PORT=465, SMTP_USER, SMTP_PASS, MAIL_FROM
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
FRONTEND_URL, CORS_ORIGIN, PUBLIC_URL
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=http://localhost:8093/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=de
NEXT_PUBLIC_GTM_*=...
NEXT_PUBLIC_GA_ID=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

## Bilinen Sorunlar & Çözümler

### 429 Rate Limit (ÇÖZÜLDÜ)
**Sorun:** `useResolvedLocale()` her component instance'ında raw `fetch()` ile `app-locales` ve `default-locale` çağırıyordu → 20+ duplicate istek → 429.
**Çözüm:** Raw fetch yerine RTK Query hook'ları (`useGetAppLocalesPublicQuery`, `useGetDefaultLocalePublicQuery`) kullanıldı. Tüm component'ler aynı cache'i paylaşır.

### NEXT_PUBLIC_* Build Time
`NEXT_PUBLIC_*` değişkenleri Next.js'te build time'da bake edilir. GitHub Actions'ta `.env` olmadığı için client bundle'da `BASE_URL = '/api'` olarak kalır. Bu yüzden prod'da Nginx reverse proxy `/api` → `localhost:8093/api` gereklidir.
