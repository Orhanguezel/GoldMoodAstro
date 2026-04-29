"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headset, Send, X } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import {
  useAdminChatMessages,
  useAdminChatThreads,
  useAdminTakeOverThread,
  useCreateOrGetChatThread,
  useChatMessages,
  usePostChatMessage,
  useRequestAdminHandoff,
} from "@/features/chat";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfile } from "@/features/profiles/profiles.action";
import { useLocaleShort } from "@/i18n/useLocaleShort";
import { useUiSection } from "@/i18n/uiDb";
import { useCreateContactPublicMutation, useGetSiteSettingByKeyQuery } from "@/integrations/rtk/hooks";

/* ─── Theme tokens — design-token tabanli, dark/light otomatik ────────── */
// CSS var'lar globals.css + tokensToCSS uretir; [data-theme="dark"] override eder.
const C = {
  // brand (light/dark'ta ayni — gold)
  rose900: "var(--gm-primary)",                                              // brand primary
  rose800: "var(--gm-primary-dark)",                                         // brand primary dark
  rose700: "var(--gm-primary-light)",                                        // brand primary light
  rose600: "var(--gm-gold-deep)",                                            // gold deep aksent
  rose200: "color-mix(in srgb, var(--gm-primary) 28%, transparent)",         // soft border (gold)
  rose100: "var(--gm-gold-100)",                                             // gold tint (light arka)
  rose50:  "color-mix(in srgb, var(--gm-primary) 8%, transparent)",          // very soft gold
  // surface / text — dark/light otomatik
  sand900: "var(--gm-text)",                                                 // birincil text
  sand800: "var(--gm-text-dim)",                                             // ikincil text
  sand600: "var(--gm-muted)",                                                // muted text
  sand300: "var(--gm-border)",                                               // standart kenarlik
  sand200: "var(--gm-border-soft)",                                          // yumusak kenarlik
  sand100: "var(--gm-surface-high)",                                         // panel ust yuzey
  sand50:  "var(--gm-bg-deep)",                                              // panel derin yuzey
  white:   "var(--gm-surface)",                                              // ana panel zemin (light: beyaz, dark: koyu)
  charcoal: "var(--gm-sand-900)",                                            // koyu kontrast (admin gradient)
  primaryFg: "#FFFFFF",                                                      // gold zemin uzerine sabit kontrast
} as const;

