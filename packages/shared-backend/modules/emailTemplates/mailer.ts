// =============================================================
// FILE: src/modules/email-templates/mailer.ts
// =============================================================
import { renderEmailTemplateByKey } from "./service";
import { sendMail } from "../mail/service";

export interface SendTemplatedEmailOptions {
  to: string;
  key: string; // template_key
  locale?: string | null;
  /** fallback locale override (DB default) */
  defaultLocale?: string | null;
  params?: Record<string, unknown>;
  /**
   * true ise missing_variables olsa bile mail gönderilir.
   * false ise (default) eksik variable varsa error fırlatılır.
   */
  allowMissing?: boolean;
}

/**
 * 1) email_templates + email_templates_i18n tablosundan uygun kaydı bulur
 * 2) subject + body render eder
 * 3) sendMail ile gönderir
 */
export async function sendTemplatedEmail(opts: SendTemplatedEmailOptions) {
  const { key, to, locale, defaultLocale, params = {}, allowMissing = false } = opts;

  const rendered = await renderEmailTemplateByKey(key, params, locale, defaultLocale);

  if (!rendered) {
    throw new Error(`email_template_not_found:${key}`);
  }

  if (!allowMissing && rendered.missing_variables.length > 0) {
    throw new Error(
      `email_template_missing_params:${key}:${rendered.missing_variables.join(
        ",",
      )}`,
    );
  }

  await sendMail({
    to,
    subject: rendered.subject,
    html: rendered.html,
  });

  return rendered;
}
