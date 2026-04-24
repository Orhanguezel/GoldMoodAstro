Süper—elindeki iskelet çok iyi. Aşağıya “Toronto backend” için net, uygulanabilir bir **yol haritası** bıraktım. Standart olarak verdiğin `faqs` modülünün aynısını çoğaltacağız ama bu kez **çok-dilli veri (i18n)** yapısı olan modüller için parent + i18n child tablo deseni kullanacağız. Backend dili **İngilizce**, veri **çok-dilli**, slug’lar da **locale-bazlı** olacak.

---

# Yol Haritası (Sprint’lere bölünmüş)

## 0) Altyapı & Config (tek seferlik)

* **tsconfig.json**: `paths` alias (`@/*`), `moduleResolution: bundler`, `strict: true`, `target: ES2022`, `types: ["bun-types"]`.
* **package.json**: Fastify v5, Drizzle + mysql2/promise, Zod, @fastify/* eklentileri, `drizzle-kit`, `tsx`, `dotenv`, `pm2`.
* **bunfig.toml**: tsx runner, path alias uyumu.
* **Dockerfile + docker-compose.yml**: MySQL 8 + API servisi; `healthcheck` ve `DATABASE_URL`/env wiring.
* **scripts/**:

  * `drizzle.config.ts`
  * `migrate.ts`, `seed.ts`, `fix-esm-extensions.mjs` (zaten varsa koru)
* **core/env.ts**: mevcut; ekle:

  * `DEFAULT_LOCALE = process.env.DEFAULT_LOCALE ?? "tr"`
  * `SUPPORTED_LOCALES = (process.env.SUPPORTED_LOCALES ?? "tr,en,de").split(",")`
* **core/i18n.ts** (yeni):

  * `resolveLocale(req)` : `?locale`, `x-locale`, `Accept-Language` -> SUPPORTED_LOCALES’e göre en iyi eşleşme
  * `fallbackChain(locale): string[]` : ör. `["tr","en","de"]` veya `["en","tr","de"]`
* **common/middlewares/locale.ts** (yeni): `req.locale` ve `req.localeFallbacks` set et.
* **auth**: tek bir `requireAdmin` sürümünü bırak, yineleneni kaldır; `JwtUser` tipini `declare module "fastify"` ile `FastifyRequest.user` deklarasyonuna ekleyebilirsin.

## 1) i18n Veri Deseni (parent + i18n child)

> **Kural:** Localize edilecek her modül 2 tablo:

* **Parent**: dil-bağımsız alanlar (id, flags, görseller, fiyat vs.)
* **Child**: `*_i18n` – `(id, parent_id, locale, title, slug, summary, body, seo_*)`
* **Indexler:**

  * `unique (parent_id, locale)`
  * `unique (locale, slug)`  → slug çakışmasını **locale** içinde önler
  * list/arama için `is_active`, `display_order`, `created_at`
* **API sözleşmesi (public):**

  * `GET /module?locale=tr&...` → join + **coalesce** ile `requested OR default` döndür
  * `GET /module/by-slug/:slug?locale=tr` → önce `locale`, yoksa `DEFAULT_LOCALE`
* **API sözleşmesi (admin):**

  * Parent CRUD + i18n satırları için ayrı uçlar:

    * `POST /admin/module` (parent create)
    * `POST /admin/module/:id/i18n` (çeviri ekle/güncelle)
    * `PATCH /admin/module/:id` (parent patch)
    * `DELETE /admin/module/:id` (sil + cascade i18n)

> **COALESCE pattern (Drizzle/MySQL):**
> İki alias ile join: `i18n_req` (req.locale) ve `i18n_def` (DEFAULT_LOCALE).
> Seçimde `COALESCE(i18n_req.title, i18n_def.title)` vs.
> Bunu Drizzle’da `alias()` + `sql` seçicileriyle çözüyoruz.

## 2) Ortak Query Sözleşmesi

Tüm modüller (public/admin) aynı query param’ları destekler:

* `order=col.asc|desc` **veya** `sort=created_at|updated_at|display_order` + `orderDir=asc|desc`
* `limit`, `offset`
* `q` (title/slug/summary/body ilike)
* `is_active=0|1|true|false`
* **i18n’li modüller için:** `locale`, `select` (kolon projeksiyonu, ileri faz)
* **setContentRange** + `x-total-count`

## 3) Modül Listesi (FE linklerine birebir)

Aşağıdakiler **i18n’li** olacak:

1. **Projects** (`/projects`, klasör: `modules/project`)

   * **Table** `projects`: `id, is_active, display_order, price, status(enum: "draft"|"active"|"sold"), cover_asset_id, tags(json), created_at, updated_at`
   * **Table** `project_i18n`: `id, project_id, locale, title, slug, summary, features_html, seo_title, seo_description`
   * **Public**: list, by-id, by-slug
   * **Admin**: parent CRUD, i18n CRUD, `reorder` endpoint (display_order bulk)

2. **Services** (`/services`, `modules/services`)

   * `services`: `id, is_active, display_order, icon, base_price`
   * `service_i18n`: `service_id, locale, title, slug, excerpt, body_html, seo_*`

3. **Ad Solutions** (`/ad-solutions`, `modules/adSolutions`)

   * `ad_solutions`: `id, is_active, display_order, monthly_price, cta_url`
   * `ad_solution_i18n`: `ad_solution_id, locale, title, slug, description_html, seo_*`

4. **References** (`/references`, `modules/references`)

   * `references`: `id, is_active, display_order, logo_asset_id, url, type(enum:"client"|"case"|"testimonial")`
   * `reference_i18n`: `reference_id, locale, title, slug, quote_html, role_or_company, seo_*`

5. **Contact** (`/contact`, `modules/contact`)

   * **Public**: `POST /contact/messages` (rate limit + honeypot + recaptcha opsiyonel)
   * **Admin**: `GET /admin/contact/messages` (list), `PATCH /admin/contact/messages/:id` (mark as read)
   * **Table** `contact_messages`: `id, name, email, phone, subject, message, locale, ip, user_agent, is_read, created_at`

> Not: Menü ve SiteSettings zaten var; istersen `site_settings_i18n` ile slogan, footer text, meta default’ları lokalize ederiz.

## 4) Kod Standartları (aynı iskelet, her modülde aynı dosyalar)

* `validation.ts` → Zod şemaları (`listQuerySchema`, `upsertParentSchema`, `upsertI18nSchema`, `patch*`)
* `schema.ts` → Drizzle tabloları (parent + i18n) + indexler
* `repository.ts` → join + fallback logic (COALESCE)
* `controller.ts` → public handlers (list/by-id/by-slug)
* `router.ts` → public routes
* `admin.controller.ts` → admin handlers (parent + i18n CRUD, reorder)
* `admin.routes.ts` → admin routes

> **İsimlendirme:**
> Klasör camelCase (ör. `adSolutions`), tablo snake_case (`ad_solutions`, `ad_solution_i18n`), kolon snake_case.

## 5) Locale Çözümleme & Fallback

* `common/middlewares/locale.ts`:

  * `req.locale = query.locale ?? header[x-locale] ?? Accept-Language bestMatch ?? env.DEFAULT_LOCALE`
  * `req.localeFallbacks = [req.locale, DEFAULT_LOCALE, ...others]` (dup’ları temizle)
* Repository’de sorgu:

  * `alias(i18n, "i18n_req")` (req.locale)
  * `alias(i18n, "i18n_def")` (DEFAULT_LOCALE)
  * select: `title = COALESCE(i18n_req.title, i18n_def.title)` biçiminde
* `by-slug` public endpoint:

  * Önce `WHERE i18n_req.slug = :slug`, yoksa `WHERE i18n_def.slug = :slug`

## 6) Slug Yönetimi

* **Unique `(locale, slug)`** (her dil kendi namespacede).
* Zod ile slug regex’i: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
  (Türkçe başlıklar FE’de transliterate edilip ASCII slug’a çevrilsin; dil başına ayrı slug gönderilecek.)
* Admin PATCH’te slug çakışmasını 409 ile döndür (`ER_DUP_ENTRY` → `slug_already_exists`).

## 7) Güvenlik, Oran Sınırlama, Dosya

* `@fastify/rate-limit` → `POST /contact/messages` (örn. 5 req/10dk/IP)
* `storage` → Cloudinary imzalı yükleme (zaten var); asset id’leri parent tablolarda foreign key olarak tutulur.
* `authPlugin` (+ `requireAuth`/`requireAdmin`) admin prefix’e zaten bağlı; tüm `/admin/*` uçlarında `config: { auth: true }`.

## 8) Test & Gözlemlenebilirlik

* **health** (`/health`) mevcut.
* **smoke**: her modül için `GET /module` 200 + `x-total-count` kontrolü
* **Playwright** ile FE smoke’ları, **Vitest** ile repository unit test’leri (opsiyonel).
* **Log**: 4xx/5xx’te structured log + `request_id`.

## 9) Dağıtım

* **PM2**: `ecosystem.config.cjs` (cluster 2, watch kapalı prod’da)
* **Docker Compose**: `api`, `mysql`, opsiyonel `migrations` init service
* **ENV**: `.env` prod/stage/local ayrımı; `CORS_ORIGIN` liste desteği (zaten var).

---

## Örnek: i18n’li “Services” modülü (özet iskelet)

**schema.ts**

* `services` (parent): `id(CHAR36 PK), is_active TINYINT(1), display_order INT, icon VARCHAR(100), base_price INT, created_at, updated_at`
* `service_i18n` (child):
  `id(CHAR36 PK), service_id(CHAR36 FK), locale VARCHAR(10), title VARCHAR(255), slug VARCHAR(255), excerpt LONGTEXT, body_html LONGTEXT, seo_title VARCHAR(255), seo_description VARCHAR(255),`
  index/unique:

  * `unique(service_id, locale)`
  * `unique(locale, slug)`
  * `index(locale), index(slug)`

**validation.ts**

* `listQuerySchema` (+ `locale?: string`)
* `upsertServiceBodySchema` (parent)
* `upsertServiceI18nBodySchema` (child)
* `patch*` varyantları

**repository.ts** (listeleme – COALESCE)

* `alias(service_i18n,"i18n_req")`, `alias(service_i18n,"i18n_def")`
* select:
  `title = COALESCE(i18n_req.title, i18n_def.title) as title`
  `slug  = COALESCE(i18n_req.slug,  i18n_def.slug)  as slug`
  `excerpt/body_html/seo_*` aynı şekilde
* `order`/`limit`/`offset` + `q` → `title/slug/excerpt/body_html` ilike

**controller.ts**

* `listServicesPublic(req)` → `req.locale` kullan, `x-total-count` set et
* `getServiceByIdPublic`
* `getServiceBySlugPublic` (önce req.locale eşleşmesi; yoksa default)

**router.ts**

* `GET /services`
* `GET /services/:id`
* `GET /services/by-slug/:slug`

**admin.controller.ts**

* `createServiceAdmin` (parent)
* `upsertServiceI18nAdmin(service_id, locale, payload)` → insert on duplicate key update
* `updateServiceAdmin` (parent patch)
* `removeServiceAdmin` (cascade)
* `reorderServicesAdmin` (bulk display_order)

**admin.routes.ts**

* `/admin/services` CRUD + `/admin/services/:id/i18n` CRUD
* `/admin/services/reorder` (POST array of `{id, display_order}`)

> Aynı kalıbı **Projects**, **AdSolutions**, **References** için de birebir uygulayacağız.
> **Contact** ise i18n gerektirmez (sadece `locale` kolonunu kaydederiz).

---

## Sonraki Adımlar (hemen uygulanabilir)

1. `core/i18n.ts` ve `common/middlewares/locale.ts` dosyalarını ekle, `app.ts` içinde `app.addHook('onRequest', localeMiddleware)` bağla.
2. “Services” modülünü yukarıdaki şemaya göre çıkar (parent + i18n).
3. Aynı kalıbı “Projects”, “AdSolutions”, “References” için çoğalt.
4. “Contact” için mesaj kaydı + rate-limit + admin list/güncelle yaz.
5. `drizzle-kit generate` → `drizzle-kit push` ya da migration runner ile şemayı uygula.
6. FE’ye: `?locale=tr` gönder; public uçlar **her zaman** locale-coalesced veri döndürsün.

İstersen ilk modül (Services) için **tam dosya içeriklerini** (schema/validation/repo/controller/router/admin.*) bir sonraki mesajda direkt çıkarayım; ardından diğer modülleri seri şekilde çoğaltırız.
