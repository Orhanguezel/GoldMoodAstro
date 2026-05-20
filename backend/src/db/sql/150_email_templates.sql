CREATE TABLE IF NOT EXISTS email_templates (
  id CHAR(36) PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL,
  variables TEXT,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY ux_email_tpl_key (template_key),
  KEY ix_email_tpl_active (is_active),
  KEY ix_email_tpl_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_templates_i18n (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  template_name VARCHAR(150) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY ux_email_tpl_key_locale (template_id, locale),
  KEY ix_email_tpl_i18n_locale (locale),
  KEY ix_email_tpl_i18n_name (template_name),
  CONSTRAINT fk_email_templates_i18n_template FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO email_templates (id, template_key, variables, is_active) VALUES
('70000000-0000-4000-8000-000000000001','booking_confirmed',        '["customer_name","appointment_date","appointment_time","consultant_name","decision_note"]',1),
('70000000-0000-4000-8000-000000000002','booking_reminder',         '["customer_name","appointment_date","appointment_time","consultant_name"]',1),
('70000000-0000-4000-8000-000000000003','payment_received',         '["customer_name","amount","currency","order_id"]',1),
('70000000-0000-4000-8000-000000000004','booking_accepted_customer','["customer_name","appointment_date","appointment_time","consultant_name","decision_note"]',1),
('70000000-0000-4000-8000-000000000005','booking_rejected_customer','["customer_name","appointment_date","appointment_time","consultant_name","decision_note"]',1),
('70000000-0000-4000-8000-000000000006','booking_cancelled',        '["customer_name","appointment_date","appointment_time","consultant_name"]',1),
('70000000-0000-4000-8000-000000000007','welcome',                  '["customer_name"]',1),
('70000000-0000-4000-8000-000000000008','password_reset',           '["customer_name","reset_link","expires_in"]',1),
('70000000-0000-4000-8000-000000000009','booking_request_now_consultant', '["consultant_name","customer_name","customer_message","panel_url"]',1),
('70000000-0000-4000-8000-00000000000a','booking_request_now_timeout_customer', '["customer_name","consultants_url"]',1),
('70000000-0000-4000-8000-00000000000b','email_verification',        '["user_name","verification_link","expires_in","site_name"]',1),
('70000000-0000-4000-8000-00000000000c','password_changed',          '["user_name","site_name"]',1),
('70000000-0000-4000-8000-00000000000d','kyc_rejected_consultant',   '["consultant_name","rejection_reason"]',1),
('70000000-0000-4000-8000-00000000000e','withdrawal_approved_consultant', '["consultant_name","amount","currency","bank_iban"]',1),
('70000000-0000-4000-8000-00000000000f','withdrawal_paid_consultant','["consultant_name","amount","currency","transfer_reference"]',1),
('70000000-0000-4000-8000-000000000010','withdrawal_rejected_consultant', '["consultant_name","amount","currency","rejection_reason"]',1)
ON DUPLICATE KEY UPDATE variables = VALUES(variables), is_active = VALUES(is_active);

INSERT INTO email_templates_i18n (id, template_id, locale, template_name, subject, content) VALUES
('71000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','tr','Randevu Onaylandi','Randevunuz onaylandi - {{consultant_name}}','<p>Merhaba {{customer_name}},</p><p>{{consultant_name}} ile {{appointment_date}} tarihinde saat {{appointment_time}} randevunuz onaylandi.</p>{% if decision_note %}<p>Not: {{decision_note}}</p>{% endif %}<p>Gorusmenizde basarilar dileriz.</p>'),
('71000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','tr','Randevu Hatirlatmasi','Yaklasan gorusme - {{consultant_name}}','<p>Merhaba {{customer_name}},</p><p>{{consultant_name}} ile {{appointment_date}} tarihinde saat {{appointment_time}} gorusmeniz yaklasıyor.</p><p>Gorusmeye zamaninda katilmayi unutmayin.</p>'),
('71000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000003','tr','Odeme Alindi','Odemeniz basariyla alindi','<p>Merhaba {{customer_name}},</p><p>{{amount}} {{currency}} tutarındaki odemeniz basariyla alindi.</p><p>Siparis No: {{order_id}}</p>'),
('71000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000004','tr','Randevu Kabul Edildi','Randevunuz kabul edildi','<p>Merhaba {{customer_name}},</p><p>{{consultant_name}} ile {{appointment_date}} tarihinde saat {{appointment_time}} randevunuz kabul edildi.</p>{% if decision_note %}<p>Not: {{decision_note}}</p>{% endif %}'),
('71000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000005','tr','Randevu Reddedildi','Randevunuz reddedildi','<p>Merhaba {{customer_name}},</p><p>{{appointment_date}} tarihindeki randevunuz reddedildi.</p>{% if decision_note %}<p>Sebep: {{decision_note}}</p>{% endif %}<p>Baska bir danismanla randevu alabilirsiniz.</p>'),
('71000000-0000-4000-8000-000000000006','70000000-0000-4000-8000-000000000006','tr','Randevu Iptal Edildi','Randevunuz iptal edildi','<p>Merhaba {{customer_name}},</p><p>{{consultant_name}} ile {{appointment_date}} tarihinde saat {{appointment_time}} randevunuz iptal edildi.</p><p>Baska bir danismanla randevu alabilirsiniz.</p>'),
('71000000-0000-4000-8000-000000000007','70000000-0000-4000-8000-000000000007','tr','Hos Geldiniz','Platforma hos geldiniz!','<p>Merhaba {{customer_name}},</p><p>Platforma hosgeldiniz! Artik danismanlarimizla kolayca randevu alabilirsiniz.</p><p>Hemen baslayabilirsiniz.</p>'),
('71000000-0000-4000-8000-000000000008','70000000-0000-4000-8000-000000000008','tr','Sifre Sifirlama','Sifre sifirlama istegi','<p>Merhaba {{customer_name}},</p><p>Sifre sifirlama isteginiz alindi. Asagidaki baglantiyi kullanabilirsiniz:</p><p><a href="{{reset_link}}">Sifremi Sifirla</a></p><p>Bu baglanti {{expires_in}} sureyle gecerlidir. Eger bu istegi siz yapmadıysanız bu e-postayı dikkate almayin.</p>'),
('71000000-0000-4000-8000-000000000009','70000000-0000-4000-8000-000000000009','tr','Anlik Gorusme Talebi','Anlik gorusme talebiniz var - {{customer_name}}','<p>Merhaba {{consultant_name}},</p><p><strong>{{customer_name}}</strong> sizinle <strong>hemen simdi</strong> gorusmek istiyor.</p>{% if customer_message %}<p><em>Mesaji:</em> {{customer_message}}</p>{% endif %}<p><strong>5 dakika icinde</strong> yanitlamazsaniz talep otomatik iptal olur.</p><p><a href="{{panel_url}}" style="display:inline-block;background:#d4a574;color:#1a1410;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Panele Git</a></p>'),
('71000000-0000-4000-8000-00000000000a','70000000-0000-4000-8000-00000000000a','tr','Anlik Gorusme Talebiniz Iptal Oldu','Anlik gorusme talebiniz zaman asimi','<p>Merhaba {{customer_name}},</p><p>Anlik gorusme talebiniz <strong>5 dakika icinde danismandan yanit alamadigi icin</strong> otomatik iptal edildi.</p><p>Baska bir danismanla denemek isterseniz:</p><p><a href="{{consultants_url}}" style="display:inline-block;background:#d4a574;color:#1a1410;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Danismanlari Gor</a></p>'),
('71000000-0000-4000-8000-00000000000b','70000000-0000-4000-8000-00000000000b','tr','E-posta Dogrulama','{{site_name}} e-posta dogrulama','<p>Merhaba {{user_name}},</p><p>{{site_name}} hesabiniz icin e-posta adresinizi dogrulamaniz gerekiyor.</p><p><a href="{{verification_link}}" style="display:inline-block;background:#7B5EA7;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">E-postami dogrula</a></p><p>Buton calismazsa bu baglantiyi tarayiciniza yapistirin:<br><a href="{{verification_link}}">{{verification_link}}</a></p><p>Bu baglanti {{expires_in}} gecerlidir.</p>'),
('71000000-0000-4000-8000-00000000000c','70000000-0000-4000-8000-00000000000b','en','Email Verification','Verify your {{site_name}} email','<p>Hello {{user_name}},</p><p>Please verify the email address for your {{site_name}} account.</p><p><a href="{{verification_link}}" style="display:inline-block;background:#7B5EA7;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify email</a></p><p>If the button does not work, paste this link into your browser:<br><a href="{{verification_link}}">{{verification_link}}</a></p><p>This link is valid for {{expires_in}}.</p>'),
('71000000-0000-4000-8000-00000000000d','70000000-0000-4000-8000-00000000000b','de','E-Mail-Bestatigung','Bestatigen Sie Ihre {{site_name}} E-Mail','<p>Hallo {{user_name}},</p><p>Bitte bestatigen Sie die E-Mail-Adresse fur Ihr {{site_name}} Konto.</p><p><a href="{{verification_link}}" style="display:inline-block;background:#7B5EA7;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">E-Mail bestatigen</a></p><p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br><a href="{{verification_link}}">{{verification_link}}</a></p><p>Dieser Link ist {{expires_in}} gultig.</p>'),
('71000000-0000-4000-8000-00000000000e','70000000-0000-4000-8000-00000000000c','tr','Sifre Degisti','GoldMoodAstro sifreniz degisti','<p>Merhaba {{user_name}},</p><p>GoldMoodAstro hesap sifreniz basariyla degistirildi.</p><p>Bu islemi siz yapmadiysaniz lutfen hemen destek ekibimizle iletisime gecin.</p>'),
('71000000-0000-4000-8000-00000000000f','70000000-0000-4000-8000-00000000000c','en','Password Changed','Your GoldMoodAstro password changed','<p>Hello {{user_name}},</p><p>Your GoldMoodAstro account password was changed successfully.</p><p>If you did not make this change, please contact support immediately.</p>'),
('71000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-00000000000c','de','Passwort geandert','Ihr GoldMoodAstro Passwort wurde geandert','<p>Hallo {{user_name}},</p><p>Das Passwort Ihres GoldMoodAstro Kontos wurde erfolgreich geandert.</p><p>Wenn Sie diese Anderung nicht vorgenommen haben, kontaktieren Sie bitte sofort den Support.</p>'),
('71000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-00000000000d','tr','KYC Reddedildi','Kimlik dogrulama basvurunuz reddedildi','<p>Merhaba {{consultant_name}},</p><p>Kimlik dogrulama basvurunuz reddedildi.</p><p><strong>Sebep:</strong> {{rejection_reason}}</p><p>Bilgilerinizi guncelleyip yeniden basvuru gonderebilirsiniz.</p>'),
('71000000-0000-4000-8000-000000000012','70000000-0000-4000-8000-00000000000d','en','KYC Rejected','Your identity verification was rejected','<p>Hello {{consultant_name}},</p><p>Your identity verification application was rejected.</p><p><strong>Reason:</strong> {{rejection_reason}}</p><p>You can update your information and submit again.</p>'),
('71000000-0000-4000-8000-000000000013','70000000-0000-4000-8000-00000000000d','de','KYC abgelehnt','Ihre Identitatsprufung wurde abgelehnt','<p>Hallo {{consultant_name}},</p><p>Ihre Identitatsprufung wurde abgelehnt.</p><p><strong>Grund:</strong> {{rejection_reason}}</p><p>Sie konnen Ihre Daten aktualisieren und erneut einreichen.</p>'),
('71000000-0000-4000-8000-000000000014','70000000-0000-4000-8000-00000000000e','tr','Odeme Talebi Onaylandi','Odeme talebiniz onaylandi','<p>Merhaba {{consultant_name}},</p><p>{{amount}} {{currency}} tutarindaki odeme talebiniz onaylandi.</p><p>Havale IBAN bilginize yapilacaktir: {{bank_iban}}</p>'),
('71000000-0000-4000-8000-000000000015','70000000-0000-4000-8000-00000000000e','en','Payout Request Approved','Your payout request was approved','<p>Hello {{consultant_name}},</p><p>Your payout request for {{amount}} {{currency}} was approved.</p><p>The transfer will be sent to your IBAN: {{bank_iban}}</p>'),
('71000000-0000-4000-8000-000000000016','70000000-0000-4000-8000-00000000000e','de','Auszahlungsanfrage genehmigt','Ihre Auszahlungsanfrage wurde genehmigt','<p>Hallo {{consultant_name}},</p><p>Ihre Auszahlungsanfrage uber {{amount}} {{currency}} wurde genehmigt.</p><p>Die Uberweisung wird an Ihre IBAN gesendet: {{bank_iban}}</p>'),
('71000000-0000-4000-8000-000000000017','70000000-0000-4000-8000-00000000000f','tr','Odeme Gonderildi','Odemeniz gonderildi','<p>Merhaba {{consultant_name}},</p><p>{{amount}} {{currency}} tutarindaki odemeniz gonderildi.</p><p>Transfer referansi: {{transfer_reference}}</p>'),
('71000000-0000-4000-8000-000000000018','70000000-0000-4000-8000-00000000000f','en','Payout Sent','Your payout was sent','<p>Hello {{consultant_name}},</p><p>Your payout of {{amount}} {{currency}} was sent.</p><p>Transfer reference: {{transfer_reference}}</p>'),
('71000000-0000-4000-8000-000000000019','70000000-0000-4000-8000-00000000000f','de','Auszahlung gesendet','Ihre Auszahlung wurde gesendet','<p>Hallo {{consultant_name}},</p><p>Ihre Auszahlung uber {{amount}} {{currency}} wurde gesendet.</p><p>Transferreferenz: {{transfer_reference}}</p>'),
('71000000-0000-4000-8000-00000000001a','70000000-0000-4000-8000-000000000010','tr','Odeme Talebi Reddedildi','Odeme talebiniz reddedildi','<p>Merhaba {{consultant_name}},</p><p>{{amount}} {{currency}} tutarindaki odeme talebiniz reddedildi.</p><p><strong>Sebep:</strong> {{rejection_reason}}</p><p>Tutar kullanilabilir bakiyenize iade edildi.</p>'),
('71000000-0000-4000-8000-00000000001b','70000000-0000-4000-8000-000000000010','en','Payout Request Rejected','Your payout request was rejected','<p>Hello {{consultant_name}},</p><p>Your payout request for {{amount}} {{currency}} was rejected.</p><p><strong>Reason:</strong> {{rejection_reason}}</p><p>The amount was returned to your available balance.</p>'),
('71000000-0000-4000-8000-00000000001c','70000000-0000-4000-8000-000000000010','de','Auszahlungsanfrage abgelehnt','Ihre Auszahlungsanfrage wurde abgelehnt','<p>Hallo {{consultant_name}},</p><p>Ihre Auszahlungsanfrage uber {{amount}} {{currency}} wurde abgelehnt.</p><p><strong>Grund:</strong> {{rejection_reason}}</p><p>Der Betrag wurde Ihrem verfugbaren Guthaben gutgeschrieben.</p>')
ON DUPLICATE KEY UPDATE
  template_name = VALUES(template_name),
  subject = VALUES(subject),
  content = VALUES(content);
