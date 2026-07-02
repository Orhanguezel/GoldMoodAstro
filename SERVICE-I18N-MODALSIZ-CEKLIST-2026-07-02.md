# Hizmet Kategorileri + Şablonları → Çok Dilli + Modalsız — Çeklist (2026-07-02)

> **Amaç:** `/admin/service-categories` ve `/admin/service-templates` diğer içerikler (blog/landing) gibi
> **çok dilli (tr/en/de)** düzenlenebilsin ve **modal yerine sayfa-içi (inline) form** kullansın.
>
> **Mevcut durum:** İkisi de tek-dilli (`name`, `description` doğrudan ana tabloda), admin formu **modal (Dialog)**.
> **Hedef:** `name` + `description` locale bazlı; diğer alanlar (slug, icon, price, duration, media_type, is_free,
> sort_order, is_active) dil-bağımsız kalır. Mirror: `custom_pages_i18n` deseni + `AdminLocaleSelect`.
>
> **Kesin kurallar:** ALTER YASAK → yeni i18n tabloları `CREATE TABLE IF NOT EXISTS` seed'e eklenir (additive, prod'da
> deploy'un `db:seed:nodrop`'u oluşturur). Fiyat/süre/medya alanları KORUNUR. Mevcut TR veriler i18n'e migrate edilir.
> Public endpoint (`GET /service-categories`) locale destekli olur ama geriye dönük uyumlu (locale yoksa tr).

---

## Veri modeli kararı

**Ayrı i18n tabloları** (custom_pages_i18n mirror), JSON kolon DEĞİL — "diğer içerikler gibi" olması için.

```sql
-- service_categories_i18n
id CHAR(36) PK, category_id CHAR(36) FK→service_categories.id ON DELETE CASCADE,
locale CHAR(8), name VARCHAR(120) NOT NULL, description TEXT,
UNIQUE(category_id, locale)

-- service_templates_i18n
id CHAR(36) PK, template_id CHAR(36) FK→service_templates.id ON DELETE CASCADE,
locale CHAR(8), name VARCHAR(160) NOT NULL, description TEXT,
UNIQUE(template_id, locale)
```
> Ana tablodaki `name`/`description` kolonları **kalır** (fallback + geriye uyum). i18n row varsa o kullanılır,
> yoksa ana tablodaki değere düşülür (repository merge). Böylece mevcut kod kırılmaz.

---

## FAZ 1 — Backend i18n (serviceCategories)

### [x] SVC-T1 — Şema + seed (service_categories_i18n) 🔴
- **Codex notu (2026-07-02):** `032e_service_categories_i18n_schema.sql` eklendi; tablo + unique/index + mevcut TR kategori verisini deterministik id ile migrate eden `INSERT IGNORE ... SELECT` hazırlandı. Drizzle `serviceCategoriesI18n` eklendi.
- **Yeni dosya:** `backend/src/db/sql/032c_service_categories_i18n_schema.sql`
  - `CREATE TABLE IF NOT EXISTS service_categories_i18n (...)` + UNIQUE(category_id, locale) + index.
  - **Migrate:** mevcut her `service_categories` satırı için `INSERT IGNORE ... SELECT id, 'tr', name, description FROM service_categories` (tr i18n row üret). Deterministik id: `MD5(CONCAT(id,'|tr'))`.
- **schema.ts:** `serviceCategoriesI18n` mysqlTable ekle; type export.
- **Prod:** additive (yeni tablo), `db:seed:nodrop` oluşturur + tr migrate eder.
- **Kabul:** `SELECT COUNT(*) FROM service_categories_i18n WHERE locale='tr'` = kategori sayısı.

