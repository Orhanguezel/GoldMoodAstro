-- =============================================================
-- FILE: 051.8_custom_pages_privacy_notice.seed.sql (FINAL — Energetische Massage, rerunnable)
-- Energetische Massage - Custom Page: Privacy Notice / Informationspflicht (TR/EN/DE)
-- ✅ PARENT: custom_pages.module_key = 'privacy_notice'
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
SET @PAGE_NOTICE := '55550006-5555-4555-8555-555555550006';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'privacy_notice';

-- Deterministic I18N IDs (rerunnable)
SET @I18N_TR := '66660006-5555-4555-8555-5555555500tr';
SET @I18N_EN := '66660006-5555-4555-8555-5555555500en';
SET @I18N_DE := '66660006-5555-4555-8555-5555555500de';

-- FEATURED IMAGE (optional)
SET @IMG_NOTICE :=
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=80';
SET @IMG_NOTICE_2 :=
  'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1400&q=80';
SET @IMG_NOTICE_3 :=
  'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1400&q=80';

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
    @PAGE_NOTICE,
    @MODULE_KEY,
    1,
    0,
    50,
    50,
    @IMG_NOTICE,
    NULL,
    @IMG_NOTICE,
    NULL,
    JSON_ARRAY(@IMG_NOTICE, @IMG_NOTICE_2, @IMG_NOTICE_3),
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
  @I18N_TR, @PAGE_NOTICE, 'tr',
  'Aydınlatma Metni',
  'aydinlatma-metni',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Aydınlatma Metni</h1>',
        '<p class="text-slate-700 mb-8">',
          'Bu metin, kişisel verilerin işlenmesine ilişkin genel bilgilendirme amacıyla hazırlanmıştır. ',
          'İşlenen veriler, amaçlar, hukuki sebepler, aktarım tarafları ve haklarınız aşağıda özetlenmiştir.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Veri Sorumlusu</h2>',
          '<p class="text-slate-700">Veri sorumlusu Energetische Massage''tır.</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. İşlenen Veriler</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>İletişim bilgileri (ad, e-posta, telefon)</li>',
              '<li>Randevu talebi/mesaj içerikleri</li>',
              '<li>Teknik veriler ve log kayıtları</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. İşleme Amaçları</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Randevu taleplerinin alınması ve yönetilmesi</li>',
              '<li>İletişim taleplerinin yanıtlanması</li>',
              '<li>Bilgi güvenliği ve sistem güvenliği</li>',
              '<li>Yasal yükümlülüklerin yerine getirilmesi</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Hukuki Sebepler</h2>',
          '<p class="text-slate-700">',
            'Veriler; sözleşmenin kurulması/ifası, meşru menfaat, hukuki yükümlülük ve gerektiğinde açık rıza gibi sebeplerle işlenebilir.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Aktarım</h2>',
          '<p class="text-slate-700 mb-3">',
            'Hizmetin sağlanması kapsamında sınırlı olarak hizmet sağlayıcılara (barındırma, e-posta gönderimi, güvenlik vb.) aktarım yapılabilir. ',
            'Bu aktarım sözleşmesel ve teknik/idari tedbirlerle yürütülür.',
          '</p>',
          '<p class="text-slate-700">',
            'Yasal zorunluluk halinde yetkili kurum/kuruluşlara aktarım söz konusu olabilir.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Haklarınız</h2>',
          '<p class="text-white/90">',
            'Uygulanabilir mevzuat kapsamında; bilgi talep etme, düzeltme, silme ve itiraz gibi haklara sahip olabilirsiniz. Talepleriniz mevzuat çerçevesinde değerlendirilir.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Aydınlatma Metni: veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım ve haklar.',
  'Energetische Massage Aydınlatma Metni sayfası',
  'Aydınlatma Metni | Energetische Massage',
  'Energetische Massage aydınlatma metni; kişisel verilerin işlenmesi, hukuki sebepler, aktarım ve ilgili kişi hakları hakkında bilgilendirir.',
  'energetische massage,legal,aydinlatma metni,privacy notice,kisisel veri,veri isleme',
  NOW(3), NOW(3)
),
(
  @I18N_EN, @PAGE_NOTICE, 'en',
  'Information Notice',
  'information-notice',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Information Notice</h1>',
        '<p class="text-slate-700 mb-8">',
          'This notice provides general information about the processing of personal data, including data categories, purposes, legal grounds, transfers and your rights.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Data Controller</h2>',
          '<p class="text-slate-700">Energetische Massage is the data controller.</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Data We Process</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Contact data (name, email, phone)</li>',
              '<li>Booking request/message content</li>',
              '<li>Technical data and logs</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Purposes</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Receiving and managing booking requests</li>',
              '<li>Responding to enquiries</li>',
              '<li>Information security and system protection</li>',
              '<li>Complying with legal obligations</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Legal Grounds</h2>',
          '<p class="text-slate-700">Processing may rely on contract necessity, legitimate interests, legal obligations and consent where required.</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Transfers</h2>',
          '<p class="text-slate-700">',
            'Limited sharing with service providers (hosting, email delivery, security, etc.) may occur under contractual and security safeguards. ',
            'Disclosures to authorities may occur where required by law.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Your Rights</h2>',
          '<p class="text-white/90">You may contact us to exercise your rights under applicable laws. Requests are assessed and handled accordingly.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Information Notice: controller, purposes, legal grounds, transfers and rights.',
  'Energetische Massage Information Notice page',
  'Information Notice | Energetische Massage',
  'Energetische Massage information notice about personal data processing, transfers and data subject rights.',
  'energetische massage,legal,information notice,privacy,personal data,rights',
  NOW(3), NOW(3)
),
(
  @I18N_DE, @PAGE_NOTICE, 'de',
  'Informationspflicht',
  'informationspflicht',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Informationspflicht</h1>',
        '<p class="text-slate-700 mb-8">',
          'Diese Informationen erläutern die Verarbeitung personenbezogener Daten, einschließlich Kategorien, Zwecke, Rechtsgrundlagen, Weitergaben und Ihrer Rechte.',
        '</p>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Verantwortlicher</h2>',
          '<p class="text-slate-700">Verantwortlicher ist Energetische Massage.</p>',
        '</div>',

        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Verarbeitete Daten</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Kontaktdaten (Name, E-Mail, Telefon)</li>',
              '<li>Inhalte von Termin-/Anfragen</li>',
              '<li>Technische Daten und Logs</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Zwecke</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Entgegennahme und Verwaltung von Terminanfragen</li>',
              '<li>Beantwortung von Anfragen</li>',
              '<li>Informationssicherheit und Systemschutz</li>',
              '<li>Erfüllung gesetzlicher Pflichten</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Rechtsgrundlagen</h2>',
          '<p class="text-slate-700">Verarbeitung kann auf Vertragserforderlichkeit, berechtigte Interessen, gesetzliche Pflichten und ggf. Einwilligung gestützt werden.</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Weitergabe</h2>',
          '<p class="text-slate-700">',
            'Eine begrenzte Weitergabe an Dienstleister (Hosting, E-Mail, Sicherheit usw.) kann unter vertraglichen und technischen Schutzmaßnahmen erfolgen. ',
            'Gesetzliche Offenlegungen an Behörden können erforderlich sein.',
          '</p>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Ihre Rechte</h2>',
          '<p class="text-white/90">Sie können uns kontaktieren, um Ihre Betroffenenrechte nach anwendbarem Recht wahrzunehmen.</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Informationspflicht: Zwecke, Rechtsgrundlagen, Weitergabe und Betroffenenrechte.',
  'Energetische Massage Informationspflicht',
  'Informationspflicht | Energetische Massage',
  'Hinweise zur Datenverarbeitung bei Energetische Massage: Zwecke, Rechtsgrundlagen, Weitergabe und Rechte.',
  'energetische massage,legal,informationspflicht,datenschutz,personenbezogene daten',
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
