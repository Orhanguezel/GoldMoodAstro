"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ExternalLink,
  Eye,
  FileEdit,
  Heart,
  ImagePlus,
  Images,
  LayoutTemplate,
  ListChecks,
  MessageCircle,
  PenSquare,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { platforms, posts, templates, tenants } from "@/ekosistem/lib/api";
import { getStoredTenantKey, resolveTenantKey, setStoredTenantKey } from "@/ekosistem/lib/tenant";
import { getSocialPlatform } from "@/ekosistem/lib/social-platforms";

type TabKey = "analysis" | "account" | "compose" | "plan" | "drafts" | "queue" | "templates";

// Platformdan CANLI içerik (gerçek gönderi listesi + detay + yorum cevabı) çekilebilenler.
// YouTube 2026-08-09'da eklendi: backend /platforms/youtube/videos, .../details ve
// .../comments/:id/reply uçları FB/IG ile AYNI şekli döndürüyor, ek dallanma gerekmiyor.
const LIVE_CONTENT_PLATFORMS = ["facebook", "instagram", "youtube"];

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

function pct(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? `${n.toFixed(n >= 10 ? 1 : 2)}%` : "0%";
}

function isStoryPostItem(p: any) {
  const title = String(p?.title || "").toUpperCase();
  const ref = String(p?.sourceRef || "").toLowerCase();
  return title.includes("[STORY]") || /(^|[-:_])story/.test(ref);
}

function isReelPostItem(p: any) {
  const title = String(p?.title || "").toUpperCase();
  const ref = String(p?.sourceRef || "").toLowerCase();
  return title.includes("[REEL]") || /(^|[-:_])reel/.test(ref);
}

function isVideoUrl(url: string) {
  try {
    return [".mp4", ".mov", ".m4v", ".webm"].some((ext) => new URL(url, "https://dummy.local").pathname.toLowerCase().endsWith(ext));
  } catch {
    return [".mp4", ".mov", ".m4v", ".webm"].some((ext) => url.toLowerCase().endsWith(ext));
  }
}

function hasVideoMedia(p: any) {
  const urls = [p?.imageUrl, ...(Array.isArray(p?.mediaUrls) ? p.mediaUrls : [])].filter(Boolean).map(String);
  return urls.some(isVideoUrl);
}

/** Benzersiz medya URL listesi (imageUrl + mediaUrls, sırayı korur). */
function collectMedia(p: any): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u: unknown) => { const s = String(u ?? "").trim(); if (s && !seen.has(s)) { seen.add(s); out.push(s); } };
  push(p?.imageUrl);
  if (Array.isArray(p?.mediaUrls)) for (const u of p.mediaUrls) push(u);
  return out;
}

/** Benzersiz medya (görsel/video) sayısı — carousel tespiti için. */
function mediaCount(p: any): number {
  return collectMedia(p).length;
}

// ─── Hafta gruplama (yaklaşan içerikleri hafta hafta sayfalamak için) ───
function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const mondayOffset = (x.getDay() + 6) % 7; // 0 = Pazartesi
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

