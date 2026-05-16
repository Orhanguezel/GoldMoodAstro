-- =============================================================
-- FILE: 198_custom_pages_seed.sql
-- Seed: about, faq, blog landing, kvkk, gizlilik, kullanim-sartlari,
-- cerez-politikasi, gizlilik bildirimi, yasal uyari, editorial policy
-- Content stored as JSON {"html":"..."} per backend convention
-- =============================================================

-- ---- PARENT ROWS --------------------------------------------------------
-- module_key values aligned with frontend container expectations:
-- AboutPageContent → 'about', BlogPageContent → 'blog',
-- KvkkPageContent → 'kvkk', PrivacyPolicyPageContent → 'privacy',
-- TermsPageContent → 'terms', CookiePolicyPageContent → 'cookies'
INSERT INTO custom_pages (id, module_key, is_published, featured, display_order, order_num) VALUES
  ('cp-about',       'about',   1, 1, 10, 10),
  ('cp-blog',        'blog',    1, 1, 20, 20),
  ('cp-kvkk',        'kvkk',    1, 0, 30, 30),
  ('cp-gizlilik',    'privacy', 1, 0, 40, 40),
  ('cp-terms',       'terms',   1, 0, 50, 50),
  ('cp-cookie',      'cookies', 1, 0, 60, 60),
  ('cp-faq',         'faq',     1, 0, 70, 70),
  ('cp-privacy-not', 'privacy_notice', 1, 0, 80, 80),
  ('cp-legal-not',   'legal_notice', 1, 0, 90, 90),
  ('cp-editorial',   'editorial_policy', 1, 0, 100, 100)
ON DUPLICATE KEY UPDATE module_key = VALUES(module_key), display_order = VALUES(display_order), featured = VALUES(featured);

