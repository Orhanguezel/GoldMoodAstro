import { createChangeSet, parseMarketingPlatform } from "../marketing/change-sets";

export async function createAiMarketingChangeSetDraft(input: {
  tenantKey: string;
  platform?: string;
  goal?: string;
  createdBy?: string;
}) {
  const platform = parseMarketingPlatform(input.platform || "gsc");
  const goal = input.goal?.trim() || "Pazarlama ve olcum kalitesini iyilestir";
  return createChangeSet(input.tenantKey, platform, {
    targetRef: "ai-suggestion",
    title: "AI öneri change-set taslagi",
    description: "AI kaynakli pazarlama optimizasyon taslagi; canli yazma onayli change-set akisi disina cikmaz.",
    source: "ai",
    createdBy: input.createdBy || "ai",
    payload: {
      action: "ai_suggestion",
      goal,
      platform,
      recommendedChecks: [
        "Mevcut analytics verisini incele",
        "Eksik kimlik/entegrasyon alanlarini tamamla",
        "Canli write oncesi validate sonucunu kontrol et",
      ],
      dryRunOnly: true,
    },
  });
}
