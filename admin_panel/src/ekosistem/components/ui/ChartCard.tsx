import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
  responsive?: boolean;
  className?: string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  height = 260,
  responsive = true,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition-all duration-300 hover:shadow-card-hover",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black tracking-normal text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div style={{ height }} className="min-w-0">
        {responsive ? (
          <ResponsiveContainer width="100%" height="100%">
            {children as any}
          </ResponsiveContainer>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
