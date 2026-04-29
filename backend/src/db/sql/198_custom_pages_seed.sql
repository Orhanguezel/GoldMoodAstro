-- =============================================================
-- FILE: 198_custom_pages_seed.sql
-- Seed: about, blog landing, kvkk, gizlilik, kullanim-sartlari, cerez-politikasi
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
  ('cp-cookie',      'cookies', 1, 0, 60, 60)
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
