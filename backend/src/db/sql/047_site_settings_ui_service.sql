-- =============================================================
-- 047_site_settings_ui_service.sql (FINAL — Energetische Massage)
-- ui_services: Treatments list + detail + "other services" translations
--  - Key: ui_services
--  - Value: JSON (stored as TEXT in site_settings.value)
--  - Localized: tr / en / de
--  - Upsert-safe: requires UNIQUE(key, locale) pre-existing (add via migration)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at)
VALUES
(
  UUID(),
  'ui_services',
  'tr',
  CAST(JSON_OBJECT(

    'ui_services_page_title',                'Enerjetik Rahatlama Masaji',
    'ui_services_detail_page_title',         'Enerjetik Rahatlama Masaji',

    'ui_services_meta_title',                'Enerjetik Rahatlama Masaji | Energetische Massage',
    'ui_services_meta_description',          'Bonn''da enerjetik rahatlama masaji. Derin gevseme, dikkatli dokunus, net sinirlar ve kisiye gore ayrilan zaman.',
    'ui_services_og_image',                  '',
    'ui_services_detail_meta_title',         'Hizmet Detayı | Energetische Massage',
    'ui_services_detail_meta_description',   'Masajın kapsamı, süre seçenekleri ve uygulama detayları. Size uygun seansı seçmek için masaj detaylarını inceleyin.',

    'ui_services_subprefix',                 'Energetische Massage',
    'ui_services_sublabel',                  'Masaj',
    'ui_services_title',                     'Enerjetik Rahatlama Masaji',
    'ui_services_page_description',          'Sakin bir ritim, dikkatli dokunus ve derin gevseme icin acilan guvenli bir alan.',

    'ui_services_placeholder_title',         'Masaj',
    'ui_services_placeholder_summary',       'Bu masajın açıklaması yakında eklenecektir.',
    'ui_services_details_aria',              'masaj detaylarını görüntüle',

    'ui_services_more_subtitle',             '',
    'ui_services_more_title',                '',

    'ui_services_detail_title',              'Masaj',
    'ui_services_not_found_title',           'Masaj bulunamadı',
    'ui_services_not_found_desc',            'Aradığınız masaj bulunamadı veya artık yayında değil.',
    'ui_services_back_to_list',              'Masaj sayfasina geri don',

    'ui_services_price_label',               'Fiyat',
    'ui_services_includes_label',            'Seans kapsamı',
    'ui_services_material_label',            'Kullanılan yağ / ürün',
    'ui_services_warranty_label',            'Notlar',

    'ui_services_specs_title',               'Masaj bilgileri',
    'ui_services_area_label',                'Bölge',
    'ui_services_duration_label',            'Süre',
    'ui_services_maintenance_label',         'Yoğunluk',
    'ui_services_season_label',              'Önerilen dönem',
    'ui_services_soil_type_label',           'Cilt tipi',
    'ui_services_thickness_label',           'Baskı seviyesi',
    'ui_services_equipment_label',           'Ekipman',

    'ui_services_gallery_title',             'Masaj Galerisi',
    'ui_services_gallery_open',              'Görseli büyüt',
    'ui_services_gallery_thumbs',            'Galeri küçük resimleri',

    'ui_services_contact_title',             'İletişim',
    'ui_services_contact_desc',              'Masaj seçimi, süre ve uygunluk için bize ulaşın.',
    'ui_services_contact_phone',             'Telefon',
    'ui_services_contact_whatsapp',          'WhatsApp',
    'ui_services_contact_form',              'Randevu Formu',

    'ui_services_sidebar_info_title',        'Masaj bilgileri',
    'ui_services_sidebar_type',              'Masaj türü',
    'ui_services_sidebar_category',          'Kategori',
    'ui_services_sidebar_status',            'Durum',

    'ui_common_active',                      'Aktif',
    'ui_common_passive',                     'Pasif',

    'ui_services_sidebar_cta_title',         'Detaylı bilgi ister misiniz?',
    'ui_services_sidebar_cta_desc',          'Bu masaj hakkında detaylı bilgi almak veya randevu oluşturmak için bizimle iletişime geçin.',
    'ui_services_sidebar_cta_button',        'İletişime geçin',

    'ui_services_cta_more_info',             'Bu masaj hakkında detaylı bilgi ve uygunluk için ekibimizle iletişime geçebilirsiniz.',
    'ui_services_cta_whatsapp',              'WhatsApp üzerinden yazın',
    'ui_services_cta_request_quote',         'Bu masaj için randevu talep et',
    'ui_services_other_title',               '',
    'ui_services_view_all',                  'Tümünü gör',
    'ui_services_details_empty',             'Henüz detay yok.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_services',
  'en',
  CAST(JSON_OBJECT(

    'ui_services_page_title',                'Energetic Relaxation Massage',
    'ui_services_detail_page_title',         'Energetic Relaxation Massage',

    'ui_services_meta_title',                'Energetic Relaxation Massage | Energetische Massage',
    'ui_services_meta_description',          'Energetic relaxation massage in Bonn. Mindful touch, deep relaxation, clear boundaries, and enough time to truly arrive.',
    'ui_services_og_image',                  '',
    'ui_services_detail_meta_title',         'Treatment Detail | Energetische Massage',
    'ui_services_detail_meta_description',   'Massage scope, duration options and session details. Review the massage detail to choose the right session.',

    'ui_services_subprefix',                 'Energetische Massage',
    'ui_services_sublabel',                  'Massage',
    'ui_services_title',                     'Energetic Relaxation Massage',
    'ui_services_page_description',          'A calm rhythm, mindful touch, and a protected space for deep relaxation.',

    'ui_services_placeholder_title',         'Massage',
    'ui_services_placeholder_summary',       'Massage description will be added soon.',
    'ui_services_details_aria',              'view massage details',

    'ui_services_more_subtitle',             '',
    'ui_services_more_title',                '',

    'ui_services_detail_title',              'Massage',
    'ui_services_not_found_title',           'Massage not found',
    'ui_services_not_found_desc',            'The massage you are looking for could not be found or is no longer available.',
    'ui_services_back_to_list',              'Back to massage page',

    'ui_services_price_label',               'Price',
    'ui_services_includes_label',            'Session includes',
    'ui_services_material_label',            'Oil / products used',
    'ui_services_warranty_label',            'Notes',

    'ui_services_specs_title',               'Massage information',
    'ui_services_area_label',                'Area',
    'ui_services_duration_label',            'Duration',
    'ui_services_maintenance_label',         'Intensity',
    'ui_services_season_label',              'Recommended period',
    'ui_services_soil_type_label',           'Skin type',
    'ui_services_thickness_label',           'Pressure level',
    'ui_services_equipment_label',           'Equipment',

    'ui_services_gallery_title',             'Massage Gallery',
    'ui_services_gallery_open',              'Open image',
    'ui_services_gallery_thumbs',            'Gallery thumbnails',

    'ui_services_contact_title',             'Contact',
    'ui_services_contact_desc',              'Contact us for massage selection, durations and availability.',
    'ui_services_contact_phone',             'Phone',
    'ui_services_contact_whatsapp',          'WhatsApp',
    'ui_services_contact_form',              'Appointment Form',

    'ui_services_sidebar_info_title',        'Massage info',
    'ui_services_sidebar_type',              'Massage type',
    'ui_services_sidebar_category',          'Category',
    'ui_services_sidebar_status',            'Status',

    'ui_common_active',                      'Active',
    'ui_common_passive',                     'Inactive',

    'ui_services_sidebar_cta_title',         'Need more information?',
    'ui_services_sidebar_cta_desc',          'Contact us to get more details about this massage or to request an appointment.',
    'ui_services_sidebar_cta_button',        'Contact us',

    'ui_services_cta_more_info',             'Contact our team for more details and availability for this massage.',
    'ui_services_cta_whatsapp',              'Message us on WhatsApp',
    'ui_services_cta_request_quote',         'Request an appointment for this massage',
    'ui_services_other_title',               '',
    'ui_services_view_all',                  'View all',
    'ui_services_details_empty',             'No details yet.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_services',
  'de',
  CAST(JSON_OBJECT(

    'ui_services_page_title',                'Energetische Entspannungsmassage',
    'ui_services_detail_page_title',         'Energetische Entspannungsmassage',

    'ui_services_meta_title',                'Energetische Entspannungsmassage | Energetische Massage',
    'ui_services_meta_description',          'Energetische Entspannungsmassage in Bonn. Achtsame Beruehrung, tiefe Entspannung, klare Grenzen und genügend Zeit zum Ankommen.',
    'ui_services_og_image',                  '',
    'ui_services_detail_meta_title',         'Behandlungsdetails | Energetische Massage',
    'ui_services_detail_meta_description',   'Umfang, Daueroptionen und Details zur Behandlung. Lesen Sie die Massage-Details, um die passende Sitzung zu wählen.',

    'ui_services_subprefix',                 'Energetische Massage',
    'ui_services_sublabel',                  'Massage',
    'ui_services_title',                     'Energetische Entspannungsmassage',
    'ui_services_page_description',          'Ruhiger Rhythmus, achtsame Beruehrung und ein geschuetzter Raum zum Loslassen.',

    'ui_services_placeholder_title',         'Massage',
    'ui_services_placeholder_summary',       'Die Beschreibung dieser Massage wird in Kürze hinzugefügt.',
    'ui_services_details_aria',              'Massage-Details anzeigen',

    'ui_services_more_subtitle',             '',
    'ui_services_more_title',                '',

    'ui_services_detail_title',              'Massage',
    'ui_services_not_found_title',           'Massage nicht gefunden',
    'ui_services_not_found_desc',            'Die gesuchte Massage wurde nicht gefunden oder ist nicht mehr verfügbar.',
    'ui_services_back_to_list',              'Zurueck zur Massage-Seite',

    'ui_services_price_label',               'Preis',
    'ui_services_includes_label',            'Sitzungsumfang',
    'ui_services_material_label',            'Öl / verwendete Produkte',
    'ui_services_warranty_label',            'Hinweise',

    'ui_services_specs_title',               'Massage-Informationen',
    'ui_services_area_label',                'Bereich',
    'ui_services_duration_label',            'Dauer',
    'ui_services_maintenance_label',         'Intensität',
    'ui_services_season_label',              'Empfohlener Zeitraum',
    'ui_services_soil_type_label',           'Hauttyp',
    'ui_services_thickness_label',           'Druckstufe',
    'ui_services_equipment_label',           'Ausrüstung',

    'ui_services_gallery_title',             'Massage-Galerie',
    'ui_services_gallery_open',              'Bild öffnen',
    'ui_services_gallery_thumbs',            'Galerie-Miniaturen',

    'ui_services_contact_title',             'Kontakt',
    'ui_services_contact_desc',              'Kontaktieren Sie uns für Massageauswahl, Dauer und Verfügbarkeit.',
    'ui_services_contact_phone',             'Telefon',
    'ui_services_contact_whatsapp',          'WhatsApp',
    'ui_services_contact_form',              'Terminformular',

    'ui_services_sidebar_info_title',        'Massage-Info',
    'ui_services_sidebar_type',              'Massageart',
    'ui_services_sidebar_category',          'Kategorie',
    'ui_services_sidebar_status',            'Status',

    'ui_common_active',                      'Aktiv',
    'ui_common_passive',                     'Inaktiv',

    'ui_services_sidebar_cta_title',         'Benötigen Sie weitere Informationen?',
    'ui_services_sidebar_cta_desc',          'Kontaktieren Sie uns, um Details zu dieser Massage zu erhalten oder eine Terminanfrage zu stellen.',
    'ui_services_sidebar_cta_button',        'Kontakt aufnehmen',

    'ui_services_cta_more_info',             'Kontaktieren Sie unser Team für weitere Details und Verfügbarkeit für diese Massage.',
    'ui_services_cta_whatsapp',              'Per WhatsApp schreiben',
    'ui_services_cta_request_quote',         'Terminanfrage für diese Massage senden',
    'ui_services_other_title',               '',
    'ui_services_view_all',                  'Alle ansehen',
    'ui_services_details_empty',             'Noch keine Details.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