/* ─── Locale fallbacks (DB ui_chat.* yoksa devreye girer) ────────── */
const CHAT_FALLBACKS: Record<string, Record<string, string>> = {
  tr: {
    ui_chat_title: "Destek",
    ui_chat_subtitle: "Yapay zeka destekli yardım",
    ui_chat_placeholder: "Mesajınızı yazın...",
    ui_chat_send: "Gönder",
    ui_chat_loading: "Hazırlanıyor...",
    ui_chat_empty: "Merhaba, size nasıl yardımcı olabilirim?",
    ui_chat_ai_mode: "Yapay zeka aktif",
    ui_chat_admin_mode: "Canlı destek istendi",
    ui_chat_admin_inbox: "Canlı destek gelen kutusu",
    ui_chat_no_admin_threads: "Henüz canlı destek talebi yok.",
    ui_chat_thread_label: "Talep",
    ui_chat_queue_pending: "Atanmamış",
    ui_chat_queue_mine: "Bana atananlar",
    ui_chat_queue_all: "Tümü",
    ui_chat_unread_label: "yeni mesaj",
    ui_chat_connect_admin: "Canlı destek ile görüş",
    ui_chat_connecting: "Bağlanıyor...",
    ui_chat_login_button: "Giriş yap",
    ui_chat_guest_intro: "Giriş yapmadan da mesaj bırakabilirsiniz. Doğrudan sohbet için giriş yapın.",
    ui_chat_guest_name: "Adınız",
    ui_chat_guest_email: "E-posta adresiniz",
    ui_chat_guest_phone: "Telefon numaranız",
    ui_chat_guest_message: "Konunuz nedir?",
    ui_chat_guest_submit: "Mesajı gönder",
    ui_chat_guest_sending: "Gönderiliyor...",
    ui_chat_guest_wait: "Lütfen daha sonra tekrar deneyin",
    ui_chat_guest_success: "Teşekkürler. Mesajınız iletildi, en kısa sürede dönüş yapacağız.",
    ui_chat_guest_error: "Gönderilemedi. Lütfen tekrar deneyin veya iletişim sayfasını kullanın.",
  },
  en: {
    ui_chat_title: "Support",
    ui_chat_subtitle: "AI-powered help",
    ui_chat_placeholder: "Type your message...",
    ui_chat_send: "Send",
    ui_chat_loading: "Preparing...",
    ui_chat_empty: "Hello, how can I help you?",
    ui_chat_ai_mode: "AI active",
    ui_chat_admin_mode: "Live support requested",
    ui_chat_admin_inbox: "Live support inbox",
    ui_chat_no_admin_threads: "No live support requests yet.",
    ui_chat_thread_label: "Request",
    ui_chat_queue_pending: "Unassigned",
    ui_chat_queue_mine: "Assigned to me",
    ui_chat_queue_all: "All",
    ui_chat_unread_label: "new messages",
    ui_chat_connect_admin: "Connect with live support",
    ui_chat_connecting: "Connecting...",
    ui_chat_login_button: "Sign in",
    ui_chat_guest_intro: "You can leave a message without logging in. Sign in for direct chat.",
    ui_chat_guest_name: "Your name",
    ui_chat_guest_email: "Your email",
    ui_chat_guest_phone: "Phone number",
    ui_chat_guest_message: "What is it about?",
    ui_chat_guest_submit: "Send message",
    ui_chat_guest_sending: "Sending...",
    ui_chat_guest_wait: "Please try again later",
    ui_chat_guest_success: "Thanks. Your message has been sent, we will get back to you soon.",
    ui_chat_guest_error: "Send failed. Please try again or use the contact page.",
  },
  de: {
    ui_chat_title: "Support",
    ui_chat_subtitle: "KI-Support",
    ui_chat_placeholder: "Nachricht eingeben...",
    ui_chat_send: "Senden",
    ui_chat_loading: "Wird vorbereitet...",
    ui_chat_empty: "Hallo, wie kann ich Ihnen helfen?",
    ui_chat_ai_mode: "KI aktiv",
    ui_chat_admin_mode: "Live-Support angefordert",
    ui_chat_admin_inbox: "Live-Support Posteingang",
    ui_chat_no_admin_threads: "Noch keine Live-Support-Anfragen.",
    ui_chat_thread_label: "Anfrage",
    ui_chat_queue_pending: "Nicht zugewiesen",
    ui_chat_queue_mine: "Mir zugewiesen",
    ui_chat_queue_all: "Alle",
    ui_chat_unread_label: "neue Nachrichten",
    ui_chat_connect_admin: "Mit Live-Support verbinden",
    ui_chat_connecting: "Verbinde...",
    ui_chat_login_button: "Anmelden",
    ui_chat_guest_intro: "Ohne Login können Sie eine Nachricht hinterlassen. Für den direkten Chat melden Sie sich bitte an.",
    ui_chat_guest_name: "Ihr Name",
    ui_chat_guest_email: "Ihre E-Mail",
    ui_chat_guest_phone: "Telefonnummer",
    ui_chat_guest_message: "Worum geht es?",
    ui_chat_guest_submit: "Nachricht senden",
    ui_chat_guest_sending: "Wird gesendet...",
    ui_chat_guest_wait: "Bitte später erneut versuchen",
    ui_chat_guest_success: "Danke. Ihre Nachricht wurde gesendet. Wir melden uns so bald wie möglich.",
    ui_chat_guest_error: "Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder nutzen Sie die Kontaktseite.",
  },
};

const SUPPORT_CONTEXT_ID_FALLBACK = "11111111-1111-1111-1111-111111111111";
const AI_ASSISTANT_USER_ID = "00000000-0000-0000-0000-00000000a11f";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GUEST_LEAD_COOLDOWN_MS = 10 * 60 * 1000;
type AdminQueueFilter = "pending" | "mine" | "all";

