# GoldMoodAstro — MVP Çalışma Planı & Checklist

**Bütçe:** 30.000 TL | **Süre:** 30 gün → +10 gün (frontend fazı eklendi)  
**Başlangıç:** 2026-04-24

## Görev Dağılımı

| Kim | Ne Yapar |
|-----|---------|
| **Claude Code** | Mimari, DB şema, API kontratları, token sistemi tasarımı, review |
| **Codex** | Bulk implementasyon — SQL seed'ler, backend modülleri, admin panel, frontend sayfaları |
| **Antigravity** | Admin panel + Frontend UI doğrulama (Faz 2 ve Faz 5 sonunda) |
| **Copilot** | Autocomplete, boilerplate, React Native / Expo kod tamamlama |

---

## FAZ 0 — Temizlik (Gün 1-2) ✅

- [x] **T0-1** `frontend/` dizinini sil (Codex) — konigsmassage kalıntısı temizlendi
- [x] **T0-2** `packages/shared-backend/modules/_shared/` gereksiz dosyaları kaldır (Codex)
- [x] **T0-3** `backend/src/db/sql/` — 87 eski dosya silindi, goldmoodastro için yeniden yazıldı (Codex)
- [x] **T0-4** `backend/.env.example` oluşturuldu (Codex)
- [x] **T0-5** `backend/public/locales/` konig içeriği temizlendi (Codex)
- [x] **T0-6** `frontend/` konigsmassage kaynaklı yeniden oluşturuldu (Claude Code) — GoldMoodAstro rebrand

---

## FAZ 1 — Backend Core (Gün 2-10) ✅

- [x] **T1-1** `consultants` modülü — profil, uzmanlık, onay
- [x] **T1-2** `agora` modülü — voice_sessions, token üretimi
- [x] **T1-3** `firebase` modülü — FCM push, booking-reminders cron
- [x] **T1-4** Mevcut modüller goldmoodastro'ya uyarlandı
- [x] **T1-5** SQL seed sırası tamamlandı, `bun run db:seed` çalışıyor
- [x] **T1-6** Swagger/OpenAPI aktif

---

## FAZ 2 — Admin Panel (Gün 10-20) ✅

- [x] **T2-1** Scaffold — Next.js 16, port 3094
- [x] **T2-2** Auth akışı
- [x] **T2-3** Dashboard — KPI kartları
- [x] **T2-4** Danışman yönetimi (liste, onay/red, detay)
- [x] **T2-5** Kullanıcı yönetimi
- [x] **T2-6** Randevu yönetimi
- [x] **T2-7** Ödeme/sipariş listesi
- [x] **T2-8** Değerlendirme moderasyonu
- [x] **T2-9** Destek talepleri
- [x] **T2-10** Duyuru yönetimi
- [x] **T2-11** Email şablonları
- [x] **T2-12** Site ayarları (payment-agora tab)
- [x] **T2-B** Danışman Kazanç (Wallet)

---

## FAZ 3 — Expo Mobile (Gün 15-28) ✅

- [x] **T3-0** Mobile scaffold — Expo SDK 54 (Claude Code)
- [x] **T3-1** M0: Onboarding + entry
- [x] **T3-2** M1: Auth — login, register, useAuth hook
- [x] **T3-3** M2: Danışman keşif + bookings + favorites
- [x] **T3-4** M3: Randevu & Iyzipay ödeme
- [x] **T3-5** M4: Sesli görüşme (Agora) + değerlendirme
- [x] **T3-6** M5: Ayarlar & profil

---

## FAZ 4 — Deploy & Test (Gün 28-30)

- [x] **T4-1** VPS — Nginx + PM2 ecosystem
- [x] **T4-2** GitHub Actions CI/CD (backend + admin deploy)
- [ ] **T4-3** `.env` VPS kurulumu (Manuel)
- [ ] **T4-4** Iyzipay sandbox test (Manuel)
- [ ] **T4-5** Agora test görüşmesi (Manuel)
- [ ] **T4-6** Firebase FCM test (Manuel)
- [ ] **T4-7** Expo EAS Build — iOS + Android (Manuel)
- [ ] **T4-8** Staging → Production (Manuel)

