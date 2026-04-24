-- =============================================================
-- FILE: 051.5_custom_pages_kvkk.seed.sql (FINAL — Energetische Massage, rerunnable)
-- Energetische Massage - Custom Page: Datenschutz / KVKK (TR/EN/DE)
-- ✅ custom_pages.module_key = 'kvkk'
-- Category/SubCategory: optional (NULL) — admin panelden düzenlenir
-- NOT: Bu dosyada BLOK YORUM (/* */) YOKTUR. Sadece "--" kullanılır.
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- PAGE ID (stable)
-- -------------------------------------------------------------
SET @PAGE_KVKK := '55550003-5555-4555-8555-555555550003';

-- PARENT MODULE KEY
SET @MODULE_KEY := 'kvkk';

-- Deterministic I18N IDs (rerunnable)
SET @I18N_TR := '66660003-5555-4555-8555-5555555500tr';
SET @I18N_EN := '66660003-5555-4555-8555-5555555500en';
SET @I18N_DE := '66660003-5555-4555-8555-5555555500de';

-- Images (optional)
SET @IMG_KVKK :=
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80';
SET @IMG_KVKK_2 :=
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80';
SET @IMG_KVKK_3 :=
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1400&q=80';

-- -------------------------------------------------------------
-- PARENT UPSERT (custom_pages)
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
    @PAGE_KVKK,
    @MODULE_KEY,
    1,
    0,
    20,
    20,
    @IMG_KVKK,
    NULL,
    @IMG_KVKK,
    NULL,
    JSON_ARRAY(@IMG_KVKK, @IMG_KVKK_2, @IMG_KVKK_3),
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
-- ✅ module_key yok
-- ✅ deterministic IDs => rerunnable
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
  @I18N_TR, @PAGE_KVKK, 'tr',
  'KVKK / Gizlilik',
  'kvkk',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">KVKK / Gizlilik</h1>',
        '<p class="text-slate-700 mb-8">',
          'Energetische Massage, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuat kapsamında kişisel verilerinizi işler ve korur. ',
          'Bu sayfa; genel bilgilendirme niteliğindedir ve veri kategorileri, amaçlar, hukuki sebepler ve ilgili kişi haklarına dair özet sunar.',
        '</p>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Veri Sorumlusu</h2>',
          '<p class="text-slate-700">',
            'Kişisel verileriniz, veri sorumlusu sıfatıyla Energetische Massage tarafından KVKK ve ilgili mevzuata uygun olarak işlenebilir.',
          '</p>',
        '</div>',
        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. İşlenen Veri Kategorileri</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Kimlik ve iletişim verileri (ad-soyad, e-posta, telefon vb.)</li>',
              '<li>Randevu/rezervasyon bilgileri (tarih, saat, tercih edilen hizmet vb.)</li>',
              '<li>Talep/mesaj içerikleri ve yazışmalar</li>',
              '<li>İşlem güvenliği ve teknik log verileri (güvenlik amaçlı)</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. İşleme Amaçları</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Randevu oluşturma, yönetme ve hizmet sunumu</li>',
              '<li>Taleplere dönüş ve müşteri iletişimi</li>',
              '<li>Hizmet kalitesinin artırılması ve süreç iyileştirmeleri</li>',
              '<li>Bilgi güvenliği ve kötüye kullanımın önlenmesi</li>',
              '<li>Hukuki yükümlülüklerin yerine getirilmesi</li>',
            '</ul>',
          '</div>',
        '</div>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Hukuki Sebepler</h2>',
          '<p class="text-slate-700 mb-3">',
            'Veriler; sözleşmenin kurulması/ifası, meşru menfaat, hukuki yükümlülüklerin yerine getirilmesi ve gerekli hallerde açık rıza gibi hukuki sebeplere dayanarak işlenebilir.',
          '</p>',
          '<p class="text-slate-700">',
            'Somut süreçlere göre hukuki sebep değişebilir. Detaylı açıklamalar ilgili aydınlatma metinlerinde ayrıca yer alır.',
          '</p>',
        '</div>',
        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Veri Güvenliği</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Erişim kontrolü ve yetkilendirme</li>',
            '<li>Loglama, izleme ve olay yönetimi</li>',
            '<li>Yedekleme ve iş sürekliliği önlemleri</li>',
            '<li>Gerekli hallerde tedarikçilerle gizlilik yükümlülükleri</li>',
          '</ul>',
        '</div>',
        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Başvuru Hakları</h2>',
          '<p class="text-white/90">',
            'KVKK kapsamında; bilgi talep etme, düzeltme, silme, işleme itiraz etme gibi haklara sahipsiniz. Başvurularınız mevzuat çerçevesinde değerlendirilir.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage KVKK/Gizlilik sayfası: kişisel verilerin işlenmesi ve ilgili kişi haklarına ilişkin genel bilgilendirme.',
  'Energetische Massage KVKK bilgilendirme sayfası',
  'KVKK / Gizlilik | Energetische Massage',
  'Energetische Massage KVKK bilgilendirmesi: veri işleme amaçları, hukuki sebepler, güvenlik önlemleri ve başvuru hakları.',
  'energetische massage,legal,kvkk,gizlilik,kisisel veri,veri guvenligi,randevu',
  NOW(3), NOW(3)
),
(
  @I18N_EN, @PAGE_KVKK, 'en',
  'Privacy / PDPL (KVKK)',
  'privacy-pdpl-kvkk',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Privacy / PDPL (KVKK)</h1>',
        '<p class="text-slate-700 mb-8">',
          'Energetische Massage processes and protects personal data in accordance with Turkish PDPL (KVKK No. 6698) and applicable regulations. ',
          'This page provides a general overview of data categories, purposes, legal grounds and data subject rights.',
        '</p>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Data Controller</h2>',
          '<p class="text-slate-700">Energetische Massage may process personal data as the data controller in line with applicable laws.</p>',
        '</div>',
        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Data Categories</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Identity and contact data (name, email, phone, etc.)</li>',
              '<li>Appointment/booking details (date, time, service preference)</li>',
              '<li>Request/correspondence content</li>',
              '<li>Security and technical log data (for security purposes)</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Purposes</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Creating and managing appointments and providing services</li>',
              '<li>Responding to requests and customer communication</li>',
              '<li>Improving service quality and processes</li>',
              '<li>Ensuring information security and preventing misuse</li>',
              '<li>Complying with legal obligations</li>',
            '</ul>',
          '</div>',
        '</div>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Legal Grounds</h2>',
          '<p class="text-slate-700">',
            'Data may be processed based on contract performance, legitimate interests, compliance with legal obligations, and consent where required. ',
            'Legal grounds may vary depending on the specific process.',
          '</p>',
        '</div>',
        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Security</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Access controls and authorisation</li>',
            '<li>Logging, monitoring and incident management</li>',
            '<li>Backups and business continuity measures</li>',
            '<li>Confidentiality obligations with providers where applicable</li>',
          '</ul>',
        '</div>',
        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Data Subject Rights</h2>',
          '<p class="text-white/90">',
            'You have rights such as requesting information, rectification, deletion and objection. Requests are handled according to applicable laws.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage privacy/PDPL overview: data categories, purposes, legal grounds and rights.',
  'Energetische Massage privacy notice page',
  'Privacy / PDPL (KVKK) | Energetische Massage',
  'Overview of personal data processing at Energetische Massage: purposes, legal grounds, security measures and data subject rights.',
  'energetische massage,legal,privacy,pdpl,kvkk,data protection,appointments',
  NOW(3), NOW(3)
),
(
  @I18N_DE, @PAGE_KVKK, 'de',
  'Datenschutz / DSGVO',
  'datenschutz',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Datenschutz</h1>',
        '<p class="text-slate-700 mb-8">',
          'Energetische Massage verarbeitet personenbezogene Daten im Einklang mit den anwendbaren gesetzlichen Vorgaben (insbesondere DSGVO, soweit anwendbar). ',
          'Diese Seite bietet eine allgemeine Übersicht zu Kategorien, Zwecken, Rechtsgrundlagen und Betroffenenrechten.',
        '</p>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Verantwortlicher</h2>',
          '<p class="text-slate-700">Energetische Massage kann personenbezogene Daten als Verantwortlicher rechtskonform verarbeiten.</p>',
        '</div>',
        '<div class="grid md:grid-cols-2 gap-6 mb-6">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Datenkategorien</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Kontakt- und Identifikationsdaten (Name, E-Mail, Telefon)</li>',
              '<li>Termin-/Buchungsdaten (Datum, Uhrzeit, Service)</li>',
              '<li>Inhalte von Anfragen/Korrespondenz</li>',
              '<li>Sicherheits- und technische Logdaten</li>',
            '</ul>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Zwecke</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Terminvereinbarung, -verwaltung und Leistungserbringung</li>',
              '<li>Kundenkommunikation und Bearbeitung von Anfragen</li>',
              '<li>Qualitätsmanagement und Prozessverbesserung</li>',
              '<li>Informationssicherheit und Missbrauchsprävention</li>',
              '<li>Erfüllung gesetzlicher Pflichten</li>',
            '</ul>',
          '</div>',
        '</div>',
        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Rechtsgrundlagen</h2>',
          '<p class="text-slate-700">',
            'Die Verarbeitung kann auf Grundlage vertraglicher Erforderlichkeit, berechtigter Interessen, gesetzlicher Pflichten und - sofern erforderlich - Einwilligung erfolgen. ',
            'Die Rechtsgrundlage kann je nach Prozess variieren.',
          '</p>',
        '</div>',
        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Sicherheit</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Zugriffskontrollen und Berechtigungen</li>',
            '<li>Protokollierung, Monitoring und Incident-Management</li>',
            '<li>Backups und Maßnahmen zur Geschäftskontinuität</li>',
            '<li>Ggf. vertragliche Vertraulichkeitsregelungen</li>',
          '</ul>',
        '</div>',
        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">6. Betroffenenrechte</h2>',
          '<p class="text-white/90">',
            'Sie haben Rechte wie Auskunft, Berichtigung, Löschung und Widerspruch. Anträge werden nach anwendbarem Recht bearbeitet.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Datenschutzhinweis: Kategorien, Zwecke, Rechtsgrundlagen und Betroffenenrechte.',
  'Energetische Massage Datenschutz Seite',
  'Datenschutz | Energetische Massage',
  'Informationen zur Verarbeitung personenbezogener Daten bei Energetische Massage: Zwecke, Rechtsgrundlagen, Sicherheitsmaßnahmen und Betroffenenrechte.',
  'energetische massage,legal,datenschutz,dsgvo,privacy,personenbezogene daten,termine',
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
