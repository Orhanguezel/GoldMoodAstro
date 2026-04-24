-- =============================================================
-- FILE: 051.9_custom_pages_legal_notice.seed.sql (FINAL — Energetische Massage, rerunnable)
-- Energetische Massage - Custom Page: Legal Notice / Impressum (TR/EN/DE)
-- ✅ PARENT: custom_pages.module_key = 'legal_notice'
-- ✅ category/subcategory YOK (schema''da yok)
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
SET @PAGE_LEGAL := '55550007-5555-4555-8555-555555550007';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'legal_notice';

-- Deterministic I18N IDs (rerunnable)
SET @I18N_TR := '66660007-5555-4555-8555-5555555500tr';
SET @I18N_EN := '66660007-5555-4555-8555-5555555500en';
SET @I18N_DE := '66660007-5555-4555-8555-5555555500de';

-- FEATURED IMAGE (optional)
SET @IMG_LEGAL :=
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80';
SET @IMG_LEGAL_2 :=
  'https://images.unsplash.com/photo-1528747045269-390fe33c19d1?auto=format&fit=crop&w=1400&q=80';
SET @IMG_LEGAL_3 :=
  'https://images.unsplash.com/photo-1450101215322-bf5cd27642fc?auto=format&fit=crop&w=1400&q=80';

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages) — schema uyumlu
-- -------------------------------------------------------------
INSERT INTO `custom_pages`
  (`id`,
   `module_key`,
   `is_published`,
   `featured`,
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
    @PAGE_LEGAL,
    @MODULE_KEY,
    1,
    0,
    60,
    60,
    @IMG_LEGAL,
    NULL,
    @IMG_LEGAL,
    NULL,
    JSON_ARRAY(@IMG_LEGAL, @IMG_LEGAL_2, @IMG_LEGAL_3),
    JSON_ARRAY(),
    NOW(3),
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `module_key`              = VALUES(`module_key`),
  `is_published`            = VALUES(`is_published`),
  `featured`                = VALUES(`featured`),
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
  @I18N_TR, @PAGE_LEGAL, 'tr',
  'Yasal Bilgilendirme',
  'yasal-bilgilendirme',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Yasal Bilgilendirme</h1>',
        '<p class="text-slate-700 mb-8">',
          'Bu sayfa, Energetische Massage web sitesine ilişkin genel yasal uyarıları ve bilgilendirmeleri içerir. ',
          'Sitedeki içerikler bilgilendirme amaçlı olup, bağlayıcı teklif veya tıbbi danışmanlık niteliği taşımayabilir.',
        '</p>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. İçerik Sorumluluğu</h2>',
            '<p class="text-slate-700">',
              'Energetische Massage, içeriklerin doğruluğu ve güncelliği için makul çaba gösterir; ancak içerikler genel bilgilendirme amaçlıdır ve bağlayıcı değildir.',
            '</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Harici Bağlantılar</h2>',
            '<p class="text-slate-700">',
              'Üçüncü taraf bağlantılar bilgilendirme amaçlıdır. Energetische Massage, üçüncü taraf içeriklerinden ve uygulamalarından sorumlu değildir.',
            '</p>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Fikri Mülkiyet</h2>',
          '<p class="text-slate-700 mb-3">',
            'Web sitesindeki tüm içerikler (metin, görsel, logo, tasarım) telif ve/veya marka hakları kapsamında korunur.',
          '</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>İzinsiz çoğaltma, kopyalama ve yayma yapılamaz</li>',
            '<li>Marka/logo kullanımı yazılı izne tabidir</li>',
            '<li>İçerikler referans ve bilgilendirme amaçlıdır</li>',
          '</ul>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Sorumluluk Sınırı</h2>',
          '<p class="text-slate-700">',
            'Sitenin kullanımından doğabilecek doğrudan veya dolaylı zararlarda, yürürlükteki mevzuatın izin verdiği ölçüde sorumluluk sınırlamaları geçerli olabilir.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">5. İletişim</h2>',
          '<p class="text-white/90">',
            'Yasal bilgilendirme hakkında sorularınız için bizimle iletişime geçebilirsiniz.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Yasal Bilgilendirme: içerik sorumluluğu, harici bağlantılar, fikri mülkiyet ve sorumluluk sınırları.',
  'Energetische Massage Yasal Bilgilendirme sayfası',
  'Yasal Bilgilendirme | Energetische Massage',
  'Energetische Massage web sitesi yasal bilgilendirmeleri: sorumluluk reddi, harici bağlantılar, fikri mülkiyet ve genel uyarılar.',
  'energetische massage,legal,yasal bilgilendirme,impressum,sorumluluk,fikri mulkiyet',
  NOW(3), NOW(3)
),
(
  @I18N_EN, @PAGE_LEGAL, 'en',
  'Legal Notice',
  'legal-notice',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Legal Notice</h1>',
        '<p class="text-slate-700 mb-8">',
          'This page provides general legal information and disclaimers regarding the Energetische Massage website. Content is provided for informational purposes and does not constitute medical advice.',
        '</p>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Content</h2>',
            '<p class="text-slate-700">We make reasonable efforts to keep content accurate, but provide no warranty and content is not legally binding.</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. External Links</h2>',
            '<p class="text-slate-700">We are not responsible for third-party content or practices on linked sites.</p>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Intellectual Property</h2>',
          '<p class="text-slate-700 mb-3">All texts, images, logos and designs are protected by applicable IP laws.</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>No reproduction or distribution without permission</li>',
            '<li>Trademark and logo use requires written consent</li>',
            '<li>Content is provided for reference</li>',
          '</ul>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Limitation of Liability</h2>',
          '<p class="text-slate-700">To the extent permitted by law, limitations of liability may apply for damages arising from use of this website.</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">5. Contact</h2>',
          '<p class="text-white/90">For legal questions, please contact us.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Legal Notice: disclaimers, external links, intellectual property and limitation of liability.',
  'Energetische Massage Legal Notice page',
  'Legal Notice | Energetische Massage',
  'Energetische Massage Legal Notice covers disclaimers, external links, IP rights and limitation of liability.',
  'energetische massage,legal,legal notice,disclaimer,intellectual property,liability',
  NOW(3), NOW(3)
),
(
  @I18N_DE, @PAGE_LEGAL, 'de',
  'Impressum',
  'impressum',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10 max-w-3xl">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-8">Impressum</h1>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Angaben gemäß § 5 TMG</h2>',
          '<p class="text-slate-700 leading-relaxed">',
            'Energetische Massage Bonn<br>',
            'Anastasia König<br>',
            'Bonn, Nordrhein-Westfalen<br>',
            'Deutschland',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Kontakt</h2>',
          '<p class="text-slate-700 leading-relaxed">',
            'E-Mail: <a href="mailto:info@energetische-massage-bonn.de" class="text-primary hover:underline">info@energetische-massage-bonn.de</a><br>',
            'Website: <a href="https://energetische-massage-bonn.de" class="text-primary hover:underline">energetische-massage-bonn.de</a>',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>',
          '<p class="text-slate-700 leading-relaxed">',
            'Anastasia König<br>',
            'Bonn, Deutschland',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Hinweis</h2>',
          '<p class="text-slate-700 leading-relaxed">',
            'Die angebotenen Massagen dienen der Entspannung und dem allgemeinen Wohlbefinden. ',
            'Sie ersetzen keine ärztliche Diagnose oder Behandlung. Bei gesundheitlichen Beschwerden ',
            'wenden Sie sich bitte an einen Arzt oder Heilpraktiker.',
          '</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">Haftung für Inhalte</h2>',
            '<p class="text-slate-700">',
              'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. ',
              'Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.',
            '</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">Haftung für Links</h2>',
            '<p class="text-slate-700">',
              'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. ',
              'Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.',
            '</p>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Urheberrecht</h2>',
          '<p class="text-slate-700">',
            'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. ',
            'Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes ',
            'bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
          '</p>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">Streitschlichtung</h2>',
          '<p class="text-slate-700">',
            'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: ',
            '<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a>. ',
            'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Impressum der Energetische Massage Bonn — Angaben gemäß § 5 TMG, Kontakt, Haftungshinweise und Urheberrecht.',
  'Energetische Massage Bonn Impressum',
  'Impressum | Energetische Massage Bonn',
  'Impressum der Energetische Massage Bonn: Angaben gemäß § 5 TMG, Kontaktdaten, Haftung für Inhalte und Links, Urheberrecht und Streitschlichtung.',
  'impressum,energetische massage,bonn,kontakt,tmg,haftung,urheberrecht,streitschlichtung',
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
