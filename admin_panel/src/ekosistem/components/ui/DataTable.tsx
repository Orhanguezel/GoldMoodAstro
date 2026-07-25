import type { ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DataTable({
  columns,
  children,
  className,
}: {
  columns: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-card", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {columns.map((column, index) => (
              <th
                key={column}
                className={cx(
                  "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400",
                  index === columns.length - 1 && "text-right",
                )}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

export function DataTableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cx("transition-colors hover:bg-slate-50/30", className)}>{children}</tr>;
}

export function DataTableCell({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td className={cx("px-6 py-4 align-middle text-sm text-slate-300", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}
