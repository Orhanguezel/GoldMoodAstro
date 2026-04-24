
Aşağıdaki yöntem, admin panelde 30+ dili yönetebileceğin ve tüm modüllerin içeriğini anlık (locale değişince refetch) çekebileceğin standart bir “kontrol + düzeltme” playbook’tur. Bunu her modülde birebir uygularsan, “bir yerde çalışıyor diğer yerde bozuluyor” problemi kalmaz.

---

## Hedef Mimari Standardı

Her modül için iki temel kategori olacak:

1. **Global ayarlar (locale bağımsız)**

* DB’de `locale='*'` satırları
* Örn: `app_locales`, `default_locale`, sistem konfigleri

2. **Localized içerikler (locale bağımlı)**

* DB’de `locale='tr','en','de',...`
* “i18n table + parent table” veya “tek table locale sütunu” ile tutulur
* Admin’de seçilen locale’a göre **anlık** listelenir / düzenlenir

---

## Modül Bazlı Kontrol Yöntemi (Her modülde uygulanacak checklist)

### A) DB Katmanı Kontrolü

**A1) Şema tipi tespiti**

* Seçenek 1: `parent` + `i18n` tablo (ör: `footer_sections` + `footer_sections_i18n`)
* Seçenek 2: tek tablo + `locale` alanı (ör: `site_settings`)
* Seçenek 3: “JSON içinde locale map” (mümkünse kaçın; varsa admin upsert sırasında normalize et)

**A2) Unique constraint**

* i18n tabloda mutlaka:

  * `UNIQUE(section_id, locale)` veya `UNIQUE(base_id, locale)`
* Tek tabloda mutlaka:

  * `UNIQUE(key, locale)` veya `UNIQUE(slug, locale)` (modül ihtiyaçlarına göre)

**A3) Seed ve veri doğrulama**

* `app_locales` içinde aktif dil listesi DB’de var mı? `locale='*'`
* Her “aktif dil” için modülün kritik içeriklerinde satır var mı?
* Hızlı kontrol SQL kalıpları:

  * Eksik locale tespiti:

    ```sql
    SELECT p.id
    FROM parent p
    LEFT JOIN i18n t_de ON t_de.parent_id=p.id AND t_de.locale='de'
    WHERE t_de.id IS NULL;
    ```
  * Duplicate i18n satır:

    ```sql
    SELECT parent_id, locale, COUNT(*) c
    FROM i18n
    GROUP BY parent_id, locale
    HAVING c > 1;
    ```

---

### B) Backend (Fastify + Drizzle) Kontrolü

**B1) Locale kaynağı standardı**

* Admin için locale her istekte net olmalı:

  * Öncelik: `req.query.locale`
  * Yoksa: `(req as any).locale` (middleware’den gelen)
  * Yoksa: `default_locale` (DB’den)
* `'*'` global sadece global setting’lerde kullanılmalı; localized list endpoint’lerde normalde kullanılmaz.

**B2) List endpoint kuralı (kritik)**

* Admin list endpoint **query.locale verilmişse aynen onu kullanmalı**.
* “safeLocale fallback” (locale app_locales içinde değilse default’a düş) sadece public tarafta veya özel durumlarda kullanılmalı.
* Admin tarafında amaç: yöneticinin seçtiği dili birebir görmek ve düzenlemek.

**B3) Merge (coalesce) kuralı**

* Admin’de “listeleme” iki modda çalışabilmeli:

  1. **Strict mode:** sadece seçili locale satırlarını göster (çeviri yoksa boş/eksik görünsün ki admin tamamlasın)
  2. **Merged mode:** seçili locale yoksa defaultLocale’dan coalesce et (display kolaylığı için)
* Bu iki modu query ile ayır:

  * `?locale=de&mode=strict`
  * `?locale=de&mode=merged` (varsayılan olabilir)
* Senin footer repository şu an merged yapıyor; admin çeviri yönetimi için “strict” eklemek çok işine yarar.

**B4) Write endpoint kuralı**

* `POST/PATCH/PUT` içinde locale kaynakları:

  * payload.locale varsa onu kullan
  * yoksa query.locale varsa onu kullan
  * yoksa req.locale
  * yoksa default_locale
* i18n satırı yoksa PATCH’te:

  * title+slug gibi zorunlu alanları şart koş (sen bunu doğru yapmışsın)