---

## FAZ 5 — Frontend Web (Gün 25-35) 🆕

> Scaffold hazır (`frontend/`). Şimdi GoldMoodAstro'ya özgü içerik ve dinamik token sistemi inşa ediliyor.  
> Referans dosyalar: `AGENTS.md` (Codex okur), `doc/mvp-checklist.md` (bu dosya).

---

### T5-0 — Mimari: Design Token Sistemi (Claude Code) ← **ŞİMDİ**

**Hedef:** Backend → Admin Panel → Frontend Web → Mobile arasında tek kaynaklı (single source of truth) tasarım token sistemi.

#### Token Şeması

Token'lar `site_settings` tablosunda `design_tokens` key'i altında JSON olarak saklanır.  
Public endpoint: `GET /api/v1/site_settings/design_tokens`

```typescript
// Token shape (TypeScript contract)
interface DesignTokens {
  version: string;              // "1"
  colors: {
    // Marka renkleri
    brand_primary: string;      // "#7B5EA7" — amethyst
    brand_primary_dark: string; // "#5C4480"
    brand_primary_light: string;// "#9B7EC8"
    brand_secondary: string;    // "#D4AF37" — gold
    brand_secondary_dim: string;// "#B8962E"
    brand_secondary_light: string; // "#F0CF6B"
    brand_accent: string;       // "#5A4E87" — deep amethyst
    // Arkaplan
    bg_base: string;            // "#0D0B1E" — midnight
    bg_deep: string;            // "#1A1630"
    bg_surface: string;         // "#241E3D"
    bg_surface_high: string;    // "#2E2850"
    // Metin
    text_primary: string;       // "#F0E6FF" — stardust
    text_secondary: string;     // "#C9B8E8"
    text_muted: string;         // "#7A6DA0"
    text_muted_soft: string;    // "#4D4570"
    // Çizgi/Sınır
    border: string;             // "rgba(201,184,232,0.14)"
    border_soft: string;        // "rgba(201,184,232,0.07)"
    // Durum
    success: string;            // "#4CAF6E"
    warning: string;            // "#F0A030"
    error: string;              // "#E55B4D"
    info: string;               // "#5B9BD5"
  };
  typography: {
    font_display: string;       // "Fraunces, serif"
    font_sans: string;          // "InterTight, system-ui, sans-serif"
    font_mono: string;          // "JetBrains Mono, monospace"
    base_size: string;          // "16px"
  };
  radius: {
    xs: string;   // "4px"
    sm: string;   // "8px"
    md: string;   // "12px"
    lg: string;   // "16px"
    xl: string;   // "24px"
    pill: string; // "9999px"
  };
  shadows: {
    soft: string;           // "0 2px 20px rgba(0,0,0,0.3)"
    card: string;           // "0 4px 24px rgba(0,0,0,0.4)"
    glow_primary: string;   // "0 0 30px rgba(123,94,167,0.3)"
    glow_gold: string;      // "0 0 30px rgba(212,175,55,0.2)"
  };
  branding: {
    app_name: string;       // "GoldMoodAstro"
    tagline: string;        // "Ruhsal danışmanlık platformu"
    tagline_en: string;     // "Your spiritual guidance platform"
    logo_url: string;       // Cloudinary URL veya ""
    favicon_url: string;    // Cloudinary URL veya ""
    theme_color: string;    // "#7B5EA7" — PWA/meta theme-color
    og_image_url: string;   // Social share image
  };
}
```

#### CSS Variable Haritalaması

Token'lar frontend SSR'da `<style>` tag'ine enjekte edilir:

