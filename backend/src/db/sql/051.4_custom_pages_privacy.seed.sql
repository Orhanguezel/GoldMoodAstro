-- =============================================================
-- FILE: 051.4_custom_pages_privacy.seed.sql (FINAL — Energetische Massage, rerunnable)
-- Energetische Massage - Custom Page: Privacy Policy / Datenschutz (TR/EN/DE)
-- ✅ PARENT: custom_pages.module_key = 'privacy'
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
SET @PAGE_PRIVACY := '55550002-5555-4555-8555-555555550002';

-- -------------------------------------------------------------
-- PARENT MODULE KEY
-- -------------------------------------------------------------
SET @MODULE_KEY := 'privacy';

-- Deterministic I18N IDs (rerunnable)
SET @I18N_TR := '66660002-5555-4555-8555-5555555500tr';
SET @I18N_EN := '66660002-5555-4555-8555-5555555500en';
SET @I18N_DE := '66660002-5555-4555-8555-5555555500de';

-- FEATURED IMAGE (optional)
SET @IMG_PRIVACY :=
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1400&q=80';
SET @IMG_PRIVACY_2 :=
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80';
SET @IMG_PRIVACY_3 :=
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1400&q=80';

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
    @PAGE_PRIVACY,
    @MODULE_KEY,
    1,
    0,
    10,
    10,
    @IMG_PRIVACY,
    NULL,
    @IMG_PRIVACY,
    NULL,
    JSON_ARRAY(@IMG_PRIVACY, @IMG_PRIVACY_2, @IMG_PRIVACY_3),
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

