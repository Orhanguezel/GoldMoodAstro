import type { ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/40 px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/15 text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-black text-slate-100">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm font-medium text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
