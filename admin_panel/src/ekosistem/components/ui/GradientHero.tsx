import type { ReactNode } from "react";

// goldmoodastro admin standart sayfa basligi (/admin/consultants dili):
// gold eyebrow (h-px cizgi) + serif h1 + italic subtitle. Gradient/mesh/animasyon YOK.
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface GradientHeroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function GradientHero({
  title,
  eyebrow,
  description,
  actions,
  aside,
  className,
}: GradientHeroProps) {
  return (
    <div
      className={cx(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow && (
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="font-serif text-4xl text-gm-text">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm font-serif italic text-gm-muted opacity-70">
            {description}
          </p>
        )}
      </div>
      {(actions || aside) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
          {aside}
        </div>
      )}
    </div>
  );
}
