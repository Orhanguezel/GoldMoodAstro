-- backend/src/db/sql/012_chat_widget_disable.sql
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000017', 'chat_widget_enabled', '*', '0')
ON DUPLICATE KEY UPDATE value = VALUES(value);
