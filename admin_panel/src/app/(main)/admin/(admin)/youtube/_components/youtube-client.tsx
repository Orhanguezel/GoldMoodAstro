"use client";

import { useEffect, useState } from "react";
import { platforms, tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { GradientHero } from "@/ekosistem/components/ui/GradientHero";
import { MediaThumb } from "@/ekosistem/components/ui/MediaThumb";
import { PlatformBadge } from "@/ekosistem/components/ui/PlatformBadge";
import { StatCard } from "@/ekosistem/components/ui/StatCard";
import { 
  Youtube, 
  RefreshCw, 
  Users, 
  Eye, 
  Video, 
  Plus, 
  Trash2, 
  Settings, 
  ExternalLink,
  Lock,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function YouTubeDashboardPage() {
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [clientConfig, setClientConfig] = useState<any>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  // Client configuration forms
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    tenants.list()
      .then((data) => {
        setTenantItems(data.items);
        const nextKey = resolveTenantKey(data.items, getStoredTenantKey());
        setTenantKey(nextKey);
        if (nextKey) setStoredTenantKey(nextKey);
      })
      .catch(() => setTenantItems([]));
  }, []);

  async function loadYouTubeData(tk: string) {
    if (!tk) return;
    setLoading(true);
    setInfo(null);
    setClientConfig(null);
    try {
      // 1. Fetch channel info & recent videos
      const ytData = await platforms.youtubeInfo(tk).catch(() => null);
      if (ytData) {
        setInfo(ytData);
      }

      // 2. Fetch GCP OAuth client configs for details
      const client = await platforms.youtubeOAuthClient(tk).catch(() => null);
      if (client) {
        setClientConfig(client);
        if (client.item) {
          setClientId(client.item.clientId || "");
          setRedirectUri(client.item.redirectUri || "");
        }
      }
    } catch (err) {
      console.error("YouTube veri yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tenantKey) {
      loadYouTubeData(tenantKey);
    }
  }, [tenantKey]);

  const handleSaveClientConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      await platforms.saveYouTubeOAuthClient({
        tenantKey,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined,
        redirectUri: redirectUri.trim(),
      });
      alert("YouTube GCP OAuth istemci ayarları başarıyla kaydedildi.");
      setShowConfigForm(false);
      loadYouTubeData(tenantKey);
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleStartOAuth = () => {
    if (!tenantKey) return;
    setOauthBusy(true);
    try {
      window.location.href = platforms.youtubeOAuthStartUrl(tenantKey);
    } catch (err) {
      alert("OAuth başlatılamadı: " + (err as Error).message);
      setOauthBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!info?.channel?.id) return;
    if (!confirm("YouTube kanal bağlantısını kesmek istediğinize emin misiniz?")) return;
    setOauthBusy(true);
    try {
      await platforms.youtubeDisconnect(info.channel.id);
      alert("YouTube hesabı bağlantısı başarıyla kesildi.");
      loadYouTubeData(tenantKey);
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    } finally {
      setOauthBusy(false);
    }
  };

  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading && !info && !clientConfig) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="animate-spin text-red-600" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">YouTube Stüdyosu Yükleniyor...</p>
      </div>
    );
  }

  const isConnected = !!info?.channel;

  return (
    <div className="space-y-10">
      <GradientHero
        eyebrow="YouTube"
        title="YouTube Stüdyosu"
        description="YouTube entegrasyonu, video yayınlama durumu ve kanal istatistikleriniz."
        actions={
          <>
            <a
              href="/posts/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-card transition-all hover:-translate-y-0.5"
            >
              <Plus size={17} />
              Yeni Video
            </a>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20 transition-all hover:bg-white/15"
            >
              <Settings size={17} />
              Ayarlar
            </a>
          </>
        }
        aside={
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
            <select
              className="min-w-48 bg-transparent text-sm font-bold text-white outline-none"
              value={tenantKey}
              onChange={(e) => {
                setTenantKey(e.target.value);
                setStoredTenantKey(e.target.value);
              }}
            >
              {tenantItems.map((t: any) => (
                <option key={t.key} value={t.key} className="text-slate-900">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {isConnected ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatCard
              label="Abone Sayısı"
              value={formatNumber(info.channel.statistics.subscriberCount)}
              icon={<Users size={22} />}
              caption="Kanal takipçileri"
              gradient="pink"
            />
            <StatCard
              label="Toplam İzlenme"
              value={formatNumber(info.channel.statistics.viewCount)}
              icon={<Eye size={22} />}
              caption="Kanal genel toplamı"
              gradient="cyan"
            />
            <StatCard
              label="Toplam Video"
              value={formatNumber(info.channel.statistics.videoCount)}
              icon={<Video size={22} />}
              caption="Yayındaki içerikler"
              gradient="brand"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Videos list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Son Yüklemeler</h3>
                  <a 
                    href="/posts/new"
                    className="flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider"
                  >
                    <Plus size={14} /> Yeni Video Paylaş
                  </a>
                </div>

                <div className="divide-y divide-slate-100">
                  {info.videos && info.videos.length > 0 ? (
                    info.videos.map((vid: any) => (
                      <div key={vid.videoId} className="p-6 flex flex-col sm:flex-row gap-5 hover:bg-slate-50/50 transition-colors">
                        <div className="w-full sm:w-40 shrink-0">
                          <MediaThumb
                            src={vid.thumbnails?.medium?.url || vid.thumbnails?.default?.url}
                            alt={vid.title}
                            type="video"
                            label="YouTube"
                            className="aspect-video rounded-xl"
                          />
                          <a 
                            href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-700"
                          >
                            <Play size={13} className="fill-current" />
                            Aç
                          </a>
                        </div>

                        <div className="flex-1 space-y-2">
                          <h4 className="font-extrabold text-slate-800 text-base leading-snug line-clamp-1">
                            <a 
                              href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-red-600 transition-colors"
                            >
                              {vid.title}
                            </a>
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(vid.publishedAt).toLocaleDateString("tr-TR", {
                              year: "numeric", month: "long", day: "numeric"
                            })}
                          </p>
                          <p className="text-sm font-semibold text-slate-500 line-clamp-2 leading-relaxed">
                            {vid.description || "Açıklama yok."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center space-y-2">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Yüklenmiş video bulunamadı</p>
                      <p className="text-xs text-slate-400 font-semibold">Bu kanalda henüz video paylaşılmamış.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Connection details & configuration */}
            <div className="space-y-6">
              {/* Connected Account Details */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  {info.channel.thumbnails?.medium?.url || info.channel.thumbnails?.default?.url ? (
                    <img 
                      src={info.channel.thumbnails?.medium?.url || info.channel.thumbnails?.default?.url} 
                      alt={info.channel.title} 
                      className="h-16 w-16 rounded-2xl object-cover shadow-sm border border-slate-100" 
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                      <Youtube size={28} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-red-600 uppercase tracking-widest">Kanal Bağlı</p>
                    <PlatformBadge platform="youtube" size="sm" className="mt-1" />
                    <h3 className="text-lg font-black text-slate-800 truncate leading-snug">{info.channel.title}</h3>
                    {info.channel.customUrl && (
                      <a 
                        href={`https://youtube.com/${info.channel.customUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-0.5"
                      >
                        {info.channel.customUrl} <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Kanal ID</span>
                    <span className="font-mono bg-slate-50 px-2.5 py-1 rounded text-slate-600 select-all">{info.channel.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Bağlantı Türü</span>
                    <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 font-bold">Google OAuth2</span>
                  </div>
                </div>

                <button
                  onClick={handleDisconnect}
                  disabled={oauthBusy}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all font-bold text-sm border border-slate-100 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Kanal Bağlantısını Kes
                </button>
              </div>

              {/* Developer Client Details */}
              {clientConfig?.item && (
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock size={12} /> GCP İstemci Bilgileri
                    </h4>
                    <button 
                      onClick={() => setShowConfigForm(!showConfigForm)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      Düzenle
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-semibold truncate">
                      <span className="block text-[10px] font-black uppercase text-slate-400">Client ID</span>
                      {clientConfig.item.clientId}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold truncate">
                      <span className="block text-[10px] font-black uppercase text-slate-400">Redirect URI</span>
                      {clientConfig.item.redirectUri}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Not Connected State */
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm text-center space-y-6">
            <div className="h-20 w-20 rounded-[28px] bg-red-50 text-red-600 flex items-center justify-center shadow-lg shadow-red-600/5 mx-auto">
              <Youtube size={36} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 leading-snug">YouTube Kanalınızı Bağlayın</h2>
              <p className="text-sm font-semibold text-slate-400 max-w-md mx-auto leading-relaxed">
                Yapay zeka ile video başlığı, açıklaması ve taglerini optimize edip doğrudan stüdyonuza yüklemek için YouTube kanalınızı entegre edin.
              </p>
            </div>

            {clientConfig?.item || clientConfig?.devFallbackAvailable ? (
              <button
                onClick={handleStartOAuth}
                disabled={oauthBusy}
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all font-black text-sm shadow-xl shadow-red-600/20 disabled:opacity-50"
              >
                {oauthBusy ? <RefreshCw className="animate-spin" size={16} /> : <Youtube size={16} />}
                {clientConfig?.item ? "YouTube Kanalı Bağla" : "Dev Credentials ile Bağlan"}
              </button>
            ) : (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 max-w-md mx-auto text-left flex gap-3 text-rose-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase">GCP OAuth İstemcisi Yok</p>
                  <p className="text-xs font-semibold leading-relaxed">
                    Bu projede YouTube entegrasyonunu başlatabilmek için önce bir Google Cloud Console OAuth 2.0 istemcisi tanımlamalısınız.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => setShowConfigForm(!showConfigForm)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mx-auto"
              >
                <Settings size={14} /> GCP OAuth İstemcisi Yapılandır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GCP OAuth Client Configuration Form Dialog */}
      {showConfigForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-1.5">
                  <Lock size={12} /> Google Cloud Platform
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">OAuth İstemcisi Ayarları</h2>
              </div>
              <button 
                onClick={() => setShowConfigForm(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleSaveClientConfig} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Client ID</label>
                  <input
                    type="text"
                    required
                    placeholder="GCP OAuth Client ID..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                    Client Secret {clientConfig?.item ? "(Boş bırakılırsa mevcut şifre korunur)" : ""}
                  </label>
                  <input
                    type="password"
                    required={!clientConfig?.item}
                    placeholder="GCP Client Secret..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">Redirect URI (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Varsayılan: /api/v1/platforms/youtube/oauth/callback"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigForm(false)}
                  className="flex-1 py-3.5 bg-slate-50 text-slate-500 rounded-xl transition-all font-bold text-sm border border-slate-100 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50"
                >
                  {savingClient ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
