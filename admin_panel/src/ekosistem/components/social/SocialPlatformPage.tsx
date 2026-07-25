"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileEdit,
  Heart,
  ImagePlus,
  LayoutTemplate,
  ListChecks,
  MessageCircle,
  PenSquare,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Trash2,
  XCircle,
} from "lucide-react";
import { platforms, posts, templates, tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { getSocialPlatform } from "@/ekosistem/lib/social-platforms";

type TabKey = "account" | "compose" | "plan" | "drafts" | "queue" | "templates";

const LIVE_CONTENT_PLATFORMS = ["facebook", "instagram"];

const POST_TYPES = [
  { value: "tanitim", label: "Tanıtım" },
  { value: "kampanya", label: "Kampanya" },
  { value: "haber", label: "Haber" },
  { value: "etkilesim", label: "Etkileşim" },
  { value: "ilan", label: "İlan" },
  { value: "nostalji", label: "Nostalji" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  scheduled: "Zamanlandı",
  posted: "Yayınlandı",
  sent: "Gönderildi",
  failed: "Hata",
  cancelled: "İptal",
  canceled: "İptal",
};

function statusClass(status: string) {
  if (status === "posted" || status === "sent") return "bg-emerald-50 text-emerald-600";
  if (status === "failed") return "bg-rose-50 text-rose-600";
  if (status === "scheduled") return "bg-indigo-50 text-indigo-600";
  if (status === "cancelled" || status === "canceled") return "bg-slate-100 text-slate-400";
  return "bg-amber-50 text-amber-600"; // draft
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

/** datetime-local -> ISO (UTC) */
function localToIso(local: string) {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** ISO/UTC -> datetime-local input degeri (yerel saat) */
function isoToLocalInput(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** bir post'un plan tarihi: scheduled -> scheduledAt, yayinlanan -> postedAt, diger -> createdAt */
function planDate(p: any): Date | null {
  const raw = p.scheduledAt || p.postedAt || p.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function SocialPlatformPage({ platformKey }: { platformKey: string }) {
  const config = getSocialPlatform(platformKey);

  const [tenantKey, setTenantKey] = useState("");
  const [tenantItems, setTenantItems] = useState<any[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  // Varsayilan sekme: Planlama (cron + zamanlanmis icerikler burada gorunur)
  const [tab, setTab] = useState<TabKey>("plan");

  // Hesap icerigi (platformdan canli cekilen mevcut gonderiler)
  const [accountItems, setAccountItems] = useState<any[]>([]);
  const [accountState, setAccountState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [accountError, setAccountError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [draftItems, setDraftItems] = useState<any[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [templateItems, setTemplateItems] = useState<any[]>([]);

  // Compose
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postType, setPostType] = useState("tanitim");
  const [scheduledAt, setScheduledAt] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  // Inline edit (caption + gorsel + zaman)
  const [editId, setEditId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Planlama (aylik/gunluk)
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Engagement detay (begeni/yorum)
  const [detailById, setDetailById] = useState<Record<number, any>>({});
  const [detailBusyId, setDetailBusyId] = useState<number | null>(null);
  const [openDetailId, setOpenDetailId] = useState<number | null>(null);

  function notify(kind: "ok" | "err", text: string) {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 6000);
  }

  async function loadAccount(tk = tenantKey) {
    if (!tk || !(LIVE_CONTENT_PLATFORMS.includes(platformKey) || platformKey === "x")) return;
    setAccountState("loading");
    setAccountError("");
    try {
      if (platformKey === "x") {
        // CANLI X API'den gerçek @hesap tweet'leri + metrikler (FB/IG ile aynı mantık).
        // DB'ye bağımlı değil → tweet'ler başka sistemce (örn. site cross-DB) atılsa bile görünür.
        const res = await platforms.xAccountTweets(tk, 30);
        setAccountItems(res.items || []);
      } else {
        const res =
          platformKey === "facebook"
            ? await platforms.facebookPosts(tk, 30)
            : await platforms.instagramMedia(tk, 30);
        setAccountItems(res.items || []);
      }
      setAccountState("loaded");
    } catch (e) {
      setAccountError((e as Error).message);
      setAccountState("error");
    }
  }

  async function loadAll(tk = tenantKey) {
    if (!tk || !config) return;
    setLoading(true);
    setAccountState("idle");
    setAccountItems([]);
    try {
      const live = LIVE_CONTENT_PLATFORMS.includes(platformKey);
      const [st, createdPosts, scheduledPosts, tpl, livePosts] = await Promise.all([
        platforms.status(tk).catch(() => null),
        posts.list({ tenantKey: tk, platform: platformKey, limit: "200", sort: "created_at", order: "desc" }).catch(() => ({ items: [] })),
        posts.list({ tenantKey: tk, platform: platformKey, limit: "200", sort: "scheduled_at", order: "asc" }).catch(() => ({ items: [] })),
        templates.list(tk).catch(() => ({ items: [] })),
        live
          ? (platformKey === "facebook" ? platforms.facebookPosts(tk, 50) : platforms.instagramMedia(tk, 50)).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);
      setConnected(!!st?.[platformKey]?.connected);
      // Canli yayinlanmis gonderilerin gercek gorseli (FB full_picture / IG media_url) -> externalId ile esle.
      // Boylece link postu (FB) gibi gorseli DB'de saklanmayan gonderiler de kuyrukta dogru gorseli gosterir
      // (Instagram ile ayni mantik; OG scrape degil, platformdan gelen ilgili gorsel).
      const liveImageById = new Map<string, string>();
      for (const it of (livePosts as any).items || []) {
        if (it.externalId && it.imageUrl) liveImageById.set(String(it.externalId), it.imageUrl);
      }
      const withLiveImage = (p: any) => {
        if (p.imageUrl) return p;
        // Görsel mediaUrls'te saklanmış olabilir (thread part'ları / çoklu medya) → imageUrl'e türet,
        // böylece tüm render'lar (takvim, planlama, kuyruk) thumbnail'ı gösterir.
        const fromMedia = Array.isArray(p.mediaUrls) && p.mediaUrls[0] ? p.mediaUrls[0] : undefined;
        if (fromMedia) return { ...p, imageUrl: fromMedia };
        // Hâlâ yoksa: yayınlanmış FB/IG için canlı görsel (full_picture / media_url) eşle.
        const ext = platformKey === "facebook" ? p.fbPostId : platformKey === "instagram" ? p.igMediaId : null;
        const img = ext ? liveImageById.get(String(ext)) : undefined;
        return img ? { ...p, imageUrl: img } : p;
      };
      const allPosts = {
        items: [
          ...new Map(
            [...(createdPosts.items || []), ...(scheduledPosts.items || [])].map((p: any) => [p.id, p]),
          ).values(),
        ],
      };
      // Bu platforma ait gonderiler: tam eslesen + "both"/"all" (cok platformlu) gonderiler
      const mine = (allPosts.items || [])
        .filter((p: any) => p.platform === platformKey || p.platform === "both" || p.platform === "all")
        .map(withLiveImage);
      setDraftItems(mine.filter((p: any) => p.status === "draft"));
      // kuyruk & gecmis = draft disindakiler
      setQueueItems(mine.filter((p: any) => p.status !== "draft"));
      // Canli veriyi Hesap Icerigi sekmesi icin de kullan (ayni veri, tekrar fetch'e gerek yok)
      if (live && ((livePosts as any).items?.length ?? 0) > 0) {
        setAccountItems((livePosts as any).items);
        setAccountState("loaded");
      }
      setTemplateItems(
        (tpl.items || []).filter((t: any) => !t.platform || t.platform === platformKey || t.platform === "both" || t.platform === "all"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    tenants.list().then((data) => {
      setTenantItems(data.items || []);
      const tk = resolveTenantKey(data.items || [], getStoredTenantKey());
      setTenantKey(tk);
      if (tk) {
        setStoredTenantKey(tk);
        loadAll(tk);
      } else {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformKey]);

  useEffect(() => {
    if (tab === "account" && accountState === "idle" && tenantKey && (LIVE_CONTENT_PLATFORMS.includes(platformKey) || platformKey === "x")) {
      loadAccount(tenantKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tenantKey, accountState]);

  if (!config) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-700">
        Bilinmeyen platform: <b>{platformKey}</b>
      </div>
    );
  }

  async function handleCreate(schedule: boolean) {
    if (!tenantKey || !caption.trim()) return;
    if (config!.requiresImage && !imageUrl.trim()) {
      notify("err", "Bu platform için görsel URL zorunlu.");
      return;
    }
    if (schedule && !scheduledAt) {
      notify("err", "Zamanlama için tarih/saat seçin.");
      return;
    }
    setBusy(true);
    try {
      await posts.create({
        tenantKey,
        platform: platformKey,
        postType,
        caption: caption.trim(),
        ...(imageUrl.trim() ? { mediaUrls: [imageUrl.trim()], imageUrl: imageUrl.trim() } : {}),
        ...(schedule ? { scheduledAt: localToIso(scheduledAt) } : {}),
        sourceType: "manual",
      });
      notify("ok", schedule ? "İçerik zamanlandı." : "Taslak kaydedildi.");
      setCaption("");
      setImageUrl("");
      setScheduledAt("");
      await loadAll();
      setTab(schedule ? "queue" : "drafts");
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<any>, okMsg: string) {
    setBusy(true);
    try {
      await fn();
      notify("ok", okMsg);
      await loadAll();
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function publishNow(id: number) {
    if (!confirm("Bu içerik CANLI olarak hemen yayınlanacak. Devam edilsin mi?")) return;
    await act(() => posts.publishNow(id), "Yayınlandı.");
  }

  async function scheduleExisting(id: number) {
    const val = prompt("Zamanlama (YYYY-MM-DD HH:MM):");
    if (!val) return;
    const iso = localToIso(val.replace(" ", "T"));
    if (!iso) return notify("err", "Geçersiz tarih.");
    await act(() => posts.schedule(id, iso), "Zamanlandı.");
  }

  // Sablonu 'Olustur' sekmesine yukle (ayni posts.create mekanizmasi) — gorsel eklenebilir.
  function useTemplate(t: any) {
    const base = t.captionTemplate || t.body || t.template || "";
    const hash = t.hashtags ? `\n\n${t.hashtags}` : "";
    setCaption(`${base}${hash}`.trim());
    if (t.postType) setPostType(t.postType);
    setImageUrl("");
    setScheduledAt("");
    setTab("compose");
    notify("ok", "Şablon 'Oluştur' sekmesine yüklendi — görsel ekleyip kaydedin.");
  }

  async function toggleDetail(id: number, refresh = false) {
    if (openDetailId === id && !refresh) {
      setOpenDetailId(null);
      return;
    }
    setOpenDetailId(id);
    if (detailById[id] && !refresh) return;
    setDetailBusyId(id);
    try {
      const d = await posts.details(id, refresh);
      setDetailById((s) => ({ ...s, [id]: d }));
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setDetailBusyId(null);
    }
  }

  function planForDay(key: string) {
    setScheduledAt(`${key}T12:00`);
    setTab("compose");
  }

  // Planli/taslak icerik icin inline editor (caption + gorsel + zaman). Kaydedince plan devam eder.
  function renderEditor(p: any) {
    return (
      <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <textarea
          value={editCaption}
          onChange={(e) => setEditCaption(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={editImageUrl}
            onChange={(e) => setEditImageUrl(e.target.value)}
            placeholder="Görsel URL"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
          />
          <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 ${uploadingImg ? "opacity-60" : ""}`}>
            <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={(e) => { uploadImageTo(e.target.files?.[0], setEditImageUrl); e.currentTarget.value = ""; }} />
            {uploadingImg ? <RefreshCw size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            Dosyadan Yükle
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {editImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editImageUrl} alt="" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
          )}
          <label className="flex items-center gap-2 text-xs font-black text-slate-500">
            Zaman:
            <input
              type="datetime-local"
              value={editScheduledAt}
              onChange={(e) => setEditScheduledAt(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => saveEditFull(p.id)} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50">Kaydet</button>
          <button onClick={() => setEditId(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600">Vazgeç</button>
        </div>
      </div>
    );
  }

  async function uploadImageTo(file: File | null | undefined, setter: (u: string) => void) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("err", "Sadece görsel yüklenebilir.");
    setUploadingImg(true);
    try {
      const res = await posts.uploadImage(file);
      setter(res.url);
      notify("ok", "Görsel yüklendi.");
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setUploadingImg(false);
    }
  }

  function openEdit(p: any) {
    setEditId(p.id);
    setEditCaption(p.caption || "");
    setEditImageUrl(p.imageUrl || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : "") || "");
    setEditScheduledAt(p.scheduledAt ? isoToLocalInput(p.scheduledAt) : "");
  }

  async function saveEditFull(id: number) {
    if (!editCaption.trim()) return;
    const patch: any = { caption: editCaption.trim() };
    if (editImageUrl.trim()) {
      patch.imageUrl = editImageUrl.trim();
      patch.mediaUrls = [editImageUrl.trim()];
    }
    if (editScheduledAt) patch.scheduledAt = localToIso(editScheduledAt);
    await act(() => posts.update(id, patch), "Güncellendi — plan devam ediyor.");
    setEditId(null);
  }

  const plannedDraftItems = useMemo(() => {
    return draftItems.filter((p) => Boolean(p.scheduledAt));
  }, [draftItems]);

  const planItems = useMemo(() => {
    const byId = new Map<number, any>();
    for (const p of [...queueItems, ...plannedDraftItems]) byId.set(p.id, p);
    return [...byId.values()];
  }, [queueItems, plannedDraftItems]);

  const scheduledCount = useMemo(
    () => queueItems.filter((p) => p.status === "scheduled").length + plannedDraftItems.length,
    [queueItems, plannedDraftItems],
  );

  const supportsLive = LIVE_CONTENT_PLATFORMS.includes(platformKey);
  const hasLiveAccount = supportsLive || platformKey === "x";
  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: "plan", label: "Planlama", icon: CalendarDays, count: scheduledCount },
    ...(supportsLive || platformKey === "x" ? [{ key: "account" as TabKey, label: "Hesap İçeriği", icon: Eye }] : []),
    { key: "compose", label: "Oluştur", icon: PenSquare },
    { key: "drafts", label: "Taslaklar", icon: FileEdit, count: draftItems.length },
    { key: "queue", label: "Kuyruk & Geçmiş", icon: ListChecks, count: queueItems.length },
    { key: "templates", label: "Şablonlar", icon: LayoutTemplate, count: templateItems.length },
  ];

  const queueStats = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of queueItems) acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, [queueItems]);

  // Yaklasan zamanlanmis icerikler (gun secilmeden Planlama'da liste olarak gosterilir)
  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...planItems]
      .filter((p) => p.status === "scheduled" || (p.status === "draft" && p.scheduledAt))
      .filter((p) => {
        const d = planDate(p);
        return d ? d.getTime() >= now : false;
      })
      .sort((a, b) => +new Date(planDate(a) || 0) - +new Date(planDate(b) || 0));
  }, [planItems]);

  // Yaklasan (gelecek) icerik yoksa, alan bos kalmasin diye SON icerikleri goster (en yeni once).
  const recent = useMemo(() => {
    return [...planItems]
      .filter((p) => planDate(p))
      .sort((a, b) => +new Date(planDate(b) || 0) - +new Date(planDate(a) || 0))
      .slice(0, 10);
  }, [planItems]);

  const planByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of planItems) {
      const d = planDate(p);
      if (!d) continue;
      (map[dayKey(d)] ||= []).push(p);
    }
    return map;
  }, [planItems]);

  return (
    <div className="mx-auto max-w-6xl space-y-7 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ${config.accent}`}>
            {config.icon(28)}
          </div>
          <div>
            <h1 className="font-serif text-4xl text-gm-text">{config.title}</h1>
            <p className="mt-1 text-sm font-serif italic text-gm-muted opacity-70">{config.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ConnBadge connected={connected} />
        </div>
      </div>

      {/* Baglanti uyarisi (token girisi YOK -> Ayarlar'a yonlendir) */}
      {connected === false && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700 md:flex-row md:items-center md:justify-between">
          <span>
            Bu tenant için {config.label} hesabı bağlı değil. Bağlantı/token girişi <b>Ayarlar → Sosyal Medya</b>'dan yapılır.
            Yayın denemeden önce bağlantıyı tamamlayın.
          </span>
          <a
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-700"
          >
            <Settings size={14} />
            Ayarlara git
          </a>
        </div>
      )}

      {message && (
        <div className={`rounded-2xl px-5 py-3 text-sm font-bold ${message.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      )}

      {/* X arac kisayollari */}
      {config.tools && (
        <div className="flex flex-wrap gap-3">
          {config.tools.map((t) => (
            <a key={t.href} href={t.href} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50">
              <ExternalLink size={14} />
              {t.label}
            </a>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-black transition ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon size={15} />
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-200 text-slate-600"}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <RefreshCw className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* === Hesap Icerigi (canli) === */}
          {tab === "account" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hesap İçeriği</h2>
                  <p className="text-xs font-semibold text-slate-400">{config.label} hesabında yayında olan gerçek gönderiler (canlı).</p>
                </div>
                <div className="flex items-center gap-2">
                  {platformKey === "x" && (
                    <>
                      <a href="/x-own-tweets" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">X Performans</a>
                      <a href="/x-inbox" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Gelen Kutusu</a>
                    </>
                  )}
                  {hasLiveAccount && (
                    <button onClick={() => loadAccount()} disabled={accountState === "loading"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                      <RefreshCw size={14} className={accountState === "loading" ? "animate-spin" : ""} /> Yenile
                    </button>
                  )}
                </div>
              </div>

              {platformKey !== "x" && connected === false ? (
                <Empty text="Hesap bağlı değil. Ayarlar → Sosyal Medya'dan bağlandıktan sonra mevcut içerik burada görünür." />
              ) : accountState === "loading" ? (
                <div className="flex justify-center py-16 text-slate-400"><RefreshCw className="animate-spin" size={28} /></div>
              ) : accountState === "error" ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{accountError || "İçerik çekilemedi."}</div>
              ) : accountItems.length === 0 ? (
                <Empty text={platformKey === "x" ? "Henüz tweet yok ya da senkronlanmadı. /x-own-tweets'ten metrikleri senkronla." : "Bu hesapta yayında gönderi bulunamadı."} />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {accountItems.map((m) => (
                    <article key={m.externalId} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300">{config.icon(24)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-3 text-xs font-medium leading-5 text-slate-700">{m.message || "(açıklama yok)"}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(m.createdTime)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-600">
                          {m.likes != null && <span className="inline-flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {num(m.likes)}</span>}
                          {m.comments != null && <span className="inline-flex items-center gap-1"><MessageCircle size={12} className="text-indigo-500" /> {num(m.comments)}</span>}
                          {num(m.shares) > 0 && <span className="inline-flex items-center gap-1"><Share2 size={12} className="text-emerald-500" /> {num(m.shares)}</span>}
                          {m.impressions != null && num(m.impressions) > 0 && <span className="inline-flex items-center gap-1"><Eye size={12} className="text-slate-400" /> {num(m.impressions)}</span>}
                          {m.mediaType && <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">{m.mediaType}</span>}
                          {m.permalink && (
                            <a href={m.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500">
                              <ExternalLink size={12} /> Aç
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* === Olustur === */}
          {tab === "compose" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <PenSquare size={18} className="text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Yeni İçerik</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  placeholder={`${config.label} için içerik yazın...`}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <div className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">İçerik Türü</span>
                    <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                      {POST_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">Zamanlama (ops.)</span>
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500" />
                  </label>
                </div>
              </div>
              {/* Gorsel: URL veya dosyadan yukle */}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={`Görsel URL ${config.requiresImage ? "(zorunlu)" : "(opsiyonel)"}`}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 ${uploadingImg ? "opacity-60" : ""}`}>
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImg} onChange={(e) => { uploadImageTo(e.target.files?.[0], setImageUrl); e.currentTarget.value = ""; }} />
                  {uploadingImg ? <RefreshCw size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                  {uploadingImg ? "Yükleniyor..." : "Dosyadan Yükle"}
                </label>
              </div>
              {imageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="önizleme" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" />
                  <button onClick={() => setImageUrl("")} className="text-xs font-black text-rose-600 hover:text-rose-500">Görseli kaldır</button>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => handleCreate(false)} disabled={busy || !caption.trim()} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                  Taslak Kaydet
                </button>
                <button onClick={() => handleCreate(true)} disabled={busy || !caption.trim() || !scheduledAt} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50">
                  <CalendarClock size={16} /> Zamanla
                </button>
              </div>
            </section>
          )}

          {/* === Planlama (aylik + gunluk) === */}
          {tab === "plan" && (() => {
            const year = monthCursor.getFullYear();
            const month = monthCursor.getMonth();
            const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Pzt=0
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells: (number | null)[] = [];
            for (let i = 0; i < firstDow; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            const tKey = dayKey(new Date());
            const activeDay = selectedDay && selectedDay.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) ? selectedDay : null;
            const dayItems = activeDay ? planByDay[activeDay] || [] : [];
            return (
              <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{MONTH_NAMES[month]} {year}</h2>
                  <div className="flex items-center gap-2">
                    <IconBtn onClick={() => { setMonthCursor(new Date(year, month - 1, 1)); setSelectedDay(null); }} title="Önceki ay"><ChevronLeft size={16} /></IconBtn>
                    <button onClick={() => { setMonthCursor(new Date()); setSelectedDay(tKey); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Bugün</button>
                    <IconBtn onClick={() => { setMonthCursor(new Date(year, month + 1, 1)); setSelectedDay(null); }} title="Sonraki ay"><ChevronRight size={16} /></IconBtn>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {cells.map((d, i) => {
                    if (d === null) return <div key={`e${i}`} />;
                    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const items = planByDay[key] || [];
                    const isToday = key === tKey;
                    const isSel = key === activeDay;
                    const posted = items.filter((x) => x.status === "posted" || x.status === "sent").length;
                    const sched = items.filter((x) => x.status === "scheduled").length;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDay(key)}
                        className={`flex min-h-[72px] flex-col items-start gap-1 rounded-xl border p-2 text-left transition ${
                          isSel ? "border-indigo-400 bg-indigo-50" : isToday ? "border-indigo-200 bg-white" : "border-slate-100 bg-slate-50/40 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`text-xs font-black ${isToday ? "text-indigo-600" : "text-slate-600"}`}>{d}</span>
                        {items.length > 0 && (
                          <div className="flex flex-wrap gap-0.5">
                            {items.slice(0, 4).map((it, idx) =>
                              it.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={idx} src={it.imageUrl} alt="" className="h-5 w-5 rounded object-cover ring-1 ring-slate-200" />
                              ) : (
                                <div key={idx} className="flex h-5 w-5 items-center justify-center rounded bg-slate-200/70 text-slate-400">{config.icon(11)}</div>
                              ),
                            )}
                            {items.length > 4 && (
                              <span className="flex h-5 items-center rounded bg-slate-200/70 px-1 text-[9px] font-black text-slate-500">+{items.length - 4}</span>
                            )}
                          </div>
                        )}
                        <div className="mt-auto flex flex-wrap gap-1">
                          {sched > 0 && <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black text-indigo-600">{sched} plan</span>}
                          {posted > 0 && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-600">{posted} yayın</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Gunluk plan / yaklasan icerikler */}
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700">
                      {activeDay
                        ? `${activeDay} — Günlük Plan`
                        : upcoming.length > 0
                          ? `Yaklaşan İçerikler (${upcoming.length})`
                          : `Son İçerikler (${recent.length})`}
                    </h3>
                    {activeDay ? (
                      <button onClick={() => planForDay(activeDay)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white transition hover:bg-indigo-500">
                        <Plus size={13} /> Bu güne içerik
                      </button>
                    ) : upcoming.length > 0 ? (
                      <span className="text-[11px] font-bold text-slate-400">Tümü zamanlanmış — yayın sırasında</span>
                    ) : (
                      recent.length > 0 && <span className="text-[11px] font-bold text-slate-400">Yaklaşan plan yok — son içerikler</span>
                    )}
                  </div>
                  {(() => {
                    const list = activeDay ? dayItems : upcoming.length > 0 ? upcoming : recent;
                    if (list.length === 0) {
                      return <Empty text={activeDay ? "Bu güne ait içerik yok. 'Bu güne içerik' ile ekleyin." : "Henüz içerik yok. 'Oluştur' ile ekleyin ya da haftalık otomasyon doldursun."} />;
                    }
                    return (
                      <div className="divide-y divide-slate-200/70">
                        {list.map((p) => {
                          const isStory = (p.title || "").includes("[STORY]");
                          if (editId === p.id) {
                            return <div key={p.id} className="py-3">{renderEditor(p)}</div>;
                          }
                          return (
                            <div key={p.id} className="flex items-center gap-3 py-3">
                              {p.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-300">{config.icon(18)}</div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${isStory ? "bg-fuchsia-100 text-fuchsia-600" : "bg-sky-100 text-sky-600"}`}>{isStory ? "Story" : "Post"}</span>
                                  <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500">{p.platform === "both" ? "FB+IG" : p.platform}</span>
                                  <span className="text-[11px] font-bold text-slate-400">{formatDate(p.scheduledAt || p.postedAt)}</span>
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-800">{p.caption || p.title || "(içerik yok)"}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(p.status)}`}>{STATUS_LABEL[p.status] || p.status}</span>
                                {p.status !== "posted" && p.status !== "sent" && (
                                  <IconBtn onClick={() => openEdit(p)} title="Düzenle"><FileEdit size={13} /></IconBtn>
                                )}
                                {p.status === "draft" && p.scheduledAt && (
                                  <IconBtn onClick={() => scheduleExisting(p.id)} title="Zamanla"><CalendarClock size={13} /></IconBtn>
                                )}
                                {p.status === "scheduled" && (
                                  <>
                                    <IconBtn onClick={() => publishNow(p.id)} title="Hemen Yayınla" tone="indigo"><Send size={13} /></IconBtn>
                                    <IconBtn onClick={() => act(() => posts.cancel(p.id), "İptal edildi.")} title="İptal"><XCircle size={13} /></IconBtn>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </section>
            );
          })()}

          {/* === Taslaklar === */}
          {tab === "drafts" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-slate-900">Taslaklar</h2>
              {draftItems.length === 0 ? (
                <Empty text="Taslak yok. 'Oluştur' sekmesinden ekleyin veya bir şablondan üretin." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {draftItems.map((p) => (
                    <article key={p.id} className="py-4">
                      {editId === p.id ? (
                        renderEditor(p)
                      ) : (
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex min-w-0 gap-3">
                            {p.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-6 text-slate-800">{p.caption || p.title || "(içerik yok)"}</p>
                              <p className="mt-1 text-[11px] font-bold text-slate-400">{formatDate(p.createdAt)} · {p.postType}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <IconBtn onClick={() => openEdit(p)} title="Düzenle"><FileEdit size={14} /></IconBtn>
                            <IconBtn onClick={() => scheduleExisting(p.id)} title="Zamanla"><CalendarClock size={14} /></IconBtn>
                            <IconBtn onClick={() => publishNow(p.id)} title="Hemen Yayınla" tone="indigo"><Send size={14} /></IconBtn>
                            <IconBtn onClick={() => act(() => posts.delete(p.id), "Silindi.")} title="Sil" tone="rose"><Trash2 size={14} /></IconBtn>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* === Kuyruk & Gecmis === */}
          {tab === "queue" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Kuyruk & Geçmiş</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(queueStats).map(([k, v]) => (
                    <span key={k} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(k)}`}>{STATUS_LABEL[k] || k}: {v}</span>
                  ))}
                </div>
              </div>
              {queueItems.length === 0 ? (
                <Empty text="Zamanlanmış veya yayınlanmış içerik yok." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {queueItems.map((p) => {
                    const isPosted = p.status === "posted" || p.status === "sent";
                    const detail = detailById[p.id];
                    const metric = detail?.analytics?.[0];
                    const comments = detail?.comments || [];
                    const thumb = p.imageUrl || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : "");
                    if (editId === p.id) {
                      return <article key={p.id} className="py-4">{renderEditor(p)}</article>;
                    }
                    return (
                      <article key={p.id} className="py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 gap-3">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 object-cover" />
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">{config.icon(18)}</div>
                            )}
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-800">{p.caption || p.title || "(içerik yok)"}</p>
                              <p className="mt-1 text-[11px] font-bold text-slate-400">
                                {p.status === "scheduled" ? `Zaman: ${formatDate(p.scheduledAt)}` : isPosted ? `Yayın: ${formatDate(p.postedAt)}` : formatDate(p.createdAt)}
                                {p.lastError ? ` · ${p.lastError}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(p.status)}`}>{STATUS_LABEL[p.status] || p.status}</span>
                            {isPosted && (
                              <IconBtn onClick={() => toggleDetail(p.id)} title="Beğeni & Yorumlar">
                                {detailBusyId === p.id ? <RefreshCw size={14} className="animate-spin" /> : openDetailId === p.id ? <ChevronDown size={14} /> : <Eye size={14} />}
                              </IconBtn>
                            )}
                            {!isPosted && <IconBtn onClick={() => openEdit(p)} title="Düzenle"><FileEdit size={14} /></IconBtn>}
                            {p.status === "scheduled" && <IconBtn onClick={() => act(() => posts.cancel(p.id), "İptal edildi.")} title="İptal"><XCircle size={14} /></IconBtn>}
                            {(p.status === "scheduled" || p.status === "failed") && <IconBtn onClick={() => publishNow(p.id)} title="Hemen Yayınla" tone="indigo"><Send size={14} /></IconBtn>}
                            {!isPosted && <IconBtn onClick={() => act(() => posts.delete(p.id), "Silindi.")} title="Sil" tone="rose"><Trash2 size={14} /></IconBtn>}
                          </div>
                        </div>

                        {/* Engagement detay */}
                        {isPosted && openDetailId === p.id && (
                          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex flex-wrap gap-4 text-xs font-black text-slate-600">
                                <span className="inline-flex items-center gap-1.5"><Heart size={13} className="text-rose-500" /> {num(metric?.likes)}</span>
                                <span className="inline-flex items-center gap-1.5"><MessageCircle size={13} className="text-indigo-500" /> {num(metric?.comments)}</span>
                                <span className="inline-flex items-center gap-1.5"><Share2 size={13} className="text-emerald-500" /> {num(metric?.shares)}</span>
                                <span className="inline-flex items-center gap-1.5"><Eye size={13} className="text-slate-400" /> {num(metric?.impressions || metric?.reach)}</span>
                              </div>
                              <button onClick={() => toggleDetail(p.id, true)} disabled={detailBusyId === p.id} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-600 hover:bg-white disabled:opacity-50">
                                <RefreshCw size={12} className={detailBusyId === p.id ? "animate-spin" : ""} /> Metrikleri Yenile
                              </button>
                            </div>
                            {!metric && detailBusyId !== p.id && <p className="text-xs font-semibold text-slate-400">Metrik yok. 'Metrikleri Yenile' ile platformdan çekin.</p>}
                            {comments.length > 0 && (
                              <div className="mt-2 space-y-2 border-t border-slate-200/70 pt-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yorumlar ({comments.length})</p>
                                {comments.slice(0, 10).map((c: any, i: number) => (
                                  <div key={c.id || i} className="rounded-xl bg-white px-3 py-2">
                                    <p className="text-[11px] font-black text-slate-600">{c.authorName || "Kullanıcı"}</p>
                                    <p className="text-xs font-medium text-slate-700">{c.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* === Sablonlar === */}
          {tab === "templates" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Şablonlar</h2>
                <a href="/templates" className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-500">
                  <ExternalLink size={13} /> Şablon Kütüphanesi
                </a>
              </div>
              {templateItems.length === 0 ? (
                <Empty text="Bu platform için şablon yok. Şablon Kütüphanesi'nden ekleyebilirsiniz." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {templateItems.map((t) => (
                    <div key={t.id} className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800">{t.name || t.title || `Şablon #${t.id}`}</p>
                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500">{t.platform === "both" ? "FB+IG" : t.platform}</span>
                      </div>
                      {(t.captionTemplate || t.body || t.template) && (
                        <p className="line-clamp-4 whitespace-pre-line text-xs font-medium text-slate-500">{t.captionTemplate || t.body || t.template}</p>
                      )}
                      {t.hashtags && <p className="mt-2 line-clamp-1 text-[11px] font-bold text-indigo-400">{t.hashtags}</p>}
                      <button onClick={() => useTemplate(t)} disabled={busy} className="mt-4 inline-flex items-center gap-2 self-start rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-50">
                        <PenSquare size={13} /> Şablonu Kullan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ConnBadge({ connected }: { connected: boolean | null }) {
  if (connected === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${connected ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
      {connected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {connected ? "Bağlı" : "Bağlı değil"}
    </span>
  );
}

function IconBtn({ onClick, title, children, tone = "slate" }: { onClick: () => void; title: string; children: React.ReactNode; tone?: "slate" | "rose" | "indigo" }) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 text-slate-600 hover:bg-slate-50",
    rose: "border-rose-100 text-rose-600 hover:bg-rose-50",
    indigo: "border-indigo-100 text-indigo-600 hover:bg-indigo-50",
  };
  return (
    <button onClick={onClick} title={title} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${tones[tone]}`}>
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm font-bold text-slate-400">{text}</p>;
}