-- -------------------------------------------------------------
-- TR
-- -------------------------------------------------------------
(
  @I18N_TR,
  @PAGE_PRIVACY,
  'tr',
  'Gizlilik Politikası',
  'gizlilik-politikasi',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Gizlilik Politikası</h1>',
        '<p class="text-slate-700 mb-8">',
          'Energetische Massage olarak, web sitemizi ziyaret eden kullanıcılarımızın gizliliğini korumayı ve kişisel verileri yürürlükteki mevzuata uygun şekilde işlemeyi taahhüt ederiz. ',
          'Bu metin; hangi verileri topladığımızı, ne amaçla işlediğimizi, nasıl sakladığımızı ve haklarınızı açıklar.',
        '</p>',

        '<div class="grid md:grid-cols-2 gap-6 mb-10">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Kapsam</h2>',
            '<p class="text-slate-700">',
              'Bu politika; web sitesi ziyaretleri, iletişim formları, randevu talepleri/rezervasyon süreçleri, e-posta iletişimi ve teknik loglar dahil olmak üzere ',
              'dijital kanallardan elde edilen verileri kapsar.',
            '</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Toplanan Veriler</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>İletişim: ad-soyad, e-posta, telefon</li>',
              '<li>Randevu: tarih, saat, seçilen hizmet/terapist (varsa), notlar</li>',
              '<li>Talep içeriği: mesajlar ve yazışmalar</li>',
              '<li>Teknik: IP, tarayıcı/cihaz, sayfa görüntüleme, erişim zamanı, güvenlik logları</li>',
              '<li>Çerezler: tercih ve kullanım verileri (detaylar Çerez Politikası''nda)</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. İşleme Amaçları</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Randevu oluşturmak, yönetmek ve hizmet sunmak</li>',
            '<li>Taleplerinize yanıt vermek ve müşteri iletişimini sürdürmek</li>',
            '<li>Web sitesi güvenliği, hata analizi, performans ve kullanıcı deneyimini iyileştirmek</li>',
            '<li>Yasal yükümlülüklerin yerine getirilmesi ve uyuşmazlık yönetimi</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Hukuki Sebepler</h2>',
          '<p class="text-slate-700 mb-3">',
            'Veriler; sözleşmenin kurulması/ifası, meşru menfaat, hukuki yükümlülüklerin yerine getirilmesi ve gerekli hallerde açık rıza gibi hukuki sebeplere dayanarak işlenebilir.',
          '</p>',
          '<p class="text-slate-700">',
            'Somut süreçlere göre hukuki sebep değişebilir. Gerekli durumlarda ek aydınlatma metinleri sunulur.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Saklama Süreleri</h2>',
          '<p class="text-slate-700 mb-3">',
            'Veriler; ilgili amacın gerektirdiği süre boyunca ve/veya mevzuatta öngörülen sürelerle sınırlı olacak şekilde saklanır.',
          '</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Randevu ve iletişim kayıtları: süreç gereksinimi + yasal süreler</li>',
            '<li>Güvenlik ve sistem logları: güvenlik/denetim ihtiyacı ile sınırlı</li>',
            '<li>Çerez verileri: çerez türüne göre değişir</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. Üçüncü Taraflar ve Aktarımlar</h2>',
          '<p class="text-slate-700 mb-3">',
            'Hizmet altyapısı (barındırma, e-posta gönderimi, güvenlik, analiz vb.) kapsamında sınırlı ölçüde hizmet sağlayıcılarla paylaşım olabilir. ',
            'Bu paylaşımlar sözleşmesel yükümlülükler ve teknik/idari tedbirlerle yönetilir.',
          '</p>',
          '<p class="text-slate-700">',
            'Üçüncü tarafların veri işleme faaliyetleri kendi politikalarına tabi olabilir. İlgili sağlayıcıların koşullarını incelemenizi öneririz.',
          '</p>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">7. Güvenlik Önlemleri</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Erişim kontrolü ve yetkilendirme</li>',
            '<li>İletişim güvenliği ve izleme</li>',
            '<li>Yedekleme ve iş sürekliliği tedbirleri</li>',
            '<li>Loglama ve olay yönetimi süreçleri</li>',
          '</ul>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">8. Haklarınız ve İletişim</h2>',
          '<p class="text-white/90 mb-3">',
            'Kişisel verilerinizle ilgili talepleriniz için bizimle iletişime geçebilirsiniz. Başvurular, ilgili mevzuat kapsamındaki haklar çerçevesinde değerlendirilir.',
          '</p>',
          '<p class="text-white/80">',
            'Çerez tercihleri için Çerez Politikası ve çerez tercihleri sayfasını kullanabilirsiniz.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Gizlilik Politikası: web sitesinde toplanan veriler, kullanım amaçları, hukuki sebepler, saklama, güvenlik ve kullanıcı hakları.',
  'Energetische Massage Gizlilik Politikası sayfası',
  'Gizlilik Politikası | Energetische Massage',
  'Energetische Massage Gizlilik Politikası; toplanan veriler, işleme amaçları, hukuki sebepler, saklama ve güvenlik önlemleri ile kullanıcı haklarını açıklar.',
  'energetische massage,legal,gizlilik,privacy,kvkk,veri guvenligi,cerezler,randevu',
  NOW(3),
  NOW(3)
),

