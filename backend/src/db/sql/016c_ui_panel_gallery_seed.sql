-- =============================================================
-- 016c_ui_panel_gallery_seed.sql
-- Danışman paneli: seed'de karşılığı olmayan 5 ui_ anahtarı (2026-08-16
-- taraması — TR panelde İngilizce fallback görünüyordu: "Gallery photos" vb.)
-- =============================================================
INSERT INTO site_settings (id, `key`, locale, value) VALUES
  ('016c0001-0000-4000-8000-000000000001', 'ui_dashboard_gallery_title', '*', '{"label": {"tr": "Galeri fotoğrafları", "en": "Gallery photos", "de": "Galeriefotos"}}'),
  ('016c0001-0000-4000-8000-000000000002', 'ui_dashboard_gallery_desc', '*', '{"label": {"tr": "Profiliniz için ek fotoğraflar ekleyin: çalışma alanınız, sertifikalarınız veya portreleriniz. Değişiklikleri kaydetmeyi unutmayın.", "en": "Add extra photos for your profile, such as your workspace, certificates, or portraits. Remember to save your changes.", "de": "Fügen Sie zusätzliche Fotos hinzu: Arbeitsbereich, Zertifikate oder Porträts. Vergessen Sie nicht zu speichern."}}'),
  ('016c0001-0000-4000-8000-000000000003', 'ui_consultantpanel_avatar_saved', '*', '{"label": {"tr": "Profil fotoğrafınız kaydedildi", "en": "Your profile photo was saved", "de": "Ihr Profilfoto wurde gespeichert"}}'),
  ('016c0001-0000-4000-8000-000000000004', 'ui_dashboard_error_meta_title_max', '*', '{"label": {"tr": "Meta başlık en fazla 255 karakter olabilir.", "en": "Meta title can be up to 255 characters.", "de": "Der Meta-Titel darf höchstens 255 Zeichen haben."}}'),
  ('016c0001-0000-4000-8000-000000000005', 'ui_dashboard_error_meta_description_max', '*', '{"label": {"tr": "Meta açıklama en fazla 500 karakter olabilir.", "en": "Meta description can be up to 500 characters.", "de": "Die Meta-Beschreibung darf höchstens 500 Zeichen haben."}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
