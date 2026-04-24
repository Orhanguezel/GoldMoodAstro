-- =============================================================
-- FILE: 040_site_settings.sql (energetische-massage-bonn) - MULTI-LOCALE (Dynamic) [FINAL]
--  - app_locales + default_locale => locale='*'
--  - localized settings => locale in ('tr','en','de')
--  - cookie_consent => LOCALIZED (tr/en/de)
--  - booking admin notifications => GLOBAL (booking_admin_emails, booking_admin_notification_enabled)
--  - SECURITY: no secrets in seed (smtp_password, cloudinary_api_secret placeholder)
--  - RERUNNABLE: upsert via UNIQUE (key, locale)
--  - FIX: avoids MySQL ER_UPDATE_TABLE_USED (1093) by NOT selecting from target table
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- =============================================================
-- TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`         CHAR(36)      NOT NULL,
  `key`        VARCHAR(100)  NOT NULL,
  `locale`     VARCHAR(8)    NOT NULL,
  `value`      TEXT          NOT NULL,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_locale_uq` (`key`, `locale`),
  KEY `site_settings_key_idx` (`key`),
  KEY `site_settings_locale_idx` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- GLOBAL: app_locales (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'app_locales',
  '*',
  CAST(
    JSON_ARRAY(
      JSON_OBJECT('code','de','label','Deutsch','is_default', TRUE,  'is_active', TRUE),
      JSON_OBJECT('code','en','label','English','is_default', FALSE, 'is_active', TRUE),
      JSON_OBJECT('code','tr','label','Türkçe','is_default', FALSE, 'is_active', TRUE),
      JSON_OBJECT('code','es','label','Español','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','fr','label','Français','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','it','label','Italiano','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','pt','label','Português','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','ru','label','Русский','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','ar','label','العربية','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','hi','label','हिन्दी','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','bn','label','বাংলা','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','pa','label','ਪੰਜਾਬੀ','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','ja','label','日本語','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','ko','label','한국어','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','zh','label','中文','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','id','label','Bahasa Indonesia','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','vi','label','Tiếng Việt','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','th','label','ไทย','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','nl','label','Nederlands','is_default', FALSE, 'is_active', FALSE),
      JSON_OBJECT('code','pl','label','Polski','is_default', FALSE, 'is_active', FALSE)
    )
  AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: default_locale (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'default_locale',
  '*',
  'de',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Public Base URL (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'public_base_url',
  '*',
  'https://www.energetische-massage-bonn.de',
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Booking Admin Notification (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'booking_admin_notification_enabled',
  '*',
  'true',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'booking_admin_emails',
  '*',
  CAST(JSON_ARRAY('info@energetische-massage-bonn.de') AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: TR içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_title',
  'tr',
  'Energetische Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'tr',
  CAST(JSON_OBJECT(
    'companyName','Energetische Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@energetische-massage-bonn.de',
    'address','Bonn — randevu ile',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.energetische-massage-bonn.de',
    'notes','Randevu ve sorularınız için e-posta veya WhatsApp üzerinden ulaşabilirsiniz. Seanslar ön görüşme ve onay ile planlanır.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'socials',
  'tr',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/energetischemassagebonn',
    'facebook','https://facebook.com/energetischemassagebonn',
    'youtube','https://youtube.com/@energetischemassagebonn',
    'linkedin','https://linkedin.com/company/energetischemassagebonn',
    'x','https://x.com/energetischemassagebonn',
    'tiktok','https://tiktok.com/@energetischemassagebonn'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_profile',
  'tr',
  CAST(JSON_OBJECT(
    'headline','Bonn''da Enerjetik Masaj',
    'subline','Kalpten dokunuş, bilinçli varlık ve güvenli bir alanla derin gevşeme.',
    'body','Energetische Massage, Anastasia König''in Bonn''da sunduğu enerjetik masaj seanslarını bir araya getirir. Tayland''da ve farklı ülkelerde edindiği masaj tekniklerini, sezgisel yaklaşımı ve dikkatli dokunuşla birleştirir. Her seans kişiye özel, saygılı ve net sınırlar içinde ilerler. Amaç; beden farkındalığını desteklemek, iç huzuru güçlendirmek ve gündelik yükleri geride bırakmanıza yardımcı olmaktır. Terminler ön görüşme ile, randevuya göre planlanır.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_brand',
  'tr',
  CAST(JSON_OBJECT(
    'name','Energetische Massage',
    'shortName','EM',
    'website','https://www.energetische-massage-bonn.de',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
      'width',120,
      'height',120,
      'alt','Energetische Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'catalog_admin_user_ids',
  'tr',
  CAST(JSON_ARRAY() AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: EN içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_title',
  'en',
  'Energetische Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'en',
  CAST(JSON_OBJECT(
    'companyName','Energetische Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@energetische-massage-bonn.de',
    'address','Bonn — by appointment',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.energetische-massage-bonn.de',
    'notes','For bookings and questions, contact via email or WhatsApp. Sessions are arranged after a short pre-chat and consent.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'socials',
  'en',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/energetischemassagebonn',
    'facebook','https://facebook.com/energetischemassagebonn',
    'youtube','https://youtube.com/@energetischemassagebonn',
    'linkedin','https://linkedin.com/company/energetischemassagebonn',
    'x','https://x.com/energetischemassagebonn',
    'tiktok','https://tiktok.com/@energetischemassagebonn'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_profile',
  'en',
  CAST(JSON_OBJECT(
    'headline','Energetic Massage in Bonn',
    'subline','Healing touch with heart — mindful presence, clear boundaries, and deep relaxation.',
    'body','Energetische Massage brings together the energetic massage sessions offered by Anastasia König in Bonn. She combines bodywork techniques learned in Thailand and across her travels with an intuitive, attentive approach. Each session is individual, respectful, and clearly bounded. The intention is to support body awareness, inner calm, and a gentle release from everyday pressure. Appointments are available by arrangement after a short conversation and consent.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_brand',
  'en',
  CAST(JSON_OBJECT(
    'name','Energetische Massage',
    'shortName','EM',
    'website','https://www.energetische-massage-bonn.de',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
      'width',120,
      'height',120,
      'alt','Energetische Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: DE içerik ayarları
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_title',
  'de',
  'Energetische Massage',
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_info',
  'de',
  CAST(JSON_OBJECT(
    'companyName','Energetische Massage',
    'phones',JSON_ARRAY('+49 176 41107158'),
    'email','info@energetische-massage-bonn.de',
    'address','Bonn — nach Terminvereinbarung',
    'addressSecondary','',
    'whatsappNumber','+49 176 41107158',
    'website','https://www.energetische-massage-bonn.de',
    'notes','Für Termine und Fragen erreichen Sie mich per E-Mail oder WhatsApp. Termine nach kurzem Vorgespräch und Einverständnis.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'socials',
  'de',
  CAST(JSON_OBJECT(
    'instagram','https://instagram.com/energetischemassagebonn',
    'facebook','https://facebook.com/energetischemassagebonn',
    'youtube','https://youtube.com/@energetischemassagebonn',
    'linkedin','https://linkedin.com/company/energetischemassagebonn',
    'x','https://x.com/energetischemassagebonn',
    'tiktok','https://tiktok.com/@energetischemassagebonn'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_profile',
  'de',
  CAST(JSON_OBJECT(
    'headline','Energetische Massage in Bonn',
    'subline','Heilende Berührung mit Herz — achtsam, klar abgegrenzt und individuell.',
    'body','Energetische Massage bündelt die energetischen Massage-Sessions von Anastasia König in Bonn. Techniken aus Thailand und weiteren Reisen verbinden sich mit einer intuitiven, präsenten Arbeitsweise. Jede Sitzung ist persönlich, respektvoll und in klaren Grenzen gehalten. Im Mittelpunkt stehen Körperwahrnehmung, innere Ruhe und ein sanftes Loslassen vom Alltag. Termine nach Vereinbarung, idealerweise nach kurzem Vorgespräch und Einverständnis.'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'company_brand',
  'de',
  CAST(JSON_OBJECT(
    'name','Energetische Massage',
    'shortName','EM',
    'website','https://www.energetische-massage-bonn.de',
    'logo',JSON_OBJECT(
      'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
      'width',120,
      'height',120,
      'alt','Energetische Massage Logo'
    ),
    'images',JSON_ARRAY(
      JSON_OBJECT('type','logo','url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp')
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Storage (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'storage_driver', '*', 'cloudinary', NOW(3), NOW(3)),
(UUID(), 'storage_local_root', '*', '/var/www/konigsmassage/uploads', NOW(3), NOW(3)),
(UUID(), 'storage_local_base_url', '*', '/uploads', NOW(3), NOW(3)),
(UUID(), 'cloudinary_cloud_name', '*', 'dbozv7wqd', NOW(3), NOW(3)),
(UUID(), 'cloudinary_api_key', '*', '644676135993432', NOW(3), NOW(3)),
(UUID(), 'cloudinary_api_secret', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(UUID(), 'cloudinary_folder', '*', 'uploads/energetische-massage', NOW(3), NOW(3)),
(UUID(), 'cloudinary_unsigned_preset', '*', 'energetische_massage_unsigned', NOW(3), NOW(3)),
(UUID(), 'storage_cdn_public_base', '*', 'https://res.cloudinary.com', NOW(3), NOW(3)),
(UUID(), 'storage_public_api_base', '*', 'https://www.energetische-massage-bonn.de/api', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: SMTP (locale='*')  (placeholders; set real values via Admin)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'smtp_host', '*', 'smtp.example.com', NOW(3), NOW(3)),
(UUID(), 'smtp_port', '*', '465', NOW(3), NOW(3)),
(UUID(), 'smtp_username', '*', 'no-reply@energetische-massage-bonn.de', NOW(3), NOW(3)),
(UUID(), 'smtp_password', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(UUID(), 'smtp_from_email', '*', 'no-reply@energetische-massage-bonn.de', NOW(3), NOW(3)),
(UUID(), 'smtp_from_name', '*', 'Energetische Massage', NOW(3), NOW(3)),
(UUID(), 'smtp_ssl', '*', 'true', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Google OAuth (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'google_client_id', '*', 'change-me-in-admin', NOW(3), NOW(3)),
(UUID(), 'google_client_secret', '*', 'change-me-in-admin', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Analytics & Tracking (locale='*')  (optional; placeholders)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(UUID(), 'gtm_container_id', '*', '', NOW(3), NOW(3)),
(UUID(), 'ga4_measurement_id', '*', '', NOW(3), NOW(3)),
(UUID(), 'facebook_pixel_id', '*', '', NOW(3), NOW(3)),
(UUID(), 'google_site_verification', '*', '', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- GLOBAL: Site Media (locale='*')
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'site_logo',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
    'alt','Energetische Massage Logo'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_logo_dark',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
    'alt','Energetische Massage Logo (Dark)'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_logo_light',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1773003525/site-media/ChatGPT_Image_8_Mar_2026_21_57_57.webp',
    'alt','Energetische Massage Logo (Light)'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_favicon',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1771039304/site-media/koenig-energetik-icon.svg',
    'alt','Energetische Massage Favicon'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_og_default_image',
  '*',
  CAST(JSON_OBJECT(
    'url','https://res.cloudinary.com/dbozv7wqd/image/upload/v1768222471/site-media/about.png',
    'width',1200,
    'height',630,
    'alt','Energetische Massage - Energetische Massage in Bonn'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'site_appointment_cover',
  '*',
  CAST(JSON_OBJECT(
    'url','/uploads/anas-3.jpg',
    'width',1200,
    'height',800,
    'alt','Energetische Massage - Termin-Titelbild'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- =============================================================
-- LOCALIZED: Cookie Consent Config (tr/en/de)
-- =============================================================
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'cookie_consent',
  'tr',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Çerez Tercihleri',
      'description', 'Sitenin doğru çalışması için gerekli çerezleri ve isteğe bağlı analiz çerezlerini kullanırız. Tercihlerinizi yönetebilirsiniz.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'cookie_consent',
  'en',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Cookie Preferences',
      'description', 'We use necessary cookies to run the site and optional analytics cookies to understand traffic. You can manage your preferences.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'cookie_consent',
  'de',
  CAST(JSON_OBJECT(
    'consent_version', 1,
    'defaults', JSON_OBJECT('necessary', TRUE, 'analytics', FALSE, 'marketing', FALSE),
    'ui', JSON_OBJECT('enabled', TRUE, 'position', 'bottom', 'show_reject_all', TRUE),
    'texts', JSON_OBJECT(
      'title', 'Cookie-Einstellungen',
      'description', 'Wir verwenden notwendige Cookies für den Betrieb der Website und optionale Analyse-Cookies, um den Traffic besser zu verstehen. Sie können Ihre Einstellungen verwalten.'
    )
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
