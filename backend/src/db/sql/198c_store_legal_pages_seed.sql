-- =============================================================
-- 198c_store_legal_pages_seed.sql
-- Store release legal pages: distance sales + cancellation/refund.
-- Mobile legal index reads these module_key values through custom-pages.
-- =============================================================

INSERT INTO custom_pages (id, module_key, is_published, featured, display_order, order_num) VALUES
  ('cp-distance-sales', 'distance_sales', 1, 0, 110, 110),
  ('cp-cancel-refund',  'cancellation_refund', 1, 0, 120, 120),
  ('cp-pre-info',       'pre_information', 1, 0, 105, 105)
ON DUPLICATE KEY UPDATE
  module_key = VALUES(module_key),
  is_published = VALUES(is_published),
  display_order = VALUES(display_order),
  order_num = VALUES(order_num);

INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-dsales-tr', 'cp-distance-sales', 'tr',
   'Mesafeli Satış Sözleşmesi', 'mesafeli-satis-sozlesmesi',
   '{"html":"<h2>Mesafeli Satış Sözleşmesi</h2><p>Bu sözleşme, GoldMoodAstro üzerinden satın alınan dijital üyelik, kredi paketi ve danışmanlık hizmetleri için alıcı ile platform arasındaki mesafeli satış koşullarını açıklar.</p><h3>Hizmetin Niteliği</h3><p>GoldMoodAstro astroloji, farkındalık ve eğlence amaçlı dijital içerik ve randevulu danışmanlık hizmetleri sunar. Hizmetler tıbbi, hukuki, psikolojik veya finansal tavsiye yerine geçmez.</p><h3>Fiyat ve Ödeme</h3><p>Güncel fiyatlar sipariş ekranında gösterilir. Ödemeler güvenli ödeme sağlayıcıları üzerinden alınır; kart bilgileri GoldMoodAstro tarafından saklanmaz.</p><h3>Teslimat</h3><p>Dijital üyelikler, kredi paketleri ve online randevular ödeme onayından sonra uygulama hesabınıza tanımlanır.</p><h3>Cayma Hakkı</h3><p>Mevzuat kapsamındaki cayma hakları saklıdır. Kullanıcının açık onayıyla ifasına başlanan dijital içeriklerde ve gerçekleşmiş seanslarda iade koşulları İptal ve İade Politikası uyarınca değerlendirilir.</p><h3>İletişim</h3><p>Destek talepleri için goldmoodastro@gmail.com adresinden bize ulaşabilirsiniz.</p>"}',
   'GoldMoodAstro dijital hizmetleri için mesafeli satış koşulları.',
   'Mesafeli Satış Sözleşmesi — GoldMoodAstro',
   'GoldMoodAstro dijital üyelik, kredi ve danışmanlık hizmetleri için mesafeli satış sözleşmesi.'),
  ('cpi-dsales-en', 'cp-distance-sales', 'en',
   'Distance Sales Agreement', 'distance-sales-agreement',
   '{"html":"<h2>Distance Sales Agreement</h2><p>This agreement explains the distance sales terms between the buyer and GoldMoodAstro for digital memberships, credit packages and scheduled consulting services purchased through the platform.</p><h3>Nature of Service</h3><p>GoldMoodAstro provides astrology, self-awareness and entertainment oriented digital content and online consulting sessions. Services do not replace medical, legal, psychological or financial advice.</p><h3>Price and Payment</h3><p>Current prices are shown on the order screen. Payments are processed by secure payment providers; card details are not stored by GoldMoodAstro.</p><h3>Delivery</h3><p>Digital memberships, credit packages and online bookings are assigned to your account after payment confirmation.</p><h3>Right of Withdrawal</h3><p>Statutory withdrawal rights remain reserved. Digital content started with the user''s explicit consent and completed sessions are evaluated under the Cancellation and Refund Policy.</p><h3>Contact</h3><p>For support, contact goldmoodastro@gmail.com.</p>"}',
   'Distance sales terms for GoldMoodAstro digital services.',
   'Distance Sales Agreement — GoldMoodAstro',
   'Distance sales agreement for GoldMoodAstro digital memberships, credits and consulting services.'),
  ('cpi-dsales-de', 'cp-distance-sales', 'de',
   'Fernabsatzvertrag', 'fernabsatzvertrag',
   '{"html":"<h2>Fernabsatzvertrag</h2><p>Diese Vereinbarung beschreibt die Fernabsatzbedingungen zwischen Käufer/in und GoldMoodAstro für digitale Mitgliedschaften, Guthabenpakete und gebuchte Beratungsleistungen.</p><h3>Art der Dienstleistung</h3><p>GoldMoodAstro bietet astrologische, selbstreflexive und unterhaltungsorientierte digitale Inhalte sowie Online-Beratungen. Die Leistungen ersetzen keine medizinische, rechtliche, psychologische oder finanzielle Beratung.</p><h3>Preis und Zahlung</h3><p>Aktuelle Preise werden im Bestellbildschirm angezeigt. Zahlungen erfolgen über sichere Zahlungsanbieter; Kartendaten werden nicht von GoldMoodAstro gespeichert.</p><h3>Bereitstellung</h3><p>Digitale Mitgliedschaften, Guthabenpakete und Online-Termine werden nach Zahlungsbestätigung dem Konto zugeordnet.</p><h3>Widerrufsrecht</h3><p>Gesetzliche Widerrufsrechte bleiben unberührt. Digitale Inhalte, die mit ausdrücklicher Zustimmung begonnen wurden, und abgeschlossene Sitzungen werden gemäß der Stornierungs- und Erstattungsrichtlinie bewertet.</p><h3>Kontakt</h3><p>Support: goldmoodastro@gmail.com.</p>"}',
   'Fernabsatzbedingungen fuer digitale GoldMoodAstro-Dienste.',
   'Fernabsatzvertrag — GoldMoodAstro',
   'Fernabsatzvertrag fuer digitale Mitgliedschaften, Guthaben und Beratungsdienste von GoldMoodAstro.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  slug = VALUES(slug),
  content = VALUES(content),
  summary = VALUES(summary),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description);

INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-crefund-tr', 'cp-cancel-refund', 'tr',
   'İptal ve İade Politikası', 'iptal-iade-politikasi',
   '{"html":"<h2>İptal ve İade Politikası</h2><p>Bu politika, GoldMoodAstro üyelikleri, kredi paketleri ve randevulu danışmanlık hizmetleri için iptal ve iade koşullarını açıklar.</p><h3>Abonelikler</h3><p>Aboneliklerinizi App Store veya Google Play abonelik yönetimi ekranından iptal edebilirsiniz. İptal edilen abonelik dönem sonuna kadar aktif kalır.</p><h3>Kredi Paketleri</h3><p>Kullanılmamış kredi paketleri için destek ekibine başvurarak iade değerlendirmesi isteyebilirsiniz. Kullanılmış krediler ve tamamlanmış dijital yorumlar iade kapsamı dışında olabilir.</p><h3>Randevulu Seanslar</h3><p>Randevu başlangıcından önce yapılan iptal talepleri uygunluk durumuna göre iade veya yeniden planlama ile sonuçlandırılır. Başlamış ya da tamamlanmış seanslarda iade talepleri destek incelemesine tabidir.</p><h3>Teknik Sorunlar</h3><p>Platform kaynaklı ödeme, erişim veya görüşme sorunlarında kayıtlar incelenir ve uygun çözüm sağlanır.</p><h3>Başvuru</h3><p>İade talepleri için sipariş numaranızla birlikte goldmoodastro@gmail.com adresine yazın.</p>"}',
   'GoldMoodAstro iptal, cayma ve iade koşulları.',
   'İptal ve İade Politikası — GoldMoodAstro',
   'GoldMoodAstro abonelik, kredi paketi ve seanslar için iptal ve iade politikası.'),
  ('cpi-crefund-en', 'cp-cancel-refund', 'en',
   'Cancellation and Refund Policy', 'cancellation-refund-policy',
   '{"html":"<h2>Cancellation and Refund Policy</h2><p>This policy explains cancellation and refund conditions for GoldMoodAstro memberships, credit packages and scheduled consulting services.</p><h3>Subscriptions</h3><p>You can cancel subscriptions from the App Store or Google Play subscription management screen. A cancelled subscription remains active until the end of the billing period.</p><h3>Credit Packages</h3><p>For unused credit packages, you may request a refund review from support. Used credits and completed digital readings may be outside the refund scope.</p><h3>Scheduled Sessions</h3><p>Cancellation requests before the session start may be handled through refund or rescheduling depending on eligibility. Started or completed sessions are reviewed by support.</p><h3>Technical Issues</h3><p>For platform-side payment, access or call issues, logs are reviewed and an appropriate remedy is provided.</p><h3>Request</h3><p>Send refund requests with your order number to goldmoodastro@gmail.com.</p>"}',
   'GoldMoodAstro cancellation, withdrawal and refund terms.',
   'Cancellation and Refund Policy — GoldMoodAstro',
   'GoldMoodAstro cancellation and refund policy for subscriptions, credits and sessions.'),
  ('cpi-crefund-de', 'cp-cancel-refund', 'de',
   'Stornierungs- und Erstattungsrichtlinie', 'stornierung-erstattung',
   '{"html":"<h2>Stornierungs- und Erstattungsrichtlinie</h2><p>Diese Richtlinie erklaert Stornierungs- und Erstattungsbedingungen fuer GoldMoodAstro-Mitgliedschaften, Guthabenpakete und gebuchte Beratungen.</p><h3>Abonnements</h3><p>Abonnements koennen ueber die Abo-Verwaltung im App Store oder bei Google Play gekuendigt werden. Ein gekuendigtes Abo bleibt bis zum Ende des Abrechnungszeitraums aktiv.</p><h3>Guthabenpakete</h3><p>Fuer ungenutzte Guthabenpakete kann beim Support eine Erstattungspruefung beantragt werden. Genutzte Guthaben und abgeschlossene digitale Deutungen koennen vom Erstattungsumfang ausgeschlossen sein.</p><h3>Gebuchte Sitzungen</h3><p>Stornierungen vor Sitzungsbeginn koennen je nach Berechtigung erstattet oder neu geplant werden. Begonnene oder abgeschlossene Sitzungen werden vom Support geprueft.</p><h3>Technische Probleme</h3><p>Bei plattformseitigen Zahlungs-, Zugangs- oder Verbindungsproblemen werden Protokolle geprueft und eine angemessene Loesung bereitgestellt.</p><h3>Anfrage</h3><p>Erstattungsanfragen mit Bestellnummer an goldmoodastro@gmail.com senden.</p>"}',
   'Stornierungs-, Widerrufs- und Erstattungsbedingungen von GoldMoodAstro.',
   'Stornierungs- und Erstattungsrichtlinie — GoldMoodAstro',
   'GoldMoodAstro Richtlinie fuer Stornierung und Erstattung von Abos, Guthaben und Sitzungen.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  slug = VALUES(slug),
  content = VALUES(content),
  summary = VALUES(summary),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description);

