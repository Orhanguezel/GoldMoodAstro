-- =============================================================
-- Chat AI knowledge base (admin managed, locale aware)
-- Energetische Massage — Massage & Wellness
-- =============================================================

CREATE TABLE IF NOT EXISTS `chat_ai_knowledge` (
  `id` varchar(36) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `title` varchar(160) NOT NULL,
  `content` text NOT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `priority` int NOT NULL DEFAULT 100,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_chat_ai_knowledge_locale_active_priority` (`locale`, `is_active`, `priority`),
  KEY `ix_chat_ai_knowledge_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── DE (Deutsch — Hauptsprache) ────────────────────────────

INSERT INTO `chat_ai_knowledge`
(`id`, `locale`, `title`, `content`, `tags`, `is_active`, `priority`)
VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'de',
  'Preisauskunft-Richtlinie',
  'Preise dürfen in diesem Chat nicht genannt werden. Bei Preisfragen antworte: "Preise teile ich hier nicht mit. Sie finden unsere aktuellen Preise auf unserer Website oder können telefonisch nachfragen. Möchten Sie, dass ich Sie zur Terminbuchung weiterleite?"',
  'preis,kosten,preisliste,tarif',
  1,
  1
),
(
  'c1000000-0000-0000-0000-000000000002',
  'de',
  'Terminbuchung weiterleiten',
  'Wenn der Kunde eine Buchung wünscht oder zustimmt, leite ihn zum Online-Buchungsformular weiter. Teile den Link nur nach ausdrücklicher Zustimmung.',
  'termin,buchen,buchung,reservierung,weiterleitung',
  1,
  2
),
(
  'c1000000-0000-0000-0000-000000000003',
  'de',
  'Angebotene Massagearten',
  'Energetische Massage bietet folgende Massagen an: Klassische Massage, Sportmassage, Tiefengewebsmassage, Aromatherapie-Massage, Hot-Stone-Massage, Reflexzonenmassage, Lymphdrainage, Schwangerschaftsmassage und Kopf-Nacken-Schulter-Massage. Für Details zu einzelnen Behandlungen verweise auf die Website.',
  'massage,behandlung,angebot,leistung,service',
  1,
  3
),
(
  'c1000000-0000-0000-0000-000000000004',
  'de',
  'Öffnungszeiten & Standort',
  'Bei Fragen zu Öffnungszeiten oder Standort antworte: "Unsere aktuellen Öffnungszeiten und Adresse finden Sie auf unserer Website im Kontaktbereich. Wir freuen uns auf Ihren Besuch!" Nenne keine konkreten Zeiten, da sich diese ändern können.',
  'öffnungszeiten,adresse,standort,anfahrt,kontakt',
  1,
  4
),
(
  'c1000000-0000-0000-0000-000000000005',
  'de',
  'Stornierung & Umbuchung',
  'Bei Stornierungsfragen: "Bitte kontaktieren Sie uns mindestens 24 Stunden vor Ihrem Termin telefonisch oder per E-Mail, um kostenlos zu stornieren oder umzubuchen. Bei kurzfristigen Absagen können Gebühren anfallen."',
  'stornierung,absage,umbuchung,termin ändern',
  1,
  5
),
(
  'c1000000-0000-0000-0000-000000000006',
  'de',
  'Geschenkgutscheine',
  'Energetische Massage bietet Geschenkgutscheine für alle Massagen und Wellness-Behandlungen an. Bei Interesse verweise auf die Website oder die telefonische Bestellung.',
  'gutschein,geschenk,geschenkgutschein,voucher',
  1,
  6
),
(
  'c1000000-0000-0000-0000-000000000007',
  'de',
  'Gesundheitshinweise',
  'Der Chat-Assistent darf KEINE medizinischen Ratschläge oder Diagnosen geben. Bei gesundheitlichen Fragen immer auf einen Arzt verweisen. Sage: "Für medizinische Fragen wenden Sie sich bitte an Ihren Arzt. Unsere Therapeuten beraten Sie gerne vor Ort zu passenden Behandlungen."',
  'gesundheit,krankheit,schmerzen,medizinisch,arzt',
  1,
  7
),

-- ─── TR (Türkçe) ───────────────────────────────────────────

