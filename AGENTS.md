# AGENTS.md — Codex için GoldMoodAstro Görev Listesi

Bu dosya Codex'in okuyup çalıştığı talimat dosyasıdır.

---

## Proje Özeti

**GoldMoodAstro** — danışman & kullanıcı eşleştirme platformu.  
Kullanıcı danışman seçiyor → randevu alıyor → ödeme yapıyor → uygulama içi sesli görüşme yapıyor.  
Odak: astroloji / mood danışmanlığı.

**Platformlar:** Flutter (iOS + Android) + Web Admin Panel  
**Backend:** Fastify 5, Drizzle ORM, MySQL, Bun  
**Yeni entegrasyonlar:** Agora SDK (sesli görüşme), Firebase FCM (push), Iyzipay (ödeme)

---

## Repo Yapısı

```
goldmoodastro/                        ← monorepo root (bun workspaces)
├── packages/
│   ├── shared-backend/               ← @goldmood/shared-backend (24 paylaşılan modül)
│   ├── shared-ui/                    ← @goldmood/shared-ui (admin panel UI bileşenleri)
│   ├── shared-types/                 ← @goldmood/shared-types
│   ├── shared-config/                ← @goldmood/shared-config
│   └── core/                         ← @goldmood/core
├── backend/                          ← Fastify API (port 8094)
│   └── src/
│       ├── modules/                  ← PROJE-ÖZEL modüller (consultants, agora, firebase)
│       ├── routes/
│       │   ├── shared.ts             ← shared-backend route kayıtları
│       │   └── goldmood.ts           ← proje-özel route kayıtları (BURAYA EKLE)
│       └── db/sql/                   ← SQL seed dosyaları (TAMAMEN YENİDEN YAZILACAK)
├── admin_panel/                      ← Next.js 16 admin (port 3094) ✅ TAMAMLANDI
├── mobile/                           ← Expo SDK 54, Flutter yapısı ✅ SCAFFOLD TAMAM
└── frontend/                         ← Next.js 16 web frontend (port 3095) ✅ FAZ 5 TAMAMLANDI
```

---

## Teknoloji Kuralları

- **Runtime:** Bun (npm/yarn kullanma)
- **Dil:** TypeScript strict mode
- **DB:** MySQL — `ALTER TABLE` YASAK, şema değişikliği = seed dosyasını düzenle + `bun run db:seed`
- **ORM:** Drizzle ORM (drizzle-orm/mysql-core)
- **Validation:** Zod
- **Backend framework:** Fastify 5
- **Admin panel:** Next.js 16, Tailwind v4, React Query, Zustand, Radix UI

---

## Modül Yazma Kuralı (Pattern)

Her modül `backend/src/modules/<isim>/` altında şu dosyaları içerir:

```
schema.ts       ← Drizzle ORM tablo tanımları
router.ts       ← Public Fastify route kaydı
admin.routes.ts ← Admin Fastify route kaydı
controller.ts   ← Route handler'lar
repository.ts   ← DB sorguları
validation.ts   ← Zod şemaları
index.ts        ← Barrel export
```

Örnekler için: `packages/shared-backend/modules/auth/` veya `packages/shared-backend/modules/bookings/`

---

## Veritabanı ID Kuralı

Mevcut shared-backend modülleri `CHAR(36)` UUID kullanıyor.  
Yeni modüllerde aynı pattern'i kullan:
```typescript
id: char("id", { length: 36 }).primaryKey().notNull()
```

---

## GÖREV LİSTESİ — ÖNCELİK SIRALI

### ✅ FAZA 0: Temizlik — TAMAMLANDI

#### T0-1: `frontend/` dizinini sil — ✅ DONE
#### T0-2: `_shared/` temizlendi — ✅ DONE
#### T0-3: SQL seeds (001→150, 22 dosya) — ✅ DONE (Claude Code yazdı)
#### T0-4: `.env.example` — ✅ DONE
#### T0-5: Swagger (`app.ts`) — ✅ DONE
#### T0-6: `consultants/`, `agora/`, `firebase/` modülleri — ✅ DONE (Codex yazdı)

---

### 🔴 FAZ 1: Kalan Backend (Tamamlanması Gereken)

