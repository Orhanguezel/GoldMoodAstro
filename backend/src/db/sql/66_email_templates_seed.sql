-- ============================================================
-- FILE: 66_email_templates_seed.sql
-- EMAIL_TEMPLATES (i18n) — SEED (tr/en/de)
-- FINAL — IDPOTENT + BOOKING FIXED (message placeholder)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ============================================================
-- 1) SEED: PARENT (email_templates)
-- ============================================================

INSERT INTO `email_templates`
(`id`, `template_key`, `variables`, `is_active`, `created_at`, `updated_at`)
VALUES

-- password reset
('da91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'password_reset',
 JSON_ARRAY('reset_link','site_name'),
 1, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('c0bb0c00-1a2b-4c5d-9e8f-001122334455',
 'password_changed',
 JSON_ARRAY('user_name','site_name'),
 1, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- contact form
('11112222-3333-4444-5555-666677778888',
 'contact_admin_notification',
 JSON_ARRAY('name','email','phone','subject','message','ip','user_agent'),
 1, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('99990000-aaaa-bbbb-cccc-ddddeeee0000',
 'contact_user_autoreply',
 JSON_ARRAY('name','subject'),
 1, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- welcome
('e7fae474-c1cf-4600-8466-2f915146cfb9',
 'welcome',
 JSON_ARRAY('user_name','user_email','site_name'),
 1, '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000'),

-- bookings
('b0c0a111-1111-4111-8111-111111111111',
 'booking_created_customer',
 JSON_ARRAY(
   'site_name','booking_id','customer_name','customer_email','customer_phone',
   'appointment_date','appointment_time','service_title','service_slug','message','status'
 ),
 1, '2026-01-07 00:00:00.000', '2026-01-07 00:00:00.000'),

('b0c0a222-2222-4222-8222-222222222222',
 'booking_created_admin',
 JSON_ARRAY(
   'site_name','booking_id','customer_name','customer_email','customer_phone',
   'appointment_date','appointment_time','service_title','service_slug','message','status'
 ),
 1, '2026-01-07 00:00:00.000', '2026-01-07 00:00:00.000'),

('b0c0a333-3333-4333-8333-333333333333',
 'booking_status_changed_customer',
 JSON_ARRAY(
   'site_name','booking_id','customer_name','customer_email','customer_phone',
   'appointment_date','appointment_time','service_title','service_slug','message',
   'status_before','status_after','decision_note'
 ),
 1, '2026-01-07 00:00:00.000', '2026-01-07 00:00:00.000'),

-- NEW: booking accepted / rejected (customer)
('b0c0a444-4444-4444-8444-444444444444',
 'booking_accepted_customer',
 JSON_ARRAY(
   'site_name','booking_id','customer_name',
   'appointment_date','appointment_time','service_title','decision_note','payment_section'
 ),
 1, '2026-01-12 00:00:00.000', '2026-03-07 00:00:00.000'),

('b0c0a555-5555-4555-8555-555555555555',
 'booking_rejected_customer',
 JSON_ARRAY(
   'site_name','booking_id','customer_name',
   'appointment_date','appointment_time','service_title','decision_note'
 ),
 1, '2026-01-12 00:00:00.000', '2026-01-12 00:00:00.000'),

('b0c0a666-6666-4666-8666-666666666666',
 'booking_reminder_customer',
 JSON_ARRAY(
   'site_name','booking_id','customer_name',
   'appointment_date','appointment_time','service_title','resource_title','reminder_note'
 ),
 1, '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `id`         = VALUES(`id`),
  `variables`  = VALUES(`variables`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);

-- ============================================================
-- 2) SEED: I18N (email_templates_i18n) TR + EN + DE
-- ============================================================

INSERT INTO `email_templates_i18n`
(`id`, `template_id`, `locale`, `template_name`, `subject`, `content`, `created_at`, `updated_at`)
VALUES

-- ===================== password_reset =====================

('fa91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'da91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'tr',
 'Şifre Sıfırlama',
 'Şifre Sıfırlama Talebi - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Şifre Sıfırlama</h1>
    <p style="color: #666; font-size: 16px;">Merhaba,</p>
    <p style="color: #666; font-size: 16px;">Hesabınız için şifre sıfırlama talebi aldık.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{reset_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
    </div>
    <p style="color: #666; font-size: 14px;">Bu linkin geçerlilik süresi 1 saattir.</p>
    <p style="color: #666; font-size: 14px;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('ea91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'da91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'en',
 'Password Reset',
 'Password Reset Request - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Password Reset</h1>
    <p style="color: #666; font-size: 16px;">Hello,</p>
    <p style="color: #666; font-size: 16px;">We received a password reset request for your account.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{reset_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link is valid for 1 hour.</p>
    <p style="color: #666; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
    <p style="color: #666; font-size: 16px;">Best regards,<br>{{site_name}} Team</p>
  </div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('0a91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'da91f94a-bfe1-46b7-83fc-b4152e27c65e',
 'de',
 'Passwort zurücksetzen',
 'Passwort zurücksetzen - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Passwort zurücksetzen</h1>
    <p style="color: #666; font-size: 16px;">Hallo,</p>
    <p style="color: #666; font-size: 16px;">wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{reset_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Passwort zurücksetzen</a>
    </div>
    <p style="color: #666; font-size: 14px;">Dieser Link ist 1 Stunde gültig.</p>
    <p style="color: #666; font-size: 14px;">Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
    <p style="color: #666; font-size: 16px;">Mit freundlichen Grüßen,<br>{{site_name}} Team</p>
  </div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- ===================== password_changed =====================

('d0bb0c00-1a2b-4c5d-9e8f-554433221100',
 'c0bb0c00-1a2b-4c5d-9e8f-001122334455',
 'tr',
 'Şifre Güncellendi',
 'Şifreniz Güncellendi - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="font-size:20px; text-align:center;">Şifreniz Güncellendi</h1>
    <p>Merhaba <strong>{{user_name}}</strong>,</p>
    <p>Hesap şifreniz başarıyla değiştirildi.</p>
    <p>Eğer bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.</p>
    <p>Saygılarımızla,</p>
    <p>{{site_name}} Ekibi</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('e0bb0c00-1a2b-4c5d-9e8f-554433221100',
 'c0bb0c00-1a2b-4c5d-9e8f-001122334455',
 'en',
 'Password Changed',
 'Your Password Has Been Updated - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="font-size:20px; text-align:center;">Your Password Has Been Updated</h1>
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>Your account password has been successfully changed.</p>
    <p>If you did not perform this action, please contact us as soon as possible.</p>
    <p>Best regards,</p>
    <p>{{site_name}} Team</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('f0bb0c00-1a2b-4c5d-9e8f-554433221100',
 'c0bb0c00-1a2b-4c5d-9e8f-001122334455',
 'de',
 'Passwort geändert',
 'Ihr Passwort wurde aktualisiert - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="font-size:20px; text-align:center;">Ihr Passwort wurde aktualisiert</h1>
    <p>Hallo <strong>{{user_name}}</strong>,</p>
    <p>Ihr Kontopasswort wurde erfolgreich geändert.</p>
    <p>Wenn Sie diese Aktion nicht durchgeführt haben, kontaktieren Sie uns bitte so schnell wie möglich.</p>
    <p>Mit freundlichen Grüßen,</p>
    <p>{{site_name}} Team</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- ===================== contact_admin_notification =====================

('21112222-3333-4444-5555-666677778888',
 '11112222-3333-4444-5555-666677778888',
 'tr',
 'İletişim Formu (Admin Bildirimi)',
 'Yeni İletişim Mesajı - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">Yeni iletişim formu mesajı</h1>
  <p><strong>Ad Soyad:</strong> {{name}}</p>
  <p><strong>E-posta:</strong> {{email}}</p>
  <p><strong>Telefon:</strong> {{phone}}</p>
  <p><strong>Konu:</strong> {{subject}}</p>
  <p><strong>IP:</strong> {{ip}}</p>
  <p><strong>User-Agent:</strong> {{user_agent}}</p>
  <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />
  <p><strong>Mesaj:</strong></p>
  <pre style="white-space:pre-wrap;word-break:break-word;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">{{message}}</pre>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('31112222-3333-4444-5555-666677778888',
 '11112222-3333-4444-5555-666677778888',
 'en',
 'Contact Admin Notification',
 'New Contact Message - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">New contact form message</h1>
  <p><strong>Name:</strong> {{name}}</p>
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Phone:</strong> {{phone}}</p>
  <p><strong>Subject:</strong> {{subject}}</p>
  <p><strong>IP:</strong> {{ip}}</p>
  <p><strong>User-Agent:</strong> {{user_agent}}</p>
  <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />
  <p><strong>Message:</strong></p>
  <pre style="white-space:pre-wrap;word-break:break-word;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">{{message}}</pre>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('41112222-3333-4444-5555-666677778888',
 '11112222-3333-4444-5555-666677778888',
 'de',
 'Kontaktformular Admin-Benachrichtigung',
 'Neue Kontaktanfrage - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">Neue Nachricht über das Kontaktformular</h1>
  <p><strong>Name:</strong> {{name}}</p>
  <p><strong>E-Mail:</strong> {{email}}</p>
  <p><strong>Telefon:</strong> {{phone}}</p>
  <p><strong>Betreff:</strong> {{subject}}</p>
  <p><strong>IP:</strong> {{ip}}</p>
  <p><strong>User-Agent:</strong> {{user_agent}}</p>
  <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />
  <p><strong>Nachricht:</strong></p>
  <pre style="white-space:pre-wrap;word-break:break-word;background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">{{message}}</pre>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- ===================== contact_user_autoreply =====================

('99990000-bbbb-cccc-dddd-eeeeffff0000',
 '99990000-aaaa-bbbb-cccc-ddddeeee0000',
 'tr',
 'İletişim Otomatik Yanıt',
 'Mesajınızı Aldık - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">Mesajınızı Aldık</h1>
  <p>Merhaba <strong>{{name}}</strong>,</p>
  <p>İletişim formu üzerinden göndermiş olduğunuz mesaj bize ulaştı.</p>
  <p>En kısa süre içinde size dönüş yapacağız.</p>
  <p>İyi günler dileriz.</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('99990000-cccc-dddd-eeee-ffff11110000',
 '99990000-aaaa-bbbb-cccc-ddddeeee0000',
 'en',
 'Contact User Autoreply',
 'We''ve Received Your Message - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">We''ve received your message</h1>
  <p>Hello <strong>{{name}}</strong>,</p>
  <p>Your message sent via our contact form has reached us.</p>
  <p>We will get back to you as soon as possible.</p>
  <p>Have a nice day.</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

('99990000-dddd-eeee-ffff-222233330000',
 '99990000-aaaa-bbbb-cccc-ddddeeee0000',
 'de',
 'Kontakt Auto-Antwort',
 'Wir haben Ihre Nachricht erhalten - {{subject}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.5;color:#111827;">
  <h1 style="font-size:18px;margin-bottom:12px;">Wir haben Ihre Nachricht erhalten</h1>
  <p>Hallo <strong>{{name}}</strong>,</p>
  <p>Ihre Nachricht über unser Kontaktformular ist bei uns eingegangen.</p>
  <p>Wir melden uns so schnell wie möglich bei Ihnen.</p>
  <p>Freundliche Grüße</p>
</div>',
 '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),

-- ===================== welcome =====================

('f7fae474-c1cf-4600-8466-2f915146cfb9',
 'e7fae474-c1cf-4600-8466-2f915146cfb9',
 'tr',
 'Hoş Geldiniz',
 'Hesabınız Oluşturuldu - {{site_name}}',
 '<h1 class="ql-align-center">Hesabınız Oluşturuldu</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>{{site_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p><p><br></p><p>E-posta: <strong>{{user_email}}</strong></p><p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>',
 '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000'),

('07fae474-c1cf-4600-8466-2f915146cfb9',
 'e7fae474-c1cf-4600-8466-2f915146cfb9',
 'en',
 'Welcome',
 'Your Account Has Been Created - {{site_name}}',
 '<h1 class="ql-align-center">Your Account Has Been Created</h1><p>Hello <strong>{{user_name}}</strong>,</p><p>Welcome to {{site_name}}! Your account has been successfully created.</p><p><br></p><p>Email: <strong>{{user_email}}</strong></p><p>If you have any questions, feel free to contact us anytime.</p><p>Best regards,</p><p>{{site_name}} Team</p>',
 '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000'),

('17fae474-c1cf-4600-8466-2f915146cfb9',
 'e7fae474-c1cf-4600-8466-2f915146cfb9',
 'de',
 'Willkommen',
 'Ihr Konto wurde erstellt - {{site_name}}',
 '<h1 style="text-align:center;">Ihr Konto wurde erstellt</h1><p>Hallo <strong>{{user_name}}</strong>,</p><p>Willkommen bei {{site_name}}! Ihr Konto wurde erfolgreich erstellt.</p><p><br></p><p>E-Mail: <strong>{{user_email}}</strong></p><p>Wenn Sie Fragen haben, kontaktieren Sie uns jederzeit.</p><p>Mit freundlichen Grüßen,</p><p>{{site_name}} Team</p>',
 '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000'),

-- ===================== booking_created_customer =====================

('b1c0a111-1111-4111-8111-111111111111',
 'b0c0a111-1111-4111-8111-111111111111',
 'tr',
 'Randevu Alındı (Müşteri)',
 'Randevu Talebiniz Alındı - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Randevu Talebiniz Alındı</h1>
  <p>Merhaba <strong>{{customer_name}}</strong>,</p>
  <p>Randevu talebinizi aldık. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Saat:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Durum:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Mesajınız:</strong> {{message}}</p>
  </div>

  <p>İyi günler dileriz.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a111-1111-4111-8111-111111111112',
 'b0c0a111-1111-4111-8111-111111111111',
 'en',
 'Booking Received (Customer)',
 'We''ve received your booking request - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">We''ve received your booking request</h1>
  <p>Hello <strong>{{customer_name}}</strong>,</p>
  <p>We have received your request. Our team will contact you shortly.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Date:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Time:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Status:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Your message:</strong> {{message}}</p>
  </div>

  <p>Kind regards,</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a111-1111-4111-8111-111111111113',
 'b0c0a111-1111-4111-8111-111111111111',
 'de',
 'Termin-Anfrage erhalten (Kunde)',
 'Ihre Terminanfrage ist eingegangen - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Ihre Terminanfrage ist eingegangen</h1>
  <p>Hallo <strong>{{customer_name}}</strong>,</p>
  <p>wir haben Ihre Anfrage erhalten. Unser Team meldet sich in Kürze bei Ihnen.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Datum:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Uhrzeit:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Status:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Ihre Nachricht:</strong> {{message}}</p>
  </div>

  <p>Mit freundlichen Grüßen</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

-- ===================== booking_created_admin =====================

('b1c0a222-2222-4222-8222-222222222221',
 'b0c0a222-2222-4222-8222-222222222222',
 'tr',
 'Yeni Randevu (Admin)',
 'Yeni randevu talebi - {{customer_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Yeni randevu talebi</h1>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Müşteri:</strong> {{customer_name}}</p>
    <p style="margin:0 0 8px;"><strong>E-posta:</strong> {{customer_email}}</p>
    <p style="margin:0 0 8px;"><strong>Telefon:</strong> {{customer_phone}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih/Saat:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}} ({{service_slug}})</p>
    <p style="margin:0 0 8px;"><strong>Durum:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Mesaj:</strong> {{message}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a222-2222-4222-8222-222222222224',
 'b0c0a222-2222-4222-8222-222222222222',
 'en',
 'New Booking (Admin)',
 'New booking request - {{customer_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">New booking request</h1>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Customer:</strong> {{customer_name}}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> {{customer_email}}</p>
    <p style="margin:0 0 8px;"><strong>Phone:</strong> {{customer_phone}}</p>
    <p style="margin:0 0 8px;"><strong>Date/Time:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}} ({{service_slug}})</p>
    <p style="margin:0 0 8px;"><strong>Status:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Message:</strong> {{message}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a222-2222-4222-8222-222222222223',
 'b0c0a222-2222-4222-8222-222222222222',
 'de',
 'Neue Terminanfrage (Admin)',
 'Neue Terminanfrage - {{customer_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Neue Terminanfrage</h1>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Kunde:</strong> {{customer_name}}</p>
    <p style="margin:0 0 8px;"><strong>E-Mail:</strong> {{customer_email}}</p>
    <p style="margin:0 0 8px;"><strong>Telefon:</strong> {{customer_phone}}</p>
    <p style="margin:0 0 8px;"><strong>Datum/Uhrzeit:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}} ({{service_slug}})</p>
    <p style="margin:0 0 8px;"><strong>Status:</strong> {{status}}</p>
    <p style="margin:0;"><strong>Nachricht:</strong> {{message}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

-- ===================== booking_status_changed_customer =====================

('b1c0a333-3333-4333-8333-333333333331',
 'b0c0a333-3333-4333-8333-333333333333',
 'tr',
 'Randevu Durumu Güncellendi (Müşteri)',
 'Randevu durumunuz güncellendi - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Randevu durumunuz güncellendi</h1>
  <p>Merhaba <strong>{{customer_name}}</strong>,</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih/Saat:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Önceki Durum:</strong> {{status_before}}</p>
    <p style="margin:0 0 8px;"><strong>Yeni Durum:</strong> {{status_after}}</p>
    <p style="margin:0;"><strong>Not:</strong> {{decision_note}}</p>
  </div>

  <p>Teşekkür ederiz.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a333-3333-4333-8333-333333333332',
 'b0c0a333-3333-4333-8333-333333333333',
 'en',
 'Booking Status Updated (Customer)',
 'Your booking status has been updated - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Your booking status has been updated</h1>
  <p>Hello <strong>{{customer_name}}</strong>,</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Date/Time:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Previous status:</strong> {{status_before}}</p>
    <p style="margin:0 0 8px;"><strong>New status:</strong> {{status_after}}</p>
    <p style="margin:0;"><strong>Note:</strong> {{decision_note}}</p>
  </div>

  <p>Thank you.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

('b1c0a333-3333-4333-8333-333333333333',
 'b0c0a333-3333-4333-8333-333333333333',
 'de',
 'Terminstatus aktualisiert (Kunde)',
 'Der Status Ihrer Terminanfrage wurde aktualisiert - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Der Status Ihrer Terminanfrage wurde aktualisiert</h1>
  <p>Hallo <strong>{{customer_name}}</strong>,</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-ID:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Datum/Uhrzeit:</strong> {{appointment_date}} {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Vorheriger Status:</strong> {{status_before}}</p>
    <p style="margin:0 0 8px;"><strong>Neuer Status:</strong> {{status_after}}</p>
    <p style="margin:0;"><strong>Hinweis:</strong> {{decision_note}}</p>
  </div>

  <p>Vielen Dank.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-07 00:00:00.000','2026-01-07 00:00:00.000'),

-- ===================== booking_accepted_customer =====================

('b1c0a444-4444-4444-8444-444444444441',
 'b0c0a444-4444-4444-8444-444444444444',
 'tr',
 'Randevu Onaylandı (Müşteri)',
 'Randevunuz onaylandı - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Randevunuz Onaylandı</h1>
  <p>Merhaba <strong>{{customer_name}}</strong>,</p>
  <p>Randevu talebiniz onaylandı. Detaylar:</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Saat:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Not:</strong> {{decision_note}}</p>
  </div>

  {{payment_section}}

  <p>Görüşmek üzere.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-03-07 00:00:00.000'),

('b1c0a444-4444-4444-8444-444444444442',
 'b0c0a444-4444-4444-8444-444444444444',
 'en',
 'Booking Accepted (Customer)',
 'Your booking has been confirmed - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Your Booking Has Been Confirmed</h1>
  <p>Hello <strong>{{customer_name}}</strong>,</p>
  <p>Your booking request has been accepted. Details:</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Date:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Time:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Note:</strong> {{decision_note}}</p>
  </div>

  {{payment_section}}

  <p>Kind regards,</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-03-07 00:00:00.000'),

('b1c0a444-4444-4444-8444-444444444443',
 'b0c0a444-4444-4444-8444-444444444444',
 'de',
 'Termin bestätigt (Kunde)',
 'Ihr Termin wurde bestätigt - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Ihr Termin wurde bestätigt</h1>
  <p>Hallo <strong>{{customer_name}}</strong>,</p>
  <p>Ihre Terminanfrage wurde bestätigt. Details:</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-Nr.:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Datum:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Uhrzeit:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Hinweis:</strong> {{decision_note}}</p>
  </div>

  {{payment_section}}

  <p>Mit freundlichen Grüßen</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-03-07 00:00:00.000'),

-- ===================== booking_rejected_customer =====================

('b1c0a555-5555-4555-8555-555555555551',
 'b0c0a555-5555-4555-8555-555555555555',
 'tr',
 'Randevu Reddedildi (Müşteri)',
 'Randevu talebiniz reddedildi - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Randevu Talebiniz Reddedildi</h1>
  <p>Merhaba <strong>{{customer_name}}</strong>,</p>
  <p>Ne yazık ki talebiniz için uygunluk sağlayamadık.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Saat:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Not:</strong> {{decision_note}}</p>
  </div>

  <p>İsterseniz farklı bir gün/saat için yeniden talep oluşturabilirsiniz.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-01-12 00:00:00.000'),

('b1c0a555-5555-4555-8555-555555555552',
 'b0c0a555-5555-4555-8555-555555555555',
 'en',
 'Booking Rejected (Customer)',
 'Your booking request was declined - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Your Booking Request Was Declined</h1>
  <p>Hello <strong>{{customer_name}}</strong>,</p>
  <p>Unfortunately, we could not confirm your requested time.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Date:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Time:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Note:</strong> {{decision_note}}</p>
  </div>

  <p>You may submit a new request for another date/time.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-01-12 00:00:00.000'),

('b1c0a555-5555-4555-8555-555555555553',
 'b0c0a555-5555-4555-8555-555555555555',
 'de',
 'Termin abgelehnt (Kunde)',
 'Ihre Terminanfrage wurde abgelehnt - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Ihre Terminanfrage wurde abgelehnt</h1>
  <p>Hallo <strong>{{customer_name}}</strong>,</p>
  <p>leider konnten wir den gewünschten Termin nicht bestätigen.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-Nr.:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Datum:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Uhrzeit:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}}</p>
    <p style="margin:0;"><strong>Hinweis:</strong> {{decision_note}}</p>
  </div>

  <p>Sie können gerne eine neue Anfrage für einen anderen Termin stellen.</p>
  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-01-12 00:00:00.000','2026-01-12 00:00:00.000'),

-- ===================== booking_reminder_customer =====================

('b1c0a666-6666-4666-8666-666666666661',
 'b0c0a666-6666-4666-8666-666666666666',
 'tr',
 'Randevu Hatirlatmasi (Musteri)',
 'Yaklasan randevunuz icin hatirlatma - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Randevu Hatirlatmasi</h1>
  <p>Merhaba <strong>{{customer_name}}</strong>,</p>
  <p>Yaklasan randevunuzun detaylarini tekrar paylasiyoruz.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Randevu No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Tarih:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Saat:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Hizmet:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Terapist/Kaynak:</strong> {{resource_title}}</p>
    <p style="margin:0;"><strong>Not:</strong> {{reminder_note}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-03-07 00:00:00.000','2026-03-07 00:00:00.000'),

('b1c0a666-6666-4666-8666-666666666662',
 'b0c0a666-6666-4666-8666-666666666666',
 'en',
 'Booking Reminder (Customer)',
 'Reminder for your upcoming booking - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Booking Reminder</h1>
  <p>Hello <strong>{{customer_name}}</strong>,</p>
  <p>This is a reminder for your upcoming appointment.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Booking No:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Date:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Time:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Service:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Therapist/Resource:</strong> {{resource_title}}</p>
    <p style="margin:0;"><strong>Note:</strong> {{reminder_note}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-03-07 00:00:00.000','2026-03-07 00:00:00.000'),

('b1c0a666-6666-4666-8666-666666666663',
 'b0c0a666-6666-4666-8666-666666666666',
 'de',
 'Terminerinnerung (Kunde)',
 'Erinnerung an Ihren bevorstehenden Termin - {{site_name}}',
 '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;font-size:14px;line-height:1.6;color:#111827;">
  <h1 style="font-size:18px;margin:0 0 12px;">Terminerinnerung</h1>
  <p>Hallo <strong>{{customer_name}}</strong>,</p>
  <p>hiermit erinnern wir Sie an Ihren bevorstehenden Termin.</p>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin:16px 0;">
    <p style="margin:0 0 8px;"><strong>Termin-Nr.:</strong> {{booking_id}}</p>
    <p style="margin:0 0 8px;"><strong>Datum:</strong> {{appointment_date}}</p>
    <p style="margin:0 0 8px;"><strong>Uhrzeit:</strong> {{appointment_time}}</p>
    <p style="margin:0 0 8px;"><strong>Leistung:</strong> {{service_title}}</p>
    <p style="margin:0 0 8px;"><strong>Therapeut/Ressource:</strong> {{resource_title}}</p>
    <p style="margin:0;"><strong>Hinweis:</strong> {{reminder_note}}</p>
  </div>

  <p><strong>{{site_name}}</strong></p>
</div>',
 '2026-03-07 00:00:00.000','2026-03-07 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `template_id`   = VALUES(`template_id`),
  `locale`        = VALUES(`locale`),
  `template_name` = VALUES(`template_name`),
  `subject`       = VALUES(`subject`),
  `content`       = VALUES(`content`),
  `updated_at`    = VALUES(`updated_at`);

COMMIT;