```css
:root {
  /* Brand */
  --gm-primary:         var(--_brand_primary, #7B5EA7);
  --gm-primary-dark:    var(--_brand_primary_dark, #5C4480);
  --gm-primary-light:   var(--_brand_primary_light, #9B7EC8);
  --gm-gold:            var(--_brand_secondary, #D4AF37);
  --gm-gold-dim:        var(--_brand_secondary_dim, #B8962E);
  --gm-gold-light:      var(--_brand_secondary_light, #F0CF6B);
  --gm-accent:          var(--_brand_accent, #5A4E87);
  /* Background */
  --gm-bg:              var(--_bg_base, #0D0B1E);
  --gm-bg-deep:         var(--_bg_deep, #1A1630);
  --gm-surface:         var(--_bg_surface, #241E3D);
  --gm-surface-high:    var(--_bg_surface_high, #2E2850);
  /* Text */
  --gm-text:            var(--_text_primary, #F0E6FF);
  --gm-text-dim:        var(--_text_secondary, #C9B8E8);
  --gm-muted:           var(--_text_muted, #7A6DA0);
  --gm-muted-soft:      var(--_text_muted_soft, #4D4570);
  /* Border */
  --gm-border:          var(--_border, rgba(201,184,232,0.14));
  --gm-border-soft:     var(--_border_soft, rgba(201,184,232,0.07));
  /* State */
  --gm-success:         var(--_success, #4CAF6E);
  --gm-warning:         var(--_warning, #F0A030);
  --gm-error:           var(--_error, #E55B4D);
  --gm-info:            var(--_info, #5B9BD5);
  /* Radius */
  --gm-radius-xs:       var(--_radius_xs, 4px);
  --gm-radius-sm:       var(--_radius_sm, 8px);
  --gm-radius-md:       var(--_radius_md, 12px);
  --gm-radius-lg:       var(--_radius_lg, 16px);
  --gm-radius-xl:       var(--_radius_xl, 24px);
  --gm-radius-pill:     var(--_radius_pill, 9999px);
  /* Shadows */
  --gm-shadow-soft:     var(--_shadow_soft, 0 2px 20px rgba(0,0,0,0.3));
  --gm-shadow-card:     var(--_shadow_card, 0 4px 24px rgba(0,0,0,0.4));
  --gm-shadow-glow:     var(--_shadow_glow_primary, 0 0 30px rgba(123,94,167,0.3));
  --gm-shadow-gold:     var(--_shadow_glow_gold, 0 0 30px rgba(212,175,55,0.2));
}
```

#### Veri Akışı

```
Backend DB (site_settings.design_tokens)
    ↓ GET /api/v1/site_settings/design_tokens  [public, revalidate 300s]
    ↓
Frontend SSR (server component: ThemeProvider.tsx)
    ↓ tokensToCSS(tokens) → CSS string
    ↓ <style dangerouslySetInnerHTML> → :root vars inject
    ↓
CSS Cascade → globals.css @theme referanslar → Tailwind utilities → Bileşenler
    
Admin Panel
    ↓ Token editörü (design-tokens-tab.tsx)
    ↓ PUT /api/v1/site_settings (key: design_tokens, value: JSON)
    ↓ → Backend cache invalidate → Frontend 5dk'da yenilenir
    
Mobile
    ↓ GET /api/v1/site_settings/design_tokens (opsiyonel, gelecek faz)
    ↓ Şu an: hardcoded tokens.ts (mobil yayında tutarlı kalır)
```

---

### T5-1 — Backend: Design Token Seed + Endpoint (Codex)

**Dosyalar:** `backend/src/db/sql/010_site_settings_seed.sql`

- [x] `010_site_settings_seed.sql`'ye `design_tokens` kaydı ekle — GoldMoodAstro default değerleri (yukarıdaki JSON şeması)
- [x] `site_settings` endpoint'i design_tokens için `public: true` erişimi doğrula
  - Mevcut `GET /site_settings/:key` — public erişim kontrolü yap
  - Gerekirse `GET /site_settings/design_tokens` route'una `preHandler: []` ekle (auth bypass)