#### T1-X: `_shared/` içindeki silinen modül dosyalarını temizle
Dosya: `packages/shared-backend/modules/_shared/`  
Şu dosyaları SİL (artık karşılıklı modülleri yok):
- `brand.ts`, `custompage.ts`, `faqs.ts`, `footer.ts`, `pricing.ts`
- `projects.ts`, `resume.ts`, `services.ts`, `skill.ts`

Bu dosyaların `_shared/index.ts` içindeki export'larını da kaldır.

#### T0-3: SQL seed dosyalarını komple sil ve goldmoodastro için yeniden yaz
Mevcut `backend/src/db/sql/` — 87 dosyanın tamamı konigsmassage-a özel.  
**Tümünü sil**, aşağıdaki listeye göre yeniden yaz:

```
001_auth_schema.sql          ← users tablosu (rol: user/consultant/admin)
002_auth_seed.sql            ← Admin hesabı seed
003_user_roles.sql           ← Rol tanımları
010_site_settings.sql        ← App config (Agora app ID, FCM config alanları)
020_audit_schema.sql         ← Audit log
030_consultants_schema.sql   ← consultants tablosu (aşağıda tanım var)
031_consultants_seed.sql     ← Test danışman verileri
040_availability_schema.sql  ← Danışman çalışma saatleri
041_availability_seed.sql    ← Test slot verileri
050_bookings_schema.sql      ← Randevu tablosu (booking_id → consultant_id eklenir)
051_bookings_seed.sql        ← Test randevu
060_orders_schema.sql        ← Ödeme sistemi (payment_gateways, orders, payments)
061_orders_seed.sql          ← Iyzipay test gateway
070_voice_sessions_schema.sql← Agora sesli görüşme kayıtları (YENİ TABLO)
080_wallet_schema.sql        ← Danışman kazanç takibi
090_chat_schema.sql          ← Mesajlaşma
100_notifications_schema.sql ← Bildirimler
110_support_schema.sql       ← Destek talepleri
120_review_schema.sql        ← Danışman değerlendirmeleri
130_announcements_schema.sql ← Sistem duyuruları
140_storage_schema.sql       ← Dosya depolama
150_email_templates.sql      ← Email şablonları (booking_confirmed, booking_reminder, etc.)
```

#### T0-4: `backend/.env` dosyasını goldmoodastro için güncelle
`.env.example` oluştur:
```env
PORT=8094
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=goldmoodastro

JWT_SECRET=
COOKIE_SECRET=

STORAGE_DRIVER=local

SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
MAIL_FROM=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

AGORA_APP_ID=
AGORA_APP_CERTIFICATE=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

IYZIPAY_API_KEY=
IYZIPAY_SECRET_KEY=
IYZIPAY_BASE_URL=https://sandbox-api.iyzipay.com

FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
PUBLIC_URL=http://localhost:8094
```

---

### 🔴 FAZ 1: Backend Core Modüller (Hafta 1)

#### T1-1: `consultants` modülü — `backend/src/modules/consultants/`

