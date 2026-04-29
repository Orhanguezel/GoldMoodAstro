-- backend/src/db/sql/012_chat_widget_disable.sql
-- NOT: Dosya adi tarihsel ('disable' icin acilmisti). Su an widget DEFAULT acik.
-- Admin paneldeki Chat > ChatSettingsPanel toggle'i bu key'i 'true' / 'false'
-- olarak yazar. Frontend SupportBotWidget '0'/'1'/'true'/'false' her birini
-- okuyabilir (widgetEnabled normalize ediyor).
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000017', 'chat_widget_enabled', '*', 'true')
ON DUPLICATE KEY UPDATE value = VALUES(value);
