-- ============================================================
-- FILE: 67_email_templates_missing_seed.sql
-- EMAIL_TEMPLATES — Missing seeds: order_received, deposit_success, ticket_replied
-- IDEMPOTENT (ON DUPLICATE KEY UPDATE)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ============================================================
-- 1) PARENT (email_templates)
-- ============================================================

INSERT INTO `email_templates`
(`id`, `template_key`, `variables`, `is_active`, `created_at`, `updated_at`)
VALUES

('d1a1a111-1111-4111-8111-111111111111',
 'order_received',
 JSON_ARRAY('customer_name','order_number','final_amount','status','site_name'),
 1, '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

('d2a2a222-2222-4222-8222-222222222222',
 'deposit_success',
 JSON_ARRAY('user_name','amount','new_balance','site_name'),
 1, '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

('d3a3a333-3333-4333-8333-333333333333',
 'ticket_replied',
 JSON_ARRAY('user_name','ticket_id','ticket_subject','reply_message','site_name'),
 1, '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `id`         = VALUES(`id`),
  `variables`  = VALUES(`variables`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);

-- ============================================================
-- 2) I18N (email_templates_i18n) TR + EN + DE
-- ============================================================

INSERT INTO `email_templates_i18n`
(`id`, `template_id`, `locale`, `template_name`, `subject`, `content`, `created_at`, `updated_at`)
VALUES

-- ===================== order_received =====================

-- TR
('e1a1a111-1111-4111-8111-111111111101',
 'd1a1a111-1111-4111-8111-111111111111',
 'tr',
 'Siparis Alindi',
 'Siparisiniz Alindi - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Siparisiniz Alindi</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Siparisiniz basariyla alindi. Detaylar asagidadir:</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Siparis No:</strong></td><td style="padding: 8px 0; color: #333;">{{order_number}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Tutar:</strong></td><td style="padding: 8px 0; color: #333;">{{final_amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Durum:</strong></td><td style="padding: 8px 0; color: #333;">{{status}}</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Saygilarimizla,<br>{{site_name}} Ekibi</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- EN
('e1a1a111-1111-4111-8111-111111111102',
 'd1a1a111-1111-4111-8111-111111111111',
 'en',
 'Order Received',
 'Your Order Has Been Received - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Order Received</h1>
    <p style="color: #666; font-size: 16px;">Hello <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Your order has been successfully received. Details below:</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Order No:</strong></td><td style="padding: 8px 0; color: #333;">{{order_number}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td><td style="padding: 8px 0; color: #333;">{{final_amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td><td style="padding: 8px 0; color: #333;">{{status}}</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Best regards,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- DE
('e1a1a111-1111-4111-8111-111111111103',
 'd1a1a111-1111-4111-8111-111111111111',
 'de',
 'Bestellung eingegangen',
 'Ihre Bestellung wurde empfangen - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Bestellung eingegangen</h1>
    <p style="color: #666; font-size: 16px;">Hallo <strong>{{customer_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Ihre Bestellung wurde erfolgreich entgegengenommen. Details finden Sie unten:</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Bestellnr.:</strong></td><td style="padding: 8px 0; color: #333;">{{order_number}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Betrag:</strong></td><td style="padding: 8px 0; color: #333;">{{final_amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td><td style="padding: 8px 0; color: #333;">{{status}}</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Mit freundlichen Gr&uuml;&szlig;en,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- ===================== deposit_success =====================

-- TR
('e2a2a222-2222-4222-8222-222222222201',
 'd2a2a222-2222-4222-8222-222222222222',
 'tr',
 'Bakiye Yukleme Basarili',
 'Bakiye Yukleme Basarili - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Bakiye Yukleme Basarili</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Hesabiniza basariyla bakiye yuklendi.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Yuklenen Tutar:</strong></td><td style="padding: 8px 0; color: #27ae60; font-weight: bold;">{{amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Yeni Bakiye:</strong></td><td style="padding: 8px 0; color: #333; font-weight: bold;">{{new_balance}} EUR</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Saygilarimizla,<br>{{site_name}} Ekibi</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- EN
('e2a2a222-2222-4222-8222-222222222202',
 'd2a2a222-2222-4222-8222-222222222222',
 'en',
 'Deposit Successful',
 'Deposit Successful - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Deposit Successful</h1>
    <p style="color: #666; font-size: 16px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Your account has been successfully credited.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Amount Deposited:</strong></td><td style="padding: 8px 0; color: #27ae60; font-weight: bold;">{{amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>New Balance:</strong></td><td style="padding: 8px 0; color: #333; font-weight: bold;">{{new_balance}} EUR</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Best regards,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- DE
('e2a2a222-2222-4222-8222-222222222203',
 'd2a2a222-2222-4222-8222-222222222222',
 'de',
 'Einzahlung erfolgreich',
 'Einzahlung erfolgreich - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Einzahlung erfolgreich</h1>
    <p style="color: #666; font-size: 16px;">Hallo <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Ihrem Konto wurde erfolgreich Guthaben gutgeschrieben.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Eingezahlter Betrag:</strong></td><td style="padding: 8px 0; color: #27ae60; font-weight: bold;">{{amount}} EUR</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Neues Guthaben:</strong></td><td style="padding: 8px 0; color: #333; font-weight: bold;">{{new_balance}} EUR</td></tr>
      </table>
    </div>
    <p style="color: #666; font-size: 16px;">Mit freundlichen Gr&uuml;&szlig;en,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- ===================== ticket_replied =====================

-- TR
('e3a3a333-3333-4333-8333-333333333301',
 'd3a3a333-3333-4333-8333-333333333333',
 'tr',
 'Destek Bileti Yanitlandi',
 'Destek Talebiniz Yanitlandi - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Destek Talebiniz Yanitlandi</h1>
    <p style="color: #666; font-size: 16px;">Merhaba <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Destek talebinize yeni bir yanit verildi.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Bilet No:</strong></td><td style="padding: 8px 0; color: #333;">#{{ticket_id}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Konu:</strong></td><td style="padding: 8px 0; color: #333;">{{ticket_subject}}</td></tr>
      </table>
    </div>
    <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="color: #333; font-size: 14px; margin: 0;">{{reply_message}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Saygilarimizla,<br>{{site_name}} Ekibi</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- EN
('e3a3a333-3333-4333-8333-333333333302',
 'd3a3a333-3333-4333-8333-333333333333',
 'en',
 'Support Ticket Replied',
 'Your Support Ticket Has Been Replied - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Support Ticket Replied</h1>
    <p style="color: #666; font-size: 16px;">Hello <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">A new reply has been added to your support ticket.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Ticket No:</strong></td><td style="padding: 8px 0; color: #333;">#{{ticket_id}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Subject:</strong></td><td style="padding: 8px 0; color: #333;">{{ticket_subject}}</td></tr>
      </table>
    </div>
    <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="color: #333; font-size: 14px; margin: 0;">{{reply_message}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Best regards,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000'),

-- DE
('e3a3a333-3333-4333-8333-333333333303',
 'd3a3a333-3333-4333-8333-333333333333',
 'de',
 'Support-Ticket beantwortet',
 'Ihr Support-Ticket wurde beantwortet - {{site_name}}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; text-align: center;">Support-Ticket beantwortet</h1>
    <p style="color: #666; font-size: 16px;">Hallo <strong>{{user_name}}</strong>,</p>
    <p style="color: #666; font-size: 16px;">Zu Ihrem Support-Ticket wurde eine neue Antwort hinzugef&uuml;gt.</p>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #666;"><strong>Ticket-Nr.:</strong></td><td style="padding: 8px 0; color: #333;">#{{ticket_id}}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;"><strong>Betreff:</strong></td><td style="padding: 8px 0; color: #333;">{{ticket_subject}}</td></tr>
      </table>
    </div>
    <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <p style="color: #333; font-size: 14px; margin: 0;">{{reply_message}}</p>
    </div>
    <p style="color: #666; font-size: 16px;">Mit freundlichen Gr&uuml;&szlig;en,<br>{{site_name}} Team</p>
  </div>',
 '2026-03-07 00:00:00.000', '2026-03-07 00:00:00.000')

ON DUPLICATE KEY UPDATE
  `template_id`    = VALUES(`template_id`),
  `locale`         = VALUES(`locale`),
  `template_name`  = VALUES(`template_name`),
  `subject`        = VALUES(`subject`),
  `content`        = VALUES(`content`),
  `updated_at`     = VALUES(`updated_at`);

COMMIT;