**Schema (`schema.ts`):**
```sql
CREATE TABLE consultants (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,     -- FK → users.id
  bio TEXT,
  expertise JSON,                        -- ["astrology","tarot","numerology"]
  languages JSON,                        -- ["tr","en"]
  session_price DECIMAL(10,2) NOT NULL,
  session_duration INT NOT NULL DEFAULT 30,  -- dakika
  currency CHAR(3) DEFAULT 'TRY',
  approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  is_available TINYINT DEFAULT 1,
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Public routes (`/api/v1/consultants`):**
- `GET /` — Liste (filtre: expertise, minPrice, maxPrice, minRating)
- `GET /:id` — Profil detayı + availability
- `GET /:id/slots` — Müsait slotlar (tarih parametreli)

**Admin routes (`/api/v1/admin/consultants`):**
- `GET /` — Tüm danışmanlar (filtre: approval_status)
- `PATCH /:id/approve` — Onayla
- `PATCH /:id/reject` — Reddet (rejection_reason body'de)
- `GET /:id` — Detay

**Consultant registration** `POST /api/v1/auth/consultant-register` olarak auth modülüne eklenebilir veya ayrı endpoint: `POST /api/v1/consultants/register`

Route'u `backend/src/routes/goldmood.ts` içine kaydet.

#### T1-2: `agora` modülü — `backend/src/modules/agora/`

**Amaç:** Sadece randevu saatinde, sadece o iki kullanıcıya Agora token üretmek.

**Bağımlılık ekle:** `bun add agora-token` (backend/package.json'a)

**Schema:** `voice_sessions` tablosu
```sql
CREATE TABLE voice_sessions (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL UNIQUE,  -- FK → bookings.id
  channel_name VARCHAR(255) NOT NULL,
  token_user TEXT,
  token_consultant TEXT,
  status ENUM('pending','active','ended','missed') DEFAULT 'pending',
  started_at DATETIME,
  ended_at DATETIME,
  duration_seconds INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

**Routes (`/api/v1/agora`):**
- `POST /token` — Auth gerekli. booking_id alır, randevu saatini kontrol eder (±15dk), token üretir.
  - Yanıt: `{ channel_name, token, app_id, uid }`
- `POST /session/end` — Görüşmeyi sonlandırır, süreyi kaydeder.

**Kural:** Token süresi = `session_duration + 30` dakika (buffer).  
**Güvenlik:** Sadece o booking'e ait kullanıcı/danışman token alabilir.

#### T1-3: `firebase` modülü — `backend/src/modules/firebase/`

**Amaç:** Firebase Admin SDK ile FCM push bildirimi göndermek.

**Bağımlılık ekle:** `bun add firebase-admin`

**Servis (`service.ts`):**
```typescript
export async function sendPushNotification(params: {
  token: string;      // FCM device token
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void>
```

**Routes (`/api/v1/push`):**
- `POST /register-token` — Auth gerekli. Kullanıcının FCM token'ını kaydet (users tablosuna `fcm_token` kolonu eklenmeli — SQL seed'de ekle).

**Cron jobs** (ayrı bir `backend/src/cron/` dizinine):
- `booking-reminders.ts` — Her 5 dakikada çalışır, yaklaşan randevular için push gönderir:
  - 24 saat öncesi: "Yarın randevunuz var"
  - 2 saat öncesi: "2 saat sonra randevunuz var"
  - 15 dakika öncesi: "Görüşmeniz 15 dakika sonra başlıyor"

---

### 🟡 FAZ 2: Admin Panel (Hafta 2–3)

#### T2-1: `admin_panel/` scaffold
Konigsmassage `admin_panel/`'ini baz al ama goldmoodastro için:

```bash
# Referans: /home/orhan/Documents/Projeler/vps-guezel/konigsmassage/admin_panel/
# Kopyala ve uyarla (bun workspaces'e admin_panel olarak ekli)
```

**package.json adı:** `goldmoodastro-admin`  
**Port:** 3094  
**NEXT_PUBLIC_API_URL:** `http://localhost:8094/api`

#### T2-2: Admin panel sayfaları

Aşağıdaki sırayla oluştur:

```
src/app/(main)/admin/(admin)/
  dashboard/          ← KPI kartları (kullanıcılar, randevular, gelir, aktif görüşmeler)
  consultants/        ← Liste + onay/red işlemi
  consultants/[id]/   ← Danışman detayı
  users/              ← Kullanıcı listesi
  bookings/           ← Randevu listesi (filtre: status, tarih, danışman)
  bookings/[id]/      ← Randevu detayı
  orders/             ← Ödeme listesi
  reviews/            ← Değerlendirme moderasyonu
  support/            ← Destek talepleri
  announcements/      ← Duyuru yönetimi
  notifications/      ← Bildirim gönder
  settings/           ← Site ayarları (Agora app ID, Iyzipay keys vb.)
  email-templates/    ← Email şablonları
```

#### T2-3: Admin panel API entegrasyonu
- `src/integrations/baseApi.ts` — RTK Query veya React Query base kurulumu
- `src/integrations/endpoints/` — Her modül için endpoint tanımları

---

### 🟡 FAZ 3: Flutter Mobile (Hafta 3–4)

#### T3-1: Flutter proje iskeleti — `mobile/`
```bash
cd goldmoodastro/
flutter create mobile --org com.goldmoodastro --platforms ios,android
```

**Bağımlılıklar (`pubspec.yaml`):**
```yaml
dependencies:
  flutter_riverpod: ^2.x    # State management
  dio: ^5.x                 # HTTP client
  agora_rtc_engine: ^6.x    # Sesli görüşme
  firebase_core: ^3.x
  firebase_messaging: ^15.x # FCM push
  flutter_local_notifications: ^17.x
  go_router: ^13.x          # Navigation
  shared_preferences: ^2.x
  flutter_secure_storage: ^9.x
  cached_network_image: ^3.x
  intl: ^0.19.x
```

