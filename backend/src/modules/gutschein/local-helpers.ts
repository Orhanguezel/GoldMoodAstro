// Local payment config helper for gutschein module
// getPaymentConfig is konigsmassage-specific (reads from siteSettings + env)

import { db } from '@/db/client';
import { siteSettings } from '@vps/shared-backend/modules/siteSettings/schema';
import { and, eq } from 'drizzle-orm';

const GLOBAL_LOCALE = '*';

async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), eq((siteSettings as any).locale, GLOBAL_LOCALE)))
    .limit(1);
  return (rows[0]?.value as string) ?? null;
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v ?? '').toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(s);
}

export type PaymentConfig = {
  paypal: {
    enabled: boolean;
    mode: 'sandbox' | 'production';
    clientId: string | null;
    clientSecret: string | null;
    webhookId: string | null;
    baseUrl: string;
  };
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const clientId = (await getSetting('paypal_client_id')) || process.env.PAYPAL_CLIENT_ID || null;
  const clientSecret = (await getSetting('paypal_client_secret')) || process.env.PAYPAL_CLIENT_SECRET || null;
  const enabledRaw = await getSetting('paypal_enabled');
  const enabled = enabledRaw != null ? toBool(enabledRaw) : Boolean(clientId && clientSecret);

  const modeRaw = (await getSetting('paypal_mode')) || process.env.PAYPAL_MODE || 'sandbox';
  const mode: 'sandbox' | 'production' = modeRaw === 'production' ? 'production' : 'sandbox';
  const baseUrl = process.env.PAYPAL_BASE_URL?.trim() ||
    (mode === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

  return {
    paypal: {
      enabled: enabled && Boolean(clientId && clientSecret),
      mode,
      clientId,
      clientSecret,
      webhookId: (await getSetting('paypal_webhook_id')) || process.env.PAYPAL_WEBHOOK_ID || null,
      baseUrl,
    },
  };
}
