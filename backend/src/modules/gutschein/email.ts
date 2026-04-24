// src/modules/gutschein/email.ts
// Gutschein HTML email + printable document generator
// Uses DB email template (gutschein_purchased) with fallback to hardcoded HTML

import { sendMailRaw } from '@vps/shared-backend/modules/mail/service';
import { renderEmailTemplateByKey } from '@vps/shared-backend/modules/emailTemplates/service';
import { createUserNotification } from '@vps/shared-backend/modules/notifications/service';
import { telegramNotify } from '@vps/shared-backend/modules/telegram/helpers/telegram.notifier';
import { db } from '@/db/client';
import { siteSettings } from '@vps/shared-backend/modules/siteSettings/schema';
import { inArray } from 'drizzle-orm';

export type GutscheinEmailData = {
  code: string;
  value: string;
  currency: string;
  purchaser_name: string | null;
  purchaser_email: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  expires_at: string | Date | null;
  issued_at: string | Date | null;
};

type SiteBranding = {
  site_name: string;
  site_url: string;
  logo_url: string | null;
};

export async function getSiteBranding(locale?: string): Promise<SiteBranding> {
  // Fetch global (*) + locale-specific settings in one query
  const locales = ['*'];
  if (locale && locale !== '*') locales.push(locale);

  const rows = await db
    .select({ key: siteSettings.key, locale: siteSettings.locale, value: siteSettings.value })
    .from(siteSettings)
    .where(inArray(siteSettings.locale, locales));

  // Locale-specific values override global ones
  const global = new Map<string, string>();
  const localized = new Map<string, string>();
  for (const r of rows) {
    if (!r.key || !r.value) continue;
    const target = r.locale === '*' ? global : localized;
    target.set(r.key, String(r.value));
  }

  const get = (key: string) => localized.get(key) || global.get(key) || '';

  // site_logo is JSON {"url":"...","alt":"..."} — extract URL
  let logoUrl: string | null = null;
  const logoRaw = get('site_logo');
  if (logoRaw) {
    try {
      const parsed = JSON.parse(logoRaw);
      logoUrl = parsed?.url || null;
    } catch {
      // plain string fallback
      if (logoRaw.startsWith('http')) logoUrl = logoRaw;
    }
  }

  // site_url from public_base_url or env
  const siteUrl = get('public_base_url') || process.env.FRONTEND_URL || 'https://www.energetische-massage-bonn.de';

  // site_name from site_title, company_brand name, or fallback
  let siteName = get('site_title');
  if (!siteName) {
    const brandRaw = get('company_brand');
    if (brandRaw) {
      try { siteName = JSON.parse(brandRaw)?.name || ''; } catch {}
    }
  }

  return {
    site_name: siteName || 'Energetische Massage',
    site_url: siteUrl,
    logo_url: logoUrl,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(val: string | Date | null | undefined): string {
  if (!val) return '-';
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatCurrency(value: string, currency: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return `${value} ${currency}`;
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(num);
}

export function buildGutscheinHtml(data: GutscheinEmailData, branding: SiteBranding, options?: { forPrint?: boolean }): string {
  const forPrint = options?.forPrint ?? false;
  const formattedValue = formatCurrency(data.value, data.currency);
  const expiresFormatted = formatDate(data.expires_at);
  const issuedFormatted = formatDate(data.issued_at);

  const recipientSection = data.recipient_name
    ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;">Für / For</p>
       <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1f2937;">${escapeHtml(data.recipient_name)}</p>`
    : '';

  const messageSection = data.personal_message
    ? `<div style="margin:20px 0;padding:16px 20px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
         <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#92400e;font-weight:600;">Persönliche Nachricht / Personal Message</p>
         <p style="margin:0;font-size:14px;color:#78350f;font-style:italic;line-height:1.5;">${escapeHtml(data.personal_message)}</p>
       </div>`
    : '';

  const logoSection = branding.logo_url
    ? `<img src="${escapeHtml(branding.logo_url)}" alt="${escapeHtml(branding.site_name)}" style="max-height:60px;max-width:200px;" />`
    : `<span style="font-size:22px;font-weight:700;color:#92400e;letter-spacing:0.5px;">${escapeHtml(branding.site_name)}</span>`;

  const printStyles = forPrint
    ? `<style>
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>`
    : '';

  const printButton = forPrint
    ? `<div class="no-print" style="text-align:center;margin:24px 0;">
         <button onclick="window.print()" style="padding:12px 32px;background:#92400e;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-right:12px;">
           🖨️ Drucken / Print
         </button>
         <button onclick="window.close()" style="padding:12px 32px;background:#6b7280;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">
           ✕ Schließen / Close
         </button>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Gutschein ${escapeHtml(data.code)}</title>
  ${printStyles}
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  ${printButton}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="text-align:center;padding:24px 32px 16px;">
              ${logoSection}
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td>
              <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Gold banner -->
                <div style="background:linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%);padding:32px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.8);font-weight:500;">Geschenkgutschein / Gift Voucher</p>
                  <p style="margin:0;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:1px;">${escapeHtml(formattedValue)}</p>
                </div>

                <!-- Content -->
                <div style="padding:32px;">
                  ${recipientSection}

                  <!-- Code box -->
                  <div style="background:#fef9f3;border:2px dashed #d97706;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;font-weight:600;">Gutschein-Code / Voucher Code</p>
                    <p style="margin:0;font-size:28px;font-weight:800;font-family:'Courier New',monospace;color:#92400e;letter-spacing:4px;">${escapeHtml(data.code)}</p>
                  </div>

                  ${messageSection}

                  <!-- Details -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;font-size:13px;color:#6b7280;">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                        <span style="color:#9ca3af;">Ausgestellt am / Issued</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">
                        ${issuedFormatted}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                        <span style="color:#9ca3af;">Gültig bis / Valid until</span>
                      </td>
                      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:500;color:#374151;">
                        ${expiresFormatted}
                      </td>
                    </tr>
                    ${data.purchaser_name ? `
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#9ca3af;">Von / From</span>
                      </td>
                      <td style="padding:8px 0;text-align:right;font-weight:500;color:#374151;">
                        ${escapeHtml(data.purchaser_name)}
                      </td>
                    </tr>` : ''}
                  </table>

                  <!-- How to redeem -->
                  <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-top:20px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">So lösen Sie Ihren Gutschein ein:</p>
                    <ol style="margin:0;padding:0 0 0 18px;font-size:12px;color:#6b7280;line-height:1.8;">
                      <li>Besuchen Sie unsere Website oder rufen Sie uns an</li>
                      <li>Teilen Sie uns Ihren Gutschein-Code mit</li>
                      <li>Der Betrag wird mit Ihrer Buchung verrechnet</li>
                    </ol>
                    <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                      How to redeem: Visit our website or call us, share your voucher code, and the amount will be applied to your booking.
                    </p>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:24px 32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                ${escapeHtml(branding.site_name)}
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${escapeHtml(branding.site_url)}" style="color:#92400e;text-decoration:none;">${escapeHtml(branding.site_url.replace(/^https?:\/\//, ''))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendGutscheinEmail(
  data: GutscheinEmailData,
  toEmail: string,
  locale?: string,
): Promise<void> {
  const branding = await getSiteBranding(locale);
  const formattedValue = formatCurrency(data.value, data.currency);

  // Try DB email template first
  const templateParams = {
    site_name: branding.site_name,
    site_url: branding.site_url,
    code: data.code,
    value: data.value,
    currency: data.currency,
    formatted_value: formattedValue,
    purchaser_name: data.purchaser_name ?? '',
    recipient_name: data.recipient_name ?? '',
    personal_message: data.personal_message ?? '',
    issued_date: formatDate(data.issued_at),
    expires_date: formatDate(data.expires_at),
  };

  const rendered = await renderEmailTemplateByKey(
    'gutschein_purchased',
    templateParams,
    locale || 'de',
    'de',
  ).catch(() => null);

  if (rendered) {
    await sendMailRaw({
      to: toEmail,
      subject: rendered.subject,
      html: rendered.html,
    });
    return;
  }

  // Fallback to hardcoded HTML
  const html = buildGutscheinHtml(data, branding);
  await sendMailRaw({
    to: toEmail,
    subject: `Ihr Gutschein über ${formattedValue} – ${branding.site_name}`,
    html,
  });
}

// ── Admin Notification on Gutschein Purchase ──────────────────────────────

async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(inArray(siteSettings.key, [key]))
    .limit(1);
  const val = row?.value == null ? null : String(row.value).trim();
  return val || null;
}

async function getAdminEmail(): Promise<string | null> {
  return (
    (await getSettingValue('booking_admin_email')) ||
    (await getSettingValue('contact_receiver_email')) ||
    (await getSettingValue('footer_company_email')) ||
    null
  );
}

async function getAdminUserId(): Promise<string | null> {
  const v = (await getSettingValue('booking_admin_user_id'))?.trim() ?? '';
  return v.length === 36 ? v : null;
}

export async function notifyAdminGutscheinPurchased(data: GutscheinEmailData): Promise<void> {
  const formattedValue = formatCurrency(data.value, data.currency);
  const purchaser = data.purchaser_name || data.purchaser_email || 'Unbekannt';
  const recipient = data.recipient_name || '-';
  const summary = `Gutschein ${data.code} • ${formattedValue} • Von: ${purchaser} • Für: ${recipient}`;

  // 1) Admin DB notification
  const adminUserId = await getAdminUserId();
  if (adminUserId) {
    try {
      await createUserNotification({
        userId: adminUserId,
        type: 'custom',
        title: 'Neuer Gutschein gekauft',
        message: summary,
      });
    } catch {
      // best-effort
    }
  }

  // 2) Admin email
  const adminEmail = await getAdminEmail();
  if (adminEmail) {
    try {
      await sendMailRaw({
        to: adminEmail,
        subject: `Neuer Gutschein: ${data.code} – ${formattedValue}`,
        html: `<div style="font-family:sans-serif;font-size:14px;color:#1f2937;max-width:600px;">
  <h2 style="color:#92400e;margin:0 0 16px;">Neuer Gutschein gekauft</h2>
  <table style="border-collapse:collapse;width:100%;font-size:14px;">
    <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Code</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(data.code)}</td></tr>
    <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Betrag</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(formattedValue)}</td></tr>
    <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Käufer</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.purchaser_name ?? '-')} (${escapeHtml(data.purchaser_email ?? '-')})</td></tr>
    <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Empfänger</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.recipient_name ?? '-')} (${escapeHtml(data.recipient_email ?? '-')})</td></tr>
    <tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Gültig bis</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${formatDate(data.expires_at)}</td></tr>
    ${data.personal_message ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Nachricht</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-style:italic;">${escapeHtml(data.personal_message)}</td></tr>` : ''}
  </table>
</div>`,
      });
    } catch {
      // best-effort
    }
  }

  // 3) Telegram notification
  try {
    await telegramNotify({
      title: 'Neuer Gutschein gekauft',
      message: summary,
      type: 'gutschein_purchased',
    });
  } catch {
    // best-effort
  }
}
