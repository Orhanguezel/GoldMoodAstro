import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

type TrendDirection = "up" | "down" | "flat";

const toneClasses: Record<TrendDirection, string> = {
  up: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  down: "bg-rose-50 text-rose-700 ring-rose-100",
  flat: "bg-slate-50 text-slate-600 ring-slate-100",
};

const icons = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: ArrowRight,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface TrendArrowProps {
  value?: number | string | null;
  direction?: TrendDirection;
  label?: string;
  className?: string;
}

export function TrendArrow({
  value,
  direction = "flat",
  label,
  className,
}: TrendArrowProps) {
  const Icon = icons[direction];
  const displayValue =
    typeof value === "number"
      ? `${Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`
      : value;

  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold tabular-nums ring-1",
        toneClasses[direction],
        className,
      )}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2.4} />
      {displayValue && <span>{displayValue}</span>}
      {label && <span className="font-semibold opacity-80">{label}</span>}
    </span>
  );
}