- [x] `bun run db:seed:nodrop` ile test et — `design_tokens` key var mı doğrula

**Acceptance:** `curl http://localhost:8094/api/v1/site_settings/design_tokens` → 200 + JSON

---

### T5-2 — Frontend: ThemeProvider + Token Injection (Codex)

**Dosyalar:**
- `frontend/src/lib/tokens/types.ts` — DesignTokens interface
- `frontend/src/lib/tokens/defaults.ts` — GoldMoodAstro varsayılan token değerleri
- `frontend/src/lib/tokens/tokensToCSS.ts` — token → CSS variable string dönüştürücü
- `frontend/src/lib/tokens/fetchTokens.server.ts` — server-only fetch (revalidate 300s)
- `frontend/src/components/ThemeProvider.tsx` — server component, `<style>` inject

**ThemeProvider davranışı:**
```tsx
// Server component — SSR'da token çeker, CSS inject eder
export async function ThemeProvider({ children }: { children: React.ReactNode }) {
  const tokens = await fetchTokens(); // backend'den çek, hata → defaults
  const css = tokensToCSS(tokens);    // :root { --gm-primary: #7B... } string üret
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
```

- [x] `frontend/src/lib/tokens/types.ts` — DesignTokens interface (T5-0 şeması)
- [x] `frontend/src/lib/tokens/defaults.ts` — hardcoded fallback (midnight/amethyst/gold)
- [x] `frontend/src/lib/tokens/tokensToCSS.ts` — flat token → `:root { --gm-* }` string
- [x] `frontend/src/lib/tokens/fetchTokens.server.ts` — `fetch(..., { next: { revalidate: 300 } })`
- [x] `frontend/src/components/ThemeProvider.tsx` — server component
- [x] `frontend/src/app/[locale]/layout.tsx`'e ThemeProvider wrap et

**globals.css güncellemesi:**
- [x] `@theme` bloğunu `var(--gm-*)` referanslara çevir
  - `--color-brand-primary: var(--gm-primary)` şeklinde
  - Hardcoded renkler kalsın fallback olarak, ama `var()` ile override edilebilsin
- [x] `[data-theme="light"]` ve `[data-theme="dark"]` toggle korunacak

**Acceptance:** `bun run dev` başlat, `/tr` açıldığında `<head>`'de `<style>` tag'i görünür, `--gm-primary` var

---

### T5-3 — Frontend: GoldMoodAstro Sayfaları — Mevcut Cleanup (Codex)

Konigsmassage kalıntılarını temizle, GoldMoodAstro'ya uyarla:

