import { google } from "googleapis";
import { getTenantValue } from "../../core/tenant-settings";
import { createMarketingJwt } from "./google-sa";
import type { MarketingChangeSet, PlatformChangeHandler } from "./types";

function rowsOf(result: unknown, key: string) {
  return ((result as { data?: Record<string, unknown[]> })?.data?.[key] ?? []) as unknown[];
}

async function optionalReport<T>(task: Promise<T>) {
  try {
    return { ok: true, data: await task };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

type MerchantSettings = {
  merchantId: string;
  feedLabel: string;
  contentLanguage: string;
  targetCountry: string;
  enabled: boolean;
};

type MerchantPayload = {
  action?: "attribute_fix";
  merchantId?: string;
  productId?: string;
  productIds?: string[];
  updates?: Record<string, unknown>;
  attribute?: string;
  detectedIssue?: unknown;
  notes?: string;
};

async function merchantSettings(tenantKey: string): Promise<MerchantSettings> {
  const merchantId = String((await getTenantValue<string>(tenantKey, "merchant", "merchant_id")) ?? "").trim();
  const feedLabel = String((await getTenantValue<string>(tenantKey, "merchant", "feed_label")) ?? "").trim();
  const contentLanguage = String((await getTenantValue<string>(tenantKey, "merchant", "content_language")) ?? "tr").trim();
  const targetCountry = String((await getTenantValue<string>(tenantKey, "merchant", "target_country")) ?? "TR").trim();
  const enabled = await getTenantValue<boolean | string | null>(tenantKey, "merchant", "enabled");
  const enabledValue =
    enabled === null || enabled === undefined
      ? Boolean(merchantId)
      : typeof enabled === "boolean"
        ? enabled
        : !["false", "0", "off", "no"].includes(enabled.trim().toLowerCase());
  return { merchantId, feedLabel, contentLanguage, targetCountry, enabled: enabledValue };
}

async function buildMerchantClient(tenantKey: string) {
  const auth = await createMarketingJwt(tenantKey);
  if (!auth) {
    throw new Error("Google service_account_json tanimli degil. Merchant Content API icin servis hesabi ve auth/content scope gerekir.");
  }
  return google.content({ version: "v2.1", auth: auth as never });
}

function productIdOf(product: any) {
  return String(product?.id ?? product?.productId ?? product?.offerId ?? "").trim();
}

function productTitle(product: any) {
  return String(product?.title ?? "").trim();
}

function productDescription(product: any) {
  return String(product?.description ?? "").trim();
}

function productTypeText(product: any) {
  return Array.isArray(product?.productTypes)
    ? product.productTypes.join(" ")
    : Array.isArray(product?.productType)
      ? product.productType.join(" ")
      : String(product?.productType ?? product?.productTypes ?? "");
}

function priceValue(product: any) {
  const raw = product?.price?.value ?? product?.salePrice?.value;
  const value = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function hasBrokenTurkishChars(text: string) {
  return /LAST[Ýý]|T[ÜU]RK[ÝI]|[�]/i.test(text);
}

function compactUpdates(updates: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

export function analyzeMerchantFeed(products: unknown[], statuses: unknown[]) {
  const suggestions: Array<{
    id: string;
    title: string;
    reason: string;
    count: number;
    productIds: string[];
    updates?: Record<string, unknown>;
    severity: "info" | "warning" | "critical";
  }> = [];
  const usedProducts = products
    .map((item) => item as any)
    .filter((product) => /ikinci\s*el|2\.\s*el|used/i.test(productTypeText(product)) && product.condition !== "used")
    .map(productIdOf)
    .filter(Boolean);
  if (usedProducts.length > 0) {
    suggestions.push({
      id: "condition_used",
      title: "İkinci el ürünlerde condition=used",
      reason: "product_type ikinci el sinyali veriyor fakat condition used degil.",
      count: usedProducts.length,
      productIds: usedProducts,
      updates: { condition: "used" },
      severity: "critical",
    });
  }

  const missingDescriptions = products
    .map((item) => item as any)
    .filter((product) => !productDescription(product) && productTitle(product))
    .map(productIdOf)
    .filter(Boolean);
  if (missingDescriptions.length > 0) {
    suggestions.push({
      id: "description_title_fallback",
      title: "Boş açıklamaya title fallback",
      reason: "description bos olan urunler feed kalite/disapproval riski tasiyor.",
      count: missingDescriptions.length,
      productIds: missingDescriptions,
      updates: { descriptionFromTitle: true },
      severity: "warning",
    });
  }

  const priceAnomalies = products
    .map((item) => item as any)
    .filter((product) => {
      const price = priceValue(product);
      return price !== null && price > 0 && price <= 1;
    })
    .map(productIdOf)
    .filter(Boolean);
  if (priceAnomalies.length > 0) {
    suggestions.push({
      id: "price_anomaly",
      title: "Fiyat anomalisi",
      reason: "1 TL veya altindaki fiyatlar Merchant kalite ve politika riski tasir.",
      count: priceAnomalies.length,
      productIds: priceAnomalies,
      severity: "critical",
    });
  }

  const brokenChars = products
    .map((item) => item as any)
    .filter((product) => hasBrokenTurkishChars(`${productTitle(product)} ${productDescription(product)}`))
    .map(productIdOf)
    .filter(Boolean);
  if (brokenChars.length > 0) {
    suggestions.push({
      id: "broken_utf8",
      title: "Bozuk karakter temizliği",
      reason: "LASTÝK gibi UTF-8 bozulmaları tespit edildi.",
      count: brokenChars.length,
      productIds: brokenChars,
      severity: "warning",
    });
  }

  const statusIssues = statuses
    .flatMap((row) => ((row as any)?.itemLevelIssues ?? []).map((issue: any) => ({ productId: (row as any)?.productId, issue })))
    .filter((row) => row.productId);
  if (statusIssues.length > 0) {
    suggestions.push({
      id: "disapproval_gap",
      title: "Disapproval gap",
      reason: "Onaylanmayan veya issue alan urunlerde itemLevelIssues mevcut.",
      count: statusIssues.length,
      productIds: [...new Set(statusIssues.map((row) => row.productId))],
      severity: "critical",
    });
  }
  return suggestions;
}

function duplicateDatafeeds(datafeeds: unknown[]) {
  const groups = new Map<string, any[]>();
  for (const feed of datafeeds.map((item) => item as any)) {
    const key = `${feed?.name ?? ""}|${JSON.stringify(feed?.targets ?? [])}`;
    groups.set(key, [...(groups.get(key) ?? []), feed]);
  }
  return [...groups.values()].filter((group) => group.length > 1).flat();
}

export async function fetchMerchantSummary(tenantKey: string) {
  const settings = await merchantSettings(tenantKey);
  const { merchantId, feedLabel, contentLanguage, targetCountry, enabled } = settings;

  if (!merchantId) {
    return {
      configured: false,
      message: "Merchant Center account ID tanimli degil",
      settings: { merchantId: "", feedLabel, contentLanguage, targetCountry, enabled },
    };
  }

  let content;
  try {
    content = await buildMerchantClient(tenantKey);
  } catch (err) {
    return {
      configured: true,
      merchantId,
      settings: { merchantId, feedLabel, contentLanguage, targetCountry, enabled },
      error: (err as Error).message,
    };
  }

  const [products, productStatuses, accountStatuses, datafeeds] = await Promise.all([
    optionalReport(content.products.list({ merchantId, maxResults: 100 })),
    optionalReport(content.productstatuses.list({ merchantId, maxResults: 100 })),
    optionalReport(content.accountstatuses.list({ merchantId, maxResults: 25 })),
    optionalReport(content.datafeeds.list({ merchantId })),
  ]);

  const productRows = products.ok ? rowsOf(products.data, "resources") : [];
  const statusRows = productStatuses.ok ? rowsOf(productStatuses.data, "resources") : [];
  const datafeedRows = datafeeds.ok ? rowsOf(datafeeds.data, "resources") : [];
  const issueRows = statusRows
    .flatMap((row) => {
      const item = row as { productId?: string; destinationStatuses?: unknown[]; itemLevelIssues?: unknown[] };
      return (item.itemLevelIssues ?? []).map((issue) => ({ productId: item.productId, issue }));
    })
    .slice(0, 20);
  const accountRows = accountStatuses.ok ? rowsOf(accountStatuses.data, "resources") : [];
  const accountIssues = accountRows.flatMap((row) => {
    const account = row as { accountId?: string; accountLevelIssues?: unknown[] };
    return (account.accountLevelIssues ?? []).map((issue) => ({ accountId: account.accountId, issue }));
  });

  return {
    configured: true,
    merchantId,
    settings: { merchantId, feedLabel, contentLanguage, targetCountry, enabled },
    products: productRows,
    productsError: products.ok ? null : products.error,
    productStatuses: statusRows,
    productStatusesError: productStatuses.ok ? null : productStatuses.error,
    accountStatuses: accountRows,
    accountStatusesError: accountStatuses.ok ? null : accountStatuses.error,
    accountHealth: {
      issueCount: accountIssues.length,
      issues: accountIssues,
      freeListings:
        accountRows.find((row: any) =>
          JSON.stringify(row?.products ?? row?.destinationStatuses ?? row ?? {}).toLowerCase().includes("free")
        ) ?? null,
    },
    datafeeds: datafeedRows,
    datafeedsError: datafeeds.ok ? null : datafeeds.error,
    duplicateDatafeeds: duplicateDatafeeds(datafeedRows),
    feedSuggestions: analyzeMerchantFeed(productRows, statusRows),
    issues: issueRows,
  };
}

function payloadOf(changeSet: MarketingChangeSet): MerchantPayload {
  if (!changeSet.payload || typeof changeSet.payload !== "object") throw new Error("payload object zorunlu");
  return changeSet.payload as MerchantPayload;
}

function ensureAttributePayload(payload: MerchantPayload) {
  if (payload.action !== "attribute_fix") throw new Error("payload.action attribute_fix olmali");
  const ids = payload.productIds?.length ? payload.productIds : payload.productId ? [payload.productId] : [];
  if (ids.length === 0) throw new Error("productId/productIds zorunlu");
  if (!payload.updates || typeof payload.updates !== "object") throw new Error("updates object zorunlu");
  return { productIds: ids.map((id) => String(id).trim()).filter(Boolean), updates: compactUpdates(payload.updates) };
}

async function getProduct(content: any, merchantId: string, productId: string) {
  const res = await content.products.get({ merchantId, productId });
  return res.data;
}

function applyUpdatesToProduct(product: Record<string, any>, updates: Record<string, unknown>) {
  const next = { ...product };
  for (const [key, value] of Object.entries(updates)) {
    if (key === "descriptionFromTitle") {
      if (!next.description && next.title) next.description = next.title;
    } else {
      next[key] = value;
    }
  }
  return next;
}

export const merchantChangeHandler: PlatformChangeHandler = {
  async validate(tenantKey, changeSet) {
    try {
      const payload = payloadOf(changeSet);
      const settings = await merchantSettings(tenantKey);
      const merchantId = payload.merchantId?.trim() || settings.merchantId;
      if (!merchantId) throw new Error("merchant_id tanimli degil");
      const { productIds, updates } = ensureAttributePayload(payload);
      const content = await buildMerchantClient(tenantKey);
      const sample = await getProduct(content, merchantId, productIds[0]);
      return {
        ok: true,
        result: {
          dryRun: true,
          action: payload.action,
          merchantId,
          totalProducts: productIds.length,
          sampleProductId: productIds[0],
          sampleBefore: sample,
          sampleAfter: applyUpdatesToProduct(sample, updates),
          message: "Content API validateOnly desteklemedigi icin ilk urun okunup uygulanacak fark hazirlandi; canli yazma apply asamasinda yapilir.",
        },
      };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
  async apply(tenantKey, changeSet) {
    try {
      const payload = payloadOf(changeSet);
      const settings = await merchantSettings(tenantKey);
      const merchantId = payload.merchantId?.trim() || settings.merchantId;
      if (!merchantId) throw new Error("merchant_id tanimli degil");
      const { productIds, updates } = ensureAttributePayload(payload);
      const content = await buildMerchantClient(tenantKey);
      const results: Array<{ productId: string; ok: boolean; product: unknown }> = [];
      for (const productId of productIds) {
        const current = await getProduct(content, merchantId, productId);
        const requestBody = applyUpdatesToProduct(current, updates);
        const updated = await content.products.update({ merchantId, productId, requestBody });
        results.push({ productId, ok: true, product: updated.data });
      }
      return { ok: true, result: { action: payload.action, merchantId, updatedCount: results.length, results } };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
};