#### T3-2: Flutter klasör yapısı
```
mobile/lib/
  core/
    api/            ← Dio http client (base URL, interceptors, auth refresh)
    router/         ← GoRouter tanımları
    theme/          ← App theme, colors, typography
  features/
    auth/           ← Login, register, Google sign-in
    consultants/    ← Liste, profil, filtre
    booking/        ← Slot seçimi, onay
    payment/        ← Iyzipay WebView akışı
    call/           ← Agora sesli görüşme ekranı
    chat/           ← Mesajlaşma
    profile/        ← Kullanıcı profili
    appointments/   ← Randevu geçmişi
    notifications/  ← Bildirim listesi
```

#### T3-3: Flutter ekranlar (öncelik sırası)

1. `SplashScreen` → token kontrolü → yönlendirme
2. `LoginScreen` / `RegisterScreen` / `ConsultantRegisterScreen`
3. `HomeScreen` — danışman listesi + arama
4. `ConsultantProfileScreen` — profil + slot takvimi
5. `BookingScreen` — slot seçimi + özet
6. `PaymentScreen` — Iyzipay WebView
7. `AppointmentsScreen` — randevularım (upcoming + past)
8. `CallScreen` — Agora sesli görüşme
9. `ChatScreen` — mesajlaşma
10. `ProfileScreen` — kullanıcı profili + settings

---

### 🟢 FAZ 4: Deploy (Hafta 4)

#### T4-1: GitHub Actions CI/CD
Dosya: `.github/workflows/main.yml`  
Tetikleyici: push to `main`

```yaml
jobs:
  backend:
    - bun install + bun run build
    - rsync → VPS /var/www/goldmoodastro/backend
    - ssh: pm2 reload goldmoodastro-backend

  admin-panel:
    - bun install + bun run build
    - rsync → VPS /var/www/goldmoodastro/admin_panel
    - ssh: pm2 reload goldmoodastro-admin
```

#### T4-2: Nginx config
```nginx
# backend API
location /api/ {
  proxy_pass http://localhost:8094;
}
# admin panel
location / {
  proxy_pass http://localhost:3094;
}
```

