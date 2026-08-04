"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Lock, Music2, RefreshCw, Upload } from "lucide-react";
import { platforms } from "@/ekosistem/lib/api";

const REDIRECT_URI = "https://goldmoodastro.com/api/platforms/tiktok/oauth/callback/";
const KEEP = "__KEEP__";

export default function TikTokSandboxPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<Awaited<ReturnType<typeof platforms.tiktokConfig>>["item"] | null>(null);
  const [form, setForm] = useState({ clientKey: "", clientSecret: "", redirectUri: REDIRECT_URI });
  const [video, setVideo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [publishId, setPublishId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await platforms.tiktokConfig();
      setConfig(result.item);
      setForm({ clientKey: result.item.clientKey || "", clientSecret: result.item.hasClientSecret ? KEEP : "", redirectUri: result.item.redirectUri || REDIRECT_URI });
    } catch (error) { setMessage((error as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get("tiktok");
    if (state === "connected") setMessage("TikTok hesabı başarıyla bağlandı.");
    if (state === "error") setMessage("TikTok yetkilendirmesi tamamlanamadı.");
    load();
  }, []);

  async function save() {
    setBusy(true); setMessage("");
    try {
      await platforms.saveTikTokConfig({ clientKey: form.clientKey.trim(), clientSecret: form.clientSecret === KEEP ? undefined : form.clientSecret.trim() || undefined, redirectUri: form.redirectUri.trim() || REDIRECT_URI });
      setMessage("TikTok Sandbox ayarları kaydedildi."); await load();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function connect() {
    setBusy(true); setMessage("");
    try { const { url } = await platforms.tiktokAuthUrl(); window.location.href = url; }
    catch (error) { setMessage((error as Error).message); setBusy(false); }
  }

  async function upload() {
    if (!video) return setMessage("Önce bir MP4, MOV veya WebM video seçin.");
    setBusy(true); setMessage("");
    try { const result = await platforms.tiktokUploadDraft(video); setPublishId(result.publishId); setMessage(result.message); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  const ok = message.includes("başarı") || message.includes("kaydedildi") || message.includes("gönderildi");
  return (
    <div className="space-y-7">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 text-white shadow-xl">
        <div className="flex items-start justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">Sosyal Medya</p><h1 className="mt-2 text-3xl font-black">TikTok Sandbox</h1><p className="mt-3 max-w-2xl text-sm text-slate-300">GoldMoodAstro hesabını OAuth ile bağlayın, videoyu kullanıcı onayıyla TikTok taslak kutusuna gönderin.</p></div>
          <div className="rounded-2xl bg-white/10 p-4"><Music2 size={30} /></div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">Bağlantı ve OAuth Ayarları</h2><p className="mt-1 text-xs font-semibold text-slate-400">Yetkiler: user.info.basic, video.upload</p></div>{config?.connected && <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"><CheckCircle2 size={15} /> {config.displayName || "TikTok"} bağlı</span>}</div>
        {loading ? <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-slate-300" /></div> : <div className="mt-6 grid gap-5">
          <Field label="Sandbox Client Key" value={form.clientKey} onChange={(v) => setForm((s) => ({ ...s, clientKey: v }))} />
          <Field label={config?.hasClientSecret ? "Client Secret (değiştirmek için yazın)" : "Sandbox Client Secret"} value={form.clientSecret} password onChange={(v) => setForm((s) => ({ ...s, clientSecret: v }))} />
          <Field label="Redirect URI" value={form.redirectUri} onChange={(v) => setForm((s) => ({ ...s, redirectUri: v }))} />
          <div className="flex flex-wrap gap-3"><button onClick={save} disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Lock className="mr-2 inline" size={16} />Ayarları Kaydet</button>{config?.hasClientSecret && <button onClick={connect} disabled={busy} className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><ExternalLink className="mr-2 inline" size={16} />{config.connected ? "Yeniden Yetkilendir" : "TikTok’a Bağlan"}</button>}</div>
        </div>}
      </section>

      {config?.connected && <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm"><h2 className="text-xl font-black text-slate-900">Taslak Video Gönder</h2><p className="mt-2 text-sm text-slate-500">Son düzenleme ve yayın onayı TikTok uygulamasında verilir.</p><input className="mt-5 block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => setVideo(e.target.files?.[0] || null)} /><button onClick={upload} disabled={busy} className="mt-4 rounded-2xl bg-black px-6 py-3 text-sm font-black text-white disabled:opacity-50"><Upload className="mr-2 inline" size={16} />Kullanıcı Onayıyla Taslak Gönder</button>{publishId && <p className="mt-3 break-all text-xs text-slate-400">Publish ID: {publishId}</p>}</section>}
      {message && <p className={`rounded-2xl px-5 py-4 text-sm font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message}</p>}
    </div>
  );
}

function Field({ label, value, password, onChange }: { label: string; value: string; password?: boolean; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span><input type={password ? "password" : "text"} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-500" /></label>;
}
