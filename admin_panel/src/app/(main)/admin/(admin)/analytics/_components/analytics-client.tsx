"use client";

import { Fragment, useEffect, useState } from "react";
import { analytics, posts, tenants, platforms } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import {
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Share2,
  ThumbsUp,
  MessageCircle,
  Eye,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Calendar,
  Layers,
  Zap
} from "lucide-react";
import { MetricCard } from "@/ekosistem/components/ui/MetricCard";
import { EmptyState } from "@/ekosistem/components/ui/EmptyState";
import { ChartCard } from "@/ekosistem/components/ui/ChartCard";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const platformChartColors: Record<string, string> = {
  facebook: "var(--status-info)",
  instagram: "var(--accent-pink)",
  both: "var(--brand-500)",
  x: "var(--text-primary)",
  linkedin: "var(--status-info)",
  telegram: "var(--accent-cyan)",
  youtube: "var(--status-danger)",
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [bestTime, setBestTime] = useState<any>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [items, setItems] = useState<any[]>([]);
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "youtube">("general");
  const [ytAccount, setYtAccount] = useState<any>(null);
  const [ytChannelStats, setYtChannelStats] = useState<any>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytRangeDays, setYtRangeDays] = useState(30);

  useEffect(() => {
    if (!tenantKey) return;
    setYtAccount(null);
    setYtChannelStats(null);
    platforms
      .list(tenantKey)
      .then((d) => {
        const ytAcc = d.items?.find((item: any) => item.platform === "youtube" && item.isActive);
        if (!ytAcc) return;
        setYtAccount(ytAcc);
        setYtLoading(true);
        analytics
          .youtubeChannel(ytAcc.uuid, ytRangeDays)
          .then((stats) => {
            setYtChannelStats(stats);
          })
          .catch((err) => {
            console.error("YouTube stats fetch failed:", err);
          })
          .finally(() => {
            setYtLoading(false);
          });
      })
      .catch((err) => {
        console.error("Platforms fetch failed:", err);
      });
  }, [tenantKey, ytRangeDays]);

  useEffect(() => {
    tenants
      .list()
      .then((d) => {
        setTenantItems(d.items);
        const nextTenantKey = resolveTenantKey(d.items, getStoredTenantKey());
        setTenantKey(nextTenantKey);
        if (nextTenantKey) setStoredTenantKey(nextTenantKey);
      })
      .catch(() => {
        setTenantItems([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!tenantKey) return;
    async function load() {
      setLoading(true);
      try {
        const [summary, s, list, best] = await Promise.all([
          analytics.tenantSummary(tenantKey).catch(() => null),
          posts.stats(tenantKey),
          posts.list({ tenantKey, limit: "100" }),
          analytics.bestTime(tenantKey, "x").catch(() => null),
        ]);
        setStats(s);
        setItems(list.items || []);
        setBestTime(best);
        setOverview({
          totalPosted: s.posted || 0,
          postedThisWeek:
            summary?.postCounts?.find?.((row: any) => row.status === "posted")?.count || 0,
          topPosts: [],
          engagement: summary?.analytics || {},
        });
      } catch (err) {
        console.error(err);
        setStats({});
        setItems([]);
        setBestTime(null);
        setOverview(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenantKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="animate-spin text-brand-500" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analizler Hazırlanıyor...</p>
      </div>
    );
  }

  const totalPosts = Object.values(stats).reduce((a, b) => a + b, 0);
  const countBy = (key: string) =>
    items.reduce<Record<string, number>>((acc, item) => {
      const value = String(item[key] || "belirsiz");
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  const typeCounts = countBy("postType");
  const platformCounts = countBy("platform");
  const sourceCounts = countBy("sourceType");
  const recentItems = items.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header — standart admin (/admin/consultants dili) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">Pazarlama &amp; Analitik</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">Performans Analitiği</h1>
          <p className="max-w-2xl text-sm font-serif italic text-gm-muted opacity-70">Mevcut içerikleri ve platform etkileşimlerini inceleyin.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text shadow-lg transition-all hover:bg-gm-primary/5"
        >
          <RefreshCw size={16} /> Yenile
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "general"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Genel Bakış
        </button>
        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "youtube"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          YouTube Analitiği
        </button>
      </div>

      {activeTab === "general" ? (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard
          label="Toplam İçerik"
          value={totalPosts}
          icon={<Layers size={20} />}
          description="Tüm zamanlar"
          trend={{ value: 12, direction: "up" }}
         />
         <MetricCard
          label="Yayınlanan"
          value={stats.posted || 0}
          icon={<CheckCircle2 size={20} />}
          description="Aktif paylaşımlar"
          trend={{ value: 5, direction: "up" }}
         />
         <MetricCard
          label="Zamanlanan"
          value={stats.scheduled || 0}
          icon={<Clock size={20} />}
          description="Gelecek gönderiler"
          trend={{ value: 0, direction: "flat" }}
         />
         <MetricCard
          label="Hata / İptal"
          value={(stats.failed || 0) + (stats.cancelled || 0)}
          icon={<AlertCircle size={20} />}
          description="Sorunlu gönderiler"
          trend={{ value: 2, direction: "down" }}
         />
      </div>

      {/* Breakdowns section */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mevcut Veri Analizi</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                İçerik türü, kaynak ve platform dağılımı
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <BreakdownCard title="İçerik Türleri" data={typeCounts} />

          {/* Custom Platform Donut Chart Component */}
          <ChartCard title="Platform Dağılımı" height={260} responsive={false} className="rounded-[24px] bg-slate-50/30">
            <div className="flex h-40 items-center justify-center">
                <PieChart width={220} height={160}>
                  <Pie
                    data={Object.entries(platformCounts).map(([name, val]) => ({
                      name: name === "both" ? "FB + IG" : name.toUpperCase(),
                      value: val
                    })).filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {Object.entries(platformCounts).map(([name], index) => (
                      <Cell key={`cell-${index}`} fill={platformChartColors[name] || "var(--text-muted)"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface-900)', border: '1px solid var(--surface-600)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '12px' }} />
                </PieChart>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 border-t border-slate-100 pt-3">
              {Object.entries(platformCounts).map(([name, value]) => {
                const colors: Record<string, string> = {
                  facebook: "bg-blue-500",
                  instagram: "bg-pink-500",
                  both: "bg-brand-500",
                  x: "bg-slate-900",
                  linkedin: "bg-blue-700",
                  telegram: "bg-cyan-500",
                  youtube: "bg-red-500",
                };
                if (value === 0) return null;
                return (
                  <div key={name} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 truncate">
                    <span className={`w-2 h-2 rounded-full ${colors[name] || "bg-slate-400"} shrink-0`} />
                    <span className="truncate">{name === "both" ? "FB + IG" : name}</span>
                    <span className="text-slate-400 font-bold">({value})</span>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <BreakdownCard title="Kaynaklar" data={sourceCounts} />

          <div className="lg:col-span-1 rounded-[24px] border border-slate-100 bg-slate-50/50 p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Son Eklenenler</p>
            <div className="space-y-3">
              {recentItems.length === 0 ? (
                <EmptyState title="Henüz içerik yok." className="py-8" />
              ) : (
                recentItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white border border-slate-100 p-3">
                    <p className="text-xs font-black text-slate-800 line-clamp-1">{item.title || "Başlıksız"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {item.postType} / {item.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Best time section */}
      <section className="bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">X İçin En İyi Saat</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Sadece gerçek post metriklerinden hesaplanır
              </p>
            </div>
          </div>
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {bestTime?.sampleSize || 0} örnek
          </span>
        </div>
        <div className="p-8">
          {!bestTime || bestTime.status === "insufficient_data" ? (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-6 text-sm font-bold text-amber-700">
                X için güvenilir saat önerisi üretmek üzere yeterli metrik yok. Birkaç yayın ve metrik toplama sonrası öneriler burada görünür.
              </div>
              {bestTime?.heatmap?.length > 0 && <BestTimeHeatmap rows={bestTime.heatmap} />}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bestTime.recommendations?.map((slot: any, index: number) => (
                  <div key={`${slot.day}-${slot.hour}`} className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Öneri {index + 1}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {slot.dayLabel} {String(slot.hour).padStart(2, "0")}:00
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      Ortalama etkileşim: %{slot.avgEngagement} / {slot.count} post
                    </p>
                  </div>
                ))}
              </div>
              <BestTimeHeatmap rows={bestTime.heatmap || []} />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/20">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Gönderi Durum Dağılımı</h2>
            </div>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center space-y-10">
             <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                {Object.entries(stats).map(([status, count]) => {
                  const percentage = totalPosts > 0 ? (count / totalPosts) * 100 : 0;
                  const colors: Record<string, string> = {
                    draft: "bg-slate-300",
                    scheduled: "bg-brand-500",
                    posted: "bg-emerald-500",
                    failed: "bg-rose-500",
                    cancelled: "bg-slate-400",
                    publishing: "bg-amber-400",
                  };
                  if (count === 0) return null;
                  return (
                    <div
                      key={status}
                      className={`${colors[status] || "bg-slate-300"} transition-all duration-500 hover:brightness-110 relative group`}
                      style={{ width: `${Math.max(percentage, 1)}%` }}
                    >
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {status.toUpperCase()}: {count} ({percentage.toFixed(1)}%)
                       </div>
                    </div>
                  );
                })}
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(stats).map(([status, count]) => {
                   const colors: Record<string, string> = {
                    draft: "bg-slate-350",
                    scheduled: "bg-brand-500",
                    posted: "bg-emerald-500",
                    failed: "bg-rose-500",
                    cancelled: "bg-slate-400",
                    publishing: "bg-amber-400",
                  };
                  return (
                    <div key={status} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                       <div className={`w-3 h-3 rounded-full ${colors[status]}`}></div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{status}</p>
                          <p className="text-sm font-bold text-slate-800">{count}</p>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </section>

        {/* Weekly Performance */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-brand-glow">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Haftalık Özet</h2>
          </div>
          <div className="p-8 space-y-8">
             {overview ? (
                <>
                  <div className="space-y-6">
                     <div className="flex items-end justify-between">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bu Hafta</p>
                           <p className="text-4xl font-extrabold text-slate-900">{overview.postedThisWeek || 0}</p>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                           <ArrowUpRight size={16} /> 12%
                        </div>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: '65%' }}></div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <Zap size={18} className="text-amber-500" />
                           <span className="text-sm font-bold text-slate-700">Toplam Yayınlanan</span>
                        </div>
                        <span className="text-lg font-extrabold text-slate-900">{overview.totalPosted || 0}</span>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <Calendar size={18} className="text-brand-500" />
                           <span className="text-sm font-bold text-slate-700">Paylaşım Sıklığı</span>
                        </div>
                        <span className="text-sm font-bold text-slate-500">~2.4 / gün</span>
                     </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium">Veri yüklenemedi.</div>
              )}
          </div>
        </section>
      </div>

      {/* Interactions / Best Posts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">En İyi Performans Gösterenler</h2>
              </div>
            </div>
            <div className="p-8">
               {overview?.topPosts?.length > 0 ? (
                  <div className="space-y-4">
                     {overview.topPosts.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-transparent hover:border-emerald-100 hover:bg-white hover:shadow-xl transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:scale-110 transition-transform">
                                 <Activity size={24} />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Post ID: #{p.postId}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.platform}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <InteractionStat icon={<ThumbsUp size={14}/>} value={p.likes} label="Beğeni" />
                              <InteractionStat icon={<MessageCircle size={14}/>} value={p.comments} label="Yorum" />
                              <InteractionStat icon={<Share2 size={14}/>} value={p.shares} label="Paylaşım" />
                              <div className="hidden sm:flex flex-col items-end">
                                 <p className="text-xs font-black text-emerald-600">%{p.engagementRate}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Etkileşim</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 space-y-4">
                     <Activity size={48} className="opacity-20" />
                     <p className="font-bold text-slate-400 text-sm">Henüz yeterli etkileşim verisi toplanmadı.</p>
                  </div>
               )}
            </div>
         </section>

         <section className="bg-brand-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-900/20">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <TrendingUp size={200} />
            </div>
            <div className="relative z-10 space-y-8 h-full flex flex-col">
               <div className="space-y-2">
                  <h3 className="text-2xl font-black">Pro Analizler</h3>
                  <p className="text-brand-200 text-sm font-medium">Platformlarınızı bağlayın, verileri derinlemesine inceleyin.</p>
               </div>

               <div className="space-y-4 flex-1">
                  <FeatureItem label="Platform Etkileşim Oranları" />
                  <FeatureItem label="Haftalık Erişim Grafikleri" />
                  <FeatureItem label="En İyi Paylaşım Saatleri" />
                  <FeatureItem label="Otomatik Raporlama (PDF)" />
               </div>

               <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <p className="text-xs font-bold leading-relaxed">
                     Facebook ve Instagram hesaplarını bağladığınızda, beğeniden erişime kadar tüm metrikler otomatik olarak toplanır.
                  </p>
               </div>
            </div>
         </section>
      </div>
        </>
      ) : (
        <YouTubeAnalyticsView
          loading={ytLoading}
          account={ytAccount}
          stats={ytChannelStats}
          rangeDays={ytRangeDays}
          setRangeDays={setYtRangeDays}
        />
      )}
    </div>
  );
}

// ─── Local UI Components ───────────────────────────────────

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-[24px] border border-slate-100 bg-slate-50/50 p-5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm font-medium text-slate-400">Veri yok.</p>
      ) : (
        <div className="space-y-3">
          {rows.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-700 capitalize truncate">{label}</span>
              <span className="px-2 py-1 rounded-lg bg-white border border-slate-100 text-xs font-black text-slate-900">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const heatmapDayLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const heatmapHours = [6, 9, 12, 15, 18, 21, 23];

function BestTimeHeatmap({ rows }: { rows: any[] }) {
  const maxRate = Math.max(1, ...rows.map((row) => Number(row.avgEngagement || 0)));
  const bySlot = new Map(rows.map((row) => [`${row.day}:${row.hour}`, row]));

  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saat Dağılımı</p>
        <p className="text-[10px] font-bold text-slate-400">Renk koyulaştıkça etkileşim artar</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-2">
            <div />
            {heatmapDayLabels.map((day) => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {day}
              </div>
            ))}
            {heatmapHours.map((hour) => (
              <Fragment key={`row-${hour}`}>
                <div key={`hour-${hour}`} className="flex h-11 items-center text-xs font-black text-slate-400">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {heatmapDayLabels.map((_, day) => {
                  const slot = bySlot.get(`${day}:${hour}`);
                  const rate = Number(slot?.avgEngagement || 0);
                  const opacity = slot ? 0.16 + Math.min(rate / maxRate, 1) * 0.72 : 0.05;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="flex h-11 items-center justify-center rounded-xl border border-slate-100 text-[10px] font-black text-slate-700"
                      style={{ backgroundColor: `rgba(139, 92, 246, ${opacity})` }}
                      title={slot ? `${slot.dayLabel} ${hour}:00 - %${slot.avgEngagement}` : "Veri yok"}
                    >
                      {slot ? `%${slot.avgEngagement}` : "-"}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractionStat({ icon, value, label }: { icon: React.ReactNode, value: number | string, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[50px]">
       <div className="text-slate-400">{icon}</div>
       <p className="text-[11px] font-bold text-slate-700">{value || 0}</p>
       <p className="text-[8px] font-bold text-slate-400 uppercase">{label}</p>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-1.5 h-1.5 bg-brand-400 rounded-full"></div>
       <span className="text-sm font-bold text-brand-100">{label}</span>
    </div>
  );
}

function YouTubeAnalyticsView({
  loading,
  account,
  stats,
  rangeDays,
  setRangeDays,
}: {
  loading: boolean;
  account: any;
  stats: any;
  rangeDays: number;
  setRangeDays: (days: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="animate-spin text-red-500" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          YouTube Analizleri Yükleniyor...
        </p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-card p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900">YouTube Hesabı Bağlı Değil</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          YouTube kanal istatistiklerinizi ve video performansınızı takip etmek için YouTube hesabınızı bağlayın.
        </p>
        <a
          href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
        >
          YouTube Hesabı Bağla
        </a>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-card p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Veri Alınamadı</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          YouTube API kanal verilerini şu anda döndürmedi. Bağlantıyı kontrol edip tekrar deneyin.
        </p>
      </div>
    );
  }

  const channel = stats.channel || {};
  const recentVideos = stats.recentVideos || [];
  const reports = stats.report || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="bg-slate-950 rounded-[32px] overflow-hidden relative p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-950/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center gap-6 z-10">
          {channel.thumbnail ? (
            <img
              src={channel.thumbnail}
              alt={channel.title || "YouTube kanalı"}
              className="w-20 h-20 rounded-full border-4 border-white/10 shadow-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center border-4 border-white/10 text-white font-black text-3xl">
              YT
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-black">{channel.title || "YouTube Kanalı"}</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Kanal
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Tenant: <span className="font-bold text-white">{account.tenantKey}</span>
            </p>
          </div>
        </div>

        <select
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
          className="z-10 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-sm focus:ring-2 focus:ring-red-500/20 outline-none hover:bg-white/15 transition-all"
        >
          <option value={7} className="text-slate-900">Son 7 Gün</option>
          <option value={30} className="text-slate-900">Son 30 Gün</option>
          <option value={90} className="text-slate-900">Son 90 Gün</option>
          <option value={365} className="text-slate-900">Son 1 Yıl</option>
        </select>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Toplam İzlenme"
          value={Number(channel.views || 0).toLocaleString()}
          icon={<Eye size={20} />}
          description="Kanalın tüm zamanlar izlenmesi"
          trend={{ value: 0, direction: "flat" }}
        />
        <MetricCard
          label="Abone Sayısı"
          value={Number(channel.subscribers || 0).toLocaleString()}
          icon={<TrendingUp size={20} />}
          description="Toplam takipçi"
          trend={{ value: 0, direction: "flat" }}
        />
        <MetricCard
          label="Toplam Video"
          value={Number(channel.videos || 0).toLocaleString()}
          icon={<Layers size={20} />}
          description="Yayınlanan video sayısı"
          trend={{ value: 0, direction: "flat" }}
        />
        <MetricCard
          label="Rapor Satırı"
          value={reports.length}
          icon={<BarChart3 size={20} />}
          description={`Son ${rangeDays} günlük veri`}
          trend={{ value: 0, direction: "flat" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">İzlenme Trendi</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Günlük YouTube Analytics raporu
              </p>
            </div>
          </div>
          <div className="p-8">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold">Henüz rapor verisi yok.</div>
            ) : (
              <div className="space-y-3">
                {reports.slice(-10).map((row: any) => (
                  <div key={row.date} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                    <span className="text-xs font-black text-slate-500">{row.date}</span>
                    <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
                      <span>{Number(row.views || 0).toLocaleString()} izlenme</span>
                      <span>{Number(row.likes || 0).toLocaleString()} beğeni</span>
                      <span>{Number(row.comments || 0).toLocaleString()} yorum</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-[32px] border border-slate-100 shadow-card overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-900">Son Yüklenen Videolar</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">İçerik performansı</p>
          </div>
          <div className="p-6 space-y-4">
            {recentVideos.length === 0 ? (
              <div className="text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl text-center">
                Henüz yayınlanmış video yok.
              </div>
            ) : (
              recentVideos.slice(0, 5).map((video: any) => (
                <div key={video.id || video.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-900 line-clamp-2">{video.title}</p>
                  <p className="mt-2 text-[10px] text-slate-400 font-bold">
                    {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Tarih yok"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
