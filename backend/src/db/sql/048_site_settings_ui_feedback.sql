-- =============================================================
-- 048_site_settings_ui_feedback.sql  (Feedback / Reviews UI strings) [FINAL — Energetische Massage]
--  - Key: ui_feedback
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Covers: Feedback.tsx + ReviewForm.tsx + ReviewList.tsx
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_feedback',
  'tr',
  CAST(JSON_OBJECT(
    -- left block
    'ui_feedback_subprefix',              'Energetische Massage',
    'ui_feedback_sublabel',               'Müşteri Yorumları',
    'ui_feedback_title',                  'Müşterilerimizin deneyimleri',
    'ui_feedback_paragraph',              'Geri bildirimleriniz; seans deneyimini, iletişimi ve konforu sürekli geliştirmemize yardımcı olur.',
    'ui_feedback_role_customer',          'Müşteri',
    'ui_feedback_prev',                   'Önceki yorum',
    'ui_feedback_next',                   'Sonraki yorum',

    -- placeholders (no data)
    'ui_feedback_placeholder_1',          'Randevu süreci çok kolaydı. Seans sonrası daha sakin ve dengede hissettim.',
    'ui_feedback_placeholder_2',          'Nazik ve saygılı yaklaşım. Net sınırlar ve çok özenli bir atmosfer vardı.',
    'ui_feedback_placeholder_3',          'Sakin tempo ve bilinçli dokunuşlar çok iyi geldi. Tekrar randevu alacağım.',

    -- Feedback.tsx (modal + CTA)
    'ui_feedback_write_button',           'Yorum yaz',
    'ui_feedback_modal_title',            'Yorum yaz',
    'ui_common_close',                    'Kapat',
    'ui_feedback_submit',                 'Gönder',
    'ui_feedback_sending',                'Gönderiliyor...',

    'ui_feedback_field_name',             'Ad Soyad *',
    'ui_feedback_field_email',            'E-posta *',
    'ui_feedback_field_rating',           'Puan *',
    'ui_feedback_field_comment',          'Yorum *',

    'ui_feedback_error_name',             'Ad Soyad zorunludur.',
    'ui_feedback_error_email',            'Lütfen geçerli bir e-posta girin.',
    'ui_feedback_error_comment',          'Yorum alanı zorunludur.',
    'ui_feedback_error_generic',          'Yorum gönderilemedi. Lütfen tekrar deneyin.',
    'ui_feedback_success',                'Teşekkürler! Yorumunuz gönderildi.',

    -- ReviewForm.tsx (toggle + inline form texts)
    'ui_feedback_form_title',             'Yorum bırakın',
    'ui_feedback_form_open',              'Yorum yaz',
    'ui_feedback_form_close',             'Kapat',
    'ui_feedback_form_name_label',        'Adınız',
    'ui_feedback_form_email_label',       'E-posta adresiniz',
    'ui_feedback_form_rating_label',      'Puanınız',
    'ui_feedback_form_comment_label',     'Yorumunuz',
    'ui_feedback_form_submit',            'Yorumu Gönder',
    'ui_feedback_form_submitting',        'Gönderiliyor...',
    'ui_feedback_form_success',           'Yorumunuz alındı, teşekkürler.',
    'ui_feedback_form_error',             'Yorum gönderilirken bir hata oluştu.',
    'ui_feedback_form_required',          'Bu alan zorunludur.',

    -- ReviewList.tsx
    'ui_feedback_list_title',             'Müşteri Yorumları',
    'ui_feedback_list_no_reviews',        'Henüz yorum yok. İlk yorumu siz yazın.',
    'ui_feedback_list_avg_rating',        'Ortalama Puan',
    'ui_feedback_list_reviews_suffix',    'yorum',
    'ui_feedback_list_helpful',           'Faydalı',
    'ui_feedback_list_like',              'Faydalı buldum',
    'ui_feedback_list_liked',             'Teşekkürler',
    'ui_feedback_list_error',             'İşlem sırasında bir hata oluştu.',
    'ui_feedback_list_loading',           'Yorumlar yükleniyor...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_feedback',
  'en',
  CAST(JSON_OBJECT(
    -- left block
    'ui_feedback_subprefix',              'Energetische Massage',
    'ui_feedback_sublabel',               'Customer Reviews',
    'ui_feedback_title',                  'What customers say',
    'ui_feedback_paragraph',              'Your feedback helps us continuously improve service quality, comfort, and the appointment experience.',
    'ui_feedback_role_customer',          'Customer',
    'ui_feedback_prev',                   'Previous review',
    'ui_feedback_next',                   'Next review',

    -- placeholders (no data)
    'ui_feedback_placeholder_1',          'Booking was easy, and after the session I felt calmer and more grounded.',
    'ui_feedback_placeholder_2',          'Respectful approach, clear boundaries, and a calm atmosphere. Highly recommended.',
    'ui_feedback_placeholder_3',          'Gentle, mindful pacing. It helped me relax deeply. I will book again.',

    -- Feedback.tsx (modal + CTA)
    'ui_feedback_write_button',           'Write a review',
    'ui_feedback_modal_title',            'Write a review',
    'ui_common_close',                    'Close',
    'ui_feedback_submit',                 'Submit',
    'ui_feedback_sending',                'Sending...',

    'ui_feedback_field_name',             'Full Name *',
    'ui_feedback_field_email',            'Email *',
    'ui_feedback_field_rating',           'Rating *',
    'ui_feedback_field_comment',          'Comment *',

    'ui_feedback_error_name',             'Name is required.',
    'ui_feedback_error_email',            'Please enter a valid email.',
    'ui_feedback_error_comment',          'Comment is required.',
    'ui_feedback_error_generic',          'Could not submit your review. Please try again.',
    'ui_feedback_success',                'Thank you! Your review has been submitted.',

    -- ReviewForm.tsx (toggle + inline form texts)
    'ui_feedback_form_title',             'Leave a review',
    'ui_feedback_form_open',              'Write a review',
    'ui_feedback_form_close',             'Close',
    'ui_feedback_form_name_label',        'Your name',
    'ui_feedback_form_email_label',       'Email address',
    'ui_feedback_form_rating_label',      'Your rating',
    'ui_feedback_form_comment_label',     'Your review',
    'ui_feedback_form_submit',            'Submit review',
    'ui_feedback_form_submitting',        'Submitting...',
    'ui_feedback_form_success',           'Your review has been received. Thank you!',
    'ui_feedback_form_error',             'An error occurred while submitting your review.',
    'ui_feedback_form_required',          'This field is required.',

    -- ReviewList.tsx
    'ui_feedback_list_title',             'Customer Reviews',
    'ui_feedback_list_no_reviews',        'No reviews yet. Be the first to leave one.',
    'ui_feedback_list_avg_rating',        'Average Rating',
    'ui_feedback_list_reviews_suffix',    'reviews',
    'ui_feedback_list_helpful',           'Helpful',
    'ui_feedback_list_like',              'Mark as helpful',
    'ui_feedback_list_liked',             'Thanks',
    'ui_feedback_list_error',             'An error occurred while processing your request.',
    'ui_feedback_list_loading',           'Loading reviews...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_feedback',
  'de',
  CAST(JSON_OBJECT(
    -- left block
    'ui_feedback_subprefix',              'Energetische Massage',
    'ui_feedback_sublabel',               'Kundenbewertungen',
    'ui_feedback_title',                  'Was unsere Kunden sagen',
    'ui_feedback_paragraph',              'Ihr Feedback hilft uns, Servicequalität, Komfort und das Termin-Erlebnis kontinuierlich zu verbessern.',
    'ui_feedback_role_customer',          'Kunde',
    'ui_feedback_prev',                   'Vorherige Bewertung',
    'ui_feedback_next',                   'Nächste Bewertung',

    -- placeholders (no data)
    'ui_feedback_placeholder_1',          'Die Buchung war einfach und nach der Sitzung fühlte ich mich ruhiger und geerdeter.',
    'ui_feedback_placeholder_2',          'Respektvoll, klare Grenzen und eine ruhige Atmosphäre. Klare Empfehlung.',
    'ui_feedback_placeholder_3',          'Sanftes Tempo, achtsame Berührung. Ich konnte sehr gut loslassen und buche wieder.',

    -- Feedback.tsx (modal + CTA)
    'ui_feedback_write_button',           'Bewertung schreiben',
    'ui_feedback_modal_title',            'Bewertung schreiben',
    'ui_common_close',                    'Schließen',
    'ui_feedback_submit',                 'Senden',
    'ui_feedback_sending',                'Wird gesendet...',

    'ui_feedback_field_name',             'Vollständiger Name *',
    'ui_feedback_field_email',            'E-Mail *',
    'ui_feedback_field_rating',           'Bewertung *',
    'ui_feedback_field_comment',          'Kommentar *',

    'ui_feedback_error_name',             'Name ist erforderlich.',
    'ui_feedback_error_email',            'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    'ui_feedback_error_comment',          'Kommentar ist erforderlich.',
    'ui_feedback_error_generic',          'Ihre Bewertung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
    'ui_feedback_success',                'Vielen Dank! Ihre Bewertung wurde gesendet.',

    -- ReviewForm.tsx (toggle + inline form texts)
    'ui_feedback_form_title',             'Bewertung abgeben',
    'ui_feedback_form_open',              'Bewertung schreiben',
    'ui_feedback_form_close',             'Schließen',
    'ui_feedback_form_name_label',        'Ihr Name',
    'ui_feedback_form_email_label',       'E-Mail-Adresse',
    'ui_feedback_form_rating_label',      'Ihre Bewertung',
    'ui_feedback_form_comment_label',     'Ihr Kommentar',
    'ui_feedback_form_submit',            'Bewertung senden',
    'ui_feedback_form_submitting',        'Wird gesendet...',
    'ui_feedback_form_success',           'Ihre Bewertung wurde empfangen. Vielen Dank!',
    'ui_feedback_form_error',             'Beim Senden der Bewertung ist ein Fehler aufgetreten.',
    'ui_feedback_form_required',          'Dieses Feld ist erforderlich.',

    -- ReviewList.tsx
    'ui_feedback_list_title',             'Kundenbewertungen',
    'ui_feedback_list_no_reviews',        'Noch keine Bewertungen. Schreiben Sie die erste Bewertung.',
    'ui_feedback_list_avg_rating',        'Durchschnittliche Bewertung',
    'ui_feedback_list_reviews_suffix',    'Bewertungen',
    'ui_feedback_list_helpful',           'Hilfreich',
    'ui_feedback_list_like',              'Als hilfreich markieren',
    'ui_feedback_list_liked',             'Danke',
    'ui_feedback_list_error',             'Bei der Verarbeitung ist ein Fehler aufgetreten.',
    'ui_feedback_list_loading',           'Bewertungen werden geladen...'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