**Silinecekler:**
- [x] `frontend/src/app/[locale]/gutschein/` — sil (hediye çeki, masaj'a özgü)
- [x] `frontend/src/components/containers/gutschein/` — sil
- [x] `frontend/src/app/[locale]/services/` — sil (yeni `/consultants` sayfası alır)
- [x] `frontend/src/components/containers/services/` — sil
- [x] `frontend/src/app/[locale]/appointment/` — sil (yeni `/booking` alır)
- [x] `frontend/src/components/containers/appointment/` — sil

**Redirect ekle** (`next.config.js`):
```js
{ source: '/[locale]/gutschein', destination: '/[locale]', permanent: true },
{ source: '/[locale]/services', destination: '/[locale]/consultants', permanent: true },
{ source: '/[locale]/appointment', destination: '/[locale]/consultants', permanent: true },
```

**HomeIntroSection.tsx — GoldMoodAstro içeriği:**
- [x] 4-step masaj → 3-step danışmanlık:
  1. "Danışman seç" — uzmanlık ve puana göre filtrele
  2. "Randevu al" — müsait slotlardan tarih/saat seç, ödeme yap
  3. "Görüşmeyi başlat" — uygulama içi sesli görüşme, sonra değerlendir
- [x] Almanca metinleri kaldır, TR/EN ikili yapı koru

**ServiceSection.tsx → ExpertiseSection.tsx:**
- [x] Yeniden yaz: masaj kategorileri yerine expertise kategorileri
  - Astroloji, Tarot, Numeroloji, Mood Coaching, Kariyer, İlişki Danışmanlığı
  - Her kart: ikon + başlık + danışman sayısı (API'den)

**Acceptance:** `bun run build` sırasında sil gitmiş sayfalar 404 üretmiyor, redirectler çalışıyor

---

### T5-4 — Frontend: Consultant Sayfaları (Codex)

**API Entegrasyonu:**  
Tüm fetch'ler `src/integrations/rtk/` üzerinden geçer. Yeni endpoint'ler:
- `GET /consultants` → `consultants.public.endpoints.ts`
- `GET /consultants/:id` → aynı dosya
- `GET /consultants/:id/slots?date=YYYY-MM-DD` → aynı dosya

**Dosyalar:**

`src/integrations/rtk/public/consultants.public.endpoints.ts`:
- [x] `useListConsultantsQuery(filters)` / `useListConsultantsPublicQuery(filters)` — expertise, minPrice, maxPrice, minRating, limit, sort
- [x] `useGetConsultantQuery(id)` / `useGetConsultantPublicQuery(id)`
- [x] `useGetConsultantSlotsQuery({ id, date })` / `useGetConsultantSlotsPublicQuery({ id, date })`
- [x] `transformResponse` ile `{ data: T }` envelope unwrap

`src/components/containers/consultant/`:
- [x] `ConsultantCard.tsx` — avatar initials, rating stars, expertise chips, fiyat, CTA
- [x] `ConsultantList.tsx` — grid layout, loading skeleton, boş durum
- [x] `ConsultantFilters.tsx` — expertise pills, min price, min rating, max price
- [x] `ConsultantDetail.tsx` — bio, expertise chips, dil badges, istatistikler
- [x] `SlotCalendar.tsx` — 7 günlük scrollable hafta, prev/next
- [x] `SlotGrid.tsx` — time slot grid, dolu slotlar disabled
- [x] `SlotPicker.tsx` — SlotCalendar + SlotGrid kompozisyonu

`src/app/[locale]/consultants/`:
- [x] `page.tsx` — SSR metadata + ConsultantList, filtre query başlangıcı
- [x] `[id]/page.tsx` — SSR metadata + ConsultantDetail, sticky booking sidebar, "Randevu Al" → /booking?...

**URL → Checkout parametreleri:**
```
/booking?consultantId=X&resourceId=Y&slotId=Z&date=2026-05-01&time=14:00&price=850&duration=60&name=...
```

**Acceptance:** `/tr/consultants` açılır, danışman listesi backend'den gelir; `/tr/consultants/:id` slot seçimi çalışır

---

### T5-5 — Frontend: Auth Sayfaları (Codex)

Konigsmassage Login/Register mevcut. GoldMoodAstro API'ye bağla:

`src/integrations/rtk/public/auth.endpoints.ts`:
- [x] `useLoginMutation`, `useSignupMutation`, `useLogoutMutation`, `useOauthStartMutation` — mevcut
- [x] `access_token` field adı doğrulandı — backend ile uyumlu

`src/app/[locale]/register/`:
- [x] `Register.tsx` — `rules_accepted: true as const` payload'a eklendi

`src/app/[locale]/profile/`:
- [x] `ProfilePage.tsx` — mevcut ProfilePageContent bileşeni
- [x] `/profile/bookings/page.tsx` — sipariş listesi

**Acceptance:** Login → access_token alınır, localStorage'a yazılır, `/tr/profile` korumalı

---

### T5-6 — Frontend: Randevu & Ödeme (Codex)

**Booking Checkout:**

`src/app/[locale]/booking/`:
- [x] `page.tsx` — URL params'tan `consultantId, resourceId, slotId, date, time, price, duration, name` okur
- [x] "Ödemeye Geç" butonu → createBooking → createForBooking → initIyzico → checkout_url redirect

**Booking Payment Callback:**

`src/app/[locale]/booking/payment/`:
- [x] `page.tsx` — `?status=success|failure` query params işle
- [x] `status === 'success'` → onay mesajı + `/profile/bookings` linki
- [x] `status === 'failure'` → hata mesajı + "Tekrar Dene" butonu

**Kullanıcı Randevularım:**

`src/app/[locale]/profile/bookings/`:
- [x] `page.tsx` — `useListMyOrdersQuery` ile sipariş listesi, ödenmemiş için "Öde" CTA

**Acceptance:** Checkout → Iyzipay yönlendirmesi çalışır; callback sayfası `?status=success` için doğru davranır

---

### T5-7 — Frontend: Anasayfa Kompozisyonu (Codex)

`src/app/[locale]/page.tsx` (mevcut konig homepage → goldmoodastro):

**Bileşenler:**
- [x] `Hero.tsx` — GoldMoodAstro fallback metinleri, `/consultants` CTA
- [x] `ExpertiseCategoriesSection.tsx` — 6 kategori, Lucide iconlar, canlı danışman sayısı
- [x] `FeaturedConsultantsSection.tsx` — `GET /consultants?limit=6&sort=rating`
- [x] `HomeIntroSection.tsx` — 3-adım GoldMoodAstro "how it works"
- [x] `Feedback.tsx` (mevcut) — değerlendirmeler
- [x] `HomeCTABanner.tsx` — "Danışman Bul" CTA
- [x] `BlogHomeSection.tsx` (mevcut) — blog önizleme

**Acceptance:** `/tr` açılır, tüm bölümler backend'den veri alır; fallback content boş olmaz

---

### T5-8 — Admin Panel: Design Token Editörü (Codex)

`admin_panel/src/app/(main)/admin/(admin)/site-settings/tabs/design-tokens-tab.tsx`:

**Form alanları (RTK mutation ile kaydet):**
- [x] **Renk Grubu** — 10 renk: brand_primary, brand_secondary, bg, surface, text, text_muted, border, error, success + dark
- [x] **Typography Grubu** — font_heading, font_body text input'lar
- [x] **Radius Grubu** — sm, md, lg text input'lar
- [x] **Branding Grubu** — app_name, tagline_tr, tagline_en
- [x] **Canlı Önizleme** — PreviewCard bileşeni, token değişince anlık güncellenir
- [x] **Kaydet** → `useUpdateSiteSettingAdminMutation` (key: `design_tokens`, locale: `*`)

**Tab'a eklendi:**
- [x] `tabs/design-tokens-tab.tsx` oluşturuldu, `tabs/index.ts`'e eklendi
- [x] `admin-site_settings-client.tsx`'e TabsTrigger + TabsContent eklendi

**Acceptance:** Token editöründe renk değiştir → kaydet → frontend `/tr` sayfasını yenile → renk değişmiş görünür (max 5dk delay)

---

### T5-9 — Frontend: Blog, Hakkında, İletişim Sayfaları (Codex)

Konigsmassage'den gelen bu sayfalar generic CMS tabanlı — minimal uyarlama:

- [x] `blog/page.tsx` — mevcut RTK endpoint, temiz
- [x] `blog/[slug]/page.tsx` — mevcut, temiz
- [x] `about/page.tsx` — GoldMoodAstro fallback metinleri güncellendi
- [x] `contact/page.tsx` — GoldMoodAstro fallback metinleri güncellendi
- [x] `faqs/page.tsx` — temiz
- [x] Footer fallback metinleri güncellendi (astroloji platformu)
- [x] `app/layout.tsx` — title, description, themeColor, default locale 'tr' olarak güncellendi
- [x] `routes.ts` — Almanca/masaj path'ler temizlendi, GoldMoodAstro route'ları eklendi

**Acceptance:** Tüm sayfalar `bun run build` geçer

---

### T5-10 — Frontend: SEO & PWA (Codex)

- [x] `src/app/manifest.ts` — name: GoldMoodAstro, theme_color: #7B5EA7, start_url: /tr
- [x] `robots.ts` — goldmoodastro.com, AI bot izinleri (GPTBot, ClaudeBot, Perplexity)
- [x] `sitemap.ts` — /consultants eklendi, /services / /appointment silindi
- [x] `next.config.js` — goldmoodastro.com remotePatterns mevcut, redirectler eklendi
- [x] `app/layout.tsx` — viewport themeColor #7B5EA7, title/description GoldMoodAstro

**Acceptance:** `next build` → Lighthouse'da manifest + meta tags geçer

---

### T5-11 — Frontend: CI/CD + PM2 (Codex)

- [x] `.github/workflows/main.yml`'e `deploy-frontend` job eklendi — rsync + pm2 reload + port 3095 check
- [x] `frontend/ecosystem.config.cjs` — `goldmoodastro-frontend`, port 3095 — mevcut, doğrulandı
- [x] `nginx/goldmoodastro.conf` — `location /` → port 3095 proxy eklendi, `/_next/static/` ayrı cache blok

---

### T5-12 — Antigravity UI Doğrulama (Antigravity) ← FAZ 5 SONUNDA

> Codex smoke (2026-04-25): `frontend/tests/t5-public-smoke.spec.ts` eklendi; public route render, consultant filter/slot yüzeyi, admin design token tab ve 768px/375px responsive smoke Chromium ile geçti. Antigravity görsel/mobil manuel onayı ayrıca kalır.

- [ ] `/tr` anasayfa — tüm bölümler render oluyor
- [ ] `/tr/consultants` — liste filtre çalışıyor
- [ ] `/tr/consultants/:id` — slot seçimi interaktif
- [ ] `/tr/booking` — checkout form doğru
- [ ] `/tr/login`, `/tr/register` — form validasyon
- [ ] `/tr/profile/bookings` — randevu listesi
- [ ] Admin `design-tokens-tab` — renk editörü render oluyor
- [ ] Mobile responsiveness (768px, 375px)

---

## DB Şema Özeti

```
users              ← Tüm roller (user/consultant/admin) + fcm_token
consultants        ← Danışman profili, uzmanlık, fiyat, onay
voice_sessions     ← Agora kanal + token + süre
bookings           ← Randevular (consultant_id FK)
availability       ← Danışman müsaitlik saatleri
resource_slots     ← Slot'lar (slotReservations ile rezerve)
orders             ← Iyzipay ödeme kayıtları
payments           ← Ödeme işlemleri
wallet             ← Danışman kazanç ledger'ı
chat_rooms         ← Mesajlaşma odaları
chat_messages      ← Mesajlar
notifications      ← In-app bildirimler
reviews            ← Danışman değerlendirmeleri (consultant_id FK)
support_tickets    ← Destek talepleri
announcements      ← Sistem duyuruları
site_settings      ← Dinamik config + design_tokens
```

---

## Günlük Demo Planı (Güncellendi)

| Gün | Demo İçeriği |
|-----|-------------|
| 7   | Backend API + Swagger çalışıyor, danışman akışı |
| 14  | Admin panel tamamlandı, ödeme akışı |
| 21  | Mobile app çalışıyor, sesli görüşme test |
| 28  | Frontend web — danışman listesi + randevu akışı |
| 32  | Design token sistemi live, admin'den tema düzenlenebilir |
| 35  | Full production deploy + teslim |

---

## Codex için FAZ 5 Görev Sırası

```
T5-1 → T5-2 → T5-3 → T5-4 → T5-5 → T5-6 → T5-7 → T5-8 → T5-9 → T5-10 → T5-11
```

Her görev öncesi: `AGENTS.md`'deki T5-* bölümünü oku.  
Her görev sonrası: `doc/mvp-checklist.md`'yi güncelle.

## Antigravity için FAZ 5 Görevi

T5-11 tamamlandıktan sonra T5-12 listesini çalıştır.  
Screenshot'lar: `docs/screenshots/frontend/` altına kaydet.
