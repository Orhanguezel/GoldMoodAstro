-- =============================================================
-- FILE: 051.6_custom_pages_terms.seed.sql (FINAL — Energetische Massage, rerunnable)
-- Energetische Massage - Custom Page: Terms / Nutzungsbedingungen (TR/EN/DE)
-- ✅ PARENT: custom_pages.module_key = 'terms'
-- ✅ category/subcategory YOK (schema''da yok)
-- ✅ images/storage_image_ids LONGTEXT JSON-string (schema uyumlu)
-- ✅ i18n: module_key YOK
-- ✅ deterministic i18n ids (rerunnable)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- PAGE ID (stable)
-- -------------------------------------------------------------
SET @PAGE_TERMS := '55550004-5555-4555-8555-555555550004';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'terms';

-- Deterministic I18N IDs (rerunnable)
SET @I18N_TR := '66660004-5555-4555-8555-5555555500tr';
SET @I18N_EN := '66660004-5555-4555-8555-5555555500en';
SET @I18N_DE := '66660004-5555-4555-8555-5555555500de';

-- FEATURED IMAGE (optional)
SET @IMG_TERMS :=
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80';
SET @IMG_TERMS_2 :=
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80';
SET @IMG_TERMS_3 :=
  'https://images.unsplash.com/photo-1523287562758-66c7fc58967f?auto=format&fit=crop&w=1400&q=80';

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages) — schema uyumlu
-- (category_id/sub_category_id YOK)
-- -------------------------------------------------------------
INSERT INTO `custom_pages`
  (`id`,
   `module_key`,
   `is_published`,
   `display_order`,
   `order_num`,
   `featured_image`,
   `featured_image_asset_id`,
   `image_url`,
   `storage_asset_id`,
   `images`,
   `storage_image_ids`,
   `created_at`,
   `updated_at`)
