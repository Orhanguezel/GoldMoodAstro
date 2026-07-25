import { FileText, Image as ImageIcon, Play, Video } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface MediaThumbProps {
  src?: string | null;
  alt?: string;
  type?: "image" | "video" | "text" | "carousel" | "auto";
  label?: string;
  className?: string;
}

function inferType(src?: string | null, type: MediaThumbProps["type"] = "auto") {
  if (type && type !== "auto") return type;
  const value = (src || "").toLowerCase();
  if ([".mp4", ".mov", ".m4v", ".webm"].some((ext) => value.includes(ext))) return "video";
  if (src) return "image";
  return "text";
}

export function MediaThumb({
  src,
  alt = "",
  type = "auto",
  label,
  className,
}: MediaThumbProps) {
  const mediaType = inferType(src, type);
  const isImage = mediaType === "image" || mediaType === "carousel";

  return (
    <div
      className={cx(
        "relative aspect-[4/3] overflow-hidden rounded-2xl border border-surface-600 bg-surface-700 shadow-card",
        className,
      )}
    >
      {src && isImage ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          {mediaType === "video" ? (
            <Video aria-hidden="true" size={28} />
          ) : mediaType === "image" ? (
            <ImageIcon aria-hidden="true" size={28} />
          ) : (
            <FileText aria-hidden="true" size={28} />
          )}
        </div>
      )}
      {mediaType === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-card">
            <Play aria-hidden="true" size={18} fill="currentColor" />
          </span>
        </div>
      )}
      {label && (
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-surface-900/90 px-2.5 py-1 text-[11px] font-bold text-slate-200 shadow-card">
          {label}
        </span>
      )}
    </div>
  );
}
