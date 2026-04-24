-- ============================================================
-- FILE: 006_email_verification_template.sql
-- EMAIL VERIFICATION TEMPLATE (tr/en/de)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- Parent template
INSERT INTO `email_templates`
(`id`, `template_key`, `variables`, `is_active`, `created_at`, `updated_at`)
VALUES
('ev000001-0001-4001-8001-000000000001',
 'email_verification',
 JSON_ARRAY('user_name','verification_link','site_name'),
 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `variables`  = VALUES(`variables`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);

-- i18n: TR
INSERT INTO `email_templates_i18n`
(`id`, `template_id`, `locale`, `template_name`, `subject`, `content`, `created_at`, `updated_at`)
VALUES
('ev000001-0001-4001-8001-000000000011',
 'ev000001-0001-4001-8001-000000000001',
 'tr',
 'E-posta Doğrulama',
 'E-posta Adresinizi Doğrulayın - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">E-posta Doğrulama</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Hesabınızı doğrulamak için lütfen aşağıdaki butona tıklayın.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{verification_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">E-postamı Doğrula</a>
    </div>
    <p style="color: #666; font-size: 14px;">Bu linkin geçerlilik süresi 24 saattir.</p>
    <p style="color: #666; font-size: 14px;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    <p style="color: #666; font-size: 16px;">Saygılarımızla,<br>{{site_name}} Ekibi</p>
  </div>',
 NOW(3), NOW(3)),

-- i18n: EN
('ev000001-0001-4001-8001-000000000012',
 'ev000001-0001-4001-8001-000000000001',
 'en',
 'Email Verification',
 'Verify Your Email Address - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Email Verification</h1>
    <p style="color: #666; font-size: 16px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Please click the button below to verify your email address.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{verification_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify My Email</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link is valid for 24 hours.</p>
    <p style="color: #666; font-size: 14px;">If you did not request this, you can safely ignore this email.</p>
    <p style="color: #666; font-size: 16px;">Best regards,<br>{{site_name}} Team</p>
  </div>',
 NOW(3), NOW(3)),

-- i18n: DE
('ev000001-0001-4001-8001-000000000013',
 'ev000001-0001-4001-8001-000000000001',
 'de',
 'E-Mail-Verifizierung',
 'Bestätigen Sie Ihre E-Mail-Adresse - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">E-Mail-Verifizierung</h1>
    <p style="color: #666; font-size: 16px;">Hallo <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Bitte klicken Sie auf den Button unten, um Ihre E-Mail-Adresse zu bestätigen.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <a href="{{verification_link}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">E-Mail bestätigen</a>
    </div>
    <p style="color: #666; font-size: 14px;">Dieser Link ist 24 Stunden gültig.</p>
    <p style="color: #666; font-size: 14px;">Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
    <p style="color: #666; font-size: 16px;">Mit freundlichen Grüßen,<br>{{site_name}} Team</p>
  </div>',
 NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `template_id`   = VALUES(`template_id`),
  `locale`        = VALUES(`locale`),
  `template_name` = VALUES(`template_name`),
  `subject`       = VALUES(`subject`),
  `content`       = VALUES(`content`),
  `updated_at`    = VALUES(`updated_at`);

COMMIT;