-- -------------------------------------------------------------
-- Ön Bilgilendirme Formu (Mesafeli Sözleşmeler Yönetmeliği m.5)
-- Şirket kimlik alanları ({{...}}) müşteri bilgileri gelince doldurulur.
-- -------------------------------------------------------------
INSERT INTO custom_pages_i18n (id, custom_page_id, locale, title, slug, content, summary, meta_title, meta_description) VALUES
  ('cpi-preinfo-tr', 'cp-pre-info', 'tr',
   'Ön Bilgilendirme Formu', 'on-bilgilendirme-formu',
   '{"html":"<h2>Ön Bilgilendirme Formu</h2><p>Bu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, siparişinizi tamamlamadan önce bilgilendirilmeniz gereken hususları içerir.</p><h3>Hizmet Sağlayıcı</h3><p>Unvan: QUEBAB GIDA FABRİKASI RESTORAN İŞLETMECİLİĞİ EĞLENCE ORGANİZASYON VE KİRALAMA TİCARET LTD. ŞTİ.<br>Adres: Büyükçekmece / İstanbul · Tel: 0212 807 09 59<br>MERSİS / Vergi No: MERSİS 0632143381600001 · VKN 6321433816 · Tic. Sicil 491688-5<br>E-posta: goldmoodastro@gmail.com</p><h3>Hizmetin Temel Nitelikleri</h3><p>GoldMoodAstro üzerinden satın alınan hizmet; astroloji, farkındalık ve eğlence amaçlı dijital içerik ile danışmanların sunduğu randevulu (sesli/görüntülü/yazılı) online danışmanlık hizmetidir. Hizmet; tıbbi, hukuki, psikolojik veya finansal tavsiye niteliği taşımaz, kesin sonuç garantisi vermez.</p><h3>Fiyat ve Ödeme</h3><p>Tüm vergiler dahil toplam bedel sipariş özetinde gösterilir. Ödeme, lisanslı ödeme kuruluşu üzerinden alınır; kart bilgileri platform tarafından saklanmaz.</p><h3>İfa ve Teslim</h3><p>Randevulu seans, danışmanın uygun olduğu ve sizin seçtiğiniz tarih/saatte online olarak ifa edilir. Dijital üyelik ve kredi paketleri ödeme onayının ardından hesabınıza tanımlanır.</p><h3>Cayma Hakkı ve İstisnası</h3><p>Mesafeli Sözleşmeler Yönetmeliği m.15/1-ğ uyarınca, tüketicinin onayı ile ifasına başlanan ve elektronik ortamda anında ifa edilen hizmetlerde cayma hakkı bulunmamaktadır. Ödeme adımında bu onayı vererek seansın/dijital içeriğin derhal sunulmasını kabul etmiş olursunuz. Seans başlamadan önceki iptal ve iade koşulları İptal ve İade Politikası’nda düzenlenmiştir.</p><h3>Şikâyet ve İtiraz</h3><p>Uyuşmazlıklarda, Gümrük ve Ticaret Bakanlığı’nca ilan edilen parasal sınırlar dâhilinde tüketicinin yerleşim yerindeki Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.</p>"}',
   'Sipariş öncesi yasal ön bilgilendirme.',
   'Ön Bilgilendirme Formu — GoldMoodAstro',
   'GoldMoodAstro dijital hizmetleri için mesafeli satış ön bilgilendirme formu.'),
  ('cpi-preinfo-en', 'cp-pre-info', 'en',
   'Pre-Contract Information Form', 'pre-contract-information',
   '{"html":"<h2>Pre-Contract Information Form</h2><p>This form contains the information you should review before completing your order, in line with consumer protection legislation on distance contracts.</p><h3>Service Provider</h3><p>Legal name: QUEBAB GIDA FABRİKASI RESTORAN İŞLETMECİLİĞİ EĞLENCE ORGANİZASYON VE KİRALAMA TİCARET LTD. ŞTİ.<br>Address: Büyükçekmece / İstanbul · Tel: 0212 807 09 59<br>Tax / Registry No: MERSİS 0632143381600001 · VKN 6321433816 · Tic. Sicil 491688-5<br>Email: goldmoodastro@gmail.com</p><h3>Essential Characteristics of the Service</h3><p>The service purchased through GoldMoodAstro is astrology, self-awareness and entertainment oriented digital content together with scheduled online consulting (audio/video/text) provided by consultants. It does not constitute medical, legal, psychological or financial advice and offers no guaranteed outcome.</p><h3>Price and Payment</h3><p>The total price including all taxes is shown in the order summary. Payment is processed by a licensed payment provider; card details are not stored by the platform.</p><h3>Performance and Delivery</h3><p>Scheduled sessions are delivered online at the date/time you select and the consultant is available. Digital memberships and credit packages are credited to your account after payment confirmation.</p><h3>Right of Withdrawal and Its Exception</h3><p>For services performed instantly in electronic form and started with the consumer''s consent, there is no right of withdrawal. By giving this consent at the payment step, you accept immediate performance of the session/digital content. Cancellation and refund conditions before a session starts are set out in the Cancellation and Refund Policy.</p><h3>Complaints</h3><p>Disputes may be brought before the competent consumer arbitration committees or consumer courts at the consumer''s place of residence, within the applicable monetary limits.</p>"}',
   'Legal pre-contract information before ordering.',
   'Pre-Contract Information Form — GoldMoodAstro',
   'Distance sales pre-contract information form for GoldMoodAstro digital services.'),
  ('cpi-preinfo-de', 'cp-pre-info', 'de',
   'Vorvertragliche Informationen', 'vorvertragliche-informationen',
   '{"html":"<h2>Vorvertragliche Informationen</h2><p>Dieses Formular enthält die Informationen, die Sie vor Abschluss Ihrer Bestellung im Rahmen der Fernabsatzregeln zum Verbraucherschutz prüfen sollten.</p><h3>Diensteanbieter</h3><p>Firmenname: QUEBAB GIDA FABRİKASI RESTORAN İŞLETMECİLİĞİ EĞLENCE ORGANİZASYON VE KİRALAMA TİCARET LTD. ŞTİ.<br>Adresse: Büyükçekmece / İstanbul · Tel: 0212 807 09 59<br>Steuer-/Registernr.: MERSİS 0632143381600001 · VKN 6321433816 · Tic. Sicil 491688-5<br>E-Mail: goldmoodastro@gmail.com</p><h3>Wesentliche Merkmale der Leistung</h3><p>Die über GoldMoodAstro erworbene Leistung umfasst astrologische, selbstreflexive und unterhaltungsorientierte digitale Inhalte sowie gebuchte Online-Beratung (Audio/Video/Text) durch Berater. Sie stellt keine medizinische, rechtliche, psychologische oder finanzielle Beratung dar und bietet kein garantiertes Ergebnis.</p><h3>Preis und Zahlung</h3><p>Der Gesamtpreis inklusive aller Steuern wird in der Bestellübersicht angezeigt. Die Zahlung erfolgt über einen lizenzierten Zahlungsdienstleister; Kartendaten werden von der Plattform nicht gespeichert.</p><h3>Erbringung und Bereitstellung</h3><p>Gebuchte Sitzungen werden online zum von Ihnen gewählten Zeitpunkt erbracht. Digitale Mitgliedschaften und Guthabenpakete werden nach Zahlungsbestätigung gutgeschrieben.</p><h3>Widerrufsrecht und Ausnahme</h3><p>Bei elektronisch sofort erbrachten Leistungen, die mit Zustimmung des Verbrauchers begonnen werden, besteht kein Widerrufsrecht. Mit dieser Zustimmung im Zahlungsschritt akzeptieren Sie die sofortige Erbringung. Storno- und Erstattungsbedingungen vor Sitzungsbeginn regelt die Stornierungs- und Erstattungsrichtlinie.</p><h3>Beschwerden</h3><p>Streitigkeiten können vor den zuständigen Verbraucherschlichtungsstellen oder Verbrauchergerichten am Wohnort des Verbrauchers geltend gemacht werden.</p>"}',
   'Rechtliche vorvertragliche Informationen vor der Bestellung.',
   'Vorvertragliche Informationen — GoldMoodAstro',
   'Fernabsatz-Vorabinformationsformular fuer digitale GoldMoodAstro-Dienste.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  slug = VALUES(slug),
  content = VALUES(content),
  summary = VALUES(summary),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description);