#### T4-3: PM2 config
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    { name: 'goldmoodastro-backend', script: 'dist/index.js', cwd: '/var/www/goldmoodastro/backend' },
    { name: 'goldmoodastro-admin', script: 'node_modules/.bin/next', args: 'start -p 3094', cwd: '/var/www/goldmoodastro/admin_panel' },
  ]
}
```

---

## Önemli Notlar Codex İçin

1. **Import path:** Shared paketi `@goldmood/shared-backend` — `@vps/` kullanma
2. **Alias:** Backend içinde `@/` → `./src/` (bunfig.toml tanımlı)
3. **Yeni route kayıt yeri:** `backend/src/routes/goldmood.ts` içine ekle, oradan `registerGoldmoodPublic` / `registerGoldmoodAdmin` fonksiyonlarına
4. **SQL seed format:** Dosya adı `NNN_açıklama.sql`, örnek `030_consultants_schema.sql`
5. **Cron:** Bun'ın native `Bun.cron` API'si veya `node-cron` — hangisini seçersen `backend/src/cron/` altında ayrı dosyalar
6. **Test danışman:** seed'lerde 2-3 test danışman oluştur (approved status ile)

---

## FAZ 5 — Frontend Web (Codex Görevleri)

> Kaynak: `frontend/` (konigsmassage baz, GoldMoodAstro rebrand)  
> Görev sırası: T5-1 → T5-2 → T5-3 → ... → T5-11  
> Detay: `doc/mvp-checklist.md` — FAZ 5 bölümü

### T5-1: Backend — Design Token Seed

**Dosya:** `backend/src/db/sql/010_site_settings_seed.sql`

`design_tokens` key'ini ekle:
```sql
INSERT INTO site_settings (id, `key`, value, `group`, label, description, is_public, created_at, updated_at)
VALUES (
  UUID(),
  'design_tokens',
  '{"version":"1","colors":{"brand_primary":"#7B5EA7","brand_primary_dark":"#5C4480","brand_primary_light":"#9B7EC8","brand_secondary":"#D4AF37","brand_secondary_dim":"#B8962E","brand_secondary_light":"#F0CF6B","brand_accent":"#5A4E87","bg_base":"#0D0B1E","bg_deep":"#1A1630","bg_surface":"#241E3D","bg_surface_high":"#2E2850","text_primary":"#F0E6FF","text_secondary":"#C9B8E8","text_muted":"#7A6DA0","text_muted_soft":"#4D4570","border":"rgba(201,184,232,0.14)","border_soft":"rgba(201,184,232,0.07)","success":"#4CAF6E","warning":"#F0A030","error":"#E55B4D","info":"#5B9BD5"},"typography":{"font_display":"Fraunces, serif","font_sans":"InterTight, system-ui, sans-serif","font_mono":"JetBrains Mono, monospace","base_size":"16px"},"radius":{"xs":"4px","sm":"8px","md":"12px","lg":"16px","xl":"24px","pill":"9999px"},"shadows":{"soft":"0 2px 20px rgba(0,0,0,0.3)","card":"0 4px 24px rgba(0,0,0,0.4)","glow_primary":"0 0 30px rgba(123,94,167,0.3)","glow_gold":"0 0 30px rgba(212,175,55,0.2)"},"branding":{"app_name":"GoldMoodAstro","tagline":"Ruhsal danışmanlık platformu","tagline_en":"Your spiritual guidance platform","logo_url":"","favicon_url":"","theme_color":"#7B5EA7","og_image_url":""}}',
  'design',
  'Design Tokens',
  'Frontend ve mobile için marka renkleri, tipografi ve tasarım token değerleri',
  1,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();
```

`site_settings` public GET endpoint'ini doğrula — `is_public = 1` olan key'ler auth gerektirmemeli.

---

### T5-2: Frontend — ThemeProvider

**Yeni dosyalar:**

`frontend/src/lib/tokens/types.ts`:
```typescript
export interface DesignTokenColors {
  brand_primary: string; brand_primary_dark: string; brand_primary_light: string;
  brand_secondary: string; brand_secondary_dim: string; brand_secondary_light: string;
  brand_accent: string;
  bg_base: string; bg_deep: string; bg_surface: string; bg_surface_high: string;
  text_primary: string; text_secondary: string; text_muted: string; text_muted_soft: string;
  border: string; border_soft: string;
  success: string; warning: string; error: string; info: string;
}
export interface DesignTokenTypography {
  font_display: string; font_sans: string; font_mono: string; base_size: string;
}
export interface DesignTokenRadius {
  xs: string; sm: string; md: string; lg: string; xl: string; pill: string;
}
export interface DesignTokenShadows {
  soft: string; card: string; glow_primary: string; glow_gold: string;
}
export interface DesignTokenBranding {
  app_name: string; tagline: string; tagline_en: string;
  logo_url: string; favicon_url: string; theme_color: string; og_image_url: string;
}
export interface DesignTokens {
  version: string;
  colors: DesignTokenColors;
  typography: DesignTokenTypography;
  radius: DesignTokenRadius;
  shadows: DesignTokenShadows;
  branding: DesignTokenBranding;
}
```

`frontend/src/lib/tokens/defaults.ts` — yukarıdaki JSON değerlerini TypeScript nesne olarak yaz.

`frontend/src/lib/tokens/tokensToCSS.ts`:
```typescript
import type { DesignTokens } from './types';

export function tokensToCSS(t: DesignTokens): string {
  const c = t.colors; const r = t.radius; const s = t.shadows;
  return `:root {
    --gm-primary:${c.brand_primary};--gm-primary-dark:${c.brand_primary_dark};
    --gm-primary-light:${c.brand_primary_light};--gm-gold:${c.brand_secondary};
    --gm-gold-dim:${c.brand_secondary_dim};--gm-gold-light:${c.brand_secondary_light};
    --gm-accent:${c.brand_accent};--gm-bg:${c.bg_base};--gm-bg-deep:${c.bg_deep};
    --gm-surface:${c.bg_surface};--gm-surface-high:${c.bg_surface_high};
    --gm-text:${c.text_primary};--gm-text-dim:${c.text_secondary};
    --gm-muted:${c.text_muted};--gm-muted-soft:${c.text_muted_soft};
    --gm-border:${c.border};--gm-border-soft:${c.border_soft};
    --gm-success:${c.success};--gm-warning:${c.warning};
    --gm-error:${c.error};--gm-info:${c.info};
    --gm-radius-xs:${r.xs};--gm-radius-sm:${r.sm};--gm-radius-md:${r.md};
    --gm-radius-lg:${r.lg};--gm-radius-xl:${r.xl};--gm-radius-pill:${r.pill};
    --gm-shadow-soft:${s.soft};--gm-shadow-card:${s.card};
    --gm-shadow-glow:${s.glow_primary};--gm-shadow-gold:${s.glow_gold};
  }`;
}
```

`frontend/src/lib/tokens/fetchTokens.server.ts` (server-only):
```typescript
import 'server-only';
import type { DesignTokens } from './types';
import { DEFAULT_TOKENS } from './defaults';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8094/api').replace(/\/$/, '');

export async function fetchDesignTokens(): Promise<DesignTokens> {
  try {
    const res = await fetch(`${API_BASE}/site_settings/design_tokens`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return DEFAULT_TOKENS;
    const data = await res.json();
    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    if (!value?.colors?.brand_primary) return DEFAULT_TOKENS;
    return { ...DEFAULT_TOKENS, ...value };
  } catch {
    return DEFAULT_TOKENS;
  }
}
```

`frontend/src/components/ThemeProvider.tsx` (server component):
```tsx
import { fetchDesignTokens } from '@/lib/tokens/fetchTokens.server';
import { tokensToCSS } from '@/lib/tokens/tokensToCSS';

export async function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tokens = await fetchDesignTokens();
  const css = tokensToCSS(tokens);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
```

`frontend/src/app/[locale]/layout.tsx`'de `<ThemeProvider>` wrap et.

---

### T5-3: Frontend — Sayfaları Temizle

Silecek dizinler:
- `frontend/src/app/[locale]/gutschein/`
- `frontend/src/app/[locale]/services/`
- `frontend/src/app/[locale]/appointment/`
- `frontend/src/components/containers/gutschein/`
- `frontend/src/components/containers/services/`
- `frontend/src/components/containers/appointment/`

`next.config.js`'e redirect ekle (var olan `redirects()` fonksiyonuna):
```js
{ source: '/:locale/gutschein', destination: '/:locale', permanent: true },
{ source: '/:locale/services', destination: '/:locale/consultants', permanent: true },
{ source: '/:locale/appointment', destination: '/:locale/consultants', permanent: true },
```

`HomeIntroSection.tsx` içindeki hardcoded masaj metinlerini 3-step danışmanlık akışıyla değiştir:
- Step 1: "Danışman Seç" — uzmanlık ve puana göre incele
- Step 2: "Randevu Al" — müsait slot seç, güvenli ödeme yap
- Step 3: "Görüşmeyi Başlat" — uygulama içi sesli seans

---

### T5-4: Frontend — Consultant Sayfaları

**RTK endpoint:** `frontend/src/integrations/rtk/public/consultants.public.endpoints.ts`
```typescript
import { baseApi } from '../baseApi';
import type { Consultant, ConsultantSlot } from '@/types/common';

const consultantsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConsultants: build.query<Consultant[], { expertise?: string; minPrice?: number; maxPrice?: number; minRating?: number }>({
      query: (params) => ({ url: '/consultants', params }),
    }),
    getConsultant: build.query<Consultant, string>({
      query: (id) => `/consultants/${id}`,
    }),
    getConsultantSlots: build.query<ConsultantSlot[], { id: string; date: string }>({
      query: ({ id, date }) => `/consultants/${id}/slots?date=${date}`,
    }),
  }),
});
export const { useListConsultantsQuery, useGetConsultantQuery, useGetConsultantSlotsQuery } = consultantsApi;
```

**Backend response envelope:** Tüm consultant endpoint'leri `{ data: T }` ile sarmalanmış döner.  
RTK base query transformer veya her endpoint'te `transformResponse: (r) => r.data` kullan.

**Sayfalar:**
- `frontend/src/app/[locale]/consultants/page.tsx` — SSR metadata + `<Suspense>` + `<ConsultantList>` + `<ConsultantFilters>`
- `frontend/src/app/[locale]/consultants/[id]/page.tsx` — danışman detay + slot seçici
- Slot seçince URL query params ile `/[locale]/booking` sayfasına git

**Type tanımları:** `frontend/src/types/common.ts`'e Consultant ve ConsultantSlot ekle.

---

### T5-5: Frontend — Auth

`frontend/src/integrations/rtk/public/auth.endpoints.ts`:
- `loginMutation`: `POST /auth/login` → response: `{ access_token, user }`
- `registerMutation`: `POST /auth/signup` → body'e `rules_accepted: true` ekle
- `logoutMutation`: `POST /auth/logout`
- `getMeQuery`: `GET /auth/me`

Token store: `frontend/src/integrations/rtk/token.ts` — `access_token` field adını kullan.

Login form başarılı → `router.push('/tr')` yönlendir.  
Register form: KVKK checkbox zorunlu, `rules_accepted: true` gönder.

---

### T5-6: Frontend — Randevu & Ödeme

`frontend/src/app/[locale]/booking/page.tsx` — URL params oku:
```
?consultantId=&resourceId=&slotId=&date=&time=&price=&duration=&name=
```

Ödeme akışı:
1. `POST /bookings` → booking.id al
2. `POST /orders` `{ booking_id, payment_gateway_slug: 'iyzipay' }` → order.order_id al
3. `POST /orders/:id/init-iyzico` → checkout_url al
4. `window.location.href = checkout_url`

`frontend/src/app/[locale]/booking/payment/page.tsx`:
- `?status=success&token=...` → başarı mesajı + `/[locale]/profile/bookings`'a link
- `?status=failure` → hata + "Tekrar Dene"

---

### T5-7: Frontend — Anasayfa

`frontend/src/app/[locale]/page.tsx` kompozisyonu:
1. `<HeroSection>` — site_settings'den hero başlık/CTA
2. `<ExpertiseSection>` — 6 uzmanlık kategorisi (astroloji, tarot, numeroloji, mood, kariyer, ilişki)
3. `<FeaturedConsultants>` — `GET /consultants?limit=6` en yüksek ratingli
4. `<HowItWorksSection>` — 3 adım
5. `<TestimonialsSection>` — `GET /reviews?is_approved=1&limit=6`
6. `<CtaBanner>` — danışman ol CTA

---

### T5-8: Admin — Design Token Editörü

`admin_panel/src/app/(main)/admin/(admin)/site-settings/tabs/design-tokens-tab.tsx`:

- Renk grupları için `<input type="color">` + hex `<Input>` çifti
- Token değişince `localTokens` state güncelle
- "Kaydet" → `PUT /site_settings` `{ key: 'design_tokens', value: JSON.stringify(localTokens) }`
- "Sıfırla" → hardcoded default değerlere dön
- Canlı önizleme: mini consultant card bileşeni (mock data, inline style ile token değerleri)

Tab'ı `tabs/index.ts`'e ekle: `{ key: 'design-tokens', label: 'Tema Tasarımı', component: DesignTokensTab }`  
Admin sidebar'a "Tema Tasarımı" link ekle.

---

### T5-9: Frontend — Blog, Hakkında, İletişim

- `blog/page.tsx`, `blog/[slug]/page.tsx` — RTK blog endpoints
- `about/page.tsx` — site_settings'den content key
- `contact/page.tsx` — mail POST endpoint
- `faqs/page.tsx` — RTK faqs endpoint
- Almanca hardcoded metinleri kaldır

---

### T5-10: Frontend — SEO & Manifest

- `src/seo/serverMetadata.ts` → `design_tokens.branding.app_name` / `og_image_url` kullan
- `src/app/manifest.ts` → `theme_color: design_tokens.branding.theme_color`
- `robots.ts`, `sitemap.ts` → goldmoodastro.com domain
- `public/favicon/` → amethyst renkli SVG favicon

---

### T5-11: Frontend — CI/CD

`.github/workflows/frontend.yml`:
```yaml
name: Frontend Deploy
on:
  push:
    branches: [main]
    paths: ['frontend/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd frontend && bun install && bun run build
      - name: Deploy
        run: rsync -az --delete frontend/.next/ ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/var/www/goldmoodastro/frontend/.next/
      - name: Reload PM2
        run: ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "pm2 reload goldmoodastro-frontend"
```