function weekLabel(d: Date): string {
  const s = weekStart(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  const sm = MONTH_NAMES[s.getMonth()];
  const em = MONTH_NAMES[e.getMonth()];
  return sm === em
    ? `${s.getDate()}–${e.getDate()} ${em}`
    : `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
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
  const [accountInfo, setAccountInfo] = useState<any | null>(null);
  const [accountState, setAccountState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [accountError, setAccountError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [draftItems, setDraftItems] = useState<any[]>([]);
  // İçerik uyumluluk denetimi: iddialar motordan mı geliyor? (kırmızı = yayın öncesi düzelt)
  const [complianceById, setComplianceById] = useState<Record<number, any>>({});
  const [complianceSummary, setComplianceSummary] = useState<{ total: number; ok: number; warn: number; fail: number } | null>(null);
  const [openComplianceId, setOpenComplianceId] = useState<number | null>(null);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [templateItems, setTemplateItems] = useState<any[]>([]);

  // Compose
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [postType, setPostType] = useState("tanitim");
  const [composeFormat, setComposeFormat] = useState<"feed" | "story" | "reel" | "carousel">("feed");
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
  const [accountDetailById, setAccountDetailById] = useState<Record<string, any>>({});
  const [accountDetailBusyId, setAccountDetailBusyId] = useState<string | null>(null);
  const [openAccountDetailId, setOpenAccountDetailId] = useState<string | null>(null);
  const [replyTextByCommentId, setReplyTextByCommentId] = useState<Record<string, string>>({});
  const [replyBusyCommentId, setReplyBusyCommentId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [previewGallery, setPreviewGallery] = useState<{ urls: string[]; index: number; title: string } | null>(null);

  function notify(kind: "ok" | "err", text: string) {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 6000);
  }

  function PreviewImage({ src, alt = "Görsel önizleme", className }: { src: string; alt?: string; className: string }) {
    return (
      <button
        type="button"
        onClick={() => setPreviewImage({ src, alt })}
        className="shrink-0 cursor-zoom-in rounded-2xl outline-none transition hover:scale-[1.015] focus:ring-4 focus:ring-amber-300/30"
        title="Büyüt"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
      </button>
    );
  }

  // Kapak + carousel: tıklayınca çok slaytlıysa TÜM slaytları galeri olarak açar.
  function MediaPreview({ p, className }: { p: any; className: string }) {
    const urls = collectMedia(p);
    if (urls.length === 0) {
      return <div className={`flex shrink-0 items-center justify-center bg-slate-200/60 text-slate-300 ${className}`}><ImagePlus size={30} /></div>;
    }
    const multi = urls.length > 1;
    return (
      <button
        type="button"
        onClick={() => multi
          ? setPreviewGallery({ urls, index: 0, title: p.caption || p.title || "" })
          : setPreviewImage({ src: urls[0]!, alt: p.title || "Görsel" })}
        className="relative shrink-0 cursor-zoom-in rounded-2xl outline-none transition hover:scale-[1.015] focus:ring-4 focus:ring-amber-300/30"
        title={multi ? `Carousel · ${urls.length} slayt — tümünü gör` : "Büyüt"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[0]} alt={p.title || "Görsel"} className={className} />
        {multi && (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-black text-white backdrop-blur">
            <Images size={11} /> {urls.length}
          </span>
        )}
      </button>
    );
  }

  // Canlı içerik uçları platforma göre değişir ama DÖNEN ŞEKİL aynı (externalId,
  // message, imageUrl, likes, comments, shares). Tek yerde eşle ki çağrı noktalarında
  // üçlü ternary çoğalmasın (YouTube eklenirken bu dallanma 4 yere yayılacaktı).
  function liveContentList(tk: string, limit: number): Promise<{ items: any[] }> {
    if (platformKey === "facebook") return platforms.facebookPosts(tk, limit);
    if (platformKey === "youtube") return platforms.youtubeVideos(tk, limit);
    return platforms.instagramMedia(tk, limit);
  }

  function liveContentInfo(tk: string): Promise<any> {
    if (platformKey === "facebook") return platforms.facebookInfo(tk).catch(() => null);
    if (platformKey === "youtube") return platforms.youtubeInfo(tk).catch(() => null);
    return platforms.instagramInfo(tk).catch(() => null);
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
        const [res, info] = await Promise.all([
          liveContentList(tk, 30),
          liveContentInfo(tk),
        ]);
        setAccountItems(res.items || []);
        setAccountInfo(info);
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
    setAccountInfo(null);
    setAccountDetailById({});
    setOpenAccountDetailId(null);
    setOpenComplianceId(null);
    try {
      const live = LIVE_CONTENT_PLATFORMS.includes(platformKey);
      const [st, createdPosts, scheduledPosts, tpl, complianceRes, livePosts, liveInfo] = await Promise.all([
        platforms.status(tk).catch(() => null),
        posts.list({ tenantKey: tk, platform: platformKey, limit: "200", sort: "created_at", order: "desc" }).catch(() => ({ items: [] })),
        posts.list({ tenantKey: tk, platform: platformKey, limit: "200", sort: "scheduled_at", order: "asc" }).catch(() => ({ items: [] })),
        templates.list(tk).catch(() => ({ items: [] })),
        posts.compliance({ tenantKey: tk, platform: platformKey, limit: "200" }).catch(() => ({ items: {}, summary: null })),
        live ? liveContentList(tk, 50).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        live ? liveContentInfo(tk).catch(() => null) : Promise.resolve(null),
      ]);
      setComplianceById((complianceRes as any)?.items ?? {});
      setComplianceSummary((complianceRes as any)?.summary ?? null);
      setConnected(!!st?.[platformKey]?.connected);
      if (liveInfo) setAccountInfo(liveInfo);
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
    if (schedule && composeFormat === "reel" && !isVideoUrl(imageUrl.trim())) {
      notify("err", "Reel zamanlamak için public MP4/MOV video URL gerekli.");
      return;
    }
    // YouTube videos.insert video dosyası ister; videosuz zamanlanan post yayın
    // anında "video dosyası bulunamadı" ile patlıyordu — burada yakala.
    if (schedule && config!.requiresVideo && !isVideoUrl(imageUrl.trim())) {
      notify("err", `${config!.label} zamanlamak için public MP4/MOV video URL gerekli.`);
      return;
    }
    setBusy(true);
    try {
      const formatTitle =
        composeFormat === "story"
          ? "[STORY] Story Taslağı"
          : composeFormat === "reel"
            ? "[REEL] Reel Taslağı"
            : composeFormat === "carousel"
              ? "Carousel Taslağı"
              : undefined;
      await posts.create({
        tenantKey,
        platform: platformKey,
        postType,
        ...(formatTitle ? { title: formatTitle } : {}),
        caption: caption.trim(),
        ...(imageUrl.trim() ? { mediaUrls: [imageUrl.trim()], imageUrl: imageUrl.trim() } : {}),
        ...(schedule ? { scheduledAt: localToIso(scheduledAt) } : {}),
        sourceType: "manual",
        sourceRef: `manual:${composeFormat}:${Date.now()}`,
        notes: composeFormat === "reel" && !isVideoUrl(imageUrl.trim()) ? "[reel_cover_only] Reel için video URL gerekli; bu kayıt kapak/senaryo taslağı." : undefined,
      });
      notify("ok", schedule ? "İçerik zamanlandı." : "Taslak kaydedildi.");
      setCaption("");
      setImageUrl("");
      setComposeFormat("feed");
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
    const templateName = String(t.name || "").toLowerCase();
    const nextFormat = templateName.includes("story")
      ? "story"
      : templateName.includes("reel")
        ? "reel"
        : templateName.includes("carousel") || templateName.includes("karusel")
          ? "carousel"
          : "feed";
    setCaption(`${base}${hash}`.trim());
    if (t.postType) setPostType(t.postType);
    setComposeFormat(nextFormat);
    setImageUrl("");
    setScheduledAt("");
    setTab("compose");
    notify("ok", `Şablon 'Oluştur' sekmesine yüklendi (${nextFormat}) — görsel ekleyip kaydedin.`);
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

  async function toggleAccountDetail(item: any, refresh = false) {
    const externalId = String(item?.externalId || "");
    if (!externalId) return notify("err", "Gönderi ID bulunamadı.");
    if (openAccountDetailId === externalId && !refresh) {
      setOpenAccountDetailId(null);
      return;
    }
    setOpenAccountDetailId(externalId);
    if (accountDetailById[externalId] && !refresh) return;
    setAccountDetailBusyId(externalId);
    try {
      const detail =
        platformKey === "facebook"
          ? await platforms.facebookPostDetails(tenantKey, externalId)
          : platformKey === "youtube"
            ? await platforms.youtubeVideoDetails(tenantKey, externalId)
            : await platforms.instagramMediaDetails(tenantKey, externalId);
      setAccountDetailById((s) => ({ ...s, [externalId]: detail }));
      setAccountItems((items) =>
        items.map((m) =>
          String(m.externalId) === externalId
            ? {
                ...m,
                likes: detail.likes ?? m.likes,
                comments: detail.comments ?? m.comments,
                shares: detail.shares ?? m.shares,
                imageUrl: detail.imageUrl ?? m.imageUrl,
                permalink: detail.permalink ?? m.permalink,
              }
            : m,
        ),
      );
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setAccountDetailBusyId(null);
    }
  }

  async function replyToAccountComment(item: any, commentId: string) {
    const text = (replyTextByCommentId[commentId] || "").trim();
    if (!text) return notify("err", "Cevap metni yazın.");
    setReplyBusyCommentId(commentId);
    try {
      if (platformKey === "facebook") {
        await platforms.replyFacebookComment(tenantKey, commentId, text);
      } else if (platformKey === "youtube") {
        await platforms.replyYoutubeComment(tenantKey, commentId, text);
      } else {
        await platforms.replyInstagramComment(tenantKey, commentId, text);
      }
      setReplyTextByCommentId((s) => ({ ...s, [commentId]: "" }));
      notify("ok", "Yorum cevabı gönderildi.");
      await toggleAccountDetail(item, true);
    } catch (e) {
      notify("err", (e as Error).message);
    } finally {
      setReplyBusyCommentId(null);
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
            <PreviewImage src={editImageUrl} className="h-24 w-20 rounded-lg border border-slate-200 bg-white object-contain" />
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

  const planCount = planItems.length;

  const supportsLive = LIVE_CONTENT_PLATFORMS.includes(platformKey);
  const hasLiveAccount = supportsLive || platformKey === "x";

  const analysis = useMemo(() => {
    const items = accountItems || [];
    const followers = num(accountInfo?.followers_count ?? accountInfo?.fan_count);
    const mediaCount = num(accountInfo?.media_count || items.length);
    const totals = items.reduce(
      (acc, item) => {
        const likes = num(item.likes);
        const comments = num(item.comments);
        const shares = num(item.shares);
        const views = num(item.impressions || item.views || item.reach);
        acc.likes += likes;
        acc.comments += comments;
        acc.shares += shares;
        acc.views += views;
        acc.engagement += likes + comments + shares;
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, views: 0, engagement: 0 },
    );
    const engagementRate = followers > 0 ? (totals.engagement / followers) * 100 : 0;
    const avgEngagement = items.length > 0 ? totals.engagement / items.length : 0;
    const topPosts = [...items]
      .map((item) => ({
        ...item,
        score: num(item.likes) + num(item.comments) * 2 + num(item.shares) * 3 + num(item.impressions || item.views || item.reach) * 0.01,
        engagement: num(item.likes) + num(item.comments) + num(item.shares),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const byFormat = new Map<string, { label: string; count: number; likes: number; comments: number; shares: number; engagement: number }>();
    for (const item of items) {
      const key = String(item.mediaType || (item.imageUrl ? "IMAGE" : "TEXT")).toUpperCase();
      const row = byFormat.get(key) || { label: key, count: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
      row.count += 1;
      row.likes += num(item.likes);
      row.comments += num(item.comments);
      row.shares += num(item.shares);
      row.engagement += num(item.likes) + num(item.comments) + num(item.shares);
      byFormat.set(key, row);
    }
    const formatRows = [...byFormat.values()].sort((a, b) => b.engagement - a.engagement);
    const bestFormat = formatRows[0]?.label || "-";
    const commentRate = totals.engagement > 0 ? (totals.comments / totals.engagement) * 100 : 0;
    const strategy: string[] = [];
    if (items.length === 0) {
      strategy.push("Analiz için önce hesap içeriklerini yenileyin veya yeni içerik paylaşın.");
    } else {
      if (bestFormat !== "-") strategy.push(`Şu an en güçlü format: ${bestFormat}. Benzer görsel dili ve içerik yapısını tekrar deneyin.`);
      if (commentRate < 10) strategy.push("Yorum oranı düşük: caption sonunda net soru/yorum çağrısı kullanın.");
      if (totals.shares === 0) strategy.push("Paylaşım düşük: kaydedilebilir mini rehber, carousel ve checklist formatlarını artırın.");
      if (engagementRate < 1) strategy.push("Etkileşim oranı düşük: daha kısa başlık, ilk görselde daha net vaad ve story destekli trafik deneyin.");
      if (engagementRate >= 1) strategy.push("Etkileşim fena değil: iyi performans veren ilk 3 gönderiyi varyasyonlayıp tekrar planlayın.");
    }
    return { followers, mediaCount, totals, engagementRate, avgEngagement, topPosts, formatRows, strategy };
  }, [accountInfo, accountItems]);

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: "plan", label: "Planlama", icon: CalendarDays, count: planCount },
    ...(supportsLive ? [{ key: "analysis" as TabKey, label: "Analiz", icon: BarChart3 }] : []),
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

  // Yaklasan icerikleri HAFTA HAFTA grupla (çok plan olunca sayfalama).
  const upcomingWeeks = useMemo(() => {
    const map = new Map<string, { start: Date; items: any[] }>();
    for (const p of upcoming) {
      const d = planDate(p);
      if (!d) continue;
      const ws = weekStart(d);
      const key = dayKey(ws);
      if (!map.has(key)) map.set(key, { start: ws, items: [] });
      map.get(key)!.items.push(p);
    }
    return [...map.values()].sort((a, b) => +a.start - +b.start);
  }, [upcoming]);
  const [weekIdx, setWeekIdx] = useState(0);
  useEffect(() => {
    // Hafta listesi değişince aralık dışına düşmesin.
    setWeekIdx((i) => Math.max(0, Math.min(i, Math.max(0, upcomingWeeks.length - 1))));
  }, [upcomingWeeks.length]);

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
    <div className="mx-auto max-w-screen-2xl space-y-8">
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
            {config.label} hesabı henüz bağlı değil. Bağlantı/token girişi <b>Ayarlar → Sosyal Medya</b>'dan yapılır.
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

      {/* İçerik uyumluluk özeti — kırmızı varsa yayından önce görülsün. */}
      {complianceSummary && complianceSummary.total > 0 && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold ${
            complianceSummary.fail > 0
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {complianceSummary.fail > 0 ? <XCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-600" />}
            İçerik uyumluluk
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-700">
            {complianceSummary.ok} uyumlu
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
            {complianceSummary.warn} iyileştir
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-[11px] font-black text-rose-700">
            {complianceSummary.fail} sorunlu
          </span>
          {complianceSummary.fail > 0 && (
            <span className="text-[11px] font-semibold">
              Kırmızı içerikler yayından önce düzeltilmeli — rozete tıklayıp gerekçeyi gör.
            </span>
          )}
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
          {/* === Analiz === */}
          {tab === "analysis" && (
            <section className="space-y-5">
              <div className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Sosyal Medya Analizi</h2>
                    <p className="text-xs font-semibold text-slate-400">
                      {config.label} için takipçi, izlenme ve etkileşim performansı. Strateji kararlarını buradan çıkaracağız.
                    </p>
                  </div>
                  <button onClick={() => loadAccount()} disabled={accountState === "loading"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                    <RefreshCw size={14} className={accountState === "loading" ? "animate-spin" : ""} /> Verileri Yenile
                  </button>
                </div>

                {accountState === "error" ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{accountError || "Analiz verisi çekilemedi."}</div>
                ) : accountState === "loading" ? (
                  <div className="flex justify-center py-16 text-slate-400"><RefreshCw className="animate-spin" size={28} /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <AnalysisCard label="Takipçi" value={analysis.followers} icon={<Users size={18} />} hint={platformKey === "facebook" ? "Sayfa takipçisi / fan" : "Instagram takipçisi"} />
                      <AnalysisCard label="İçerik" value={analysis.mediaCount || accountItems.length} icon={<ImagePlus size={18} />} hint="Hesaptaki/çekilen içerik" />
                      <AnalysisCard label="Beğeni" value={analysis.totals.likes} icon={<Heart size={18} />} hint="Son içerikler toplamı" />
                      <AnalysisCard label="Yorum" value={analysis.totals.comments} icon={<MessageCircle size={18} />} hint="Topluluk sinyali" />
                      <AnalysisCard label="Etkileşim Oranı" value={pct(analysis.engagementRate)} icon={<TrendingUp size={18} />} hint={`Ort. etkileşim: ${analysis.avgEngagement.toFixed(1)}`} />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-900">En İyi İçerikler</h3>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Son {accountItems.length} içerik</span>
                        </div>
                        {analysis.topPosts.length === 0 ? (
                          <Empty text="Analiz için canlı içerik bulunamadı." />
                        ) : (
                          <div className="space-y-3">
                            {analysis.topPosts.map((item: any, index: number) => (
                              <div key={item.externalId || index} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3">
                                {item.imageUrl ? (
                                  <PreviewImage src={item.imageUrl} className="h-24 w-24 rounded-xl bg-slate-950/5 object-contain ring-1 ring-slate-100" />
                                ) : (
                                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300">{config.icon(28)}</div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">#{index + 1}</span>
                                    {item.mediaType && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-500">{item.mediaType}</span>}
                                  </div>
                                  <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-700">{item.message || "(açıklama yok)"}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-black text-slate-600">
                                    <span className="inline-flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {num(item.likes)}</span>
                                    <span className="inline-flex items-center gap-1"><MessageCircle size={12} className="text-indigo-500" /> {num(item.comments)}</span>
                                    <span className="inline-flex items-center gap-1"><Share2 size={12} className="text-emerald-500" /> {num(item.shares)}</span>
                                    <span className="inline-flex items-center gap-1"><BarChart3 size={12} className="text-slate-400" /> {item.engagement}</span>
                                    {item.permalink && <a href={item.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600"><ExternalLink size={12} /> Aç</a>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5">
                          <h3 className="mb-4 text-sm font-black text-slate-900">Format Performansı</h3>
                          {analysis.formatRows.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-400">Henüz format verisi yok.</p>
                          ) : (
                            <div className="space-y-3">
                              {analysis.formatRows.map((row) => (
                                <div key={row.label}>
                                  <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
                                    <span>{row.label}</span>
                                    <span>{row.engagement} etkileşim</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, (row.engagement / Math.max(1, analysis.formatRows[0]?.engagement || 1)) * 100)}%` }} />
                                  </div>
                                  <p className="mt-1 text-[10px] font-semibold text-slate-400">{row.count} içerik · {row.likes} beğeni · {row.comments} yorum</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
                          <div className="mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-700" />
                            <h3 className="text-sm font-black text-amber-900">Strateji Notları</h3>
                          </div>
                          <div className="space-y-2">
                            {analysis.strategy.map((s, i) => (
                              <p key={i} className="rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">{s}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* === Hesap Icerigi (canli) === */}
          {tab === "account" && (
            <section className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hesap İçeriği</h2>
                  <p className="text-xs font-semibold text-slate-400">{config.label} hesabında yayında olan gerçek gönderiler (canlı).</p>
                </div>
                <div className="flex items-center gap-2">
                  {accountInfo && (
                    <div className="hidden items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-2 text-xs font-black text-amber-700 md:flex">
                      <Users size={14} />
                      {platformKey === "facebook"
                        ? `${num(accountInfo.followers_count ?? accountInfo.fan_count)} takipçi`
                        : `${num(accountInfo.followers_count)} takipçi`}
                      {accountInfo.media_count != null && <span className="text-amber-500">· {num(accountInfo.media_count)} içerik</span>}
                    </div>
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
                <Empty text="Bu hesapta yayında gönderi bulunamadı." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {accountItems.map((m) => {
                    const externalId = String(m.externalId || "");
                    const detail = accountDetailById[externalId];
                    const comments = detail?.commentItems || [];
                    const isOpen = openAccountDetailId === externalId;
                    const isBusy = accountDetailBusyId === externalId;
                    return (
                      <article key={externalId} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex gap-4">
                          {m.imageUrl ? (
                            <PreviewImage src={m.imageUrl} className="h-36 w-36 shrink-0 rounded-2xl bg-slate-950/5 object-contain ring-1 ring-slate-100 shadow-sm" />
                          ) : (
                            <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 ring-1 ring-slate-100">{config.icon(44)}</div>
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
                            <button
                              type="button"
                              onClick={() => toggleAccountDetail(m)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                              disabled={isBusy}
                            >
                              {isBusy ? <RefreshCw size={12} className="animate-spin" /> : isOpen ? <ChevronDown size={12} /> : <Eye size={12} />}
                              {isOpen ? "Kapat" : "Yorumlar"}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap gap-4 text-xs font-black text-slate-600">
                                <span className="inline-flex items-center gap-1.5"><Heart size={13} className="text-rose-500" /> {num(detail?.likes ?? m.likes)}</span>
                                <span className="inline-flex items-center gap-1.5"><MessageCircle size={13} className="text-indigo-500" /> {num(detail?.comments ?? m.comments)}</span>
                                <span className="inline-flex items-center gap-1.5"><Share2 size={13} className="text-emerald-500" /> {num(detail?.shares ?? m.shares)}</span>
                              </div>
                              <button onClick={() => toggleAccountDetail(m, true)} disabled={isBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                                <RefreshCw size={12} className={isBusy ? "animate-spin" : ""} /> Yenile
                              </button>
                            </div>
                            {detail?.commentsReadable === false && (
                              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                                Yorum detayları için Meta izinleri eksik olabilir; temel metrikler gösteriliyor.
                              </p>
                            )}
                            {!isBusy && comments.length === 0 && (
                              <p className="text-xs font-semibold text-slate-400">Henüz yorum yok.</p>
                            )}
                            {comments.length > 0 && (
                              <div className="space-y-3">
                                {comments.map((c: any, i: number) => (
                                  <div key={c.id || i} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-[11px] font-black text-slate-600">{c.authorName || "Kullanıcı"}</p>
                                        <p className="mt-1 text-xs font-medium leading-5 text-slate-700">{c.message}</p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(c.createdTime)} · ❤ {num(c.likeCount)}</p>
                                      </div>
                                    </div>
                                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                                      <div className="mt-2 space-y-2 border-l-2 border-indigo-100 pl-3">
                                        {c.replies.map((r: any) => (
                                          <div key={r.id} className="rounded-lg bg-white px-3 py-2">
                                            <p className="text-[10px] font-black text-indigo-600">{r.authorName || "Cevap"}</p>
                                            <p className="text-xs font-medium text-slate-700">{r.message}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                      <input
                                        value={replyTextByCommentId[c.id] || ""}
                                        onChange={(e) => setReplyTextByCommentId((s) => ({ ...s, [c.id]: e.target.value }))}
                                        placeholder="Yoruma cevap yaz..."
                                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                                      />
                                      <button
                                        onClick={() => replyToAccountComment(m, c.id)}
                                        disabled={replyBusyCommentId === c.id}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition hover:bg-slate-700 disabled:opacity-50"
                                      >
                                        {replyBusyCommentId === c.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />} Cevapla
                                      </button>
                                    </div>
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
                    <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">Format</span>
                    <select value={composeFormat} onChange={(e) => setComposeFormat(e.target.value as typeof composeFormat)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                      <option value="feed">Feed Post</option>
                      <option value="story">Story</option>
                      <option value="reel">Reel Taslağı</option>
                      <option value="carousel">Carousel</option>
                    </select>
                    {composeFormat === "reel" && (
                      <span className="block rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-bold leading-5 text-violet-700">
                        Reel için public MP4/MOV video URL girersen otomatik yayınlanabilir; sadece görsel girersen kapak/senaryo taslağı kalır.
                      </span>
                    )}
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
                  <PreviewImage src={imageUrl} alt="önizleme" className="h-40 w-32 rounded-xl border border-slate-200 bg-slate-50 object-contain" />
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
                            {items.slice(0, 3).map((it, idx) =>
                              it.imageUrl ? (
                                <PreviewImage key={idx} src={it.imageUrl} className="h-9 w-9 rounded-md object-cover ring-1 ring-slate-200" />
                              ) : (
                                <div key={idx} className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-200/70 text-slate-400">{config.icon(16)}</div>
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
                    const isUpcomingView = !activeDay && upcoming.length > 0;
                    const wi = Math.max(0, Math.min(weekIdx, upcomingWeeks.length - 1));
                    const list = activeDay ? dayItems : isUpcomingView ? (upcomingWeeks[wi]?.items ?? []) : recent;

                    const renderRow = (p: any) => {
                      const isStory = (p.title || "").includes("[STORY]");
                      const mc = mediaCount(p);
                      const isCarousel = mc > 1 && !isStory;
                      if (editId === p.id) {
                        return <div key={p.id} className="py-3">{renderEditor(p)}</div>;
                      }
                      return (
                        <div key={p.id} className="flex items-center gap-3 py-3">
                          <MediaPreview p={p} className="h-40 w-32 rounded-xl bg-slate-950/5 object-contain ring-1 ring-slate-100 shadow-sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${isStory ? "bg-fuchsia-100 text-fuchsia-600" : "bg-sky-100 text-sky-600"}`}>{isStory ? "Story" : "Post"}</span>
                              {isCarousel && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700"><Images size={10} /> Carousel · {mc}</span>
                              )}
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
                    };

                    return (
                      <>
                        {isUpcomingView && upcomingWeeks.length > 1 && (
                          <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                            <button onClick={() => setWeekIdx(Math.max(0, wi - 1))} disabled={wi === 0} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={14} /> Önceki</button>
                            <div className="text-center">
                              <div className="text-xs font-black text-slate-700">{weekLabel(upcomingWeeks[wi]!.start)}</div>
                              <div className="text-[10px] font-bold text-slate-400">Hafta {wi + 1}/{upcomingWeeks.length} · {upcomingWeeks[wi]!.items.length} içerik</div>
                            </div>
                            <button onClick={() => setWeekIdx(Math.min(upcomingWeeks.length - 1, wi + 1))} disabled={wi >= upcomingWeeks.length - 1} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30">Sonraki <ChevronRight size={14} /></button>
                          </div>
                        )}
                        {list.length === 0 ? (
                          <Empty text={activeDay ? "Bu güne ait içerik yok. 'Bu güne içerik' ile ekleyin." : "Henüz içerik yok. 'Oluştur' ile ekleyin ya da haftalık otomasyon doldursun."} />
                        ) : (
                          <div className="divide-y divide-slate-200/70">{list.map(renderRow)}</div>
                        )}
                      </>
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
                          <div className="flex min-w-0 flex-1 gap-5">
                            {collectMedia(p).length > 0 && (
                              <MediaPreview p={p} className="h-56 w-40 shrink-0 rounded-2xl bg-slate-950/5 object-contain ring-1 ring-slate-100 shadow-md md:h-64 md:w-48" />
                            )}
                            <div className="min-w-0 pt-1">
                              <div className="mb-2 flex flex-wrap gap-2">
                                {isStoryPostItem(p) && <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-[10px] font-black uppercase text-fuchsia-700">Story</span>}
                                {isReelPostItem(p) && <span className="rounded-md bg-violet-100 px-2 py-1 text-[10px] font-black uppercase text-violet-700">Reel Taslağı</span>}
                                {!isStoryPostItem(p) && !isReelPostItem(p) && mediaCount(p) > 1 && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700"><Images size={11} /> Carousel · {mediaCount(p)}</span>
                                )}
                                <ComplianceBadge
                                  audit={complianceById[p.id]}
                                  open={openComplianceId === p.id}
                                  onToggle={() => setOpenComplianceId(openComplianceId === p.id ? null : p.id)}
                                />
                              </div>
                              {openComplianceId === p.id && <ComplianceDetails audit={complianceById[p.id]} />}
                              <p className="text-sm font-semibold leading-6 text-slate-800">{p.caption || p.title || "(içerik yok)"}</p>
                              <p className="mt-1 text-[11px] font-bold text-slate-400">{formatDate(p.createdAt)} · {p.postType}</p>
                              {isReelPostItem(p) && !hasVideoMedia(p) && (
                                <p className="mt-2 rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-bold leading-5 text-violet-700">
                                  Reel yayını için public MP4/MOV video URL ekle. Şu an bu kayıt kapak/senaryo taslağı.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <IconBtn onClick={() => openEdit(p)} title="Düzenle"><FileEdit size={14} /></IconBtn>
                            {isReelPostItem(p) && !hasVideoMedia(p) ? (
                              <span className="inline-flex min-h-9 items-center rounded-xl border border-violet-100 bg-violet-50 px-3 text-[10px] font-black uppercase tracking-wide text-violet-700">
                                Video Gerekli
                              </span>
                            ) : (
                              <>
                                <IconBtn onClick={() => scheduleExisting(p.id)} title="Zamanla"><CalendarClock size={14} /></IconBtn>
                                <IconBtn onClick={() => publishNow(p.id)} title="Hemen Yayınla" tone="indigo"><Send size={14} /></IconBtn>
                              </>
                            )}
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
                              <PreviewImage src={thumb} className="h-40 w-32 shrink-0 rounded-xl border border-slate-100 bg-slate-950/5 object-contain ring-1 ring-slate-100 shadow-sm" />
                            ) : (
                              <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300 ring-1 ring-slate-100">{config.icon(34)}</div>
                            )}
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-800">{p.caption || p.title || "(içerik yok)"}</p>
                              <p className="mt-1 text-[11px] font-bold text-slate-400">
                                {p.status === "scheduled" ? `Zaman: ${formatDate(p.scheduledAt)}` : isPosted ? `Yayın: ${formatDate(p.postedAt)}` : formatDate(p.createdAt)}
                                {p.lastError ? ` · ${p.lastError}` : ""}
                              </p>
                              {/* Uyumluluk rozeti kuyrukta özellikle önemli: burada içerik
                                  HENÜZ YAYINLANMADI, düzeltmek için son şans. */}
                              <div className="mt-2">
                                <ComplianceBadge
                                  audit={complianceById[p.id]}
                                  open={openComplianceId === p.id}
                                  onToggle={() => setOpenComplianceId(openComplianceId === p.id ? null : p.id)}
                                />
                              </div>
                              {openComplianceId === p.id && <ComplianceDetails audit={complianceById[p.id]} />}
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
                            {(p.status === "scheduled" || p.status === "failed") && (
                              isReelPostItem(p) && !hasVideoMedia(p) ? (
                                <span className="inline-flex min-h-9 items-center rounded-xl border border-violet-100 bg-violet-50 px-3 text-[10px] font-black uppercase tracking-wide text-violet-700">
                                  Video Gerekli
                                </span>
                              ) : (
                                <IconBtn onClick={() => publishNow(p.id)} title="Hemen Yayınla" tone="indigo"><Send size={14} /></IconBtn>
                              )
                            )}
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

      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Görsel önizleme"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
            title="Kapat"
          >
            <XCircle size={22} />
          </button>
          <div className="max-h-[92vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[92vh] max-w-[92vw] rounded-3xl bg-white object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Carousel galeri: tüm slaytlar (ileri/geri + thumbnail şeridi) */}
      {previewGallery && (() => {
        const g = previewGallery;
        const idx = Math.max(0, Math.min(g.index, g.urls.length - 1));
        const go = (n: number) => setPreviewGallery({ ...g, index: (n + g.urls.length) % g.urls.length });
        return (
          <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
            onClick={() => setPreviewGallery(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Carousel önizleme"
          >
            <button
              type="button"
              onClick={() => setPreviewGallery(null)}
              className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white"
              title="Kapat"
            >
              <XCircle size={22} />
            </button>
            <div className="mb-3 text-center text-sm font-black text-white/90">
              Slayt {idx + 1} / {g.urls.length}
              {g.title && <span className="ml-2 font-semibold text-white/50">· {g.title.slice(0, 60)}</span>}
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              {g.urls.length > 1 && (
                <button type="button" onClick={() => go(idx - 1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white" title="Önceki">
                  <ChevronLeft size={24} />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.urls[idx]} alt={`slayt ${idx + 1}`} className="max-h-[74vh] max-w-[80vw] rounded-3xl bg-white object-contain shadow-2xl" />
              {g.urls.length > 1 && (
                <button type="button" onClick={() => go(idx + 1)} className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:bg-white" title="Sonraki">
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            {g.urls.length > 1 && (
              <div className="mt-4 flex max-w-[92vw] gap-2 overflow-x-auto p-1" onClick={(e) => e.stopPropagation()}>
                {g.urls.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={u}
                    alt={`küçük ${i + 1}`}
                    onClick={() => setPreviewGallery({ ...g, index: i })}
                    className={`h-16 w-16 shrink-0 cursor-pointer rounded-lg object-cover ring-2 transition ${i === idx ? "ring-amber-400" : "ring-white/20 hover:ring-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}


/**
 * İçerik uyumluluk rozeti — "bu postun iddiaları kaynağına sadık mı?"
 *
 * Tasarım kararı: çıplak puan ne düzelteceğini söylemez. Rozet tıklanabilir;
 * açılınca her bulgunun gerekçesi ve ÖNERİSİ görünür. Kırmızı = yayın öncesi düzelt.
 */
function ComplianceBadge({ audit, open, onToggle }: { audit: any; open: boolean; onToggle: () => void }) {
  if (!audit) return null;
  const style =
    audit.level === "fail"
      ? "bg-rose-100 text-rose-700 ring-rose-200"
      : audit.level === "warn"
        ? "bg-amber-100 text-amber-700 ring-amber-200"
        : "bg-emerald-100 text-emerald-700 ring-emerald-200";
  const label = audit.level === "fail" ? "Sorunlu" : audit.level === "warn" ? "İyileştir" : "Uyumlu";
  const Icon = audit.level === "fail" ? XCircle : audit.level === "warn" ? Sparkles : CheckCircle2;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={audit.findings?.length ? "Gerekçeleri gör" : "Sorun yok"}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide ring-1 transition hover:brightness-95 ${style}`}
    >
      <Icon size={11} />
      {label} · {audit.score}
      {audit.findings?.length > 0 && <ChevronDown size={11} className={open ? "rotate-180 transition" : "transition"} />}
    </button>
  );
}

function ComplianceDetails({ audit }: { audit: any }) {
  if (!audit?.findings?.length) return null;
  return (
    <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {audit.findings.map((f: any) => (
        <div key={f.rule} className="text-[11px] leading-5">
          <span className={`mr-2 rounded px-1.5 py-0.5 font-black uppercase ${f.level === "fail" ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"}`}>
            {f.level === "fail" ? "Sorun" : "Uyarı"}
          </span>
          <span className="font-bold text-slate-800">{f.message}</span>
          <div className="mt-0.5 pl-1 text-slate-500">↳ {f.hint}</div>
        </div>
      ))}
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

function AnalysisCard({ label, value, icon, hint }: { label: string; value: React.ReactNode; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">
        {typeof value === "number" ? num(value).toLocaleString("tr-TR") : value}
      </p>
      {hint && <p className="mt-1 text-[11px] font-semibold text-slate-400">{hint}</p>}
    </div>
  );
}
