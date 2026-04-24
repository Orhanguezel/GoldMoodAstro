-- =============================================================
-- 141_faqs_seed.sql (FINAL)
-- Energetische Massage - Multilingual FAQs seed (faqs + faqs_i18n)
-- ✅ 140_faqs.sql şema mevcut olmalı (DROP/CREATE yok)
-- ✅ TR + EN + DE
-- ✅ NO category fields
-- ✅ faqs_i18n.id: CHAR(36) uyumlu STABIL UUID
-- =============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

-- =============================================================
-- SEED: PARENT (faqs)
-- =============================================================
INSERT INTO `faqs`
(`id`,                                `is_active`, `display_order`, `created_at`,                `updated_at`)
VALUES
('11111111-1111-1111-1111-111111111111', 1, 1, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('22222222-2222-2222-2222-222222222222', 1, 2, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('33333333-3333-3333-3333-333333333333', 1, 3, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('44444444-4444-4444-4444-444444444444', 1, 4, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('55555555-5555-5555-5555-555555555555', 1, 5, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('66666666-6666-6666-6666-666666666666', 1, 6, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('77777777-7777-7777-7777-777777777777', 1, 7, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('88888888-8888-8888-8888-888888888888', 1, 8, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('99999999-9999-9999-9999-999999999999', 1, 9, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 10, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `is_active`     = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `updated_at`    = VALUES(`updated_at`);

-- =============================================================
-- SEED: I18N (faqs_i18n) - TR + EN + DE
-- Unique: (faq_id, locale)
-- id: CHAR(36) stabil UUID (1..24)
-- =============================================================
INSERT INTO `faqs_i18n`
(`id`, `faq_id`, `locale`, `question`, `answer`, `slug`, `created_at`, `updated_at`)
VALUES

-- =============================================================
-- 1) Seans nerede gerçekleşiyor?
-- =============================================================
('00000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','tr',
'Seans nerede gerçekleşiyor?',
'Seanslar Bonn''da, Anastasia''nın sakin ve kişiye özel hazırlanan alanında gerçekleşir. Evde masaj hizmeti sunmuyoruz. Randevu sonrası detaylar ve konum bilgisi paylaşılır. Seans öncesinde kısa bir görüşme yapılır; ardından masajın akışı, o günkü ihtiyaca göre nazik ve net sınırlar içinde şekillenir.',
'seans-nerede-gerceklesiyor',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','en',
'Where does the session take place?',
'Sessions take place in Bonn at Anastasia''s calm, private space. We do not offer at home massage. After booking, you receive the details and location. We begin with a short conversation and then the session unfolds gently, within clear boundaries, shaped around what you need that day.',
'where-does-the-session-take-place',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','de',
'Wo findet die Sitzung statt?',
'Die Sitzungen finden in Bonn in Anastasias ruhigem, privaten Raum statt. Hausbesuche werden nicht angeboten. Nach der Buchung erhalten Sie alle Details sowie die genaue Adresse. Wir beginnen mit einem kurzen Vorgespräch; anschließend gestaltet sich die Behandlung achtsam, klar abgegrenzt und individuell nach Ihrem aktuellen Bedürfnis.',
'wo-findet-die-sitzung-statt',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 2) Hangi masaj türleri var?
-- =============================================================
('00000000-0000-0000-0000-000000000004','22222222-2222-2222-2222-222222222222','tr',
'Hangi masaj türlerini uyguluyorsunuz?',
'Odak noktamız enerjetik masajdır. Enerjetik rahatlama masajı, Thai Yoga masajı, sırt-boyun rahatlatma, aroma ile desteklenen seanslar, ayak refleks ve enerji noktaları gibi uygulamalar sunuyorum. Seans içeriği; bedenin gerilimi, nefes, sinir sistemi ve günlük stres düzeyinize göre kişiselleştirilir.',
'hangi-masaj-turleri-var',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000005','22222222-2222-2222-2222-222222222222','en',
'What types of massage do you offer?',
'Our focus is energetic massage. Depending on your needs, sessions may include energetic relaxation massage, Thai Yoga Massage, back and neck release, aroma supported work, and foot reflex and energy point techniques. Each session is tailored to your tension patterns, breath, nervous system, and stress level.',
'what-types-of-massage-do-you-offer',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000006','22222222-2222-2222-2222-222222222222','de',
'Welche Massagearten bieten Sie an?',
'Der Schwerpunkt liegt auf energetischer Massage. Je nach Bedarf kann eine Sitzung Elemente aus energetischer Entspannungsmassage, Thai Yoga Massage, Rücken und Nackenlösung, Aroma unterstützter Arbeit sowie Fußreflex und Energiepunkten enthalten. Jede Behandlung ist individuell abgestimmt auf Spannung, Atmung, Nervensystem und Stressniveau.',
'welche-massagearten-bieten-sie-an',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 3) Seans süresi ve içerik
-- =============================================================
('00000000-0000-0000-0000-000000000007','33333333-3333-3333-3333-333333333333','tr',
'Seans süresi ne kadar ve neleri kapsıyor?',
'Genellikle 60 veya 90 dakikalık seanslar öneriyorum. Süreye kısa bir ön görüşme, bedenin ihtiyacına göre ilerleyen masaj ve seans sonunda basit öneriler (su içmek, gün içinde sakinleşme molaları gibi) dahildir. Hedef; derin gevşeme, beden farkındalığı ve içsel dengeye alan açmaktır.',
'seans-suresi-ne-kadar',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000008','33333333-3333-3333-3333-333333333333','en',
'How long is a session and what does it include?',
'I typically recommend 60 or 90 minute sessions. The time includes a short pre chat, bodywork shaped around what you need, and simple aftercare suggestions (for example hydration and gentle grounding). The intention is deep relaxation, body awareness, and inner balance.',
'how-long-is-a-session',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000009','33333333-3333-3333-3333-333333333333','de',
'Wie lange dauert eine Sitzung und was ist enthalten?',
'Üblich sind 60 oder 90 Minuten. Enthalten sind ein kurzes Vorgespräch, Körperarbeit passend zu Ihrem Bedarf und einfache Hinweise für danach (zum Beispiel trinken, Ruhe, sanftes Ankommen). Im Mittelpunkt stehen tiefe Entspannung, Körperwahrnehmung und innere Balance.',
'wie-lange-dauert-eine-sitzung',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 4) Öncesinde nasıl hazırlanmalı?
-- =============================================================
('00000000-0000-0000-0000-000000000010','44444444-4444-4444-4444-444444444444','tr',
'Masaj öncesinde nasıl hazırlanmalıyım?',
'Rahat kıyafetlerle gelmenizi ve seans öncesinde ağır yemek yememenizi öneririm. Mümkünse birkaç dakika erken gelerek sakinleşebilirsiniz. Ağrı, sakatlık, hassasiyet veya sınırlarla ilgili tüm bilgileri seans öncesinde paylaşmanız önemlidir.',
'masaj-oncesi-nasil-hazirlanmali',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000011','44444444-4444-4444-4444-444444444444','en',
'How should I prepare before the massage?',
'Wear comfortable clothing and avoid a heavy meal right before the session. If possible, arrive a few minutes early to settle. Please share any injuries, sensitivities, health conditions, or boundaries before we begin.',
'how-to-prepare-before-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000012','44444444-4444-4444-4444-444444444444','de',
'Wie bereite ich mich auf die Massage vor?',
'Tragen Sie bequeme Kleidung und vermeiden Sie direkt vorher eine schwere Mahlzeit. Wenn möglich, kommen Sie ein paar Minuten früher, um in Ruhe anzukommen. Bitte informieren Sie mich vor Beginn über Beschwerden, Empfindlichkeiten, gesundheitliche Themen und Ihre Grenzen.',
'wie-vorbereiten-vor-der-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 5) Hijyen ve güvenlik
-- =============================================================
('00000000-0000-0000-0000-000000000013','55555555-5555-5555-5555-555555555555','tr',
'Hijyen ve güvenlik konusunda hangi önlemler alınıyor?',
'Seanslarda temiz tekstil ürünleri kullanılır ve ekipmanlar her randevudan sonra dezenfekte edilir. Kullanılan ürünler cilt dostu seçilir. Kendinizi rahat hissetmeniz için seans öncesinde tüm sorularınızı yanıtlar, uygulamayı onayınızla başlatırım.',
'hijyen-ve-guvenlik-onlemleri',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000014','55555555-5555-5555-5555-555555555555','en',
'What hygiene and safety measures do you follow?',
'I use clean textiles and disinfect equipment after every appointment. Products are chosen to be skin-friendly. To ensure you feel comfortable, I answer your questions first and start only with your consent.',
'hygiene-and-safety-measures',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000015','55555555-5555-5555-5555-555555555555','de',
'Welche Hygiene- und Sicherheitsmaßnahmen werden eingehalten?',
'Ich verwende saubere Textilien und desinfiziere das Equipment nach jedem Termin. Die Produkte sind hautfreundlich ausgewählt. Damit Sie sich wohlfühlen, klären wir vorab alle Fragen und ich beginne erst mit Ihrem Einverständnis.',
'hygiene-und-sicherheit',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 6) Kimler için uygun değildir?
-- =============================================================
('00000000-0000-0000-0000-000000000016','66666666-6666-6666-6666-666666666666','tr',
'Masaj kimler için uygun değildir?',
'Ateşli hastalık, akut enfeksiyon, ciddi damar rahatsızlığı, pıhtı riski, kontrolsüz tansiyon gibi durumlarda masaj önerilmez. Hamilelik, yeni ameliyat, fıtık veya kronik rahatsızlık gibi durumlarda mutlaka önceden bilgi verin; gerekirse doktor onayıyla ilerlenir veya seans ertelenir.',
'masaj-kimler-icin-uygun-degildir',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000017','66666666-6666-6666-6666-666666666666','en',
'Who should not get a massage?',
'Massage is generally not recommended in cases such as fever, acute infection, serious vascular conditions, clot risk, or uncontrolled blood pressure. Please inform me in advance about pregnancy, recent surgery, herniation, or chronic conditions; we may proceed only with medical approval or reschedule.',
'who-should-not-get-a-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000018','66666666-6666-6666-6666-666666666666','de',
'Für wen ist Massage nicht geeignet?',
'Bei Fieber, akuten Infektionen, schweren Gefäßerkrankungen, Thromboserisiko oder unkontrolliertem Blutdruck ist Massage in der Regel nicht empfohlen. Bitte informieren Sie mich vorab über Schwangerschaft, Operationen, Bandscheibenvorfälle oder chronische Beschwerden; ggf. nur mit ärztlicher Freigabe oder Terminverschiebung.',
'fuer-wen-ist-massage-nicht-geeignet',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 7) Ödeme ve fiyatlandırma
-- =============================================================
('00000000-0000-0000-0000-000000000019','77777777-7777-7777-7777-777777777777','tr',
'Ödeme ve fiyatlandırma nasıl oluyor?',
'Fiyat seans süresine (ör. 60/90 dk) ve seçilen hizmete göre belirlenir. Randevu onayı sonrası net fiyatı iletirim. Ödeme yöntemleri (nakit/IBAN vb.) hizmet sayfanızdaki bilgilere göre güncellenebilir.',
'odeme-ve-fiyatlandirma',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000020','77777777-7777-7777-7777-777777777777','en',
'How do pricing and payments work?',
'Pricing depends on the session duration (for example 60 or 90 minutes) and the selected service. After confirming your appointment, I share the final price. Payment methods (cash or bank transfer, etc.) can be updated based on the information on your service page.',
'pricing-and-payments',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000021','77777777-7777-7777-7777-777777777777','de',
'Wie funktionieren Preise und Bezahlung?',
'Der Preis richtet sich nach Dauer (zum Beispiel 60 oder 90 Minuten) und der gewählten Behandlung. Nach der Terminbestätigung teile ich den Endpreis mit. Zahlungsarten (Bar, Überweisung usw.) können gemäß Ihrer Leistungsseite aktualisiert werden.',
'preise-und-bezahlung',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 8) İptal ve erteleme
-- =============================================================
('00000000-0000-0000-0000-000000000022','88888888-8888-8888-8888-888888888888','tr',
'Randevu iptali veya erteleme nasıl yapılır?',
'Plan değiştiyse mümkün olan en erken zamanda haber vermeniz yeterli. Mümkünse en az 24 saat önceden bilgi vermenizi rica ederim. Aynı gün değişiklikler müsaitliğe göre planlanır. Düzenli bir akış için iptal veya erteleme politikasının hizmet sayfasında net olması önerilir.',
'randevu-iptali-ve-erteleme',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000023','88888888-8888-8888-8888-888888888888','en',
'How can I cancel or reschedule my appointment?',
'If your plans change, please let me know as early as possible. If possible, I kindly ask for at least 24 hours notice. Same day changes depend on availability. For a smooth process, it is recommended to clearly state your cancellation and rescheduling policy on your service page.',
'cancel-or-reschedule-appointment',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000024','88888888-8888-8888-8888-888888888888','de',
'Wie kann ich einen Termin absagen oder verschieben?',
'Wenn sich Ihre Planung ändert, geben Sie bitte so früh wie möglich Bescheid. Wenn möglich, bitte mindestens 24 Stunden vorher. Änderungen am selben Tag sind abhängig von der Verfügbarkeit. Für einen reibungslosen Ablauf empfiehlt es sich, die Storno und Umbuchungsregeln auf der Leistungsseite klar zu kommunizieren.',
'termin-absagen-oder-verschieben',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 9) Enerjetik masaj nedir?
-- =============================================================
('00000000-0000-0000-0000-000000000025','99999999-9999-9999-9999-999999999999','tr',
'Enerjetik masaj nedir ve klasik masajdan farkı ne?',
'Enerjetik masaj, klasik masaj tekniklerini enerji bazlı beden çalışmasıyla birleştirir. Sadece kasları gevşetmekle kalmaz, aynı zamanda enerji akışındaki blokajları çözmeyi, vücudun kendini iyileştirme mekanizmasını desteklemeyi ve derin bir rahatlama durumu yaratmayı hedefler. Seans sırasında şükran, niyet ve bilinçli dokunuş bir bütün olarak uygulanır.',
'enerjetik-masaj-nedir',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000026','99999999-9999-9999-9999-999999999999','en',
'What is energetic massage and how is it different from a regular massage?',
'Energetic massage combines classical massage techniques with energy-based bodywork. It goes beyond releasing muscle tension — it aims to dissolve blockages in the energy flow, support the body''s self-healing mechanisms, and create a state of deep relaxation. During the session, gratitude, intention, and mindful touch are applied as a whole.',
'what-is-energetic-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000027','99999999-9999-9999-9999-999999999999','de',
'Was ist energetische Massage und worin unterscheidet sie sich von einer klassischen Massage?',
'Energetische Massage verbindet klassische Massagetechniken mit energetischer Körperarbeit. Sie geht über die reine Muskellösung hinaus und zielt darauf ab, Blockaden im Energiefluss aufzulösen, die Selbstheilungskräfte des Körpers zu unterstützen und einen Zustand tiefer Entspannung zu schaffen. Während der Sitzung werden Dankbarkeit, Intention und achtsame Berührung als Ganzes eingesetzt.',
'was-ist-energetische-massage',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

-- =============================================================
-- 10) Hediye çeki / Gutschein
-- =============================================================
('00000000-0000-0000-0000-000000000028','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','tr',
'Masaj seansı hediye edebilir miyim?',
'Evet! Web sitemiz üzerinden hediye çeki (Gutschein) satın alabilirsiniz. Hediye çeki e-posta ile gönderilir ve istediğiniz seans süresi için kullanılabilir. Sevdiklerinize rahatlama ve kendine zaman ayırma hediyesi sunmanın harika bir yoludur.',
'masaj-hediye-edebilir-miyim',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000029','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','en',
'Can I gift a massage session?',
'Yes! You can purchase a gift voucher (Gutschein) through our website. The voucher is delivered by email and can be used for your preferred session duration. It is a wonderful way to give your loved ones the gift of relaxation and time for themselves.',
'can-i-gift-a-massage-session',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000'),

('00000000-0000-0000-0000-000000000030','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','de',
'Kann ich eine Massage-Sitzung verschenken?',
'Ja! Über unsere Website können Sie einen Gutschein erwerben. Der Gutschein wird per E-Mail zugestellt und kann für die gewünschte Sitzungsdauer eingelöst werden. Eine wunderbare Möglichkeit, Ihren Liebsten Entspannung und Zeit für sich selbst zu schenken.',
'massage-sitzung-verschenken',
'2026-01-01 00:00:00.000','2026-01-01 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `question`   = VALUES(`question`),
  `answer`     = VALUES(`answer`),
  `slug`       = VALUES(`slug`),
  `updated_at` = VALUES(`updated_at`);

COMMIT;
