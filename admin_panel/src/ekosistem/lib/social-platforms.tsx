import {
  Facebook,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  Youtube,
  Music2,
  Bookmark,
} from "lucide-react";
import type { ReactNode } from "react";

export type SocialConnectKind = "manual" | "oauth-linkedin" | "oauth1-x" | "external";

export interface SocialPlatformConfig {
  /** route slug + platform_accounts.platform + posts.platform degeri */
  key: string;
  /** Sidebar + sayfa basligi */
  label: string;
  /** Sayfa H1 basligi */
  title: string;
  /** Kisa aciklama */
  description: string;
  /** Marka rengi (tailwind text-*) */
  accent: string;
  /** Ikon (boyut iletilebilir) */
  icon: (size?: number) => ReactNode;
  /** Baglanti turu */
  connectKind: SocialConnectKind;
  /** Bu platforma yayin yapilabilir mi (compose kutusu gosterilsin mi) */
  canPublish: boolean;
  /** Yayin icin gorsel zorunlu mu (Instagram) */
  requiresImage?: boolean;
  /** external => dedicated route disinda baska sayfaya gider (YouTube) */
  externalHref?: string;
  /** X gibi ek arac sayfalari */
  tools?: { label: string; href: string }[];
}

export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    key: "facebook",
    label: "Facebook",
    title: "Facebook Yönetimi",
    description: "Sayfa bağlantısı, token durumu, yayın ve son gönderiler.",
    accent: "text-blue-600",
    icon: (size = 20) => <Facebook size={size} />,
    connectKind: "manual",
    canPublish: true,
  },
  {
    key: "instagram",
    label: "Instagram",
    title: "Instagram Yönetimi",
    description: "İşletme hesabı bağlantısı, yayın (görsel zorunlu) ve gönderiler.",
    accent: "text-pink-600",
    icon: (size = 20) => <Instagram size={size} />,
    connectKind: "manual",
    canPublish: true,
    requiresImage: true,
  },
  {
    key: "x",
    label: "X (Twitter)",
    title: "X (Twitter) Yönetimi",
    description: "Hesap bağlantısı, yayın durumu ve gönderiler.",
    accent: "text-slate-900",
    icon: (size = 20) => <Twitter size={size} />,
    connectKind: "oauth1-x",
    canPublish: true,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    title: "LinkedIn Yönetimi",
    description: "OAuth ile bağlan veya manuel token gir, yayın yap.",
    accent: "text-blue-700",
    icon: (size = 20) => <Linkedin size={size} />,
    connectKind: "oauth-linkedin",
    canPublish: true,
  },
  {
    key: "youtube",
    label: "YouTube",
    title: "YouTube Yönetimi",
    description: "Kanal bağlantısı, video yükleme ve analizler.",
    accent: "text-red-600",
    icon: (size = 20) => <Youtube size={size} />,
    connectKind: "external",
    canPublish: false,
    externalHref: "/youtube",
  },
  {
    key: "telegram",
    label: "Telegram",
    title: "Telegram Yönetimi",
    description: "Bot token + chat ID bağlantısı ve sosyal paylaşım.",
    accent: "text-sky-500",
    icon: (size = 20) => <Send size={size} />,
    connectKind: "manual",
    canPublish: true,
    // NOT: /admin/social/telegram diğer platformlar gibi SocialPlatformPage'i gösterir
    // (sosyal medya yönetimi). Bildirim/auto-reply ayrı sayfa: /admin/telegram (sidebar'da değil).
  },
  {
    key: "tiktok",
    label: "TikTok",
    title: "TikTok Yönetimi",
    description: "Keşif odaklı kısa video. Hesap bağlama + otomatik yayın yakında (API entegrasyonu).",
    accent: "text-teal-600",
    icon: (size = 20) => <Music2 size={size} />,
    connectKind: "manual",
    canPublish: false,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    title: "Pinterest Yönetimi",
    description: "Arama odaklı kalıcı trafik. Hesap bağlama + pin yayını yakında (API entegrasyonu).",
    accent: "text-rose-600",
    icon: (size = 20) => <Bookmark size={size} />,
    connectKind: "manual",
    canPublish: false,
  },
];

export function getSocialPlatform(key: string | undefined | null): SocialPlatformConfig | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}
