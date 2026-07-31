import { createHash } from 'node:crypto';
import { getGlobalSettingValue } from '../siteSettings/helpers/service';

export type MetaCapiUserData = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type SendCapiEventInput = {
  eventName: 'Purchase' | 'Lead' | 'CompleteRegistration' | string;
  eventId: string;
  consentGranted: boolean;
  userData?: MetaCapiUserData;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string | null;
  eventTime?: number;
};

const warned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function normalize(value: string | null | undefined, kind: 'email' | 'phone' | 'text'): string {
  const base = String(value ?? '').trim().toLowerCase();
  if (kind === 'email') return base;
  if (kind === 'phone') return base.replace(/[^\d]/g, '');
  return base.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

export function sha256Pii(value: string | null | undefined, kind: 'email' | 'phone' | 'text' = 'text'): string | null {
  const normalized = normalize(value, kind);
  return normalized ? createHash('sha256').update(normalized).digest('hex') : null;
}

export function hasAnalyticsConsent(req: { cookies?: Record<string, string | undefined>; headers?: Record<string, unknown> }): boolean {
  const candidates = [
    ...Object.entries(req.cookies ?? {}).filter(([key, value]) => key.startsWith('goldmoodastro_cookie_consent_v') && typeof value === 'string').map(([, value]) => value as string),
  ];
  const rawCookie = String(req.headers?.cookie ?? '');
  for (const item of rawCookie.split(';')) {
    const [key, ...rest] = item.trim().split('=');
    if (key.startsWith('goldmoodastro_cookie_consent_v')) candidates.push(rest.join('='));
  }
  return candidates.some((raw) => {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as { analytics?: unknown };
      return parsed.analytics === true;
    } catch {
      return false;
    }
  });
}

export async function sendCapiEvent(input: SendCapiEventInput): Promise<{ sent: boolean; reason?: string }> {
  if (!input.consentGranted) return { sent: false, reason: 'consent_missing' };
  try {
    const [pixelIdRaw, tokenRaw, testCodeRaw] = await Promise.all([
      getGlobalSettingValue('facebook_pixel_id'),
      getGlobalSettingValue('facebook_capi_token'),
      getGlobalSettingValue('facebook_test_event_code'),
    ]);
    const pixelId = String(pixelIdRaw ?? '').trim();
    const token = String(tokenRaw ?? '').trim();
    if (!pixelId || !token) {
      warnOnce('meta_capi_config', '[meta-capi] Pixel ID veya CAPI token tanimli degil; event gonderilmedi.');
      return { sent: false, reason: 'config_missing' };
    }
    const user = input.userData ?? {};
    const em = sha256Pii(user.email, 'email');
    const ph = sha256Pii(user.phone, 'phone');
    const fn = sha256Pii(user.firstName);
    const ln = sha256Pii(user.lastName);
    const externalId = sha256Pii(user.externalId);
    const userData: Record<string, unknown> = {
      ...(em ? { em: [em] } : {}),
      ...(ph ? { ph: [ph] } : {}),
      ...(fn ? { fn: [fn] } : {}),
      ...(ln ? { ln: [ln] } : {}),
      ...(externalId ? { external_id: [externalId] } : {}),
      ...(user.clientIpAddress ? { client_ip_address: user.clientIpAddress } : {}),
      ...(user.clientUserAgent ? { client_user_agent: user.clientUserAgent } : {}),
      ...(user.fbp ? { fbp: user.fbp } : {}),
      ...(user.fbc ? { fbc: user.fbc } : {}),
    };
    const url = new URL(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || 'v21.0'}/${pixelId}/events`);
    url.searchParams.set('access_token', token);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: input.eventName,
          event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          action_source: 'website',
          ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
          user_data: userData,
          custom_data: input.customData ?? {},
        }],
        ...(String(testCodeRaw ?? '').trim() ? { test_event_code: String(testCodeRaw).trim() } : {}),
      }),
    });
    if (!response.ok) {
      warnOnce(`meta_capi_http_${response.status}`, `[meta-capi] Graph API HTTP ${response.status}; event gonderilemedi.`);
      return { sent: false, reason: `http_${response.status}` };
    }
    return { sent: true };
  } catch {
    warnOnce('meta_capi_error', '[meta-capi] Event gonderimi basarisiz.');
    return { sent: false, reason: 'request_failed' };
  }
}
