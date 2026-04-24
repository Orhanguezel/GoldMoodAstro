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

/* ─── Theme tokens (dark+gold premium) ────────── */
const C = {
  rose900: "#C9A96E",
  rose800: "#B8944F",
  rose700: "#DFC9A0",
  rose600: "#A88B4A",
  rose200: "rgba(201,169,110,0.2)",
  rose100: "#F5F0E8",
  rose50: "rgba(201,169,110,0.05)",
  sand900: "#F5F0E8",
  sand800: "#A09888",
  sand600: "#6B6358",
  sand300: "rgba(201,169,110,0.12)",
  sand200: "rgba(201,169,110,0.08)",
  sand100: "#1A1815",
  sand50: "#141210",
  white: "#0C0B09",
  charcoal: "#0C0B09",
} as const;

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
  const widgetSetting = useGetSiteSettingByKeyQuery({ key: "chat_widget_enabled" });
  const widgetEnabled = widgetSetting.data?.value !== false && widgetSetting.data?.value !== "false";

  const locale = useLocaleShort();
  const welcomeSetting = useGetSiteSettingByKeyQuery({ key: "chat_ai_welcome_message", locale });
  const { ui } = useUiSection("ui_chat", locale);
  const t = useCallback(
    (key: string, fallback: string) => {
      const v = ui(key, fallback);
      return v && v !== key ? v : fallback;
    },
    [ui],
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
          color: open ? C.white : C.rose900,
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
          <div style={{ background: headerGradient, color: C.white, padding: isAdmin ? "12px 14px" : "14px 16px" }}>
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
                        color: C.white,
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
                    color: C.white,
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
                          color: queueFilter === f ? C.white : C.sand800,
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
                    const bubbleFg = isMine ? C.white : C.sand900;
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
                              color: C.white,
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
                      color: C.white,
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
