import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { marketingChangeSets } from "../../db/schema";
import type {
  MarketingChangeSet,
  MarketingChangeSource,
  MarketingChangeStatus,
  MarketingPlatform,
  PlatformChangeHandler,
} from "./types";
import { gtmChangeHandler } from "./gtm";
import { ga4ChangeHandler } from "./ga4";
import { googleAdsChangeHandler } from "./google-ads-change-handler";
import { merchantChangeHandler } from "./merchant";
import { gscChangeHandler } from "./gsc";

const platforms: MarketingPlatform[] = ["google_ads", "gtm", "ga4", "gsc", "merchant", "meta"];
const statuses: MarketingChangeStatus[] = [
  "draft",
  "validated",
  "validation_failed",
  "applied",
  "failed",
  "cancelled",
];
const sources: MarketingChangeSource[] = ["manual", "automation", "ai", "recommendation"];

function assertPlatform(platform: string): MarketingPlatform {
  if (!platforms.includes(platform as MarketingPlatform)) {
    throw new Error("Desteklenmeyen marketing platformu");
  }
  return platform as MarketingPlatform;
}

function normalizeSource(source?: string): MarketingChangeSource {
  return sources.includes(source as MarketingChangeSource) ? (source as MarketingChangeSource) : "manual";
}

function normalizeChangeSet(row: typeof marketingChangeSets.$inferSelect): MarketingChangeSet {
  return {
    id: row.id,
    uuid: row.uuid,
    tenantKey: row.tenantKey,
    platform: row.platform,
    targetRef: row.targetRef,
    title: row.title,
    description: row.description,
    status: row.status,
    source: row.source,
    payload: row.payload,
    validationResult: row.validationResult,
    appliedResult: row.appliedResult,
  };
}

const dryRunOnlyHandler: PlatformChangeHandler = {
  async validate(_tenantKey, changeSet) {
    if (!changeSet.payload || typeof changeSet.payload !== "object") {
      return { ok: false, result: { error: "payload object zorunlu" } };
    }
    return {
      ok: true,
      result: {
        dryRun: true,
        platform: changeSet.platform,
        message: "Change-set yapisi gecerli. Platform yazma handler'i sonraki fazda uygulanacak.",
      },
    };
  },
  async apply(_tenantKey, changeSet) {
    return {
      ok: false,
      result: {
        platform: changeSet.platform,
        error: "Bu platform icin apply handler'i henuz aktif degil. Canli yazma yapilmadi.",
      },
    };
  },
};

const handlers: Record<MarketingPlatform, PlatformChangeHandler> = {
  google_ads: googleAdsChangeHandler,
  gtm: gtmChangeHandler,
  ga4: ga4ChangeHandler,
  gsc: gscChangeHandler,
  merchant: merchantChangeHandler,
  meta: dryRunOnlyHandler,
};

export function parseMarketingPlatform(platform: string) {
  return assertPlatform(platform);
}

export async function createChangeSet(
  tenantKey: string,
  platformRaw: string,
  input: {
    targetRef?: string | null;
    title?: string;
    description?: string | null;
    payload?: unknown;
    source?: string;
    createdBy?: string;
  },
) {
  const platform = assertPlatform(platformRaw);
  if (!input.payload || typeof input.payload !== "object") throw new Error("payload object zorunlu");
  const uuid = randomUUID();
  await db.insert(marketingChangeSets).values({
    uuid,
    tenantKey,
    platform,
    targetRef: input.targetRef?.trim() || null,
    title: input.title?.trim() || `${platform} degisiklik taslagi`,
    description: input.description?.trim() || null,
    source: normalizeSource(input.source),
    payload: input.payload,
    createdBy: input.createdBy?.trim() || "system",
  });
  const [created] = await db.select().from(marketingChangeSets).where(eq(marketingChangeSets.uuid, uuid)).limit(1);
  return normalizeChangeSet(created);
}

export async function listChangeSets(tenantKey: string, platformRaw?: string, statusRaw?: string) {
  const filters = [eq(marketingChangeSets.tenantKey, tenantKey)];
  if (platformRaw) filters.push(eq(marketingChangeSets.platform, assertPlatform(platformRaw)));
  if (statusRaw && statuses.includes(statusRaw as MarketingChangeStatus)) {
    filters.push(eq(marketingChangeSets.status, statusRaw as MarketingChangeStatus));
  }
  const items = await db
    .select()
    .from(marketingChangeSets)
    .where(and(...filters))
    .orderBy(desc(marketingChangeSets.createdAt))
    .limit(100);
  return items.map(normalizeChangeSet);
}

export async function validateChangeSet(uuid: string) {
  const [row] = await db.select().from(marketingChangeSets).where(eq(marketingChangeSets.uuid, uuid)).limit(1);
  if (!row) throw new Error("Degisiklik taslagi bulunamadi");
  const changeSet = normalizeChangeSet(row);
  const result = await handlers[changeSet.platform].validate(changeSet.tenantKey, changeSet);
  await db
    .update(marketingChangeSets)
    .set({
      status: result.ok ? "validated" : "validation_failed",
      validationResult: result,
    })
    .where(eq(marketingChangeSets.id, row.id));
  return result;
}

export async function applyChangeSet(uuid: string, confirmApply: boolean) {
  if (confirmApply !== true) throw new Error("Canli degisiklik icin confirmApply=true zorunlu");
  const [row] = await db.select().from(marketingChangeSets).where(eq(marketingChangeSets.uuid, uuid)).limit(1);
  if (!row) throw new Error("Degisiklik taslagi bulunamadi");
  if (row.status !== "validated") throw new Error("Once validate endpoint'i ile taslagi dogrulayin");
  const changeSet = normalizeChangeSet(row);
  const result = await handlers[changeSet.platform].apply(changeSet.tenantKey, changeSet);
  await db
    .update(marketingChangeSets)
    .set({
      status: result.ok ? "applied" : "failed",
      appliedResult: result,
    })
    .where(eq(marketingChangeSets.id, row.id));
  return result;
}