-- ---- ABOUT --------------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-about-tr', 'cp-about', 'tr', 'Hakkımızda', 'hakkimizda',
   '{"html":"<h2>GoldMoodAstro Hakkında</h2><p>GoldMoodAstro, modern astrolojiyi insanlara dokunaklı bir rehberlik diline çevirmek için doğdu. Doğum haritası, sinastri, yıldızname ve günlük geçişler — hepsini tek bir akıcı deneyimde buluşturuyoruz.</p><h3>Misyonumuz</h3><p>Astrolojiyi kaderci bir araç değil; öz-farkındalık, ilişki sağlığı ve karar verme için bir ayna olarak sunmak.</p><h3>Vizyonumuz</h3><p>Türkiye’nin en güvenilir, en şeffaf ve en derinlikli astroloji platformu olmak. Onaylı astrologlar, AI destekli yorumlar ve KVKK uyumlu altyapı.</p>"}',
   'GoldMoodAstro nedir, neden farklıdır.', 'Hakkımızda — GoldMoodAstro', 'GoldMoodAstro hakkında: misyonumuz, vizyonumuz ve modern astroloji yaklaşımımız.'),
  ('cpi-about-en', 'cp-about', 'en', 'About Us', 'about',
   '{"html":"<h2>About GoldMoodAstro</h2><p>GoldMoodAstro was born to translate modern astrology into a warm, human language. Birth chart, synastry, yıldızname and daily transits — all in one fluid experience.</p><h3>Mission</h3><p>To present astrology not as a deterministic tool but as a mirror for self-awareness, relationships and decision-making.</p><h3>Vision</h3><p>Become the most trusted, transparent and in-depth astrology platform in Türkiye. Verified astrologers, AI-assisted readings and GDPR-compliant infrastructure.</p>"}',
   'What GoldMoodAstro is and what makes it different.', 'About — GoldMoodAstro', 'About GoldMoodAstro: our mission, vision and modern approach to astrology.'),
  ('cpi-about-de', 'cp-about', 'de', 'Über uns', 'ueber-uns',
   '{"html":"<h2>Über GoldMoodAstro</h2><p>GoldMoodAstro übersetzt moderne Astrologie in eine warme, menschliche Sprache. Geburtshoroskop, Synastrie, Yıldızname und tägliche Transite — alles in einem fließenden Erlebnis.</p><h3>Mission</h3><p>Astrologie nicht als deterministisches Werkzeug, sondern als Spiegel für Selbstwahrnehmung, Beziehungen und Entscheidungen anzubieten.</p>"}',
   'Was GoldMoodAstro ist.', 'Über uns — GoldMoodAstro', 'Über GoldMoodAstro: Mission, Vision und moderner Astrologie-Ansatz.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- GIZLILIK BILDIRIMI -------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-pn-tr', 'cp-privacy-not', 'tr', 'Gizlilik Bildirimi', 'gizlilik-bildirimi',
   '{"html":"<h2>Gizlilik Bildirimi</h2><p>GoldMoodAstro, hesap ve doğum verilerinizi yalnızca hizmeti sunmak, güvenliği sağlamak ve yasal yükümlülükleri yerine getirmek için işler.</p><h3>Kontrol Sizde</h3><p>Verilerinizi indirebilir, düzeltme isteyebilir veya hesabınızı silme talebi oluşturabilirsiniz.</p><h3>Üçüncü Taraflar</h3><p>Ödeme, depolama, bildirim ve yorum üretimi sağlayıcıları yalnızca gerekli veriyle çalışır.</p>"}',
   'Kısa gizlilik bildirimi.', 'Gizlilik Bildirimi — GoldMoodAstro', 'GoldMoodAstro kısa gizlilik bildirimi ve veri kontrol hakları.'),
  ('cpi-pn-en', 'cp-privacy-not', 'en', 'Privacy Notice', 'privacy-notice',
   '{"html":"<h2>Privacy Notice</h2><p>GoldMoodAstro processes account and birth data only to provide the service, protect security and meet legal obligations.</p><h3>You stay in control</h3><p>You may export your data, request correction or request account deletion.</p><h3>Third parties</h3><p>Payment, storage, notification and reading-generation providers receive only the data required for their role.</p>"}',
   'Short privacy notice.', 'Privacy Notice — GoldMoodAstro', 'Short privacy notice and data control rights for GoldMoodAstro.'),
  ('cpi-pn-de', 'cp-privacy-not', 'de', 'Datenschutzhinweis', 'datenschutzhinweis',
   '{"html":"<h2>Datenschutzhinweis</h2><p>GoldMoodAstro verarbeitet Konto- und Geburtsdaten nur zur Bereitstellung des Dienstes, zur Sicherheit und zur Erfüllung rechtlicher Pflichten.</p><h3>Ihre Kontrolle</h3><p>Sie können Daten exportieren, Berichtigung verlangen oder die Löschung Ihres Kontos beantragen.</p>"}',
   'Kurzer Datenschutzhinweis.', 'Datenschutzhinweis — GoldMoodAstro', 'Kurzer Datenschutzhinweis und Kontrollrechte.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- YASAL UYARI --------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-ln-tr', 'cp-legal-not', 'tr', 'Yasal Uyarı', 'yasal-uyari',
   '{"html":"<h2>Yasal Uyarı</h2><p>GoldMoodAstro içerikleri kişisel farkındalık ve eğlence amaçlıdır. Tıbbi, hukuki, psikolojik veya finansal danışmanlık yerine geçmez.</p><h3>Sorumluluk</h3><p>Platformdaki yorumlar ve danışman görüşmeleri kullanıcının kendi kararının yerine geçmez. Acil sağlık veya güvenlik durumlarında ilgili resmi kurumlara başvurun.</p><h3>Fikri Mülkiyet</h3><p>Metin, görsel, yazılım ve marka unsurları GoldMoodAstro veya lisans verenlerine aittir.</p>"}',
   'Hizmet niteliği ve sorumluluk sınırları.', 'Yasal Uyarı — GoldMoodAstro', 'GoldMoodAstro hizmetleri için yasal uyarı, sorumluluk ve fikri mülkiyet açıklaması.'),
  ('cpi-ln-en', 'cp-legal-not', 'en', 'Legal Notice', 'legal-notice',
   '{"html":"<h2>Legal Notice</h2><p>GoldMoodAstro content is for self-awareness and entertainment. It is not a substitute for medical, legal, psychological or financial advice.</p><h3>Responsibility</h3><p>Readings and consultant sessions do not replace your own judgement. In urgent health or safety situations, contact the relevant official services.</p><h3>Intellectual property</h3><p>Text, media, software and brand assets belong to GoldMoodAstro or its licensors.</p>"}',
   'Service nature and liability limits.', 'Legal Notice — GoldMoodAstro', 'Legal notice, liability and intellectual property information for GoldMoodAstro.'),
  ('cpi-ln-de', 'cp-legal-not', 'de', 'Rechtlicher Hinweis', 'rechtlicher-hinweis',
   '{"html":"<h2>Rechtlicher Hinweis</h2><p>GoldMoodAstro-Inhalte dienen Selbstreflexion und Unterhaltung. Sie ersetzen keine medizinische, rechtliche, psychologische oder finanzielle Beratung.</p><h3>Verantwortung</h3><p>Deutungen und Beratungen ersetzen nicht Ihre eigene Entscheidung. In Notfällen wenden Sie sich an offizielle Stellen.</p>"}',
   'Art des Dienstes und Haftungsgrenzen.', 'Rechtlicher Hinweis — GoldMoodAstro', 'Rechtlicher Hinweis und Haftungsgrenzen fuer GoldMoodAstro.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- EDITORIAL POLICY ---------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-ep-tr', 'cp-editorial', 'tr', 'Editoryal Politika', 'editorial-policy',
   '{"html":"<h2>Editoryal Politika</h2><p>GoldMoodAstro içerikleri astrologlar, içerik editörleri ve otomasyon araçlarının kontrollü katkısıyla hazırlanır.</p><h3>İlke</h3><p>İçerikler açık, saygılı, korku veya baskı yaratmayan bir dille yazılır. Kesin gelecek vaadi, sağlık teşhisi veya finansal yönlendirme yapılmaz.</p><h3>Gözden Geçirme</h3><p>Önemli rehber içerikler periyodik olarak güncellenir; kullanıcı geri bildirimleri editoryal süreçte dikkate alınır.</p>"}',
   'GoldMoodAstro içerik üretim ilkeleri.', 'Editoryal Politika — GoldMoodAstro', 'GoldMoodAstro içeriklerinin nasıl hazırlandığını ve gözden geçirildiğini açıklayan editoryal politika.'),
  ('cpi-ep-en', 'cp-editorial', 'en', 'Editorial Policy', 'editorial-policy',
   '{"html":"<h2>Editorial Policy</h2><p>GoldMoodAstro content is prepared with controlled contributions from astrologers, editors and automation tools.</p><h3>Principles</h3><p>Content is written in a clear, respectful and non-alarming tone. We do not promise certainty, diagnose health conditions or provide financial direction.</p><h3>Review</h3><p>Important guidance content is reviewed periodically and user feedback is considered in the editorial process.</p>"}',
   'GoldMoodAstro content principles.', 'Editorial Policy — GoldMoodAstro', 'How GoldMoodAstro content is prepared, reviewed and kept responsible.'),
  ('cpi-ep-de', 'cp-editorial', 'de', 'Redaktionelle Richtlinie', 'redaktionelle-richtlinie',
   '{"html":"<h2>Redaktionelle Richtlinie</h2><p>GoldMoodAstro-Inhalte entstehen mit kontrollierten Beiträgen von Astrologen, Redakteuren und Automatisierung.</p><h3>Grundsätze</h3><p>Die Inhalte sind klar, respektvoll und nicht alarmierend. Es gibt keine sicheren Zukunftsversprechen, Diagnosen oder Finanzberatung.</p>"}',
   'GoldMoodAstro Inhaltsgrundsätze.', 'Redaktionelle Richtlinie — GoldMoodAstro', 'Wie GoldMoodAstro Inhalte erstellt und prüft.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- FAQ ----------------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-faq-tr', 'cp-faq', 'tr', 'Sık Sorulan Sorular', 'sss',
   '{"html":"<h2>Sık Sorulan Sorular</h2><h3>GoldMoodAstro ne sunar?</h3><p>Doğum haritası, günlük yorum, tarot, kahve falı, sinastri ve onaylı danışmanlarla canlı görüşme deneyimleri sunar.</p><h3>Astroloji yorumları kesin gelecek tahmini midir?</h3><p>Hayır. Yorumlar kişisel farkındalık ve eğlence amaçlıdır; tıbbi, hukuki veya finansal tavsiye yerine geçmez.</p><h3>Premium üyelik ne sağlar?</h3><p>Premium üyelik reklamsız deneyim, ek içerikler ve öncelikli özellikler sunar.</p><h3>Hesabımı silebilir miyim?</h3><p>Evet. Profildeki Gizlilik ve Veri alanından silme talebi oluşturabilirsiniz. Talep 7 günlük soğuma süresiyle işlenir.</p>"}',
   'GoldMoodAstro hakkında sık sorulan sorular.', 'Sık Sorulan Sorular — GoldMoodAstro', 'GoldMoodAstro hizmetleri, premium üyelik ve hesap yönetimi hakkında sık sorulan sorular.'),
  ('cpi-faq-en', 'cp-faq', 'en', 'Frequently Asked Questions', 'faq',
   '{"html":"<h2>Frequently Asked Questions</h2><h3>What does GoldMoodAstro offer?</h3><p>Birth charts, daily readings, tarot, coffee readings, synastry and live sessions with verified consultants.</p><h3>Are astrology readings certain predictions?</h3><p>No. Readings are for self-awareness and entertainment; they are not medical, legal or financial advice.</p><h3>What does Premium include?</h3><p>Premium includes an ad-free experience, additional content and priority features.</p><h3>Can I delete my account?</h3><p>Yes. You can request deletion from Privacy & Data. A 7-day cooling-off period applies.</p>"}',
   'Frequently asked questions about GoldMoodAstro.', 'FAQ — GoldMoodAstro', 'Common questions about GoldMoodAstro services, Premium and account management.'),
  ('cpi-faq-de', 'cp-faq', 'de', 'Häufige Fragen', 'faq',
   '{"html":"<h2>Häufige Fragen</h2><h3>Was bietet GoldMoodAstro?</h3><p>Geburtshoroskope, Tagesdeutungen, Tarot, Kaffeesatzlesen, Synastrie und Live-Sitzungen mit geprüften Beratern.</p><h3>Sind astrologische Deutungen sichere Vorhersagen?</h3><p>Nein. Die Inhalte dienen Selbstreflexion und Unterhaltung; sie ersetzen keine medizinische, rechtliche oder finanzielle Beratung.</p><h3>Kann ich mein Konto löschen?</h3><p>Ja. Löschanfragen werden mit einer 7-tägigen Bedenkzeit verarbeitet.</p>"}',
   'Häufige Fragen zu GoldMoodAstro.', 'FAQ — GoldMoodAstro', 'Häufige Fragen zu GoldMoodAstro, Premium und Kontoverwaltung.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- BLOG LANDING -------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-blog-tr', 'cp-blog', 'tr', 'Blog', 'blog',
   '{"html":"<h2>Astroloji Notları</h2><p>Burada sezonun astrolojik temalarını, yeni-tam ay ritmini, transit yorumlarını ve uygulamalı içgörüleri paylaşıyoruz. Yazılarımız uzman astrologlar ve içerik ekibi tarafından titizlikle hazırlanır.</p>"}',
   'GoldMoodAstro blog ana sayfası.', 'Blog — GoldMoodAstro', 'Sezonun astrolojik temaları, transit yorumları ve uygulamalı içgörüler.'),
  ('cpi-blog-en', 'cp-blog', 'en', 'Blog', 'blog',
   '{"html":"<h2>Astrology Notes</h2><p>Seasonal astrological themes, new/full moon rhythms, transit interpretations and applied insights — curated by our expert astrologers and editorial team.</p>"}',
   'GoldMoodAstro blog landing.', 'Blog — GoldMoodAstro', 'Seasonal astrological themes, transits and applied insights from our team.'),
  ('cpi-blog-de', 'cp-blog', 'de', 'Blog', 'blog',
   '{"html":"<h2>Astrologische Notizen</h2><p>Saisonale Themen, Neumond/Vollmond, Transitdeutungen und praktische Einsichten — kuratiert von unseren Astrologen.</p>"}',
   'GoldMoodAstro Blog.', 'Blog — GoldMoodAstro', 'Saisonale Themen, Transite und Einsichten unseres Teams.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- KVKK ---------------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-kvkk-tr', 'cp-kvkk', 'tr', 'KVKK Aydınlatma Metni', 'kvkk',
   '{"html":"<h2>KVKK Aydınlatma Metni</h2><p><strong>Veri Sorumlusu:</strong> GoldMoodAstro</p><h3>İşlenen Veriler</h3><ul><li>Hesap bilgileri: ad, e-posta, telefon</li><li>Doğum verisi: tarih, saat, şehir (yorum üretimi için)</li><li>Ödeme: Iyzipay tarafından işlenir; karta dair veriyi saklamayız</li><li>Kullanım: oturum logları, IP, cihaz bilgisi (güvenlik)</li></ul><h3>Amaçlar</h3><p>Hizmet sunumu, ödeme/randevu işleme, kişisel astroloji yorumu üretimi, müşteri desteği, yasal yükümlülükler.</p><h3>Haklarınız</h3><p>KVKK md.11 kapsamında; verilerinize erişme, düzeltme, silme, sınırlama ve veri taşınabilirliği haklarınız vardır. Hesap silme talebi 7 gün soğuma süresiyle işlenir.</p><h3>İletişim</h3><p>destek@goldmoodastro.com</p>"}',
   'KVKK kapsamında veri işleme aydınlatması.', 'KVKK Aydınlatma Metni — GoldMoodAstro', 'GoldMoodAstro tarafından işlenen kişisel verilere ilişkin KVKK aydınlatma metni.'),
  ('cpi-kvkk-en', 'cp-kvkk', 'en', 'GDPR Notice', 'gdpr',
   '{"html":"<h2>GDPR / Data Processing Notice</h2><p><strong>Data Controller:</strong> GoldMoodAstro</p><h3>Data we process</h3><ul><li>Account: name, email, phone</li><li>Birth data: date, time, city (for personal readings)</li><li>Payment: handled by Iyzipay; no card data stored</li><li>Usage: session logs, IP, device (security)</li></ul><h3>Purposes</h3><p>Service delivery, payment & booking, personal astrology readings, customer support, legal obligations.</p><h3>Your rights</h3><p>Access, rectification, deletion, restriction, portability. Account deletion requests have a 7-day cooling-off period.</p><h3>Contact</h3><p>support@goldmoodastro.com</p>"}',
   'How we process personal data.', 'GDPR Notice — GoldMoodAstro', 'Personal data processing notice for GoldMoodAstro under GDPR.'),
  ('cpi-kvkk-de', 'cp-kvkk', 'de', 'DSGVO-Hinweis', 'dsgvo',
   '{"html":"<h2>DSGVO-Hinweis</h2><p><strong>Verantwortlicher:</strong> GoldMoodAstro</p><h3>Verarbeitete Daten</h3><ul><li>Konto: Name, E-Mail, Telefon</li><li>Geburtsdaten: Datum, Uhrzeit, Ort</li><li>Zahlung: über Iyzipay; keine Kartendaten gespeichert</li><li>Nutzung: Sitzungsprotokolle, IP, Gerät</li></ul><h3>Ihre Rechte</h3><p>Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit. 7 Tage Bedenkzeit bei Löschanträgen.</p>"}',
   'Verarbeitungshinweis nach DSGVO.', 'DSGVO-Hinweis — GoldMoodAstro', 'DSGVO-Hinweis von GoldMoodAstro zur Verarbeitung personenbezogener Daten.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- GIZLILIK -----------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-priv-tr', 'cp-gizlilik', 'tr', 'Gizlilik Politikası', 'gizlilik',
   '{"html":"<h2>Gizlilik Politikası</h2><p>Kişisel verilerinizin gizliliği bizim için önceliklidir. Bu politika hangi verileri topladığımızı, neden topladığımızı ve nasıl koruduğumuzu açıklar.</p><h3>Toplanan Bilgiler</h3><p>Hesap, doğum verileri, kullanım metrikleri, ödeme tokenları (kart bilgisi değil).</p><h3>Saklama Süresi</h3><p>Aktif hesap süresi + yasal yükümlülük süresi. Hesabınızı sildiğinizde verileriniz 7 gün sonra geri dönüşsüz silinir.</p><h3>Üçüncü Taraflar</h3><p>Iyzipay (ödeme), Cloudinary (görsel CDN), LiveKit (sesli/görüntülü görüşme), Anthropic/OpenAI (yorum üretimi). Astroloji yorumları için doğum verisi anonim olarak iletilir.</p><h3>Çerezler</h3><p>Detay için <a href=\\\"/cerez-politikasi\\\">Çerez Politikası</a> sayfamızı inceleyin.</p>"}',
   'Hangi verileri topluyor, nasıl koruyoruz.', 'Gizlilik Politikası — GoldMoodAstro', 'Kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuza dair gizlilik politikası.'),
  ('cpi-priv-en', 'cp-gizlilik', 'en', 'Privacy Policy', 'privacy',
   '{"html":"<h2>Privacy Policy</h2><p>Your privacy is a priority. This policy explains what we collect, why, and how we protect it.</p><h3>What we collect</h3><p>Account info, birth data, usage metrics, payment tokens (not card numbers).</p><h3>Retention</h3><p>Active account lifetime + legal retention. After deletion, data is irreversibly removed within 7 days.</p><h3>Third parties</h3><p>Iyzipay (payments), Cloudinary (image CDN), LiveKit (audio/video), Anthropic/OpenAI (reading generation).</p>"}',
   'What we collect and how we protect it.', 'Privacy Policy — GoldMoodAstro', 'How GoldMoodAstro collects, uses and protects your personal data.'),
  ('cpi-priv-de', 'cp-gizlilik', 'de', 'Datenschutzerklärung', 'datenschutz',
   '{"html":"<h2>Datenschutzerklärung</h2><p>Ihre Privatsphäre hat Priorität. Diese Erklärung beschreibt, was wir erfassen und wie wir es schützen.</p><h3>Erfasste Daten</h3><p>Kontoinformationen, Geburtsdaten, Nutzungsmetriken, Zahlungstokens.</p><h3>Aufbewahrung</h3><p>Lebensdauer des Kontos + gesetzliche Aufbewahrung. Nach Löschung Daten innerhalb 7 Tagen unwiderruflich entfernt.</p>"}',
   'Was wir erfassen, wie wir schützen.', 'Datenschutzerklärung — GoldMoodAstro', 'Wie GoldMoodAstro personenbezogene Daten erfasst, nutzt und schützt.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- KULLANIM SARTLARI --------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-terms-tr', 'cp-terms', 'tr', 'Kullanım Şartları', 'kullanim-sartlari',
   '{"html":"<h2>Kullanım Şartları</h2><p>GoldMoodAstro hizmetlerini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.</p><h3>Hizmet Niteliği</h3><p>Astroloji içerikleri kişisel gelişim ve eğlence amaçlıdır; tıbbi, hukuki, finansal tavsiye yerine geçmez.</p><h3>Hesap Sorumluluğu</h3><p>Hesap güvenliği kullanıcıya aittir. Şifre paylaşımı yasaktır.</p><h3>Ödemeler & İade</h3><p>Aboneliğiniz iptal edildiğinde dönem sonuna kadar aktif kalır. Tüketici Kanunu kapsamında 14 gün cayma hakkı saklıdır.</p><h3>İçerik Hakları</h3><p>Sitedeki içerikler GoldMoodAstro veya lisansörlere aittir; izinsiz çoğaltılamaz.</p><h3>Hesap İptali</h3><p>İhlaller durumunda hesap askıya alınabilir veya kapatılabilir.</p>"}',
   'Hizmetlerin kullanım şartları.', 'Kullanım Şartları — GoldMoodAstro', 'GoldMoodAstro kullanım şartları, sorumluluklar ve hizmet kuralları.'),
  ('cpi-terms-en', 'cp-terms', 'en', 'Terms of Use', 'terms',
   '{"html":"<h2>Terms of Use</h2><p>By using GoldMoodAstro you agree to the following.</p><h3>Nature of service</h3><p>Astrology content is for personal development and entertainment; not a substitute for medical, legal or financial advice.</p><h3>Account responsibility</h3><p>Account security is the user’s responsibility. Sharing passwords is prohibited.</p><h3>Payments & refunds</h3><p>Cancelled subscriptions remain active until period end. 14-day right of withdrawal under consumer law.</p>"}',
   'Service terms.', 'Terms of Use — GoldMoodAstro', 'Terms of use for GoldMoodAstro: responsibilities, payment and refund rules.'),
  ('cpi-terms-de', 'cp-terms', 'de', 'Nutzungsbedingungen', 'nutzungsbedingungen',
   '{"html":"<h2>Nutzungsbedingungen</h2><p>Mit der Nutzung von GoldMoodAstro stimmen Sie folgenden Bedingungen zu.</p><h3>Art des Dienstes</h3><p>Astrologische Inhalte dienen der persönlichen Entwicklung und Unterhaltung.</p>"}',
   'Nutzungsbedingungen.', 'Nutzungsbedingungen — GoldMoodAstro', 'Nutzungsbedingungen, Verantwortlichkeiten und Servicebedingungen.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);

-- ---- COOKIE POLITIKASI --------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-cook-tr', 'cp-cookie', 'tr', 'Çerez Politikası', 'cerez-politikasi',
   '{"html":"<h2>Çerez Politikası</h2><p>Web sitemizde deneyimi geliştirmek için çerezler kullanıyoruz.</p><h3>Çerez Tipleri</h3><ul><li><strong>Zorunlu:</strong> oturum, güvenlik (kapatılamaz)</li><li><strong>Performans:</strong> kullanım analitiği (anonim)</li><li><strong>İşlevsel:</strong> dil, tema tercihi</li><li><strong>Pazarlama:</strong> reklam görüntüleme (onay ile)</li></ul><h3>Yönetim</h3><p>Tarayıcınızdan çerezleri silebilir veya engelleyebilirsiniz. Bazı özellikler çalışmayabilir.</p>"}',
   'Hangi çerezleri neden kullanıyoruz.', 'Çerez Politikası — GoldMoodAstro', 'GoldMoodAstro çerez politikası: hangi çerezleri kullanıyoruz, nasıl yönetebilirsiniz.'),
  ('cpi-cook-en', 'cp-cookie', 'en', 'Cookie Policy', 'cookie-policy',
   '{"html":"<h2>Cookie Policy</h2><p>We use cookies to improve your experience.</p><h3>Types</h3><ul><li><strong>Essential:</strong> session, security</li><li><strong>Performance:</strong> anonymous analytics</li><li><strong>Functional:</strong> language, theme</li><li><strong>Marketing:</strong> ads (with consent)</li></ul>"}',
   'Which cookies we use and why.', 'Cookie Policy — GoldMoodAstro', 'GoldMoodAstro cookie policy: which cookies we use and how to manage them.'),
  ('cpi-cook-de', 'cp-cookie', 'de', 'Cookie-Richtlinie', 'cookie-richtlinie',
   '{"html":"<h2>Cookie-Richtlinie</h2><p>Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.</p><h3>Typen</h3><ul><li><strong>Essenziell:</strong> Sitzung, Sicherheit</li><li><strong>Leistung:</strong> anonyme Analytik</li><li><strong>Funktional:</strong> Sprache, Theme</li><li><strong>Marketing:</strong> Werbung (mit Einwilligung)</li></ul>"}',
   'Welche Cookies wir nutzen.', 'Cookie-Richtlinie — GoldMoodAstro', 'GoldMoodAstro Cookie-Richtlinie: welche Cookies wir verwenden.')
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content);
