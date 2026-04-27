# GoldMoodAstro — MVP Çalışma Planı & Checklist

**Bütçe:** 30.000 TL | **Süre:** 30 gün → +10 gün (frontend fazı eklendi)  
**Başlangıç:** 2026-04-24

## Görev Dağılımı

| Kim | Ne Yapar |
|-----|---------|
| **Claude Code** | Mimari, DB şema, API kontratları, token sistemi, kod review, FAZ planlama |
| **Codex** *(token tasarrufu)* | Backend SQL schema, shared-backend modül logic, webhook handler, cron, seed |
| **Antigravity** | UI implementasyon (web sayfaları, mobile ekranlar, admin form'lar), görsel doğrulama, e2e |
| **Copilot** | Autocomplete, boilerplate, RN/Expo tamamlama |

> **2026-04-27 orchestrasyon revize:** Codex'in token bütçesi azaldı. UI ağırlıklı görevler
> (FAZ 15 web tema, FAZ 16 mobile ekranlar, banner/campaign admin sayfaları, FAZ 17 yorum UI)
> **Antigravity'e devredildi**. Codex sadece backend SQL + module logic'te kalır.

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

- [x] `/tr` anasayfa — tüm bölümler render oluyor
- [x] `/tr/consultants` — liste filtre çalışıyor
- [x] `/tr/consultants/:id` — slot seçimi interaktif
- [x] `/tr/booking` — checkout form doğru
- [x] `/tr/login`, `/tr/register` — form validasyon
- [x] `/tr/profile/bookings` — randevu listesi
- [x] Admin `design-tokens-tab` — renk editörü render oluyor
- [x] Mobile responsiveness (768px, 375px)

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

---

# FAZ 6+ — Vizyon Revizyonu (2026-04-27) 🆕

> Müşteri kararıyla projenin yönü güncellendi. Üç ana değişiklik:
> 1. **Agora → LiveKit** (audio + video tek SDK, vendor lock-in düşük)
> 2. **Yeni marka teması:** Gold (#C9A961) + Cream (#FAF6EF) + Ink (#2A2620) + Plum aksan (#3D2E47)
>    — eski Amethyst+Midnight palette tamamen değişiyor
> 3. **Yeni modüller:** doğum haritası, günlük yorum, abonelik, kredi, banner reklam, kampanya
> 4. **Hibrit AI+İnsan model:** AI ön-yorum + insan astrolog eskalasyonu
> 5. **Video görüşme altyapı** — şu an audio-only, FAZ 11'de video açılacak
>
> Referans dosyalar:
> - `doc/goldmoodastro-altyapi-raporu.md` — LiveKit kararı, mimari, faz planı
> - `doc/goldmoodastro-rakip-analizi.md` — Faladdin/MsAstro/Falsepeti/Advicemy şikayet analizi, F1-F12 differentiator listesi
> - `doc/globals.css` — yeni tema CSS tokens (cream/gold/ink)
> - `index.html`, `mobile-app.html` — UI tasarım önizlemeleri
> - `.secrets/credentials.env` — LIVEKIT_* keys (kullanıcı ekledi)

---

## FAZ 6 — Yeni Tema (Cream / Gold / Ink)

> Hedef: Backend design_tokens + frontend globals.css + admin panel editör + mobile theme
> tamamen yeni palete geçer. Eski Amethyst+Midnight palette artıkları temizlenir.

### T6-1 — Backend: Design Token Yeni Default Değerleri (Codex)

**Dosya:** `backend/src/db/sql/010_site_settings.sql`

- [x] `design_tokens` INSERT'inde `colors`, `typography`, `radius`, `shadows`, `branding`
      bloklarını yeni paletle güncelle:
  - `brand_primary: "#C9A961"` (warm editorial gold)
  - `brand_primary_dark: "#A8884A"`, `brand_primary_light: "#D4BB7A"`
  - `bg_base: "#FAF6EF"` (ivory base — light theme default)
  - `bg_deep: "#F2EBDD"`, `bg_surface: "#FFFFFF"`, `bg_surface_high: "#F7F1E4"`
  - `text_primary: "#2A2620"` (warm ink), `text_secondary: "#4A4238"`, `text_muted: "#8A8276"`
  - `accent_plum: "#3D2E47"` (mystical accent — yeni alan, types.ts'e ekle)
  - `font_display: "Cinzel"`, `font_serif: "Fraunces"`, `font_sans: "Manrope"`
  - Dark theme variant'ları (`#2A2620` bg, `#FAF6EF` text)
- [x] `bun run db:seed:nodrop` ile test → `/api/v1/site_settings/design_tokens` 200 + yeni JSON
      ✅ 2026-04-27: VPS prod'da doğrulandı, version=2, 28 color key, brand_primary=#C9A961
- [x] Yeni alanlar için TypeScript interface'i güncelle: `frontend/src/lib/tokens/types.ts`,
      `mobile/app/src/theme/tokens.ts` (mobile T6-5'te)

**Acceptance:** `curl http://localhost:8094/api/v1/site_settings/design_tokens` JSON'unda
`brand_primary === "#C9A961"`, `accent_plum` alanı mevcut.

### T6-2 — Frontend: globals.css Migration (Codex) ✅

**Dosya:** `frontend/src/app/globals.css` ← `doc/globals.css`'i baz al

- [x] `doc/globals.css`'i `frontend/src/app/globals.css` olarak kopyala
- [x] `@theme` bloğunda `var(--gm-*)` referansları korunmuş, fallback'ler yeni paletle
- [x] Eski Amethyst-Midnight CSS class'larını grep'le: `bg-purple-*`, `text-purple-*`,
      `from-amethyst`, vs. — globals.css'te kalan yok (komponent'lerde T6-3'te)
- [x] `body { font-family: var(--font-serif) }` → Fraunces (editorial body)
- [x] `h1-h6 { font-family: var(--font-display) }` → Cinzel
- [x] Yeni utility class'lar: `.btn-premium`, `.btn-outline-premium`, `.section-label`
- [x] Animation class'lar: `.reveal`, `.hero-fade-up`, `.dot-pulse`, `.twinkle`, `.rotate-slow`
- [x] Light theme default — `[data-theme="dark"]` opsiyonel (drama section için)
- [x] Font yükleme: `app/[locale]/layout.tsx`'te `next/font` ile Cinzel + Fraunces + Manrope
- [x] `tokens/types.ts` + `tokens/defaults.ts` + `tokens/tokensToCSS.ts` yeni şemaya uyarlandı
      (font_serif eklendi, dark theme variantları opsiyonel CSS override)

**Acceptance:** `bun run dev` → `/tr` açıldığında body Fraunces, h1 Cinzel, primary gold (#C9A961)

### T6-3 — Frontend: Eski Amethyst Komponenti Cleanup (Codex) ✅

- [x] Tailwind class taraması temiz (`bg-purple-*`, `text-purple-*` yok)
- [x] Hex hardcoded: layout.tsx ve manifest.ts'te `#7B5EA7` ve `#0D0B1E` kalmıştı,
      yeni gold (#C9A961) ve cream (#FAF6EF) ile değiştirildi
- [~] `Card`, `Button`, `Badge` shared-ui — token tabanlı zaten, ek variant gerekmedi
- [~] Test sayfası `/tr/styleguide` — opsiyonel, FAZ 15 web tema implementasyonunda eklenecek

**Acceptance:** ✅ Hiç hardcoded `#7B5EA7` veya `#0D0B1E` yok (grep doğrulaması — layout/manifest düzeltildi).

### T6-4 — Admin Panel: Design Token Editör Yeni Şema (Codex) ✅

**Dosya:** `admin_panel/src/app/(main)/admin/(admin)/site-settings/tabs/design-tokens-tab.tsx`

- [x] Yeni renk grupları: gold spektrumu (50-900), sand spektrumu, plum, semantic light/dark
- [x] `brand_accent` (plum #3D2E47) alanı eklendi (Marka grubu içinde)
- [x] Typography: `font_display`, `font_serif`, `font_sans` — dropdown (Cinzel, Fraunces, Manrope, Inter, ...)
- [x] PreviewCard yeni paletle — section-label, btn-premium, btn-outline-premium örneği
- [x] Tüm yeni alanlar: 28 color, 5 typography, 6 radius, 4 shadow, 8 branding (theme_color_dark dahil)
- [x] DEFAULTS frontend/lib/tokens/defaults.ts ile 1:1 senkron

**Acceptance:** ⏳ Test (admin panel build + UI doğrulama) sonraki deploy'da.

### T6-5 — Mobile: Theme Tokens Güncelleme (Codex) ✅

**Dosya:** `mobile/app/src/theme/tokens.ts`, `mobile/app/package.json`

- [x] Tokens.ts → yeni gold/cream/ink palette (mobile default = dark)
- [x] `mobile-app.html`'deki phone-screen renklerine eşle (ink #2A2620, gold #C9A961, cream #FAF6EF)
- [x] Backward-compat alias'lar: midnight/stardust/amethyst eski isimleri yeni renklere mapped
      (10+ komponent kırılmadı, T16'da temizlenecek)
- [x] `lightColors`, `statusBar`, `gradients` export — gerektiğinde override
- [x] `branding` export (appName, tagline, themeColor)
- [x] Font yükleme paketleri: `@expo-google-fonts/cinzel` ve `/manrope` package.json'a eklendi
- [x] Status bar style ve linear gradient detayları token olarak eklendi

**Acceptance:** ⏳ Mobile build (EAS) sonrası UI doğrulama (T16).

---

## FAZ 7 — Agora → LiveKit Migration

> Hedef: voice_sessions modülünü tamamen LiveKit'e taşı. Audio şu an, video FAZ 11'de açılacak
> (aynı altyapı, sadece track ekleme).

### T7-1 — Backend: livekit-server-sdk Entegrasyonu (Codex) ✅

- [x] `backend/package.json` ve `packages/shared-backend/package.json` →
      `livekit-server-sdk` (latest) ekle, `agora-token` paketini kaldır
- [x] `.env.example` ve `backend/.env`:
  - Sil: `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
  - Ekle: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL=wss://...`
- [x] `.secrets/credentials.env` (master vault) — LIVEKIT_* eklendi
- [x] `./deploy/sync-env.sh` ile VPS'e yansıtıldı (2026-04-27, pm2 reload OK)

### T7-2 — Backend: live_sessions Modülü (Codex)

> `voice_sessions` tablosunu `live_sessions`'a rename et + alanlar genişlet.

**Migration SQL:** `backend/src/db/sql/070_live_sessions_schema.sql` (070 voice_sessions yerine)
- [x] Tablo: `live_sessions`
  - id (CHAR 36 UUID), booking_id, room_name, host_token, guest_token,
        media_type ENUM('audio','video') DEFAULT 'audio',
        started_at, ended_at, duration_seconds,
        recording_url (nullable), recording_started_at,
        status ENUM('pending','active','ended','timed_out','cancelled'),
        created_at, updated_at
  - INDEX (booking_id), INDEX (status)
- [x] Eski `voice_sessions` SQL ile uyumluluk: rename mi yoksa fresh mi?
      — repo henüz prod data'sı yok, fresh seed daha temiz.
- [x] Seed: 1 örnek live_session kaydı (status='ended') — mevcut seed'de tek booking var

**Modül:** `backend/src/modules/livekit/` (eski `agora/` yerine)
- [x] `router.ts`:
  - `POST /api/v1/livekit/token` — auth gerekli, body: `{ booking_id }`,
    response: `{ token, room, ws_url, expires_at }`
  - `POST /api/v1/livekit/webhooks` — LiveKit webhook (room_started, room_finished,
    participant_joined, participant_left)
  - Webhook authentication: LiveKit signing key
- [x] `controller.ts`: token üretimi, kanal isimlendirme `goldmood-{booking_id}`,
  identity = `{user_id}|{role}`, ttl = 1h, grants = roomJoin + canPublish + canSubscribe
- [x] Webhook handler: `room_finished` → `live_sessions.ended_at` doldur, kredi düşür,
      booking.status = 'completed' yap
      — booking completed tamam; kredi tüketimi T10-3'e bırakıldı.
- [x] `tests/livekit.test.ts` — token üretim doğrulaması, webhook signature

### T7-3 — Backend: Eski Agora Modülünü Sil (Codex) ✅

- [x] `backend/src/modules/agora/` → sil
- [x] `backend/src/routes/goldmood.ts` → registerAgora çağrısını `registerLiveKit` ile değiştir
- [x] `backend/src/db/sql/070_voice_sessions_schema.sql` → `070_live_sessions_schema.sql`
      adıyla yeniden yaz (data type değişikliği)

### T7-4 — Mobile: react-native-livekit Entegrasyonu (Codex) ✅

- [x] `mobile/app/package.json`:
  - Sil: `react-native-agora`
  - Ekle: `@livekit/react-native`, `@livekit/react-native-webrtc`, `livekit-client`
- [x] `app.json` → iOS/Android permissions kontrol et (mic, camera için zaten var)
- [x] `mobile/app/src/lib/livekit.ts` — token fetch helper (`POST /api/v1/livekit/token`)
- [x] `mobile/app/app/call/[bookingId].tsx` — LiveKit Room bileşeni:
  - useRoom hook, audio publish, participant gallery
  - Microphone toggle, hangup
  - Connection state UI (connecting/connected/reconnecting/disconnected)
  - Auto-disconnect timer (max session duration)
  — 2026-04-27: lightweight `livekit-client` Room wrapper kullanıldı; audio publish,
  mic toggle, hangup, connection state ve Expo Go fallback simülasyonu eklendi.
  Participant gallery/video UI FAZ 11 video açılışına bırakıldı.

### T7-5 — Frontend: Web Görüşme Sayfası (Opsiyonel — Codex) ✅

> Mobil-öncelikli ama web'den de katılım için:
- [x] `frontend/src/app/[locale]/booking/[id]/call/page.tsx` — `livekit-client` ile
      audio-only katılım. Sadece kullanıcı tarafı (astrolog mobile'dan).

### T7-6 — Admin Panel: LiveKit Ayarları (Codex) ✅

- [x] `admin_panel/src/app/.../site-settings/tabs/livekit-tab.tsx` — read-only:
  - LIVEKIT_URL, LIVEKIT_API_KEY (mask), webhook signing key durumu
  - Aktif oda sayısı (LiveKit API'den çek)
  — Backend `GET /api/v1/admin/livekit/status` eklendi; admin tab bu endpoint'ten
  masked key, webhook secret durumu ve aktif oda sayısını okuyor.

**Acceptance:** Test booking → mobil app'ten tokendetail al → LiveKit kanalına bağlan → ses
karşılıklı geçiyor → görüşme sonu webhook tetikleniyor → live_sessions.ended_at doldu →
booking.status='completed'.

---

## FAZ 8 — Astroloji Motoru & Doğum Haritası

> Hedef: Mobile/Web'de "Doğum Haritası" özelliği. Swiss Ephemeris bazlı saf astronomik
> hesaplama (gezegen pozisyonları, ev sistemleri, açılar).

### T8-1 — Backend: Astroloji Motoru (Codex) ✅

- [x] Paket seçimi: `swisseph-wasm` (Node-uyumlu, native build gerektirmiyor)
- [x] `packages/shared-backend/modules/astrology/` modülü:
  - `compute.ts` — natal chart hesabı (DOB, TOB, POB → planets, houses, aspects JSON)
  - `transit.ts` — günlük transit (kullanıcının haritasına bugünün gezegenleri)
  - `synastry.ts` — iki harita karşılaştırma (sinastri uyum)
  - Ephemeris dosyaları: paket içindeki `swisseph-wasm/wasm/*` kullanılıyor
  — 2026-04-27: Modül smoke test geçti (`sun=taurus`, `moon=capricorn`, aspects=14).

### T8-2 — Backend: birth_charts Tablosu + API (Codex) ✅

**SQL:** `backend/src/db/sql/035_birth_charts_schema.sql`
- [x] Tablo: `birth_charts`
  - id, user_id (FK), name (kullanıcı kendisi mi yoksa eşi/çocuğu mu),
    dob DATE, tob TIME, pob_lat DECIMAL(9,6), pob_lng DECIMAL(9,6),
    pob_label VARCHAR(255), tz_offset SMALLINT,
    chart_data JSON (computed natal chart),
    created_at, updated_at
  - UNIQUE INDEX (user_id, name)
- [x] Endpoints:
  - `POST /api/v1/birth-charts` — yeni harita oluştur (compute.ts ile JSON üret, kaydet)
  - `GET /api/v1/birth-charts` — kullanıcının haritaları (max 5 ücretsiz, abonelikle ek)
  - `GET /api/v1/birth-charts/:id` — tek harita
  - `DELETE /api/v1/birth-charts/:id`
- [x] `POST /api/v1/birth-charts/:id/transit` — bugünün transitleri (cache 1 saat)
- [x] `POST /api/v1/birth-charts/synastry` — iki chart_id karşılaştır
  — 2026-04-27: Backend `typecheck` geçti. Transit cache henüz DB seviyesinde değil; hesaplama canlı yapılıyor.

### T8-3 — Backend: Reverse Geocode (Codex) ✅

> Doğum yeri (POB) text input → lat/lng dönüşümü için.
- [x] Backend proxy endpoint: `GET /api/v1/geocode?q=Istanbul`
- [x] Servis: OpenStreetMap Nominatim (ücretsiz, rate-limited) veya
      Google Geocoding API (paid). Default: Nominatim.
- [x] Cache: redis yok → DB cache tablosu `geocode_cache` (q, lat, lng, label, ttl)
  — 2026-04-27: `geocode` modülü ve `036_geocode_cache_schema.sql` eklendi; backend `typecheck` geçti.

### T8.5 — Backend: IANA Timezone + nullable tob (Claude Code) ✅

> Astroloji motorunda DST-safe timezone handling + saat bilinmiyorsa noon fallback.
> Mevcut compute.ts'in 1985-2007 arası Türkiye DST geçişlerinde 1 saat hata yaptığı
> doğrulandı (test: 1993-03-14 — DST yokken offset=+180 sapma).

- [x] luxon paketi shared-backend/package.json'a eklendi
- [x] `astrology/types.ts`: BirthChartInput `tzIana?`, `tobKnown?`, `time?` opsiyonel
- [x] `astrology/compute.ts` parseDateTime: luxon DateTime.fromObject(iana) → DST-safe
      UTC çevirimi; `tobKnown=false` → 12:00 noon fallback
- [x] `birthCharts/validation.ts`: `tob` optional, `tob_known` boolean, `tz_iana` optional;
      refine: `tob_known=true` ise tob zorunlu
- [x] `birthCharts/repository.ts`: input → toAstrologyInput helper, DB'ye 12:00:00 fallback
- [x] Controller: ZodError → 400 (validation hatası net cevap)
- [x] **Backward-compat**: tz_offset legacy alan kalır, tz_iana yoksa kullanılır
- [x] Canlı test: 5 senaryo — IANA, no-tob, legacy, validation, invalid IANA — hepsi geçti

### T8-4 — Mobile: Birth Chart Ekranı (Codex) ✅

> `mobile-app.html` → SCREEN 3: BIRTH CHART tasarımı baz alınır.
- [x] `mobile/app/app/(tabs)/birth-chart.tsx`:
  - Natal Chart Wheel SVG (12 ev, dış burç ringi, gezegen sembolleri, açı çizgileri)
  - Gezegen yerleşimleri listesi (Sun in Aries, Moon in Cancer, vs.)
  - Onboarding ilk açılışta DOB/TOB/POB toplama formu
- [x] `react-native-svg` zaten yüklü, chart wheel için kullan
  — 2026-04-27: Mobile tab eklendi; `birthChartsApi` + `geocodeApi` bağlandı; `bun run --cwd mobile/app lint` geçti.

### T8-5 — Frontend: Doğum Haritası Sayfası (Codex) ✅

- [x] `frontend/src/app/[locale]/birth-chart/page.tsx`:
  - SEO: "Doğum Haritası Hesaplama — GoldMoodAstro"
  - Form: DOB picker, TOB picker, POB autocomplete (geocode)
  - "Hesapla" → SSR/CSR chart wheel SVG + yorumlar
- [x] Public erişim (kayıt gerekmeden) — email yakalama trick: "Yorumu görüntülemek için kayıt ol"
  — 2026-04-27: Public `POST /birth-charts/preview` eklendi; web form geocode + preview hesaplamaya bağlandı; `frontend typecheck` geçti.

**Acceptance:** Mobile'da DOB/TOB/POB gir → harita çiziliyor, gezegenler listede.
Web'de aynı form → SEO-friendly URL → hesaplanmış harita görünüyor.

---

## FAZ 9 — Günlük Yorum & AI İçerik Motoru (Anti-Copy-Paste)

> Hedef: Kullanıcıya günlük yorum üret. Aynı kullanıcıya 30 gün içinde benzer cümle
> dönmesin (rakip analizi F4 differentiator).

### T9-1 — Backend: AI Yorum Üretimi (Codex) ✅

- [x] Modül: `packages/shared-backend/modules/readings/`
- [x] LLM provider entegrasyonu: Anthropic Claude API veya OpenAI GPT
  - `.env`: `ANTHROPIC_API_KEY` veya `OPENAI_API_KEY`
- [x] `controller.ts`:
  - `generateDailyReading(userId, chartId)` — kullanıcının haritasını + bugünün transitlerini
    + son 30 gün okumalarını LLM'e ver, yeni yorum üret
- [x] `daily_readings` tablosu:
  - id, user_id, chart_id, reading_date, content TEXT, embedding JSON,
    transits_snapshot JSON, model_used VARCHAR
  - UNIQUE (user_id, reading_date)
  — 2026-04-27: OpenAI `fetch` provider + API key yoksa deterministic fallback eklendi; `095_daily_readings_schema.sql` yazıldı.

### T9-2 — Backend: Embedding & Anti-Copy-Paste Filtresi (Codex) ✅

- [x] OpenAI text-embedding-3-small veya Anthropic embeddings (eğer yoksa Voyage AI)
- [x] Yeni yorum üretimi sonrası: `embedding` üret, son 30 gün okumalarla
      cosine similarity hesapla
- [x] Threshold > 0.85 ise → tekrar üret (max 3 deneme)
- [x] Üretim sonrası safety classifier (zarar verici içerik filtresi):
  - "ölüm", "ağır hastalık", "ayrılık kesin", "ihanet" gibi temalarda LLM moderasyon
  - Rakip analizi F5 — "Bilgilendirici ama umut veren" tone guardrail
  — 2026-04-27: Embedding, cosine similarity, max-3 retry ve yerel safety guardrail eklendi; readings modülü izole typecheck + backend typecheck geçti.

### T9-3 — Mobile: Daily Reading Ekranı (Codex) ✅

- [x] `mobile/app/app/(tabs)/today.tsx` — `mobile-app.html` SCREEN 4 baz al
  - Hero card: "Bugünün Yorumu"
  - Transit özeti (gün, ay, yıl)
  - Detaylı yorum (LLM üretimi)
  - "Astrologa Sor" CTA → astrolog connect
  — 2026-04-27: `readingsApi.daily` ve Today tab eklendi; `mobile/app lint` geçti.

### T9-4 — Frontend: Günlük Yorum Sayfası (Codex) ✅

- [x] `frontend/src/app/[locale]/daily/page.tsx`:
  - Login gerekli
  - Kullanıcının default haritasını seç → bugünün yorumu
  — 2026-04-27: `readings.endpoints.ts` ve `/daily` sayfası eklendi; `frontend typecheck` geçti.

### T9-5 — Cron: Günlük Yorum Üretimi (Codex) ✅

- [x] `backend/src/cron/daily-readings.ts`:
  - Her gün 06:00 UTC: aktif aboneliği olan kullanıcılar için
    next-day reading üret (push notification ile uyandır)
  - Mevcut `booking-reminders.ts` paterni (setInterval ile 5dk poll)
  — 2026-04-27: 06:00 UTC poll cron eklendi ve `index.ts` içine kaydedildi; subscriptions tablosu varsa aktif/grace kullanıcıları, yoksa dev fallback olarak birth chart sahiplerini hedefler; backend typecheck geçti.

**Acceptance:** Mobile/web'de bugünün yorumu görünüyor, içerik geçen haftakiyle bambaşka,
zarar verici dil yok.

---

## FAZ 10 — Abonelik & Kredi Sistemi (Anti-Dark-Pattern)

> Hedef: Hibrit model — abonelik (AI özellikleri) + kredi (astrolog 1:1 görüşme).
> Anti-dark-pattern: 1-tıkla iptal, free trial kart bilgisi olmadan, şeffaf yenileme.

### T10-1 — Backend: subscriptions Tablosu + API (Claude Code) ✅

**SQL:** `backend/src/db/sql/065_subscriptions_schema.sql`
- [x] Tablo: `subscriptions`
  - id, user_id, plan_id (free/monthly/yearly), provider ENUM('iyzipay','apple_iap','google_iap'),
    provider_subscription_id VARCHAR, status ENUM('active','cancelled','expired','grace_period'),
    started_at, ends_at, cancelled_at, cancellation_reason VARCHAR,
    auto_renew BOOLEAN, price_minor INT, currency CHAR(3)
- [x] `subscription_plans` tablosu:
  - id, code, name_tr, name_en, price_minor, currency, period ENUM('monthly','yearly'),
    features JSON, is_active
  - Seed: free, monthly (₺149), yearly (₺1.499 — 16% indirim)

**Endpoints:**
- [x] `GET /api/v1/subscriptions/plans` — public, plans listesi
- [x] `GET /api/v1/subscriptions/me` — auth, kullanıcının aktif aboneliği
- [x] `POST /api/v1/subscriptions/start` — Iyzipay subscription form üret
- [x] `POST /api/v1/subscriptions/cancel` — **1-tıkla iptal**, no friction, body opsiyonel
      `{ reason?: string }`. status='cancelled', auto_renew=false. Mevcut süre dolana kadar
      kullanım devam eder (grace period).
- [x] `POST /api/v1/subscriptions/webhook` — Iyzipay subscription webhook handler

### T10-2 — Backend: credits Tablosu + API (Claude Code) ✅

**SQL:** `backend/src/db/sql/082_credits_schema.sql`
- [x] Tablo: `user_credits`
  - id, user_id, balance INT, currency CHAR(3) DEFAULT 'TRY-CREDIT',
    updated_at
  - 1 row per user (UNIQUE user_id)
- [x] Tablo: `credit_transactions`
  - id, user_id, type ENUM('purchase','consumption','refund','bonus'),
    amount INT (negatif=tüketim), balance_after INT,
    reference_type VARCHAR (booking, package, manual),
    reference_id, description, created_at
- [x] Tablo: `credit_packages`
  - id, code, name_tr, price_minor, credits INT, bonus_credits INT, is_active
  - Seed: 200₺/2.000kr, 500₺/5.000kr+250bonus, 950₺/10.000kr+1.000bonus (Falsepeti modeli)
- [x] Endpoints:
  - `GET /api/v1/credits/me` — bakiye + son 20 işlem
  - `GET /api/v1/credits/packages`
  - `POST /api/v1/credits/purchase` — Iyzipay one-time + add credit on webhook

### T10-3 — Backend: Görüşme → Kredi Tüketimi (Claude Code+Codex) ✅

- [x] LiveKit webhook `room_finished` → `live_sessions.duration_seconds` hesapla
- [x] consultant fiyat × dakika → kredi düş (`credit_transactions` 'consumption' kaydı)
- [x] Yetersiz kredi durumu (görüşme sonrası): booking durumu `timed_out` + FCM + in-app uyarı
- [x] 5 dakika öncesi frontend’e push (özelleştirilmiş arayüz/etiketleme)

### T10-4 — Mobile: Subscription / Credits Ekranı (Codex)

> `mobile-app.html` SCREEN 6: PROFILE / SUB tasarımı.

- [x] `mobile/app/app/(tabs)/profile.tsx`:
  - **Anti-dark-pattern subscription card** — her zaman görünür, "Aboneliği Yönet" butonu
  - "İptal et" tek tıkla, geri çevirme ekranı yok (şeffaf)
  - Kredi bakiyesi kartı, "Kredi Yükle" CTA
- [x] `mobile/app/app/profile/subscription.tsx` — abonelik detay
- [x] `mobile/app/app/profile/credits.tsx` — kredi geçmişi + paket alış

### T10-5 — Frontend: Pricing Sayfası (Codex)

- [x] `frontend/src/app/[locale]/pricing/page.tsx`:
  - 3 plan kartı (free, monthly, yearly), karşılaştırma tablosu
  - **Şeffaf footer:** "İptal etmek üye olmaktan kolay", "İade politikası", "KVKK"
- [x] Pricing copy `index.html` (transparency section) baz alınır

### T10-6 — Mobile: Apple/Google IAP Entegrasyonu (Codex)

- [x] `expo-in-app-purchases` veya `react-native-iap` kur
- [x] iOS App Store Connect'te subscription products tanımla
      (`com.goldmoodastro.app.monthly`, `.yearly`)
- [x] Android Play Console'da subscription products
- [x] `mobile/app/src/lib/iap.ts` — purchase flow + receipt verification (backend)
- [x] Backend: `POST /api/v1/subscriptions/verify-receipt` — Apple/Google receipt validation

### T10-7 — Admin: Subscription Yönetimi (Codex)

- [x] `admin_panel/.../subscriptions/` — liste, durum filtresi, refund işlemi
- [x] `admin_panel/.../subscription-plans/` — plan CRUD (Codex)

**Acceptance:** Mobile'dan abone ol → Iyzipay/IAP üzerinden öde → ay sonu yenilenir →
profile ekranından "İptal" tıklayınca tek tıkla iptal → grace period sonu erişim kapanır.

---

## FAZ 11 — Video Görüşme Açma (Hazırlık → Aktivasyon)

> Şu an audio-only. LiveKit zaten video destekliyor; sadece track ekleme + UI işi.
> Müşteri kararıyla ileride aç.

### T11-1 — Backend: media_type Toggle + feature flag (Claude Code) ✅

- [x] `live_sessions.media_type ENUM('audio','video')` zaten T7-2'de var
- [x] `consultants` tablosuna `supports_video BOOLEAN DEFAULT 0` ekle
- [x] Pricing differentiation: video premium (örn. ₺350/15dk vs ₺250/15dk audio)
- [x] Site-settings flag: `feature_video_enabled` (admin'den toggle)

### T11-2 — Mobile: Video UI (Codex)

- [x] Call screen'e video preview/feed component ekle (zaten LiveKit Room bileşeni var)
- [x] Track publish: `LocalParticipant.setCameraEnabled(true)`
- [x] Camera switch (front/back), mute toggle, video toggle

### T11-3 — Frontend: Video Premium Pricing (Codex)

- [x] Pricing sayfasında "Sesli vs Görüntülü" karşılaştırma kartı

### T11-4 — Self-Host LiveKit (Faz 3 — İleride)

- [ ] Hetzner Frankfurt'ta self-host LiveKit kurulumu (audio-video bant genişliği maliyeti)
- [ ] Trafik kademeli geçiş (DNS, env_var)

**Bu faz şu an dondurulmuş, FAZ 6-10 tamam olunca açılır.**

---

## FAZ 12 — Banner Reklam Yönetimi 🆕

> Müşteri kararıyla yeni modül. Admin panelden banner yönetimi, frontend/mobile'da gösterim.

### T12-1 — Backend: banners Modülü (Claude Code) ✅

**SQL:** `backend/src/db/sql/160_banners_schema.sql`
- [ ] Tablo: `banners`
  - id, code, title_tr, title_en, subtitle_tr, subtitle_en,
    image_url, image_url_mobile, link_url,
    placement ENUM('home_hero','home_sidebar','home_footer','consultant_list',
                   'mobile_welcome','mobile_home','mobile_call_end'),
    locale CHAR(2) | '*',
    starts_at DATETIME, ends_at DATETIME,
    target_segment VARCHAR (free|paid|all),
    priority INT DEFAULT 0,
    is_active BOOLEAN,
    click_count INT DEFAULT 0, view_count INT DEFAULT 0,
    created_at, updated_at
  - INDEX (placement, is_active, starts_at, ends_at)
- [ ] Endpoints:
  - `GET /api/v1/banners?placement=home_hero&locale=tr` — public, aktif + tarihinde olanlar
  - `POST /api/v1/banners/:id/click` — view/click counter
  - `GET /api/v1/admin/banners` — admin liste
  - `POST/PUT/DELETE /api/v1/admin/banners/:id` — CRUD
- [ ] Image upload: storage/cloudinary entegrasyonu (mevcut storage modülü)

### T12-2 — Admin: Banner CRUD Sayfası (Antigravity)

- [ ] `admin_panel/src/app/.../banners/`:
  - Liste: thumbnail, placement, locale, schedule, durum
  - Form: image upload (mobile + desktop ayrı), tarih aralığı, target segment
  - Önizleme: placement'a göre gerçek görünüm

### T12-3 — Frontend: Banner Slot'ları (Antigravity)

- [ ] `frontend/src/components/banner/Banner.tsx` — placement prop
- [ ] Anasayfa hero altı, consultant listesinde sidebar, blog footer
- [ ] Click tracking → `POST /banners/:id/click`

### T12-4 — Mobile: Banner Slider (Antigravity)

- [ ] `mobile/app/src/components/Banner.tsx` — placement prop
- [ ] Welcome screen üstü, home screen üstü, call-end screen
- [ ] Auto-rotate (3 banner varsa 5sn'de geç)

**Acceptance:** Admin'den banner ekle → frontend/mobile'da görünür → tıklayınca link açılır
+ click_count artar.

---

## FAZ 13 — Kampanya Yönetimi 🆕

> Banner ile bağlantılı ama daha geniş: indirim kuponları, promo kodlar, hedefli kampanyalar.

### T13-1 — Backend: campaigns Modülü (Codex)

**SQL:** `backend/src/db/sql/170_campaigns_schema.sql`
- [ ] Tablo: `campaigns`
  - id, code (uppercase, unique), name_tr, name_en, description_tr, description_en,
    type ENUM('discount_percentage','discount_fixed','bonus_credits','free_trial_days'),
    value DECIMAL(10,2), max_uses INT, used_count INT,
    starts_at, ends_at,
    target_audience JSON (rules: new_user, has_subscription, etc.),
    applies_to ENUM('subscription','credit_package','consultant_booking','all'),
    is_active, created_at, updated_at
- [ ] Tablo: `campaign_redemptions`
  - id, campaign_id, user_id, order_id (nullable), redeemed_at, value_applied
- [ ] Endpoints:
  - `POST /api/v1/campaigns/redeem` — kupon kodu kullan (auth + apply rules)
  - `GET /api/v1/campaigns/active` — public, kullanıcının uygun kampanyaları (banner ile cross)
  - `GET/POST/PUT/DELETE /api/v1/admin/campaigns` — CRUD

### T13-2 — Admin: Campaign CRUD (Antigravity)

- [ ] `admin_panel/.../campaigns/`:
  - Liste, kod arama, kullanım istatistiği
  - Form: tip, değer, tarih, target audience JSON editor
  - Banner ile cross-link (kampanya banner placement)

### T13-3 — Frontend/Mobile: Promo Code Input (Antigravity)

- [ ] Pricing sayfasında "Kupon kodun var mı?" — input → apply → indirim göster
- [ ] Booking checkout'ta da aynı input
- [ ] Mobile: profile → "Kuponlarım" — kullanılan ve geçerli olanlar

**Acceptance:** Admin yeni kampanya yarat (kod: `WELCOME20`, %20 indirim) → kullanıcı
checkout'ta kodu gir → indirim uygulansın → `campaign_redemptions` kayıt oluştu.

---

## FAZ 14 — Hibrit Model: AI Ön-Yorum + İnsan Astrolog Eskalasyon

> Rakip analizi F7. AI yorum altına: "Bu konuyu astrologa danış (15dk = X kredi)" CTA.

### T14-1 — Frontend/Mobile: Reading'in Altında Eskalasyon CTA (Antigravity)

- [ ] Daily reading sonrası "Astrologa Sor" CTA → `/consultants?topic=daily_reading_X`
- [ ] Mobile: same flow
- [ ] Backend: `daily_readings` ile booking arasında nedensellik kaydı (analytics)

### T14-2 — Mobile: Astrolog Connect Ekranı (Antigravity)

> `mobile-app.html` SCREEN 5 baz alınır.
- [ ] `mobile/app/app/(tabs)/connect.tsx`:
  - "Şu An Çevrimiçi" filter (consultants.is_online live)
  - Speciality filter, language filter, rating filter
  - Anlık görüşme isteği akışı (15dk SLA timer)

### T14-3 — Backend: 15dk SLA Timer + Otomatik İade (Claude Code) ✅

- [ ] Booking oluşurken cron timer: 15 dk içinde live_session başlamadıysa
      → booking.status='timed_out' → kredi iade
- [ ] Cron: `backend/src/cron/booking-sla.ts` (mevcut booking-reminders paterni)

**Acceptance:** Daily reading → "Astrologa Sor" → online astrolog seç → kredi düş +
booking oluştur → astrolog 15dk içinde katılmazsa otomatik iade.

---

## FAZ 15 — Web Frontend: Yeni Tema İmplementasyonu

> `index.html` baz alınarak Next.js sayfalarına dönüştürülecek.

### T15-1 — Hero Bölümü (Antigravity)

- [ ] `frontend/src/components/containers/home/HeroNew.tsx`:
  - GOLD MOOD logo (Cinzel display font, gold #C9A961)
  - Headline (italic em → gold)
  - Decorative orbits (rotate-slow animation), twinkle stars
  - CTA: "Bekleme Listesine Katıl" + "Daha Fazla Bilgi"
  - Scroll indicator (dot-pulse)

### T15-2 — Promises Bölümü (3 Söz) (Antigravity)

- [ ] `frontend/src/components/containers/home/PromisesSection.tsx`:
  - 3 promise kartı (numerated 01/02/03):
    1. "İptal etmek üye olmaktan kolay"
    2. "Her yorum size özel"
    3. "Telefon numaranız bizde yok"
  - Reveal animations (delay 1/2/3)

### T15-3 — Features Bölümü (Antigravity)

- [ ] `frontend/src/components/containers/home/FeaturesNew.tsx`:
  - 3 feature card: doğum haritası, günlük yorum, sinastri
  - "Soft optical size" italic emphasis (Fraunces SOFT 100)

### T15-4 — Hybrid Bölümü (AI + İnsan) (Antigravity)

- [ ] `frontend/src/components/containers/home/HybridSection.tsx`:
  - 2 kolonlu split: YAPAY ZEKA | İNSAN ASTROLOG
  - "Tamamlayıcı, alternatif değil" mesajı
  - Dark theme (drama section — `[data-theme="dark"]` wrapper)

### T15-5 — Transparency / Pricing Bölümü (Antigravity)

- [ ] `frontend/src/components/containers/home/TransparencySection.tsx`:
  - 3 sütunlu pricing tablosu (free / monthly / credit)
  - "Şeffaf — saklamıyoruz" çağrışımı
  - "İade var mı?" soru-cevap modülü

### T15-6 — Trust / KVKK Bölümü (Antigravity)

- [ ] `frontend/src/components/containers/home/TrustSection.tsx`:
  - 4 trust signal: KVKK, sildiğin silinir, telefon yok, kart bilgisi yok

### T15-7 — Waitlist / Newsletter Bölümü (Antigravity)

- [ ] `frontend/src/components/containers/home/WaitlistSection.tsx`:
  - Email input + "Bekleme Listesi"
  - Backend: `POST /api/v1/newsletter/subscribe` (mevcut newsletter modülü)

### T15-8 — Anasayfa Kompozisyonu (Antigravity)

- [ ] `frontend/src/app/[locale]/page.tsx` → yeni bileşenleri sırayla render et:
      Hero → Promises → Features → Hybrid → Transparency → Trust → Waitlist
- [ ] Eski Hero, FeaturedConsultantsSection, ExpertiseCategoriesSection, HomeIntroSection
      bileşenlerini referans olarak tut, "/explore" sayfasına taşı (consultants browse)

---

## FAZ 16 — Mobile: Yeni Ekranlar (Yeni Tema)

> `mobile-app.html` 6 ekran baz alınır.

### T16-1 — Welcome / Onboarding Screen (Antigravity)

- [ ] `mobile/app/app/(onboarding)/welcome.tsx`:
  - Decorative orbits + twinkle stars (RN reanimated)
  - Tagline (Cinzel italic)
  - "Başla" CTA → `/(onboarding)/birthdata` (DOB/TOB/POB form)

### T16-2 — Birthdata Form (Antigravity)

- [ ] `mobile/app/app/(onboarding)/birthdata.tsx`:
  - DateTimePicker (DOB + TOB)
  - POB autocomplete (geocode endpoint)
  - "Haritamı Hesapla" → `/api/v1/birth-charts` POST → `(tabs)/today`'a yönlendir

### T16-3 — Home / Today Screen (Antigravity)

- [ ] `mobile/app/app/(tabs)/today.tsx`:
  - "Günaydın, [İsim]" greeting (Cinzel)
  - Bugünün geçişleri (transit list)
  - Hızlı erişim grid (Birth Chart, Daily Reading, Astrolog, Profile)

### T16-4 — Birth Chart Screen (T8-4'te tanımlı)

### T16-5 — Daily Reading Screen (T9-3'te tanımlı)

### T16-6 — Astrolog Connect Screen (T14-2'de tanımlı)

### T16-7 — Profile / Subscription Screen (T10-4'te tanımlı)

### T16-8 — Tab Bar Navigasyon (Antigravity)

- [ ] `mobile/app/app/(tabs)/_layout.tsx`:
  - 5 tab: Today, Birth Chart, Connect, Daily, Profile
  - Custom icons (Lucide), gold active color, sand inactive

---

## FAZ 17 — Yorum & Puan Sistemi (Genişletme) 🆕

> Mevcut review modülü (backend + web UI + admin) ✅ var. Bu faz **rakip-üstün**
> konumlanma için eksikleri kapatır:
> - **F8** Doğrulanmış görüşme rozeti (sadece booking tamamlayan yazabilir)
> - **F10** Astrolog karnesi (eski yorum gerçekleşti mi takibi)
> - Astrolog cevap verme (admin_reply var, consultant_reply ekle)
> - Otomatik moderasyon (FAZ 9 LLM filtresi cross)
> - Mobile review yazma + listeleme (henüz yok)

### T17-1 — Backend: Doğrulanmış Görüşme Kontrolü (Claude Code) ✅

> Sadece booking'i tamamlamış (booking.status='completed' veya live_session.ended_at)
> kullanıcı review yazabilsin. Mevcut `reviews.booking_id` FK var, validasyon eksik.

**Dosya:** `packages/shared-backend/modules/review/controller.ts`

- [ ] `POST /reviews` validation: `booking_id` zorunlu (consultant target_type için),
      booking.user_id === current_user.id, booking.status='completed'
- [ ] `reviews.is_verified BOOLEAN` ekle (booking_id var ve completed ise true)
- [ ] Admin'den manuel review girişinde `is_verified=false` olabilir (eski yorumlar)
- [ ] Frontend rozetinde "✓ Doğrulanmış görüşme" badge'i

**Acceptance:** Booking yapmadan review POST atma → 403 forbidden. Booking tamamlandıktan
sonra review POST → 201 + is_verified=true.

### T17-2 — Backend: Astrolog Cevap Verme (Claude Code) ✅

> review_i18n.admin_reply var ama tek admin için. Consultant kendi review'ına cevap yazabilsin.

**Dosya:** `120_review_schema.sql` + `review/router.ts`

- [ ] Migration: `review_i18n.consultant_reply TEXT NULL`,
      `review_i18n.consultant_replied_at DATETIME NULL` ekle
- [ ] `PATCH /reviews/:id/consultant-reply` — auth: review.target_id === current_consultant.id
      (consultant kendi review'ına cevap)
- [ ] Frontend ReviewList: cevap varsa "Astrolog cevabı" alt bölümü göster

**Acceptance:** Consultant kendi review'ına PATCH consultant-reply atar, başkasının review'ına
402/403. Frontend cevabı listede görür.

### T17-3 — Backend: Otomatik Moderasyon Filtresi (Claude Code) ✅

> FAZ 9 (readings) LLM altyapısı tekrar kullanılır. Review POST'ta safety classifier.

- [ ] `POST /reviews` middleware: yorum metnini LLM'e ver, küfür/zarar verici/spam tespit
- [ ] Tespit edilen review → `is_approved=0` + admin notif kuyruğa
- [ ] Temiz review → otomatik `is_approved=1`
- [ ] Admin manuel override edilebilir

**Acceptance:** Spam yorum POST → is_approved=0 + admin'de "Beklemede" listesinde.

### T17-4 — Mobile: Review Yazma + Listeleme (Claude Code) ✅

> Mobile'da hiç review UI yok. Booking sonrası otomatik popup + consultant detay sayfasında liste.

- [ ] `mobile/app/src/components/ReviewForm.tsx` — yıldız picker, comment textarea
- [ ] `mobile/app/src/components/ReviewList.tsx` — yıldız özeti + comment kartları + cevap
- [ ] `mobile/app/app/booking/[id]/review.tsx` — booking tamamlandı sonrası modal/sayfa
- [ ] `mobile/app/app/consultant/[id].tsx` → consultant detayında ReviewList yerleşimi
- [ ] `mobile/app/src/lib/api.ts` reviewsApi (zaten var, helper'ları doğrula)

**Acceptance:** Mobile'dan booking tamamla → review modal aç → yıldız + yorum gönder →
backend kayıt + listede görünür.

### T17-5 — Web: ReviewList Genişletme (Claude Code) ✅

> Web ReviewList bileşeni var ama doğrulanmış rozeti, consultant cevabı, helpful counter eksik.

- [ ] `frontend/src/components/common/public/ReviewList.tsx`:
  - "✓ Doğrulanmış görüşme" badge (is_verified=true ise)
  - Consultant cevap bloğu (varsa, sağ alt expand)
  - "Yardımcı oldu" counter + tıklayınca `POST /reviews/:id/helpful` (mevcut helpful_count alanı)
  - Sıralama: helpful_count desc, sonra created_at desc
- [ ] `frontend/src/components/containers/consultant/ConsultantDetail.tsx` →
      sayfanın altında ReviewList yerleşimi (zaten var, kontrol)

### T17-6 — Backend: Astrolog Karnesi Hazırlığı (Claude Code) ✅

> F10 — eski yorumların gerçekleşip gerçekleşmediği takibi. MVP için sadece şema, UI Faz 6+ay'da.

**Dosya:** `backend/src/db/sql/125_review_outcomes_schema.sql` (yeni)

- [ ] Tablo: `review_outcomes`
  - id, review_id (FK), follow_up_at DATETIME (review + 6 ay),
    user_response ENUM('happened','partially','did_not_happen','no_answer'),
    user_response_at DATETIME, notes TEXT
  - INDEX (review_id), INDEX (follow_up_at, user_response)
- [ ] Cron `review-followup.ts`: her gün follow_up_at < now AND user_response IS NULL
      olan review'ları tara → kullanıcıya push: "6 ay önce X astrologdan yorum aldın,
      gerçekleşti mi?"
- [ ] `PATCH /reviews/:id/outcome` — kullanıcının cevabı

**Acceptance:** ⏳ Faz 6+ay (sadece şema + cron şu an).

### T17-7 — Admin: Moderasyon Dashboard (Antigravity)

> Mevcut /admin/reviews sayfası var. Genişletme:
- [ ] Filter: "Beklemede (auto-flagged)", "Onaylı", "Reddedildi", "Doğrulanmış", "Karne cevaplı"
- [ ] Toplu onay/red butonları
- [ ] LLM moderasyon raporu (T17-3 sonucu) görüntüleme

---

## Modül Bazlı Bakış — Eksik / Genişlenecek

| Modül | Mevcut | Eklenecek/Değişecek |
|-------|--------|---------------------|
| `auth` | ✅ | Telefon zorunlu değil opsiyonel; magic link akışı |
| `users` | ✅ | DOB/TOB/POB alanları (default chart için) |
| `consultants` | ✅ | `supports_video`, `is_online_now`, `languages[]`, `expertise_tags[]` |
| `bookings` | ✅ | `media_type`, `applied_campaign_id` FK, `sla_deadline` |
| `voice_sessions` | ✅ | → `live_sessions` rename + LiveKit alanları (T7-2) |
| `availability` | ✅ | — |
| `orders` / `payments` | ✅ | Iyzipay subscription + IAP receipt validation |
| `wallet` (consultant) | ✅ | — |
| `reviews` | ✅ | **FAZ 17:** is_verified flag (F8), consultant_reply, otomatik moderasyon, mobile UI, astrolog karnesi (F10) |
| `chat` | ✅ | — |
| `notifications` | ✅ | Daily reading push, SLA timeout push |
| `support` | ✅ | 24h SLA dashboard (rakip F2) |
| `announcements` | ✅ | — |
| `site_settings` | ✅ | Yeni token şeması (FAZ 6), feature flags (video_enabled) |
| `audit` | ✅ | — |
| `email_templates` | ✅ | Daily reading, abonelik yenileme/iptal şablonları |
| `storage` | ✅ | Banner image upload kanalı |
| **livekit** | ❌ → **YENİ** | T7-2 (eski agora yerine) |
| **astrology** | ❌ → **YENİ** | T8-1 (Swiss Ephemeris) |
| **birth_charts** | ❌ → **YENİ** | T8-2 |
| **readings** | ❌ → **YENİ** | T9-1 (LLM yorum üretimi + embedding) |
| **subscriptions** | ❌ → **YENİ** | T10-1 |
| **credits** | ❌ → **YENİ** | T10-2 |
| **banners** | ❌ → **YENİ** | T12-1 |
| **campaigns** | ❌ → **YENİ** | T13-1 |
| **geocode** | ❌ → **YENİ** | T8-3 |

---

## Yeni Bağımlılıklar

| Paket | Yer | Amaç |
|-------|-----|------|
| `livekit-server-sdk` | backend, shared-backend | Token üretimi, webhook handler |
| `@livekit/react-native`, `@livekit/react-native-webrtc`, `livekit-client` | mobile | RN client + media |
| `livekit-client` | frontend (opsiyonel) | Web tarafı katılım |
| `sweph` veya `swisseph-wasm` | shared-backend | Swiss Ephemeris (natal, transit, sinastri) |
| `@anthropic-ai/sdk` veya `openai` | shared-backend | Yorum üretimi |
| Embedding API (OpenAI/Voyage) | shared-backend | Anti-copy-paste similarity |
| `react-native-iap` veya `expo-in-app-purchases` | mobile | Apple/Google IAP |
| Iyzipay Subscription API | shared-backend | Türkiye web abonelik |

Silinecek:
- `agora-token` (backend), `react-native-agora` (mobile)

---

## Yeni Environment Değişkenleri

```
# LiveKit
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://goldmoodastro-j03iq312.livekit.cloud

# AI
ANTHROPIC_API_KEY=...      # veya OPENAI_API_KEY
EMBEDDING_PROVIDER=openai  # openai | voyage
EMBEDDING_API_KEY=...

# Geocoding
GEOCODE_PROVIDER=nominatim  # nominatim | google
GEOCODE_API_KEY=            # Nominatim için boş

# Subscription
IYZIPAY_SUBSCRIPTION_ENABLED=true

# Feature flags
FEATURE_VIDEO_CALL=false    # FAZ 11'de true
FEATURE_BIRTH_CHART=true
FEATURE_DAILY_READING=true
```

Silinecek:
- `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`

---

## Yeni Faz Sırası — Tavsiye

```
FAZ 6 (Tema)         → ✅ TAMAM (T6-1..T6-5)
FAZ 7 (LiveKit)      → blokerli değil, hemen başlayabilir [Codex backend, Antigravity UI]
   ↓
FAZ 8 (Doğum Hrt)    → bağımsız [Codex backend + astro motoru]
FAZ 9 (Daily Reading)→ FAZ 8'e bağımlı [Codex backend, LLM]
   ↓
FAZ 10 (Sub+Credit)  → bağımsız ama IAP test için EAS Build [Codex backend]
FAZ 12 (Banner)      → bağımsız, hızlı [Codex backend, Antigravity UI]
FAZ 13 (Kampanya)    → FAZ 10'a bağımlı [Codex backend, Antigravity UI]
   ↓
FAZ 14 (Hibrit)      → FAZ 9 + FAZ 7'ye bağımlı [Antigravity UI, Codex SLA cron]
FAZ 15 (Web Tema)    → FAZ 6'ya bağımlı [Antigravity tüm UI]
FAZ 16 (Mobile Tema) → FAZ 6 + FAZ 8 + FAZ 9'a bağımlı [Antigravity tüm UI]
FAZ 17 (Yorum/Puan)  → FAZ 7 + FAZ 9'a bağımlı [Codex backend, Antigravity UI]
   ↓
FAZ 11 (Video)       → en son, FAZ 7+10 stable olunca
```

---

## Önemli Mimari Kararlar (2026-04-27)

1. **Light theme default** — eski Midnight default'tan çıkıldı; cream/ivory base hâkim,
   dark theme dramatic section'lar için opsiyonel (`[data-theme="dark"]`).
2. **Astroloji motoru self-contained** — Swiss Ephemeris yerel, 3rd-party API bağımlılığı yok.
3. **AI yorumlar embed edilip saklanır** — anti-copy-paste için cosine similarity.
4. **Token üretimi backend'de** — LiveKit token server kullanılmaz (kontrol bizde).
5. **Abonelik mobil → IAP zorunlu** (Apple/Google policy), web → Iyzipay subscription.
6. **Banner + Kampanya ayrı modüller** — banner = görsel, kampanya = indirim/promo logic.
7. **Video şu an kapalı** — feature flag ile aktive edilebilir, altyapı zaten LiveKit'te hazır.

---

*FAZ 6+ vizyonu — sürekli güncellenecek.*

---

## FAZ 18 — KVKK / GDPR Uyumu (F9 Differentiator) ✅

> Rakip analizi F9: "Veri taşınabilirliği & gerçek hesap silme"
> "Sildiğin gerçekten silinir" — pazarlama düsturu.

### T18-1 — Backend: account_deletion_requests + KVKK endpoints (Claude Code) ✅

**SQL:** `200_account_deletion_requests_schema.sql`
- [x] Tablo: account_deletion_requests (user_id, scheduled_for, status: pending/cancelled/completed)
- [x] FK CASCADE on users delete

**Modül:** `packages/shared-backend/modules/kvkk/`

**Endpoints (auth, /me altında):**
- [x] `GET  /me/export` — Tüm verisini JSON olarak indir (Content-Disposition: attachment)
- [x] `GET  /me/delete-account` — Pending talebi gör
- [x] `POST /me/delete-account` — Talep yarat (7 gün cooling-off)
- [x] `DELETE /me/delete-account` — Pending talebi iptal

**Cron:** `backend/src/cron/account-deletion.ts`
- [x] 6 saatte bir scan: status='pending' AND scheduled_for <= NOW
- [x] User CASCADE delete (FK'ler tüm bağlı veriyi temizler)

### T18-2 — UI (Antigravity bekliyor)

- [x] `/profile/privacy` sayfası — "Verilerimi indir" + "Hesabı sil" akışı
- [x] Mobile "Tehlikeli Bölge" bölümü
