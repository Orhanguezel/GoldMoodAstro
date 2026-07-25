import {
  Facebook,
  Instagram,
  Linkedin,
  Send,
  Twitter,
  Youtube,
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
    description: "OAuth1 hesabı, yayın ve X araçları (gelen kutusu, research, performans).",
    accent: "text-slate-900",
    icon: (size = 20) => <Twitter size={size} />,
    connectKind: "oauth1-x",
    canPublish: true,
    tools: [
      { label: "X Gelen Kutusu", href: "/x-inbox" },
      { label: "X Research", href: "/x-research" },
      { label: "X Performans", href: "/x-own-tweets" },
    ],
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
    description: "Bot token + chat ID bağlantısı ve bildirim yayını.",
    accent: "text-sky-500",
    icon: (size = 20) => <Send size={size} />,
    connectKind: "manual",
    canPublish: true,
  },
];

export function getSocialPlatform(key: string | undefined | null): SocialPlatformConfig | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}
