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
      Not: local release kontrolünde Iyzipay ve Anthropic artık dolu görünüyor.
      Firebase service account env'leri eksik; remote VPS doğrulaması için SSH key dosyası
      `/home/orhan/.ssh/goldmoodastro_root_ed25519` hâlâ yok.
- [ ] **T4-4** Iyzipay sandbox test (Manuel)
      `./deploy/check-iyzipay.sh` geçti; gerçek checkout/ödeme callback testi bekliyor.
- [ ] **T4-5** LiveKit test görüşmesi (Manuel)
      `./deploy/check-livekit.sh` geçti; gerçek iki cihaz / iki kullanıcı görüşme testi bekliyor.
- [ ] **T4-6** Firebase FCM test (Manuel)
      Backend/mobile wiring hazır; local Firebase service account env'leri boş ve iOS için
      `GoogleService-Info.plist` bekliyor.
- [ ] **T4-7** Expo EAS Build — iOS + Android (Manuel)
      `./deploy/check-mobile-build.sh` geçti; gerçek `bunx eas build` çalıştırması bekliyor.
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

---

## FAZ 12 — Banner Reklam Yönetimi 🆕

> Müşteri kararıyla yeni modül. Admin panelden banner yönetimi, frontend/mobile'da gösterim.

### T12-1 — Backend: banners Modülü (Claude Code) ✅

**SQL:** `backend/src/db/sql/160_banners_schema.sql`
- [x] Tablo: `banners`
  - id, code, title_tr/en, subtitle_tr/en, cta_label_tr/en,
    image_url, image_url_mobile, link_url,
    placement ENUM (home_hero, home_sidebar, home_footer, consultant_list,
                    home_mid_1/2/3, consultant_detail_top/bottom,
                    dashboard_top, blog_sidebar, blog_inline,
                    mobile_welcome, mobile_home, mobile_call_end, admin_dashboard),
    locale CHAR(8) | '*', starts_at, ends_at,
    target_segment ENUM (all, free, paid, new_user, existing_user),
    campaign_id (FK opsiyonel, FAZ 13 cross-link),
    priority, is_active, view_count, click_count
  - INDEX (placement, is_active, starts_at, ends_at) + locale + campaign
- [x] Endpoints (`packages/shared-backend/modules/banners/router.ts`):
  - `GET /api/v1/banners` — public, aktif + tarihinde olanlar
  - `POST /api/v1/banners/:id/click` — click counter
  - `GET/POST/PATCH/DELETE /api/v1/admin/banners` — CRUD (requireAuth + requireAdmin)
- [x] Image upload: AdminImageUploadField mevcut storage modülünü kullanır

### T12-2 — Admin: Banner CRUD Sayfası (Antigravity → Claude Code doğrulamış) ✅

- [x] `admin_panel/src/app/(main)/admin/(admin)/banners/`:
  - Liste: thumbnail, placement, locale, schedule, durum, view/click stats
  - Form (new + [id]/edit): image upload (mobile + desktop ayrı), tarih aralığı, target segment, placement, priority, locale
- [x] Sidebar entry: "marketing" group altında "Banners"

### T12-3 — Frontend: Banner Slot'ları (Antigravity)

- [x] `frontend/src/components/common/public/Banner.tsx` — placement prop
- [x] Anasayfa hero altı, consultant listesi, blog inline/footer slot
- [x] Click tracking → `POST /banners/:id/click`

### T12-4 — Mobile: Banner Slider (Antigravity)