VALUES
  (
    @PAGE_TERMS,
    @MODULE_KEY,
    1,
    30,
    30,
    @IMG_TERMS,
    NULL,
    @IMG_TERMS,
    NULL,
    JSON_ARRAY(@IMG_TERMS, @IMG_TERMS_2, @IMG_TERMS_3),
    JSON_ARRAY(),
    NOW(3),
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `module_key`              = VALUES(`module_key`),
  `is_published`            = VALUES(`is_published`),
  `display_order`           = VALUES(`display_order`),
  `order_num`               = VALUES(`order_num`),
  `featured_image`          = VALUES(`featured_image`),
  `featured_image_asset_id` = VALUES(`featured_image_asset_id`),
  `image_url`               = VALUES(`image_url`),
  `storage_asset_id`        = VALUES(`storage_asset_id`),
  `images`                  = VALUES(`images`),
  `storage_image_ids`       = VALUES(`storage_image_ids`),
  `updated_at`              = VALUES(`updated_at`);

-- -------------------------------------------------------------
-- I18N UPSERT (custom_pages_i18n)
-- ✅ module_key yok
-- ✅ page_id+locale unique => rerunnable
-- -------------------------------------------------------------
INSERT INTO `custom_pages_i18n`
  (`id`,
   `page_id`,
   `locale`,
   `title`,
   `slug`,
   `content`,
   `summary`,
   `featured_image_alt`,
   `meta_title`,
   `meta_description`,
   `tags`,
   `created_at`,
   `updated_at`)
VALUES

-- -------------------------------------------------------------
-- TR
-- -------------------------------------------------------------
(
  @I18N_TR, @PAGE_TERMS, 'tr',
  'Kullanım Koşulları',
  'kullanim-kosullari',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Kullanım Koşulları</h1>',
        '<p class="text-slate-700 mb-8">',
          'Bu web sitesini ziyaret eden veya kullanan herkes aşağıdaki koşulları kabul etmiş sayılır. ',
          'Koşullar; içerik kullanımını, sorumluluk sınırlarını, üçüncü taraf bağlantılarını ve değişiklik hükümlerini kapsar.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Amaç ve Kapsam</h2>',
          '<p class="text-slate-700">',
            'Bu koşullar, Energetische Massage web sitesinin kullanımına ilişkin kuralları ve tarafların hak/yükümlülüklerini düzenler. ',
            'Sitedeki içerikler genel bilgilendirme amaçlıdır ve sağlık/tedavi taahhüdü niteliği taşımaz.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. İçerik ve Fikri Mülkiyet</h2>',
            '<p class="text-slate-700 mb-3">',
              'Sitedeki metin, görsel, logo ve diğer tüm materyaller Energetische Massage''a veya hak sahiplerine aittir.',
            '</p>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>İzinsiz kopyalama/çoğaltma/yayma yapılamaz</li>',
              '<li>Marka ve logo kullanımı yazılı izne tabidir</li>',
              '<li>İçerikler yalnızca bilgilendirme amaçlı paylaşılır</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Kullanıcı Yükümlülükleri</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Siteyi hukuka aykırı amaçlarla kullanmamak</li>',
              '<li>Sisteme zarar verebilecek girişimlerde bulunmamak</li>',
              '<li>Yanıltıcı/gerçeğe aykırı bilgi paylaşmamak</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Randevu/Rezervasyon</h2>',
          '<p class="text-slate-700 mb-3">',
            'Randevu talepleri müsaitlik durumuna göre değerlendirilir. Onay/iptal/erteleme süreçleri, iletişim kanalları üzerinden bildirilebilir.',
          '</p>',
          '<p class="text-slate-700">',
            'Kullanıcı, doğru iletişim bilgisi sağlamakla sorumludur.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Sorumluluk Reddi</h2>',
          '<p class="text-slate-700 mb-3">',
            'Sitede yer alan bilgiler genel bilgilendirme amaçlıdır. Energetische Massage, içeriğin doğruluğu ve güncelliği için makul çaba gösterir; ',
            'ancak içeriklerin hatasız olduğu veya her zaman güncel kalacağı yönünde garanti vermez.',
          '</p>',
          '<p class="text-slate-700">',
            'Sitedeki bilgilere dayanarak alınacak kararlardan doğabilecek sonuçlar kullanıcı sorumluluğundadır.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. Üçüncü Taraf Bağlantılar</h2>',
          '<p class="text-slate-700">',
            'Üçüncü taraf sitelere verilen bağlantılar bilgi amaçlıdır. Energetische Massage bu sitelerin içeriğinden ve uygulamalarından sorumlu değildir.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">7. Değişiklikler</h2>',
          '<p class="text-white/90">',
            'Energetische Massage, kullanım koşullarını güncelleme hakkını saklı tutar. Güncellemeler web sitesinde yayımlandığı tarihten itibaren geçerlidir.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Kullanım Koşulları: web sitesi kullanımı, fikri mülkiyet, kullanıcı yükümlülükleri, randevu süreçleri, sorumluluk sınırları ve değişiklik hükümleri.',
  'Energetische Massage Kullanım Koşulları sayfası',
  'Kullanım Koşulları | Energetische Massage',
  'Energetische Massage web sitesi kullanım koşulları: içerik hakları, kullanıcı yükümlülükleri, randevu süreçleri, sorumluluk reddi ve üçüncü taraf bağlantılar.',
  'energetische massage,legal,kullanim kosullari,terms,fikri mulkiyet,randevu,sorumluluk',
  NOW(3), NOW(3)
),

-- -------------------------------------------------------------
-- EN
-- -------------------------------------------------------------
(
  @I18N_EN, @PAGE_TERMS, 'en',
  'Terms of Use',
  'terms-of-use',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Terms of Use</h1>',
        '<p class="text-slate-700 mb-8">',
          'By accessing or using this website, you agree to the terms below. These terms cover content usage, appointment-related rules, limitation of liability, external links and updates.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Purpose and Scope</h2>',
          '<p class="text-slate-700">',
            'These terms govern the use of the Energetische Massage website. Website content is provided for general informational purposes and does not constitute medical advice.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Intellectual Property</h2>',
            '<p class="text-slate-700 mb-3">',
              'Texts, images, logos and all materials are owned by Energetische Massage or respective rights holders.',
            '</p>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>No reproduction or distribution without permission</li>',
              '<li>Trademark/logo use requires written consent</li>',
              '<li>Content is provided for reference and information</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. User Obligations</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Do not use the site for unlawful purposes</li>',
              '<li>Do not attempt to harm systems or services</li>',
              '<li>Do not submit misleading information</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Appointments/Bookings</h2>',
          '<p class="text-slate-700 mb-3">',
            'Appointment requests are subject to availability. Confirmation, cancellation or rescheduling may be communicated via our contact channels.',
          '</p>',
          '<p class="text-slate-700">',
            'Users are responsible for providing accurate contact information.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Disclaimer</h2>',
          '<p class="text-slate-700 mb-3">',
            'Content is provided "as is" for general information. Energetische Massage makes reasonable efforts to keep information accurate and up to date, but provides no warranty.',
          '</p>',
          '<p class="text-slate-700">',
            'Any reliance on website content is at the user''s own risk.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. External Links</h2>',
          '<p class="text-slate-700">',
            'Links to third-party websites are provided for convenience. Energetische Massage is not responsible for third-party content or practices.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">7. Changes</h2>',
          '<p class="text-white/90">',
            'Energetische Massage may update these terms. Changes take effect upon publication on this website.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Terms of Use: website usage, intellectual property, user obligations, booking rules, disclaimer and updates.',
  'Energetische Massage Terms of Use page',
  'Terms of Use | Energetische Massage',
  'Energetische Massage Terms of Use covers IP, user obligations, appointment rules, disclaimers, external links and changes.',
  'energetische massage,legal,terms of use,appointments,disclaimer,intellectual property',
  NOW(3), NOW(3)
),

-- -------------------------------------------------------------
-- DE
-- -------------------------------------------------------------
(
  @I18N_DE, @PAGE_TERMS, 'de',
  'Nutzungsbedingungen',
  'nutzungsbedingungen',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Nutzungsbedingungen</h1>',
        '<p class="text-slate-700 mb-8">',
          'Durch den Zugriff auf diese Website akzeptieren Sie die folgenden Bedingungen. Sie regeln u. a. Inhaltsnutzung, Termin-/Buchungsregeln, Haftungsbeschränkung, externe Links und Änderungen.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Zweck und Geltungsbereich</h2>',
          '<p class="text-slate-700">',
            'Diese Bedingungen regeln die Nutzung der Website von Energetische Massage. Inhalte dienen der allgemeinen Information und stellen keine medizinische Beratung dar.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Urheberrechte</h2>',
            '<p class="text-slate-700 mb-3">',
              'Texte, Bilder, Logos und Materialien sind Eigentum von Energetische Massage bzw. der jeweiligen Rechteinhaber.',
            '</p>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Keine Vervielfältigung ohne Erlaubnis</li>',
              '<li>Marken-/Logonutzung nur mit schriftlicher Zustimmung</li>',
              '<li>Inhalte dienen der Information</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Pflichten der Nutzer</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Keine rechtswidrige Nutzung</li>',
              '<li>Keine schädigenden Systemeingriffe</li>',
              '<li>Keine irreführenden Angaben</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Termine/Buchungen</h2>',
          '<p class="text-slate-700 mb-3">',
            'Terminanfragen stehen unter Vorbehalt der Verfügbarkeit. Bestätigung, Stornierung oder Verschiebung kann über unsere Kontaktkanäle erfolgen.',
          '</p>',
          '<p class="text-slate-700">',
            'Nutzer sind verpflichtet, korrekte Kontaktdaten bereitzustellen.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Haftungsausschluss</h2>',
          '<p class="text-slate-700 mb-3">',
            'Inhalte werden „wie gesehen" bereitgestellt. Energetische Massage bemüht sich um Aktualität, übernimmt jedoch keine Gewähr.',
          '</p>',
          '<p class="text-slate-700">Die Nutzung der Informationen erfolgt auf eigenes Risiko.</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. Externe Links</h2>',
          '<p class="text-slate-700">Für Inhalte verlinkter Drittseiten übernimmt Energetische Massage keine Verantwortung.</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">7. Änderungen</h2>',
          '<p class="text-white/90">Energetische Massage kann diese Bedingungen aktualisieren. Änderungen gelten ab Veröffentlichung.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Nutzungsbedingungen: Website-Nutzung, Urheberrechte, Pflichten, Terminregeln, Haftungsausschluss und Änderungen.',
  'Energetische Massage Nutzungsbedingungen',
  'Nutzungsbedingungen | Energetische Massage',
  'Die Nutzungsbedingungen regeln Inhaltsnutzung, Termin-/Buchungsregeln, Haftungsausschluss, externe Links und Aktualisierungen.',
  'energetische massage,legal,nutzungsbedingungen,termine,haftung,urheberrecht',
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `page_id`             = VALUES(`page_id`),
  `locale`              = VALUES(`locale`),
  `title`               = VALUES(`title`),
  `slug`                = VALUES(`slug`),
  `content`             = VALUES(`content`),
  `summary`             = VALUES(`summary`),
  `featured_image_alt`  = VALUES(`featured_image_alt`),
  `meta_title`          = VALUES(`meta_title`),
  `meta_description`    = VALUES(`meta_description`),
  `tags`                = VALUES(`tags`),
  `updated_at`          = VALUES(`updated_at`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