-- -------------------------------------------------------------
-- EN
-- -------------------------------------------------------------
(
  @I18N_EN,
  @PAGE_PRIVACY,
  'en',
  'Privacy Policy',
  'privacy-policy',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Privacy Policy</h1>',
        '<p class="text-slate-700 mb-8">',
          'At Energetische Massage, we are committed to protecting the privacy of visitors and processing personal data in compliance with applicable laws. ',
          'This notice explains what we collect, why we process it, how we store it, and your rights.',
        '</p>',

        '<div class="grid md:grid-cols-2 gap-6 mb-10">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Scope</h2>',
            '<p class="text-slate-700">',
              'This policy covers data collected via website visits, contact forms, appointment/booking processes, email communications, and technical logs.',
            '</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Contact details: name, email, phone</li>',
              '<li>Appointment details: date, time, selected service/therapist (if applicable), notes</li>',
              '<li>Request content: messages and correspondence</li>',
              '<li>Technical data: IP, browser/device, page views, access times, security logs</li>',
              '<li>Cookies: usage and preference data (see Cookie Policy)</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Purposes of Processing</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>To create and manage appointments and provide services</li>',
            '<li>To respond to inquiries and maintain customer communication</li>',
            '<li>To improve website security, error analysis, performance and user experience</li>',
            '<li>To comply with legal obligations and manage disputes</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Legal Bases</h2>',
          '<p class="text-slate-700 mb-3">',
            'Data may be processed based on contract performance, legitimate interests, compliance with legal obligations, and consent where required.',
          '</p>',
          '<p class="text-slate-700">',
            'The legal basis may vary depending on the specific process. Additional notices may be provided where needed.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Retention</h2>',
          '<p class="text-slate-700 mb-3">',
            'We retain data only as long as necessary for the stated purposes and/or as required by law.',
          '</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Appointment and contact records: as needed for the process and legal requirements</li>',
            '<li>Security/system logs: limited to security/audit needs</li>',
            '<li>Cookie data: varies by cookie type</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. Service Providers and Sharing</h2>',
          '<p class="text-slate-700 mb-3">',
            'We may share limited data with service providers (hosting, email delivery, security, analytics, etc.) under contractual and security safeguards.',
          '</p>',
          '<p class="text-slate-700">',
            'Third-party processing may be subject to their own policies. We recommend reviewing relevant provider terms.',
          '</p>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">7. Security Measures</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Access controls and authorisation</li>',
            '<li>Secure communications and monitoring</li>',
            '<li>Backups and business continuity</li>',
            '<li>Logging and incident management processes</li>',
          '</ul>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">8. Your Rights and Contact</h2>',
          '<p class="text-white/90 mb-3">',
            'You may contact us regarding your personal data. Requests are handled within the scope of applicable laws and our information notices.',
          '</p>',
          '<p class="text-white/80">',
            'For cookies, please use the cookie preferences and Cookie Policy page.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Privacy Policy: data collected on the website, purposes, legal bases, retention, security and user rights.',
  'Energetische Massage Privacy Policy page',
  'Privacy Policy | Energetische Massage',
  'Energetische Massage Privacy Policy explains what data we collect, why and how we process it, retention, security measures, and user rights.',
  'energetische massage,legal,privacy policy,data protection,cookies,security,appointments',
  NOW(3),
  NOW(3)
),