(
  'c1000000-0000-0000-0000-000000000011',
  'tr',
  'Fiyat bilgisi politikası',
  'Fiyat bilgisi bu kanaldan paylaşılmaz. Fiyat sorusu gelirse şu mesajı ver: "Fiyat bilgisini bu kanaldan paylaşamıyorum. Güncel fiyatlarımızı web sitemizden görebilir veya telefonla öğrenebilirsiniz. Randevu almak ister misiniz?"',
  'fiyat,ücret,tarife,maliyet',
  1,
  1
),
(
  'c1000000-0000-0000-0000-000000000012',
  'tr',
  'Randevu yönlendirmesi',
  'Müşteri randevu almak istediğinde veya onay verdiğinde online randevu formuna yönlendir. Onay olmadan link paylaşma.',
  'randevu,rezervasyon,booking,yönlendirme',
  1,
  2
),
(
  'c1000000-0000-0000-0000-000000000013',
  'tr',
  'Sunulan masaj türleri',
  'Energetische Massage şu masajları sunmaktadır: Klasik Masaj, Spor Masajı, Derin Doku Masajı, Aromaterapi Masajı, Sıcak Taş Masajı, Refleksoloji, Lenf Drenajı, Hamilelik Masajı ve Baş-Boyun-Omuz Masajı. Detaylar için web sitesine yönlendir.',
  'masaj,hizmet,tedavi,seçenek',
  1,
  3
),
(
  'c1000000-0000-0000-0000-000000000014',
  'tr',
  'İptal ve değişiklik',
  'İptal sorularında: "Lütfen randevunuzdan en az 24 saat önce telefon veya e-posta ile iletişime geçin. Son dakika iptallerinde ücret yansıyabilir."',
  'iptal,değişiklik,randevu değiştir',
  1,
  5
),
(
  'c1000000-0000-0000-0000-000000000015',
  'tr',
  'Sağlık uyarısı',
  'Chat asistanı tıbbi tavsiye veya teşhis veremez. Sağlık soruları için mutlaka doktora yönlendir. De ki: "Sağlık konularında lütfen doktorunuza danışın. Terapistlerimiz size uygun tedavileri yerinde önerebilir."',
  'sağlık,hastalık,ağrı,tıbbi,doktor',
  1,
  7
),

-- ─── EN (English) ───────────────────────────────────────────

(
  'c1000000-0000-0000-0000-000000000021',
  'en',
  'Price inquiry policy',
  'Do not share pricing in this chat channel. For price questions use: "I cannot share pricing here. You can find our current prices on our website or call us directly. Would you like me to redirect you to our booking form?"',
  'price,cost,rate,pricing',
  1,
  1
),
(
  'c1000000-0000-0000-0000-000000000022',
  'en',
  'Booking redirect',
  'When the customer wants to book or gives consent, redirect them to the online booking form. Only share the link after explicit confirmation.',
  'booking,appointment,schedule,redirect',
  1,
  2
),
(
  'c1000000-0000-0000-0000-000000000023',
  'en',
  'Available massage types',
  'Energetische Massage offers: Classic Massage, Sports Massage, Deep Tissue Massage, Aromatherapy Massage, Hot Stone Massage, Reflexology, Lymphatic Drainage, Pregnancy Massage and Head-Neck-Shoulder Massage. Refer to the website for details on individual treatments.',
  'massage,treatment,service,option',
  1,
  3
),
(
  'c1000000-0000-0000-0000-000000000024',
  'en',
  'Cancellation & rescheduling',
  'For cancellation questions: "Please contact us at least 24 hours before your appointment via phone or email for free cancellation or rescheduling. Late cancellations may incur a fee."',
  'cancel,reschedule,change appointment',
  1,
  5
),
(
  'c1000000-0000-0000-0000-000000000025',
  'en',
  'Health disclaimer',
  'The chat assistant must NEVER give medical advice or diagnoses. Always refer health questions to a doctor. Say: "For medical questions, please consult your doctor. Our therapists will be happy to recommend suitable treatments on-site."',
  'health,pain,medical,doctor,condition',
  1,
  7
)

ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `tags` = VALUES(`tags`),
  `is_active` = VALUES(`is_active`),
  `priority` = VALUES(`priority`),
  `updated_at` = CURRENT_TIMESTAMP;
