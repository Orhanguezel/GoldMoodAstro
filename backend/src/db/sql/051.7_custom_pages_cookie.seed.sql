-- =============================================================
-- FILE: 051.7_custom_pages_cookie.seed.sql (FINAL — Energetische Massage)
-- Energetische Massage - Custom Page: Çerez Politikası / Cookie Policy (TR/EN/DE)
-- ✅ module_key artık PARENT: custom_pages.module_key = 'cookies'
-- Category: LEGAL (aaaa7101)
-- SubCategory: Çerez Politikası (bbbb7008)
-- NOT: Bu dosyada BLOK YORUM (/* */) YOKTUR. Sadece "--" kullanılır.
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

SET @PAGE_COOKIES := '55550005-5555-4555-8555-555555550005';

-- PARENT MODULE KEY
SET @MODULE_KEY := 'cookies';

SET @IMG_COOKIES :=
  'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1400&q=80';
SET @IMG_COOKIES_2 :=
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80';
SET @IMG_COOKIES_3 :=
  'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1400&q=80';

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages)
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
    @PAGE_COOKIES,
    @MODULE_KEY,
    1,
    40,
    40,
    @IMG_COOKIES,
    NULL,
    @IMG_COOKIES,
    NULL,
    JSON_ARRAY(@IMG_COOKIES, @IMG_COOKIES_2, @IMG_COOKIES_3),
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
(
  UUID(), @PAGE_COOKIES, 'tr',
  'Çerez Politikası',
  'cerez-politikasi',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Çerez Politikası</h1>',
        '<p class="text-slate-700 mb-8">',
          'Web sitemizde kullanıcı deneyimini geliştirmek, güvenliği sağlamak ve performansı izlemek için çerezler kullanılabilir. ',
          'Bu sayfa; çerez türlerini, kullanım amaçlarını ve tercih yönetimini açıklar.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Çerez Nedir?</h2>',
          '<p class="text-slate-700">',
            'Çerezler, ziyaret ettiğiniz web sitesi tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. ',
            'Oturum yönetimi, tercih saklama ve ölçümleme gibi amaçlarla kullanılabilir.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Çerez Türleri</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li><strong>Zorunlu:</strong> Sitenin temel işlevleri için gerekli</li>',
              '<li><strong>Fonksiyonel:</strong> Dil/tercih gibi ayarları hatırlayabilir</li>',
              '<li><strong>Analitik:</strong> Trafik ve kullanım ölçümü</li>',
              '<li><strong>Güvenlik:</strong> Kötüye kullanım tespiti ve koruma</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Kullanım Amaçları</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Sayfa performansı ve hata analizi</li>',
              '<li>Güvenlik ve oturum bütünlüğü</li>',
              '<li>Kullanıcı tercihlerini hatırlama</li>',
              '<li>İçerik ve deneyim iyileştirme</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Çerez Tercihleri</h2>',
          '<p class="text-slate-700 mb-3">',
            'Çerez tercihlerinizi tarayıcı ayarlarından yönetebilir, dilediğiniz zaman silebilir veya engelleyebilirsiniz. ',
            'Bazı çerezleri devre dışı bırakmak sitenin bazı işlevlerini etkileyebilir.',
          '</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Tarayıcı ayarlarından çerezleri görüntüleme/silme</li>',
            '<li>Üçüncü taraf çerezleri engelleme</li>',
            '<li>Site verilerini temizleme</li>',
          '</ul>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">5. Güncellemeler</h2>',
          '<p class="text-white/90">',
            'Çerez politikası zaman zaman güncellenebilir. Güncel sürüm bu sayfada yayımlanır.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Çerez Politikası: çerez türleri, kullanım amaçları ve tercih yönetimi.',
  'Energetische Massage Çerez Politikası sayfası',
  'Çerez Politikası | Energetische Massage',
  'Energetische Massage çerez politikası; zorunlu, fonksiyonel ve analitik çerezler ile tercih yönetimi hakkında bilgi verir.',
  'energetische massage,legal,cerez politikasi,cookies,analitik,tercih yonetimi',
  NOW(3), NOW(3)
),
(
  UUID(), @PAGE_COOKIES, 'en',
  'Cookie Policy',
  'cookie-policy',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Cookie Policy</h1>',
        '<p class="text-slate-700 mb-8">',
          'We may use cookies to improve user experience, maintain security, and measure website performance. This page explains cookie types and how to manage preferences.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. What Are Cookies?</h2>',
          '<p class="text-slate-700">',
            'Cookies are small text files stored in your browser. They can be used for session management, preferences and analytics.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Types of Cookies</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li><strong>Necessary:</strong> Required for core functionality</li>',
              '<li><strong>Functional:</strong> May remember preferences (e.g., language)</li>',
              '<li><strong>Analytics:</strong> Measures traffic and usage</li>',
              '<li><strong>Security:</strong> Helps protect the site against abuse</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Purposes</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Performance and error diagnostics</li>',
              '<li>Security and session integrity</li>',
              '<li>Preference management</li>',
              '<li>Experience improvements</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Managing Cookies</h2>',
          '<p class="text-slate-700">',
            'You can manage, delete or block cookies via browser settings. Disabling certain cookies may affect site functionality.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">5. Updates</h2>',
          '<p class="text-white/90">This policy may be updated. The current version is published on this page.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Cookie Policy: cookie types, purposes, and preference management.',
  'Energetische Massage Cookie Policy page',
  'Cookie Policy | Energetische Massage',
  'Energetische Massage Cookie Policy explains cookie categories and how to manage preferences in your browser.',
  'energetische massage,legal,cookie policy,cookies,analytics,preferences',
  NOW(3), NOW(3)
),
(
  UUID(), @PAGE_COOKIES, 'de',
  'Cookie-Richtlinie',
  'cookie-richtlinie',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Cookie-Richtlinie</h1>',
        '<p class="text-slate-700 mb-8">',
          'Wir verwenden gegebenenfalls Cookies, um die Nutzererfahrung zu verbessern, Sicherheit zu gewährleisten und die Website-Performance zu messen.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Was sind Cookies?</h2>',
          '<p class="text-slate-700">',
            'Cookies sind kleine Textdateien, die im Browser gespeichert werden und z. B. Sitzungen, Präferenzen und Analysen unterstützen.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Cookie-Kategorien</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li><strong>Notwendig:</strong> Für Kernfunktionen erforderlich</li>',
              '<li><strong>Funktional:</strong> Speichert Präferenzen (z. B. Sprache)</li>',
              '<li><strong>Analyse:</strong> Misst Nutzung und Traffic</li>',
              '<li><strong>Sicherheit:</strong> Schutz vor Missbrauch</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Zwecke</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Performance- und Fehleranalyse</li>',
              '<li>Sicherheit und Sitzungsintegrität</li>',
              '<li>Präferenzverwaltung</li>',
              '<li>Verbesserung des Nutzererlebnisses</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Cookie-Verwaltung</h2>',
          '<p class="text-slate-700">',
            'Cookies können über Browsereinstellungen verwaltet, gelöscht oder blockiert werden. Das Deaktivieren kann Funktionen einschränken.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">5. Aktualisierungen</h2>',
          '<p class="text-white/90">Diese Richtlinie kann aktualisiert werden. Die aktuelle Version wird hier veröffentlicht.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Cookie-Richtlinie: Kategorien, Zwecke und Verwaltung der Cookie-Einstellungen.',
  'Energetische Massage Cookie-Richtlinie',
  'Cookie-Richtlinie | Energetische Massage',
  'Die Cookie-Richtlinie von Energetische Massage erläutert Cookie-Kategorien und die Verwaltung über Browsereinstellungen.',
  'energetische massage,legal,cookie richtlinie,cookies,analyse,einstellungen',
  NOW(3), NOW(3)
)
ON DUPLICATE KEY UPDATE
  `title`              = VALUES(`title`),
  `slug`               = VALUES(`slug`),
  `content`            = VALUES(`content`),
  `summary`            = VALUES(`summary`),
  `featured_image_alt` = VALUES(`featured_image_alt`),
  `meta_title`         = VALUES(`meta_title`),
  `meta_description`   = VALUES(`meta_description`),
  `tags`               = VALUES(`tags`),
  `updated_at`         = VALUES(`updated_at`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
