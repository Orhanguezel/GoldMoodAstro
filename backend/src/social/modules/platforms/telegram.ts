import { getTenantSecret, getTenantValue } from "../../core/tenant-settings";

const TG_API_URL = "https://api.telegram.org";

type TelegramOptions = {
  tenantKey?: string;
};

async function resolveTelegramConfig(tenantKey?: string, chatId?: string) {
  const key = tenantKey?.trim() || "goldmoodastro";
  const token = await getTenantSecret(key, "telegram", "bot_token");
  const targetChatId = chatId || (await getTenantValue<string>(key, "telegram", "default_chat_id"));
  return {
    token,
    chatId: typeof targetChatId === "string" ? targetChatId.trim() : "",
  };
}

async function isEventEnabled(tenantKey: string | undefined, status: "success" | "failed") {
  const key = tenantKey?.trim() || "goldmoodastro";
  const settingKey = status === "success" ? "event_publish_success_enabled" : "event_publish_failed_enabled";
  const value = await getTenantValue<boolean | string | null>(key, "telegram", settingKey);
  if (value === null || value === undefined) return true;
  if (typeof value === "boolean") return value;
  return !["false", "0", "off", "no"].includes(value.trim().toLowerCase());
}

// ─── Mesaj Gonder ───────────────────────────────────────────
export async function sendMessage(
  text: string,
  chatId?: string,
  options: TelegramOptions = {}
): Promise<boolean> {
  const config = await resolveTelegramConfig(options.tenantKey, chatId);

  if (!config.token || !config.chatId) {
    console.warn("Telegram yapilandirmasi eksik, bildirim atlanıyor");
    return false;
  }

  try {
    const res = await fetch(`${TG_API_URL}/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Telegram hatasi:", data);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Telegram gonderim hatasi:", err);
    return false;
  }
}

export async function sendPost(
  text: string,
  mediaUrls: string[] = [],
  chatId?: string,
  options: TelegramOptions = {},
): Promise<boolean> {
  const config = await resolveTelegramConfig(options.tenantKey, chatId);
  if (!config.token || !config.chatId) return false;

  const publicBase = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || "https://goldmoodastro.com").replace(/\/$/, "");
  const media = mediaUrls
    .filter(Boolean)
    .map((url) => /^https?:\/\//i.test(url) ? url : `${publicBase}/${url.replace(/^\//, "")}`)
    .slice(0, 10);
  if (media.length === 0) return sendMessage(text, chatId, options);

  try {
    const isVideo = (url: string) => /\.(mp4|mov|m4v)(?:\?|$)/i.test(url);
    const method = media.length === 1 ? (isVideo(media[0]) ? "sendVideo" : "sendPhoto") : "sendMediaGroup";
    const body = media.length === 1
      ? {
          chat_id: config.chatId,
          [isVideo(media[0]) ? "video" : "photo"]: media[0],
          caption: text.slice(0, 1024),
          parse_mode: "HTML",
        }
      : {
          chat_id: config.chatId,
          media: media.map((url, index) => ({
            type: isVideo(url) ? "video" : "photo",
            media: url,
            ...(index === 0 ? { caption: text.slice(0, 1024), parse_mode: "HTML" } : {}),
          })),
        };

    const res = await fetch(`${TG_API_URL}/bot${config.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("Telegram medya hatasi:", await res.json());
    return res.ok;
  } catch (err) {
    console.error("Telegram medya gonderim hatasi:", err);
    return false;
  }
}

// ─── Post Yayinlandi Bildirimi ──────────────────────────────
export async function notifyPostPublished(
  platform: string,
  title: string,
  status: "success" | "failed",
  error?: string,
  options: TelegramOptions = {}
) {
  if (!(await isEventEnabled(options.tenantKey, status))) {
    return false;
  }

  const emoji = status === "success" ? "✅" : "❌";
  const platformLabel =
    platform === "facebook" ? "Facebook" :
    platform === "instagram" ? "Instagram" :
    platform === "linkedin" ? "LinkedIn" :
    platform === "x" ? "X" :
    platform === "telegram" ? "Telegram" :
    platform === "youtube" ? "YouTube" :
    "FB+IG";

  let text = `${emoji} <b>Post ${status === "success" ? "yayinlandi" : "basarisiz"}</b>\n\n`;
  text += `📱 Platform: ${platformLabel}\n`;
  text += `📝 ${title || "(baslıksiz)"}`;

  if (error) {
    text += `\n\n⚠️ Hata: ${error}`;
  }

  return sendMessage(text, undefined, options);
}

// ─── Gunluk Ozet Bildirimi ──────────────────────────────────
export async function notifyDailySummary(stats: {
  posted: number;
  failed: number;
  scheduled: number;
  totalLikes?: number;
  totalComments?: number;
}, options: TelegramOptions = {}) {
  let text = `📊 <b>Gunluk Ozet - Sosyal Medya Paneli</b>\n\n`;
  text += `✅ Yayinlanan: ${stats.posted}\n`;
  text += `❌ Basarisiz: ${stats.failed}\n`;
  text += `⏳ Kuyrukta: ${stats.scheduled}\n`;

  if (stats.totalLikes !== undefined) {
    text += `\n❤️ Toplam begeni: ${stats.totalLikes}`;
  }
  if (stats.totalComments !== undefined) {
    text += `\n💬 Toplam yorum: ${stats.totalComments}`;
  }

  return sendMessage(text, undefined, options);
}

// ─── Token Uyarisi ──────────────────────────────────────────
export async function notifyTokenExpiring(platform: string, expiresIn: string, options: TelegramOptions = {}) {
  const text = `⚠️ <b>Token Uyarisi</b>\n\n${platform} token'i ${expiresIn} icinde dolacak.\n\nLutfen yenileyin.`;
  return sendMessage(text, undefined, options);
}
