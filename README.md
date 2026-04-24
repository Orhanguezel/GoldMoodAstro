# Konigsmassage

Cok dilli masaj & wellness randevu platformu. Musteri web sitesi, yonetim paneli ve backend API'den olusan full-stack uygulama.

## Teknoloji

| Katman | Stack |
|--------|-------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Radix UI, Redux Toolkit, Framer Motion |
| **Backend** | Fastify 5, Drizzle ORM, MySQL, Bun, Zod, Cloudinary, Nodemailer |
| **Admin Panel** | Next.js 16, React 19, Tailwind CSS 4, Radix UI, React Query, Zustand, React Hook Form |

## Proje Yapisi

```
konigsmassage/
├── frontend/          # Musteri web sitesi (Next.js App Router)
├── backend/           # REST API (Fastify + Drizzle ORM)
├── admin_panel/       # Yonetim paneli (Next.js App Router)
└── .github/workflows/ # CI/CD (GitHub Actions)
```

## Ozellikler

### Musteri Web Sitesi
- Anasayfa, hakkimizda, hizmetler, blog, SSS, iletisim sayfalari
- Online randevu sistemi (tarih, saat, hizmet secimi)
- Uye girisi / kayit (JWT + Google OAuth)
- Cok dilli destek (TR, EN, DE) — URL tabanli (`/[locale]/...`)
- SEO optimizasyonu (sitemap, robots.txt, hreflang, canonical URL)
- Yasal sayfalar (KVKK, gizlilik politikasi, cerez politikasi, kullanim sartlari)

### Backend API (27 Modul)
- **Randevu Sistemi:** Kaynak yonetimi, calisma saatleri, slot planlama, kapasite kontrolu
- **Icerik Yonetimi:** Hizmetler, blog, SSS, slider, ozel sayfalar, menu, footer
- **Kullanici:** Kimlik dogrulama, profiller, roller, denetim kayitlari
- **Iletisim:** Iletisim formu, bulten, destek talepleri, sohbet, bildirimler
- **E-posta:** Sablon yonetimi, otomatik bildirimler (Nodemailer)
- **Sistem:** Dashboard istatistikleri, veritabani iceri/disari aktarimi, dosya depolama

### Yonetim Paneli (31+ Modul)
- Dashboard & raporlar (Recharts grafikleri)
- Randevu yonetimi (durum takibi, e-posta bildirimleri)
- Hizmet, SSS, blog, slider CRUD islemleri (i18n destekli)
- Musavir/oda kaynak yonetimi & musaitlik takvimi
- Kullanici & rol yonetimi
- Dosya yonetimi (Cloudinary)
- Site ayarlari & dil yonetimi
- Surukleme-birakma siralama (dnd-kit)
- Veritabani yedekleme/geri yukleme

## Cok Dilli Mimari

Veritabani odakli i18n deseni:

```
services (ana tablo)          services_i18n (ceviri tablosu)
├── id                        ├── id
├── is_active                 ├── service_id → services.id
├── display_order             ├── locale (tr, en, de)
└── created_at                ├── title, slug, description
                              └── meta_title, meta_description
```

- **Backend:** Locale cozmesi: `?locale=` > `x-locale` header > `Accept-Language` > varsayilan
- **Frontend:** URL oneki (`/tr/`, `/en/`, `/de/`)
- **Admin:** Tum icerikler locale bazli CRUD

## Kurulum

### Gereksinimler

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 18.17
- MySQL 8

### Backend

```bash
cd backend
cp .env.example .env   # Ortam degiskenlerini duzenle
bun install
bun run db:seed        # Veritabanini olustur & seed et
bun run dev            # http://localhost:8093
```

**Ortam Degiskenleri:**

| Degisken | Aciklama |
|----------|----------|
| `DATABASE_URL` | MySQL baglanti dizesi |
| `JWT_SECRET` | JWT imza anahtari |
| `CORS_ORIGIN` | Izin verilen originler (virgul ile ayrilmis) |
| `CLOUDINARY_*` | Cloudinary API bilgileri |
| `SMTP_*` | E-posta sunucusu ayarlari |
| `GOOGLE_*` | Google OAuth bilgileri |
| `STORAGE_DRIVER` | `cloudinary` veya `local` |

### Frontend

```bash
cd frontend
bun install
bun run dev            # http://localhost:3000
```

### Admin Panel

```bash
cd admin_panel
bun install
bun run dev            # http://localhost:3000
```

## Komutlar

| Komut | Frontend | Backend | Admin Panel |
|-------|----------|---------|-------------|
| Gelistirme | `bun run dev` | `bun run dev` | `bun run dev` |
| Build | `bun run build` | `bun run build` | `bun run build` |
| Baslat | `bun run start` | `bun run start` | `bun run start` |
| Lint | `bun run lint` | — | `bun run lint` |
| Tip kontrolu | `bun run typecheck` | — | — |
| E2E test | `bun run test:e2e` | — | — |
| Format | — | — | `bun run format` |
| DB Seed | — | `bun run db:seed` | — |



## Production Deployment

GitHub Actions ile `main` branch'e push yapildiginda otomatik deploy edilir.

| Servis | Port | PM2 Adi |
|--------|------|---------|
| Backend | 8093 | `konigsmassage-backend` |
| Frontend | 3055 | `konigsmassage-frontend` |
| Admin Panel | 3056 | `konigsmassage-admin-panel` |

**Akis:** Push to `main` → Bun install → Build → rsync to VPS → PM2 reload

## API Endpoint Yapisi

```
# Public (Musteri)
GET    /services                 # Hizmet listesi
GET    /services/by-slug/:slug   # Hizmet detayi
GET    /faqs                     # SSS listesi
POST   /bookings                 # Randevu olustur
POST   /contact                  # Iletisim formu
POST   /newsletter               # Bulten aboneligi
GET    /slider                   # Slider verileri
GET    /site-settings            # Site ayarlari
POST   /auth/login               # Giris
POST   /auth/register            # Kayit

# Admin (Yonetim)
/admin/services/*                # Hizmet CRUD
/admin/bookings/*                # Randevu yonetimi
/admin/availability/*            # Musaitlik yonetimi
/admin/resources/*               # Kaynak yonetimi
/admin/faqs/*                    # SSS CRUD
/admin/site-settings/*           # Site ayarlari
/admin/storage/*                 # Dosya yonetimi
/admin/dashboard/*               # Dashboard istatistikleri
/admin/db/*                      # Veritabani islemleri
...
```

## Lisans

[MIT](LICENSE) — Orhan Guzel
