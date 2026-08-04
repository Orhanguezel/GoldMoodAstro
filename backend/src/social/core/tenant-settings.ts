/**
 * Tenant Settings Resolver
 * ------------------------------------------------------------
 * Her tenant icin GSC/GTM/GA4/Ads/Telegram/Meta vb. entegrasyon ayarlarinin
 * tek giris noktasi. Moduller `env.X` yerine bu fonksiyonlari cagirir.
 *
 * - Secret degerler `tenant_settings.value_encrypted` icinde AES-256-GCM ile saklanir.
 * - Secret olmayan degerler `value` (JSON) icinde plaintext.
 * - Geriye donuk uyumluluk: tenant'a ozel deger yoksa bilinen anahtarlar `env`'e duser
 *   (kademeli migration; tek paylasimli servis hesabiyla calisan tenant'lar bozulmaz).
 * - API'ye donen ciktilar daima maskelenir; secret plaintext disari verilmez.
 */
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/client";
import { tenantSettings } from "../db/schema";
import { decryptSecret, encryptSecret } from "./crypto";
import { env } from "./env";

export type TenantSettingNamespace =
  | "google"
  | "gsc"
  | "gtm"
  | "ga4"
  | "google_ads"
  | "telegram"
  | "tiktok"
  | "meta"
  | "linkedin"
  | "pinterest"
  | "dataforseo"
  | "postproxy";

export type PublishProvider = "native" | "postproxy";
export type LinkedInPublishMode = "api" | "manual";

export const MASKED = "***" as const;

/**
 * Tenant'a ozel deger bulunamadiginda basvurulacak env fallback haritasi.
 * Sadece bu listedeki (namespace, key) ciftleri env'e duser.
 */
const ENV_FALLBACK: Record<string, () => string> = {
  "google:service_account_json": () => env.GOOGLE_SERVICE_ACCOUNT_JSON,
  "google:oauth_client_id": () => env.GOOGLE_ADS_CLIENT_ID,
  "google:oauth_client_secret": () => env.GOOGLE_ADS_CLIENT_SECRET,
  "google:oauth_refresh_token": () => env.GOOGLE_ADS_REFRESH_TOKEN,
  "google_ads:developer_token": () => env.GOOGLE_ADS_DEVELOPER_TOKEN,
  "google_ads:client_id": () => env.GOOGLE_ADS_CLIENT_ID,
  "google_ads:client_secret": () => env.GOOGLE_ADS_CLIENT_SECRET,
  "google_ads:refresh_token": () => env.GOOGLE_ADS_REFRESH_TOKEN,
  "telegram:bot_token": () => env.TELEGRAM_BOT_TOKEN,
  "telegram:default_chat_id": () => env.TELEGRAM_CHAT_ID,
  "dataforseo:login": () => env.DATAFORSEO_LOGIN,
  "dataforseo:password": () => env.DATAFORSEO_PASSWORD,
  "postproxy:api_key": () => env.POSTPROXY_API_KEY,
};

function envFallback(namespace: string, key: string): string | null {
  const fn = ENV_FALLBACK[`${namespace}:${key}`];
  if (!fn) return null;
  const v = (fn() || "").trim();
  return v.length > 0 ? v : null;
}

