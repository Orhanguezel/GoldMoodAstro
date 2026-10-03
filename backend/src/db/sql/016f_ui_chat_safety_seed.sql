-- Web chat safety copy; mobile uses ui_mobile_i18n from the same TR/EN/DE language set.
INSERT INTO site_settings (id, `key`, locale, value) VALUES
('016f0000-0000-4000-8000-000000000001', 'ui_chat_safety_block', '*', '{"label":{"tr":"Engelle","en":"Block","de":"Blockieren"}}'),
('016f0000-0000-4000-8000-000000000002', 'ui_chat_safety_unblock', '*', '{"label":{"tr":"Engeli kaldır","en":"Unblock","de":"Blockierung aufheben"}}'),
('016f0000-0000-4000-8000-000000000003', 'ui_chat_safety_blocked', '*', '{"label":{"tr":"Bu konuşmada mesaj gönderimi engellendi.","en":"Messaging is blocked in this conversation.","de":"Nachrichten sind in diesem Gespräch blockiert."}}'),
('016f0000-0000-4000-8000-000000000004', 'ui_chat_safety_terms_prompt', '*', '{"label":{"tr":"Mesajlaşmadan önce Kullanım Şartları ve topluluk kurallarını okuyup kabul edin.","en":"Read and accept the Terms of Use and community rules before messaging.","de":"Lesen und akzeptieren Sie vor dem Schreiben die Nutzungsbedingungen und Verhaltensregeln."}}'),
('016f0000-0000-4000-8000-000000000005', 'ui_chat_safety_read_terms', '*', '{"label":{"tr":"Kullanım Şartlarını oku","en":"Read Terms of Use","de":"Nutzungsbedingungen lesen"}}'),
('016f0000-0000-4000-8000-000000000006', 'ui_chat_safety_accept_terms', '*', '{"label":{"tr":"Okudum, kabul ediyorum","en":"I have read and accept","de":"Gelesen und akzeptiert"}}'),
('016f0000-0000-4000-8000-000000000007', 'ui_chat_safety_report', '*', '{"label":{"tr":"Bildir","en":"Report","de":"Melden"}}'),
('016f0000-0000-4000-8000-000000000008', 'ui_chat_safety_report_confirm', '*', '{"label":{"tr":"Bu mesajı inceleme ekibine bildirmek istiyor musunuz?","en":"Report this message for review?","de":"Diese Nachricht zur Prüfung melden?"}}'),
('016f0000-0000-4000-8000-000000000009', 'ui_chat_safety_report_done', '*', '{"label":{"tr":"Bildirim alındı","en":"Report received","de":"Meldung eingegangen"}}'),
('016f0000-0000-4000-8000-000000000010', 'ui_chat_safety_action_failed', '*', '{"label":{"tr":"İşlem tamamlanamadı.","en":"Action failed.","de":"Aktion fehlgeschlagen."}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