function getUserKey(user?: { id?: string | null; email?: string | null }): string {
  const id = String(user?.id ?? "").trim();
  if (id) return `id:${id}`;
  const email = String(user?.email ?? "").trim().toLowerCase();
  if (email) return `email:${email}`;
  return "anon";
}

function supportContextStorageKey(userKey: string): string {
  return `support-chat-context:${userKey}`;
}

function loadOrCreateSupportContextId(userKey: string): string {
  if (typeof window === "undefined") return SUPPORT_CONTEXT_ID_FALLBACK;

  const key = supportContextStorageKey(userKey);
  const existing = String(window.localStorage.getItem(key) ?? "").trim();
  if (UUID_RE.test(existing)) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function isAdminUser(user: any): boolean {
  const roleRaw = String(user?.role ?? "").toLowerCase();
  if (roleRaw === "admin") return true;
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return roles.some((r: any) => String(r?.role || "").toLowerCase() === "admin");
}

function renderMessageText(raw: string, isMine: boolean) {
  const text = raw.replace("[ADMIN_REQUEST_NOTE] ", "");
  const parts = text.split(/(https?:\/\/[^\s<]+)/g);
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s<]+$/.test(part)) {
      return (
        <a
          key={`${part}-${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isMine ? C.rose100 : C.rose700,
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {part}
        </a>
      );
    }
    return <span key={`${idx}-${part.slice(0, 12)}`}>{part}</span>;
  });
}

function guestLeadCooldownKey(): string {
  return "support-chat-guest-lead-last-at";
}

export default function SupportBotWidget() {
  // Hidration safety — client-only render. SSR'da default state ile çakışan
  // inline style'lar (border-radius 50% vs 14, longhand vs shorthand) hidration
  // mismatch üretiyor; mount sonrasına ertele.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const widgetSetting = useGetSiteSettingByKeyQuery({ key: "chat_widget_enabled" });
  const widgetEnabled = useMemo(() => {
    const v = widgetSetting.data?.value;
    if (v === undefined || v === null) return true;
    if (v === false || v === 0) return false;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "" || s === "false" || s === "0" || s === "no" || s === "off") return false;
    }
    return true;
  }, [widgetSetting.data?.value]);

  const locale = useLocaleShort();
  const welcomeSetting = useGetSiteSettingByKeyQuery({ key: "chat_ai_welcome_message", locale });
  const { ui } = useUiSection("ui_chat", locale);
  const t = useCallback(
    (key: string, hardFallback: string) => {
      const v = ui(key, "");
      if (v && v !== key) return v;
      const dict = CHAT_FALLBACKS[locale] || CHAT_FALLBACKS.tr;
      return dict[key] ?? hardFallback;
    },
    [ui, locale],
  );

  const { isAuthenticated, user } = useAuthStore();
  const { data: profile } = useProfile({ enabled: isAuthenticated });
  const [createContact, createContactState] = useCreateContactPublicMutation();
  const roleBasedAdmin = useMemo(() => isAdminUser(user), [user]);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [threadId, setThreadId] = useState<string>("");
  const [handoffMode, setHandoffMode] = useState<"ai" | "admin">("ai");
  const [queueFilter, setQueueFilter] = useState<AdminQueueFilter>("pending");
  const [input, setInput] = useState("");
  const [guestLead, setGuestLead] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "",
  });
  const [guestLeadSuccess, setGuestLeadSuccess] = useState("");
  const [guestLeadError, setGuestLeadError] = useState("");
  const [guestLeadCooldownUntil, setGuestLeadCooldownUntil] = useState(0);
  const [supportContextId, setSupportContextId] = useState<string>(SUPPORT_CONTEXT_ID_FALLBACK);
  const takenOverThreadsRef = useRef<Set<string>>(new Set());
  const seenByThreadRef = useRef<Record<string, number>>({});
  const prevUnreadRef = useRef(0);
  const userKey = useMemo(() => getUserKey({ id: user?.id, email: user?.email }), [user?.id, user?.email]);

  const createThread = useCreateOrGetChatThread();
  const adminThreadsQuery = useAdminChatThreads(
    { handoff_mode: "admin", limit: 50, offset: 0 },
    { enabled: open && isAuthenticated && roleBasedAdmin, refetchInterval: 15_000, retry: false },
  );
  const isAdmin = roleBasedAdmin;
  const adminCheckPending = false;
  const userMessagesQuery = useChatMessages(
    threadId,
    { limit: 80 },
    {
      enabled: open && isAuthenticated && !isAdmin && !!threadId,
      refetchInterval: 5_000,
    },
  );
  const adminMessagesQuery = useAdminChatMessages(
    threadId,
    { limit: 80 },
    { enabled: open && isAuthenticated && isAdmin && !!threadId, refetchInterval: 5_000, retry: false },
  );
  const adminTakeOver = useAdminTakeOverThread(threadId);
  const postMessage = usePostChatMessage(threadId);
  const requestAdmin = useRequestAdminHandoff(threadId);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !isAuthenticated || adminCheckPending || isAdmin || threadId || createThread.isPending) return;

    createThread.mutate(
      { context_type: "request", context_id: supportContextId },
      {
        onSuccess: (res) => {
          const mode = (res.thread.handoff_mode as "ai" | "admin") || "ai";
          setThreadId(res.thread.id);
          setHandoffMode(mode);
        },
      },
    );
  }, [open, isAuthenticated, adminCheckPending, isAdmin, threadId, createThread, supportContextId, userKey]);

  const adminThreads = useMemo(() => {
    const rows = adminThreadsQuery.data?.items ?? [];
    return rows
      .map((item: any) => (item?.thread ? item.thread : item))
      .filter((item: any) => item?.id)
      .sort((a: any, b: any) => {
        const aPending = !a?.assigned_admin_user_id ? 1 : 0;
        const bPending = !b?.assigned_admin_user_id ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return new Date(b?.updated_at ?? 0).getTime() - new Date(a?.updated_at ?? 0).getTime();
      });
  }, [adminThreadsQuery.data?.items]);

  const filteredAdminThreads = useMemo(() => {
    const me = String(user?.id ?? "");
    if (queueFilter === "all") return adminThreads;
    if (queueFilter === "mine") {
      return adminThreads.filter((th: any) => String(th?.assigned_admin_user_id ?? "") === me);
    }
    return adminThreads.filter((th: any) => !th?.assigned_admin_user_id);
  }, [adminThreads, queueFilter, user?.id]);

  const unreadCount = useMemo(() => {
    return filteredAdminThreads.reduce((acc: number, th: any) => {
      const updated = new Date(th?.updated_at ?? 0).getTime();
      const seen = Number(seenByThreadRef.current[th.id] ?? 0);
      return acc + (updated > seen ? 1 : 0);
    }, 0);
  }, [filteredAdminThreads]);

  useEffect(() => {
    if (!open || !isAuthenticated || !isAdmin) return;
    const first = filteredAdminThreads[0];
    if (!first) {
      setThreadId("");
      setHandoffMode("admin");
      return;
    }
    const exists = filteredAdminThreads.some((th: any) => th.id === threadId);
    if (!threadId || !exists) {
      setThreadId(first.id);
      setHandoffMode("admin");
    }
  }, [open, isAuthenticated, isAdmin, filteredAdminThreads, threadId]);

  useEffect(() => {
    if (!isAdmin || !threadId || takenOverThreadsRef.current.has(threadId)) return;
    takenOverThreadsRef.current.add(threadId);
    adminTakeOver.mutate(undefined, {
      onError: () => {
        takenOverThreadsRef.current.delete(threadId);
      },
    });
  }, [isAdmin, threadId, adminTakeOver]);

  useEffect(() => {
    if (!isAuthenticated) {
      takenOverThreadsRef.current.clear();
      setSupportContextId(SUPPORT_CONTEXT_ID_FALLBACK);
      setThreadId("");
      setHandoffMode("ai");
      return;
    }
    takenOverThreadsRef.current.clear();
    if (isAdmin) {
      setThreadId("");
      setHandoffMode("admin");
      return;
    }
    setSupportContextId(loadOrCreateSupportContextId(userKey));
    setThreadId("");
    setHandoffMode("ai");
  }, [isAuthenticated, isAdmin, userKey]);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;
    const key = `support-chat-seen:${userKey}`;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, number>;
      seenByThreadRef.current = parsed || {};
    } catch {
      seenByThreadRef.current = {};
    }
  }, [isAdmin, userKey]);

  useEffect(() => {
    if (!isAdmin || !threadId) return;
    const current = adminThreads.find((th: any) => th.id === threadId);
    if (!current) return;
    const stamp = new Date(current.updated_at ?? 0).getTime();
    if (!stamp) return;
    seenByThreadRef.current[threadId] = stamp;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`support-chat-seen:${userKey}`, JSON.stringify(seenByThreadRef.current));
    }
  }, [isAdmin, threadId, adminThreads, userKey, adminMessagesQuery.data?.items?.length]);

  useEffect(() => {
    if (!isAdmin || !open) return;
    if (unreadCount <= prevUnreadRef.current) {
      prevUnreadRef.current = unreadCount;
      return;
    }
    prevUnreadRef.current = unreadCount;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      setTimeout(() => ctx.close?.(), 150);
    } catch {
      // no-op
    }
  }, [isAdmin, open, unreadCount]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [userMessagesQuery.data?.items?.length, adminMessagesQuery.data?.items?.length, open]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = Number(window.localStorage.getItem(guestLeadCooldownKey()) || 0);
    if (Number.isFinite(raw) && raw > Date.now()) setGuestLeadCooldownUntil(raw);
  }, []);

  const items = (isAdmin ? adminMessagesQuery.data?.items : userMessagesQuery.data?.items) ?? [];
  const canSend =
    isAuthenticated &&
    !!threadId &&
    input.trim().length > 0 &&
    !postMessage.isPending &&
    (!isAdmin || !adminTakeOver.isPending);
  const statusText = isAdmin
    ? t("ui_chat_admin_inbox", "Live-Support Posteingang")
    : handoffMode === "admin"
      ? t("ui_chat_admin_mode", "Live-Support angefordert")
      : t("ui_chat_ai_mode", "KI aktiv");
  const displayName = user?.full_name?.trim() || user?.email?.split("@")[0] || "User";
  const myAvatar = profile?.avatar_url || null;
  const welcomeText = useMemo(() => {
    const raw = welcomeSetting.data?.value;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    return t("ui_chat_empty", "Hallo, wie kann ich Ihnen helfen?");
  }, [welcomeSetting.data?.value, t]);
  const guestLeadDisabled = useMemo(
    () =>
      !guestLead.name.trim() ||
      !guestLead.email.trim() ||
      !guestLead.phone.trim() ||
      guestLead.message.trim().length < 10 ||
      createContactState.isLoading ||
      guestLeadCooldownUntil > Date.now(),
    [guestLead, createContactState.isLoading, guestLeadCooldownUntil],
  );

  const headerGradient = useMemo(
    () =>
      isAdmin
        ? `linear-gradient(135deg, ${C.charcoal} 0%, ${C.sand900} 100%)`
        : `linear-gradient(135deg, ${C.rose900} 0%, ${C.rose800} 100%)`,
    [isAdmin],
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || !threadId) return;
    setInput("");
    postMessage.mutate({ text, client_id: crypto.randomUUID() });
  };

  const handleGuestLeadSubmit = async () => {
    if (guestLeadCooldownUntil > Date.now()) return;

    setGuestLeadError("");
    setGuestLeadSuccess("");

    try {
      await createContact({
        name: guestLead.name.trim(),
        email: guestLead.email.trim(),
        phone: guestLead.phone.trim(),
        subject: `Guest chat callback request (${locale})`,
        message: guestLead.message.trim(),
        website: guestLead.website.trim() || undefined,
      }).unwrap();

      const nextCooldown = Date.now() + GUEST_LEAD_COOLDOWN_MS;
      setGuestLeadCooldownUntil(nextCooldown);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(guestLeadCooldownKey(), String(nextCooldown));
      }
      setGuestLead({
        name: "",
        email: "",
        phone: "",
        message: "",
        website: "",
      });
      setGuestLeadSuccess(
        t("ui_chat_guest_success", "Danke. Ihre Nachricht wurde gesendet. Wir melden uns so bald wie moglich."),
      );
    } catch {
      setGuestLeadError(
        t("ui_chat_guest_error", "Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder nutzen Sie die Kontaktseite."),
      );
    }
  };

  const btnSize = isMobile ? 56 : 62;

  if (!widgetEnabled) return null;
  if (!mounted) return null; // SSR'da render etme — hidration mismatch'i önle

  return (
    <>
      {/* ─── FAB Button ──────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Support chat"
        style={{
          position: "fixed",
          left: isMobile ? 12 : 22,
          bottom: isMobile ? 12 : 22,
          width: btnSize,
          height: btnSize,
          borderRadius: isAdmin ? 14 : "50%",
          border: `2px solid ${C.rose200}`,
          zIndex: 9999,
          background: open ? headerGradient : C.white,
          color: open ? C.primaryFg : C.rose900,
          boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 20px rgba(201,169,110,0.1)`,
          display: "grid",
          placeItems: "center",
          padding: 0,
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        {open ? (
          <X size={22} />
        ) : (

          <img
            src="/support_ai.png"
            alt="AI Support"
            style={{
              width: btnSize - 16,
              height: btnSize - 16,
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
      </button>

      {/* ─── Chat Panel ──────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            left: isMobile ? 8 : 22,
            right: isMobile ? 8 : "auto",
            bottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 76px)" : 94,
            width: isMobile ? "auto" : isAdmin ? "min(460px, calc(100vw - 24px))" : "min(380px, calc(100vw - 24px))",
            height: isMobile ? "min(560px, calc(100dvh - 140px))" : isAdmin ? 620 : 520,
            borderRadius: isMobile ? 14 : 16,
            background: C.white,
            zIndex: 9999,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${C.sand300}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ─── Header ──────────────────────────────── */}
          <div style={{ background: headerGradient, color: C.primaryFg, padding: isAdmin ? "12px 14px" : "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isAdmin ? (
                  <Headset size={18} />
                ) : (
                  <Image
                    src="/support_ai.png"
                    alt="AI"
                    width={24}
                    height={24}
                    style={{ borderRadius: "50%", background: "rgba(255,255,255,0.2)", padding: 2 }}
                    unoptimized
                  />
                )}
                <strong style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: 15 }}>
                  {isAdmin ? t("ui_chat_admin_inbox", "Live-Support Posteingang") : t("ui_chat_title", "Support Bot")}
                </strong>
              </div>
              {isAdmin ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    borderRadius: 999,
                    padding: "4px 8px 4px 4px",
                    maxWidth: 190,
                  }}
                >
                  {myAvatar ? (
                    <Image
                      src={myAvatar}
                      alt={displayName}
                      width={24}
                      height={24}
                      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.24)",
                        color: C.primaryFg,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(displayName) || "AD"}
                    </div>
                  )}
                  <span
                    style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    title={displayName}
                  >
                    {displayName}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 12, opacity: 0.92 }}>{statusText}</span>
              )}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {isAdmin
                ? `${statusText}${unreadCount ? ` \u2022 ${unreadCount} ${t("ui_chat_unread_label", "neue Nachrichten")}` : ""}`
                : t("ui_chat_subtitle", "KI-Support")}
            </div>
          </div>

          {/* ─── Not Authenticated ───────────────────── */}
          {!isAuthenticated ? (
            <div style={{ padding: 20 }}>
              <p style={{ marginBottom: 14, color: C.sand800, fontSize: 14, textAlign: "center" }}>
                {t("ui_chat_guest_intro", "Ohne Login konnen Sie eine Nachricht hinterlassen. Fur den direkten Chat melden Sie sich bitte an.")}
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={guestLead.name}
                  onChange={(e) => setGuestLead((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("ui_chat_guest_name", "Ihr Name")}
                  style={{ border: `1px solid ${C.sand300}`, borderRadius: 10, padding: "10px 12px", fontSize: 13 }}
                />
                <input
                  value={guestLead.email}
                  onChange={(e) => setGuestLead((p) => ({ ...p, email: e.target.value }))}
                  placeholder={t("ui_chat_guest_email", "Ihre E-Mail")}
                  style={{ border: `1px solid ${C.sand300}`, borderRadius: 10, padding: "10px 12px", fontSize: 13 }}
                />
                <input
                  value={guestLead.phone}
                  onChange={(e) => setGuestLead((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={t("ui_chat_guest_phone", "Telefonnummer")}
                  style={{ border: `1px solid ${C.sand300}`, borderRadius: 10, padding: "10px 12px", fontSize: 13 }}
                />
                <textarea
                  value={guestLead.message}
                  onChange={(e) => setGuestLead((p) => ({ ...p, message: e.target.value }))}
                  placeholder={t("ui_chat_guest_message", "Worum geht es?")}
                  rows={4}
                  style={{
                    border: `1px solid ${C.sand300}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 104,
                  }}
                />
                <input
                  value={guestLead.website}
                  onChange={(e) => setGuestLead((p) => ({ ...p, website: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                {guestLeadSuccess ? (
                  <div style={{ fontSize: 12, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px" }}>
                    {guestLeadSuccess}
                  </div>
                ) : null}
                {guestLeadError ? (
                  <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px" }}>
                    {guestLeadError}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleGuestLeadSubmit}
                  disabled={guestLeadDisabled}
                  style={{
                    background: C.rose900,
                    color: C.primaryFg,
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    border: "none",
                    opacity: guestLeadDisabled ? 0.55 : 1,
                    cursor: guestLeadDisabled ? "default" : "pointer",
                  }}
                >
                  {createContactState.isLoading
                    ? t("ui_chat_guest_sending", "Wird gesendet...")
                    : guestLeadCooldownUntil > Date.now()
                      ? t("ui_chat_guest_wait", "Bitte spater erneut versuchen")
                      : t("ui_chat_guest_submit", "Nachricht senden")}
                </button>
              </div>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
                    color: C.rose900,
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                    border: `1px solid ${C.rose200}`,
                    background: C.rose50,
                  }}
                >
                  {t("ui_chat_login_button", "Anmelden")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ─── Admin Queue Filter ─────────────── */}
              {isAdmin && (
                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.sand200}`, background: C.sand100 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {(["pending", "mine", "all"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setQueueFilter(f)}
                        style={{
                          border: `1px solid ${C.sand300}`,
                          background: queueFilter === f ? C.rose900 : C.white,
                          color: queueFilter === f ? C.primaryFg : C.sand800,
                          borderRadius: 999,
                          fontSize: 11,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontWeight: queueFilter === f ? 600 : 400,
                        }}
                      >
                        {f === "pending"
                          ? t("ui_chat_queue_pending", "Nicht zugewiesen")
                          : f === "mine"
                            ? t("ui_chat_queue_mine", "Mir zugewiesen")
                            : t("ui_chat_queue_all", "Alle")}
                      </button>
                    ))}
                  </div>
                  <select
                    value={threadId}
                    onChange={(e) => {
                      setThreadId(e.target.value);
                      setHandoffMode("admin");
                    }}
                    style={{
                      width: "100%",
                      border: `1px solid ${C.sand300}`,
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      color: C.sand900,
                      background: C.white,
                    }}
                  >
                    {filteredAdminThreads.length === 0 && (
                      <option value="">{t("ui_chat_no_admin_threads", "Noch keine Live-Support-Anfragen.")}</option>
                    )}
                    {filteredAdminThreads.map((th: any) => {
                      const updated = new Date(th?.updated_at ?? 0).getTime();
                      const seen = Number(seenByThreadRef.current[th.id] ?? 0);
                      const hasUnread = updated > seen;
                      return (
                        <option key={th.id} value={th.id}>
                          {hasUnread ? "\u25CF " : ""}
                          {t("ui_chat_thread_label", "Anfrage")}: {String(th.context_id || "").slice(0, 8)} |{" "}
                          {new Date(th.updated_at).toLocaleString()}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* ─── Message List ───────────────────── */}
              <div
                ref={listRef}
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: 14,
                  background: `linear-gradient(180deg, ${C.sand50} 0%, ${C.sand100} 100%)`,
                }}
              >
                {!threadId ? (
                  <div style={{ fontSize: 13, color: C.sand600 }}>
                    {isAdmin
                      ? t("ui_chat_no_admin_threads", "Noch keine Live-Support-Anfragen.")
                      : t("ui_chat_loading", "Wird vorbereitet...")}
                  </div>
                ) : !isAdmin && createThread.isPending ? (
                  <div style={{ fontSize: 13, color: C.sand600 }}>
                    {t("ui_chat_loading", "Wird vorbereitet...")}
                  </div>
                ) : items.length === 0 ? (
                  <div
                    style={{
                      background: C.rose50,
                      color: C.sand900,
                      padding: "10px 14px",
                      borderRadius: 12,
                      width: "85%",
                      fontSize: 13,
                      border: `1px solid ${C.rose200}`,
                    }}
                  >
                    {welcomeText}
                  </div>
                ) : (
                  items.map((m) => {
                    const isMine = m.sender_user_id === user?.id;
                    const isAi = m.sender_user_id === AI_ASSISTANT_USER_ID;
                    const bubbleBg = isMine ? C.rose900 : isAi ? C.rose50 : C.sand200;
                    const bubbleFg = isMine ? C.primaryFg : C.sand900;
                    const bubbleBorder = isMine ? "none" : `1px solid ${isAi ? C.rose200 : C.sand300}`;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          alignItems: "flex-end",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        {!isMine && (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: isAi ? C.rose100 : C.sand200,
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                            }}
                            title={isAi ? "AI" : "User"}
                          >
                            {isAi ? (
                              <Image src="/support_ai.png" alt="AI" width={22} height={22} style={{ objectFit: "contain" }} unoptimized />
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.sand600 }}>U</span>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            maxWidth: "84%",
                            padding: "10px 12px",
                            borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            fontSize: 13,
                            lineHeight: 1.5,
                            background: bubbleBg,
                            color: bubbleFg,
                            border: bubbleBorder,
                          }}
                        >
                          {renderMessageText(m.text, isMine)}
                        </div>
                        {isMine && myAvatar && (
                          <Image
                            src={myAvatar}
                            alt={displayName}
                            width={28}
                            height={28}
                            style={{
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: `1px solid ${C.sand300}`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {isMine && !myAvatar && (
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: C.rose800,
                              color: C.primaryFg,
                              display: "grid",
                              placeItems: "center",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(displayName) || "ME"}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ─── Input Area ─────────────────────── */}
              <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.sand200}`, background: C.white }}>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      requestAdmin.mutate(undefined, {
                        onSuccess: (res) => {
                          if (res.thread?.handoff_mode) {
                            setHandoffMode(res.thread.handoff_mode);
                          } else {
                            setHandoffMode("admin");
                          }
                        },
                      })
                    }
                    disabled={!threadId || requestAdmin.isPending || handoffMode === "admin"}
                    style={{
                      width: "100%",
                      border: `1px solid ${C.rose600}`,
                      color: C.rose800,
                      background: C.white,
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      marginBottom: 10,
                      cursor: "pointer",
                      opacity: !threadId || handoffMode === "admin" ? 0.55 : 1,
                    }}
                  >
                    <Headset size={14} />
                    {requestAdmin.isPending
                      ? t("ui_chat_connecting", "Verbinde...")
                      : t("ui_chat_connect_admin", "Mit Live-Support verbinden")}
                  </button>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t("ui_chat_placeholder", "Nachricht eingeben...")}
                    style={{
                      flex: 1,
                      border: `1px solid ${C.sand300}`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      minHeight: 40,
                      color: C.sand900,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    style={{
                      border: "none",
                      borderRadius: 10,
                      padding: "0 14px",
                      minWidth: 46,
                      background: C.rose900,
                      color: C.primaryFg,
                      opacity: canSend ? 1 : 0.5,
                      cursor: canSend ? "pointer" : "default",
                    }}
                    aria-label={t("ui_chat_send", "Senden")}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
