-- =============================================================
-- 049-93_site_settings_ui_appointment.sql (FINAL)
-- ui_appointment: Public appointment page + availability + weekly plan + admin WH labels
--  - Key: ui_appointment
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Upsert-safe: requires UNIQUE(`key`,`locale`)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES

/* ================= TR (FINAL) ================= */
(
  UUID(),
  'ui_appointment',
  'tr',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',         'Randevu Al',
    'ui_appointment_page_lead',          'Terapist seçin, tarih ve saat belirleyin, ardından formu gönderin.',
    'ui_appointment_title',              'Randevu Al',
    'ui_appointment_desc',               'Size uygun terapisti ve saati seçerek kolayca randevu oluşturabilirsiniz.',
    'ui_appointment_meta_title',         'Randevu Al | Energetische Massage',
    'ui_appointment_meta_description',   'Energetische Massage üzerinden randevu talebi oluşturun. Seanslar ön görüşme ve onay ile planlanır.',
    'ui_appointment_og_image',           '',

    'ui_appointment_subprefix',          'Energetische Massage',
    'ui_appointment_sublabel',           'Randevu',

    'ui_appointment_cover_image',        '/uploads/anas-3.jpg',
    'ui_appointment_cover_image_alt',    'Energetische Massage — Termin',

    'ui_appointment_home_cta_title',     'Randevu Al',
    'ui_appointment_home_cta_desc',      'Size uygun zamanı seçerek kolayca randevu oluşturabilirsiniz.',
    'ui_appointment_home_cta_btn',       'Randevu Al',

    'ui_appointment_step_label',         'Adım',
    'ui_appointment_step1_title',        'Terapist ve Zaman',
    'ui_appointment_step2_title',        'Kişisel Bilgiler',

    'ui_appointment_left_title',         'Randevu Talebi',
    'ui_appointment_left_tagline',       'Size en uygun terapisti, tarihi ve saati seçin.',
    'ui_appointment_open_calendar',      'Takvimi aç',

    'ui_appointment_resource_label',     'Terapist',
    'ui_appointment_date_label',         'Tarih',
    'ui_appointment_customer_label',     'İletişim Bilgileri',
    'ui_appointment_slots_title',        'Uygun Seanslar',
    'ui_appointment_form_title',         'Randevu Talebi',

    'ui_appointment_name',               'Ad Soyad',
    'ui_appointment_phone',              'Telefon',
    'ui_appointment_email',              'E-posta',
    'ui_appointment_time',               'Saat',
    'ui_appointment_time_label',         'Saat Seçimi',

    'ui_appointment_field_name',         'Ad Soyad',
    'ui_appointment_field_phone',        'Telefon',
    'ui_appointment_field_email',        'E-posta',
    'ui_appointment_field_note',         'Notunuz (Opsiyonel)',

    'ui_appointment_ph_name',            'Adınız Soyadınız',
    'ui_appointment_ph_phone',           '05xx xxx xx xx',
    'ui_appointment_ph_email',           'ornek@email.com',
    'ui_appointment_ph_note',            'Varsa özel istekleriniz...',

    'ui_appointment_btn_submit',         'Randevu Talebini Gönder',
    'ui_appointment_btn_loading',        'Gönderiliyor...',
    'ui_appointment_btn_sending',        'Gönderiliyor...',
    'ui_appointment_refresh',            'Yenile',

    'ui_appointment_error_generic',      'Bir hata oluştu. Lütfen tekrar deneyin.',
    'ui_appointment_form_error',         'Bir hata oluştu.',
    'ui_appointment_err_resource',       'Lütfen bir terapist seçin.',
    'ui_appointment_err_date',           'Lütfen geçerli bir tarih seçin.',
    'ui_appointment_err_name',           'Lütfen adınızı girin.',
    'ui_appointment_err_email',          'Lütfen geçerli bir e-posta adresi girin.',
    'ui_appointment_err_phone',          'Lütfen telefon numaranızı girin.',
    'ui_appointment_err_time',           'Lütfen bir saat seçin.',
    'ui_appointment_err_not_available',  'Seçilen saat şu an uygun değil.',

    'ui_appointment_success',            'Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    'ui_appointment_success_title',      'Talebiniz Alındı!',
    'ui_appointment_success_msg',        'Talebiniz bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.',
    'ui_appointment_success_home',       'Ana Sayfaya Dön',

    'ui_appointment_selected_service_label',   'Seçili hizmet',
    'ui_appointment_selected_service_loading', 'Yükleniyor...',
    'ui_appointment_selected_service_error',   'Hizmet bulunamadı. Lütfen tekrar seçin.',
    'ui_appointment_change_service',           'Değiştir',
    'ui_appointment_view_service',             'Görüntüle',

    'ui_appointment_resource_loading',   'Terapistler yükleniyor...',
    'ui_appointment_resource_placeholder','Terapist seçin',
    'ui_appointment_resource_error',     'Terapistler yüklenemedi.',
    'ui_appointment_resource_empty',     'Şu an uygun terapist bulunmuyor. Lütfen daha sonra tekrar deneyin.',
    'ui_appointment_single_therapist',   'Terapist otomatik seçildi.',

    'ui_appointment_daily_pick_date',    'Lütfen önce bir tarih seçin.',
    'ui_appointment_slots_loading',      'Saatler yükleniyor...',
    'ui_appointment_slots_error',        'Saatler yüklenemedi.',
    'ui_appointment_slots_empty',        'Bu tarih için uygun saat bulunamadı.',
    'ui_appointment_slot_status_available','Uygun',

    'ui_appointment_avail_checking',     'Uygunluk kontrol ediliyor...',
    'ui_appointment_avail_ok',           'Uygun',
    'ui_appointment_avail_full',         'Dolu veya pasif',

    'ui_appointment_therapist_available','Uygun',
    'ui_appointment_therapist_full',     'Dolu',
    'ui_appointment_therapist_closed',   'Kapalı',
    'ui_appointment_therapist_unknown',  'Bilinmiyor',

    'ui_appointment_weekly_title',        'Haftalık Plan',
    'ui_appointment_weekly_desc',         'Seçilen terapistin haftalık çalışma saatlerini aşağıda görebilirsiniz.',
    'ui_appointment_weekly_pick_therapist','Haftalık planı görmek için terapist seçin.',
    'ui_appointment_weekly_wh_loading',   'Yükleniyor...',
    'ui_appointment_weekly_wh_error',     'Çalışma saatleri yüklenemedi.',

    'ui_appointment_home_visit_title',    'Ev Ziyareti Hizmeti',
    'ui_appointment_home_visit_text',
      'Şu anda masaj hizmetlerimizi yalnızca ev ziyareti olarak sunmaktayız. Terapistimiz belirlenen randevu saatinde adresinize gelir.',

    'ui_appointment_info_title',          'Önemli Bilgi',
    'ui_appointment_info_text',
      'Randevularınızın kesinleşmesi için onay SMS/E-posta beklemeniz gerekmektedir. İptal işlemlerini en geç 24 saat önceden bildiriniz.',

    'ui_dow_1', 'Pazartesi',
    'ui_dow_2', 'Salı',
    'ui_dow_3', 'Çarşamba',
    'ui_dow_4', 'Perşembe',
    'ui_dow_5', 'Cuma',
    'ui_dow_6', 'Cumartesi',
    'ui_dow_7', 'Pazar',

    'ui_admin_wh_title',          'Haftalık Çalışma Saatleri',
    'ui_admin_wh_desc',           'Bu aralıklar, günlük seans üretiminin kaynağıdır.',
    'ui_admin_loading',           'Yükleniyor...',
    'ui_admin_refresh',           'Yenile',

    'ui_admin_col_day',           'Gün',
    'ui_admin_col_start',         'Başlangıç',
    'ui_admin_col_end',           'Bitiş',
    'ui_admin_col_session',       'Seans (dk)',
    'ui_admin_col_break',         'Ara (dk)',
    'ui_admin_col_capacity',      'Kapasite',
    'ui_admin_col_active',        'Aktif',
    'ui_admin_col_actions',       'İşlemler',

    'ui_admin_wh_empty',          'Henüz çalışma saati aralığı yok.',
    'ui_admin_wh_add_title',      'Yeni Çalışma Saati Aralığı Ekle',

    'ui_admin_btn_edit',          'Düzenle',
    'ui_admin_btn_save',          'Kaydet',
    'ui_admin_btn_delete',        'Sil',
    'ui_admin_btn_add',           'Ekle',

    'ui_admin_wh_edit_day_hint',  'Bu gün için günlük seansları düzenle',

    'ui_admin_wh_added',          'Çalışma saati aralığı eklendi.',
    'ui_admin_wh_updated',        'Çalışma saati aralığı güncellendi.',
    'ui_admin_wh_deleted',        'Çalışma saati aralığı silindi.',

    'ui_admin_wh_add_failed',     'Çalışma saati aralığı eklenemedi.',
    'ui_admin_wh_update_failed',  'Çalışma saati aralığı güncellenemedi.',
    'ui_admin_wh_delete_failed',  'Çalışma saati aralığı silinemedi.',

    'ui_admin_wh_err_range',      'Geçersiz başlangıç/bitiş saati. (Bitiş, başlangıçtan sonra olmalı)',
    'ui_admin_wh_err_invalid_range','Geçersiz saat aralığı.',
    'ui_admin_wh_delete_confirm', 'Bu çalışma saati aralığını silmek üzeresiniz. Devam edilsin mi?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= EN (FULL) ================= */
(
  UUID(),
  'ui_appointment',
  'en',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',        'Book Appointment',
    'ui_appointment_page_lead',         'Select a therapist, choose a date and time, then submit the form.',
    'ui_appointment_title',             'Book Appointment',
    'ui_appointment_desc',              'Choose a therapist and time slot to request an appointment.',
    'ui_appointment_meta_title',        'Book Appointment',
    'ui_appointment_meta_description',  'Request an appointment at Energetische Massage. Sessions are arranged after a short pre-chat and consent.',
    'ui_appointment_og_image',          '',

    'ui_appointment_subprefix',         'Energetische Massage',
    'ui_appointment_sublabel',          'Appointment',

    'ui_appointment_cover_image',       '/uploads/anas-3.jpg',
    'ui_appointment_cover_image_alt',   'Energetische Massage — Appointment',

    'ui_appointment_home_cta_title',    'Book Appointment',
    'ui_appointment_home_cta_desc',     'Choose a suitable time and send your appointment request easily.',
    'ui_appointment_home_cta_btn',      'Book Appointment',

    'ui_appointment_step_label',        'Step',
    'ui_appointment_step1_title',       'Therapist & Time',
    'ui_appointment_step2_title',       'Personal Details',

    'ui_appointment_left_title',        'Book Appointment',
    'ui_appointment_left_tagline',      'Choose the therapist, date and time that suits you best.',
    'ui_appointment_open_calendar',     'Open calendar',

    'ui_appointment_resource_label',    'Therapist',
    'ui_appointment_date_label',        'Date',
    'ui_appointment_customer_label',    'Contact Information',
    'ui_appointment_slots_title',       'Available Sessions',
    'ui_appointment_form_title',        'Appointment Request',

    'ui_appointment_name',              'Full Name',
    'ui_appointment_phone',             'Phone',
    'ui_appointment_email',             'Email',
    'ui_appointment_time',              'Time',
    'ui_appointment_time_label',        'Select time',

    'ui_appointment_field_name',        'Full name',
    'ui_appointment_field_phone',       'Phone',
    'ui_appointment_field_email',       'Email',
    'ui_appointment_field_note',        'Note (optional)',

    'ui_appointment_ph_name',           'Your full name',
    'ui_appointment_ph_phone',          'e.g. +49 151 234 56 78',
    'ui_appointment_ph_email',          'you@example.com',
    'ui_appointment_ph_note',           'Any notes or requests...',

    'ui_appointment_btn_submit',        'Submit Appointment Request',
    'ui_appointment_btn_loading',       'Submitting...',
    'ui_appointment_btn_sending',       'Submitting...',
    'ui_appointment_refresh',           'Refresh',

    'ui_appointment_error_generic',     'Something went wrong. Please try again.',
    'ui_appointment_form_error',        'Something went wrong.',
    'ui_appointment_err_resource',      'Please select a therapist.',
    'ui_appointment_err_date',          'Please select a valid date.',
    'ui_appointment_err_name',          'Please enter your name.',
    'ui_appointment_err_email',         'Please enter a valid email address.',
    'ui_appointment_err_phone',         'Please enter your phone number.',
    'ui_appointment_err_time',          'Please select a time.',
    'ui_appointment_err_not_available', 'The selected time is not available right now.',

    'ui_appointment_success',           'Your request has been received. We will contact you shortly.',
    'ui_appointment_success_title',     'Request received!',
    'ui_appointment_success_msg',       'We have received your request. We will contact you shortly.',
    'ui_appointment_success_home',      'Back to Home',

    'ui_appointment_selected_service_label',   'Selected service',
    'ui_appointment_selected_service_loading', 'Loading...',
    'ui_appointment_selected_service_error',   'Service not found. Please pick a service again.',
    'ui_appointment_change_service',           'Change',
    'ui_appointment_view_service',             'View',

    'ui_appointment_resource_loading',  'Loading therapists...',
    'ui_appointment_resource_placeholder','Select therapist',
    'ui_appointment_resource_error',    'Therapists could not be loaded.',
    'ui_appointment_resource_empty',    'No therapists available right now. Please try again later.',
    'ui_appointment_single_therapist',  'Therapist has been selected automatically.',

    'ui_appointment_daily_pick_date',   'Please select a date first.',
    'ui_appointment_slots_loading',     'Loading times...',
    'ui_appointment_slots_error',       'Times could not be loaded.',
    'ui_appointment_slots_empty',       'No available time found for this date.',
    'ui_appointment_slot_status_available','Available',

    'ui_appointment_avail_checking',    'Checking availability...',
    'ui_appointment_avail_ok',          'Available',
    'ui_appointment_avail_full',        'Full or inactive',

    'ui_appointment_therapist_available','Available',
    'ui_appointment_therapist_full',     'Full',
    'ui_appointment_therapist_closed',   'Closed',
    'ui_appointment_therapist_unknown',  'Unknown',

    'ui_appointment_weekly_title',       'Weekly Schedule',
    'ui_appointment_weekly_desc',        'You can view the selected therapist''s weekly working hours below.',
    'ui_appointment_weekly_pick_therapist','Select a therapist to view the weekly schedule.',
    'ui_appointment_weekly_wh_loading',  'Loading...',
    'ui_appointment_weekly_wh_error',    'Working hours could not be loaded.',

    'ui_appointment_home_visit_title',   'Home Visit Service',
    'ui_appointment_home_visit_text',
      'We currently offer our massage services exclusively as home visits. Our therapist will come to your address at the scheduled time.',

    'ui_appointment_info_title',         'Important',
    'ui_appointment_info_text',
      'Your appointment is confirmed after approval via SMS/email. Please notify cancellations at least 24 hours in advance.',

    'ui_dow_1', 'Monday',
    'ui_dow_2', 'Tuesday',
    'ui_dow_3', 'Wednesday',
    'ui_dow_4', 'Thursday',
    'ui_dow_5', 'Friday',
    'ui_dow_6', 'Saturday',
    'ui_dow_7', 'Sunday',

    'ui_admin_wh_title',         'Weekly Working Hours',
    'ui_admin_wh_desc',          'These ranges are the source for daily session generation.',
    'ui_admin_loading',          'Loading...',
    'ui_admin_refresh',          'Refresh',

    'ui_admin_col_day',          'Day',
    'ui_admin_col_start',        'Start',
    'ui_admin_col_end',          'End',
    'ui_admin_col_session',      'Session (min)',
    'ui_admin_col_break',        'Break (min)',
    'ui_admin_col_capacity',     'Capacity',
    'ui_admin_col_active',       'Active',
    'ui_admin_col_actions',      'Actions',

    'ui_admin_wh_empty',         'No working hour range yet.',
    'ui_admin_wh_add_title',     'Add New Working Hour Range',

    'ui_admin_btn_edit',         'Edit',
    'ui_admin_btn_save',         'Save',
    'ui_admin_btn_delete',       'Delete',
    'ui_admin_btn_add',          'Add',

    'ui_admin_wh_edit_day_hint', 'Edit daily sessions for this day',

    'ui_admin_wh_added',         'Working hour range added.',
    'ui_admin_wh_updated',       'Working hour range updated.',
    'ui_admin_wh_deleted',       'Working hour range deleted.',

    'ui_admin_wh_add_failed',    'Could not add working hour range.',
    'ui_admin_wh_update_failed', 'Could not update working hour range.',
    'ui_admin_wh_delete_failed', 'Could not delete working hour range.',

    'ui_admin_wh_err_range',     'Invalid start/end time. (End must be after start)',
    'ui_admin_wh_err_invalid_range','Invalid time range.',
    'ui_admin_wh_delete_confirm','You are about to delete this working hour range. Continue?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),

/* ================= DE (FULL) ================= */
(
  UUID(),
  'ui_appointment',
  'de',
  CAST(JSON_OBJECT(
    'ui_appointment_page_title',        'Termin buchen',
    'ui_appointment_page_lead',         'Therapeut auswählen, Datum und Uhrzeit festlegen und Formular senden.',
    'ui_appointment_title',             'Termin buchen',
    'ui_appointment_desc',              'Therapeut und Zeitfenster wählen und eine Terminanfrage senden.',
    'ui_appointment_meta_title',        'Termin buchen',
    'ui_appointment_meta_description',  'Terminanfrage bei Energetische Massage. Sitzungen nach kurzem Vorgespräch und Einverständnis.',
    'ui_appointment_og_image',          '',

    'ui_appointment_subprefix',         'Energetische Massage',
    'ui_appointment_sublabel',          'Termin',

    'ui_appointment_cover_image',       '/uploads/anas-3.jpg',
    'ui_appointment_cover_image_alt',   'Energetische Massage — Termin',

    'ui_appointment_home_cta_title',    'Termin buchen',
    'ui_appointment_home_cta_desc',     'Wählen Sie einen passenden Zeitpunkt und senden Sie Ihre Terminanfrage einfach.',
    'ui_appointment_home_cta_btn',      'Termin buchen',

    'ui_appointment_step_label',        'Schritt',
    'ui_appointment_step1_title',       'Therapeut & Zeit',
    'ui_appointment_step2_title',       'Persönliche Angaben',

    'ui_appointment_left_title',        'Termin buchen',
    'ui_appointment_left_tagline',      'Wählen Sie Therapeut, Datum und Uhrzeit, die am besten passen.',
    'ui_appointment_open_calendar',     'Kalender öffnen',

    'ui_appointment_resource_label',    'Therapeut',
    'ui_appointment_date_label',        'Datum',
    'ui_appointment_customer_label',    'Kontaktdaten',
    'ui_appointment_slots_title',       'Freie Termine',
    'ui_appointment_form_title',        'Terminanfrage',

    'ui_appointment_name',              'Name',
    'ui_appointment_phone',             'Telefon',
    'ui_appointment_email',             'E-Mail',
    'ui_appointment_time',              'Uhrzeit',
    'ui_appointment_time_label',        'Uhrzeit auswählen',

    'ui_appointment_field_name',        'Name',
    'ui_appointment_field_phone',       'Telefon',
    'ui_appointment_field_email',       'E-Mail',
    'ui_appointment_field_note',        'Notiz (optional)',

    'ui_appointment_ph_name',           'Ihr Name',
    'ui_appointment_ph_phone',          'z. B. +49 151 234 56 78',
    'ui_appointment_ph_email',          'sie@example.com',
    'ui_appointment_ph_note',           'Hinweise oder Wünsche...',

    'ui_appointment_btn_submit',        'Terminanfrage senden',
    'ui_appointment_btn_loading',       'Wird gesendet...',
    'ui_appointment_btn_sending',       'Wird gesendet...',
    'ui_appointment_refresh',           'Aktualisieren',

    'ui_appointment_error_generic',     'Ein Fehler ist aufgetreten. Bitte erneut versuchen.',
    'ui_appointment_form_error',        'Ein Fehler ist aufgetreten.',
    'ui_appointment_err_resource',      'Bitte einen Therapeuten auswählen.',
    'ui_appointment_err_date',          'Bitte ein gültiges Datum auswählen.',
    'ui_appointment_err_name',          'Bitte Ihren Namen eingeben.',
    'ui_appointment_err_email',         'Bitte eine gültige E-Mail-Adresse eingeben.',
    'ui_appointment_err_phone',         'Bitte Ihre Telefonnummer eingeben.',
    'ui_appointment_err_time',          'Bitte eine Uhrzeit auswählen.',
    'ui_appointment_err_not_available', 'Die gewählte Uhrzeit ist aktuell nicht verfügbar.',

    'ui_appointment_success',           'Ihre Anfrage wurde erhalten. Wir melden uns in Kürze.',
    'ui_appointment_success_title',     'Anfrage erhalten!',
    'ui_appointment_success_msg',       'Ihre Anfrage wurde erhalten. Wir melden uns in Kürze.',
    'ui_appointment_success_home',      'Zur Startseite',

    'ui_appointment_selected_service_label',   'Ausgewählter Service',
    'ui_appointment_selected_service_loading', 'Wird geladen...',
    'ui_appointment_selected_service_error',   'Service nicht gefunden. Bitte wählen Sie erneut.',
    'ui_appointment_change_service',           'Ändern',
    'ui_appointment_view_service',             'Ansehen',

    'ui_appointment_resource_loading',  'Therapeuten werden geladen...',
    'ui_appointment_resource_placeholder','Therapeut auswählen',
    'ui_appointment_resource_error',    'Therapeuten konnten nicht geladen werden.',
    'ui_appointment_resource_empty',    'Derzeit sind keine Therapeuten verfügbar. Bitte später erneut versuchen.',
    'ui_appointment_single_therapist',  'Therapeut wurde automatisch ausgewählt.',

    'ui_appointment_daily_pick_date',   'Bitte zuerst ein Datum auswählen.',
    'ui_appointment_slots_loading',     'Uhrzeiten werden geladen...',
    'ui_appointment_slots_error',       'Uhrzeiten konnten nicht geladen werden.',
    'ui_appointment_slots_empty',       'Für dieses Datum sind keine freien Zeiten verfügbar.',
    'ui_appointment_slot_status_available','Verfügbar',

    'ui_appointment_avail_checking',    'Verfügbarkeit wird geprüft...',
    'ui_appointment_avail_ok',          'Verfügbar',
    'ui_appointment_avail_full',        'Ausgebucht oder inaktiv',

    'ui_appointment_therapist_available','Verfügbar',
    'ui_appointment_therapist_full',     'Ausgebucht',
    'ui_appointment_therapist_closed',   'Geschlossen',
    'ui_appointment_therapist_unknown',  'Unbekannt',

    'ui_appointment_weekly_title',       'Wöchentlicher Plan',
    'ui_appointment_weekly_desc',        'Unten sehen Sie die wöchentlichen Arbeitszeiten des ausgewählten Therapeuten.',
    'ui_appointment_weekly_pick_therapist','Wählen Sie einen Therapeuten, um den Wochenplan zu sehen.',
    'ui_appointment_weekly_wh_loading',  'Wird geladen...',
    'ui_appointment_weekly_wh_error',    'Arbeitszeiten konnten nicht geladen werden.',

    'ui_appointment_home_visit_title',   'Hausbesuch-Service',
    'ui_appointment_home_visit_text',
      'Derzeit bieten wir unsere Massagen ausschließlich als Hausbesuch an. Unsere Therapeutin kommt zum vereinbarten Termin zu Ihnen nach Hause.',

    'ui_appointment_info_title',         'Wichtiger Hinweis',
    'ui_appointment_info_text',
      'Ihr Termin ist nach Bestätigung per SMS/E-Mail verbindlich. Bitte Stornierungen spätestens 24 Stunden vorher mitteilen.',

    'ui_dow_1', 'Montag',
    'ui_dow_2', 'Dienstag',
    'ui_dow_3', 'Mittwoch',
    'ui_dow_4', 'Donnerstag',
    'ui_dow_5', 'Freitag',
    'ui_dow_6', 'Samstag',
    'ui_dow_7', 'Sonntag',

    'ui_admin_wh_title',         'Wöchentliche Arbeitszeiten',
    'ui_admin_wh_desc',          'Diese Bereiche sind die Grundlage für die tägliche Sitzungs-Erzeugung.',
    'ui_admin_loading',          'Wird geladen...',
    'ui_admin_refresh',          'Aktualisieren',

    'ui_admin_col_day',          'Tag',
    'ui_admin_col_start',        'Start',
    'ui_admin_col_end',          'Ende',
    'ui_admin_col_session',      'Sitzung (Min)',
    'ui_admin_col_break',        'Pause (Min)',
    'ui_admin_col_capacity',     'Kapazität',
    'ui_admin_col_active',       'Aktiv',
    'ui_admin_col_actions',      'Aktionen',

    'ui_admin_wh_empty',         'Noch keine Arbeitszeit-Spanne vorhanden.',
    'ui_admin_wh_add_title',     'Neue Arbeitszeit-Spanne hinzufügen',

    'ui_admin_btn_edit',         'Bearbeiten',
    'ui_admin_btn_save',         'Speichern',
    'ui_admin_btn_delete',       'Löschen',
    'ui_admin_btn_add',          'Hinzufügen',

    'ui_admin_wh_edit_day_hint', 'Tägliche Sitzungen für diesen Tag bearbeiten',

    'ui_admin_wh_added',         'Arbeitszeit-Spanne hinzugefügt.',
    'ui_admin_wh_updated',       'Arbeitszeit-Spanne aktualisiert.',
    'ui_admin_wh_deleted',       'Arbeitszeit-Spanne gelöscht.',

    'ui_admin_wh_add_failed',    'Arbeitszeit-Spanne konnte nicht hinzugefügt werden.',
    'ui_admin_wh_update_failed', 'Arbeitszeit-Spanne konnte nicht aktualisiert werden.',
    'ui_admin_wh_delete_failed', 'Arbeitszeit-Spanne konnte nicht gelöscht werden.',

    'ui_admin_wh_err_range',     'Ungültige Start-/Endzeit. (Ende muss nach Start liegen)',
    'ui_admin_wh_err_invalid_range','Ungültiger Zeitbereich.',
    'ui_admin_wh_delete_confirm','Sie sind dabei, diese Arbeitszeit-Spanne zu löschen. Fortfahren?'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
