"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileVideo2,
  Link2,
  Loader2,
  Lock,
  Music2,
  RefreshCw,
  ShieldCheck,
  Unplug,
  Upload,
} from "lucide-react";
import { platforms } from "@/ekosistem/lib/api";

const REDIRECT_URI = "https://goldmoodastro.com/api/platforms/tiktok/oauth/callback/";
const KEEP = "__KEEP__";
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

type TikTokConfig = Awaited<ReturnType<typeof platforms.tiktokConfig>>["item"];
type Notice = { tone: "success" | "error"; text: string } | null;

export default function TikTokSandboxPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "connect" | "upload" | "disconnect" | null>(null);
  const [config, setConfig] = useState<TikTokConfig | null>(null);
  const [form, setForm] = useState({ clientKey: "", clientSecret: "", redirectUri: REDIRECT_URI });
  const [video, setVideo] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [publishId, setPublishId] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await platforms.tiktokConfig();
      setConfig(result.item);
      setForm({
        clientKey: result.item.clientKey || "",
        clientSecret: result.item.hasClientSecret ? KEEP : "",
        redirectUri: result.item.redirectUri || REDIRECT_URI,
      });
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get("tiktok");
    if (state === "connected") setNotice({ tone: "success", text: "TikTok hesabı başarıyla bağlandı." });
    if (state === "error") setNotice({ tone: "error", text: "TikTok yetkilendirmesi tamamlanamadı." });
    void load();
  }, []);

  async function save() {
    setBusy("save");
    setNotice(null);
    try {
      await platforms.saveTikTokConfig({
        clientKey: form.clientKey.trim(),
        clientSecret: form.clientSecret === KEEP ? undefined : form.clientSecret.trim() || undefined,
        redirectUri: form.redirectUri.trim() || REDIRECT_URI,
      });
      setNotice({ tone: "success", text: "TikTok Sandbox ayarları kaydedildi." });
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function connect() {
    setBusy("connect");
    setNotice(null);
    try {
      const { url } = await platforms.tiktokAuthUrl();
      window.location.href = url;
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
      setBusy(null);
    }
  }

  function selectVideo(file: File | null) {
    setPublishId("");
    if (!file) {
      setVideo(null);
      return;
    }
    if (!VIDEO_TYPES.has(file.type)) {
      setVideo(null);
      setNotice({ tone: "error", text: "Yalnız MP4, MOV veya WebM video seçebilirsiniz." });
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideo(null);
      setNotice({ tone: "error", text: "Video en fazla 20 MB olabilir." });
      return;
    }
    setVideo(file);
    setNotice(null);
  }

  async function upload() {
    if (!video) {
      setNotice({ tone: "error", text: "Önce bir video seçin." });
      return;
    }
    setBusy("upload");
    setNotice(null);
    try {
      const result = await platforms.tiktokUploadDraft(video);
      setPublishId(result.publishId);
      setNotice({ tone: "success", text: result.message });
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!window.confirm("GoldMood Astro TikTok bağlantısı kesilsin mi?")) return;
    setBusy("disconnect");
    setNotice(null);
    try {
      await platforms.tiktokDisconnect();
      setVideo(null);
      setPublishId("");
      setNotice({ tone: "success", text: "TikTok hesabının bağlantısı kesildi." });
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#17111f] via-[#23152b] to-[#36202f] p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-pink-300">Sosyal medya</p>
            <h1 className="mt-2 text-3xl font-black">TikTok Yayın Merkezi</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              GoldMoodAstro videolarını güvenli OAuth bağlantısıyla TikTok taslaklarına gönderin. Son düzenleme ve yayın onayı TikTok uygulamasında verilir.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><Music2 size={30} /></div>
        </div>
      </section>

      {notice ? <NoticeBox notice={notice} /> : null}

      {loading ? (
        <section className="flex min-h-56 items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <Loader2 className="animate-spin text-slate-300" size={30} />
        </section>
      ) : config?.connected ? (
        <>
          <section className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 p-7 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={28} /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Bağlı hesap</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">{config.displayName || "GoldMood Astro"}</h2>
                  <p className="mt-1 text-sm text-slate-500">OAuth bağlantısı etkin · Taslak video göndermeye hazır</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill icon={<ShieldCheck size={14} />} label="Güvenli bağlantı" />
                <StatusPill icon={<Link2 size={14} />} label="2 yetki aktif" />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-pink-500">Yeni paylaşım</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">TikTok’a taslak video gönder</h2>
                <p className="mt-2 text-sm text-slate-500">MP4, MOV veya WebM · En fazla 20 MB</p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">Yayın öncesi kullanıcı onayı</span>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center transition hover:border-pink-300 hover:bg-pink-50/40">
              <input className="sr-only" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => selectVideo(event.target.files?.[0] || null)} />
              <div className="grid size-14 place-items-center rounded-2xl bg-white text-pink-600 shadow-sm"><FileVideo2 size={27} /></div>
              <strong className="mt-4 text-sm text-slate-900">{video ? video.name : "Video seçmek için tıklayın"}</strong>
              <span className="mt-1 text-xs text-slate-400">{video ? formatBytes(video.size) : "Dosyanız seçildikten sonra burada görünür"}</span>
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button onClick={upload} disabled={!video || busy !== null} className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 disabled:cursor-not-allowed disabled:opacity-40">
                {busy === "upload" ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <Upload className="mr-2 inline" size={16} />}
                Taslak Olarak Gönder
              </button>
              <p className="text-xs text-slate-400">Gönderimden sonra TikTok uygulamasından bildirim gelir.</p>
            </div>
            {publishId ? <p className="mt-4 break-all rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">TikTok Publish ID: {publishId}</p> : null}
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <Step number="1" title="Videoyu seç" text="Hazırlanan dikey videoyu yükleyin." />
            <Step number="2" title="Taslağa gönder" text="Video güvenli API ile TikTok’a aktarılır." />
            <Step number="3" title="TikTok’ta yayınla" text="Metin, kapak ve son onayı uygulamada verin." />
          </section>
        </>
      ) : (
        <section className="rounded-[28px] border border-amber-100 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertCircle size={24} /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">TikTok hesabını bağlayın</h2>
              <p className="mt-2 text-sm text-slate-500">Ayarlar hazır. GoldMood Astro hesabına erişim vermek için TikTok yetkilendirmesini tamamlayın.</p>
              <button onClick={connect} disabled={busy !== null || !config?.hasClientSecret} className="mt-5 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">
                {busy === "connect" ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <ExternalLink className="mr-2 inline" size={16} />}
                TikTok’a Bağlan
              </button>
            </div>
          </div>
        </section>
      )}

      {!loading ? (
        <details className="group rounded-[28px] border border-slate-100 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
            <div><h2 className="font-black text-slate-900">Gelişmiş bağlantı ayarları</h2><p className="mt-1 text-xs text-slate-400">Client bilgileri, Redirect URI ve bağlantı yönetimi</p></div>
            <ChevronDown className="text-slate-400 transition group-open:rotate-180" size={20} />
          </summary>
          <div className="border-t border-slate-100 p-6">
            <div className="grid gap-5">
              <Field label="Sandbox Client Key" value={form.clientKey} onChange={(value) => setForm((state) => ({ ...state, clientKey: value }))} />
              <Field label={config?.hasClientSecret ? "Client Secret (değiştirmek için yazın)" : "Sandbox Client Secret"} value={form.clientSecret} password onChange={(value) => setForm((state) => ({ ...state, clientSecret: value }))} />
              <Field label="Redirect URI" value={form.redirectUri} onChange={(value) => setForm((state) => ({ ...state, redirectUri: value }))} />
              <div className="flex flex-wrap gap-3">
                <button onClick={save} disabled={busy !== null} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
                  {busy === "save" ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <Lock className="mr-2 inline" size={16} />}Ayarları Kaydet
                </button>
                {config?.hasClientSecret ? <button onClick={connect} disabled={busy !== null} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50"><RefreshCw className="mr-2 inline" size={16} />Yeniden Yetkilendir</button> : null}
                {config?.connected ? <button onClick={disconnect} disabled={busy !== null} className="rounded-2xl border border-rose-200 px-5 py-3 text-sm font-black text-rose-600 disabled:opacity-50">{busy === "disconnect" ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : <Unplug className="mr-2 inline" size={16} />}Bağlantıyı Kes</button> : null}
              </div>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function NoticeBox({ notice }: { notice: NonNullable<Notice> }) {
  const success = notice.tone === "success";
  return <div role="status" className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold ${success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{notice.text}</div>;
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100">{icon}{label}</span>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><span className="grid size-8 place-items-center rounded-xl bg-pink-50 text-xs font-black text-pink-600">{number}</span><h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>;
}

function Field({ label, value, password, onChange }: { label: string; value: string; password?: boolean; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</span><input type={password ? "password" : "text"} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-800 outline-none focus:border-pink-500" /></label>;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