async function findRow(tenantKey: string, namespace: string, key: string) {
  const [row] = await db
    .select()
    .from(tenantSettings)
    .where(
      and(
        eq(tenantSettings.tenantKey, tenantKey),
        eq(tenantSettings.namespace, namespace),
        eq(tenantSettings.settingKey, key),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Secret (sifreli) deger getir. Tenant'a ozel yoksa env fallback denenir.
 * Plaintext doner — sadece sunucu tarafi API cagrilarinda kullanilmali, disari verilmemeli.
 */
export async function getTenantSecret(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
  key: string,
): Promise<string | null> {
  const row = await findRow(tenantKey, namespace, key);
  if (row?.valueEncrypted) {
    try {
      return decryptSecret(row.valueEncrypted);
    } catch {
      // bozuk/yanlis anahtar -> fallback'e dus
    }
  }
  return envFallback(namespace, key);
}

/** Secret olmayan deger getir (JSON). Yoksa env fallback (string) denenir. */
export async function getTenantValue<T = unknown>(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
  key: string,
): Promise<T | null> {
  const row = await findRow(tenantKey, namespace, key);
  if (row && row.value !== null && row.value !== undefined) {
    return row.value as T;
  }
  const fb = envFallback(namespace, key);
  return (fb as unknown as T) ?? null;
}

export async function getPublishProvider(tenantKey: string): Promise<PublishProvider> {
  const value = await getTenantValue<string>(tenantKey, "postproxy", "publish_provider");
  return value === "postproxy" ? "postproxy" : "native";
}

export async function getLinkedInPublishMode(tenantKey: string): Promise<LinkedInPublishMode> {
  const value = await getTenantValue<string>(tenantKey, "linkedin", "publish_mode");
  return value === "manual" ? "manual" : "api";
}

/** Tek ayar yaz/guncelle (upsert). Secret ise sifrelenir. */
export async function setTenantSetting(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
  key: string,
  rawValue: unknown,
  opts: { isSecret?: boolean; updatedBy?: string } = {},
): Promise<void> {
  const isSecret = opts.isSecret === true;
  const valueEncrypted =
    isSecret && rawValue != null ? encryptSecret(String(rawValue)) : null;
  const value = isSecret ? null : (rawValue ?? null);

  const existing = await findRow(tenantKey, namespace, key);
  if (existing) {
    await db
      .update(tenantSettings)
      .set({
        value: value as never,
        valueEncrypted,
        isSecret: isSecret ? 1 : 0,
        updatedBy: opts.updatedBy ?? existing.updatedBy ?? null,
      })
      .where(eq(tenantSettings.id, existing.id));
    return;
  }
  await db.insert(tenantSettings).values({
    uuid: uuidv4(),
    tenantKey,
    namespace,
    settingKey: key,
    value: value as never,
    valueEncrypted,
    isSecret: isSecret ? 1 : 0,
    updatedBy: opts.updatedBy ?? null,
  });
}

/** Birden cok ayari bir namespace altinda toplu yaz. */
export async function setTenantSettings(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
  entries: Array<{ key: string; value: unknown; isSecret?: boolean }>,
  opts: { updatedBy?: string } = {},
): Promise<void> {
  for (const e of entries) {
    await setTenantSetting(tenantKey, namespace, e.key, e.value, {
      isSecret: e.isSecret,
      updatedBy: opts.updatedBy,
    });
  }
}

export async function deleteTenantSetting(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
  key: string,
): Promise<void> {
  await db
    .delete(tenantSettings)
    .where(
      and(
        eq(tenantSettings.tenantKey, tenantKey),
        eq(tenantSettings.namespace, namespace),
        eq(tenantSettings.settingKey, key),
      ),
    );
}

export interface MaskedSetting {
  key: string;
  isSecret: boolean;
  /** Secret ise daima MASKED veya null; secret degilse gercek deger. */
  value: unknown;
  /** Secret icin: deger var mi (DB'de ya da env fallback). */
  configured: boolean;
  updatedAt: Date | null;
}

/**
 * Bir namespace'in tum ayarlarini MASKELENMIS dondurur (API icin guvenli).
 * Secret degerler asla plaintext donmez; sadece `configured` bayragi.
 */
export async function getNamespaceMasked(
  tenantKey: string,
  namespace: TenantSettingNamespace | string,
): Promise<MaskedSetting[]> {
  const rows = await db
    .select()
    .from(tenantSettings)
    .where(
      and(
        eq(tenantSettings.tenantKey, tenantKey),
        eq(tenantSettings.namespace, namespace),
      ),
    );

  return rows.map((row) => {
    const isSecret = row.isSecret === 1;
    return {
      key: row.settingKey,
      isSecret,
      value: isSecret ? null : row.value,
      configured: isSecret
        ? Boolean(row.valueEncrypted)
        : row.value !== null && row.value !== undefined,
      updatedAt: row.updatedAt ?? null,
    };
  });
}
