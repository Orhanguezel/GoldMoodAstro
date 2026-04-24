-- ============================================================
-- FILE: 223_gutschein_email_templates.seed.sql
-- Gutschein (Gift Voucher) Email Templates (de/tr/en)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ============================================================
-- 1) PARENT: email_templates
-- ============================================================

INSERT INTO `email_templates`
(`id`, `template_key`, `variables`, `is_active`, `created_at`, `updated_at`)
VALUES

('g0c0a111-gut1-4111-8111-gutschein01',
 'gutschein_purchased',
 JSON_ARRAY('site_name','code','value','currency','formatted_value','purchaser_name','recipient_name','personal_message','issued_date','expires_date','site_url'),
 1, NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `id`         = VALUES(`id`),
  `variables`  = VALUES(`variables`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = NOW(3);

-- ============================================================
-- 2) I18N: email_templates_i18n (DE / TR / EN)
-- ============================================================

INSERT INTO `email_templates_i18n`
(`id`, `template_id`, `locale`, `template_name`, `subject`, `content`, `created_at`, `updated_at`)
VALUES

-- ===================== gutschein_purchased DE =====================

('g1c0a111-gut1-4111-8111-gutsche0de1',
 'g0c0a111-gut1-4111-8111-gutschein01',
 'de',
 'Gutschein erhalten',
 'Ihr Gutschein uber {{formatted_value}} - {{site_name}}',
 '<div style="font-family:''Segoe UI'',system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.8);">Geschenkgutschein</p>
    <p style="margin:0;font-size:42px;font-weight:800;color:#ffffff;">{{formatted_value}}</p>
  </div>

  <div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>Hallo <strong>{{recipient_name}}</strong>,</p>
    <p>Sie haben einen Geschenkgutschein erhalten!</p>

    <div style="background:#fef9f3;border:2px dashed #d97706;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;font-weight:600;">Gutschein-Code</p>
      <p style="margin:0;font-size:26px;font-weight:800;font-family:''Courier New'',monospace;color:#92400e;letter-spacing:3px;">{{code}}</p>
    </div>

    <p style="margin:16px 0 4px;color:#6b7280;font-size:13px;">{{personal_message}}</p>

    <table style="width:100%;margin:16px 0;font-size:13px;color:#6b7280;border-collapse:collapse;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Ausgestellt am</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{issued_date}}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Gultig bis</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{expires_date}}</td></tr>
      <tr><td style="padding:6px 0;">Von</td><td style="padding:6px 0;text-align:right;font-weight:500;color:#374151;">{{purchaser_name}}</td></tr>
    </table>

    <div style="background:#f9fafb;border-radius:8px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">So losen Sie Ihren Gutschein ein:</p>
      <ol style="margin:0;padding:0 0 0 18px;font-size:12px;color:#6b7280;line-height:1.8;">
        <li>Besuchen Sie unsere Website oder rufen Sie uns an</li>
        <li>Teilen Sie uns Ihren Gutschein-Code mit</li>
        <li>Der Betrag wird mit Ihrer Buchung verrechnet</li>
      </ol>
    </div>

    <p style="margin-top:20px;text-align:center;">
      <a href="{{site_url}}" style="color:#92400e;font-weight:500;">{{site_url}}</a>
    </p>
    <p style="text-align:center;color:#9ca3af;font-size:12px;">{{site_name}}</p>
  </div>
</div>',
 NOW(3), NOW(3)),

-- ===================== gutschein_purchased TR =====================

('g1c0a111-gut1-4111-8111-gutsche0tr1',
 'g0c0a111-gut1-4111-8111-gutschein01',
 'tr',
 'Hediye Ceki',
 'Hediye cekiniz: {{formatted_value}} - {{site_name}}',
 '<div style="font-family:''Segoe UI'',system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.8);">Hediye Ceki</p>
    <p style="margin:0;font-size:42px;font-weight:800;color:#ffffff;">{{formatted_value}}</p>
  </div>

  <div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>Merhaba <strong>{{recipient_name}}</strong>,</p>
    <p>Size bir hediye ceki gonderildi!</p>

    <div style="background:#fef9f3;border:2px dashed #d97706;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;font-weight:600;">Hediye Ceki Kodu</p>
      <p style="margin:0;font-size:26px;font-weight:800;font-family:''Courier New'',monospace;color:#92400e;letter-spacing:3px;">{{code}}</p>
    </div>

    <p style="margin:16px 0 4px;color:#6b7280;font-size:13px;">{{personal_message}}</p>

    <table style="width:100%;margin:16px 0;font-size:13px;color:#6b7280;border-collapse:collapse;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Duzenleme tarihi</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{issued_date}}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Gecerlilik tarihi</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{expires_date}}</td></tr>
      <tr><td style="padding:6px 0;">Gonderen</td><td style="padding:6px 0;text-align:right;font-weight:500;color:#374151;">{{purchaser_name}}</td></tr>
    </table>

    <div style="background:#f9fafb;border-radius:8px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">Hediye cekinizi nasil kullanirsiniz:</p>
      <ol style="margin:0;padding:0 0 0 18px;font-size:12px;color:#6b7280;line-height:1.8;">
        <li>Web sitemizi ziyaret edin veya bizi arayin</li>
        <li>Hediye ceki kodunuzu paylasyin</li>
        <li>Tutar rezervasyonunuzdan dusulecektir</li>
      </ol>
    </div>

    <p style="margin-top:20px;text-align:center;">
      <a href="{{site_url}}" style="color:#92400e;font-weight:500;">{{site_url}}</a>
    </p>
    <p style="text-align:center;color:#9ca3af;font-size:12px;">{{site_name}}</p>
  </div>
</div>',
 NOW(3), NOW(3)),

-- ===================== gutschein_purchased EN =====================

('g1c0a111-gut1-4111-8111-gutsche0en1',
 'g0c0a111-gut1-4111-8111-gutschein01',
 'en',
 'Gift Voucher',
 'Your gift voucher: {{formatted_value}} - {{site_name}}',
 '<div style="font-family:''Segoe UI'',system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#111827;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.8);">Gift Voucher</p>
    <p style="margin:0;font-size:42px;font-weight:800;color:#ffffff;">{{formatted_value}}</p>
  </div>

  <div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <p>Hello <strong>{{recipient_name}}</strong>,</p>
    <p>You have received a gift voucher!</p>

    <div style="background:#fef9f3;border:2px dashed #d97706;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;font-weight:600;">Voucher Code</p>
      <p style="margin:0;font-size:26px;font-weight:800;font-family:''Courier New'',monospace;color:#92400e;letter-spacing:3px;">{{code}}</p>
    </div>

    <p style="margin:16px 0 4px;color:#6b7280;font-size:13px;">{{personal_message}}</p>

    <table style="width:100%;margin:16px 0;font-size:13px;color:#6b7280;border-collapse:collapse;">
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Issued on</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{issued_date}}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;">Valid until</td><td style="padding:6px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">{{expires_date}}</td></tr>
      <tr><td style="padding:6px 0;">From</td><td style="padding:6px 0;text-align:right;font-weight:500;color:#374151;">{{purchaser_name}}</td></tr>
    </table>

    <div style="background:#f9fafb;border-radius:8px;padding:14px 18px;margin-top:16px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">How to redeem your voucher:</p>
      <ol style="margin:0;padding:0 0 0 18px;font-size:12px;color:#6b7280;line-height:1.8;">
        <li>Visit our website or call us</li>
        <li>Share your voucher code</li>
        <li>The amount will be applied to your booking</li>
      </ol>
    </div>

    <p style="margin-top:20px;text-align:center;">
      <a href="{{site_url}}" style="color:#92400e;font-weight:500;">{{site_url}}</a>
    </p>
    <p style="text-align:center;color:#9ca3af;font-size:12px;">{{site_name}}</p>
  </div>
</div>',
 NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `template_id`   = VALUES(`template_id`),
  `locale`        = VALUES(`locale`),
  `template_name` = VALUES(`template_name`),
  `subject`       = VALUES(`subject`),
  `content`       = VALUES(`content`),
  `updated_at`    = NOW(3);

COMMIT;
