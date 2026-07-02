# Admin Panel — Dil Desteği & Banner Görselleri — Codex Çeklisti (2026-07-02)

> ✅ **DURUM: TAMAMLANDI & DEPLOY EDİLDİ (prod HEAD ba53bf8).**
> T1 (banner görsel/resolvePublicAsset), T3 (banner form tr/en/de), T4 (banner de kolon + fallback + prod ALTER) → Claude Code uyguladı & deploy etti.
> T2 (blog dil seçici) → Codex, `AdminLocaleSelect + useAdminLocales` ile tamamladı. Dört madde de canlı kodda doğrulandı.


> Claude Code (mimar) hazırladı, **Codex uygular**. Kullanıcı geri bildirimi:
> `/admin/blog` ve `/admin/banners` dil destekli içerik göstermeli; dil seçimi tek ortak
> dosyadan gelmeli; banner görselleri kırık (`/banners/*.svg` 404).
>
> ✅ AI18N-T2 (blog) SEO kolonu işinden sonra tamamlandı; aynı dosyada ortak
> içerik-locale seçici kullanılıyor. Diğer görevler de canlıda doğrulandı.

---

## 0. Durum tespiti (Claude incelemesi — okumadan başlama)

**"Dil seçimi tek dosya" ZATEN VAR** — yeni dosya oluşturma, mevcutları kullan:
- **UI dili:** `admin_panel/src/i18n/LocaleProvider.tsx` → `useLocaleContext()` (`t`, `locale`). Tüm admin UI metinleri bundan.
- **İçerik-locale seçimi (tr/en/de içerik):** `admin_panel/src/app/(main)/admin/_components/common/AdminLocaleSelect.tsx` (kanonik, 140 satır) + `useAdminLocales.ts` (site_settings.app_locales + default_locale'ten besleniyor, statik map yok). `admin_panel/src/components/common/AdminLocaleSelect.tsx` bunu re-export eden 6 satırlık shim — dokunma.
- **Kural:** her admin liste/edit sayfası içerik-locale seçimi için **AdminLocaleSelect + useAdminLocales**'i kullanır; kendi locale dropdown'ını yazmaz.

**Mevcut kullanım:**
- `admin-blog-client.tsx` → `useLocaleContext` + local `locale` state + `useListCustomPagesAdminQuery({locale})` var; ama görünür bir **içerik-locale seçici (AdminLocaleSelect) render EDİLMİYOR** → kullanıcı dili değiştiremiyor (hep 'tr').
- `admin-banners-client.tsx` → **hiç locale kullanmıyor**; sadece `title_tr` gösteriyor; görsel `<img src={item.image_url}>` ham path.

---

## AI18N-T1 — Banner görselleri kırık (404) 🔴 (bağımsız, hemen)
- **Durum:** ✅ TAMAMLANDI & DEPLOY EDİLDİ.
- **Dosya:** `admin_panel/src/app/(main)/admin/(admin)/banners/_components/admin-banners-client.tsx:129-131` (+ `banners/[id]/page.tsx`, `banners/new/page.tsx` önizlemeleri)
- **Kök neden:** `image_url` seed'de frontend-relative (`/banners/launch.svg` vb. — `160_banners_schema.sql`). SVG'ler yalnız `frontend/public/banners/`'da var (goldmoodastro.com/banners/launch.svg → **200**). Admin `<img src="/banners/launch.svg">` render edince admin domainine çözülüp **404**.
- **Fix:** relative image_url'i storefront origin'e çöz. Helper ekle:
  ```ts
  // src/lib/resolvePublicAsset.ts
  const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://goldmoodastro.com';
  export function resolvePublicAsset(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return `${STOREFRONT.replace(/\/$/,'')}/${url.replace(/^\//,'')}`;
  }
  ```
  - `.env` + `.env.example`'a `NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3095` (prod: `https://goldmoodastro.com`) ekle.
  - Banner list/detay/new'de `<img src={resolvePublicAsset(item.image_url)}>` kullan.
- **Kabul:** admin banner önizlemeleri görseli gösterir (404 yok); mutlak URL'ler bozulmadan geçer.
- **(Öneri, opsiyonel):** uzun vadede banner görselleri storage'a upload edilip **mutlak URL** saklanmalı; seed placeholder'ları da mutlak URL olmalı. Şimdilik resolve helper yeterli.

## AI18N-T2 — Admin blog dil desteği görünür seçici 🟠 (SEO kolonu İŞİNDEN SONRA)
- **Durum:** ✅ TAMAMLANDI & DEPLOY EDİLDİ (`ba53bf8`) — blog listesi ortak `AdminLocaleSelect + useAdminLocales` kullanıyor.
- **Dosya:** `admin_panel/src/app/(main)/admin/(admin)/blog/_components/admin-blog-client.tsx`
- **Önceki durum:** locale state + query bağı vardı; eksik olan görünür seçiciydi.
- **Fix:** liste başlığına `<AdminLocaleSelect value={locale} onChange={setLocale} />` (useAdminLocales'ten opsiyonlar). Seçim değişince `useListCustomPagesAdminQuery({locale})` zaten yeniden çeker (repo i18n'i locale'e göre merge ediyor: `customPages/repository.ts` buildMerged). Edit sayfasında (`blog/[id]`) her locale için title/slug/content/summary/meta_title/meta_description ayrı düzenlenebilsin (i18n satırı locale bazlı upsert).
- **Kabul:** admin blog listesinde dil değiştirince içerik o dilde görünür; edit'te tr/en/de ayrı doldurulabilir.

## AI18N-T3 — Admin banners dil desteği 🟠 (bağımsız)
- **Durum:** ✅ TAMAMLANDI & DEPLOY EDİLDİ.
- **Dosya:** `admin_banners-client.tsx` + `banners/[id]/page.tsx` + `banners/new/page.tsx`
- **Şema:** `banners` tablosu `title_tr/title_en, subtitle_tr/subtitle_en, cta_label_tr/cta_label_en` (**de YOK**) + ayrı `banner_i18n` tablosu (locale, title, subtitle, cta_label — tüm diller için). `locale` kolonu placement locale'i ('*'/tr/en/de).
- **Fix:**
  - Liste + detaya `AdminLocaleSelect` ekle; seçili locale'e göre başlık/alt başlık/CTA göster (öncelik: `banner_i18n[locale]` → yoksa `title_tr/title_en` fallback).
  - Edit formu locale bazlı düzenleme: seçili dilde title/subtitle/cta → `banner_i18n` upsert.
- **Kabul:** banner listesi/düzenlemesi tr/en/de içerik gösterir/düzenler; `useLocaleContext`/`AdminLocaleSelect` ortak kaynağı kullanılır (kendi dropdown yok).

## AI18N-T4 — Banner i18n şema tutarlılığı 🟡 (karar + backend)
- **Durum:** ✅ TAMAMLANDI & DEPLOY EDİLDİ.
- **Sorun:** `banners` base tabloda yalnız `_tr/_en`; `_de` yok. `banner_i18n` tablosu tüm dilleri destekliyor ama base kolonlarla çift kaynak.
- **Fix (öneri):** `banner_i18n`'i **kanonik çok-dilli kaynak** yap (tr/en/de dahil); base `_tr/_en` kolonları geriye-uyum fallback olarak kalsın. Admin edit yalnız `banner_i18n`'e yazsın; public banner controller `banner_i18n[locale] → base fallback` okusun. (Alternatif: base tabloya `_de` kolonları ekle — daha çok kopya, önerilmez.)
- **Prod:** `banner_i18n` zaten var mı kontrol (seed 160). Yeni kolon eklenmiyorsa ALTER gerekmez.
- **Kabul:** banner çok-dilli içerik tek kaynaktan (banner_i18n) okunur/yazılır.

---

## Uygulama sırası (Codex)
1. **AI18N-T1** (banner görsel — bağımsız, hızlı, görünür kazanç).
2. **AI18N-T3 + T4** (banner i18n — bağımsız).
3. **AI18N-T2** (blog seçici — SEO kolonu commit'inden sonra, aynı dosya).
4. typecheck (admin_panel) → commit → deploy.

## Kilit dosyalar
| İş | Yol |
|----|-----|
| Ortak UI dil kaynağı | `admin_panel/src/i18n/LocaleProvider.tsx` (`useLocaleContext`) |
| Ortak içerik-locale seçici | `admin_panel/src/app/(main)/admin/_components/common/AdminLocaleSelect.tsx` + `useAdminLocales.ts` |
| Banner client | `admin_panel/src/app/(main)/admin/(admin)/banners/_components/admin-banners-client.tsx` (+ `[id]`, `new`) |
| Blog client | `admin_panel/src/app/(main)/admin/(admin)/blog/_components/admin-blog-client.tsx` |
| Banner şema/seed | `backend/src/db/sql/160_banners_schema.sql` (banners + banner_i18n) |
| Banner modülü | `packages/shared-backend/modules/banners/{controller,schema,router}.ts` |
| Görsel kaynağı | `frontend/public/banners/*.svg` (mevcut; admin storefront origin ile çözecek) |