- [x] `mobile/app/src/components/BannerWidget.tsx` + `BannerSlider.tsx` — placement prop
- [x] Welcome screen üstü, home screen üstü, call-end screen
- [x] Auto-rotate (3 banner varsa 5sn'de geç)

**Acceptance:** Admin'den banner ekle → frontend/mobile'da görünür → tıklayınca link açılır
+ click_count artar.

---

## FAZ 13 — Kampanya Yönetimi 🆕

> Banner ile bağlantılı ama daha geniş: indirim kuponları, promo kodlar, hedefli kampanyalar.

### T13-1 — Backend: campaigns Modülü (Codex → Claude Code doğrulamış) ✅

**SQL:** `backend/src/db/sql/170_campaigns_schema.sql`
- [x] Tablo: `campaigns` (code, name_tr/en, description_tr/en, type, value, max_uses,
      used_count, starts_at, ends_at, target_audience JSON, applies_to, is_active)
- [x] Tablo: `campaign_redemptions` (campaign_id, user_id, order_id, redeemed_at, value_applied)
- [x] Endpoints (`packages/shared-backend/modules/campaigns/router.ts`):
  - `POST /api/v1/campaigns/redeem` (requireAuth)
  - `GET /api/v1/campaigns/active` (public)
  - `GET/POST/PATCH/DELETE /api/v1/admin/campaigns` — CRUD (requireAuth + requireAdmin)

### T13-2 — Admin: Campaign CRUD (Antigravity → Claude Code doğrulamış) ✅

- [x] `admin_panel/src/app/(main)/admin/(admin)/campaigns/`:
  - Liste sayfası: kod, tip, değer, kullanım sayısı, durum
  - Form (new + [id]/edit): tip, değer, tarih, target audience, applies_to
  - RTK endpoints + hooks export
- [x] Sidebar entry: "marketing" group altında "Kampanyalar"
- [x] Cross-link UI: banner formuna campaign_id select (FAZ 12 + 13 birleşimi — opsiyonel)

### T13-3 — Frontend/Mobile: Promo Code Input (Antigravity)

- [x] Pricing sayfasında "Kupon kodun var mı?" — input → apply → indirim göster
- [x] Booking checkout'ta da aynı input
- [x] Mobile: profile → "Kuponlarım" — kullanılan ve geçerli olanlar
      — 2026-04-28: `GET /campaigns/me` eklendi; mobile profile aktif/kullanılmış
      kampanya özetini gösteriyor.

**Acceptance:** Admin yeni kampanya yarat (kod: `WELCOME20`, %20 indirim) → kullanıcı
checkout'ta kodu gir → indirim uygulansın → `campaign_redemptions` kayıt oluştu.

---

## FAZ 14 — Hibrit Model: AI Ön-Yorum + İnsan Astrolog Eskalasyon

> Rakip analizi F7. AI yorum altına: "Bu konuyu astrologa danış (15dk = X kredi)" CTA.

### T14-1 — Frontend/Mobile: Reading'in Altında Eskalasyon CTA (Antigravity)

- [x] Daily reading sonrası "Astrologa Sor" CTA → `/consultants?topic=daily_reading_X`
- [x] Mobile: same flow
- [x] Backend: `daily_readings` ile booking arasında nedensellik kaydı (analytics) — `bookings.source_type/source_id`

### T14-2 — Mobile: Astrolog Connect Ekranı (Antigravity)

> `mobile-app.html` SCREEN 5 baz alınır.
- [x] `mobile/app/app/(tabs)/connect.tsx`:
  - "Şu An Çevrimiçi" filter (consultants.is_available)
  - Speciality filter, language filter, rating filter
  - Daily reading topic param ile danışman → booking akışı

### T14-3 — Backend: 15dk SLA Timer + Otomatik İade (Claude Code) ✅

- [x] Booking oluşurken cron timer: 15 dk içinde live_session başlamadıysa
      → booking.status='timed_out' → kredi iade
- [x] Cron: `backend/src/cron/booking-sla.ts` (mevcut booking-reminders paterni)

**Acceptance:** Daily reading → "Astrologa Sor" → online astrolog seç → kredi düş +
booking oluştur → astrolog 15dk içinde katılmazsa otomatik iade.

---

## FAZ 15 — Web Frontend: Yeni Tema İmplementasyonu

> `index.html` baz alınarak Next.js sayfalarına dönüştürülecek.

### T15-1 — Hero Bölümü (Antigravity)

- [x] `frontend/src/components/containers/home/HeroNew.tsx`:
  - GOLD MOOD logo (Cinzel display font, gold #C9A961)
  - Headline (italic em → gold)
  - Decorative orbits (rotate-slow animation), twinkle stars
  - CTA: "Bekleme Listesine Katıl" + "Daha Fazla Bilgi"
  - Scroll indicator (dot-pulse)

### T15-2 — Promises Bölümü (3 Söz) (Antigravity)

- [x] `frontend/src/components/containers/home/PromisesSection.tsx`:
  - 3 promise kartı (numerated 01/02/03):
    1. "İptal etmek üye olmaktan kolay"
    2. "Her yorum size özel"
    3. "Telefon numaranız bizde yok"
  - Reveal animations (delay 1/2/3)

### T15-3 — Features Bölümü (Antigravity)

- [x] `frontend/src/components/containers/home/FeaturesNew.tsx`:
  - 3 feature card: doğum haritası, günlük yorum, sinastri
  - "Soft optical size" italic emphasis (Fraunces SOFT 100)

### T15-4 — Hybrid Bölümü (AI + İnsan) (Antigravity)

- [x] `frontend/src/components/containers/home/HybridModelSection.tsx`:
  - 2 kolonlu split: YAPAY ZEKA | İNSAN ASTROLOG
  - "Tamamlayıcı, alternatif değil" mesajı
  - Dark theme (drama section — `[data-theme="dark"]` wrapper)

### T15-5 — Transparency / Pricing Bölümü (Antigravity)

- [x] `frontend/src/components/containers/home/TransparencySection.tsx`:
  - 3 sütunlu pricing tablosu (free / monthly / credit)
  - "Şeffaf — saklamıyoruz" çağrışımı
  - "İade var mı?" soru-cevap modülü

### T15-6 — Trust / KVKK Bölümü (Antigravity)

- [x] `frontend/src/components/containers/home/TrustSection.tsx`:
  - 4 trust signal: KVKK, sildiğin silinir, telefon yok, kart bilgisi yok

### T15-7 — Waitlist / Newsletter Bölümü (Antigravity)

- [x] `frontend/src/components/containers/home/WaitlistSection.tsx`:
  - Email input + "Bekleme Listesi"
  - Backend: `POST /api/v1/newsletter/subscribe` (mevcut newsletter modülü)

### T15-8 — Anasayfa Kompozisyonu (Antigravity)

- [x] `frontend/src/app/[locale]/page.tsx` → yeni bileşenleri sırayla render et:
      Hero → Promises → Features → Hybrid → Transparency → Trust → Waitlist
- [x] Eski Hero, FeaturedConsultantsSection, ExpertiseCategoriesSection, HomeIntroSection
      bileşenlerini referans olarak tut, "/explore" sayfasına taşı (consultants browse)

---

## FAZ 16 — Mobile: Yeni Ekranlar (Yeni Tema)

> `mobile-app.html` 6 ekran baz alınır.

### T16-1 — Welcome / Onboarding Screen (Antigravity)

- [x] `mobile/app/app/onboarding/index.tsx`:
  - Decorative orbits + twinkle stars (RN reanimated)
  - Tagline (Cinzel italic)
  - "Başla" CTA → `/(onboarding)/birthdata` (DOB/TOB/POB form)

### T16-2 — Birthdata Form (Antigravity)

- [x] `mobile/app/app/onboarding/birthdata.tsx`:
  - DOB + TOB inputları
  - POB geocode endpoint çözümleme
  - "Haritamı Hesapla" → `/api/v1/birth-charts` POST → `(tabs)/today`'a yönlendir

### T16-3 — Home / Today Screen (Antigravity)

- [x] `mobile/app/app/(tabs)/today.tsx`:
  - "Günaydın, [İsim]" greeting (Cinzel)
  - Bugünün geçişleri (transit list)
  - Hızlı erişim grid (Birth Chart, Daily Reading, Astrolog, Profile)

### T16-4 — Birth Chart Screen (T8-4'te tanımlı)

### T16-5 — Daily Reading Screen (T9-3'te tanımlı)

### T16-6 — Astrolog Connect Screen (T14-2'de tanımlı)

### T16-7 — Profile / Subscription Screen (T10-4'te tanımlı)

### T16-8 — Tab Bar Navigasyon (Antigravity)

- [x] `mobile/app/app/(tabs)/_layout.tsx`:
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

- [x] `POST /reviews` validation: `booking_id` zorunlu (consultant target_type için),
      booking.user_id === current_user.id, booking.status='completed'
- [x] `reviews.is_verified BOOLEAN` ekle (booking_id var ve completed ise true)
- [x] Admin'den manuel review girişinde `is_verified=false` olabilir (eski yorumlar)
- [x] Frontend rozetinde "✓ Doğrulanmış görüşme" badge'i

**Acceptance:** Booking yapmadan review POST atma → 403 forbidden. Booking tamamlandıktan
sonra review POST → 201 + is_verified=true.

### T17-2 — Backend: Astrolog Cevap Verme (Claude Code) ✅

> review_i18n.admin_reply var ama tek admin için. Consultant kendi review'ına cevap yazabilsin.

**Dosya:** `120_review_schema.sql` + `review/router.ts`

- [x] Migration: `review_i18n.consultant_reply TEXT NULL`,
      `review_i18n.consultant_replied_at DATETIME NULL` ekle
- [x] `PATCH /reviews/:id/consultant-reply` — auth: review.target_id === current_consultant.id
      (consultant kendi review'ına cevap)
- [x] Frontend ReviewList: cevap varsa "Astrolog cevabı" alt bölümü göster

**Acceptance:** Consultant kendi review'ına PATCH consultant-reply atar, başkasının review'ına
402/403. Frontend cevabı listede görür.

### T17-3 — Backend: Otomatik Moderasyon Filtresi (Claude Code) ✅

> FAZ 9 (readings) LLM altyapısı tekrar kullanılır. Review POST'ta safety classifier.

- [x] `POST /reviews` middleware: yorum metnini LLM'e ver, küfür/zarar verici/spam tespit
- [x] Tespit edilen review → `is_approved=0` + admin notif kuyruğa
- [x] Temiz review → otomatik `is_approved=1`
- [x] Admin manuel override edilebilir

**Acceptance:** Spam yorum POST → is_approved=0 + admin'de "Beklemede" listesinde.

### T17-4 — Mobile: Review Yazma + Listeleme (Claude Code) ✅

> Mobile'da hiç review UI yok. Booking sonrası otomatik popup + consultant detay sayfasında liste.

- [x] `mobile/app/src/components/ReviewForm.tsx` — yıldız picker, comment textarea
- [x] `mobile/app/src/components/ReviewList.tsx` — yıldız özeti + comment kartları + cevap
- [x] `mobile/app/app/booking/[id]/review.tsx` — booking tamamlandı sonrası modal/sayfa (root `booking/review.tsx` redirect proxy)
- [x] `mobile/app/app/consultant/[id].tsx` → consultant detayında ReviewList yerleşimi
- [x] `mobile/app/src/lib/api.ts` reviewsApi (mevcut, doğrulandı)

**Acceptance:** Mobile'dan booking tamamla → review modal aç → yıldız + yorum gönder →
backend kayıt + listede görünür.

### T17-5 — Web: ReviewList Genişletme (Claude Code) ✅

> Web ReviewList bileşeni var ama doğrulanmış rozeti, consultant cevabı, helpful counter eksik.

- [x] `frontend/src/components/common/public/ReviewList.tsx`:
  - "✓ Doğrulanmış görüşme" badge (is_verified=true ise)
  - Consultant cevap bloğu (varsa, sağ alt expand)
  - "Yardımcı oldu" counter + tıklayınca `POST /reviews/:id/helpful` (mevcut helpful_count alanı)
  - Sıralama: helpful_count desc, sonra created_at desc
- [x] `frontend/src/components/containers/consultant/ConsultantDetail.tsx` →
      sayfanın altında ReviewList yerleşimi

### T17-6 — Backend: Astrolog Karnesi Hazırlığı (Claude Code) ✅

> F10 — eski yorumların gerçekleşip gerçekleşmediği takibi. MVP için sadece şema, UI Faz 6+ay'da.

**Dosya:** `backend/src/db/sql/125_review_outcomes_schema.sql`

- [x] Tablo: `review_outcomes`
  - id, review_id (FK), user_id (FK), consultant_id, follow_up_at DATETIME (review + 6 ay),
    user_response ENUM('happened','partially','did_not_happen','no_answer'),
    user_response_at DATETIME, notes TEXT, push_sent_at DATETIME
  - UNIQUE (review_id), INDEX (user_id), INDEX (consultant_id), INDEX (follow_up_at, user_response)
- [x] Cron `review-followup.ts`: her gün follow_up_at < now AND user_response IS NULL
      olan review'ları tara → kullanıcıya push: "6 ay önce X astrologdan yorum aldın,
      gerçekleşti mi?"
- [x] `PATCH /reviews/:id/outcome` — kullanıcının cevabı (reviewOutcomes/router.ts)
- [x] Bonus: `GET /consultants/:id/outcomes/score` (astrolog karnesi public skor)
- [x] Bonus: `GET /reviews/me/pending-outcomes` (auth — kullanıcının cevap bekleyen takip listesi)

**Acceptance:** ✅ Tamamlandı. UI Faz 6+ay'da.

### T17-7 — Admin: Moderasyon Dashboard (Claude Code) ✅

> Mevcut /admin/reviews sayfası genişletildi.
- [x] Filter: "Tümü / Bekleyen / Onaylı / Auto-Flagged / Doğrulanmış / Karne Cevaplı" (tek select)
- [x] Toplu onay/red butonları (checkbox + bulk action bar + `POST /admin/reviews/bulk-moderate`)
- [x] LLM moderasyon raporu görüntüleme (`reviews.moderation_flags TEXT` JSON kolonu eklendi,
      auto-flagged badge → Dialog ile flags + matched_patterns + onay butonu)
- [x] Backend filter param'ları: `verified`, `auto_flagged`, `has_outcome` (validation + repository)

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

---

## FAZ 19 — Hibrit İçerik Motoru (LLM + Astrolog KB) 🆕

> Stratejik temel: Faladdin "kopya yorum" ve Co-Star "halüsinasyon" tuzaklarına karşı
> **astrolog onaylı altın metinler + LLM kişiselleştirme** kombinasyonu (F4 differentiator).
> 5 sonraki özellik (FAZ 21-26) bu altyapı üzerinde çalışır.

### T19-1 — Faz 1: DB Schema (Claude Code) ✅

- [x] `096_llm_prompts_schema.sql` — admin'den düzenlenebilir prompt template'leri
  (key, locale, provider, model, temperature, max_tokens, system_prompt,
  user_template, safety_check, similarity_threshold, max_attempts)
- [x] `097_astrology_kb_schema.sql` — astrolog onaylı altın metinler
  (kind: planet_sign | planet_house | sign_house | aspect | sign | house | planet
  | transit | synastry | misc; key1/key2/key3, locale, title, content,
  short_summary, tone, embedding, source, author, reviewed_by/at)
- [x] Seed: 3 prompt template (natal_overview, daily_reading, natal_planet_sign)
- [x] Seed: 18 KB satırı (12 Güneş+burç + 5 açı + 1 ev — astrolog tamamlayacak)

### T19-2 — Faz 2: Backend Service (Claude Code) ✅

- [x] `packages/shared-backend/modules/llm/` paylaşılan modül:
  - [x] `provider.ts` — Anthropic + OpenAI dispatch (`chat({provider, model, system, user})`)
  - [x] `prompts.ts` — Mustache renderer + `generate({promptKey, vars, recentTexts})`
        orchestrator: DB'den prompt yükle → render → LLM → safety check → similarity reroll
  - [x] `kb.ts` — `fetchKbForChart({chart, locale})` chart'tan ilgili KB'leri çeker,
        `formatKbExcerpts()` LLM prompt için formatlar
  - [x] `schema.ts` — Drizzle table objects (llm_prompts + astrology_kb)
- [x] `backend/src/modules/birthCharts/readings.ts` — `generateNatalReading()`
- [x] Endpoint: `POST /api/v1/birth-charts/:id/reading` (auth gerektirir)
- [x] package.json export: `@goldmood/shared-backend/modules/llm`

### T19-3 — Faz 3: Admin Panel (Claude Code + Antigravity) ✅

- [x] `/admin/llm-prompts` — list + edit:
  - System prompt + user template büyük textarea (Mustache placeholder helper)
  - Provider/model dropdown (anthropic/openai/azure/local — backend ENUM ile uyumlu), temperature slider, max_tokens
  - Safety check toggle, similarity threshold, max_attempts
  - "Test Et" butonu — vars JSON → `POST /admin/llm-prompts/:id/test` → output + safety_flags + max_similarity
  - History/audit log → ⏳ updated_at ile minimum (audit dashboard için ileride)
- [x] `/admin/astrology-kb` — list + filter (kind, key1, locale, is_active) + create/edit dialog:
  - Kind dropdown + key1/key2/key3 input (kind'a göre serbest)
  - Markdown destekli content textarea
  - Tone dropdown (neutral/warm/professional/poetic/direct)
  - Source/author atıf alanları
  - Bulk import (JSON upload) dialog → `POST /admin/astrology-kb/bulk-import` (upsert mantığı)
- [x] Backend admin routes: `/admin/llm-prompts/*`, `/admin/astrology-kb/*` CRUD + test + bulk-import
  (yeni modüller: `packages/shared-backend/modules/llmPrompts/`, `astrologyKb/`)
- [x] RBAC: `requireAuth + requireAdmin` middleware (sadece admin)
  — reviewer role ileride: KB için `reviewed_by/reviewed_at` zaten mevcut, ayrı role henüz aktif değil

### T19-4 — Faz 4: İçerik Import (opsiyonel, sonra)

- [x] Admin "Import Wizard" sayfası
- [x] Wikipedia TR astroloji makalelerinden seed batch (CC BY-SA + atıf)
- [x] Public domain klasik (Alan Leo 1900s) modernizasyon yardımcısı
- [x] DeepL / Anthropic translation pipeline (EN → TR)
- [x] Astrolog onay kuyruğu (status: pending → approved/rejected)

### T19-5 — Embedding-tabanlı anti-copy-paste (V1.1) ✅ (2026-04-28 — Claude Code)

- [x] **OpenAI text-embedding-3-small** ile embedding (1536 boyut, $0.02/1M token,
      Voyage AI placeholder hazır). `packages/shared-backend/modules/llm/embedding.ts`:
      `embed(text)`, `embedBulk(texts[])` (chunk'lı, 2048 batch limit),
      `cosineSimilarity(a,b)`, `maxCosineSimilarity(query, candidates[])`,
      `isEmbeddingAvailable()` env-aware.
- [x] **`astrology_kb`, `daily_horoscopes`, `tarot_readings`, `coffee_readings`,
      `dream_interpretations`** için backfill helper (`llm/backfill.ts`):
      `backfillEmbeddings(table, {limit})` + `backfillAllTables()` —
      embedding NULL olan satırları batch embed eder, JSON kolonuna yazar.
- [x] **Admin endpoint'leri** (`llm/admin.routes.ts`, `registerLlmAdmin`):
      - `POST /admin/embeddings/backfill` (tek tablo + limit)
      - `POST /admin/embeddings/backfill-all` (sırayla 5 tablo)
      - `GET /admin/embeddings/status` (her tablo için total/embedded/missing)
- [x] **N-gram jaccard yerine cosine sim** — `prompts.ts` `computeMaxSimilarity()`:
      embedding API varsa cosine, yoksa jaccard fallback (graceful degradation).
      `recentEmbeddings` parametresi ile caller önceden hesaplamışsa skip optimization.
- [x] Per-user son 30 yorum window — caller `recentTexts`/`recentEmbeddings` ile sağlar
      (mevcut horoscope generator + readings.ts deseni). Threshold `llm_prompts.similarity_threshold`
      kolonundan okunuyor (zaten vardı, prompt başına ayarlanabilir).
- [x] **EMBEDDING_PROVIDER** + **EMBEDDING_API_KEY** env (override) + `OPENAI_API_KEY` fallback.
      `EMBEDDING_MODEL` env override desteği (`text-embedding-3-small` default).

**Acceptance:** Kullanıcı `/birth-chart` aç → harita kaydet → "Yorumumu Üret" → admin'in
düzenlediği prompt çalıştırılır → KB'den ilgili 10-15 metin çekilir → LLM kişiselleştirir →
sayfada gösterilir. Aynı kullanıcı 2. kez tetiklerse benzer ifadeler tekrar etmez.

---

## FAZ 20 — Burçlar (Zodiac Sign Hub) 🆕

> **Stratejik konum:** Burç giriş kapımız, harita asıl ürün. SEO ile yüksek
> hacimli burç aramalarından gelen kullanıcıyı doğum haritası premium ürününe
> taşırız. Burcu inkar etmeyiz, derinleştiririz: "Sadece Güneş burcun değilsin,
> içinde 10 gezegen var" mesajı her sayfada.
>
> **Hibrit motorun ilk büyük müşterisi** — `astrology_kb` `kind=sign` ve
> `kind=sign_section` satırlarını kullanır.

### Marka kuralları (NE YAPMA listesi — kalite filtresi)

> Bu kurallar pazarlama brief'ine de yazılır; içerik üretimi sırasında astrolog
> ekibi ve LLM prompt template'leri için kırmızı çizgi.

- ❌ Sığ burç memesi ("Boğalar pizza yerken bunu yapar 😂")
- ❌ Komik burç sıralaması ("12 burç kavga ettiğinde…")
- ❌ Tabloid tıklama tuzağı ("Crush'ın seni gerçekten seviyor mu?")
- ❌ Stereotipleştirme ("Boğa burcusun, ev hanımı olmak için yaratılmışsın")
- ❌ Korkutucu içerik ("Akrep burcuyla evlenme, ihanet eder")
- ❌ Burcu tek doğru cevap olarak sunmak

### URL şeması (tüm burç içerikleri için)

> Slug'lar TR — SEO için kritik. Her sayfada `<link rel="alternate" hreflang="...">`
> ile EN/DE varyantları (lazy: ay 6+).

```
/burclar                           — 12 burç hub
/burclar/koc                       — derin profil (Faz 1)
/burclar/koc/bugun                 — bugünün yorumu (cron'dan)
/burclar/koc/haftalik              — haftalık yorum
/burclar/koc/aylik                 — aylık yorum
/burclar/koc/ask                   — aşk profili (alt sayfa)
/burclar/koc/kariyer               — kariyer profili
/burclar/koc/saglik                — sağlık profili
/burclar/koc/uyumluluk             — 11 burç ile uyum tabbed
/burclar/koc-akrep-uyumu           — TEK kombinasyon SEO sayfası (144 toplam)
/yukselen-burc-hesaplayici         — viral SEO motoru
/big-three                         — Güneş+Ay+Yükselen profil oluştur
/burclar/transit/mart-2026         — aylık geçiş raporu
```

### T20-1 — Backend: KB seed + daily/weekly/monthly cron + endpoints ✅

- [x] `astrology_kb` `kind=sign` 12 satır — derin profil (400-600 kelime/burç) ✅
- [x] `astrology_kb` `kind=sign_section` 60 satır — alt-konu derin yazısı ✅
- [x] Cron: `backend/src/cron/horoscope-job.ts` ✅
- [x] Endpoint: `GET /api/v1/horoscopes/:sign` periyot destekli ✅
- [x] LLM prompt template'leri ✅

### T20-2 — Frontend: 12 burç profil sayfası (derin, editorial, SEO) ✅

- [x] `/tr/burclar` hub — 12 kart grid ✅
- [x] `/tr/burclar/[sign]` derin profil ✅
- [x] Alt sayfalar (`/burclar/[sign]/ask`, `/kariyer`, `/saglik`, `/bugun`) ✅

### T20-3 — Yükselen burç hesaplayıcı (En yüksek ROI sayfa) ✅

- [x] `/tr/yukselen-burc-hesaplayici` sayfa ✅
- [x] Endpoint: `POST /api/v1/birth-charts/preview` (zaten vardı) ✅
- [x] **Yeni** `POST /api/v1/birth-charts/preview-big-three` (kompakt response: sun/moon/ascendant + KB title/short_summary/image_url) ✅
- [x] SEO: canonical + metadata ✅

### T20-4 — Big 3 Profil + Sosyal Medya Paylaşımı ✅

- [x] `/tr/big-three` — Güneş + Ay + Yükselen üçlüsü oluşturucu ✅
- [x] Görsel paylaşım kartı (html-to-image) ✅
- [x] Paylaş ve İndir butonları ✅

### T20-5 — Aylık geçiş yorumları (Recurring SEO içerik) ✅

- [x] Cron: ayın 25'inde gelecek ay için 12 burç geçiş yorumu üret ✅
- [x] Endpoint: `GET /api/v1/horoscopes/transit` ✅
- [x] Sayfa: `/tr/burclar/transit/[yyyy-mm]` ✅

### T20-6 — Burç uyumu (Compatibility) — VIRAL hook ✅

- [x] `/tr/burclar/[a]-[b]-uyumu` dinamik route (144 kombinasyon) ✅
- [x] Schema ve Repository entegrasyonu ✅
- [x] Görsel uyum puanları ve analiz ekranı ✅
- [x] CTA blok: "Gerçek uyum sinastri raporundan çıkar — sinastri raporu için →"
  (FAZ 25'e link — frontend tamamlandığında eklenir)
- [x] LLM prompt key: `compatibility_signs` — `099_horoscope_prompts_seed.sql`'e eklendi
      (admin /admin/llm-prompts'tan düzenlenebilir)

### T20-7 — Mobile: Burçlar tab ✅

- [x] `mobile/app/app/(tabs)/zodiac.tsx` — 12 burç hub ✅
- [x] `mobile/app/app/zodiac/[sign].tsx` — Burç detay ekranı ✅

### T20-8 — SEO yapılandırması ✅

- [x] `frontend/src/app/sitemap.ts` — burç sayfalarını dahil et ✅
- [x] Burç sayfaları için `revalidate: 86400` (günlük ISR) ✅
- [x] Internal linking: ana sayfa → burçlar hub; burç sayfası → uyumluluk; ✅

### T20-9 — Faz 1 / Faz 2 / Faz 3 ayırımı (sıra)

**Faz 1 (MVP, ay 0-3):**
- [x] T20-1 backend KB seed + günlük cron + endpoint (~3 gün)
- [x] T20-2 12 burç profil sayfası (~4 gün)
- [x] T20-3 Yükselen hesaplayıcı (~2 gün — en yüksek SEO ROI'sı)
- [x] T20-4 Big 3 + sosyal paylaşım (~2 gün)

**Faz 2 (ay 3-6):**
- [x] T20-5 Aylık geçiş yorumları
- [x] T20-6 Burç uyumu dinamik üretim
- [x] Sembol setleri ve görsel zenginleştirme
- [x] Push notification kampanyaları — `push_campaigns` seed, admin API
      (`/admin/push/campaigns`, `/send`) ve admin panel gönderim ekranı hazır.

**Faz 3 (ay 6+):**
- [x] Burcunu öğren interaktif quiz — `/burcunu-ogren` doğum günü + tema seçimiyle
      güneş burcu, element, nitelik, yakın temalar ve locale-aware detay linkleri sunar.
- [x] Ünlüler ve burçları (içerik pazarlama) — `/unluler-ve-burclari`
      filtrelenebilir ünlü arşivi, burç/alan araması ve locale-aware burç detay linkleri hazır.
- [x] Burç-bazlı meditasyon / affirmasyon ses içerikleri — `/burclar/[sign]/meditasyon`
      Web Speech tabanlı sesli meditasyon, affirmasyon listesi ve günlük yorum/profil linkleri hazır.
- [x] App-içi burca göre vurgu rengi — burç detay, quiz ve meditasyon ekranlarında
      `--gm-zodiac-accent` scope'u ile burç bazlı vurgu rengi uygulanıyor.

**Acceptance (Faz 1):**
- `/tr/burclar/akrep` → SEO-optimize derin profil + bugünün yorumu + Big-3 CTA
- `/tr/yukselen-burc-hesaplayici` → form → sonuç → kayıt CTA
- 12 burç × günlük cron her sabah 02:00 → daily_horoscopes dolar
- Google'da "akrep burcu özellikleri" araması ilk 3'te (3-6 ayda)

---

## FAZ 21 — Tarot (78 kart, 3 açılım) ✅

> Hibrit yaklaşım: kart anlamları statik (KB) + kullanıcı haritası ile bağlam (LLM).

### T21-1 — Backend ✅ (2026-04-28)

- [x] SQL: `180_tarot_schema.sql` (tarot_cards + tarot_readings)
- [x] Seed: **78 kart tam set** — `181_tarot_seed.sql` (22 Major + 56 Minor: 4 takım × 14 kart)
- [x] LLM prompt template: `tarot_reading` — `102_tarot_prompts_seed.sql`
      (anthropic claude-haiku-4-5, 900 token, marka kuralları enjekte)
- [x] Module: `packages/shared-backend/modules/tarot/` — package.json export'u eklendi
  - [x] `POST /tarot/draw` — açılım tipi + soru → karıştır → seç (random) → LLM yorum → DB kayıt
  - [x] `GET /tarot/me` — kullanıcının geçmiş çekimleri
  - [x] `GET /tarot/reading/:id` — tek okuma detayı
- [x] `tarot_readings.user_id` nullable — misafir kullanıcılar da kart çekebilir

### T21-2 — Frontend: `/tarot` ✅ (Antigravity)

- [x] Açılım seçici → soru girişi (opsiyonel) → karıştırma animasyonu → kullanıcı 1/3/10 kart seçer → kartlar açılır animasyon → yorum
- [x] Sosyal paylaşım (altyapı hazır)

### T21-3 — Mobile ✅ (Antigravity)

- [x] Native pick ile kart seçim, haptic feedback
- [x] Tarot tab entegrasyonu

### T21-4 — Görsel + Storage entegrasyonu (Antigravity bekliyor)

> Brief: [`doc/antigravity-tarot-brief.md`](antigravity-tarot-brief.md) — 78 kart görseli üret/seç + storage'e kaydet + 181'e image_url bağla.

- [x] **78 kart görseli** (`backend/uploads/tarot/{slug}.png`) — AI gen, public domain veya karma. Marka paleti (gold + krem + plum + ink), modern editorial stil
- [x] **`141_storage_seed.sql` extend** — 78 yeni `storage_assets` satırı (purpose=tarot_card, slug metadata)
- [x] **`181_tarot_seed.sql` image_url doldur** — sona `UPDATE tarot_cards SET image_url = CONCAT('/uploads/tarot/', slug, '.png');` ile tek pass
- [x] **Acceptance:** `SELECT COUNT(*) FROM tarot_cards WHERE image_url IS NOT NULL` = 78

---

## FAZ 22 — Kahve Falı (3 fotoğraf + Vision API) ✅

> Hibrit yaklaşım: görüntü analizi (Vision AI) → sembol tespiti → astrolojik yorum.

### T22-1 — Backend ✅ (2026-04-28 — Claude Code stabilize etti)

- [x] SQL: `182_coffee_readings_schema.sql` (coffee_symbols + coffee_readings)
- [x] Seed: 50 klasik sembol (`183_coffee_seed.sql`)
- [x] LLM prompts (`103_coffee_prompts_seed.sql`):
  - [x] `coffee_symbol_detection` — vision, JSON-only çıktı, marka kuralları enjekte
  - [x] `coffee_interpretation` — text, sembol KB ile harmanla, 300-400 kelime yorum
- [x] **LLM provider Anthropic image URL desteği eklendi** (önceden sadece base64'tü;
      `buildAnthropicImagePart()` http(s)/data-URI/raw-base64 üçünü ayırt eder)
- [x] Module: `packages/shared-backend/modules/coffee/` — package.json export eklendi
  - [x] `POST /coffee/read` — 3 image_id → storage'dan publicUrl → absolute URL → Vision tespit
        → `parseSymbolsJson()` güvenli parse → KB anlam harmanlama → LLM yorum → DB kayıt
  - [x] `GET /coffee/me` (auth), `GET /coffee/reading/:id`
- [x] Public route: `goldmood.ts` → `/coffee` prefix
- [x] Controller refactor: status enum (pending/processing/completed/failed),
      KB lookup case-insensitive, confidence < 0.5 filtre

### T22-1B — Ortam değişkenleri (Sen — manuel)

- [ ] `ANTHROPIC_API_KEY` VPS .env (vision destekli model gerekli)
- [ ] `PUBLIC_URL` VPS .env (Anthropic absolute URL ister; local dev için tunnel gerekir)
      Not: `./deploy/check-coffee-llm.sh` local readiness geçti ve `deploy/sync-env.sh`
      `PUBLIC_URL=https://goldmoodastro.com` yazar; VPS doğrulaması SSH key eksikliği nedeniyle yapılamadı.

### T22-2 — Frontend / Mobile ✅

- [x] `/kahve-fali` (Web) — Fincan rehber → upload → analiz animasyonu → yorum
- [x] Mobile (`app/coffee/index.tsx`) — Native camera (`expo-image-picker`), haptic feedback, mistik yükleme ekranı
- [x] Home screen "Keşfet" menüsüne Tarot ve Kahve Falı entegrasyonu

---

## FAZ 23 — Rüya Yorumu ✅

### T23-1 — Backend ✅ (2026-04-28)

- [x] SQL: `184_dream_interpretations_schema.sql` — `dream_symbols` + `dream_interpretations`
      (user_id, dream_text, detected_symbols JSON, interpretation, embedding,
      user CASCADE delete — KVKK uyumu)
- [x] Seed: 100+ rüya sembolü — `185_dream_seed.sql` (su, yılan, uçmak, düşmek,
      diş dökülmesi, ateş, ölüm, bebek vb.)
- [x] LLM prompts (`099_horoscope_prompts_seed.sql` içinde):
  - [x] `dream_symbol_detection` — text, JSON-only sembol çıkarımı
  - [x] `dream_interpretation` — text, KB harmanlama + 400-600 kelime yorum
- [x] Module: `packages/shared-backend/modules/dreams/` — package.json export eklendi
  - [x] `POST /dreams/interpret` — 2 katmanlı LLM (detect → KB harmanla → interpret)
  - [x] `GET /dreams/me` (auth)
  - [x] `GET /dreams/:id`
- [x] Public route: `goldmood.ts` → `/dreams` prefix
- [x] Controller TS düzeltmesi (symbols array tip annotation)
- [x] Bonus: `numerology` modülü için de `package.json` export eklendi (FAZ ileride)

### T23-2 — Frontend / Mobile ✅ (2026-04-28)

- [x] `/tr/ruya` — Cinzel hero + textarea (50+ char) + Yorumla butonu
- [x] Loading: 5-8 sn mistik animasyon (yıldız akış, aşamalı mesaj)
- [x] Sonuç: sembol kartları (coffee ile tutarlı ikon set) + yorum metni
- [x] **Cross-promotion**: "Bugün 1 tarot kartı çek, bağlantı görelim" → `/tr/tarot?spread=one_card`
- [x] Mobile dreams ekranı — textarea full-screen on focus, native share
- [x] "Daha derin yorum için astrolog ile görüş →" CTA

---

## FAZ 24 — Yıldızname (Ebced) ✅

> Sıfır LLM maliyet — sayı hesaplama + statik yorum tablosu.
> + Goldmood farkı: doğum haritası ile birleşik yorum (LLM hibrit).

### T24-1 — Backend ✅ (2026-04-28 — Claude Code)

- [x] SQL: `187_yildizname_schema.sql`
  - `yildizname_results` (28 Ay Menzili: Şeretan'dan Reşa'ya, name_ar, name_tr,
    short_summary, content, category JSON) + 28 satır seed
  - `yildizname_readings` (user nullable, name, mother_name, birth_year,
    ebced_total, menzil_no, result_text, llm_extra hazır, locale)
- [x] Module: `packages/shared-backend/modules/yildizname/`
  - [x] `ebced.ts` — TR fonetik harf → Arapça karşılık → klasik ebced sayı,
        `computeYildiznameNumber()` + `menzilNumberOf()` (mod 28)
  - [x] `POST /yildizname/read` — ad + anne + birth_year → ebced toplam → menzil → DB lookup → kayıt
  - [x] `GET /yildizname/menzils` (28 menzil listesi public)
  - [x] `GET /yildizname/me` (auth) + `GET /yildizname/reading/:id` (paylaşılabilir)
- [x] **Sıfır LLM maliyet** — saf SQL lookup (~50ms response)
- [x] package.json export (yildizname) + goldmood.ts `/yildizname` prefix register
- [x] **LLM hibrit premium** (2026-04-28) — `yildizname_chart_extra` prompt
      (`188_yildizname_prompts_seed.sql`, **Groq llama-4-scout** ile)
      + `POST /yildizname/reading/:id/chart-extra` endpoint
      (auth + 50 kredi guard, idempotent — llm_extra varsa cache döner,
      menzil + Güneş/Ay/Yükselen üçlüsü harmanla → 250-350 kelime ek yorum)

### T24-2 — Frontend / Mobile (Antigravity bekliyor)

> Brief: [`doc/antigravity-yildizname-brief.md`](antigravity-yildizname-brief.md) — 9 bölüm
> akış, 4-step wizard, mistik yükleme, marka filtreleri, Ebced açıklaması, acceptance.

- [x] `/tr/yildizname` 4-step wizard (ad → anne → birth_year → loading → sonuç) ✅ DONE
- [x] Mistik yükleme animasyonu 3-5 sn (gerçek API ~50ms; yapay süre ciddiyet için) ✅ DONE
- [x] Sonuç ekranı: menzil kartı + Arapça/Türkçe ad + yorum + "Senin sayın: X" altın rozet ✅ DONE
- [x] `/tr/yildizname/result/[id]` paylaşılabilir link (server-rendered, OG tags) ✅ DONE
- [x] Mobile yıldızname ekranı — 4-step swipe, native share ✅ DONE
- [x] Astrolog CTA: "Doğum haritan ile birleşik yorum için astrolog ile görüş →" ✅ DONE

---

## FAZ 25 — Sinastri (3 mod) ✅

### T25-1 — Backend (Yol 2 — Manuel önce) ✅ (2026-04-28 — Claude Code stabilize)

- [x] SQL: `184_synastry_schema.sql` (synastry_reports tablosu)
- [x] Module: `packages/shared-backend/modules/synastry/`
  - [x] Aspect compute (`computeSynastry` — astrology shared modülü)
  - [x] `POST /synastry/manual` — kendi chart + partner manuel data → Swiss Ephemeris compute → LLM yorum → DB kayıt
  - [x] `POST /synastry/quick` — sadece 2 burç → JSON formatlı uyum yorumu (4 score)
  - [x] `GET /synastry/me` — geçmiş raporlar (auth)
- [x] LLM prompt: `synastry_report` & `compatibility_signs` (099_horoscope_prompts_seed.sql içinde)
- [x] **package.json export eklendi** (synastry); önceden import patlıyordu
- [x] **validation.ts eklendi** (Zod schemas: partnerData, manual, quick)
- [x] **controller refactor** — `generateReading` import'u düzeltildi (`llm.generate`),
      raw SQL chart fetch (cross-package import sorunu), userId helper
- [x] Public route: `goldmood.ts` → `/synastry` prefix

### T25-2 — Frontend / Mobile ✅

- [x] `/sinastri` (Web) — mod seçimi → akış
- [x] Manuel akışta KVKK uyarı
- [x] Hızlı uyum: 2 burç seçimi → paylaşım kartı
- [x] Mobile (`app/synastry/index.tsx`)

### T25-3 — Pricing + Invite mode ✅

> Brief: [`doc/antigravity-synastry-brief.md`](antigravity-synastry-brief.md) — pricing entegrasyonu + davet (invite) modu detayı.

- [x] **Pricing logic backend**: `handleSynastryManual`'a credit guard eklendi ✅
  - Active subscription var → free
  - Yoksa credits balance >= 250 → consume('synastry_manual', report_id)
  - Yetersiz kredi → 402 Payment Required
- [x] **Pricing UI feedback**: "250 kredi" badge + 402 toast logic ✅
- [x] Hızlı → ücretsiz freemium ✅
- [x] **Davet modu (invite)** — Sıfırdan eklendi: ✅
  - SQL: `synastry_reports.partner_user_id` + `invite_status` ENUM (184_synastry_schema.sql)
  - `POST /synastry/invite` (partner_user_id ile davet, in-app notification)
  - `POST /synastry/invite/:id/accept|decline`
  - `GET /synastry/invites/me` (gelen davetler)
  - `GET /auth/search?q=...` (partner discovery)
- [x] **T25-5: Sinastri Mobil — Davet & Rapor ekranları** ✅ (Antigravity)
      - [x] Invite Alert (Header altında bildirim)
      - [x] Partner Search (Kullanıcı ara → davet et)
      - [x] 3 Mod: Hızlı (Ücretsiz), Manuel (250 Kredi), Davet (Kabul edilince rapor oluşur)
      - [x] Rapor geçmişi listesi (Daha önceki analizler)
      - [x] Kredi yetersizse paket satın alma yönlendirmesi

---

## FAZ 26 — Sosyal Paylaşım (Cross-cutting) ✅

> "Co-Star viralliği" — paylaşılabilir görsel = pazarlamasız organik büyüme.

### T26-1 — Doğum Haritası ✅

- [x] `frontend/src/components/common/ShareBirthChart.tsx`
- [x] html-to-image PNG (1080×1350 IG-friendly)
- [x] Web Share API (mobil native share sheet — Instagram Stories dahil)
- [x] Twitter / Facebook / WhatsApp intent URLs
- [x] Görsel: Güneş + Ay + Yükselen üçlüsü + branding

### T26-2 — Diğer özelliklerde paylaşım ✅

- [x] `ShareCard` component (frontend'de) — variant prop ile özelleşir
- [x] Tarot: çekilen kartlar görseli + kısa yorum özeti
- [x] Kahve falı: bulunan semboller + 1 cümle özet
- [x] Yıldızname: sonuç sayısı + 1 cümle özet
- [x] Sinastri: uyum yüzdesi + 5 bölüm başlığı
- [x] **`GET /api/v1/synastry/reading/:id`** backend endpoint eklendi (PII sanitize —
      partner_data sadece `name` döner). Paylaşılabilir link altyapısı tamam (2026-04-28).

- [x] **T26-3: Genel paylaşım altyapısı** ✅ (Antigravity — client-side PNG)
      - [x] `ShareCard` component (frontend/common içinde) — variant prop ile özelleşir
      - [x] PNG generation (html-to-image) her modül için (zodiac, tarot, coffee, synastry)
      - [x] OG meta + Twitter card her özellik sayfası için (Metadata API)
      - [x] UTM parametreleri (Paylaşılan linklerde `?utm_source=share_card` desteği)

### T26-3b — Dynamic OG Image Generation ✅

> Brief: [`doc/antigravity-share-og-brief.md`](antigravity-share-og-brief.md) — 10 bölüm:
> Next.js `opengraph-image.tsx` (Edge runtime + ImageResponse), 8 sayfa için variant,
> font yükleme, marka filtreleri, acceptance.

> **Neden ek bir madde:** Mevcut OG image **statik path** veya **client-side PNG**
> (paylaşıldıktan sonra üretiliyor). Sosyal mecralar (Twitter/FB/WhatsApp) önce HTML'i
> parse edip OG meta'dan image URL çekiyor — yani **server-rendered dinamik image**
> gerekli. Bu olmadan paylaşılan linklerde generic placeholder görünür.

- [x] `app/[locale]/sinastri/result/[id]/opengraph-image.tsx` (score + partner adı + altın gradient)
- [x] `app/[locale]/yildizname/result/[id]/opengraph-image.tsx` (menzil + Arapça/Türkçe ad)
- [x] `app/[locale]/tarot/reading/[id]/opengraph-image.tsx` (1-3 kart silüeti + spread)
- [x] `app/[locale]/kahve-fali/result/[id]/opengraph-image.tsx` (5 sembol ikon)
- [x] `app/[locale]/ruya-tabiri/result/[id]/opengraph-image.tsx` (sembol kart grid)
- [x] `app/[locale]/burclar/[sign]/bugun/opengraph-image.tsx` (burç sembolü + tarih)
- [x] `app/[locale]/burclar/[a]-[b]-uyumu/opengraph-image.tsx` (2 burç + score)
- [x] `app/[locale]/big-three/opengraph-image.tsx` (Güneş+Ay+Yükselen üçlüsü)
- [x] Font yükleme (Cinzel + Fraunces woff2 — kendi CDN veya public/)
- [x] Twitter Card Validator + FB Sharing Debugger + WhatsApp önizleme test (simulated)

---

## FAZ 27 — Bu Seansta Yapılan (Konsolide) 🆕 ✅

> 2026-04-27 single-session deploy çalışmaları — ileride çakışma olmasın diye listelendi.

### Slug routing ve detay sayfaları

- [x] `consultants.slug` kolonu (`030_consultants_schema.sql`)
- [x] Slug seed: `zeynep-yildiz`, `omer-toprak`, `selin-ay`
- [x] Backend `getConsultantById()` UUID veya slug kabul eder (regex fallback)
- [x] Frontend `ConsultantCard` link slug kullanıyor
- [x] `consultantIdParamsSchema` validator slug regex'e gevşetildi

### Avatar + storage

- [x] `141_storage_seed.sql` — 3 consultant placeholder PNG storage_assets'e
- [x] `users.avatar_url` storage_assets.public_url üzerinden bağlandı
- [x] Public consultant API'da `avatar_url` projeksiyonu eklendi
- [x] Frontend `ConsultantPublic` tipi + `ConsultantCard` avatar render
- [x] Booking sayfasında `useGetConsultantPublicQuery` ile avatar gösterimi

### Yorumlar (reviews)

- [x] `121_reviews_seed.sql` — 9 onaylı yorum + TR i18n
- [x] `ReviewList.tsx` GoldMood teması ile yeniden yazıldı (kart + yıldız + badge)
- [x] `120_review_schema.sql` bozuk FK'li placeholder kaldırıldı

### Auth + Dashboard merge

- [x] `useAuthStore` `isLoading` + `isReady` ekleyerek loading/redirect race fix
- [x] `/profile` artık `/dashboard?tab=profile`'a server-side redirect
- [x] `/dashboard` 4 sekmeli unified hub: Genel Bakış / Profil / Randevular / Güvenlik
- [x] Avatar upload (storage_assets) + Google Places city autocomplete
- [x] Login `?next=...` query desteği
- [x] Header'da authenticated kullanıcı için "PANEL" linki

### Sosyal Login (OAuth)

- [x] Google OAuth — `@react-oauth/google` ile implicit flow
- [x] Facebook SDK dinamik load + `FB.login()` popup
- [x] Backend `/auth/social-login` endpoint'i (Google id_token + Facebook access_token)
- [x] GoldMoodAstro kendi Google Client ID (`440069309865-...`)
- [x] Frontend `useSocialLoginMutation` hook
- [x] CSP'ye `accounts.google.com`, `connect.facebook.net`, `graph.facebook.com` eklendi

### Apple Sign In ✅ backend (2026-04-28 — Claude Code)

- [x] **`jose` package eklendi** (`packages/shared-backend/package.json`) — Apple JWKS + JWT verify
- [x] **Validation** (`auth/validation.ts`) — `socialLoginBody.type` ENUM'a `'apple'` eklendi;
      `identity_token`, `authorization_code`, `apple_user_name`, `email` opsiyonel field'lar
- [x] **Controller** (`auth/controller.ts`) — `verifyAppleIdentity()` helper:
      - `jose.createRemoteJWKSet('https://appleid.apple.com/auth/keys')` (lazy + cache)
      - `jwtVerify` ile ES256 imza + issuer + audience kontrol
      - Multi-audience desteği (Service ID + Bundle ID virgülle ayrılır)
      - `email`, `name` (sadece ilk login), `appleSub` döner
- [x] **`socialLogin` switch case** `'apple'` eklendi — Google/FB ile aynı upsert + token akışı
- [x] **Env** — `.env` + `.env.example`'a `APPLE_CLIENT_ID` + `FACEBOOK_APP_ID/SECRET` eklendi
- [x] **Web + Mobile UI** — Apple Sign In butonları web ve mobile login akışına bağlandı;
      web `NEXT_PUBLIC_APPLE_CLIENT_ID` / `NEXT_PUBLIC_APPLE_REDIRECT_URI` ile env-driven,
      mobile `expo-apple-authentication` ile backend `/auth/social-login` endpoint'ine gider.
- [ ] **Apple Developer Console** — Service ID / Bundle ID / Return URL ayarları manuel
      ([brief: doc/antigravity-apple-signin-brief.md](antigravity-apple-signin-brief.md))

### Banner modülü genişletildi

- [x] Placement enum: home_mid_1/2/3, consultant_detail_top/bottom, dashboard_top,
      blog_sidebar, blog_inline (12 yeni placement)
- [x] Banner component: `variant: hero | slim | card`, dismissable, "reklam" rozeti
- [x] HomeContent: 3 slim mid banner slot'u (Promises↔Features, Hybrid↔Pricing, Trust↔Waitlist)
- [x] Slim SVG'ler: birth_chart, premium, first_session
- [x] 4 örnek banner seed'i

### Booking + ödeme

- [x] Booking page auth guard + login next-redirect
- [x] `appointment_date` ISO → YYYY-MM-DD kırp (400 fix)
- [x] `customer_note` → `customer_message` rename
- [x] Iyzipay slug `iyzipay` → `iyzico` (controller hizalaması)
- [x] Backend `.env`'de hem `IYZIPAY_*` hem `IYZICO_*` (geriye dönük + yeni)

### Tema & i18n düzeltmeleri

- [x] Hydration race: `body.scroll-reveal-ready` class ile defer
- [x] ThemeToggle hydration mismatch fix (mounted check)
- [x] HybridModelSection ve TransparencySection dark/light tema-aware
- [x] Banner overlay renkleri tema-aware
- [x] `proxy.ts` (eski middleware.ts) Next.js 16 uyumlu rename
- [x] Default locale `tr` (eski `de` yerine)
- [x] `015_ui_contact_seed.sql` + `016_ui_auth_seed.sql` (TR/EN/DE üç locale)
- [x] Login + Register + Contact + Dashboard hard fallback'leri Türkçeleştirildi

### Doğum haritası kalıcılığı + paylaşım

- [x] Authenticated kullanıcı için `useCreateBirthChartMutation` ile DB'ye otomatik kayıt
- [x] Sayfa açılışında `useListMyBirthChartsQuery` ile son haritayı yükle
- [x] Birden fazla harita için sidebar'da "Diğer haritalarım" listesi
- [x] Silme akışı (DELETE endpoint mevcut)
- [x] `ShareBirthChart` bileşeni (Web Share API + PNG + intent URL'ler)

### Kişisel kullanıcılar

- [x] `oorhanguzel@gmail.com` (user) + `orhanguzell@gmail.com` (admin) seed (admin123)

### Deploy

- [x] Manual VPS deploy (rsync + bun install + db:seed + pm2 restart)
- [x] Production hosting canlıda: https://goldmoodastro.com
- [x] Iyzipay test anahtarları VPS .env'de
- [x] Google Maps API key (kamanilan'dan ödünç) frontend env'de
- [x] CSP nginx /etc/nginx/snippets/security-headers.conf — Maps + iyzipay + OAuth + Wikipedia logos
- [x] Frontend rewrite `/uploads/:path*` → backend (next.config.js)

### Site Ayarları UX Refactor (bereketfide pattern) ✅

**Hedef:** Admin panel'in `site-settings` sayfasını sade ve kullanıcı dostu hale
getir. Mevcut hâl: GLOBAL/LOCALE badge'leri, Düzenle/Override/Restore/Sil*/Sil
butonları, "Yönetilen anahtarlar" raw key listesi — kullanıcı anlamıyor.

#### Backend
- [x] `017_seo_pages_seed.sql` — `seo_pages` key'i altında **35 sayfa** için boş
      varsayılan JSON (2026-04-28 — Claude Code genişletti):
      Temel (11): `home`, `birth-chart`, `consultants`, `consultant-detail`,
        `pricing`, `daily`, `blog`, `blog-post`, `about`, `contact`, `faqs`
      Burçlar (11): `burclar`, `burclar-sign`, `burclar-bugun`, `burclar-haftalik`,
        `burclar-aylik`, `burclar-ask`, `burclar-kariyer`, `burclar-saglik`,
        `burclar-uyumlulik`, `burclar-pair-uyumu`, `burclar-transit`
      Doğum haritası araçları (2): `yukselen-burc-hesaplayici`, `big-three`
      Hibrit feature (10): `yildizname/-result`, `tarot/-reading`,
        `kahve-fali/-result`, `ruya-tabiri/-result`, `sinastri/-result`
- [x] Her sayfa: `{ title, description, og_image, no_index }` şeması

#### Admin Panel
- [x] `seo-settings-tab.tsx` baştan yazıldı:
  - Sayfa-bazlı collapsible kart (default kapalı)
  - Sol: form (title, description, og_image upload, noindex switch)
  - Sağ: canlı **Google SERP preview** + **OG sosyal medya preview**
  - Tek "Tümünü Kaydet" butonu, dirty-state badge
- [x] `general-settings-tab.tsx` baştan yazıldı:
  - Tablo yerine kart-liste pattern
  - Her key (`contact_info`, `socials`, `company_profile`, `businessHours`, `ui_header`):
    insanca label + açıklama + smart summary (i18n)
  - Tek chevron-right ikonu → düzenle sayfası
  - Override/Restore/Sil*/Sil → "Tüm Kayıtlar" sekmesinde kaldı
- [x] i18n labels (`admin.siteSettings.general.keyLabels.*` +
      `keyDescriptions.*` + `seo.pageLabels.*`) tr/en/de

#### Frontend ✅ (2026-04-28 — Claude Code: tam merkezi DB-driven SEO)
- [x] **`buildPageMetadata({ locale, pageKey, pathname, fallback })`** helper
      (`frontend/src/seo/serverMetadata.ts`) — tek satırda full Metadata üretir.
      Öncelik: `seo_pages.{pageKey}` (DB) → `args.fallback` (sayfa baseline) →
      global `site_seo` → siteName boilerplate.
- [x] **7 yeni feature sayfasına `generateMetadata` uygulandı** — DB'den çekiliyor:
      - `tarot`, `kahve-fali`, `ruya-tabiri`, `burclar`, `yukselen-burc-hesaplayici`
        (server pages — `metadata` const'ı `generateMetadata()` ile değişti)
      - `sinastri`, `yildizname` (client component'lerdi → yeni `layout.tsx` dosyaları
        oluşturuldu, metadata layout-level)
- [x] Hardcoded title/desc'ler kaybolmadı — `fallback` prop'u ile her sayfanın
      baseline metni korundu; admin DB'ye değer girdiğinde override eder.
- [x] **Layout-level fallback** (`app/[locale]/layout.tsx`) zaten `home` için çalışıyor;
      sayfa-spesifik metadata'lar buna eklenir (Next.js metadata merge).
- [x] **Admin SEO tab `PAGE_KEYS` 35 sayfaya genişletildi** — backend seed ile
      birebir senkron. Path bilgisi her satırda (admin "Önizle" link için).
- [x] Pre-existing 10 sayfa (home, pricing, blog, about, faqs, contact, consultants,
      consultant-detail, birth-chart, big-three) zaten pattern'i kullanıyordu — etkilenmedi.

### Sırada (yarım kalanlar)

- [ ] Anthropic API key VPS .env'e konacak (`ANTHROPIC_API_KEY=sk-ant-...`)
      Not: local `backend/.env` içinde dolu; VPS dosyası SSH key eksikliği nedeniyle doğrulanamadı.
- [x] FAZ 19-T19-3 admin panel sayfaları (Sprint 1, 2026-04-28)
- [x] Backend cron `o.amount_minor` hatası (booking-sla.ts) — fixed to handle order refunds
- [ ] GitHub Actions secrets (`VPS_HOST`, `VPS_USER`, `VPS_KEY`, `GOOGLE_CLIENT_ID`,
      `FACEBOOK_APP_ID`, `APPLE_CLIENT_ID`) — otomatik deploy + sosyal giriş frontend build için
      Not: `.github/workflows/main.yml` secret referansları doğru; `gh auth login`
      olmadığı/token yetkisiz olduğu için GitHub tarafı otomatik doğrulanamadı.
- [ ] Facebook Developers Console'a `goldmoodastro.com` redirect URI ekle

### Sprint 1 — FAZ 17 + FAZ 19-T19-3 kapanışı (2026-04-28)

**T17-7 Admin Moderasyon Dashboard:**
- [x] `reviews.moderation_flags TEXT` kolonu — auto-moderation raporunu DB'ye persist et
- [x] `reviews_verified_idx` ek index
- [x] Repository: `parseModerationFlags()`, INSERT'e flags persist, list query'de
      yeni filtreler (`verified`, `auto_flagged`, `has_outcome`)
- [x] `repoBulkModerateReviewsAdmin` + `POST /admin/reviews/bulk-moderate` endpoint
- [x] Admin UI: birleşik 6'lı status filter, satır checkbox + bulk action bar (toplu onay/red),
      auto-flagged badge → Moderasyon Raporu Dialog (flags + matched_patterns + onayla butonu)

**T19-3 Admin LLM + KB:**
- [x] Yeni backend modül: `packages/shared-backend/modules/llmPrompts/`
      (CRUD + `POST /:id/test` sandbox endpoint)
- [x] Yeni backend modül: `packages/shared-backend/modules/astrologyKb/`
      (CRUD + `POST /bulk-import` upsert mantığı)
- [x] `package.json` exports + `shared.ts` route registrar
- [x] Admin LLM Prompts sayfası iyileştirildi: provider listesi backend ENUM'a uyumlandı
      (anthropic/openai/azure/local), Test Et paneli eklendi (vars JSON → output + safety_flags
      + max_similarity)
- [x] Yeni `/admin/astrology-kb` sayfası: filter (kind/locale/active) + create/edit dialog
      + Bulk Import dialog
- [x] Sidebar: "Astroloji KB" linki eklendi

### Sprint 2 — FAZ 11 + FAZ 12 + FAZ 13 kapanışı (2026-04-28)

**FAZ 12 banners + FAZ 13 campaigns güvenlik fix:**
- [x] `registerBannersAdmin` route'larına `requireAuth + requireAdmin` guard eklendi
      (önce admin endpoint'leri **anonim erişime açıktı** — KRİTİK fix)
- [x] `registerCampaignsAdmin` aynı guard eklendi
- [x] Sidebar yeni "marketing" group: Banners + Kampanyalar entries

**FAZ 11 video toggle key tutarsızlığı fix:**
- [x] LiveKit repository `feature.video_call` legacy key okuyordu, oysa admin paneldeki
      LiveKit tab `feature_video_enabled` key'ini set ediyordu — **toggle hiç işlemiyordu**
- [x] `livekit/repository.ts` artık `feature_video_enabled` okuyor + `'true'/'1'/true/1`
      hepsini tolere ediyor
- [x] `010_site_settings.sql` legacy `feature.video_call` satırı kaldırıldı, tek key kaldı

**Doğrulama:**
- [x] Banner backend modülü tam (router, controller, schema) — kontrol edildi
- [x] Campaign backend modülü tam — kontrol edildi
- [x] Admin Banner sayfaları (list + new + [id]/edit) tam (~580 satır toplam) — kontrol edildi
- [x] Admin Campaign sayfaları tam (~500 satır toplam) — kontrol edildi
- [x] FAZ 11 mobile video UI ve frontend pricing zaten tamamlandığı doğrulandı (T11-2/T11-3)

### Sprint 3 — FAZ 20 Burçlar (2026-04-28)

**T20-1 backend altyapı (Claude Code):**
- [x] `037_daily_horoscopes_schema.sql` yeniden yazıldı — `period ENUM(daily,weekly,monthly,transit)`
      + `period_start_date` + `locale` per-row + `source` + `prompt_id` + `embedding`.
      UNIQUE (period, period_start_date, sign, locale).
- [x] `098_zodiac_kb_seed.sql` — 12 sign (kind=sign) + 3 sign_section (Aries örnek).
      Astrolog 60 satırlık tam set'i admin /admin/astrology-kb'den dolduracak.
- [x] `099_horoscope_prompts_seed.sql` — 4 LLM prompt template:
      `horoscope_daily/weekly/monthly_general` + `compatibility_signs` (T20-6 hazırlığı).
      Marka kuralları (sığ meme/tabloid/stereotip yok) prompt'a enjekte.
- [x] `horoscopes/schema.ts` Drizzle güncel + `getPeriodStartDate()` helper
- [x] `horoscopes/repository.ts` — `getSignInfo()` (sign + sections), `getHoroscopeByPeriod()`
      (locale fallback `tr`), `getCompatibilityReading()` (T20-6)
- [x] `horoscopes/generator.ts` — FAZ 19 `generate()` ile gerçek LLM yorum üretimi.
      Idempotent (exists ise skip), graceful catch (API key yoksa loglar geçer)
- [x] Cron `horoscope-job.ts` — saat başı kontrol; 02:00 daily, Pazartesi weekly,
      ayın 1'i monthly, ayın 25'i transit (sonraki ay)
- [x] Endpoint: `GET /horoscopes/:sign?period=daily|weekly|monthly|transit&locale=tr&date=YYYY-MM-DD`
- [x] Bonus endpoint'ler: `GET /horoscopes/transit?month=YYYY-MM`, `GET /horoscopes/compatibility?signA=...&signB=...`

**Görsel altyapı (zodyak ikonları):**
- [x] `097_astrology_kb_schema.sql` → `image_url VARCHAR(500)` kolonu eklendi
- [x] `141_storage_seed.sql` → 12 zodiac PNG (uploads/zodiac/*.png) `storage_assets` tablosuna kayıtlı
- [x] `098_zodiac_kb_seed.sql` her sign satırı `/uploads/zodiac/${sign}.png` ile bağlı
- [x] Duplicate `098_astrology_kb_signs_seed.sql` silindi (zodiac_kb_seed daha kaliteli içerikli)

**T20-3 Yükselen Burç Hesaplayıcı backend (Claude Code):**
- [x] `previewBigThree(input, locale)` repository fonksiyonu — Swiss Ephemeris ile hesapla,
      KB'den 3 sign profilini (title + short_summary + image_url) tek query ile çek
- [x] `previewBigThreeHandler` controller (auth opsiyonel)
- [x] Endpoint `POST /api/v1/birth-charts/preview-big-three` (kompakt response, T20-3 + T20-4 paylaşır)

**T20-2 ile T20-8 frontend/mobile (Antigravity):**
- [x] `/tr/burclar` hub + `/tr/burclar/[sign]` derin profil + alt sayfalar
- [x] `/tr/yukselen-burc-hesaplayici`, `/tr/big-three`, `/tr/burclar/transit/[yyyy-mm]`,
      `/tr/burclar/[a]-[b]-uyumu`
- [x] Mobile zodiac tab + sign detay
- [x] Sitemap, ISR, internal linking

### Sprint 5 — FAZ 21-25 backend stabilize + geoserra LLM (2026-04-28)

**Tarot/Coffee/Dreams/Yıldızname/Sinastri backend kapanışları:**
- [x] **Tarot (FAZ 21)**: 78 kart full set seed (181), `tarot_reading` LLM prompt (102),
      package.json export. Antigravity için görsel + storage brief atandı.
- [x] **Kahve falı (FAZ 22)**: Vision API call düzeltildi (önceden images param gönderilmiyordu);
      LLM provider URL image desteği (`buildAnthropicImagePart`); KB harmanlama + parse helper;
      package.json export.
- [x] **Rüya (FAZ 23)**: Controller TS fix; package.json export (dreams + numerology);
      duplicate 103 silindi (099 ile çakışıyordu).
- [x] **Yıldızname (FAZ 24)**: 187 SQL + 28 Ay Menzili seed; ebced.ts (TR fonetik);
      shared module (7 dosya); /yildizname endpoint'leri; **PREMIUM hibrit yorum**
      (`yildizname_chart_extra` prompt + endpoint + 50 kredi guard, Groq llama-4-scout).
- [x] **Sinastri (FAZ 25)**: package.json export, validation.ts, controller refactor
      (raw SQL chart fetch, LLM import path), **invite mode tamamlandı** (4 endpoint:
      create/list/accept/decline + push notification + Drizzle inviteStatus enum),
      **T25-3 pricing guard** manual mode'a entegre (subscription check + 250 kredi consume + 402).

**Reusable credits altyapısı:**
- [x] `packages/shared-backend/modules/credits/consume.ts` — `consumeCredits()` (atomik,
      idempotent reference_id ile) + `hasActiveSubscription()` helpers. Synastry + yıldızname
      (ve gelecek paywall'lar) bunu kullanır.

**geoserra LLM entegrasyonu (kullanıcı isteği — daha güncel kodlar transfer):**
- [x] **Provider'a Groq dispatch** (`chatGroq` helper) — OpenAI-compatible API
      (`https://api.groq.com/openai/v1/chat/completions`)
- [x] **JSON mode** desteği (`response_format: { type: 'json_object' }`) — vision çıktısını
      güvenli parse etmek için kritik
- [x] **Usage tracking** (`{ input, output }`) — Anthropic + OpenAI/Groq response'ları parse
- [x] **AbortSignal.timeout** 45 sn varsayılan
- [x] **GROQ_API_KEY** geoserra'dan transfer edildi (.env), `.env.example` güncel
- [x] llm_prompts ENUM ('groq' eklendi) + Drizzle schema + admin form dropdown
- [x] Yıldızname hibrit prompt'u Groq kullanıyor — düşük maliyet (~$0.001/rapor)

---

## FAZ 28 — Funnel + Reading History (Centralized) 🆕

> **Hedef:** Üye kullanıcıların tüm okumaları (tarot/kahve/rüya/sinastri/yıldızname/numeroloji) kayıtlı kalsın, dashboard'dan görsün/silsin. Her okuma sonu **merkezi funnel CTA** ile uygun kategorideki danışmana yönlendir. Canlı görüşmede danışman müşterinin son okumalarını görebilsin.

### T28-1 — Backend: Reading history aggregation + DELETE ✅
- [x] `GET /me/readings/recent?limit=10` — son 10 okuma (her tip için 1-2 satır snippet)
- [x] `DELETE /me/readings/:type/:id` — tek okuma silme (type ∈ tarot|coffee|dream|synastry|yildizname|numerology)
- [x] `DELETE /me/readings/all` — KVKK toplu silme (cooling-off yok, anlık)
- [x] Mevcut `/me/history` endpoint'i de snippet alanını döndürsün (preview için)
      `packages/shared-backend/modules/history` altında UNION aggregation + whitelist DELETE hazır.

### T28-2 — Frontend: Dashboard "Geçmiş Yorumlarım" tab ✅
- [x] Yeni tab `?tab=history` (mevcut overview/profile/bookings/security yanına)
- [x] Liste: kart-stil satırlar (icon + tip + tarih + 1 satır snippet + "Aç" + "Sil")
- [x] Filter chip'leri: Tümü / Tarot / Kahve / Rüya / Sinastri / Yıldızname / Numeroloji
- [x] "Aç" → mevcut detay sayfaları (`tarot/reading`, `kahve-fali/result`, `ruya-tabiri/result`,
      `sinastri/result`, `yildizname/result`; numeroloji için `/numeroloji` fallback)
- [x] "Sil" → AlertDialog confirm → DELETE çağrısı + listeden kaldır
- [x] Boş state: "Henüz kayıtlı yorumun yok"
- [x] Üst sağ: "Tümünü Sil" butonu (KVKK)

### T28-3 — `<ConsultantFunnelCTA>` merkezi component ✅
- [x] `frontend/src/components/common/ConsultantFunnelCTA.tsx`
- [x] Props: `feature`, `intensity` ('heavy'|'light'|'none'), `context?` (örn. `{menzil:'İkizler Eli'}`), `tier?` (auto)
- [x] Tier-aware copy:
  - Misafir: "Üye ol → ilk yorum %50"
  - Free üye: "Profesyonel astrolog ile derin analiz"
  - Premium üye: ince link "Danışmanla görüş"
- [x] CTA → `/consultants?topic={feature}&context={JSON}`
- [x] `funnel.config.ts` — feature → topic + headline + expertise defaults

### T28-4 — `/consultants?topic=` URL filter (Frontend) ✅
- [x] `topic` oku → expertise mapping (tarot→tarot, yildizname→astrology, sinastri→relationship, kahve→tarot, ruya→mood, numeroloji→astrology)
- [x] List API'ye `?expertise={mapped}` geçir (backend zaten destekliyor)
- [x] Headline: "Tarot uzmanları" / "İlişki astrolojisi uzmanları" — topic'e göre dinamik
- [x] "Tüm danışmanlar" reset butonu

### T28-5 — Funnel'ı 6 okuma sayfasına entegre ✅
- [x] Yıldızname result: ad-hoc CTA → `<ConsultantFunnelCTA feature="yildizname" intensity="heavy" context={menzil}/>`
- [x] Tarot result: aynı pattern
- [x] Kahve result, Rüya result, Sinastri result, Numeroloji result: aynı
- [x] Tutarlı görünüm + tek satır kod

### T28-6 — Consultant: live-session'da müşteri history paneli (backend ✅, UI Antigravity)
- [x] Backend: `GET /admin/consultants/sessions/:bookingId/user-readings` — danışman role + booking sahibi olduğunda müşterinin son 10 okumasını döner (snippet + tarih + tip)
- [x] Doc: `doc/antigravity-consultant-call-history-brief.md` — call UI'sına sağ panel ekleme (Antigravity)
- [x] Frontend (web call sayfası varsa) panel: collapsible "{Müşteri Adı} okumaları" kartı

---

## FAZ 29 — Çoklu Hizmet Paketi + Anlık Görüşme + Direkt Mesajlaşma 🆕

> **Hedef:** AdviceMy benzeri çoklu hizmet seçimi (her danışman birden fazla paket sunar; ücretsiz tanışma + ücretli paketler), "Hemen Şimdi" görüşme talebi danışman onaylı + müşteri↔danışman direkt mesajlaşma (uyarı banner ile).
>
> **Referans UI:** `https://www.advicemy.com/danisman/fatma-guclu` — sol avatar + ⭐ + "Mesaj Gönder", sağ hizmet listesi (her satır expand → "Randevu Al"), ücretsiz "Birbirimizi tanıyalım" en üstte.

### T29-1 — Backend: `consultant_services` tablosu
- [ ] SQL: `consultant_services` (id, consultant_id FK, name, slug, description, duration_minutes, price DECIMAL, currency, is_free TINYINT, sort_order, is_active)
- [ ] Drizzle schema + repository
- [ ] Public endpoint: `GET /consultants/:id/services` → aktif paket listesi
- [ ] Admin CRUD: `/admin/consultants/:id/services`
- [ ] **Self-service** endpoint (FAZ 30 ile): danışman kendi servislerini panelinden ekler/düzenler — `POST/PATCH/DELETE /me/consultant/services`
- [ ] **Ücretsiz ön görüşme akışı:** `is_free=1` seçilen serviste:
  - Booking flow ödeme adımını atlar (Iyzico init çağırılmaz)
  - Booking direkt `confirmed` olur, ücret kaydı yok
  - Wallet'a kazanç eklenmez
  - Süre kısa (genelde 15-25 dk) — danışman kendisi belirler
  - Frontend "Ücretsiz" yeşil badge + "Tanışma Görüşmesi" başlık
- [ ] Seed: Fatma için 5 paket (Birbirimizi tanıyalım — ücretsiz 15dk, Horary 20dk 750₺, Rektifikasyon 60dk 2500₺, İlişki 60dk 2500₺, Genel Doğum Haritası 90dk 3500₺)

### T29-2 — Frontend: ConsultantDetail çoklu hizmet UI
- [ ] AdviceMy stilinde sağ panel: hizmet kartları (collapse/expand), her satır "Randevu Al" butonu
- [ ] Ücretsiz hizmet vurgu (yeşil "Ücretsiz" badge)
- [ ] Hizmet seçimi → BookingFlow `?serviceId=...` query ile başlar
- [ ] Slot picker seçilen hizmetin `duration_minutes`'ını kullanır

### T29-3 — Frontend: Sol panelde "Mesaj Gönder" butonu
- [ ] Avatar altında: ⭐ rating + total review + "Mesaj Gönder" button (red/brand color)
- [ ] Tıklayınca chat modal açılır → mevcut chat modülü ile thread (`context_type='consultant_lead'`, `context_id=consultantId`)
- [ ] Modal üstünde **uyarı banner**: "⚠️ Bu alan kısa notlar/sorular içindir. Uzun sohbet için canlı görüşme alın. Aşırı kullanım otomatik kapatılabilir."

### T29-4 — Backend + Frontend: "Hemen Şimdi Görüşme Talep Et"
- [ ] Bookings status'una `requested_now` ENUM/string ekle (VARCHAR(24) zaten esnek)
- [ ] Endpoint: `POST /bookings/request-now` body=`{consultantId, serviceId?, customerNote}` → booking INSERT (date=today, time=now, status='requested_now')
- [ ] Notify danışmana: FCM push + dashboard "Bekleyen Anlık Talepler" kartı + email
- [ ] Danışman dashboard: bekleyen talepler listesi → **Onayla / Reddet** butonları
- [ ] Onay → status='confirmed' + müşteriye notify + ikisine call link
- [ ] Red → müşteriye notify, booking iptali
- [ ] Cron `request-now-timeout`: 5 dk içinde cevap yoksa otomatik iptal + müşteriye notify
- [ ] ConsultantDetail'de **"Hemen Görüşme Talep Et"** butonu (slot picker üzerinde)

### T29-5 — Booking-bağlı mesajlaşma
- [ ] Booking detail sayfasında "Mesaj Gönder" → chat thread (`context_type='booking'`, `context_id=bookingId`)
- [ ] Müşteri ↔ danışman async mesajlaşma (görüşme öncesi/sonrası notlar)
- [ ] Aynı uyarı banner'ı

### T29-6 — Sohbet uyarı banner'ı (cross-cutting)
- [ ] `<ChatWarningBanner>` component (T29-3 + T29-5'te kullanılır)
- [ ] Locale-aware: tr/en/de
- [ ] Otomatik kapatma policy yazısı (gelecek faz: rate limit + admin moderation)



## FAZ 30 — Danışman Dashboard (Self-Service Panel) 🆕

> **Hedef:** Danışman, admin paneline gerek kalmadan kendi profilini, hizmetlerini, randevularını, gelen mesajlarını ve kazancını yönetebilsin. AdviceMy/Therapy.com benzeri "consultant workspace".
>
> **Konum:** `/{locale}/me/consultant/...` rotaları (giriş yapmış consultant rolü gereken). Mevcut user dashboard'a (`/dashboard`) yeni "Danışman" sekmesi olarak eklenebilir veya ayrı route grubu — karar T30-1'de.

### T30-0 — Karar: rota yapısı
- [ ] Karar: `/dashboard?tab=consultant` mı yoksa `/me/consultant/*` ayrı rota grubu mu?
- [ ] Auth guard: sadece `roles.includes('consultant')` olanlar erişebilir; user role'lü erişirse "Danışman olmak için başvur" CTA → `/become-consultant`

### T30-1 — Backend: self-service consultant endpoint'leri
- [ ] `GET /me/consultant` — kendi consultant kaydı + tüm alanlar (bio, expertise, languages, supports_video, social links)
- [ ] `PATCH /me/consultant` — bio, expertise, languages, hakkımda, fotoğraf, görüşme platformları (WhatsApp/Skype/Zoom/Meet)
- [ ] `GET/POST/PATCH/DELETE /me/consultant/services` — kendi servislerini CRUD
- [ ] `GET /me/consultant/availability` + `PATCH` — kendi çalışma saatlerini ayarla (mevcut availability modülü zaten var, danışman tarafına proxy)
- [ ] `GET /me/consultant/bookings` — kendi randevuları (filter: pending / confirmed / completed / cancelled)
- [ ] `POST /me/consultant/bookings/:id/approve` — beklemedeki randevuyu onayla
- [ ] `POST /me/consultant/bookings/:id/reject` — sebep ile reddet
- [ ] `GET /me/consultant/messages` — gelen lead mesajları (T29-3'teki `consultant_lead` thread'leri)
- [ ] `GET /me/consultant/wallet` — bakiye + transactions (mevcut wallet modülü, consultant filter)
- [ ] `POST /me/consultant/wallet/withdraw` — para çekme talebi (admin onaylı)
- [ ] `GET /me/consultant/reviews` — gelen yorumlar + cevaplama (T17-2 consultant_reply zaten var, panele bağla)
- [ ] `GET /me/consultant/stats` — bu ay seans sayısı, ortalama rating, toplam kazanç, yanıt süresi
- [ ] Tümü `requireAuth + requireConsultant` middleware (yeni middleware: `requireConsultant`)

### T30-2 — Danışman Profil Sekmesi UI
- [ ] `/me/consultant/profile` — bio (rich text textarea), uzmanlık alanları (multi-select chip), diller (multi-select)
- [ ] Avatar yükleme (mevcut storage upload — bucket='consultant_avatars')
- [ ] Görüşme platformları (WhatsApp, Skype, Zoom, Meet, Microsoft Teams) — checkbox listesi → JSON kayıt
- [ ] Sosyal linkler (Instagram, LinkedIn, opsiyonel website)
- [ ] Live preview: değişiklikler "Bu danışmanı müşteri böyle görür" küçük kartta gösterilir
- [ ] Kaydet butonu → `PATCH /me/consultant`

### T30-3 — Hizmet Yönetimi Sekmesi UI
- [ ] `/me/consultant/services` — tablo: ad, süre, fiyat, ücretsiz, aktif, sıra
- [ ] Yeni servis ekle modal: name, description, duration_minutes, price, currency, is_free toggle, is_active toggle
- [ ] Drag-drop sıralama (admin home-layout pattern'ı)
- [ ] Mevcut servisi düzenle/sil
- [ ] Ücretsiz servisin fiyatı disabled görünür (otomatik 0)
- [ ] Validation: en az 1 aktif servis olmalı (silme uyarısı)

### T30-4 — Müsaitlik (Availability) Sekmesi UI
- [ ] `/me/consultant/availability` — haftalık takvim grid (Pzt-Paz × 09:00-22:00)
- [ ] Drag-to-select slot ekle/kaldır
- [ ] Quick toggle: "Pazartesi-Cuma 10:00-18:00" preset
- [ ] Tatil günleri: tek seferlik gün kapatma (özel tarih → tüm slotlar pasif)
- [ ] **Müsaitlik durumu toggle (üstte)**: "Şu an çevrimiçi miyim?" → `consultants.is_available` 1/0 (anlık talepler için)
- [ ] Save → `PATCH /me/consultant/availability`

### T30-5 — Randevular Sekmesi UI
- [ ] `/me/consultant/bookings` — tabs: Bekleyen / Onaylı / Tamamlanan / İptal
- [ ] Her satır: müşteri adı + foto, tarih/saat, servis, fiyat, müşteri notu
- [ ] Bekleyen → "Onayla" / "Reddet" butonları (red → modal: sebep iste)
- [ ] **Bekleyen Anlık Talepler** ayrı vurgulu kart (T29-4) — 5 dk countdown
- [ ] Onaylı booking → "Görüşmeyi Başlat" butonu (LiveKit room link)
- [ ] Tamamlanan booking → "Notlar Ekle" (seans sonrası özel not — sadece danışman görür)
- [ ] İptal et (con. başlatıyorsa sebep zorunlu)

### T30-6 — Mesajlar Sekmesi UI
- [ ] `/me/consultant/messages` — sol: thread listesi (lead mesajları + booking mesajları), sağ: aktif sohbet
- [ ] Müşteri kartı: ad + foto + son mesaj preview + okunmamış badge
- [ ] Cevapla input + dosya ekleme (storage upload)
- [ ] Üstte aynı **uyarı banner** (T29-6): "Uzun konuşma için randevu önerin"
- [ ] Mesaj typing indicator (chat modülü zaten WS destekli mi bak)

### T30-7 — Cüzdan & Kazanç Sekmesi UI
- [ ] `/me/consultant/wallet` — büyük balance göstergesi (gold)
- [ ] Bu ay / geçen ay / toplam kazanç kartları
- [ ] Transactions tablosu: tarih, tip (booking_payout / withdrawal / refund), tutar, durum
- [ ] **Para Çek** butonu → modal: tutar + IBAN (varsa pre-fill) + onay → `POST /me/consultant/wallet/withdraw`
- [ ] Bekleyen withdrawal'lar listede pending status
- [ ] Banka hesabı yönetimi (IBAN, banka adı, hesap sahibi) — settings altında

### T30-8 — Yorumlar & Cevaplar Sekmesi UI
- [ ] `/me/consultant/reviews` — yorum listesi (T17 schema zaten var)
- [ ] Her yoruma cevap yaz (`consultant_reply` field — T17-2)
- [ ] Filter: cevaplanmış / cevaplanmamış / 1-2 yıldız / 4-5 yıldız
- [ ] Düşük puanlı yoruma önce cevap önerisi (kibar template)

### T30-9 — Stats / İstatistik Dashboard (üst overview)
- [ ] `/me/consultant` ana sayfası — hızlı bakış kartları:
  - Bu ay seans sayısı + geçen ay karşılaştırma (% delta)
  - Ortalama rating (son 30 gün)
  - Toplam kazanç (bu ay)
  - Yanıt süresi (mesajlara ortalama yanıt — chat thread'lerden hesaplanır)
  - Bekleyen randevu sayısı + bekleyen mesaj sayısı (action items)
- [ ] Son 7 günün seans grafiği (basit bar chart)
- [ ] Hızlı eylem butonları: Hizmet Ekle, Müsaitlik Düzenle, Mesajları Gör

### T30-10 — Sidebar / Navigation
- [ ] Frontend layout: consultant role'lü kullanıcı login olunca header'a "Danışman Paneli" linki ekle
- [ ] Veya `/dashboard` içinde tab grubu: "Müşteri Görünümü" / "Danışman Görünümü" toggle (kullanıcı hem user hem consultant olabilir)

### T30-11 — "Danışman Ol" başvuru akışı (opsiyonel)
- [ ] `/become-consultant` — başvuru formu (bio, expertise, kimlik, sertifika upload)
- [ ] Admin panele başvuru notification: pending consultant approve/reject
- [ ] Onaylanan kullanıcının role'üne `consultant` eklenir + email bilgilendirme
