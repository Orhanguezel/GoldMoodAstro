import type { ReactNode } from "react";
import { TrendArrow, type TrendArrowProps } from "./TrendArrow";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: TrendArrowProps;
  description?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  trend,
  description,
  className,
}: MetricCardProps) {
  return (
    <article
      className={cx(
        "rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950 tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </div>
        )}
      </div>
      {(trend || description) && (
        <div className="mt-4 flex items-center justify-between gap-3">
          {description && <p className="truncate text-sm font-medium text-slate-500">{description}</p>}
          {trend && <TrendArrow {...trend} className="ml-auto" />}
        </div>
      )}
    </article>
  );
}
