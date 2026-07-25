import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { socialProjects } from "../../db/schema";
import { mutateGoogleAds, type GoogleAdsChangeSetPayload, validateChangeSetPayload } from "./google-ads-read";
import type { PlatformChangeHandler } from "./types";

async function getGoogleAdsProject(tenantKey: string) {
  const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
  if (!row) throw new Error("Tenant bulunamadi");
  const customerId = row.googleAdsCustomerId?.trim();
  if (!customerId) throw new Error("Google Ads musteri ID tanimli degil");
  return { customerId, managerId: row.googleAdsManagerId };
}

function parsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") throw new Error("payload object zorunlu");
  const parsed = payload as GoogleAdsChangeSetPayload;
  const local = validateChangeSetPayload(parsed);
  if (!local.ok) throw new Error(local.errors.join(", "));
  return parsed;
}

export const googleAdsChangeHandler: PlatformChangeHandler = {
  async validate(tenantKey, changeSet) {
    try {
      const payload = parsePayload(changeSet.payload);
      if (!payload.operations?.length) {
        return { ok: true, result: { advisory: true, message: "Bu Google Ads taslagi yalnizca audit notudur; uygulanabilir operasyon yok." } };
      }
      const project = await getGoogleAdsProject(tenantKey);
      const result = await mutateGoogleAds(
        tenantKey,
        project.customerId,
        project.managerId,
        payload.operations ?? [],
        true
      );
      return { ok: true, result };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },

  async apply(tenantKey, changeSet) {
    try {
      const payload = parsePayload(changeSet.payload);
      if (!payload.operations?.length) {
        return { ok: true, result: { advisory: true, message: "Uygulanabilir operasyon yok; Google Ads API mutate cagrisi yapilmadi." } };
      }
      const project = await getGoogleAdsProject(tenantKey);
      const result = await mutateGoogleAds(
        tenantKey,
        project.customerId,
        project.managerId,
        payload.operations ?? [],
        false
      );
      return { ok: true, result };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
};
