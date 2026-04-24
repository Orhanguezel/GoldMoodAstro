-- =============================================================
-- FILE: 049-6_site_settings_ui_faqs.sql
-- Energetische Massage - UI FAQ / SSS (site_settings.ui_faqs) [FINAL]
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert: ON DUPLICATE KEY UPDATE (assumes UNIQUE(key, locale))
--  - IMPORTANT: JSON_OBJECT içinde SQL yorumları kullanmayın.
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

-- =========================
-- TR
-- =========================
(
  UUID(),
  'ui_faqs',
  'tr',
  CAST(
    JSON_OBJECT(
      'ui_faqs_subprefix',            'Energetische Massage',
      'ui_faqs_sublabel',             'Sıkça Sorulan Sorular',
      'ui_faqs_title_prefix',         'Sık sorulan',
      'ui_faqs_title_mark',           'sorular',

      'ui_faqs_sample_one_q',         'Seans süresi ne kadar?',
      'ui_faqs_sample_one_a',         'Seans süresi hizmete göre değişebilir. Randevu sırasında süre ve içerik netleştirilir.',
      'ui_faqs_sample_two_q',         'Randevumu nasıl iptal edebilirim?',
      'ui_faqs_sample_two_a',         'İletişim sayfası üzerinden ya da mesajla randevu iptali/erteleme talebinizi iletebilirsiniz.',

      'ui_faqs_cover_alt',            'Energetische Massage SSS kapak görseli',
      'ui_faqs_view_detail_aria',     'SSS detayını görüntüle',
      'ui_faqs_view_detail',          'Detayları görüntüle',
      'ui_faqs_view_all',             'Tüm soruları görüntüle',

      'ui_faqs_page_title',           'Sıkça Sorulan Sorular',
      'ui_faqs_kicker_prefix',        'Energetische Massage',
      'ui_faqs_kicker_label',         'Sıkça Sorulan Sorular',

      'ui_faqs_empty',                'Şu anda görüntülenecek soru bulunmamaktadır.',
      'ui_faqs_intro',                'Energetische Massage seansları, randevu süreci ve genel uygulamalar hakkında sık sorulan soruların yanıtlarını burada bulabilirsiniz.',
      'ui_faqs_untitled',             'Başlıksız soru',
      'ui_faqs_no_answer',            'Bu soru için henüz cevap girilmemiştir.',
      'ui_faqs_footer_note',          'Aradığınız cevabı bulamadıysanız lütfen bizimle iletişime geçin.',

      'ui_faqs_page_title_prefix',    'Merak edilen',
      'ui_faqs_page_title_mark',      'sorular',

      'ui_faqs_page_description',     'Energetische Massage hakkında sıkça sorulan sorular ve cevapları.',
      'ui_faqs_meta_title',           'SSS | Energetische Massage',
      'ui_faqs_meta_description',     'Energetische Massage: seanslar, randevu, iptal/erteleme ve uygulama detayları hakkında sıkça sorulan sorular.',
      'ui_faqs_og_image',             ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =========================
-- EN
-- =========================
(
  UUID(),
  'ui_faqs',
  'en',
  CAST(
    JSON_OBJECT(
      'ui_faqs_subprefix',            'Energetische Massage',
      'ui_faqs_sublabel',             'Frequently Asked Questions',
      'ui_faqs_title_prefix',         'Frequently asked',
      'ui_faqs_title_mark',           'questions',

      'ui_faqs_sample_one_q',         'How long is a session?',
      'ui_faqs_sample_one_a',         'Session length may vary by service. Duration and focus are confirmed during booking.',
      'ui_faqs_sample_two_q',         'How can I cancel or reschedule?',
      'ui_faqs_sample_two_a',         'Please contact us via the contact page or message to cancel or reschedule your appointment.',

      'ui_faqs_cover_alt',            'Energetische Massage FAQ cover image',
      'ui_faqs_view_detail_aria',     'View FAQ details',
      'ui_faqs_view_detail',          'View details',
      'ui_faqs_view_all',             'View all questions',

      'ui_faqs_page_title',           'FAQs',
      'ui_faqs_kicker_prefix',        'Energetische Massage',
      'ui_faqs_kicker_label',         'Frequently Asked Questions',

      'ui_faqs_empty',                'There are no FAQs to display at the moment.',
      'ui_faqs_intro',                'Find answers to common questions about Energetische Massage sessions, booking, and general practices.',
      'ui_faqs_untitled',             'Untitled question',
      'ui_faqs_no_answer',            'No answer has been provided for this question yet.',
      'ui_faqs_footer_note',          'If you cannot find the answer you are looking for, please contact us.',

      'ui_faqs_page_title_prefix',    'Common',
      'ui_faqs_page_title_mark',      'questions',

      'ui_faqs_page_description',     'Frequently asked questions and answers about Energetische Massage.',
      'ui_faqs_meta_title',           'FAQs | Energetische Massage',
      'ui_faqs_meta_description',     'Energetische Massage FAQs: sessions, booking, cancellations/rescheduling, and practical details.',
      'ui_faqs_og_image',             ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
),

-- =========================
-- DE
-- =========================
(
  UUID(),
  'ui_faqs',
  'de',
  CAST(
    JSON_OBJECT(
      'ui_faqs_subprefix',            'Energetische Massage',
      'ui_faqs_sublabel',             'Häufig gestellte Fragen',
      'ui_faqs_title_prefix',         'Häufig gestellte',
      'ui_faqs_title_mark',           'Fragen',

      'ui_faqs_sample_one_q',         'Wie lange dauert eine Behandlung?',
      'ui_faqs_sample_one_a',         'Die Dauer hängt von der Behandlung ab. Dauer und Schwerpunkt werden bei der Buchung abgestimmt.',
      'ui_faqs_sample_two_q',         'Wie kann ich absagen oder verschieben?',
      'ui_faqs_sample_two_a',         'Bitte kontaktieren Sie uns über die Kontaktseite oder per Nachricht, um einen Termin abzusagen oder zu verschieben.',

      'ui_faqs_cover_alt',            'Energetische Massage FAQ Titelbild',
      'ui_faqs_view_detail_aria',     'FAQ-Details anzeigen',
      'ui_faqs_view_detail',          'Details anzeigen',
      'ui_faqs_view_all',             'Alle Fragen anzeigen',

      'ui_faqs_page_title',           'FAQs',
      'ui_faqs_kicker_prefix',        'Energetische Massage',
      'ui_faqs_kicker_label',         'Häufig gestellte Fragen',

      'ui_faqs_empty',                'Derzeit sind keine FAQs verfügbar.',
      'ui_faqs_intro',                'Hier finden Sie Antworten auf häufige Fragen zu Energetische Massage Behandlungen, Buchung und allgemeinen Abläufen.',
      'ui_faqs_untitled',             'Frage ohne Titel',
      'ui_faqs_no_answer',            'Für diese Frage wurde noch keine Antwort hinterlegt.',
      'ui_faqs_footer_note',          'Wenn Sie die gesuchte Antwort nicht finden, kontaktieren Sie uns bitte.',

      'ui_faqs_page_title_prefix',    'Häufige',
      'ui_faqs_page_title_mark',      'Fragen',

      'ui_faqs_page_description',     'Häufig gestellte Fragen und Antworten über Energetische Massage.',
      'ui_faqs_meta_title',           'FAQs | Energetische Massage',
      'ui_faqs_meta_description',     'Energetische Massage FAQs: Behandlungen, Buchung, Absage/Verschieben und praktische Informationen.',
      'ui_faqs_og_image',             ''
    )
    AS CHAR CHARACTER SET utf8mb4
  ),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = CURRENT_TIMESTAMP(3);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
