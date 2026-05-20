-- 016b_ui_reviews_boost_seed.sql
-- ReviewsPanel + ServiceBoostModal i18n keys (TR/EN/DE)

INSERT INTO site_settings (id, `key`, locale, value) VALUES
-- ReviewsPanel filter labels
('01000000-0000-4000-8000-0000000005a1', 'ui_reviews_filter_all', '*', '{"label":{"tr":"Tümü","en":"All","de":"Alle"}}'),
('01000000-0000-4000-8000-0000000005a2', 'ui_reviews_filter_unreplied', '*', '{"label":{"tr":"Cevaplanmamış","en":"Unreplied","de":"Unbeantwortet"}}'),
('01000000-0000-4000-8000-0000000005a3', 'ui_reviews_filter_low', '*', '{"label":{"tr":"1-2 yıldız","en":"1-2 stars","de":"1-2 Sterne"}}'),
('01000000-0000-4000-8000-0000000005a4', 'ui_reviews_filter_high', '*', '{"label":{"tr":"4-5 yıldız","en":"4-5 stars","de":"4-5 Sterne"}}'),
('01000000-0000-4000-8000-0000000005a5', 'ui_reviews_filter_label', '*', '{"label":{"tr":"Filtrele","en":"Filter","de":"Filtern"}}'),
-- ReviewsPanel states
('01000000-0000-4000-8000-0000000005a6', 'ui_reviews_loading', '*', '{"label":{"tr":"Geri bildirimler yükleniyor","en":"Loading reviews","de":"Bewertungen werden geladen"}}'),
('01000000-0000-4000-8000-0000000005a7', 'ui_reviews_error', '*', '{"label":{"tr":"Yorumlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.","en":"An error occurred while loading reviews. Please try again later.","de":"Beim Laden der Bewertungen ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut."}}'),
('01000000-0000-4000-8000-0000000005a8', 'ui_reviews_empty', '*', '{"label":{"tr":"Henüz bu kategoride bir yorum bulunmuyor.","en":"No reviews in this category yet.","de":"Noch keine Bewertungen in dieser Kategorie."}}'),
('01000000-0000-4000-8000-0000000005a9', 'ui_reviews_empty_hint', '*', '{"label":{"tr":"Yeni yorumlar geldiğinde burada görünecektir.","en":"New reviews will appear here when they arrive.","de":"Neue Bewertungen werden hier angezeigt, wenn sie eintreffen."}}'),
-- ReviewsPanel item
('01000000-0000-4000-8000-0000000005aa', 'ui_reviews_no_comment', '*', '{"label":{"tr":"Danışan yorum bırakmadı, sadece puan verdi.","en":"Customer left no comment, only a rating.","de":"Kunde hat keinen Kommentar hinterlassen, nur eine Bewertung."}}'),
('01000000-0000-4000-8000-0000000005ab', 'ui_reviews_consultant_reply_label', '*', '{"label":{"tr":"Danışman Yanıtı","en":"Consultant Reply","de":"Berater-Antwort"}}'),
('01000000-0000-4000-8000-0000000005ac', 'ui_reviews_edit_reply', '*', '{"label":{"tr":"Düzenle","en":"Edit","de":"Bearbeiten"}}'),
('01000000-0000-4000-8000-0000000005ad', 'ui_reviews_write_reply', '*', '{"label":{"tr":"Cevap Yaz","en":"Write Reply","de":"Antwort schreiben"}}'),
('01000000-0000-4000-8000-0000000005ae', 'ui_reviews_reply_placeholder', '*', '{"label":{"tr":"Danışanınıza profesyonel ve içten bir yanıt bırakın...","en":"Leave a professional and sincere reply to your customer...","de":"Hinterlassen Sie eine professionelle und aufrichtige Antwort für Ihren Kunden..."}}'),
('01000000-0000-4000-8000-0000000005af', 'ui_reviews_draft_suggestion', '*', '{"label":{"tr":"Taslak Öneri","en":"Draft Suggestion","de":"Entwurfsvorschlag"}}'),
('01000000-0000-4000-8000-0000000005b0', 'ui_reviews_draft_ready', '*', '{"label":{"tr":"Taslak cevap hazırlandı","en":"Draft reply ready","de":"Entwurfsantwort bereit"}}'),
('01000000-0000-4000-8000-0000000005b1', 'ui_reviews_cancel', '*', '{"label":{"tr":"Vazgeç","en":"Cancel","de":"Abbrechen"}}'),
('01000000-0000-4000-8000-0000000005b2', 'ui_reviews_publish', '*', '{"label":{"tr":"Yorumu Yayınla","en":"Publish Reply","de":"Antwort veröffentlichen"}}'),
('01000000-0000-4000-8000-0000000005b3', 'ui_reviews_update', '*', '{"label":{"tr":"Cevabı Güncelle","en":"Update Reply","de":"Antwort aktualisieren"}}'),
('01000000-0000-4000-8000-0000000005b4', 'ui_reviews_reply_saved', '*', '{"label":{"tr":"Cevabınız başarıyla kaydedildi","en":"Your reply was saved successfully","de":"Ihre Antwort wurde erfolgreich gespeichert"}}'),
('01000000-0000-4000-8000-0000000005b5', 'ui_reviews_reply_failed', '*', '{"label":{"tr":"Cevap gönderilemedi, lütfen tekrar deneyin","en":"Could not send reply, please try again","de":"Antwort konnte nicht gesendet werden, bitte versuchen Sie es erneut"}}'),
('01000000-0000-4000-8000-0000000005b6', 'ui_reviews_hidden_user', '*', '{"label":{"tr":"Gizli Kullanıcı","en":"Anonymous User","de":"Anonymer Benutzer"}}'),
('01000000-0000-4000-8000-0000000005b7', 'ui_reviews_no_date', '*', '{"label":{"tr":"Tarih yok","en":"No date","de":"Kein Datum"}}'),
('01000000-0000-4000-8000-0000000005b8', 'ui_reviews_suggestion_low', '*', '{"label":{"tr":"Geri bildiriminiz için teşekkür ederim. Deneyiminizi daha iyi anlamak ve sonraki seansta beklentinizi daha doğru karşılamak isterim.","en":"Thank you for your feedback. I would like to better understand your experience and meet your expectations more accurately in the next session.","de":"Vielen Dank für Ihr Feedback. Ich möchte Ihre Erfahrung besser verstehen und Ihre Erwartungen in der nächsten Sitzung genauer erfüllen."}}'),
('01000000-0000-4000-8000-0000000005b9', 'ui_reviews_suggestion_high', '*', '{"label":{"tr":"Değerli yorumunuz için teşekkür ederim. Seansın size katkı sağlamasına çok sevindim.","en":"Thank you for your valuable review. I am very glad that the session was beneficial to you.","de":"Vielen Dank für Ihre wertvolle Bewertung. Ich freue mich sehr, dass die Sitzung für Sie hilfreich war."}}'),
-- ServiceBoostModal
('01000000-0000-4000-8000-0000000005c1', 'ui_boost_title', '*', '{"label":{"tr":"Hizmetini Öne Çıkart","en":"Boost Your Service","de":"Deinen Dienst hervorheben"}}'),
('01000000-0000-4000-8000-0000000005c2', 'ui_boost_desc', '*', '{"label":{"tr":"hizmetini listede üst sıralara taşı, daha fazla danışana ulaş.","en":"move your service to the top of the list, reach more clients.","de":"Deinen Dienst an die Spitze der Liste zu setzen, mehr Kunden zu erreichen."}}'),
('01000000-0000-4000-8000-0000000005c3', 'ui_boost_days_label', '*', '{"label":{"tr":"{days} gün boyunca üstte","en":"Featured for {days} days","de":"{days} Tage lang hervorgehoben"}}'),
('01000000-0000-4000-8000-0000000005c4', 'ui_boost_one_time', '*', '{"label":{"tr":"tek seferlik","en":"one-time","de":"einmalig"}}'),
('01000000-0000-4000-8000-0000000005c5', 'ui_boost_note', '*', '{"label":{"tr":"Satın alma onaylandıktan sonra hizmetiniz anında öne çıkarılır.","en":"Your service will be boosted immediately after purchase is confirmed.","de":"Ihr Dienst wird sofort nach Kaufbestätigung hervorgehoben."}}'),
('01000000-0000-4000-8000-0000000005c6', 'ui_boost_cancel', '*', '{"label":{"tr":"Vazgeç","en":"Cancel","de":"Abbrechen"}}'),
('01000000-0000-4000-8000-0000000005c7', 'ui_boost_buy', '*', '{"label":{"tr":"Satın Al","en":"Buy Now","de":"Jetzt kaufen"}}'),
('01000000-0000-4000-8000-0000000005c8', 'ui_boost_payment_error', '*', '{"label":{"tr":"Ödeme sayfası açılamadı. Lütfen tekrar deneyin.","en":"Payment page could not be opened. Please try again.","de":"Zahlungsseite konnte nicht geöffnet werden. Bitte versuchen Sie es erneut."}}'),
('01000000-0000-4000-8000-0000000005c9', 'ui_boost_buy_failed', '*', '{"label":{"tr":"Boost satın alınamadı. Lütfen tekrar deneyin.","en":"Could not purchase boost. Please try again.","de":"Boost konnte nicht gekauft werden. Bitte versuchen Sie es erneut."}}'),
('01000000-0000-4000-8000-0000000005ca', 'ui_boost_active_badge', '*', '{"label":{"tr":"Öne Çıkarıldı","en":"Boosted","de":"Hervorgehoben"}}'),
('01000000-0000-4000-8000-0000000005cb', 'ui_boost_days_left', '*', '{"label":{"tr":"{days}g kaldı","en":"{days}d left","de":"noch {days}T"}}'),
('01000000-0000-4000-8000-0000000005cc', 'ui_boost_btn_label', '*', '{"label":{"tr":"Öne Çıkart","en":"Boost","de":"Hervorheben"}}'),
('01000000-0000-4000-8000-0000000005cd', 'ui_boost_btn_title', '*', '{"label":{"tr":"Hizmetini öne çıkart","en":"Boost your service","de":"Deinen Dienst hervorheben"}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
