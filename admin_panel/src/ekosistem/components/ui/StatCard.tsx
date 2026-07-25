import type { ReactNode } from "react";
import { TrendArrow, type TrendArrowProps } from "./TrendArrow";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: TrendArrowProps;
  caption?: string;
  gradient?: "brand" | "cyan" | "pink" | "slate";
  className?: string;
}

const gradients = {
  brand: "from-brand-900 via-surface-700 to-pink-950",
  cyan: "from-cyan-950 via-surface-700 to-brand-900",
  pink: "from-pink-950 via-surface-700 to-rose-950",
  slate: "from-surface-800 via-surface-700 to-brand-900",
};

const iconGradients = {
  brand: "from-brand-600 to-accent-pink",
  cyan: "from-cyan-500 to-brand-600",
  pink: "from-accent-pink to-rose-500",
  slate: "from-slate-900 to-brand-900",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  caption,
  gradient = "brand",
  className,
}: StatCardProps) {
  return (
    <article
      className={cx(
        "relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        gradients[gradient],
        className,
      )}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-normal text-slate-950 tabular-nums">
            {value}
          </p>
          {caption && <p className="mt-2 text-sm font-medium text-slate-500">{caption}</p>}
        </div>
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-brand-glow",
            iconGradients[gradient],
          )}
        >
          {icon}
        </div>
      </div>
      {trend && (
        <div className="relative mt-5">
          <TrendArrow {...trend} />
        </div>
      )}
    </article>
  );
}
