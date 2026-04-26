# Antigravity Knowledge Base — GoldMoodAstro

Antigravity'nin (UI doğrulama aracı) GoldMoodAstro projesi için bağlam dosyası.

## Proje

GoldMoodAstro: danışman ↔ kullanıcı eşleştirme platformu. Astroloji & mood danışmanlığı odaklı. Mobil-öncelikli akış (Flutter) + web admin paneli + public web sitesi.

Ana akış:
1. Kullanıcı danışman seçer (filtre: uzmanlık, fiyat, puan)
2. Müsait slot'tan randevu alır
3. Iyzipay üzerinden öder
4. Randevu zamanı geldiğinde uygulama içi sesli görüşme (Agora)
5. Sonra danışmanı değerlendirir

## URL'ler

| Uygulama | Lokal | Canlı |
|----------|-------|-------|
| Public Web (Next.js) | `http://localhost:3000` | `https://goldmoodastro.com` |
| Backend API (Fastify) | `http://localhost:8094/api` | `https://goldmoodastro.com/api` |
| Admin Panel (Next.js) | `http://localhost:3094` | `https://admin.goldmoodastro.com` |
| Swagger Docs | `http://localhost:8094/docs` | (prod'da kapalı) |
| Health | `http://localhost:8094/api/health` | `https://goldmoodastro.com/api/health` |

i18n: public site `/tr` ve `/en`. Default `/tr`.

## Test Kullanıcıları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Admin | `admin@goldmoodastro.com` | `.secrets/credentials.env` → `ADMIN_PASSWORD` |
| Test user | `10000000-0000-4000-8000-000000000010` (UUID) | seed'den kontrol |

Test danışman ID'leri (seed):
- `20000000-0000-4000-8000-000000000001` / `002` / `003`

## Public Web — Sayfa Haritası

| Sayfa | URL | Kontrol Edilecekler |
|-------|-----|---------------------|
| Anasayfa | `/tr` | Hero, FeaturedConsultants, ExpertiseCategories, HomeIntro 3-step, Feedback, Blog, CTA |
| Danışmanlar | `/tr/consultants` | Filtreler (uzmanlık, fiyat, puan), liste, pagination |
| Danışman Detay | `/tr/consultants/[id]` | Profil, uzmanlık, müsaitlik, "Randevu Al" |
| Booking | `/tr/booking` | 3-step (slot → ödeme → onay) |
| Booking Callback | `/tr/booking/payment` | Iyzipay sonuç sayfası |
| Profile | `/tr/profile` | Kullanıcı bilgileri |
| Profile Bookings | `/tr/profile/bookings` | Sipariş listesi, durumlar |
| Login | `/tr/login` | E-posta/şifre, Google OAuth (config'liyse) |
| Register | `/tr/register` | Kayıt formu, `rules_accepted` zorunlu |
| Şifre Sıfırla | `/tr/forgot-password` | E-posta input, mail gönderimi |
| Verify Email | `/tr/verify-email?token=...` | Mail link onayı |
| Blog | `/tr/blog` | Blog listesi (custom_pages) |
| Hakkında | `/tr/about` | Statik içerik |
| İletişim | `/tr/contact` | Form |
| KVKK / Gizlilik | `/tr/privacy-policy`, `/tr/kvkk`, `/tr/cookie-policy`, `/tr/terms`, `/tr/legal-notice` | Statik metin |
| FAQ | `/tr/faqs` | SSS |

Müşteri sunum demoları (geçici): `https://goldmoodastro.com/1`, `/2`

## Admin Panel — Sayfa Haritası

Tümü `/admin/*` altında, route grup: `(admin)`.

| Sayfa | URL | Kontrol Edilecekler |
|-------|-----|---------------------|
| Login | `/auth/login` | Sadece admin@... + şifre |
| Dashboard | `/admin` | Özet, son aktiviteler |
| Dashboard (default) | `/admin/dashboard/default` | İstatistik kartları |
| **Consultants** | `/admin/consultants` | Liste, onay/red, profil edit |
| **Bookings** | `/admin/bookings` | Tüm randevular, filtre |
| **Availability** | `/admin/availability` | Danışman çalışma saatleri |
| **Orders** | `/admin/orders` | Ödeme kayıtları |
| **Wallet** | `/admin/wallet` | Danışman kazanç ledger'ı |
| **Reviews** | `/admin/reviews` | Değerlendirmeler, moderasyon |
| Users | `/admin/users` | Kullanıcı listesi |
| User Roles | `/admin/user-roles` | Rol/permission yönetimi |
| Notifications | `/admin/notifications` | Bildirim listesi |
| Announcements | `/admin/announcements` | Duyuru CRUD |
| Chat | `/admin/chat` | Mesaj yönetimi |
| Support | `/admin/support` | Destek talepleri |
| Audit | `/admin/audit` | İşlem logları + günlük chart + heatmap |
| Reports | `/admin/reports` | Raporlar |
| Email Templates | `/admin/email-templates` | Mail şablonları |
| Storage | `/admin/storage` | Dosya yönetimi |
| **Site Settings** | `/admin/site-settings` | SEO, header, footer, **design tokens** (renkler) |
| Telegram | `/admin/telegram` | Telegram bot ayarları |
| Profile | `/admin/profile` | Admin kendi profil |

## Kritik Akışlar (E2E test öncelik)

1. **Booking → Ödeme** (Iyzipay sandbox)
   - Danışman seç → slot al → checkout → Iyzipay form → callback
   - Gerekli: Iyzipay sandbox keys (`.secrets/credentials.env`)

2. **Sesli görüşme** (Agora)
   - Booking confirm → görüşme zamanı → token alıp Agora kanaldan bağlan
   - Gerekli: AGORA_APP_ID, AGORA_APP_CERTIFICATE
   - Mobil tarafta test edilir (Flutter)

3. **Push bildirim** (Firebase FCM)
   - FCM token al → randevu yaklaşma bildirimi
   - Gerekli: FIREBASE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY

4. **Admin design tokens**
   - `/admin/site-settings` → "Design Tokens" tab'ı
   - Renk değiştir → kaydet → public site'a yansıma (CSS vars `--gm-*`)

5. **Custom pages (about/blog/privacy)**
   - Admin'den içerik düzenle → frontend SSR'de yenilenmiş içerik

## Bilinen Sorunlar (2026-04-26)

- ⚠ Frontend `NEXT_PUBLIC_API_URL` `…/api/v1` olarak set edilmiş ama backend route'ları `/api/...` (v1 prefix yok) — admin/frontend'den 404 gelen `/api/v1/api/...` istekler nginx access log'da görülüyor. Düzeltilecek.
- 3rd-party credentials boş: SMTP, Cloudinary, Google OAuth, Agora, Firebase, Iyzipay → bu credentials gelene kadar ilgili akışlar hata verir ya da fallback'e düşer (örn. local storage).

## İlgili Dokümanlar

- `CLAUDE.md` (proje root) — Mimari + agent rolleri
- `AGENTS.md` — Codex'in tüm görev listesi
- `doc/mvp-checklist.md` — MVP çalışma planı
- `doc/deploy-notes.md` — Deploy süreci, scripts, troubleshooting
