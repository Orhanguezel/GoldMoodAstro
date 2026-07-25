"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Plus, Power, RefreshCw, Save, Search, Target, UserRound } from "lucide-react";
import { siteSettings, tenants, xResearch } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";

const notesKey = (tenantKey: string, targetId: number) => `x:research:note:${tenantKey}:${targetId}`;

const typeLabels: Record<string, string> = {
  user: "Kullanıcı",
  keyword: "Kelime",
  hashtag: "Hashtag",
};

export default function XResearchPage() {
  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ type: "keyword", label: "", query: "", userId: "" });
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);

  const selectedTarget = targets.find((t) => t.id === selectedId) || null;

  async function loadTarget(targetId: number | null, tk = tenantKey) {
    setNoteSavedAt(null);
    if (!targetId || !tk) { setTweets([]); setNote(""); return; }
    try {
      const [tw, row] = await Promise.all([
        xResearch.tweets(tk, { targetId }),
        siteSettings.get(notesKey(tk, targetId), "tr").catch(() => null),
      ]);
      setTweets(tw.items || []);
      setNote(row?.value || "");
    } catch {
      setTweets([]); setNote("");
    }
  }

  async function load(nextTenantKey = tenantKey, keepSelected = false) {
    if (!nextTenantKey) return;
    setLoading(true);
    try {
      const data = await xResearch.targets(nextTenantKey);
      const items = data.items || [];
      setTargets(items);
      const next = keepSelected && items.some((t: any) => t.id === selectedId)
        ? selectedId
        : (items[0]?.id ?? null);
      setSelectedId(next);
      await loadTarget(next, nextTenantKey);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    tenants.list().then((data) => {
      setTenantItems(data.items || []);
      const nextTenantKey = resolveTenantKey(data.items || [], getStoredTenantKey());
      setTenantKey(nextTenantKey);
      if (nextTenantKey) { setStoredTenantKey(nextTenantKey); load(nextTenantKey); }
      else setLoading(false);
    });
  }, []);

  function selectTarget(id: number) {
    setSelectedId(id);
    loadTarget(id);
  }

  async function saveNote() {
    if (!tenantKey || !selectedId) return;
    setNoteSaving(true);
    try {
      await siteSettings.upsert({ key: notesKey(tenantKey, selectedId), value: note, locale: "tr" });
      setNoteSavedAt(new Date().toLocaleTimeString("tr-TR"));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function createTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantKey) return;
    await xResearch.createTarget({ tenantKey, type: form.type, label: form.label, query: form.query, userId: form.userId || undefined });
    setForm({ type: "keyword", label: "", query: "", userId: "" });
    await load(tenantKey, true);
  }

  async function syncSelected() {
    if (!selectedId) return;
    setSyncing(true);
    try {
      await xResearch.syncTarget(selectedId);
      await loadTarget(selectedId);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function toggleActive(target: any, e: React.MouseEvent) {
    e.stopPropagation();
    await xResearch.updateTarget(target.id, { isActive: target.isActive ? 0 : 1 });
    await load(tenantKey, true);
  }

  const totalEngagement = tweets.reduce(
    (sum, t) => sum + Number(t.likeCount || 0) + Number(t.replyCount || 0) + Number(t.retweetCount || 0) + Number(t.quoteCount || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">X Research</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Firma seç → sadece o firmanın tweetleri ve analiz notu gösterilir. Firmalar karışmaz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={tenantKey}
            onChange={(e) => { setTenantKey(e.target.value); setStoredTenantKey(e.target.value); load(e.target.value); }}
          >
            {tenantItems.map((t: any) => (
              <option key={t.key} value={t.key}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={syncSelected}
            disabled={syncing || !selectedId}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            Seçiliyi Senkronize Et
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard icon={<Target size={20} />} label="Toplam Hedef" value={targets.length} />
        <SummaryCard icon={<Search size={20} />} label="Seçili Firma Tweet" value={tweets.length} />
        <SummaryCard icon={<BarChart3 size={20} />} label="Seçili Firma Etkileşim" value={totalEngagement} />
      </div>

      <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
        <form onSubmit={createTarget} className="grid grid-cols-1 gap-4 lg:grid-cols-[160px_1fr_1fr_180px_auto]">
          <select value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none">
            <option value="keyword">Kelime</option>
            <option value="hashtag">Hashtag</option>
            <option value="user">Kullanıcı</option>
          </select>
          <input value={form.label} onChange={(e) => setForm((c) => ({ ...c, label: e.target.value }))} placeholder="Etiket adı" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none" required />
          <input value={form.query} onChange={(e) => setForm((c) => ({ ...c, query: e.target.value }))} placeholder="Arama / @kullanici / #hashtag" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none" required />
          <input value={form.userId} onChange={(e) => setForm((c) => ({ ...c, userId: e.target.value }))} placeholder="User ID opsiyonel" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none" />
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">
            <Plus size={16} /> Ekle
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="rounded-[28px] border border-slate-100 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-black text-slate-900">İzleme Hedefleri</h2>
            <p className="mt-1 text-[11px] font-bold text-slate-400">Firmaya tıkla → içeriği gör. Sağdaki düğme aktif/pasif.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {targets.length === 0 ? (
              <p className="p-6 text-sm font-bold text-slate-400">Henüz hedef yok.</p>
            ) : (
              targets.map((target) => (
                <div
                  key={target.id}
                  onClick={() => selectTarget(target.id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left transition ${selectedId === target.id ? "bg-indigo-50/60 border-l-4 border-indigo-500" : "hover:bg-slate-50 border-l-4 border-transparent"}`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-black ${selectedId === target.id ? "text-indigo-700" : "text-slate-800"}`}>{target.label}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {typeLabels[target.type]} / {target.query}
                    </p>
                  </div>
                  <button
                    onClick={(e) => toggleActive(target, e)}
                    title={target.isActive ? "Aktif — pasifleştir" : "Pasif — aktifleştir"}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[10px] font-black uppercase transition ${target.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                  >
                    <Power size={11} /> {target.isActive ? "aktif" : "pasif"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="space-y-8 lg:col-span-2">
          {/* Seçili firmaya özel analiz notu */}
          <section className="rounded-[28px] border border-amber-100 bg-amber-50/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white"><FileText size={18} /></span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Analiz Notu{selectedTarget ? ` — ${selectedTarget.label}` : ""}</h2>
                  <p className="text-[11px] font-bold text-slate-500">Bu nota SADECE seçili firma için kaydedilir.</p>
                </div>
              </div>
              <button onClick={saveNote} disabled={noteSaving || !selectedId} className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-500 disabled:opacity-50">
                <Save size={16} className={noteSaving ? "animate-pulse" : ""} /> Kaydet
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={10}
              disabled={!selectedId}
              placeholder={selectedId ? "Bu firma için analiz notu…" : "Önce soldan bir firma seç."}
              className="w-full resize-y rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-50"
            />
            {noteSavedAt && <p className="mt-2 text-[11px] font-bold text-emerald-600">Kaydedildi · {noteSavedAt}</p>}
          </section>

          {/* Seçili firmanın tweetleri */}
          <section className="rounded-[28px] border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-900">
                {selectedTarget ? `${selectedTarget.label} — Tweetler` : "Tweetler"}
              </h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-20 text-slate-400"><RefreshCw className="animate-spin" size={28} /></div>
            ) : tweets.length === 0 ? (
              <p className="p-8 text-sm font-bold text-slate-400">Bu firma için henüz tweet yok. "Seçiliyi Senkronize Et" ile çek.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tweets.map((tweet) => {
                  const engagement = Number(tweet.likeCount || 0) + Number(tweet.replyCount || 0) + Number(tweet.retweetCount || 0) + Number(tweet.quoteCount || 0);
                  return (
                    <article key={tweet.id} className="p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <UserRound size={12} />
                          {tweet.authorUsername ? `@${tweet.authorUsername}` : tweet.authorName || tweet.authorId || "X"}
                        </span>
                        <span className="rounded-xl bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">{engagement} etkileşim</span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-slate-800">{tweet.text}</p>
                      {tweet.tweetUrl && (
                        <a href={tweet.tweetUrl} target="_blank" className="mt-3 inline-block text-xs font-black text-indigo-600 hover:underline">X üzerinde aç</a>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
