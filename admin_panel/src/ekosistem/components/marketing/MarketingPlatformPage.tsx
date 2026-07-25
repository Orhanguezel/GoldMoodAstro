"use client";

import { useEffect, useState, type ReactNode } from "react";
import { marketing, tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { BarChart3, MousePointerClick, RefreshCw, Search, Settings, ShieldCheck, ShoppingBag, Tags, Target } from "lucide-react";
import { GradientHero } from "@/ekosistem/components/ui/GradientHero";
import { MetricCard } from "@/ekosistem/components/ui/MetricCard";
import { EmptyState } from "@/ekosistem/components/ui/EmptyState";
import { ChangeSetPanel } from "@/ekosistem/components/marketing/ChangeSetPanel";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PlatformKey = "ga4" | "gsc" | "google_ads" | "gtm" | "merchant" | "meta";
type TabKey = "analysis" | "changes" | "settings";

const platformMeta: Record<PlatformKey, { title: string; eyebrow: string; description: string; icon: React.ReactNode }> = {
  ga4: {
    title: "GA4 Analitiği",
    eyebrow: "Analytics",
    description: "Trafik, aktif kullanıcılar ve dönüşüm ölçüm durumunu izleyin.",
    icon: <BarChart3 size={22} />,
  },
  gsc: {
    title: "Search Console",
    eyebrow: "SEO",
    description: "Arama performansı, tıklama, gösterim ve CTR fırsatlarını takip edin.",
    icon: <Search size={22} />,
  },
  google_ads: {
    title: "Google Ads",
    eyebrow: "Ads",
    description: "Kampanya analizi, öneriler ve onaylı change-set akışı.",
    icon: <Target size={22} />,
  },
  gtm: {
    title: "Tag Manager",
    eyebrow: "GTM",
    description: "Container, tag ve tracking fix taslakları için merkezi çalışma alanı.",
    icon: <Tags size={22} />,
  },
  merchant: {
    title: "Merchant Center",
    eyebrow: "Shopping",
    description: "Ürün feed, item issue ve attribute düzeltme taslaklarını izleyin.",
    icon: <ShoppingBag size={22} />,
  },
  meta: {
    title: "Meta Pixel & CAPI",
    eyebrow: "Meta",
    description: "Pixel, CAPI ve test event yapılandırmasını kontrol edin.",
    icon: <MousePointerClick size={22} />,
  },
};

export function MarketingPlatformPage({ platform }: { platform: PlatformKey }) {
  const meta = platformMeta[platform];
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [ga4Range, setGa4Range] = useState<7 | 28 | 90>(28);

  useEffect(() => {
    tenants
      .list()
      .then((data) => {
        setTenantItems(data.items);
        const nextTenantKey = resolveTenantKey(data.items, getStoredTenantKey());
        setTenantKey(nextTenantKey);
        if (nextTenantKey) setStoredTenantKey(nextTenantKey);
      })
      .catch(() => setTenantItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function load() {
    if (!tenantKey) return;
    setLoading(true);
    try {
      const base = await marketing.settings(tenantKey);
      setSettings(base);
      if (platform === "ga4") {
        const [summary, report, funnel, visitStats, config, realtimeDetail] = await Promise.all([
          marketing.ga4Summary(tenantKey),
          marketing.ga4Report(tenantKey, ga4Range),
          marketing.ga4Funnel(tenantKey, ga4Range),
          marketing.ga4VisitStats(tenantKey, ga4Range),
          marketing.ga4Config(tenantKey),
          marketing.ga4RealtimeDetail(tenantKey),
        ]);
        setAnalysis({ ...summary, deepReport: report, funnel, visitStats, config, realtimeDetail, range: ga4Range });
      }
      if (platform === "gsc") {
        const [summary, analytics, sites, index] = await Promise.all([
          marketing.gscSummary(tenantKey),
          marketing.gscAnalytics(tenantKey, 28, "web"),
          marketing.gscSites(tenantKey),
          marketing.gscIndex(tenantKey, 100),
        ]);
        setAnalysis({ ...summary, analytics, sites: sites?.sites ?? [], index });
      }
      if (platform === "google_ads") setAnalysis(await marketing.googleAdsAudit(tenantKey));
      if (platform === "gtm") setAnalysis(await marketing.gtmSummary(tenantKey));
      if (platform === "merchant") setAnalysis(await marketing.merchantSummary(tenantKey));
      if (platform === "meta") setAnalysis(await marketing.metaDiagnostics(tenantKey));
    } catch (err) {
      setAnalysis({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantKey, platform, ga4Range]);

  async function createGtmFixDraft() {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createGtmTrackingFixSuggestion(tenantKey);
      setActionMessage(res.created ? "Tracking-fix change-set taslağı oluşturuldu." : res.message || "Yeni taslak gerekmedi.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createGa4ConfigDraft(kind: "conversion_event" | "audience" | "custom_dimension") {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createGa4ConfigDraft(tenantKey, { kind });
      setActionMessage(res.item ? "GA4 config change-set taslağı oluşturuldu." : "GA4 taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createGa4DeleteDraft(kind: "delete_key_event" | "delete_audience" | "delete_custom_dimension", resourceName: string) {
    if (!tenantKey) return;
    const ok = window.confirm("GA4 config silme/arşivleme change-set taslağı oluşturulacak. Apply edilirse canlı config etkilenir.");
    if (!ok) return;
    setActionMessage("");
    try {
      const res = await marketing.createGa4ConfigDraft(tenantKey, { kind, resourceName, name: resourceName.split("/").pop() });
      setActionMessage(res.item ? "GA4 silme change-set taslağı oluşturuldu." : "GA4 taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createGscWriteDraft(kind: "sitemap_submit" | "sitemap_delete" | "indexing_request") {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createGscWriteDraft(tenantKey, { kind });
      setActionMessage(res.item ? "GSC write change-set taslağı oluşturuldu." : "GSC taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createMerchantAttributeFixDraft() {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createMerchantAttributeFixDraft(tenantKey);
      setActionMessage(res.item ? "Merchant attribute fix taslağı oluşturuldu." : "Merchant taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createMetaDiagnosticsDraft() {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createMetaDiagnosticsDraft(tenantKey);
      setActionMessage(res.item ? "Meta diagnostics taslağı oluşturuldu." : "Meta taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  async function createAiDraft() {
    if (!tenantKey) return;
    setActionMessage("");
    try {
      const res = await marketing.createAiChangeSetDraft(tenantKey, { platform, goal: `${meta.title} optimizasyon önerisi` });
      setActionMessage(res.item ? "AI öneri change-set taslağı oluşturuldu." : "AI taslak yanıtı alındı.");
      setActiveTab("changes");
    } catch (err) {
      setActionMessage((err as Error).message);
    }
  }

  const configured = Boolean(
    platform === "ga4"
      ? settings?.ga4PropertyId || settings?.ga4MeasurementId
      : platform === "gsc"
        ? settings?.searchConsoleSiteUrl
        : platform === "google_ads"
          ? settings?.googleAdsCustomerId
          : platform === "gtm"
            ? settings?.gtmContainerId
            : platform === "merchant"
              ? analysis?.settings?.merchantId
              : analysis?.configured,
  );

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8">
      <GradientHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Bağlantı" value={configured ? "Hazır" : "Eksik"} icon={meta.icon} description="Bağlantı ayarı" />
        <MetricCard label="Change-set" value="Onaylı" icon={<ShieldCheck size={20} />} description="Draft → validate → apply" />
        <MetricCard label="Son Durum" value={analysis?.error ? "Hata" : loading ? "Yükleniyor" : "Ok"} icon={<RefreshCw size={20} />} description={analysis?.error || "Read endpoint aktif"} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-[28px] border border-slate-100 bg-slate-50 p-1.5">
        <TabButton active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} label="Analiz" />
        <TabButton active={activeTab === "changes"} onClick={() => setActiveTab("changes")} label="Düzeltme & Otomasyon" />
        <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} label="Ayarlar" />
      </div>

      {activeTab === "analysis" && (
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Analiz Özeti</h2>
              <p className="text-sm font-medium text-slate-400">Detaylı platform analizi sonraki fazlarda genişletilecek.</p>
            </div>
            <button onClick={load} disabled={loading} className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-black text-brand-700 disabled:opacity-50">
              Yenile
            </button>
          </div>
          {platform === "gtm" && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">GA4 tracking fix</p>
                <p className="text-xs font-medium text-slate-400">GA4 tag eksik görünüyorsa otomatik draft change-set üretir; canlıya yazmaz.</p>
              </div>
              <button onClick={createGtmFixDraft} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">
                Tracking Fix Taslağı Oluştur
              </button>
            </div>
          )}
          {platform === "ga4" && !loading && !analysis?.error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">GA4 Admin config taslakları</p>
                <p className="text-xs font-medium text-slate-500">Conversion, audience ve custom dimension önerileri change-set olarak açılır; canlıya otomatik yazmaz.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => createGa4ConfigDraft("conversion_event")} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">
                  Conversion Taslağı
                </button>
                <button onClick={() => createGa4ConfigDraft("audience")} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white">
                  Audience Taslağı
                </button>
                <button onClick={() => createGa4ConfigDraft("custom_dimension")} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white">
                  Dimension Taslağı
                </button>
              </div>
            </div>
          )}
          {platform === "gsc" && !loading && !analysis?.error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">GSC indexleme taslakları</p>
                <p className="text-xs font-medium text-slate-500">Sitemap submit/delete ve indexing request change-set olarak açılır; canlıya otomatik yazmaz.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => createGscWriteDraft("sitemap_submit")} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">
                  Sitemap Submit
                </button>
                <button onClick={() => createGscWriteDraft("sitemap_delete")} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">
                  Sitemap Sil
                </button>
                <button onClick={() => createGscWriteDraft("indexing_request")} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white">
                  Indexing Taslağı
                </button>
              </div>
            </div>
          )}
          {platform === "merchant" && !loading && !analysis?.error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">Merchant attribute fix</p>
                <p className="text-xs font-medium text-slate-500">Feed issue veya eksik attribute için change-set taslağı açar; canlıya otomatik yazmaz.</p>
              </div>
              <button onClick={createMerchantAttributeFixDraft} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">
                Attribute Fix Taslağı
              </button>
            </div>
          )}
          {platform === "meta" && !loading && !analysis?.error && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">Meta diagnostics fix</p>
                <p className="text-xs font-medium text-slate-500">Pixel/CAPI eksikleri için secret sızdırmadan change-set taslağı açar.</p>
              </div>
              <button onClick={createMetaDiagnosticsDraft} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">
                Diagnostics Taslağı
              </button>
            </div>
          )}
          {!loading && !analysis?.error && platform !== "google_ads" && (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-xs font-bold text-indigo-900">AI öneri akışı: source="ai" change-set taslağı üretir, canlıya yazmaz.</p>
              <button onClick={createAiDraft} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white">
                AI Öner
              </button>
            </div>
          )}
          {actionMessage && <p className="mb-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{actionMessage}</p>}
          {loading ? (
            <p className="text-sm font-bold text-slate-400">Yükleniyor...</p>
          ) : analysis?.error ? (
            <EmptyState title="Analiz alınamadı." description={analysis.error} />
          ) : platform === "ga4" ? (
            <Ga4Analysis
              analysis={analysis}
              tenantKey={tenantKey}
              range={ga4Range}
              onRangeChange={setGa4Range}
              onDeleteDraft={createGa4DeleteDraft}
            />
          ) : platform === "gsc" ? (
            <GscAnalysis analysis={analysis} tenantKey={tenantKey} />
          ) : platform === "gtm" ? (
            <GtmAnalysis
              analysis={analysis}
              tenantKey={tenantKey}
              onDraftCreated={(message) => {
                setActionMessage(message);
                setActiveTab("changes");
              }}
            />
          ) : platform === "merchant" ? (
            <MerchantAnalysis
              analysis={analysis}
              tenantKey={tenantKey}
              onDraftCreated={(message) => {
                setActionMessage(message);
                setActiveTab("changes");
              }}
            />
          ) : platform === "meta" ? (
            <MetaAnalysis analysis={analysis} />
          ) : (
            <pre className="max-h-[420px] overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-300">
              {JSON.stringify(analysis ?? {}, null, 2)}
            </pre>
          )}
        </section>
      )}

      {activeTab === "changes" && <ChangeSetPanel tenantKey={tenantKey} platform={platform} />}

      {activeTab === "settings" && (
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Ayarlar</h2>
              <p className="text-sm font-medium text-slate-400">Kimlik ve OAuth ayarları Ayarlar ekranından yönetilir.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MerchantAnalysis({
  analysis,
  tenantKey,
  onDraftCreated,
}: {
  analysis: any;
  tenantKey: string;
  onDraftCreated: (message: string) => void;
}) {
  const products = Array.isArray(analysis?.products) ? analysis.products : [];
  const statuses = Array.isArray(analysis?.productStatuses) ? analysis.productStatuses : [];
  const issues = Array.isArray(analysis?.issues) ? analysis.issues : [];
  const accountStatuses = Array.isArray(analysis?.accountStatuses) ? analysis.accountStatuses : [];
  const feedSuggestions = Array.isArray(analysis?.feedSuggestions) ? analysis.feedSuggestions : [];
  const datafeeds = Array.isArray(analysis?.datafeeds) ? analysis.datafeeds : [];
  const duplicateDatafeeds = Array.isArray(analysis?.duplicateDatafeeds) ? analysis.duplicateDatafeeds : [];
  const accountIssues = Array.isArray(analysis?.accountHealth?.issues) ? analysis.accountHealth.issues : [];
  const [merchantBusy, setMerchantBusy] = useState(false);

  async function createSuggestionDraft(suggestion: any) {
    if (!tenantKey || !suggestion?.updates) return;
    setMerchantBusy(true);
    try {
      await marketing.createMerchantAttributeFixDraft(tenantKey, { suggestionId: suggestion.id });
      onDraftCreated(`Merchant öneri taslağı oluşturuldu: ${suggestion.title}`);
    } finally {
      setMerchantBusy(false);
    }
  }

  async function createIssueDraft(productId: string) {
    if (!tenantKey || !productId) return;
    const ok = window.confirm("Bu ürün için manuel attribute fix change-set taslağı oluşturulsun mu?");
    if (!ok) return;
    setMerchantBusy(true);
    try {
      await marketing.createMerchantAttributeFixDraft(tenantKey, {
        productId,
        updates: { condition: "used" },
        attribute: "condition",
      });
      onDraftCreated(`Merchant ürün taslağı oluşturuldu: ${productId}`);
    } finally {
      setMerchantBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Ürün" value={String(products.length)} icon={<ShoppingBag size={18} />} description="İlk 25 kayıt" />
        <MetricCard label="Status" value={String(statuses.length)} icon={<ShieldCheck size={18} />} description="Product status" />
        <MetricCard label="Öneri" value={String(feedSuggestions.length)} icon={<Target size={18} />} description="Feed rule" />
        <MetricCard label="Datafeed" value={String(datafeeds.length)} icon={<RefreshCw size={18} />} description={`${duplicateDatafeeds.length} mükerrer`} />
      </div>
      {analysis?.error && <EmptyState title="Merchant analizi eksik." description={analysis.error} />}

      <div className="space-y-4">
        <Ga4Table
          title="Feed Önerileri"
          columns={["Öneri", "Etkilenen", "Seviye", "Aksiyon"]}
          rows={feedSuggestions.map((row: any) => [
            row?.title ?? row?.id ?? "-",
            row?.count ?? 0,
            row?.severity ?? "-",
            row?.updates ? (
              <button
                onClick={() => createSuggestionDraft(row)}
                disabled={merchantBusy}
                className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-black text-brand-700 disabled:opacity-50"
              >
                Taslak
              </button>
            ) : "Uyarı",
          ])}
        />
        <Ga4Table
          title="Account Health"
          columns={["Account", "Issue"]}
          rows={accountIssues.map((row: any) => [row?.accountId ?? analysis?.merchantId ?? "-", JSON.stringify(row?.issue ?? {}).slice(0, 160)])}
          error={analysis?.accountStatusesError}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Ga4Table
          title="Ürün Feed"
          columns={["ID", "Başlık", "Condition", "Fiyat"]}
          rows={products.map((row: any) => [row?.id ?? row?.offerId ?? "-", row?.title ?? "-", row?.condition ?? "-", row?.price?.value ?? "-"])}
          error={analysis?.productsError}
        />
        <Ga4Table
          title="Item Issues"
          columns={["Ürün", "Issue", "Aksiyon"]}
          rows={issues.map((row: any) => [
            row?.productId ?? "-",
            JSON.stringify(row?.issue ?? {}).slice(0, 160),
            row?.productId ? (
              <button
                onClick={() => createIssueDraft(row.productId)}
                disabled={merchantBusy}
                className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-black text-brand-700 disabled:opacity-50"
              >
                Düzelt
              </button>
            ) : "-",
          ])}
          error={analysis?.productStatusesError}
        />
        <Ga4Table
          title="Product Status"
          columns={["Ürün", "Destination", "Status"]}
          rows={statuses.map((row: any) => [
            row?.productId ?? "-",
            JSON.stringify(row?.destinationStatuses ?? []).slice(0, 120),
            row?.creationDate ?? row?.lastUpdateDate ?? "-",
          ])}
        />
        <Ga4Table
          title="Datafeeds"
          columns={["ID", "Ad", "Target", "Durum"]}
          rows={datafeeds.map((row: any) => [
            row?.id ?? row?.datafeedId ?? "-",
            row?.name ?? "-",
            JSON.stringify(row?.targets ?? []).slice(0, 120),
            duplicateDatafeeds.some((dupe: any) => String(dupe?.id) === String(row?.id)) ? "Mükerrer" : "Aktif",
          ])}
          error={analysis?.datafeedsError}
        />
      </div>
    </div>
  );
}

function MetaAnalysis({ analysis }: { analysis: any }) {
  const checks = Array.isArray(analysis?.checks) ? analysis.checks : [];
  const recommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Pixel" value={analysis?.pixelId || "Eksik"} icon={<MousePointerClick size={18} />} description="Maskeli ID" />
        <MetricCard label="CAPI Token" value={analysis?.hasCapiToken ? "Hazır" : "Eksik"} icon={<ShieldCheck size={18} />} description="Secret saklı" />
        <MetricCard label="Test Code" value={analysis?.hasTestEventCode ? "Hazır" : "Yok"} icon={<Target size={18} />} description="Debug" />
        <MetricCard label="Öneri" value={String(recommendations.length)} icon={<RefreshCw size={18} />} description="Diagnostics" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Ga4Table
          title="Diagnostics"
          columns={["Kontrol", "Durum", "Mesaj"]}
          rows={checks.map((row: any) => [row?.label ?? row?.key ?? "-", row?.ok ? "Ok" : "Eksik", row?.message ?? "-"])}
        />
        <Ga4Table
          title="Öneriler"
          columns={["Alan", "Başlık", "Mesaj"]}
          rows={recommendations.map((row: any) => [row?.key ?? "-", row?.title ?? "-", row?.message ?? "-"])}
        />
      </div>
    </div>
  );
}

function getDimension(row: any, index: number) {
  return row?.dimensionValues?.[index]?.value ?? "-";
}

function getMetric(row: any, index: number) {
  return row?.metricValues?.[index]?.value ?? "0";
}

function getGscKey(row: any, index: number) {
  return row?.keys?.[index] ?? "-";
}

function formatPercent(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : "0%";
}

function formatPosition(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toFixed(1) : "0.0";
}

function formatShortDate(value: unknown) {
  const raw = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw.slice(8, 10)}.${raw.slice(5, 7)}`;
  }
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(6, 8)}.${raw.slice(4, 6)}`;
  }
  return raw || "-";
}

function GtmAnalysis({
  analysis,
  tenantKey,
  onDraftCreated,
}: {
  analysis: any;
  tenantKey: string;
  onDraftCreated: (message: string) => void;
}) {
  if (analysis?.needsAccountPath) {
    return <EmptyState title="GTM container path gerekli" description={analysis.message ?? "Container path cozulemedi."} />;
  }
  const tags = Array.isArray(analysis?.tags) ? analysis.tags : [];
  const triggers = Array.isArray(analysis?.triggers) ? analysis.triggers : [];
  const variables = Array.isArray(analysis?.variables) ? analysis.variables : [];
  const builtInVariables = Array.isArray(analysis?.builtInVariables) ? analysis.builtInVariables : [];
  const versions = Array.isArray(analysis?.versions) ? analysis.versions : [];
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [diff, setDiff] = useState<any>(null);
  const [gtmBusy, setGtmBusy] = useState(false);
  const desiredBuiltIns = ["pageUrl", "pagePath", "event", "clickElement", "clickClasses", "clickId", "clickText"];
  const enabledBuiltIns = new Set(builtInVariables.map((item: any) => String(item?.type ?? item?.name ?? "")));
  const missingBuiltIns = desiredBuiltIns.filter((type) => !enabledBuiltIns.has(type));

  const paramVal = (tag: any, key: string) =>
    (tag?.parameter ?? []).find((p: any) => p?.key === key)?.value ?? "-";

  // Çift GA4 tag tespiti — aynı ölçüm ID'si (G-...) birden çok KONFİG tag'inde (page_view)
  // varsa çift sayım riski. SADECE config tag türleri sayılır: googtag (Google Tag) ve
  // gaawc (GA4 Config). GA4 Event tag'i (gaawe, ör. "Scroll Depth") config ile AYNI ölçüm
  // ID'sini paylaşır — bu NORMAL, çift sayım değil → sayma (yoksa yanlış-pozitif uyarı çıkar).
  const gaTagMeasurement = (t: any): string | null => {
    const type = String(t?.type ?? "").toLowerCase();
    if (type !== "googtag" && type !== "gaawc") return null;
    for (const k of ["tagId", "measurementId", "measurementIdOverride"]) {
      const v = (t?.parameter ?? []).find((p: any) => p?.key === k)?.value;
      if (typeof v === "string" && /^G-/i.test(v.trim())) return v.trim().toUpperCase();
    }
    return null;
  };
  const ga4Counts = tags.reduce((acc: Record<string, number>, t: any) => {
    const id = gaTagMeasurement(t);
    if (id) acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const duplicateGa4 = Object.entries(ga4Counts).filter(([, n]) => (n as number) > 1);
  const ga4TagTotal = Object.values(ga4Counts).reduce((a: number, b) => a + (b as number), 0);
  const triggerEvent = (t: any) =>
    (t?.customEventFilter?.[0]?.parameter ?? []).find((p: any) => p?.key === "arg1")?.value ?? "-";
  const versionId = (version: any) => String(version?.containerVersionId ?? version?.versionId ?? "").trim();
  const entityName = (entity: any) => entity?.name ?? entity?.type ?? entity?.tagId ?? entity?.triggerId ?? entity?.variableId ?? "-";

  async function createRollbackDraft(version: any) {
    const id = versionId(version);
    if (!id || !tenantKey) return;
    const ok = window.confirm(`GTM v${id} sürümüne rollback change-set taslağı oluşturulsun mu? Apply edilirse canlı container etkilenir.`);
    if (!ok) return;
    setGtmBusy(true);
    try {
      await marketing.createGtmRollbackDraft(tenantKey, {
        versionId: id,
        versionPath: version?.path,
        versionName: version?.name,
      });
      onDraftCreated(`GTM rollback taslağı oluşturuldu: v${id}`);
    } finally {
      setGtmBusy(false);
    }
  }

  async function createBuiltInDraft(types: string[]) {
    if (!tenantKey || types.length === 0) return;
    setGtmBusy(true);
    try {
      await marketing.createGtmBuiltInVariablesDraft(tenantKey, types, typeof analysis?.container === "string" ? analysis.container : undefined);
      onDraftCreated(`GTM built-in variable taslağı oluşturuldu: ${types.join(", ")}`);
    } catch (err) {
      onDraftCreated((err as Error).message);
    } finally {
      setGtmBusy(false);
    }
  }

  async function compareVersions() {
    if (!tenantKey || !versionA || !versionB) return;
    setGtmBusy(true);
    try {
      const res = await marketing.gtmVersionDiff(tenantKey, versionA, versionB);
      setDiff(res.diff);
    } finally {
      setGtmBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {duplicateGa4.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-xs font-black text-rose-800">
            ⚠️ Çift GA4 tag — çift sayım riski: {duplicateGa4.map(([id, n]) => `${id} (${n}×)`).join(", ")}. Aynı ölçüm ID'si birden çok Google Tag'de tetikleniyor; GTM'de fazlalığı sil/duraklat.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Tag" value={String(tags.length)} icon={<Tags size={18} />} description={analysis?.workspace?.name ?? "Workspace"} />
        <MetricCard label="Trigger" value={String(triggers.length)} icon={<MousePointerClick size={18} />} description="Tetikleyici" />
        <MetricCard label="Variable" value={String(variables.length)} icon={<Settings size={18} />} description="Değişken" />
        <MetricCard label="Built-in" value={String(builtInVariables.length)} icon={<ShieldCheck size={18} />} description={`${missingBuiltIns.length} eksik`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Built-in Variables</p>
              <p className="text-xs font-medium text-slate-500">Click/Page/Event değişkenleri change-set ile etkinleştirilir.</p>
            </div>
            <button
              onClick={() => createBuiltInDraft(missingBuiltIns)}
              disabled={gtmBusy || missingBuiltIns.length === 0}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              Eksikleri Etkinleştir
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {desiredBuiltIns.map((type) => (
              <span
                key={type}
                className={`rounded-lg px-2 py-1 text-[10px] font-black ${enabledBuiltIns.has(type) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Version Diff</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select value={versionA} onChange={(e) => setVersionA(e.target.value)} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <option value="">Eski sürüm</option>
              {versions.map((version: any) => (
                <option key={`a-${versionId(version)}`} value={versionId(version)}>
                  v{versionId(version)} {version?.name ?? ""}
                </option>
              ))}
            </select>
            <select value={versionB} onChange={(e) => setVersionB(e.target.value)} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <option value="">Yeni sürüm</option>
              {versions.map((version: any) => (
                <option key={`b-${versionId(version)}`} value={versionId(version)}>
                  v{versionId(version)} {version?.name ?? ""}
                </option>
              ))}
            </select>
            <button onClick={compareVersions} disabled={gtmBusy || !versionA || !versionB} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
              Karşılaştır
            </button>
          </div>
        </div>
      </div>

      {diff && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {(["tags", "triggers", "variables"] as const).map((kind) => (
            <Ga4Table
              key={kind}
              title={`Diff: ${kind}`}
              columns={["Tip", "Ad"]}
              rows={[
                ...(diff?.[kind]?.added ?? []).map((item: any) => ["Eklendi", entityName(item)]),
                ...(diff?.[kind]?.removed ?? []).map((item: any) => ["Silindi", entityName(item)]),
                ...(diff?.[kind]?.changed ?? []).map((item: any) => ["Değişti", entityName(item.after)]),
              ]}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Ga4Table
          title="Tag'ler"
          columns={["Ad", "Tip", "Event / ID", "Trigger"]}
          rows={tags.map((t: any) => [
            t?.name ?? "-",
            t?.type ?? "-",
            paramVal(t, "eventName") !== "-" ? paramVal(t, "eventName") : paramVal(t, "tagId"),
            (t?.firingTriggerId ?? []).join(", ") || "-",
          ])}
        />
        <Ga4Table
          title="Trigger'lar"
          columns={["Ad", "Tip", "Event adı"]}
          rows={triggers.map((t: any) => [t?.name ?? "-", t?.type ?? "-", triggerEvent(t)])}
        />
        <Ga4Table
          title="Yayınlanan Versiyonlar"
          columns={["#", "Ad", "Tag", "Aksiyon"]}
          rows={versions.map((v: any) => [
            v?.containerVersionId ?? "-",
            v?.name ?? "-",
            v?.numTags ?? "0",
            versionId(v) ? (
              <button
                onClick={() => createRollbackDraft(v)}
                disabled={gtmBusy}
                className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700 disabled:opacity-50"
              >
                Rollback
              </button>
            ) : "-",
          ])}
        />
        <Ga4Table
          title="Aktif Built-in Variables"
          columns={["Tip", "Ad"]}
          rows={builtInVariables.map((row: any) => [row?.type ?? "-", row?.name ?? "-"])}
        />
      </div>
    </div>
  );
}

function GscAnalysis({ analysis, tenantKey }: { analysis: any; tenantKey: string }) {
  const topQueries = Array.isArray(analysis?.topQueries) ? analysis.topQueries : [];
  const topPages = Array.isArray(analysis?.topPages) ? analysis.topPages : [];
  const queryPageRows = Array.isArray(analysis?.queryPageRows) ? analysis.queryPageRows : [];
  const opportunities = Array.isArray(analysis?.ctrOpportunities) ? analysis.ctrOpportunities : [];
  const sitemaps = Array.isArray(analysis?.coverage?.sitemaps) ? analysis.coverage.sitemaps : [];
  const [analyticsState, setAnalyticsState] = useState<any>(analysis?.analytics ?? null);
  const [indexState, setIndexState] = useState<any>(analysis?.index ?? null);
  const [range, setRange] = useState(28);
  const [searchType, setSearchType] = useState("web");
  const [drilldown, setDrilldown] = useState<{ page: string; rows: any[]; error?: string } | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const fallbackTotals = topQueries.reduce(
    (acc: { clicks: number; impressions: number }, row: any) => ({
      clicks: acc.clicks + Number(row?.clicks ?? 0),
      impressions: acc.impressions + Number(row?.impressions ?? 0),
    }),
    { clicks: 0, impressions: 0 },
  );
  const analytics = analyticsState ?? analysis?.analytics ?? {};
  const analyticsTotals = analytics?.totals?.current ?? {};
  const deltaPct = analytics?.totals?.deltaPct ?? {};
  const deviceRows = Array.isArray(analytics?.deviceRows) ? analytics.deviceRows : Array.isArray(analysis?.deviceRows) ? analysis.deviceRows : [];
  const countryRows = Array.isArray(analytics?.countryRows) ? analytics.countryRows : [];
  const dateRows = Array.isArray(analytics?.dateRows) ? analytics.dateRows : [];
  const metricValue = (key: "clicks" | "impressions" | "ctr" | "position") => {
    const current = Number(analyticsTotals?.[key] ?? (key === "clicks" ? fallbackTotals.clicks : key === "impressions" ? fallbackTotals.impressions : 0));
    const suffix = key === "ctr" ? "%" : "";
    const base = key === "ctr" ? (current * 100).toFixed(1) : key === "position" ? current.toFixed(1) : String(Math.round(current));
    const change = deltaPct?.[key];
    return change == null || !Number.isFinite(Number(change)) ? `${base}${suffix}` : `${base}${suffix} (${change >= 0 ? "+" : ""}${Number(change).toFixed(1)}%)`;
  };

  useEffect(() => {
    setAnalyticsState(analysis?.analytics ?? null);
    setIndexState(analysis?.index ?? null);
    setDrilldown(null);
  }, [analysis]);

  async function reloadAnalytics(nextRange = range, nextType = searchType) {
    if (!tenantKey) return;
    setGscLoading(true);
    try {
      const next = await marketing.gscAnalytics(tenantKey, nextRange, nextType);
      setRange(nextRange);
      setSearchType(nextType);
      setAnalyticsState(next);
    } finally {
      setGscLoading(false);
    }
  }

  async function loadPageQueries(page: string) {
    if (!tenantKey || !page) return;
    setGscLoading(true);
    try {
      const result = await marketing.gscPageQueries(tenantKey, page, range);
      setDrilldown({ page, rows: Array.isArray(result?.rows) ? result.rows : [] });
    } catch (err) {
      setDrilldown({ page, rows: [], error: (err as Error).message });
    } finally {
      setGscLoading(false);
    }
  }

  async function refreshIndex(force = false) {
    if (!tenantKey) return;
    setGscLoading(true);
    try {
      await marketing.refreshGscIndex(tenantKey, { force, limit: 100 });
      const next = await marketing.gscIndex(tenantKey, 300);
      setIndexState(next);
    } finally {
      setGscLoading(false);
    }
  }

  const indexSummary = indexState?.summary ?? {};
  const indexItems = Array.isArray(indexState?.items) ? indexState.items : [];

  // İndexlenmeyen sayfaları sebebe göre grupla + düzeltme yolu (otomasyon/site) öner.
  const isIndexedRow = (row: any) => {
    const v = String(row?.verdict ?? "");
    const cs = String(row?.coverage_state ?? "").toLowerCase();
    return v === "PASS" || cs.includes("indexed");
  };
  const fixPath = (coverageState: string): { type: string; tone: string; hint: string } => {
    const s = String(coverageState ?? "").toLowerCase();
    if (s.includes("noindex")) return { type: "Otomasyon + Site", tone: "amber", hint: "Sitemap'ten çıkar (change-set). İndexlenmesi isteniyorsa site'da noindex meta/header kaldır." };
    if (s.includes("soft 404")) return { type: "Site", tone: "rose", hint: "Boş/içeriksiz sayfa — gerçek içerik ekle ya da 404/301 ver (locale fallback)." };
    if (s.includes("duplicate")) return { type: "Site", tone: "rose", hint: "Canonical URL'yi düzelt; yinelenen içerik sinyallerini gider." };
    if (s.includes("redirect")) return { type: "Site", tone: "amber", hint: "Sitemap/canonical final URL ile hizalansın." };
    if (s.includes("discovered")) return { type: "Site + Otomasyon", tone: "amber", hint: "İç link güçlendir + sitemap yeniden gönder (crawl bütçesi)." };
    if (s.includes("crawled")) return { type: "Site", tone: "amber", hint: "İçerik kalitesi/canonical/robots sinyallerini gözden geçir." };
    if (s.includes("unknown")) return { type: "Site + Otomasyon", tone: "amber", hint: "Google henüz keşfetmemiş — sitemap'e ekle + iç link ver (özellikle dönüşüm sayfaları)." };
    return { type: "İncele", tone: "slate", hint: "URL Inspection detayına bak." };
  };
  const notIndexedItems = indexItems.filter((row: any) => !isIndexedRow(row));
  const notIndexedGroups = Object.values(
    notIndexedItems.reduce((acc: Record<string, any>, row: any) => {
      const reason = String(row?.status_text || row?.coverage_state || "Bilinmiyor");
      if (!acc[reason]) acc[reason] = { reason, coverageState: row?.coverage_state ?? reason, recommendation: row?.recommendation ?? "", urls: [] as string[] };
      acc[reason].urls.push(row?.url ?? "-");
      return acc;
    }, {}),
  ).sort((a: any, b: any) => b.urls.length - a.urls.length) as any[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Tıklama" value={metricValue("clicks")} icon={<Search size={18} />} description={`${range}g / önceki dönem`} />
        <MetricCard label="Gösterim" value={metricValue("impressions")} icon={<Search size={18} />} description={`${searchType} araması`} />
        <MetricCard label="CTR" value={metricValue("ctr")} icon={<Target size={18} />} description="Weighted" />
        <MetricCard label="Pozisyon" value={metricValue("position")} icon={<ShieldCheck size={18} />} description="Ortalama" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Arama performansı</p>
          <p className="text-xs font-medium text-slate-500">Range ve arama tipi Search Console read endpointinden yeniden alınır.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[7, 28, 90].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => reloadAnalytics(item, searchType)}
              disabled={gscLoading}
              className={`rounded-xl px-3 py-2 text-xs font-black ${range === item ? "bg-brand-600 text-white" : "bg-white text-slate-700"}`}
            >
              {item}g
            </button>
          ))}
          {["web", "image", "video", "news"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => reloadAnalytics(range, item)}
              disabled={gscLoading}
              className={`rounded-xl px-3 py-2 text-xs font-black ${searchType === item ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <GscPerformanceCharts dateRows={dateRows} deviceRows={deviceRows} />

      <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Index Coverage</p>
            <p className="text-xs font-medium text-slate-500">URL Inspection cache: 24 saatten yeni kayıtlar yeniden sorgulanmaz.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => refreshIndex(false)} disabled={gscLoading} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
              Yeniden Tara
            </button>
            <button onClick={() => refreshIndex(true)} disabled={gscLoading} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">
              Force
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Indexed" value={String(indexSummary.indexed ?? 0)} icon={<ShieldCheck size={18} />} description="PASS" />
          <MetricCard label="Not Indexed" value={String(indexSummary.not_indexed ?? 0)} icon={<Search size={18} />} description="Crawled/Discovered" />
          <MetricCard label="Issue" value={String(indexSummary.issue ?? 0)} icon={<Target size={18} />} description="Noindex/Duplicate" />
          <MetricCard label="Unknown" value={String(indexSummary.unknown ?? 0)} icon={<RefreshCw size={18} />} description="Kontrol gerekli" />
        </div>
      </div>

      {/* İndexlenmeyen sayfalar — sebep + düzeltme yolu */}
      <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
        <div>
          <p className="text-sm font-black text-slate-900">İndexlenmeyen Sayfalar — Sebep & Düzeltme</p>
          <p className="text-xs font-medium text-slate-500">
            Taranmış {indexItems.length} URL'den {notIndexedItems.length} tanesi dizinde değil. Sebebe göre gruplu; düzeltme otomasyon (sitemap change-set) veya site (kod) ile yapılır. Daha fazla URL için "Yeniden Tara".
          </p>
        </div>
        {notIndexedGroups.length === 0 ? (
          <p className="rounded-xl bg-white px-3 py-4 text-center text-sm font-bold text-emerald-600">
            {indexItems.length === 0 ? "Henüz tarama yok — 'Yeniden Tara' ile URL Inspection çalıştır." : "İndexlenmeyen sayfa yok — hepsi dizinde ✓"}
          </p>
        ) : (
          notIndexedGroups.map((group: any) => {
            const fp = fixPath(group.coverageState);
            const toneCls =
              fp.tone === "rose" ? "bg-rose-100 text-rose-700" : fp.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
            const shown = group.urls.slice(0, 12);
            return (
              <div key={group.reason} className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-black text-white">{group.reason}</span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700">{group.urls.length} URL</span>
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${toneCls}`}>Düzeltme: {fp.type}</span>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-600">{group.recommendation || fp.hint}</p>
                {fp.hint && group.recommendation && <p className="mt-1 text-[11px] font-medium text-slate-400">Yol: {fp.hint}</p>}
                <ul className="mt-2 space-y-0.5">
                  {shown.map((url: string) => (
                    <li key={url} className="truncate text-[11px] font-medium text-slate-500">
                      <a href={url} target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline">{url}</a>
                    </li>
                  ))}
                  {group.urls.length > shown.length && (
                    <li className="text-[11px] font-bold text-slate-400">+{group.urls.length - shown.length} daha…</li>
                  )}
                </ul>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-4">
        <GscTable
          title="Index URL'leri"
          columns={["URL", "Durum", "Coverage", "Öneri", "Kontrol"]}
          widths={["minmax(0,2fr)", "110px", "minmax(0,1fr)", "minmax(0,1fr)", "120px"]}
          rows={indexItems.map((row: any) => [
            row?.url ?? "-",
            row?.status_text ?? row?.verdict ?? "-",
            row?.coverage_state ?? "-",
            row?.recommendation ?? "-",
            row?.checked_at ? new Date(row.checked_at).toLocaleString("tr-TR") : "-",
          ])}
          error={indexState?.error}
        />
        <GscTable
          title="Günlük Seri"
          columns={["Tarih", "Tık", "Gösterim", "CTR", "Pozisyon"]}
          widths={["minmax(0,1fr)", "90px", "100px", "80px", "90px"]}
          rows={dateRows.map((row: any) => [
            getGscKey(row, 0),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="Ülke Kırılımı"
          columns={["Ülke", "Tık", "Gösterim", "CTR", "Pozisyon"]}
          widths={["minmax(0,1fr)", "90px", "100px", "80px", "90px"]}
          rows={countryRows.map((row: any) => [
            getGscKey(row, 0),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="CTR Fırsatları"
          columns={["Query / Page", "Tık", "Gösterim", "CTR", "Pozisyon"]}
          widths={["minmax(0,2.2fr)", "90px", "100px", "80px", "90px"]}
          rows={opportunities.map((row: any) => [
            [getGscKey(row, 0), getGscKey(row, 1)].filter((value) => value && value !== "-").join(" → "),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="Top Queries"
          columns={["Query", "Tık", "Gösterim", "CTR", "Pozisyon"]}
          widths={["minmax(0,2fr)", "90px", "100px", "80px", "90px"]}
          rows={topQueries.map((row: any) => [
            getGscKey(row, 0),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="Top Pages"
          columns={["Page", "Tık", "Gösterim", "CTR", "Aksiyon"]}
          widths={["minmax(0,2.2fr)", "90px", "100px", "80px", "105px"]}
          rows={topPages.map((row: any) => [
            getGscKey(row, 0),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            <button className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-black text-brand-700" onClick={() => loadPageQueries(getGscKey(row, 0))}>
              Sorgular
            </button>,
          ])}
        />
        {drilldown && (
          <GscTable
            title={`Sayfa Sorguları: ${drilldown.page}`}
            columns={["Query", "Tık", "Gösterim", "CTR", "Pozisyon"]}
            widths={["minmax(0,2fr)", "90px", "100px", "80px", "90px"]}
            rows={drilldown.rows.map((row: any) => [
              getGscKey(row, 0),
              row?.clicks ?? 0,
              row?.impressions ?? 0,
              formatPercent(row?.ctr),
              formatPosition(row?.position),
            ])}
            error={drilldown.error}
          />
        )}
        <GscTable
          title="Cihaz Kırılımı"
          columns={["Cihaz", "Tık", "Gösterim", "CTR", "Pozisyon"]}
          widths={["minmax(0,1fr)", "90px", "100px", "80px", "90px"]}
          rows={deviceRows.map((row: any) => [
            getGscKey(row, 0),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPercent(row?.ctr),
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="Query + Page"
          columns={["Query", "Page", "Tık", "Gösterim", "Pozisyon"]}
          widths={["minmax(0,1.2fr)", "minmax(0,1.8fr)", "90px", "100px", "90px"]}
          rows={queryPageRows.map((row: any) => [
            getGscKey(row, 0),
            getGscKey(row, 1),
            row?.clicks ?? 0,
            row?.impressions ?? 0,
            formatPosition(row?.position),
          ])}
        />
        <GscTable
          title="Coverage / Sitemap"
          columns={["Sitemap", "Tip", "Son Gönderim"]}
          widths={["minmax(0,2fr)", "120px", "140px"]}
          rows={sitemaps.map((row: any) => [row?.path ?? row?.sitemap ?? "-", row?.type ?? "-", row?.lastSubmitted ?? row?.lastDownloaded ?? "-"])}
          error={analysis?.coverage?.sitemapError}
        />
      </div>
    </div>
  );
}

function GscTable({
  title,
  columns,
  widths,
  rows,
  error,
}: {
  title: string;
  columns: string[];
  widths: string[];
  rows: Array<Array<ReactNode>>;
  error?: string | null;
}) {
  const gridTemplateColumns = widths.join(" ");
  const minWidth = widths.length >= 5 ? 720 : 520;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {error && <p className="mt-1 text-xs font-bold text-amber-600">{error}</p>}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm font-bold text-slate-500">Veri yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth }}>
            <div
              className="grid gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400"
              style={{ gridTemplateColumns }}
            >
              {columns.map((column) => (
                <span key={column} className="truncate">
                  {column}
                </span>
              ))}
            </div>
            <div className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <div
                  key={`${title}-${index}`}
                  className="grid items-center gap-2 px-3 py-2 text-[11px] font-bold leading-tight text-slate-700"
                  style={{ gridTemplateColumns }}
                >
                  {row.map((cell, cellIndex) => (
                    <span key={`${title}-${index}-${cellIndex}`} className="min-w-0 truncate">
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function GscPerformanceCharts({ dateRows, deviceRows }: { dateRows: any[]; deviceRows: any[] }) {
  const trendRows = dateRows.map((row) => ({
    date: formatShortDate(getGscKey(row, 0)),
    clicks: Number(row?.clicks ?? 0),
    impressions: Number(row?.impressions ?? 0),
    ctr: Number(row?.ctr ?? 0) * 100,
  }));
  const pieColors = ["var(--brand-600)", "var(--status-info)", "var(--status-success)", "var(--status-warning)"];
  const deviceChartRows = deviceRows
    .map((row) => ({
      name: String(getGscKey(row, 0) || "Bilinmiyor").toUpperCase(),
      value: Number(row?.clicks ?? 0),
      impressions: Number(row?.impressions ?? 0),
    }))
    .filter((row) => row.value > 0 || row.impressions > 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <section className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="mb-3">
          <h3 className="text-sm font-black text-slate-900">Tıklama İzleme</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">Günlük tıklama ve gösterim trendi.</p>
        </div>
        {trendRows.length === 0 ? (
          <p className="py-12 text-center text-sm font-bold text-slate-400">Grafik verisi yok.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendRows} margin={{ top: 10, right: 18, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="var(--surface-100)" vertical={false} />
                <XAxis
                  dataKey="date"
                  minTickGap={16}
                  tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--surface-100)", fontSize: 12, fontWeight: 700 }}
                  formatter={(value, name) => [Number(value).toLocaleString("tr-TR"), name === "clicks" ? "Tıklama" : "Gösterim"]}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800, paddingTop: 8 }} />
                <Line yAxisId="left" type="monotone" dataKey="clicks" name="Tıklama" stroke="var(--brand-600)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="impressions" name="Gösterim" stroke="var(--status-info)" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="mb-3">
          <h3 className="text-sm font-black text-slate-900">Cihaz Dağılımı</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">Tıklama payına göre cihazlar.</p>
        </div>
        {deviceChartRows.length === 0 ? (
          <p className="py-12 text-center text-sm font-bold text-slate-400">Cihaz verisi yok.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceChartRows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? "-"} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceChartRows.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--surface-100)", fontSize: 12, fontWeight: 700 }}
                  formatter={(value) => [Number(value).toLocaleString("tr-TR"), "Tıklama"]}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function Ga4Analysis({
  analysis,
  tenantKey,
  range,
  onRangeChange,
  onDeleteDraft,
}: {
  analysis: any;
  tenantKey: string;
  range: 7 | 28 | 90;
  onRangeChange: (range: 7 | 28 | 90) => void;
  onDeleteDraft: (kind: "delete_key_event" | "delete_audience" | "delete_custom_dimension", resourceName: string) => void;
}) {
  const totals = analysis?.totals ?? {};
  const deepTotals = analysis?.deepReport?.totals ?? {};
  const funnelSteps = Array.isArray(analysis?.funnel?.steps) ? analysis.funnel.steps : [];
  const funnelWarnings = Array.isArray(analysis?.funnel?.warnings) ? analysis.funnel.warnings : [];
  const config = analysis?.config ?? {};
  const topPages = Array.isArray(analysis?.topPages) ? analysis.topPages : [];
  const channelFunnel = Array.isArray(analysis?.channelFunnel) ? analysis.channelFunnel : [];
  const conversionEvents = Array.isArray(analysis?.conversionEvents) ? analysis.conversionEvents : [];
  const realtimeRows = Array.isArray(analysis?.realtimeRows) ? analysis.realtimeRows : [];
  const realtimeDetailRows = Array.isArray(analysis?.realtimeDetail?.rows) ? analysis.realtimeDetail.rows : [];
  const activeRealtimeUsers = realtimeRows.reduce((sum: number, row: any) => sum + Number(getMetric(row, 0) || 0), 0);

  // Tenant analitik tipi: lead-gen tenant'larda e-ticaret yerine lead odakli gosterim.
  const isLead = analysis?.analyticsType === "lead";
  const LEAD_EVENTS = ["generate_lead", "whatsapp_click", "phone_click", "form_submit", "contact"];
  const leadRows = conversionEvents.filter((row: any) => LEAD_EVENTS.includes(String(getDimension(row, 0))));
  const leadTotal = leadRows.reduce((sum: number, row: any) => sum + Number(getMetric(row, 0) || 0), 0);
  const leadConversions = leadRows.reduce((sum: number, row: any) => sum + Number(getMetric(row, 1) || 0), 0);

  const metricDelta = (key: string) => {
    const item = deepTotals[key];
    if (!item) return "-";
    const delta = item.deltaPct == null ? "" : ` (${item.deltaPct >= 0 ? "+" : ""}${item.deltaPct.toFixed(1)}%)`;
    return `${Number(item.current ?? 0).toFixed(key.includes("Rate") ? 2 : 0)}${delta}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-black text-slate-900">GA4 zaman aralığı</p>
          <p className="text-xs font-bold text-slate-400">Detaylı rapor, funnel ve ziyaret istatistikleri birlikte güncellenir.</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {[7, 28, 90].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onRangeChange(value as 7 | 28 | 90)}
              className={`rounded-lg px-3 py-2 text-xs font-black transition-all ${
                range === value ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {value}g
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Oturum" value={metricDelta("sessions") || String(totals.sessions ?? 0)} icon={<BarChart3 size={18} />} description={`${range}g / önceki dönem`} />
        <MetricCard label="Aktif Kullanıcı" value={metricDelta("activeUsers") || String(totals.activeUsers ?? 0)} icon={<BarChart3 size={18} />} description={`${range}g / önceki dönem`} />
        {isLead ? (
          <MetricCard label="Toplam Lead" value={String(leadTotal)} icon={<Target size={18} />} description={`${leadConversions} dönüşüm · form/WhatsApp/tel`} />
        ) : (
          <MetricCard label="Revenue" value={metricDelta("purchaseRevenue")} icon={<ShoppingBag size={18} />} description="E-ticaret" />
        )}
        <MetricCard label="Realtime" value={String(activeRealtimeUsers)} icon={<RefreshCw size={18} />} description="Aktif kullanıcı" />
      </div>

      {!isLead && funnelWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs font-black text-amber-800">{funnelWarnings.join(" · ")}</p>
        </div>
      )}

      <Ga4VisitStatsSection visitStats={analysis?.visitStats} />
      {!isLead && <Ga4FunnelChart steps={funnelSteps} />}
      {!isLead && tenantKey && <Ga4FunnelTrendChart tenantKey={tenantKey} />}

      <div className="space-y-4">
        {isLead ? (
          <Ga4Table
            title="Lead Dönüşümleri"
            columns={["Event", "Sayı", "Dönüşüm"]}
            rows={
              leadRows.length
                ? leadRows.map((row: any) => [getDimension(row, 0), getMetric(row, 0), getMetric(row, 1)])
                : []
            }
            error={leadRows.length ? undefined : "Henüz lead event'i yok (form_submit/phone_click site'a eklenince dolacak)."}
          />
        ) : (
          <Ga4Table
            title="E-ticaret Funnel"
            columns={["Adım", "Sayı", "Önceki", "Drop-off"]}
            rows={funnelSteps.map((row: any) => [
              row.step,
              row.count,
              row.previous,
              row.dropOffPct == null ? "-" : `%${row.dropOffPct.toFixed(1)}`,
            ])}
            error={analysis?.funnel?.error}
          />
        )}
        <Ga4Table
          title="Kaynak / Kanal"
          columns={["Source / Medium", "Kanal", "Oturum", "User", "Conv."]}
          rows={(analysis?.deepReport?.sources ?? []).map((row: any) => [
            getDimension(row, 0),
            getDimension(row, 1),
            getMetric(row, 0),
            getMetric(row, 1),
            getMetric(row, 2),
          ])}
        />
        {!isLead && (
          <Ga4Table
            title="Ürün Bazlı E-ticaret"
            columns={["Ürün", "Revenue", "Satın Alma", "Purchase Revenue"]}
            rows={(analysis?.deepReport?.ecommerce ?? []).map((row: any) => [
              getDimension(row, 0),
              getMetric(row, 0),
              getMetric(row, 1),
              getMetric(row, 2),
            ])}
            error={analysis?.deepReport?.ecommerceError}
          />
        )}
        <Ga4Table
          title="Ülke / Şehir"
          columns={["Ülke", "Şehir", "User", "Oturum", "Conv."]}
          rows={(analysis?.deepReport?.geography ?? []).map((row: any) => [
            getDimension(row, 0),
            getDimension(row, 1),
            getMetric(row, 0),
            getMetric(row, 1),
            getMetric(row, 2),
          ])}
        />
        <Ga4Table
          title="Trafik Hunisi"
          columns={["Kanal", "Oturum", "Engaged", "Event", "Conversion"]}
          rows={channelFunnel.map((row: any) => [
            getDimension(row, 0),
            getMetric(row, 0),
            getMetric(row, 1),
            getMetric(row, 2),
            getMetric(row, 3),
          ])}
          error={analysis?.channelFunnelError}
        />
        <Ga4Table
          title="Dönüşüm & Event"
          columns={["Event", "Sayı", "Conversion"]}
          rows={conversionEvents.map((row: any) => [getDimension(row, 0), getMetric(row, 0), getMetric(row, 1)])}
          error={analysis?.conversionEventsError}
        />
        <Ga4Table
          title="Top Pages"
          columns={["Sayfa", "View", "User", "Event"]}
          rows={topPages.map((row: any) => [getDimension(row, 0), getMetric(row, 0), getMetric(row, 1), getMetric(row, 2)])}
        />
        <Ga4Table
          title="Realtime Detay"
          columns={["Ekran / Sayfa", "Ülke", "Cihaz", "Aktif", "Event"]}
          rows={(realtimeDetailRows.length ? realtimeDetailRows : realtimeRows).map((row: any) =>
            realtimeDetailRows.length
              ? [getDimension(row, 0), getDimension(row, 1), getDimension(row, 2), getMetric(row, 0), getMetric(row, 1)]
              : [getDimension(row, 0), getDimension(row, 1), "-", getMetric(row, 0), "-"]
          )}
          error={analysis?.realtimeError}
        />
        <Ga4Table
          title="Data Streams"
          columns={["Ad", "Measurement", "Platform"]}
          rows={(config.dataStreams ?? []).map((row: any) => [
            row?.displayName ?? row?.name ?? "-",
            row?.webStreamData?.measurementId ?? "-",
            row?.type ?? "-",
          ])}
          error={config?.errors?.dataStreams}
        />
        <Ga4Table
          title="Key Events"
          columns={["Event", "Resource", "Aksiyon"]}
          rows={(config.keyEvents ?? []).map((row: any) => [
            row?.eventName ?? "-",
            row?.name ?? "-",
            row?.name ? (
              <button className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700" onClick={() => onDeleteDraft("delete_key_event", row.name)}>
                Sil Taslağı
              </button>
            ) : "-",
          ])}
          error={config?.errors?.keyEvents}
        />
        <Ga4Table
          title="Custom Dimensions"
          columns={["Parametre", "Scope", "Aksiyon"]}
          rows={(config.customDimensions ?? []).map((row: any) => [
            row?.parameterName ?? row?.displayName ?? "-",
            row?.scope ?? "-",
            row?.name ? (
              <button className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700" onClick={() => onDeleteDraft("delete_custom_dimension", row.name)}>
                Sil Taslağı
              </button>
            ) : "-",
          ])}
          error={config?.errors?.customDimensions}
        />
        <Ga4Table
          title="Audiences / Ads Links"
          columns={["Tip", "Ad / Customer", "Resource"]}
          rows={[
            ...(config.audiences ?? []).map((row: any) => ["Audience", row?.displayName ?? "-", row?.name ?? "-"]),
            ...(config.googleAdsLinks ?? []).map((row: any) => ["Ads Link", row?.customerId ?? "-", row?.name ?? "-"]),
          ]}
          error={config?.errors?.audiences || config?.errors?.googleAdsLinks}
        />
      </div>
    </div>
  );
}

function Ga4FunnelChart({ steps }: { steps: any[] }) {
  const rows = steps.map((step) => ({
    step: String(step.step ?? "-").replaceAll("_", " "),
    count: Number(step.count ?? 0),
  }));

  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-4">
      <div className="mb-3">
        <h3 className="text-sm font-black text-slate-900">E-ticaret Funnel Grafiği</h3>
        <p className="mt-1 text-xs font-bold text-slate-400">Adım bazlı event sayısı; drop-off yüzdeleri tabloda detaylı.</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">Funnel verisi yok.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 24, bottom: 4 }}>
              <CartesianGrid stroke="var(--surface-100)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="step"
                width={128}
                tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 800 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in srgb, var(--brand-100) 45%, transparent)" }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--surface-100)", fontSize: 12, fontWeight: 700 }}
              />
              <Bar dataKey="count" name="Event sayısı" fill="var(--accent-cyan)" maxBarSize={22} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Ga4FunnelTrendChart({ tenantKey }: { tenantKey: string }) {
  const STEP_META: { key: string; label: string; color: string }[] = [
    { key: "session_start", label: "Oturum", color: "var(--accent-cyan)" },
    { key: "view_item", label: "Ürün Görüntüleme", color: "#6366f1" },
    { key: "add_to_cart", label: "Sepete Ekleme", color: "#f59e0b" },
    { key: "begin_checkout", label: "Ödeme Başlatma", color: "#ec4899" },
    { key: "add_payment_info", label: "Ödeme Bilgisi", color: "#8b5cf6" },
    { key: "purchase", label: "Satın Alma", color: "#10b981" },
  ];
  const [granularity, setGranularity] = useState<"month" | "week">("week");
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketing
      .ga4FunnelTrend(tenantKey, granularity)
      .then((d) => { if (active) setTrend(d); })
      .catch((e) => { if (active) setTrend({ error: (e as Error).message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tenantKey, granularity]);

  const rows = Array.isArray(trend?.rows) ? trend.rows : [];
  const tabBtn = (g: "month" | "week", label: string) => (
    <button
      type="button"
      onClick={() => setGranularity(g)}
      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${granularity === g ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-[28px] border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Funnel Zaman Trendi</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">Her funnel adımının {granularity === "week" ? "haftaya" : "aya"} göre event sayısı.</p>
        </div>
        <div className="flex gap-1.5">{tabBtn("week", "Haftalık")}{tabBtn("month", "Aylık")}</div>
      </div>
      {loading ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">Yükleniyor…</p>
      ) : trend?.error ? (
        <p className="py-8 text-center text-sm font-bold text-rose-400">{String(trend.error)}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">Trend verisi yok.</p>
      ) : rows.length === 1 ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">
          Çizgi trendi için en az 2 dönem gerekli; şu an tek dönem var ({rows[0].label}). {granularity === "month" ? "Haftalık görünümü deneyin veya" : ""} veriler biriktikçe grafik dolacak.
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--surface-100)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }} tickLine={false} axisLine={false} width={44} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--surface-100)", fontSize: 12, fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              {STEP_META.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function Ga4VisitStatsSection({ visitStats }: { visitStats: any }) {
  const breakdown = visitStats?.breakdown ?? {};
  const daily = Array.isArray(visitStats?.daily) ? visitStats.daily : [];
  const errors = visitStats?.errors ?? {};
  const userRows = {
    new: Number(breakdown.new?.activeUsers ?? 0),
    returning: Number(breakdown.returning?.activeUsers ?? 0),
    total: Number(breakdown.total?.activeUsers ?? 0),
  };
  const durationRows = {
    new: formatDuration(Number(breakdown.new?.averageSessionDuration ?? 0)),
    returning: formatDuration(Number(breakdown.returning?.averageSessionDuration ?? 0)),
    total: formatDuration(Number(breakdown.total?.averageSessionDuration ?? 0)),
  };
  const pageRows = {
    new: formatNumber(Number(breakdown.new?.screenPageViewsPerSession ?? 0), 2),
    returning: formatNumber(Number(breakdown.returning?.screenPageViewsPerSession ?? 0), 2),
    total: formatNumber(Number(breakdown.total?.screenPageViewsPerSession ?? 0), 2),
  };
  const chartRows = daily.map((row: any) => ({
    date: formatGa4Date(row.date),
    "Kullanıcılar": Number(row.activeUsers ?? 0),
    "Yeni Kullanıcılar": Number(row.newUsers ?? 0),
    "Geri Dönen": Number(row.returningUsers ?? 0),
  }));
  const errorText = [errors.newVsReturning, errors.totals, errors.daily].filter(Boolean).join(" · ");

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-100 bg-slate-50 p-5">
      <div>
        <h3 className="text-sm font-black text-slate-900">Ziyaret İstatistikleri</h3>
        <p className="mt-1 text-xs font-bold text-slate-400">Yeni / geri dönen kullanıcı kırılımı ve günlük kullanıcı serisi.</p>
        {errorText && <p className="mt-2 text-xs font-bold text-amber-600">{errorText}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <VisitStatCard title="Kullanıcılar" rows={userRows} />
        <VisitStatCard title="Ortalama Oturum Süresi" rows={durationRows} />
        <VisitStatCard title="Sayfa / Oturum" rows={pageRows} />
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        {chartRows.length === 0 ? (
          <p className="py-10 text-center text-sm font-bold text-slate-400">Günlük ziyaret verisi yok.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} barGap={4} barCategoryGap="18%" margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="var(--surface-100)" vertical={false} />
                <XAxis
                  dataKey="date"
                  interval="preserveStartEnd"
                  minTickGap={16}
                  tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--text-faint)", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in srgb, var(--brand-100) 45%, transparent)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--surface-100)", fontSize: 12, fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800, paddingTop: 8 }} />
                <Bar dataKey="Kullanıcılar" fill="var(--brand-600)" maxBarSize={28} radius={[5, 5, 0, 0]} />
                <Bar dataKey="Yeni Kullanıcılar" fill="var(--status-info)" maxBarSize={28} radius={[5, 5, 0, 0]} />
                <Bar dataKey="Geri Dönen" fill="var(--status-success)" maxBarSize={28} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function VisitStatCard({ title, rows }: { title: string; rows: { new: ReactNode; returning: ReactNode; total: ReactNode } }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <VisitStatValue label="Yeni" value={rows.new} />
        <VisitStatValue label="Geri Dönen" value={rows.returning} />
        <VisitStatValue label="Tümü" value={rows.total} />
      </div>
    </div>
  );
}

function VisitStatValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-base font-black text-slate-900">{value}</p>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00:00";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatNumber(value: number, digits = 0) {
  if (!Number.isFinite(value)) return digits ? "0.00" : "0";
  return value.toFixed(digits);
}

function formatGa4Date(value: unknown) {
  const raw = String(value ?? "");
  if (raw.length !== 8) return raw || "-";
  return `${raw.slice(6, 8)}.${raw.slice(4, 6)}`;
}

function Ga4Table({
  title,
  columns,
  rows,
  error,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
  error?: string | null;
}) {
  const minWidth = Math.max(560, columns.length * 150);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {error && <p className="mt-1 text-xs font-bold text-amber-600">{error}</p>}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-sm font-bold text-slate-500">Veri yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-[11px]" style={{ minWidth }}>
            <thead className="bg-slate-50 text-slate-400">
              <tr>
                {columns.map((column, index) => (
                  <th key={column} className={`${index === 0 ? "w-[36%]" : ""} px-3 py-2 font-black uppercase tracking-widest`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.slice(0, 10).map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`} className="truncate px-3 py-2 font-bold leading-tight text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 text-sm font-black transition-all ${
        active ? "bg-brand-gradient text-white shadow-brand-glow" : "text-slate-400 hover:text-slate-100"
      }`}
    >
      {label}
    </button>
  );
}