### [x] SVC-T2 — Repository merge (serviceCategories) 🔴
- **Codex notu (2026-07-02):** Public liste locale fallback merge ediyor; admin liste/detay `i18n` map döndürüyor. Create/update ana tablo fallback alanlarını koruyup i18n upsert yapıyor.
- **repository.ts:** `custom_pages` deseni mirror:
  - `list({ locale?, defaultLocale?, activeOnly? })`: parent + i18n join, locale row pick + fallback (i18n yoksa parent.name).
  - `getById(id, locale?)`: parent + tüm i18n → merged (tüm locale'leri döndür veya seçili locale).
  - `create(data, i18n: {locale,name,description}[])`: parent insert + i18n rows insert.
  - `update(id, patch, i18n?)`: parent patch (dil-bağımsız alanlar) + i18n upsert (varsa update, yoksa insert).
- **Not:** admin get, TÜM locale'lerin name/description'ını döndürmeli (form tüm dilleri göstersin) — custom_pages gibi tek-locale merge YERİNE `i18n: {tr:{...}, en:{...}, de:{...}}` map döndürmek admin için daha pratik. Public list ise tek locale merge.
- **Kabul:** admin get 3 dili, public list seçili locale'i döndürür.

### [x] SVC-T3 — Controller + validation (serviceCategories) 🟠
- **Codex notu (2026-07-02):** Body `i18n` map kabul ediyor; geriye uyum için `name/description` TR fallback olarak kalıyor. Public `?locale=` destekli.
- **validation.ts:** body'ye `i18n` array/map ekle: `[{locale, name, description}]`. `name` locale başına zorunlu (en az tr). Dil-bağımsız alanlar (slug/icon/sort_order/is_active) aynı kalır.
- **controller.ts:** `createAdmin`/`updateAdmin` i18n'i repo'ya geçir. `listPublic(locale)` query'den locale al. `getAdmin` tüm dilleri döndür.
- **Kabul:** POST/PATCH i18n ile çalışır; public GET `?locale=en` İngilizce name döndürür.

## FAZ 2 — Backend i18n (serviceTemplates)

### [x] SVC-T4 — Şema + seed (service_templates_i18n) 🔴
- **Codex notu (2026-07-02):** `032f_service_templates_i18n_schema.sql` eklendi; mevcut şablonların TR içerikleri i18n tabloya migrate ediliyor. Drizzle `serviceTemplatesI18n` eklendi.
- **Yeni dosya:** `backend/src/db/sql/032d_service_templates_i18n_schema.sql` (SVC-T1 ile aynı desen, template_id).
- Mevcut satırları tr'ye migrate et.
- **schema.ts:** `serviceTemplatesI18n` tablo + type.

### [x] SVC-T5 — Repository + controller + validation (serviceTemplates) 🔴
- **Codex notu (2026-07-02):** Template repository/controller `i18n` map destekli hale geldi; category/slug/duration/price/currency/media/free/sort/active alanları dil bağımsız kaldı, fiyat validasyonu korundu.
- SVC-T2/T3 ile aynı desen. **DİKKAT:** dil-bağımsız alanlar KORUNUR: `category_slug, slug, duration_minutes, price, currency, media_type, is_free, sort_order, is_active` + `normalizeTemplatePayload` (price format) + `validatePaidServicePrice` (ücretsiz değilse price>0). Sadece `name`/`description` i18n'e taşınır.
- **Kabul:** fiyat/süre/medya mantığı bozulmadan name/description çok dilli.

## FAZ 3 — Admin RTK katmanı

### [x] SVC-T6 — RTK endpoints locale + i18n 🟠
- **Codex notu (2026-07-02):** Admin category/template DTO ve endpointleri `i18n` map destekli hale geldi; response unwrap `{data}`/array uyumlu. Public service categories hook'u locale param alabiliyor.
- `integrations/endpoints/admin/service_categories_admin.endpoints.ts` + `service_templates_admin.endpoints.ts`:
  - list query'ye `locale` param; get response'una `i18n` map; create/update body'ye `i18n`.
  - transformResponse zarf unwrap ({data}/{items}) kontrol ([[rtk_envelope_unwrap_pattern]]).
- `integrations/shared/*.types.ts`: `i18n` alanları + tipler.
- **Kabul:** hook'lar i18n döndürür/kabul eder.

## FAZ 4 — Admin UI (modalsız + locale seçici)

### [x] SVC-T7 — service-categories-client: modalsız + i18n 🟠
- **Codex notu (2026-07-02):** Dialog kaldırıldı; liste altında inline form paneli, `AdminLocaleSelect`, locale bazlı name/description ve tek kaydet akışı eklendi.
- `service-categories-client.tsx` **Dialog KALDIR** → sayfa-içi inline form (liste + seçince altında/yanında form paneli; blog ContentModuleClient inline deseni gibi).
- `AdminLocaleSelect` + `useAdminLocales` ekle: locale seçilince `name`/`description` o dilin değerini gösterir/düzenler; slug/icon/sort/active dil-bağımsız tek yerde.
- Kaydet: tüm dillerin name/description'ı tek POST/PATCH'te `i18n` olarak gider (veya locale başına). En pratiği: formda 3 dil sekmesi/alanı, tek kaydet.
- **Kabul:** modalsız, tr/en/de düzenlenebilir, kaydedince kalıcı.

### [x] SVC-T8 — service-templates-client: modalsız + i18n 🟠
- **Codex notu (2026-07-02):** Dialog kaldırıldı; inline form paneli ve locale bazlı name/description eklendi. Kategori, süre, fiyat, currency, medya tipi, ücretsiz ve aktiflik alanları korundu.
- SVC-T7 ile aynı. **Fiyat/süre/currency/media_type/is_free/kategori** alanları formda KALIR (dil-bağımsız). name/description locale bazlı.
- **Kabul:** modalsız; fiyat/süre çalışır; name/description çok dilli.

## FAZ 5 — Deploy & doğrula

### [x] SVC-T9 — typecheck + deploy + migrate 🔴
- **Codex notu (2026-07-02):** Backend/admin/frontend typecheck ve build geçti. Canlıya rsync ile dağıtıldı; prod `db:seed:nodrop` çalıştı, backend/admin/frontend PM2 reload edildi. Doğrulama: `/admin/service-categories` ve `/admin/service-templates` HTTP 200; `service_categories_i18n` tr/en/de = 17/17/17, `service_templates_i18n` tr = 37; public `GET /api/service-categories?locale=en/de` çevrilmiş isim döndürüyor.
- backend + admin `typecheck`/`build`. commit → git-deploy (⚠️ tek deploy, çakışma yok).
- Prod: i18n tabloları oluşur + tr migrate; `/admin/service-categories` + `/admin/service-templates` 200, modalsız, dil seçici çalışır; public `GET /service-categories?locale=en` İngilizce döndürür.
- **Kabul:** iki sayfa da diğer içerikler gibi çok dilli + modalsız + düzenlenebilir.

---

## Dokunulacak dosyalar (özet)
| Katman | serviceCategories | serviceTemplates |
|--------|-------------------|------------------|
| schema.ts | +i18n tablo | +i18n tablo |
| repository.ts | merge (custom_pages mirror) | merge |
| controller.ts | locale + i18n | locale + i18n |
| validation.ts | +i18n | +i18n (price/duration korunur) |
| seed sql | 032c (yeni) | 032d (yeni) |
| RTK endpoint | locale+i18n | locale+i18n |
| admin client | modalsız+i18n | modalsız+i18n |

## Mirror referansları
- Backend i18n: `packages/shared-backend/modules/customPages/{schema,repository,controller,validation}.ts`
- Admin inline+locale: `admin_panel/src/app/(main)/admin/_components/common/ContentModuleClient.tsx` + `AdminLocaleSelect.tsx` + `useAdminLocales`
- Seed i18n örnek: `backend/src/db/sql/197_custom_pages_schema.sql`