-- -------------------------------------------------------------
-- DE
-- -------------------------------------------------------------
(
  @I18N_DE,
  @PAGE_PRIVACY,
  'de',
  'Datenschutzerklärung',
  'datenschutzerklaerung',
  JSON_OBJECT(
    'html',
    CONCAT(
      '<section class="container mx-auto px-4 py-10">',
        '<h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Datenschutzerklärung</h1>',
        '<p class="text-slate-700 mb-8">',
          'Energetische Massage verpflichtet sich, die Privatsphäre der Besucher zu schützen und personenbezogene Daten im Einklang mit den anwendbaren gesetzlichen Vorgaben zu verarbeiten. ',
          'Diese Erklärung beschreibt Datenkategorien, Zwecke, Rechtsgrundlagen, Speicherfristen, Sicherheitsmaßnahmen und Ihre Rechte.',
        '</p>',

        '<div class="grid md:grid-cols-2 gap-6 mb-10">',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">1. Geltungsbereich</h2>',
            '<p class="text-slate-700">',
              'Diese Richtlinie umfasst Daten aus Websitebesuchen, Kontaktformularen, Termin-/Buchungsprozessen, E-Mail-Kommunikation und technischen Logs.',
            '</p>',
          '</div>',
          '<div class="bg-white border border-slate-200 rounded-2xl p-6">',
            '<h2 class="text-xl font-semibold text-slate-900 mb-3">2. Erhobene Daten</h2>',
            '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
              '<li>Kontakt: Name, E-Mail, Telefon</li>',
              '<li>Termin: Datum, Uhrzeit, ausgewählter Service/Therapeut (falls zutreffend), Notizen</li>',
              '<li>Anfrageinhalte: Nachrichten und Korrespondenz</li>',
              '<li>Technische Daten: IP, Browser/Gerät, Seitenaufrufe, Zugriffszeiten, Sicherheitslogs</li>',
              '<li>Cookies: Nutzungs- und Präferenzdaten (siehe Cookie-Richtlinie)</li>',
            '</ul>',
          '</div>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">3. Zwecke</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Terminvereinbarung, -verwaltung und Leistungserbringung</li>',
            '<li>Bearbeitung von Anfragen und Kundenkommunikation</li>',
            '<li>Verbesserung von Sicherheit, Fehleranalyse, Performance und Nutzererlebnis</li>',
            '<li>Erfüllung gesetzlicher Pflichten und Streitbeilegung</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">4. Rechtsgrundlagen</h2>',
          '<p class="text-slate-700 mb-3">',
            'Die Verarbeitung kann auf Grundlage vertraglicher Erforderlichkeit, berechtigter Interessen, gesetzlicher Pflichten und - sofern erforderlich - Einwilligung erfolgen.',
          '</p>',
          '<p class="text-slate-700">',
            'Die Rechtsgrundlage kann je nach Prozess variieren. Gegebenenfalls stellen wir zusätzliche Hinweise bereit.',
          '</p>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">5. Speicherdauer</h2>',
          '<p class="text-slate-700 mb-3">',
            'Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist und/oder gesetzliche Pflichten bestehen.',
          '</p>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Termin- und Kontaktdaten: prozessbezogen + gesetzliche Fristen</li>',
            '<li>Sicherheits-/Systemlogs: begrenzt nach Sicherheits-/Auditbedarf</li>',
            '<li>Cookie-Daten: abhängig vom Cookie-Typ</li>',
          '</ul>',
        '</div>',

        '<div class="bg-white border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">6. Dienstleister und Weitergabe</h2>',
          '<p class="text-slate-700 mb-3">',
            'Eine begrenzte Weitergabe an Dienstleister (Hosting, E-Mail, Sicherheit, Analyse etc.) kann erfolgen und wird durch Verträge sowie Sicherheitsmaßnahmen abgesichert.',
          '</p>',
          '<p class="text-slate-700">',
            'Drittanbieter können eigenen Richtlinien unterliegen. Bitte prüfen Sie die jeweiligen Bedingungen.',
          '</p>',
        '</div>',

        '<div class="bg-gradient-to-br from-slate-50 to-pink-50 border border-slate-200 rounded-2xl p-6 mb-6">',
          '<h2 class="text-xl font-semibold text-slate-900 mb-3">7. Sicherheitsmaßnahmen</h2>',
          '<ul class="list-disc pl-6 text-slate-700 space-y-2">',
            '<li>Zugriffskontrolle und Berechtigungen</li>',
            '<li>Sichere Kommunikation und Monitoring</li>',
            '<li>Backups und Notfallmaßnahmen</li>',
            '<li>Protokollierung und Incident-Management</li>',
          '</ul>',
        '</div>',

        '<div class="bg-slate-900 text-white rounded-2xl p-6">',
          '<h2 class="text-xl font-semibold mb-3">8. Rechte und Kontakt</h2>',
          '<p class="text-white/90 mb-3">',
            'Sie können uns bezüglich Ihrer personenbezogenen Daten kontaktieren. Anträge werden im Rahmen der anwendbaren Gesetze und Informationspflichten bearbeitet.',
          '</p>',
          '<p class="text-white/80">',
            'Cookie-Einstellungen verwalten Sie über die Cookie-Hinweise und die Cookie-Richtlinie.',
          '</p>',
        '</div>',
      '</section>'
    )
  ),
  'Energetische Massage Datenschutzerklärung: Datenkategorien, Zwecke, Rechtsgrundlagen, Aufbewahrung, Sicherheitsmaßnahmen und Rechte der Nutzer.',
  'Energetische Massage Datenschutzerklärung',
  'Datenschutzerklärung | Energetische Massage',
  'Die Energetische Massage Datenschutzerklärung erläutert, welche Daten wir erheben, wofür wir sie verwenden, wie wir sie schützen und welche Rechte Nutzer haben.',
  'energetische massage,legal,datenschutz,privacy,cookies,sicherheit,personenbezogene daten,termine',
  NOW(3),
  NOW(3)
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
