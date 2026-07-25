import {
  Facebook,
  Instagram,
  Linkedin,
  type LucideIcon,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";

export type Platform =
  | "facebook"
  | "instagram"
  | "x"
  | "linkedin"
  | "telegram"
  | "youtube"
  | "both"
  | "all";

interface PlatformConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

const configs: Record<Platform, PlatformConfig> = {
  facebook: {
    label: "Facebook",
    icon: Facebook,
    className: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    className: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
  },
  x: {
    label: "X",
    icon: Twitter,
    className: "bg-surface-600 text-white ring-surface-500",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    className: "bg-sky-500/20 text-sky-400 ring-sky-500/30",
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    className: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
  },
  youtube: {
    label: "YouTube",
    icon: Youtube,
    className: "bg-red-500/20 text-red-400 ring-red-500/30",
  },
  both: {
    label: "FB + IG",
    icon: Instagram,
    className: "bg-brand-500/20 text-brand-400 ring-brand-500/30",
  },
  all: {
    label: "Tüm Platformlar",
    icon: Send,
    className: "bg-surface-700 text-white ring-surface-600",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface PlatformBadgeProps {
  platform: Platform | string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PlatformBadge({
  platform,
  showLabel = true,
  size = "md",
  className,
}: PlatformBadgeProps) {
  const config = configs[(platform as Platform)] ?? {
    label: platform,
    icon: Send,
    className: "bg-surface-800 text-slate-300 ring-surface-700",
  };
  const Icon = config.icon;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full font-bold ring-1",
        size === "sm" ? "h-7 px-2 text-[11px]" : "h-8 px-3 text-xs",
        config.className,
        className,
      )}
    >
      <Icon aria-hidden="true" size={size === "sm" ? 13 : 15} strokeWidth={2.2} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
