-- =============================================================
-- 043_site_settings_ui_common.sql  (Common UI strings)
--  - ui_banner (breadcrumb)
--  - ui_contact (contact form + SEO)
--  - contact_map (map config)
--  - Localized: tr / en / de
--  - Extendable: clone from tr as bootstrap (collation-safe)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =============================================================
-- ui_banner : breadcrumb vb. ortak UI metinleri
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_banner',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Ana Sayfa'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_banner',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Home'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_banner',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_breadcrumb_home', 'Startseite'
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
-- ui_contact : Contact page UI + SEO strings (FULL)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_contact',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'İletişim',

      'ui_contact_subprefix',                'Energetische Massage',
      'ui_contact_sublabel',                 'İletişim',
      'ui_contact_title_left',               'Konuşalım',
      'ui_contact_tagline',                  'Sorularınız ve randevu talepleriniz için bize yazın. Seanslar Bonn''da, ön görüşme ve onay ile planlanır.',

      'ui_contact_quick_email_placeholder',  'E-posta adresiniz',
      'ui_contact_quick_email_aria',         'E-postayı forma aktar',

      'ui_contact_form_title',               'Mesaj gönderin',
      'ui_contact_first_name',               'Adınız*',
      'ui_contact_last_name',                'Soyadınız',
      'ui_contact_company',                  'Not (opsiyonel)',
      'ui_contact_website',                  'Web sitesi (boş bırakın)',
      'ui_contact_phone',                    'Telefon*',
      'ui_contact_email',                    'E-posta*',

      'ui_contact_select_label',             'Konu',
      'ui_contact_service_cooling_towers',   'Randevu talebi',
      'ui_contact_service_maintenance',      'Soru',
      'ui_contact_service_modernization',    'İş birliği',
      'ui_contact_service_other',            'Diğer',

      'ui_contact_terms_prefix',             'Okudum ve kabul ediyorum:',
      'ui_contact_terms',                    'Gizlilik Politikası',
      'ui_contact_conditions',               'Şartlar',

      'ui_contact_subject_base',             'İletişim Mesajı',
      'ui_contact_message_footer',           'İletişim formundan gönderildi.',

      'ui_contact_subject_label',            'Konu başlığı*',
      'ui_contact_message_label',            'Mesajınız*',
      'ui_contact_message_placeholder',      'Mesajınızı yazın...',

      'ui_contact_submit',                   'Talebi Gönder',
      'ui_contact_sending',                  'Gönderiliyor...',
      'ui_contact_success',                  'Teşekkürler! Mesajınız başarılı şekilde iletildi.',
      'ui_contact_error_generic',            'Gönderim başarısız oldu. Lütfen tekrar deneyin.',

      'ui_contact_error_required',           'Bu alan zorunludur.',
      'ui_contact_error_email',              'Lütfen geçerli bir e-posta girin.',
      'ui_contact_error_phone',              'Lütfen geçerli bir telefon numarası girin.',
      'ui_contact_error_message',            'Lütfen mesajınızı yazın (en az 10 karakter).',

      'ui_contact_info_title',               'İletişim Bilgileri',
      'ui_contact_info_note_title',          'Not',
      'ui_contact_address_label',            'Adres',

      'ui_contact_map_title',                'Konum',

      'ui_contact_meta_title',               'İletişim | Energetische Massage',
      'ui_contact_meta_description',         'Energetische Massage ile iletişime geçin: Bonn''da enerjetik masaj seansları için randevu ve sorular.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_contact',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'Contact',

      'ui_contact_subprefix',                'Energetische Massage',
      'ui_contact_sublabel',                 'Contact',
      'ui_contact_title_left',               'Let''s Talk',
      'ui_contact_tagline',                  'For questions and appointment requests, send a message. Sessions take place in Bonn and are arranged after a short pre-chat and consent.',

      'ui_contact_quick_email_placeholder',  'Your email address',
      'ui_contact_quick_email_aria',         'Fill email',

      'ui_contact_form_title',               'Send a message',
      'ui_contact_first_name',               'First Name*',
      'ui_contact_last_name',                'Last Name',
      'ui_contact_company',                  'Note (optional)',
      'ui_contact_website',                  'Website (leave empty)',
      'ui_contact_phone',                    'Phone*',
      'ui_contact_email',                    'Email*',

      'ui_contact_select_label',             'Topic',
      'ui_contact_service_cooling_towers',   'Appointment request',
      'ui_contact_service_maintenance',      'Question',
      'ui_contact_service_modernization',    'Collaboration',
      'ui_contact_service_other',            'Other',

      'ui_contact_terms_prefix',             'I agree to the:',
      'ui_contact_terms',                    'Privacy Policy',
      'ui_contact_conditions',               'Terms',

      'ui_contact_subject_base',             'Contact Message',
      'ui_contact_message_footer',           'Sent from contact form.',

      'ui_contact_subject_label',            'Subject*',
      'ui_contact_message_label',            'Message*',
      'ui_contact_message_placeholder',      'Write your message...',

      'ui_contact_submit',                   'Send Request',
      'ui_contact_sending',                  'Sending...',
      'ui_contact_success',                  'Thanks! Your message has been sent.',
      'ui_contact_error_generic',            'Failed to send. Please try again.',

      'ui_contact_error_required',           'This field is required.',
      'ui_contact_error_email',              'Please enter a valid email address.',
      'ui_contact_error_phone',              'Please enter a valid phone number.',
      'ui_contact_error_message',            'Please write a message (at least 10 characters).',

      'ui_contact_info_title',               'Contact info',
      'ui_contact_info_note_title',          'Note',
      'ui_contact_address_label',            'Address',

      'ui_contact_map_title',                'Location',

      'ui_contact_meta_title',               'Contact | Energetische Massage',
      'ui_contact_meta_description',         'Contact Energetische Massage: appointment requests and questions for energetic massage sessions in Bonn.'
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_contact',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_contact_page_title',               'Kontakt',

      'ui_contact_subprefix',                'Energetische Massage',
      'ui_contact_sublabel',                 'Kontakt',
      'ui_contact_title_left',               'Lassen Sie uns sprechen',
      'ui_contact_tagline',                  'Für Fragen und Terminanfragen schreiben Sie uns. Sitzungen finden in Bonn statt - nach kurzem Vorgespräch und Einverständnis.',

      'ui_contact_quick_email_placeholder',  'Ihre E-Mail-Adresse',
      'ui_contact_quick_email_aria',         'E-Mail übernehmen',

      'ui_contact_form_title',               'Nachricht senden',
      'ui_contact_first_name',               'Vorname*',
      'ui_contact_last_name',                'Nachname',
      'ui_contact_company',                  'Notiz (optional)',
      'ui_contact_website',                  'Webseite (frei lassen)',
      'ui_contact_phone',                    'Telefon*',
      'ui_contact_email',                    'E-Mail*',

      'ui_contact_select_label',             'Thema',
      'ui_contact_service_cooling_towers',   'Terminanfrage',
      'ui_contact_service_maintenance',      'Frage',
      'ui_contact_service_modernization',    'Kooperation',
      'ui_contact_service_other',            'Sonstiges',

      'ui_contact_terms_prefix',             'Ich stimme zu:',
      'ui_contact_terms',                    'Datenschutz',
      'ui_contact_conditions',               'AGB',

      'ui_contact_subject_base',             'Kontakt Nachricht',
      'ui_contact_message_footer',           'Über das Kontaktformular gesendet.',

      'ui_contact_subject_label',            'Betreff*',
      'ui_contact_message_label',            'Nachricht*',
      'ui_contact_message_placeholder',      'Schreiben Sie Ihre Nachricht...',

      'ui_contact_submit',                   'Anfrage senden',
      'ui_contact_sending',                  'Wird gesendet...',
      'ui_contact_success',                  'Danke! Ihre Nachricht wurde gesendet.',
      'ui_contact_error_generic',            'Senden fehlgeschlagen. Bitte erneut versuchen.',

      'ui_contact_error_required',           'Dieses Feld ist erforderlich.',
      'ui_contact_error_email',              'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      'ui_contact_error_phone',              'Bitte geben Sie eine gültige Telefonnummer ein.',
      'ui_contact_error_message',            'Bitte schreiben Sie eine Nachricht (mindestens 10 Zeichen).',

      'ui_contact_info_title',               'Kontakt',
      'ui_contact_info_note_title',          'Hinweis',
      'ui_contact_address_label',            'Adresse',

      'ui_contact_map_title',                'Standort',

      'ui_contact_meta_title',               'Kontakt | Energetische Massage',
      'ui_contact_meta_description',         'Kontaktieren Sie Energetische Massage: Terminanfragen und Fragen zu energetischen Massage-Sitzungen in Bonn.'
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
-- contact_map : Map config (iframe embed_url recommended)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'contact_map',
  'tr',
  CAST(
    JSON_OBJECT(
      'title',     'Konum',
      'height',    420,
      'query',     'Energetische Massage Bonn',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_map',
  'en',
  CAST(
    JSON_OBJECT(
      'title',     'Location',
      'height',    420,
      'query',     'Energetische Massage Bonn',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'contact_map',
  'de',
  CAST(
    JSON_OBJECT(
      'title',     'Standort',
      'height',    420,
      'query',     'Energetische Massage Bonn',
      'embed_url', ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
