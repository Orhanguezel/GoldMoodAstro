"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiNotice } from "./ApiNotice";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  Gauge,
  Image as ImageIcon,
  Loader2,
  DollarSign,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { marketing } from "@/ekosistem/lib/api";

type Props = {
  tenantKey: string;
};

export function GoogleAdsManagementPanel({ tenantKey }: Props) {
  const [audit, setAudit] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [keywords, setKeywords] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [changeSets, setChangeSets] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const isVistaSeedsTenant = tenantKey.toLowerCase().includes("vista");

  const pmaxCampaigns = useMemo(
    () => (audit?.campaigns ?? []).filter((c: any) => c.channelType === "PERFORMANCE_MAX"),
    [audit]
  );
  const searchCampaigns = useMemo(
    () => (audit?.campaigns ?? []).filter((c: any) => c.channelType === "SEARCH" && (c.searchAds ?? []).length > 0),
    [audit]
  );
  const campaigns = useMemo(() => audit?.campaigns ?? [], [audit]);

  const visibleChangeSets = useMemo(
    () =>
      changeSets.filter((item) => {
        if (isVistaSeedsTenant) return true;
        const title = String(item.title ?? "").toLowerCase();
        const source = String(item.source ?? "").toLowerCase();
        return !title.includes("vistaseeds") && !source.includes("vistaseeds");
      }),
    [changeSets, isVistaSeedsTenant]
  );

  async function loadAudit() {
    if (!tenantKey) return;
    setBusy("audit");
    try {
      const data = await marketing.googleAdsAudit(tenantKey);
      setAudit(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadRecommendations() {
    if (!tenantKey) return;
    setBusy("recommendations");
    try {
      const data = await marketing.googleAdsRecommendations(tenantKey);
      setRecommendations(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadKeywords() {
    if (!tenantKey) return;
    setBusy("keywords");
    try {
      const data = await marketing.googleAdsKeywords(tenantKey);
      setKeywords(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadInsights() {
    if (!tenantKey) return;
    setBusy("insights");
    try {
      const data = await marketing.googleAdsInsights(tenantKey, "30d");
      setInsights(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function loadChangeSets() {
    if (!tenantKey) return;
    try {
      const data = await marketing.googleAdsChangeSets(tenantKey);
      setChangeSets(data.items ?? []);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function createVistaSeedsPlan() {
    setBusy("plan");
    try {
      await marketing.createVistaSeedsPlan(tenantKey);
      await loadChangeSets();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createAutomationDrafts() {
    setBusy("automation");
    try {
      const data = await marketing.createGoogleAdsAutomationDrafts(tenantKey);
      alert(data.created ? "Otomasyon change-set taslağı oluşturuldu." : data.message || "Taslak gerekmedi.");
      await loadChangeSets();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createSearchCampaignDraft() {
    const name = window.prompt("Search kampanya adı");
    if (!name?.trim()) return;
    const budgetRaw = window.prompt("Günlük bütçe", "100");
    if (!budgetRaw) return;
    const dailyBudget = Number(budgetRaw.replace(",", "."));
    if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) return alert("Geçerli bir bütçe girin.");
    const finalUrl = window.prompt("Final URL", "https://");
    if (!finalUrl?.trim()) return;
    const headlinesRaw = window.prompt(
      "Başlıklar: en az 3, virgülle ayırın",
      "Hızlı Teklif Al, Güvenilir Hizmet, Hemen İncele"
    );
    if (!headlinesRaw) return;
    const descriptionsRaw = window.prompt(
      "Açıklamalar: en az 2, virgülle ayırın",
      "Markanıza uygun çözümleri keşfedin, Hemen iletişime geçin ve detaylı bilgi alın"
    );
    if (!descriptionsRaw) return;
    const keywordsRaw = window.prompt("Keyword'ler: virgülle ayırın", "");
    const headlines = splitPromptList(headlinesRaw);
    const descriptions = splitPromptList(descriptionsRaw);
    if (headlines.length < 3) return alert("En az 3 başlık gerekli.");
    if (descriptions.length < 2) return alert("En az 2 açıklama gerekli.");
    const locationIdsRaw = window.prompt("Geo target ID'leri: virgülle ayırın (TR geneli için boş bırakabilirsiniz)", "");
    const languageIdsRaw = window.prompt("Language constant ID'leri: Türkçe için 1037, boş bırakılabilir", "1037");

    setBusy("search-campaign");
    try {
      await marketing.createGoogleAdsSearchCampaignDraft(tenantKey, {
        name: name.trim(),
        dailyBudgetMicros: Math.round(dailyBudget * 1_000_000),
        finalUrl: finalUrl.trim(),
        adGroupName: `${name.trim()} Ad Group`,
        headlines,
        descriptions,
        keywords: splitPromptList(keywordsRaw || ""),
        locationIds: splitPromptList(locationIdsRaw || ""),
        languageIds: splitPromptList(languageIdsRaw || ""),
        bidding: { strategy: "MAXIMIZE_CONVERSIONS" },
      });
      await loadChangeSets();
      alert("PAUSED Search kampanya change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createCampaignStatusDraft(campaign: any, status: "ENABLED" | "PAUSED") {
    if (!campaign.resourceName) return alert("Kampanya resourceName bulunamadı.");
    setBusy(`campaign:${campaign.id}:${status}`);
    try {
      await marketing.createGoogleAdsCampaignDraft(tenantKey, {
        action: "status",
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignResourceName: campaign.resourceName,
        status,
      });
      await loadChangeSets();
      alert("Kampanya durum change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createCampaignBudgetDraft(campaign: any) {
    if (!campaign.resourceName || !campaign.budget?.resourceName) return alert("Kampanya bütçe resourceName bulunamadı.");
    const currentBudget = campaign.budget?.amountMicros ? Number(campaign.budget.amountMicros) / 1_000_000 : "";
    const raw = window.prompt("Yeni günlük bütçe tutarı", currentBudget ? String(currentBudget) : "");
    if (!raw) return;
    const amount = Number(raw.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return alert("Geçerli bir bütçe tutarı girin.");
    setBusy(`campaign:${campaign.id}:budget`);
    try {
      await marketing.createGoogleAdsCampaignDraft(tenantKey, {
        action: "budget",
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignResourceName: campaign.resourceName,
        campaignBudgetResourceName: campaign.budget.resourceName,
        amountMicros: Math.round(amount * 1_000_000),
      });
      await loadChangeSets();
      alert("Bütçe change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createCampaignBiddingDraft(campaign: any) {
    if (!campaign.resourceName) return alert("Kampanya resourceName bulunamadı.");
    const raw = window.prompt("Bidding hedefi: manual, maxconv, roas:3.5 veya cpa:50", "manual");
    if (!raw) return;
    const normalized = raw.trim().toLowerCase().replace(",", ".");
    let bidding:
      | { strategy: "MANUAL_CPC"; enhancedCpcEnabled?: boolean }
      | { strategy: "MAXIMIZE_CONVERSIONS" }
      | { strategy: "TARGET_ROAS"; targetRoas: number }
      | { strategy: "TARGET_CPA"; targetCpaMicros: number };
    if (normalized === "manual" || normalized === "manual_cpc") {
      bidding = { strategy: "MANUAL_CPC", enhancedCpcEnabled: true };
    } else if (normalized === "maxconv" || normalized === "maximize_conversions") {
      bidding = { strategy: "MAXIMIZE_CONVERSIONS" };
    } else if (normalized.startsWith("roas:")) {
      const targetRoas = Number(normalized.slice("roas:".length));
      if (!Number.isFinite(targetRoas) || targetRoas <= 0) return alert("ROAS hedefi pozitif sayı olmalı.");
      bidding = { strategy: "TARGET_ROAS", targetRoas };
    } else if (normalized.startsWith("cpa:")) {
      const targetCpa = Number(normalized.slice("cpa:".length));
      if (!Number.isFinite(targetCpa) || targetCpa <= 0) return alert("CPA hedefi pozitif sayı olmalı.");
      bidding = { strategy: "TARGET_CPA", targetCpaMicros: Math.round(targetCpa * 1_000_000) };
    } else {
      return alert("Format: manual, maxconv, roas:3.5 veya cpa:50");
    }

    setBusy(`campaign:${campaign.id}:bidding`);
    try {
      await marketing.createGoogleAdsCampaignDraft(tenantKey, {
        action: "bidding",
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignResourceName: campaign.resourceName,
        bidding,
      });
      await loadChangeSets();
      alert("Bidding change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createCampaignRemoveDraft(campaign: any) {
    if (!campaign.resourceName) return alert("Kampanya resourceName bulunamadı.");
    const first = window.confirm("Kampanya silme/REMOVE taslağı oluşturulacak. Bu işlem apply edilirse geri alınamaz.");
    if (!first) return;
    const second = window.confirm(`Son onay: ${campaign.name || campaign.id} kampanyası için REMOVE change-set taslağı oluşturulsun mu?`);
    if (!second) return;
    setBusy(`campaign:${campaign.id}:remove`);
    try {
      await marketing.createGoogleAdsCampaignDraft(tenantKey, {
        action: "remove",
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignResourceName: campaign.resourceName,
        removeConfirm: true,
      });
      await loadChangeSets();
      alert("Kampanya REMOVE change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createKeywordStatusDraft(keyword: any, status: "ENABLED" | "PAUSED") {
    if (!keyword.resourceName) return alert("Keyword resourceName bulunamadı.");
    setBusy(`keyword:${keyword.resourceName}:${status}`);
    try {
      await marketing.createGoogleAdsKeywordDraft(tenantKey, {
        campaignId: keyword.campaignId,
        campaignName: keyword.campaignName,
        keywordText: keyword.text,
        adGroupCriterionResourceName: keyword.resourceName,
        status,
      });
      await loadChangeSets();
      alert("Keyword durum change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createImageAssetDraft(campaign: any, assetGroup: any) {
    if (!assetGroup.resourceName) return alert("Asset group resourceName bulunamadı.");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fieldTypeRaw = window.prompt(
        "Asset tipi: marketing, square, portrait, logo veya landscape_logo",
        "marketing"
      );
      if (!fieldTypeRaw) return;
      const fieldType = normalizeImageFieldType(fieldTypeRaw);
      if (!fieldType) return alert("Format: marketing, square, portrait, logo veya landscape_logo");
      setBusy(`asset:${assetGroup.resourceName}`);
      try {
        const image = await readImageForAds(file, fieldType);
        await marketing.createGoogleAdsImageAssetDraft(tenantKey, {
          campaignId: campaign.id,
          campaignName: campaign.name,
          assetGroupResourceName: assetGroup.resourceName,
          assetGroupName: assetGroup.name,
          name: file.name,
          imageBase64: image.base64,
          fieldType,
        });
        await loadChangeSets();
        alert("Görsel asset change-set taslağı oluşturuldu.");
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setBusy(null);
      }
    };
    input.click();
  }

  async function createAssetRemoveDraft(campaign: any, assetGroup: any, asset: any) {
    const resourceName = asset.resourceName || asset.assetGroupAssetResourceName;
    if (!resourceName) return alert("Asset group asset resourceName bulunamadı.");
    const first = window.confirm("Bu asset bağlantısı kaldırma taslağı oluşturulacak. Apply edilirse asset group etkilenir.");
    if (!first) return;
    const second = window.confirm(`Son onay: ${asset.asset?.name || asset.asset?.id || asset.fieldType || "asset"} bağlantısı kaldırılsın mı?`);
    if (!second) return;
    setBusy(`asset-remove:${resourceName}`);
    try {
      await marketing.createGoogleAdsAssetRemoveDraft(tenantKey, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        assetGroupName: assetGroup.name,
        assetGroupAssetResourceName: resourceName,
        assetName: asset.asset?.name || asset.asset?.id || null,
        fieldType: asset.fieldType || null,
        removeConfirm: true,
      });
      await loadChangeSets();
      alert("Asset bağlantısı kaldırma change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createAiRsaDraft(campaign: any, assetGroup: any) {
    if (!assetGroup.resourceName) return alert("Asset group resourceName bulunamadı.");
    const goal = window.prompt("AI reklam hedefi", campaign.name ? `${campaign.name} için nitelikli dönüşüm` : "Nitelikli dönüşüm");
    if (!goal) return;
    setBusy(`ai-rsa:${assetGroup.resourceName}`);
    try {
      await marketing.createGoogleAdsAiRsaDraft(tenantKey, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        assetGroupResourceName: assetGroup.resourceName,
        assetGroupName: assetGroup.name,
        goal,
        context: `${campaign.name || ""} ${assetGroup.name || ""}`.trim(),
      });
      await loadChangeSets();
      alert("AI reklam metni change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createSearchRsaDraft(campaign: any, ad: any) {
    if (!ad?.adGroupId) return alert("Reklam grubu ID bulunamadı.");
    const goal = window.prompt("AI reklam hedefi", campaign.name ? `${campaign.name} için nitelikli dönüşüm` : "Nitelikli dönüşüm");
    if (!goal) return;
    setBusy(`search-rsa:${ad.resourceName || ad.adGroupId}`);
    try {
      await marketing.createGoogleAdsSearchRsaDraft(tenantKey, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        adGroupId: ad.adGroupId,
        adGroupName: ad.adGroupName,
        goal,
        context: `${campaign.name || ""} ${ad.adGroupName || ""}`.trim(),
      });
      await loadChangeSets();
      alert("AI Search RSA taslağı oluşturuldu (PAUSED). Change-set listesinden doğrulayıp uygulayın.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function createTextAssetDraft(campaign: any, assetGroup: any, textAssets: {
    headlines?: string[];
    longHeadlines?: string[];
    descriptions?: string[];
    businessName?: string;
  }) {
    if (!assetGroup.resourceName) return alert("Asset group resourceName bulunamadı.");
    setBusy(`text-asset:${assetGroup.resourceName}`);
    try {
      await marketing.createGoogleAdsTextAssetDraft(tenantKey, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        assetGroupResourceName: assetGroup.resourceName,
        assetGroupName: assetGroup.name,
        textAssets,
      });
      await loadChangeSets();
      alert("PMax metin asset change-set taslağı oluşturuldu.");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function validateChangeSet(uuid: string) {
    setBusy(`validate:${uuid}`);
    try {
      await marketing.validateGoogleAdsChangeSet(uuid);
      await loadChangeSets();
    } catch (err) {
      alert((err as Error).message);
      await loadChangeSets();
    } finally {
      setBusy(null);
    }
  }

  async function applyChangeSet(uuid: string) {
    const ok = window.confirm("Onaylanan Google Ads değişikliği canlı hesaba uygulanacak.");
    if (!ok) return;
    setBusy(`apply:${uuid}`);
    try {
      await marketing.applyGoogleAdsChangeSet(uuid);
      await loadChangeSets();
      await loadAudit();
    } catch (err) {
      alert((err as Error).message);
      await loadChangeSets();
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    loadChangeSets();
  }, [tenantKey]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Google Ads Yönetimi</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Audit · Öneri · Change-set</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton onClick={loadAudit} active={busy === "audit"} icon={<Gauge size={16} />} label="Audit" />
            <ActionButton
              onClick={loadRecommendations}
              active={busy === "recommendations"}
              icon={<Sparkles size={16} />}
              label="Öneriler"
            />
            <ActionButton
              onClick={loadKeywords}
              active={busy === "keywords"}
              icon={<Gauge size={16} />}
              label="Keyword Analizi"
            />
            <ActionButton
              onClick={loadInsights}
              active={busy === "insights"}
              icon={<ClipboardList size={16} />}
              label="Insights"
            />
            <ActionButton
              onClick={createAutomationDrafts}
              active={busy === "automation"}
              icon={<FilePlus2 size={16} />}
              label="Otomasyon Taslağı"
              primary
            />
            <ActionButton
              onClick={createSearchCampaignDraft}
              active={busy === "search-campaign"}
              icon={<FilePlus2 size={16} />}
              label="Search Taslağı"
              primary
            />
            {isVistaSeedsTenant && (
              <ActionButton
                onClick={createVistaSeedsPlan}
                active={busy === "plan"}
                icon={<FilePlus2 size={16} />}
                label="PMax Taslağı"
                primary
              />
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {audit?.error && <InlineError text={audit.error} />}
          {audit?.configured === false && <InlineError text={audit.message} />}

          {campaigns.length > 0 && (
            <CampaignManagementTable
              campaigns={campaigns}
              busy={busy}
              onStatusDraft={createCampaignStatusDraft}
              onBudgetDraft={createCampaignBudgetDraft}
              onBiddingDraft={createCampaignBiddingDraft}
              onRemoveDraft={createCampaignRemoveDraft}
            />
          )}

          {(pmaxCampaigns.length > 0 || searchCampaigns.length > 0) ? (
            <div className="space-y-4">
              {pmaxCampaigns.map((campaign: any) => (
                <CampaignAuditCard
                  key={campaign.resourceName ?? campaign.id}
                  tenantKey={tenantKey}
                  campaign={campaign}
                  busy={busy}
                  onImageAssetDraft={createImageAssetDraft}
                  onAssetRemoveDraft={createAssetRemoveDraft}
                  onAiRsaDraft={createAiRsaDraft}
                  onTextAssetDraft={createTextAssetDraft}
                />
              ))}
              {searchCampaigns.map((campaign: any) => (
                <SearchCampaignCard
                  key={campaign.resourceName ?? campaign.id}
                  campaign={campaign}
                  busy={busy}
                  onRsaDraft={createSearchRsaDraft}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Gauge size={30} />} text="Bu hesapta görüntülenecek kampanya içeriği yok" />
          )}

          {recommendations?.error && <InlineError text={recommendations.error} />}
          {(recommendations?.recommendations ?? []).length > 0 && (
            <RecommendationsTable rows={recommendations.recommendations.slice(0, 20)} />
          )}

          {insights?.error && <InlineError text={insights.error} />}
          {insights && !insights.error && (
            <GoogleAdsInsightsTables insights={insights} />
          )}

          {keywords?.error && <InlineError text={keywords.error} />}
          {(keywords?.keywords ?? []).length > 0 && (
            <KeywordAnalysisTable
              rows={keywords.keywords.filter(hasKeywordMetrics).slice(0, 50)}
              totalRows={keywords.keywords.length}
              busy={busy}
              onStatusDraft={createKeywordStatusDraft}
            />
          )}
        </div>
      </section>

      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Değişiklik Taslakları</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Validate · Apply</p>
            </div>
          </div>
          <button
            onClick={loadChangeSets}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            aria-label="Yenile"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="p-8 space-y-4">
          {visibleChangeSets.length > 0 ? (
            visibleChangeSets.map((item) => (
              <ChangeSetRow
                key={item.uuid}
                item={item}
                busy={busy}
                onValidate={() => validateChangeSet(item.uuid)}
                onApply={() => applyChangeSet(item.uuid)}
              />
            ))
          ) : (
            <EmptyState icon={<ClipboardList size={30} />} text="Kayıtlı taslak yok" />
          )}
        </div>
      </section>
    </div>
  );
}

function CampaignAuditCard(props: {
  tenantKey: string;
  campaign: any;
  busy: string | null;
  onImageAssetDraft: (campaign: any, assetGroup: any) => void;
  onAssetRemoveDraft: (campaign: any, assetGroup: any, asset: any) => void;
  onAiRsaDraft: (campaign: any, assetGroup: any) => void;
  onTextAssetDraft: (campaign: any, assetGroup: any, textAssets: {
    headlines?: string[];
    longHeadlines?: string[];
    descriptions?: string[];
    businessName?: string;
  }) => void;
}) {
  const { tenantKey, campaign, busy, onImageAssetDraft, onAssetRemoveDraft, onAiRsaDraft, onTextAssetDraft } = props;
  const issues = campaign.audit?.issues ?? [];
  const recs = campaign.audit?.recommendations ?? [];
  const budget = campaign.budget?.amountMicros ? Number(campaign.budget.amountMicros) / 1_000_000 : null;

  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_90px_90px_90px_90px] xl:items-center">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-sm font-extrabold text-slate-900">{campaign.name}</h3>
            <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">PMax</span>
          </div>
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
            #{campaign.id} · {campaign.status}
          </p>
        </div>
        <MiniMetric label="Tıklama" value={campaign.metrics?.clicks ?? 0} compact />
        <MiniMetric label="Gösterim" value={campaign.metrics?.impressions ?? 0} compact />
        <MiniMetric label="Bütçe" value={budget ? `₺${budget.toFixed(0)}` : "-"} compact />
        <MiniMetric label="ROAS" value={formatRoas(campaign.metrics?.roas)} compact />
      </div>

      <div className="mt-4">
        <BrandAssetsStrip assets={campaign.brandAssets ?? []} brandGuidelines={campaign.brandGuidelinesEnabled} />
      </div>

      <div className="mt-1 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50">
        <div className="grid min-w-[1120px] grid-cols-[minmax(240px,1fr)_70px_70px_85px_85px_70px_330px] gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
          <span>Öğe Grubu</span>
          <span>Başlık</span>
          <span>Uzun</span>
          <span>Açıklama</span>
          <span>Görsel</span>
          <span>Logo</span>
          <span>Aksiyon</span>
        </div>
        {(campaign.assetGroups ?? []).map((group: any) => (
          <div key={group.resourceName} className="min-w-[1120px] border-b border-slate-100 bg-slate-50 p-4 last:border-b-0">
            <div className="grid grid-cols-[minmax(240px,1fr)_70px_70px_85px_85px_70px_330px] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-slate-800">{group.name}</p>
                <p className="mt-1 truncate text-[10px] font-bold text-slate-400">{group.primaryStatus || group.status || "-"}</p>
              </div>
              <TableValue>{group.counts?.HEADLINE ?? 0}</TableValue>
              <TableValue>{group.counts?.LONG_HEADLINE ?? 0}</TableValue>
              <TableValue>{group.counts?.DESCRIPTION ?? 0}</TableValue>
              <TableValue>{(group.counts?.MARKETING_IMAGE ?? 0) + (group.counts?.SQUARE_MARKETING_IMAGE ?? 0)}</TableValue>
              <TableValue muted={(group.counts?.LOGO ?? 0) < 1}>{group.counts?.LOGO ?? 0}</TableValue>
              <div className="flex items-center gap-2">
                <span className={`rounded-xl px-2 py-1 text-[10px] font-black ${adStrengthClass(group.adStrength)}`}>
                  {adStrengthLabel(group.adStrength)}
                </span>
                <SmallDraftButton
                  onClick={() => onAiRsaDraft(campaign, group)}
                  busy={busy === `ai-rsa:${group.resourceName}`}
                  icon={<Sparkles size={13} />}
                  label="AI Metin"
                />
                <SmallDraftButton
                  onClick={() => onImageAssetDraft(campaign, group)}
                  busy={busy === `asset:${group.resourceName}`}
                  icon={<Upload size={13} />}
                  label="Görsel"
                />
                <ShieldCheck size={18} className={issues.length ? "text-amber-500" : "text-emerald-500"} />
              </div>
            </div>
            <PMaxAssetPreviewGrid
              assets={group.assets ?? []}
              busy={busy}
              onRemove={(asset) => onAssetRemoveDraft(campaign, group, asset)}
            />
            <PMaxAssetEditor
              tenantKey={tenantKey}
              campaign={campaign}
              assetGroup={group}
              busy={busy === `text-asset:${group.resourceName}`}
              onTextAssetDraft={onTextAssetDraft}
              onImageAssetDraft={onImageAssetDraft}
            />
          </div>
        ))}
      </div>

      {(issues.length > 0 || recs.length > 0) && (
        <div className="space-y-2">
          {[...issues, ...recs].slice(0, 5).map((text, index) => (
            <div key={`${text}-${index}`} className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
              <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignManagementTable(props: {
  campaigns: any[];
  busy: string | null;
  onStatusDraft: (campaign: any, status: "ENABLED" | "PAUSED") => void;
  onBudgetDraft: (campaign: any) => void;
  onBiddingDraft: (campaign: any) => void;
  onRemoveDraft: (campaign: any) => void;
}) {
  const { campaigns, busy, onStatusDraft, onBudgetDraft, onBiddingDraft, onRemoveDraft } = props;

  return (
    <div className="space-y-3">
      <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">Kampanya Yönetimi</h3>
      <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
        <div className="grid min-w-[1600px] grid-cols-[minmax(260px,1.4fr)_90px_90px_80px_90px_90px_90px_90px_90px_130px_95px_230px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Kampanya</span>
          <span>Durum</span>
          <span>Gösterim</span>
          <span>CTR</span>
          <span>Ort. TBM</span>
          <span>Maliyet</span>
          <span>CPA</span>
          <span>Dön. Değ.</span>
          <span>ROAS</span>
          <span>Teklif</span>
          <span>Bütçe</span>
          <span>Aksiyon</span>
        </div>
        <div className="divide-y divide-slate-100">
          {campaigns.map((campaign) => {
            const enabled = campaign.status === "ENABLED";
            const statusBusy = busy === `campaign:${campaign.id}:${enabled ? "PAUSED" : "ENABLED"}`;
            const budgetBusy = busy === `campaign:${campaign.id}:budget`;
            const biddingBusy = busy === `campaign:${campaign.id}:bidding`;
            const removeBusy = busy === `campaign:${campaign.id}:remove`;
            return (
              <div
                key={campaign.resourceName ?? campaign.id}
                className="grid min-w-[1600px] grid-cols-[minmax(260px,1.4fr)_90px_90px_80px_90px_90px_90px_90px_90px_130px_95px_230px] items-center gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-900">{campaign.name || "Kampanya"}</p>
                  <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    #{campaign.id} · {campaign.channelType || "-"}
                  </p>
                </div>
                <span className={`w-fit rounded-lg px-2 py-1 text-[10px] font-black ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {campaign.status || "-"}
                </span>
                <TableValue>{campaign.metrics?.impressions ?? 0}</TableValue>
                <TableValue>{formatPercent(campaign.metrics?.ctr)}</TableValue>
                <TableValue>{formatMicros(campaign.metrics?.averageCpcMicros)}</TableValue>
                <TableValue>{formatMicros(campaign.metrics?.costMicros)}</TableValue>
                <TableValue>{formatMicros(campaign.metrics?.cpaMicros)}</TableValue>
                <TableValue>{formatCurrency(campaign.metrics?.conversionsValue)}</TableValue>
                <TableValue>{formatRoas(campaign.metrics?.roas)}</TableValue>
                <TableValue>{campaign.biddingStrategyType || "-"}</TableValue>
                <TableValue>{formatMicros(campaign.budget?.amountMicros)}</TableValue>
                <div className="flex flex-wrap gap-2">
                  <SmallDraftButton
                    onClick={() => onStatusDraft(campaign, enabled ? "PAUSED" : "ENABLED")}
                    busy={statusBusy}
                    icon={enabled ? <Pause size={13} /> : <Play size={13} />}
                    label={enabled ? "Duraklat" : "Etkinleştir"}
                  />
                  <SmallDraftButton
                    onClick={() => onBudgetDraft(campaign)}
                    busy={budgetBusy}
                    icon={<DollarSign size={13} />}
                    label="Bütçe"
                  />
                  <SmallDraftButton
                    onClick={() => onBiddingDraft(campaign)}
                    busy={biddingBusy}
                    icon={<Gauge size={13} />}
                    label="Bidding"
                  />
                  <SmallDraftButton
                    onClick={() => onRemoveDraft(campaign)}
                    busy={removeBusy}
                    icon={<Trash2 size={13} />}
                    label="Sil"
                    danger
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GoogleAdsInsightsTables({ insights }: { insights: any }) {
  return (
    <div className="space-y-4">
      <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">Zengin Insights</h3>
      <OneLineTable
        title="En Maliyetli Arama Terimleri"
        rows={(insights.searchTerms ?? []).slice(0, 20)}
        minWidth={900}
        columns={[
          { label: "Terim", width: "minmax(300px,1.6fr)", render: (row: any) => row.term || "-" },
          { label: "Maliyet", width: "120px", render: (row: any) => formatMicros(row.metrics?.costMicros) },
          { label: "CTR", width: "90px", render: (row: any) => formatPercent(row.metrics?.ctr) },
          { label: "Conv.", width: "90px", render: (row: any) => row.metrics?.conversions ?? 0 },
        ]}
        note="Alakasız olanlar negatif kelime adayı."
      />
      <OneLineTable
        title="En Maliyetli Anahtar Kelimeler"
        rows={(insights.keywords ?? []).slice(0, 20)}
        minWidth={900}
        columns={[
          { label: "Keyword", width: "minmax(300px,1.6fr)", render: (row: any) => row.text || "-" },
          { label: "Match", width: "140px", render: (row: any) => row.matchType || "-" },
          { label: "Maliyet", width: "120px", render: (row: any) => formatMicros(row.metrics?.costMicros) },
          { label: "CTR", width: "90px", render: (row: any) => formatPercent(row.metrics?.ctr) },
        ]}
        note="Düşük CTR + yüksek maliyet gözden geçirilmeli."
      />
      <OneLineTable
        title="Cihaz Dağılımı"
        rows={(insights.devices ?? []).slice(0, 20)}
        minWidth={820}
        columns={[
          { label: "Cihaz", width: "minmax(220px,1fr)", render: (row: any) => row.device || "-" },
          { label: "Tık", width: "100px", render: (row: any) => row.metrics?.clicks ?? 0 },
          { label: "Maliyet", width: "120px", render: (row: any) => formatMicros(row.metrics?.costMicros) },
          { label: "ROAS", width: "100px", render: (row: any) => formatRoas(row.metrics?.roas) },
        ]}
      />
    </div>
  );
}

const TEXT_FIELD_GROUPS = [
  { key: "HEADLINE", label: "Başlıklar", limit: "3-15 · 30 krk" },
  { key: "LONG_HEADLINE", label: "Uzun Başlıklar", limit: "1-5 · 90 krk" },
  { key: "DESCRIPTION", label: "Açıklamalar", limit: "2-5 · 90 krk" },
  { key: "BUSINESS_NAME", label: "İşletme Adı", limit: "1 · 25 krk" },
];

function PMaxAssetPreviewGrid({
  assets,
  busy,
  onRemove,
}: {
  assets: any[];
  busy: string | null;
  onRemove: (asset: any) => void;
}) {
  const imageAssets = assets.filter((item) => item.asset?.imageUrl || String(item.asset?.type || "").includes("IMAGE"));
  const textAssets = assets.filter((item) => !item.asset?.imageUrl && item.asset?.text);

  if (assets.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs font-bold text-slate-400">
        Bu öğe grubunda asset görünmüyor.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-white p-3">
      {imageAssets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {imageAssets.slice(0, 18).map((item) => {
            const resourceName = item.resourceName || item.asset?.resourceName || `${item.fieldType}-${item.asset?.id}`;
            return (
              <div key={resourceName} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <div className="aspect-square bg-slate-100">
                  {item.asset?.imageUrl ? (
                    <img src={item.asset.imageUrl} alt={item.asset?.name || item.fieldType || "Google Ads asset"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-black text-slate-500">{item.fieldType || "-"}</span>
                    <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-400">
                      {item.status || item.primaryStatus || "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    disabled={busy === `asset-remove:${item.resourceName}`}
                    className="w-full rounded-lg border border-rose-100 bg-white px-2 py-1.5 text-[10px] font-black text-rose-700 disabled:opacity-50"
                  >
                    {busy === `asset-remove:${item.resourceName}` ? "Hazırlanıyor" : "Sil Taslağı"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {textAssets.length > 0 && (
        <div className="space-y-3">
          {TEXT_FIELD_GROUPS.map(({ key, label, limit }) => {
            const items = textAssets.filter((a) => a.fieldType === key);
            if (items.length === 0) return null;
            return (
              <div key={key} className="overflow-hidden rounded-xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                  <span className="text-[10px] font-black text-slate-400">{items.length} adet · limit {limit}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((item, idx) => {
                    const txt = item.asset?.text || item.asset?.name || item.asset?.id || "Asset";
                    return (
                      <div key={item.resourceName || `${item.fieldType}-${idx}`} className="flex items-start justify-between gap-3 px-3 py-2">
                        <span className="text-[11px] font-bold leading-5 text-slate-700">{txt}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] font-black text-slate-300">{String(txt).length} krk</span>
                          <button
                            type="button"
                            onClick={() => onRemove(item)}
                            disabled={busy === `asset-remove:${item.resourceName}`}
                            className="rounded-md border border-rose-100 bg-white px-2 py-0.5 text-[9px] font-black text-rose-600 disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BrandAssetsStrip({ assets, brandGuidelines }: { assets: any[]; brandGuidelines?: boolean }) {
  const logos = (assets ?? []).filter((a) => a.imageUrl);
  const names = (assets ?? []).filter((a) => a.fieldType === "BUSINESS_NAME" && a.text);
  if (logos.length === 0 && names.length === 0) {
    if (brandGuidelines) {
      return (
        <div className="mb-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
          🛡️ Marka Yönergeleri (Brand Guidelines) açık — logo ve işletme adı Google Ads panelinden yönetilir (API ile gösterilemiyor).
        </div>
      );
    }
    return null;
  }
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marka</span>
      {logos.map((l, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={l.imageUrl} alt="logo" className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain" title={l.fieldType} />
      ))}
      {names.map((n, i) => (
        <span key={i} className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">{n.text}</span>
      ))}
    </div>
  );
}

function RsaTextGroup({ label, items, max }: { label: string; items: any[]; max: number }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="divide-y divide-slate-50">
        {items.map((it, i) => (
          <div key={i} className="flex items-start justify-between gap-3 px-3 py-2">
            <span className="text-[11px] font-bold leading-5 text-slate-700">
              {it.text}
              {it.pinnedField ? <span className="ml-1 text-amber-500" title={`Sabit: ${it.pinnedField}`}>📌</span> : null}
            </span>
            <span className="shrink-0 text-[10px] font-black text-slate-300">{String(it.text || "").length}/{max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchCampaignCard({
  campaign,
  busy,
  onRsaDraft,
}: {
  campaign: any;
  busy: string | null;
  onRsaDraft: (campaign: any, ad: any) => void;
}) {
  const ads = campaign.searchAds ?? [];
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-800">{campaign.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Arama Kampanyası · {campaign.status || "-"}</p>
        </div>
        <span className="rounded-xl bg-sky-50 px-2.5 py-1 text-[10px] font-black text-sky-600">SEARCH · RSA</span>
      </div>
      <BrandAssetsStrip assets={campaign.brandAssets ?? []} brandGuidelines={campaign.brandGuidelinesEnabled} />
      {ads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs font-bold text-slate-400">RSA reklam görünmüyor.</div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad: any, i: number) => (
            <div key={ad.resourceName || i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-black text-slate-600">{ad.adGroupName || "Reklam Grubu"}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-xl px-2 py-1 text-[10px] font-black ${adStrengthClass(ad.adStrength)}`}>{adStrengthLabel(ad.adStrength)}</span>
                  <SmallDraftButton
                    onClick={() => onRsaDraft(campaign, ad)}
                    busy={busy === `search-rsa:${ad.resourceName || ad.adGroupId}`}
                    icon={<Sparkles size={13} />}
                    label="AI İyileştir"
                  />
                </div>
              </div>
              <RsaTextGroup label={`Başlıklar (${ad.headlines?.length ?? 0}/15)`} items={ad.headlines} max={30} />
              <RsaTextGroup label={`Açıklamalar (${ad.descriptions?.length ?? 0}/4)`} items={ad.descriptions} max={90} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationsTable({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-3">
      <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">Google Önerileri</h3>
      <OneLineTable
        title="Öneri Listesi"
        rows={rows}
        minWidth={880}
        columns={[
          { label: "Tip", width: "260px", render: (row: any) => row.type || "-" },
          { label: "Kampanya", width: "minmax(280px,1fr)", render: (row: any) => row.campaign || row.resourceName || "-" },
          { label: "Kaynak", width: "180px", render: (row: any) => row.resourceName || "-" },
        ]}
      />
    </div>
  );
}

function KeywordAnalysisTable(props: {
  rows: any[];
  totalRows: number;
  busy: string | null;
  onStatusDraft: (keyword: any, status: "ENABLED" | "PAUSED") => void;
}) {
  const { rows, totalRows, busy, onStatusDraft } = props;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Keyword Analizi</h3>
        {totalRows > rows.length && (
          <span className="text-[10px] font-bold text-slate-400">
            {totalRows - rows.length} boş/metriksiz keyword gizlendi
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
        {rows.length === 0 ? (
          <p className="bg-slate-50 p-5 text-xs font-bold text-slate-400">
            Son dönemde tık, gösterim, maliyet veya dönüşüm taşıyan keyword yok.
          </p>
        ) : (
          <>
            <div className="grid min-w-[1280px] grid-cols-[minmax(260px,1.3fr)_minmax(220px,1fr)_120px_80px_95px_95px_95px_80px_150px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Keyword</span>
              <span>Kampanya</span>
              <span>Match</span>
              <span>QS</span>
              <span>Tık</span>
              <span>Gösterim</span>
              <span>Maliyet</span>
              <span>Conv.</span>
              <span>Aksiyon</span>
            </div>
            <div className="divide-y divide-slate-100">
              {rows.map((keyword) => {
                const cost = keyword.metrics?.costMicros ? Number(keyword.metrics.costMicros) / 1_000_000 : 0;
                const risky =
                  (typeof keyword.qualityScore === "number" && keyword.qualityScore <= 3) ||
                  (cost > 0 && Number(keyword.metrics?.conversions ?? 0) === 0);
                const enabled = keyword.status === "ENABLED";
                const nextStatus = enabled ? "PAUSED" : "ENABLED";

                return (
                  <div
                    key={keyword.resourceName ?? `${keyword.campaignId}-${keyword.text}`}
                    className="grid min-w-[1280px] grid-cols-[minmax(260px,1.3fr)_minmax(220px,1fr)_120px_80px_95px_95px_95px_80px_150px] items-center gap-3 px-5 py-3"
                  >
                    <TableValue>{keyword.text || "Keyword"}</TableValue>
                    <TableValue>{keyword.campaignName || keyword.campaignId || "-"}</TableValue>
                    <TableValue muted>{keyword.matchType || "-"}</TableValue>
                    <span className={`w-fit rounded-lg px-2 py-1 text-[10px] font-black ${risky ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {keyword.qualityScore ?? "-"}
                    </span>
                    <TableValue>{keyword.metrics?.clicks ?? 0}</TableValue>
                    <TableValue>{keyword.metrics?.impressions ?? 0}</TableValue>
                    <TableValue>{cost ? `₺${cost.toFixed(0)}` : "-"}</TableValue>
                    <TableValue>{keyword.metrics?.conversions ?? 0}</TableValue>
                    <SmallDraftButton
                      onClick={() => onStatusDraft(keyword, nextStatus)}
                      busy={busy === `keyword:${keyword.resourceName}:${nextStatus}`}
                      icon={enabled ? <Pause size={13} /> : <Play size={13} />}
                      label={enabled ? "Duraklat" : "Etkinleştir"}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function hasKeywordMetrics(keyword: any) {
  const metrics = keyword?.metrics ?? {};
  return ["clicks", "impressions", "costMicros", "conversions", "conversionsValue"].some((key) => {
    const value = Number(metrics[key] ?? 0);
    return Number.isFinite(value) && value > 0;
  });
}

function OneLineTable(props: {
  title: string;
  rows: any[];
  columns: Array<{ label: string; width: string; render: (row: any) => ReactNode }>;
  note?: string;
  minWidth?: number;
}) {
  const gridTemplateColumns = props.columns.map((column) => column.width).join(" ");

  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-900">{props.title}</p>
          {props.note && <p className="mt-1 text-[10px] font-bold text-slate-400">{props.note}</p>}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        {props.rows.length === 0 ? (
          <p className="bg-slate-50 p-4 text-xs font-bold text-slate-400">Veri yok.</p>
        ) : (
          <div style={{ minWidth: props.minWidth ?? 760 }}>
            <div
              className="grid gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
              style={{ gridTemplateColumns }}
            >
              {props.columns.map((column) => (
                <span key={column.label}>{column.label}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {props.rows.map((row, index) => (
                <div
                  key={`${props.title}-${index}`}
                  className="grid items-center gap-3 px-4 py-2 text-[11px] font-extrabold text-slate-700"
                  style={{ gridTemplateColumns }}
                >
                  {props.columns.map((column) => (
                    <span key={column.label} className="truncate">
                      {column.render(row)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PMaxAssetEditor(props: {
  tenantKey: string;
  campaign: any;
  assetGroup: any;
  busy: boolean;
  onTextAssetDraft: (campaign: any, assetGroup: any, textAssets: {
    headlines?: string[];
    longHeadlines?: string[];
    descriptions?: string[];
    businessName?: string;
  }) => void;
  onImageAssetDraft: (campaign: any, assetGroup: any) => void;
}) {
  const [headlines, setHeadlines] = useState<string[]>([""]);
  const [longHeadlines, setLongHeadlines] = useState<string[]>([""]);
  const [descriptions, setDescriptions] = useState<string[]>([""]);
  const [businessName, setBusinessName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const clean = (rows: string[], limit: number) => rows.map((row) => row.trim()).filter(Boolean).map((row) => row.slice(0, limit));
  const canSubmit =
    clean(headlines, 30).length > 0 ||
    clean(longHeadlines, 90).length > 0 ||
    clean(descriptions, 90).length > 0 ||
    businessName.trim().length > 0;

  async function fillWithAi() {
    const goal = window.prompt("AI reklam hedefi", props.campaign.name ? `${props.campaign.name} için nitelikli dönüşüm` : "Nitelikli dönüşüm");
    if (!goal) return;
    setAiLoading(true);
    try {
      const res = await marketing.generateGoogleAdsAiRsaCopy(props.tenantKey, {
        campaignName: props.campaign.name,
        assetGroupName: props.assetGroup.name,
        goal,
        context: `${props.campaign.name || ""} ${props.assetGroup.name || ""}`.trim(),
      });
      const copy = res.copy || {};
      setHeadlines(copy.headlines?.length ? copy.headlines : [""]);
      setLongHeadlines(copy.longHeadlines?.length ? copy.longHeadlines : [""]);
      setDescriptions(copy.descriptions?.length ? copy.descriptions : [""]);
      setBusinessName(copy.businessName || "");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <details className="mt-3 rounded-2xl border border-slate-100 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-black text-slate-800">PMax Öğe Yönetimi</p>
          <p className="text-[10px] font-bold text-slate-400">Başlık/açıklama satırı ekle-çıkar, görsel/logo yükle.</p>
        </div>
        <span className={`rounded-xl px-2 py-1 text-[10px] font-black ${adStrengthClass(props.assetGroup.adStrength)}`}>
          {adStrengthLabel(props.assetGroup.adStrength)}
        </span>
      </summary>

      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4">
        <AssetTextRows title="Başlık" limit={30} rows={headlines} onChange={setHeadlines} />
        <AssetTextRows title="Uzun Başlık" limit={90} rows={longHeadlines} onChange={setLongHeadlines} />
        <AssetTextRows title="Açıklama" limit={90} rows={descriptions} onChange={setDescriptions} />
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">İşletme Adı</span>
            <span className="text-[10px] font-bold text-slate-400">{businessName.length}/25</span>
          </div>
          <input
            value={businessName}
            maxLength={25}
            onChange={(event) => setBusinessName(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-amber-300"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SmallDraftButton
          onClick={fillWithAi}
          busy={aiLoading}
          icon={<Sparkles size={13} />}
          label="AI Doldur"
        />
        <SmallDraftButton
          onClick={() => {
            if (!canSubmit) return alert("En az bir başlık, açıklama veya işletme adı girin.");
            props.onTextAssetDraft(props.campaign, props.assetGroup, {
              headlines: clean(headlines, 30),
              longHeadlines: clean(longHeadlines, 90),
              descriptions: clean(descriptions, 90),
              businessName: businessName.trim().slice(0, 25) || undefined,
            });
          }}
          busy={props.busy}
          icon={<FilePlus2 size={13} />}
          label={canSubmit ? "Metin Taslağı" : "Metin Gir"}
        />
        <SmallDraftButton
          onClick={() => props.onImageAssetDraft(props.campaign, props.assetGroup)}
          busy={false}
          icon={<Upload size={13} />}
          label="Görsel/Logo"
        />
      </div>
    </details>
  );
}

function AssetTextRows({ title, limit, rows, onChange }: {
  title: string;
  limit: number;
  rows: string[];
  onChange: (rows: string[]) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <button
          type="button"
          onClick={() => onChange([...rows, ""])}
          className="text-[10px] font-black text-amber-700 hover:text-amber-600"
        >
          Ekle
        </button>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
            <input
              value={row}
              maxLength={limit}
              onChange={(event) => onChange(rows.map((item, idx) => (idx === index ? event.target.value : item)))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-amber-300"
            />
            <span className="w-10 text-right text-[10px] font-bold text-slate-400">{row.length}/{limit}</span>
            <button
              type="button"
              onClick={() => onChange(rows.length === 1 ? [""] : rows.filter((_, idx) => idx !== index))}
              className="rounded-lg border border-slate-200 px-2 py-2 text-[10px] font-black text-slate-500 hover:bg-white"
            >
              Çıkar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMicros(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `₺${(amount / 1_000_000).toFixed(0)}`;
}

function formatPercent(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `%${(amount * 100).toFixed(1)}`;
}

function formatRoas(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `${amount.toFixed(2)}x`;
}

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `₺${amount.toFixed(0)}`;
}

function adStrengthLabel(value: unknown) {
  const raw = String(value || "").toUpperCase();
  if (raw === "EXCELLENT") return "Mükemmel";
  if (raw === "GOOD") return "İyi";
  if (raw === "AVERAGE") return "Orta";
  if (raw === "POOR") return "Zayıf";
  if (raw === "PENDING") return "Beklemede";
  return raw || "Reklam Gücü Yok";
}

function adStrengthClass(value: unknown) {
  const raw = String(value || "").toUpperCase();
  if (raw === "EXCELLENT" || raw === "GOOD") return "bg-emerald-50 text-emerald-700";
  if (raw === "AVERAGE" || raw === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function splitPromptList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeImageFieldType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["marketing", "landscape", "wide", "yatay", "1.91:1"].includes(normalized)) return "MARKETING_IMAGE";
  if (["square", "kare", "1:1", "square_marketing"].includes(normalized)) return "SQUARE_MARKETING_IMAGE";
  if (["portrait", "vertical", "dikey", "4:5"].includes(normalized)) return "PORTRAIT_MARKETING_IMAGE";
  if (["landscape_logo", "wide_logo", "4:1"].includes(normalized)) return "LANDSCAPE_LOGO";
  if (["logo"].includes(normalized)) return "LOGO";
  return null;
}

function minimumImageSize(fieldType: string) {
  if (fieldType === "SQUARE_MARKETING_IMAGE" || fieldType === "LOGO") return { width: 300, height: 300 };
  if (fieldType === "LANDSCAPE_LOGO") return { width: 512, height: 128 };
  if (fieldType === "PORTRAIT_MARKETING_IMAGE") return { width: 480, height: 600 };
  return { width: 600, height: 314 };
}

async function readImageForAds(file: File, fieldType: string) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });

  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel boyutu okunamadı."));
    };
    image.src = objectUrl;
  });

  const min = minimumImageSize(fieldType);
  if (dimensions.width < min.width || dimensions.height < min.height) {
    throw new Error(`Görsel en az ${min.width}x${min.height} olmalı. Seçilen: ${dimensions.width}x${dimensions.height}.`);
  }

  return { base64: dataUrl.split(",").pop() || dataUrl, ...dimensions };
}

function ChangeSetRow(props: {
  item: any;
  busy: string | null;
  onValidate: () => void;
  onApply: () => void;
}) {
  const { item, busy, onValidate, onApply } = props;
  const payload = item.payload ?? {};
  const texts = payload.textAssets ?? {};
  const operations = Array.isArray(payload.operations) ? payload.operations : [];
  const isAdvisory = operations.length === 0;
  const validating = busy === `validate:${item.uuid}`;
  const applying = busy === `apply:${item.uuid}`;

  return (
    <div className="border border-slate-100 bg-slate-50 rounded-[24px] p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={item.status} />
            <span className="text-[10px] font-bold text-slate-400">{item.source}</span>
            {isAdvisory && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">
                Audit notu
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">{item.campaignName || item.campaignId || item.uuid}</p>
        </div>
        {!isAdvisory && (
          <div className="flex items-center gap-2">
          <button
            onClick={onValidate}
            disabled={validating || applying || item.status === "applied"}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs disabled:opacity-50"
          >
            {validating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Validate
          </button>
          <button
            onClick={onApply}
            disabled={validating || applying || item.status !== "validated"}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs disabled:opacity-50"
          >
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Apply
          </button>
          </div>
        )}
      </div>

      {isAdvisory ? (
        <div className="rounded-2xl border border-amber-100 bg-white p-4">
          <p className="text-xs font-black text-slate-800">Uygulanabilir operasyon yok.</p>
          <p className="mt-1 text-[11px] font-bold text-slate-500">{payload.notes || "Bu kayıt yalnızca audit/advisory notudur."}</p>
          {(payload.manualSteps ?? []).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {payload.manualSteps.slice(0, 6).map((step: string) => (
                <p key={step} className="truncate text-[11px] font-semibold text-slate-600">{step}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PreviewList title="Başlıklar" rows={texts.headlines ?? []} />
          <PreviewList title="Uzun Başlıklar" rows={texts.longHeadlines ?? []} />
          <PreviewList title="Açıklamalar" rows={texts.descriptions ?? []} />
        </div>
      )}

      {(payload.imageChecklist ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            <ImageIcon size={13} /> Görsel Checklist
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {payload.imageChecklist.map((row: string) => (
              <div key={row} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>{row}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton(props: {
  onClick: () => void;
  active: boolean;
  icon: ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.active}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-xs disabled:opacity-60 ${
        props.primary
          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/10 hover:bg-amber-600"
          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
      }`}
    >
      {props.active ? <Loader2 size={16} className="animate-spin" /> : props.icon}
      {props.label}
    </button>
  );
}

function TableValue({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={`truncate text-xs font-extrabold ${muted ? "text-slate-400" : "text-slate-800"}`}>
      {children}
    </span>
  );
}

function MiniMetric({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white ${compact ? "px-3 py-2" : "p-3"}`}>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-sm font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function SmallDraftButton(props: {
  onClick: () => void;
  busy: boolean;
  icon: ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.busy}
      className={`flex h-9 items-center gap-1.5 rounded-xl border bg-white px-3 text-[11px] font-bold shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 ${
        props.danger ? "border-rose-100 text-rose-700" : "border-slate-200 text-slate-700"
      }`}
    >
      {props.busy ? <Loader2 size={13} className="animate-spin" /> : props.icon}
      {props.label}
    </button>
  );
}

function PreviewList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-h-[120px]">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map((row) => (
          <p key={row} className="text-[11px] font-semibold text-slate-700 leading-snug">
            {row}
          </p>
        ))}
        {rows.length > 5 && <p className="text-[10px] text-slate-400 font-bold">+{rows.length - 5}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    validated: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    validation_failed: "bg-rose-50 text-rose-700 border border-rose-100",
    applied: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    failed: "bg-rose-50 text-rose-700 border border-rose-100",
    cancelled: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

function InlineError({ text }: { text: string }) {
  return <ApiNotice text={text} />;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-300">
      {icon}
      <p className="text-xs font-bold mt-2">{text}</p>
    </div>
  );
}