**B5) app_locales / default_locale tek noktadan**

* Tüm modüller admin’de dil listesi için aynı endpoint’i kullanmalı:

  * `GET /admin/site-settings/app_locales?locale=*` veya mevcut `getAppLocalesAdmin`
* Backend’de `getAppLocales()` mutlaka `locale='*'` satırını önce okumalı (sen service.ts’i düzelttin).

---

### C) Frontend (Admin Panel) Kontrolü

**C1) Tek bir “AdminLocaleStore” standardı**

* Admin’de seçili locale state’i tek yerden yönet:

  * URL query (örn `?locale=de`) + global store (zustand / redux slice) + localStorage fallback
* Sayfa açılınca:

  1. `app_locales` çek
  2. seçili locale geçerli mi kontrol et
  3. geçerli değilse `default_locale` veya `app_locales`’te `is_default=true` olanı seç

**C2) Her RTK endpoint locale ile çağrılmalı**

* List:

  * `useListXAdminQuery({ locale, ...params })`
* Get by id:

  * `useGetXAdminQuery({ id, locale })` (gerekirse)
* Update / Create:

  * payload’a locale koy (veya query paramla gönder)
* Önemli: “locale değişince refetch” kesin olmalı:

  * `serializeQueryArgs` locale’ı cache key’e dahil etmeli
  * `forceRefetch` locale değişince true dönmeli

**C3) UI standardı**

* Her modül tab’ında locale selector aynı component:

  * `AdminLocaleSelect`
* Bu selector `app_locales` listesini DB’den getirir, 30 dili buradan yönetirsin.

**C4) Refetch garanti**

* Locale değişince sadece component state değişmesi yetmez; RTK Query cache aynı kalmamalı.
* Pratik kontrol:

  * Network’te locale değiştirince yeni request gidiyor mu?
  * Response `locale_resolved`/`locale` doğru mu?

---

## Modül Kontrol Akışı (Uygulanacak Sıralı Plan)

Her modül için aynı sırayla git:

1. **DB kontrol**

   * i18n var mı, unique doğru mu, seed dilleri var mı (özellikle `de`)
2. **Backend list endpoint**

   * `locale` query paramı gerçekten kullanılıyor mu?
   * strict/merged ihtiyacı var mı?
3. **Backend write endpoint**

   * locale kaynağı doğru mu?
   * i18n upsert doğru mu?
4. **Frontend RTK endpoint**

   * locale param gidiyor mu?
   * cache key locale içeriyor mu?
5. **UI**

   * Admin locale selector ile anlık değişince tablo/form güncelleniyor mu?
6. **Smoke test**

   * tr/en/de arasında hızlı geçişte içerik anlık değişiyor mu?
   * translation olmayan yerde admin “eksik” görüp tamamlayabiliyor mu?

---

## 30 Dil için Önerilen “Minimum Yönetim Seti”

Admin panelde sürdürülebilir olması için şu 3 ekranı standartlaştır:

1. **Language Manager (Global)**

* `app_locales` (aktif/pasif, label, default)
* `default_locale`
* “Dil ekle” (örn 30 dil)

2. **Translation Coverage Report (Modül bazlı)**

* Her modül için: `missing_count` per locale
* “Eksik çeviriler” filtrelenebilir liste
* Bu rapor seni inanılmaz hızlandırır

3. **Strict Translation Editor**

* Seçili locale’da kayıt yoksa boş form açılır, “Create translation” yapılır
* Merged görüntü ayrı; edit strict olmalı

---

## Sonuç: Senin için net “Uygulama Standardı”

* Locale seçimi: **tek yerden**
* Her endpoint: **locale param zorunlu**
* Cache: **locale bazlı**
* DB: **(base_id, locale) unique**
* Admin list: **explicit locale’ı birebir göster**
* Opsiyonel: strict/merged modları

---

İstersen bir sonraki adımda, senin kod düzenine göre şu iki parçayı “tek seferde” standart hale getirip tüm modüllerde aynı şekilde kullandırtırım:

1. `src/modules/_shared/i18n/adminLocale.ts` (backend ortak helper: locale resolve + fallback chain + strict/merged)
2. `src/components/admin/shared/AdminLocaleSelect.tsx` + `src/store/adminLocale.ts` (frontend ortak selector + state)

Böylece her modülde sadece 2-3 satırla locale-aware davranış otomatikleşir.
